import { Buffer } from 'buffer';
import { TableDefinition, ColumnDefinition, OldLedgerDataMap, ImportSummary } from '../types/oldLedger';
import { standardOldLedgerSchemas } from '../data/mockOldLedgerData';

let cachedMDBReader: any = null;

async function getMDBReader() {
  if (!cachedMDBReader) {
    if (typeof window !== 'undefined') {
      (window as any).global = window;
      (window as any).Buffer = (window as any).Buffer || Buffer;
      (window as any).process = (window as any).process || { env: {} };
    }
    const module = await import('mdb-reader');
    cachedMDBReader = module.default || module;
  }
  return cachedMDBReader;
}

export interface ParseMdbResult {
  success: boolean;
  error?: string;
  tables: TableDefinition[];
  data: OldLedgerDataMap;
  summary: ImportSummary;
}

/**
 * Checks if a table should be skipped according to Access specifications
 */
export function isTableIgnored(tableName: string): boolean {
  const lower = tableName.toLowerCase();
  if (lower.startsWith('msys') || lower.startsWith('~')) {
    return true; // Access system tables
  }
  if (lower === 'name autocorrect save failures') {
    return true; // Skip entirely
  }
  if (lower.startsWith('f_') && lower.endsWith('_data')) {
    return true; // Access internals
  }
  return false;
}

/**
 * Maps Access data type to target SQL type:
 * Text(n) -> VARCHAR(n)
 * Long Integer / Integer -> INT
 * Double / Float -> DOUBLE (do NOT convert to DECIMAL)
 * Date/Time -> DATETIME
 * Memo -> TEXT
 * OLE/Attachment -> skip
 */
export function mapAccessColumnType(col: { name: string; type: string; size?: number }, tableName?: string): { mappedType: string; shouldSkip: boolean } {
  const typeLower = (col.type || '').toLowerCase();

  // OLE/Attachment -> skip
  if (typeLower === 'ole' || typeLower === 'binary' || typeLower === 'attachment') {
    return { mappedType: 'BLOB', shouldSkip: true };
  }

  // Known table-specific overrides specified in prompt
  if (tableName === 'PURHIS' && col.name === 'CUS_CODE') {
    return { mappedType: 'VARCHAR(6)', shouldSkip: false };
  }
  if (tableName === 'PURCHASE' && col.name === 'CUS_CODE') {
    return { mappedType: 'VARCHAR(8)', shouldSkip: false };
  }

  if (typeLower === 'text') {
    const size = col.size && col.size > 0 ? col.size : 255;
    return { mappedType: `VARCHAR(${size})`, shouldSkip: false };
  }

  if (typeLower === 'long' || typeLower === 'integer' || typeLower === 'byte' || typeLower === 'int') {
    return { mappedType: 'INT', shouldSkip: false };
  }

  if (typeLower === 'double' || typeLower === 'float' || typeLower === 'currency' || typeLower === 'numeric') {
    return { mappedType: 'DOUBLE', shouldSkip: false };
  }

  if (typeLower === 'datetime' || typeLower === 'date') {
    return { mappedType: 'DATETIME', shouldSkip: false };
  }

  if (typeLower === 'memo') {
    return { mappedType: 'TEXT', shouldSkip: false };
  }

  if (typeLower === 'boolean') {
    return { mappedType: 'BOOLEAN', shouldSkip: false };
  }

  return { mappedType: col.size ? `VARCHAR(${col.size})` : 'VARCHAR(255)', shouldSkip: false };
}

/**
 * Parses an Access .mdb or .accdb file buffer into strict table schemas and row records
 */
