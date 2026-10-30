import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
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
  Columns,
  Eye,
  EyeOff,
  Filter,
  ArrowUpDown,
  ChevronDown,
  Layers
} from 'lucide-react';
import { 
  CoalSellRecord, 
  PartnerRecord, 
  CompanySettings 
} from '../../types/storeSales';

interface CoalSalesReportViewProps {
  records: CoalSellRecord[];
  partners: PartnerRecord[];
  companySettings: CompanySettings;
  onAddRecord: (record: CoalSellRecord) => void;
  onUpdateRecord: (record: CoalSellRecord) => void;
  onDeleteRecord: (id: string) => void;
  onAddPartner: (partner: PartnerRecord) => void;
  onTogglePartnerReportColumn: (partnerId: string) => void;
  onTogglePartnerActive: (partnerId: string) => void;
  onDeletePartner: (partnerId: string) => void;
  onNavigateToRecordSell: () => void;
}

export const CoalSalesReportView: React.FC<CoalSalesReportViewProps> = ({
  records,
  partners,
  companySettings,
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
  onAddPartner,
  onTogglePartnerReportColumn,
  onTogglePartnerActive,
  onDeletePartner,
  onNavigateToRecordSell,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isColumnPickerOpen, setIsColumnPickerOpen] = useState(false);
  const [isAddPartnerModalOpen, setIsAddPartnerModalOpen] = useState(false);
  const [newPartnerName, setNewPartnerName] = useState('');
  const [newPartnerCode, setNewPartnerCode] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  // Edit / Add inline entry modal
  const [editingEntry, setEditingEntry] = useState<CoalSellRecord | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<CoalSellRecord | null>(null);

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Helper date parsing (DD-MM-YYYY)
  const parseDDMMYYYY = (dStr: string) => {
    const parts = dStr.split('-');
    if (parts.length === 3) {
      return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    }
    return new Date(dStr);
  };

  // Format date back to DD-MM-YYYY
  const formatToDDMMYYYY = (d: Date) => {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  // Visible partner columns (those with showInReport = true)
  const reportPartners = useMemo(() => {
    return partners.filter((p) => p.showInReport);
  }, [partners]);

  // Aggregate records by Date to build matrix rows
  // Matrix row: { date: string, parsedDate: Date, partnerTons: { [partnerId: string]: number }, totalTons: number, recordIds: string[] }
  const matrixData = useMemo(() => {
    const dateMap: { 
      [date: string]: { 
        date: string; 
        parsedDate: Date; 
        partnerTons: { [partnerId: string]: number }; 
        totalTons: number; 
        records: CoalSellRecord[];
      } 
    } = {};

    records.forEach((rec) => {
      if (!dateMap[rec.date]) {
        dateMap[rec.date] = {
          date: rec.date,
          parsedDate: parseDDMMYYYY(rec.date),
          partnerTons: {},
          totalTons: 0,
          records: [],
        };
      }

      const pId = rec.partnerId;
      dateMap[rec.date].partnerTons[pId] = (dateMap[rec.date].partnerTons[pId] || 0) + (Number(rec.quantityTons) || 0);
      dateMap[rec.date].records.push(rec);
    });

    // Compute total tons per date based on visible report partners
    const rows = Object.values(dateMap).map((row) => {
      let rowTotal = 0;
      reportPartners.forEach((p) => {
        rowTotal += (row.partnerTons[p.id] || 0);
      });
      return {
        ...row,
        totalTons: rowTotal,
      };
    });

    // Apply Filters
    const now = new Date();
    const filtered = rows.filter((row) => {
      const rDate = row.parsedDate;

      // Search term checks date or partner names with sales
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesDate = row.date.toLowerCase().includes(term);
        const matchesPartner = row.records.some((r) => r.partnerName.toLowerCase().includes(term));
        if (!matchesDate && !matchesPartner) return false;
      }

      // Date Range Filter
      if (dateFrom) {
        const fDate = new Date(dateFrom);
        if (rDate < fDate) return false;
      }
      if (dateTo) {
        const tDate = new Date(dateTo);
        tDate.setHours(23, 59, 59, 999);
        if (rDate > tDate) return false;
      }

      // Time Filter (Daily, Weekly, Monthly)
      if (timeFilter === 'daily') {
        const isToday = 
          rDate.getDate() === now.getDate() &&
          rDate.getMonth() === now.getMonth() &&
          rDate.getFullYear() === now.getFullYear();
        if (!isToday) return false;
      } else if (timeFilter === 'weekly') {
        const diffTime = Math.abs(now.getTime() - rDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 7) return false;
      } else if (timeFilter === 'monthly') {
        // filter by selected month
        const [yr, mo] = selectedMonth.split('-').map(Number);
        if (rDate.getFullYear() !== yr || rDate.getMonth() + 1 !== mo) {
          return false;
        }
      }

      return true;
    });

    // Sort rows date-wise
    filtered.sort((a, b) => {
      if (sortDirection === 'asc') {
        return a.parsedDate.getTime() - b.parsedDate.getTime();
      }
      return b.parsedDate.getTime() - a.parsedDate.getTime();
    });

    return filtered;
  }, [records, reportPartners, searchTerm, dateFrom, dateTo, timeFilter, selectedMonth, sortDirection]);

  // Compute Partner-wise Totals (at the end of the table)
  const partnerWiseTotals = useMemo(() => {
    const totals: { [partnerId: string]: number } = {};
    reportPartners.forEach((p) => {
      totals[p.id] = matrixData.reduce((sum, row) => sum + (row.partnerTons[p.id] || 0), 0);
    });
    return totals;
  }, [matrixData, reportPartners]);

  // Grand Total at the end of the table
  const grandTotalTons = useMemo(() => {
    return matrixData.reduce((sum, row) => sum + row.totalTons, 0);
  }, [matrixData]);

  // Handle Add Partner Column
  const handleAddNewPartnerColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartnerName.trim()) {
      alert('Partner Name is required');
      return;
    }
    const code = newPartnerCode.trim() || newPartnerName.substring(0, 4).toUpperCase();
    const newP: PartnerRecord = {
      id: `partner-${Date.now()}`,
      name: newPartnerName.trim(),
      code,
      isActive: true,
      showInReport: true,
    };
    onAddPartner(newP);
    setNewPartnerName('');
    setNewPartnerCode('');
    setIsAddPartnerModalOpen(false);
    showNotice(`Partner column "${newP.name} (${newP.code})" added to Coal Sales Report.`);
  };

  // CSV Export with company settings header
  const handleExportCSV = () => {
    const monthName = new Date(selectedMonth + '-01').toLocaleString('default', { month: 'long', year: 'numeric' });
    
    // Header lines
    const headerLines = [
      `"${companySettings.companyName}"`,
      `"${companySettings.address}"`,
      `"COAL SALES REPORT - ${timeFilter === 'monthly' ? monthName.toUpperCase() : 'CONSOLIDATED'}"`,
      `"Generated: ${new Date().toLocaleDateString()}"`,
      '',
    ];

    // Table Header
    const colHeaders = ['Sr.', 'Date', ...reportPartners.map((p) => `"${p.name} (${p.code}) Tons"`), 'Total (Tons)'];
    
    // Rows
    const dataRows = matrixData.map((row, idx) => {
      return [
        idx + 1,
        `"${row.date}"`,
        ...reportPartners.map((p) => (row.partnerTons[p.id] || 0).toFixed(2)),
        row.totalTons.toFixed(2),
      ].join(',');
    });

    // Partner-wise totals & Grand total
    const totalRow = [
      'TOTAL',
      'Grand Total',
      ...reportPartners.map((p) => (partnerWiseTotals[p.id] || 0).toFixed(2)),
      grandTotalTons.toFixed(2),
    ].join(',');

    const csvBody = [...headerLines, colHeaders.join(','), ...dataRows, totalRow].join('\n');
    const blob = new Blob([csvBody], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Coal_Sales_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotice('Coal Sales Report exported to CSV.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Store & Sales
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs text-slate-500">Sales Matrix</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            Coal Sales Report (Date-Wise Partner Matrix)
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Dynamic partner column matrix showing date-wise dispatched coal tonnage. Add or remove partner columns, filter daily/weekly/monthly, and export with company header.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onNavigateToRecordSell}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Coal Sell</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddPartnerModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Columns className="w-3.5 h-3.5 text-slate-600" />
            <span>Add Partner Column</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Filter Ribbon */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by date (DD-MM-YYYY) or partner name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Time Filter buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-500 mr-1">Period:</span>
            <button
              type="button"
              onClick={() => setTimeFilter('all')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                timeFilter === 'all'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Time
            </button>
            <button
              type="button"
              onClick={() => setTimeFilter('daily')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                timeFilter === 'daily'
                  ? 'bg-emerald-600 text-white font-semibold'
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
                  ? 'bg-emerald-600 text-white font-semibold'
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
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Monthly
            </button>

            {timeFilter === 'monthly' && (
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-2 py-1 text-xs border border-slate-300 rounded-lg bg-white"
              />
            )}
          </div>

          {/* Partner Column Visibility Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsColumnPickerOpen(!isColumnPickerOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Columns className="w-3.5 h-3.5 text-slate-600" />
              <span>Visible Columns ({reportPartners.length}/{partners.length})</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isColumnPickerOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-30 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-800">Add / Remove Columns</span>
                  <button
                    type="button"
                    onClick={() => setIsColumnPickerOpen(false)}
                    className="text-[11px] text-slate-400 hover:text-slate-600"
                  >
                    Done
                  </button>
                </div>
                <div className="max-h-56 overflow-y-auto space-y-1">
                  {partners.map((p) => (
                    <label
                      key={p.id}
                      className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-xs text-slate-700"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <input
                          type="checkbox"
                          checked={p.showInReport}
                          onChange={() => onTogglePartnerReportColumn(p.id)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                        />
                        <span className="truncate font-medium">{p.name}</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400 shrink-0 ml-1">
                        {p.code}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Export */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Download CSV report with company header"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={() => setPrintModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
              title="Printable view with company settings header"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-600" />
              <span>Print View</span>
            </button>
          </div>
        </div>

        {/* Date From-To & Sorting */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Date Filter:
            </span>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">From:</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-2 py-1 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">To:</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-2 py-1 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">Date Sorting:</span>
            <button
              type="button"
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-600" />
              <span>{sortDirection === 'desc' ? 'Newest First' : 'Oldest First'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Coal Sales Matrix Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3 w-10 text-center">Sr.</th>
                <th className="py-3 px-4 min-w-[110px]">Date</th>
                {reportPartners.map((p) => (
                  <th key={p.id} className="py-3 px-3 text-right min-w-[130px]">
                    <div className="flex flex-col items-end">
                      <span className="truncate max-w-[140px] text-slate-800" title={p.name}>
                        {p.code}
                      </span>
                      <span className="text-[9px] text-slate-400 font-normal font-sans truncate max-w-[140px]">
                        {p.name}
                      </span>
                    </div>
                  </th>
                ))}
                <th className="py-3 px-4 text-right font-bold text-slate-900 bg-emerald-50/70 min-w-[120px]">
                  Total (Tons)
                </th>
                <th className="py-3 px-3 text-center min-w-[80px]">Entries</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {matrixData.length === 0 ? (
                <tr>
                  <td colSpan={reportPartners.length + 4} className="py-10 text-center text-slate-400">
                    No coal sales records match selected filters.
                  </td>
                </tr>
              ) : (
                matrixData.map((row, idx) => (
                  <tr key={row.date} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-semibold text-slate-900 whitespace-nowrap">
                      {row.date}
                    </td>
                    {reportPartners.map((p) => {
                      const val = row.partnerTons[p.id] || 0;
                      return (
                        <td key={p.id} className="py-2.5 px-3 text-right font-mono tabular-nums">
                          {val > 0 ? (
                            <span className="font-semibold text-slate-900">
                              {val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-950 bg-emerald-50/40 tabular-nums">
                      {row.totalTons.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                        {row.records.length} {row.records.length === 1 ? 'haul' : 'hauls'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* Partner-Wise Totals & Grand Total at end of table */}
            <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900 text-xs">
              <tr>
                <td colSpan={2} className="py-3.5 px-4 uppercase tracking-wider text-right font-extrabold text-slate-800">
                  Partner-Wise Totals:
                </td>
                {reportPartners.map((p) => (
                  <td key={p.id} className="py-3.5 px-3 text-right font-mono font-extrabold text-slate-900 tabular-nums">
                    {(partnerWiseTotals[p.id] || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                ))}
                <td className="py-3.5 px-4 text-right font-mono font-extrabold text-emerald-950 bg-emerald-100/90 text-sm tabular-nums">
                  {grandTotalTons.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="py-3.5 px-3 text-center text-slate-400 font-mono text-[11px]">—</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Add Partner Column Modal */}
      {isAddPartnerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Columns className="w-4 h-4 text-emerald-600" />
                Add Partner Column to Sales Report
              </h3>
              <button
                type="button"
                onClick={() => setIsAddPartnerModalOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleAddNewPartnerColumn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Partner Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newPartnerName}
                  onChange={(e) => setNewPartnerName(e.target.value)}
                  placeholder="e.g. Quetta Energy Minerals"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Column Short Code
                </label>
                <input
                  type="text"
                  value={newPartnerCode}
                  onChange={(e) => setNewPartnerCode(e.target.value)}
                  placeholder="e.g. QEM"
                  className="w-full text-xs font-mono uppercase px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddPartnerModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  Add Partner Column
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Report View with Company Settings Header */}
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 cursor-pointer shadow-xs"
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
              <p className="text-xs text-slate-600 max-w-lg mx-auto font-medium">
                {companySettings.address}
              </p>
              <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 font-mono">
                {companySettings.ntnNumber && <span>NTN: {companySettings.ntnNumber}</span>}
                {companySettings.contactNumber && <span>Contact: {companySettings.contactNumber}</span>}
              </div>
              <div className="pt-2">
                <span className="text-xs font-extrabold text-slate-900 tracking-wider uppercase bg-slate-100 px-4 py-1.5 rounded inline-block">
                  MONTHLY COAL SALES REPORT — {selectedMonth}
                </span>
              </div>
            </div>

            {/* Matrix Print Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-300 border-collapse">
                <thead className="bg-slate-100 text-slate-800 font-bold uppercase text-[10px]">
                  <tr className="border-b border-slate-300">
                    <th className="p-2 border-r border-slate-300 w-10 text-center">Sr.</th>
                    <th className="p-2 border-r border-slate-300">Date</th>
                    {reportPartners.map((p) => (
                      <th key={p.id} className="p-2 border-r border-slate-300 text-right">
                        {p.code} (Tons)
                      </th>
                    ))}
                    <th className="p-2 text-right">Total (Tons)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {matrixData.map((row, idx) => (
                    <tr key={row.date}>
                      <td className="p-2 border-r border-slate-200 text-center font-mono">{idx + 1}</td>
                      <td className="p-2 border-r border-slate-200 font-mono font-medium">{row.date}</td>
                      {reportPartners.map((p) => (
                        <td key={p.id} className="p-2 border-r border-slate-200 text-right font-mono">
                          {(row.partnerTons[p.id] || 0) > 0 
                            ? (row.partnerTons[p.id] || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            : '—'}
                        </td>
                      ))}
                      <td className="p-2 text-right font-mono font-bold">
                        {row.totalTons.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 border-t-2 border-slate-400 font-bold">
                  <tr>
                    <td colSpan={2} className="p-2 border-r border-slate-300 text-right font-extrabold">
                      GRAND TOTAL:
                    </td>
                    {reportPartners.map((p) => (
                      <td key={p.id} className="p-2 border-r border-slate-300 text-right font-mono font-extrabold">
                        {(partnerWiseTotals[p.id] || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    ))}
                    <td className="p-2 text-right font-mono font-extrabold text-sm">
                      {grandTotalTons.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex justify-between items-end pt-8 text-xs text-slate-500 font-medium border-t border-slate-200">
              <div>
                <p>Prepared By: ___________________</p>
                <p className="mt-1">Dispatch Officer / Weighbridge Incharge</p>
              </div>
              <div className="text-right">
                <p>Authorized Signature: ___________________</p>
                <p className="mt-1">Mining Operations Director</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
