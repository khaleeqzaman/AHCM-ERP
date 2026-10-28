import React, { useState } from 'react';
import { Landmark, Search, ExternalLink, ArrowRight, Wallet, Building2, CreditCard } from 'lucide-react';
import { BankAccountRecord } from '../../types/treasury';

interface BanksSummaryViewProps {
  bankAccounts: BankAccountRecord[];
  onSelectAccountDetails: (accountId: string) => void;
  onNavigateToAddAccount: () => void;
}

export const BanksSummaryView: React.FC<BanksSummaryViewProps> = ({
  bankAccounts,
  onSelectAccountDetails,
  onNavigateToAddAccount,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate current balance for each bank account
  const accountsWithCalculatedBalance = bankAccounts.map((acc, index) => {
    const totalDeposit = acc.transactions.reduce(
      (sum, t) => sum + (Number(t.depositDebit) || 0),
      0
    );
    const totalWithdrawal = acc.transactions.reduce(
      (sum, t) => sum + (Number(t.withdrawalPayment) || 0),
      0
    );
    const currentBalance = acc.openingBalance + totalDeposit - totalWithdrawal;

    return {
      ...acc,
      srNo: index + 1,
      totalDeposit,
      totalWithdrawal,
      currentBalance,
    };
  });

  const filteredSummary = accountsWithCalculatedBalance.filter((acc) => {
    const term = searchTerm.toLowerCase();
    return (
      acc.bankName.toLowerCase().includes(term) ||
      acc.accountNumber.toLowerCase().includes(term) ||
      acc.accountTitle.toLowerCase().includes(term)
    );
  });

  // Total balance of all listed bank accounts
  const totalAllBankAccountsBalance = accountsWithCalculatedBalance.reduce(
    (sum, acc) => sum + acc.currentBalance,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Bank Management
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">Executive Summary</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <Landmark className="w-5 h-5 text-blue-600" />
            Banks Summary
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Consolidated overview automatically fetched from all Bank Account Details statements.
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateToAddAccount}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Add Bank Account</span>
        </button>
      </div>

      {/* Aggregate Balance Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-semibold text-blue-200 block tracking-wider">
            Consolidated Treasury Bank Reserves
          </span>
          <span className="text-2xl font-bold font-mono tabular-nums text-white mt-1 block">
            {totalAllBankAccountsBalance.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          <span className="text-xs text-blue-200/80 mt-0.5 block">
            Combined live liquid balance across all {bankAccounts.length} active bank accounts
          </span>
        </div>

        <div className="p-3 rounded-lg bg-blue-800/60 border border-blue-700/60 flex items-center gap-3">
          <Wallet className="w-6 h-6 text-blue-300 shrink-0" />
          <div className="text-xs">
            <span className="text-blue-200 block">Bank Accounts Active:</span>
            <span className="font-bold text-white font-mono text-sm">{bankAccounts.length} Accounts</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-3.5 border border-slate-200 rounded-xl shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search bank name, account number, account title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
          />
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-2">
          <span>Click any</span>
          <span className="font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            Account Number
          </span>
          <span>to view full transaction ledger</span>
        </div>
      </div>

      {/* 3.6 A. Banks Summary Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-3 w-14 text-center">Sr.</th>
                <th className="py-3 px-4 w-60">Bank Name</th>
                <th className="py-3 px-4 w-64 font-mono">Account Number</th>
                <th className="py-3 px-4">Account Title</th>
                <th className="py-3 px-4 text-right w-44">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSummary.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No bank accounts found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredSummary.map((acc, index) => {
                  return (
                    <tr key={acc.id} className="hover:bg-blue-50/30 transition-colors">
                      {/* Sr. Auto-generated */}
                      <td className="py-3 px-3 text-center font-mono text-slate-500 font-medium">
                        {index + 1}
                      </td>

                      {/* Bank Name (Fetched from associated bank account) */}
                      <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>{acc.bankName}</span>
                      </td>

                      {/* Account Number (Clickable -> redirects to Bank Account Details) */}
                      <td className="py-3 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onSelectAccountDetails(acc.id)}
                          className="group inline-flex items-center gap-1.5 text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
                          title={`Click to open Bank Account Details for ${acc.accountNumber}`}
                        >
                          <span>{acc.accountNumber}</span>
                          <ExternalLink className="w-3 h-3 text-blue-400 group-hover:text-blue-700 transition-colors" />
                        </button>
                      </td>

                      {/* Account Title */}
                      <td className="py-3 px-4 text-slate-800 font-medium">
                        {acc.accountTitle}
                      </td>

                      {/* Balance (Display current balance of associated bank account) */}
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold whitespace-nowrap">
                        <span
                          className={`text-sm ${
                            acc.currentBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {acc.currentBalance.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* 3.6 B. Display the total balance of all listed bank accounts at the end of the table */}
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-300 font-bold text-xs text-slate-900">
                <td colSpan={4} className="py-3.5 px-4 text-right uppercase tracking-wider text-[11px] text-slate-700">
                  Total Balance (All Listed Bank Accounts):
                </td>
                <td className="py-3.5 px-4 text-right font-mono tabular-nums text-blue-900 text-sm whitespace-nowrap">
                  {totalAllBankAccountsBalance.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
