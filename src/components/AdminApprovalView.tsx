import React, { useState, useMemo } from 'react';
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
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  RotateCcw,
  FileCheck2,
  FileX2,
  AlertTriangle,
  MessageSquareQuote
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

export type AdminSortField = 'date' | 'reference' | 'type' | 'amount' | 'status';

export const AdminApprovalView: React.FC<AdminApprovalViewProps> = ({
  demands,
  purchases,
  onApproveDemand,
  onRejectDemand,
  onApprovePurchase,
  onRejectPurchase,
}) => {
  const [activeTab, setActiveTab] = useState<'demands' | 'purchases'>('demands');
  
  // Status filter: 'pending' (Submitted for Approval), 'Approved', 'Rejected', 'all'
  const [statusFilter, setStatusFilter] = useState<'pending' | 'Approved' | 'Rejected' | 'all'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [sortField, setSortField] = useState<AdminSortField>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [expandedDemandIds, setExpandedDemandIds] = useState<Record<string, boolean>>({});
  const [expandedPurchaseIds, setExpandedPurchaseIds] = useState<Record<string, boolean>>({});
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Remark modal state for rejection or custom approval notes
  const [rejectionModal, setRejectionModal] = useState<{
    isOpen: boolean;
    type: 'demand' | 'purchase';
    id: string;
    reference: string;
    remark: string;
  }>({
    isOpen: false,
    type: 'demand',
    id: '',
    reference: '',
    remark: 'Disapproved during executive review.',
  });

  // Calculate Metrics for Demands
  const pendingDemands = useMemo(() => demands.filter((d) => d.status === 'Submitted for Approval'), [demands]);
  const approvedDemands = useMemo(() => demands.filter((d) => d.status === 'Approved'), [demands]);
  const rejectedDemands = useMemo(() => demands.filter((d) => d.status === 'Rejected'), [demands]);
  
  const pendingDemandsAmount = useMemo(() => pendingDemands.reduce((s, d) => s + d.totalAmount, 0), [pendingDemands]);
  const approvedDemandsAmount = useMemo(() => approvedDemands.reduce((s, d) => s + d.totalAmount, 0), [approvedDemands]);
  const rejectedDemandsAmount = useMemo(() => rejectedDemands.reduce((s, d) => s + d.totalAmount, 0), [rejectedDemands]);

  // Calculate Metrics for Purchases
  const pendingPurchases = useMemo(() => purchases.filter((p) => p.status === 'Submitted for Approval'), [purchases]);
  const approvedPurchases = useMemo(() => purchases.filter((p) => p.status === 'Approved'), [purchases]);
  const rejectedPurchases = useMemo(() => purchases.filter((p) => p.status === 'Rejected'), [purchases]);
  
  const pendingPurchasesAmount = useMemo(() => pendingPurchases.reduce((s, p) => s + p.totalAmount, 0), [pendingPurchases]);
  const approvedPurchasesAmount = useMemo(() => approvedPurchases.reduce((s, p) => s + p.totalAmount, 0), [approvedPurchases]);
  const rejectedPurchasesAmount = useMemo(() => rejectedPurchases.reduce((s, p) => s + p.totalAmount, 0), [rejectedPurchases]);

  // Sorting helper
  const handleSort = (field: AdminSortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const renderSortIcon = (field: AdminSortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-purple-600" />
    ) : (
      <ArrowDown className="w-3 h-3 text-purple-600" />
    );
  };

  const resetFilters = () => {
    setStatusFilter('pending');
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setTypeFilter('All');
    setSortField('date');
    setSortOrder('desc');
  };

  // Filtered Demands in Admin Approval
  const filteredDemands = useMemo(() => {
    return demands
      .filter((d) => {
        // In Admin Approval, records must be either Submitted for Approval, Approved, or Rejected
        if (d.status !== 'Submitted for Approval' && d.status !== 'Approved' && d.status !== 'Rejected') {
          return false;
        }

        if (statusFilter === 'pending' && d.status !== 'Submitted for Approval') return false;
        if (statusFilter === 'Approved' && d.status !== 'Approved') return false;
        if (statusFilter === 'Rejected' && d.status !== 'Rejected') return false;

        if (typeFilter !== 'All' && d.demandType !== typeFilter) return false;
        if (startDate && d.date < startDate) return false;
        if (endDate && d.date > endDate) return false;

        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchesRef = d.referenceNo.toLowerCase().includes(q);
          const matchesCategory = d.category.toLowerCase().includes(q);
          const matchesRemark = (d.adminRemark || '').toLowerCase().includes(q);
          const matchesItems = d.items.some((it) => it.itemName.toLowerCase().includes(q));
          if (!matchesRef && !matchesCategory && !matchesRemark && !matchesItems) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortField === 'date') {
          const cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
          return sortOrder === 'asc' ? cmp : -cmp;
        }
        if (sortField === 'reference') {
          const cmp = a.referenceNo.localeCompare(b.referenceNo);
          return sortOrder === 'asc' ? cmp : -cmp;
        }
        if (sortField === 'type') {
          const cmp = a.demandType.localeCompare(b.demandType);
          return sortOrder === 'asc' ? cmp : -cmp;
        }
        if (sortField === 'amount') {
          return sortOrder === 'asc' ? a.totalAmount - b.totalAmount : b.totalAmount - a.totalAmount;
        }
        if (sortField === 'status') {
          const cmp = a.status.localeCompare(b.status);
          return sortOrder === 'asc' ? cmp : -cmp;
        }
        return 0;
      });
  }, [demands, statusFilter, typeFilter, startDate, endDate, searchTerm, sortField, sortOrder]);

  // Filtered Purchases in Admin Approval
  const filteredPurchases = useMemo(() => {
    return purchases
      .filter((p) => {
        // In Admin Approval, records must be either Submitted for Approval, Approved, or Rejected
        if (p.status !== 'Submitted for Approval' && p.status !== 'Approved' && p.status !== 'Rejected') {
          return false;
        }

        if (statusFilter === 'pending' && p.status !== 'Submitted for Approval') return false;
        if (statusFilter === 'Approved' && p.status !== 'Approved') return false;
        if (statusFilter === 'Rejected' && p.status !== 'Rejected') return false;

        if (typeFilter !== 'All' && p.paymentType !== typeFilter) return false;
        if (startDate && p.date < startDate) return false;
        if (endDate && p.date > endDate) return false;

        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchesRef = p.reference.toLowerCase().includes(q);
          const matchesPayment = p.paymentType.toLowerCase().includes(q);
          const matchesRemark = (p.adminRemark || '').toLowerCase().includes(q);
          const matchesItems = p.items.some(
            (it) => it.itemName.toLowerCase().includes(q) || it.companyName.toLowerCase().includes(q)
          );
          if (!matchesRef && !matchesPayment && !matchesRemark && !matchesItems) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortField === 'date') {
          const cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
          return sortOrder === 'asc' ? cmp : -cmp;
        }
        if (sortField === 'reference') {
          const cmp = a.reference.localeCompare(b.reference);
          return sortOrder === 'asc' ? cmp : -cmp;
        }
        if (sortField === 'type') {
          const cmp = a.paymentType.localeCompare(b.paymentType);
          return sortOrder === 'asc' ? cmp : -cmp;
        }
        if (sortField === 'amount') {
          return sortOrder === 'asc' ? a.totalAmount - b.totalAmount : b.totalAmount - a.totalAmount;
        }
        if (sortField === 'status') {
          const cmp = a.status.localeCompare(b.status);
          return sortOrder === 'asc' ? cmp : -cmp;
        }
        return 0;
      });
  }, [purchases, statusFilter, typeFilter, startDate, endDate, searchTerm, sortField, sortOrder]);

  const toggleDemandExpand = (id: string) => {
    setExpandedDemandIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const togglePurchaseExpand = (id: string) => {
    setExpandedPurchaseIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleApproveDemand = (demand: DemandDocument) => {
    onApproveDemand(demand.id, 'Approved during executive review.');
    setActionSuccess(`Demand ${demand.referenceNo} approved successfully.`);
    setTimeout(() => setActionSuccess(null), 3500);
  };

  const handleOpenRejectDemand = (demand: DemandDocument) => {
    setRejectionModal({
      isOpen: true,
      type: 'demand',
      id: demand.id,
      reference: demand.referenceNo,
      remark: 'Disapproved during executive review.',
    });
  };

  const handleApprovePurchase = (purchase: PurchaseDocument) => {
    onApprovePurchase(purchase.id, 'Authorized for payment during executive review.');
    setActionSuccess(`Purchase Summary ${purchase.reference} approved successfully.`);
    setTimeout(() => setActionSuccess(null), 3500);
  };

  const handleOpenRejectPurchase = (purchase: PurchaseDocument) => {
    setRejectionModal({
      isOpen: true,
      type: 'purchase',
      id: purchase.id,
      reference: purchase.reference,
      remark: 'Disapproved during executive review.',
    });
  };

  const handleConfirmRejection = () => {
    if (rejectionModal.type === 'demand') {
      onRejectDemand(rejectionModal.id, rejectionModal.remark.trim() || 'Disapproved during executive review.');
      setActionSuccess(`Demand ${rejectionModal.reference} marked as Rejected.`);
    } else {
      onRejectPurchase(rejectionModal.id, rejectionModal.remark.trim() || 'Disapproved during executive review.');
      setActionSuccess(`Purchase Summary ${rejectionModal.reference} marked as Rejected.`);
    }
    setRejectionModal({ isOpen: false, type: 'demand', id: '', reference: '', remark: '' });
    setTimeout(() => setActionSuccess(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Header & Sub-Nav */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-600">
              Executive Approvals & Audit
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">Admin Governance Portal</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
            Admin Approval Console & Decision Registry
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Review submitted demands and purchase orders, inspect line items, and audit all approved and rejected decisions.
          </p>
        </div>

        {/* Tab Switcher: Demands vs Purchases */}
        <div className="flex items-center p-1 bg-slate-100 rounded-lg self-start sm:self-auto border border-slate-200">
          <button
            type="button"
            onClick={() => {
              setActiveTab('demands');
              setTypeFilter('All');
            }}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'demands'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>Demand Approvals</span>
            <span className="font-mono px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-800 font-bold">
              {pendingDemands.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('purchases');
              setTypeFilter('All');
            }}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'purchases'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-purple-600" />
            <span>Purchase Approvals</span>
            <span className="font-mono px-1.5 py-0.2 rounded-full text-[10px] bg-purple-100 text-purple-800 font-bold">
              {pendingPurchases.length}
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

      {/* Overview Metric Cards based on current active tab */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Card */}
        <div 
          onClick={() => setStatusFilter('pending')}
          className={`border rounded-xl p-4 shadow-xs transition-all cursor-pointer ${
            statusFilter === 'pending'
              ? 'bg-amber-50/60 border-amber-300 ring-2 ring-amber-300/40'
              : 'bg-white border-slate-200 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
              Pending Review
            </span>
            <span className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {activeTab === 'demands' ? pendingDemands.length : pendingPurchases.length}
            </span>
            <span className="text-xs font-mono font-semibold text-amber-800 tabular-nums">
              Rs. {formatWholeNumber(activeTab === 'demands' ? pendingDemandsAmount : pendingPurchasesAmount)}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Submitted vouchers awaiting executive sanction
          </div>
        </div>

        {/* Approved Card */}
        <div 
          onClick={() => setStatusFilter('Approved')}
          className={`border rounded-xl p-4 shadow-xs transition-all cursor-pointer ${
            statusFilter === 'Approved'
              ? 'bg-emerald-50/60 border-emerald-300 ring-2 ring-emerald-300/40'
              : 'bg-white border-slate-200 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
              Approved Records
            </span>
            <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {activeTab === 'demands' ? approvedDemands.length : approvedPurchases.length}
            </span>
            <span className="text-xs font-mono font-semibold text-emerald-700 tabular-nums">
              Rs. {formatWholeNumber(activeTab === 'demands' ? approvedDemandsAmount : approvedPurchasesAmount)}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Sanctioned and authorized for processing
          </div>
        </div>

        {/* Rejected Card */}
        <div 
          onClick={() => setStatusFilter('Rejected')}
          className={`border rounded-xl p-4 shadow-xs transition-all cursor-pointer ${
            statusFilter === 'Rejected'
              ? 'bg-rose-50/60 border-rose-300 ring-2 ring-rose-300/40'
              : 'bg-white border-slate-200 hover:border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-800 uppercase tracking-wider">
              Rejected Records
            </span>
            <span className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
              <XCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {activeTab === 'demands' ? rejectedDemands.length : rejectedPurchases.length}
            </span>
            <span className="text-xs font-mono font-semibold text-rose-700 tabular-nums">
              Rs. {formatWholeNumber(activeTab === 'demands' ? rejectedDemandsAmount : rejectedPurchasesAmount)}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Disapproved with recorded administrative reason
          </div>
        </div>

        {/* Total Processed Card */}
        <div 
          onClick={() => setStatusFilter('all')}
          className={`border rounded-xl p-4 shadow-xs transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-400/40'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Total Decisions
            </span>
            <span className="p-1.5 bg-slate-100 text-slate-700 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {activeTab === 'demands'
                ? pendingDemands.length + approvedDemands.length + rejectedDemands.length
                : pendingPurchases.length + approvedPurchases.length + rejectedPurchases.length}
            </span>
            <span className="text-xs font-mono font-semibold text-slate-700 tabular-nums">
              Rs. {formatWholeNumber(
                activeTab === 'demands'
                  ? pendingDemandsAmount + approvedDemandsAmount + rejectedDemandsAmount
                  : pendingPurchasesAmount + approvedPurchasesAmount + rejectedPurchasesAmount
              )}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Complete executive audit history
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {/* Filter & Search Bar */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 space-y-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Decision Status Segmented Control */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">
                Queue:
              </span>
              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  statusFilter === 'pending'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Pending Review ({activeTab === 'demands' ? pendingDemands.length : pendingPurchases.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('Approved')}
                className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  statusFilter === 'Approved'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approved Records ({activeTab === 'demands' ? approvedDemands.length : approvedPurchases.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('Rejected')}
                className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  statusFilter === 'Rejected'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Rejected Records ({activeTab === 'demands' ? rejectedDemands.length : rejectedPurchases.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  statusFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                All Decisions
              </button>
            </div>

            {/* Live Search */}
            <div className="relative min-w-[260px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={activeTab === 'demands' ? 'Search reference, item, remarks...' : 'Search reference, vendor, item...'}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-slate-900"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Sub Filters: Date range, Type filter, Reset */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              {/* Type filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">
                  {activeTab === 'demands' ? 'Demand Type:' : 'Payment Type:'}
                </span>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-slate-200 rounded-md bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="All">All Types</option>
                  {activeTab === 'demands' ? (
                    <>
                      <option value="Daily">Daily</option>
                      <option value="Monthly">Monthly</option>
                    </>
                  ) : (
                    <>
                      <option value="Cash">Cash</option>
                      <option value="Cheque">Cheque</option>
                    </>
                  )}
                </select>
              </div>

              {/* Date range */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2 py-1 text-xs border border-slate-200 rounded-md bg-white text-slate-700"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">To:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2 py-1 text-xs border border-slate-200 rounded-md bg-white text-slate-700"
                />
              </div>
            </div>

            {(searchTerm || startDate || endDate || typeFilter !== 'All' || statusFilter !== 'pending') && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:text-rose-800 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* 1. Demand Approvals & Audit Records Table */}
        {activeTab === 'demands' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider select-none">
                  <th className="py-3 px-3 w-12 text-center">Sr.</th>
                  <th
                    onClick={() => handleSort('date')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="inline-flex items-center gap-1">
                      <span>Date</span>
                      {renderSortIcon('date')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('reference')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="inline-flex items-center gap-1">
                      <span>Reference No.</span>
                      {renderSortIcon('reference')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('type')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="inline-flex items-center gap-1">
                      <span>Type</span>
                      {renderSortIcon('type')}
                    </div>
                  </th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">No. of Items</th>
                  <th
                    onClick={() => handleSort('amount')}
                    className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="inline-flex items-center justify-end gap-1 w-full">
                      <span>Total Amount</span>
                      {renderSortIcon('amount')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('status')}
                    className="py-3 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="inline-flex items-center justify-center gap-1">
                      <span>Decision Status</span>
                      {renderSortIcon('status')}
                    </div>
                  </th>
                  <th className="py-3 px-4">Admin Remarks</th>
                  <th className="py-3 px-4 text-center">Itemized Table</th>
                  <th className="py-3 px-4 text-center">Decision / Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDemands.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-500">
                      <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">No demands match the selected queue or filters</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {statusFilter === 'pending'
                          ? 'No demands are currently awaiting approval.'
                          : 'Try modifying your search or queue filters.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredDemands.map((demand, idx) => {
                    const isExpanded = !!expandedDemandIds[demand.id];
                    const isPending = demand.status === 'Submitted for Approval';
                    const isApproved = demand.status === 'Approved';
                    const isRejected = demand.status === 'Rejected';

                    return (
                      <React.Fragment key={demand.id}>
                        <tr className="hover:bg-slate-50/70 transition-colors">
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
                            Rs. {formatWholeNumber(demand.totalAmount)}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-md ${
                                isPending
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : isApproved
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-800 border border-rose-200'
                              }`}
                            >
                              {isPending && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                              {isApproved && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                              {isRejected && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                              <span>{isPending ? 'Pending Review' : demand.status}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 text-[11px] max-w-[200px] truncate">
                            {demand.adminRemark ? (
                              <span title={demand.adminRemark} className="font-medium text-slate-700">
                                {demand.adminRemark}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">No remark</span>
                            )}
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
                            {isPending ? (
                              <div className="inline-flex items-center gap-1.5">
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
                                  onClick={() => handleOpenRejectDemand(demand)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-300 rounded-md transition-colors cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </button>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1 text-[11px] font-semibold">
                                {isApproved ? (
                                  <span className="text-emerald-700">✓ Decided: Approved</span>
                                ) : (
                                  <span className="text-rose-700">✕ Decided: Rejected</span>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-slate-50/70 border-b border-slate-200">
                            <td colSpan={11} className="p-4 pl-12 pr-6">
                              <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs space-y-2">
                                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                                  <div className="text-xs font-semibold text-slate-800">
                                    Itemized Requirements for Demand {demand.referenceNo} (Demand Date: {demand.date})
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    Status: <strong className={isApproved ? 'text-emerald-700' : isRejected ? 'text-rose-700' : 'text-amber-700'}>{demand.status}</strong>
                                    {demand.updatedAt && ` · Logged: ${demand.updatedAt}`}
                                  </div>
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
                                          Rs. {formatWholeNumber(it.rate)}
                                        </td>
                                        <td className="py-1.5 px-3 text-right font-mono tabular-nums font-semibold">
                                          Rs. {formatWholeNumber(it.amount)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                  <tfoot>
                                    <tr className="bg-slate-50 border-t border-slate-200 font-semibold text-xs">
                                      <td colSpan={4} className="py-2 px-3 text-right uppercase text-[11px]">
                                        Total Demand Amount:
                                      </td>
                                      <td className="py-2 px-3 text-right font-mono text-blue-700">
                                        Rs. {formatWholeNumber(demand.totalAmount)}
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
        )}

        {/* 2. Purchase Approvals & Audit Records Table */}
        {activeTab === 'purchases' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider select-none">
                  <th className="py-3 px-3 w-12 text-center">Sr.</th>
                  <th
                    onClick={() => handleSort('date')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="inline-flex items-center gap-1">
                      <span>Date</span>
                      {renderSortIcon('date')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('reference')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="inline-flex items-center gap-1">
                      <span>Reference</span>
                      {renderSortIcon('reference')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('type')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="inline-flex items-center gap-1">
                      <span>Payment Type</span>
                      {renderSortIcon('type')}
                    </div>
                  </th>
                  <th className="py-3 px-4 text-center">No. of Items</th>
                  <th
                    onClick={() => handleSort('amount')}
                    className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="inline-flex items-center justify-end gap-1 w-full">
                      <span>Total Amount</span>
                      {renderSortIcon('amount')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('status')}
                    className="py-3 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="inline-flex items-center justify-center gap-1">
                      <span>Decision Status</span>
                      {renderSortIcon('status')}
                    </div>
                  </th>
                  <th className="py-3 px-4">Admin Remarks</th>
                  <th className="py-3 px-4 text-center">Itemized Table</th>
                  <th className="py-3 px-4 text-center">Decision / Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-500">
                      <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">No purchase summaries match the selected queue or filters</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {statusFilter === 'pending'
                          ? 'No purchase summaries are currently awaiting approval.'
                          : 'Try modifying your search or queue filters.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredPurchases.map((purchase, idx) => {
                    const isExpanded = !!expandedPurchaseIds[purchase.id];
                    const isPending = purchase.status === 'Submitted for Approval';
                    const isApproved = purchase.status === 'Approved';
                    const isRejected = purchase.status === 'Rejected';

                    return (
                      <React.Fragment key={purchase.id}>
                        <tr className="hover:bg-slate-50/70 transition-colors">
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
                            Rs. {formatWholeNumber(purchase.totalAmount)}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-md ${
                                isPending
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : isApproved
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-800 border border-rose-200'
                              }`}
                            >
                              {isPending && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                              {isApproved && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                              {isRejected && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                              <span>{isPending ? 'Pending Review' : purchase.status}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 text-[11px] max-w-[200px] truncate">
                            {purchase.adminRemark ? (
                              <span title={purchase.adminRemark} className="font-medium text-slate-700">
                                {purchase.adminRemark}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">No remark</span>
                            )}
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
                            {isPending ? (
                              <div className="inline-flex items-center gap-1.5">
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
                                  onClick={() => handleOpenRejectPurchase(purchase)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-300 rounded-md transition-colors cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </button>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1 text-[11px] font-semibold">
                                {isApproved ? (
                                  <span className="text-emerald-700">✓ Decided: Approved</span>
                                ) : (
                                  <span className="text-rose-700">✕ Decided: Rejected</span>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-slate-50/70 border-b border-slate-200">
                            <td colSpan={10} className="p-4 pl-12 pr-6">
                              <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs space-y-2">
                                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                                  <div className="text-xs font-semibold text-slate-800">
                                    Itemized Vendors & Articles for {purchase.reference} (Payment: {purchase.paymentType})
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    Status: <strong className={isApproved ? 'text-emerald-700' : isRejected ? 'text-rose-700' : 'text-amber-700'}>{purchase.status}</strong>
                                    {purchase.updatedAt && ` · Logged: ${purchase.updatedAt}`}
                                  </div>
                                </div>
                                <table className="w-full text-left border-collapse text-xs">
                                  <thead>
                                    <tr className="bg-slate-50 text-[11px] font-semibold text-slate-600 border-b border-slate-200">
                                      <th className="py-1.5 px-3 w-14 text-center">Sr.</th>
                                      <th className="py-1.5 px-3 w-48">Company Name</th>
                                      <th className="py-1.5 px-3">Item Name</th>
                                      <th className="py-1.5 px-3 w-24 text-right">Quantity</th>
                                      <th className="py-1.5 px-3 w-32 text-right">Amount</th>
                                      <th className="py-1.5 px-3 w-48">Remarks</th>
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
                                          Rs. {formatWholeNumber(it.amount)}
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
                                        Total Purchase Amount:
                                      </td>
                                      <td className="py-2 px-3 text-right font-mono text-blue-700">
                                        Rs. {formatWholeNumber(purchase.totalAmount)}
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
        )}
      </div>

      {/* Administrative Rejection & Remark Modal */}
      {rejectionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                <AlertTriangle className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Reject {rejectionModal.type === 'demand' ? 'Demand' : 'Purchase Order'}
                </h3>
                <p className="text-xs text-slate-500">
                  Reference: <strong className="font-mono text-slate-800">{rejectionModal.reference}</strong>
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Administrative Rejection Reason & Remarks:
              </label>
              <textarea
                rows={3}
                value={rejectionModal.remark}
                onChange={(e) => setRejectionModal((prev) => ({ ...prev, remark: e.target.value }))}
                placeholder="Enter executive rationale for rejection..."
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-900"
              />
              <p className="text-[11px] text-slate-400">
                This remark will be logged into the audit trail and visible to the purchaser.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectionModal({ isOpen: false, type: 'demand', id: '', reference: '', remark: '' })}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRejection}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Confirm Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
