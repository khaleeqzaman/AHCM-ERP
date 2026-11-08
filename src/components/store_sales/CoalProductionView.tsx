import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Handshake, 
  Scale, 
  CheckCircle2, 
  X, 
  Edit2, 
  Trash2, 
  TrendingUp, 
  Layers, 
  Truck, 
  AlertCircle, 
  Download, 
  FileSpreadsheet,
  Building2,
  Clock,
  ArrowRight,
  ShieldCheck,
  PackageCheck
} from 'lucide-react';
import { CoalProductionRecord, PartnerRecord, CoalSellRecord, CompanySettings } from '../../types/storeSales';
import { DatePickerInput } from '../common/DatePickerInput';
import { formatWholeNumber, formatCoalStockFormula } from '../../utils/formatters';

interface CoalProductionViewProps {
  productionRecords: CoalProductionRecord[];
  coalSellRecords: CoalSellRecord[];
  partners: PartnerRecord[];
  companySettings?: CompanySettings;
  onAddProduction: (record: CoalProductionRecord) => void;
  onUpdateProduction: (record: CoalProductionRecord) => void;
  onDeleteProduction: (id: string) => void;
  onNavigateToRecordSell?: () => void;
  onClearLegacyCoalSales?: () => void;
  onUpdateCompanySettings?: (settings: CompanySettings) => void;
}

