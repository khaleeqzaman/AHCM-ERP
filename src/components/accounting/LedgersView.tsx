import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Edit2, 
  Check, 
  X, 
  ArrowRight, 
  Filter, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  Layers
} from 'lucide-react';
import { 
  ChartAccount, 
  VoucherDocument, 
  LedgerEntry 
} from '../../types/accounting';

interface LedgersViewProps {
  accounts: ChartAccount[];
  vouchers: VoucherDocument[];
  onUpdateLedgerEntry: (
    voucherId: string,
    lineId: string,
    updatedDebit: number,
    updatedCredit: number,
    updatedDescription: string
  ) => void;
}

export const LedgersView: React.FC<LedgersViewProps> = ({
  accounts,
  vouchers,
  onUpdateLedgerEntry,
}) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    accounts[0]?.id || ''
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRowKey, setEditingRowKey] = useState<string | null>(null);

  // Edit State
  const [editDebit, setEditDebit] = useState<number>(0);
  const [editCredit, setEditCredit] = useState<number>(0);
  const [editParticulars, setEditParticulars] = useState<string>('');
  const [notification, setNotification] = useState<string | null>(null);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0];

  // Compile Ledger Entries for the selected account with running balance
  const compileLedgerEntries = (): LedgerEntry[] => {
    if (!selectedAccount) return [];

    const entries: {
      id: string;
      lineId: string;
      voucherId: string;
      voucherNo: string;
      voucherType: any;
      date: string;
      accountId: string;
      accountCode: string;
      accountName: string;
      particulars: string;
      debit: number;
      credit: number;
    }[] = [];

    vouchers.forEach((v) => {
      v.lines.forEach((l) => {
        if (l.accountId === selectedAccount.id) {
          entries.push({
            id: `${v.id}-${l.id}`,
            lineId: l.id,
            voucherId: v.id,
            voucherNo: v.voucherNo,
            voucherType: v.voucherType,
            date: v.date,
            accountId: l.accountId,
            accountCode: l.accountCode,
            accountName: l.accountName,
            particulars: l.description || v.narration,
            debit: l.debit,
            credit: l.credit,
          });
        }
      });
    });

    // Sort chronologically
    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Compute running balance based on normal balance
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
        runningBalance: Number(running.toFixed(2)),
      };
    });
  };

  const rawEntries = compileLedgerEntries();

  const filteredEntries = rawEntries.filter((e) => {
    return (
      e.voucherNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.particulars.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.date.includes(searchTerm)
    );
  });

  const totalPeriodDebits = rawEntries.reduce((sum, e) => sum + e.debit, 0);
  const totalPeriodCredits = rawEntries.reduce((sum, e) => sum + e.credit, 0);
  const closingBalance =
    rawEntries.length > 0
      ? rawEntries[rawEntries.length - 1].runningBalance
      : selectedAccount?.openingBalance || 0;

  const handleStartEdit = (entry: LedgerEntry & { lineId?: string }) => {
    setEditingRowKey(entry.id);
    setEditDebit(entry.debit);
    setEditCredit(entry.credit);
    setEditParticulars(entry.particulars);
  };

  const handleCancelEdit = () => {
    setEditingRowKey(null);
  };

  const handleSaveEdit = (entry: any) => {
    onUpdateLedgerEntry(
      entry.voucherId,
      entry.lineId,
      Number(editDebit) || 0,
      Number(editCredit) || 0,
      editParticulars.trim()
    );
    setEditingRowKey(null);
    setNotification(
      `Ledger entry for ${entry.voucherNo} updated. Running balance recalculated.`
    );
    setTimeout(() => setNotification(null), 3000);
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
            <span className="text-xs text-slate-500">Editable Ledger Entries</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            General Ledger & Subsidiary Accounts
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Select any T-C-GG-SSS account head to inspect and edit chronological ledger postings with live running balances.
          </p>
        </div>

        {/* Account Selector Dropdown */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-medium text-slate-600 whitespace-nowrap">
            Select Account:
          </span>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900 max-w-xs shadow-xs"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.code} — {a.name} ({a.accountType})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

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
                <span className="text-slate-500 block text-[11px]">Normal Side</span>
                <span className="font-bold text-slate-800 font-mono">
                  {selectedAccount.normalBalance}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Opening Balance</span>
                <span className="font-bold text-slate-900 font-mono tabular-nums">
                  {selectedAccount.openingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Period Debits / Credits</span>
                <span className="font-bold text-slate-700 font-mono tabular-nums">
                  +{totalPeriodDebits.toFixed(2)} / -{totalPeriodCredits.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Closing Balance</span>
                <span className="font-bold text-emerald-700 font-mono tabular-nums text-sm">
                  {closingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ledger Entries Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-3.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
          <div className="text-xs font-semibold text-slate-800 flex items-center gap-2">
            <span>Ledger Postings ({filteredEntries.length} entries)</span>
            <span className="text-slate-300">·</span>
            <span className="text-emerald-700 font-normal">
              Click "Edit" on any row to adjust debit, credit, or memo inline
            </span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search memo or voucher #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1 text-xs bg-white border border-slate-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-56 text-slate-900"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-2.5 px-3 w-12 text-center">Sr.</th>
                <th className="py-2.5 px-3 w-28">Date</th>
                <th className="py-2.5 px-3 w-32">Voucher No.</th>
                <th className="py-2.5 px-3 w-28">Type</th>
                <th className="py-2.5 px-3">Particulars / Narration</th>
                <th className="py-2.5 px-3 w-28 text-right">Debit</th>
                <th className="py-2.5 px-3 w-28 text-right">Credit</th>
                <th className="py-2.5 px-3 w-32 text-right">Running Balance</th>
                <th className="py-2.5 px-3 w-20 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Opening Balance Row */}
              {selectedAccount && (
                <tr className="bg-slate-50/40 text-slate-600 font-medium">
                  <td className="py-2.5 px-3 text-center font-mono">—</td>
                  <td className="py-2.5 px-3 font-mono text-[11px]">2026-10-01</td>
                  <td className="py-2.5 px-3 font-mono text-slate-500">OPENING-BAL</td>
                  <td className="py-2.5 px-3 text-slate-500">Balance B/F</td>
                  <td className="py-2.5 px-3 italic">Opening Account Balance Brought Forward</td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                    {selectedAccount.normalBalance === 'Debit'
                      ? `${selectedAccount.openingBalance.toFixed(2)}`
                      : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                    {selectedAccount.normalBalance === 'Credit'
                      ? `${selectedAccount.openingBalance.toFixed(2)}`
                      : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-slate-800">
                    {selectedAccount.openingBalance.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-center text-slate-400 text-[11px]">Locked</td>
                </tr>
              )}

              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No transactions recorded for this account head in current period.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry, idx) => {
                  const isEditing = editingRowKey === entry.id;

                  return (
                    <tr
                      key={entry.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isEditing ? 'bg-emerald-50/30 ring-1 ring-emerald-500' : ''
                      }`}
                    >
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
                        <span className="text-[11px] font-medium text-slate-600">
                          {entry.voucherType.split(' ')[0]}
                        </span>
                      </td>

                      {/* Particulars */}
                      <td className="py-2.5 px-3">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editParticulars}
                            onChange={(e) => setEditParticulars(e.target.value)}
                            className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-900"
                          />
                        ) : (
                          <span className="text-slate-800 font-medium">
                            {entry.particulars}
                          </span>
                        )}
                      </td>

                      {/* Debit */}
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editDebit === 0 ? '' : editDebit}
                            onChange={(e) => {
                              const d = Number(e.target.value) || 0;
                              setEditDebit(d);
                              if (d > 0) setEditCredit(0);
                            }}
                            className="w-24 px-2 py-1 text-xs bg-white border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-900 text-right font-mono font-semibold"
                          />
                        ) : entry.debit > 0 ? (
                          <span className="font-semibold text-slate-900">
                            {entry.debit.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Credit */}
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editCredit === 0 ? '' : editCredit}
                            onChange={(e) => {
                              const c = Number(e.target.value) || 0;
                              setEditCredit(c);
                              if (c > 0) setEditDebit(0);
                            }}
                            className="w-24 px-2 py-1 text-xs bg-white border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-900 text-right font-mono font-semibold"
                          />
                        ) : entry.credit > 0 ? (
                          <span className="font-semibold text-slate-900">
                            {entry.credit.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Running Balance */}
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-slate-900 whitespace-nowrap">
                        {entry.runningBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Action */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {isEditing ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(entry)}
                              className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer shadow-xs"
                              title="Save Changes"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="p-1 rounded bg-slate-200 text-slate-600 hover:bg-slate-300 cursor-pointer"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStartEdit(entry)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 border border-emerald-200 rounded transition-colors cursor-pointer"
                            title="Edit Ledger Entry"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit</span>
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
                <td colSpan={5} className="py-2.5 px-4 text-right uppercase text-[11px] text-slate-700">
                  Total Activity & Closing Position:
                </td>
                <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-900 font-bold">
                  {totalPeriodDebits.toFixed(2)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-900 font-bold">
                  {totalPeriodCredits.toFixed(2)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono tabular-nums text-emerald-800 font-bold text-sm">
                  {closingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
