import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Printer, 
  Search, 
  Calendar, 
  Layers, 
  ArrowUpDown,
  CheckCircle2
} from 'lucide-react';
import { StockEntry, StockItem, CompanySettings } from '../../types/storeSales';

interface StoreReportSummaryViewProps {
  stockEntries: StockEntry[];
  stockItems: StockItem[];
  companySettings: CompanySettings;
}

export const StoreReportSummaryView: React.FC<StoreReportSummaryViewProps> = ({
  stockEntries,
  stockItems,
  companySettings,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortField, setSortField] = useState<'date' | 'code' | 'balance'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [notification, setNotification] = useState<string | null>(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const parseDDMMYYYY = (dStr: string) => {
    const parts = dStr.split('-');
    if (parts.length === 3) {
      return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    }
    return new Date(dStr);
  };

  const now = new Date();
  const summaryRows = useMemo(() => {
    return stockEntries.map((e) => {
      const stock = Number(e.stockQty) || 0;
      const purchase = Number(e.purchaseQty) || 0;
      const total = stock + purchase; // Total = stock + purchase
      const mine = Number(e.mineQty) || 0;
      const vehicle = Number(e.vehiclesQty) || 0;
      const balance = total - mine - vehicle; // Balance = total - mine - vehicle

      return {
        id: e.id,
        date: e.date,
        parsedDate: parseDDMMYYYY(e.date),
        code: e.itemCode,
        description: e.itemName,
        itemId: e.itemId,
        stock,
        purchase,
        total,
        mine,
        vehicle,
        companyName: e.companyName,
        balance,
      };
    }).filter((r) => {
      // Filter by item
      if (selectedItemId !== 'all' && r.itemId !== selectedItemId) return false;

      // Search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matches = 
          r.code.toLowerCase().includes(term) ||
          r.description.toLowerCase().includes(term) ||
          r.companyName.toLowerCase().includes(term) ||
          r.date.includes(term);
        if (!matches) return false;
      }

      // Date range
      if (dateFrom) {
        const fDate = new Date(dateFrom);
        if (r.parsedDate < fDate) return false;
      }
      if (dateTo) {
        const tDate = new Date(dateTo);
        tDate.setHours(23, 59, 59, 999);
        if (r.parsedDate > tDate) return false;
      }

      // Time filter
      if (timeFilter === 'daily') {
        const isToday = 
          r.parsedDate.getDate() === now.getDate() &&
          r.parsedDate.getMonth() === now.getMonth() &&
          r.parsedDate.getFullYear() === now.getFullYear();
        if (!isToday) return false;
      } else if (timeFilter === 'weekly') {
        const diffTime = Math.abs(now.getTime() - r.parsedDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 7) return false;
      } else if (timeFilter === 'monthly') {
        const [yr, mo] = selectedMonth.split('-').map(Number);
        if (r.parsedDate.getFullYear() !== yr || r.parsedDate.getMonth() + 1 !== mo) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortField === 'date') {
        return sortDirection === 'asc' 
          ? a.parsedDate.getTime() - b.parsedDate.getTime()
          : b.parsedDate.getTime() - a.parsedDate.getTime();
      }
      if (sortField === 'code') {
        return sortDirection === 'asc' ? a.code.localeCompare(b.code) : b.code.localeCompare(a.code);
      }
      return sortDirection === 'asc' ? a.balance - b.balance : b.balance - a.balance;
    });
  }, [stockEntries, selectedItemId, searchTerm, dateFrom, dateTo, timeFilter, selectedMonth, sortField, sortDirection]);

  // Totals of all numeric columns
  const totalStock = summaryRows.reduce((sum, r) => sum + r.stock, 0);
  const totalPurchase = summaryRows.reduce((sum, r) => sum + r.purchase, 0);
  const totalTotal = summaryRows.reduce((sum, r) => sum + r.total, 0);
  const totalMine = summaryRows.reduce((sum, r) => sum + r.mine, 0);
  const totalVehicle = summaryRows.reduce((sum, r) => sum + r.vehicle, 0);
  const totalBalance = summaryRows.reduce((sum, r) => sum + r.balance, 0);

  // CSV Export with company header
  const handleExportCSV = () => {
    const monthName = new Date(selectedMonth + '-01').toLocaleString('default', { month: 'long', year: 'numeric' });
    const headerLines = [
      `"${companySettings.companyName}"`,
      `"${companySettings.address}"`,
      `"STORE REPORT SUMMARY - ${timeFilter === 'monthly' ? monthName.toUpperCase() : 'CONSOLIDATED'}"`,
      `"Generated: ${new Date().toLocaleDateString()}"`,
      '',
    ];

    const colHeaders = [
      'Sr.',
      'Date',
      'Code',
      'Description',
      'Stock',
      'Purchase',
      'Total (Stock+Purchase)',
      'Mine',
      'Vehicle',
      'Company Name',
      'Balance'
    ];

    const dataRows = summaryRows.map((r, idx) => [
      idx + 1,
      `"${r.date}"`,
      `"${r.code}"`,
      `"${r.description.replace(/"/g, '""')}"`,
      r.stock.toFixed(2),
      r.purchase.toFixed(2),
      r.total.toFixed(2),
      r.mine.toFixed(2),
      r.vehicle.toFixed(2),
      `"${r.companyName.replace(/"/g, '""')}"`,
      r.balance.toFixed(2),
    ].join(','));

    const summaryRow = [
      'TOTAL',
      '',
      '',
      'Summary Totals',
      totalStock.toFixed(2),
      totalPurchase.toFixed(2),
      totalTotal.toFixed(2),
      totalMine.toFixed(2),
      totalVehicle.toFixed(2),
      '',
      totalBalance.toFixed(2),
    ].join(',');

    const csvContent = [...headerLines, colHeaders.join(','), ...dataRows, summaryRow].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Store_Report_Summary_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotice('Store Report Summary exported to CSV.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-600">
              Store & Sales
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs text-slate-500">Inventory Ledger</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-purple-600" />
            Store Report Summary
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Consolidated inventory flow: Code, Description, Stock + Purchase = Total, Mine, Vehicle, and final Store Balance.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
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
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors cursor-pointer"
            title="Printable view with company settings header"
          >
            <Printer className="w-3.5 h-3.5 text-purple-600" />
            <span>Print View</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Filter and Search Ribbon */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by code, description, company name, date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Filter by Item */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 whitespace-nowrap">Filter Item:</span>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            >
              <option value="all">All Items ({stockItems.length})</option>
              {stockItems.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.itemName} ({i.itemCode})
                </option>
              ))}
            </select>
          </div>

          {/* Time Filter buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-500 mr-1">Period:</span>
            <button
              type="button"
              onClick={() => setTimeFilter('all')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                timeFilter === 'all'
                  ? 'bg-purple-600 text-white font-semibold'
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
                  ? 'bg-purple-600 text-white font-semibold'
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
                  ? 'bg-purple-600 text-white font-semibold'
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
                  ? 'bg-purple-600 text-white font-semibold'
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
                className="px-2 py-1 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">To:</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-2 py-1 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
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
            <span className="text-slate-500">Sort by:</span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as any)}
              className="text-xs px-2.5 py-1 border border-slate-300 rounded-lg bg-white"
            >
              <option value="date">Date</option>
              <option value="code">Item Code</option>
              <option value="balance">Store Balance</option>
            </select>
            <button
              type="button"
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              title="Toggle Ascending / Descending"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Store Report Summary Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3 w-10 text-center">Sr.</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Code (Item Code)</th>
                <th className="py-3 px-3 min-w-[170px]">Description (Item Name)</th>
                <th className="py-3 px-3 text-right">Stock</th>
                <th className="py-3 px-3 text-right">Purchase</th>
                <th className="py-3 px-3 text-right font-bold text-slate-900 bg-slate-100/80">
                  Total (Stock+Purchase)
                </th>
                <th className="py-3 px-3 text-right">Mine</th>
                <th className="py-3 px-3 text-right">Vehicle</th>
                <th className="py-3 px-3 min-w-[130px]">Company Name</th>
                <th className="py-3 px-3 text-right font-bold text-purple-950 bg-purple-50/70">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {summaryRows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    No store summary entries found for the selected criteria.
                  </td>
                </tr>
              ) : (
                summaryRows.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-700 whitespace-nowrap">
                      {r.date}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800 text-[11px]">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100">
                        {r.code}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {r.description}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                      {r.stock.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-700 font-medium">
                      {r.purchase.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 bg-slate-50/80">
                      {r.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-rose-700 font-medium">
                      {r.mine.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-amber-700 font-medium">
                      {r.vehicle.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-medium">
                      {r.companyName}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-extrabold text-purple-950 bg-purple-50/40">
                      {r.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* Totals at the end of the table */}
            <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900 text-xs">
              <tr>
                <td colSpan={4} className="py-3.5 px-3 uppercase tracking-wider text-right font-extrabold text-slate-800">
                  Store Summary Totals:
                </td>
                <td className="py-3.5 px-3 text-right font-mono font-extrabold text-slate-800">
                  {totalStock.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="py-3.5 px-3 text-right font-mono font-extrabold text-emerald-800">
                  {totalPurchase.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="py-3.5 px-3 text-right font-mono font-extrabold text-slate-900 bg-slate-200/80">
                  {totalTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="py-3.5 px-3 text-right font-mono font-extrabold text-rose-800">
                  {totalMine.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="py-3.5 px-3 text-right font-mono font-extrabold text-amber-800">
                  {totalVehicle.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="py-3.5 px-3 text-center text-slate-400 font-mono text-[11px]">—</td>
                <td className="py-3.5 px-3 text-right font-mono font-extrabold text-purple-950 bg-purple-100/90 text-sm">
                  {totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Printable Modal View with Company Settings Header */}
      {printModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full p-6 border border-slate-200 space-y-6 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Print Preview
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 cursor-pointer shadow-xs"
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
                {companySettings.contactNumber && <span>Phone: {companySettings.contactNumber}</span>}
              </div>
              <div className="pt-2">
                <span className="text-xs font-bold text-slate-900 tracking-wider uppercase bg-slate-100 px-4 py-1.5 rounded inline-block">
                  STORE REPORT SUMMARY — {timeFilter === 'monthly' ? selectedMonth : 'ALL PERIODS'}
                </span>
              </div>
            </div>

            {/* Print Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-300 border-collapse">
                <thead className="bg-slate-100 text-slate-800 font-bold uppercase text-[10px]">
                  <tr className="border-b border-slate-300">
                    <th className="p-2 border-r border-slate-300 w-10 text-center">Sr.</th>
                    <th className="p-2 border-r border-slate-300">Code</th>
                    <th className="p-2 border-r border-slate-300">Description</th>
                    <th className="p-2 border-r border-slate-300 text-right">Stock</th>
                    <th className="p-2 border-r border-slate-300 text-right">Purchase</th>
                    <th className="p-2 border-r border-slate-300 text-right font-extrabold">Total</th>
                    <th className="p-2 border-r border-slate-300 text-right">Mine</th>
                    <th className="p-2 border-r border-slate-300 text-right">Vehicle</th>
                    <th className="p-2 border-r border-slate-300">Company</th>
                    <th className="p-2 text-right font-extrabold">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {summaryRows.map((r, idx) => (
                    <tr key={r.id}>
                      <td className="p-2 border-r border-slate-200 text-center font-mono">{idx + 1}</td>
                      <td className="p-2 border-r border-slate-200 font-mono font-medium">{r.code}</td>
                      <td className="p-2 border-r border-slate-200 font-semibold">{r.description}</td>
                      <td className="p-2 border-r border-slate-200 text-right font-mono">{r.stock.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="p-2 border-r border-slate-200 text-right font-mono">{r.purchase.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="p-2 border-r border-slate-200 text-right font-mono font-bold">{r.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="p-2 border-r border-slate-200 text-right font-mono">{r.mine.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="p-2 border-r border-slate-200 text-right font-mono">{r.vehicle.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="p-2 border-r border-slate-200">{r.companyName}</td>
                      <td className="p-2 text-right font-mono font-bold">{r.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 border-t-2 border-slate-400 font-bold">
                  <tr>
                    <td colSpan={3} className="p-2 border-r border-slate-300 text-right font-extrabold">TOTALS:</td>
                    <td className="p-2 border-r border-slate-300 text-right font-mono font-extrabold">{totalStock.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="p-2 border-r border-slate-300 text-right font-mono font-extrabold">{totalPurchase.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="p-2 border-r border-slate-300 text-right font-mono font-extrabold">{totalTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="p-2 border-r border-slate-300 text-right font-mono font-extrabold">{totalMine.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="p-2 border-r border-slate-300 text-right font-mono font-extrabold">{totalVehicle.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="p-2 border-r border-slate-300 text-center">—</td>
                    <td className="p-2 text-right font-mono font-extrabold">{totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex justify-between items-end pt-8 text-xs text-slate-500 font-medium border-t border-slate-200">
              <div>
                <p>Prepared By: ___________________</p>
                <p className="mt-1">Store Keeper / Material Supervisor</p>
              </div>
              <div className="text-right">
                <p>Approved By: ___________________</p>
                <p className="mt-1">General Manager Stores & Logistics</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
