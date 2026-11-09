import React, { useState, useMemo } from 'react';
import type { 
  StoreItem, 
  ItemStockEntry, 
  ItemConsumptionRecord, 
  MineRecord, 
  VehicleRecord, 
  ItemCategory 
} from '../../types/storeSales.ts';

interface StoreReportsViewProps {
  items: StoreItem[];
  stockEntries: ItemStockEntry[];
  consumptions: ItemConsumptionRecord[];
  mines: MineRecord[];
  vehicles: VehicleRecord[];
  categories: ItemCategory[];
}

export const StoreReportsView: React.FC<StoreReportsViewProps> = ({
  items,
  stockEntries,
  consumptions,
  mines,
  vehicles,
  categories,
}) => {
  const [reportType, setReportType] = useState<'inventory_summary' | 'consumption_summary' | 'reorder_alerts'>('inventory_summary');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Per-item consolidated balance calculations
  // Balance formula: (stockQuantity + purchase) - (vehicle consumption + mine consumption)
  const itemReportData = useMemo(() => {
    return items.map(item => {
      const itemStockList = stockEntries.filter(s => s.itemId === item.id);
      const totalStockQty = itemStockList.reduce((sum, s) => sum + Number(s.stockQuantity || 0), 0);
      const totalPurchases = itemStockList.reduce((sum, s) => sum + Number(s.purchase || 0), 0);

      const itemConsumptions = consumptions.filter(c => c.itemId === item.id);
      const vehicleUsage = itemConsumptions
        .filter(c => c.consumptionType === 'vehicle')
        .reduce((sum, c) => sum + Number(c.quantity || 0), 0);
      const mineUsage = itemConsumptions
        .filter(c => c.consumptionType === 'mine')
        .reduce((sum, c) => sum + Number(c.quantity || 0), 0);

      const totalUsage = vehicleUsage + mineUsage;
      const balance = (totalStockQty + totalPurchases) - totalUsage;
      const isLowStock = item.reorderLevel ? balance <= item.reorderLevel : balance <= 10;

      return {
        item,
        totalStockQty,
        totalPurchases,
        totalInflow: totalStockQty + totalPurchases,
        vehicleUsage,
        mineUsage,
        totalUsage,
        balance,
        isLowStock,
      };
    });
  }, [items, stockEntries, consumptions]);

  // Overall KPI stats
  const totalItemsCount = items.length;
  const totalStockInflows = itemReportData.reduce((sum, r) => sum + r.totalInflow, 0);
  const totalConsumptionsAll = itemReportData.reduce((sum, r) => sum + r.totalUsage, 0);
  const lowStockCount = itemReportData.filter(r => r.isLowStock).length;

  // Filtered rows
  const filteredRows = useMemo(() => {
    return itemReportData.filter(row => {
      const matchSearch =
        row.item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (row.item.categoryName || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchCat = selectedCategory === 'all' ? true : row.item.categoryId === selectedCategory;
      const matchReport = reportType === 'reorder_alerts' ? row.isLowStock : true;

      return matchSearch && matchCat && matchReport;
    });
  }, [itemReportData, searchTerm, selectedCategory, reportType]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Item Code', 'Item Name', 'Category', 'Unit', 
      'Base Stock', 'Purchases (Inflow)', 'Total Inflow', 
      'Vehicle Usage', 'Mine Usage', 'Total Consumed', 
      'Current Balance', 'Reorder Level', 'Status'
    ];

    const rows = filteredRows.map(r => [
      `"${r.item.itemCode}"`,
      `"${r.item.itemName.replace(/"/g, '""')}"`,
      `"${r.item.categoryName}"`,
      r.item.unitSymbol,
      r.totalStockQty,
      r.totalPurchases,
      r.totalInflow,
      r.vehicleUsage,
      r.mineUsage,
      r.totalUsage,
      r.balance,
      r.item.reorderLevel || 0,
      r.isLowStock ? 'LOW STOCK' : 'OK',
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `store_report_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Report
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Store Management Audit & Consumption Report</title>
          <style>
            body { font-family: system-ui, sans-serif; margin: 24px; color: #0f172a; }
            h1 { font-size: 20px; margin-bottom: 4px; }
            h2 { font-size: 13px; font-weight: normal; color: #64748b; margin-top: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 11px; }
            th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
            th { background: #0f172a; color: white; }
            .num { text-align: right; }
            .alert { color: #dc2626; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>STORE INVENTORY & CONSUMPTION MASTER REPORT</h1>
          <h2>Generated: ${new Date().toLocaleDateString()} | Active Items: ${items.length}</h2>
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Item Name</th>
                <th>Category</th>
                <th>Unit</th>
                <th class="num">Base Stock</th>
                <th class="num">Purchases</th>
                <th class="num">Total Inflow</th>
                <th class="num">Vehicle Usage</th>
                <th class="num">Mine Usage</th>
                <th class="num">Total Used</th>
                <th class="num">Current Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredRows.map(r => `
                <tr>
                  <td>${r.item.itemCode}</td>
                  <td><strong>${r.item.itemName}</strong></td>
                  <td>${r.item.categoryName}</td>
                  <td>${r.item.unitSymbol}</td>
                  <td class="num">${r.totalStockQty}</td>
                  <td class="num">${r.totalPurchases}</td>
                  <td class="num" style="background: #f1f5f9;">${r.totalInflow}</td>
                  <td class="num">${r.vehicleUsage}</td>
                  <td class="num">${r.mineUsage}</td>
                  <td class="num" style="background: #fef2f2;">${r.totalUsage}</td>
                  <td class="num" style="font-weight: bold; background: #ecfdf5;">${r.balance}</td>
                  <td class="${r.isLowStock ? 'alert' : ''}">${r.isLowStock ? '⚠️ Low Stock' : 'Optimal'}</td>
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
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            Catalog Items
          </div>
          <div className="text-2xl font-bold text-slate-800">{totalItemsCount}</div>
          <div className="mt-2 text-xs text-slate-500">
            Across {categories.length} store categories
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            Total Inflow Recorded
          </div>
          <div className="text-2xl font-bold text-emerald-700">{totalStockInflows.toLocaleString()}</div>
          <div className="mt-2 text-xs text-slate-500">
            Base stock + received purchases
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            Total Consumptions
          </div>
          <div className="text-2xl font-bold text-blue-700">{totalConsumptionsAll.toLocaleString()}</div>
          <div className="mt-2 text-xs text-slate-500">
            Dispatched to vehicles & mines
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            Low Stock Alerts
          </div>
          <div className={`text-2xl font-bold ${lowStockCount > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
            {lowStockCount}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Items near or below reorder level
          </div>
        </div>
      </div>

      {/* Filter and Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex space-x-2">
          <button
            onClick={() => setReportType('inventory_summary')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              reportType === 'inventory_summary'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            📊 Inventory & Balance Summary
          </button>
          <button
            onClick={() => setReportType('reorder_alerts')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              reportType === 'reorder_alerts'
                ? 'bg-red-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            ⚠️ Low Stock Alerts ({lowStockCount})
          </button>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center space-x-1.5 shadow-sm"
          >
            <span>📥 Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center space-x-1.5 shadow-sm"
          >
            <span>🖨️ Print Report</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search code, item, category..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg w-56 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
              />
              <span className="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
            </div>

            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="text-xs font-semibold text-slate-600">
            Showing {filteredRows.length} items
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3 text-left">Item Name</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-center">Unit</th>
                <th className="px-4 py-3 text-right">Base Stock</th>
                <th className="px-4 py-3 text-right">Purchases</th>
                <th className="px-4 py-3 text-right bg-slate-200/50">Total Inflow</th>
                <th className="px-4 py-3 text-right text-blue-800">Vehicle Usage</th>
                <th className="px-4 py-3 text-right text-amber-800">Mine Usage</th>
                <th className="px-4 py-3 text-right bg-red-50 text-red-900">Total Used</th>
                <th className="px-4 py-3 text-right bg-emerald-50 text-emerald-950">Live Balance</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-slate-400">
                    No items found matching the selected report criteria.
                  </td>
                </tr>
              ) : (
                filteredRows.map(row => (
                  <tr key={row.item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-slate-700">{row.item.itemCode}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{row.item.itemName}</td>
                    <td className="px-4 py-3 text-slate-600">{row.item.categoryName}</td>
                    <td className="px-4 py-3 text-center font-mono text-slate-500">{row.item.unitSymbol}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">{row.totalStockQty.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">{row.totalPurchases.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-slate-800 bg-slate-50">
                      {row.totalInflow.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-blue-700">{row.vehicleUsage.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-mono text-amber-700">{row.mineUsage.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-red-700 bg-red-50/50">
                      {row.totalUsage.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-900 bg-emerald-50/50">
                      {row.balance.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        row.isLowStock 
                          ? 'bg-red-100 text-red-800 border border-red-200' 
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {row.isLowStock ? 'Low Stock' : 'Optimal'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredRows.length > 0 && (
              <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-800">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-right">Grand Totals:</td>
                  <td className="px-4 py-3 text-right font-mono">
                    {filteredRows.reduce((sum, r) => sum + r.totalStockQty, 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {filteredRows.reduce((sum, r) => sum + r.totalPurchases, 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono bg-slate-100">
                    {filteredRows.reduce((sum, r) => sum + r.totalInflow, 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-blue-800">
                    {filteredRows.reduce((sum, r) => sum + r.vehicleUsage, 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-amber-800">
                    {filteredRows.reduce((sum, r) => sum + r.mineUsage, 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-red-800 bg-red-100/50">
                    {filteredRows.reduce((sum, r) => sum + r.totalUsage, 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-950 bg-emerald-100/50">
                    {filteredRows.reduce((sum, r) => sum + r.balance, 0).toLocaleString()}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default StoreReportsView;
