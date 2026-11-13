import React, { useState, useEffect, useMemo } from 'react';
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
  X,
  Download,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { 
  ChartAccount, 
  VoucherDocument, 
  LedgerEntry 
} from '../../types/accounting';
import { formatWholeNumber } from '../../utils/formatters';
import { exportUniversalCsv } from '../../utils/exportCsv';
import { printConcernedTable } from '../../utils/printTable';
import { PrintDocumentHeader } from '../common/PrintDocumentHeader';

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
  const [exportSuccess, setExportSuccess] = useState(false);

  // Pagination & Show All State
  const [pageSize, setPageSize] = useState<number | 'all'>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);

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

  const allLedgerEntries = useMemo(() => {
    return compileLedgerEntries();
  }, [selectedAccount, vouchers]);

  // Apply search & date range filters
  const filteredEntries = useMemo(() => {
    return allLedgerEntries.filter((e) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        e.voucherNo.toLowerCase().includes(q) ||
        e.particulars.toLowerCase().includes(q) ||
        e.referenceNo.toLowerCase().includes(q) ||
        e.date.includes(q);

      const matchesStartDate = !startDate || e.date >= startDate;
      const matchesEndDate = !endDate || e.date <= endDate;

      return matchesSearch && matchesStartDate && matchesEndDate;
    });
  }, [allLedgerEntries, searchTerm, startDate, endDate]);

  // Reset to page 1 whenever filters or account change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedAccountId, searchTerm, startDate, endDate, pageSize]);

  // Pagination Calculations
  const totalFilteredCount = filteredEntries.length;
  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalFilteredCount / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const displayedEntries = useMemo(() => {
    if (pageSize === 'all') return filteredEntries;
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return filteredEntries.slice(startIndex, startIndex + pageSize);
  }, [filteredEntries, safeCurrentPage, pageSize]);

  const startIndexDisplay = totalFilteredCount === 0 
    ? 0 
    : pageSize === 'all' 
    ? 1 
    : (safeCurrentPage - 1) * pageSize + 1;
  const endIndexDisplay = pageSize === 'all' 
    ? totalFilteredCount 
    : Math.min(safeCurrentPage * pageSize, totalFilteredCount);

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

  // Export General Ledger to CSV
  const handleExportCsv = () => {
    if (!selectedAccount) return;

    const headers = [
      'Sr',
      'Date',
      'Voucher No',
      'Type',
      'Reference No',
      'Particulars',
      'Debit (PKR)',
      'Credit (PKR)',
      'Running Balance (PKR)'
    ];

    const rows = filteredEntries.map((e, idx) => [
      idx + 1,
      e.date || '',
      e.voucherNo || '',
      getTypeCode(e.voucherType),
      e.referenceNo || '',
      e.particulars || '',
      e.debit,
      e.credit,
      e.runningBalance,
    ]);

    const dateRangeLabel = startDate || endDate
      ? `${startDate || 'Earliest'} to ${endDate || 'Latest'}`
      : new Date().toISOString().slice(0, 10);

    exportUniversalCsv(`general_ledger_${selectedAccount.code}_${new Date().toISOString().slice(0, 10)}.csv`, {
      tableName: `General Ledger - [${selectedAccount.code}] ${selectedAccount.name}`,
      reportDate: dateRangeLabel,
      headers,
      rows,
      totalsRow: [
        'TOTALS',
        '',
        '',
        '',
        '',
        'TOTAL ACTIVITY & CLOSING BALANCE',
        totalPeriodDebits,
        totalPeriodCredits,
        closingBalance,
      ],
    });

    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
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

        {/* Account Selector & Top Actions */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-slate-600 whitespace-nowrap">
              Account Head:
            </span>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900 shadow-xs max-w-xs sm:max-w-md truncate"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  [{acc.code}] {acc.name} — ({acc.classification})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-xs cursor-pointer"
            title="Export this account ledger to CSV"
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs cursor-pointer"
            title="Open printable Ledger Statement"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Statement</span>
          </button>
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
                <span className="text-slate-400">·</span>
                <span className="text-xs font-medium text-slate-600">
                  {selectedAccount.classification}
                </span>
                <span className="text-slate-400">·</span>
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

          {/* Page Size & Show All Selector */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
            <span className="text-[11px] text-slate-500 font-medium">Rows:</span>
            <select
              value={String(pageSize)}
              onChange={(e) => {
                const val = e.target.value;
                setPageSize(val === 'all' ? 'all' : Number(val));
              }}
              className="px-2 py-1 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-700 font-medium"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="all">Show All ({totalFilteredCount})</option>
            </select>

            <button
              type="button"
              onClick={() => setPageSize((prev) => (prev === 'all' ? 25 : 'all'))}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                pageSize === 'all'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
              title={pageSize === 'all' ? 'Switch to Paginated View (25 per page)' : 'Show All Postings on One Page'}
            >
              {pageSize === 'all' ? 'Paginate' : 'Show All'}
            </button>
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
        </div>
      </div>

      {/* General Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 text-xs font-semibold text-slate-800">
          <span>
            General Ledger Postings ({displayedEntries.length} of {totalFilteredCount} entries)
          </span>
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
              {displayedEntries.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    No postings found for this account. Create and Post vouchers to see chronological ledger activity.
                  </td>
                </tr>
              ) : (
                displayedEntries.map((entry, idx) => {
                  const code = getTypeCode(entry.voucherType);
                  const matchingVoucher = vouchers.find((v) => v.id === entry.voucherId);
                  const serialNo = pageSize === 'all' ? idx + 1 : (safeCurrentPage - 1) * pageSize + idx + 1;

                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                        {serialNo}
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

        {/* Table Footer with Summary & Pagination Controls */}
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span>
                Showing <strong className="text-slate-900 font-mono">{startIndexDisplay}–{endIndexDisplay}</strong> of{' '}
                <strong className="text-slate-900 font-mono">{totalFilteredCount}</strong> ledger postings
                {pageSize !== 'all' && (
                  <span className="text-slate-400 font-mono ml-1">
                    (Page {safeCurrentPage} of {totalPages})
                  </span>
                )}
              </span>
              {pageSize === 'all' && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                  All Records Shown
                </span>
              )}
            </div>

            {/* Pagination Controls */}
            {pageSize !== 'all' && totalPages > 1 && (
              <div className="flex items-center gap-1">
                {/* First Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={safeCurrentPage <= 1}
                  className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  title="First Page"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>

                {/* Prev Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage <= 1}
                  className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {/* Numbered Page Buttons */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => {
                    if (totalPages <= 7) return true;
                    if (p === 1 || p === totalPages) return true;
                    return Math.abs(p - safeCurrentPage) <= 2;
                  })
                  .map((p, idx, arr) => {
                    const prev = arr[idx - 1];
                    const showEllipsis = prev && p - prev > 1;

                    return (
                      <React.Fragment key={p}>
                        {showEllipsis && (
                          <span className="px-1 text-slate-400 select-none font-mono">…</span>
                        )}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(p)}
                          className={`min-w-7 h-7 px-2 text-xs font-mono font-medium rounded-md border transition-colors cursor-pointer ${
                            safeCurrentPage === p
                              ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}

                {/* Next Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage >= totalPages}
                  className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  title="Next Page"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                {/* Last Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={safeCurrentPage >= totalPages}
                  className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  title="Last Page"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Quick Page Size Buttons */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500">Page size:</span>
              <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5 text-[11px] font-mono">
                {[10, 25, 50, 100].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setPageSize(sz)}
                    className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                      pageSize === sz
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPageSize('all')}
                  className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                    pageSize === 'all'
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PRINTABLE GENERAL LEDGER STATEMENT MODAL */}
      {isPrintModalOpen && selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-left space-y-5 max-h-[95vh] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 print:hidden">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Print General Ledger Statement</h3>
                  <p className="text-xs text-slate-500">Official statement for account [{selectedAccount.code}] {selectedAccount.name}</p>
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
                  onClick={() =>
                    printConcernedTable('printable-ledger-statement', 'General Ledger Statement', {
                      tableName: `General Ledger - [${selectedAccount.code}] ${selectedAccount.name}`,
                      reportDate: startDate || endDate ? `${startDate || 'Earliest'} to ${endDate || 'Present'}` : undefined,
                    })
                  }
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
            <div id="printable-ledger-statement" className="border border-slate-800 rounded-xl p-6 space-y-4 bg-white text-slate-900 print-concerned-table">
              <PrintDocumentHeader
                tableName={`General Ledger: [${selectedAccount.code}] ${selectedAccount.name}`}
                date={startDate || endDate ? `${startDate || 'Earliest'} to ${endDate || 'Present'}` : undefined}
                subtitle="Financial Accounting & General Ledger Division"
              />

              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div>
                  <div className="font-bold text-sm text-slate-900">{selectedAccount.name}</div>
                  <div className="font-mono text-emerald-800 font-bold mt-0.5">
                    Account Code: {selectedAccount.code}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {selectedAccount.classification} ({selectedAccount.accountType}) · Normal Balance: {selectedAccount.normalBalance} Side
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div>
                    <span className="text-slate-500">Opening Balance: </span>
                    <span className="font-mono font-bold">PKR {formatWholeNumber(selectedAccount.openingBalance)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Period Debits / Credits: </span>
                    <span className="font-mono font-bold">+{formatWholeNumber(totalPeriodDebits)} / -{formatWholeNumber(totalPeriodCredits)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Closing Balance: </span>
                    <span className="font-mono font-bold text-emerald-800 text-sm">PKR {formatWholeNumber(closingBalance)}</span>
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
                    <tr className="bg-slate-100 border-t-2 border-slate-800 font-bold text-[11px]">
                      <td colSpan={4} className="py-1.5 px-2 text-right uppercase">
                        Totals ({filteredEntries.length} Postings):
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono">
                        PKR {formatWholeNumber(totalPeriodDebits)}
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono">
                        PKR {formatWholeNumber(totalPeriodCredits)}
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono text-emerald-800 font-bold">
                        PKR {formatWholeNumber(closingBalance)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Signatures Block */}
              <div className="pt-8 grid grid-cols-3 gap-6 text-center text-[10px] text-slate-600">
                <div className="border-t border-slate-300 pt-2">
                  <div className="font-semibold text-slate-800">Prepared By</div>
                  <div className="text-slate-500 mt-0.5">Senior Ledger Accountant</div>
                </div>
                <div className="border-t border-slate-300 pt-2">
                  <div className="font-semibold text-slate-800">Verified By</div>
                  <div className="text-slate-500 mt-0.5">Internal Audit Head</div>
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
