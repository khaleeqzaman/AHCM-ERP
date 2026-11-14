import { ChartAccount, AccountType } from '../types/accounting';
import { exportUniversalCsv } from './exportCsv';
import { sortAccountsByCode } from './accountSort';

export interface RawJsonAccount {
  accountNo?: string;
  code?: string;
  accountName?: string;
  name?: string;
  accountType?: string;
  level?: number;
  transType?: 'G' | 'T' | string;
  parentAccountNo?: string;
  openingBalance?: number;
  openingBalanceType?: 'DR' | 'CR' | string;
  monthly?: {
    [month: string]: {
      credit: number;
      debit: number;
    };
  };
  classification?: string;
  groupName?: string;
  description?: string;
  isActive?: boolean;
}

export const EMPTY_MONTHLY_RECORD = {
  jan: { credit: 0, debit: 0 },
  feb: { credit: 0, debit: 0 },
  mar: { credit: 0, debit: 0 },
  apr: { credit: 0, debit: 0 },
  may: { credit: 0, debit: 0 },
  jun: { credit: 0, debit: 0 },
  jul: { credit: 0, debit: 0 },
  aug: { credit: 0, debit: 0 },
  sep: { credit: 0, debit: 0 },
  oct: { credit: 0, debit: 0 },
  nov: { credit: 0, debit: 0 },
  dec: { credit: 0, debit: 0 },
};

/**
 * Standard enterprise template strictly adhering to the user's JSON structure.
 */
