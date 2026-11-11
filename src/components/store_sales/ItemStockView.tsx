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
  CheckCircle2, 
  AlertCircle,
  X,
  FileSpreadsheet,
  Filter,
  Layers
} from 'lucide-react';
import type { 
  StoreItem, 
  ItemStockEntry, 
  ItemConsumptionRecord, 
  MineRecord, 
  ItemStockSubTab 
} from '../../types/storeSales.ts';
import { DatePickerInput } from '../common/DatePickerInput.tsx';
import ConfirmModal from './ConfirmModal.tsx';
import { formatWholeNumber } from '../../utils/formatters.ts';
import { printConcernedTable } from '../../utils/printTable.ts';

interface ItemStockViewProps {
  stockEntries: ItemStockEntry[];
  items: StoreItem[];
  consumptions: ItemConsumptionRecord[];
  mines: MineRecord[];
  onAddStockEntry: (entry: ItemStockEntry) => void;
  onUpdateStockEntry: (entry: ItemStockEntry) => void;
  onDeleteStockEntry: (id: string) => void;
  onUpdateItem?: (item: StoreItem) => void;
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
  // Sub-tabs: 'view_stock' (View Inventory), 'stock_report' (Inventory Report), 'add_stock' (Add Item Inventory)
  const [activeSubTab, setActiveSubTab] = useState<ItemStockSubTab>(() => {
    if (initialSubTab === 'add_inventory') return 'add_stock';
    if (initialSubTab === 'inventory_report') return 'stock_report';
    if (initialSubTab === 'view_inventory') return 'view_stock';
    return initialSubTab;
  });

