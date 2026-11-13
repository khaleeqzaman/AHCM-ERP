import { CompanySettings } from '../types/storeSales';
import { getTodayFormatted } from './formatters';

export interface BuildCsvOptions {
  tableName: string;
  companySettings?: CompanySettings | null;
  headers: string[];
  rows: (string | number | null | undefined)[][];
  totalsRow?: (string | number | null | undefined)[];
  reportDate?: string;
}

/**
 * Retrieves the currently cached CompanySettings from local storage as a fallback.
 */
export function getCachedCompanySettings(): CompanySettings {
  try {
    const raw = localStorage.getItem('ahcm_erp_company_settings');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed as CompanySettings;
      }
    }
  } catch {}
  return {
    companyName: 'AL-HAMD COAL MINES & METALS (PVT) LTD.',
    address: 'Office #102, Mining Complex, Quetta / Head Office, Pakistan',
    contactNumber: '+92 81 2839102',
    email: 'info@alhamdmining.com',
    ntnNumber: '7382910-4',
    openingCoalStock: 0,
  };
}

/**
 * Builds standard CSV content with official Company Header, Concerned Table Name, and Date.
 * Structure:
 * Line 1: Company Name
 * Line 2: Company Address (if present)
 * Line 3: Contact Line (Phone, Email, NTN if present)
 * Line 4: Table: <Concerned Table Name>
 * Line 5: Date: <Date>
 * Line 6: [Blank separator]
 * Line 7: Table Column Headers
 * Line 8+: Data Rows
 * Optional: Totals Row
 */
export function buildUniversalCsvContent(options: BuildCsvOptions): string {
  const { tableName, headers, rows, totalsRow, reportDate } = options;
  const cs = options.companySettings || getCachedCompanySettings();

  const compName = (cs?.companyName || 'AL-HAMD COAL MINES & METALS (PVT) LTD.').trim();
  const address = (cs?.address || '').trim();
  const phone = cs?.contactNumber || (cs as any)?.phone || '';
  const email = cs?.email || '';
  const ntn = cs?.ntnNumber || '';
  const dateStr = reportDate || getTodayFormatted();

  const lines: string[] = [];
  
  // 1. Company Name
  lines.push(`"${compName.replace(/"/g, '""')}"`);

  // 2. Company Address
  if (address) {
    lines.push(`"${address.replace(/"/g, '""')}"`);
  }

  // 3. Contact Info
  const contactParts: string[] = [];
  if (phone) contactParts.push(`Phone: ${phone}`);
  if (email) contactParts.push(`Email: ${email}`);
  if (ntn) contactParts.push(`NTN: ${ntn}`);
  if (contactParts.length > 0) {
    lines.push(`"${contactParts.join(' | ')}"`);
  }

  // 4. Concerned Table Name & 5. Date
  lines.push(`"Table: ${tableName.replace(/"/g, '""')}"`);
  lines.push(`"Date: ${dateStr}"`);
  lines.push(''); // Blank separator line

  // 6. Table Column Headers
  lines.push(headers.map((h) => `"${String(h ?? '').replace(/"/g, '""')}"`).join(','));

  // 7. Table Data Rows
  rows.forEach((r) => {
    lines.push(r.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','));
  });

  // 8. Optional Totals Row
  if (totalsRow && totalsRow.length > 0) {
    lines.push(totalsRow.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','));
  }

  return 'data:text/csv;charset=utf-8,\uFEFF' + lines.join('\n');
}

/**
 * Triggers a download of a formatted CSV file with full company header, table name, and date.
 */
export function exportUniversalCsv(filename: string, options: BuildCsvOptions): void {
  const csvContent = buildUniversalCsvContent(options);
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  const cleanFilename = filename.toLowerCase().endsWith('.csv') ? filename : `${filename}.csv`;
  link.setAttribute('download', cleanFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
