import React, { useState, useMemo } from 'react';
import { 
  Receipt, 
  FileCheck2, 
  Save, 
  X, 
  CheckCircle2, 
  Calendar, 
  Building2, 
  Scale, 
  User, 
  FileText, 
  Calculator, 
  Download, 
  Printer, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  Eye, 
  Filter, 
  Sparkles,
  ArrowUpDown,
  CreditCard,
  ShieldCheck,
  Truck,
  AlertTriangle
} from 'lucide-react';
import { 
  PartnerRecord, 
  BuyerRecord, 
  PosCoalSellEntry, 
  CoalSellRecord, 
  BuyerType 
} from '../../types/storeSales';
import { DatePickerInput } from '../common/DatePickerInput';
import { formatWholeNumber } from '../../utils/formatters';

interface RecordCoalSellViewProps {
  partners: PartnerRecord[];
  buyers: BuyerRecord[];
  posEntries?: PosCoalSellEntry[];
  coalSellRecords?: CoalSellRecord[];
  currentCoalStock?: number;
  onSaveCoalSell: (record: CoalSellRecord) => void;
  onSavePosSale?: (entry: PosCoalSellEntry) => void;
  onDeletePosEntry?: (id: string) => void;
  onCancel: () => void;
  onNavigateToProduction?: () => void;
}

