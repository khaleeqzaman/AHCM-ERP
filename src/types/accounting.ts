export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';

export type VoucherType = 
  | 'Journal Voucher (JV)' 
  | 'Payment Voucher (PV)' 
  | 'Receipt Voucher (RV)' 
  | 'Contra Voucher (CV)';

export type VoucherStatus = 'Draft' | 'Posted';

export interface ChartAccount {
  id: string;
  code: string; // T-C-GG-SSS
  typeDigit: number; // T: 1=Asset, 2=Liability, 3=Equity, 4=Revenue, 5=Expense
  classDigit: number; // C: e.g. 1=Current, 2=Non-Current
  groupCode: string; // GG: e.g. 01, 02
  subCode: string; // SSS: e.g. 001, 002
  name: string;
  accountType: AccountType;
  classification: string; // e.g. Current Assets, Operating Expenses
  groupName: string; // e.g. Cash & Bank, Trade Payables
  normalBalance: 'Debit' | 'Credit';
  openingBalance: number;
  currentBalance: number;
  description?: string;
  isActive: boolean;
}

export interface VoucherLine {
  id: string;
  srNo: number;
  accountId: string;
  accountCode: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
}

export interface VoucherDocument {
  id: string;
  voucherNo: string; // e.g. JV-2026-001, PV-2026-001
  voucherType: VoucherType;
  date: string;
  referenceNo: string;
  narration: string;
  lines: VoucherLine[];
  totalDebit: number;
  totalCredit: number;
  status: VoucherStatus;
  postedAt?: string;
}

export interface LedgerEntry {
  id: string;
  voucherId: string;
  voucherNo: string;
  voucherType: VoucherType;
  date: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  particulars: string;
  debit: number;
  credit: number;
  runningBalance: number;
}
