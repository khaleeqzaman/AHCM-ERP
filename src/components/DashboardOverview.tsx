import React from 'react';
import { 
  ShoppingCart, 
  FileText, 
  ShoppingBag, 
  ArrowRight, 
  ShieldCheck, 
  ListFilter, 
  Table, 
  CheckCircle,
  Clock
} from 'lucide-react';
import { DemandDocument, PurchaseDocument } from '../types';

interface DashboardOverviewProps {
  demands: DemandDocument[];
  purchases: PurchaseDocument[];
  onNavigateToPurchase: () => void;
  onNavigateToApprovals: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  demands,
  purchases,
  onNavigateToPurchase,
  onNavigateToApprovals,
}) => {
  const totalDemandAmount = demands.reduce((acc, d) => acc + d.totalAmount, 0);
  const totalPurchaseAmount = purchases.reduce((acc, p) => acc + p.totalAmount, 0);

  const pendingDemands = demands.filter((d) => d.status === 'Submitted for Approval').length;
  const pendingPurchases = purchases.filter((p) => p.status === 'Submitted for Approval').length;

  const finalizedDemands = demands.filter((d) => d.status === 'Finalized').length;
  const finalizedPurchases = purchases.filter((p) => p.status === 'Finalized').length;

  const draftDemands = demands.filter((d) => d.status === 'Draft').length;
  const draftPurchases = purchases.filter((p) => p.status === 'Draft').length;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs uppercase tracking-wider text-blue-400 font-semibold">
            Purchase Operations & Approvals
          </span>
          <h1 className="text-2xl font-bold tracking-tight mt-1">
            Dashboard Overview
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-xl">
            Fully independent Demands and Purchase summaries lifecycle: Draft → Finalized → Submitted for Approval → Admin Decision.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onNavigateToPurchase}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-xs whitespace-nowrap cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Open Purchase Module</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>

          {(pendingDemands > 0 || pendingPurchases > 0) && (
            <button
              type="button"
              onClick={onNavigateToApprovals}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold text-purple-900 bg-purple-100 hover:bg-purple-200 transition-colors shadow-xs whitespace-nowrap cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-purple-700" />
              <span>Admin Queue ({pendingDemands + pendingPurchases})</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Demands Volume</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {demands.length}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>Total Value:</span>
            <span className="font-mono font-medium text-slate-800">
              {totalDemandAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {draftDemands} Draft · {finalizedDemands} Finalized
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Purchase Summaries</span>
            <ShoppingBag className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {purchases.length}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>Total Value:</span>
            <span className="font-mono font-medium text-slate-800">
              {totalPurchaseAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {draftPurchases} Draft · {finalizedPurchases} Finalized
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Submitted for Approval</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-700">
            {pendingDemands + pendingPurchases}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {pendingDemands} Demands · {pendingPurchases} Purchases in queue
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Approved Documents</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-700">
            {demands.filter((d) => d.status === 'Approved').length +
              purchases.filter((p) => p.status === 'Approved').length}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Cleared and sanctioned by Admin
          </div>
        </div>
      </div>

      {/* 4 Purchaser Entry Points Showcase */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Purchaser Core Entry Points
          </h2>
          <p className="text-xs text-slate-500">
            Direct shortcuts to the 4 entry points of the Purchase Module.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* Card 1: Demand Form */}
          <div
            onClick={onNavigateToPurchase}
            className="group p-4 border border-slate-200 rounded-xl hover:border-blue-500 hover:shadow-xs transition-all cursor-pointer bg-slate-50/50 flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-2.5">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                Demand Form
              </h3>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                Form to create a new demand with Daily/Monthly types, New/R&M categories, auto-calculated item amounts, and draft/finalization actions.
              </p>
            </div>
            <div className="mt-3 flex items-center text-[11px] font-semibold text-blue-600">
              <span>Create Demand</span>
              <ArrowRight className="w-3 h-3 ml-1" />
            </div>
          </div>

          {/* Card 2: Purchase Form */}
          <div
            onClick={onNavigateToPurchase}
            className="group p-4 border border-slate-200 rounded-xl hover:border-blue-500 hover:shadow-xs transition-all cursor-pointer bg-slate-50/50 flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center mb-2.5">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                Purchase Form
              </h3>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                Form to create an independent purchase summary with Cash/Cheque settlement, company vendors, manual amounts, and remarks.
              </p>
            </div>
            <div className="mt-3 flex items-center text-[11px] font-semibold text-blue-600">
              <span>Create Purchase</span>
              <ArrowRight className="w-3 h-3 ml-1" />
            </div>
          </div>

          {/* Card 3: View Demand Forms */}
          <div
            onClick={onNavigateToPurchase}
            className="group p-4 border border-slate-200 rounded-xl hover:border-blue-500 hover:shadow-xs transition-all cursor-pointer bg-slate-50/50 flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2.5">
                <ListFilter className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                View Demand Forms
              </h3>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                List of all demands with Show/Hide itemized tables, inline draft editing, and checkboxes to batch-submit finalized demands.
              </p>
            </div>
            <div className="mt-3 flex items-center text-[11px] font-semibold text-emerald-600">
              <span>Browse Demands</span>
              <ArrowRight className="w-3 h-3 ml-1" />
            </div>
          </div>

          {/* Card 4: View Purchase Forms */}
          <div
            onClick={onNavigateToPurchase}
            className="group p-4 border border-slate-200 rounded-xl hover:border-blue-500 hover:shadow-xs transition-all cursor-pointer bg-slate-50/50 flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center mb-2.5">
                <Table className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                View Purchase Forms
              </h3>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                List of all purchase summaries with Show/Hide itemized tables, inline draft editing, and checkboxes to batch-submit finalized summaries.
              </p>
            </div>
            <div className="mt-3 flex items-center text-[11px] font-semibold text-purple-600">
              <span>Browse Purchases</span>
              <ArrowRight className="w-3 h-3 ml-1" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
