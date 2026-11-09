import React, { useState, useMemo } from 'react';
import { 
  Boxes, 
  Plus, 
  Search, 
  Download, 
  Printer, 
  Trash2, 
  Edit2, 
  Calendar, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  X,
  FileSpreadsheet,
  Filter,
  ArrowUpDown,
  Pickaxe,
  Truck
} from 'lucide-react';
import { 
  StoreItem, 
  ItemStockEntry, 
  ItemConsumptionRecord, 
  MineRecord, 
  ItemStockSubTab 
} from '../../types/storeSales';
import { DatePickerInput } from '../common/DatePickerInput';
import { ConfirmModal } from './ConfirmModal';
import { formatWholeNumber } from '../../utils/formatters';

interface ItemStockViewProps {
  stockEntries: ItemStockEntry[];
  items: StoreItem[];
  consumptions: ItemConsumptionRecord[];
  mines: MineRecord[];
  onAddStockEntry: (entry: ItemStockEntry) => void;
  onUpdateStockEntry: (entry: ItemStockEntry) => void;
  onDeleteStockEntry: (id: string) => void;
  initialSubTab?: ItemStockSubTab;
}

export const ItemStockView: React.FC<ItemStockViewProps> = ({
  stockEntries,
  items,
  consumptions,
  mines,
  onAddStockEntry,
  onUpdateStockEntry,
  onDeleteStockEntry,
  initialSubTab = 'view_stock',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<ItemStockSubTab>(initialSubTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItemFilter, setSelectedItemFilter] = useState('all');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [formDate, setFormDate] = useState(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    return `${dd}-${mm}-${today.getFullYear()}`;
  });
  const [formItemId, setFormItemId] = useState(items[0]?.id || '');
  const [formStockQty, setFormStockQty] = useState<number | ''>(0);
  const [formPurchaseQty, setFormPurchaseQty] = useState<number | ''>('');
  const [formVendor, setFormVendor] = useState('');
  const [formInvoiceNo, setFormInvoiceNo] = useState('');
  const [formRemarks, setFormRemarks] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Edit Modal State
  const [editingStock, setEditingStock] = useState<ItemStockEntry | null>(null);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    variant?: 'danger' | 'primary' | 'warning';
    action: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: () => {},
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  React.useEffect(() => {
    if (!formItemId && items.length > 0) {
      setFormItemId(items[0].id);
    }
  }, [items, formItemId]);

  const selectedItemObj = useMemo(() => {
    return items.find(i => i.id === formItemId);
  }, [items, formItemId]);

  // -------------------------------------------------------------
  // Consumption Aggregations per Item
  // -------------------------------------------------------------
  const itemConsumptionMap = useMemo(() => {
    const map = new Map<string, { totalVehicle: number; totalMine: number; totalAll: number; mineWise: Record<string, number> }>();
    consumptions.forEach(c => {
      const cur = map.get(c.itemId) || { totalVehicle: 0, totalMine: 0, totalAll: 0, mineWise: {} };
      if (c.consumptionType === 'vehicle') {
        cur.totalVehicle += c.quantity;
      } else {
        cur.totalMine += c.quantity;
        cur.mineWise[c.targetId] = (cur.mineWise[c.targetId] || 0) + c.quantity;
      }
      cur.totalAll += c.quantity;
      map.set(c.itemId, cur);
    });
    return map;
  }, [consumptions]);

  // -------------------------------------------------------------
  // Add Stock Handler with Confirmation
  // -------------------------------------------------------------
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formItemId) {
      setFormError('Please select an item from the catalog.');
      return;
    }

    const item = items.find(i => i.id === formItemId);
    if (!item) {
      setFormError('Selected item is invalid.');
      return;
    }

    const stockQty = Number(formStockQty) || 0;
    const purchaseQty = Number(formPurchaseQty) || 0;

    if (stockQty <= 0 && purchaseQty <= 0) {
      setFormError('Please enter at least Opening Stock Quantity or Purchase Inflow Quantity.');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Confirm Stock Entry',
      message: `Are you sure you want to log stock for:\n\n• Item: ${item.itemName} (${item.itemCode})\n• Opening/Base Stock: ${formatWholeNumber(stockQty)} ${item.unitSymbol}\n• Purchase (Inflow): ${formatWholeNumber(purchaseQty)} ${item.unitSymbol}\n• Date: ${formDate}`,
      confirmText: 'Save Stock Entry',
      variant: 'primary',
      action: () => {
        const newEntry: ItemStockEntry = {
          id: `stk-${Date.now()}`,
          date: formDate,
          itemId: item.id,
          itemCode: item.itemCode,
          itemName: item.itemName,
          unit: item.unitSymbol,
          stockQuantity: stockQty,
          purchase: purchaseQty,
          vendorName: formVendor.trim(),
          invoiceNo: formInvoiceNo.trim(),
          remarks: formRemarks.trim(),
          createdAt: new Date().toISOString(),
        };

        onAddStockEntry(newEntry);
        showToast(`Stock logged for ${item.itemName} (+${formatWholeNumber(stockQty + purchaseQty)} ${item.unitSymbol}).`);
        setFormStockQty(0);
        setFormPurchaseQty('');
        setFormVendor('');
        setFormInvoiceNo('');
        setFormRemarks('');
        setActiveSubTab('view_stock');
      },
    });
  };

  // -------------------------------------------------------------
  // Edit Stock Handler with Confirmation
  // -------------------------------------------------------------
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStock) return;

    const item = items.find(i => i.id === formItemId) || {
      id: editingStock.itemId,
      itemCode: editingStock.itemCode,
      itemName: editingStock.itemName,
      unitSymbol: editingStock.unit,
    };

    const stockQty = Number(formStockQty) || 0;
    const purchaseQty = Number(formPurchaseQty) || 0;

    setConfirmModal({
      isOpen: true,
      title: 'Confirm Stock Update',
      message: `Are you sure you want to update stock entry for ${item.itemName} (${item.itemCode})?`,
      confirmText: 'Update Entry',
      variant: 'primary',
      action: () => {
        onUpdateStockEntry({
          ...editingStock,
          date: formDate,
          itemId: item.id,
          itemCode: item.itemCode,
          itemName: item.itemName,
          unit: item.unitSymbol,
          stockQuantity: stockQty,
          purchase: purchaseQty,
          vendorName: formVendor.trim(),
          invoiceNo: formInvoiceNo.trim(),
          remarks: formRemarks.trim(),
        });
        showToast(`Stock entry updated successfully.`);
        setEditingStock(null);
      },
    });
  };

  const handleOpenEdit = (stk: ItemStockEntry) => {
    setEditingStock(stk);
    setFormDate(stk.date);
    setFormItemId(stk.itemId);
    setFormStockQty(stk.stockQuantity ?? 0);
    setFormPurchaseQty(stk.purchase ?? 0);
    setFormVendor(stk.vendorName || '');
    setFormInvoiceNo(stk.invoiceNo || '');
    setFormRemarks(stk.remarks || '');
    setFormError(null);
  };

  const handleDeletePrompt = (stk: ItemStockEntry) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Stock Entry',
      message: `Are you sure you want to permanently delete stock entry for "${stk.itemName}" dated ${stk.date}?`,
      confirmText: 'Delete Entry',
      variant: 'danger',
      action: () => {
        onDeleteStockEntry(stk.id);
        showToast(`Stock entry removed.`);
      },
    });
  };

  // -------------------------------------------------------------
  // View Stock Rows
  // -------------------------------------------------------------
  const filteredStockList = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return stockEntries.filter(entry => {
      const matchSearch = entry.itemCode.toLowerCase().includes(q) ||
        entry.itemName.toLowerCase().includes(q) ||
        entry.date.includes(q) ||
        (entry.vendorName || '').toLowerCase().includes(q) ||
        (entry.invoiceNo || '').toLowerCase().includes(q);

      const matchItem = selectedItemFilter === 'all' || entry.itemId === selectedItemFilter;
      const matchStart = !startDateFilter || entry.date >= startDateFilter;
      const matchEnd = !endDateFilter || entry.date <= endDateFilter;

      return matchSearch && matchItem && matchStart && matchEnd;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [stockEntries, searchTerm, selectedItemFilter, startDateFilter, endDateFilter]);

  // -------------------------------------------------------------
  // STOCK REPORT CALCULATIONS: Date-wise & Item-wise
  // Formula: last stock quantity + purchase - quantity used by Vehicles - quantity used by mines = Balance
  // -------------------------------------------------------------
  const stockReportData = useMemo(() => {
    return filteredStockList.map((entry) => {
      const cons = itemConsumptionMap.get(entry.itemId) || { totalVehicle: 0, totalMine: 0, totalAll: 0, mineWise: {} };
      
      // Calculate balance: (stockQuantity + purchase) - (vehicleUsage + mineUsage)
      const balance = ((entry.stockQuantity ?? 0) + (entry.purchase ?? 0)) - cons.totalAll;

      return {
        ...entry,
        vehicleUsage: cons.totalVehicle,
        mineUsage: cons.totalMine,
        totalUsage: cons.totalAll,
        mineWiseUsage: cons.mineWise,
        balance,
      };
    });
  }, [filteredStockList, itemConsumptionMap]);

  // Totals for View Stock
  const viewStockTotals = useMemo(() => {
    return filteredStockList.reduce((acc, row) => {
      acc.stockQty += row.stockQuantity ?? 0;
      acc.purchase += row.purchase ?? 0;
      return acc;
    }, { stockQty: 0, purchase: 0 });
  }, [filteredStockList]);

  // Totals for Stock Report
  const stockReportTotals = useMemo(() => {
    return stockReportData.reduce((acc, row) => {
      acc.stockQty += row.stockQuantity ?? 0;
      acc.purchase += row.purchase ?? 0;
      acc.vehicleUsage += row.vehicleUsage ?? 0;
      acc.mineUsage += row.mineUsage ?? 0;
      acc.balance += row.balance ?? 0;
      return acc;
    }, { stockQty: 0, purchase: 0, vehicleUsage: 0, mineUsage: 0, balance: 0 });
  }, [stockReportData]);

  // CSV Export for View Stock
  const handleExportViewStockCSV = () => {
    const headers = ['Sr.', 'Date', 'Item Code', 'Item Name', 'Unit', 'Stock Quantity', 'Purchase (Inflow)', 'Balance (Stock + Purchase)', 'Vendor', 'Invoice No', 'Remarks'];
    const rows = filteredStockList.map((s, idx) => [
      idx + 1,
      `"${s.date}"`,
      `"${s.itemCode}"`,
      `"${s.itemName.replace(/"/g, '""')}"`,
      `"${s.unit}"`,
      s.stockQuantity ?? 0,
      s.purchase ?? 0,
      (s.stockQuantity ?? 0) + (s.purchase ?? 0),
      `"${(s.vendorName || '').replace(/"/g, '""')}"`,
      `"${(s.invoiceNo || '').replace(/"/g, '""')}"`,
      `"${(s.remarks || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `View_Stock_List_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('View Stock List exported to CSV.');
  };

  // CSV Export for Stock Report with dynamic mine columns
  const handleExportStockReportCSV = () => {
    const dynamicMineHeaders = mines.map(m => `"${m.name} Usage"`);
    const headers = [
      'Sr.', 
      'Date', 
      'Item Code', 
      'Item Name', 
      'Unit', 
      'Stock Quantity', 
      'Purchase', 
      'Vehicle Usage', 
      'Total Mines Usage',
      ...dynamicMineHeaders,
      'Balance (Stock + Purchase - Usage)'
    ];

    const rows = stockReportData.map((r, idx) => {
      const mineCols = mines.map(m => r.mineWiseUsage[m.id] || 0);
      return [
        idx + 1,
        `"${r.date}"`,
        `"${r.itemCode}"`,
        `"${r.itemName.replace(/"/g, '""')}"`,
        `"${r.unit}"`,
        r.stockQuantity,
        r.purchase,
        r.vehicleUsage,
        r.mineUsage,
        ...mineCols,
        r.balance,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Store_Stock_Report_Matrix_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Comprehensive Stock Report exported to CSV.');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
          <button type="button" onClick={() => setToastMessage(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Store Management
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs text-slate-500 font-medium">Inventory & Purchases</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <Boxes className="w-5 h-5 text-blue-600" />
            <span>Item Stock & Procurement Management</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Log base stock levels, record procurement inflows, and review comprehensive consumption-deducted stock matrices.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={activeSubTab === 'stock_report' ? handleExportStockReportCSV : handleExportViewStockCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print View</span>
          </button>
        </div>
      </div>

      {/* Sub-Tabs: Add Stock, View Stock, Stock Report */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('view_stock')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'view_stock'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>View Stock List</span>
          <span className="text-[10px] bg-black/15 px-1.5 py-0.2 rounded-full">{stockEntries.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('stock_report')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'stock_report'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Stock Report (Usage & Mine Breakdown)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('add_stock')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'add_stock'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Stock / Inflow</span>
        </button>
      </div>

      {/* -------------------------------------------------------------
          SUB-TAB 1: ADD STOCK FORM
          ------------------------------------------------------------- */}
      {activeSubTab === 'add_stock' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs max-w-3xl">
          <div className="pb-4 mb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Add Stock Entry / Purchase Inflow</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Record opening stock quantity or new purchase delivery from vendors.
              </p>
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
              Inflow Register
            </span>
          </div>

          {formError && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Date */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Transaction Date <span className="text-rose-500">*</span>
                </label>
                <DatePickerInput value={formDate} onChange={setFormDate} className="w-full text-xs" />
              </div>

              {/* Item Dropdown */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Item Name <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formItemId}
                  onChange={(e) => setFormItemId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="" disabled>-- Select Store Item --</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.itemName} ({item.itemCode}) — {item.unitSymbol}
                    </option>
                  ))}
                </select>
                {items.length === 0 && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    No store items found. Please add items in the Items section first.
                  </p>
                )}
              </div>

              {/* Stock Quantity (Base / Opening) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Stock Quantity (Opening / Base Reserve)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formStockQty}
                    onChange={(e) => setFormStockQty(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 1000"
                    className="w-full pl-3 pr-14 py-2 border border-slate-300 rounded-lg font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">
                    {selectedItemObj?.unitSymbol || 'Units'}
                  </span>
                </div>
              </div>

              {/* Purchase (Inflow) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Purchase (Inflow Quantity)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formPurchaseQty}
                    onChange={(e) => setFormPurchaseQty(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 5000"
                    className="w-full pl-3 pr-14 py-2 border border-slate-300 rounded-lg font-mono font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">
                    {selectedItemObj?.unitSymbol || 'Units'}
                  </span>
                </div>
              </div>

              {/* Vendor */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Supplier / Vendor Name
                </label>
                <input
                  type="text"
                  value={formVendor}
                  onChange={(e) => setFormVendor(e.target.value)}
                  placeholder="e.g. Pakistan State Oil, Shell, Allied Spares"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              {/* Invoice / Bilty No */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Invoice / Delivery Challan No
                </label>
                <input
                  type="text"
                  value={formInvoiceNo}
                  onChange={(e) => setFormInvoiceNo(e.target.value)}
                  placeholder="e.g. INV-9912, DC-4401"
                  className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Remarks / Storage Location
              </label>
              <textarea
                rows={2}
                value={formRemarks}
                onChange={(e) => setFormRemarks(e.target.value)}
                placeholder="Storage bunker, tank number, consignment inspection notes..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveSubTab('view_stock')}
                className="px-4 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                Save Stock Entry
              </button>
            </div>
          </form>
        </div>
      )}

      {/* -------------------------------------------------------------
          SUB-TAB 2: VIEW STOCK LIST (DATE & ITEM WISE)
          Showing Date, Item Code, Item Name, Stock Quantity, Purchase, Balance
          ------------------------------------------------------------- */}
      {activeSubTab === 'view_stock' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-xl shadow-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search stock by item code, name, vendor, invoice..."
                className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedItemFilter}
                onChange={(e) => setSelectedItemFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="all">All Items</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>{i.itemName} ({i.itemCode})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">Sr.</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Item Code</th>
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-4 text-right">Stock Quantity</th>
                    <th className="py-3 px-4 text-right">Purchase (Inflow)</th>
                    <th className="py-3 px-4 text-right font-bold text-slate-900 bg-emerald-50/50">
                      Balance (Stock + Purchase)
                    </th>
                    <th className="py-3 px-4">Vendor / Inv</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredStockList.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-slate-400">
                        No stock entries found. Click "Add Stock / Inflow" to log deliveries.
                      </td>
                    </tr>
                  ) : (
                    filteredStockList.map((entry, idx) => {
                      const balance = (entry.stockQuantity ?? 0) + (entry.purchase ?? 0);
                      return (
                        <tr key={entry.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">{entry.date}</td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">{entry.itemCode}</td>
                          <td className="py-3 px-4 font-semibold text-slate-900">{entry.itemName}</td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums">
                            {formatWholeNumber(entry.stockQuantity)} <span className="text-[10px] text-slate-400">{entry.unit}</span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-emerald-700 font-semibold tabular-nums">
                            +{formatWholeNumber(entry.purchase)} <span className="text-[10px] text-slate-400">{entry.unit}</span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-950 bg-emerald-50/40 tabular-nums">
                            {formatWholeNumber(balance)} <span className="text-[10px] text-slate-500 font-normal">{entry.unit}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {entry.vendorName || entry.invoiceNo ? (
                              <div className="truncate max-w-xs">
                                <span className="font-medium text-slate-700">{entry.vendorName || '—'}</span>
                                {entry.invoiceNo && <span className="font-mono text-[10px] text-slate-400 block">{entry.invoiceNo}</span>}
                              </div>
                            ) : '—'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(entry)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Stock Entry"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePrompt(entry)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Entry"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {filteredStockList.length > 0 && (
                  <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900 text-xs">
                    <tr>
                      <td colSpan={4} className="py-3 px-4 text-right uppercase tracking-wider font-extrabold">
                        Total Quantities:
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        {formatWholeNumber(viewStockTotals.stockQty)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-800 tabular-nums">
                        +{formatWholeNumber(viewStockTotals.purchase)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-950 bg-emerald-100 font-extrabold tabular-nums">
                        {formatWholeNumber(viewStockTotals.stockQty + viewStockTotals.purchase)}
                      </td>
                      <td colSpan={2} className="py-3 px-4 text-center font-mono text-slate-400">—</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          SUB-TAB 3: STOCK REPORT (Usage & Dynamic Mines Breakdown Matrix)
          Columns: Date, Item Code, Item Name, Stock Quantity, Purchase, Usage (Vehicles, Mines, [Dynamic Mine Columns]), Balance
          Formula: last stock quantity + purchase - quantity used by Vehicles - quantity used by mines = Balance
          ------------------------------------------------------------- */}
      {activeSubTab === 'stock_report' && (
        <div className="space-y-4">
          {/* Explanatory Banner */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <strong>Comprehensive Inventory Balance Formula:</strong> Balance = (Stock Quantity + Purchase) − (Vehicle Usage + Mines Usage).
              </span>
            </div>
            <span className="font-mono text-[11px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
              {mines.length} Active Mines Tracked
            </span>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">Sr.</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Item Code</th>
                    <th className="py-3 px-3 min-w-[140px]">Item Name</th>
                    <th className="py-3 px-3 text-right">Stock Qty</th>
                    <th className="py-3 px-3 text-right">Purchase</th>
                    <th className="py-3 px-3 text-right text-teal-800 bg-teal-50/50">Vehicle Usage</th>
                    <th className="py-3 px-3 text-right text-emerald-800 bg-emerald-50/50">Mines Usage</th>
                    {/* Dynamic Columns for each listed mine */}
                    {mines.map((mine) => (
                      <th key={mine.id} className="py-3 px-3 text-right text-slate-700 min-w-[120px] bg-slate-100/60">
                        <div className="truncate max-w-[130px]" title={mine.name}>
                          {mine.name}
                        </div>
                      </th>
                    ))}
                    <th className="py-3 px-4 text-right font-bold text-emerald-950 bg-emerald-100/80 min-w-[130px]">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {stockReportData.length === 0 ? (
                    <tr>
                      <td colSpan={9 + mines.length} className="py-10 text-center text-slate-400">
                        No stock records found for reporting.
                      </td>
                    </tr>
                  ) : (
                    stockReportData.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">{row.date}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{row.itemCode}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{row.itemName}</td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                          {formatWholeNumber(row.stockQuantity)} <span className="text-[10px] text-slate-400">{row.unit}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-700 tabular-nums">
                          +{formatWholeNumber(row.purchase)} <span className="text-[10px] text-slate-400">{row.unit}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-teal-800 bg-teal-50/30 tabular-nums">
                          {row.vehicleUsage > 0 ? `-${formatWholeNumber(row.vehicleUsage)}` : '0'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-800 bg-emerald-50/30 tabular-nums">
                          {row.mineUsage > 0 ? `-${formatWholeNumber(row.mineUsage)}` : '0'}
                        </td>
                        {/* Dynamic mine values */}
                        {mines.map((mine) => {
                          const val = row.mineWiseUsage[mine.id] || 0;
                          return (
                            <td key={mine.id} className="py-2.5 px-3 text-right font-mono tabular-nums bg-slate-50/30">
                              {val > 0 ? (
                                <span className="text-slate-800 font-medium">-{formatWholeNumber(val)}</span>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-950 bg-emerald-50/60 tabular-nums">
                          {formatWholeNumber(row.balance)} <span className="text-[10px] text-slate-500 font-normal">{row.unit}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {stockReportData.length > 0 && (
                  <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900 text-xs">
                    <tr>
                      <td colSpan={4} className="py-3 px-3 text-right uppercase tracking-wider font-extrabold">
                        Report Totals:
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums">
                        {formatWholeNumber(stockReportTotals.stockQty)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-800 tabular-nums">
                        +{formatWholeNumber(stockReportTotals.purchase)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-teal-800 tabular-nums">
                        -{formatWholeNumber(stockReportTotals.vehicleUsage)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-800 tabular-nums">
                        -{formatWholeNumber(stockReportTotals.mineUsage)}
                      </td>
                      {mines.map(m => {
                        const totalForMine = stockReportData.reduce((s, r) => s + (r.mineWiseUsage[m.id] || 0), 0);
                        return (
                          <td key={m.id} className="py-3 px-3 text-right font-mono font-bold text-slate-700 tabular-nums">
                            {totalForMine > 0 ? `-${formatWholeNumber(totalForMine)}` : '0'}
                          </td>
                        );
                      })}
                      <td className="py-3 px-4 text-right font-mono text-emerald-950 bg-emerald-200/80 font-extrabold text-sm tabular-nums">
                        {formatWholeNumber(stockReportTotals.balance)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          EDIT STOCK ENTRY MODAL
          ========================================================= */}
      {editingStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                <span>Edit Stock Entry: {editingStock.itemName}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingStock(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date</label>
                  <DatePickerInput value={formDate} onChange={setFormDate} className="w-full text-xs" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Item Code / Name</label>
                  <input
                    type="text"
                    disabled
                    value={`${editingStock.itemName} (${editingStock.itemCode})`}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-100 text-slate-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stock Quantity (Base)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formStockQty}
                    onChange={(e) => setFormStockQty(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 font-mono font-bold border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Purchase (Inflow)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formPurchaseQty}
                    onChange={(e) => setFormPurchaseQty(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 font-mono font-bold text-emerald-800 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Vendor Name</label>
                <input
                  type="text"
                  value={formVendor}
                  onChange={(e) => setFormVendor(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Invoice / Delivery No</label>
                <input
                  type="text"
                  value={formInvoiceNo}
                  onChange={(e) => setFormInvoiceNo(e.target.value)}
                  className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStock(null)}
                  className="px-3.5 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                >
                  Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        variant={confirmModal.variant}
        onConfirm={() => {
          confirmModal.action();
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default ItemStockView;
