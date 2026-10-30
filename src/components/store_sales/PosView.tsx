import React, { useState } from 'react';
import { 
  Receipt, 
  Plus, 
  Trash2, 
  Edit2, 
  Download, 
  Printer, 
  Search, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle,
  FileSpreadsheet,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { 
  PosCoalSellEntry, 
  BuyerRecord, 
  CompanySettings 
} from '../../types/storeSales';

interface PosViewProps {
  entries: PosCoalSellEntry[];
  buyers: BuyerRecord[];
  companySettings: CompanySettings;
  onAddEntry: (entry: PosCoalSellEntry) => void;
  onUpdateEntry: (entry: PosCoalSellEntry) => void;
  onDeleteEntry: (id: string) => void;
}

export const PosView: React.FC<PosViewProps> = ({
  entries,
  buyers,
  companySettings,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
}) => {
  const [activeTab, setActiveTab] = useState<'sheet' | 'form'>('sheet');
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<PosCoalSellEntry | null>(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  // Form State
  const [formBuyerId, setFormBuyerId] = useState<string>(buyers[0]?.id || '');
  const [formSaleOrg, setFormSaleOrg] = useState<string>('Balochistan');
  const [formDocType, setFormDocType] = useState<string>('Sales Tax Invoice');
  const [formDocNumber, setFormDocNumber] = useState<string>(`STI-${new Date().getFullYear()}-${String(entries.length + 1).padStart(3, '0')}`);
  const [formDocDate, setFormDocDate] = useState<string>(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  });
  const [formQuantity, setFormQuantity] = useState<number | ''>(50);
  const [formValueExclTax, setFormValueExclTax] = useState<number | ''>(750000);
  const [formSalesTaxFed, setFormSalesTaxFed] = useState<number | ''>(135000);
  const [formFurtherTax, setFormFurtherTax] = useState<number | ''>(22500);

  // Auto-calculated values
  const numValExcl = Number(formValueExclTax) || 0;
  const numTaxFed = Number(formSalesTaxFed) || 0;
  const numFurther = Number(formFurtherTax) || 0;
  const calculatedTotalTax = numTaxFed + numFurther;
  const calculatedTotalValue = numValExcl + numTaxFed + numFurther;

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleOpenAddForm = () => {
    setEditingId(null);
    setFormBuyerId(buyers[0]?.id || '');
    setFormSaleOrg('Balochistan');
    setFormDocType('Sales Tax Invoice');
    setFormDocNumber(`STI-${new Date().getFullYear()}-${String(entries.length + 1).padStart(3, '0')}`);
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    setFormDocDate(`${dd}-${mm}-${yyyy}`);
    setFormQuantity(50);
    setFormValueExclTax(750000);
    setFormSalesTaxFed(135000);
    setFormFurtherTax(22500);
    setActiveTab('form');
  };

  const handleOpenEdit = (entry: PosCoalSellEntry) => {
    setEditingId(entry.id);
    setFormBuyerId(entry.buyerId);
    setFormSaleOrg(entry.saleOrganization);
    setFormDocType(entry.documentType);
    setFormDocNumber(entry.documentNumber);
    setFormDocDate(entry.documentDate);
    setFormQuantity(entry.quantity);
    setFormValueExclTax(entry.valueExcludingTax);
    setFormSalesTaxFed(entry.salesTaxFed);
    setFormFurtherTax(entry.furtherTax);
    setActiveTab('form');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedBuyer = buyers.find((b) => b.id === formBuyerId) || {
      id: 'custom',
      buyerNTN: 'N/A',
      buyerCNIC: 'N/A',
      buyerName: 'Walk-in Commercial Buyer',
      buyerType: 'Unregistered' as const,
    };

    const finalTotalTax = (Number(formSalesTaxFed) || 0) + (Number(formFurtherTax) || 0);
    const finalTotalValue = (Number(formValueExclTax) || 0) + finalTotalTax;

    if (editingId) {
      const updated: PosCoalSellEntry = {
        id: editingId,
        srNo: entries.find((e) => e.id === editingId)?.srNo || 1,
        buyerId: selectedBuyer.id,
        buyerNTN: selectedBuyer.buyerNTN,
        buyerCNIC: selectedBuyer.buyerCNIC,
        buyerName: selectedBuyer.buyerName,
        buyerType: selectedBuyer.buyerType,
        saleOrganization: formSaleOrg,
        documentType: formDocType,
        documentNumber: formDocNumber,
        documentDate: formDocDate,
        quantity: Number(formQuantity) || 0,
        valueExcludingTax: Number(formValueExclTax) || 0,
        salesTaxFed: Number(formSalesTaxFed) || 0,
        furtherTax: Number(formFurtherTax) || 0,
        totalTax: finalTotalTax,
        totalValue: finalTotalValue,
      };
      onUpdateEntry(updated);
      showNotice(`POS Document ${formDocNumber} updated successfully.`);
    } else {
      const newEntry: PosCoalSellEntry = {
        id: `pos-${Date.now()}`,
        srNo: 1,
        buyerId: selectedBuyer.id,
        buyerNTN: selectedBuyer.buyerNTN,
        buyerCNIC: selectedBuyer.buyerCNIC,
        buyerName: selectedBuyer.buyerName,
        buyerType: selectedBuyer.buyerType,
        saleOrganization: formSaleOrg,
        documentType: formDocType,
        documentNumber: formDocNumber,
        documentDate: formDocDate,
        quantity: Number(formQuantity) || 0,
        valueExcludingTax: Number(formValueExclTax) || 0,
        salesTaxFed: Number(formSalesTaxFed) || 0,
        furtherTax: Number(formFurtherTax) || 0,
        totalTax: finalTotalTax,
        totalValue: finalTotalValue,
      };
      onAddEntry(newEntry);
      showNotice(`POS Document ${formDocNumber} recorded successfully.`);
    }

    setActiveTab('sheet');
    setEditingId(null);
  };

  const handleConfirmDelete = () => {
    if (entryToDelete) {
      onDeleteEntry(entryToDelete.id);
      showNotice(`POS entry ${entryToDelete.documentNumber} removed.`);
      setEntryToDelete(null);
    }
  };

  // Helper date parsing (DD-MM-YYYY)
  const parseEntryDate = (dStr: string) => {
    const parts = dStr.split('-');
    if (parts.length === 3) {
      return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    }
    return new Date(dStr);
  };

  // Filter logic
  const now = new Date();
  const filteredEntries = entries.filter((e) => {
    // Search
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      e.buyerName.toLowerCase().includes(term) ||
      e.buyerNTN.toLowerCase().includes(term) ||
      e.buyerCNIC.toLowerCase().includes(term) ||
      e.documentNumber.toLowerCase().includes(term) ||
      e.saleOrganization.toLowerCase().includes(term);

    if (!matchesSearch) return false;

    // Date range filter
    const eDate = parseEntryDate(e.documentDate);

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
  });

  // Totals of columns at the end of table
  const totalQuantity = filteredEntries.reduce((sum, e) => sum + (Number(e.quantity) || 0), 0);
  const totalValueExclTax = filteredEntries.reduce((sum, e) => sum + (Number(e.valueExcludingTax) || 0), 0);
  const totalSalesTaxFed = filteredEntries.reduce((sum, e) => sum + (Number(e.salesTaxFed) || 0), 0);
  const totalFurtherTax = filteredEntries.reduce((sum, e) => sum + (Number(e.furtherTax) || 0), 0);
  const grandTotalTax = filteredEntries.reduce((sum, e) => sum + (Number(e.totalTax) || 0), 0);
  const grandTotalValue = filteredEntries.reduce((sum, e) => sum + (Number(e.totalValue) || 0), 0);

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Sr',
      'Buyer NTN',
      'Buyer CNIC',
      'Buyer Name',
      'Buyer Type',
      'Sale Organization (Province)',
      'Document Type',
      'Document Number',
      'Document Date',
      'Quantity (Tons)',
      'Value Excl Tax',
      'Sales Tax/FED in ST Mode',
      'Further Tax',
      'Total Tax',
      'Total Value of Sales'
    ];

    const rows = filteredEntries.map((e, idx) => [
      idx + 1,
      `"${e.buyerNTN}"`,
      `"${e.buyerCNIC}"`,
      `"${e.buyerName.replace(/"/g, '""')}"`,
      `"${e.buyerType}"`,
      `"${e.saleOrganization}"`,
      `"${e.documentType}"`,
      `"${e.documentNumber}"`,
      `"${e.documentDate}"`,
      e.quantity,
      e.valueExcludingTax,
      e.salesTaxFed,
      e.furtherTax,
      e.totalTax,
      e.totalValue
    ]);

    // Summary row
    rows.push([
      'TOTAL',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      totalQuantity,
      totalValueExclTax,
      totalSalesTaxFed,
      totalFurtherTax,
      grandTotalTax,
      grandTotalValue
    ]);

    const csvContent = 
      `"${companySettings.companyName}"\n` +
      `"${companySettings.address}"\n` +
      `"POS COAL SELL REPORT / SHEET - ${new Date().toLocaleDateString()}"\n\n` +
      headers.join(',') + '\n' +
      rows.map((r) => r.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `POS_Coal_Sell_Sheet_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotice('POS Sheet exported to CSV successfully.');
  };

  return (
    <div className="space-y-6">
      {/* Top Action Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Store & Sales
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs text-slate-500">Commercial Invoicing</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-600" />
            Point of Sale (POS) & Coal Sell Invoicing
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Record retail & wholesale coal dispatches, compute sales tax & further tax automatically, and manage statutory POS registers.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('sheet')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'sheet'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            POS Sheet & Registers
          </button>

          <button
            type="button"
            onClick={handleOpenAddForm}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'form' && !editingId
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>New Coal Sell (POS)</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* POS COAL SELL FORM */}
      {activeTab === 'form' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {editingId ? 'Edit POS Coal Sell Document' : 'POS Coal Sell Form'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Select buyer from directory to auto-populate NTN and CNIC. Tax calculations are computed dynamically.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveTab('sheet');
                setEditingId(null);
              }}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg cursor-pointer"
            >
              Back to POS Sheet
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Buyer Dropdown */}
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Buyer <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formBuyerId}
                  onChange={(e) => setFormBuyerId(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {buyers.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.buyerName} ({b.buyerType})
                    </option>
                  ))}
                </select>
                {(() => {
                  const currB = buyers.find((b) => b.id === formBuyerId);
                  return currB ? (
                    <div className="mt-1 text-[11px] text-slate-500 space-x-2 font-mono">
                      <span>NTN: {currB.buyerNTN || 'N/A'}</span>
                      <span>·</span>
                      <span>CNIC: {currB.buyerCNIC || 'N/A'}</span>
                    </div>
                  ) : null;
                })()}
              </div>

              {/* Sale Organization (Province of Supplier) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sale Organization (Province of Supplier) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formSaleOrg}
                  onChange={(e) => setFormSaleOrg(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="Balochistan">Balochistan</option>
                  <option value="Punjab">Punjab</option>
                  <option value="Sindh">Sindh</option>
                  <option value="Khyber Pakhtunkhwa">Khyber Pakhtunkhwa</option>
                  <option value="Islamabad Capital Territory">Islamabad Capital Territory</option>
                </select>
              </div>

              {/* Document Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Document Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formDocType}
                  onChange={(e) => setFormDocType(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="Sales Tax Invoice">Sales Tax Invoice</option>
                  <option value="Commercial Invoice">Commercial Invoice</option>
                  <option value="Delivery Challan">Delivery Challan</option>
                  <option value="Export Bill">Export Bill</option>
                </select>
              </div>

              {/* Document Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Document Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formDocNumber}
                  onChange={(e) => setFormDocNumber(e.target.value)}
                  placeholder="e.g. STI-2026-085"
                  className="w-full text-xs font-mono font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              {/* Document Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Document Date (DD-MM-YYYY) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formDocDate}
                  onChange={(e) => setFormDocDate(e.target.value)}
                  placeholder="DD-MM-YYYY"
                  className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Quantity (in Tons) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={formQuantity}
                  onChange={(e) => setFormQuantity(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="0.00"
                  className="w-full text-xs font-mono font-bold px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              {/* Value of Sales Excluding Sales Tax */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Value of Sales Excl. Sales Tax <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={formValueExclTax}
                  onChange={(e) => setFormValueExclTax(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="0.00"
                  className="w-full text-xs font-mono font-bold px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              {/* Sales Tax / FED in ST Mode */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sales Tax / FED in ST Mode
                </label>
                <input
                  type="number"
                  step="any"
                  value={formSalesTaxFed}
                  onChange={(e) => setFormSalesTaxFed(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="0.00"
                  className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              {/* Further Tax */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Further Tax
                </label>
                <input
                  type="number"
                  step="any"
                  value={formFurtherTax}
                  onChange={(e) => setFormFurtherTax(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="0.00"
                  className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>

            {/* Auto-Calculated Summary Breakdown */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-3">
                Automatic Tax & Final Value Computations
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">Excluding Tax Value</span>
                  <span className="text-sm font-bold font-mono text-slate-800">
                    {numValExcl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-lg border border-amber-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-amber-800 block font-semibold">Total Tax</span>
                    <span className="text-[9px] text-amber-600 font-mono">(ST/FED + Further Tax)</span>
                  </div>
                  <span className="text-sm font-bold font-mono text-amber-900">
                    {calculatedTotalTax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-lg border-2 border-blue-500 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-blue-900 block font-bold">Total Value of Sales</span>
                    <span className="text-[9px] text-blue-600 font-mono">(Excl. Tax + Sales Tax/FED + Further Tax)</span>
                  </div>
                  <span className="text-base font-extrabold font-mono text-blue-950">
                    {calculatedTotalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('sheet');
                  setEditingId(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                {editingId ? 'Update POS Document' : 'Save POS Coal Sell'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* POS COAL SELL REPORT & POS SHEET TABLE */}
      {activeTab === 'sheet' && (
        <div className="space-y-4">
          {/* Controls: Search, Time Filter, Date range, Export */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search POS by buyer name, NTN, CNIC, doc number, province..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Time Filters */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-slate-500 mr-1">Period:</span>
                <button
                  type="button"
                  onClick={() => setTimeFilter('all')}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    timeFilter === 'all'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  All Entries
                </button>
                <button
                  type="button"
                  onClick={() => setTimeFilter('daily')}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    timeFilter === 'daily'
                      ? 'bg-blue-600 text-white font-semibold'
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
                      ? 'bg-blue-600 text-white font-semibold'
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
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Monthly
                </button>
              </div>

              {/* Export Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  title="Export to CSV spreadsheet"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Export CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                  title="Printable Report View with Company Header"
                >
                  <Printer className="w-3.5 h-3.5 text-blue-600" />
                  <span>Print View</span>
                </button>
              </div>
            </div>

            {/* Date range filter */}
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100 flex-wrap text-xs text-slate-600">
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
                  className="px-2 py-1 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">To:</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-2 py-1 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
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

          {/* POS Sheet Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">Sr.</th>
                    <th className="py-3 px-3">Buyer NTN</th>
                    <th className="py-3 px-3">Buyer CNIC</th>
                    <th className="py-3 px-3 min-w-[140px]">Buyer Name</th>
                    <th className="py-3 px-2">Buyer Type</th>
                    <th className="py-3 px-3">Sale Org (Province)</th>
                    <th className="py-3 px-3">Doc Type</th>
                    <th className="py-3 px-3">Doc No.</th>
                    <th className="py-3 px-3 whitespace-nowrap">Doc Date</th>
                    <th className="py-3 px-3 text-right">Quantity (Ton)</th>
                    <th className="py-3 px-3 text-right">Value Excl. Tax</th>
                    <th className="py-3 px-3 text-right">Sales Tax / FED</th>
                    <th className="py-3 px-3 text-right">Further Tax</th>
                    <th className="py-3 px-3 text-right">Total Tax</th>
                    <th className="py-3 px-3 text-right">Total Value</th>
                    <th className="py-3 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={16} className="py-8 text-center text-slate-400">
                        No POS coal sell records match current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map((e, idx) => (
                      <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px]">
                          {e.buyerNTN || '—'}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px]">
                          {e.buyerCNIC || '—'}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {e.buyerName}
                        </td>
                        <td className="py-2.5 px-2">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                            {e.buyerType}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {e.saleOrganization}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                          {e.documentType}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-medium text-slate-800 text-[11px]">
                          {e.documentNumber}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap text-[11px]">
                          {e.documentDate}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {e.quantity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                          {e.valueExcludingTax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                          {e.salesTaxFed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                          {e.furtherTax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-amber-900 bg-amber-50/50">
                          {e.totalTax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-950 bg-emerald-50/40">
                          {e.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(e)}
                              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                              title="Edit POS entry"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEntryToDelete(e)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              title="Remove POS entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>

                {/* Totals of columns at the end of table */}
                <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900 text-xs">
                  <tr>
                    <td colSpan={9} className="py-3 px-3 uppercase tracking-wider text-right font-extrabold text-slate-700">
                      Totals / Summary ({filteredEntries.length} records):
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-slate-900">
                      {totalQuantity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-slate-800">
                      {totalValueExclTax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-slate-800">
                      {totalSalesTaxFed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-slate-800">
                      {totalFurtherTax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-amber-950 bg-amber-100/70">
                      {grandTotalTax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-emerald-950 bg-emerald-100/80">
                      {grandTotalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">—</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Printable Modal View with Company Settings Header */}
      {printModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full p-6 border border-slate-200 space-y-6 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Official Report Print Preview
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Official Report Header from Company Settings */}
            <div className="text-center space-y-1 pb-4 border-b border-slate-300">
              <h2 className="text-xl font-extrabold tracking-wide text-slate-900 uppercase">
                {companySettings.companyName}
              </h2>
              <p className="text-xs text-slate-600 max-w-lg mx-auto">
                {companySettings.address}
              </p>
              <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 font-mono">
                {companySettings.ntnNumber && <span>NTN: {companySettings.ntnNumber}</span>}
                {companySettings.contactNumber && <span>Phone: {companySettings.contactNumber}</span>}
              </div>
              <div className="pt-2">
                <span className="text-xs font-bold text-slate-900 tracking-wider uppercase bg-slate-100 px-3 py-1 rounded inline-block">
                  POINT OF SALE (POS) COAL SELL REGISTER
                </span>
              </div>
            </div>

            {/* Printable Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-300 border-collapse">
                <thead className="bg-slate-100 text-slate-800 font-bold uppercase text-[10px]">
                  <tr className="border-b border-slate-300">
                    <th className="p-2 border-r border-slate-300">Sr.</th>
                    <th className="p-2 border-r border-slate-300">Doc No.</th>
                    <th className="p-2 border-r border-slate-300">Date</th>
                    <th className="p-2 border-r border-slate-300">Buyer Name</th>
                    <th className="p-2 border-r border-slate-300">NTN / CNIC</th>
                    <th className="p-2 border-r border-slate-300 text-right">Qty (Tons)</th>
                    <th className="p-2 border-r border-slate-300 text-right">Value Excl.</th>
                    <th className="p-2 border-r border-slate-300 text-right">Tax (ST+Further)</th>
                    <th className="p-2 text-right">Total Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredEntries.map((e, idx) => (
                    <tr key={e.id}>
                      <td className="p-2 border-r border-slate-200 text-center font-mono">{idx + 1}</td>
                      <td className="p-2 border-r border-slate-200 font-mono font-medium">{e.documentNumber}</td>
                      <td className="p-2 border-r border-slate-200 font-mono">{e.documentDate}</td>
                      <td className="p-2 border-r border-slate-200 font-semibold">{e.buyerName}</td>
                      <td className="p-2 border-r border-slate-200 font-mono text-[11px]">{e.buyerNTN || e.buyerCNIC || '—'}</td>
                      <td className="p-2 border-r border-slate-200 text-right font-mono">{e.quantity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="p-2 border-r border-slate-200 text-right font-mono">{e.valueExcludingTax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="p-2 border-r border-slate-200 text-right font-mono">{e.totalTax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="p-2 text-right font-mono font-bold">{e.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 border-t-2 border-slate-400 font-bold">
                  <tr>
                    <td colSpan={5} className="p-2 border-r border-slate-300 text-right font-extrabold">TOTALS:</td>
                    <td className="p-2 border-r border-slate-300 text-right font-mono font-extrabold">{totalQuantity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="p-2 border-r border-slate-300 text-right font-mono font-extrabold">{totalValueExclTax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="p-2 border-r border-slate-300 text-right font-mono font-extrabold">{grandTotalTax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="p-2 text-right font-mono font-extrabold">{grandTotalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex justify-between items-end pt-8 text-xs text-slate-500 font-medium border-t border-slate-200">
              <div>
                <p>Prepared By: ___________________</p>
                <p className="mt-1">Cashier / POS Operator</p>
              </div>
              <div className="text-right">
                <p>Verified By: ___________________</p>
                <p className="mt-1">Accounts & Taxation Manager</p>
              </div>
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
                <h3 className="text-sm font-bold text-slate-900">Remove POS Entry</h3>
                <p className="text-xs text-slate-500">Confirmation required</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to delete document <strong className="text-slate-900">{entryToDelete.documentNumber}</strong> for buyer <strong className="text-slate-900">{entryToDelete.buyerName}</strong>?
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
                Delete Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
