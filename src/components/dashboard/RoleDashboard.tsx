import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Scale, 
  Vault, 
  Boxes, 
  ShieldCheck, 
  Users, 
  FileText, 
  ShoppingBag, 
  ArrowRight, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  Plus, 
  Landmark, 
  Truck, 
  Database,
  DollarSign,
  Fuel,
  Droplet,
  Search,
  AlertTriangle,
  PackageCheck,
  Layers,
  Wrench,
  BarChart2,
  CreditCard,
  Pickaxe
} from 'lucide-react';
import { User } from '../../types/user';
import { NavModule, DemandDocument, PurchaseDocument } from '../../types';
import { ChartAccount, VoucherDocument } from '../../types/accounting';
import { CashBookEntry, CreditBookEntry, BankRecord, BankAccountRecord } from '../../types/treasury';
import { 
  PosCoalSellEntry, 
  StockItem, 
  StockEntry, 
  VehicleRecord, 
  VehicleConsumptionRecord,
  CoalSellRecord,
  CoalProductionRecord,
  PartnerRecord,
  CompanySettings
} from '../../types/storeSales';
import { formatWholeNumber, formatCoalStockFormula } from '../../utils/formatters';

interface RoleDashboardProps {
  currentUser: User;
  demands: DemandDocument[];
  purchases: PurchaseDocument[];
  accounts: ChartAccount[];
  vouchers: VoucherDocument[];
  cashBookEntries: CashBookEntry[];
  creditBookEntries: CreditBookEntry[];
  banks: BankRecord[];
  bankAccounts: BankAccountRecord[];
  posEntries: PosCoalSellEntry[];
  coalSellRecords?: CoalSellRecord[];
  coalProductionRecords?: CoalProductionRecord[];
  partners?: PartnerRecord[];
  stockItems: StockItem[];
  stockEntries: StockEntry[];
  vehicles: VehicleRecord[];
  consumptions: any[];
  mines?: any[];
  companySettings?: CompanySettings;
  users: User[];
  onNavigate: (module: NavModule) => void;
}