export const STANDARD_COA_TEMPLATE: RawJsonAccount[] = [
  // 1. ASSETS
  {
    accountNo: '1',
    accountName: 'ASSETS',
    accountType: 'Asset',
    level: 1,
    transType: 'G',
    parentAccountNo: '',
    openingBalance: 0,
    openingBalanceType: 'DR',
    monthly: { ...EMPTY_MONTHLY_RECORD },
  },
  {
    accountNo: '11',
    accountName: 'CURRENT ASSETS',
    accountType: 'Asset',
    level: 2,
    transType: 'G',
    parentAccountNo: '1',
    openingBalance: 0,
    openingBalanceType: 'DR',
    monthly: { ...EMPTY_MONTHLY_RECORD },
  },
  {
    accountNo: '1101',
    accountName: 'CASH AND BANK BALANCES',
    accountType: 'Asset',
    level: 3,
    transType: 'G',
    parentAccountNo: '11',
    openingBalance: 0,
    openingBalanceType: 'DR',
    monthly: { ...EMPTY_MONTHLY_RECORD },
  },
  {
    accountNo: '110101',
    accountName: 'Main Cash in Hand (Quetta Vault)',
    accountType: 'Asset',
    level: 4,
    transType: 'T',
    parentAccountNo: '1101',
    openingBalance: 450000,
    openingBalanceType: 'DR',
    monthly: {
      ...EMPTY_MONTHLY_RECORD,
      jan: { credit: 50000, debit: 200000 },
    },
  },
  {
    accountNo: '110102',
    accountName: 'HBL - Mining Operations A/C 2241',
    accountType: 'Asset',
    level: 4,
    transType: 'T',
    parentAccountNo: '1101',
    openingBalance: 1250000,
    openingBalanceType: 'DR',
    monthly: { ...EMPTY_MONTHLY_RECORD },
  },
  {
    accountNo: '1102',
    accountName: 'TRADE RECEIVABLES & BUYERS',
    accountType: 'Asset',
    level: 3,
    transType: 'G',
    parentAccountNo: '11',
    openingBalance: 0,
    openingBalanceType: 'DR',
    monthly: { ...EMPTY_MONTHLY_RECORD },
  },
  {
    accountNo: '110201',
    accountName: 'Coal Buyer Accounts Receivable',
    accountType: 'Asset',
    level: 4,
    transType: 'T',
    parentAccountNo: '1102',
    openingBalance: 880000,
    openingBalanceType: 'DR',
    monthly: { ...EMPTY_MONTHLY_RECORD },
  },
  {
    accountNo: '1103',
    accountName: 'STOCK & INVENTORIES',
    accountType: 'Asset',
    level: 3,
    transType: 'G',
    parentAccountNo: '11',
    openingBalance: 0,
    openingBalanceType: 'DR',
    monthly: { ...EMPTY_MONTHLY_RECORD },
  },
  {
    accountNo: '110301',
    accountName: 'Mined Coal Inventory - Pithead Stock',
    accountType: 'Asset',
    level: 4,
    transType: 'T',
    parentAccountNo: '1103',
    openingBalance: 2400000,
    openingBalanceType: 'DR',
    monthly: { ...EMPTY_MONTHLY_RECORD },
  },
  {
    accountNo: '12',
    accountName: 'NON-CURRENT ASSETS',
    accountType: 'Asset',
    level: 2,
    transType: 'G',
    parentAccountNo: '1',
    openingBalance: 0,
    openingBalanceType: 'DR',
    monthly: { ...EMPTY_MONTHLY_RECORD },
  },
  {
    accountNo: '1201',
    accountName: 'PROPERTY, PLANT & MACHINERY',
    accountType: 'Asset',
    level: 3,
    transType: 'G',
    parentAccountNo: '12',
    openingBalance: 0,
    openingBalanceType: 'DR',
    monthly: { ...EMPTY_MONTHLY_RECORD },
  },
  {
    accountNo: '120101',
    accountName: 'Excavators, Loaders & Dump Trucks',
    accountType: 'Asset',
    level: 4,
    transType: 'T',
    parentAccountNo: '1201',
    openingBalance: 6500000,
    openingBalanceType: 'DR',
    monthly: { ...EMPTY_MONTHLY_RECORD },
  },

  // 2. LIABILITIES
  {
    accountNo: '2',
    accountName: 'LIABILITIES',
    accountType: 'Liability',
    level: 1,
    transType: 'G',
    parentAccountNo: '',
    openingBalance: 0,
    openingBalanceType: 'CR',
    monthly: { ...EMPTY_MONTHLY_RECORD },
  },
  {
    accountNo: '21',
    accountName: 'CURRENT LIABILITIES',
    accountType: 'Liability',
    level: 2,
    transType: 'G',
    parentAccountNo: '2',
    openingBalance: 0,
    openingBalanceType: 'CR',
    monthly: { ...EMPTY_MONTHLY_RECORD },
  },
  {
    accountNo: '2101',
    accountName: 'TRADE CREDITORS & SUPPLIERS',
    accountType: 'Liability',
    level: 3,
    transType: 'G',
    parentAccountNo: '21',
    openingBalance: 0,
    openingBalanceType: 'CR',
    monthly: { ...EMPTY_MONTHLY_RECORD },
  },
  {
    accountNo: '210101',
    accountName: 'Explosives, Spares & Fuel Vendors',
    accountType: 'Liability',
    level: 4,
    transType: 'T',
    parentAccountNo: '2101',
    openingBalance: 950000,
    openingBalanceType: 'CR',
    monthly: { ...EMPTY_MONTHLY_RECORD },
  },
  {
    accountNo: '2102',
    accountName: 'ACCRUED AND OTHER PAYABLES',
    accountType: 'Liability',
    level: 3,
    transType: 'G',
    parentAccountNo: '21',
    openingBalance: 0,
    openingBalanceType: 'CR',
    monthly: { ...EMPTY_MONTHLY_RECORD },
  },
  {
    accountNo: '210201',
    accountName: 'Accrued Miner Wages & Labour Charges',
    accountType: 'Liability',
    level: 4,
    transType: 'T',
    parentAccountNo: '2102',
    openingBalance: 320000,
    openingBalanceType: 'CR',
    monthly: { ...EMPTY_MONTHLY_RECORD },
  },

  // 3. EQUITY
  {
    accountNo: '3',
    accountName: 'EQUITY & CAPITAL',
    accountType: 'Equity',
    level: 1,
    transType: 'G',
    parentAccountNo: '',
    openingBalance: 0,
    openingBalanceType: 'CR',
    monthly: { ...EMPTY_MONTHLY_RECORD },
  },
  {
    accountNo: '31',
    accountName: 'PARTNERS CAPITAL',
    accountType: 'Equity',
    level: 2,
    transType: 'G',
    parentAccountNo: '3',
    openingBalance: 0,
    openingBalanceType: 'CR',
    monthly: { ...EMPTY_MONTHLY_RECORD },
  },
  {
    accountNo: '3101',
    accountName: 'DIRECTORS & PARTNERS CAPITAL',
    accountType: 'Equity',
    level: 3,
    transType: 'G',
    parentAccountNo: '31',
    openingBalance: 0,
    openingBalanceType: 'CR',
    monthly: { ...EMPTY_MONTHLY_RECORD },
  },
  {
    accountNo: '310101',
    accountName: 'Owner Equity & Retained Earnings',
    accountType: 'Equity',
    level: 4,
    transType: 'T',
    parentAccountNo: '3101',
    openingBalance: 9000000,
    openingBalanceType: 'CR',
    monthly: { ...EMPTY_MONTHLY_RECORD },
  },

  // 4. REVENUE
  {
    accountNo: '4',
    accountName: 'REVENUE',
    accountType: 'Revenue',
    level: 1,
    transType: 'G',
    parentAccountNo: '',
    openingBalance: 0,
    openingBalanceType: 'CR',
    monthly: { ...EMPTY_MONTHLY_RECORD },
  },
  {
    accountNo: '41',
    accountName: 'OPERATING REVENUE',
    accountType: 'Revenue',
    level: 2,
    transType: 'G',
    parentAccountNo: '4',
    openingBalance: 0,
    openingBalanceType: 'CR',
    monthly: { ...EMPTY_MONTHLY_RECORD },
  },
  {
    accountNo: '4101',
    accountName: 'COAL SALES REVENUE',
    accountType: 'Revenue',
    level: 3,
    transType: 'G',
    parentAccountNo: '41',
    openingBalance: 0,
    openingBalanceType: 'CR',
    monthly: { ...EMPTY_MONTHLY_RECORD },
  },
  {
    accountNo: '410101',
    accountName: 'Commercial Coal Dispatches & POS Sales',
    accountType: 'Revenue',
    level: 4,
    transType: 'T',
    parentAccountNo: '4101',
    openingBalance: 0,
    openingBalanceType: 'CR',
    monthly: {
      ...EMPTY_MONTHLY_RECORD,
      jan: { credit: 3200000, debit: 0 },
    },
  },

  // 5. EXPENSES
  {
    accountNo: '5',
    accountName: 'EXPENSES',
    accountType: 'Expense',
    level: 1,
    transType: 'G',
    parentAccountNo: '',
    openingBalance: 0,
    openingBalanceType: 'DR',
    monthly: { ...EMPTY_MONTHLY_RECORD },
  },
  {
    accountNo: '51',
    accountName: 'DIRECT PRODUCTION & MINING COSTS',
    accountType: 'Expense',
    level: 2,
    transType: 'G',
    parentAccountNo: '5',
    openingBalance: 0,
    openingBalanceType: 'DR',
    monthly: { ...EMPTY_MONTHLY_RECORD },
  },
  {
    accountNo: '5101',
    accountName: 'FUEL & DIESEL CONSUMPTION',
    accountType: 'Expense',
    level: 3,
    transType: 'G',
    parentAccountNo: '51',
    openingBalance: 0,
    openingBalanceType: 'DR',
    monthly: { ...EMPTY_MONTHLY_RECORD },
  },
  {
    accountNo: '510101',
    accountName: 'Heavy Machinery & Generator Diesel Fuel',
    accountType: 'Expense',
    level: 4,
    transType: 'T',
    parentAccountNo: '5101',
    openingBalance: 0,
    openingBalanceType: 'DR',
    monthly: {
      ...EMPTY_MONTHLY_RECORD,
      jan: { credit: 0, debit: 650000 },
    },
  },
  {
    accountNo: '52',
    accountName: 'ADMINISTRATIVE & OFFICE EXPENSES',
    accountType: 'Expense',
    level: 2,
    transType: 'G',
    parentAccountNo: '5',
    openingBalance: 0,
    openingBalanceType: 'DR',
    monthly: { ...EMPTY_MONTHLY_RECORD },
  },
  {
    accountNo: '5201',
    accountName: 'STAFF SALARIES & WELFARE',
    accountType: 'Expense',
    level: 3,
    transType: 'G',
    parentAccountNo: '52',
    openingBalance: 0,
    openingBalanceType: 'DR',
    monthly: { ...EMPTY_MONTHLY_RECORD },
  },
  {
    accountNo: '520101',
    accountName: 'Management, Security & Engineering Salaries',
    accountType: 'Expense',
    level: 4,
    transType: 'T',
    parentAccountNo: '5201',
    openingBalance: 0,
    openingBalanceType: 'DR',
    monthly: {
      ...EMPTY_MONTHLY_RECORD,
      jan: { credit: 0, debit: 420000 },
    },
  },
];