export const CoalProductionView: React.FC<CoalProductionViewProps> = ({
  productionRecords,
  coalSellRecords,
  partners,
  companySettings,
  onAddProduction,
  onUpdateProduction,
  onDeleteProduction,
  onNavigateToRecordSell,
  onClearLegacyCoalSales,
  onUpdateCompanySettings,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPartnerFilter, setSelectedPartnerFilter] = useState('All');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CoalProductionRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<CoalProductionRecord | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Form State for Adding / Editing Production
  const [formDate, setFormDate] = useState(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  });

  const activePartners = useMemo(() => partners.filter((p) => p.isActive), [partners]);
  const [formPartnerId, setFormPartnerId] = useState<string>(activePartners[0]?.id || partners[0]?.id || '');
  const [formQuantityTons, setFormQuantityTons] = useState<number | ''>(100);
  const [formPithead, setFormPithead] = useState<string>('Pithead Shaft #1');
  const [formVehicleNo, setFormVehicleNo] = useState<string>('');
  const [formRemarks, setFormRemarks] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Synchronize initial partner id when partners load
  React.useEffect(() => {
    if (!formPartnerId && partners.length > 0) {
      setFormPartnerId(activePartners[0]?.id || partners[0]?.id || '');
    }
  }, [partners, activePartners, formPartnerId]);

  // Opening pithead coal reserve (defaults to 100 Tons to match: 500 + 100 + 500 Tons)
  const openingStock = (typeof companySettings?.openingCoalStock === 'number' && companySettings.openingCoalStock > 0)
    ? companySettings.openingCoalStock
    : 100;
  const [isOpeningStockModalOpen, setIsOpeningStockModalOpen] = useState(false);
  const [tempOpeningStock, setTempOpeningStock] = useState<number | ''>(openingStock);

  // Overall Coal Metrics Calculation
  const totalProducedTons = useMemo(() => {
    return productionRecords.reduce((sum, r) => sum + (Number(r.quantityTons) || 0), 0);
  }, [productionRecords]);

  const totalSoldTons = useMemo(() => {
    return coalSellRecords.reduce((sum, r) => sum + (Number(r.quantityTons) || 0), 0);
  }, [coalSellRecords]);

  // Gross Pithead Coal Stock = Total Coal Stock (Produced) + Coal Opening Balance
  const grossCoalStockTons = useMemo(() => {
    return openingStock + totalProducedTons;
  }, [openingStock, totalProducedTons]);

  // Live Pithead Available Coal Stock = Gross Stock (Produced + Opening Balance) - Total Sold (floored at 0)
  const currentCoalStockTons = useMemo(() => {
    return Math.max(0, grossCoalStockTons - totalSoldTons);
  }, [grossCoalStockTons, totalSoldTons]);

  // Dynamic Formula representing: "500 + 100 + 500 Tons" (Total Coal Stock + Coal Opening Balance)
  const grossStockFormula = useMemo(() => {
    const quantities = productionRecords.map((r) => Number(r.quantityTons) || 0);
    return formatCoalStockFormula(quantities, openingStock, 0);
  }, [productionRecords, openingStock]);

  const netStockFormula = useMemo(() => {
    const quantities = productionRecords.map((r) => Number(r.quantityTons) || 0);
    return formatCoalStockFormula(quantities, openingStock, totalSoldTons);
  }, [productionRecords, openingStock, totalSoldTons]);

  // Check if historical sales exceed produced + opening stock
  const hasHistoricalSalesDeficit = useMemo(() => {
    return totalSoldTons > grossCoalStockTons;
  }, [totalSoldTons, grossCoalStockTons]);

  // Handle Save Opening Stock
  const handleSaveOpeningStock = (e: React.FormEvent) => {
    e.preventDefault();
    const val = tempOpeningStock === '' ? 0 : Math.max(0, Number(tempOpeningStock));
    if (onUpdateCompanySettings && companySettings) {
      onUpdateCompanySettings({
        ...companySettings,
        openingCoalStock: val,
      });
      showNotification(`Opening pithead coal stock set to ${formatWholeNumber(val)} Tons. Live coal stock updated.`);
    }
    setIsOpeningStockModalOpen(false);
  };

  // Today's production
  const todayString = useMemo(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }, []);

  const todayProducedTons = useMemo(() => {
    return productionRecords
      .filter((r) => r.date === todayString)
      .reduce((sum, r) => sum + (Number(r.quantityTons) || 0), 0);
  }, [productionRecords, todayString]);

  // Partner-wise Breakdown
  const partnerBreakdown = useMemo(() => {
    const map = new Map<string, { partnerName: string; totalTons: number; count: number }>();
    productionRecords.forEach((r) => {
      const existing = map.get(r.partnerId) || { partnerName: r.partnerName, totalTons: 0, count: 0 };
      existing.totalTons += Number(r.quantityTons) || 0;
      existing.count += 1;
      map.set(r.partnerId, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.totalTons - a.totalTons);
  }, [productionRecords]);

  // Handle Add Form Submission
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formPartnerId) {
      setFormError('Please select a partner company.');
      return;
    }

    const partner = partners.find((p) => p.id === formPartnerId);
    if (!partner) {
      setFormError('Selected partner not found.');
      return;
    }

    const qty = Number(formQuantityTons);
    if (!qty || qty <= 0) {
      setFormError('Please enter a valid positive quantity in tons.');
      return;
    }

    const newRecord: CoalProductionRecord = {
      id: `cpr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      srNo: productionRecords.length + 1,
      date: formDate.trim(),
      partnerId: partner.id,
      partnerName: partner.name,
      quantityTons: qty,
      pitheadLocation: formPithead.trim() || undefined,
      vehicleNo: formVehicleNo.trim() || undefined,
      remarks: formRemarks.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    onAddProduction(newRecord);
    setIsAddModalOpen(false);
    showNotification(`Recorded ${formatWholeNumber(qty)} Tons of coal produced by ${partner.name}. Added to Coal Stock!`);

    // Reset Form
    setFormQuantityTons('');
    setFormRemarks('');
    setFormVehicleNo('');
  };

  // Open Edit Modal
  const handleOpenEdit = (rec: CoalProductionRecord) => {
    setEditingRecord(rec);
    setFormDate(rec.date);
    setFormPartnerId(rec.partnerId);
    setFormQuantityTons(rec.quantityTons);
    setFormPithead(rec.pitheadLocation || '');
    setFormVehicleNo(rec.vehicleNo || '');
    setFormRemarks(rec.remarks || '');
    setFormError(null);
  };

  // Handle Edit Submit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    setFormError(null);

    const partner = partners.find((p) => p.id === formPartnerId) || { id: formPartnerId, name: editingRecord.partnerName };
    const qty = Number(formQuantityTons);
    if (!qty || qty <= 0) {
      setFormError('Please enter a valid positive quantity in tons.');
      return;
    }

    const updated: CoalProductionRecord = {
      ...editingRecord,
      date: formDate.trim(),
      partnerId: partner.id,
      partnerName: partner.name,
      quantityTons: qty,
      pitheadLocation: formPithead.trim() || undefined,
      vehicleNo: formVehicleNo.trim() || undefined,
      remarks: formRemarks.trim() || undefined,
    };

    onUpdateProduction(updated);
    setEditingRecord(null);
    showNotification(`Production record updated. Coal Stock recalculated.`);
  };

  // Handle Confirm Delete
  const handleConfirmDelete = () => {
    if (!deletingRecord) return;
    onDeleteProduction(deletingRecord.id);
    const qty = deletingRecord.quantityTons;
    setDeletingRecord(null);
    showNotification(`Removed production entry. ${formatWholeNumber(qty)} Tons deducted from Coal Stock.`);
  };

  // Filtered Production Records
  const filteredRecords = useMemo(() => {
    return productionRecords.filter((r) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        (r.partnerName || '').toLowerCase().includes(q) ||
        (r.pitheadLocation || '').toLowerCase().includes(q) ||
        (r.vehicleNo || '').toLowerCase().includes(q) ||
        (r.remarks || '').toLowerCase().includes(q) ||
        r.date.includes(q);

      const matchesPartner = selectedPartnerFilter === 'All' || r.partnerId === selectedPartnerFilter;

      let matchesDate = true;
      if (startDateFilter && r.date < startDateFilter) matchesDate = false;
      if (endDateFilter && r.date > endDateFilter) matchesDate = false;

      return matchesSearch && matchesPartner && matchesDate;
    }).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [productionRecords, searchTerm, selectedPartnerFilter, startDateFilter, endDateFilter]);

  // Export CSV
  const handleExportCsv = () => {
    const headers = ['Sr No', 'Date', 'Partner Name', 'Quantity (Tons)', 'Pithead Location', 'Vehicle / Dumper Ref', 'Remarks'];
    const rows = filteredRecords.map((r, i) => [
      i + 1,
      `"${r.date}"`,
      `"${r.partnerName.replace(/"/g, '""')}"`,
      r.quantityTons,
      `"${(r.pitheadLocation || '').replace(/"/g, '""')}"`,
      `"${(r.vehicleNo || '').replace(/"/g, '""')}"`,
      `"${(r.remarks || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `coal_production_report_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Coal Operations & Mining
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">Pithead Stock & Production Management</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <Scale className="w-5 h-5 text-emerald-600" />
            <span>Daily Coal Production & Stock Register</span>
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Log extracted coal per partner on a daily basis to increase available inventory. Recording sales automatically decreases stock.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTempOpeningStock(openingStock);
              setIsOpeningStockModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-xs cursor-pointer"
            title="Set opening pithead raw coal reserve balance"
          >
            <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Opening Coal Stock ({formatWholeNumber(openingStock)} Tons)</span>
          </button>

          {onNavigateToRecordSell && (
            <button
              type="button"
              onClick={onNavigateToRecordSell}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <span>Record Coal Sell</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setFormError(null);
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Daily Production</span>
          </button>
        </div>
      </div>

      {/* Explicit Stock Isolation Badge */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong className="text-slate-900 font-semibold">100% Dedicated Pithead Coal Ledger:</strong> Raw mined coal production & sales tracking is completely isolated from General Store Item Stock (spare parts, fuel, lubricants).
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] shrink-0">
          <span className="text-slate-500">Unit: Tons</span>
          <span className="text-slate-300">·</span>
          <span className="text-emerald-700 font-semibold">{productionRecords.length} Production Logs Active</span>
        </div>
      </div>

      {/* Historical Sales Deficit Alert Card (Explains why Live Stock might show 0 Tons when 250 Tons was produced) */}
      {hasHistoricalSalesDeficit && (
        <div className="p-4 rounded-xl bg-amber-50/90 border-2 border-amber-300 text-amber-900 shadow-xs space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-950">
                  Historical Sales ({formatWholeNumber(totalSoldTons)} Tons) Exceed Recorded Production ({formatWholeNumber(totalProducedTons)} Tons)
                </h4>
                <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                  Net Balance Deficit: -{formatWholeNumber(totalSoldTons - (openingStock + totalProducedTons))} Tons
                </span>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed">
                Your <strong>{formatWholeNumber(totalProducedTons)} Tons of newly produced coal</strong> is recorded and saved in the register below! However, your database contains <strong>{coalSellRecords.length} historical coal sales ({formatWholeNumber(totalSoldTons)} Tons)</strong> logged prior to production tracking. Because coal sales auto-decrease stock, the net pithead balance ({formatWholeNumber(openingStock + totalProducedTons)} Tons Produced − {formatWholeNumber(totalSoldTons)} Tons Sold) resulted in a negative number, which is clamped to <strong>0 Tons</strong>.
              </p>
              <p className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1.5 pt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Coal production is 100% separate from Store Item Stock. Choose a quick resolution below:</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-amber-200/80">
            <span className="text-xs font-bold text-amber-950">Recommended Resolution:</span>
            {onClearLegacyCoalSales && (
              <button
                type="button"
                onClick={() => {
                  onClearLegacyCoalSales();
                  showNotification(`Historical test sales (${formatWholeNumber(totalSoldTons)} Tons) cleared! Live coal stock now shows ${formatWholeNumber(totalProducedTons)} Tons.`);
                }}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 active:bg-amber-900 rounded-lg transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Historical Test Sales ({formatWholeNumber(totalSoldTons)} Tons)</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setTempOpeningStock(totalSoldTons);
                setIsOpeningStockModalOpen(true);
              }}
              className="px-3.5 py-1.5 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <Scale className="w-3.5 h-3.5 text-emerald-600" />
              <span>Set Opening Pithead Stock (e.g. {formatWholeNumber(totalSoldTons)} Tons)</span>
            </button>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-2.5 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{notification}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Live Coal Stock & Production KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Live Coal Stock (Total Coal Stock + Coal Opening Balance) */}
        <div className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white rounded-xl p-5 shadow-xs border border-emerald-800/40 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                Live Coal Stock
              </span>
              <PackageCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-white flex items-baseline gap-2 flex-wrap">
              <span>{formatWholeNumber(grossCoalStockTons)}</span>
              <span className="text-sm font-normal text-emerald-300">Tons</span>
              {totalSoldTons > 0 && (
                <span className="text-xs font-sans font-medium text-emerald-300 bg-emerald-950/80 border border-emerald-600/50 px-2 py-0.5 rounded-full ml-auto">
                  Available: {formatWholeNumber(currentCoalStockTons)} Tons
                </span>
              )}
            </div>
            <div className="text-[11px] text-emerald-300/80 font-medium mt-1">
              Total Coal Stock + Coal Opening Balance
            </div>
          </div>
          <div className="text-[11px] text-emerald-200/90 mt-3 border-t border-emerald-800/60 pt-2 space-y-1.5">
            <div className="flex items-center justify-between gap-1 flex-wrap">
              <span className="font-semibold text-emerald-300">Formula:</span>
              <span className="font-mono text-emerald-100 font-bold bg-emerald-950/90 px-2 py-0.5 rounded border border-emerald-600/40 shadow-xs">
                {grossStockFormula}
              </span>
            </div>
            {totalSoldTons > 0 && (
              <div className="flex items-center justify-between text-[10px] text-emerald-300/80 font-mono">
                <span>Net After Dispatches:</span>
                <span>{grossStockFormula.replace(' Tons', '')} − {formatWholeNumber(totalSoldTons)} = {formatWholeNumber(currentCoalStockTons)} Tons</span>
              </div>
            )}
            <div className="flex items-center justify-between text-[10px] text-slate-300 pt-0.5">
              <span>Pithead Reserve Balance</span>
              <button
                type="button"
                onClick={() => {
                  setTempOpeningStock(openingStock);
                  setIsOpeningStockModalOpen(true);
                }}
                className="text-emerald-300 hover:text-white underline cursor-pointer"
              >
                Opening: {formatWholeNumber(openingStock)} Tons
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: Total Coal Produced */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Total Coal Produced</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-700">
              {formatWholeNumber(totalProducedTons)} <span className="text-xs font-normal text-slate-500">Tons</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>{productionRecords.length} Daily Production Logs</span>
            <span className="text-emerald-700 font-semibold font-mono">+{formatWholeNumber(todayProducedTons)} Tons Today</span>
          </div>
        </div>

        {/* Card 3: Total Coal Sold */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Total Coal Sold / Dispatched</span>
              <Truck className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-blue-700">
              {formatWholeNumber(totalSoldTons)} <span className="text-xs font-normal text-slate-500">Tons</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>{coalSellRecords.length} Coal Sell Records</span>
            <span className="text-blue-700 font-semibold">Auto-decreases Stock</span>
          </div>
        </div>

        {/* Card 4: Contributing Partners */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Active Mining Partners</span>
              <Handshake className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-purple-700">
              {partnerBreakdown.length} <span className="text-xs font-normal text-slate-500">Partners</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>{activePartners.length} Active in System</span>
            <span className="text-purple-700 font-semibold">Partner Allocation</span>
          </div>
        </div>
      </div>

      {/* Production by Partner Contribution Section */}
      {partnerBreakdown.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Production by Partner Breakdown
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Total Mined: {formatWholeNumber(totalProducedTons)} Tons
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {partnerBreakdown.map((item) => {
              const pct = totalProducedTons > 0 ? ((item.totalTons / totalProducedTons) * 100).toFixed(1) : '0';
              return (
                <div key={item.partnerName} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex justify-between text-xs font-semibold text-slate-900 mb-1 truncate">
                    <span className="truncate">{item.partnerName}</span>
                    <span className="font-mono text-emerald-700 shrink-0 ml-2">{formatWholeNumber(item.totalTons)} Tons</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1.5">
                    <div 
                      className="bg-emerald-600 h-full rounded-full transition-all" 
                      style={{ width: `${Math.min(100, Math.max(5, Number(pct)))}%` }} 
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1.5 font-mono">
                    <span>{pct}% of Total</span>
                    <span>{item.count} log(s)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-3.5 border border-slate-200 rounded-xl shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by partner, pithead, vehicle, remarks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Partner Filter */}
          <select
            value={selectedPartnerFilter}
            onChange={(e) => setSelectedPartnerFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-700 font-medium"
          >
            <option value="All">All Partners ({partners.length})</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.code ? `(${p.code})` : ''}
              </option>
            ))}
          </select>

          {(searchTerm || selectedPartnerFilter !== 'All' || startDateFilter || endDateFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedPartnerFilter('All');
                setStartDateFilter('');
                setEndDateFilter('');
              }}
              className="px-2.5 py-1.5 text-xs text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-200 rounded-lg cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Daily Production Register Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-3 text-center">Sr</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Partner Name</th>
                <th className="py-3 px-4 text-right">Production (Tons)</th>
                <th className="py-3 px-4">Pithead Location</th>
                <th className="py-3 px-4">Vehicle / Dumper</th>
                <th className="py-3 px-4">Supervisor Remarks</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <p className="font-semibold text-slate-700">No coal production records found.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Click "Add Daily Production" to log daily mined coal per partner.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 text-center font-mono text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700 whitespace-nowrap">
                      {r.date}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <Handshake className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{r.partnerName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 whitespace-nowrap tabular-nums">
                      +{formatWholeNumber(r.quantityTons)} Tons
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {r.pitheadLocation || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {r.vehicleNo || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] max-w-xs truncate">
                      {r.remarks || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(r)}
                          className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                          title="Edit production log"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingRecord(r)}
                          className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Delete production log"
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

        {/* Footer */}
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2">
          <span>
            Showing <strong className="text-slate-900">{filteredRecords.length}</strong> of{' '}
            <strong className="text-slate-900">{productionRecords.length}</strong> daily production entries
          </span>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span>Filtered Total: <strong className="text-emerald-700">+{formatWholeNumber(filteredRecords.reduce((s, r) => s + r.quantityTons, 0))} Tons</strong></span>
          </div>
        </div>
      </div>

      {/* =========================================================
          MODAL: ADD / EDIT DAILY COAL PRODUCTION
          ========================================================= */}
      {(isAddModalOpen || editingRecord) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingRecord ? 'Edit Daily Coal Production' : 'Record Daily Coal Production'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Add mined coal to increase net available coal inventory.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingRecord(null);
                }}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={editingRecord ? handleEditSubmit : handleAddSubmit} className="space-y-4 text-xs">
              {/* Live Stock Impact Preview Box */}
              <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-lg flex items-center justify-between text-xs">
                <div>
                  <span className="text-[11px] text-emerald-800 font-medium block">
                    Available Coal Stock:
                  </span>
                  <span className="font-mono text-sm font-bold text-slate-800">
                    {formatWholeNumber(currentCoalStockTons)} Tons
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-emerald-800 font-medium block">
                    After This Addition:
                  </span>
                  <span className="font-mono text-sm font-bold text-emerald-700">
                    +{formatWholeNumber(Number(formQuantityTons) || 0)} Tons → {formatWholeNumber(currentCoalStockTons + (Number(formQuantityTons) || 0))} Tons
                  </span>
                </div>
              </div>

              {/* Date & Partner Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Date */}
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Production Date *
                  </label>
                  <DatePickerInput
                    value={formDate}
                    onChange={(val) => setFormDate(val)}
                    placeholder="DD-MM-YYYY"
                  />
                </div>

                {/* 2. Partner Name (Dropdown) */}
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Partner Name *
                  </label>
                  <select
                    value={formPartnerId}
                    onChange={(e) => setFormPartnerId(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                  >
                    <option value="" disabled>Select Partner Company...</option>
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.code ? `(${p.code})` : ''} {!p.isActive ? '[Inactive]' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quantity in Tons */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Quantity Produced (in Tons) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    required
                    value={formQuantityTons}
                    onChange={(e) => setFormQuantityTons(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 150.00"
                    className="w-full pl-3 pr-14 py-2 text-xs font-mono font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">
                    Tons
                  </span>
                </div>
              </div>

              {/* Pithead Location & Vehicle Ref */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Pithead / Mine Location
                  </label>
                  <input
                    type="text"
                    value={formPithead}
                    onChange={(e) => setFormPithead(e.target.value)}
                    placeholder="e.g. Pithead Shaft #1, North Seam"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Dumper / Transport Ref
                  </label>
                  <input
                    type="text"
                    value={formVehicleNo}
                    onChange={(e) => setFormVehicleNo(e.target.value)}
                    placeholder="e.g. TK-8804 or Conveyor"
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                </div>
              </div>

              {/* Supervisor / Remarks */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Supervisor Remarks / Quality Notes
                </label>
                <input
                  type="text"
                  value={formRemarks}
                  onChange={(e) => setFormRemarks(e.target.value)}
                  placeholder="e.g. Grade A anthracite coal, verified by site weighbridge scale #2"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingRecord(null);
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{editingRecord ? 'Update Production Entry' : 'Add to Coal Stock'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: CONFIRM DELETE PRODUCTION ENTRY
          ========================================================= */}
      {deletingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Delete Production Entry
                </h3>
                <p className="text-xs text-slate-500">
                  This will decrease available coal stock by {formatWholeNumber(deletingRecord.quantityTons)} Tons.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Date:</span>
                <span className="text-slate-900">{deletingRecord.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Partner:</span>
                <span className="text-slate-900 font-sans font-semibold">{deletingRecord.partnerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Quantity:</span>
                <span className="text-rose-700 font-bold">{formatWholeNumber(deletingRecord.quantityTons)} Tons</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingRecord(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {/* =========================================================
          MODAL: SET OPENING PITHEAD COAL STOCK
          ========================================================= */}
      {isOpeningStockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <PackageCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Set Opening Coal Stock
                  </h3>
                  <p className="text-xs text-slate-500">
                    Baseline pithead reserve existing prior to production logs.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpeningStockModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOpeningStock} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 text-slate-600">
                <div className="flex justify-between">
                  <span>Current Daily Production:</span>
                  <span className="font-mono font-bold text-emerald-700">+{formatWholeNumber(totalProducedTons)} Tons</span>
                </div>
                <div className="flex justify-between">
                  <span>Current Coal Dispatched / Sold:</span>
                  <span className="font-mono font-bold text-blue-700">−{formatWholeNumber(totalSoldTons)} Tons</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1 text-slate-900 font-semibold">
                  <span>New Available Live Coal Stock:</span>
                  <span className="font-mono text-emerald-700">
                    {formatWholeNumber(Math.max(0, (Number(tempOpeningStock) || 0) + totalProducedTons - totalSoldTons))} Tons
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Opening Coal Reserve (Tons) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={tempOpeningStock}
                    onChange={(e) => setTempOpeningStock(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 500.00"
                    className="w-full pl-3 pr-14 py-2 text-xs font-mono font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">
                    Tons
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Pithead coal inventory is 100% separate from General Store Items (spare parts/filters).
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpeningStockModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <PackageCheck className="w-3.5 h-3.5" />
                  <span>Update Opening Stock</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
