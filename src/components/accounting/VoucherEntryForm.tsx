import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft,
  Check,
  Scale
} from 'lucide-react';
import { 
  ChartAccount, 
  VoucherDocument, 
  VoucherLine, 
  VoucherType 
} from '../../types/accounting';

interface VoucherEntryFormProps {
  accounts: ChartAccount[];
  initialVoucher?: VoucherDocument | null;
  existingVouchers: VoucherDocument[];
  onSaveVoucher: (voucher: VoucherDocument) => void;
  onNavigateToView: () => void;
}

export const VoucherEntryForm: React.FC<VoucherEntryFormProps> = ({
  accounts,
  initialVoucher,
  existingVouchers,
  onSaveVoucher,
  onNavigateToView,
}) => {
  const getTodayDate = () => new Date().toISOString().split('T')[0];

  const generateVoucherNo = (type: VoucherType) => {
    const prefix =
      type.includes('Payment')
        ? 'PV'
        : type.includes('Receipt')
        ? 'RV'
        : type.includes('Contra')
        ? 'CV'
        : 'JV';
    const count =
      existingVouchers.filter((v) => v.voucherNo.startsWith(prefix)).length + 1;
    const pad = count < 10 ? `00${count}` : count < 100 ? `0${count}` : `${count}`;
    return `${prefix}-2026-${pad}`;
  };

  // Header State
  const [voucherType, setVoucherType] = useState<VoucherType>(
    initialVoucher?.voucherType || 'Journal Voucher (JV)'
  );
  const [date, setDate] = useState<string>(
    initialVoucher?.date || getTodayDate()
  );
  const [voucherNo, setVoucherNo] = useState<string>(
    initialVoucher?.voucherNo || generateVoucherNo('Journal Voucher (JV)')
  );
  const [referenceNo, setReferenceNo] = useState<string>(
    initialVoucher?.referenceNo || ''
  );
  const [narration, setNarration] = useState<string>(
    initialVoucher?.narration || ''
  );

  // Default lines: 2 lines for double-entry
  const [lines, setLines] = useState<VoucherLine[]>(
    initialVoucher?.lines && initialVoucher.lines.length > 0
      ? initialVoucher.lines.map((l, idx) => ({ ...l, srNo: idx + 1 }))
      : [
          {
            id: `line-${Date.now()}-1`,
            srNo: 1,
            accountId: accounts[0]?.id || '',
            accountCode: accounts[0]?.code || '',
            accountName: accounts[0]?.name || '',
            description: '',
            debit: 0,
            credit: 0,
          },
          {
            id: `line-${Date.now()}-2`,
            srNo: 2,
            accountId: accounts[1]?.id || '',
            accountCode: accounts[1]?.code || '',
            accountName: accounts[1]?.name || '',
            description: '',
            debit: 0,
            credit: 0,
          },
        ]
  );

  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync if editing initial voucher
  useEffect(() => {
    if (initialVoucher) {
      setVoucherType(initialVoucher.voucherType);
      setDate(initialVoucher.date);
      setVoucherNo(initialVoucher.voucherNo);
      setReferenceNo(initialVoucher.referenceNo);
      setNarration(initialVoucher.narration);
      setLines(initialVoucher.lines.map((l, idx) => ({ ...l, srNo: idx + 1 })));
    }
  }, [initialVoucher]);

  const handleTypeChange = (newType: VoucherType) => {
    setVoucherType(newType);
    if (!initialVoucher) {
      setVoucherNo(generateVoucherNo(newType));
    }
  };

  const handleAccountSelect = (lineIndex: number, accountId: string) => {
    const targetAccount = accounts.find((a) => a.id === accountId);
    if (!targetAccount) return;

    const updated = [...lines];
    updated[lineIndex] = {
      ...updated[lineIndex],
      accountId: targetAccount.id,
      accountCode: targetAccount.code,
      accountName: targetAccount.name,
    };
    setLines(updated);
  };

  const handleLineValueChange = (
    lineIndex: number,
    field: 'description' | 'debit' | 'credit',
    val: string | number
  ) => {
    const updated = [...lines];
    const current = { ...updated[lineIndex] };

    if (field === 'description') {
      current.description = String(val);
    } else if (field === 'debit') {
      const d = Math.max(0, Number(val) || 0);
      current.debit = d;
      // In double entry, a line has either a debit or a credit
      if (d > 0) current.credit = 0;
    } else if (field === 'credit') {
      const c = Math.max(0, Number(val) || 0);
      current.credit = c;
      if (c > 0) current.debit = 0;
    }

    updated[lineIndex] = current;
    setLines(updated);
  };

  const handleAddLine = () => {
    const nextAccount = accounts[0];
    const newLine: VoucherLine = {
      id: `line-${Date.now()}-${lines.length + 1}`,
      srNo: lines.length + 1,
      accountId: nextAccount?.id || '',
      accountCode: nextAccount?.code || '',
      accountName: nextAccount?.name || '',
      description: narration,
      debit: 0,
      credit: 0,
    };
    setLines([...lines, newLine]);
  };

  const handleDeleteLine = (index: number) => {
    if (lines.length <= 2) {
      setFormError('A double-entry voucher must contain at least two entries.');
      return;
    }
    setFormError(null);
    const filtered = lines.filter((_, idx) => idx !== index);
    const renumbered = filtered.map((l, idx) => ({ ...l, srNo: idx + 1 }));
    setLines(renumbered);
  };

  // Real-time calculations
  const totalDebit = Number(
    lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0).toFixed(2)
  );
  const totalCredit = Number(
    lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0).toFixed(2)
  );
  const difference = Number(Math.abs(totalDebit - totalCredit).toFixed(2));
  const isBalanced = difference === 0 && totalDebit > 0;

  const validate = (): boolean => {
    setFormError(null);
    if (!voucherNo.trim()) {
      setFormError('Voucher number is required.');
      return false;
    }
    const duplicate = existingVouchers.some(
      (v) =>
        v.voucherNo.trim().toLowerCase() === voucherNo.trim().toLowerCase() &&
        v.id !== initialVoucher?.id
    );
    if (duplicate) {
      setFormError(`Voucher No. "${voucherNo}" already exists. Please use a unique voucher number.`);
      return false;
    }

    const hasEmptyAccount = lines.some((l) => !l.accountId);
    if (hasEmptyAccount) {
      setFormError('Please select a valid Chart of Account for every entry line.');
      return false;
    }

    const hasZeroAmounts = lines.every((l) => l.debit === 0 && l.credit === 0);
    if (hasZeroAmounts) {
      setFormError('Please enter debit or credit amounts for the voucher lines.');
      return false;
    }

    return true;
  };

  const handleSave = (status: 'Draft' | 'Posted') => {
    if (!validate()) return;

    if (status === 'Posted' && !isBalanced) {
      setFormError(`Cannot post unbalanced voucher. Total Debits (${totalDebit.toFixed(2)}) must equal Total Credits (${totalCredit.toFixed(2)}). Discrepancy: ${difference.toFixed(2)}.`);
      return;
    }

    const voucher: VoucherDocument = {
      id: initialVoucher?.id || `vouch-${Date.now()}`,
      voucherNo: voucherNo.trim(),
      voucherType,
      date,
      referenceNo: referenceNo.trim() || 'N/A',
      narration: narration.trim() || 'General journal posting',
      lines: lines.map((l, idx) => ({ ...l, srNo: idx + 1 })),
      totalDebit,
      totalCredit,
      status,
      postedAt: status === 'Posted' ? new Date().toISOString().substring(0, 16) : undefined,
    };

    onSaveVoucher(voucher);

    const message =
      status === 'Posted'
        ? `Double-Entry Voucher ${voucher.voucherNo} posted to General Ledger successfully!`
        : `Voucher ${voucher.voucherNo} saved as Draft.`;

    setSuccessMsg(message);
    setTimeout(() => {
      setSuccessMsg(null);
      onNavigateToView();
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Double-Entry Accounting
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">
              {initialVoucher ? `Editing: ${initialVoucher.voucherNo}` : 'New Voucher Form'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            Double-Entry Voucher Entry
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Post payment, receipt, journal, or contra vouchers ensuring Total Debits equal Total Credits.
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateToView}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>View Vouchers Journal</span>
        </button>
      </div>

      {/* Notifications */}
      {formError && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Voucher Header Info */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="text-xs font-semibold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
          Voucher Header Information
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Voucher Type */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Voucher Type *
            </label>
            <select
              value={voucherType}
              onChange={(e) => handleTypeChange(e.target.value as VoucherType)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 font-medium"
            >
              <option value="Journal Voucher (JV)">Journal Voucher (JV)</option>
              <option value="Payment Voucher (PV)">Payment Voucher (PV)</option>
              <option value="Receipt Voucher (RV)">Receipt Voucher (RV)</option>
              <option value="Contra Voucher (CV)">Contra Voucher (CV)</option>
            </select>
          </div>

          {/* Voucher No */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Voucher Number *
            </label>
            <input
              type="text"
              required
              value={voucherNo}
              onChange={(e) => setVoucherNo(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 font-mono font-bold"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Transaction Date *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 font-mono"
            />
          </div>

          {/* Reference No */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              External Reference / Cheque No.
            </label>
            <input
              type="text"
              placeholder="e.g. CHK-99201, INV-4402"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 font-mono"
            />
          </div>
        </div>

        {/* Narration */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            General Narration / Description *
          </label>
          <input
            type="text"
            required
            placeholder="Provide audit narration and transaction reason..."
            value={narration}
            onChange={(e) => setNarration(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900"
          />
        </div>
      </div>

      {/* Double-Entry Lines Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-600" />
              Double-Entry Ledger Lines
            </h3>
            <p className="text-xs text-slate-500">
              Each row credits or debits a specific T-C-GG-SSS Chart of Account.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddLine}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Line Entry</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-2.5 px-3 w-14 text-center">Sr.</th>
                <th className="py-2.5 px-3 w-80">Account Title (T-C-GG-SSS)</th>
                <th className="py-2.5 px-3">Line Particulars / Remarks</th>
                <th className="py-2.5 px-3 w-36 text-right">Debit</th>
                <th className="py-2.5 px-3 w-36 text-right">Credit</th>
                <th className="py-2.5 px-3 w-14 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lines.map((line, idx) => (
                <tr key={line.id} className="hover:bg-slate-50/40">
                  <td className="py-2 px-3 text-center font-mono text-slate-500 font-medium">
                    {line.srNo}
                  </td>

                  {/* Account Selector */}
                  <td className="py-2 px-3">
                    <select
                      value={line.accountId}
                      onChange={(e) => handleAccountSelect(idx, e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:bg-white text-slate-900 font-medium"
                    >
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.code} — {acc.name} ({acc.accountType})
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Line Memo */}
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      placeholder="Line specifics (optional)..."
                      value={line.description}
                      onChange={(e) =>
                        handleLineValueChange(idx, 'description', e.target.value)
                      }
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:bg-white text-slate-900"
                    />
                  </td>

                  {/* Debit Input */}
                  <td className="py-2 px-3 text-right">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={line.debit === 0 ? '' : line.debit}
                      onChange={(e) =>
                        handleLineValueChange(idx, 'debit', e.target.value)
                      }
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:bg-white text-slate-900 text-right font-mono tabular-nums font-semibold"
                    />
                  </td>

                  {/* Credit Input */}
                  <td className="py-2 px-3 text-right">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={line.credit === 0 ? '' : line.credit}
                      onChange={(e) =>
                        handleLineValueChange(idx, 'credit', e.target.value)
                      }
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:bg-white text-slate-900 text-right font-mono tabular-nums font-semibold"
                    />
                  </td>

                  {/* Delete Row */}
                  <td className="py-2 px-3 text-center">
                    <button
                      type="button"
                      disabled={lines.length <= 2}
                      onClick={() => handleDeleteLine(idx)}
                      title={lines.length <= 2 ? 'Minimum 2 rows required' : 'Delete Row'}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 disabled:opacity-20 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              {/* Balance Summary Row */}
              <tr className="bg-slate-50 border-t-2 border-slate-200 font-semibold text-xs">
                <td colSpan={3} className="py-3 px-4 text-right text-slate-700 uppercase tracking-wider text-[11px]">
                  Double-Entry Totals:
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-900 font-bold text-sm">
                  {totalDebit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-900 font-bold text-sm">
                  {totalCredit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Balancing Verification Banner */}
        <div
          className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${
            isBalanced
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {isBalanced ? (
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5" />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                <AlertCircle className="w-3.5 h-3.5" />
              </div>
            )}
            <div className="text-xs">
              {isBalanced ? (
                <>
                  <span className="font-bold">Balanced:</span> Debits equal Credits (
                  {totalDebit.toFixed(2)}). Voucher is ready to post to General Ledger.
                </>
              ) : (
                <>
                  <span className="font-bold">Out of Balance:</span> Difference of{' '}
                  {difference.toFixed(2)}. Adjust debits or credits to achieve equilibrium before posting.
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSave('Draft')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save as Draft</span>
            </button>

            <button
              type="button"
              disabled={!isBalanced}
              onClick={() => handleSave('Posted')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Post to General Ledger</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
