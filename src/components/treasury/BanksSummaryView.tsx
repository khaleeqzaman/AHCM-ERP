import React, { useState } from 'react';
import { 
  Landmark, 
  Search, 
  ExternalLink, 
  ArrowRight, 
  Wallet, 
  Building2, 
  CreditCard,
  Download,
  Printer,
  X,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';
import { BankAccountRecord } from '../../types/treasury';
import { formatWholeNumber } from '../../utils/formatters';
import { printConcernedTable } from '../../utils/printTable';
import { exportUniversalCsv } from '../../utils/exportCsv';
import { PrintDocumentHeader } from '../common/PrintDocumentHeader';

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
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Calculate current balance, deposits, and withdrawals for each bank account
  const accountsWithCalculatedBalance = bankAccounts.map((acc, index) => {
    const totalDeposit = (acc.transactions || []).reduce(
      (sum, t) => sum + (Number(t.depositDebit) || 0),
      0
    );
    const totalWithdrawal = (acc.transactions || []).reduce(
      (sum, t) => sum + (Number(t.withdrawalPayment) || 0),
      0
    );
    const currentBalance = (acc.openingBalance || 0) + totalDeposit - totalWithdrawal;

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

  const totalAllDeposits = accountsWithCalculatedBalance.reduce(
    (sum, acc) => sum + acc.totalDeposit,
    0
  );

  const totalAllWithdrawals = accountsWithCalculatedBalance.reduce(
    (sum, acc) => sum + acc.totalWithdrawal,
    0
  );

  const totalFilteredBalance = filteredSummary.reduce(
    (sum, acc) => sum + acc.currentBalance,
    0
  );

  // Export to CSV Handler
  const handleExportCSV = () => {
    if (filteredSummary.length === 0) {
      alert('No bank account records available to export.');
      return;
    }

    const headers = [
      'Sr. No.',
      'Bank Name',
      'Account Number',
      'Account Title',
      'Opening Balance (PKR)',
      'Total Deposits (PKR)',
      'Total Withdrawals (PKR)',
      'Current Net Balance (PKR)',
    ];

    const rows = filteredSummary.map((acc, idx) => [
      idx + 1,
      acc.bankName,
      acc.accountNumber,
      acc.accountTitle,
      Math.round(acc.openingBalance || 0),
      Math.round(acc.totalDeposit),
      Math.round(acc.totalWithdrawal),
      Math.round(acc.currentBalance),
    ]);

    exportUniversalCsv(`Banks_Summary_Report_${new Date().toISOString().slice(0, 10)}.csv`, {
      tableName: 'Consolidated Banks Summary Table',
      reportDate: new Date().toLocaleDateString('en-GB'),
      headers,
      rows,
      totalsRow: [
        'Totals',
        '',
        '',
        '',
        Math.round(filteredSummary.reduce((s, a) => s + (a.openingBalance || 0), 0)),
        Math.round(filteredSummary.reduce((s, a) => s + a.totalDeposit, 0)),
        Math.round(filteredSummary.reduce((s, a) => s + a.totalWithdrawal, 0)),
        Math.round(totalFilteredBalance),
      ],
    });

    setNotification(`Banks Summary successfully exported (${filteredSummary.length} accounts).`);
    setTimeout(() => setNotification(null), 3000);
  };

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

        {/* Action Buttons: Export CSV, Print Summary, Add Account */}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-emerald-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-2xs cursor-pointer"
            title="Export Banks Summary to CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() =>
              printConcernedTable('printable-banks-summary-table', 'Banks Summary Table', {
                tableName: 'Banks Summary Table',
                reportDate: new Date().toLocaleDateString('en-GB'),
              })
            }
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-800 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded-lg transition-colors shadow-2xs cursor-pointer"
            title="Print Banks Summary table only"
          >
            <Printer className="w-3.5 h-3.5 text-blue-700" />
            <span>Print View (Table Only)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-blue-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-2xs cursor-pointer"
            title="Print formal Banks Summary statement"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
            <span>Formal Statement</span>
          </button>

          <button
            type="button"
            onClick={onNavigateToAddAccount}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Add Bank Account</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{notification}</span>
        </div>
      )}

      {/* Aggregate Balance Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-semibold text-blue-200 block tracking-wider">
            Consolidated Treasury Bank Reserves
          </span>
          <span className="text-2xl font-bold font-mono tabular-nums text-white mt-1 block">
            PKR {formatWholeNumber(totalAllBankAccountsBalance)}
          </span>
          <span className="text-xs text-blue-200/80 mt-0.5 block">
            Combined live liquid balance across all {bankAccounts.length} active enterprise bank accounts
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-blue-800/60 border border-blue-700/60 flex items-center gap-3">
            <Wallet className="w-6 h-6 text-blue-300 shrink-0" />
            <div className="text-xs">
              <span className="text-blue-200 block">Bank Accounts Active:</span>
              <span className="font-bold text-white font-mono text-sm">{bankAccounts.length} Accounts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
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

      {/* Banks Summary Table */}
      <div id="printable-banks-summary-table" className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs print-concerned-table">
        {/* Print only formal header */}
        <div className="hidden print:block print-only-header p-4 border-b border-slate-200 text-center">
          <h1 className="text-base font-bold text-slate-900">AL-HAMD COAL MINES & METALS (PVT) LTD.</h1>
          <p className="text-xs text-slate-700 font-semibold uppercase tracking-wider">Treasury Department - Consolidated Banks Summary</p>
          <p className="text-[10px] text-slate-500">Printed on {new Date().toLocaleDateString('en-GB')}</p>
        </div>

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
                          PKR {formatWholeNumber(acc.currentBalance)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Display the total balance of all listed bank accounts at the end of the table */}
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-300 font-bold text-xs text-slate-900">
                <td colSpan={4} className="py-3.5 px-4 text-right uppercase tracking-wider text-[11px] text-slate-700">
                  Total Balance ({filteredSummary.length} Bank Accounts):
                </td>
                <td className="py-3.5 px-4 text-right font-mono tabular-nums text-blue-900 text-sm whitespace-nowrap">
                  PKR {formatWholeNumber(totalFilteredBalance)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ==================================================== */}
      {/* FORMAL PRINT MODAL: CONSOLIDATED BANKS SUMMARY */}
      {/* ==================================================== */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 space-y-6 shadow-2xl border border-slate-200 text-slate-900 max-h-[90vh] overflow-y-auto">
            {/* Modal Controls */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 no-print">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Print Banks Summary Statement
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => printConcernedTable('printable-banks-summary-formal-report', 'Consolidated Banks Summary Statement')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Formal Report Layout */}
            <div id="printable-banks-summary-formal-report" className="border border-slate-800 rounded-xl p-6 space-y-4 bg-white text-slate-900 print-concerned-table">
              <PrintDocumentHeader
                tableName="Consolidated Enterprise Banks Summary & Liquidity Statement"
                date={new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                subtitle="Treasury & Banking Audit Department"
              />

              {/* Summary KPIs Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Statement Date:</span>
                  <span className="font-semibold text-slate-900">
                    {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Active Accounts:</span>
                  <span className="font-semibold font-mono text-slate-900">
                    {filteredSummary.length} Bank Accounts
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Inflows (Deposits):</span>
                  <span className="font-semibold font-mono text-emerald-700">
                    PKR {formatWholeNumber(totalAllDeposits)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Consolidated Reserves:</span>
                  <span className="font-semibold font-mono text-blue-700 text-sm">
                    PKR {formatWholeNumber(totalFilteredBalance)}
                  </span>
                </div>
              </div>

              {/* Accounts Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b-2 border-slate-800 bg-slate-100 text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                      <th className="py-2 px-2 text-center w-10">Sr.</th>
                      <th className="py-2 px-3">Bank Name</th>
                      <th className="py-2 px-3 font-mono">Account Number</th>
                      <th className="py-2 px-3">Account Title</th>
                      <th className="py-2 px-3 text-right">Opening Bal</th>
                      <th className="py-2 px-3 text-right">Deposits</th>
                      <th className="py-2 px-3 text-right">Withdrawals</th>
                      <th className="py-2 px-3 text-right">Current Net Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredSummary.map((acc, idx) => (
                      <tr key={acc.id} className="text-slate-800">
                        <td className="py-2 px-2 text-center font-mono">{idx + 1}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">{acc.bankName}</td>
                        <td className="py-2 px-3 font-mono font-bold whitespace-nowrap">{acc.accountNumber}</td>
                        <td className="py-2 px-3 text-slate-700">{acc.accountTitle}</td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums">
                          {formatWholeNumber(acc.openingBalance || 0)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums text-emerald-700">
                          {formatWholeNumber(acc.totalDeposit)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums text-rose-700">
                          {formatWholeNumber(acc.totalWithdrawal)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                          {formatWholeNumber(acc.currentBalance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-800 bg-slate-50 font-bold">
                      <td colSpan={4} className="py-2.5 px-3 text-right uppercase tracking-wider text-slate-800">
                        Consolidated Enterprise Bank Totals:
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {formatWholeNumber(filteredSummary.reduce((s, a) => s + (a.openingBalance || 0), 0))}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-800">
                        {formatWholeNumber(filteredSummary.reduce((s, a) => s + a.totalDeposit, 0))}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-rose-800">
                        {formatWholeNumber(filteredSummary.reduce((s, a) => s + a.totalWithdrawal, 0))}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-sm text-blue-900">
                        PKR {formatWholeNumber(totalFilteredBalance)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Formal Signatures */}
              <div className="pt-10 grid grid-cols-3 gap-6 text-center text-xs">
                <div>
                  <div className="border-b border-slate-400 pb-1 mb-1 font-semibold text-slate-800">
                    Treasury Cashier / Bank Officer
                  </div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Prepared By</span>
                </div>
                <div>
                  <div className="border-b border-slate-400 pb-1 mb-1 font-semibold text-slate-800">
                    Internal Auditor / Head of Accounts
                  </div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Verified By</span>
                </div>
                <div>
                  <div className="border-b border-slate-400 pb-1 mb-1 font-semibold text-slate-800">
                    Chief Executive / Managing Director
                  </div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Approved By</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
