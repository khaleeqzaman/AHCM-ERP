import React, { useState } from 'react';
import { 
  Vault, 
  BookOpen, 
  Landmark, 
  Plus, 
  CreditCard, 
  Building2, 
  Table, 
  Layers, 
  BarChart3,
  ArrowRight,
  Wallet
} from 'lucide-react';
import { 
  CashBookEntry, 
  BankRecord, 
  BankAccountRecord, 
  BankTransaction,
  TreasurySection, 
  BankManagementPage 
} from '../../types/treasury';
import { CashBookRegisterView } from './CashBookRegisterView';
import { AddBankForm } from './AddBankForm';
import { ListBanksView } from './ListBanksView';
import { AddBankAccountForm } from './AddBankAccountForm';
import { ListBankAccountsView } from './ListBankAccountsView';
import { BankAccountDetailsView } from './BankAccountDetailsView';
import { BanksSummaryView } from './BanksSummaryView';

interface TreasuryScreenProps {
  cashBookEntries: CashBookEntry[];
  banks: BankRecord[];
  bankAccounts: BankAccountRecord[];
  onAddCashBookEntry: (entry: CashBookEntry) => void;
  onUpdateCashBookEntry: (
    id: string,
    field: 'date' | 'description' | 'credit' | 'debit',
    value: string | number
  ) => void;
  onDeleteCashBookEntry: (id: string) => void;
  onAddBank: (bank: BankRecord) => void;
  onDeleteBank?: (id: string) => void;
  onAddBankAccount: (account: BankAccountRecord) => void;
  onAddBankTransaction: (accountId: string, transaction: BankTransaction) => void;
  onUpdateBankTransaction: (
    accountId: string,
    transactionId: string,
    field: 'date' | 'payeeDescription' | 'category' | 'depositDebit' | 'withdrawalPayment',
    value: string | number
  ) => void;
  onDeleteBankTransaction: (accountId: string, transactionId: string) => void;
}

