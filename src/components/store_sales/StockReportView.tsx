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

  // Parse DD-MM-YYYY
  const parseEntryDate = (dStr: string) => {
    const parts = dStr.split('-');
    if (parts.length === 3) {
      return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    }
    return new Date(dStr);
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

      // Date range
      const eDate = parseEntryDate(e.date);
      if (dateFrom) {
        const fDate = new Date(dateFrom);
        if (eDate < fDate) return false;
      }
      if (dateTo) {
        const tDate = new Date(dateTo);
        tDate.setHours(23, 59, 59, 999);
        if (eDate > tDate) return false;
      }

      // Time filter
      if (timeFilter === 'daily') {
        const isToday = 
          eDate.getDate() === now.getDate() &&
          eDate.getMonth() === now.getMonth() &&
          eDate.getFullYear() === now.getFullYear();
        if (!isToday) return false;
      } else if (timeFilter === 'weekly') {
        const diffTime = Math.abs(now.getTime() - eDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 7) return false;
      } else if (timeFilter === 'monthly') {
        const isThisMonth = 
          eDate.getMonth() === now.getMonth() &&
          eDate.getFullYear() === now.getFullYear();
        if (!isThisMonth) return false;
      }

      return true;
    }).sort((a, b) => {
      const tA = parseEntryDate(a.date).getTime();
      const tB = parseEntryDate(b.date).getTime();
      return sortOrder === 'desc' ? tB - tA : tA - tB;
    });
  }, [stockEntries, selectedItemId, searchTerm, dateFrom, dateTo, timeFilter, sortOrder]);

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
                  {calcBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

            {/* Date Range filter */}
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100 text-xs text-slate-600 flex-wrap">
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Date Range Filter:
              </span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">From:</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-2 py-1 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">To:</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-2 py-1 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              {(dateFrom || dateTo) && (
                <button
                  type="button"
                  onClick={() => {
                    setDateFrom('');
                    setDateTo('');
                  }}
                  className="text-xs text-rose-600 hover:underline cursor-pointer"
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
                          {e.stockQty.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-700">
                          {e.purchaseQty.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-rose-700">
                          {e.mineQty.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-amber-700">
                          {e.vehiclesQty.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 font-medium">
                          {e.companyName}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-950 bg-amber-50/40">
                          {e.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
