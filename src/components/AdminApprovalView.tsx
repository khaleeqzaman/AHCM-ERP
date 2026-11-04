import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  EyeOff, 
  FileText, 
  ShoppingBag, 
  Clock, 
  Check, 
  X,
  AlertTriangle,
  Lock
} from 'lucide-react';
import { DemandDocument, PurchaseDocument } from '../types';
import { formatWholeNumber } from '../utils/formatters';

interface AdminApprovalViewProps {
  demands: DemandDocument[];
  purchases: PurchaseDocument[];
  onApproveDemand: (id: string, remark?: string) => void;
  onRejectDemand: (id: string, remark?: string) => void;
  onApprovePurchase: (id: string, remark?: string) => void;
  onRejectPurchase: (id: string, remark?: string) => void;
}

export const AdminApprovalView: React.FC<AdminApprovalViewProps> = ({
  demands,
  purchases,
  onApproveDemand,
  onRejectDemand,
  onApprovePurchase,
  onRejectPurchase,
}) => {
  const [activeTab, setActiveTab] = useState<'demands' | 'purchases'>('demands');
  const [expandedDemandIds, setExpandedDemandIds] = useState<Record<string, boolean>>({});
  const [expandedPurchaseIds, setExpandedPurchaseIds] = useState<Record<string, boolean>>({});
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Filter only documents with status "Submitted for Approval" per Business Rule 6
  const submittedDemands = demands.filter((d) => d.status === 'Submitted for Approval');
  const submittedPurchases = purchases.filter((p) => p.status === 'Submitted for Approval');

  const toggleDemandExpand = (id: string) => {
    setExpandedDemandIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const togglePurchaseExpand = (id: string) => {
    setExpandedPurchaseIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleApproveDemand = (demand: DemandDocument) => {
    onApproveDemand(demand.id);
    setActionSuccess(`Demand ${demand.referenceNo} approved successfully.`);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleRejectDemand = (demand: DemandDocument) => {
    onRejectDemand(demand.id, 'Disapproved during executive review.');
    setActionSuccess(`Demand ${demand.referenceNo} marked as Rejected.`);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleApprovePurchase = (purchase: PurchaseDocument) => {
    onApprovePurchase(purchase.id);
    setActionSuccess(`Purchase Summary ${purchase.reference} approved successfully.`);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleRejectPurchase = (purchase: PurchaseDocument) => {
    onRejectPurchase(purchase.id, 'Disapproved during executive review.');
    setActionSuccess(`Purchase Summary ${purchase.reference} marked as Rejected.`);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-600">
              Executive Approvals
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">Admin Governance Portal</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
            Admin Approval Console
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Only documents submitted for approval appear here. The two approval lists are completely independent.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-100 rounded-lg self-start sm:self-auto border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('demands')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'demands'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Demand Approvals</span>
            <span className="font-mono px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-700">
              {submittedDemands.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('purchases')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'purchases'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Purchase Approvals</span>
            <span className="font-mono px-1.5 py-0.2 rounded-full text-[10px] bg-purple-100 text-purple-700">
              {submittedPurchases.length}
            </span>
          </button>
        </div>
      </div>

      {/* Success banner */}
      {actionSuccess && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* 7.1 Demand Approval List */}
      {activeTab === 'demands' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Submitted Demands Queue ({submittedDemands.length})
              </h3>
              <p className="text-xs text-slate-500">
                Review itemized requirements and approve or reject demands.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-3 w-12 text-center">Sr.</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Reference No.</th>
                  <th className="py-3 px-4">Demand Type</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">No. of Items</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-center">Itemized Table</th>
                  <th className="py-3 px-4 text-center">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submittedDemands.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      No demands currently pending Admin approval. Finalize and submit demands from the Purchaser Screen.
                    </td>
                  </tr>
                ) : (
                  submittedDemands.map((demand, idx) => {
                    const isExpanded = !!expandedDemandIds[demand.id];

                    return (
                      <React.Fragment key={demand.id}>
                        <tr className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-3 text-center font-mono text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                            {demand.date}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                            {demand.referenceNo}
                          </td>
                          <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                            {demand.demandType}
                          </td>
                          <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                            {demand.category}
                          </td>
                          <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-700">
                            {demand.items.length}
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900 whitespace-nowrap">
                            {formatWholeNumber(demand.totalAmount)}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => toggleDemandExpand(demand.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                            >
                              {isExpanded ? (
                                <>
                                  <EyeOff className="w-3 h-3" />
                                  <span>Hide Items</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3 h-3" />
                                  <span>Review Items</span>
                                </>
                              )}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleApproveDemand(demand)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors shadow-xs cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectDemand(demand)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-300 rounded-md transition-colors cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </div>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-slate-50/70 border-b border-slate-200">
                            <td colSpan={9} className="p-4 pl-12 pr-6">
                              <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs space-y-2">
                                <div className="text-xs font-semibold text-slate-800 pb-1 border-b border-slate-100">
                                  Items Detail for {demand.referenceNo} (Demand Date: {demand.date})
                                </div>
                                <table className="w-full text-left border-collapse text-xs">
                                  <thead>
                                    <tr className="bg-slate-50 text-[11px] font-semibold text-slate-600 border-b border-slate-200">
                                      <th className="py-1.5 px-3 w-14 text-center">Sr.</th>
                                      <th className="py-1.5 px-3">Item Name</th>
                                      <th className="py-1.5 px-3 w-28 text-right">Quantity</th>
                                      <th className="py-1.5 px-3 w-28 text-right">Rate</th>
                                      <th className="py-1.5 px-3 w-32 text-right">Amount</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {demand.items.map((it) => (
                                      <tr key={it.id}>
                                        <td className="py-1.5 px-3 text-center font-mono text-slate-500">
                                          {it.srNo}
                                        </td>
                                        <td className="py-1.5 px-3 font-medium text-slate-800">
                                          {it.itemName}
                                        </td>
                                        <td className="py-1.5 px-3 text-right font-mono tabular-nums">
                                          {it.quantity}
                                        </td>
                                        <td className="py-1.5 px-3 text-right font-mono tabular-nums">
                                          {formatWholeNumber(it.rate)}
                                        </td>
                                        <td className="py-1.5 px-3 text-right font-mono tabular-nums font-semibold">
                                          {formatWholeNumber(it.amount)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                  <tfoot>
                                    <tr className="bg-slate-50 border-t border-slate-200 font-semibold text-xs">
                                      <td colSpan={4} className="py-2 px-3 text-right uppercase text-[11px]">
                                        Total Amount:
                                      </td>
                                      <td className="py-2 px-3 text-right font-mono text-blue-700">
                                        {formatWholeNumber(demand.totalAmount)}
                                      </td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7.2 Purchase Approval List */}
      {activeTab === 'purchases' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Submitted Purchase Summaries Queue ({submittedPurchases.length})
              </h3>
              <p className="text-xs text-slate-500">
                Review company vendors, item details, manual amounts and approve or reject purchase summaries.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-3 w-12 text-center">Sr.</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Payment Type</th>
                  <th className="py-3 px-4 text-center">No. of Items</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-center">Itemized Table</th>
                  <th className="py-3 px-4 text-center">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submittedPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      No purchase summaries currently pending Admin approval. Finalize and submit summaries from the Purchaser Screen.
                    </td>
                  </tr>
                ) : (
                  submittedPurchases.map((purchase, idx) => {
                    const isExpanded = !!expandedPurchaseIds[purchase.id];

                    return (
                      <React.Fragment key={purchase.id}>
                        <tr className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-3 text-center font-mono text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                            {purchase.date}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                            {purchase.reference}
                          </td>
                          <td className="py-3 px-4 text-slate-700 whitespace-nowrap font-medium">
                            {purchase.paymentType}
                          </td>
                          <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-700">
                            {purchase.items.length}
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900 whitespace-nowrap">
                            {formatWholeNumber(purchase.totalAmount)}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => togglePurchaseExpand(purchase.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                            >
                              {isExpanded ? (
                                <>
                                  <EyeOff className="w-3 h-3" />
                                  <span>Hide Items</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3 h-3" />
                                  <span>Review Items</span>
                                </>
                              )}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleApprovePurchase(purchase)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors shadow-xs cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectPurchase(purchase)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-300 rounded-md transition-colors cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </div>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-slate-50/70 border-b border-slate-200">
                            <td colSpan={8} className="p-4 pl-12 pr-6">
                              <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs space-y-2">
                                <div className="text-xs font-semibold text-slate-800 pb-1 border-b border-slate-100">
                                  Items Detail for {purchase.reference} (Payment: {purchase.paymentType})
                                </div>
                                <table className="w-full text-left border-collapse text-xs">
                                  <thead>
                                    <tr className="bg-slate-50 text-[11px] font-semibold text-slate-600 border-b border-slate-200">
                                      <th className="py-1.5 px-3 w-14 text-center">Sr.</th>
                                      <th className="py-1.5 px-3 w-44">Company Name</th>
                                      <th className="py-1.5 px-3">Item Name</th>
                                      <th className="py-1.5 px-3 w-20 text-right">Quantity</th>
                                      <th className="py-1.5 px-3 w-28 text-right">Amount</th>
                                      <th className="py-1.5 px-3 w-44">Remarks</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {purchase.items.map((it) => (
                                      <tr key={it.id}>
                                        <td className="py-1.5 px-3 text-center font-mono text-slate-500">
                                          {it.srNo}
                                        </td>
                                        <td className="py-1.5 px-3 font-semibold text-slate-800">
                                          {it.companyName}
                                        </td>
                                        <td className="py-1.5 px-3 text-slate-800">
                                          {it.itemName}
                                        </td>
                                        <td className="py-1.5 px-3 text-right font-mono tabular-nums">
                                          {it.quantity}
                                        </td>
                                        <td className="py-1.5 px-3 text-right font-mono tabular-nums font-semibold">
                                          {formatWholeNumber(it.amount)}
                                        </td>
                                        <td className="py-1.5 px-3 text-slate-500 text-[11px]">
                                          {it.remarks || '—'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                  <tfoot>
                                    <tr className="bg-slate-50 border-t border-slate-200 font-semibold text-xs">
                                      <td colSpan={4} className="py-2 px-3 text-right uppercase text-[11px]">
                                        Total Amount:
                                      </td>
                                      <td className="py-2 px-3 text-right font-mono text-blue-700">
                                        {formatWholeNumber(purchase.totalAmount)}
                                      </td>
                                      <td></td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