/**
 * Normalizes account type from any string format
 */
export function normalizeAccountType(rawType?: string): AccountType {
  if (!rawType) return 'Asset';
  const lower = rawType.toLowerCase().trim();
  if (lower.includes('asset')) return 'Asset';
  if (lower.includes('liab')) return 'Liability';
  if (lower.includes('equit') || lower.includes('capit')) return 'Equity';
  if (lower.includes('rev') || lower.includes('income') || lower.includes('sale')) return 'Revenue';
  if (lower.includes('exp') || lower.includes('cost')) return 'Expense';
  return 'Asset';
}

/**
 * Converts a ChartAccount to the user's specific JSON structure
 */
export function formatChartAccountToJson(acc: ChartAccount): RawJsonAccount {
  const openingType: 'DR' | 'CR' =
    acc.openingBalanceType ||
    (acc.normalBalance === 'Debit' ? 'DR' : 'CR');

  // Derive level if missing
  const level = acc.level || (acc.code.length <= 1 ? 1 : acc.code.length <= 2 ? 2 : acc.code.length <= 4 ? 3 : 4);
  const transType = acc.transType || (level >= 4 ? 'T' : 'G');

  return {
    accountNo: acc.accountNo || acc.code,
    accountName: acc.name,
    accountType: acc.accountType,
    level,
    transType,
    parentAccountNo: acc.parentAccountNo || '',
    openingBalance: acc.openingBalance || 0,
    openingBalanceType: openingType,
    monthly: acc.monthly || { ...EMPTY_MONTHLY_RECORD },
  };
}

