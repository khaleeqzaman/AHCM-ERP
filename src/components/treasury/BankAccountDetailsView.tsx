import React, { useState } from 'react';
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  Building2, 
  CheckCircle2, 
  Calendar,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  AlertTriangle
} from 'lucide-react';
import { BankAccountRecord, BankTransaction } from '../../types/treasury';

interface BankAccountDetailsViewProps {
  accounts: BankAccountRecord[];
  selectedAccountId: string;
  onSelectAccount: (accountId: string) => void;
  onAddTransaction: (accountId: string, transaction: BankTransaction) => void;
  onUpdateTransaction: (
    accountId: string,
    transactionId: string,
    field: 'date' | 'payeeDescription' | 'category' | 'depositDebit' | 'withdrawalPayment',
    value: string | number
  ) => void;
  onDeleteTransaction: (accountId: string, transactionId: string) => void;
  onNavigateBack: () => void;
}

export const BankAccountDetailsView: React.FC<BankAccountDetailsViewProps> = ({
  accounts,
  selectedAccountId,
  onSelectAccount,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  onNavigateBack,
}) => {
  const [notification, setNotification] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [txToDelete, setTxToDelete] = useState<{
    id: string;
    srNo: number;
    payeeDescription: string;
  } | null>(null);

  const getTodayDDMMYYYY = () => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const currentAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0];

  if (!currentAccount) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3">
        <CreditCard className="w-10 h-10 text-slate-400 mx-auto" />
        <h3 className="text-base font-bold text-slate-800">No Bank Account Selected</h3>
        <p className="text-xs text-slate-500">Please select or add a bank account first.</p>
        <button
          type="button"
          onClick={onNavigateBack}
          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer"
        >
          Return to Accounts List
        </button>
      </div>
    );
  }

  // Calculate totals
  const totalDeposit = currentAccount.transactions.reduce(
    (sum, t) => sum + (Number(t.depositDebit) || 0),
    0
  );
  const totalWithdrawal = currentAccount.transactions.reduce(
    (sum, t) => sum + (Number(t.withdrawalPayment) || 0),
    0
  );
  const netTransactionBalance = totalDeposit - totalWithdrawal;
  const currentBalance = currentAccount.openingBalance + netTransactionBalance;

  const handleAddNewTransaction = () => {
    // Row fields are not pre-filled; all fields are empty for user input, placed on top
    const newTx: BankTransaction = {
      id: `tx-${Date.now()}`,
      srNo: 1,
      date: '',
      payeeDescription: '',
      category: '',
      depositDebit: 0,
      withdrawalPayment: 0,
      balance: 0,
    };
    onAddTransaction(currentAccount.id, newTx);
    setNotification('New clean transaction row added at the top. Fields are ready for input.');
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredTransactions = currentAccount.transactions.filter((t) => {
    const term = searchTerm.toLowerCase();
    return (
      t.payeeDescription.toLowerCase().includes(term) ||
      t.category.toLowerCase().includes(term) ||
      t.date.includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Account Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Bank Management
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">Ledger Statement</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Bank Account Details
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Individual account statement, editable line items, and automated balance calculation (Deposit − Withdrawal).
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Account Selector Dropdown */}
          <select
            value={currentAccount.id}
            onChange={(e) => onSelectAccount(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold text-slate-900 shadow-xs max-w-xs"
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.bankName} - {acc.accountNumber}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={onNavigateBack}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* 3.5 A. Account Information:
          - Current Balance: Display at the top of the page.
          - Opening Balance: Display before the table.
          - Opening Balance Date: Display with the opening balance.
      */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2.5 py-0.5 rounded">
              {currentAccount.accountNumber}
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-xs text-slate-300">{currentAccount.bankName}</span>
          </div>
          <h3 className="text-xl font-bold tracking-tight text-white mt-1">
            {currentAccount.accountTitle}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Treasury verified bank ledger records and real-time cleared settlements.
          </p>
        </div>

        {/* Current Balance Display at the Top of the Page */}
        <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl shrink-0 min-w-[220px]">
          <span className="text-xs uppercase font-semibold text-slate-400 block tracking-wider">
            Current Balance
          </span>
          <span className="text-2xl font-bold font-mono tabular-nums text-emerald-400 mt-1 block">
            {currentBalance.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            Opening Balance + Net Deposits
          </span>
        </div>
      </div>

      {/* Opening Balance Card (Displayed before the table) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block font-medium">
              Account Baseline Starting Position
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm font-bold text-slate-900">
                Opening Balance:
              </span>
              <span className="text-sm font-bold font-mono tabular-nums text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded">
                {currentAccount.openingBalance.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Opening Balance Date (Displayed with the opening balance) */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-lg text-xs font-medium text-slate-700 self-start sm:self-auto">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span>Opening Balance Date:</span>
          <strong className="font-mono text-slate-900 font-bold">{currentAccount.openingBalanceDate}</strong>
        </div>
      </div>

      {/* Transaction Controls Bar */}
      <div className="bg-white p-3.5 border border-slate-200 rounded-xl shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search payee, description, category, date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
          />
        </div>

        <button
          type="button"
          onClick={handleAddNewTransaction}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Transaction Row</span>
        </button>
      </div>

      {/* 3.5 B. Bank Account Details Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-3 w-14 text-center">Sr.</th>
                <th className="py-3 px-4 w-36">Date (DD-MM-YYYY)</th>
                <th className="py-3 px-4">Payee / Transaction Description</th>
                <th className="py-3 px-4 w-44">Category</th>
                <th className="py-3 px-4 w-36 text-right">Deposit / Debit (+)</th>
                <th className="py-3 px-4 w-36 text-right">Withdrawal Payment (-)</th>
                <th className="py-3 px-4 w-36 text-right">Balance (Deposit − Withdrawal)</th>
                <th className="py-3 px-3 w-14 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No transactions recorded for this account. Click "Add Transaction Row" to add entries.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx, idx) => {
                  const txBalance =
                    (Number(tx.depositDebit) || 0) - (Number(tx.withdrawalPayment) || 0);

                  return (
                    <tr key={tx.id} className="hover:bg-blue-50/20 transition-colors">
                      {/* Sr. Auto-generated */}
                      <td className="py-2.5 px-3 text-center font-mono font-medium text-slate-500">
                        {tx.srNo}
                      </td>

                      {/* Date (Manual input, format: DD-MM-YYYY) */}
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={tx.date}
                          placeholder="DD-MM-YYYY"
                          onChange={(e) =>
                            onUpdateTransaction(currentAccount.id, tx.id, 'date', e.target.value)
                          }
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-900 font-mono"
                        />
                      </td>

                      {/* Payee / Transaction Description (Manual input) */}
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={tx.payeeDescription}
                          placeholder="Payee or description..."
                          onChange={(e) =>
                            onUpdateTransaction(
                              currentAccount.id,
                              tx.id,
                              'payeeDescription',
                              e.target.value
                            )
                          }
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-900 font-medium"
                        />
                      </td>

                      {/* Category (Manual input) */}
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={tx.category}
                          placeholder="Category..."
                          onChange={(e) =>
                            onUpdateTransaction(currentAccount.id, tx.id, 'category', e.target.value)
                          }
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-900"
                        />
                      </td>

                      {/* Deposit / Debit (+) (Manual input) */}
                      <td className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={tx.depositDebit === 0 ? '' : tx.depositDebit}
                          placeholder="0.00"
                          onChange={(e) =>
                            onUpdateTransaction(
                              currentAccount.id,
                              tx.id,
                              'depositDebit',
                              e.target.value === '' ? 0 : Number(e.target.value)
                            )
                          }
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-900 font-mono tabular-nums text-right font-semibold"
                        />
                      </td>

                      {/* Withdrawal Payment (-) (Manual input) */}
                      <td className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={tx.withdrawalPayment === 0 ? '' : tx.withdrawalPayment}
                          placeholder="0.00"
                          onChange={(e) =>
                            onUpdateTransaction(
                              currentAccount.id,
                              tx.id,
                              'withdrawalPayment',
                              e.target.value === '' ? 0 : Number(e.target.value)
                            )
                          }
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-900 font-mono tabular-nums text-right font-semibold"
                        />
                      </td>

                      {/* Balance (Auto-calculated: Deposit − Withdrawal) */}
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums font-bold whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs ${
                            txBalance >= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
                          }`}
                        >
                          {txBalance.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </td>

                      {/* Delete Action */}
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            setTxToDelete({
                              id: tx.id,
                              srNo: tx.srNo,
                              payeeDescription: tx.payeeDescription,
                            })
                          }
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* 3.5 D. Totals at the End of the Table:
                - Total Deposit
                - Total Withdrawal
                - Total Balance
            */}
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-300 font-bold text-xs text-slate-900">
                <td colSpan={4} className="py-3 px-4 text-right uppercase tracking-wider text-[11px] text-slate-700">
                  Transaction Totals:
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums text-emerald-800 text-sm">
                  {totalDeposit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums text-rose-800 text-sm">
                  {totalWithdrawal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-4 text-right font-mono tabular-nums text-blue-900 text-sm whitespace-nowrap">
                  {netTransactionBalance.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Delete Transaction Confirmation Modal */}
      {txToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden p-6 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  Confirm Transaction Deletion
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Are you sure you want to delete transaction row{' '}
                  <strong className="font-mono text-slate-900">#{txToDelete.srNo}</strong>
                  {txToDelete.payeeDescription ? (
                    <>
                      {' '}
                      (<span className="font-medium text-slate-800">{txToDelete.payeeDescription}</span>)
                    </>
                  ) : null}
                  ?
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 inline-block" />
                Recalculation Notice:
              </p>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                Deleting this row will permanently remove it and automatically recalculate total deposits, withdrawals, and the account current balance.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTxToDelete(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetSr = txToDelete.srNo;
                  onDeleteTransaction(currentAccount.id, txToDelete.id);
                  setTxToDelete(null);
                  setNotification(`Transaction row #${targetSr} deleted successfully.`);
                  setTimeout(() => setNotification(null), 3000);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete Row</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
