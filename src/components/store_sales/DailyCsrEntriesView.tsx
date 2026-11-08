import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Search, 
  Download, 
  Printer, 
  Trash2, 
  Edit2, 
  Calendar, 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Filter, 
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  CreditCard,
  Scale
} from 'lucide-react';
import { 
  PosCoalSellEntry, 
  PartnerRecord, 
  BuyerRecord,
  BuyerType
} from '../../types/storeSales';
import { formatWholeNumber } from '../../utils/formatters';
import { DatePickerInput } from '../common/DatePickerInput';

interface DailyCsrEntriesViewProps {
  entries: PosCoalSellEntry[];
  partners: PartnerRecord[];
  buyers: BuyerRecord[];
  currentCoalStock?: number;
  onUpdateEntry: (entry: PosCoalSellEntry) => void;
  onDeleteEntry: (id: string) => void;
  onNavigateToNewSale: () => void;
  onNavigateToProduction?: () => void;
}

export const DailyCsrEntriesView: React.FC<DailyCsrEntriesViewProps> = ({
  entries,
  partners,
  buyers,
  currentCoalStock = 0,
  onUpdateEntry,
  onDeleteEntry,
  onNavigateToNewSale,
  onNavigateToProduction,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPartnerFilter, setSelectedPartnerFilter] = useState<string>('all');
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<PosCoalSellEntry | null>(null);
  const [editingEntry, setEditingEntry] = useState<PosCoalSellEntry | null>(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  // Pagination State
  const [pageSize, setPageSize] = useState<number | 'all'>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Edit modal state
  const [editPartnerId, setEditPartnerId] = useState<string>('');
  const [editBuyerName, setEditBuyerName] = useState<string>('');
  const [editBuyerNTN, setEditBuyerNTN] = useState<string>('');
  const [editBuyerCNIC, setEditBuyerCNIC] = useState<string>('');
  const [editBuyerType, setEditBuyerType] = useState<BuyerType>('Registered');
  const [editSaleOrg, setEditSaleOrg] = useState<string>('Balochistan');
  const [editDocType, setEditDocType] = useState<string>('Sales Tax Invoice');
  const [editDocNo, setEditDocNo] = useState<string>('');
  const [editDocDate, setEditDocDate] = useState<string>('');
  const [editQuantity, setEditQuantity] = useState<number | ''>(0);
  const [editValueExcl, setEditValueExcl] = useState<number | ''>(0);
  const [editSalesTaxFed, setEditSalesTaxFed] = useState<number | ''>(0);
  const [editFurtherTax, setEditFurtherTax] = useState<number | ''>(0);

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Helper date parsing (DD-MM-YYYY)
  const parseDDMMYYYY = (dStr: string) => {
    const parts = dStr.split('-');
    if (parts.length === 3) {
      return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    }
    return new Date(dStr);
  };

  // Filtered entries
  const filteredEntries = useMemo(() => {
    const now = new Date();
    return entries.filter((item) => {
      // Partner filter
      if (selectedPartnerFilter !== 'all') {
        const matchesPartnerId = item.partnerId === selectedPartnerFilter;
        const matchesPartnerName = item.partnerName?.toLowerCase() === selectedPartnerFilter.toLowerCase();
        if (!matchesPartnerId && !matchesPartnerName) return false;
      }

      // Time period filter
      const itemDate = parseDDMMYYYY(item.documentDate);
      if (selectedTimeFilter === 'daily') {
        const todayStr = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
        if (item.documentDate !== todayStr) return false;
      } else if (selectedTimeFilter === 'weekly') {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (itemDate < oneWeekAgo) return false;
      } else if (selectedTimeFilter === 'monthly') {
        if (itemDate.getMonth() !== now.getMonth() || itemDate.getFullYear() !== now.getFullYear()) {
          return false;
        }
      }

      // Date Range
      if (dateFrom) {
        const fDate = new Date(dateFrom);
        if (itemDate < fDate) return false;
      }
      if (dateTo) {
        const tDate = new Date(dateTo);
        tDate.setHours(23, 59, 59, 999);
        if (itemDate > tDate) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesBuyer = item.buyerName?.toLowerCase().includes(term);
        const matchesNtn = item.buyerNTN?.toLowerCase().includes(term);
        const matchesCnic = item.buyerCNIC?.toLowerCase().includes(term);
        const matchesDoc = item.documentNumber?.toLowerCase().includes(term);
        const matchesPartner = item.partnerName?.toLowerCase().includes(term);
        const matchesDate = item.documentDate?.toLowerCase().includes(term);
        const matchesOrg = item.saleOrganization?.toLowerCase().includes(term);
        return matchesBuyer || matchesNtn || matchesCnic || matchesDoc || matchesPartner || matchesDate || matchesOrg;
      }

      return true;
    });
  }, [entries, selectedPartnerFilter, selectedTimeFilter, dateFrom, dateTo, searchTerm]);

  // Aggregated KPIs
  const totalQuantityTons = filteredEntries.reduce((sum, e) => sum + (Number(e.quantity) || 0), 0);
  const totalValueExcl = filteredEntries.reduce((sum, e) => sum + (Number(e.valueExcludingTax) || 0), 0);
  const totalTaxAmount = filteredEntries.reduce((sum, e) => sum + (Number(e.totalTax) || 0), 0);
  const grandTotalValue = filteredEntries.reduce((sum, e) => sum + (Number(e.totalValue) || 0), 0);

  // Pagination calculation
  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(filteredEntries.length / pageSize));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const paginatedEntries = useMemo(() => {
    if (pageSize === 'all') return filteredEntries;
    const start = (currentPageSafe - 1) * pageSize;
    return filteredEntries.slice(start, start + pageSize);
  }, [filteredEntries, currentPageSafe, pageSize]);

  // Open Edit Modal
  const handleOpenEdit = (entry: PosCoalSellEntry) => {
    setEditingEntry(entry);
    setEditPartnerId(entry.partnerId || '');
    setEditBuyerName(entry.buyerName || '');
    setEditBuyerNTN(entry.buyerNTN || '');
    setEditBuyerCNIC(entry.buyerCNIC || '');
    setEditBuyerType(entry.buyerType || 'Registered');
    setEditSaleOrg(entry.saleOrganization || 'Balochistan');
    setEditDocType(entry.documentType || 'Sales Tax Invoice');
    setEditDocNo(entry.documentNumber || '');
    setEditDocDate(entry.documentDate || '');
    setEditQuantity(entry.quantity || 0);
    setEditValueExcl(entry.valueExcludingTax || 0);
    setEditSalesTaxFed(entry.salesTaxFed || 0);
    setEditFurtherTax(entry.furtherTax || 0);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;

    const numQty = Number(editQuantity) || 0;
    const maxEditQuantity = (currentCoalStock ?? 0) + (editingEntry.quantity ?? 0);

    if (numQty <= 0) {
      alert('Please enter a valid quantity in tons');
      return;
    }

    if (numQty > maxEditQuantity) {
      alert(`Cannot enter more quantity (${numQty} MT) than the coal produced/in stock (${formatWholeNumber(maxEditQuantity)} MT). You cannot dispatch more than available stock.`);
      return;
    }

    const partner = partners.find((p) => p.id === editPartnerId);
    const numExcl = Number(editValueExcl) || 0;
    const numTaxFed = Number(editSalesTaxFed) || 0;
    const numFurther = Number(editFurtherTax) || 0;
    const finalTotalTax = numTaxFed + numFurther;
    const finalTotalValue = numExcl + finalTotalTax;

    const updated: PosCoalSellEntry = {
      ...editingEntry,
      partnerId: partner?.id || editingEntry.partnerId,
      partnerName: partner?.name || editingEntry.partnerName,
      buyerName: editBuyerName.trim(),
      buyerNTN: editBuyerNTN.trim(),
      buyerCNIC: editBuyerCNIC.trim(),
      buyerType: editBuyerType,
      saleOrganization: editSaleOrg,
      documentType: editDocType,
      documentNumber: editDocNo.trim(),
      documentDate: editDocDate,
      quantity: numQty,
      valueExcludingTax: numExcl,
      salesTaxFed: numTaxFed,
      furtherTax: numFurther,
      totalTax: finalTotalTax,
      totalValue: finalTotalValue,
    };

    onUpdateEntry(updated);
    setEditingEntry(null);
    showNotice(`Updated Daily CSR Entry "${updated.documentNumber}" successfully.`);
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!entryToDelete) return;
    onDeleteEntry(entryToDelete.id);
    showNotice(`Deleted dispatch record "${entryToDelete.documentNumber}"`);
    setEntryToDelete(null);
  };

  // Export CSV with the exact 17 columns
  const handleExportCsv = () => {
    const headers = [
      'sr.',
      'Date',
      'partners',
      'Buyer NTN',
      'Buyer CNIC',
      'Buyer Name',
      'Buyer Type',
      'Sale Org (Province)',
      'Doc Type',
      'Doc No.',
      'Doc Date',
      'Quantity (Ton)',
      'Value Excl. Tax',
      'Sales Tax / FED',
      'Further Tax',
      'Total Tax',
      'Total Value',
    ];

    const rows = filteredEntries.map((e, index) => [
      index + 1,
      `"${e.documentDate}"`,
      `"${e.partnerName || 'Direct / General'}"`,
      `"${e.buyerNTN || '-'}"`,
      `"${e.buyerCNIC || '-'}"`,
      `"${e.buyerName}"`,
      `"${e.buyerType}"`,
      `"${e.saleOrganization}"`,
      `"${e.documentType}"`,
      `"${e.documentNumber}"`,
      `"${e.documentDate}"`,
      e.quantity.toFixed(2),
      e.valueExcludingTax.toFixed(2),
      e.salesTaxFed.toFixed(2),
      e.furtherTax.toFixed(2),
      e.totalTax.toFixed(2),
      e.totalValue.toFixed(2),
    ]);

    const totalRow = [
      'TOTAL',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      totalQuantityTons.toFixed(2),
      totalValueExcl.toFixed(2),
      '',
      '',
      totalTaxAmount.toFixed(2),
      grandTotalValue.toFixed(2),
    ];

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(',')), totalRow.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Daily_CSR_Entries_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotice('Daily CSR Entries exported to CSV successfully.');
  };

  return (
    <div className="space-y-4">
      {/* Zero Stock Alert Banner if applicable */}
      {currentCoalStock <= 0 && (
        <div className="p-3.5 rounded-xl border-2 border-amber-300 bg-amber-50 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold text-xs text-amber-900 block">
                Coal Stock Notice: 0 MT Available in System
              </span>
              <span className="text-[11px] text-amber-800">
                You can only record coal sells and daily CSR entries when there is coal produced/in stock. Please record daily coal production first.
              </span>
            </div>
          </div>
          {onNavigateToProduction && (
            <button
              type="button"
              onClick={onNavigateToProduction}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs cursor-pointer shrink-0"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Go to Daily Production</span>
            </button>
          )}
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Store & Sales
              </span>
              <span className="text-slate-300">/</span>
              <span className="text-xs text-slate-500">Commercial Dispatches</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2.5">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <span>Daily CSR Entries</span>
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Automatic listing of all individual dispatch records generated from the New Coal Sell POS Entry Form with full statutory tax credentials.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-xs font-mono">
              <Scale className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-slate-500 text-[11px]">Stock:</span>
              <span className={`font-bold ${currentCoalStock > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                {formatWholeNumber(currentCoalStock)} MT
              </span>
            </div>

            <button
              type="button"
              onClick={handleExportCsv}
              disabled={filteredEntries.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => setPrintModalOpen(true)}
              disabled={filteredEntries.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print Sheet</span>
            </button>

            <button
              type="button"
              onClick={onNavigateToNewSale}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Coal Sell POS Entry</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="pt-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Buyer Name, NTN, CNIC, Doc No, Partner, Date..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Partner Filter */}
            <select
              value={selectedPartnerFilter}
              onChange={(e) => {
                setSelectedPartnerFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs px-2.5 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700"
            >
              <option value="all">All Partners</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Time Filter */}
            <div className="flex items-center gap-1">
              {(['all', 'daily', 'weekly', 'monthly'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => {
                    setSelectedTimeFilter(filter);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors cursor-pointer ${
                    selectedTimeFilter === filter
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {filter === 'all' ? 'All Time' : filter}
                </button>
              ))}
            </div>

            {/* Page Size Selector */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 ml-2">
              <span>Show:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(e.target.value === 'all' ? 'all' : Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 font-semibold cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value="all">Show All</option>
              </select>
            </div>
          </div>
        </div>

        {/* Aggregate KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
          <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200">
            <span className="text-[11px] text-emerald-800 font-semibold block">Total Quantity (Tons)</span>
            <span className="text-base font-bold font-mono text-emerald-950">
              {formatWholeNumber(totalQuantityTons)} MT
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200">
            <span className="text-[11px] text-blue-800 font-semibold block">Total Excl. Tax (PKR)</span>
            <span className="text-base font-bold font-mono text-blue-950">
              PKR {formatWholeNumber(totalValueExcl)}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200">
            <span className="text-[11px] text-amber-800 font-semibold block">Total Tax (ST/FED + Further)</span>
            <span className="text-base font-bold font-mono text-amber-950">
              PKR {formatWholeNumber(totalTaxAmount)}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-purple-50/70 border border-purple-200">
            <span className="text-[11px] text-purple-800 font-semibold block">Total Value (Gross Revenue)</span>
            <span className="text-base font-bold font-mono text-purple-950">
              PKR {formatWholeNumber(grandTotalValue)}
            </span>
          </div>
        </div>
      </div>

      {notification && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{notification}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-emerald-700 hover:text-emerald-950 text-xs cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Daily CSR Entries Table (Exact 17 Columns) */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 whitespace-nowrap">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
              <tr>
                {/* 1. sr. */}
                <th scope="col" className="px-3 py-3 text-center w-12">
                  sr.
                </th>
                {/* 2. Date */}
                <th scope="col" className="px-3.5 py-3">
                  Date
                </th>
                {/* 3. partners */}
                <th scope="col" className="px-3.5 py-3">
                  partners
                </th>
                {/* 4. Buyer NTN */}
                <th scope="col" className="px-3 py-3">
                  Buyer NTN
                </th>
                {/* 5. Buyer CNIC */}
                <th scope="col" className="px-3 py-3">
                  Buyer CNIC
                </th>
                {/* 6. Buyer Name */}
                <th scope="col" className="px-4 py-3 font-extrabold text-slate-900">
                  Buyer Name
                </th>
                {/* 7. Buyer Type */}
                <th scope="col" className="px-3 py-3">
                  Buyer Type
                </th>
                {/* 8. Sale Org (Province) */}
                <th scope="col" className="px-3.5 py-3">
                  Sale Org (Province)
                </th>
                {/* 9. Doc Type */}
                <th scope="col" className="px-3 py-3">
                  Doc Type
                </th>
                {/* 10. Doc No. */}
                <th scope="col" className="px-3.5 py-3 font-mono">
                  Doc No.
                </th>
                {/* 11. Doc Date */}
                <th scope="col" className="px-3 py-3 font-mono">
                  Doc Date
                </th>
                {/* 12. Quantity (Ton) */}
                <th scope="col" className="px-3.5 py-3 text-right bg-emerald-50/60 text-emerald-950 font-bold">
                  Quantity (Ton)
                </th>
                {/* 13. Value Excl. Tax */}
                <th scope="col" className="px-3.5 py-3 text-right">
                  Value Excl. Tax
                </th>
                {/* 14. Sales Tax / FED */}
                <th scope="col" className="px-3 py-3 text-right">
                  Sales Tax / FED
                </th>
                {/* 15. Further Tax */}
                <th scope="col" className="px-3 py-3 text-right">
                  Further Tax
                </th>
                {/* 16. Total Tax */}
                <th scope="col" className="px-3.5 py-3 text-right text-amber-900 font-semibold bg-amber-50/30">
                  Total Tax
                </th>
                {/* 17. Total Value */}
                <th scope="col" className="px-4 py-3 text-right font-extrabold text-emerald-950 bg-emerald-50/70">
                  Total Value
                </th>
                {/* Actions */}
                <th scope="col" className="px-3 py-3 text-center w-20">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {paginatedEntries.length === 0 ? (
                <tr>
                  <td colSpan={18} className="py-14 text-center text-slate-400">
                    <FileSpreadsheet className="w-9 h-9 mx-auto text-slate-300 mb-2 opacity-60" />
                    <p className="font-semibold text-slate-600">No Daily CSR Entries found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      New dispatches saved in the POS entry form will automatically appear here.
                    </p>
                    <button
                      type="button"
                      onClick={onNavigateToNewSale}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Record First Coal Sell</span>
                    </button>
                  </td>
                </tr>
              ) : (
                paginatedEntries.map((entry, idx) => {
                  const absoluteIndex = pageSize === 'all' ? idx + 1 : (currentPageSafe - 1) * (pageSize as number) + idx + 1;
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* 1. sr. */}
                      <td className="px-3 py-2.5 text-center font-mono text-slate-500">
                        {absoluteIndex}
                      </td>

                      {/* 2. Date */}
                      <td className="px-3.5 py-2.5 font-mono text-slate-700 font-medium">
                        {entry.documentDate}
                      </td>

                      {/* 3. partners */}
                      <td className="px-3.5 py-2.5 font-semibold text-slate-800">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-900 border border-purple-200">
                          <Building2 className="w-3 h-3 text-purple-600 shrink-0" />
                          <span>{entry.partnerName || 'General / Direct'}</span>
                        </span>
                      </td>

                      {/* 4. Buyer NTN */}
                      <td className="px-3 py-2.5 font-mono text-slate-600">
                        {entry.buyerNTN || '-'}
                      </td>

                      {/* 5. Buyer CNIC */}
                      <td className="px-3 py-2.5 font-mono text-slate-600">
                        {entry.buyerCNIC || '-'}
                      </td>

                      {/* 6. Buyer Name */}
                      <td className="px-4 py-2.5 font-bold text-slate-900">
                        {entry.buyerName}
                      </td>

                      {/* 7. Buyer Type */}
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          entry.buyerType === 'Registered'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {entry.buyerType}
                        </span>
                      </td>

                      {/* 8. Sale Org (Province) */}
                      <td className="px-3.5 py-2.5 text-slate-700">
                        {entry.saleOrganization || 'Balochistan'}
                      </td>

                      {/* 9. Doc Type */}
                      <td className="px-3 py-2.5 text-slate-600">
                        {entry.documentType || 'Sales Tax Invoice'}
                      </td>

                      {/* 10. Doc No. */}
                      <td className="px-3.5 py-2.5 font-mono font-bold text-blue-700">
                        {entry.documentNumber || entry.id}
                      </td>

                      {/* 11. Doc Date */}
                      <td className="px-3 py-2.5 font-mono text-slate-700">
                        {entry.documentDate}
                      </td>

                      {/* 12. Quantity (Ton) */}
                      <td className="px-3.5 py-2.5 text-right font-mono font-extrabold text-emerald-950 bg-emerald-50/40">
                        {formatWholeNumber(entry.quantity)} MT
                      </td>

                      {/* 13. Value Excl. Tax */}
                      <td className="px-3.5 py-2.5 text-right font-mono font-semibold text-slate-800">
                        {formatWholeNumber(entry.valueExcludingTax)}
                      </td>

                      {/* 14. Sales Tax / FED */}
                      <td className="px-3 py-2.5 text-right font-mono text-slate-700">
                        {formatWholeNumber(entry.salesTaxFed)}
                      </td>

                      {/* 15. Further Tax */}
                      <td className="px-3 py-2.5 text-right font-mono text-slate-700">
                        {formatWholeNumber(entry.furtherTax)}
                      </td>

                      {/* 16. Total Tax */}
                      <td className="px-3.5 py-2.5 text-right font-mono font-bold text-amber-900 bg-amber-50/30">
                        {formatWholeNumber(entry.totalTax)}
                      </td>

                      {/* 17. Total Value */}
                      <td className="px-4 py-2.5 text-right font-mono font-extrabold text-emerald-950 bg-emerald-50/70">
                        PKR {formatWholeNumber(entry.totalValue)}
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(entry)}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                            title="Edit Daily CSR Entry"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEntryToDelete(entry)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
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

            {/* Total Footer Row */}
            {filteredEntries.length > 0 && (
              <tfoot className="bg-slate-100 text-xs font-bold text-slate-900 border-t-2 border-slate-300">
                <tr>
                  <td className="px-3 py-3 text-center font-mono">∑</td>
                  <td className="px-3.5 py-3 font-extrabold uppercase" colSpan={10}>
                    Total ({filteredEntries.length} Records)
                  </td>
                  <td className="px-3.5 py-3 text-right font-mono font-extrabold text-emerald-950 bg-emerald-100/70">
                    {formatWholeNumber(totalQuantityTons)} MT
                  </td>
                  <td className="px-3.5 py-3 text-right font-mono font-bold text-slate-900">
                    {formatWholeNumber(totalValueExcl)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-slate-500">-</td>
                  <td className="px-3 py-3 text-right font-mono text-slate-500">-</td>
                  <td className="px-3.5 py-3 text-right font-mono font-bold text-amber-950 bg-amber-100/70">
                    {formatWholeNumber(totalTaxAmount)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-extrabold text-emerald-950 bg-emerald-100">
                    PKR {formatWholeNumber(grandTotalValue)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Pagination Bar */}
        {pageSize !== 'all' && totalPages > 1 && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="text-slate-500">
              Showing <span className="font-semibold text-slate-700">{(currentPageSafe - 1) * (pageSize as number) + 1}</span> to{' '}
              <span className="font-semibold text-slate-700">
                {Math.min(currentPageSafe * (pageSize as number), filteredEntries.length)}
              </span>{' '}
              of <span className="font-semibold text-slate-700">{filteredEntries.length}</span> entries
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPageSafe === 1}
                className="px-2.5 py-1 text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>

              <span className="px-2 font-semibold text-slate-700">
                Page {currentPageSafe} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPageSafe === totalPages}
                className="px-2.5 py-1 text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Entry Modal */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Edit Daily CSR Entry ({editingEntry.documentNumber})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingEntry(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Partner Name</label>
                  <select
                    value={editPartnerId}
                    onChange={(e) => setEditPartnerId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Buyer Name</label>
                  <input
                    type="text"
                    required
                    value={editBuyerName}
                    onChange={(e) => setEditBuyerName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Buyer NTN</label>
                  <input
                    type="text"
                    value={editBuyerNTN}
                    onChange={(e) => setEditBuyerNTN(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Buyer CNIC</label>
                  <input
                    type="text"
                    value={editBuyerCNIC}
                    onChange={(e) => setEditBuyerCNIC(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Doc Number</label>
                  <input
                    type="text"
                    required
                    value={editDocNo}
                    onChange={(e) => setEditDocNo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold bg-white"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700">Quantity (Ton)</label>
                    <span className="text-[11px] font-mono font-semibold text-slate-500">
                      Max: {formatWholeNumber((currentCoalStock ?? 0) + (editingEntry?.quantity ?? 0))} MT
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    max={(currentCoalStock ?? 0) + (editingEntry?.quantity ?? 0)}
                    required
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(Number(e.target.value))}
                    className={`w-full px-3 py-2 border rounded-lg font-mono font-bold ${
                      Number(editQuantity) > ((currentCoalStock ?? 0) + (editingEntry?.quantity ?? 0))
                        ? 'border-rose-500 bg-rose-50 text-rose-900 focus:ring-rose-400'
                        : 'border-slate-300 bg-white focus:ring-blue-500'
                    }`}
                  />
                  {Number(editQuantity) > ((currentCoalStock ?? 0) + (editingEntry?.quantity ?? 0)) && (
                    <span className="text-[11px] font-bold text-rose-600 mt-1 block">
                      ⚠️ Cannot exceed available coal stock ({formatWholeNumber((currentCoalStock ?? 0) + (editingEntry?.quantity ?? 0))} MT)!
                    </span>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Value Excl. Tax (PKR)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    required
                    value={editValueExcl}
                    onChange={(e) => setEditValueExcl(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sales Tax / FED (PKR)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={editSalesTaxFed}
                    onChange={(e) => setEditSalesTaxFed(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Further Tax (PKR)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={editFurtherTax}
                    onChange={(e) => setEditFurtherTax(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono bg-white"
                  />
                </div>

                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <span className="text-[11px] font-bold text-emerald-900 block">Calculated Total Value:</span>
                  <span className="font-mono font-extrabold text-sm text-emerald-950">
                    PKR {formatWholeNumber((Number(editValueExcl) || 0) + (Number(editSalesTaxFed) || 0) + (Number(editFurtherTax) || 0))}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingEntry(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    Number(editQuantity) <= 0 ||
                    Number(editQuantity) > ((currentCoalStock ?? 0) + (editingEntry?.quantity ?? 0))
                  }
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg shadow-xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {entryToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-100 text-rose-700 rounded-full">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete CSR Entry</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Are you sure you want to delete invoice {entryToDelete.documentNumber}?
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1 font-mono">
              <div>Buyer: <span className="font-semibold text-slate-800">{entryToDelete.buyerName}</span></div>
              <div>Partner: <span className="font-semibold text-slate-800">{entryToDelete.partnerName}</span></div>
              <div>Quantity: <span className="font-bold text-emerald-800">{entryToDelete.quantity} MT</span></div>
              <div>Total: <span className="font-bold text-slate-900">PKR {formatWholeNumber(entryToDelete.totalValue)}</span></div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEntryToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      {printModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                Print Preview: Daily CSR Entries
              </h3>
              <button
                type="button"
                onClick={() => setPrintModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg text-xs font-mono space-y-2">
              <div className="font-bold text-sm text-slate-900">DAILY CSR ENTRIES STATEMENT</div>
              <div>Total Entries: {filteredEntries.length} | Total Quantity: {formatWholeNumber(totalQuantityTons)} MT</div>
              <div>Gross Value: PKR {formatWholeNumber(grandTotalValue)}</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPrintModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
