import React, { useState, useMemo } from 'react';
import { 
  BookMarked, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  Search, 
  Filter, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  ArrowUpDown, 
  Layers,
  FileSpreadsheet,
  Check
} from 'lucide-react';
import { CreditBookEntry } from '../../types/treasury';
import { formatWholeNumber } from '../../utils/formatters';
import { DatePickerInput } from '../common/DatePickerInput';

interface CreditBookRegisterViewProps {
  entries: CreditBookEntry[];
  onAddEntry: (entry: CreditBookEntry) => void;
  onUpdateEntry: (
    id: string,
    field: 'date' | 'name' | 'purpose' | 'amount',
    value: string | number
  ) => void;
  onDeleteEntry: (id: string) => void;
  onResetCreditBook: () => void;
  onBulkUpdateEntries?: (updatedEntries: CreditBookEntry[]) => void;
  initialOpenAddRow?: boolean;
}

interface DraftNewRow {
  date: string;
  name: string;
  purpose: string;
  amount: number | '';
}

export const CreditBookRegisterView: React.FC<CreditBookRegisterViewProps> = ({
  entries,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
  onResetCreditBook,
  onBulkUpdateEntries,
  initialOpenAddRow = false,
}) => {
  // Draft row on top state
  const [showNewRowOnTop, setShowNewRowOnTop] = useState<boolean>(initialOpenAddRow);

  React.useEffect(() => {
    if (typeof initialOpenAddRow === 'boolean') {
      setShowNewRowOnTop(initialOpenAddRow);
    }
  }, [initialOpenAddRow]);
  const [draftRow, setDraftRow] = useState<DraftNewRow>({
    date: '',
    name: '',
    purpose: '',
    amount: '',
  });

  // Edit individual row state
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editingRowData, setEditingRowData] = useState<DraftNewRow>({
    date: '',
    name: '',
    purpose: '',
    amount: '',
  });

  // Bulk Edit Table mode
  const [isTableEditMode, setIsTableEditMode] = useState<boolean>(false);
  const [bulkEditRows, setBulkEditRows] = useState<CreditBookEntry[]>([]);

  // Confirmation Modals
  const [entryToDelete, setEntryToDelete] = useState<CreditBookEntry | null>(null);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);

  // Filters & Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [amountSort, setAmountSort] = useState<'default' | 'asc' | 'desc'>('default');

  // Notifications
  const [notification, setNotification] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Helper date parsing (DD-MM-YYYY to timestamp for comparison)
  const parseDDMMYYYY = (dateStr: string): number => {
    if (!dateStr) return 0;
    const parts = dateStr.trim().split(/[-/.]/);
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d.getTime();
    }
    return 0;
  };

  // Trigger Add Credit from top button
  const handleOpenAddCredit = () => {
    setShowNewRowOnTop(true);
    setDraftRow({
      date: '',
      name: '',
      purpose: '',
      amount: '',
    });
    setValidationError(null);
  };

  // Switch to main view
  const handleViewRegister = () => {
    setShowNewRowOnTop(false);
    setIsTableEditMode(false);
    setEditingRowId(null);
  };

  // Save new draft row
  const handleSaveDraftRow = (shouldOpenNext: boolean = false) => {
    if (!draftRow.name.trim()) {
      setValidationError('Please enter a Name for the credit entry.');
      return;
    }
    const parsedAmount = typeof draftRow.amount === 'number' ? draftRow.amount : parseFloat(draftRow.amount || '0');
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setValidationError('Please enter a valid credit Amount greater than 0.');
      return;
    }

    const newEntry: CreditBookEntry = {
      id: `cr-${Date.now()}`,
      srNo: 1, // Will be placed on top and renumbered
      date: draftRow.date.trim(),
      name: draftRow.name.trim(),
      purpose: draftRow.purpose.trim(),
      amount: parsedAmount,
    };

    onAddEntry(newEntry);
    setValidationError(null);

    if (shouldOpenNext) {
      setDraftRow({
        date: draftRow.date.trim(), // Keep previous date convenience
        name: '',
        purpose: '',
        amount: '',
      });
      showToast('Credit entry saved. Another new editable row is ready on top.');
    } else {
      setShowNewRowOnTop(false);
      setDraftRow({
        date: '',
        name: '',
        purpose: '',
        amount: '',
      });
      showToast('Credit entry saved successfully to the top of the register.');
    }
  };

  const handleCancelDraftRow = () => {
    setShowNewRowOnTop(false);
    setDraftRow({
      date: '',
      name: '',
      purpose: '',
      amount: '',
    });
    setValidationError(null);
  };

  // Individual Row Editing
  const handleStartEditRow = (entry: CreditBookEntry) => {
    setEditingRowId(entry.id);
    setEditingRowData({
      date: entry.date,
      name: entry.name,
      purpose: entry.purpose,
      amount: entry.amount,
    });
  };

  const handleSaveEditRow = (id: string) => {
    if (!editingRowData.name.trim()) {
      showToast('Error: Name cannot be empty.');
      return;
    }
    const parsedAmount = typeof editingRowData.amount === 'number' ? editingRowData.amount : parseFloat(editingRowData.amount || '0');
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      showToast('Error: Please enter a valid credit amount.');
      return;
    }

    onUpdateEntry(id, 'date', editingRowData.date.trim());
    onUpdateEntry(id, 'name', editingRowData.name.trim());
    onUpdateEntry(id, 'purpose', editingRowData.purpose.trim());
    onUpdateEntry(id, 'amount', parsedAmount);

    setEditingRowId(null);
    showToast('Row updated successfully.');
  };

  const handleCancelEditRow = () => {
    setEditingRowId(null);
  };

  // Table Edit Mode
  const handleToggleTableEdit = () => {
    if (!isTableEditMode) {
      setBulkEditRows(JSON.parse(JSON.stringify(entries)));
      setIsTableEditMode(true);
      setShowNewRowOnTop(false);
      setEditingRowId(null);
    } else {
      setIsTableEditMode(false);
    }
  };

  const handleSaveBulkEdit = () => {
    if (onBulkUpdateEntries) {
      onBulkUpdateEntries(bulkEditRows);
    } else {
      bulkEditRows.forEach((row) => {
        onUpdateEntry(row.id, 'date', row.date);
        onUpdateEntry(row.id, 'name', row.name);
        onUpdateEntry(row.id, 'purpose', row.purpose);
        onUpdateEntry(row.id, 'amount', Number(row.amount) || 0);
      });
    }
    setIsTableEditMode(false);
    showToast('All table edits have been saved successfully.');
  };

  const handleCancelBulkEdit = () => {
    setIsTableEditMode(false);
    setBulkEditRows([]);
  };

  // Reset Credit Book confirmation
  const handleConfirmReset = () => {
    onResetCreditBook();
    setShowResetConfirmModal(false);
    setShowNewRowOnTop(false);
    setIsTableEditMode(false);
    setEditingRowId(null);
    showToast('Credit Book Register has been reset and all rows removed.');
  };

  // Filter & Sort calculation
  const displayedEntries = useMemo(() => {
    let result = [...entries];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(term) ||
          e.purpose.toLowerCase().includes(term) ||
          e.date.includes(term) ||
          String(e.amount).includes(term)
      );
    }

    // Date From filter
    if (dateFrom.trim()) {
      const fromTime = parseDDMMYYYY(dateFrom);
      if (fromTime > 0) {
        result = result.filter((e) => {
          const entryTime = parseDDMMYYYY(e.date);
          return entryTime >= fromTime;
        });
      }
    }

    // Date To filter
    if (dateTo.trim()) {
      const toTime = parseDDMMYYYY(dateTo);
      if (toTime > 0) {
        result = result.filter((e) => {
          const entryTime = parseDDMMYYYY(e.date);
          return entryTime <= toTime;
        });
      }
    }

    // Amount Sort
    if (amountSort === 'asc') {
      result.sort((a, b) => (Number(a.amount) || 0) - (Number(b.amount) || 0));
    } else if (amountSort === 'desc') {
      result.sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0));
    }

    return result;
  }, [entries, searchTerm, dateFrom, dateTo, amountSort]);

  // Total Credit Amount
  const totalCreditAmount = useMemo(() => {
    return displayedEntries.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [displayedEntries]);

  const activeFiltersCount = (searchTerm ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0) + (amountSort !== 'default' ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
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

      {/* Page Header & Top Buttons as Requested */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
              Treasury Module
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">Credit Ledger Journal</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-indigo-600" />
            Credit Book Register
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Log and audit credit liabilities, deposits, customer credit notes, and outstanding vendor settlements.
          </p>
        </div>

        {/* 3 Top Buttons specified in user prompt: Add Credit, Credit Book Register, Reset Credit Book */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            type="button"
            onClick={handleOpenAddCredit}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all shadow-xs cursor-pointer ${
              showNewRowOnTop
                ? 'bg-indigo-700 text-white ring-2 ring-indigo-400'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Credit</span>
          </button>

          <button
            type="button"
            onClick={handleViewRegister}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all border cursor-pointer ${
              !showNewRowOnTop && !isTableEditMode
                ? 'bg-indigo-50 text-indigo-800 border-indigo-200 shadow-xs'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
            }`}
          >
            <BookMarked className="w-3.5 h-3.5 text-indigo-600" />
            <span>Credit Book Register</span>
          </button>

          <button
            type="button"
            onClick={() => setShowResetConfirmModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 rounded-lg transition-colors cursor-pointer"
            title="Reset credit book and empty all table rows"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Credit Book</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Total Entries</span>
          <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1 block">
            {entries.length}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {displayedEntries.length !== entries.length ? `${displayedEntries.length} matching active filter` : 'Full ledger records'}
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs sm:col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 block">Total Credit Amount</span>
            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
              Cumulative Credit
            </span>
          </div>
          <span className="text-2xl font-bold font-mono tabular-nums text-indigo-900 mt-1 block">
            {formatWholeNumber(totalCreditAmount)}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Sum of all credit amounts in the current register view
          </span>
        </div>
      </div>

      {/* Filter / Sort Control Ribbon */}
      <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
            <Filter className="w-4 h-4 text-indigo-600" />
            <span>Filters & Sorting</span>
            {activeFiltersCount > 0 && (
              <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-800 text-[10px] rounded-full font-mono font-bold">
                {activeFiltersCount} active
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Edit Table Button in header as specified in prompt */}
            <button
              type="button"
              onClick={handleToggleTableEdit}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border cursor-pointer ${
                isTableEditMode
                  ? 'bg-amber-500 text-white border-amber-600'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600" />
              <span>{isTableEditMode ? 'Exit Table Edit' : 'Edit Table'}</span>
            </button>

            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setDateFrom('');
                  setDateTo('');
                  setAmountSort('default');
                }}
                className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Name or Purpose..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900"
            />
          </div>

          {/* Date From (DD-MM-YYYY) */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:bg-white">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap">From:</span>
            <DatePickerInput
              value={dateFrom}
              onChange={(newDate) => setDateFrom(newDate)}
              className="w-full text-xs bg-transparent border-none focus:outline-hidden text-slate-900 font-mono"
            />
          </div>

          {/* Date To (DD-MM-YYYY) */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:bg-white">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap">To:</span>
            <DatePickerInput
              value={dateTo}
              onChange={(newDate) => setDateTo(newDate)}
              className="w-full text-xs bg-transparent border-none focus:outline-hidden text-slate-900 font-mono"
            />
          </div>

          {/* Amount Sort: Low to High, High to Low */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:bg-white">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={amountSort}
              onChange={(e) => setAmountSort(e.target.value as 'default' | 'asc' | 'desc')}
              className="w-full text-xs bg-transparent border-none focus:outline-hidden text-slate-900 font-medium cursor-pointer"
            >
              <option value="default">Amount Sort: Default</option>
              <option value="asc">Amount: Low to High</option>
              <option value="desc">Amount: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Validation Error banner */}
      {validationError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{validationError}</span>
          </div>
          <button
            type="button"
            onClick={() => setValidationError(null)}
            className="text-rose-700 hover:text-rose-900 font-bold ml-2 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Table Editing Mode Banner */}
      {isTableEditMode && (
        <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-4 h-4 text-amber-700 shrink-0" />
            <div>
              <strong className="font-semibold block">Table In-Place Edit Mode Active</strong>
              <span className="text-[11px] text-amber-800">
                You can edit all cells directly in the table. Click "Save Table Changes" when finished.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCancelBulkEdit}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveBulkEdit}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Table Changes</span>
            </button>
          </div>
        </div>
      )}

      {/* Credit Book Register Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-3 w-14 text-center">Sr.</th>
                <th className="py-3 px-4 w-36">Date</th>
                <th className="py-3 px-4 w-60">Name</th>
                <th className="py-3 px-4">Purpose</th>
                <th className="py-3 px-4 w-40 text-right">Amount</th>
                <th className="py-3 px-4 text-center w-52">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* NEW ROW ON TOP (EDITABLE) when user clicked "Add Credit" or "Add" */}
              {showNewRowOnTop && (
                <tr className="bg-indigo-50/70 border-b-2 border-indigo-200 transition-colors">
                  {/* Sr. Auto-generated as row 1 on top */}
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-indigo-700 bg-indigo-100/60">
                    1
                  </td>

                  {/* Date Input */}
                  <td className="py-2.5 px-3">
                    <DatePickerInput
                      value={draftRow.date}
                      onChange={(newDate) => setDraftRow({ ...draftRow, date: newDate })}
                      className="w-full px-2 py-1.5 text-xs bg-white border border-indigo-300 rounded focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900"
                    />
                  </td>

                  {/* Name Input */}
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      placeholder="Person / Company Name..."
                      value={draftRow.name}
                      onChange={(e) => setDraftRow({ ...draftRow, name: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-indigo-300 rounded focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 font-medium"
                    />
                  </td>

                  {/* Purpose Input */}
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      placeholder="Credit purpose, note, or narration..."
                      value={draftRow.purpose}
                      onChange={(e) => setDraftRow({ ...draftRow, purpose: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-indigo-300 rounded focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900"
                    />
                  </td>

                  {/* Amount Input */}
                  <td className="py-2.5 px-3 text-right">
                    <input
                      type="number"
                      step="1"
                      min="0"
                      placeholder="0"
                      value={draftRow.amount}
                      onChange={(e) =>
                        setDraftRow({
                          ...draftRow,
                          amount: e.target.value === '' ? '' : Math.round(Number(e.target.value)),
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-indigo-300 rounded focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono tabular-nums text-right font-bold text-indigo-900"
                    />
                  </td>

                  {/* Action buttons on end of new row: Save, Add Row, Cancel */}
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSaveDraftRow(false)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors shadow-xs cursor-pointer"
                        title="Save credit entry"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSaveDraftRow(true)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-800 bg-indigo-100 hover:bg-indigo-200 border border-indigo-300 rounded-md transition-colors cursor-pointer"
                        title="Save and immediately add another row"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Row</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCancelDraftRow}
                        className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                        title="Cancel new row"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {/* EMPTY STATE */}
              {displayedEntries.length === 0 && !showNewRowOnTop ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No credit book entries found. Click{' '}
                    <strong className="text-indigo-600">"Add Credit"</strong> or{' '}
                    <strong className="text-indigo-600">"Add Row"</strong> to record a new entry.
                  </td>
                </tr>
              ) : isTableEditMode ? (
                /* FULL TABLE BULK EDIT MODE */
                bulkEditRows.map((entry, index) => {
                  const effectiveSr = showNewRowOnTop ? index + 2 : index + 1;
                  return (
                    <tr key={entry.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="py-2.5 px-3 text-center font-mono font-medium text-slate-500">
                        {effectiveSr}
                      </td>
                      <td className="py-2.5 px-3">
                        <DatePickerInput
                          value={entry.date}
                          onChange={(newDate) => {
                            const updated = [...bulkEditRows];
                            updated[index].date = newDate;
                            setBulkEditRows(updated);
                          }}
                          className="w-full px-2 py-1 text-xs bg-white border border-amber-300 rounded font-mono"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={entry.name}
                          placeholder="Name..."
                          onChange={(e) => {
                            const updated = [...bulkEditRows];
                            updated[index].name = e.target.value;
                            setBulkEditRows(updated);
                          }}
                          className="w-full px-2 py-1 text-xs bg-white border border-amber-300 rounded font-medium"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={entry.purpose}
                          placeholder="Purpose..."
                          onChange={(e) => {
                            const updated = [...bulkEditRows];
                            updated[index].purpose = e.target.value;
                            setBulkEditRows(updated);
                          }}
                          className="w-full px-2 py-1 text-xs bg-white border border-amber-300 rounded"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={entry.amount === 0 ? '' : Math.round(entry.amount)}
                          placeholder="0"
                          onChange={(e) => {
                            const updated = [...bulkEditRows];
                            updated[index].amount = e.target.value === '' ? 0 : Math.round(Number(e.target.value));
                            setBulkEditRows(updated);
                          }}
                          className="w-full px-2 py-1 text-xs bg-white border border-amber-300 rounded text-right font-mono font-bold"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="text-[11px] text-amber-700 italic">Editing in bulk</span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                /* STANDARD READ-ONLY ROWS OR SINGLE-ROW EDIT */
                displayedEntries.map((entry, index) => {
                  const effectiveSr = showNewRowOnTop ? index + 2 : index + 1;
                  const isEditingThis = editingRowId === entry.id;

                  if (isEditingThis) {
                    return (
                      <tr key={entry.id} className="bg-amber-50/60 border-y border-amber-200">
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-700">
                          {effectiveSr}
                        </td>
                        <td className="py-2.5 px-3">
                          <DatePickerInput
                            value={editingRowData.date}
                            onChange={(newDate) =>
                              setEditingRowData({ ...editingRowData, date: newDate })
                            }
                            className="w-full px-2 py-1 text-xs bg-white border border-amber-300 rounded font-mono"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={editingRowData.name}
                            placeholder="Name..."
                            onChange={(e) =>
                              setEditingRowData({ ...editingRowData, name: e.target.value })
                            }
                            className="w-full px-2 py-1 text-xs bg-white border border-amber-300 rounded font-medium"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={editingRowData.purpose}
                            placeholder="Purpose..."
                            onChange={(e) =>
                              setEditingRowData({ ...editingRowData, purpose: e.target.value })
                            }
                            className="w-full px-2 py-1 text-xs bg-white border border-amber-300 rounded"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <input
                            type="number"
                            step="1"
                            min="0"
                            value={editingRowData.amount === 0 ? '' : Math.round(Number(editingRowData.amount))}
                            placeholder="0"
                            onChange={(e) =>
                              setEditingRowData({
                                ...editingRowData,
                                amount: e.target.value === '' ? 0 : Math.round(Number(e.target.value)),
                              })
                            }
                            className="w-full px-2 py-1 text-xs bg-white border border-amber-300 rounded font-mono font-bold text-right"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSaveEditRow(entry.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors shadow-xs cursor-pointer"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>Save</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEditRow}
                              className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={entry.id} className="hover:bg-indigo-50/30 transition-colors">
                      {/* Sr. starting from top to bottom */}
                      <td className="py-2.5 px-3 text-center font-mono font-medium text-slate-500">
                        {effectiveSr}
                      </td>

                      {/* Date */}
                      <td className="py-2.5 px-4 font-mono text-slate-700 whitespace-nowrap">
                        {entry.date || '—'}
                      </td>

                      {/* Name */}
                      <td className="py-2.5 px-4 font-semibold text-slate-900">
                        {entry.name}
                      </td>

                      {/* Purpose */}
                      <td className="py-2.5 px-4 text-slate-600">
                        {entry.purpose || '—'}
                      </td>

                      {/* Amount (strictly no $ sign) */}
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums font-bold text-indigo-950 whitespace-nowrap">
                        {formatWholeNumber(entry.amount)}
                      </td>

                      {/* Action buttons at the end of each row: Edit row, Delete row */}
                      <td className="py-2.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStartEditRow(entry)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-indigo-700 bg-slate-100 hover:bg-indigo-50 border border-slate-200 rounded-md transition-colors cursor-pointer"
                            title="Edit this row"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Row</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setEntryToDelete(entry)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 rounded-md transition-colors cursor-pointer"
                            title="Delete this row"
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

            {/* Bottom Footer: Total Credit Amount and Edit Table Button */}
            <tfoot>
              <tr className="bg-slate-100/90 border-t-2 border-slate-300 font-bold text-xs text-slate-900">
                <td colSpan={4} className="py-3 px-4 text-right uppercase tracking-wider text-[11px] text-slate-700">
                  Total Credit Amount:
                </td>
                <td className="py-3 px-4 text-right font-mono tabular-nums text-indigo-950 text-sm whitespace-nowrap">
                  {formatWholeNumber(totalCreditAmount)}
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={handleToggleTableEdit}
                      className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-md border transition-colors cursor-pointer ${
                        isTableEditMode
                          ? 'bg-amber-600 text-white border-amber-700'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-xs'
                      }`}
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600" />
                      <span>{isTableEditMode ? 'Exit Table Edit' : 'Edit Table'}</span>
                    </button>

                    {!showNewRowOnTop && !isTableEditMode && (
                      <button
                        type="button"
                        onClick={handleOpenAddCredit}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-600 hover:text-white border border-indigo-200 rounded-md transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Delete Entry Confirmation Modal */}
      {entryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden p-6 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  Confirm Credit Row Deletion
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Are you sure you want to delete credit entry row{' '}
                  <strong className="font-mono text-slate-900">#{entryToDelete.srNo}</strong> for{' '}
                  <strong className="text-slate-900">{entryToDelete.name}</strong>?
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 inline-block" />
                Ledger Notice:
              </p>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                Deleting this entry will permanently remove it from the register and automatically update the Total Credit Amount.
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
                  const targetName = entryToDelete.name;
                  onDeleteEntry(entryToDelete.id);
                  setEntryToDelete(null);
                  showToast(`Credit entry for "${targetName}" deleted successfully.`);
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

      {/* Reset Credit Book Confirmation Modal */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden p-6 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  Reset Credit Book Register?
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Are you sure you want to empty the Credit Book Register? This will permanently delete all{' '}
                  <strong className="text-slate-900 font-mono">{entries.length}</strong> credit records.
                </p>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 inline-block" />
                Irreversible Action:
              </p>
              <p className="text-[11px] text-rose-700 leading-relaxed">
                All names, purposes, dates, and amounts in the credit register will be completely cleared. Total Credit Amount will reset to 0.00.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Yes, Reset & Empty Table</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