/**
 * Parses user input JSON and converts into ChartAccount objects
 */
export function parseAndValidateAccountsJson(jsonString: string): {
  success: boolean;
  accounts?: ChartAccount[];
  error?: string;
  count?: number;
} {
  try {
    const trimmed = jsonString.trim();
    if (!trimmed) {
      return { success: false, error: 'JSON payload is empty.' };
    }

    let parsed = JSON.parse(trimmed);

    // Support both direct array and wrapped object { accounts: [...] }
    if (!Array.isArray(parsed) && parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed.accounts)) {
        parsed = parsed.accounts;
      } else if (Array.isArray(parsed.data)) {
        parsed = parsed.data;
      } else {
        return {
          success: false,
          error: 'Expected a JSON array of accounts (e.g. [ { "accountNo": "11", ... } ])',
        };
      }
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return {
        success: false,
        error: 'JSON must be a non-empty array of account objects.',
      };
    }

    const accounts: ChartAccount[] = [];

    for (let index = 0; index < parsed.length; index++) {
      const item = parsed[index];
      if (!item || typeof item !== 'object') continue;

      const accountNo = String(item.accountNo || item.code || item.account_no || '').trim();
      const accountName = String(item.accountName || item.name || item.account_name || item.title || '').trim();

      if (!accountNo && !accountName) {
        continue; // Skip blank entries
      }

      const accountType = normalizeAccountType(item.accountType || item.type);
      const level = Number(item.level) || (accountNo.length <= 1 ? 1 : accountNo.length <= 2 ? 2 : accountNo.length <= 4 ? 3 : 4);
      const transType = item.transType ? String(item.transType).toUpperCase() : level >= 4 ? 'T' : 'G';
      const parentAccountNo = item.parentAccountNo !== undefined ? String(item.parentAccountNo).trim() : '';

      const openingType: 'DR' | 'CR' =
        String(item.openingBalanceType).toUpperCase() === 'CR' || item.openingBalanceType === 'Credit'
          ? 'CR'
          : 'DR';

      const normalBalance: 'Debit' | 'Credit' =
        item.normalBalance === 'Credit' || openingType === 'CR' || accountType === 'Liability' || accountType === 'Equity' || accountType === 'Revenue'
          ? 'Credit'
          : 'Debit';

      const openingBalance = Math.round(Number(item.openingBalance) || 0);

      // Monthly breakdown
      const monthly = item.monthly && typeof item.monthly === 'object' ? item.monthly : { ...EMPTY_MONTHLY_RECORD };

      // Calculate net monthly change
      let netMonthly = 0;
      Object.values(monthly).forEach((m: any) => {
        if (m && typeof m === 'object') {
          const deb = Number(m.debit) || 0;
          const cred = Number(m.credit) || 0;
          if (normalBalance === 'Debit') {
            netMonthly += deb - cred;
          } else {
            netMonthly += cred - deb;
          }
        }
      });

      const currentBalance =
        item.currentBalance !== undefined && netMonthly === 0
          ? Math.round(Number(item.currentBalance) || 0)
          : openingBalance + netMonthly;

      // Class and group derivation
      const typeDigit =
        accountType === 'Asset'
          ? 1
          : accountType === 'Liability'
          ? 2
          : accountType === 'Equity'
          ? 3
          : accountType === 'Revenue'
          ? 4
          : 5;

      const classification =
        item.classification ||
        (accountType === 'Asset'
          ? accountNo.startsWith('11') ? 'Current Assets' : 'Non-Current Assets'
          : accountType === 'Liability'
          ? accountNo.startsWith('21') ? 'Current Liabilities' : 'Long-Term Liabilities'
          : accountType === 'Equity'
          ? 'Share Capital & Reserves'
          : accountType === 'Revenue'
          ? 'Operating Revenue'
          : accountNo.startsWith('51') ? 'Cost of Goods Sold' : 'Administrative Expenses');

      const groupName =
        item.groupName ||
        (accountType === 'Asset'
          ? accountNo.startsWith('1101') ? 'Cash & Cash Equivalents' : accountNo.startsWith('1102') ? 'Trade Receivables' : 'Inventories'
          : accountType === 'Liability'
          ? 'Trade & Other Payables'
          : accountType === 'Equity'
          ? 'Owner Equity'
          : accountType === 'Revenue'
          ? 'Coal Sales Revenue'
          : 'Direct Costs');

      const code = accountNo || `${typeDigit}-1-01-${String(index + 1).padStart(3, '0')}`;
      const sanitizedCode = code.replace(/[^a-zA-Z0-9]/g, '_');

      accounts.push({
        id: sanitizedCode ? `coa-${sanitizedCode}` : `coa-item-${index}`,
        code,
        accountNo: code,
        typeDigit,
        classDigit: Number(item.classDigit) || 1,
        groupCode: item.groupCode ? String(item.groupCode) : '01',
        subCode: item.subCode ? String(item.subCode) : String(index + 1).padStart(3, '0'),
        name: accountName || `Account ${code}`,
        accountType,
        classification,
        groupName,
        normalBalance,
        openingBalance,
        currentBalance,
        description: item.description || `Imported JSON head (${transType === 'G' ? 'General Group' : 'Transactional Detail'})`,
        isActive: item.isActive !== false,
        level,
        transType,
        parentAccountNo,
        openingBalanceType: openingType,
        monthly,
      });
    }

    // Deduplicate by normalized account code (keeping latest entry) so DB upserts never conflict
    const dedupedMap = new Map<string, ChartAccount>();
    for (const acc of accounts) {
      dedupedMap.set((acc.code || acc.id).trim().toLowerCase(), acc);
    }
    const dedupedAccounts = Array.from(dedupedMap.values());

    if (dedupedAccounts.length === 0) {
      return { success: false, error: 'No valid accounts could be parsed from the provided JSON.' };
    }

    return {
      success: true,
      accounts: dedupedAccounts,
      count: dedupedAccounts.length,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Invalid JSON syntax: ${err.message || 'Check commas, brackets, and quotes.'}`,
    };
  }
}

/**
 * Triggers browser download of template JSON file
 */
export function downloadCoaTemplateFile(): void {
  const jsonString = JSON.stringify(STANDARD_COA_TEMPLATE, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'chart_of_accounts_import_template.json');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Triggers browser download of current accounts in the user's JSON structure
 */
export function exportAccountsToJsonFile(accounts: ChartAccount[]): void {
  const jsonAccounts = sortAccountsByCode(accounts).map(formatChartAccountToJson);
  const jsonString = JSON.stringify(jsonAccounts, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `chart_of_accounts_export_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Triggers browser download of current accounts in CSV format
 */
export function exportAccountsToCsvFile(accounts: ChartAccount[]): void {
  const headers = [
    'Account No',
    'Account Name',
    'Account Type',
    'Level',
    'Trans Type',
    'Parent Account No',
    'Normal Balance',
    'Opening Balance',
    'Current Balance',
    'Classification',
    'Group Name',
    'Status',
  ];

  const rows = sortAccountsByCode(accounts).map((acc) => [
    acc.accountNo || acc.code,
    acc.name,
    acc.accountType,
    acc.level || 3,
    acc.transType || 'T',
    acc.parentAccountNo || '',
    acc.normalBalance,
    acc.openingBalance,
    acc.currentBalance,
    acc.classification || '',
    acc.groupName || '',
    acc.isActive ? 'Active' : 'Inactive',
  ]);

  exportUniversalCsv(`chart_of_accounts_${new Date().toISOString().slice(0, 10)}.csv`, {
    tableName: 'Standard Chart of Accounts (COA) Register',
    reportDate: new Date().toLocaleDateString('en-GB'),
    headers,
    rows,
  });
}
