import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle, 
  Send, 
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import { DemandDocument, DemandItem, DemandType, DemandCategory } from '../types';
import { formatWholeNumber } from '../utils/formatters';

interface DemandFormViewProps {
  initialDemand?: DemandDocument | null;
  existingDemands: DemandDocument[];
  onSaveDemand: (demand: DemandDocument) => void;
  onNavigateToView: () => void;
}

export const DemandFormView: React.FC<DemandFormViewProps> = ({
  initialDemand,
  existingDemands,
  onSaveDemand,
  onNavigateToView,
}) => {
  const getTodayDate = () => new Date().toISOString().split('T')[0];

  const generateReferenceNo = () => {
    const count = existingDemands.length + 1;
    const pad = count < 10 ? `00${count}` : count < 100 ? `0${count}` : `${count}`;
    return `DEM-2026-1${pad}`;
  };

  // Form Header State
  const [demandType, setDemandType] = useState<DemandType>(
    initialDemand?.demandType || 'Daily'
  );
  const [category, setCategory] = useState<DemandCategory>(
    initialDemand?.category || 'New'
  );
  const [date, setDate] = useState<string>(
    initialDemand?.date || getTodayDate()
  );
  const [referenceNo, setReferenceNo] = useState<string>(
    initialDemand?.referenceNo || generateReferenceNo()
  );

  // Item Rows State
  const [items, setItems] = useState<DemandItem[]>(
    initialDemand?.items && initialDemand.items.length > 0
      ? initialDemand.items.map((it, idx) => ({ ...it, srNo: idx + 1 }))
      : [
          {
            id: `item-${Date.now()}-1`,
            srNo: 1,
            itemName: '',
            quantity: 1,
            rate: 0,
            amount: 0,
          },
        ]
  );

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync if editing different initial demand
  useEffect(() => {
    if (initialDemand) {
      setDemandType(initialDemand.demandType);
      setCategory(initialDemand.category);
      setDate(initialDemand.date);
      setReferenceNo(initialDemand.referenceNo);
      setItems(initialDemand.items.map((it, idx) => ({ ...it, srNo: idx + 1 })));
    }
  }, [initialDemand]);

  // Recalculate and renumber items
  const handleItemChange = (
    index: number,
    field: 'itemName' | 'quantity' | 'rate',
    value: string | number
  ) => {
    const updated = items.map((item, idx) => {
      if (idx !== index) return item;
      const newItem = { ...item };
      if (field === 'itemName') {
        newItem.itemName = String(value);
      } else if (field === 'quantity') {
        const qty = Math.max(0, Math.round(Number(value)) || 0);
        newItem.quantity = qty;
        newItem.amount = Math.round(qty * newItem.rate);
      } else if (field === 'rate') {
        const r = Math.max(0, Math.round(Number(value)) || 0);
        newItem.rate = r;
        newItem.amount = Math.round(newItem.quantity * r);
      }
      return newItem;
    });
    setItems(updated);
  };

  const handleAddRow = () => {
    const newRow: DemandItem = {
      id: `item-${Date.now()}-${items.length + 1}`,
      srNo: items.length + 1,
      itemName: '',
      quantity: 1,
      rate: 0,
      amount: 0,
    };
    setItems([...items, newRow]);
  };

  const handleDeleteRow = (index: number) => {
    if (items.length <= 1) {
      setErrorMsg('A demand form must have at least one item row.');
      return;
    }
    setErrorMsg(null);
    const filtered = items.filter((_, idx) => idx !== index);
    // Renumber Sr. No.
    const renumbered = filtered.map((item, idx) => ({
      ...item,
      srNo: idx + 1,
    }));
    setItems(renumbered);
  };

  const totalAmount = Number(
    items.reduce((sum, item) => sum + item.amount, 0).toFixed(2)
  );

  const validate = (): boolean => {
    setErrorMsg(null);
    if (!referenceNo.trim()) {
      setErrorMsg('Reference No. is required.');
      return false;
    }
    // Check reference uniqueness against other demands
    const duplicate = existingDemands.some(
      (d) =>
        d.referenceNo.trim().toLowerCase() === referenceNo.trim().toLowerCase() &&
        d.id !== initialDemand?.id
    );
    if (duplicate) {
      setErrorMsg(`Reference No. "${referenceNo}" is already in use. Please enter a unique reference.`);
      return false;
    }

    const hasEmptyItem = items.some((i) => !i.itemName.trim());
    if (hasEmptyItem) {
      setErrorMsg('Please specify an item name for all rows in the table.');
      return false;
    }

    return true;
  };

  const handleAction = (action: 'Draft' | 'Finalized' | 'Submitted') => {
    if (!validate()) return;

    const finalStatus =
      action === 'Draft'
        ? 'Draft'
        : action === 'Finalized'
        ? 'Finalized'
        : 'Submitted for Approval';

    const document: DemandDocument = {
      id: initialDemand?.id || `dem-${Date.now()}`,
      demandType,
      category,
      date,
      referenceNo: referenceNo.trim(),
      items: items.map((it, idx) => ({
        ...it,
        srNo: idx + 1,
        amount: Number((it.quantity * it.rate).toFixed(2)),
      })),
      totalAmount,
      status: finalStatus,
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    onSaveDemand(document);

    const message =
      action === 'Draft'
        ? `Demand saved as Draft (${document.referenceNo}). You can edit it anytime.`
        : action === 'Finalized'
        ? `Demand finalized (${document.referenceNo}). It is now locked and ready for submission.`
        : `Demand finalized & submitted for Admin Approval (${document.referenceNo}).`;

    setSuccessMsg(message);
    setTimeout(() => {
      setSuccessMsg(null);
      onNavigateToView();
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Demand Requisition
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">
              {initialDemand ? `Editing Draft: ${initialDemand.referenceNo}` : 'New Document'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Demand Form
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Specify departmental daily or monthly demand requirements with itemized pricing.
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateToView}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>View All Demands</span>
        </button>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 2.1 Header Fields */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="text-xs font-semibold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
          Document Header Information
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Demand Type */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Demand Type *
            </label>
            <select
              value={demandType}
              onChange={(e) => setDemandType(e.target.value as DemandType)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 font-medium"
            >
              <option value="Daily">Daily</option>
              <option value="Monthly">Monthly</option>
            </select>
            <span className="text-[11px] text-slate-400 mt-1 block">Frequency cycle</span>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as DemandCategory)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 font-medium"
            >
              <option value="New">New</option>
              <option value="R&M">R&M (Repair & Maintenance)</option>
            </select>
            <span className="text-[11px] text-slate-400 mt-1 block">Procurement class</span>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Date *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 font-mono"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">Defaults to today; editable</span>
          </div>

          {/* Reference No. */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Reference No. *
            </label>
            <input
              type="text"
              required
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              placeholder="e.g. DEM-2026-1001"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 font-mono font-semibold"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">Unique reference identifier</span>
          </div>
        </div>
      </div>

      {/* 2.2 Item Rows (Demand Itemized Table) */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Demand Itemized Table
            </h3>
            <p className="text-xs text-slate-500">
              Amount = Quantity × Rate. Sr. No. automatically updates upon adding/deleting rows.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddRow}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Row</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-2.5 px-3 w-16 text-center">Sr. No.</th>
                <th className="py-2.5 px-3">Item Name</th>
                <th className="py-2.5 px-3 w-28 text-right">Quantity</th>
                <th className="py-2.5 px-3 w-32 text-right">Rate</th>
                <th className="py-2.5 px-3 w-36 text-right">Amount</th>
                <th className="py-2.5 px-3 w-16 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50/40">
                  <td className="py-2 px-3 text-center font-mono font-medium text-slate-500">
                    {item.srNo}
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      required
                      placeholder="Enter item name or specification..."
                      value={item.itemName}
                      onChange={(e) => handleItemChange(idx, 'itemName', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-900"
                    />
                  </td>
                  <td className="py-2 px-3 text-right">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity === 0 ? '' : item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-900 text-right font-mono tabular-nums"
                    />
                  </td>
                  <td className="py-2 px-3 text-right">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={item.rate === 0 ? '' : Math.round(item.rate)}
                      onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-900 text-right font-mono tabular-nums"
                    />
                  </td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                    {formatWholeNumber(item.amount)}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteRow(idx)}
                      disabled={items.length <= 1}
                      title={items.length <= 1 ? 'Cannot delete only row' : 'Delete Row'}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-200 font-semibold text-xs">
                <td colSpan={4} className="py-3 px-4 text-right text-slate-700 uppercase tracking-wider text-[11px]">
                  Total Amount ({items.length} items):
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums text-blue-700 text-sm font-bold">
                  {formatWholeNumber(totalAmount)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 2.3 Form Actions */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="text-xs text-slate-500">
          Document status will update based on selected action.
        </div>

        <div className="flex flex-wrap items-center gap-2.5 justify-end">
          {/* Action 1: Save as Draft */}
          <button
            type="button"
            onClick={() => handleAction('Draft')}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save as Draft</span>
          </button>

          {/* Action 2: Finalize */}
          <button
            type="button"
            onClick={() => handleAction('Finalized')}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors cursor-pointer"
          >
            <CheckCircle className="w-3.5 h-3.5 text-amber-700" />
            <span>Finalize</span>
          </button>

          {/* Action 3: Finalize & Submit for Approval */}
          <button
            type="button"
            onClick={() => handleAction('Submitted')}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Finalize & Submit for Approval</span>
          </button>
        </div>
      </div>
    </div>
  );
};