export const RecordCoalSellView: React.FC<RecordCoalSellViewProps> = ({
  partners,
  buyers,
  posEntries = [],
  coalSellRecords = [],
  currentCoalStock = 0,
  onSaveCoalSell,
  onSavePosSale,
  onDeletePosEntry,
  onCancel,
  onNavigateToProduction,
}) => {
  const activePartners = useMemo(() => partners.filter((p) => p.isActive), [partners]);

  // Section switcher: 'form' (New Coal Sell POS Form) | 'daily_csr' (Daily CSR)
  const [activeSection, setActiveSection] = useState<'form' | 'daily_csr'>('form');

  // FORM FIELDS (15 requested fields)
  // 1. Partner Name
  const [partnerId, setPartnerId] = useState<string>(activePartners[0]?.id || '');
  // 2. Buyer NTN
  const [buyerNTN, setBuyerNTN] = useState<string>('');
  // 3. Buyer CNIC
  const [buyerCNIC, setBuyerCNIC] = useState<string>('');
  // 4. Buyer Name
  const [buyerName, setBuyerName] = useState<string>('');
  // 5. Buyer Type
  const [buyerType, setBuyerType] = useState<BuyerType>('Registered');
  // 6. Sale Org (Province)
  const [saleOrganization, setSaleOrganization] = useState<string>('Balochistan');
  // 7. Doc Type
  const [documentType, setDocumentType] = useState<string>('Sales Tax Invoice');
  // 8. Doc No.
  const [documentNumber, setDocumentNumber] = useState<string>(() => {
    return `STI-${new Date().getFullYear()}-${String(posEntries.length + 1).padStart(3, '0')}`;
  });
  // 9. Doc Date
  const [documentDate, setDocumentDate] = useState<string>(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  });
  // 10. Quantity (Ton) - Initialized safely within available stock
  const [quantity, setQuantity] = useState<number | ''>(() => {
    if (currentCoalStock <= 0) return '';
    return Math.min(50, currentCoalStock);
  });
  // 11. Value Excl. Tax
  const [valueExcludingTax, setValueExcludingTax] = useState<number | ''>(750000);
  // 12. Sales Tax / FED
  const [salesTaxFed, setSalesTaxFed] = useState<number | ''>(135000);
  // 13. Further Tax
  const [furtherTax, setFurtherTax] = useState<number | ''>(22500);

  // Quick selected buyer ID (for instant autofill)
  const [selectedBuyerId, setSelectedBuyerId] = useState<string>('');

  // Notifications & UI states
  const [notification, setNotification] = useState<string | null>(null);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [csrSearchTerm, setCsrSearchTerm] = useState<string>('');
  const [csrTimeFilter, setCsrTimeFilter] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');
  const [printModalOpen, setPrintModalOpen] = useState(false);

  // Auto-calculated fields
  // 14. Total Tax = Sales Tax / FED + Further Tax
  const numSalesTaxFed = Number(salesTaxFed) || 0;
  const numFurtherTax = Number(furtherTax) || 0;
  const calculatedTotalTax = numSalesTaxFed + numFurtherTax;

  // 15. Total Value = Value Excl. Tax + Sales Tax / FED + Further Tax
  const numValueExclTax = Number(valueExcludingTax) || 0;
  const calculatedTotalValue = numValueExclTax + calculatedTotalTax;

  // Live stock deduction & boundary checks
  const numQuantity = Number(quantity) || 0;
  const isZeroStock = currentCoalStock <= 0;
  const isStockExceeded = numQuantity > currentCoalStock;
  const isQuantityInvalid = isZeroStock || numQuantity <= 0 || isStockExceeded;
  const remainingStockAfterSale = Math.max(0, currentCoalStock - numQuantity);

  // Quick buyer autofill handler
  const handleBuyerSelect = (bId: string) => {
    setSelectedBuyerId(bId);
    if (!bId) return;
    const b = buyers.find((item) => item.id === bId);
    if (b) {
      setBuyerName(b.buyerName);
      setBuyerNTN(b.buyerNTN || '');
      setBuyerCNIC(b.buyerCNIC || '');
      setBuyerType(b.buyerType || 'Registered');
    }
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (currentCoalStock <= 0) {
      alert('Cannot record coal sell: The system currently has 0 MT coal produced/in stock. Please record daily coal production first.');
      return;
    }

    if (!partnerId) {
      alert('Please select a partner name from the dropdown list');
      return;
    }
    const partner = partners.find((p) => p.id === partnerId);
    if (!partner) {
      alert('Selected partner not found');
      return;
    }

    if (!buyerName.trim()) {
      alert('Please enter Buyer Name');
      return;
    }

    if (!numQuantity || numQuantity <= 0) {
      alert('Please enter a valid coal quantity in tons');
      return;
    }

    if (numQuantity > currentCoalStock) {
      alert(`Cannot enter more quantity (${numQuantity} MT) than the coal produced/in stock (${formatWholeNumber(currentCoalStock)} MT). Please enter a quantity up to ${formatWholeNumber(currentCoalStock)} MT.`);
      return;
    }

    const saleId = `pos-${Date.now()}`;

    // 1. Prepare PosCoalSellEntry
    const newPosEntry: PosCoalSellEntry = {
      id: saleId,
      srNo: posEntries.length > 0 ? Math.max(...posEntries.map((e) => e.srNo || 1)) + 1 : 1,
      partnerId: partner.id,
      partnerName: partner.name,
      buyerId: selectedBuyerId || `b-${Date.now()}`,
      buyerNTN: buyerNTN.trim(),
      buyerCNIC: buyerCNIC.trim(),
      buyerName: buyerName.trim(),
      buyerType,
      saleOrganization,
      documentType,
      documentNumber: documentNumber.trim(),
      documentDate,
      quantity: numQuantity,
      valueExcludingTax: numValueExclTax,
      salesTaxFed: numSalesTaxFed,
      furtherTax: numFurtherTax,
      totalTax: calculatedTotalTax,
      totalValue: calculatedTotalValue,
    };

    // 2. Prepare CoalSellRecord (for live stock deduction & CSR matrix sync)
    const newCoalSellRecord: CoalSellRecord = {
      id: saleId,
      date: documentDate,
      partnerId: partner.id,
      partnerName: partner.name,
      quantityTons: numQuantity,
      buyerNTN: buyerNTN.trim(),
      buyerCNIC: buyerCNIC.trim(),
      buyerName: buyerName.trim(),
      buyerType,
      saleOrganization,
      documentType,
      documentNumber: documentNumber.trim(),
      documentDate,
      valueExcludingTax: numValueExclTax,
      salesTaxFed: numSalesTaxFed,
      furtherTax: numFurtherTax,
      totalTax: calculatedTotalTax,
      totalValue: calculatedTotalValue,
    };

    // Save through handlers
    if (onSavePosSale) {
      onSavePosSale(newPosEntry);
    }
    onSaveCoalSell(newCoalSellRecord);

    showNotification(
      `Recorded POS Sale: ${formatWholeNumber(numQuantity)} Tons to "${buyerName.trim()}" under Partner "${partner.name}". Total Value: PKR ${formatWholeNumber(calculatedTotalValue)}`
    );

    // Auto-increment document number for next rapid entry
    setDocumentNumber(`STI-${new Date().getFullYear()}-${String(posEntries.length + 2).padStart(3, '0')}`);
  };

  // Helper date parsing (DD-MM-YYYY)
  const parseDDMMYYYY = (dStr: string) => {
    const parts = dStr.split('-');
    if (parts.length === 3) {
      return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    }
    return new Date(dStr);
  };

  // =========================================================================
  // DAILY CSR DATA AGGREGATION
  // Lists total coal quantity, partner wise for each day
  // Columns: sr., Date, [Partner Wise Columns], Total (Tons), Entries
  // =========================================================================
  const dailyCsrRows = useMemo(() => {
    // Combine posEntries and coalSellRecords to get complete unified sales history
    const allEntriesMap = new Map<string, PosCoalSellEntry>();

    posEntries.forEach((entry) => {
      allEntriesMap.set(entry.id, entry);
    });

    coalSellRecords.forEach((csr) => {
      if (!allEntriesMap.has(csr.id)) {
        allEntriesMap.set(csr.id, {
          id: csr.id,
          srNo: 1,
          partnerId: csr.partnerId,
          partnerName: csr.partnerName,
          buyerId: csr.buyerId || 'legacy',
          buyerNTN: csr.buyerNTN || '',
          buyerCNIC: csr.buyerCNIC || '',
          buyerName: csr.buyerName || 'Commercial Buyer',
          buyerType: csr.buyerType || 'Registered',
          saleOrganization: csr.saleOrganization || 'Balochistan',
          documentType: csr.documentType || 'Sales Tax Invoice',
          documentNumber: csr.documentNumber || `REC-${csr.date}`,
          documentDate: csr.date,
          quantity: csr.quantityTons,
          valueExcludingTax: csr.valueExcludingTax || 0,
          salesTaxFed: csr.salesTaxFed || 0,
          furtherTax: csr.furtherTax || 0,
          totalTax: csr.totalTax || 0,
          totalValue: csr.totalValue || 0,
        });
      }
    });

    const unifiedList = Array.from(allEntriesMap.values());

    // Aggregate by date
    const dateMap = new Map<string, {
      date: string;
      parsedDate: Date;
      partnerWiseTons: { [partnerName: string]: number };
      totalTons: number;
      entries: PosCoalSellEntry[];
    }>();

    unifiedList.forEach((entry) => {
      const dateKey = entry.documentDate || 'Undated';
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, {
          date: dateKey,
          parsedDate: parseDDMMYYYY(dateKey),
          partnerWiseTons: {},
          totalTons: 0,
          entries: [],
        });
      }

      const row = dateMap.get(dateKey)!;
      const pName = entry.partnerName || 'Direct / General';
      const qty = Number(entry.quantity) || 0;

      row.partnerWiseTons[pName] = (row.partnerWiseTons[pName] || 0) + qty;
      row.totalTons += qty;
      row.entries.push(entry);
    });

    let rows = Array.from(dateMap.values());

    // Sort dates descending (newest date first)
    rows.sort((a, b) => b.parsedDate.getTime() - a.parsedDate.getTime());

    // Filter by search term
    if (csrSearchTerm.trim()) {
      const term = csrSearchTerm.toLowerCase();
      rows = rows.filter((r) => {
        const matchesDate = r.date.toLowerCase().includes(term);
        const matchesPartner = Object.keys(r.partnerWiseTons).some((p) => p.toLowerCase().includes(term));
        const matchesBuyer = r.entries.some((e) => e.buyerName.toLowerCase().includes(term) || e.documentNumber.toLowerCase().includes(term));
        return matchesDate || matchesPartner || matchesBuyer;
      });
    }

    // Filter by time range
    const now = new Date();
    if (csrTimeFilter === 'daily') {
      const todayStr = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
      rows = rows.filter((r) => r.date === todayStr);
    } else if (csrTimeFilter === 'weekly') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      rows = rows.filter((r) => r.parsedDate >= oneWeekAgo);
    } else if (csrTimeFilter === 'monthly') {
      rows = rows.filter((r) => r.parsedDate.getMonth() === now.getMonth() && r.parsedDate.getFullYear() === now.getFullYear());
    }

    return rows.map((r, index) => ({
      srNo: index + 1,
      ...r,
      entriesCount: r.entries.length,
    }));
  }, [posEntries, coalSellRecords, csrSearchTerm, csrTimeFilter]);

  // Unique list of partners present in sales data or active partners
  const partnerColumns = useMemo(() => {
    const namesSet = new Set<string>();
    activePartners.forEach((p) => namesSet.add(p.name));
    dailyCsrRows.forEach((row) => {
      Object.keys(row.partnerWiseTons).forEach((p) => namesSet.add(p));
    });
    return Array.from(namesSet);
  }, [activePartners, dailyCsrRows]);

  // Overall totals for CSR
  const grandTotalTons = dailyCsrRows.reduce((sum, r) => sum + r.totalTons, 0);
  const grandTotalEntries = dailyCsrRows.reduce((sum, r) => sum + r.entriesCount, 0);

  // Export Daily CSR to CSV
  const handleExportCsrCsv = () => {
    const headers = ['Sr.', 'Date', ...partnerColumns.map((p) => `"${p} (Tons)"`), 'Total (Tons)', 'Entries'];
    const rows = dailyCsrRows.map((r) => [
      r.srNo,
      `"${r.date}"`,
      ...partnerColumns.map((p) => (r.partnerWiseTons[p] || 0).toFixed(2)),
      r.totalTons.toFixed(2),
      r.entriesCount,
    ]);

    const totalRow = [
      'TOTAL',
      'Grand Total',
      ...partnerColumns.map((p) => {
        const pTotal = dailyCsrRows.reduce((sum, r) => sum + (r.partnerWiseTons[p] || 0), 0);
        return pTotal.toFixed(2);
      }),
      grandTotalTons.toFixed(2),
      grandTotalEntries,
    ];

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(',')), totalRow.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Daily_CSR_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Daily CSR exported to CSV file successfully.');
  };

  return (
    <div className="space-y-6">
      {/* View Header with Section Switcher */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                Store & Sales
              </span>
              <span className="text-slate-300">/</span>
              <span className="text-xs text-slate-500">Commercial Coal Dispatches</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2.5">
              <Receipt className="w-5 h-5 text-emerald-600" />
              <span>Record Coal Sell (POS Invoice Form) & Daily CSR</span>
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Log commercial coal sales with full buyer credentials, statutory tax calculations, partner attribution, and view partner-wise Daily CSR.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Back to Overview
            </button>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveSection('form')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeSection === 'form'
                  ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-600/30'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <FileCheck2 className="w-4 h-4" />
              <span>New Coal Sell POS Form</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('daily_csr')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeSection === 'daily_csr'
                  ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-600/30'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Daily CSR (Coal Sales Report)</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                activeSection === 'daily_csr' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-800'
              }`}>
                {dailyCsrRows.length} Days
              </span>
            </button>
          </div>

          {/* Live Coal Stock Telemetry Indicator */}
          <div className="flex items-center gap-2 text-xs">
            <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-900">
              <Scale className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Live Available Coal Stock:</span>
              <span className="font-mono font-bold text-sm text-emerald-950">
                {formatWholeNumber(currentCoalStock)} MT
              </span>
            </div>
          </div>
        </div>
      </div>

      {notification && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{notification}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-emerald-700 hover:text-emerald-950 text-xs"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. NEW COAL SELL POS FORM (15 SPECIFIED FIELDS)                           */}
      {/* ========================================================================= */}
      {activeSection === 'form' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="pb-4 border-b border-slate-100 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                <span>New Coal Sell POS Entry Form</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                All 15 statutory fields with live automatic calculation of Total Tax and Total Value.
              </p>
            </div>

            {/* Quick Buyer Pre-Fill Selector */}
            {buyers.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Quick Pre-fill Buyer:</span>
                <select
                  value={selectedBuyerId}
                  onChange={(e) => handleBuyerSelect(e.target.value)}
                  className="text-xs font-semibold px-2.5 py-1.5 border border-slate-300 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                >
                  <option value="">-- Select Registered Buyer --</option>
                  {buyers.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.buyerName} ({b.buyerType})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Live Stock Impact & Zero Stock Alert Banner */}
            {isZeroStock ? (
              <div className="p-4 rounded-xl border-2 border-rose-300 bg-rose-50 text-rose-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-rose-200/80 text-rose-900 rounded-lg shrink-0 mt-0.5">
                    <AlertTriangle className="w-5 h-5 text-rose-700" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-rose-950 flex items-center gap-2">
                      <span>Zero Coal Stock Available (0 MT)</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 uppercase tracking-wide">
                        Dispatch Locked
                      </span>
                    </h4>
                    <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                      You can only record coal sells and dispatch invoices when the system has coal produced/in stock. Currently there is <strong>0 MT</strong> recorded in stock. Please record daily coal production first.
                    </p>
                  </div>
                </div>
                {onNavigateToProduction && (
                  <button
                    type="button"
                    onClick={onNavigateToProduction}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors shrink-0 cursor-pointer"
                  >
                    <Scale className="w-3.5 h-3.5" />
                    <span>Go to Daily Production</span>
                  </button>
                )}
              </div>
            ) : (
              <div className={`p-3.5 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isStockExceeded
                  ? 'bg-rose-50 border-rose-300 text-rose-900'
                  : 'bg-blue-50/80 border-blue-200 text-blue-900'
              }`}>
                <div className="flex items-center gap-2">
                  <Scale className={`w-4 h-4 shrink-0 ${isStockExceeded ? 'text-rose-600' : 'text-blue-600'}`} />
                  <span>
                    <strong>Stock Impact:</strong> Quantity entered is{' '}
                    <span className="font-mono font-bold">{formatWholeNumber(numQuantity)} MT</span>{' '}
                    of <span className="font-mono font-bold text-slate-900">{formatWholeNumber(currentCoalStock)} MT</span> available.
                    {isStockExceeded && (
                      <span className="text-rose-700 font-bold ml-1.5 inline-block">
                        ❌ Exceeds available stock! You cannot enter more than {formatWholeNumber(currentCoalStock)} MT.
                      </span>
                    )}
                  </span>
                </div>
                <div className="sm:text-right font-mono text-xs font-semibold">
                  Remaining Stock After Save:{' '}
                  <span className={`font-bold ${isStockExceeded ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {isStockExceeded ? 'Deficit' : `${formatWholeNumber(remainingStockAfterSale)} MT`}
                  </span>
                </div>
              </div>
            )}

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
              {/* Field 1: Partner Name (Dropdown list from partners) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Partner Name</span>
                  <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={partnerId}
                  onChange={(e) => setPartnerId(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {activePartners.length === 0 ? (
                    <option value="">No registered partners available</option>
                  ) : (
                    activePartners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </option>
                    ))
                  )}
                </select>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Dropdown from registered partners directory
                </span>
              </div>

              {/* Field 2: Buyer NTN */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  <span>Buyer NTN</span>
                </label>
                <input
                  type="text"
                  value={buyerNTN}
                  onChange={(e) => setBuyerNTN(e.target.value)}
                  placeholder="e.g. 7492104-8"
                  className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  FBR 7-digit NTN with check digit
                </span>
              </div>

              {/* Field 3: Buyer CNIC */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Buyer CNIC</span>
                </label>
                <input
                  type="text"
                  value={buyerCNIC}
                  onChange={(e) => setBuyerCNIC(e.target.value)}
                  placeholder="e.g. 54400-1234567-1"
                  className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  National Identity Card number
                </span>
              </div>

              {/* Field 4: Buyer Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Buyer Name</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="e.g. Lucky Cement Industries Ltd."
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Commercial purchasing entity
                </span>
              </div>

              {/* Field 5: Buyer Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Buyer Type <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={buyerType}
                  onChange={(e) => setBuyerType(e.target.value as BuyerType)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="Registered">Registered</option>
                  <option value="Unregistered">Unregistered</option>
                  <option value="Wholesaler">Wholesaler</option>
                  <option value="Corporate">Corporate</option>
                  <option value="Retailer">Retailer</option>
                </select>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Sales tax registration status
                </span>
              </div>

              {/* Field 6: Sale Org (Province) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sale Org (Province) <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={saleOrganization}
                  onChange={(e) => setSaleOrganization(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="Balochistan">Balochistan</option>
                  <option value="Sindh">Sindh</option>
                  <option value="Punjab">Punjab</option>
                  <option value="Khyber Pakhtunkhwa">Khyber Pakhtunkhwa</option>
                  <option value="Islamabad Capital Territory">Islamabad Capital Territory</option>
                </select>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Supplier dispatch jurisdiction
                </span>
              </div>

              {/* Field 7: Doc Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Doc Type</span>
                  <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="Sales Tax Invoice">Sales Tax Invoice</option>
                  <option value="Commercial Invoice">Commercial Invoice</option>
                  <option value="Delivery Challan">Delivery Challan</option>
                  <option value="Bill of Supply">Bill of Supply</option>
                </select>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  POS document categorization
                </span>
              </div>

              {/* Field 8: Doc No. */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Doc No.</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  placeholder="e.g. STI-2026-001"
                  className="w-full text-xs font-mono font-bold px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Unique sequential invoice number
                </span>
              </div>

              {/* Field 9: Doc Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Doc Date (DD-MM-YYYY)</span>
                  <span className="text-rose-500">*</span>
                </label>
                <DatePickerInput
                  required
                  value={documentDate}
                  onChange={(newDate) => setDocumentDate(newDate)}
                  className="w-full text-xs font-mono font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Invoice dispatch issue date
                </span>
              </div>

              {/* Field 10: Quantity (Ton) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Quantity (Ton)</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  {currentCoalStock > 0 && (
                    <button
                      type="button"
                      onClick={() => setQuantity(currentCoalStock)}
                      className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 transition-colors cursor-pointer"
                      title="Set quantity to maximum available stock"
                    >
                      Fill Max: {formatWholeNumber(currentCoalStock)} MT
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  max={Math.max(0, currentCoalStock)}
                  disabled={isZeroStock}
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder={isZeroStock ? 'No stock available (0 MT)' : `Max ${formatWholeNumber(currentCoalStock)} MT`}
                  className={`w-full text-sm font-mono font-bold px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    isZeroStock
                      ? 'bg-slate-100 text-slate-400 border-slate-300 cursor-not-allowed'
                      : isStockExceeded
                      ? 'bg-rose-50/50 text-rose-900 border-rose-500 focus:ring-rose-400'
                      : 'bg-white text-slate-900 border-slate-300 focus:ring-emerald-500'
                  }`}
                />
                {isZeroStock ? (
                  <span className="text-[11px] font-semibold text-rose-600 mt-1 block">
                    ⚠️ Cannot enter quantity: System currently has 0 MT coal in stock.
                  </span>
                ) : isStockExceeded ? (
                  <span className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Cannot enter more quantity than the coal produced/in stock ({formatWholeNumber(currentCoalStock)} MT)!</span>
                  </span>
                ) : (
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-0.5">
                    <span>Weight in Metric Tons (MT)</span>
                    <span className="font-mono font-semibold text-slate-700">Max: {formatWholeNumber(currentCoalStock)} MT</span>
                  </div>
                )}
              </div>

              {/* Field 11: Value Excl. Tax */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-slate-400" />
                  <span>Value Excl. Tax (PKR)</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  required
                  value={valueExcludingTax}
                  onChange={(e) => setValueExcludingTax(e.target.value === '' ? '' : Math.round(Number(e.target.value)))}
                  placeholder="e.g. 750000"
                  className="w-full text-sm font-mono font-bold px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Base invoice amount before taxes
                </span>
              </div>

              {/* Field 12: Sales Tax / FED */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sales Tax / FED (PKR) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  required
                  value={salesTaxFed}
                  onChange={(e) => setSalesTaxFed(e.target.value === '' ? '' : Math.round(Number(e.target.value)))}
                  placeholder="e.g. 135000"
                  className="w-full text-sm font-mono font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Standard 18% Sales Tax / FED
                </span>
              </div>

              {/* Field 13: Further Tax */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Further Tax (PKR)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={furtherTax}
                  onChange={(e) => setFurtherTax(e.target.value === '' ? '' : Math.round(Number(e.target.value)))}
                  placeholder="e.g. 22500"
                  className="w-full text-sm font-mono font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  3% or 4% further tax on unregistered buyers
                </span>
              </div>

              {/* Field 14: Total Tax (Calculated: Sales Tax / FED + Further Tax) */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                  <span>Total Tax</span>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">Auto-calculated</span>
                </label>
                <div className="font-mono text-base font-bold text-blue-900 mt-1">
                  PKR {formatWholeNumber(calculatedTotalTax)}
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Sales Tax / FED ({formatWholeNumber(numSalesTaxFed)}) + Further Tax ({formatWholeNumber(numFurtherTax)})
                </span>
              </div>

              {/* Field 15: Total Value (Calculated: Value Excl. Tax + Sales Tax / FED + Further Tax) */}
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg md:col-span-2 lg:col-span-2">
                <label className="block text-xs font-bold text-emerald-950 mb-1 flex items-center justify-between">
                  <span>Total Value (Gross Invoice Value)</span>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">
                    Value Excl. Tax + Total Tax
                  </span>
                </label>
                <div className="font-mono text-xl font-extrabold text-emerald-950 mt-1">
                  PKR {formatWholeNumber(calculatedTotalValue)}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-emerald-800 mt-1 font-medium">
                  <span>Excl. Tax: PKR {formatWholeNumber(numValueExclTax)}</span>
                  <span>+</span>
                  <span>Total Tax: PKR {formatWholeNumber(calculatedTotalTax)}</span>
                  {numQuantity > 0 && (
                    <span className="ml-auto font-mono text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-bold">
                      Rate/Ton: PKR {formatWholeNumber(Math.round(calculatedTotalValue / numQuantity))}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-5 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                💡 Submitting this POS form immediately logs the dispatch under the partner and deducts {formatWholeNumber(numQuantity)} MT from available stock.
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setQuantity(currentCoalStock <= 0 ? '' : Math.min(50, currentCoalStock));
                    setValueExcludingTax(750000);
                    setSalesTaxFed(135000);
                    setFurtherTax(22500);
                    setBuyerName('');
                    setBuyerNTN('');
                    setBuyerCNIC('');
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Clear Form
                </button>

                <button
                  type="submit"
                  disabled={isQuantityInvalid}
                  className={`inline-flex items-center gap-1.5 px-6 py-2 text-xs font-bold rounded-lg transition-all shadow-xs ${
                    isQuantityInvalid
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-80'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                  }`}
                  title={
                    isZeroStock
                      ? 'Cannot record sale: System has 0 MT coal produced/in stock'
                      : isStockExceeded
                      ? `Quantity (${numQuantity} MT) exceeds available stock (${currentCoalStock} MT)`
                      : 'Record coal sell'
                  }
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {isZeroStock
                      ? 'No Coal in Stock (0 MT)'
                      : isStockExceeded
                      ? `Exceeds Stock (${formatWholeNumber(currentCoalStock)} MT Max)`
                      : 'Save & Record Coal Sell'}
                  </span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SECTION CALLED DAILY CSR (DAILY COAL SALES REPORT)                     */}
      {/* Table columns: sr., Date, [Partner Wise], Total (Tons), Entries           */}
      {/* ========================================================================= */}
      {activeSection === 'daily_csr' && (
        <div className="space-y-4">
          {/* Daily CSR Header Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                    Daily CSR Summary
                  </span>
                  <span className="text-slate-300">/</span>
                  <span className="text-xs text-slate-500">Partner-wise Daily Dispatch Aggregations</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-600" />
                  <span>Daily CSR (Coal Sales Report)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Consolidated daily dispatch schedule listing total coal quantity partner-wise for each date, with transaction drilldown.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleExportCsrCsv}
                  disabled={dailyCsrRows.length === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Export CSR CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPrintModalOpen(true)}
                  disabled={dailyCsrRows.length === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>Print Daily CSR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSection('form')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>New Sale POS Form</span>
                </button>
              </div>
            </div>

            {/* Daily CSR Filter Ribbon */}
            <div className="pt-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by date (DD-MM-YYYY), partner, or buyer..."
                  value={csrSearchTerm}
                  onChange={(e) => setCsrSearchTerm(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Time Filters */}
              <div className="flex items-center gap-1.5">
                {(['all', 'daily', 'weekly', 'monthly'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setCsrTimeFilter(filter)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors cursor-pointer ${
                      csrTimeFilter === filter
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {filter === 'all' ? 'All Days' : filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Summary KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
              <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200">
                <span className="text-[11px] text-blue-700 font-semibold block">Total Dispatched (MT)</span>
                <span className="text-base font-bold font-mono text-blue-950">
                  {formatWholeNumber(grandTotalTons)} MT
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-purple-50/70 border border-purple-200">
                <span className="text-[11px] text-purple-700 font-semibold block">Total Invoices / Entries</span>
                <span className="text-base font-bold font-mono text-purple-950">
                  {grandTotalEntries} Entries
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200">
                <span className="text-[11px] text-emerald-700 font-semibold block">Active Dispatch Days</span>
                <span className="text-base font-bold font-mono text-emerald-950">
                  {dailyCsrRows.length} Days
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200">
                <span className="text-[11px] text-amber-700 font-semibold block">Partners Represented</span>
                <span className="text-base font-bold font-mono text-amber-950">
                  {partnerColumns.length} Partners
                </span>
              </div>
            </div>
          </div>

          {/* Daily CSR Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                  <tr>
                    {/* Required Column 1: sr. */}
                    <th scope="col" className="px-3.5 py-3 w-14 text-center">
                      sr.
                    </th>

                    {/* Required Column 2: Date */}
                    <th scope="col" className="px-4 py-3 min-w-[130px]">
                      Date
                    </th>

                    {/* Partner Wise Columns */}
                    {partnerColumns.map((partnerName) => (
                      <th
                        key={partnerName}
                        scope="col"
                        className="px-3.5 py-3 text-right min-w-[120px] font-semibold text-slate-800"
                      >
                        <span className="truncate block" title={partnerName}>
                          {partnerName} (Tons)
                        </span>
                      </th>
                    ))}

                    {/* Required Column 3: Total (Tons) */}
                    <th scope="col" className="px-4 py-3 text-right min-w-[120px] bg-emerald-50/60 text-emerald-950 font-bold">
                      Total (Tons)
                    </th>

                    {/* Required Column 4: Entries */}
                    <th scope="col" className="px-4 py-3 text-center min-w-[100px]">
                      Entries
                    </th>

                    <th scope="col" className="px-3.5 py-3 text-center w-20">
                      Details
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {dailyCsrRows.length === 0 ? (
                    <tr>
                      <td colSpan={partnerColumns.length + 5} className="py-12 text-center text-slate-400">
                        <Layers className="w-8 h-8 mx-auto text-slate-300 mb-2 opacity-60" />
                        <p className="font-semibold text-slate-600">No Daily CSR records found</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Use the "New Coal Sell POS Form" above to record dispatches.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    dailyCsrRows.map((row) => {
                      const isExpanded = expandedDate === row.date;
                      return (
                        <React.Fragment key={row.date}>
                          <tr className={`hover:bg-slate-50/80 transition-colors ${isExpanded ? 'bg-blue-50/20' : ''}`}>
                            {/* Column 1: sr. */}
                            <td className="px-3.5 py-3 text-center font-mono font-medium text-slate-500">
                              {row.srNo}
                            </td>

                            {/* Column 2: Date */}
                            <td className="px-4 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <span>{row.date}</span>
                              </div>
                            </td>

                            {/* Partner Wise Columns */}
                            {partnerColumns.map((pName) => {
                              const tons = row.partnerWiseTons[pName] || 0;
                              return (
                                <td
                                  key={pName}
                                  className={`px-3.5 py-3 text-right font-mono font-semibold ${
                                    tons > 0 ? 'text-slate-900' : 'text-slate-300'
                                  }`}
                                >
                                  {tons > 0 ? formatWholeNumber(tons) : '-'}
                                </td>
                              );
                            })}

                            {/* Column 3: Total (Tons) */}
                            <td className="px-4 py-3 text-right font-mono font-bold text-emerald-950 bg-emerald-50/30 whitespace-nowrap">
                              <span className="inline-flex items-center px-2 py-0.5 rounded font-mono font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-200">
                                {formatWholeNumber(row.totalTons)} MT
                              </span>
                            </td>

                            {/* Column 4: Entries */}
                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => setExpandedDate(isExpanded ? null : row.date)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                              >
                                <span>{row.entriesCount}</span>
                                <span>{row.entriesCount === 1 ? 'Entry' : 'Entries'}</span>
                              </button>
                            </td>

                            {/* Row Expand Toggle */}
                            <td className="px-3.5 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => setExpandedDate(isExpanded ? null : row.date)}
                                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                                title={isExpanded ? 'Collapse invoices' : 'View daily invoices'}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-blue-600" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </button>
                            </td>
                          </tr>

                          {/* Expanded Dispatches Sub-table for that Day */}
                          {isExpanded && (
                            <tr className="bg-slate-50/70 border-b border-blue-100">
                              <td colSpan={partnerColumns.length + 5} className="p-4">
                                <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs space-y-3">
                                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                                    <div className="flex items-center gap-2">
                                      <FileText className="w-4 h-4 text-blue-600" />
                                      <span className="font-bold text-slate-800">
                                        Dispatches for Date: {row.date}
                                      </span>
                                      <span className="text-slate-400 font-mono">({row.entries.length} Invoices recorded)</span>
                                    </div>
                                    <span className="font-mono font-bold text-emerald-800">
                                      Day Total: {formatWholeNumber(row.totalTons)} MT
                                    </span>
                                  </div>

                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left text-[11px]">
                                      <thead className="text-[10px] uppercase font-bold text-slate-500 bg-slate-50 border-b border-slate-200">
                                        <tr>
                                          <th className="py-2 px-2.5">Doc No.</th>
                                          <th className="py-2 px-2.5">Partner Name</th>
                                          <th className="py-2 px-2.5">Buyer Name</th>
                                          <th className="py-2 px-2.5">Buyer NTN</th>
                                          <th className="py-2 px-2.5">Sale Org</th>
                                          <th className="py-2 px-2.5 text-right">Quantity (Ton)</th>
                                          <th className="py-2 px-2.5 text-right">Total Tax (PKR)</th>
                                          <th className="py-2 px-2.5 text-right">Total Value (PKR)</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {row.entries.map((entry) => (
                                          <tr key={entry.id} className="hover:bg-slate-50">
                                            <td className="py-2 px-2.5 font-mono font-semibold text-blue-700">
                                              {entry.documentNumber || entry.id}
                                            </td>
                                            <td className="py-2 px-2.5 font-medium text-slate-800">
                                              {entry.partnerName || 'N/A'}
                                            </td>
                                            <td className="py-2 px-2.5 font-semibold text-slate-900">
                                              {entry.buyerName}
                                            </td>
                                            <td className="py-2 px-2.5 font-mono text-slate-500">
                                              {entry.buyerNTN || '-'}
                                            </td>
                                            <td className="py-2 px-2.5 text-slate-600">
                                              {entry.saleOrganization || 'Balochistan'}
                                            </td>
                                            <td className="py-2 px-2.5 text-right font-mono font-bold text-emerald-800">
                                              {formatWholeNumber(entry.quantity)} MT
                                            </td>
                                            <td className="py-2 px-2.5 text-right font-mono text-slate-600">
                                              {formatWholeNumber(entry.totalTax || 0)}
                                            </td>
                                            <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-900">
                                              {formatWholeNumber(entry.totalValue || 0)}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>

                {/* Grand Total Footer Row */}
                {dailyCsrRows.length > 0 && (
                  <tfoot className="bg-slate-100 text-xs font-bold text-slate-900 border-t-2 border-slate-300">
                    <tr>
                      <td className="px-3.5 py-3 text-center text-slate-500 font-mono">
                        ∑
                      </td>
                      <td className="px-4 py-3 uppercase tracking-wider font-extrabold text-slate-900">
                        Grand Total
                      </td>

                      {/* Partner-wise Grand Totals */}
                      {partnerColumns.map((pName) => {
                        const pTotal = dailyCsrRows.reduce((sum, r) => sum + (r.partnerWiseTons[pName] || 0), 0);
                        return (
                          <td key={pName} className="px-3.5 py-3 text-right font-mono font-bold text-slate-900">
                            {pTotal > 0 ? formatWholeNumber(pTotal) : '-'}
                          </td>
                        );
                      })}

                      {/* Grand Total (Tons) */}
                      <td className="px-4 py-3 text-right font-mono font-extrabold text-emerald-950 bg-emerald-100/70">
                        {formatWholeNumber(grandTotalTons)} MT
                      </td>

                      {/* Grand Total Entries */}
                      <td className="px-4 py-3 text-center font-mono font-extrabold text-blue-950">
                        {grandTotalEntries} Entries
                      </td>

                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Print Statement Modal */}
      {printModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                Daily CSR (Coal Sales Report) Print Preview
              </h3>
              <button
                type="button"
                onClick={() => setPrintModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg text-xs space-y-2 font-mono">
              <div className="font-bold text-sm text-slate-900">DAILY COAL SALES REPORT (DAILY CSR)</div>
              <div className="text-slate-600">Total Days: {dailyCsrRows.length} | Grand Total Sold: {formatWholeNumber(grandTotalTons)} MT</div>
              <div className="text-slate-600">Total Invoices Logged: {grandTotalEntries}</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPrintModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Statement</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
