export interface ColumnDefinition {
  name: string;
  type: string; // e.g., 'VARCHAR(10)', 'DOUBLE', 'DATETIME', 'INT', 'TEXT'
  originalType?: string;
  size?: number;
  isNullable: boolean;
}

export interface TableDefinition {
  name: string;
  family: string;
  columns: ColumnDefinition[];
  rowCount: number;
  lookupIndexes: string[];
}

export type OldLedgerDataMap = Record<string, Record<string, any>[]>;

export interface ImportSummary {
  fileName: string;
  fileSize: number;
  importedAt: string;
  totalTables: number;
  totalRows: number;
  tableDetails: { name: string; rows: number; cols: number }[];
  securityNotices: string[];
}
