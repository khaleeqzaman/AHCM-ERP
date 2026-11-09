import React, { useState, useMemo } from 'react';
import { 
  Fuel, 
  Truck, 
  Pickaxe, 
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
  Filter, 
  Layers, 
  Eye, 
  FileSpreadsheet,
  AlertTriangle
} from 'lucide-react';
import { 
  ItemConsumptionRecord, 
  StoreItem, 
  VehicleRecord, 
  MineRecord, 
  ItemConsumptionSubTab,
  ConsumptionTargetType 
} from '../../types/storeSales';
import { DatePickerInput } from '../common/DatePickerInput';
import { ConfirmModal } from './ConfirmModal';
import { formatWholeNumber } from '../../utils/formatters';

interface ItemConsumptionViewProps {
  consumptions: ItemConsumptionRecord[];
  items: StoreItem[];
  vehicles: VehicleRecord[];
  mines: MineRecord[];
  itemStockMap: Record<string, number>; // itemId -> current live stock quantity
  onAddConsumption: (record: ItemConsumptionRecord) => void;
  onUpdateConsumption: (record: ItemConsumptionRecord) => void;
  onDeleteConsumption: (id: string) => void;
  initialSubTab?: ItemConsumptionSubTab;
}

export const ItemConsumptionView: React.FC<ItemConsumptionViewProps> = ({
  consumptions,
  items,
  vehicles,
  mines,
  itemStockMap,
  onAddConsumption,
  onUpdateConsumption,
  onDeleteConsumption,
  initialSubTab = 'view_consumption',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<ItemConsumptionSubTab>(initialSubTab);
  const [consumptionViewFilter, setConsumptionViewFilter] = useState<'all' | 'vehicle' | 'mine' | 'item'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [targetFilter, setTargetFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Add Form State
  const [formConsumptionType, setFormConsumptionType] = useState<ConsumptionTargetType>('vehicle');
  const [formDate, setFormDate] = useState(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    return `${dd}-${mm}-${today.getFullYear()}`;
  });
  const [formVehicleId, setFormVehicleId] = useState(vehicles[0]?.id || '');
  const [formMineId, setFormMineId] = useState(mines[0]?.id || '');
  const [formItemId, setFormItemId] = useState(items[0]?.id || '');
  const [formQuantity, setFormQuantity] = useState<number | ''>('');
  const [formOperator, setFormOperator] = useState('');
  const [formRemarks, setFormRemarks] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Edit Modal State
  const [editingRecord, setEditingRecord] = useState<ItemConsumptionRecord | null>(null);

  // Report Item Visibility Filter (allow user to add/remove items from report table)
  const [selectedReportItemIds, setSelectedReportItemIds] = useState<string[]>(() => items.map(i => i.id));

  // Sync selected items if new items arrive
  React.useEffect(() => {
    if (selectedReportItemIds.length === 0 && items.length > 0) {
      setSelectedReportItemIds(items.map(i => i.id));
    }
  }, [items, selectedReportItemIds.length]);

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

  const selectedItem = useMemo(() => {
    return items.find(i => i.id === formItemId);
  }, [items, formItemId]);

  const currentAvailableStock = useMemo(() => {
    return formItemId ? (itemStockMap[formItemId] || 0) : 0;
  }, [itemStockMap, formItemId]);

  // -------------------------------------------------------------
  // Add Consumption Submit
  // -------------------------------------------------------------
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formItemId) {
      setFormError('Please select an item.');
      return;
    }

    const qty = Number(formQuantity);
    if (!qty || qty <= 0) {
      setFormError('Consumption quantity must be greater than 0.');
      return;
    }

    // Strict validation: cannot consume more than available stock!
    if (qty > currentAvailableStock) {
      setFormError(
        `Insufficient Stock! Available stock for "${selectedItem?.itemName}" is only ${formatWholeNumber(currentAvailableStock)} ${selectedItem?.unitSymbol}. You cannot issue ${formatWholeNumber(qty)} ${selectedItem?.unitSymbol}.`
      );
      return;
    }

    let targetName = '';
    let targetId = '';

    if (formConsumptionType === 'vehicle') {
      const veh = vehicles.find(v => v.id === formVehicleId);
      if (!veh) {
        setFormError('Please select a valid vehicle / machinery.');
        return;
      }
      targetId = veh.id;
      targetName = `${veh.vehicleNo} (${veh.vehicleType})`;
    } else {
      const mine = mines.find(m => m.id === formMineId);
      if (!mine) {
        setFormError('Please select a valid mine site.');
        return;
      }
      targetId = mine.id;
      targetName = mine.name;
    }

    const item = selectedItem!;

    setConfirmModal({
      isOpen: true,
      title: 'Confirm Item Consumption Issue',
      message: `Are you sure you want to issue consumption:\n\n• Target: ${targetName}\n• Item: ${item.itemName} (${item.itemCode})\n• Quantity: ${formatWholeNumber(qty)} ${item.unitSymbol}\n• Remaining Stock After Issue: ${formatWholeNumber(currentAvailableStock - qty)} ${item.unitSymbol}\n• Date: ${formDate}`,
      confirmText: 'Issue Consumption',
      variant: 'primary',
      action: () => {
        const newRecord: ItemConsumptionRecord = {
          id: `con-${Date.now()}`,
          date: formDate,
          consumptionType: formConsumptionType,
          targetId,
          targetName,
          itemId: item.id,
          itemCode: item.itemCode,
          itemName: item.itemName,
          unit: item.unitSymbol || (item as any).unit || 'Units',
          quantity: qty,
          operatorName: formOperator.trim(),
          remarks: formRemarks.trim(),
          createdAt: new Date().toISOString(),
        };

        onAddConsumption(newRecord);
        showToast(`Issued ${formatWholeNumber(qty)} ${item.unitSymbol} of ${item.itemName} to ${targetName}. Stock decreased.`);
        setFormQuantity('');
        setFormRemarks('');
        setFormOperator('');
        setActiveSubTab('view_consumption');
      },
    });
  };

  // -------------------------------------------------------------
  // Edit Consumption Submit
  // -------------------------------------------------------------
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    const qty = Number(formQuantity);
    if (!qty || qty <= 0) return;

    // Available stock + previous quantity since we are editing
    const effectiveStock = (itemStockMap[editingRecord.itemId] || 0) + editingRecord.quantity;
    if (qty > effectiveStock) {
      setFormError(`Insufficient stock! Maximum allowed is ${formatWholeNumber(effectiveStock)}.`);
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Confirm Consumption Update',
      message: `Update consumption entry for ${editingRecord.targetName} to ${formatWholeNumber(qty)} ${editingRecord.unit}?`,
      confirmText: 'Update Entry',
      variant: 'primary',
      action: () => {
        onUpdateConsumption({
          ...editingRecord,
          date: formDate,
          quantity: qty,
          operatorName: formOperator.trim(),
          remarks: formRemarks.trim(),
        });
        showToast(`Consumption entry updated.`);
        setEditingRecord(null);
      },
    });
  };

  const handleOpenEdit = (rec: ItemConsumptionRecord) => {
    setEditingRecord(rec);
    setFormDate(rec.date);
    setFormQuantity(rec.quantity);
    setFormOperator(rec.operatorName || '');
    setFormRemarks(rec.remarks || '');
    setFormError(null);
  };

  const handleDeletePrompt = (rec: ItemConsumptionRecord) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Consumption Entry',
      message: `Are you sure you want to delete this consumption record (${formatWholeNumber(rec.quantity)} ${rec.unit} for ${rec.targetName})?\n\nThis quantity will be restored to available store stock.`,
      confirmText: 'Delete Entry',
      variant: 'danger',
      action: () => {
        onDeleteConsumption(rec.id);
        showToast(`Consumption record deleted. Stock restored.`);
      },
    });
  };

  // -------------------------------------------------------------
  // Filtered Consumption Records
  // -------------------------------------------------------------
  const filteredConsumptions = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return consumptions.filter(c => {
      const matchSearch = c.targetName.toLowerCase().includes(q) ||
        c.itemCode.toLowerCase().includes(q) ||
        c.itemName.toLowerCase().includes(q) ||
        (c.operatorName || '').toLowerCase().includes(q) ||
        (c.remarks || '').toLowerCase().includes(q);

      const matchType = consumptionViewFilter === 'all' || c.consumptionType === consumptionViewFilter;
      const matchFrom = !dateFrom || c.date >= dateFrom;
      const matchTo = !dateTo || c.date <= dateTo;

      return matchSearch && matchType && matchFrom && matchTo;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [consumptions, searchTerm, consumptionViewFilter, dateFrom, dateTo]);

  // Item-wise Aggregated View Data
  const itemWiseConsumptionSummary = useMemo(() => {
    const map = new Map<string, { itemId: string; itemCode: string; itemName: string; unit: string; vehicleQty: number; mineQty: number; totalQty: number; logsCount: number }>();
    filteredConsumptions.forEach(c => {
      const existing = map.get(c.itemId) || {
        itemId: c.itemId,
        itemCode: c.itemCode,
        itemName: c.itemName,
        unit: c.unit,
        vehicleQty: 0,
        mineQty: 0,
        totalQty: 0,
        logsCount: 0,
      };
      if (c.consumptionType === 'vehicle') {
        existing.vehicleQty += c.quantity;
      } else {
        existing.mineQty += c.quantity;
      }
      existing.totalQty += c.quantity;
      existing.logsCount += 1;
      map.set(c.itemId, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.totalQty - a.totalQty);
  }, [filteredConsumptions]);

  // Report Filtered Data (respects user's add/remove items from report table)
  const reportTableRows = useMemo(() => {
    return filteredConsumptions.filter(c => selectedReportItemIds.includes(c.itemId));
  }, [filteredConsumptions, selectedReportItemIds]);

  const toggleReportItem = (itemId: string) => {
    setSelectedReportItemIds(prev => 
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  // CSV Export for View Consumption
  const handleExportCSV = () => {
    const headers = ['Sr.', 'Date', 'Type', 'Target (Vehicle/Mine)', 'Item Code', 'Item Name', 'Unit', 'Quantity Consumed', 'Operator / Incharge', 'Remarks'];
    const rows = filteredConsumptions.map((c, idx) => [
      idx + 1,
      `"${c.date}"`,
      c.consumptionType.toUpperCase(),
      `"${c.targetName}"`,
      `"${c.itemCode}"`,
      `"${c.itemName.replace(/"/g, '""')}"`,
      `"${c.unit}"`,
      c.quantity,
      `"${(c.operatorName || '').replace(/"/g, '""')}"`,
      `"${(c.remarks || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Item_Consumption_Register_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Consumption register exported to CSV.');
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
            <span className="text-xs text-slate-500 font-medium">Internal Consumption</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <Fuel className="w-5 h-5 text-blue-600" />
            <span>Item Consumption & Material Requisition</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Issue diesel, motor oils, filters, and spares to mining sites and haulage vehicles. Stock balances auto-decrease.
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
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print View</span>
          </button>
        </div>
      </div>

      {/* Sub-Tabs: Add Consumption, View Item Consumption, Item Consumption Report */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('view_consumption')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'view_consumption'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>View Item Consumption</span>
          <span className="text-[10px] bg-black/15 px-1.5 py-0.2 rounded-full">{consumptions.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('consumption_report')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'consumption_report'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Item Consumption Report</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('add_consumption')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'add_consumption'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Consumption</span>
        </button>
      </div>

      {/* -------------------------------------------------------------
          SUB-TAB 1: ADD CONSUMPTION FORM
          Two options: Vehicle Consumption & Mine Consumption
          Item dropdown shows CURRENT STOCK QUANTITY!
          Decreases item stock quantity!
          ------------------------------------------------------------- */}
      {activeSubTab === 'add_consumption' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs max-w-3xl">
          <div className="pb-4 mb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Issue Store Item Consumption</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Select Vehicle Consumption or Mine Consumption. Items validate against real-time pithead stock.
              </p>
            </div>

            {/* Target Type Switcher */}
            <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setFormConsumptionType('vehicle')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  formConsumptionType === 'vehicle'
                    ? 'bg-white text-teal-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Truck className="w-3.5 h-3.5 text-teal-600" />
                <span>Vehicle Consumption</span>
              </button>
              <button
                type="button"
                onClick={() => setFormConsumptionType('mine')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  formConsumptionType === 'mine'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Pickaxe className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mine Consumption</span>
              </button>
            </div>
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
                  Requisition Date <span className="text-rose-500">*</span>
                </label>
                <DatePickerInput value={formDate} onChange={setFormDate} className="w-full text-xs" />
              </div>

              {/* Vehicle / Mine Selector */}
              {formConsumptionType === 'vehicle' ? (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-teal-600" />
                    <span>Select Vehicle / Equipment <span className="text-rose-500">*</span></span>
                  </label>
                  <select
                    required
                    value={formVehicleId}
                    onChange={(e) => setFormVehicleId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="" disabled>-- Select Vehicle --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.vehicleNo} ({v.vehicleType}) — Driver: {v.driverName}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Pickaxe className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Select Mine Site <span className="text-rose-500">*</span></span>
                  </label>
                  <select
                    required
                    value={formMineId}
                    onChange={(e) => setFormMineId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="" disabled>-- Select Mine --</option>
                    {mines.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.location || 'Active Ridge'}) — {m.incharge}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Item Dropdown WITH CURRENT STOCK QUANTITY! */}
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Item Selection (With Current Available Stock) <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formItemId}
                  onChange={(e) => setFormItemId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                >
                  <option value="" disabled>-- Select Item to Issue --</option>
                  {items.map((item) => {
                    const stock = itemStockMap[item.id] || 0;
                    return (
                      <option key={item.id} value={item.id}>
                        {item.itemName} ({item.itemCode}) — [Available Stock: {formatWholeNumber(stock)} {item.unitSymbol}]
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Live Stock Indicator Banner */}
              {selectedItem && (
                <div className="sm:col-span-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-emerald-900">
                      Current Available Balance for <strong>{selectedItem.itemName}</strong>:
                    </span>
                  </div>
                  <span className="font-mono font-bold text-sm text-emerald-950">
                    {formatWholeNumber(currentAvailableStock)} {selectedItem.unitSymbol}
                  </span>
                </div>
              )}

              {/* Consumption Quantity */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Consumption Quantity (Deducted from Stock) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={currentAvailableStock}
                    required
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder={`Max ${formatWholeNumber(currentAvailableStock)}`}
                    className="w-full pl-3 pr-16 py-2 border border-slate-300 rounded-lg font-mono font-bold text-rose-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">
                    {selectedItem?.unitSymbol || 'Units'}
                  </span>
                </div>
                {Number(formQuantity) > currentAvailableStock && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1">
                    Cannot issue more than {formatWholeNumber(currentAvailableStock)} {selectedItem?.unitSymbol}!
                  </p>
                )}
              </div>

              {/* Operator / Incharge */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Operator / Driver / Receiving Official
                </label>
                <input
                  type="text"
                  value={formOperator}
                  onChange={(e) => setFormOperator(e.target.value)}
                  placeholder="e.g. Abdul Rasheed, Engr. Tariq"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Purpose / Work Order / Remarks
              </label>
              <textarea
                rows={2}
                value={formRemarks}
                onChange={(e) => setFormRemarks(e.target.value)}
                placeholder="Hour meter reading, pit excavation haulage run, emergency compressor refill..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveSubTab('view_consumption')}
                className="px-4 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={currentAvailableStock <= 0 || (Number(formQuantity) > currentAvailableStock)}
                className="px-5 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                Issue Consumption
              </button>
            </div>
          </form>
        </div>
      )}

      {/* -------------------------------------------------------------
          SUB-TAB 2: VIEW ITEM CONSUMPTION
          Views: Vehicle-wise, Mine-wise, and Item-wise
          ------------------------------------------------------------- */}
      {activeSubTab === 'view_consumption' && (
        <div className="space-y-4">
          {/* Top View Filter Switcher: All, Vehicle-wise, Mine-wise, Item-wise */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-xl shadow-xs">
            <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200 flex-wrap">
              <button
                type="button"
                onClick={() => setConsumptionViewFilter('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  consumptionViewFilter === 'all' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Logs ({consumptions.length})
              </button>
              <button
                type="button"
                onClick={() => setConsumptionViewFilter('vehicle')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  consumptionViewFilter === 'vehicle' ? 'bg-white text-teal-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Truck className="w-3.5 h-3.5 text-teal-600" />
                <span>Vehicle-Wise</span>
              </button>
              <button
                type="button"
                onClick={() => setConsumptionViewFilter('mine')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  consumptionViewFilter === 'mine' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Pickaxe className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mine(s)-Wise</span>
              </button>
              <button
                type="button"
                onClick={() => setConsumptionViewFilter('item')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  consumptionViewFilter === 'item' ? 'bg-white text-purple-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-purple-600" />
                <span>Item-Wise Consolidated</span>
              </button>
            </div>

            <div className="relative flex-1 max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search consumption records..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* ITEM-WISE CONSOLIDATED VIEW TABLE */}
          {consumptionViewFilter === 'item' ? (
            <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">Sr.</th>
                      <th className="py-3 px-4">Item Code</th>
                      <th className="py-3 px-4">Item Name</th>
                      <th className="py-3 px-4 text-right text-teal-800 bg-teal-50/40">Total Vehicle Consumed</th>
                      <th className="py-3 px-4 text-right text-emerald-800 bg-emerald-50/40">Total Mine Consumed</th>
                      <th className="py-3 px-4 text-right font-bold text-slate-900 bg-slate-100/60">
                        Total Consumption
                      </th>
                      <th className="py-3 px-4 text-center">Entries</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {itemWiseConsumptionSummary.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-slate-400">
                          No item consumption records found.
                        </td>
                      </tr>
                    ) : (
                      itemWiseConsumptionSummary.map((row, idx) => (
                        <tr key={row.itemId} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">{row.itemCode}</td>
                          <td className="py-3 px-4 font-semibold text-slate-900">{row.itemName}</td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums text-teal-800 bg-teal-50/20">
                            {formatWholeNumber(row.vehicleQty)} <span className="text-[10px] text-slate-400">{row.unit}</span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-800 bg-emerald-50/20">
                            {formatWholeNumber(row.mineQty)} <span className="text-[10px] text-slate-400">{row.unit}</span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-rose-900 bg-slate-100/40 tabular-nums">
                            {formatWholeNumber(row.totalQty)} <span className="text-[10px] text-slate-500 font-normal">{row.unit}</span>
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-slate-500">
                            {row.logsCount} logs
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* DETAILED LOGS TABLE (All / Vehicle / Mine) */
            <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">Sr.</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Target (Vehicle / Mine)</th>
                      <th className="py-3 px-4">Item Code</th>
                      <th className="py-3 px-4">Item Name</th>
                      <th className="py-3 px-4 text-right">Quantity Consumed</th>
                      <th className="py-3 px-4">Operator / Incharge</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {filteredConsumptions.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-10 text-center text-slate-400">
                          No consumption entries match selected filter. Click "Add Consumption" to record issues.
                        </td>
                      </tr>
                    ) : (
                      filteredConsumptions.map((rec, idx) => (
                        <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">{rec.date}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              rec.consumptionType === 'vehicle' ? 'bg-teal-100 text-teal-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {rec.consumptionType === 'vehicle' ? <Truck className="w-3 h-3" /> : <Pickaxe className="w-3 h-3" />}
                              <span>{rec.consumptionType === 'vehicle' ? 'Vehicle' : 'Mine'}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900">{rec.targetName}</td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">{rec.itemCode}</td>
                          <td className="py-3 px-4 font-medium text-slate-800">{rec.itemName}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-rose-800 tabular-nums">
                            -{formatWholeNumber(rec.quantity)} <span className="text-[10px] font-normal text-slate-500">{rec.unit}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">{rec.operatorName || '—'}</td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(rec)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Consumption"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePrompt(rec)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Record"
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
          )}
        </div>
      )}

      {/* -------------------------------------------------------------
          SUB-TAB 3: ITEM CONSUMPTION REPORT
          User should be able to add/remove items from the report table,
          have all kind of sorting, filtering, export and print options
          ------------------------------------------------------------- */}
      {activeSubTab === 'consumption_report' && (
        <div className="space-y-4">
          {/* Item Selector Filter: Add / Remove Items from the report table */}
          <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-blue-600" />
                <span>Included Items in Report Table ({selectedReportItemIds.length}/{items.length})</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedReportItemIds(items.map(i => i.id))}
                  className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => setSelectedReportItemIds([])}
                  className="text-[11px] text-slate-500 hover:underline cursor-pointer"
                >
                  Deselect All
                </button>
              </div>
            </div>

            {/* Checkboxes of items */}
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
              {items.map((item) => {
                const isSelected = selectedReportItemIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleReportItem(item.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 border-blue-300 text-blue-900 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="rounded text-blue-600 focus:ring-blue-500 w-3 h-3 pointer-events-none"
                    />
                    <span>{item.itemName} ({item.itemCode})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Report Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">Sr.</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Target Entity</th>
                    <th className="py-3 px-4">Item Code</th>
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-4 text-right">Quantity Consumed</th>
                    <th className="py-3 px-4">Authorizing Official</th>
                    <th className="py-3 px-4">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {reportTableRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-slate-400">
                        No consumption entries match report criteria or selected items.
                      </td>
                    </tr>
                  ) : (
                    reportTableRows.map((rec, idx) => (
                      <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-4 font-mono text-slate-600 whitespace-nowrap">{rec.date}</td>
                        <td className="py-2.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                            rec.consumptionType === 'vehicle' ? 'bg-teal-50 text-teal-800' : 'bg-emerald-50 text-emerald-800'
                          }`}>
                            {rec.consumptionType === 'vehicle' ? 'Vehicle' : 'Mine'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-slate-900">{rec.targetName}</td>
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{rec.itemCode}</td>
                        <td className="py-2.5 px-4 text-slate-800">{rec.itemName}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-800 tabular-nums">
                          -{formatWholeNumber(rec.quantity)} <span className="text-[10px] text-slate-400 font-normal">{rec.unit}</span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-600">{rec.operatorName || '—'}</td>
                        <td className="py-2.5 px-4 text-slate-500 max-w-xs truncate">{rec.remarks || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          EDIT CONSUMPTION MODAL
          ========================================================= */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                <span>Edit Consumption Issue</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Target:</span>
                  <span className="font-semibold text-slate-900">{editingRecord.targetName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Item:</span>
                  <span className="font-semibold text-slate-900">{editingRecord.itemName} ({editingRecord.itemCode})</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Date</label>
                <DatePickerInput value={formDate} onChange={setFormDate} className="w-full text-xs" />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Quantity ({editingRecord.unit})</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={formQuantity}
                  onChange={(e) => setFormQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 font-mono font-bold text-rose-800 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Operator / Official</label>
                <input
                  type="text"
                  value={formOperator}
                  onChange={(e) => setFormOperator(e.target.value)}
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
                  onClick={() => setEditingRecord(null)}
                  className="px-3.5 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                >
                  Update Issue
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

export default ItemConsumptionView;
