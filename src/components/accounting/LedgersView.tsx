import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Filter, 
  ArrowRight, 
  Calendar, 
  Printer, 
  Layers, 
  CheckCircle2, 
  ExternalLink,
  RotateCcw,
  Building2,
  FileText,
  X
} from 'lucide-react';
import { 
  ChartAccount, 
  VoucherDocument, 
  LedgerEntry 
} from '../../types/accounting';
import { formatWholeNumber } from '../../utils/formatters';

interface LedgersViewProps {
  accounts: ChartAccount[];
  vouchers: VoucherDocument[];
  onViewVoucherDetails?: (voucher: VoucherDocument) => void;
}

export const LedgersView: React.FC<LedgersViewProps> = ({
  accounts,
  vouchers,
  onViewVoucherDetails,
}) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    accounts[0]?.id || ''
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const selectedAccount =
    accounts.find((a) => a.id === selectedAccountId) || accounts[0];

  // Compile immutable General Ledger entries from POSTED vouchers only
  const compileLedgerEntries = (): (LedgerEntry & { lineId: string; referenceNo: string })[] => {
    if (!selectedAccount) return [];

    const entries: (LedgerEntry & { lineId: string; referenceNo: string })[] = [];

    // General Ledger only includes officially Posted vouchers per standard financial accounting standards
    const postedVouchers = vouchers.filter((v) => v.status === 'Posted');

    postedVouchers.forEach((v) => {
      v.lines.forEach((l) => {
        if (l.accountId === selectedAccount.id) {
          entries.push({
            id: `${v.id}-${l.id}`,
            voucherId: v.id,
            lineId: l.id,
            voucherNo: v.voucherNo,
            voucherType: v.voucherType,
            date: v.date,
            accountId: l.accountId,
            accountCode: l.accountCode,
            accountName: l.accountName,
            particulars: l.description || v.narration,
            debit: Math.round(Number(l.debit) || 0),
            credit: Math.round(Number(l.credit) || 0),
            runningBalance: 0,
            referenceNo: v.referenceNo || '—',
          });
        }
      });
    });

    // Sort chronologically by date
    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Compute running balance based on normal balance (Debit vs Credit)
    let running = selectedAccount.openingBalance;
    const isDebitNormal = selectedAccount.normalBalance === 'Debit';

    return entries.map((item) => {
      if (isDebitNormal) {
        running = running + item.debit - item.credit;
      } else {
        running = running + item.credit - item.debit;
      }
      return {
        ...item,
        runningBalance: Math.round(running),
      };
    });
  };

  const allLedgerEntries = compileLedgerEntries();

  // Apply search & date range filters
  const filteredEntries = allLedgerEntries.filter((e) => {
    const matchesSearch =
      e.voucherNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.particulars.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.referenceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.date.includes(searchTerm);

    const matchesStartDate = !startDate || e.date >= startDate;
    const matchesEndDate = !endDate || e.date <= endDate;

    return matchesSearch && matchesStartDate && matchesEndDate;
  });

  const totalPeriodDebits = filteredEntries.reduce((sum, e) => sum + e.debit, 0);
  const totalPeriodCredits = filteredEntries.reduce((sum, e) => sum + e.credit, 0);
  const closingBalance =
    filteredEntries.length > 0
      ? filteredEntries[filteredEntries.length - 1].runningBalance
      : selectedAccount?.openingBalance || 0;

  const handleClearFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
  };

  const getTypeCode = (typeStr: string): string => {
    if (typeStr.startsWith('CP')) return 'CP';
    if (typeStr.startsWith('CR')) return 'CR';
    if (typeStr.startsWith('BP')) return 'BP';
    if (typeStr.startsWith('BR')) return 'BR';
    return 'JV';
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              General Ledger
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">Official Books of Account</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            General Ledger (GL Register)
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Immutable chronological transaction postings compiled from posted vouchers with running balances and opening positions.
          </p>
        </div>

        {/* Account Selector Dropdown */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-medium text-slate-600 whitespace-nowrap">
            Account Head:
          </span>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900 shadow-xs max-w-xs sm:max-w-md truncate"
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                [{acc.code}] {acc.name} — ({acc.classification})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Account Info Card */}
      {selectedAccount && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                  {selectedAccount.code}
                </span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs font-medium text-slate-600">
                  {selectedAccount.classification}
                </span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-500">
                  Group: {selectedAccount.groupName}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-1">
                {selectedAccount.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedAccount.description || 'General ledger sub-account balance ledger.'}
              </p>
            </div>

            {/* Balances Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t lg:border-t-0 lg:border-l border-slate-200 pt-3 lg:pt-0 lg:pl-6 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Normal Balance</span>
                <span className="font-bold text-slate-800 font-mono">
                  {selectedAccount.normalBalance} Side
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Opening Balance</span>
                <span className="font-bold text-slate-900 font-mono tabular-nums">
                  PKR {formatWholeNumber(selectedAccount.openingBalance)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Period Debits / Credits</span>
                <span className="font-bold text-slate-700 font-mono tabular-nums">
                  +{formatWholeNumber(totalPeriodDebits)} / -{formatWholeNumber(totalPeriodCredits)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Closing Balance</span>
                <span className="font-bold text-emerald-700 font-mono tabular-nums text-sm">
                  PKR {formatWholeNumber(closingBalance)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Date Range & Search Filtering Toolbar */}
      <div className="bg-white p-3.5 border border-slate-200 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search memo, voucher #, reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium text-[11px]">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium text-[11px]">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>

          {(startDate || endDate || searchTerm) && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Reset
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-xs cursor-pointer ml-auto"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Ledger</span>
          </button>
        </div>
      </div>

      {/* General Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 text-xs font-semibold text-slate-800">
          <span>General Ledger Postings ({filteredEntries.length} entries)</span>
          <span className="text-slate-500 font-normal">
            Reflecting all Posted double-entry vouchers
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-2.5 px-3 w-12 text-center">Sr.</th>
                <th className="py-2.5 px-3 w-28">Date</th>
                <th className="py-2.5 px-3 font-mono">Voucher No.</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Reference</th>
                <th className="py-2.5 px-4">Particulars / Description</th>
                <th className="py-2.5 px-3 w-28 text-right">Debit (PKR)</th>
                <th className="py-2.5 px-3 w-28 text-right">Credit (PKR)</th>
                <th className="py-2.5 px-3 w-32 text-right">Running Balance</th>
                <th className="py-2.5 px-3 w-14 text-center">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    No postings found for this account. Create and Post vouchers to see chronological ledger activity.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry, idx) => {
                  const code = getTypeCode(entry.voucherType);
                  const matchingVoucher = vouchers.find((v) => v.id === entry.voucherId);

                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700 whitespace-nowrap">
                        {entry.date}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-700 whitespace-nowrap">
                        {entry.voucherNo}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                            code === 'CP'
                              ? 'bg-amber-100 text-amber-900'
                              : code === 'CR'
                              ? 'bg-emerald-100 text-emerald-900'
                              : code === 'BP'
                              ? 'bg-blue-100 text-blue-900'
                              : code === 'BR'
                              ? 'bg-cyan-100 text-cyan-900'
                              : 'bg-purple-100 text-purple-900'
                          }`}
                        >
                          {code}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {entry.referenceNo || '—'}
                      </td>
                      <td className="py-2.5 px-4 text-slate-800 font-medium">
                        {entry.particulars}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                        {entry.debit > 0 ? formatWholeNumber(entry.debit) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                        {entry.credit > 0 ? formatWholeNumber(entry.credit) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-emerald-700 whitespace-nowrap">
                        PKR {formatWholeNumber(entry.runningBalance)}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {matchingVoucher && onViewVoucherDetails && (
                          <button
                            type="button"
                            onClick={() => onViewVoucherDetails(matchingVoucher)}
                            className="p-1 rounded text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                            title="Inspect source voucher in Voucher Register"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-200 font-bold text-xs">
                <td colSpan={6} className="py-2.5 px-4 text-right uppercase text-[11px] text-slate-700">
                  Total Activity & Closing Position:
                </td>
                <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-900 font-bold">
                  {formatWholeNumber(totalPeriodDebits)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-900 font-bold">
                  {formatWholeNumber(totalPeriodCredits)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono tabular-nums text-emerald-800 font-bold text-sm">
                  PKR {formatWholeNumber(closingBalance)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* PRINTABLE GENERAL LEDGER STATEMENT MODAL */}
      {isPrintModalOpen && selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-left space-y-5 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 print:hidden">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Print Ledger Statement
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs cursor-pointer"
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

            {/* Document Content */}
            <div className="border border-slate-800 rounded-xl p-6 space-y-4 bg-white text-slate-900">
              <div className="text-center pb-3 border-b border-slate-800">
                <h2 className="text-base font-extrabold uppercase tracking-wider">
                  AL-HAMD COAL MINES & METALS
                </h2>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mt-0.5">
                  General Ledger Account Statement
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  Generated as of {new Date().toISOString().split('T')[0]} · Financial Year 2026
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded border border-slate-200">
                <div>
                  <div className="font-bold text-sm text-slate-900">{selectedAccount.name}</div>
                  <div className="font-mono text-emerald-800 font-bold mt-0.5">
                    Account Code: {selectedAccount.code}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {selectedAccount.classification} ({selectedAccount.accountType})
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div>
                    <span className="text-slate-500">Opening Balance: </span>
                    <span className="font-mono font-bold">PKR {formatWholeNumber(selectedAccount.openingBalance)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Closing Balance: </span>
                    <span className="font-mono font-bold text-emerald-800">PKR {formatWholeNumber(closingBalance)}</span>
                  </div>
                </div>
              </div>

              {/* Ledger Rows Table */}
              <div className="border border-slate-300 rounded overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-[10px] font-bold border-b border-slate-300 uppercase">
                      <th className="py-1.5 px-2 w-8 text-center">Sr.</th>
                      <th className="py-1.5 px-2 w-20">Date</th>
                      <th className="py-1.5 px-2 w-24 font-mono">Voucher #</th>
                      <th className="py-1.5 px-2">Particulars</th>
                      <th className="py-1.5 px-2 w-24 text-right">Debit (PKR)</th>
                      <th className="py-1.5 px-2 w-24 text-right">Credit (PKR)</th>
                      <th className="py-1.5 px-2 w-28 text-right">Balance (PKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-[11px]">
                    {filteredEntries.map((e, i) => (
                      <tr key={e.id}>
                        <td className="py-1 px-2 text-center font-mono">{i + 1}</td>
                        <td className="py-1 px-2 font-mono">{e.date}</td>
                        <td className="py-1 px-2 font-mono font-bold">{e.voucherNo}</td>
                        <td className="py-1 px-2">{e.particulars}</td>
                        <td className="py-1 px-2 text-right font-mono font-semibold">
                          {e.debit > 0 ? formatWholeNumber(e.debit) : '—'}
                        </td>
                        <td className="py-1 px-2 text-right font-mono font-semibold">
                          {e.credit > 0 ? formatWholeNumber(e.credit) : '—'}
                        </td>
                        <td className="py-1 px-2 text-right font-mono font-bold text-slate-900">
                          {formatWholeNumber(e.runningBalance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 border-t border-slate-800 font-bold text-[11px]">
                      <td colSpan={4} className="py-1.5 px-2 text-right uppercase">
                        Totals:
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono">
                        {formatWholeNumber(totalPeriodDebits)}
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono">
                        {formatWholeNumber(totalPeriodCredits)}
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono text-emerald-800">
                        {formatWholeNumber(closingBalance)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
