import React, { useState } from 'react';
import { 
  FileText, 
  ShoppingBag, 
  ListFilter, 
  Table, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight,
  TrendingUp,
  Clock
} from 'lucide-react';
import { 
  DemandDocument, 
  PurchaseDocument, 
  PurchaseViewMode,
  DemandItem,
  PurchaseSummaryItem
} from '../types';
import { DemandFormView } from './DemandFormView';
import { PurchaseFormView } from './PurchaseFormView';
import { ViewDemandsList } from './ViewDemandsList';
import { ViewPurchaseList } from './ViewPurchaseList';
import { AdminApprovalView } from './AdminApprovalView';

interface PurchaseScreenProps {
  demands: DemandDocument[];
  purchases: PurchaseDocument[];
  onSaveDemand: (demand: DemandDocument) => void;
  onSavePurchase: (purchase: PurchaseDocument) => void;
  onFinalizeDemand: (id: string) => void;
  onFinalizePurchase: (id: string) => void;
  onSubmitDemand: (id: string) => void;
  onSubmitMultipleDemands: (ids: string[]) => void;
  onSubmitPurchase: (id: string) => void;
  onSubmitMultiplePurchases: (ids: string[]) => void;
  onUpdateDemandItems: (id: string, items: DemandItem[]) => void;
  onUpdatePurchaseItems: (id: string, items: PurchaseSummaryItem[]) => void;
  onApproveDemand: (id: string, remark?: string) => void;
  onRejectDemand: (id: string, remark?: string) => void;
  onApprovePurchase: (id: string, remark?: string) => void;
  onRejectPurchase: (id: string, remark?: string) => void;
  onDeleteDemand?: (id: string) => void;
  onDeletePurchase?: (id: string) => void;
}

