export interface CashBookEntry {
  id: string;
  srNo: number;
  date: string; // format: DD-MM-YYYY
  description: string;
  credit: number;
  debit: number;
  balance: number; // Auto-calculated: Credit - Debit
}

export interface BankRecord {
  id: string;
  srNo: number;
  bankName: string;
  branchName: string;
  branchCode: string;
  address: string;
  createdAt?: string;
}

export interface BankTransaction {
  id: string;
  srNo: number;
  date: string; // format: DD-MM-YYYY
  payeeDescription: string; // Payee / Transaction Description
  category: string;
  depositDebit: number; // Deposit / Debit (+)
  withdrawalPayment: number; // Withdrawal Payment (-)
  balance: number; // Auto-calculated: Deposit - Withdrawal
}

export interface BankAccountRecord {
  id: string;
  srNo: number;
  bankId: string;
  bankName: string;
  accountNumber: string;
  accountTitle: string;
  openingBalance: number;
  openingBalanceDate: string; // format: DD-MM-YYYY
  transactions: BankTransaction[];
}

export interface CreditBookEntry {
  id: string;
  srNo: number;
  date: string; // format: DD-MM-YYYY
  name: string;
  purpose: string;
  amount: number;
}

export type TreasurySection = 'cash_book' | 'credit_book' | 'bank_management';

export type BankManagementPage =
  | 'add_bank'
  | 'list_banks'
  | 'add_bank_account'
  | 'list_bank_accounts'
  | 'account_details'
  | 'banks_summary';
