import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Download, 
  Printer, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  AlertCircle,
  X,
  Calendar,
  Filter,
  ArrowUpDown
} from 'lucide-react';
import { StoreItem, ItemCategory, ItemUnitType, ItemsSubTab } from '../../types/storeSales';
import { DatePickerInput } from '../common/DatePickerInput';
import { ConfirmModal } from './ConfirmModal';
import { formatWholeNumber } from '../../utils/formatters';
import { exportUniversalCsv } from '../../utils/exportCsv';
import { printConcernedTable } from '../../utils/printTable';

interface ItemsViewProps {
  items: StoreItem[];
  categories: ItemCategory[];
  unitTypes: ItemUnitType[];
  itemStockMap: Record<string, number>; // itemId -> current available stock
  onAddItem: (item: StoreItem) => void;
  onUpdateItem: (item: StoreItem) => void;
  onDeleteItem: (id: string) => void;
  initialSubTab?: ItemsSubTab;
}

export const ItemsView: React.FC<ItemsViewProps> = ({
  items,
  categories,
  unitTypes,
  itemStockMap,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  initialSubTab = 'view_items',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<ItemsSubTab>(initialSubTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortField, setSortField] = useState<'itemCode' | 'itemName' | 'date'>('itemName');
  const [sortAsc, setSortAsc] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [formDate, setFormDate] = useState(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    return `${dd}-${mm}-${today.getFullYear()}`;
  });
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formUnitTypeId, setFormUnitTypeId] = useState('');
  const [formItemCode, setFormItemCode] = useState('');
  const [formItemName, setFormItemName] = useState('');
  const [formRemarks, setFormRemarks] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<StoreItem | null>(null);

  // Confirmation Modal
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

  // Synchronize default category and unit when available
  React.useEffect(() => {
    if (!formCategoryId && categories.length > 0) {
      setFormCategoryId(categories[0].id);
    }
    if (!formUnitTypeId && unitTypes.length > 0) {
      setFormUnitTypeId(unitTypes[0].id);
    }
  }, [categories, unitTypes, formCategoryId, formUnitTypeId]);

  // Generate suggested item code
  const handleAutoSuggestCode = () => {
    const selectedCat = categories.find(c => c.id === formCategoryId);
    const prefix = selectedCat ? selectedCat.name.substring(0, 3).toUpperCase() : 'ITM';
    setFormItemCode(`ITM-${prefix}-${String(items.length + 1).padStart(3, '0')}`);
  };

  // Reset form
  const resetForm = () => {
    setFormDate(() => {
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      return `${dd}-${mm}-${today.getFullYear()}`;
    });
    setFormCategoryId(categories[0]?.id || '');
    setFormUnitTypeId(unitTypes[0]?.id || '');
    setFormItemCode('');
    setFormItemName('');
    setFormRemarks('');
    setFormError(null);
  };

  // -------------------------------------------------------------
  // Add Item Submit with Confirmation
  // -------------------------------------------------------------
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formItemCode.trim()) {
      setFormError('Item Code is required.');
      return;
    }
    if (!formItemName.trim()) {
      setFormError('Item Name is required.');
      return;
    }
    if (!formCategoryId) {
      setFormError('Please select an Item Category.');
      return;
    }
    if (!formUnitTypeId) {
      setFormError('Please select a Measurement Unit Type.');
      return;
    }

    // Check duplicate code
    if (items.some(i => i.itemCode.toLowerCase() === formItemCode.trim().toLowerCase())) {
      setFormError(`Item Code "${formItemCode.trim()}" already exists. Please choose a unique code.`);
      return;
    }

    const cat = categories.find(c => c.id === formCategoryId);
    const unit = unitTypes.find(u => u.id === formUnitTypeId);

    setConfirmModal({
      isOpen: true,
      title: 'Confirm New Store Item',
      message: `Are you sure you want to save new store item:\n\n• Code: ${formItemCode.trim().toUpperCase()}\n• Name: ${formItemName.trim()}\n• Category: ${cat?.name}\n• Unit: ${unit?.name} (${unit?.symbol})`,
      confirmText: 'Save Item',
      variant: 'primary',
      action: () => {
        const newItem: StoreItem = {
          id: `item-${Date.now()}`,
          date: formDate,
          itemCode: formItemCode.trim().toUpperCase(),
          itemName: formItemName.trim(),
          categoryId: formCategoryId,
          categoryName: cat?.name || 'General',
          unitTypeId: formUnitTypeId,
          unitTypeName: unit?.name || 'Units',
          unitSymbol: unit?.symbol || 'U',
          remarks: formRemarks.trim(),
          createdAt: new Date().toISOString(),
        };

        onAddItem(newItem);
        showToast(`Item "${newItem.itemName}" (${newItem.itemCode}) created successfully.`);
        resetForm();
        setActiveSubTab('view_items');
      },
    });
  };

  // -------------------------------------------------------------
  // Edit Item Submit with Confirmation
  // -------------------------------------------------------------
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const cat = categories.find(c => c.id === formCategoryId);
    const unit = unitTypes.find(u => u.id === formUnitTypeId);

    setConfirmModal({
      isOpen: true,
      title: 'Confirm Item Update',
      message: `Are you sure you want to update item "${editingItem.itemName}" (${editingItem.itemCode})?`,
      confirmText: 'Update Item',
      variant: 'primary',
      action: () => {
        onUpdateItem({
          ...editingItem,
          date: formDate,
          itemCode: formItemCode.trim().toUpperCase(),
          itemName: formItemName.trim(),
          categoryId: formCategoryId,
          categoryName: cat?.name || editingItem.categoryName,
          unitTypeId: formUnitTypeId,
          unitTypeName: unit?.name || editingItem.unitTypeName,
          unitSymbol: unit?.symbol || editingItem.unitSymbol,
          remarks: formRemarks.trim(),
        });
        showToast(`Item "${formItemName.trim()}" updated successfully.`);
        setEditingItem(null);
        resetForm();
      },
    });
  };

  const handleOpenEdit = (item: StoreItem) => {
    setEditingItem(item);
    setFormDate(item.date || new Date().toISOString().split('T')[0]);
    setFormCategoryId(item.categoryId || '');
    setFormUnitTypeId(item.unitTypeId || '');
    setFormItemCode(item.itemCode);
    setFormItemName(item.itemName);
    setFormRemarks(item.remarks || '');
    setFormError(null);
  };

  // -------------------------------------------------------------
  // Delete Item with Confirmation
  // -------------------------------------------------------------
  const handleDeletePrompt = (item: StoreItem) => {
    const stock = itemStockMap[item.id] || 0;
    setConfirmModal({
      isOpen: true,
      title: 'Delete Store Item',
      message: `Are you sure you want to remove item "${item.itemName}" (${item.itemCode})?` + 
        (stock > 0 ? `\n\nWarning: This item currently has ${formatWholeNumber(stock)} ${item.unitSymbol} in stock.` : ''),
      confirmText: 'Delete Item',
      variant: 'danger',
      action: () => {
        onDeleteItem(item.id);
        showToast(`Item "${item.itemName}" removed.`);
      },
    });
  };

  // -------------------------------------------------------------
  // Filtered & Sorted Items
  // -------------------------------------------------------------
  const filteredItems = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return items.filter(item => {
      const matchSearch = item.itemCode.toLowerCase().includes(q) ||
        item.itemName.toLowerCase().includes(q) ||
        (item.categoryName || '').toLowerCase().includes(q) ||
        (item.remarks || '').toLowerCase().includes(q);

      const matchCat = categoryFilter === 'all' || item.categoryId === categoryFilter;
      return matchSearch && matchCat;
    }).sort((a, b) => {
      let comp = 0;
      if (sortField === 'itemCode') comp = a.itemCode.localeCompare(b.itemCode);
      else if (sortField === 'itemName') comp = a.itemName.localeCompare(b.itemName);
      else comp = (a.date || '').localeCompare(b.date || '');
      return sortAsc ? comp : -comp;
    });
  }, [items, searchTerm, categoryFilter, sortField, sortAsc]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Sr.', 'Date', 'Item Code', 'Item Name', 'Category', 'Unit', 'Current Stock', 'Remarks'];
    const rows = filteredItems.map((item, idx) => [
      idx + 1,
      item.date,
      item.itemCode,
      item.itemName,
      item.categoryName,
      `${item.unitTypeName} (${item.unitSymbol})`,
      itemStockMap[item.id] || 0,
      item.remarks || '',
    ]);

    exportUniversalCsv(`Store_Items_Catalog_${new Date().toISOString().slice(0, 10)}.csv`, {
      tableName: 'Store Items Master Register',
      reportDate: new Date().toLocaleDateString('en-GB'),
      headers,
      rows,
    });
    showToast('Store Items exported to CSV.');
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
            <span className="text-xs text-slate-500 font-medium">Inventory Items</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            <span>Store Items Master Register</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Create and maintain raw materials, fuels, lubricants, machinery spare parts, and mine supplies.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() =>
              printConcernedTable('printable-store-items-master-table', 'Store Items Master Register', {
                tableName: 'Store Items Master Register',
                reportDate: new Date().toLocaleDateString('en-GB'),
              })
            }
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print View</span>
          </button>
        </div>
      </div>

      {/* Section Sub-Tabs: Add Item vs View Items */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('view_items')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'view_items'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>View Items List</span>
          <span className="text-[10px] bg-black/15 px-1.5 py-0.2 rounded-full">{items.length}</span>
        </button>

        <button
          type="button"
          onClick={() => { resetForm(); setActiveSubTab('add_item'); }}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'add_item'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Item</span>
        </button>
      </div>

      {/* -------------------------------------------------------------
          SUB-TAB: ADD ITEM FORM
          ------------------------------------------------------------- */}
      {activeSubTab === 'add_item' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs max-w-3xl">
          <div className="pb-4 mb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Add New Store Item</h3>
              <p className="text-xs text-slate-500 mt-0.5">Fill in the fields below. Confirmation will be requested prior to saving.</p>
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
              Step 1: Item Master
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
                  Registration Date <span className="text-rose-500">*</span>
                </label>
                <DatePickerInput
                  value={formDate}
                  onChange={setFormDate}
                  className="w-full text-xs"
                />
              </div>

              {/* Item Category */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Item Category <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formCategoryId}
                  onChange={(e) => setFormCategoryId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="" disabled>-- Select Category --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {categories.length === 0 && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    No categories defined. Go to Item Settings to add categories first.
                  </p>
                )}
              </div>

              {/* Measurement Unit Type */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Unit / Measurement Type <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formUnitTypeId}
                  onChange={(e) => setFormUnitTypeId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="" disabled>-- Select Unit Type --</option>
                  {unitTypes.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                  ))}
                </select>
              </div>

              {/* Item Code */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">
                    Item Code <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoSuggestCode}
                    className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                  >
                    Auto Generate
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={formItemCode}
                  onChange={(e) => setFormItemCode(e.target.value)}
                  placeholder="e.g. ITM-DSL-01, ITM-OIL-15W40"
                  className="w-full px-3 py-2 font-mono uppercase border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>

            {/* Item Name */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Item Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formItemName}
                onChange={(e) => setFormItemName(e.target.value)}
                placeholder="e.g. High Speed Diesel, Engine Motor Oil 15W-40, Hydraulic Hose 1/2"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            {/* Remarks */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Specifications / Remarks
              </label>
              <textarea
                rows={2}
                value={formRemarks}
                onChange={(e) => setFormRemarks(e.target.value)}
                placeholder="Technical specifications, grade, manufacturer details, reorder threshold..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { resetForm(); setActiveSubTab('view_items'); }}
                className="px-4 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                Save Item
              </button>
            </div>
          </form>
        </div>
      )}

      {/* -------------------------------------------------------------
          SUB-TAB: VIEW ITEMS (TABLE)
          ------------------------------------------------------------- */}
      {activeSubTab === 'view_items' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-xl shadow-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by code, item name, category, or remarks..."
                className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => setSortAsc(!sortAsc)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 cursor-pointer"
                title="Toggle sort direction"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>{sortAsc ? 'A-Z' : 'Z-A'}</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div id="printable-store-items-master-table" className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden print-concerned-table">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">Sr.</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Item Code</th>
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Unit Type</th>
                    <th className="py-3 px-4 text-right">Current Stock</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400">
                        No store items found matching search filters.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item, idx) => {
                      const stock = itemStockMap[item.id] || 0;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-4 font-mono text-slate-600">{item.date}</td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">{item.itemCode}</td>
                          <td className="py-3 px-4 font-semibold text-slate-900">{item.itemName}</td>
                          <td className="py-3 px-4">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700">
                              {item.categoryName}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-700">
                            {item.unitTypeName} ({item.unitSymbol})
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-800 tabular-nums">
                            {formatWholeNumber(stock)} <span className="font-normal text-[10px] text-slate-400">{item.unitSymbol}</span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(item)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Item"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePrompt(item)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Remove Item"
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
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          EDIT ITEM MODAL (ALWAYS ASKS CONFIRMATION ON SUBMIT)
          ========================================================= */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 max-w-xl w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                <span>Edit Store Item: {editingItem.itemCode}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
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
                  <label className="block font-semibold text-slate-700 mb-1">Item Category</label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Measurement Unit</label>
                  <select
                    value={formUnitTypeId}
                    onChange={(e) => setFormUnitTypeId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {unitTypes.map((u) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Item Code</label>
                  <input
                    type="text"
                    required
                    value={formItemCode}
                    onChange={(e) => setFormItemCode(e.target.value)}
                    className="w-full px-3 py-2 font-mono uppercase border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  value={formItemName}
                  onChange={(e) => setFormItemName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Remarks</label>
                <textarea
                  rows={2}
                  value={formRemarks}
                  onChange={(e) => setFormRemarks(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-3.5 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                >
                  Update Item
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

export default ItemsView;