export const TreasuryScreen: React.FC<TreasuryScreenProps> = ({
  cashBookEntries,
  banks,
  bankAccounts,
  onAddCashBookEntry,
  onUpdateCashBookEntry,
  onDeleteCashBookEntry,
  onAddBank,
  onDeleteBank,
  onAddBankAccount,
  onAddBankTransaction,
  onUpdateBankTransaction,
  onDeleteBankTransaction,
}) => {
  // Main Section: 'cash_book' or 'bank_management'
  const [activeSection, setActiveSection] = useState<TreasurySection>('cash_book');

  // Sub-page for Bank Management
  const [bankSubPage, setBankSubPage] = useState<BankManagementPage>('banks_summary');
  const [selectedAccountId, setSelectedAccountId] = useState<string>(bankAccounts[0]?.id || '');
  const [preselectedBankIdForNewAccount, setPreselectedBankIdForNewAccount] = useState<string | undefined>();

  // Totals
  const totalCashBookBalance = cashBookEntries.reduce(
    (sum, e) => sum + ((Number(e.credit) || 0) - (Number(e.debit) || 0)),
    0
  );

  const totalBankBalance = bankAccounts.reduce((sum, acc) => {
    const totalDeposit = acc.transactions.reduce((dSum, t) => dSum + (Number(t.depositDebit) || 0), 0);
    const totalWithdrawal = acc.transactions.reduce((wSum, t) => wSum + (Number(t.withdrawalPayment) || 0), 0);
    return sum + (acc.openingBalance + totalDeposit - totalWithdrawal);
  }, 0);

  const handleOpenAccountDetails = (accountId: string) => {
    setSelectedAccountId(accountId);
    setActiveSection('bank_management');
    setBankSubPage('account_details');
  };

  const handleOpenAddAccountForBank = (bankId?: string) => {
    setPreselectedBankIdForNewAccount(bankId);
    setActiveSection('bank_management');
    setBankSubPage('add_bank_account');
  };

  return (
    <div className="space-y-6">
      {/* Treasury Screen Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">
                Cashier Operations
              </span>
              <span className="text-slate-300">/</span>
              <span className="text-xs text-slate-500">Treasury & Bank Management</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
              Treasury Module
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Dedicated, isolated cashier workspace for daily Cash Book Register and multi-account Bank Management.
            </p>
          </div>

          {/* KPI Strip */}
          <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
            <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200">
              <span className="text-amber-700 block text-[11px] font-semibold">Cash Book Balance</span>
              <span className="text-sm font-bold font-mono tabular-nums text-slate-900">
                {totalCashBookBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200">
              <span className="text-blue-700 block text-[11px] font-semibold">Total Bank Reserves</span>
              <span className="text-sm font-bold font-mono tabular-nums text-slate-900">
                {totalBankBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 hidden sm:block">
              <span className="text-slate-500 block text-[11px]">Accounts</span>
              <span className="text-sm font-bold font-mono tabular-nums text-slate-800">
                {bankAccounts.length} Active
              </span>
            </div>
          </div>
        </div>

        {/* 1. Treasury Screen Navigation Buttons:
            - Cash Book Register
            - Bank Management (Add Bank, List of Banks, List of Bank Accounts, Bank Account Details, Banks Summary)
        */}
        <div className="pt-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Treasury Sections:
            </span>

            {/* Main Section Switcher */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-cash-book-register"
                onClick={() => setActiveSection('cash_book')}
                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer ${
                  activeSection === 'cash_book'
                    ? 'bg-amber-600 text-white ring-2 ring-amber-600/30'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Cash Book Register</span>
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-amber-700/30 text-white">
                  {cashBookEntries.length}
                </span>
              </button>

              <button
                type="button"
                id="btn-bank-management"
                onClick={() => setActiveSection('bank_management')}
                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer ${
                  activeSection === 'bank_management'
                    ? 'bg-blue-600 text-white ring-2 ring-blue-600/30'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <Landmark className="w-3.5 h-3.5" />
                <span>Bank Management</span>
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-blue-700/30 text-white">
                  {bankAccounts.length}
                </span>
              </button>
            </div>
          </div>

          {/* Bank Management Sub-Navigation Entry Points:
              - Add Bank
              - List of Banks
              - Add Bank Account
              - List of Bank Accounts
              - Bank Account Details
              - Banks Summary
          */}
          {activeSection === 'bank_management' && (
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider mr-1">
                Bank Entry Points:
              </span>

              {/* 1. Add Bank */}
              <button
                type="button"
                onClick={() => setBankSubPage('add_bank')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  bankSubPage === 'add_bank'
                    ? 'bg-blue-100 text-blue-900 font-semibold'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Plus className="w-3 h-3 text-blue-600" />
                <span>Add Bank</span>
              </button>

              {/* 2. List of Banks */}
              <button
                type="button"
                onClick={() => setBankSubPage('list_banks')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  bankSubPage === 'list_banks'
                    ? 'bg-blue-100 text-blue-900 font-semibold'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3 h-3 text-blue-600" />
                <span>List of Banks ({banks.length})</span>
              </button>

              {/* 3. Add Bank Account */}
              <button
                type="button"
                onClick={() => {
                  setPreselectedBankIdForNewAccount(undefined);
                  setBankSubPage('add_bank_account');
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  bankSubPage === 'add_bank_account'
                    ? 'bg-blue-100 text-blue-900 font-semibold'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Plus className="w-3 h-3 text-blue-600" />
                <span>Add Bank Account</span>
              </button>

              {/* 4. List of Bank Accounts */}
              <button
                type="button"
                onClick={() => setBankSubPage('list_bank_accounts')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  bankSubPage === 'list_bank_accounts'
                    ? 'bg-blue-100 text-blue-900 font-semibold'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <CreditCard className="w-3 h-3 text-blue-600" />
                <span>List of Bank Accounts ({bankAccounts.length})</span>
              </button>

              {/* 5. Bank Account Details */}
              <button
                type="button"
                onClick={() => setBankSubPage('account_details')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  bankSubPage === 'account_details'
                    ? 'bg-blue-100 text-blue-900 font-semibold'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Table className="w-3 h-3 text-blue-600" />
                <span>Bank Account Details</span>
              </button>

              {/* 6. Banks Summary */}
              <button
                type="button"
                onClick={() => setBankSubPage('banks_summary')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  bankSubPage === 'banks_summary'
                    ? 'bg-blue-100 text-blue-900 font-semibold'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <BarChart3 className="w-3 h-3 text-blue-600" />
                <span>Banks Summary</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div>
        {activeSection === 'cash_book' && (
          <CashBookRegisterView
            entries={cashBookEntries}
            onAddEntry={onAddCashBookEntry}
            onUpdateEntry={onUpdateCashBookEntry}
            onDeleteEntry={onDeleteCashBookEntry}
          />
        )}

        {activeSection === 'bank_management' && (
          <>
            {bankSubPage === 'add_bank' && (
              <AddBankForm
                existingBanks={banks}
                onAddBank={onAddBank}
                onNavigateToList={() => setBankSubPage('list_banks')}
              />
            )}

            {bankSubPage === 'list_banks' && (
              <ListBanksView
                banks={banks}
                bankAccounts={bankAccounts}
                onNavigateToAddBank={() => setBankSubPage('add_bank')}
                onNavigateToAddAccount={handleOpenAddAccountForBank}
                onDeleteBank={onDeleteBank}
              />
            )}

            {bankSubPage === 'add_bank_account' && (
              <AddBankAccountForm
                banks={banks}
                existingAccounts={bankAccounts}
                initialSelectedBankId={preselectedBankIdForNewAccount}
                onAddAccount={(newAcc) => {
                  onAddBankAccount(newAcc);
                  setSelectedAccountId(newAcc.id);
                }}
                onNavigateToList={() => setBankSubPage('list_bank_accounts')}
              />
            )}

            {bankSubPage === 'list_bank_accounts' && (
              <ListBankAccountsView
                bankAccounts={bankAccounts}
                onNavigateToAddAccount={() => {
                  setPreselectedBankIdForNewAccount(undefined);
                  setBankSubPage('add_bank_account');
                }}
                onSelectAccountDetails={handleOpenAccountDetails}
              />
            )}

            {bankSubPage === 'account_details' && (
              <BankAccountDetailsView
                accounts={bankAccounts}
                selectedAccountId={selectedAccountId}
                onSelectAccount={setSelectedAccountId}
                onAddTransaction={onAddBankTransaction}
                onUpdateTransaction={onUpdateBankTransaction}
                onDeleteTransaction={onDeleteBankTransaction}
                onNavigateBack={() => setBankSubPage('banks_summary')}
              />
            )}

            {bankSubPage === 'banks_summary' && (
              <BanksSummaryView
                bankAccounts={bankAccounts}
                onSelectAccountDetails={handleOpenAccountDetails}
                onNavigateToAddAccount={() => {
                  setPreselectedBankIdForNewAccount(undefined);
                  setBankSubPage('add_bank_account');
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};
