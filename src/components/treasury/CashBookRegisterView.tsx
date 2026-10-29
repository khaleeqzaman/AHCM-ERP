import React, { useState } from 'react';
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
  AlertTriangle
} from 'lucide-react';
import { CashBookEntry } from '../../types/treasury';

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

export const CashBookRegisterView: React.FC<CashBookRegisterViewProps> = ({
  entries,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<{
    id: string;
    srNo: number;
    description: string;
  } | null>(null);

  const handleAddNewRow = () => {
    // Clean row creation with empty fields, placed on top
    const newEntry: CashBookEntry = {
      id: `cb-${Date.now()}`,
      srNo: 1,
      date: '',
      description: '',
      credit: 0,
      debit: 0,
      balance: 0,
    };
    onAddEntry(newEntry);
    setNotification('New clean row added at the top of Cash Book Register.');
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredEntries = entries.filter((e) => {
    const term = searchTerm.toLowerCase();
    return (
      e.description.toLowerCase().includes(term) ||
      e.date.includes(term) ||
      String(e.srNo).includes(term)
    );
  });

  // Calculate totals
  const totalCredit = entries.reduce((sum, e) => sum + (Number(e.credit) || 0), 0);
  const totalDebit = entries.reduce((sum, e) => sum + (Number(e.debit) || 0), 0);
  const totalBalance = totalCredit - totalDebit;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">
              Cash Office
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">Physical Cash Journal</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-600" />
            Cash Book Register
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            All entry fields are editable in-place. Real-time automatic balance calculation: Credit − Debit.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddNewRow}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Row</span>
        </button>
      </div>

      {/* Notification */}
      {notification && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Summary KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Total Credit (Inflow)</span>
          <span className="text-xl font-bold font-mono tabular-nums text-emerald-700 mt-1 block">
            {totalCredit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Sum of cash deposits & collections</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Total Debit (Outflow)</span>
          <span className="text-xl font-bold font-mono tabular-nums text-rose-700 mt-1 block">
            {totalDebit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Sum of cash expenses & settlements</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Total Net Cash Balance</span>
          <span className={`text-xl font-bold font-mono tabular-nums mt-1 block ${
            totalBalance >= 0 ? 'text-blue-700' : 'text-amber-700'
          }`}>
            {totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Credit − Debit cumulative reserve</span>
        </div>
      </div>

      {/* Search and Action Bar */}
      <div className="bg-white p-3.5 border border-slate-200 rounded-xl shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search memo, date (DD-MM-YYYY)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">
            Showing <strong className="text-slate-800">{filteredEntries.length}</strong> of {entries.length} rows
          </span>
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* 2.1 Cash Book Register Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-3 w-14 text-center">Sr.</th>
                <th className="py-3 px-4 w-36">Date (DD-MM-YYYY)</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 w-36 text-right">Credit</th>
                <th className="py-3 px-4 w-36 text-right">Debit</th>
                <th className="py-3 px-4 w-36 text-right">Balance (Credit − Debit)</th>
                <th className="py-3 px-3 w-14 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No cash book entries found. Click "Add New Row" to start recording.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry, index) => {
                  const rowBalance = (Number(entry.credit) || 0) - (Number(entry.debit) || 0);

                  return (
                    <tr key={entry.id} className="hover:bg-amber-50/20 transition-colors">
                      {/* Sr. Auto-generated */}
                      <td className="py-2.5 px-3 text-center font-mono font-medium text-slate-500">
                        {entry.srNo}
                      </td>

                      {/* Date (Manual input, format: DD-MM-YYYY) */}
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={entry.date}
                          placeholder="DD-MM-YYYY"
                          onChange={(e) => onUpdateEntry(entry.id, 'date', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-amber-500 focus:bg-white text-slate-900 font-mono"
                        />
                      </td>

                      {/* Description (Manual input) */}
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={entry.description}
                          placeholder="Transaction narration..."
                          onChange={(e) => onUpdateEntry(entry.id, 'description', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-amber-500 focus:bg-white text-slate-900 font-medium"
                        />
                      </td>

                      {/* Credit (Manual input) */}
                      <td className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={entry.credit === 0 ? '' : entry.credit}
                          placeholder="0.00"
                          onChange={(e) =>
                            onUpdateEntry(entry.id, 'credit', e.target.value === '' ? 0 : Number(e.target.value))
                          }
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-amber-500 focus:bg-white text-slate-900 font-mono tabular-nums text-right font-semibold"
                        />
                      </td>

                      {/* Debit (Manual input) */}
                      <td className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={entry.debit === 0 ? '' : entry.debit}
                          placeholder="0.00"
                          onChange={(e) =>
                            onUpdateEntry(entry.id, 'debit', e.target.value === '' ? 0 : Number(e.target.value))
                          }
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-amber-500 focus:bg-white text-slate-900 font-mono tabular-nums text-right font-semibold"
                        />
                      </td>

                      {/* Balance (Auto-calculated: Credit - Debit) */}
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums font-bold whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs ${
                            rowBalance >= 0
                              ? 'text-emerald-700 bg-emerald-50'
                              : 'text-rose-700 bg-rose-50'
                          }`}
                        >
                          {rowBalance.toLocaleString('en-US', {
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
                            setEntryToDelete({
                              id: entry.id,
                              srNo: entry.srNo,
                              description: entry.description,
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

            {/* At the End of the Table: Totals */}
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-300 font-bold text-xs text-slate-900">
                <td colSpan={3} className="py-3 px-4 text-right uppercase tracking-wider text-[11px] text-slate-700">
                  Register Totals:
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums text-emerald-800 text-sm">
                  {totalCredit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums text-rose-800 text-sm">
                  {totalDebit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-4 text-right font-mono tabular-nums text-blue-900 text-sm whitespace-nowrap">
                  {totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td></td>
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
    </div>
  );
};
