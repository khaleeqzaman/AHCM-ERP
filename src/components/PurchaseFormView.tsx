import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle, 
  Send, 
  ArrowLeft,
  AlertCircle 
} from 'lucide-react';
import { PurchaseDocument, PurchaseSummaryItem, PaymentType } from '../types';
import { formatWholeNumber } from '../utils/formatters';

interface PurchaseFormViewProps {
  initialPurchase?: PurchaseDocument | null;
  existingPurchases: PurchaseDocument[];
  onSavePurchase: (purchase: PurchaseDocument) => void;
  onNavigateToView: () => void;
}

export const PurchaseFormView: React.FC<PurchaseFormViewProps> = ({
  initialPurchase,
  existingPurchases,
  onSavePurchase,
  onNavigateToView,
}) => {
  const getTodayDate = () => new Date().toISOString().split('T')[0];

  const generateReference = () => {
    const count = existingPurchases.length + 1;
    const pad = count < 10 ? `00${count}` : count < 100 ? `0${count}` : `${count}`;
    return `PUR-2026-2${pad}`;
  };

  // Header Fields State
  const [paymentType, setPaymentType] = useState<PaymentType>(
    initialPurchase?.paymentType || 'Cheque'
  );
  const [date, setDate] = useState<string>(
    initialPurchase?.date || getTodayDate()
  );
  const [reference, setReference] = useState<string>(
    initialPurchase?.reference || generateReference()
  );

  // Item Rows State
  const [items, setItems] = useState<PurchaseSummaryItem[]>(
    initialPurchase?.items && initialPurchase.items.length > 0
      ? initialPurchase.items.map((it, idx) => ({ ...it, srNo: idx + 1 }))
      : [
          {
            id: `p-item-${Date.now()}-1`,
            srNo: 1,
            companyName: '',
            itemName: '',
            quantity: 1,
            amount: 0,
            remarks: '',
          },
        ]
  );

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialPurchase) {
      setPaymentType(initialPurchase.paymentType);
      setDate(initialPurchase.date);
      setReference(initialPurchase.reference);
      setItems(initialPurchase.items.map((it, idx) => ({ ...it, srNo: idx + 1 })));
    }
  }, [initialPurchase]);

  const handleItemChange = (
    index: number,
    field: 'companyName' | 'itemName' | 'quantity' | 'amount' | 'remarks',
    value: string | number
  ) => {
    const updated = items.map((item, idx) => {
      if (idx !== index) return item;
      const newItem = { ...item };
      if (field === 'companyName') newItem.companyName = String(value);
      else if (field === 'itemName') newItem.itemName = String(value);
      else if (field === 'quantity') newItem.quantity = Math.max(0, Math.round(Number(value) || 0));
      else if (field === 'amount') newItem.amount = Math.max(0, Math.round(Number(value) || 0));
      else if (field === 'remarks') newItem.remarks = String(value);
      return newItem;
    });
    setItems(updated);
  };

  const handleAddRow = () => {
    const nextIdx = items.length;
    const newRow: PurchaseSummaryItem = {
      id: `p-item-${Date.now()}-${nextIdx + 1}`,
      srNo: nextIdx + 1,
      companyName: '',
      itemName: '',
      quantity: 1,
      amount: 0,
      remarks: '',
    };
    setItems((prev) => [...prev, newRow]);
    setTimeout(() => {
      const nextInput = document.getElementById(`purchase-item-name-${nextIdx}`);
      if (nextInput) (nextInput as HTMLElement).focus();
    }, 50);
  };

  const handleDeleteRow = (index: number) => {
    if (items.length <= 1) {
      setErrorMsg('A purchase form must contain at least one item row.');
      return;
    }
    setErrorMsg(null);
    const filtered = items.filter((_, idx) => idx !== index);
    const renumbered = filtered.map((item, idx) => ({
      ...item,
      srNo: idx + 1,
    }));
    setItems(renumbered);
  };

  const totalAmount = Math.round(
    items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  );

  const validate = (): boolean => {
    setErrorMsg(null);
    if (!reference.trim()) {
      setErrorMsg('Reference is required.');
      return false;
    }
    const duplicate = existingPurchases.some(
      (p) =>
        p.reference.trim().toLowerCase() === reference.trim().toLowerCase() &&
        p.id !== initialPurchase?.id
    );
    if (duplicate) {
      setErrorMsg(`Reference "${reference}" already exists. Please assign a unique reference.`);
      return false;
    }

    const hasEmptyItem = items.some((i) => !i.itemName.trim() || !i.companyName.trim());
    if (hasEmptyItem) {
      setErrorMsg('Please specify Company Name and Item Name for all item rows.');
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

    const document: PurchaseDocument = {
      id: initialPurchase?.id || `pur-${Date.now()}`,
      paymentType,
      date,
      reference: reference.trim(),
      items: items.map((it, idx) => ({
        ...it,
        srNo: idx + 1,
        amount: Number(it.amount) || 0,
      })),
      totalAmount,
      status: finalStatus,
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    onSavePurchase(document);

    const message =
      action === 'Draft'
        ? `Purchase summary saved as Draft (${document.reference}). You can edit it later.`
        : action === 'Finalized'
        ? `Purchase summary finalized (${document.reference}). It is now locked and ready for submission.`
        : `Purchase summary finalized & submitted for Admin Approval (${document.reference}).`;

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
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Procurement Summary
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">
              {initialPurchase ? `Editing Draft: ${initialPurchase.reference}` : 'New Document'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Purchase Form
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Create an independent purchase summary with company vendors, line items, and payment types.
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateToView}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>View All Purchase Forms</span>
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

      {/* 3.1 Header Fields */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="text-xs font-semibold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
          Purchase Header Information
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Payment Type */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Payment Type *
            </label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value as PaymentType)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 font-medium"
            >
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
            </select>
            <span className="text-[11px] text-slate-400 mt-1 block">Settlement channel</span>
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

          {/* Reference */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Reference *
            </label>
            <input
              type="text"
              required
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. PUR-2026-2001"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 font-mono font-semibold"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">Unique reference identifier</span>
          </div>
        </div>
      </div>

      {/* 3.2 Item Rows (Purchase Itemized Table) */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Purchase Itemized Table
            </h3>
            <p className="text-xs text-slate-500">
              Enter vendor company, item description, quantity, manual amount, and remarks.
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
                <th className="py-2.5 px-3 w-48">Company Name</th>
                <th className="py-2.5 px-3">Item Name</th>
                <th className="py-2.5 px-3 w-24 text-right">Quantity</th>
                <th className="py-2.5 px-3 w-32 text-right">Amount</th>
                <th className="py-2.5 px-3 w-56">Remarks</th>
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
                      placeholder="Company / Vendor..."
                      value={item.companyName}
                      onChange={(e) => handleItemChange(idx, 'companyName', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-900"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      id={`purchase-item-name-${idx}`}
                      type="text"
                      required
                      placeholder="Item description or parts..."
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
                      placeholder="0"
                      value={item.amount === 0 ? '' : item.amount}
                      onChange={(e) => handleItemChange(idx, 'amount', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-900 text-right font-mono tabular-nums font-semibold"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      placeholder="Remarks, invoice details..."
                      value={item.remarks}
                      onChange={(e) => handleItemChange(idx, 'remarks', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Tab' && !e.shiftKey && idx === items.length - 1) {
                          e.preventDefault();
                          handleAddRow();
                        }
                      }}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-900"
                    />
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
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 3.3 Form Actions */}
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