export const RoleDashboard: React.FC<RoleDashboardProps> = ({
  currentUser,
  demands,
  purchases,
  accounts,
  vouchers,
  cashBookEntries,
  creditBookEntries,
  banks,
  bankAccounts,
  posEntries,
  coalSellRecords = [],
  coalProductionRecords = [],
  partners = [],
  stockItems,
  stockEntries,
  vehicles,
  consumptions,
  mines = [],
  companySettings,
  users,
  onNavigate,
}) => {
  // Calculations
  const pendingDemands = demands.filter(d => d.status === 'Submitted for Approval');
  const pendingPurchases = purchases.filter(p => p.status === 'Submitted for Approval');
  const totalPendingApprovals = pendingDemands.length + pendingPurchases.length;

  const totalDemandAmount = demands.reduce((acc, d) => acc + d.totalAmount, 0);
  const totalPurchaseAmount = purchases.reduce((acc, p) => acc + p.totalAmount, 0);

  // Treasury
  const cashInflow = cashBookEntries.reduce((sum, e) => sum + (Number(e.credit) || 0), 0);
  const cashOutflow = cashBookEntries.reduce((sum, e) => sum + (Number(e.debit) || 0), 0);
  const netCashInHand = cashInflow - cashOutflow;
  const totalCreditReceivables = creditBookEntries.reduce((sum, e) => sum + (e.amount || 0), 0);
  const getAccountBalance = (b: BankAccountRecord) => {
    const netTransactions = (b.transactions || []).reduce(
      (acc, t) => acc + (t.depositDebit || 0) - (t.withdrawalPayment || 0),
      0
    );
    return (b.openingBalance || 0) + netTransactions;
  };
  const totalBankBalances = bankAccounts.reduce((sum, b) => sum + getAccountBalance(b), 0);

  // Accounts
  const totalTurnover = vouchers.reduce((sum, v) => sum + v.totalDebit, 0);

  // Store & Coal Operations (100% Isolated from Store Items)
  const totalPosRevenue = posEntries.reduce((sum, p) => sum + (p.totalValue || 0), 0);
  const totalFuelLitres = consumptions.reduce((sum, c) => sum + (c.diesel || 0), 0);

  // Authoritative Coal Production, Live Stock, and Sold Statistics (Opening balance defaults to 100 Tons: 500 + 100 + 500 Tons)
  const openingCoalStock = (typeof companySettings?.openingCoalStock === 'number' && companySettings.openingCoalStock > 0)
    ? companySettings.openingCoalStock
    : 100;
  const totalCoalProduced = coalProductionRecords.reduce((sum, r) => sum + (Number(r.quantityTons) || 0), 0);
  const totalCoalSoldFromSales = coalSellRecords.reduce((sum, r) => sum + (Number(r.quantityTons) || 0), 0);
  const totalCoalSoldFromPos = posEntries.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);
  // Authoritative total sold: prefer explicit coal sell records if present, or POS
  const totalCoalSold = totalCoalSoldFromSales > 0 ? totalCoalSoldFromSales : totalCoalSoldFromPos;
  // Total Coal Stock Gross = Total Coal Stock (Produced) + Coal Opening Balance
  const totalCoalStockGross = totalCoalProduced + openingCoalStock;
  // Authoritative live available coal stock = Opening + Produced - Sold
  const currentCoalStock = Math.max(0, totalCoalStockGross - totalCoalSold);
  const totalCoalTonsSold = totalCoalSold;
  const coalStockFormula = useMemo(() => {
    const quantities = coalProductionRecords.map((r) => Number(r.quantityTons) || 0);
    return formatCoalStockFormula(quantities, openingCoalStock, 0);
  }, [coalProductionRecords, openingCoalStock]);

  // Admin Dashboard Executive Section State & Aggregations
  const [adminSectionTab, setAdminSectionTab] = useState<'both' | 'vehicle' | 'stock'>('both');
  const [vehicleFilterText, setVehicleFilterText] = useState('');
  const [stockFilterText, setStockFilterText] = useState('');
  const [stockCategoryFilter, setStockCategoryFilter] = useState('all');

  // Memoized Vehicle-Wise Consumption Summary based on newly built item consumption records
  const vehicleSummaries = useMemo(() => {
    const map = new Map<string, {
      vehicleId: string;
      vehicleNo: string;
      vehicleType: string;
      driverName: string;
      status: string;
      totalQuantity: number;
      primaryUnit: string;
      logsCount: number;
      lastDate?: string;
    }>();

    vehicles.forEach((v) => {
      map.set(v.id, {
        vehicleId: v.id,
        vehicleNo: v.vehicleNo,
        vehicleType: v.vehicleType || 'Fleet Vehicle',
        driverName: v.driverName || 'Designated Driver',
        status: v.status || 'Active',
        totalQuantity: 0,
        primaryUnit: 'L',
        logsCount: 0,
        lastDate: '',
      });
    });

    consumptions.forEach((c) => {
      // Support both newly built consumption schema (consumptionType === 'vehicle') and direct records
      const isVeh = c.consumptionType ? c.consumptionType === 'vehicle' : true;
      if (!isVeh) return;

      const vId = c.targetId || c.vehicleId;
      const vName = (c.targetName || c.vehicleNo || '').trim();
      let target = vId ? map.get(vId) : null;
      if (!target && vName) {
        for (const [_, item] of map.entries()) {
          if (item.vehicleNo.toLowerCase() === vName.toLowerCase()) {
            target = item;
            break;
          }
        }
      }

      if (!target) {
        target = {
          vehicleId: vId || `veh-${vName || 'unknown'}`,
          vehicleNo: vName || 'General Machine',
          vehicleType: 'Fleet Vehicle',
          driverName: c.operatorName || 'Designated Driver',
          status: 'Active',
          totalQuantity: 0,
          primaryUnit: c.unit || 'L',
          logsCount: 0,
          lastDate: '',
        };
        map.set(target.vehicleId, target);
      }

      const qty = Number(c.quantity ?? (Number(c.diesel || 0) + Number(c.mOil || 0) + Number(c.dOil || 0))) || 0;
      target.totalQuantity += qty;
      target.logsCount += 1;
      if (c.unit) target.primaryUnit = c.unit;
      if (!target.lastDate || (c.date && c.date > target.lastDate)) {
        target.lastDate = c.date;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalQuantity - a.totalQuantity);
  }, [vehicles, consumptions]);

  // Memoized Item-Wise Stock Summary strictly synced from new Stock Report data
  const stockSummaries = useMemo(() => {
    // 1. Group consumption by itemId
    const consumptionMap = new Map<string, { vehicleUsage: number; mineUsage: number; totalUsage: number }>();
    consumptions.forEach(c => {
      const itmId = c.itemId;
      if (!itmId) return;
      const cur = consumptionMap.get(itmId) || { vehicleUsage: 0, mineUsage: 0, totalUsage: 0 };
      const q = Number(c.quantity) || 0;
      if (c.consumptionType === 'mine') {
        cur.mineUsage += q;
      } else {
        cur.vehicleUsage += q;
      }
      cur.totalUsage += q;
      consumptionMap.set(itmId, cur);
    });

    // 2. Map items with Opening Stock + Stock Inflow purchases - Usages = Net Balance
    const map = new Map<string, {
      itemId: string;
      itemCode: string;
      itemName: string;
      category: string;
      unit: string;
      openingStock: number;
      totalInflowPurchase: number;
      vehicleUsage: number;
      mineUsage: number;
      totalUsage: number;
      currentBalance: number;
      entriesCount: number;
      lastDate?: string;
      stockStatus: 'In Stock' | 'Low Stock' | 'Critical';
    }>();

    stockItems.forEach((it) => {
      map.set(it.id, {
        itemId: it.id,
        itemCode: it.itemCode,
        itemName: it.itemName,
        category: it.category || it.categoryName || 'General Supplies',
        unit: it.unit || it.unitSymbol || 'Units',
        openingStock: Number(it.openingStock) || 0,
        totalInflowPurchase: 0,
        vehicleUsage: 0,
        mineUsage: 0,
        totalUsage: 0,
        currentBalance: 0,
        entriesCount: 0,
        lastDate: '',
        stockStatus: 'In Stock',
      });
    });

    stockEntries.forEach((entry) => {
      let target = map.get(entry.itemId);
      if (!target) {
        for (const [_, item] of map.entries()) {
          if (item.itemCode.trim().toUpperCase() === entry.itemCode.trim().toUpperCase()) {
            target = item;
            break;
          }
        }
      }

      if (!target) {
        target = {
          itemId: entry.itemId || `it-${entry.itemCode}`,
          itemCode: entry.itemCode,
          itemName: entry.itemName || entry.itemCode,
          category: 'General Supplies',
          unit: entry.unit || 'Units',
          openingStock: 0,
          totalInflowPurchase: 0,
          vehicleUsage: 0,
          mineUsage: 0,
          totalUsage: 0,
          currentBalance: 0,
          entriesCount: 0,
          lastDate: '',
          stockStatus: 'In Stock',
        };
        map.set(target.itemId, target);
      }

      const inflow = (entry.stockQuantity ?? entry.stockQty ?? 0) + (entry.purchase ?? entry.purchaseQty ?? 0);
      target.totalInflowPurchase += inflow;
      target.entriesCount += 1;
      if (!target.lastDate || entry.date > target.lastDate) {
        target.lastDate = entry.date;
      }
    });

    // 3. Compute running balance and stock status: (Opening Stock + Total Inflow) - Total Usage = Balance
    const result = Array.from(map.values()).map((s) => {
      const c = consumptionMap.get(s.itemId) || { vehicleUsage: 0, mineUsage: 0, totalUsage: 0 };
      const totalAvailable = s.openingStock + s.totalInflowPurchase;
      const net = totalAvailable - c.totalUsage;

      let status: 'In Stock' | 'Low Stock' | 'Critical' = 'In Stock';
      if (net <= 5) {
        status = 'Critical';
      } else if (net <= 25) {
        status = 'Low Stock';
      }

      return {
        ...s,
        vehicleUsage: c.vehicleUsage,
        mineUsage: c.mineUsage,
        totalUsage: c.totalUsage,
        currentBalance: Math.round(net),
        stockStatus: status,
      };
    });

    const priority = { Critical: 0, 'Low Stock': 1, 'In Stock': 2 };
    return result.sort((a, b) => priority[a.stockStatus] - priority[b.stockStatus] || a.currentBalance - b.currentBalance);
  }, [stockItems, stockEntries, consumptions]);

  // Derived filter categories for stock
  const stockCategories = useMemo(() => {
    return Array.from(new Set(stockItems.map(s => s.category || s.categoryName).filter(Boolean))) as string[];
  }, [stockItems]);

  // Filtered lists
  const filteredVehicles = useMemo(() => {
    const q = vehicleFilterText.trim().toLowerCase();
    if (!q) return vehicleSummaries;
    return vehicleSummaries.filter(v =>
      v.vehicleNo.toLowerCase().includes(q) ||
      v.driverName.toLowerCase().includes(q) ||
      v.vehicleType.toLowerCase().includes(q)
    );
  }, [vehicleSummaries, vehicleFilterText]);

  const filteredStock = useMemo(() => {
    const q = stockFilterText.trim().toLowerCase();
    return stockSummaries.filter(s => {
      const matchText = !q || s.itemName.toLowerCase().includes(q) || s.itemCode.toLowerCase().includes(q);
      const matchCat = stockCategoryFilter === 'all' || s.category === stockCategoryFilter;
      return matchText && matchCat;
    });
  }, [stockSummaries, stockFilterText, stockCategoryFilter]);

  // Summary Aggregates
  const totalFleetConsumed = useMemo(() => vehicleSummaries.reduce((sum, v) => sum + v.totalQuantity, 0), [vehicleSummaries]);
  const totalActiveVehiclesCount = useMemo(() => vehicles.length, [vehicles]);

  // Stock Totals
  const criticalStockCount = useMemo(() => stockSummaries.filter(s => s.stockStatus === 'Critical').length, [stockSummaries]);
  const lowStockCount = useMemo(() => stockSummaries.filter(s => s.stockStatus === 'Low Stock').length, [stockSummaries]);
  const inStockCount = useMemo(() => stockSummaries.filter(s => s.stockStatus === 'In Stock').length, [stockSummaries]);

  // 1. ADMIN DASHBOARD
  if (currentUser.role === 'admin') {
    return (
      <div className="space-y-6">
        {/* Admin Welcome Hero */}
        <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-purple-900/40 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-purple-900/60 border border-purple-700/60 text-purple-200 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>Admin Executive Console</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome, {currentUser.name}
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Cross-department enterprise overview. You have executive oversight over Demands, Purchases, Treasury, Accounts, Store & Sales, and System Users.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('admin_approvals')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 transition-colors shadow-lg shadow-purple-600/20 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Approval Queue ({totalPendingApprovals})</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('users')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
            >
              <Users className="w-4 h-4 text-purple-400" />
              <span>Manage Users ({users.length})</span>
            </button>
          </div>
        </div>

        {/* 5 Pillars Summary (Including Total Bank Balance) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Pending Approvals</span>
              <ShieldCheck className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-purple-700">
              {totalPendingApprovals}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {pendingDemands.length} Demands · {pendingPurchases.length} Purchases
            </div>
          </div>

          {/* Pillar 2: Total Bank Balance */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">Total Bank Balance</span>
                <Landmark className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-blue-700">
                PKR {formatWholeNumber(totalBankBalances)}
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 truncate">
                {bankAccounts.length} Accounts ({banks.length} Banks)
              </span>
              <button
                type="button"
                onClick={() => onNavigate('treasury')}
                className="font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer shrink-0 ml-1"
              >
                View →
              </button>
            </div>
          </div>

          {/* Pillar 3: Cashier Cash in Hand */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">Cashier Cash in Hand</span>
                <Vault className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-amber-700">
                PKR {formatWholeNumber(netCashInHand)}
              </div>
            </div>

            {/* Inflow & Outflow Display */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50/80 border border-emerald-100 rounded-lg px-2 py-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] uppercase font-semibold text-emerald-600 leading-tight">Inflow</div>
                  <div className="font-mono font-bold truncate">PKR {formatWholeNumber(cashInflow)}</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-rose-700 bg-rose-50/80 border border-rose-100 rounded-lg px-2 py-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] uppercase font-semibold text-rose-600 leading-tight">Outflow</div>
                  <div className="font-mono font-bold truncate">PKR {formatWholeNumber(cashOutflow)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Pillar 4: Store POS Sales */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Store POS Sales</span>
              <Boxes className="w-4 h-4 text-cyan-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-cyan-700">
              PKR {formatWholeNumber(totalPosRevenue)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {totalCoalTonsSold.toFixed(1)} Tons Dispatched ({posEntries.length} Invoices)
            </div>
          </div>

          {/* Pillar 5: System Users */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">System Users</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {users.length} Accounts
            </div>
            <div className="text-[11px] text-emerald-600 mt-1 font-medium">
              {users.filter(u => u.status === 'active').length} Active across 5 roles
            </div>
          </div>
        </div>

        {/* Pending Approval Highlights */}
        {totalPendingApprovals > 0 ? (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-purple-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-purple-700" />
                <span>Documents Awaiting Your Approval</span>
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('admin_approvals')}
                className="text-xs font-semibold text-purple-700 hover:text-purple-900 underline cursor-pointer"
              >
                Open Approval Console →
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {pendingDemands.slice(0, 2).map(d => (
                <div key={d.id} className="bg-white p-3 rounded-lg border border-purple-200 text-xs">
                  <div className="flex justify-between font-semibold text-slate-900">
                    <span>Demand #{d.referenceNo}</span>
                    <span className="font-mono text-purple-700">PKR {formatWholeNumber(d.totalAmount)}</span>
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">{d.demandType} · {d.category} · {d.date}</div>
                </div>
              ))}
              {pendingPurchases.slice(0, 2).map(p => (
                <div key={p.id} className="bg-white p-3 rounded-lg border border-purple-200 text-xs">
                  <div className="flex justify-between font-semibold text-slate-900">
                    <span>Purchase Summary #{p.reference}</span>
                    <span className="font-mono text-purple-700">PKR {formatWholeNumber(p.totalAmount)}</span>
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">{p.paymentType} · {p.date} · {p.items.length} items</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 text-xs text-emerald-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>The Admin Approval Queue is all clear! No documents pending review.</span>
          </div>
        )}

        {/* Executive Coal Mining, Production & Stock Control Center */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                <Pickaxe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Coal Production & Stock Control (Executive Telemetry)</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold border border-amber-200">
                    Live Mining Sync
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Daily production extraction from partners, authoritative pithead inventory balance, and commercial sales dispatches.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('store_sales')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <span>Manage Coal Operations</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 3 Core KPIs Requested by User */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* KPI 1: How much coal is produced */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-600 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total Coal Produced
                </span>
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                  Inflow (+)
                </span>
              </div>
              <div className="text-3xl font-bold font-mono text-slate-900 tracking-tight">
                {formatWholeNumber(totalCoalProduced)} <span className="text-base font-normal text-slate-500">Tons</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between pt-2 border-t border-slate-200">
                <span>{coalProductionRecords.length} Daily production logs</span>
                <span className="font-medium text-slate-700">Pithead Inward</span>
              </div>
            </div>

            {/* KPI 2: Live Coal Stock (Total Coal Stock + Coal Opening Balance) */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between ${
              totalCoalStockGross > 0
                ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                : 'bg-rose-50/70 border-rose-300 text-rose-950'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                  Live Coal Stock
                </span>
                <span className={`text-[11px] font-mono px-2 py-0.5 rounded font-semibold border ${
                  totalCoalStockGross > 0
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-rose-100 text-rose-800 border-rose-300'
                }`}>
                  {totalCoalStockGross > 0 ? 'Stock Active' : 'Zero Reserve'}
                </span>
              </div>
              <div className="text-3xl font-bold font-mono text-emerald-900 tracking-tight">
                {formatWholeNumber(totalCoalStockGross)} <span className="text-base font-normal text-emerald-700">Tons</span>
              </div>
              <div className="text-[11px] text-emerald-900 mt-2 pt-2 border-t border-emerald-200/60 font-mono space-y-1">
                <div className="font-semibold text-emerald-950">
                  Formula: {coalStockFormula}
                </div>
                {totalCoalSold > 0 ? (
                  <div className="text-[10px] text-emerald-700 font-medium">
                    Available to Sell: {formatWholeNumber(currentCoalStock)} Tons ({formatWholeNumber(totalCoalSold)} Tons Sold)
                  </div>
                ) : (
                  <div className="text-[10px] text-emerald-700 font-medium">
                    Total Coal Stock + Coal Opening Balance
                  </div>
                )}
              </div>
            </div>

            {/* KPI 3: How much coal is sold */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-600 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total Coal Sold
                </span>
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                  Outflow (-)
                </span>
              </div>
              <div className="text-3xl font-bold font-mono text-slate-900 tracking-tight">
                {formatWholeNumber(totalCoalSold)} <span className="text-base font-normal text-slate-500">Tons</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between pt-2 border-t border-slate-200">
                <span>{coalSellRecords.length || posEntries.length} Commercial dispatches</span>
                <span className="font-medium text-emerald-700 font-mono">PKR {formatWholeNumber(totalPosRevenue)}</span>
              </div>
            </div>
          </div>

          {/* Quick Partner Production Breakdown Strip */}
          {coalProductionRecords.length > 0 ? (
            <div className="pt-2">
              <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between">
                <span>Partner Production Contribution Summary</span>
                <span className="text-[11px] text-slate-500">
                  {new Set(coalProductionRecords.map(r => r.partnerName)).size} Active Mining Partners
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {Array.from(
                  coalProductionRecords.reduce((acc, r) => {
                    acc.set(r.partnerName, (acc.get(r.partnerName) || 0) + (Number(r.quantityTons) || 0));
                    return acc;
                  }, new Map<string, number>())
                ).slice(0, 6).map(([pName, pTons]) => {
                  const pct = totalCoalProduced > 0 ? ((pTons / totalCoalProduced) * 100).toFixed(1) : '0';
                  return (
                    <div key={pName} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                      <div className="font-semibold text-slate-800 truncate" title={pName}>{pName}</div>
                      <div className="font-mono font-bold text-slate-900 mt-0.5">{formatWholeNumber(pTons)} Tons</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{pct}% of total</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
              <span>No coal production records logged yet. Use the Coal Management section to log daily production by partner.</span>
              <button
                type="button"
                onClick={() => onNavigate('store_sales')}
                className="font-semibold text-blue-600 hover:text-blue-800 cursor-pointer underline text-[11px]"
              >
                Add First Production Log →
              </button>
            </div>
          )}
        </div>

        {/* Department Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Procurement & Purchases</span>
              <ShoppingCart className="w-4 h-4 text-blue-600" />
            </h4>
            <div className="space-y-1 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Total Demands:</span>
                <span className="font-mono font-bold text-slate-900">{demands.length} (PKR {formatWholeNumber(totalDemandAmount)})</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Total Purchases:</span>
                <span className="font-mono font-bold text-slate-900">{purchases.length} (PKR {formatWholeNumber(totalPurchaseAmount)})</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Treasury & Bank Liquidity</span>
              <Landmark className="w-4 h-4 text-blue-600" />
            </h4>
            <div className="space-y-1 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Total Bank Balance:</span>
                <span className="font-mono font-bold text-blue-700">PKR {formatWholeNumber(totalBankBalances)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Physical Cash in Hand:</span>
                <span className="font-mono font-bold text-amber-700">PKR {formatWholeNumber(netCashInHand)}</span>
              </div>
              <div className="flex justify-between py-1 font-semibold">
                <span className="text-slate-800">Total Liquid Reserves:</span>
                <span className="font-mono font-bold text-emerald-700">PKR {formatWholeNumber(totalBankBalances + netCashInHand)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Financial Accounts</span>
              <Scale className="w-4 h-4 text-emerald-600" />
            </h4>
            <div className="space-y-1 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>COA Heads:</span>
                <span className="font-mono font-bold text-slate-900">{accounts.length} Accounts</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Vouchers Posted:</span>
                <span className="font-mono font-bold text-slate-900">{vouchers.length} (PKR {formatWholeNumber(totalTurnover)})</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Store, Sales & Fleet</span>
              <Boxes className="w-4 h-4 text-cyan-600" />
            </h4>
            <div className="space-y-1 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Stock Items:</span>
                <span className="font-mono font-bold text-slate-900">{stockItems.length} Products</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Fleet Vehicles:</span>
                <span className="font-mono font-bold text-slate-900">{vehicles.length} Active Vehicles</span>
              </div>
            </div>
          </div>
        </div>

        {/* Executive Active Bank Accounts & Liquidity Breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Executive Banking Reserves & Account Balances
                </h3>
                <p className="text-xs text-slate-500">
                  Real-time multi-account bank balances across all enterprise financial institutions
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-3.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-900 flex items-center gap-2">
                <span className="text-slate-500 font-normal">Total Bank Balance:</span>
                <span className="font-mono font-bold text-sm text-blue-700">
                  PKR {formatWholeNumber(totalBankBalances)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('treasury')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <span>Cashier Module</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {bankAccounts.length === 0 ? (
              <div className="col-span-full py-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                No bank accounts registered. Configure bank accounts in the Cashier module.
              </div>
            ) : (
              bankAccounts.map((b) => {
                const bal = getAccountBalance(b);
                return (
                  <div
                    key={b.id}
                    className="p-3.5 rounded-xl bg-slate-50 hover:bg-blue-50/40 border border-slate-200 hover:border-blue-200 transition-all text-xs flex flex-col justify-between space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="truncate">{b.bankName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono truncate mt-0.5">
                          {b.accountNumber} ({b.accountTitle})
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 shrink-0">
                        {b.transactions?.length || 0} Txns
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-200/70 flex items-baseline justify-between">
                      <span className="text-[11px] text-slate-500 font-medium">Account Balance:</span>
                      <span className={`font-mono font-bold text-sm ${bal >= 0 ? 'text-blue-700' : 'text-rose-600'}`}>
                        PKR {formatWholeNumber(bal)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* EXECUTIVE FLEET CONSUMPTION & STOCK INVENTORY SECTION */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
          {/* Section Header with Tabs */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
                  <BarChart2 className="w-5 h-5" />
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Fleet Fuel Consumption & Inventory Stock Intelligence
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Real-time aggregated vehicle-wise fuel/oil consumption and item-wise stock balances synced from Store & Sales.
              </p>
            </div>

            {/* View Selector Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start md:self-auto text-xs font-semibold">
              <button
                type="button"
                onClick={() => setAdminSectionTab('both')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  adminSectionTab === 'both'
                    ? 'bg-white text-purple-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Both Cards
              </button>
              <button
                type="button"
                onClick={() => setAdminSectionTab('vehicle')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  adminSectionTab === 'vehicle'
                    ? 'bg-white text-purple-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Truck className="w-3.5 h-3.5 text-blue-600" />
                <span>Vehicle Consumption</span>
              </button>
              <button
                type="button"
                onClick={() => setAdminSectionTab('stock')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  adminSectionTab === 'stock'
                    ? 'bg-white text-purple-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Boxes className="w-3.5 h-3.5 text-cyan-600" />
                <span>Item-Wise Stock</span>
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          <div className={`grid gap-6 ${adminSectionTab === 'both' ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
            
            {/* CARD 1: VEHICLE-WISE CONSUMPTION */}
            {(adminSectionTab === 'both' || adminSectionTab === 'vehicle') && (
              <div className="border border-slate-200 rounded-xl bg-slate-50/50 p-4 sm:p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  {/* Card Header & KPIs */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Vehicle Wise Consumption</h4>
                        <p className="text-[11px] text-slate-500">Diesel, Engine & Gear Oils, and Filter replacements</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onNavigate('store_sales')}
                      className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                    >
                      <span>Fleet Module</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Summary Metric Strip - Synced from Store Management */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-white border border-slate-200 rounded-lg p-2.5">
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Truck className="w-3 h-3 text-blue-600" />
                        <span>Active Vehicles</span>
                      </div>
                      <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                        {totalActiveVehiclesCount} <span className="text-[10px] font-normal text-slate-500">units</span>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg p-2.5">
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Fuel className="w-3 h-3 text-amber-600" />
                        <span>Total Consumed</span>
                      </div>
                      <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                        {totalFleetConsumed.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">Qty</span>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg p-2.5">
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Layers className="w-3 h-3 text-emerald-600" />
                        <span>Logged Vehicles</span>
                      </div>
                      <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                        {vehicleSummaries.filter(v => v.totalQuantity > 0).length} <span className="text-[10px] font-normal text-slate-500">with usage</span>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg p-2.5">
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Boxes className="w-3 h-3 text-purple-600" />
                        <span>Stock SKUs</span>
                      </div>
                      <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                        {stockSummaries.length} <span className="text-[10px] font-normal text-slate-500">items</span>
                      </div>
                    </div>
                  </div>

                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search vehicle #, driver, or type..."
                      value={vehicleFilterText}
                      onChange={(e) => setVehicleFilterText(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>

                  {/* Vehicle Consumption Table */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                    <div className="max-h-64 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-600 text-[11px] uppercase tracking-wider">
                          <tr>
                            <th className="py-2 px-3">Vehicle</th>
                            <th className="py-2 px-3">Driver</th>
                            <th className="py-2 px-3 text-right">Consumed Qty</th>
                            <th className="py-2 px-3 text-center">Unit</th>
                            <th className="py-2 px-3 text-right">Logs</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredVehicles.length > 0 ? (
                            filteredVehicles.map((v) => (
                              <tr key={v.vehicleId} className="hover:bg-slate-50/70 transition-colors">
                                <td className="py-2 px-3 font-semibold text-slate-900">
                                  <div className="flex items-center gap-1.5">
                                    <span>{v.vehicleNo}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-normal">
                                      {v.vehicleType}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-2 px-3 text-slate-600">{v.driverName}</td>
                                <td className="py-2 px-3 text-right font-mono font-bold text-amber-700">
                                  {v.totalQuantity > 0 ? formatWholeNumber(v.totalQuantity) : '—'}
                                </td>
                                <td className="py-2 px-3 text-center font-mono text-slate-500 text-[11px]">
                                  {v.primaryUnit}
                                </td>
                                <td className="py-2 px-3 text-right text-slate-500 font-mono text-[11px]">
                                  {v.logsCount} entries
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                                No vehicle consumption logs match your search.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 flex justify-between items-center pt-2 border-t border-slate-200">
                  <span>Tracking {vehicles.length} fleet machines</span>
                  <span className="font-mono text-slate-600">Updated from Store Management Stock Report</span>
                </div>
              </div>
            )}

            {/* CARD 2: ITEM-WISE STOCK */}
            {(adminSectionTab === 'both' || adminSectionTab === 'stock') && (
              <div className="border border-slate-200 rounded-xl bg-slate-50/50 p-4 sm:p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  {/* Card Header & KPIs */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-cyan-100 text-cyan-700 rounded-lg">
                        <Boxes className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Item Wise Stock Summary</h4>
                        <p className="text-[11px] text-slate-500">Opening stock, receipts, mine/vehicle issues & net balances</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onNavigate('store_sales')}
                      className="text-xs font-semibold text-cyan-700 hover:text-cyan-800 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                    >
                      <span>Store Module</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-white border border-slate-200 rounded-lg p-2.5">
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <PackageCheck className="w-3 h-3 text-slate-600" />
                        <span>Total Items</span>
                      </div>
                      <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                        {stockSummaries.length} <span className="text-[10px] font-normal text-slate-500">SKUs</span>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg p-2.5">
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>In Stock</span>
                      </div>
                      <div className="text-base font-bold font-mono text-emerald-700 mt-0.5">
                        {inStockCount} <span className="text-[10px] font-normal text-slate-500">SKUs</span>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg p-2.5">
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-amber-600" />
                        <span>Low Stock</span>
                      </div>
                      <div className="text-base font-bold font-mono text-amber-700 mt-0.5">
                        {lowStockCount} <span className="text-[10px] font-normal text-slate-500">SKUs</span>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg p-2.5">
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        <span>Critical</span>
                      </div>
                      <div className="text-base font-bold font-mono text-rose-700 mt-0.5">
                        {criticalStockCount} <span className="text-[10px] font-normal text-slate-500">SKUs</span>
                      </div>
                    </div>
                  </div>

                  {/* Search & Category Filter */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search item name or code..."
                        value={stockFilterText}
                        onChange={(e) => setStockFilterText(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>

                    {stockCategories.length > 0 && (
                      <select
                        value={stockCategoryFilter}
                        onChange={(e) => setStockCategoryFilter(e.target.value)}
                        className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      >
                        <option value="all">All Categories</option>
                        {stockCategories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Item Wise Stock Table */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                    <div className="max-h-64 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-600 text-[11px] uppercase tracking-wider">
                          <tr>
                            <th className="py-2 px-3">Item / Code</th>
                            <th className="py-2 px-3">Category</th>
                            <th className="py-2 px-3 text-right">Opening</th>
                            <th className="py-2 px-3 text-right">Inflow</th>
                            <th className="py-2 px-3 text-right">Usage</th>
                            <th className="py-2 px-3 text-right">Net Balance</th>
                            <th className="py-2 px-3 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredStock.length > 0 ? (
                            filteredStock.map((s) => (
                              <tr key={s.itemId} className="hover:bg-slate-50/70 transition-colors">
                                <td className="py-2 px-3">
                                  <div className="font-semibold text-slate-900">{s.itemName}</div>
                                  <div className="text-[10px] text-slate-500 font-mono">{s.itemCode} · {s.unit}</div>
                                </td>
                                <td className="py-2 px-3 text-slate-600">
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                    {s.category}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-right font-mono text-amber-900">
                                  {formatWholeNumber(s.openingStock)}
                                </td>
                                <td className="py-2 px-3 text-right font-mono text-emerald-700">
                                  +{formatWholeNumber(s.totalInflowPurchase)}
                                </td>
                                <td className="py-2 px-3 text-right font-mono text-slate-700">
                                  -{formatWholeNumber(s.totalUsage)}
                                </td>
                                <td className="py-2 px-3 text-right font-mono font-bold">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[11px] ${
                                      s.stockStatus === 'Critical'
                                        ? 'bg-rose-100 text-rose-800 font-bold'
                                        : s.stockStatus === 'Low Stock'
                                        ? 'bg-amber-100 text-amber-800 font-bold'
                                        : 'bg-emerald-50 text-emerald-800'
                                    }`}
                                  >
                                    {formatWholeNumber(s.currentBalance)} {s.unit}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-center">
                                  <span
                                    className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                      s.stockStatus === 'Critical'
                                        ? 'bg-rose-100 text-rose-800'
                                        : s.stockStatus === 'Low Stock'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-emerald-100 text-emerald-800'
                                    }`}
                                  >
                                    {s.stockStatus}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="py-6 text-center text-slate-400 text-xs">
                                No stock items match your search.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 flex justify-between items-center pt-2 border-t border-slate-200">
                  <span>Balanced from transactions & entries</span>
                  <span className="font-mono text-slate-600">{stockItems.length} registered items</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. PURCHASER DASHBOARD
  if (currentUser.role === 'purchaser') {
    return (
      <div className="space-y-6">
        {/* Purchaser Hero */}
        <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-blue-800/40 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-800/60 border border-blue-600/60 text-blue-200 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShoppingCart className="w-3.5 h-3.5 text-blue-400" />
              <span>Purchaser Workspace</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Purchasing Operations
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Create, finalize, and submit Demands and Purchase Summaries. Track approvals directly from your dedicated procurement desk.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('purchase')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20 cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Go to Purchase Module</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Demands Volume</span>
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {demands.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              PKR {totalDemandAmount.toLocaleString()} total value
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Purchase Summaries</span>
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {purchases.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              PKR {totalPurchaseAmount.toLocaleString()} total value
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Awaiting Approval</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-700">
              {pendingDemands.length + pendingPurchases.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Submitted to Admin
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Approved Documents</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-700">
              {demands.filter(d => d.status === 'Approved').length + purchases.filter(p => p.status === 'Approved').length}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Ready for Execution
            </div>
          </div>
        </div>

        {/* Recent Demands and Purchases */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Recent Demand Vouchers</span>
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('purchase')}
                className="text-xs text-blue-600 hover:underline font-medium cursor-pointer"
              >
                View All
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {demands.slice(0, 4).map(d => (
                <div key={d.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-slate-900">Demand #{d.referenceNo}</div>
                    <div className="text-slate-500 text-[11px]">{d.demandType} · {d.category} · {d.date}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-slate-900">PKR {d.totalAmount.toLocaleString()}</div>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${
                      d.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                      d.status === 'Submitted for Approval' ? 'bg-amber-100 text-amber-800' :
                      d.status === 'Draft' ? 'bg-slate-100 text-slate-700' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {d.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                <span>Recent Purchase Summaries</span>
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('purchase')}
                className="text-xs text-emerald-600 hover:underline font-medium cursor-pointer"
              >
                View All
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {purchases.slice(0, 4).map(p => (
                <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-slate-900">Purchase #{p.reference}</div>
                    <div className="text-slate-500 text-[11px]">{p.paymentType} · {p.date} · {p.items.length} lines</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-slate-900">PKR {p.totalAmount.toLocaleString()}</div>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${
                      p.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                      p.status === 'Submitted for Approval' ? 'bg-amber-100 text-amber-800' :
                      p.status === 'Draft' ? 'bg-slate-100 text-slate-700' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. CASHIER DASHBOARD
  if (currentUser.role === 'cashier') {
    return (
      <div className="space-y-6">
        {/* Cashier Hero */}
        <div className="bg-gradient-to-r from-amber-900 via-slate-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-amber-800/40 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-800/60 border border-amber-600/60 text-amber-200 text-xs font-semibold uppercase tracking-wider mb-2">
              <Vault className="w-3.5 h-3.5 text-amber-400" />
              <span>Cashier Desk</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Cashier Register & Desk
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Manage daily cash vouchers, customer credit books, bank accounts, and transactions with 100% independent cash controls.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('treasury')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 transition-colors shadow-lg shadow-amber-600/20 cursor-pointer"
            >
              <Vault className="w-4 h-4" />
              <span>Open Cashier Module</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
        </div>

        {/* Cash & Treasury Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Cash in Hand</span>
              <Vault className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-700">
              PKR {netCashInHand.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Current drawer balance
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Total Cash Received</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-700">
              PKR {cashInflow.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Inflow receipts recorded
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Total Cash Payments</span>
              <TrendingDown className="w-4 h-4 text-red-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-red-700">
              PKR {cashOutflow.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Disbursements paid out
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Bank Balances</span>
              <Landmark className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-blue-700">
              PKR {totalBankBalances.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Across {bankAccounts.length} accounts
            </div>
          </div>
        </div>

        {/* Bank Accounts Overview Strip */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Landmark className="w-4 h-4 text-blue-600" />
            <span>Active Bank Accounts</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {bankAccounts.map(b => (
              <div key={b.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <div className="font-semibold text-slate-900">{b.bankName}</div>
                <div className="text-[11px] text-slate-500 font-mono">{b.accountNumber} ({b.accountTitle})</div>
                <div className="mt-2 text-sm font-bold font-mono text-blue-700">
                  PKR {getAccountBalance(b).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 4. ACCOUNTANT DASHBOARD
  if (currentUser.role === 'accountant') {
    return (
      <div className="space-y-6">
        {/* Accountant Hero */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-emerald-900/40 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-900/60 border border-emerald-700/60 text-emerald-200 text-xs font-semibold uppercase tracking-wider mb-2">
              <Scale className="w-3.5 h-3.5 text-emerald-400" />
              <span>Financial Accounting Desk</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              General Ledger & Accounts
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Chart of Accounts (T-C-GG-SSS), balanced double-entry vouchers, editable ledger journal, Trial Balance, and Old Ledger (Access DB archive).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('accounting')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              <Scale className="w-4 h-4" />
              <span>Open Accounts Workspace</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
        </div>

        {/* Accountant Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Chart of Accounts</span>
              <Scale className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {accounts.length} Heads
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Active GL Account codes
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Vouchers Posted</span>
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {vouchers.length} Vouchers
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Balanced double-entry
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Total Ledger Turnover</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-700">
              PKR {totalTurnover.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Debits and credits aligned
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Trial Balance Status</span>
              <Scale className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-700">
              Equilibrium
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Double-entry aligned
            </div>
          </div>
        </div>

        {/* Recent Vouchers Preview */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900">Recent Journal Vouchers</h3>
            <button
              type="button"
              onClick={() => onNavigate('accounting')}
              className="text-xs font-semibold text-emerald-600 hover:underline cursor-pointer"
            >
              Open Register →
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {vouchers.slice(0, 4).map(v => (
              <div key={v.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-900">{v.voucherNo} ({v.voucherType})</div>
                  <div className="text-slate-500 text-[11px]">{v.date} · {v.narration}</div>
                </div>
                <div className="font-mono font-bold text-slate-900">
                  PKR {v.totalDebit.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 5. STORE MANAGER DASHBOARD
  return (
    <div className="space-y-6">
      {/* Store Manager Hero */}
      <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-cyan-900/40 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-900/60 border border-cyan-700/60 text-cyan-200 text-xs font-semibold uppercase tracking-wider mb-2">
            <Boxes className="w-3.5 h-3.5 text-cyan-400" />
            <span>Store & Sales Desk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Store, Weighbridge & Fleet
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-xl">
            Point-of-Sale coal dispatches, buyer ledgers, stock registers, and vehicle fuel consumption logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('store_sales')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors shadow-lg shadow-cyan-600/20 cursor-pointer"
          >
            <Boxes className="w-4 h-4" />
            <span>Open Store & Sales Module</span>
            <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>
      </div>

      {/* Store & Coal Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Live Coal Stock</span>
            <Pickaxe className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-800">
            {formatWholeNumber(totalCoalStockGross)} Tons
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            Stock + Opening ({formatWholeNumber(totalCoalProduced)} + {formatWholeNumber(openingCoalStock)})
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Total Produced</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-700">
            {formatWholeNumber(totalCoalProduced)} Tons
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {coalProductionRecords.length} Daily Mining Logs
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Total Coal Sold</span>
            <Boxes className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-700">
            {formatWholeNumber(totalCoalSold)} Tons
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            PKR {formatWholeNumber(totalPosRevenue)} revenue
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Stock Inventory</span>
            <Boxes className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {stockItems.length} Products
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {stockEntries.length} Inward receipts
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Active Fleet</span>
            <Truck className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-700">
            {vehicles.length} Vehicles
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {totalFuelLitres.toLocaleString()} L logged
          </div>
        </div>
      </div>
    </div>
  );
};