export async function parseMdbOrAccdbFile(file: File): Promise<ParseMdbResult> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const securityNotices: string[] = [];

  try {
    const MDBReaderClass = await getMDBReader();
    let reader: any;
    try {
      reader = new MDBReaderClass(buffer, { password: '' });
    } catch {
      reader = new MDBReaderClass(buffer);
    }

    let rawTableNames: string[] = [];
    try {
      rawTableNames = reader.getTableNames({ normalTables: true, systemTables: false });
    } catch {
      try {
        rawTableNames = reader.getTableNames();
      } catch (e: any) {
        throw new Error(e?.message || 'Failed to read table catalog from Access database.');
      }
    }

    // Filter out skipped tables
    const userTableNames: string[] = (rawTableNames as string[]).filter((name: string) => !isTableIgnored(name));

    if (userTableNames.length === 0) {
      throw new Error('No user tables found in the Access file. Please ensure the file contains valid non-system tables.');
    }

    const tables: TableDefinition[] = [];
    const data: OldLedgerDataMap = {};
    const tableDetails: { name: string; rows: number; cols: number }[] = [];
    let totalRows = 0;

    for (const tableName of userTableNames) {
      try {
        const table = reader.getTable(tableName);
        const rawColumns = table.getColumns();

        const activeCols: ColumnDefinition[] = [];
        const skippedColNames = new Set<string>();

        // Build columns with type mapping
        for (const col of rawColumns) {
          const { mappedType, shouldSkip } = mapAccessColumnType(col, tableName);
          if (shouldSkip) {
            skippedColNames.add(col.name);
            continue;
          }

          activeCols.push({
            name: col.name,
            type: mappedType,
            originalType: col.type,
            size: col.size,
            isNullable: true, // All columns are nullable
          });
        }

        // Fetch row data
        let rawRows: any[] = [];
        try {
          rawRows = table.getData();
        } catch (dataErr: any) {
          console.warn(`Could not read data rows for table ${tableName}:`, dataErr);
          rawRows = [];
        }
        const cleanedRows: Record<string, any>[] = [];

        // Check if table is INTERFAC for password sanitization
        const isInterfac = tableName.toUpperCase() === 'INTERFAC';
        if (isInterfac) {
          securityNotices.push(
            'Security Notice: In table `INTERFAC`, password columns `PASS1`, `PASS2`, and `PASS3` were created with NULL values to protect system credentials.'
          );
        }

        for (const row of rawRows) {
          const cleanRow: Record<string, any> = {};
          for (const col of activeCols) {
            const colName = col.name;

            // Security: In INTERFAC, do NOT import PASS1/PASS2/PASS3 values
            if (isInterfac && (colName === 'PASS1' || colName === 'PASS2' || colName === 'PASS3')) {
              cleanRow[colName] = null;
              continue;
            }

            let val = row[colName];

            // Normalize Date objects to string (YYYY-MM-DD HH:mm:ss)
            if (val instanceof Date) {
              val = val.toISOString().replace('T', ' ').substring(0, 19);
            } else if (typeof val === 'bigint') {
              val = Number(val);
            } else if (val && typeof val === 'object' && Buffer.isBuffer(val)) {
              val = val.toString('hex');
            }

            cleanRow[colName] = val ?? null;
          }
          cleanedRows.push(cleanRow);
        }

        // Infer non-unique lookup indexes from column names (e.g. containing NO, DATE, ACC, CODE)
        const lookupIndexes = activeCols
          .filter((c) => {
            const upper = c.name.toUpperCase();
            return (
              upper.includes('NO') ||
              upper.includes('DATE') ||
              upper.includes('ACC') ||
              upper.includes('CODE') ||
              upper.includes('AC')
            );
          })
          .map((c) => c.name);

        tables.push({
          name: tableName,
          family: inferTableFamily(tableName),
          columns: activeCols,
          rowCount: cleanedRows.length,
          lookupIndexes,
        });

        data[tableName] = cleanedRows;
        tableDetails.push({
          name: tableName,
          rows: cleanedRows.length,
          cols: activeCols.length,
        });
        totalRows += cleanedRows.length;
      } catch (tableErr: any) {
        console.warn(`Could not read table ${tableName}:`, tableErr);
      }
    }

    return {
      success: true,
      tables,
      data,
      summary: {
        fileName: file.name,
        fileSize: file.size,
        importedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        totalTables: tables.length,
        totalRows,
        tableDetails,
        securityNotices,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to parse Microsoft Access database file.',
      tables: [],
      data: {},
      summary: {
        fileName: file.name,
        fileSize: file.size,
        importedAt: new Date().toISOString(),
        totalTables: 0,
        totalRows: 0,
        tableDetails: [],
        securityNotices: [],
      },
    };
  }
}

/**
 * Assigns clean family grouping for tables in View Account Info screen
 */
export function inferTableFamily(tableName: string): string {
  const upper = tableName.toUpperCase();
  if (upper.includes('GLHIS') || upper === '12MYGLHIS') return 'General Ledger Family';
  if (upper.includes('CHART')) return 'Chart of Accounts';
  if (upper.includes('LED') || upper.includes('PL')) return 'Ledger Print Tables';
  if (upper.includes('ACCHIS') || upper === 'ACCOUNT') return 'Voucher Lines';
  if (upper.includes('VOUHIS') || upper === 'VOUCHER') return 'Voucher Headers';
  if (upper.includes('JV')) return 'Journal';
  if (upper.includes('PUR2') || upper === 'PURC') return 'Purchase Lines';
  if (upper.includes('PUR')) return 'Purchase Headers';
  if (upper === 'PO') return 'Purchase Order';
  if (upper.includes('BINCARD')) return 'Stock Card';
  if (upper.includes('INVT') || upper.includes('CONTROL')) return 'Stock Issues';
  if (upper === 'PRODUCT') return 'Product Master';
  if (upper === 'INTERFAC' || upper === 'VNO' || upper.includes('PROCESS')) return 'System Settings';
  return 'User Tables';
}
