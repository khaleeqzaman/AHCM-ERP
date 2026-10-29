import React, { useState } from 'react';
import { CreditCard, Plus, Search, Eye, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { BankAccountRecord } from '../../types/treasury';

interface ListBankAccountsViewProps {
  bankAccounts: BankAccountRecord[];
  onNavigateToAddAccount: () => void;
  onSelectAccountDetails: (accountId: string) => void;
  onDeleteBankAccount: (accountId: string) => void;
}

export const ListBankAccountsView: React.FC<ListBankAccountsViewProps> = ({
  bankAccounts,
  onNavigateToAddAccount,
  onSelectAccountDetails,
  onDeleteBankAccount,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [accountToDelete, setAccountToDelete] = useState<BankAccountRecord | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const calculateAccountBalance = (account: BankAccountRecord) => {
    const totalDeposit = account.transactions.reduce((sum, t) => sum + (Number(t.depositDebit) || 0), 0);
    const totalWithdrawal = account.transactions.reduce((sum, t) => sum + (Number(t.withdrawalPayment) || 0), 0);
    return account.openingBalance + totalDeposit - totalWithdrawal;
  };

  const filteredAccounts = bankAccounts.filter((a) => {
    const term = searchTerm.toLowerCase();
    return (
      a.bankName.toLowerCase().includes(term) ||
      a.accountNumber.toLowerCase().includes(term) ||
      a.accountTitle.toLowerCase().includes(term) ||
      a.openingBalanceDate.includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{notification}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-2 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Bank Management
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">Accounts Register</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            List of Bank Accounts
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Active corporate bank accounts, opening balances, and live calculated balances.
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateToAddAccount}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Bank Account</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3.5 border border-slate-200 rounded-xl shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search account #, bank, title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
          />
        </div>

        <div className="text-xs text-slate-500">
          Total Bank Accounts: <strong className="text-slate-900 font-mono">{bankAccounts.length}</strong>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-3 w-14 text-center">Sr.</th>
                <th className="py-3 px-4 w-52">Bank Name</th>
                <th className="py-3 px-4">Account Title</th>
                <th className="py-3 px-4 font-mono">Account Number</th>
                <th className="py-3 px-4 font-mono text-center">Opening Date</th>
                <th className="py-3 px-4 text-right">Opening Balance</th>
                <th className="py-3 px-4 text-right">Current Balance</th>
                <th className="py-3 px-4 text-center w-48">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No bank accounts found. Click "Add Bank Account" to link a new bank account.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((account, index) => {
                  const currentBalance = calculateAccountBalance(account);

                  return (
                    <tr key={account.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 text-center font-mono text-slate-500 font-medium">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {account.bankName}
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-medium">
                        {account.accountTitle}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onSelectAccountDetails(account.id)}
                          className="hover:underline cursor-pointer text-left"
                          title="Open account transactions"
                        >
                          {account.accountNumber}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-600 whitespace-nowrap">
                        {account.openingBalanceDate}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                        {account.openingBalance.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900 whitespace-nowrap">
                        <span className={currentBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                          {currentBalance.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onSelectAccountDetails(account.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:text-white bg-blue-50 hover:bg-blue-600 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                            title="Open account transactions"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setAccountToDelete(account)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                            title="Delete bank account and all details"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {accountToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden p-6 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  Delete Bank Account?
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Are you sure you want to delete bank account{' '}
                  <strong className="text-slate-900 font-mono">{accountToDelete.accountNumber}</strong>{' '}
                  ({accountToDelete.bankName} - {accountToDelete.accountTitle})?
                </p>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 inline-block" />
                Complete Data Removal:
              </p>
              <p className="text-[11px] text-rose-700 leading-relaxed">
                This will delete this bank account with all its details and data, including{' '}
                <strong>{accountToDelete.transactions.length}</strong> transaction entries, opening balance, and history. This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAccountToDelete(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const accNum = accountToDelete.accountNumber;
                  onDeleteBankAccount(accountToDelete.id);
                  setAccountToDelete(null);
                  setNotification(`Bank account ${accNum} and all its details have been deleted.`);
                  setTimeout(() => setNotification(null), 3500);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete Account</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
