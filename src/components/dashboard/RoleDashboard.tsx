import React from 'react';
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
  DollarSign
} from 'lucide-react';
import { User } from '../../types/user';
import { NavModule, DemandDocument, PurchaseDocument } from '../../types';
import { ChartAccount, VoucherDocument } from '../../types/accounting';
import { CashBookEntry, CreditBookEntry, BankRecord, BankAccountRecord } from '../../types/treasury';
import { PosCoalSellEntry, StockItem, StockEntry, VehicleRecord, VehicleConsumptionRecord } from '../../types/storeSales';
import { TableDefinition } from '../../types/oldLedger';

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
  stockItems: StockItem[];
  stockEntries: StockEntry[];
  vehicles: VehicleRecord[];
  consumptions: VehicleConsumptionRecord[];
  users: User[];
  oldLedgerTables: TableDefinition[];
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
  stockItems,
  stockEntries,
  vehicles,
  consumptions,
  users,
  oldLedgerTables,
  onNavigate,
}) => {
  // Calculations
  const pendingDemands = demands.filter(d => d.status === 'Submitted for Approval');
  const pendingPurchases = purchases.filter(p => p.status === 'Submitted for Approval');
  const totalPendingApprovals = pendingDemands.length + pendingPurchases.length;

  const totalDemandAmount = demands.reduce((acc, d) => acc + d.totalAmount, 0);
  const totalPurchaseAmount = purchases.reduce((acc, p) => acc + p.totalAmount, 0);

  // Treasury
  const cashInflow = cashBookEntries.reduce((sum, e) => sum + (e.credit || 0), 0);
  const cashOutflow = cashBookEntries.reduce((sum, e) => sum + (e.debit || 0), 0);
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

  // Store & Sales
  const totalPosRevenue = posEntries.reduce((sum, p) => sum + (p.totalValue || 0), 0);
  const totalCoalTonsSold = posEntries.reduce((sum, p) => sum + (p.quantity || 0), 0);
  const totalFuelLitres = consumptions.reduce((sum, c) => sum + (c.diesel || 0), 0);

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

        {/* 4 Pillars Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Treasury Cash in Hand</span>
              <Vault className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-700">
              PKR {netCashInHand.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Inflow: {cashInflow.toLocaleString()} | Outflow: {cashOutflow.toLocaleString()}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Store POS Sales</span>
              <Boxes className="w-4 h-4 text-cyan-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-cyan-700">
              PKR {totalPosRevenue.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {totalCoalTonsSold.toFixed(1)} MT Dispatched ({posEntries.length} Invoices)
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
                    <span className="font-mono text-purple-700">PKR {d.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">{d.demandType} · {d.category} · {d.date}</div>
                </div>
              ))}
              {pendingPurchases.slice(0, 2).map(p => (
                <div key={p.id} className="bg-white p-3 rounded-lg border border-purple-200 text-xs">
                  <div className="flex justify-between font-semibold text-slate-900">
                    <span>Purchase Summary #{p.reference}</span>
                    <span className="font-mono text-purple-700">PKR {p.totalAmount.toLocaleString()}</span>
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

        {/* Department Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Procurement & Purchases</span>
              <ShoppingCart className="w-4 h-4 text-blue-600" />
            </h4>
            <div className="space-y-1 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Total Demands:</span>
                <span className="font-mono font-bold text-slate-900">{demands.length} (PKR {totalDemandAmount.toLocaleString()})</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Total Purchases:</span>
                <span className="font-mono font-bold text-slate-900">{purchases.length} (PKR {totalPurchaseAmount.toLocaleString()})</span>
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
                <span className="font-mono font-bold text-slate-900">{vouchers.length} (Turnover: {totalTurnover.toLocaleString()})</span>
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
              <span>Cashier & Treasury Desk</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Treasury Cash Book
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
              <span>Open Treasury Module</span>
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
              <span className="text-xs font-medium">Old Ledger (Access)</span>
              <Database className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-indigo-700">
              {oldLedgerTables.length} Tables
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Direct Access DB reader
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

      {/* Store Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">POS Coal Sales</span>
            <Boxes className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-700">
            PKR {totalPosRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {totalCoalTonsSold.toFixed(1)} MT Dispatched
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Stock Inventory Items</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {stockItems.length} Products
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {stockEntries.length} Inward receipts recorded
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
            {totalFuelLitres.toLocaleString()} Litres fuel logged
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Dispatches Today</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700">
            {posEntries.length} Invoices
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Weighbridge slips issued
          </div>
        </div>
      </div>
    </div>
  );
};