  // Toggle between Detailed Ledger and Date-wise Summary in View Inventory
  const [inventoryViewMode, setInventoryViewMode] = useState<'detailed_ledger' | 'date_wise_summary'>('detailed_ledger');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItemFilter, setSelectedItemFilter] = useState('all');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State for Add Item Inventory (Direct Date-wise Quantity only)
  const [formDate, setFormDate] = useState(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    return `${dd}-${mm}-${today.getFullYear()}`;
  });
  const [formItemId, setFormItemId] = useState(items[0]?.id || '');
  const [formStockQty, setFormStockQty] = useState<number | ''>('');
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

  // Current live inventory of selected item (purely total inventory added minus consumptions)
  const selectedItemCurrentInventory = useMemo(() => {
    if (!formItemId) return 0;
    const it = items.find(i => i.id === formItemId);
    const itEntries = stockEntries.filter(s => s.itemId === formItemId || (s.itemCode && s.itemCode === it?.itemCode));
    const totalInflow = itEntries.reduce((sum, s) => sum + Number(s.stockQuantity || s.stockQty || 0), 0);
    const itCons = consumptions.filter(c => c.itemId === formItemId || (c.itemCode && c.itemCode === it?.itemCode));
    const totalUsed = itCons.reduce((sum, c) => sum + Number(c.quantity || 0), 0);
    return totalInflow - totalUsed;
  }, [formItemId, items, stockEntries, consumptions]);

  // Quick date presets
  const handleSetToday = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    setFormDate(`${dd}-${mm}-${today.getFullYear()}`);
  };

  const handleSetYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    setFormDate(`${dd}-${mm}-${d.getFullYear()}`);
  };

  // Print view triggers print with specific print-only table styles
  const handlePrintStockTable = () => {
    const tableId = activeSubTab === 'stock_report' 
      ? 'printable-stock-report-table' 
      : inventoryViewMode === 'date_wise_summary'
        ? 'printable-datewise-inventory-table'
        : 'printable-view-stock-table';

    const title = activeSubTab === 'stock_report' 
      ? 'Item Inventory Balance & Mines Matrix' 
      : inventoryViewMode === 'date_wise_summary'
        ? 'Date-wise Item Inventory Summary'
        : 'Store Item Inventory Ledger';

    printConcernedTable(tableId, title);
  };

  // Consumption Aggregations per Item
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
  // Add Item Inventory Handler
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

    if (stockQty <= 0) {
      setFormError('Please enter a valid Inventory Quantity to add (must be greater than 0).');
      return;
    }

    const previewNewBalance = selectedItemCurrentInventory + stockQty;

    setConfirmModal({
      isOpen: true,
      title: 'Confirm Add Item Inventory',
      message: `Are you sure you want to add inventory for:\n\n• Item: ${item.itemName} (${item.itemCode})\n• Date: ${formDate}\n• Quantity to Add: +${formatWholeNumber(stockQty)} ${item.unitSymbol}\n• Resulting Total Inventory Balance: ${formatWholeNumber(previewNewBalance)} ${item.unitSymbol}`,
      confirmText: 'Save Inventory Entry',
      variant: 'primary',
      action: () => {
        const newEntry: ItemStockEntry = {
          id: `inv-${Date.now()}`,
          date: formDate,
          itemId: item.id,
          itemCode: item.itemCode,
          itemName: item.itemName,
          unit: item.unitSymbol,
          stockQuantity: stockQty,
          purchase: 0,
          vendorName: formVendor.trim(),
          invoiceNo: formInvoiceNo.trim(),
          remarks: formRemarks.trim(),
          createdAt: new Date().toISOString(),
        };

        onAddStockEntry(newEntry);
        showToast(`Item inventory added for ${item.itemName} (+${formatWholeNumber(stockQty)} ${item.unitSymbol}). Available inventory increased.`);
        setFormStockQty('');
        setFormVendor('');
        setFormInvoiceNo('');
        setFormRemarks('');
        setActiveSubTab('view_stock');
      },
    });
  };

  // -------------------------------------------------------------
  // Edit Inventory Handler with Confirmation
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
    if (stockQty <= 0) {
      setFormError('Inventory quantity must be greater than 0.');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Confirm Inventory Update',
      message: `Are you sure you want to update inventory entry for ${item.itemName} (${item.itemCode}) to ${formatWholeNumber(stockQty)} ${item.unitSymbol}?`,
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
          purchase: 0,
          vendorName: formVendor.trim(),
          invoiceNo: formInvoiceNo.trim(),
          remarks: formRemarks.trim(),
        });
        showToast(`Inventory entry updated successfully.`);
        setEditingStock(null);
      },
    });
  };

  const handleOpenEdit = (stk: ItemStockEntry) => {
    setEditingStock(stk);
    setFormDate(stk.date);
    setFormItemId(stk.itemId);
    setFormStockQty(stk.stockQuantity ?? 0);
    setFormVendor(stk.vendorName || '');
    setFormInvoiceNo(stk.invoiceNo || '');
    setFormRemarks(stk.remarks || '');
    setFormError(null);
  };

  const handleDeletePrompt = (stk: ItemStockEntry) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Inventory Entry',
      message: `Are you sure you want to permanently delete inventory entry for "${stk.itemName}" dated ${stk.date}?`,
      confirmText: 'Delete Entry',
      variant: 'danger',
      action: () => {
        onDeleteStockEntry(stk.id);
        showToast(`Inventory entry removed.`);
      },
    });
  };

  // -------------------------------------------------------------
  // View Inventory Rows with Running Ledger Balance
  // -------------------------------------------------------------
  const filteredStockList = useMemo(() => {
    const q = searchTerm.toLowerCase();

    const filtered = stockEntries.filter(entry => {
      const matchSearch = entry.itemCode.toLowerCase().includes(q) ||
        entry.itemName.toLowerCase().includes(q) ||
        entry.date.includes(q) ||
        (entry.vendorName || '').toLowerCase().includes(q) ||
        (entry.invoiceNo || '').toLowerCase().includes(q);

      const matchItem = selectedItemFilter === 'all' || entry.itemId === selectedItemFilter;
      const matchStart = !startDateFilter || entry.date >= startDateFilter;
      const matchEnd = !endDateFilter || entry.date <= endDateFilter;

      return matchSearch && matchItem && matchStart && matchEnd;
    });

    // Sort chronologically ascending to compute progressive running balance ledger per item
    const sortedChronological = [...filtered].sort((a, b) => a.date.localeCompare(b.date));
    
    // Track cumulative balance per item: progressive stockQuantity additions
    const runningPerItem = new Map<string, number>();
    const withRunningBalance = sortedChronological.map(entry => {
      const prevBal = runningPerItem.has(entry.itemId) ? runningPerItem.get(entry.itemId)! : 0;
      const inflow = entry.stockQuantity ?? 0;
      const newBal = prevBal + inflow;
      runningPerItem.set(entry.itemId, newBal);

      return {
        ...entry,
        entryInflow: inflow,
        runningBalance: newBal,
      };
    });

    // Return descending for display (most recent first)
    return withRunningBalance.sort((a, b) => b.date.localeCompare(a.date));
  }, [stockEntries, searchTerm, selectedItemFilter, startDateFilter, endDateFilter]);

  // -------------------------------------------------------------
  // Date-wise Aggregated Summary: User can view item quantity date-wise
  // -------------------------------------------------------------
  const dateWiseSummaryData = useMemo(() => {
    const map = new Map<string, {
      date: string;
      itemId: string;
      itemCode: string;
      itemName: string;
      unit: string;
      entriesCount: number;
      totalStockQty: number;
      vendors: string[];
    }>();

    filteredStockList.forEach(entry => {
      const key = `${entry.date}__${entry.itemId}`;
      const existing = map.get(key);
      const sQty = entry.stockQuantity ?? 0;
      const vName = entry.vendorName?.trim();

      if (existing) {
        existing.entriesCount += 1;
        existing.totalStockQty += sQty;
        if (vName && !existing.vendors.includes(vName)) {
          existing.vendors.push(vName);
        }
      } else {
        map.set(key, {
          date: entry.date,
          itemId: entry.itemId,
          itemCode: entry.itemCode,
          itemName: entry.itemName,
          unit: entry.unit || 'Units',
          entriesCount: 1,
          totalStockQty: sQty,
          vendors: vName ? [vName] : [],
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredStockList]);

  // -------------------------------------------------------------
  // INVENTORY REPORT CALCULATIONS: Date-wise & Item-wise
  // Formula: Quantity Added - (Vehicle Consumption + Mines Consumption) = Balance
  // -------------------------------------------------------------
  const stockReportData = useMemo(() => {
    return filteredStockList.map((entry) => {
      const cons = itemConsumptionMap.get(entry.itemId) || { totalVehicle: 0, totalMine: 0, totalAll: 0, mineWise: {} };
      const balance = (entry.stockQuantity ?? 0) - cons.totalAll;

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

  // Totals for View Inventory
  const viewStockTotals = useMemo(() => {
    return filteredStockList.reduce((acc, row) => {
      acc.stockQty += row.stockQuantity ?? 0;
      return acc;
    }, { stockQty: 0 });
  }, [filteredStockList]);

  // Totals for Date-wise Summary
  const dateWiseSummaryTotals = useMemo(() => {
    return dateWiseSummaryData.reduce((acc, row) => {
      acc.stockQty += row.totalStockQty;
      return acc;
    }, { stockQty: 0 });
  }, [dateWiseSummaryData]);

  // Totals for Inventory Report
  const stockReportTotals = useMemo(() => {
    return stockReportData.reduce((acc, row) => {
      acc.stockQty += row.stockQuantity ?? 0;
      acc.vehicleUsage += row.vehicleUsage ?? 0;
      acc.mineUsage += row.mineUsage ?? 0;
      acc.balance += row.balance ?? 0;
      return acc;
    }, { stockQty: 0, vehicleUsage: 0, mineUsage: 0, balance: 0 });
  }, [stockReportData]);

  // CSV Export for View Inventory
  const handleExportViewStockCSV = () => {
    if (inventoryViewMode === 'date_wise_summary') {
      const headers = ['Sr.', 'Date', 'Item Code', 'Item Name', 'Unit', 'Total Quantity Added', 'Entries Count', 'Suppliers'];
      const rows = dateWiseSummaryData.map((s, idx) => [
        idx + 1,
        `"${s.date}"`,
        `"${s.itemCode}"`,
        `"${s.itemName.replace(/"/g, '""')}"`,
        `"${s.unit}"`,
        s.totalStockQty,
        s.entriesCount,
        `"${s.vendors.join(', ').replace(/"/g, '""')}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `DateWise_Item_Inventory_Summary_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      showToast('Date-wise Inventory Summary exported to CSV.');
      return;
    }

    const headers = ['Sr.', 'Date', 'Item Code', 'Item Name', 'Unit', 'Quantity Added', 'Running Inventory Balance', 'Vendor', 'Invoice No', 'Remarks'];
    const rows = filteredStockList.map((s, idx) => [
      idx + 1,
      `"${s.date}"`,
      `"${s.itemCode}"`,
      `"${s.itemName.replace(/"/g, '""')}"`,
      `"${s.unit}"`,
      s.stockQuantity ?? 0,
      s.runningBalance ?? 0,
      `"${(s.vendorName || '').replace(/"/g, '""')}"`,
      `"${(s.invoiceNo || '').replace(/"/g, '""')}"`,
      `"${(s.remarks || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Item_Inventory_Ledger_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Item Inventory Ledger exported to CSV.');
  };

  // CSV Export for Inventory Report
  const handleExportStockReportCSV = () => {
    const dynamicMineHeaders = mines.map(m => `"${m.name} Usage"`);
    const headers = [
      'Sr.', 
      'Date', 
      'Item Code', 
      'Item Name', 
      'Unit', 
      'Quantity Added', 
      'Vehicle Consumption', 
      'Total Mines Consumption',
      ...dynamicMineHeaders,
      'Balance (Quantity Added - Consumption)'
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
    link.download = `Item_Inventory_Report_Matrix_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Comprehensive Inventory Report exported to CSV.');
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
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Store Management
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs text-slate-500 font-medium">Item Inventory</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <Boxes className="w-5 h-5 text-emerald-700" />
            <span>Item Inventory Management</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Add inventory item quantities date-wise day by day, view items quantity date-wise, and link available balances directly to vehicle & mine consumptions.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap no-print">
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
            onClick={handlePrintStockTable}
            title="Print clean table view only"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-blue-600" />
            <span>Print View (Table Only)</span>
          </button>
        </div>
      </div>

      {/* Sub-Tabs: View Inventory, Inventory Report, Add Item Inventory */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('view_stock')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'view_stock' || activeSubTab === 'view_inventory'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>View Inventory (Date-wise)</span>
          <span className="text-[10px] bg-black/15 px-1.5 py-0.2 rounded-full">{stockEntries.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('stock_report')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'stock_report' || activeSubTab === 'inventory_report'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Inventory Report (Usage & Mine Breakdown)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('add_stock')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'add_stock' || activeSubTab === 'add_inventory'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Item Inventory</span>
        </button>
      </div>

      {/* -------------------------------------------------------------
          SUB-TAB 1: ADD ITEM INVENTORY FORM (DATE-WISE / DAY-BY-DAY)
          ------------------------------------------------------------- */}
      {(activeSubTab === 'add_stock' || activeSubTab === 'add_inventory') && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs max-w-2xl">
          <div className="pb-4 mb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Add Item Inventory</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Add inventory item quantity day by day or date wise to increase available balance for vehicle & mine consumption.
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md">
              Date-wise Inventory Entry
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
              {/* Date with quick presets */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">
                    Entry Date <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleSetToday}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer font-medium"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={handleSetYesterday}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer font-medium"
                    >
                      Yesterday
                    </button>
                  </div>
                </div>
                <DatePickerInput value={formDate} onChange={setFormDate} className="w-full text-xs" />
              </div>

              {/* Item Dropdown */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Store Item <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formItemId}
                  onChange={(e) => setFormItemId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
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

              {/* Live Inventory Status Card */}
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 sm:col-span-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wide flex items-center gap-1.5">
                      <Boxes className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Current Inventory Balance</span>
                    </span>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      Current available quantity for <strong>{selectedItemObj?.itemName || 'Selected Item'}</strong>:
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-mono font-black text-emerald-950 bg-white border border-emerald-300 px-3 py-1 rounded-lg shadow-2xs">
                      {formatWholeNumber(selectedItemCurrentInventory)} {selectedItemObj?.unitSymbol || 'Units'}
                    </span>
                    {(Number(formStockQty) || 0) > 0 && (
                      <span className="text-xs font-mono font-bold text-emerald-900 bg-emerald-200 px-2.5 py-1 rounded-lg">
                        +{Number(formStockQty) || 0} → New Total: {formatWholeNumber(selectedItemCurrentInventory + (Number(formStockQty) || 0))} {selectedItemObj?.unitSymbol}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Inventory Quantity to Add */}
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Inventory Quantity to Add <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formStockQty}
                    onChange={(e) => setFormStockQty(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 50"
                    className="w-full pl-3 pr-14 py-2.5 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">
                    {selectedItemObj?.unitSymbol || 'Units'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Quantity added on {formDate}. Increases available inventory balance for vehicle and mine consumptions.
                </span>
              </div>

              {/* Vendor */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Supplier / Vendor Name (Optional)
                </label>
                <input
                  type="text"
                  value={formVendor}
                  onChange={(e) => setFormVendor(e.target.value)}
                  placeholder="e.g. Pakistan State Oil, Shell, Allied Spares"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                />
              </div>

              {/* Invoice / Bilty No */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Invoice / Delivery Challan No (Optional)
                </label>
                <input
                  type="text"
                  value={formInvoiceNo}
                  onChange={(e) => setFormInvoiceNo(e.target.value)}
                  placeholder="e.g. INV-9912, DC-4401"
                  className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                />
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Storage Bunker / Remarks
              </label>
              <textarea
                rows={2}
                value={formRemarks}
                onChange={(e) => setFormRemarks(e.target.value)}
                placeholder="Storage bunker, tank number, consignment inspection notes..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
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
                className="px-5 py-2 font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Save Item Inventory</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* -------------------------------------------------------------
          SUB-TAB 2: VIEW INVENTORY (DATE-WISE VIEW & RUNNING BALANCE LEDGER)
          ------------------------------------------------------------- */}
      {(activeSubTab === 'view_stock' || activeSubTab === 'view_inventory') && (
        <div className="space-y-4">
          {/* Controls: Search, Item filter, Date range, and View mode switch */}
          <div className="bg-white p-3.5 border border-slate-200 rounded-xl shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search inventory by item code, name, vendor, invoice..."
                  className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
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

                {/* Sub-view mode switcher */}
                <div className="inline-flex rounded-lg border border-slate-300 bg-slate-50 p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setInventoryViewMode('detailed_ledger')}
                    className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                      inventoryViewMode === 'detailed_ledger'
                        ? 'bg-white text-emerald-800 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Inflow Ledger</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInventoryViewMode('date_wise_summary')}
                    className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                      inventoryViewMode === 'date_wise_summary'
                        ? 'bg-white text-emerald-800 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Date-wise Summary</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100 text-xs text-slate-600">
              <span className="font-semibold flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>Date Range:</span>
              </span>
              <div className="w-36">
                <DatePickerInput
                  value={startDateFilter}
                  onChange={setStartDateFilter}
                  placeholder="From Date"
                  className="w-full text-xs"
                />
              </div>
              <span>to</span>
              <div className="w-36">
                <DatePickerInput
                  value={endDateFilter}
                  onChange={setEndDateFilter}
                  placeholder="To Date"
                  className="w-full text-xs"
                />
              </div>
              {(startDateFilter || endDateFilter) && (
                <button
                  type="button"
                  onClick={() => { setStartDateFilter(''); setEndDateFilter(''); }}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer underline ml-1"
                >
                  Clear dates
                </button>
              )}
            </div>
          </div>

          {/* VIEW MODE 1: DETAILED RUNNING LEDGER */}
          {inventoryViewMode === 'detailed_ledger' && (
            <div id="printable-view-stock-table" className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden print-concerned-table print-stock-table-only">
              <div className="hidden print:block print-only-header p-4 border-b border-slate-200 text-center">
                <h1 className="text-lg font-bold text-slate-900">Store Management - Item Inventory Ledger</h1>
                <p className="text-xs text-slate-600">Generated on {new Date().toLocaleDateString('en-GB')} · Official Inventory Inflows & Running Balance Ledger</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-3 w-12 text-center">Sr.</th>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Item Code</th>
                      <th className="py-3 px-3">Item Name</th>
                      <th className="py-3 px-3 text-right">Quantity Added</th>
                      <th className="py-3 px-3 text-right font-bold text-emerald-950 bg-emerald-100/60">
                        Available Inventory (Running Balance)
                      </th>
                      <th className="py-3 px-3">Vendor / Inv</th>
                      <th className="py-3 px-3">Remarks</th>
                      <th className="py-3 px-3 text-right no-print">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {filteredStockList.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-10 text-center text-slate-400">
                          No inventory entries found. Click "Add Item Inventory" to record day-by-day additions.
                        </td>
                      </tr>
                    ) : (
                      filteredStockList.map((entry, idx) => (
                        <tr key={entry.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">{entry.date}</td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">{entry.itemCode}</td>
                          <td className="py-3 px-3 font-semibold text-slate-900">{entry.itemName}</td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800 tabular-nums">
                            +{formatWholeNumber(entry.stockQuantity)} <span className="text-[10px] text-slate-400">{entry.unit}</span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-extrabold text-emerald-950 bg-emerald-100/40 tabular-nums">
                            {formatWholeNumber(entry.runningBalance)} <span className="text-[10px] text-emerald-700 font-normal">{entry.unit}</span>
                          </td>
                          <td className="py-3 px-3 text-slate-500">
                            {entry.vendorName || entry.invoiceNo ? (
                              <div className="truncate max-w-xs">
                                <span className="font-medium text-slate-700">{entry.vendorName || '—'}</span>
                                {entry.invoiceNo && <span className="font-mono text-[10px] text-slate-400 block">{entry.invoiceNo}</span>}
                              </div>
                            ) : '—'}
                          </td>
                          <td className="py-3 px-3 text-slate-500 truncate max-w-xs">
                            {entry.remarks || '—'}
                          </td>
                          <td className="py-3 px-3 text-right no-print">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(entry)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Inventory Entry"
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
                      ))
                    )}
                  </tbody>
                  {filteredStockList.length > 0 && (
                    <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900 text-xs">
                      <tr>
                        <td colSpan={4} className="py-3 px-3 text-right uppercase tracking-wider font-extrabold">
                          Total Quantity Added:
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-950 bg-emerald-100 font-extrabold tabular-nums">
                          +{formatWholeNumber(viewStockTotals.stockQty)}
                        </td>
                        <td colSpan={4} className="py-3 px-3 text-center font-mono text-slate-400">—</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {/* VIEW MODE 2: DATE-WISE AGGREGATED SUMMARY TABLE */}
          {inventoryViewMode === 'date_wise_summary' && (
            <div id="printable-datewise-inventory-table" className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden print-concerned-table print-stock-table-only">
              <div className="hidden print:block print-only-header p-4 border-b border-slate-200 text-center">
                <h1 className="text-lg font-bold text-slate-900">Store Management - Date-wise Item Inventory Summary</h1>
                <p className="text-xs text-slate-600">Generated on {new Date().toLocaleDateString('en-GB')} · Daily Item Inflows & Aggregated Inventory Additions</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-3 w-12 text-center">Sr.</th>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Item Code</th>
                      <th className="py-3 px-3">Item Name</th>
                      <th className="py-3 px-3 text-center">Entries</th>
                      <th className="py-3 px-3 text-right font-bold text-emerald-950 bg-emerald-100/60">
                        Total Quantity Added
                      </th>
                      <th className="py-3 px-3">Suppliers / Vendors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {dateWiseSummaryData.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-slate-400">
                          No date-wise summary data matching your filters.
                        </td>
                      </tr>
                    ) : (
                      dateWiseSummaryData.map((row, idx) => (
                        <tr key={`${row.date}-${row.itemId}`} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">{row.date}</td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-800">{row.itemCode}</td>
                          <td className="py-3 px-3 font-semibold text-slate-900">{row.itemName}</td>
                          <td className="py-3 px-3 text-center">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 font-medium">
                              {row.entriesCount} {row.entriesCount === 1 ? 'entry' : 'entries'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-extrabold text-emerald-950 bg-emerald-50 tabular-nums">
                            +{formatWholeNumber(row.totalStockQty)} <span className="text-[10px] text-emerald-700 font-normal">{row.unit}</span>
                          </td>
                          <td className="py-3 px-3 text-slate-600">
                            {row.vendors.length > 0 ? row.vendors.join(', ') : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {dateWiseSummaryData.length > 0 && (
                    <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900 text-xs">
                      <tr>
                        <td colSpan={5} className="py-3 px-3 text-right uppercase tracking-wider font-extrabold">
                          Total Added:
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-950 bg-emerald-100 font-extrabold tabular-nums">
                          +{formatWholeNumber(dateWiseSummaryTotals.stockQty)}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-400">—</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------
          SUB-TAB 3: INVENTORY REPORT (USAGE & DYNAMIC MINES BREAKDOWN MATRIX)
          Formula: Quantity Added - (Vehicle Usage + Mines Usage) = Balance
          ------------------------------------------------------------- */}
      {(activeSubTab === 'stock_report' || activeSubTab === 'inventory_report') && (
        <div className="space-y-4">
          {/* Explanatory Banner */}
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                <strong>Comprehensive Inventory Balance Formula:</strong> Balance = Quantity Added − (Vehicle Usage + Mines Usage).
              </span>
            </div>
            <span className="font-mono text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
              {mines.length} Active Mines Tracked
            </span>
          </div>

          {/* Table */}
          <div id="printable-stock-report-table" className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden print-concerned-table print-stock-table-only">
            <div className="hidden print:block print-only-header p-4 border-b border-slate-200 text-center">
              <h1 className="text-lg font-bold text-slate-900">Store Management - Item Inventory Balance & Mines Consumption Matrix</h1>
              <p className="text-xs text-slate-600">Generated on {new Date().toLocaleDateString('en-GB')} · Official Inventory Balance & Usage Report</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">Sr.</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Item Code</th>
                    <th className="py-3 px-3 min-w-[140px]">Item Name</th>
                    <th className="py-3 px-3 text-right">Quantity Added</th>
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
                      <td colSpan={8 + mines.length} className="py-10 text-center text-slate-400">
                        No inventory records found for reporting.
                      </td>
                    </tr>
                  ) : (
                    stockReportData.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">{row.date}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{row.itemCode}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{row.itemName}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800 tabular-nums">
                          +{formatWholeNumber(row.stockQuantity)} <span className="text-[10px] text-slate-400">{row.unit}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-teal-800 bg-teal-50/30 tabular-nums">
                          {formatWholeNumber(row.vehicleUsage)} <span className="text-[10px] text-slate-400">{row.unit}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-800 bg-emerald-50/30 tabular-nums">
                          {formatWholeNumber(row.mineUsage)} <span className="text-[10px] text-slate-400">{row.unit}</span>
                        </td>
                        {/* Dynamic Cells for each mine */}
                        {mines.map((mine) => {
                          const val = row.mineWiseUsage[mine.id] || 0;
                          return (
                            <td key={mine.id} className="py-2.5 px-3 text-right font-mono text-slate-600 bg-slate-50/40 tabular-nums">
                              {val > 0 ? (
                                <span className="font-semibold text-slate-900">
                                  {formatWholeNumber(val)} <span className="text-[10px] text-slate-400">{row.unit}</span>
                                </span>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-950 bg-emerald-100/40 tabular-nums">
                          {formatWholeNumber(row.balance)} <span className="text-[10px] text-emerald-700">{row.unit}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {stockReportData.length > 0 && (
                  <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900 text-xs">
                    <tr>
                      <td colSpan={4} className="py-3 px-3 text-right uppercase tracking-wider font-extrabold">
                        Total Sum:
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-950 bg-emerald-100 font-extrabold tabular-nums">
                        +{formatWholeNumber(stockReportTotals.stockQty)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-teal-900 bg-teal-100/60 tabular-nums">
                        {formatWholeNumber(stockReportTotals.vehicleUsage)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-900 bg-emerald-100/60 tabular-nums">
                        {formatWholeNumber(stockReportTotals.mineUsage)}
                      </td>
                      {mines.map((mine) => {
                        const mineSum = stockReportData.reduce((sum, r) => sum + (r.mineWiseUsage[mine.id] || 0), 0);
                        return (
                          <td key={mine.id} className="py-3 px-3 text-right font-mono text-slate-800 bg-slate-200/50 tabular-nums">
                            {formatWholeNumber(mineSum)}
                          </td>
                        );
                      })}
                      <td className="py-3 px-4 text-right font-mono text-emerald-950 bg-emerald-200/80 font-extrabold tabular-nums">
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

      {/* Edit Inventory Modal */}
      {editingStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-700" />
                <span>Edit Inventory Entry</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingStock(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs mt-4">
              <div className="grid grid-cols-2 gap-3">
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
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-100 rounded-lg text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Inventory Quantity Added</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={formStockQty}
                  onChange={(e) => setFormStockQty(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 font-mono font-bold border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Supplier / Vendor</label>
                  <input
                    type="text"
                    value={formVendor}
                    onChange={(e) => setFormVendor(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Invoice / DC #</label>
                  <input
                    type="text"
                    value={formInvoiceNo}
                    onChange={(e) => setFormInvoiceNo(e.target.value)}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Remarks</label>
                <textarea
                  rows={2}
                  value={formRemarks}
                  onChange={(e) => setFormRemarks(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingStock(null)}
                  className="px-4 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reusable Confirm Modal */}
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
