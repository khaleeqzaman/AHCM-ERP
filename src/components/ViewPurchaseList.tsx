import React, { useState, useMemo } from 'react';
import { 
  ShoppingBag, 
  ChevronDown, 
  ChevronRight, 
  Send, 
  CheckCircle, 
  Edit3, 
  Plus, 
  Trash2, 
  Search, 
  Filter,
  Lock,
  Unlock,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw
} from 'lucide-react';
import { PurchaseDocument, PurchaseSummaryItem, DocumentStatus, PaymentType } from '../types';

interface ViewPurchaseListProps {
  purchases: PurchaseDocument[];
  onEditPurchase: (purchase: PurchaseDocument) => void;
  onFinalizePurchase: (id: string) => void;
  onSubmitPurchase: (id: string) => void;
  onSubmitMultiplePurchases: (ids: string[]) => void;
  onUpdatePurchaseItems: (id: string, updatedItems: PurchaseSummaryItem[]) => void;
  onDeletePurchase?: (id: string) => void;
  onNavigateToCreate: () => void;
}

export type PurchaseSortField = 'none' | 'paymentType' | 'date' | 'totalAmount' | 'reference';

export const ViewPurchaseList: React.FC<ViewPurchaseListProps> = ({
  purchases,
  onEditPurchase,
  onFinalizePurchase,
  onSubmitPurchase,
  onSubmitMultiplePurchases,
  onUpdatePurchaseItems,
  onDeletePurchase,
  onNavigateToCreate,
}) => {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [selectedFinalizedIds, setSelectedFinalizedIds] = useState<string[]>([]);
  const [confirmDeletePurchase, setConfirmDeletePurchase] = useState<PurchaseDocument | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>('All');
  const [sortField, setSortField] = useState<PurchaseSortField>('none');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [notification, setNotification] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAll = (expand: boolean) => {
    const map: Record<string, boolean> = {};
    purchases.forEach((p) => {
      map[p.id] = expand;
    });
    setExpandedIds(map);
  };

  // Sort toggle handler for column headers
  const handleSort = (field: PurchaseSortField) => {
    if (sortField === field) {
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else {
        setSortField('none');
        setSortOrder('asc');
      }
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const renderSortIcon = (field: PurchaseSortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60 group-hover:opacity-100" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-blue-600" />
    ) : (
      <ArrowDown className="w-3 h-3 text-blue-600" />
    );
  };

  const hasActiveFilters =
    searchTerm !== '' ||
    statusFilter !== 'All' ||
    paymentTypeFilter !== 'All' ||
    sortField !== 'none';

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setPaymentTypeFilter('All');
    setSortField('none');
    setSortOrder('asc');
  };

  // Filtered & Sorted Purchases
  const filteredPurchases = useMemo(() => {
    return [...purchases]
      .filter((p) => {
        const matchesSearch =
          p.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.paymentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.items.some(
            (i) =>
              i.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
              i.itemName.toLowerCase().includes(searchTerm.toLowerCase())
          );
        const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
        const matchesPaymentType = paymentTypeFilter === 'All' || p.paymentType === paymentTypeFilter;
        return matchesSearch && matchesStatus && matchesPaymentType;
      })
      .sort((a, b) => {
        if (sortField === 'paymentType') {
          // Cash vs Cheque
          const cmp = a.paymentType.localeCompare(b.paymentType);
          return sortOrder === 'asc' ? cmp : -cmp;
        }
        if (sortField === 'date') {
          const cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
          return sortOrder === 'asc' ? cmp : -cmp;
        }
        if (sortField === 'totalAmount') {
          return sortOrder === 'asc' ? a.totalAmount - b.totalAmount : b.totalAmount - a.totalAmount;
        }
        if (sortField === 'reference') {
          const cmp = a.reference.localeCompare(b.reference);
          return sortOrder === 'asc' ? cmp : -cmp;
        }
        return 0;
      });
  }, [purchases, searchTerm, statusFilter, paymentTypeFilter, sortField, sortOrder]);

  const finalizedPurchases = filteredPurchases.filter((p) => p.status === 'Finalized');

  const handleSelectAllFinalized = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedFinalizedIds(finalizedPurchases.map((p) => p.id));
    } else {
      setSelectedFinalizedIds([]);
    }
  };

  const handleToggleSelectFinalized = (id: string) => {
    setSelectedFinalizedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBatchSubmit = () => {
    if (selectedFinalizedIds.length === 0) return;
    const count = selectedFinalizedIds.length;
    onSubmitMultiplePurchases(selectedFinalizedIds);
    setSelectedFinalizedIds([]);
    setNotification(`${count} finalized purchase summary/summaries submitted for Admin Approval.`);
    setTimeout(() => setNotification(null), 3000);
  };

  // Inline table edit handlers (for Draft status)
  const handleInlineItemChange = (
    purchase: PurchaseDocument,
    itemIndex: number,
    field: 'companyName' | 'itemName' | 'quantity' | 'amount' | 'remarks',
    val: string | number
  ) => {
    if (purchase.status !== 'Draft') return;

    const updated = purchase.items.map((item, idx) => {
      if (idx !== itemIndex) return item;
      const copy = { ...item };
      if (field === 'companyName') copy.companyName = String(val);
      else if (field === 'itemName') copy.itemName = String(val);
      else if (field === 'quantity') copy.quantity = Math.max(0, Number(val) || 0);
      else if (field === 'amount') copy.amount = Math.max(0, Number(val) || 0);
      else if (field === 'remarks') copy.remarks = String(val);
      return copy;
    });

    onUpdatePurchaseItems(purchase.id, updated);
  };

  const handleInlineAddRow = (purchase: PurchaseDocument) => {
    if (purchase.status !== 'Draft') return;
    const newRow: PurchaseSummaryItem = {
      id: `pi-${Date.now()}-${purchase.items.length + 1}`,
      srNo: purchase.items.length + 1,
      companyName: '',
      itemName: '',
      quantity: 1,
      amount: 0,
      remarks: '',
    };
    onUpdatePurchaseItems(purchase.id, [...purchase.items, newRow]);
  };

  const handleInlineDeleteRow = (purchase: PurchaseDocument, itemIndex: number) => {
    if (purchase.status !== 'Draft') return;
    if (purchase.items.length <= 1) return;
    const filtered = purchase.items.filter((_, idx) => idx !== itemIndex);
    const renumbered = filtered.map((it, idx) => ({ ...it, srNo: idx + 1 }));
    onUpdatePurchaseItems(purchase.id, renumbered);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Purchase Summaries
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">Document Listings</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            View Purchase Forms
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Review all purchase summaries, toggle itemized tables, edit drafts, and batch-submit finalized summaries.
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateToCreate}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Purchase Form</span>
        </button>
      </div>

      {/* Notifications */}
      {notification && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Search, Filter & Bulk Actions Bar */}
      <div className="bg-white p-3.5 border border-slate-200 rounded-xl shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search reference, company, item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
            />
          </div>

          {/* Quick Payment Type Filter Tabs / Pills: Cash & Cheque */}
          <div className="inline-flex p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setPaymentTypeFilter('All')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                paymentTypeFilter === 'All'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({purchases.length})
            </button>
            <button
              type="button"
              onClick={() => setPaymentTypeFilter('Cash')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                paymentTypeFilter === 'Cash'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              <span>Cash</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                paymentTypeFilter === 'Cash' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {purchases.filter((p) => p.paymentType === 'Cash').length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentTypeFilter('Cheque')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                paymentTypeFilter === 'Cheque'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-blue-700'
              }`}
            >
              <span>Cheque</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                paymentTypeFilter === 'Cheque' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {purchases.filter((p) => p.paymentType === 'Cheque').length}
              </span>
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`px-2.5 py-1.5 text-xs border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium transition-colors ${
                statusFilter !== 'All'
                  ? 'bg-blue-50 border-blue-300 text-blue-900 font-semibold'
                  : 'bg-slate-50 border-slate-300 text-slate-700'
              }`}
            >
              <option value="All">All Statuses ({purchases.length})</option>
              <option value="Draft">Drafts ({purchases.filter((p) => p.status === 'Draft').length})</option>
              <option value="Finalized">Finalized ({purchases.filter((p) => p.status === 'Finalized').length})</option>
              <option value="Submitted for Approval">Submitted ({purchases.filter((p) => p.status === 'Submitted for Approval').length})</option>
              <option value="Approved">Approved ({purchases.filter((p) => p.status === 'Approved').length})</option>
              <option value="Rejected">Rejected ({purchases.filter((p) => p.status === 'Rejected').length})</option>
            </select>
          </div>

          {/* Sort Selector Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden sm:inline">
              Sort:
            </span>
            <select
              value={
                sortField === 'none'
                  ? 'default'
                  : `${sortField}-${sortOrder}`
              }
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'default') {
                  setSortField('none');
                  setSortOrder('asc');
                } else {
                  const [field, order] = val.split('-') as [PurchaseSortField, 'asc' | 'desc'];
                  setSortField(field);
                  setSortOrder(order);
                }
              }}
              className={`px-2.5 py-1.5 text-xs border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium transition-colors ${
                sortField !== 'none'
                  ? 'bg-blue-50 border-blue-300 text-blue-900 font-semibold'
                  : 'bg-slate-50 border-slate-300 text-slate-700'
              }`}
            >
              <option value="default">Default Sort</option>
              <option value="paymentType-asc">Payment Type (Cash first)</option>
              <option value="paymentType-desc">Payment Type (Cheque first)</option>
              <option value="date-desc">Date (Newest first)</option>
              <option value="date-asc">Date (Oldest first)</option>
              <option value="totalAmount-desc">Total Amount (High → Low)</option>
              <option value="totalAmount-asc">Total Amount (Low → High)</option>
              <option value="reference-asc">Reference (A → Z)</option>
            </select>
          </div>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
              title="Reset all search, filters, and sorting"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}

          {/* Expand/Collapse All Actions */}
          <div className="flex items-center gap-1 ml-auto">
            <button
              type="button"
              onClick={() => toggleAll(true)}
              className="px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
            >
              Expand All
            </button>
            <span className="text-slate-300">·</span>
            <button
              type="button"
              onClick={() => toggleAll(false)}
              className="px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* 3.3 Batch Submission Action */}
        {selectedFinalizedIds.length > 0 && (
          <div className="flex items-center justify-between gap-2.5 bg-blue-50 border border-blue-200 px-3.5 py-2 rounded-lg">
            <span className="text-xs font-semibold text-blue-900">
              {selectedFinalizedIds.length} finalized purchase summary/summaries selected
            </span>
            <button
              type="button"
              onClick={handleBatchSubmit}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-xs cursor-pointer"
            >
              <Send className="w-3 h-3" />
              <span>Submit for Approval ({selectedFinalizedIds.length})</span>
            </button>
          </div>
        )}
      </div>

      {/* 5.2 View Purchase Forms Listing Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-3 w-10 text-center">
                  {finalizedPurchases.length > 0 && (
                    <input
                      type="checkbox"
                      title="Select all finalized purchase summaries"
                      checked={
                        selectedFinalizedIds.length === finalizedPurchases.length &&
                        finalizedPurchases.length > 0
                      }
                      onChange={handleSelectAllFinalized}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  )}
                </th>
                <th className="py-3 px-3 w-12 text-center">Sr.</th>

                {/* Date Header - Sortable */}
                <th className="py-3 px-4">
                  <button
                    type="button"
                    onClick={() => handleSort('date')}
                    className="group inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-blue-600 uppercase tracking-wider cursor-pointer"
                    title="Click to sort by Date"
                  >
                    <span>Date</span>
                    {renderSortIcon('date')}
                  </button>
                </th>

                {/* Reference Header - Sortable */}
                <th className="py-3 px-4">
                  <button
                    type="button"
                    onClick={() => handleSort('reference')}
                    className="group inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-blue-600 uppercase tracking-wider cursor-pointer"
                    title="Click to sort by Reference"
                  >
                    <span>Reference</span>
                    {renderSortIcon('reference')}
                  </button>
                </th>

                {/* Payment Type Header - Sortable (Cash vs Cheque) */}
                <th className="py-3 px-4">
                  <button
                    type="button"
                    onClick={() => handleSort('paymentType')}
                    className="group inline-flex items-center gap-1.5 font-semibold text-slate-800 hover:text-blue-600 uppercase tracking-wider cursor-pointer"
                    title="Click to sort by Payment Type (Cash / Cheque)"
                  >
                    <span className={sortField === 'paymentType' ? 'text-blue-700 font-bold' : ''}>
                      Payment Type (Cash / Cheque)
                    </span>
                    {renderSortIcon('paymentType')}
                  </button>
                </th>

                <th className="py-3 px-4 text-center">No. of Items</th>

                {/* Total Amount Header - Sortable */}
                <th className="py-3 px-4 text-right">
                  <button
                    type="button"
                    onClick={() => handleSort('totalAmount')}
                    className="group inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-blue-600 uppercase tracking-wider cursor-pointer ml-auto"
                    title="Click to sort by Total Amount"
                  >
                    <span>Total Amount</span>
                    {renderSortIcon('totalAmount')}
                  </button>
                </th>

                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Itemized Table</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    No purchase summaries match current filters. Click "New Purchase Form" to create one.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((purchase, index) => {
                  const isExpanded = !!expandedIds[purchase.id];
                  const isFinalized = purchase.status === 'Finalized';
                  const isDraft = purchase.status === 'Draft';
                  const isSelected = selectedFinalizedIds.includes(purchase.id);

                  return (
                    <React.Fragment key={purchase.id}>
                      <tr
                        className={`hover:bg-slate-50/60 transition-colors ${
                          isExpanded ? 'bg-slate-50/40' : ''
                        }`}
                      >
                        <td className="py-3 px-3 text-center">
                          {isFinalized ? (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectFinalized(purchase.id)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          ) : (
                            <span className="text-slate-200">·</span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center font-mono text-slate-500">
                          {index + 1}
                        </td>

                        <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                          {purchase.date}
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                          {purchase.reference}
                        </td>

                        <td className="py-3 px-4 text-slate-700 whitespace-nowrap font-medium">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] ${
                              purchase.paymentType === 'Cash'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-800 border border-slate-200'
                            }`}
                          >
                            {purchase.paymentType}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-700">
                          {purchase.items.length}
                        </td>

                        <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900 whitespace-nowrap">
                          {purchase.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                              purchase.status === 'Draft'
                                ? 'bg-slate-100 text-slate-700 border border-slate-200'
                                : purchase.status === 'Finalized'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : purchase.status === 'Submitted for Approval'
                                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                : purchase.status === 'Approved'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {purchase.status === 'Draft' && <Unlock className="w-3 h-3 text-slate-400" />}
                            {purchase.status === 'Finalized' && <Lock className="w-3 h-3 text-amber-600" />}
                            {purchase.status === 'Submitted for Approval' && <Send className="w-3 h-3 text-blue-600" />}
                            {purchase.status}
                          </span>
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
                                <span>Hide Items</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-3 h-3" />
                                <span>Show Items</span>
                              </>
                            )}
                          </button>
                        </td>

                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            {isDraft && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => onEditPurchase(purchase)}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-50 border border-blue-200 rounded transition-colors cursor-pointer"
                                  title="Edit full form"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onFinalizePurchase(purchase.id)}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-amber-800 hover:bg-amber-50 border border-amber-300 rounded transition-colors cursor-pointer"
                                  title="Finalize to lock"
                                >
                                  <CheckCircle className="w-3 h-3 text-amber-600" />
                                  <span>Finalize</span>
                                </button>
                              </>
                            )}

                            {isFinalized && (
                              <button
                                type="button"
                                onClick={() => onSubmitPurchase(purchase.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors shadow-xs cursor-pointer"
                              >
                                <Send className="w-3 h-3" />
                                <span>Submit</span>
                              </button>
                            )}

                            {purchase.status === 'Submitted for Approval' && (
                              <span className="text-[11px] text-blue-600 font-medium italic">
                                In Admin Review
                              </span>
                            )}

                            {purchase.status === 'Approved' && (
                              <span className="text-[11px] text-emerald-700 font-semibold">
                                ✓ Approved
                              </span>
                            )}

                            {purchase.status === 'Rejected' && (
                              <span className="text-[11px] text-rose-700 font-semibold">
                                ✕ Rejected
                              </span>
                            )}

                            {/* Delete Option */}
                            <button
                              type="button"
                              onClick={() => setConfirmDeletePurchase(purchase)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-rose-700 hover:text-white hover:bg-rose-600 border border-rose-200 rounded transition-colors cursor-pointer"
                              title="Delete purchase summary"
                            >
                              <Trash2 className="w-3 h-3 text-rose-600 group-hover:text-white" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* 4.2 Purchase Itemized Table (Expandable & Editable for Drafts) */}
                      {isExpanded && (
                        <tr className="bg-slate-50/70 border-b border-slate-200">
                          <td colSpan={10} className="p-4 pl-12 pr-6">
                            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3">
                              {/* Header: Date, Reference */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 text-xs">
                                <div className="flex items-center gap-4">
                                  <span className="font-semibold text-slate-800">
                                    Itemized Table for Ref: <span className="font-mono text-blue-700">{purchase.reference}</span>
                                  </span>
                                  <span className="text-slate-300">·</span>
                                  <span className="text-slate-600">
                                    Date: <span className="font-mono">{purchase.date}</span>
                                  </span>
                                  <span className="text-slate-300">·</span>
                                  <span className="text-slate-600">
                                    Payment: <span className="font-medium">{purchase.paymentType}</span>
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  {isDraft ? (
                                    <>
                                      <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                        Editable Table Mode (Draft)
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleInlineAddRow(purchase)}
                                        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 border border-blue-200 rounded cursor-pointer"
                                      >
                                        <Plus className="w-3 h-3" />
                                        <span>Add Row</span>
                                      </button>
                                    </>
                                  ) : (
                                    <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                                      <Lock className="w-3 h-3 text-slate-400" />
                                      Locked ({purchase.status})
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Columns: Sr. No., Company Name, Item Name, Quantity, Amount, Remarks */}
                              <div className="border border-slate-200 rounded-md overflow-hidden">
                                <table className="w-full text-left border-collapse text-xs">
                                  <thead>
                                    <tr className="bg-slate-50 text-[11px] font-semibold text-slate-600 border-b border-slate-200">
                                      <th className="py-2 px-3 w-16 text-center">Sr. No.</th>
                                      <th className="py-2 px-3 w-48">Company Name</th>
                                      <th className="py-2 px-3">Item Name</th>
                                      <th className="py-2 px-3 w-24 text-right">Quantity</th>
                                      <th className="py-2 px-3 w-32 text-right">Amount</th>
                                      <th className="py-2 px-3 w-48">Remarks</th>
                                      {isDraft && <th className="py-2 px-2 w-12 text-center"></th>}
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {purchase.items.map((it, idx) => (
                                      <tr key={it.id} className="hover:bg-slate-50/40">
                                        <td className="py-2 px-3 text-center font-mono text-slate-500 font-medium">
                                          {it.srNo}
                                        </td>
                                        <td className="py-2 px-3">
                                          {isDraft ? (
                                            <input
                                              type="text"
                                              value={it.companyName}
                                              onChange={(e) =>
                                                handleInlineItemChange(
                                                  purchase,
                                                  idx,
                                                  'companyName',
                                                  e.target.value
                                                )
                                              }
                                              className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-300 rounded focus:bg-white text-slate-900"
                                            />
                                          ) : (
                                            <span className="font-semibold text-slate-800">
                                              {it.companyName}
                                            </span>
                                          )}
                                        </td>
                                        <td className="py-2 px-3">
                                          {isDraft ? (
                                            <input
                                              type="text"
                                              value={it.itemName}
                                              onChange={(e) =>
                                                handleInlineItemChange(
                                                  purchase,
                                                  idx,
                                                  'itemName',
                                                  e.target.value
                                                )
                                              }
                                              className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-300 rounded focus:bg-white text-slate-900"
                                            />
                                          ) : (
                                            <span className="text-slate-800">
                                              {it.itemName}
                                            </span>
                                          )}
                                        </td>
                                        <td className="py-2 px-3 text-right">
                                          {isDraft ? (
                                            <input
                                              type="number"
                                              min="1"
                                              value={it.quantity}
                                              onChange={(e) =>
                                                handleInlineItemChange(
                                                  purchase,
                                                  idx,
                                                  'quantity',
                                                  e.target.value
                                                )
                                              }
                                              className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-300 rounded focus:bg-white text-right font-mono tabular-nums"
                                            />
                                          ) : (
                                            <span className="font-mono tabular-nums text-slate-700">
                                              {it.quantity}
                                            </span>
                                          )}
                                        </td>
                                        <td className="py-2 px-3 text-right">
                                          {isDraft ? (
                                            <input
                                              type="number"
                                              min="0"
                                              step="0.01"
                                              value={it.amount}
                                              onChange={(e) =>
                                                handleInlineItemChange(
                                                  purchase,
                                                  idx,
                                                  'amount',
                                                  e.target.value
                                                )
                                              }
                                              className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-300 rounded focus:bg-white text-right font-mono tabular-nums font-semibold"
                                            />
                                          ) : (
                                            <span className="font-mono tabular-nums font-semibold text-slate-900">
                                              {it.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                          )}
                                        </td>
                                        <td className="py-2 px-3">
                                          {isDraft ? (
                                            <input
                                              type="text"
                                              value={it.remarks}
                                              onChange={(e) =>
                                                handleInlineItemChange(
                                                  purchase,
                                                  idx,
                                                  'remarks',
                                                  e.target.value
                                                )
                                              }
                                              className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-300 rounded focus:bg-white text-slate-900"
                                            />
                                          ) : (
                                            <span className="text-slate-500 text-[11px]">
                                              {it.remarks || '—'}
                                            </span>
                                          )}
                                        </td>
                                        {isDraft && (
                                          <td className="py-2 px-2 text-center">
                                            <button
                                              type="button"
                                              disabled={purchase.items.length <= 1}
                                              onClick={() => handleInlineDeleteRow(purchase, idx)}
                                              className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-20 cursor-pointer"
                                              title="Delete row"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </td>
                                        )}
                                      </tr>
                                    ))}
                                  </tbody>
                                  <tfoot>
                                    <tr className="bg-slate-50 border-t-2 border-slate-200 font-semibold">
                                      <td colSpan={4} className="py-2 px-4 text-right text-slate-700 text-[11px] uppercase tracking-wider">
                                        Total Amount:
                                      </td>
                                      <td className="py-2 px-3 text-right font-mono tabular-nums text-blue-700 font-bold">
                                        {purchase.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </td>
                                      <td colSpan={isDraft ? 2 : 1}></td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
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

      {/* Delete Confirmation Modal */}
      {confirmDeletePurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-left space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Delete Purchase Summary?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Are you sure you want to delete this purchase summary? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Reference:</span>
                <span className="font-mono font-bold text-slate-900">{confirmDeletePurchase.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date & Payment:</span>
                <span className="text-slate-800">{confirmDeletePurchase.date} · {confirmDeletePurchase.paymentType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Items:</span>
                <span className="font-mono text-slate-800">{confirmDeletePurchase.items.length} items</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold">
                <span className="text-slate-700">Total Amount:</span>
                <span className="font-mono text-rose-600">PKR {confirmDeletePurchase.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Status:</span>
                <span className="font-medium text-slate-700">{confirmDeletePurchase.status}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeletePurchase(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeletePurchase && confirmDeletePurchase) {
                    onDeletePurchase(confirmDeletePurchase.id);
                  }
                  setConfirmDeletePurchase(null);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete Purchase</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
