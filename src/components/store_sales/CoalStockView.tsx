import React, { useState, useMemo } from 'react';
import { 
  Printer, 
  Download, 
  Plus, 
  Search, 
  Sliders, 
  FileText, 
  Layers, 
  Boxes 
} from 'lucide-react';
import type { CoalStockRecord, PartnerRecord, CoalSellRecord, CompanySettings } from '../../types/storeSales.ts';
import ConfirmModal from './ConfirmModal.tsx';
import { printConcernedTable } from '../../utils/printTable.ts';
import { exportUniversalCsv } from '../../utils/exportCsv.ts';

interface CoalStockViewProps {
  coalStocks: CoalStockRecord[];
  partners: PartnerRecord[];
  coalSells: CoalSellRecord[];
  companySettings: CompanySettings;
  onAddCoalStock: (stock: Omit<CoalStockRecord, 'id' | 'createdAt'>) => void;
  onUpdateCoalStock: (stock: CoalStockRecord) => void;
  onDeleteCoalStock: (id: string) => void;
  onUpdateCompanySettings: (settings: CompanySettings) => void;
}

export const CoalStockView: React.FC<CoalStockViewProps> = ({
  coalStocks,
  partners,
  coalSells,
  companySettings,
  onAddCoalStock,
  onUpdateCoalStock,
  onDeleteCoalStock,
  onUpdateCompanySettings,
}) => {
  // Tabs: 'register' | 'add' | 'settings'
  const [activeTab, setActiveTab] = useState<'register' | 'add' | 'settings'>('register');

  // Form State
  const todayStr = new Date().toISOString().split('T')[0].split('-').reverse().join('-');
  const [formData, setFormData] = useState({
    date: todayStr,
    partnerId: partners[0]?.id || '',
    quantity: '',
    pitheadLocation: '',
    vehicleRef: '',
    remarks: '',
  });

  // Edit State
  const [editingStock, setEditingStock] = useState<CoalStockRecord | null>(null);

  // Opening balance form state
  const [openingBalanceInput, setOpeningBalanceInput] = useState<string>(
    String(companySettings.openingCoalStock ?? 0)
  );

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [partnerFilter, setPartnerFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortField, setSortField] = useState<'date' | 'quantity' | 'partnerName'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: 'primary' | 'danger';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Math Calculations: Strictly in Tons
  const openingStock = Number(companySettings.openingCoalStock || 0);
  const totalStockAdded = useMemo(() => {
    return coalStocks.reduce((sum, s) => sum + Number(s.quantity || 0), 0);
  }, [coalStocks]);

  const totalCoalSold = useMemo(() => {
    return coalSells.reduce((sum, s) => sum + Number(s.quantity || 0), 0);
  }, [coalSells]);

  const liveCoalStock = (openingStock + totalStockAdded) - totalCoalSold;

  // Filtered & Sorted stock list
  const filteredStocks = useMemo(() => {
    return coalStocks.filter(stk => {
      const matchSearch =
        stk.partnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stk.date.includes(searchTerm) ||
        (stk.pitheadLocation && stk.pitheadLocation.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (stk.remarks && stk.remarks.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchPartner = partnerFilter ? stk.partnerId === partnerFilter : true;
      return matchSearch && matchPartner;
    }).sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') cmp = a.date.localeCompare(b.date);
      else if (sortField === 'quantity') cmp = a.quantity - b.quantity;
      else if (sortField === 'partnerName') cmp = a.partnerName.localeCompare(b.partnerName);
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [coalStocks, searchTerm, partnerFilter, sortField, sortOrder]);

  // Handle Form Submission
  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(formData.quantity);
    if (isNaN(qty) || qty <= 0) {
      alert('Please enter a valid coal quantity in Tons (> 0)');
      return;
    }
    const partner = partners.find(p => p.id === formData.partnerId);
    if (!partner) {
      alert('Please select a valid partner');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Confirm Add Coal Stock',
      message: `Are you sure you want to record ${qty.toLocaleString()} Tons of coal stock for partner "${partner.name}" on ${formData.date}?`,
      confirmLabel: 'Confirm & Save',
      variant: 'primary',
      onConfirm: () => {
        onAddCoalStock({
          date: formData.date,
          partnerId: partner.id,
          partnerName: partner.name,
          quantity: qty,
          pitheadLocation: formData.pitheadLocation.trim() || undefined,
          vehicleRef: formData.vehicleRef.trim() || undefined,
          remarks: formData.remarks.trim() || undefined,
        });
        setFormData({
          date: todayStr,
          partnerId: partners[0]?.id || '',
          quantity: '',
          pitheadLocation: '',
          vehicleRef: '',
          remarks: '',
        });
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setActiveTab('register');
      },
    });
  };

  // Handle Edit Submit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStock) return;
    const qty = Number(editingStock.quantity);
    if (isNaN(qty) || qty <= 0) {
      alert('Please enter a valid coal quantity in Tons');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Confirm Update Coal Stock',
      message: `Are you sure you want to update this coal stock entry to ${qty.toLocaleString()} Tons for "${editingStock.partnerName}"?`,
      confirmLabel: 'Save Changes',
      variant: 'primary',
      onConfirm: () => {
        onUpdateCoalStock(editingStock);
        setEditingStock(null);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Handle Delete
  const handleDeleteClick = (stock: CoalStockRecord) => {
    setConfirmModal({
      isOpen: true,
      title: 'Confirm Delete Coal Stock Entry',
      message: `Are you sure you want to permanently delete the stock entry of ${stock.quantity} Tons (${stock.partnerName}) on ${stock.date}? This will recalculate live coal stock.`,
      confirmLabel: 'Delete Entry',
      variant: 'danger',
      onConfirm: () => {
        onDeleteCoalStock(stock.id);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Save Opening Balance
  const handleSaveOpeningBalance = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(openingBalanceInput);
    if (isNaN(val) || val < 0) {
      alert('Please enter a valid non-negative number for Opening Coal Stock (in Tons)');
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: 'Update Opening Coal Stock',
      message: `Set initial opening balance to ${val.toLocaleString()} Tons? This will be added to the live coal stock formula.`,
      confirmLabel: 'Update Balance',
      variant: 'primary',
      onConfirm: () => {
        onUpdateCompanySettings({
          ...companySettings,
          openingCoalStock: val,
        });
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setActiveTab('register');
      },
    });
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Sr', 'Date', 'Partner Name', 'Quantity (Tons)', 'Pithead Location', 'Vehicle Ref', 'Remarks'];
    const rows = filteredStocks.map((stk, idx) => [
      idx + 1,
      stk.date,
      stk.partnerName,
      stk.quantity,
      stk.pitheadLocation || '',
      stk.vehicleRef || '',
      stk.remarks || '',
    ]);

    const totalQty = filteredStocks.reduce((sum, s) => sum + (s.quantity || 0), 0);

    exportUniversalCsv(`coal_stock_register_${todayStr}.csv`, {
      tableName: 'Coal Production & Extraction Stock Register',
      companySettings,
      reportDate: todayStr,
      headers,
      rows,
      totalsRow: ['Total Extracted Tons', '', '', totalQty, '', '', ''],
    });
  };

  // Print Register (Table Only)
  const handlePrint = () => {
    printConcernedTable(
      'printable-coal-stock-register-table',
      `Coal Stock Register - ${companySettings.companyName}`,
      {
        companySettings,
        tableName: 'Coal Production & Extraction Stock Register',
        reportDate: todayStr,
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Telemetry / Live Coal Stock KPI Cards strictly in Tons */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Live Coal Stock Card */}
        <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white rounded-xl p-5 shadow-sm border border-emerald-800">
          <div className="flex items-center justify-between text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>LIVE COAL STOCK</span>
            <span className="p-1.5 bg-emerald-800/60 rounded-md">📦</span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold tracking-tight">{liveCoalStock.toLocaleString()}</span>
            <span className="text-emerald-300 font-semibold text-sm">Tons</span>
          </div>
          <div className="mt-3 pt-3 border-t border-emerald-800/80 text-xs text-emerald-200/90 flex justify-between items-center">
            <span>Formula: ({openingStock} + {totalStockAdded} - {totalCoalSold})</span>
            <span className="text-[11px] bg-emerald-800 px-2 py-0.5 rounded font-mono">Available</span>
          </div>
        </div>

        {/* Total Stock Added Card */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            Total Inflow Recorded
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-800">{totalStockAdded.toLocaleString()}</span>
            <span className="text-slate-500 text-sm font-medium">Tons</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Across {coalStocks.length} production / stock entries
          </div>
        </div>

        {/* Dispatched / Sold Card */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            Total Coal Sold / Dispatched
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-800">{totalCoalSold.toLocaleString()}</span>
            <span className="text-slate-500 text-sm font-medium">Tons</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Across {coalSells.length} sales invoice entries
          </div>
        </div>

        {/* Opening Balance Card with Quick Edit */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Opening Stock Balance</span>
              <button
                onClick={() => setActiveTab('settings')}
                className="text-xs text-emerald-700 hover:text-emerald-900 font-medium underline"
              >
                Set Opening
              </button>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-slate-800">{openingStock.toLocaleString()}</span>
              <span className="text-slate-500 text-sm font-medium">Tons</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            User-configured opening base
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'register'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>View Coal Stock Register</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('add')}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'add'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Add Coal Stock</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Opening Coal Stock</span>
          </button>
        </div>

        {activeTab === 'register' && (
          <div className="flex items-center gap-2 no-print">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-emerald-50 border border-emerald-300 rounded-lg text-xs font-semibold text-emerald-800 hover:bg-emerald-100 flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Print Coal Stock Register Table Only"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-700" />
              <span>Print View (Table Only)</span>
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: ADD COAL STOCK FORM */}
      {activeTab === 'add' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-2xl mx-auto">
          <div className="border-b border-slate-100 pb-4 mb-5">
            <h2 className="text-lg font-semibold text-slate-900">Add Coal Stock Entry</h2>
            <p className="text-xs text-slate-500 mt-1">
              Record new coal extraction or pithead arrival. Specify date, mining partner, and quantity in Tons.
            </p>
          </div>

          <form onSubmit={handleSubmitAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date (DD-MM-YYYY) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="09-01-2026"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Partner Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Partner Name <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.partnerId}
                  onChange={e => setFormData({ ...formData, partnerId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                >
                  {partners.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Quantity in Tons */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quantity (Tons) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="e.g. 500"
                  value={formData.quantity}
                  onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">Measurement unit is strictly Tons</span>
              </div>

              {/* Pithead Location */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pithead / Yard Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Degari Pithead Yard 1"
                  value={formData.pitheadLocation}
                  onChange={e => setFormData({ ...formData, pitheadLocation: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Vehicle Ref */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vehicle / Bilty Ref (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. DT-104 or BLT-291"
                  value={formData.vehicleRef}
                  onChange={e => setFormData({ ...formData, vehicleRef: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Remarks / Seam Grade
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sub-bituminous steam coal, seam A"
                  value={formData.remarks}
                  onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab('register')}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-semibold shadow-sm"
              >
                Record Coal Stock
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: SETTINGS (OPENING COAL STOCK) */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-xl mx-auto">
          <div className="border-b border-slate-100 pb-4 mb-5">
            <h2 className="text-lg font-semibold text-slate-900">Set Opening Coal Stock</h2>
            <p className="text-xs text-slate-500 mt-1">
              You can set any opening balance of coal stock you want (e.g., 0, 1, 50, 500 Tons). The system will not force a default of 100 Tons.
            </p>
          </div>

          <form onSubmit={handleSaveOpeningBalance} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Opening Coal Stock Quantity (Tons) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={openingBalanceInput}
                  onChange={e => setOpeningBalanceInput(e.target.value)}
                  className="w-full pl-3 pr-16 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold text-slate-800"
                />
                <span className="absolute right-3 top-2 text-xs font-semibold text-slate-400">Tons</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Current configured opening balance: <strong>{companySettings.openingCoalStock ?? 0} Tons</strong>.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="font-semibold text-slate-800">Formula Breakdown:</div>
              <div>Live Coal Stock = <strong>Opening ({openingBalanceInput || 0} Tons)</strong> + Total Stock Added ({totalStockAdded} Tons) - Total Coal Sold ({totalCoalSold} Tons)</div>
              <div>Result = <strong>{((parseFloat(openingBalanceInput) || 0) + totalStockAdded - totalCoalSold).toLocaleString()} Tons</strong></div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab('register')}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Back to Register
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-semibold shadow-sm"
              >
                Save Opening Stock
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: COAL STOCK REGISTER (TABLE) */}
      {activeTab === 'register' && (
        <div id="printable-coal-stock-register-table" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden print-concerned-table">
          {/* Print only formal header */}
          <div className="hidden print:block print-only-header p-4 border-b border-slate-200 text-center">
            <h1 className="text-base font-bold text-slate-900">{companySettings.companyName}</h1>
            <p className="text-xs text-slate-700 font-semibold uppercase tracking-wider">Coal Stock Register & Pithead Extraction Logs</p>
            <p className="text-[10px] text-slate-500">Printed on {new Date().toLocaleDateString('en-GB')} · Unit: Strictly Tons</p>
          </div>

          {/* Filter Bar */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 no-print">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search partner, date, yard..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg w-56 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                />
                <span className="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
              </div>

              <select
                value={partnerFilter}
                onChange={e => setPartnerFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">All Mining Partners</option>
                {partners.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>

              <select
                value={sortField}
                onChange={e => setSortField(e.target.value as any)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="date">Sort by Date</option>
                <option value="quantity">Sort by Quantity</option>
                <option value="partnerName">Sort by Partner Name</option>
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-2 py-1.5 text-xs border border-slate-300 rounded-lg bg-white hover:bg-slate-100"
                title="Toggle Sort Direction"
              >
                {sortOrder === 'asc' ? '⬆️ Asc' : '⬇️ Desc'}
              </button>
            </div>

            <div className="text-xs font-semibold text-slate-600">
              Showing {filteredStocks.length} of {coalStocks.length} records
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Sr.</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Partner Name</th>
                  <th className="px-4 py-3 text-right">Quantity (Tons)</th>
                  <th className="px-4 py-3 text-left">Pithead Location</th>
                  <th className="px-4 py-3 text-left">Vehicle / Bilty</th>
                  <th className="px-4 py-3 text-left">Remarks</th>
                  <th className="px-4 py-3 text-center no-print">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredStocks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                      No coal stock entries found matching the criteria. Click "Add Coal Stock" to create one.
                    </td>
                  </tr>
                ) : (
                  filteredStocks.map((stk, idx) => (
                    <tr key={stk.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-slate-500 font-mono">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{stk.date}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{stk.partnerName}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-800">
                        {stk.quantity.toLocaleString()} Tons
                      </td>
                      <td className="px-4 py-3 text-slate-600">{stk.pitheadLocation || '-'}</td>
                      <td className="px-4 py-3 text-slate-600 font-mono">{stk.vehicleRef || '-'}</td>
                      <td className="px-4 py-3 text-slate-500 truncate max-w-xs">{stk.remarks || '-'}</td>
                      <td className="px-4 py-3 text-center whitespace-nowrap no-print">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => setEditingStock(stk)}
                            className="px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(stk)}
                            className="px-2 py-1 text-xs font-medium text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredStocks.length > 0 && (
                <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-800">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-right">Total Inflow in Filtered View:</td>
                    <td className="px-4 py-3 text-right text-emerald-900">
                      {filteredStocks.reduce((sum, s) => sum + s.quantity, 0).toLocaleString()} Tons
                    </td>
                    <td colSpan={3}></td>
                    <td className="no-print"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-slate-200">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-semibold text-slate-900">Edit Coal Stock Entry</h3>
              <p className="text-xs text-slate-500">Update stock inflow quantity or logistics details.</p>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="text"
                    required
                    value={editingStock.date}
                    onChange={e => setEditingStock({ ...editingStock, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Partner</label>
                  <select
                    value={editingStock.partnerId}
                    onChange={e => {
                      const p = partners.find(x => x.id === e.target.value);
                      if (p) {
                        setEditingStock({ ...editingStock, partnerId: p.id, partnerName: p.name });
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    {partners.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity (Tons)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={editingStock.quantity}
                  onChange={e => setEditingStock({ ...editingStock, quantity: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pithead Location</label>
                <input
                  type="text"
                  value={editingStock.pitheadLocation || ''}
                  onChange={e => setEditingStock({ ...editingStock, pitheadLocation: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle / Bilty Ref</label>
                <input
                  type="text"
                  value={editingStock.vehicleRef || ''}
                  onChange={e => setEditingStock({ ...editingStock, vehicleRef: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks</label>
                <input
                  type="text"
                  value={editingStock.remarks || ''}
                  onChange={e => setEditingStock({ ...editingStock, remarks: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStock(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  Save Changes
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
        confirmLabel={confirmModal.confirmLabel}
        onConfirm={() => {
          confirmModal.onConfirm();
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default CoalStockView;
