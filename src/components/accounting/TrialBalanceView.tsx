import React, { useState } from 'react';
import { 
  Scale, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  Download,
  Calendar,
  X,
  FileSpreadsheet,
  Check
} from 'lucide-react';
import { ChartAccount, VoucherDocument } from '../../types/accounting';
import { formatWholeNumber } from '../../utils/formatters';

interface TrialBalanceViewProps {
  accounts: ChartAccount[];
  vouchers: VoucherDocument[];
}

export const TrialBalanceView: React.FC<TrialBalanceViewProps> = ({
  accounts,
  vouchers,
}) => {
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Compute net balance for each account: opening balance + posted debits/credits
  const trialBalanceRows = accounts.map((acc) => {
    let debits = 0;
    let credits = 0;

    // Standard GAAP: Only Posted vouchers impact General Ledger and Trial Balance
    const postedVouchers = vouchers.filter((v) => v.status === 'Posted');

    postedVouchers.forEach((v) => {
      v.lines.forEach((l) => {
        if (l.accountId === acc.id) {
          debits += Number(l.debit) || 0;
          credits += Number(l.credit) || 0;
        }
      });
    });

    let debitBal = 0;
    let creditBal = 0;

    if (acc.normalBalance === 'Debit') {
      const net = acc.openingBalance + debits - credits;
      if (net >= 0) debitBal = net;
      else creditBal = Math.abs(net);
    } else {
      const net = acc.openingBalance + credits - debits;
      if (net >= 0) creditBal = net;
      else debitBal = Math.abs(net);
    }

    return {
      ...acc,
      periodDebits: debits,
      periodCredits: credits,
      debitBal: Math.round(debitBal),
      creditBal: Math.round(creditBal),
    };
  });

  const totalDebits = Math.round(
    trialBalanceRows.reduce((sum, r) => sum + r.debitBal, 0)
  );
  const totalCredits = Math.round(
    trialBalanceRows.reduce((sum, r) => sum + r.creditBal, 0)
  );
  const difference = Math.abs(totalDebits - totalCredits);
  const isBalanced = difference === 0;

  // Export Trial Balance to CSV
  const handleExportCsv = () => {
    const headers = [
      'Account Code',
      'Account Title',
      'Account Type',
      'Normal Balance',
      'Period Debits (PKR)',
      'Period Credits (PKR)',
      'Debit Balance (PKR)',
      'Credit Balance (PKR)'
    ];

    const rows = trialBalanceRows.map((r) => [
      `"${r.code || ''}"`,
      `"${(r.name || '').replace(/"/g, '""')}"`,
      `"${r.accountType || ''}"`,
      `"${r.normalBalance || ''}"`,
      r.periodDebits,
      r.periodCredits,
      r.debitBal,
      r.creditBal
    ]);

    // Append Total Row
    rows.push([
      '"TOTAL TRIAL BALANCE"',
      '""',
      '""',
      '""',
      trialBalanceRows.reduce((sum, r) => sum + r.periodDebits, 0),
      trialBalanceRows.reduce((sum, r) => sum + r.periodCredits, 0),
      totalDebits,
      totalCredits
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `trial_balance_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Financial Integrity
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">Double-Entry Verification</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <Scale className="w-5 h-5 text-emerald-600" />
            Standard Trial Balance
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Mathematical proof that total debit balances equal total credit balances across all active ledger heads.
          </p>
        </div>

        {/* Action Controls: Export CSV and Print */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            As of Oct 2026
          </span>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer shadow-xs"
            title="Export Trial Balance to CSV file"
          >
            {exportSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Exported</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export CSV</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer shadow-xs"
            title="Open printable Trial Balance sheet"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Sheet</span>
          </button>
        </div>
      </div>

      {/* Equilibrium Status Banner */}
      <div
        className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs ${
          isBalanced
            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
            : 'bg-rose-50 border-rose-200 text-rose-950'
        }`}
      >
        <div className="flex items-center gap-3">
          {isBalanced ? (
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
          )}
          <div>
            <h3 className="text-sm font-bold">
              {isBalanced
                ? 'Trial Balance in Complete Equilibrium'
                : 'Trial Balance Out of Equilibrium'}
            </h3>
            <p className="text-xs opacity-90">
              {isBalanced
                ? `Total Debit Balances (${formatWholeNumber(totalDebits)}) exactly balance Total Credit Balances (${formatWholeNumber(totalCredits)}).`
                : `Net Discrepancy of ${formatWholeNumber(difference)}. Check unposted or modified double-entry vouchers.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono font-bold shrink-0">
          <div>
            <span className="text-[10px] text-slate-500 uppercase block font-sans">
              Total Dr
            </span>
            <span>{formatWholeNumber(totalDebits)}</span>
          </div>
          <span className="text-slate-300">|</span>
          <div>
            <span className="text-[10px] text-slate-500 uppercase block font-sans">
              Total Cr
            </span>
            <span>{formatWholeNumber(totalCredits)}</span>
          </div>
        </div>
      </div>

      {/* Trial Balance Sheet */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4 font-mono w-32">T-C-GG-SSS</th>
                <th className="py-3 px-4">Account Title</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-center">Normal</th>
                <th className="py-3 px-4 text-right">Debit Balance</th>
                <th className="py-3 px-4 text-right">Credit Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {trialBalanceRows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2.5 px-4 font-mono font-bold text-emerald-700 whitespace-nowrap">
                    {row.code}
                  </td>
                  <td className="py-2.5 px-4 font-medium text-slate-900">
                    {row.name}
                  </td>
                  <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">
                    {row.accountType}
                  </td>
                  <td className="py-2.5 px-4 text-center font-mono text-[11px] text-slate-500">
                    {row.normalBalance}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                    {row.debitBal > 0
                      ? formatWholeNumber(row.debitBal)
                      : '—'}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                    {row.creditBal > 0
                      ? formatWholeNumber(row.creditBal)
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-300 font-bold text-xs">
                <td colSpan={4} className="py-3 px-4 text-right uppercase tracking-wider text-slate-800">
                  Total Trial Balance:
                </td>
                <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-800 font-bold text-sm">
                  {formatWholeNumber(totalDebits)}
                </td>
                <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-800 font-bold text-sm">
                  {formatWholeNumber(totalCredits)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* =========================================================
          PRINT PREVIEW MODAL FOR TRIAL BALANCE TABLE
          ========================================================= */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 max-w-4xl w-full p-6 shadow-xl space-y-4 max-h-[92vh] flex flex-col">
            {/* Modal Actions */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Print Trial Balance Sheet</h3>
                  <p className="text-xs text-slate-500">Official statement of ledger accounts equilibrium</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Download CSV</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Preview Container */}
            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg p-6 bg-white space-y-4 text-xs font-sans print:border-0 print:p-0">
              {/* Document Header */}
              <div className="text-center pb-3 border-b-2 border-slate-900 space-y-1">
                <h1 className="text-lg font-bold uppercase tracking-wider text-slate-900">
                  AHCM Mining & Trading Enterprises
                </h1>
                <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-600">
                  Official Standard Trial Balance Sheet
                </h2>
                <div className="text-[10px] text-slate-500 font-mono">
                  As of Oct 2026 · Printed On: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-wider mt-1 bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {isBalanced ? '✓ Balanced (Equilibrium Confirmed)' : '⚠ Discrepancy Found'}
                </div>
              </div>

              {/* Printable Table */}
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="border-b border-slate-400 bg-slate-100 font-bold text-slate-900">
                    <th className="py-2 px-3 font-mono">Account Code</th>
                    <th className="py-2 px-3">Account Title</th>
                    <th className="py-2 px-3">Account Type</th>
                    <th className="py-2 px-3 text-center">Normal</th>
                    <th className="py-2 px-3 text-right">Debit Balance (PKR)</th>
                    <th className="py-2 px-3 text-right">Credit Balance (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {trialBalanceRows.map((row) => (
                    <tr key={row.id}>
                      <td className="py-1.5 px-3 font-mono font-bold text-slate-800">{row.code}</td>
                      <td className="py-1.5 px-3 text-slate-900 font-medium">{row.name}</td>
                      <td className="py-1.5 px-3 text-slate-600">{row.accountType}</td>
                      <td className="py-1.5 px-3 text-center font-mono">{row.normalBalance}</td>
                      <td className="py-1.5 px-3 text-right font-mono tabular-nums font-semibold">
                        {row.debitBal > 0 ? formatWholeNumber(row.debitBal) : '—'}
                      </td>
                      <td className="py-1.5 px-3 text-right font-mono tabular-nums font-semibold">
                        {row.creditBal > 0 ? formatWholeNumber(row.creditBal) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-900 font-bold bg-slate-100 text-xs">
                    <td colSpan={4} className="py-2.5 px-3 text-right uppercase tracking-wider text-slate-900">
                      Total Trial Balance:
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-900 font-bold">
                      PKR {formatWholeNumber(totalDebits)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-900 font-bold">
                      PKR {formatWholeNumber(totalCredits)}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Equilibrium Sign-off Block */}
              <div className="pt-8 grid grid-cols-3 gap-6 text-center text-[10px] text-slate-600">
                <div className="border-t border-slate-300 pt-2">
                  <div className="font-semibold text-slate-800">Prepared By</div>
                  <div className="text-slate-500 mt-0.5">Senior Accountant</div>
                </div>
                <div className="border-t border-slate-300 pt-2">
                  <div className="font-semibold text-slate-800">Verified By</div>
                  <div className="text-slate-500 mt-0.5">Finance Auditor</div>
                </div>
                <div className="border-t border-slate-300 pt-2">
                  <div className="font-semibold text-slate-800">Approved By</div>
                  <div className="text-slate-500 mt-0.5">Chief Financial Officer</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
