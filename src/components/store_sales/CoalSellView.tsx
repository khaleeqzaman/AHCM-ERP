import React, { useState, useMemo } from 'react';
import type { 
  CoalSellRecord, 
  PartnerRecord, 
  BuyerRecord, 
  CompanySettings, 
  CoalStockRecord,
  BuyerType,
  SaleProvince 
} from '../../types/storeSales.ts';
import ConfirmModal from './ConfirmModal.tsx';

interface CoalSellViewProps {
  coalSells: CoalSellRecord[];
  coalStocks: CoalStockRecord[];
  partners: PartnerRecord[];
  buyers: BuyerRecord[];
  companySettings: CompanySettings;
  onAddCoalSell: (record: Omit<CoalSellRecord, 'id' | 'createdAt'>) => void;
  onUpdateCoalSell: (record: CoalSellRecord) => void;
  onDeleteCoalSell: (id: string) => void;
}

export const CoalSellView: React.FC<CoalSellViewProps> = ({
  coalSells,
  coalStocks,
  partners,
  buyers,
  companySettings,
  onAddCoalSell,
  onUpdateCoalSell,
  onDeleteCoalSell,
}) => {
  // Tabs: 'sell_form' | 'date_wise_report' | 'partner_wise_report'
  const [activeTab, setActiveTab] = useState<'sell_form' | 'date_wise_report' | 'partner_wise_report'>('sell_form');

  // Math for Available Live Coal Stock
  const openingStock = Number(companySettings.openingCoalStock || 0);
  const totalStockAdded = useMemo(() => {
    return coalStocks.reduce((sum, s) => sum + Number(s.quantity || 0), 0);
  }, [coalStocks]);
  const totalCoalSold = useMemo(() => {
    return coalSells.reduce((sum, s) => sum + Number(s.quantity || 0), 0);
  }, [coalSells]);
  const liveCoalStock = (openingStock + totalStockAdded) - totalCoalSold;

  // Form State
  const todayStr = new Date().toISOString().split('T')[0].split('-').reverse().join('-');
  const [formData, setFormData] = useState({
    date: todayStr,
    partnerId: partners[0]?.id || '',
    selectedBuyerId: buyers[0]?.id || 'custom',
    buyerName: buyers[0]?.buyerName || '',
    buyerNTN: buyers[0]?.buyerNTN || '',
    buyerCNIC: buyers[0]?.buyerCNIC || '',
    buyerType: (buyers[0]?.buyerType || 'Registered') as BuyerType,
    saleOrganization: (buyers[0]?.saleOrganization || 'Balochistan') as SaleProvince,
    documentType: 'Sales Tax Invoice',
    documentNumber: `STI-${new Date().getFullYear()}-${String(coalSells.length + 1).padStart(3, '0')}`,
    quantity: '',
    valueExcludingTax: '',
    salesTaxFed: '',
    furtherTax: '',
    vehicleNo: '',
    driverName: '',
    biltyNo: '',
    remarks: '',
  });

  // Edit State
  const [editingSell, setEditingSell] = useState<CoalSellRecord | null>(null);

  // Filters & Search for Date-wise Report
  const [searchTerm, setSearchTerm] = useState('');
  const [partnerFilter, setPartnerFilter] = useState('');
  const [buyerTypeFilter, setBuyerTypeFilter] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('');
  const [sortField, setSortField] = useState<'date' | 'quantity' | 'totalValue'>('date');
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

  // Quick auto-fill buyer when buyer dropdown changes
  const handleBuyerSelect = (buyerId: string) => {
    if (buyerId === 'custom') {
      setFormData(prev => ({
        ...prev,
        selectedBuyerId: 'custom',
        buyerName: '',
        buyerNTN: '',
        buyerCNIC: '',
      }));
    } else {
      const b = buyers.find(x => x.id === buyerId);
      if (b) {
        setFormData(prev => ({
          ...prev,
          selectedBuyerId: b.id,
          buyerName: b.buyerName,
          buyerNTN: b.buyerNTN,
          buyerCNIC: b.buyerCNIC,
          buyerType: b.buyerType,
          saleOrganization: (b.saleOrganization || 'Balochistan') as SaleProvince,
        }));
      }
    }
  };

  // Auto-calculated Taxes & Totals for Add Form
  const formTaxCalculations = useMemo(() => {
    const valExcl = parseFloat(formData.valueExcludingTax) || 0;
    const stFed = parseFloat(formData.salesTaxFed) || 0;
    const fTax = parseFloat(formData.furtherTax) || 0;
    const totalTax = stFed + fTax;
    const totalValue = valExcl + totalTax;
    return { valExcl, stFed, fTax, totalTax, totalValue };
  }, [formData.valueExcludingTax, formData.salesTaxFed, formData.furtherTax]);

  // Form Submission with Strict Stock Ceiling Validation
  const handleSubmitSell = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(formData.quantity);
    if (isNaN(qty) || qty <= 0) {
      alert('Please enter a valid coal sales quantity in Tons (> 0)');
      return;
    }

    if (liveCoalStock <= 0) {
      alert(`Cannot record coal sell: Live coal stock is 0 Tons. Please add coal stock before selling.`);
      return;
    }

    if (qty > liveCoalStock) {
      alert(`Cannot sell ${qty} Tons! Available live coal stock is only ${liveCoalStock.toLocaleString()} Tons. Sales quantity cannot exceed available stock.`);
      return;
    }

    const partner = partners.find(p => p.id === formData.partnerId);
    if (!partner) {
      alert('Please select a valid partner');
      return;
    }

    if (!formData.buyerName.trim()) {
      alert('Please enter or select a buyer name');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Confirm Coal Sell POS Entry',
      message: `Are you sure you want to record sale of ${qty.toLocaleString()} Tons to "${formData.buyerName}" for Total Value of PKR ${formTaxCalculations.totalValue.toLocaleString()}? This will decrease live coal stock by ${qty.toLocaleString()} Tons.`,
      confirmLabel: 'Confirm & Post Invoice',
      variant: 'primary',
      onConfirm: () => {
        onAddCoalSell({
          date: formData.date,
          partnerId: partner.id,
          partnerName: partner.name,
          buyerId: formData.selectedBuyerId !== 'custom' ? formData.selectedBuyerId : undefined,
          buyerName: formData.buyerName.trim(),
          buyerNTN: formData.buyerNTN.trim(),
          buyerCNIC: formData.buyerCNIC.trim(),
          buyerType: formData.buyerType,
          saleOrganization: formData.saleOrganization,
          documentType: formData.documentType.trim() || 'Sales Tax Invoice',
          documentNumber: formData.documentNumber.trim(),
          quantity: qty,
          valueExcludingTax: formTaxCalculations.valExcl,
          salesTaxFed: formTaxCalculations.stFed,
          furtherTax: formTaxCalculations.fTax,
          totalTax: formTaxCalculations.totalTax,
          totalValue: formTaxCalculations.totalValue,
          vehicleNo: formData.vehicleNo.trim() || undefined,
          driverName: formData.driverName.trim() || undefined,
          biltyNo: formData.biltyNo.trim() || undefined,
          remarks: formData.remarks.trim() || undefined,
        });

        // Reset form
        setFormData({
          date: todayStr,
          partnerId: partners[0]?.id || '',
          selectedBuyerId: buyers[0]?.id || 'custom',
          buyerName: buyers[0]?.buyerName || '',
          buyerNTN: buyers[0]?.buyerNTN || '',
          buyerCNIC: buyers[0]?.buyerCNIC || '',
          buyerType: (buyers[0]?.buyerType || 'Registered') as BuyerType,
          saleOrganization: (buyers[0]?.saleOrganization || 'Balochistan') as SaleProvince,
          documentType: 'Sales Tax Invoice',
          documentNumber: `STI-${new Date().getFullYear()}-${String(coalSells.length + 2).padStart(3, '0')}`,
          quantity: '',
          valueExcludingTax: '',
          salesTaxFed: '',
          furtherTax: '',
          vehicleNo: '',
          driverName: '',
          biltyNo: '',
          remarks: '',
        });

        setActiveTab('date_wise_report');
      },
    });
  };

  // Handle Edit Submit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSell) return;

    const qty = Number(editingSell.quantity);
    if (isNaN(qty) || qty <= 0) {
      alert('Please enter a valid quantity in Tons');
      return;
    }

    const valExcl = Number(editingSell.valueExcludingTax) || 0;
    const stFed = Number(editingSell.salesTaxFed) || 0;
    const fTax = Number(editingSell.furtherTax) || 0;
    const totalTax = stFed + fTax;
    const totalValue = valExcl + totalTax;

    setConfirmModal({
      isOpen: true,
      title: 'Confirm Update Coal Sale Invoice',
      message: `Update Document #${editingSell.documentNumber} for ${editingSell.buyerName}? Quantity: ${qty} Tons, Total: PKR ${totalValue.toLocaleString()}.`,
      confirmLabel: 'Save Changes',
      variant: 'primary',
      onConfirm: () => {
        onUpdateCoalSell({
          ...editingSell,
          quantity: qty,
          valueExcludingTax: valExcl,
          salesTaxFed: stFed,
          furtherTax: fTax,
          totalTax,
          totalValue,
        });
        setEditingSell(null);
      },
    });
  };

  // Handle Delete Sale
  const handleDeleteClick = (sell: CoalSellRecord) => {
    setConfirmModal({
      isOpen: true,
      title: 'Confirm Delete Sale Invoice',
      message: `Are you sure you want to delete Invoice #${sell.documentNumber} (${sell.quantity} Tons to ${sell.buyerName})? This will restore ${sell.quantity} Tons back to the live coal stock.`,
      confirmLabel: 'Delete & Restore Stock',
      variant: 'danger',
      onConfirm: () => {
        onDeleteCoalSell(sell.id);
      },
    });
  };

  // Filtered Date-wise List
  const filteredSells = useMemo(() => {
    return coalSells.filter(s => {
      const matchSearch =
        (s.buyerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.documentNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.date || '').includes(searchTerm) ||
        (s.partnerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.buyerNTN || '').includes(searchTerm) ||
        (s.buyerCNIC || '').includes(searchTerm);

      const matchPartner = partnerFilter ? s.partnerId === partnerFilter : true;
      const matchBuyerType = buyerTypeFilter ? s.buyerType === buyerTypeFilter : true;
      const matchProvince = provinceFilter ? s.saleOrganization === provinceFilter : true;

      return matchSearch && matchPartner && matchBuyerType && matchProvince;
    }).sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') cmp = (a.date || '').localeCompare(b.date || '');
      else if (sortField === 'quantity') cmp = (a.quantity ?? 0) - (b.quantity ?? 0);
      else if (sortField === 'totalValue') cmp = (a.totalValue ?? 0) - (b.totalValue ?? 0);
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [coalSells, searchTerm, partnerFilter, buyerTypeFilter, provinceFilter, sortField, sortOrder]);

  // Partner-Wise Daily Aggregation
  // Columns required: Date, Partner wise Total Sell Quantity of each day, total coal sell entries.
  const partnerWiseDailyReport = useMemo(() => {
    const map = new Map<string, { date: string; partnerTotals: { [partnerName: string]: number }; totalDayTons: number; entriesCount: number }>();

    coalSells.forEach(s => {
      const existing = map.get(s.date) || {
        date: s.date,
        partnerTotals: {},
        totalDayTons: 0,
        entriesCount: 0,
      };

      existing.partnerTotals[s.partnerName] = (existing.partnerTotals[s.partnerName] || 0) + Number(s.quantity || 0);
      existing.totalDayTons += Number(s.quantity || 0);
      existing.entriesCount += 1;
      map.set(s.date, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [coalSells]);

  // Export Date-wise CSV
  const handleExportDateWiseCSV = () => {
    const headers = [
      'Sr', 'Date', 'Partner', 'Buyer Name', 'Buyer NTN', 'Buyer CNIC', 'Buyer Type', 
      'Sale Org Province', 'Doc Type', 'Doc No', 'Quantity (Tons)', 
      'Value Excl Tax (PKR)', 'Sales Tax/FED (PKR)', 'Further Tax (PKR)', 'Total Tax (PKR)', 'Total Value (PKR)'
    ];

    const rows = filteredSells.map((s, idx) => [
      idx + 1,
      s.date,
      `"${s.partnerName.replace(/"/g, '""')}"`,
      `"${s.buyerName.replace(/"/g, '""')}"`,
      `"${s.buyerNTN}"`,
      `"${s.buyerCNIC}"`,
      s.buyerType,
      s.saleOrganization,
      `"${s.documentType}"`,
      `"${s.documentNumber}"`,
      s.quantity,
      s.valueExcludingTax,
      s.salesTaxFed,
      s.furtherTax,
      s.totalTax,
      s.totalValue,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `coal_sell_datewise_report_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Partner-wise CSV
  const handleExportPartnerWiseCSV = () => {
    const partnerNames = partners.map(p => p.name);
    const headers = ['Sr', 'Date', ...partnerNames.map(p => `"${p} (Tons)"`), 'Day Total (Tons)', 'Total Entries'];
    
    const rows = partnerWiseDailyReport.map((row, idx) => [
      idx + 1,
      row.date,
      ...partnerNames.map(p => (row.partnerTotals[p] || 0)),
      row.totalDayTons,
      row.entriesCount,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `coal_sell_partnerwise_report_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Date-wise Report
  const handlePrintDateWise = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Date-wise Coal Sell Report - ${companySettings.companyName}</title>
          <style>
            body { font-family: system-ui, sans-serif; margin: 24px; color: #0f172a; }
            h1 { font-size: 20px; margin-bottom: 4px; }
            h2 { font-size: 14px; font-weight: normal; color: #475569; margin-top: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 11px; }
            th, td { border: 1px solid #cbd5e1; padding: 5px 8px; text-align: left; }
            th { background: #0f172a; color: white; }
            .num { text-align: right; }
            .totals { font-weight: bold; background: #f8fafc; }
          </style>
        </head>
        <body>
          <h1>${companySettings.companyName}</h1>
          <h2>DATE-WISE COAL SELL (POS) REPORT & SALES TAX INVOICES (Generated: ${new Date().toLocaleDateString()})</h2>
          <table>
            <thead>
              <tr>
                <th>Sr.</th>
                <th>Date</th>
                <th>Partner</th>
                <th>Buyer Name</th>
                <th>NTN / CNIC</th>
                <th>Type</th>
                <th>Province</th>
                <th>Doc #</th>
                <th class="num">Quantity (Tons)</th>
                <th class="num">Excl. Tax (PKR)</th>
                <th class="num">ST/FED</th>
                <th class="num">Total Tax</th>
                <th class="num">Total Value</th>
              </tr>
            </thead>
            <tbody>
              ${filteredSells.map((s, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${s.date}</td>
                  <td>${s.partnerName}</td>
                  <td><strong>${s.buyerName}</strong></td>
                  <td>${s.buyerNTN || s.buyerCNIC || '-'}</td>
                  <td>${s.buyerType}</td>
                  <td>${s.saleOrganization}</td>
                  <td>${s.documentNumber}</td>
                  <td class="num">${s.quantity.toLocaleString()} Tons</td>
                  <td class="num">${s.valueExcludingTax.toLocaleString()}</td>
                  <td class="num">${s.salesTaxFed.toLocaleString()}</td>
                  <td class="num">${s.totalTax.toLocaleString()}</td>
                  <td class="num font-bold">${s.totalValue.toLocaleString()}</td>
                </tr>
              `).join('')}
              <tr class="totals">
                <td colspan="8" style="text-align: right;">Total:</td>
                <td class="num">${filteredSells.reduce((sum, s) => sum + s.quantity, 0).toLocaleString()} Tons</td>
                <td class="num">${filteredSells.reduce((sum, s) => sum + s.valueExcludingTax, 0).toLocaleString()}</td>
                <td class="num">${filteredSells.reduce((sum, s) => sum + s.salesTaxFed, 0).toLocaleString()}</td>
                <td class="num">${filteredSells.reduce((sum, s) => sum + s.totalTax, 0).toLocaleString()}</td>
                <td class="num">${filteredSells.reduce((sum, s) => sum + s.totalValue, 0).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Print Partner-wise Report
  const handlePrintPartnerWise = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Partner-wise Daily Coal Sell Report - ${companySettings.companyName}</title>
          <style>
            body { font-family: system-ui, sans-serif; margin: 24px; color: #0f172a; }
            h1 { font-size: 20px; margin-bottom: 4px; }
            h2 { font-size: 14px; font-weight: normal; color: #475569; margin-top: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 11px; }
            th, td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; }
            th { background: #0f172a; color: white; }
            .num { text-align: right; }
          </style>
        </head>
        <body>
          <h1>${companySettings.companyName}</h1>
          <h2>PARTNER-WISE COAL SELL REPORT (DAILY SUMMARY)</h2>
          <table>
            <thead>
              <tr>
                <th>Sr.</th>
                <th>Date</th>
                ${partners.map(p => `<th class="num">${p.name} (Tons)</th>`).join('')}
                <th class="num">Total Coal Sold (Tons)</th>
                <th class="num">Entries</th>
              </tr>
            </thead>
            <tbody>
              ${partnerWiseDailyReport.map((row, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${row.date}</td>
                  ${partners.map(p => `<td class="num">${(row.partnerTotals[p.name] || 0).toLocaleString()} Tons</td>`).join('')}
                  <td class="num" style="font-weight: bold; background: #f1f5f9;">${row.totalDayTons.toLocaleString()} Tons</td>
                  <td class="num">${row.entriesCount}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-6">
      {/* Live Coal Stock Availability Banner */}
      <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
        liveCoalStock > 0 
          ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
          : 'bg-amber-50 border-amber-300 text-amber-900'
      }`}>
        <div className="flex items-center space-x-3">
          <div className="text-2xl">{liveCoalStock > 0 ? '🟢' : '⚠️'}</div>
          <div>
            <div className="text-xs uppercase font-bold tracking-wider opacity-75">
              Available Coal Stock For Sales
            </div>
            <div className="text-xl font-extrabold">
              {liveCoalStock.toLocaleString()} <span className="text-sm font-semibold">Tons</span>
            </div>
          </div>
        </div>
        <div className="text-xs">
          {liveCoalStock > 0 ? (
            <span className="text-emerald-700">
              Coal sell entries will auto-decrease this balance. Quantity cannot exceed this limit.
            </span>
          ) : (
            <span className="text-amber-800 font-semibold">
              Warning: Coal stock is 0 Tons. Record coal stock inflows before making sales.
            </span>
          )}
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('sell_form')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'sell_form'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            🧾 Coal Sell POS Entry Form
          </button>
          <button
            onClick={() => setActiveTab('date_wise_report')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'date_wise_report'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            📅 Date-wise Coal Sell Report
          </button>
          <button
            onClick={() => setActiveTab('partner_wise_report')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'partner_wise_report'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            🤝 Partner-wise Daily Report
          </button>
        </div>

        {activeTab === 'date_wise_report' && (
          <div className="flex space-x-2">
            <button
              onClick={handleExportDateWiseCSV}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center space-x-1.5 shadow-sm"
            >
              <span>📥 Export CSV</span>
            </button>
            <button
              onClick={handlePrintDateWise}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center space-x-1.5 shadow-sm"
            >
              <span>🖨️ Print Report</span>
            </button>
          </div>
        )}

        {activeTab === 'partner_wise_report' && (
          <div className="flex space-x-2">
            <button
              onClick={handleExportPartnerWiseCSV}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center space-x-1.5 shadow-sm"
            >
              <span>📥 Export CSV</span>
            </button>
            <button
              onClick={handlePrintPartnerWise}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center space-x-1.5 shadow-sm"
            >
              <span>🖨️ Print Daily Summary</span>
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: COAL SELL FORM */}
      {activeTab === 'sell_form' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-4xl mx-auto">
          <div className="border-b border-slate-100 pb-4 mb-5">
            <h2 className="text-lg font-semibold text-slate-900">Record Coal Sell (POS Invoice Form)</h2>
            <p className="text-xs text-slate-500 mt-1">
              Issue coal sales tax invoice. Selected quantity in Tons will decrease available coal stock. All taxes are calculated automatically.
            </p>
          </div>

          <form onSubmit={handleSubmitSell} className="space-y-5">
            {/* Row 1: Date & Partner */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sale Date (DD-MM-YYYY) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mining Partner Name <span className="text-red-500">*</span>
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

            {/* Row 2: Buyer Selection (Dropdown or Custom) */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Buyer Information (From Buyer Management or Manual)
                </span>
                <span className="text-[11px] text-slate-500">Select pre-registered buyer or choose custom</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Buyer Profile
                  </label>
                  <select
                    value={formData.selectedBuyerId}
                    onChange={e => handleBuyerSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="custom">-- Enter Custom / New Buyer --</option>
                    {buyers.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.buyerName} ({b.buyerType})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Buyer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fauji Cement Co."
                    value={formData.buyerName}
                    onChange={e => setFormData({ ...formData, buyerName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Buyer Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.buyerType}
                    onChange={e => setFormData({ ...formData, buyerType: e.target.value as BuyerType })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Registered">Registered</option>
                    <option value="Unregistered">Unregistered</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Buyer NTN</label>
                  <input
                    type="text"
                    placeholder="3920194-7"
                    value={formData.buyerNTN}
                    onChange={e => setFormData({ ...formData, buyerNTN: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Buyer CNIC</label>
                  <input
                    type="text"
                    placeholder="54400-1928301-3"
                    value={formData.buyerCNIC}
                    onChange={e => setFormData({ ...formData, buyerCNIC: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sale Org (Province) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.saleOrganization}
                    onChange={e => setFormData({ ...formData, saleOrganization: e.target.value as SaleProvince })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Balochistan">Balochistan</option>
                    <option value="Sindh">Sindh</option>
                    <option value="Punjab">Punjab</option>
                    <option value="KPK">KPK</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Row 3: Document Details & Quantity */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document Type <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.documentType}
                  onChange={e => setFormData({ ...formData, documentType: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document No. <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.documentNumber}
                  onChange={e => setFormData({ ...formData, documentNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quantity (Ton) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={liveCoalStock > 0 ? liveCoalStock : undefined}
                    required
                    placeholder="e.g. 200"
                    value={formData.quantity}
                    onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full pl-3 pr-14 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2 text-xs font-semibold text-slate-400">Tons</span>
                </div>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Available in stock: <strong>{liveCoalStock.toLocaleString()} Tons</strong>
                </span>
              </div>
            </div>

            {/* Row 4: Values, Taxes and Auto Calculations */}
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200/80 space-y-4">
              <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider block">
                Financials & Sales Tax Breakdown (PKR)
              </span>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Value Excl. Tax <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="e.g. 3000000"
                    value={formData.valueExcludingTax}
                    onChange={e => setFormData({ ...formData, valueExcludingTax: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sales Tax / FED (in ST Mode)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 540000"
                    value={formData.salesTaxFed}
                    onChange={e => setFormData({ ...formData, salesTaxFed: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Further Tax
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 90000"
                    value={formData.furtherTax}
                    onChange={e => setFormData({ ...formData, furtherTax: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Auto Calculated Summary Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-emerald-200">
                <div className="bg-white p-3 rounded-lg border border-emerald-200 shadow-xs flex justify-between items-center">
                  <div>
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">
                      Total Tax (Auto: ST/FED + Further Tax)
                    </div>
                    <div className="text-lg font-bold text-slate-800">
                      PKR {formTaxCalculations.totalTax.toLocaleString()}
                    </div>
                  </div>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">Auto</span>
                </div>

                <div className="bg-emerald-900 text-white p-3 rounded-lg shadow-xs flex justify-between items-center">
                  <div>
                    <div className="text-[11px] font-semibold text-emerald-200 uppercase">
                      Total Value of Sales (Excl. Tax + Total Tax)
                    </div>
                    <div className="text-xl font-extrabold tracking-tight">
                      PKR {formTaxCalculations.totalValue.toLocaleString()}
                    </div>
                  </div>
                  <span className="text-xs bg-emerald-800 text-emerald-100 px-2 py-0.5 rounded font-mono">Net</span>
                </div>
              </div>
            </div>

            {/* Row 5: Logistics Ref (Vehicle, Driver, Bilty, Remarks) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle No.</label>
                <input
                  type="text"
                  placeholder="e.g. TLR-8812"
                  value={formData.vehicleNo}
                  onChange={e => setFormData({ ...formData, vehicleNo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Driver Name</label>
                <input
                  type="text"
                  placeholder="e.g. Mohammad Rafique"
                  value={formData.driverName}
                  onChange={e => setFormData({ ...formData, driverName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bilty No.</label>
                <input
                  type="text"
                  placeholder="e.g. BLT-9021"
                  value={formData.biltyNo}
                  onChange={e => setFormData({ ...formData, biltyNo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks</label>
                <input
                  type="text"
                  placeholder="Direct dispatch to works"
                  value={formData.remarks}
                  onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab('date_wise_report')}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                View Coal Sell Report
              </button>
              <button
                type="submit"
                disabled={liveCoalStock <= 0}
                className="px-6 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
              >
                Record Coal Sell POS
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: DATE-WISE COAL SELL REPORT */}
      {activeTab === 'date_wise_report' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Filter Bar */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search buyer, doc #, NTN, partner..."
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
                value={buyerTypeFilter}
                onChange={e => setBuyerTypeFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">All Buyer Types</option>
                <option value="Registered">Registered</option>
                <option value="Unregistered">Unregistered</option>
              </select>

              <select
                value={provinceFilter}
                onChange={e => setProvinceFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">All Provinces</option>
                <option value="Sindh">Sindh</option>
                <option value="Punjab">Punjab</option>
                <option value="Balochistan">Balochistan</option>
                <option value="KPK">KPK</option>
              </select>

              <select
                value={sortField}
                onChange={e => setSortField(e.target.value as any)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="date">Sort by Date</option>
                <option value="quantity">Sort by Quantity</option>
                <option value="totalValue">Sort by Total Value</option>
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-2 py-1.5 text-xs border border-slate-300 rounded-lg bg-white hover:bg-slate-100"
              >
                {sortOrder === 'asc' ? '⬆️ Asc' : '⬇️ Desc'}
              </button>
            </div>

            <div className="text-xs font-semibold text-slate-600">
              Showing {filteredSells.length} of {coalSells.length} invoices
            </div>
          </div>

          {/* Detailed Invoice Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-3 py-3 text-left">Sr.</th>
                  <th className="px-3 py-3 text-left">Date</th>
                  <th className="px-3 py-3 text-left">Partner</th>
                  <th className="px-3 py-3 text-left">Buyer Name</th>
                  <th className="px-3 py-3 text-left">Buyer NTN</th>
                  <th className="px-3 py-3 text-left">Buyer CNIC</th>
                  <th className="px-3 py-3 text-left">Type</th>
                  <th className="px-3 py-3 text-left">Sale Org</th>
                  <th className="px-3 py-3 text-left">Doc No.</th>
                  <th className="px-3 py-3 text-right">Quantity (Ton)</th>
                  <th className="px-3 py-3 text-right">Value Excl. Tax</th>
                  <th className="px-3 py-3 text-right">Sales Tax/FED</th>
                  <th className="px-3 py-3 text-right">Further Tax</th>
                  <th className="px-3 py-3 text-right">Total Tax</th>
                  <th className="px-3 py-3 text-right">Total Value</th>
                  <th className="px-3 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredSells.length === 0 ? (
                  <tr>
                    <td colSpan={16} className="px-4 py-8 text-center text-slate-400">
                      No coal sell records found. Switch to "Coal Sell POS Entry Form" to add a sale.
                    </td>
                  </tr>
                ) : (
                  filteredSells.map((s, idx) => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-2.5 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="px-3 py-2.5 font-medium text-slate-800 whitespace-nowrap">{s.date}</td>
                      <td className="px-3 py-2.5 text-slate-700 whitespace-nowrap">{s.partnerName}</td>
                      <td className="px-3 py-2.5 font-semibold text-slate-900 whitespace-nowrap">{s.buyerName}</td>
                      <td className="px-3 py-2.5 font-mono text-slate-600">{s.buyerNTN || '-'}</td>
                      <td className="px-3 py-2.5 font-mono text-slate-600">{s.buyerCNIC || '-'}</td>
                      <td className="px-3 py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          s.buyerType === 'Registered' 
                            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {s.buyerType}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-700">{s.saleOrganization}</td>
                      <td className="px-3 py-2.5 font-mono text-slate-700 whitespace-nowrap">{s.documentNumber}</td>
                      <td className="px-3 py-2.5 text-right font-bold text-emerald-800 whitespace-nowrap">
                        {s.quantity.toLocaleString()} Ton
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-slate-700">
                        {s.valueExcludingTax.toLocaleString()}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-slate-600">
                        {s.salesTaxFed.toLocaleString()}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-slate-600">
                        {s.furtherTax.toLocaleString()}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-medium text-slate-800">
                        {s.totalTax.toLocaleString()}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-900 whitespace-nowrap">
                        {s.totalValue.toLocaleString()}
                      </td>
                      <td className="px-3 py-2.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => setEditingSell(s)}
                            className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(s)}
                            className="px-2 py-1 text-xs text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredSells.length > 0 && (
                <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-800">
                  <tr>
                    <td colSpan={9} className="px-3 py-3 text-right">Filtered Totals:</td>
                    <td className="px-3 py-3 text-right text-emerald-900 whitespace-nowrap">
                      {filteredSells.reduce((sum, s) => sum + s.quantity, 0).toLocaleString()} Tons
                    </td>
                    <td className="px-3 py-3 text-right font-mono">
                      {filteredSells.reduce((sum, s) => sum + s.valueExcludingTax, 0).toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-right font-mono">
                      {filteredSells.reduce((sum, s) => sum + s.salesTaxFed, 0).toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-right font-mono">
                      {filteredSells.reduce((sum, s) => sum + s.furtherTax, 0).toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-right font-mono">
                      {filteredSells.reduce((sum, s) => sum + s.totalTax, 0).toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-emerald-950 whitespace-nowrap">
                      PKR {filteredSells.reduce((sum, s) => sum + s.totalValue, 0).toLocaleString()}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PARTNER-WISE COAL SELL REPORT (DAILY SUMMARY) */}
      {activeTab === 'partner_wise_report' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900">
              Partner-Wise Daily Coal Sell Report (Summary by Date & Partner)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Aggregated daily coal dispatch breakdown across mining partners with total tons and entries.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Sr.</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  {partners.map(p => (
                    <th key={p.id} className="px-4 py-3 text-right">{p.name} (Tons)</th>
                  ))}
                  <th className="px-4 py-3 text-right bg-emerald-50 text-emerald-900">Total Coal Sold (Tons)</th>
                  <th className="px-4 py-3 text-center">Entries</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {partnerWiseDailyReport.length === 0 ? (
                  <tr>
                    <td colSpan={partners.length + 4} className="px-4 py-8 text-center text-slate-400">
                      No daily coal sales recorded yet.
                    </td>
                  </tr>
                ) : (
                  partnerWiseDailyReport.map((row, idx) => (
                    <tr key={row.date} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{row.date}</td>
                      {partners.map(p => {
                        const qty = row.partnerTotals[p.name] || 0;
                        return (
                          <td key={p.id} className="px-4 py-3 text-right font-mono text-slate-700">
                            {qty > 0 ? `${qty.toLocaleString()} Tons` : '-'}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-right font-bold text-emerald-900 bg-emerald-50/50 whitespace-nowrap font-mono">
                        {row.totalDayTons.toLocaleString()} Tons
                      </td>
                      <td className="px-4 py-3 text-center font-medium text-slate-700">
                        {row.entriesCount}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {partnerWiseDailyReport.length > 0 && (
                <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-800">
                  <tr>
                    <td colSpan={2} className="px-4 py-3 text-right">Overall Total:</td>
                    {partners.map(p => {
                      const totalP = partnerWiseDailyReport.reduce((sum, r) => sum + (r.partnerTotals[p.name] || 0), 0);
                      return (
                        <td key={p.id} className="px-4 py-3 text-right font-mono text-slate-900">
                          {totalP.toLocaleString()} Tons
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-right font-mono text-emerald-900 bg-emerald-100/50">
                      {partnerWiseDailyReport.reduce((sum, r) => sum + r.totalDayTons, 0).toLocaleString()} Tons
                    </td>
                    <td className="px-4 py-3 text-center">
                      {partnerWiseDailyReport.reduce((sum, r) => sum + r.entriesCount, 0)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingSell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full p-6 border border-slate-200">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-semibold text-slate-900">Edit Coal Sale Invoice #{editingSell.documentNumber}</h3>
              <p className="text-xs text-slate-500">Update quantity, financials, or partner allocation.</p>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="text"
                    required
                    value={editingSell.date}
                    onChange={e => setEditingSell({ ...editingSell, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Partner</label>
                  <select
                    value={editingSell.partnerId}
                    onChange={e => {
                      const p = partners.find(x => x.id === e.target.value);
                      if (p) setEditingSell({ ...editingSell, partnerId: p.id, partnerName: p.name });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    {partners.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Buyer Name</label>
                  <input
                    type="text"
                    required
                    value={editingSell.buyerName}
                    onChange={e => setEditingSell({ ...editingSell, buyerName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity (Tons)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={editingSell.quantity}
                    onChange={e => setEditingSell({ ...editingSell, quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Value Excl. Tax</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingSell.valueExcludingTax}
                    onChange={e => setEditingSell({ ...editingSell, valueExcludingTax: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sales Tax / FED</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingSell.salesTaxFed}
                    onChange={e => setEditingSell({ ...editingSell, salesTaxFed: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Further Tax</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingSell.furtherTax}
                    onChange={e => setEditingSell({ ...editingSell, furtherTax: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border text-xs text-slate-600 flex justify-between">
                <span>Calculated Total Tax: <strong>PKR {((Number(editingSell.salesTaxFed) || 0) + (Number(editingSell.furtherTax) || 0)).toLocaleString()}</strong></span>
                <span>Calculated Total Value: <strong>PKR {((Number(editingSell.valueExcludingTax) || 0) + (Number(editingSell.salesTaxFed) || 0) + (Number(editingSell.furtherTax) || 0)).toLocaleString()}</strong></span>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingSell(null)}
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
        variant={confirmModal.variant}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default CoalSellView;
