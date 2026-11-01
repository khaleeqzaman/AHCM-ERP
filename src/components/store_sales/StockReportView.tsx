import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Plus, 
  Trash2, 
  Edit2, 
  Search, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle,
  Layers,
  ArrowUpDown,
  Filter,
  FileSpreadsheet
} from 'lucide-react';
import { StockItem, StockEntry } from '../../types/storeSales';

interface StockReportViewProps {
  stockItems: StockItem[];
  stockEntries: StockEntry[];
  onAddItem: (item: StockItem) => void;
  onAddStockEntry: (entry: StockEntry) => void;
  onUpdateStockEntry: (entry: StockEntry) => void;
  onDeleteStockEntry: (id: string) => void;
}

export const StockReportView: React.FC<StockReportViewProps> = ({
  stockItems,
  stockEntries,
  onAddItem,
  onAddStockEntry,
  onUpdateStockEntry,
  onDeleteStockEntry,
}) => {
  const [activeTab, setActiveTab] = useState<'view_stock' | 'add_stock' | 'add_item'>('view_stock');
  const [selectedItemId, setSelectedItemId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [notification, setNotification] = useState<string | null>(null);

  // Editing state
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<StockEntry | null>(null);

  // Add Item form fields
  const [newItemName, setNewItemName] = useState('');
  const [newItemCode, setNewItemCode] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('Tons');

  // Add / Edit Stock form fields
  const [formDate, setFormDate] = useState(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  });
  const [formItemId, setFormItemId] = useState<string>(stockItems[0]?.id || '');
  const [formStockQty, setFormStockQty] = useState<number | ''>(500);
  const [formPurchase, setFormPurchase] = useState<number | ''>(200);
  const [formMine, setFormMine] = useState<number | ''>(150);
  const [formVehicles, setFormVehicles] = useState<number | ''>(50);
  const [formCompanyName, setFormCompanyName] = useState<string>('AHCM Mining Corp.');
  const [formBalance, setFormBalance] = useState<number | ''>(500);

  // Auto-compute balance: (Stock + Purchase) - (Mine + Vehicles)
  const calcBalance = (
    (Number(formStockQty) || 0) + 
    (Number(formPurchase) || 0) - 
    (Number(formMine) || 0) - 
    (Number(formVehicles) || 0)
  );

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleOpenAddStock = () => {
    setEditingEntryId(null);
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    setFormDate(`${dd}-${mm}-${yyyy}`);
    setFormItemId(stockItems[0]?.id || '');
    setFormStockQty(500);
    setFormPurchase(200);
    setFormMine(150);
    setFormVehicles(50);
    setFormCompanyName('AHCM Mining Corp.');
    setFormBalance(500);
    setActiveTab('add_stock');
  };

  const handleOpenEditStock = (entry: StockEntry) => {
    setEditingEntryId(entry.id);
    setFormDate(entry.date);
    setFormItemId(entry.itemId);
    setFormStockQty(entry.stockQty);
    setFormPurchase(entry.purchaseQty);
    setFormMine(entry.mineQty);
    setFormVehicles(entry.vehiclesQty);
    setFormCompanyName(entry.companyName);
    setFormBalance(entry.balance);
    setActiveTab('add_stock');
  };

  // Submit Add Item Form
  const handleAddItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemCode.trim()) {
      alert('Item Name and Item Code are required.');
      return;
    }

    const item: StockItem = {
      id: `item-${Date.now()}`,
      itemName: newItemName.trim(),
      itemCode: newItemCode.trim().toUpperCase(),
      category: newItemCategory.trim() || 'General Store',
      unit: newItemUnit.trim() || 'Units',
    };

    onAddItem(item);
    showNotice(`Item "${item.itemName} (${item.itemCode})" created successfully.`);
    setNewItemName('');
    setNewItemCode('');
    setNewItemCategory('');
    setActiveTab('view_stock');
  };

  // Submit Add / Edit Stock Form
  const handleStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedItem = stockItems.find((i) => i.id === formItemId);
    if (!selectedItem) {
      alert('Please select an item');
      return;
    }

    const finalBalance = (
      (Number(formStockQty) || 0) + 
      (Number(formPurchase) || 0) - 
      (Number(formMine) || 0) - 
      (Number(formVehicles) || 0)
    );

    if (editingEntryId) {
      const updated: StockEntry = {
        id: editingEntryId,
        srNo: stockEntries.find((e) => e.id === editingEntryId)?.srNo || 1,
        date: formDate,
        itemId: selectedItem.id,
        itemName: selectedItem.itemName,
        itemCode: selectedItem.itemCode,
        stockQty: Number(formStockQty) || 0,
        purchaseQty: Number(formPurchase) || 0,
        mineQty: Number(formMine) || 0,
        vehiclesQty: Number(formVehicles) || 0,
        companyName: formCompanyName.trim(),
        balance: finalBalance,
      };
      onUpdateStockEntry(updated);
      showNotice(`Stock record for ${selectedItem.itemName} updated.`);
    } else {
      const newEntry: StockEntry = {
        id: `stk-${Date.now()}`,
        srNo: 1,
        date: formDate,
        itemId: selectedItem.id,
        itemName: selectedItem.itemName,
        itemCode: selectedItem.itemCode,
        stockQty: Number(formStockQty) || 0,
        purchaseQty: Number(formPurchase) || 0,
        mineQty: Number(formMine) || 0,
        vehiclesQty: Number(formVehicles) || 0,
        companyName: formCompanyName.trim(),
        balance: finalBalance,
      };
      onAddStockEntry(newEntry);
      showNotice(`Stock record for ${selectedItem.itemName} added successfully.`);
    }

    setActiveTab('view_stock');
    setEditingEntryId(null);
  };

  const handleConfirmDelete = () => {
    if (entryToDelete) {
      onDeleteStockEntry(entryToDelete.id);
      showNotice(`Stock entry removed.`);
      setEntryToDelete(null);
    }
  };

  // Converts date string to comparable YYYYMMDD integer (immune to timezone bugs)
  const parseDateToYMD = (dStr: string | null | undefined): number | null => {
    if (!dStr) return null;
    const trimmed = dStr.trim();
    if (!trimmed) return null;

    // DD-MM-YYYY or DD/MM/YYYY
    const ddmm = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (ddmm) {
      const day = parseInt(ddmm[1], 10);
      const month = parseInt(ddmm[2], 10);
      const year = parseInt(ddmm[3], 10);
      return year * 10000 + month * 100 + day;
    }

    // YYYY-MM-DD or YYYY/MM/DD
    const yymm = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (yymm) {
      const year = parseInt(yymm[1], 10);
      const month = parseInt(yymm[2], 10);
      const day = parseInt(yymm[3], 10);
      return year * 10000 + month * 100 + day;
    }

    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    }
    return null;
  };

  const formatNoDecimals = (val: number | null | undefined): string => {
    if (val === null || val === undefined || isNaN(val)) return '0';
    return Math.round(val).toLocaleString('en-US');
  };

  // Filtered Stock Entries
  const now = new Date();
  const filteredEntries = useMemo(() => {
    return stockEntries.filter((e) => {
      // Item filter
      if (selectedItemId !== 'all' && e.itemId !== selectedItemId) {
        return false;
      }

      // Search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matches = 
          e.itemName.toLowerCase().includes(term) ||
          e.itemCode.toLowerCase().includes(term) ||
          e.companyName.toLowerCase().includes(term) ||
          e.date.includes(term);
        if (!matches) return false;
      }

      // Date range filter (supports DD-MM-YYYY and YYYY-MM-DD seamlessly)
      const eYMD = parseDateToYMD(e.date);
      const fromYMD = parseDateToYMD(dateFrom);
      if (fromYMD !== null) {
        if (eYMD === null || eYMD < fromYMD) return false;
      }
      const toYMD = parseDateToYMD(dateTo);
      if (toYMD !== null) {
        if (eYMD === null || eYMD > toYMD) return false;
      }

      // Time filter (applies when specific date range is not actively entered)
      if (!dateFrom && !dateTo) {
        if (timeFilter === 'daily') {
          const todayYMD = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
          if (eYMD !== todayYMD) return false;
        } else if (timeFilter === 'weekly') {
          if (!eYMD) return false;
          const entryYear = Math.floor(eYMD / 10000);
          const entryMonth = Math.floor((eYMD % 10000) / 100) - 1;
          const entryDay = eYMD % 100;
          const entryTime = new Date(entryYear, entryMonth, entryDay).getTime();
          const diffDays = (now.getTime() - entryTime) / (1000 * 60 * 60 * 24);
          if (diffDays < 0 || diffDays > 7) return false;
        } else if (timeFilter === 'monthly') {
          if (!eYMD) return false;
          const entryMonth = Math.floor((eYMD % 10000) / 100);
          const entryYear = Math.floor(eYMD / 10000);
          if (entryMonth !== now.getMonth() + 1 || entryYear !== now.getFullYear()) {
            return false;
          }
        }
      }

      return true;
    }).sort((a, b) => {
      const ymdA = parseDateToYMD(a.date) || 0;
      const ymdB = parseDateToYMD(b.date) || 0;
      return sortOrder === 'desc' ? ymdB - ymdA : ymdA - ymdB;
    });
  }, [stockEntries, selectedItemId, searchTerm, dateFrom, dateTo, timeFilter, sortOrder]);

  // Totals for all numeric columns in stock report (No decimals)
  const totalStock = filteredEntries.reduce((sum, e) => sum + (Number(e.stockQty) || 0), 0);
  const totalPurchase = filteredEntries.reduce((sum, e) => sum + (Number(e.purchaseQty) || 0), 0);
  const totalMine = filteredEntries.reduce((sum, e) => sum + (Number(e.mineQty) || 0), 0);
  const totalVehicles = filteredEntries.reduce((sum, e) => sum + (Number(e.vehiclesQty) || 0), 0);
  const totalBalance = filteredEntries.reduce((sum, e) => sum + (Number(e.balance) || 0), 0);

  // Selected item name to display on top of list
  const currentSelectedItemName = selectedItemId === 'all'
    ? 'All Store Items'
    : stockItems.find((i) => i.id === selectedItemId)?.itemName || 'Selected Item';

  return (
    <div className="space-y-6">
      {/* Top Buttons: add item, add stock, view stock */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">
              Store & Sales
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs text-slate-500">Inventory & Consumables</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-600" />
            Stock Report & Inventory Management
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Track opening stock, purchases, mine consumption, vehicle dispatches, and computed store balances.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('view_stock')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'view_stock'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            View Stock
          </button>

          <button
            type="button"
            onClick={handleOpenAddStock}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'add_stock' && !editingEntryId
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-slate-600" />
            <span>Add Stock</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('add_item')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'add_item'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* ADD ITEM FORM */}
      {activeTab === 'add_item' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4 max-w-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-600" />
              Add New Store Item (Master Definition)
            </h3>
            <button
              type="button"
              onClick={() => setActiveTab('view_stock')}
              className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleAddItemSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Name of Item <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="e.g. Steam Lump Coal (Grade A) or Explosive Gelatin"
                className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Item Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newItemCode}
                  onChange={(e) => setNewItemCode(e.target.value)}
                  placeholder="e.g. COAL-LUMP-01"
                  className="w-full text-xs font-mono uppercase px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Unit of Measurement
                </label>
                <input
                  type="text"
                  value={newItemUnit}
                  onChange={(e) => setNewItemUnit(e.target.value)}
                  placeholder="Tons, Cases, Pcs, Liters"
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category
              </label>
              <input
                type="text"
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value)}
                placeholder="Coal Fuel, Mining Consumables, Safety, Rigging..."
                className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab('view_stock')}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                Save Item Definition
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ADD / EDIT STOCK FORM */}
      {activeTab === 'add_stock' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {editingEntryId ? 'Edit Stock Transaction Entry' : 'Add Stock Entry'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Balance calculation: (Stock + Purchase) − (Mine + Vehicles)
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('view_stock')}
              className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Back to Stock List
            </button>
          </div>

          <form onSubmit={handleStockSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Date (DD-MM-YYYY) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  placeholder="DD-MM-YYYY"
                  className="w-full text-xs font-mono font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                />
              </div>

              {/* Item Dropdown */}
              <div className="sm:col-span-2 lg:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Item (Dropdown) <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formItemId}
                  onChange={(e) => setFormItemId(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  {stockItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.itemName} ({item.itemCode}) — {item.unit}
                    </option>
                  ))}
                </select>
              </div>

              {/* Company Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Company Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formCompanyName}
                  onChange={(e) => setFormCompanyName(e.target.value)}
                  placeholder="e.g. AHCM Mining Corp."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                />
              </div>

              {/* Stock Quantity */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Stock (Quantity) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={formStockQty}
                  onChange={(e) => setFormStockQty(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="0.00"
                  className="w-full text-xs font-mono font-bold px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                />
              </div>

              {/* Purchase */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Purchase (Inflow)
                </label>
                <input
                  type="number"
                  step="any"
                  value={formPurchase}
                  onChange={(e) => setFormPurchase(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="0.00"
                  className="w-full text-xs font-mono font-bold px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                />
              </div>

              {/* Mine */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mine (Consumption)
                </label>
                <input
                  type="number"
                  step="any"
                  value={formMine}
                  onChange={(e) => setFormMine(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="0.00"
                  className="w-full text-xs font-mono font-bold px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                />
              </div>

              {/* Vehicles */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Vehicles (Usage)
                </label>
                <input
                  type="number"
                  step="any"
                  value={formVehicles}
                  onChange={(e) => setFormVehicles(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="0.00"
                  className="w-full text-xs font-mono font-bold px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                />
              </div>
            </div>

            {/* Auto Balance Card */}
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900 block">
                  Computed Store Balance
                </span>
                <span className="text-[11px] text-slate-600">
                  Formula: (Stock [{Number(formStockQty) || 0}] + Purchase [{Number(formPurchase) || 0}]) − (Mine [{Number(formMine) || 0}] + Vehicles [{Number(formVehicles) || 0}])
                </span>
              </div>
              <div className="bg-white px-4 py-2 rounded-lg border border-amber-300 text-right shrink-0">
                <span className="text-[10px] text-amber-700 block font-semibold">Net Balance</span>
                <span className="text-lg font-bold font-mono text-slate-900">
                  {formatNoDecimals(calcBalance)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('view_stock')}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                {editingEntryId ? 'Update Stock Entry' : 'Save Stock Entry'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW STOCK TABLE & FILTERS */}
      {activeTab === 'view_stock' && (
        <div className="space-y-4">
          {/* Item Name on the Top Header Badge */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                  Active Stock Item View
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  {currentSelectedItemName}
                </h3>
              </div>
            </div>

            {/* Item Dropdown Filter */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">
                Filter by Item:
              </label>
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="text-xs font-semibold px-3 py-1.5 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="all">All Items ({stockItems.length})</option>
                {stockItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.itemName} ({item.itemCode})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filters Bar: Search, Daily, Weekly, Monthly, Date Range */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search stock by item code, item description, company name, date..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Time Filters */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-slate-500 mr-1">Timeframe:</span>
                <button
                  type="button"
                  onClick={() => setTimeFilter('all')}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    timeFilter === 'all'
                      ? 'bg-amber-600 text-white font-semibold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setTimeFilter('daily')}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    timeFilter === 'daily'
                      ? 'bg-amber-600 text-white font-semibold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Daily
                </button>
                <button
                  type="button"
                  onClick={() => setTimeFilter('weekly')}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    timeFilter === 'weekly'
                      ? 'bg-amber-600 text-white font-semibold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Weekly
                </button>
                <button
                  type="button"
                  onClick={() => setTimeFilter('monthly')}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    timeFilter === 'monthly'
                      ? 'bg-amber-600 text-white font-semibold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Monthly
                </button>
              </div>

              {/* Sort Order */}
              <button
                type="button"
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-600" />
                <span>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
              </button>
            </div>

            {/* Date Range filter (DD-MM-YYYY) */}
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100 text-xs text-slate-600 flex-wrap">
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                Date Range Filter (DD-MM-YYYY):
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">From:</span>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="DD-MM-YYYY"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      setTimeFilter('all');
                    }}
                    className="w-28 pl-2 pr-7 py-1 border border-slate-300 rounded text-xs font-mono font-medium bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    title="Enter date as DD-MM-YYYY or pick from calendar"
                  />
                  <input
                    type="date"
                    aria-label="Pick From Date"
                    onChange={(e) => {
                      if (e.target.value) {
                        const [y, m, d] = e.target.value.split('-');
                        setDateFrom(`${d}-${m}-${y}`);
                        setTimeFilter('all');
                      }
                    }}
                    className="absolute right-1 w-5 h-5 opacity-40 hover:opacity-100 cursor-pointer p-0 border-0"
                    title="Open calendar picker"
                  />
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">To:</span>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="DD-MM-YYYY"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value);
                      setTimeFilter('all');
                    }}
                    className="w-28 pl-2 pr-7 py-1 border border-slate-300 rounded text-xs font-mono font-medium bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    title="Enter date as DD-MM-YYYY or pick from calendar"
                  />
                  <input
                    type="date"
                    aria-label="Pick To Date"
                    onChange={(e) => {
                      if (e.target.value) {
                        const [y, m, d] = e.target.value.split('-');
                        setDateTo(`${d}-${m}-${y}`);
                        setTimeFilter('all');
                      }
                    }}
                    className="absolute right-1 w-5 h-5 opacity-40 hover:opacity-100 cursor-pointer p-0 border-0"
                    title="Open calendar picker"
                  />
                </div>
              </div>

              {(dateFrom || dateTo) && (
                <button
                  type="button"
                  onClick={() => {
                    setDateFrom('');
                    setDateTo('');
                  }}
                  className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer px-1.5 py-0.5 bg-rose-50 rounded border border-rose-200"
                >
                  Clear dates
                </button>
              )}
            </div>
          </div>

          {/* Stock Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">Sr.</th>
                    <th className="py-3 px-3 min-w-[100px]">Date</th>
                    <th className="py-3 px-3 min-w-[160px]">Item Description</th>
                    <th className="py-3 px-3 text-right">Stock (Quantity)</th>
                    <th className="py-3 px-3 text-right">Purchase</th>
                    <th className="py-3 px-3 text-right">Mine</th>
                    <th className="py-3 px-3 text-right">Vehicles</th>
                    <th className="py-3 px-3 min-w-[140px]">Company Name</th>
                    <th className="py-3 px-3 text-right font-bold text-slate-900 bg-amber-50/70">Balance</th>
                    <th className="py-3 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400">
                        No stock records found matching filters.
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map((e, idx) => (
                      <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-medium text-slate-700 whitespace-nowrap">
                          {e.date}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-900 block">{e.itemName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{e.itemCode}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-800">
                          {formatNoDecimals(e.stockQty)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-700">
                          {formatNoDecimals(e.purchaseQty)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-rose-700">
                          {formatNoDecimals(e.mineQty)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-amber-700">
                          {formatNoDecimals(e.vehiclesQty)}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 font-medium">
                          {e.companyName}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-950 bg-amber-50/40">
                          {formatNoDecimals(e.balance)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditStock(e)}
                              className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors cursor-pointer"
                              title="Edit Stock Entry"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEntryToDelete(e)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              title="Remove Stock Entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {/* Stock Report Totals (No decimals) */}
                <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900 text-xs">
                  <tr>
                    <td colSpan={3} className="py-3 px-3 uppercase tracking-wider text-right font-extrabold text-slate-800">
                      Total Stock Summary:
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-slate-800">
                      {formatNoDecimals(totalStock)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-emerald-800">
                      {formatNoDecimals(totalPurchase)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-rose-800">
                      {formatNoDecimals(totalMine)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-amber-800">
                      {formatNoDecimals(totalVehicles)}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">—</td>
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-amber-950 bg-amber-100/90 text-sm">
                      {formatNoDecimals(totalBalance)}
                    </td>
                    <td className="py-3 px-3 text-center">—</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {entryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Remove Stock Entry</h3>
                <p className="text-xs text-slate-500">Confirm stock deletion</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to delete stock entry for <strong className="text-slate-900">{entryToDelete.itemName}</strong> on {entryToDelete.date}?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEntryToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                Delete Stock Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
