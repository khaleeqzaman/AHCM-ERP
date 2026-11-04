export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';

export type VoucherTypeCode = 'CP' | 'CR' | 'BP' | 'BR' | 'JV';

export type VoucherType = 
  | 'CP - Cash Payment Voucher' 
  | 'CR - Cash Receipt Voucher' 
  | 'BP - Bank Payment Voucher' 
  | 'BR - Bank Receipt Voucher' 
  | 'JV - Journal Voucher';

export type VoucherStatus = 'Draft' | 'Approved' | 'Posted' | 'Reversed' | 'Cancelled';

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
  accountId: string;    // Chart of Accounts account_id
  accountCode: string;  // T-C-GG-SSS code
  accountName: string;  // Account title
  description: string;  // Line particulars/remarks
  debit: number;
  credit: number;
}

export interface VoucherDocument {
  id: string;
  voucherNo: string; // e.g. CP-2026-001, CR-2026-001, BP-2026-001, BR-2026-001, JV-2026-001
  voucherType: VoucherType;
  typeCode?: VoucherTypeCode;
  date: string;
  referenceNo: string;
  narration: string;
  lines: VoucherLine[];
  totalDebit: number;
  totalCredit: number;
  status: VoucherStatus;
  preparedBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  postedBy?: string;
  postedAt?: string;
  reversedBy?: string;
  reversedAt?: string;
  reversalReason?: string;
  reversalVoucherNo?: string;
  cancelledBy?: string;
  cancelledAt?: string;
  cancelReason?: string;
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
  referenceNo?: string;
  status?: VoucherStatus;
}
