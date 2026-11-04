import React from 'react';
import { 
  Scale, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  Download,
  Calendar
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

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            As of Oct 2026
          </span>
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
    </div>
  );
};
