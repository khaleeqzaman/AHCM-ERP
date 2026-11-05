import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Search, 
  RotateCcw,
  Calendar,
  Layers,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  Download,
  Printer,
  Edit3,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileSpreadsheet,
  Building2,
  Check
} from 'lucide-react';
import { CashBookEntry } from '../../types/treasury';
import { formatWholeNumber } from '../../utils/formatters';
import { DatePickerInput } from '../common/DatePickerInput';

interface CashBookRegisterViewProps {
  entries: CashBookEntry[];
  onAddEntry: (entry: CashBookEntry) => void;
  onUpdateEntry: (
    id: string,
    field: 'date' | 'description' | 'credit' | 'debit',
    value: string | number
  ) => void;
  onDeleteEntry: (id: string) => void;
}

interface DraftTransactionRow {
  id: string;
  date: string;
  description: string;
  credit: number | '';
  debit: number | '';
}

const getTodayFormatted = () => {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

export const CashBookRegisterView: React.FC<CashBookRegisterViewProps> = ({
  entries,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
}) => {
  // Navigation Modes: 'add_transaction' (Table form) vs 'view_cash_book' (Historical register table)
  const [activeMode, setActiveMode] = useState<'add_transaction' | 'view_cash_book'>('add_transaction');

  // Notifications
  const [notification, setNotification] = useState<string | null>(null);

  // ----------------------------------------------------
  // DRAFT FORM STATE (Add Transaction Mode)
  // ----------------------------------------------------
  const [draftRows, setDraftRows] = useState<DraftTransactionRow[]>([
    {
      id: `draft-${Date.now()}-0`,
      date: getTodayFormatted(),
      description: '',
      credit: '',
      debit: '',
    },
  ]);
  const [pendingFocusIndex, setPendingFocusIndex] = useState<number | null>(null);

  // Focus effect when a new row is added via Tab or + button
  useEffect(() => {
    if (pendingFocusIndex !== null) {
      const el = document.getElementById(`draft-desc-${pendingFocusIndex}`);
      if (el) {
        el.focus();
      }
      setPendingFocusIndex(null);
    }
  }, [pendingFocusIndex, draftRows]);

  const handleAddDraftRow = (afterIndex?: number) => {
    const newRow: DraftTransactionRow = {
      id: `draft-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      date: draftRows[draftRows.length - 1]?.date || getTodayFormatted(),
      description: '',
      credit: '',
      debit: '',
    };

    if (afterIndex !== undefined && afterIndex >= 0 && afterIndex < draftRows.length) {
      const copy = [...draftRows];
      copy.splice(afterIndex + 1, 0, newRow);
      setDraftRows(copy);
      setPendingFocusIndex(afterIndex + 1);
    } else {
      setDraftRows((prev) => [...prev, newRow]);
      setPendingFocusIndex(draftRows.length);
    }
  };

  const handleDeleteDraftRow = (index: number) => {
    if (draftRows.length <= 1) {
      // Reset the single row
      setDraftRows([
        {
          id: `draft-${Date.now()}-reset`,
          date: getTodayFormatted(),
          description: '',
          credit: '',
          debit: '',
        },
      ]);
      return;
    }
    setDraftRows((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleDraftFieldChange = (
    index: number,
    field: 'date' | 'description' | 'credit' | 'debit',
    value: string | number
  ) => {
    setDraftRows((prev) =>
      prev.map((row, idx) => {
        if (idx !== index) return row;
        const copy = { ...row };
        if (field === 'date') copy.date = String(value);
        else if (field === 'description') copy.description = String(value);
        else if (field === 'credit') {
          copy.credit = value === '' ? '' : Math.max(0, Math.round(Number(value) || 0));
        } else if (field === 'debit') {
          copy.debit = value === '' ? '' : Math.max(0, Math.round(Number(value) || 0));
        }
        return copy;
      })
    );
  };

  const handleCancelTransaction = () => {
    setDraftRows([
      {
        id: `draft-${Date.now()}-reset`,
        date: getTodayFormatted(),
        description: '',
        credit: '',
        debit: '',
      },
    ]);
    setNotification('Transaction form reset. Blank form ready.');
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSaveTransactions = (e: React.FormEvent) => {
    e.preventDefault();

    // Filter valid rows
    const validRows = draftRows.filter(
      (r) => r.description.trim() !== '' || Number(r.credit) > 0 || Number(r.debit) > 0
    );

    if (validRows.length === 0) {
      alert('Please enter at least one transaction narration or credit/debit amount before saving.');
      return;
    }

    // Save each row sequentially
    validRows.forEach((row, i) => {
      const newEntry: CashBookEntry = {
        id: `cb-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
        srNo: entries.length + 1 + i,
        date: row.date || getTodayFormatted(),
        description: row.description.trim() || 'General Cash Transaction',
        credit: Number(row.credit) || 0,
        debit: Number(row.debit) || 0,
        balance: (Number(row.credit) || 0) - (Number(row.debit) || 0),
      };
      onAddEntry(newEntry);
    });

    // Reset draft form to show fresh new form
    setDraftRows([
      {
        id: `draft-${Date.now()}-clean`,
        date: getTodayFormatted(),
        description: '',
        credit: '',
        debit: '',
      },
    ]);

    setNotification(
      `✓ Successfully saved ${validRows.length} transaction row(s) to Cash Book Register. Fresh form ready.`
    );
    setTimeout(() => setNotification(null), 4000);
  };

  // Draft Totals
  const draftTotalCredit = draftRows.reduce((sum, r) => sum + (Number(r.credit) || 0), 0);
  const draftTotalDebit = draftRows.reduce((sum, r) => sum + (Number(r.debit) || 0), 0);
  const draftTotalBalance = draftTotalCredit - draftTotalDebit;

  // ----------------------------------------------------
  // VIEW CASH BOOK STATE (Filter, Sort, Search, Pagination, Edit, Print)
  // ----------------------------------------------------
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateSortOrder, setDateSortOrder] = useState<'desc' | 'asc'>('desc');
  const [pageSize, setPageSize] = useState<number | 'all'>(50);
  const [currentPage, setCurrentPage] = useState(1);

  // Edit Entry Modal State
  const [editingEntry, setEditingEntry] = useState<CashBookEntry | null>(null);

  // Delete Entry Modal State
  const [entryToDelete, setEntryToDelete] = useState<{
    id: string;
    srNo: number;
    description: string;
  } | null>(null);

  // Print Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Helper date parser (DD-MM-YYYY or YYYY-MM-DD)
  const parseEntryDate = (dStr: string): number => {
    if (!dStr) return 0;
    if (dStr.includes('-')) {
      const parts = dStr.split('-');
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        return new Date(dStr).getTime();
      } else if (parts[2]?.length === 4) {
        // DD-MM-YYYY
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
      }
    }
    return new Date(dStr).getTime() || 0;
  };

  // Filter & Sort View Cash Book Entries
  const filteredAndSortedEntries = useMemo(() => {
    return [...entries]
      .filter((e) => {
        // Search term
        const term = searchTerm.toLowerCase();
        const matchesSearch =
          !searchTerm ||
          e.description.toLowerCase().includes(term) ||
          e.date.includes(term) ||
          String(e.srNo).includes(term) ||
          String(e.credit).includes(term) ||
          String(e.debit).includes(term);

        // Date range
        const entryTime = parseEntryDate(e.date);
        const startTime = startDate ? new Date(startDate).getTime() : 0;
        const endTime = endDate ? new Date(endDate).getTime() + 86400000 : Infinity;
        const matchesDate = entryTime >= startTime && entryTime <= endTime;

        return matchesSearch && matchesDate;
      })
      .sort((a, b) => {
        const timeA = parseEntryDate(a.date);
        const timeB = parseEntryDate(b.date);
        if (dateSortOrder === 'desc') {
          return timeB - timeA || b.srNo - a.srNo;
        } else {
          return timeA - timeB || a.srNo - b.srNo;
        }
      });
  }, [entries, searchTerm, startDate, endDate, dateSortOrder]);

  // Overall Global Totals
  const totalCredit = entries.reduce((sum, e) => sum + (Number(e.credit) || 0), 0);
  const totalDebit = entries.reduce((sum, e) => sum + (Number(e.debit) || 0), 0);
  const totalBalance = totalCredit - totalDebit;

  // Filtered Totals
  const filteredTotalCredit = filteredAndSortedEntries.reduce((sum, e) => sum + (Number(e.credit) || 0), 0);
  const filteredTotalDebit = filteredAndSortedEntries.reduce((sum, e) => sum + (Number(e.debit) || 0), 0);
  const filteredTotalBalance = filteredTotalCredit - filteredTotalDebit;

  // Pagination Logic
  const totalRecords = filteredAndSortedEntries.length;
  const effectivePageSize = pageSize === 'all' ? (totalRecords || 1) : pageSize;
  const totalPages = Math.ceil(totalRecords / effectivePageSize) || 1;

  // Keep currentPage in valid range
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedEntries = useMemo(() => {
    if (pageSize === 'all') return filteredAndSortedEntries;
    const startIdx = (safeCurrentPage - 1) * effectivePageSize;
    return filteredAndSortedEntries.slice(startIdx, startIdx + effectivePageSize);
  }, [filteredAndSortedEntries, safeCurrentPage, effectivePageSize, pageSize]);

  // Export to CSV Handler
  const handleExportCSV = () => {
    if (filteredAndSortedEntries.length === 0) {
      alert('No records available to export.');
      return;
    }

    const headers = ['Sr. No.', 'Date', 'Description', 'Credit (Inflow)', 'Debit (Outflow)', 'Balance'];
    const rows = filteredAndSortedEntries.map((e) => [
      e.srNo,
      `"${e.date}"`,
      `"${e.description.replace(/"/g, '""')}"`,
      Math.round(e.credit),
      Math.round(e.debit),
      Math.round((Number(e.credit) || 0) - (Number(e.debit) || 0)),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['AL-HAMD COAL MINES & METALS (PVT) LTD. - CASH BOOK REGISTER', '']
        .concat([headers.join(',')])
        .concat(rows.map((r) => r.join(',')))
        .concat([
          '',
          `Totals,,,${Math.round(filteredTotalCredit)},${Math.round(filteredTotalDebit)},${Math.round(
            filteredTotalBalance
          )}`,
        ])
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Cash_Book_Register_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Dual Mode Navigation Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">
              Cash Office
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">Physical Cash Management</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-600" />
            Cash Book Register
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Record multi-row daily cash entries with Tab key auto-addition, or view historical records with pagination, search, and printing.
          </p>
        </div>

        {/* Dual Mode Switch Buttons */}
        <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 shadow-xs self-start sm:self-auto">
          <button
            type="button"
            id="btn-add-transaction-mode"
            onClick={() => setActiveMode('add_transaction')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeMode === 'add_transaction'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>

          <button
            type="button"
            id="btn-view-cash-book-mode"
            onClick={() => setActiveMode('view_cash_book')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeMode === 'view_cash_book'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>View Cash Book</span>
            <span
              className={`font-mono text-[10px] px-1.5 py-0.2 rounded-full ${
                activeMode === 'view_cash_book' ? 'bg-amber-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {entries.length}
            </span>
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

      {/* KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Total Credit (Inflow)</span>
          <span className="text-xl font-bold font-mono tabular-nums text-emerald-700 mt-1 block">
            PKR {formatWholeNumber(totalCredit)}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Sum of cash deposits & collections</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Total Debit (Outflow)</span>
          <span className="text-xl font-bold font-mono tabular-nums text-rose-700 mt-1 block">
            PKR {formatWholeNumber(totalDebit)}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Sum of cash expenses & settlements</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Total Net Cash Balance</span>
          <span
            className={`text-xl font-bold font-mono tabular-nums mt-1 block ${
              totalBalance >= 0 ? 'text-blue-700' : 'text-amber-700'
            }`}
          >
            PKR {formatWholeNumber(totalBalance)}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Credit − Debit cumulative reserve</span>
        </div>
      </div>

      {/* ==================================================== */}
      {/* MODE 1: ADD TRANSACTION (Cash Book Register Form Table) */}
      {/* ==================================================== */}
      {activeMode === 'add_transaction' && (
        <form onSubmit={handleSaveTransactions} className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            {/* Table Header Bar */}
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Cash Book Register Form</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-800">
                    Draft Multi-row Entry
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px] text-slate-700 font-semibold shadow-2xs">Tab</kbd> in the last column (Debit) to automatically add a new row. Use row action buttons (+ / delete) to manage rows.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleAddDraftRow()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Row</span>
              </button>
            </div>

            {/* Interactive Form Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-2.5 px-3 w-20 text-center">Actions</th>
                    <th className="py-2.5 px-2 w-12 text-center">Sr.</th>
                    <th className="py-2.5 px-3 w-36">Date</th>
                    <th className="py-2.5 px-3">Description / Narration</th>
                    <th className="py-2.5 px-3 w-36 text-right">Credit (Inflow)</th>
                    <th className="py-2.5 px-3 w-36 text-right">Debit (Outflow)</th>
                    <th className="py-2.5 px-4 w-36 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {draftRows.map((row, index) => {
                    const rowCredit = Number(row.credit) || 0;
                    const rowDebit = Number(row.debit) || 0;
                    const rowBalance = rowCredit - rowDebit;
                    const isLastRow = index === draftRows.length - 1;

                    return (
                      <tr key={row.id} className="hover:bg-amber-50/20 transition-colors">
                        {/* Actions in front of each row: Add Button (+) & Delete Button (trash) */}
                        <td className="py-2 px-3 text-center">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleAddDraftRow(index)}
                              className="p-1 rounded text-slate-400 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                              title="Add row below"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteDraftRow(index)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title={draftRows.length <= 1 ? 'Clear row' : 'Delete row'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        {/* Sr. No. */}
                        <td className="py-2 px-2 text-center font-mono font-medium text-slate-500">
                          {index + 1}
                        </td>

                        {/* Date (DatePickerInput) */}
                        <td className="py-2 px-3">
                          <DatePickerInput
                            value={row.date}
                            onChange={(newDate) => handleDraftFieldChange(index, 'date', newDate)}
                            className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-amber-500 focus:bg-white text-slate-900 font-mono"
                          />
                        </td>

                        {/* Description (Manual input) */}
                        <td className="py-2 px-3">
                          <input
                            id={`draft-desc-${index}`}
                            type="text"
                            value={row.description}
                            placeholder="Enter transaction particulars / memo..."
                            onChange={(e) => handleDraftFieldChange(index, 'description', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-amber-500 focus:bg-white text-slate-900 font-medium"
                          />
                        </td>

                        {/* Credit (Manual input) */}
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            step="1"
                            min="0"
                            value={row.credit}
                            placeholder="0"
                            onChange={(e) => handleDraftFieldChange(index, 'credit', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-amber-500 focus:bg-white text-slate-900 font-mono tabular-nums text-right font-semibold"
                          />
                        </td>

                        {/* Debit (Manual input) with Tab Key Auto-Add Listener on Last Row */}
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            step="1"
                            min="0"
                            value={row.debit}
                            placeholder="0"
                            onChange={(e) => handleDraftFieldChange(index, 'debit', e.target.value)}
                            onKeyDown={(e) => {
                              // If user presses Tab key in the last form field of the last row, automatically add a row!
                              if (e.key === 'Tab' && !e.shiftKey && isLastRow) {
                                e.preventDefault();
                                handleAddDraftRow();
                              }
                            }}
                            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-amber-500 focus:bg-white text-slate-900 font-mono tabular-nums text-right font-semibold"
                          />
                        </td>

                        {/* Balance (Credit - Debit) */}
                        <td className="py-2 px-4 text-right font-mono tabular-nums font-bold whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs ${
                              rowBalance > 0
                                ? 'text-emerald-700 bg-emerald-50'
                                : rowBalance < 0
                                ? 'text-rose-700 bg-rose-50'
                                : 'text-slate-500 bg-slate-100'
                            }`}
                          >
                            {formatWholeNumber(rowBalance)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 border-t-2 border-slate-300 font-bold text-xs text-slate-900">
                    <td colSpan={4} className="py-3 px-4 text-right uppercase tracking-wider text-[11px] text-slate-700">
                      Draft Batch Totals ({draftRows.length} rows):
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-emerald-800 text-sm">
                      {formatWholeNumber(draftTotalCredit)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-rose-800 text-sm">
                      {formatWholeNumber(draftTotalDebit)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-blue-900 text-sm whitespace-nowrap">
                      {formatWholeNumber(draftTotalBalance)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Bottom Form Actions: Cancel Transaction & Save Button */}
          <div className="flex items-center justify-between gap-3 bg-white p-3.5 border border-slate-200 rounded-xl shadow-xs">
            <span className="text-xs text-slate-500">
              {draftRows.length} row(s) ready to submit. Net draft impact: <strong className="font-mono text-slate-900">PKR {formatWholeNumber(draftTotalBalance)}</strong>
            </span>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleCancelTransaction}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-rose-700 hover:bg-rose-50 bg-white border border-slate-300 rounded-lg transition-colors cursor-pointer shadow-2xs"
              >
                Cancel Transaction
              </button>

              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save Transactions</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ==================================================== */}
      {/* MODE 2: VIEW CASH BOOK (Historical Table & Actions) */}
      {/* ==================================================== */}
      {activeMode === 'view_cash_book' && (
        <div className="space-y-4">
          {/* Controls Bar: Search, Date Range Filter, Date Sorting, Page Size, Export & Print */}
          <div className="bg-white p-3.5 border border-slate-200 rounded-xl shadow-xs space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search Option */}
              <div className="relative flex-1 min-w-[180px] max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search narration, date, Sr..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900"
                />
              </div>

              {/* Date Range Option (From Date to To Date) */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
                <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="text-[11px] font-semibold text-slate-600 whitespace-nowrap">From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-1.5 py-0.5 text-xs bg-white border border-slate-300 rounded font-mono text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
                <span className="text-[11px] font-semibold text-slate-600 whitespace-nowrap">To:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-1.5 py-0.5 text-xs bg-white border border-slate-300 rounded font-mono text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
                {(startDate || endDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setStartDate('');
                      setEndDate('');
                      setCurrentPage(1);
                    }}
                    className="text-[10px] text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                    title="Clear date range"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Date-wise Sorting Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden sm:inline">
                  Date Sort:
                </span>
                <select
                  value={dateSortOrder}
                  onChange={(e) => setDateSortOrder(e.target.value as 'asc' | 'desc')}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium text-slate-700"
                >
                  <option value="desc">Date (Newest First)</option>
                  <option value="asc">Date (Oldest First)</option>
                </select>
              </div>

              {/* Rows Per Page Selector (Default 50, Options to select no of rows, Option to view all) */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden sm:inline">
                  Rows:
                </span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                    setPageSize(val as number | 'all');
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium text-slate-700"
                >
                  <option value={10}>10 rows</option>
                  <option value={25}>25 rows</option>
                  <option value={50}>50 latest rows (Default)</option>
                  <option value={100}>100 rows</option>
                  <option value="all">View All ({filteredAndSortedEntries.length})</option>
                </select>
              </div>

              {/* Reset Filters */}
              {(searchTerm || startDate || endDate || dateSortOrder !== 'desc') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setStartDate('');
                    setEndDate('');
                    setDateSortOrder('desc');
                    setCurrentPage(1);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                  title="Reset all search and date filters"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}

              {/* Export & Print Action Buttons */}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-2xs cursor-pointer"
                  title="Export filtered records to CSV"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Export CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-2xs cursor-pointer"
                  title="Print formal Cash Book Register"
                >
                  <Printer className="w-3.5 h-3.5 text-blue-600" />
                  <span>Print</span>
                </button>
              </div>
            </div>

            {/* Status bar */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
              <span>
                Showing <strong className="text-slate-800">{paginatedEntries.length}</strong> of{' '}
                <strong className="text-slate-800">{filteredAndSortedEntries.length}</strong> entries{' '}
                {filteredAndSortedEntries.length !== entries.length && `(filtered from ${entries.length} total)`}
              </span>
              <span>
                Net Filtered Balance: <strong className="font-mono text-slate-900">PKR {formatWholeNumber(filteredTotalBalance)}</strong>
              </span>
            </div>
          </div>

          {/* Historical Register Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-3 w-14 text-center">Sr.</th>
                    <th className="py-3 px-4 w-36">
                      <button
                        type="button"
                        onClick={() => setDateSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                        className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-amber-700 cursor-pointer"
                        title="Click to toggle Date Sort"
                      >
                        <span>Date</span>
                        {dateSortOrder === 'desc' ? (
                          <ArrowDown className="w-3.5 h-3.5 text-amber-600" />
                        ) : (
                          <ArrowUp className="w-3.5 h-3.5 text-amber-600" />
                        )}
                      </button>
                    </th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 w-36 text-right">Credit (Inflow)</th>
                    <th className="py-3 px-4 w-36 text-right">Debit (Outflow)</th>
                    <th className="py-3 px-4 w-36 text-right">Balance</th>
                    <th className="py-3 px-3 w-28 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedEntries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        No cash book records found matching your filters. Switch to "Add Transaction" to create new entries.
                      </td>
                    </tr>
                  ) : (
                    paginatedEntries.map((entry, index) => {
                      const rowBalance = (Number(entry.credit) || 0) - (Number(entry.debit) || 0);

                      return (
                        <tr key={entry.id} className="hover:bg-amber-50/20 transition-colors">
                          <td className="py-2.5 px-3 text-center font-mono font-medium text-slate-500">
                            {entry.srNo}
                          </td>

                          <td className="py-2.5 px-4 font-mono text-slate-800 whitespace-nowrap">
                            {entry.date}
                          </td>

                          <td className="py-2.5 px-4 font-medium text-slate-900">
                            {entry.description}
                          </td>

                          <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-emerald-700">
                            {entry.credit > 0 ? formatWholeNumber(entry.credit) : '—'}
                          </td>

                          <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-rose-700">
                            {entry.debit > 0 ? formatWholeNumber(entry.debit) : '—'}
                          </td>

                          <td className="py-2.5 px-4 text-right font-mono tabular-nums font-bold whitespace-nowrap">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-xs ${
                                rowBalance > 0
                                  ? 'text-emerald-700 bg-emerald-50'
                                  : rowBalance < 0
                                  ? 'text-rose-700 bg-rose-50'
                                  : 'text-slate-500 bg-slate-100'
                              }`}
                            >
                              {formatWholeNumber(rowBalance)}
                            </span>
                          </td>

                          {/* Action Buttons in Each Row: Edit & Delete */}
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setEditingEntry(entry)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-50 border border-blue-200 rounded transition-colors cursor-pointer"
                                title="Edit this transaction"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Edit</span>
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setEntryToDelete({
                                    id: entry.id,
                                    srNo: entry.srNo,
                                    description: entry.description,
                                  })
                                }
                                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded transition-colors cursor-pointer"
                                title="Delete this transaction"
                              >
                                <Trash2 className="w-3 h-3 text-rose-600" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>

                <tfoot>
                  <tr className="bg-slate-50 border-t-2 border-slate-300 font-bold text-xs text-slate-900">
                    <td colSpan={3} className="py-3 px-4 text-right uppercase tracking-wider text-[11px] text-slate-700">
                      Page / Register Totals:
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-800 text-sm">
                      {formatWholeNumber(filteredTotalCredit)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-rose-800 text-sm">
                      {formatWholeNumber(filteredTotalDebit)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-blue-900 text-sm whitespace-nowrap">
                      {formatWholeNumber(filteredTotalBalance)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Pagination Controls */}
            {pageSize !== 'all' && totalPages > 1 && (
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span className="text-slate-500">
                  Page <strong className="text-slate-900">{safeCurrentPage}</strong> of{' '}
                  <strong className="text-slate-900">{totalPages}</strong> ({totalRecords} records)
                </span>

                <div className="inline-flex items-center gap-1">
                  <button
                    type="button"
                    disabled={safeCurrentPage <= 1}
                    onClick={() => setCurrentPage(1)}
                    className="p-1.5 rounded border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    title="First Page"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    disabled={safeCurrentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Page indicator pills */}
                  <span className="px-3 py-1 font-mono font-semibold bg-white border border-slate-300 rounded text-slate-800">
                    {safeCurrentPage} / {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={safeCurrentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1.5 rounded border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    title="Next Page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    disabled={safeCurrentPage >= totalPages}
                    onClick={() => setCurrentPage(totalPages)}
                    className="p-1.5 rounded border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    title="Last Page"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* EDIT ENTRY MODAL */}
      {/* ==================================================== */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Edit Cash Register Entry #{editingEntry.srNo}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingEntry(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Date (DD-MM-YYYY):</label>
                <DatePickerInput
                  value={editingEntry.date}
                  onChange={(d) => setEditingEntry((prev) => (prev ? { ...prev, date: d } : null))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Particulars:</label>
                <input
                  type="text"
                  value={editingEntry.description}
                  onChange={(e) =>
                    setEditingEntry((prev) => (prev ? { ...prev, description: e.target.value } : null))
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-emerald-800 mb-1">Credit (Inflow):</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={editingEntry.credit === 0 ? '' : Math.round(editingEntry.credit)}
                    placeholder="0"
                    onChange={(e) =>
                      setEditingEntry((prev) =>
                        prev
                          ? {
                              ...prev,
                              credit: e.target.value === '' ? 0 : Math.round(Number(e.target.value)),
                            }
                          : null
                      )
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 font-mono text-right font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-rose-800 mb-1">Debit (Outflow):</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={editingEntry.debit === 0 ? '' : Math.round(editingEntry.debit)}
                    placeholder="0"
                    onChange={(e) =>
                      setEditingEntry((prev) =>
                        prev
                          ? {
                              ...prev,
                              debit: e.target.value === '' ? 0 : Math.round(Number(e.target.value)),
                            }
                          : null
                      )
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 font-mono text-right font-semibold"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center">
                <span className="font-semibold text-slate-600">Calculated Row Balance:</span>
                <span className="font-mono font-bold text-sm text-blue-700">
                  PKR {formatWholeNumber((Number(editingEntry.credit) || 0) - (Number(editingEntry.debit) || 0))}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEditingEntry(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (editingEntry) {
                    onUpdateEntry(editingEntry.id, 'date', editingEntry.date);
                    onUpdateEntry(editingEntry.id, 'description', editingEntry.description);
                    onUpdateEntry(editingEntry.id, 'credit', Number(editingEntry.credit) || 0);
                    onUpdateEntry(editingEntry.id, 'debit', Number(editingEntry.debit) || 0);
                    setEditingEntry(null);
                    setNotification(`Cash book row #${editingEntry.srNo} updated successfully.`);
                    setTimeout(() => setNotification(null), 3000);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* DELETE ENTRY CONFIRMATION MODAL */}
      {/* ==================================================== */}
      {entryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden p-6 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  Confirm Cash Register Row Deletion
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Are you sure you want to delete row{' '}
                  <strong className="font-mono text-slate-900">#{entryToDelete.srNo}</strong>
                  {entryToDelete.description ? (
                    <>
                      {' '}
                      (<span className="font-medium text-slate-800">{entryToDelete.description}</span>)
                    </>
                  ) : null}
                  ?
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 inline-block" />
                Automatic Recalculation:
              </p>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                Deleting this row will remove it permanently and immediately update the Total Credit, Total Debit, and Net Cash Balance.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEntryToDelete(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetSr = entryToDelete.srNo;
                  onDeleteEntry(entryToDelete.id);
                  setEntryToDelete(null);
                  setNotification(`Cash book row #${targetSr} deleted successfully.`);
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

      {/* ==================================================== */}
      {/* PRINT MODAL: FORMAL CASH BOOK REGISTER REPORT */}
      {/* ==================================================== */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 space-y-6 shadow-2xl border border-slate-200 text-slate-900 max-h-[90vh] overflow-y-auto">
            {/* Modal Controls */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Print Cash Book Register
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition-colors cursor-pointer"
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
            <div className="border border-slate-800 rounded-xl p-6 space-y-4 bg-white text-slate-900">
              <div className="text-center pb-3 border-b border-slate-800">
                <h2 className="text-lg font-extrabold uppercase tracking-wider text-slate-950">
                  AL-HAMD COAL MINES & METALS (PVT) LTD.
                </h2>
                <p className="text-xs font-medium text-slate-600">
                  Head Office & Mining Sites: Quetta / Balochistan, Pakistan · Cashier Treasury Department
                </p>
                <div className="mt-2 inline-block px-3 py-0.5 bg-amber-50 border border-amber-300 rounded text-xs font-bold uppercase tracking-wider text-amber-900">
                  PHYSICAL CASH BOOK REGISTER JOURNAL
                </div>
              </div>

              {/* Scope & Date Range Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Period Range:</span>
                  <span className="font-semibold text-slate-900">
                    {startDate ? startDate : 'Inception'} to {endDate ? endDate : 'Present'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Inflow (Credit):</span>
                  <span className="font-semibold font-mono text-emerald-700">
                    PKR {formatWholeNumber(filteredTotalCredit)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Outflow (Debit):</span>
                  <span className="font-semibold font-mono text-rose-700">
                    PKR {formatWholeNumber(filteredTotalDebit)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Net Cash Balance:</span>
                  <span className="font-semibold font-mono text-blue-700">
                    PKR {formatWholeNumber(filteredTotalBalance)}
                  </span>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b-2 border-slate-800 bg-slate-100 text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                      <th className="py-2 px-2 text-center w-12">Sr.</th>
                      <th className="py-2 px-3 w-28">Date</th>
                      <th className="py-2 px-3">Description / Narration</th>
                      <th className="py-2 px-3 text-right w-28">Credit (PKR)</th>
                      <th className="py-2 px-3 text-right w-28">Debit (PKR)</th>
                      <th className="py-2 px-3 text-right w-32">Balance (PKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredAndSortedEntries.map((e) => {
                      const rowBalance = (Number(e.credit) || 0) - (Number(e.debit) || 0);
                      return (
                        <tr key={e.id} className="text-slate-800">
                          <td className="py-1.5 px-2 text-center font-mono">{e.srNo}</td>
                          <td className="py-1.5 px-3 font-mono whitespace-nowrap">{e.date}</td>
                          <td className="py-1.5 px-3 font-medium">{e.description}</td>
                          <td className="py-1.5 px-3 text-right font-mono tabular-nums">
                            {e.credit > 0 ? formatWholeNumber(e.credit) : '—'}
                          </td>
                          <td className="py-1.5 px-3 text-right font-mono tabular-nums">
                            {e.debit > 0 ? formatWholeNumber(e.debit) : '—'}
                          </td>
                          <td className="py-1.5 px-3 text-right font-mono tabular-nums font-semibold">
                            {formatWholeNumber(rowBalance)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-800 bg-slate-50 font-bold">
                      <td colSpan={3} className="py-2 px-3 text-right uppercase tracking-wider">
                        Cumulative Net Reserve ({filteredAndSortedEntries.length} entries):
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-emerald-800">
                        {formatWholeNumber(filteredTotalCredit)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-rose-800">
                        {formatWholeNumber(filteredTotalDebit)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-blue-900">
                        PKR {formatWholeNumber(filteredTotalBalance)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Formal Signatures */}
              <div className="pt-8 grid grid-cols-3 gap-6 text-center text-xs">
                <div>
                  <div className="border-b border-slate-400 pb-1 mb-1 font-semibold text-slate-800">
                    Cashier / Store Accountant
                  </div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Prepared By</span>
                </div>
                <div>
                  <div className="border-b border-slate-400 pb-1 mb-1 font-semibold text-slate-800">
                    Internal Auditor / Accounts
                  </div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Verified By</span>
                </div>
                <div>
                  <div className="border-b border-slate-400 pb-1 mb-1 font-semibold text-slate-800">
                    General Manager / Mining Director
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
