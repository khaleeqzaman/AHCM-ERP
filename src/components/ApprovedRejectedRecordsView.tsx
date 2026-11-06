import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Calendar, 
  Eye, 
  EyeOff, 
  FileText, 
  ShoppingBag, 
  Printer, 
  RotateCcw,
  Check,
  X,
  FileCheck2,
  FileX2,
  SlidersHorizontal
} from 'lucide-react';
import { DemandDocument, PurchaseDocument, DemandItem, PurchaseSummaryItem } from '../types';
import { formatWholeNumber } from '../utils/formatters';

interface ApprovedRejectedRecordsViewProps {
  demands: DemandDocument[];
  purchases: PurchaseDocument[];
  onNavigateToDemands?: () => void;
  onNavigateToPurchases?: () => void;
}

export type RecordSortField = 'date' | 'reference' | 'amount' | 'status' | 'type';

export const ApprovedRejectedRecordsView: React.FC<ApprovedRejectedRecordsViewProps> = ({
  demands,
  purchases,
  onNavigateToDemands,
  onNavigateToPurchases,
}) => {
  const [activeTab, setActiveTab] = useState<'demands' | 'purchases'>('demands');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Approved' | 'Rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [sortField, setSortField] = useState<RecordSortField>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  // Demand records calculation
  const approvedDemands = useMemo(() => demands.filter((d) => d.status === 'Approved'), [demands]);
  const rejectedDemands = useMemo(() => demands.filter((d) => d.status === 'Rejected'), [demands]);
  const totalApprovedDemandsAmount = useMemo(
    () => approvedDemands.reduce((sum, d) => sum + d.totalAmount, 0),
    [approvedDemands]
  );
  const totalRejectedDemandsAmount = useMemo(
    () => rejectedDemands.reduce((sum, d) => sum + d.totalAmount, 0),
    [rejectedDemands]
  );

  // Purchase records calculation
  const approvedPurchases = useMemo(() => purchases.filter((p) => p.status === 'Approved'), [purchases]);
  const rejectedPurchases = useMemo(() => purchases.filter((p) => p.status === 'Rejected'), [purchases]);
  const totalApprovedPurchasesAmount = useMemo(
    () => approvedPurchases.reduce((sum, p) => sum + p.totalAmount, 0),
    [approvedPurchases]
  );
  const totalRejectedPurchasesAmount = useMemo(
    () => rejectedPurchases.reduce((sum, p) => sum + p.totalAmount, 0),
    [rejectedPurchases]
  );

  // Filtered Demands
  const filteredDemands = useMemo(() => {
    return demands
      .filter((d) => d.status === 'Approved' || d.status === 'Rejected')
      .filter((d) => {
        if (statusFilter !== 'all' && d.status !== statusFilter) return false;
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
        if (sortField === 'amount') {
          return sortOrder === 'asc' ? a.totalAmount - b.totalAmount : b.totalAmount - a.totalAmount;
        }
        if (sortField === 'status') {
          const cmp = a.status.localeCompare(b.status);
          return sortOrder === 'asc' ? cmp : -cmp;
        }
        if (sortField === 'type') {
          const cmp = a.demandType.localeCompare(b.demandType);
          return sortOrder === 'asc' ? cmp : -cmp;
        }
        return 0;
      });
  }, [demands, statusFilter, typeFilter, startDate, endDate, searchTerm, sortField, sortOrder]);

  // Filtered Purchases
  const filteredPurchases = useMemo(() => {
    return purchases
      .filter((p) => p.status === 'Approved' || p.status === 'Rejected')
      .filter((p) => {
        if (statusFilter !== 'all' && p.status !== statusFilter) return false;
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
        if (sortField === 'amount') {
          return sortOrder === 'asc' ? a.totalAmount - b.totalAmount : b.totalAmount - a.totalAmount;
        }
        if (sortField === 'status') {
          const cmp = a.status.localeCompare(b.status);
          return sortOrder === 'asc' ? cmp : -cmp;
        }
        if (sortField === 'type') {
          const cmp = a.paymentType.localeCompare(b.paymentType);
          return sortOrder === 'asc' ? cmp : -cmp;
        }
        return 0;
      });
  }, [purchases, statusFilter, typeFilter, startDate, endDate, searchTerm, sortField, sortOrder]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSort = (field: RecordSortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const renderSortIcon = (field: RecordSortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-blue-600" />
    ) : (
      <ArrowDown className="w-3 h-3 text-blue-600" />
    );
  };

  const resetFilters = () => {
    setStatusFilter('all');
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setTypeFilter('All');
    setSortField('date');
    setSortOrder('desc');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Approved Demands
            </span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <FileCheck2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {approvedDemands.length}
            </span>
            <span className="text-xs font-mono font-semibold text-emerald-700 tabular-nums">
              Rs. {formatWholeNumber(totalApprovedDemandsAmount)}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Requisitions approved by executive review
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Rejected Demands
            </span>
            <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <FileX2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {rejectedDemands.length}
            </span>
            <span className="text-xs font-mono font-semibold text-rose-700 tabular-nums">
              Rs. {formatWholeNumber(totalRejectedDemandsAmount)}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Demands returned or disapproved
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Approved Orders
            </span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {approvedPurchases.length}
            </span>
            <span className="text-xs font-mono font-semibold text-emerald-700 tabular-nums">
              Rs. {formatWholeNumber(totalApprovedPurchasesAmount)}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Purchase summaries authorized for payment
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Rejected Orders
            </span>
            <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <XCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {rejectedPurchases.length}
            </span>
            <span className="text-xs font-mono font-semibold text-rose-700 tabular-nums">
              Rs. {formatWholeNumber(totalRejectedPurchasesAmount)}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Purchase orders disapproved during audit
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {/* Module Switcher Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                Decision History
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500">Approved & Rejected Records</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">
              {activeTab === 'demands' ? 'Demand Requisitions' : 'Purchase Orders & Summaries'}
            </h2>
            <p className="text-xs text-slate-500">
              Browse approved and rejected documentation with itemized lines, remarks, and audit trails.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Primary Document Type Toggle */}
            <div className="flex items-center p-1 bg-slate-200/70 rounded-lg border border-slate-300/60">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('demands');
                  setTypeFilter('All');
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  activeTab === 'demands'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Demands</span>
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700">
                  {approvedDemands.length + rejectedDemands.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('purchases');
                  setTypeFilter('All');
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  activeTab === 'purchases'
                    ? 'bg-white text-purple-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Purchase Orders</span>
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700">
                  {approvedPurchases.length + rejectedPurchases.length}
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print View</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 bg-white border-b border-slate-200 space-y-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Status Segmented Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
              <span className="text-xs font-medium text-slate-500 mr-1">Decision:</span>
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  statusFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Decisions ({activeTab === 'demands' ? approvedDemands.length + rejectedDemands.length : approvedPurchases.length + rejectedPurchases.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('Approved')}
                className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  statusFilter === 'Approved'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approved ({activeTab === 'demands' ? approvedDemands.length : approvedPurchases.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('Rejected')}
                className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  statusFilter === 'Rejected'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Rejected ({activeTab === 'demands' ? rejectedDemands.length : rejectedPurchases.length})</span>
              </button>
            </div>

            {/* Live Search Input */}
            <div className="relative min-w-[260px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={activeTab === 'demands' ? 'Search reference, item, remarks...' : 'Search reference, company, item...'}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Sub-Filters: Date Range & Type */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              {/* Type Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">
                  {activeTab === 'demands' ? 'Demand Type:' : 'Payment Type:'}
                </span>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-slate-200 rounded-md bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

              {/* Date Filters */}
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

            {(searchTerm || startDate || endDate || typeFilter !== 'All' || statusFilter !== 'all') && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Demands Table View */}
        {activeTab === 'demands' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider select-none">
                  <th className="py-3 px-3 w-12 text-center">Sr.</th>
                  <th
                    onClick={() => handleSort('date')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors"
                  >
                    <div className="inline-flex items-center gap-1">
                      <span>Date</span>
                      {renderSortIcon('date')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('reference')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors"
                  >
                    <div className="inline-flex items-center gap-1">
                      <span>Reference No.</span>
                      {renderSortIcon('reference')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('type')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors"
                  >
                    <div className="inline-flex items-center gap-1">
                      <span>Type</span>
                      {renderSortIcon('type')}
                    </div>
                  </th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Items</th>
                  <th
                    onClick={() => handleSort('amount')}
                    className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100/80 transition-colors"
                  >
                    <div className="inline-flex items-center justify-end gap-1 w-full">
                      <span>Total Amount</span>
                      {renderSortIcon('amount')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('status')}
                    className="py-3 px-4 text-center cursor-pointer hover:bg-slate-100/80 transition-colors"
                  >
                    <div className="inline-flex items-center justify-center gap-1">
                      <span>Decision Status</span>
                      {renderSortIcon('status')}
                    </div>
                  </th>
                  <th className="py-3 px-4">Admin Remarks</th>
                  <th className="py-3 px-4 text-center">Itemized Line</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDemands.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-500 font-sans">
                      <FileCheck2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">No approved or rejected demands found</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {demands.length === 0
                          ? 'No demands have been recorded yet.'
                          : 'Try modifying your search or filter options.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredDemands.map((demand, idx) => {
                    const isExpanded = !!expandedIds[demand.id];
                    const isApproved = demand.status === 'Approved';

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
                                isApproved
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {isApproved ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              )}
                              <span>{demand.status}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 text-[11px] max-w-[200px] truncate">
                            {demand.adminRemark ? (
                              <span title={demand.adminRemark}>{demand.adminRemark}</span>
                            ) : (
                              <span className="text-slate-400 italic">No remark</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => toggleExpand(demand.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                            >
                              {isExpanded ? (
                                <>
                                  <EyeOff className="w-3 h-3" />
                                  <span>Hide</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3 h-3" />
                                  <span>Items</span>
                                </>
                              )}
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-slate-50/70 border-b border-slate-200">
                            <td colSpan={10} className="p-4 pl-12 pr-6">
                              <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs space-y-2">
                                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                                  <div className="text-xs font-semibold text-slate-800">
                                    Itemized Requirements for Demand {demand.referenceNo}
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    Decision: <strong className={isApproved ? 'text-emerald-700' : 'text-rose-700'}>{demand.status}</strong>
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

        {/* Purchase Orders Table View */}
        {activeTab === 'purchases' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider select-none">
                  <th className="py-3 px-3 w-12 text-center">Sr.</th>
                  <th
                    onClick={() => handleSort('date')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors"
                  >
                    <div className="inline-flex items-center gap-1">
                      <span>Date</span>
                      {renderSortIcon('date')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('reference')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors"
                  >
                    <div className="inline-flex items-center gap-1">
                      <span>Reference</span>
                      {renderSortIcon('reference')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('type')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors"
                  >
                    <div className="inline-flex items-center gap-1">
                      <span>Payment</span>
                      {renderSortIcon('type')}
                    </div>
                  </th>
                  <th className="py-3 px-4 text-center">Items</th>
                  <th
                    onClick={() => handleSort('amount')}
                    className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100/80 transition-colors"
                  >
                    <div className="inline-flex items-center justify-end gap-1 w-full">
                      <span>Total Amount</span>
                      {renderSortIcon('amount')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('status')}
                    className="py-3 px-4 text-center cursor-pointer hover:bg-slate-100/80 transition-colors"
                  >
                    <div className="inline-flex items-center justify-center gap-1">
                      <span>Decision Status</span>
                      {renderSortIcon('status')}
                    </div>
                  </th>
                  <th className="py-3 px-4">Admin Remarks</th>
                  <th className="py-3 px-4 text-center">Itemized Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500 font-sans">
                      <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">No approved or rejected purchase orders found</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {purchases.length === 0
                          ? 'No purchase summaries recorded yet.'
                          : 'Try modifying your search or filter options.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredPurchases.map((purchase, idx) => {
                    const isExpanded = !!expandedIds[purchase.id];
                    const isApproved = purchase.status === 'Approved';

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
                                isApproved
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {isApproved ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              )}
                              <span>{purchase.status}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 text-[11px] max-w-[200px] truncate">
                            {purchase.adminRemark ? (
                              <span title={purchase.adminRemark}>{purchase.adminRemark}</span>
                            ) : (
                              <span className="text-slate-400 italic">No remark</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => toggleExpand(purchase.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                            >
                              {isExpanded ? (
                                <>
                                  <EyeOff className="w-3 h-3" />
                                  <span>Hide</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3 h-3" />
                                  <span>Items</span>
                                </>
                              )}
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-slate-50/70 border-b border-slate-200">
                            <td colSpan={9} className="p-4 pl-12 pr-6">
                              <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs space-y-2">
                                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                                  <div className="text-xs font-semibold text-slate-800">
                                    Itemized Vendors & Articles for {purchase.reference} (Payment: {purchase.paymentType})
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    Decision: <strong className={isApproved ? 'text-emerald-700' : 'text-rose-700'}>{purchase.status}</strong>
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
    </div>
  );
};