export const PurchaseScreen: React.FC<PurchaseScreenProps> = ({
  demands,
  purchases,
  onSaveDemand,
  onSavePurchase,
  onFinalizeDemand,
  onFinalizePurchase,
  onSubmitDemand,
  onSubmitMultipleDemands,
  onSubmitPurchase,
  onSubmitMultiplePurchases,
  onUpdateDemandItems,
  onUpdatePurchaseItems,
  onApproveDemand,
  onRejectDemand,
  onApprovePurchase,
  onRejectPurchase,
  onDeleteDemand,
  onDeletePurchase,
}) => {
  // 1. Purchaser Screen Default entry: 'view_demands' or 'demand_form'
  const [currentView, setCurrentView] = useState<PurchaseViewMode>('view_demands');
  const [editingDemand, setEditingDemand] = useState<DemandDocument | null>(null);
  const [editingPurchase, setEditingPurchase] = useState<PurchaseDocument | null>(null);

  const pendingDemandsCount = demands.filter((d) => d.status === 'Submitted for Approval').length;
  const pendingPurchasesCount = purchases.filter((p) => p.status === 'Submitted for Approval').length;
  const totalPendingApprovals = pendingDemandsCount + pendingPurchasesCount;

  const handleOpenEditDemand = (demand: DemandDocument) => {
    setEditingDemand(demand);
    setCurrentView('demand_form');
  };

  const handleOpenEditPurchase = (purchase: PurchaseDocument) => {
    setEditingPurchase(purchase);
    setCurrentView('purchase_form');
  };

  const handleOpenNewDemand = () => {
    setEditingDemand(null);
    setCurrentView('demand_form');
  };

  const handleOpenNewPurchase = () => {
    setEditingPurchase(null);
    setCurrentView('purchase_form');
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation & Action Buttons Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                Core Module
              </span>
              <span className="text-slate-300">/</span>
              <span className="text-xs text-slate-500">Purchasing & Summaries</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
              Purchase Screen
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Independent workflows for Demand requisitions and Purchase summaries with full status lifecycle.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Total Demands</span>
              <span className="text-sm font-bold font-mono tabular-nums text-slate-900">
                {demands.length} docs
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Total Purchases</span>
              <span className="text-sm font-bold font-mono tabular-nums text-slate-900">
                {purchases.length} docs
              </span>
            </div>

            <button
              type="button"
              onClick={() => setCurrentView('admin_approvals')}
              className={`p-2.5 rounded-lg border transition-all text-left cursor-pointer ${
                currentView === 'admin_approvals'
                  ? 'bg-purple-50 border-purple-300 text-purple-900'
                  : 'bg-slate-50 border-slate-200 hover:border-purple-300 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                <span className="text-[11px] font-semibold text-purple-700">Admin Approvals</span>
              </div>
              <span className="text-sm font-bold font-mono tabular-nums text-purple-900 block mt-0.5">
                {totalPendingApprovals} Pending
              </span>
            </button>
          </div>
        </div>

        {/* 1. Purchaser Screen Buttons:
            - Demand Form (Form to create a new demand)
            - Purchase Form (Form to create a new purchase summary)
            - View Demand Forms (List of all demands, with show/hide itemized table)
            - View Purchase Forms (List of all purchase summaries, with show/hide itemized table)
        */}
        <div className="pt-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Purchaser Entry Points:
            </span>

            <div className="flex flex-wrap items-center gap-2">
              {/* Button 1: Demand Form */}
              <button
                type="button"
                id="btn-demand-form"
                onClick={handleOpenNewDemand}
                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shadow-xs whitespace-nowrap cursor-pointer ${
                  currentView === 'demand_form' && !editingDemand
                    ? 'bg-blue-600 text-white ring-2 ring-blue-600/30'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <span>Demand Form</span>
              </button>

              {/* Button 2: Purchase Form */}
              <button
                type="button"
                id="btn-purchase-form"
                onClick={handleOpenNewPurchase}
                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shadow-xs whitespace-nowrap cursor-pointer ${
                  currentView === 'purchase_form' && !editingPurchase
                    ? 'bg-blue-600 text-white ring-2 ring-blue-600/30'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                <span>Purchase Form</span>
              </button>

              {/* Button 3: View Demand Forms */}
              <button
                type="button"
                id="btn-view-demand-forms"
                onClick={() => {
                  setEditingDemand(null);
                  setCurrentView('view_demands');
                }}
                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shadow-xs whitespace-nowrap cursor-pointer ${
                  currentView === 'view_demands'
                    ? 'bg-blue-600 text-white ring-2 ring-blue-600/30'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5 shrink-0" />
                <span>View Demand Forms</span>
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
                  {demands.length}
                </span>
              </button>

              {/* Button 4: View Purchase Forms */}
              <button
                type="button"
                id="btn-view-purchase-forms"
                onClick={() => {
                  setEditingPurchase(null);
                  setCurrentView('view_purchases');
                }}
                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shadow-xs whitespace-nowrap cursor-pointer ${
                  currentView === 'view_purchases'
                    ? 'bg-blue-600 text-white ring-2 ring-blue-600/30'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <Table className="w-3.5 h-3.5 shrink-0" />
                <span>View Purchase Forms</span>
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
                  {purchases.length}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      <div>
        {currentView === 'demand_form' && (
          <DemandFormView
            initialDemand={editingDemand}
            existingDemands={demands}
            onSaveDemand={(saved) => {
              onSaveDemand(saved);
              setEditingDemand(null);
            }}
            onNavigateToView={() => {
              setEditingDemand(null);
              setCurrentView('view_demands');
            }}
          />
        )}

        {currentView === 'purchase_form' && (
          <PurchaseFormView
            initialPurchase={editingPurchase}
            existingPurchases={purchases}
            onSavePurchase={(saved) => {
              onSavePurchase(saved);
              setEditingPurchase(null);
            }}
            onNavigateToView={() => {
              setEditingPurchase(null);
              setCurrentView('view_purchases');
            }}
          />
        )}

        {currentView === 'view_demands' && (
          <ViewDemandsList
            demands={demands}
            onEditDemand={handleOpenEditDemand}
            onFinalizeDemand={onFinalizeDemand}
            onSubmitDemand={onSubmitDemand}
            onSubmitMultipleDemands={onSubmitMultipleDemands}
            onUpdateDemandItems={onUpdateDemandItems}
            onDeleteDemand={onDeleteDemand}
            onNavigateToCreate={handleOpenNewDemand}
          />
        )}

        {currentView === 'view_purchases' && (
          <ViewPurchaseList
            purchases={purchases}
            onEditPurchase={handleOpenEditPurchase}
            onFinalizePurchase={onFinalizePurchase}
            onSubmitPurchase={onSubmitPurchase}
            onSubmitMultiplePurchases={onSubmitMultiplePurchases}
            onUpdatePurchaseItems={onUpdatePurchaseItems}
            onDeletePurchase={onDeletePurchase}
            onNavigateToCreate={handleOpenNewPurchase}
          />
        )}

        {currentView === 'admin_approvals' && (
          <AdminApprovalView
            demands={demands}
            purchases={purchases}
            onApproveDemand={onApproveDemand}
            onRejectDemand={onRejectDemand}
            onApprovePurchase={onApprovePurchase}
            onRejectPurchase={onRejectPurchase}
          />
        )}
      </div>
    </div>
  );
};
