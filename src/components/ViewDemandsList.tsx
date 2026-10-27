import React, { useState } from 'react';
import { 
  FileText, 
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
  EyeOff
} from 'lucide-react';
import { DemandDocument, DemandItem, DocumentStatus } from '../types';

interface ViewDemandsListProps {
  demands: DemandDocument[];
  onEditDemand: (demand: DemandDocument) => void;
  onFinalizeDemand: (id: string) => void;
  onSubmitDemand: (id: string) => void;
  onSubmitMultipleDemands: (ids: string[]) => void;
  onUpdateDemandItems: (id: string, updatedItems: DemandItem[]) => void;
  onNavigateToCreate: () => void;
}

export const ViewDemandsList: React.FC<ViewDemandsListProps> = ({
  demands,
  onEditDemand,
  onFinalizeDemand,
  onSubmitDemand,
  onSubmitMultipleDemands,
  onUpdateDemandItems,
  onNavigateToCreate,
}) => {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [selectedFinalizedIds, setSelectedFinalizedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [notification, setNotification] = useState<string | null>(null);

  // Toggle itemized table expansion
  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Expand all / Collapse all
  const toggleAll = (expand: boolean) => {
    const map: Record<string, boolean> = {};
    demands.forEach((d) => {
      map[d.id] = expand;
    });
    setExpandedIds(map);
  };

  // Filtered demands
  const filteredDemands = demands.filter((d) => {
    const matchesSearch =
      d.referenceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.items.some((i) => i.itemName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      d.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Finalized demands eligible for selection
  const finalizedDemands = filteredDemands.filter((d) => d.status === 'Finalized');

  const handleSelectAllFinalized = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedFinalizedIds(finalizedDemands.map((d) => d.id));
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
    onSubmitMultipleDemands(selectedFinalizedIds);
    setSelectedFinalizedIds([]);
    setNotification(`${count} finalized demand(s) successfully submitted for Admin Approval.`);
    setTimeout(() => setNotification(null), 3000);
  };

  // Inline table edit handlers (for Draft status per Section 4)
  const handleInlineItemChange = (
    demand: DemandDocument,
    itemIndex: number,
    field: 'itemName' | 'quantity' | 'rate',
    val: string | number
  ) => {
    if (demand.status !== 'Draft') return; // Only drafts are editable

    const updated = demand.items.map((item, idx) => {
      if (idx !== itemIndex) return item;
      const copy = { ...item };
      if (field === 'itemName') {
        copy.itemName = String(val);
      } else if (field === 'quantity') {
        const q = Math.max(0, Number(val) || 0);
        copy.quantity = q;
        copy.amount = Number((q * copy.rate).toFixed(2));
      } else if (field === 'rate') {
        const r = Math.max(0, Number(val) || 0);
        copy.rate = r;
        copy.amount = Number((copy.quantity * r).toFixed(2));
      }
      return copy;
    });

    onUpdateDemandItems(demand.id, updated);
  };

  const handleInlineAddRow = (demand: DemandDocument) => {
    if (demand.status !== 'Draft') return;
    const newRow: DemandItem = {
      id: `di-${Date.now()}-${demand.items.length + 1}`,
      srNo: demand.items.length + 1,
      itemName: '',
      quantity: 1,
      rate: 0,
      amount: 0,
    };
    onUpdateDemandItems(demand.id, [...demand.items, newRow]);
  };

  const handleInlineDeleteRow = (demand: DemandDocument, itemIndex: number) => {
    if (demand.status !== 'Draft') return;
    if (demand.items.length <= 1) return;
    const filtered = demand.items.filter((_, idx) => idx !== itemIndex);
    const renumbered = filtered.map((it, idx) => ({ ...it, srNo: idx + 1 }));
    onUpdateDemandItems(demand.id, renumbered);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Demand Registry
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">Document Listings</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            View Demand Forms
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Review all daily and monthly demands, toggle itemized tables, edit drafts, and batch-submit finalized demands.
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateToCreate}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Demand Form</span>
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
      <div className="bg-white p-3.5 border border-slate-200 rounded-xl shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search reference no., items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-700 font-medium"
            >
              <option value="All">All Statuses ({demands.length})</option>
              <option value="Draft">Drafts ({demands.filter((d) => d.status === 'Draft').length})</option>
              <option value="Finalized">Finalized ({demands.filter((d) => d.status === 'Finalized').length})</option>
              <option value="Submitted for Approval">Submitted ({demands.filter((d) => d.status === 'Submitted for Approval').length})</option>
              <option value="Approved">Approved ({demands.filter((d) => d.status === 'Approved').length})</option>
              <option value="Rejected">Rejected ({demands.filter((d) => d.status === 'Rejected').length})</option>
            </select>
          </div>

          <div className="flex items-center gap-1 ml-auto">
            <button
              type="button"
              onClick={() => toggleAll(true)}
              className="px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
            >
              Expand All
            </button>
            <span className="text-slate-300">·</span>
            <button
              type="button"
              onClick={() => toggleAll(false)}
              className="px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* 2.4 Batch Submission Action */}
        {selectedFinalizedIds.length > 0 && (
          <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg shrink-0">
            <span className="text-xs font-semibold text-blue-900">
              {selectedFinalizedIds.length} Selected
            </span>
            <button
              type="button"
              onClick={handleBatchSubmit}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-xs cursor-pointer"
            >
              <Send className="w-3 h-3" />
              <span>Submit for Approval</span>
            </button>
          </div>
        )}
      </div>

      {/* 5.1 Demands Listing Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-3 w-10 text-center">
                  {finalizedDemands.length > 0 && (
                    <input
                      type="checkbox"
                      title="Select all finalized demands"
                      checked={
                        selectedFinalizedIds.length === finalizedDemands.length &&
                        finalizedDemands.length > 0
                      }
                      onChange={handleSelectAllFinalized}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  )}
                </th>
                <th className="py-3 px-3 w-12 text-center">Sr.</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Reference No.</th>
                <th className="py-3 px-4">Demand Type</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">No. of Items</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Itemized Table</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDemands.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500">
                    No demands match the current filters. Click "New Demand Form" to create one.
                  </td>
                </tr>
              ) : (
                filteredDemands.map((demand, index) => {
                  const isExpanded = !!expandedIds[demand.id];
                  const isFinalized = demand.status === 'Finalized';
                  const isDraft = demand.status === 'Draft';
                  const isSelected = selectedFinalizedIds.includes(demand.id);

                  return (
                    <React.Fragment key={demand.id}>
                      <tr
                        className={`hover:bg-slate-50/60 transition-colors ${
                          isExpanded ? 'bg-slate-50/40' : ''
                        }`}
                      >
                        {/* Checkbox (Only enabled for Finalized per Section 2.4) */}
                        <td className="py-3 px-3 text-center">
                          {isFinalized ? (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectFinalized(demand.id)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          ) : (
                            <span className="text-slate-200">·</span>
                          )}
                        </td>

                        {/* Sr. Auto */}
                        <td className="py-3 px-3 text-center font-mono text-slate-500">
                          {index + 1}
                        </td>

                        {/* Date */}
                        <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                          {demand.date}
                        </td>

                        {/* Reference No. */}
                        <td className="py-3 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                          {demand.referenceNo}
                        </td>

                        {/* Demand Type */}
                        <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                          <span
                            className={`inline-block font-medium ${
                              demand.demandType === 'Daily'
                                ? 'text-indigo-700'
                                : 'text-purple-700'
                            }`}
                          >
                            {demand.demandType}
                          </span>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                          {demand.category}
                        </td>

                        {/* No. of Items */}
                        <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-700">
                          {demand.items.length}
                        </td>

                        {/* Total Amount */}
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900 whitespace-nowrap">
                          {demand.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                              demand.status === 'Draft'
                                ? 'bg-slate-100 text-slate-700 border border-slate-200'
                                : demand.status === 'Finalized'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : demand.status === 'Submitted for Approval'
                                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                : demand.status === 'Approved'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {demand.status === 'Draft' && <Unlock className="w-3 h-3 text-slate-400" />}
                            {demand.status === 'Finalized' && <Lock className="w-3 h-3 text-amber-600" />}
                            {demand.status === 'Submitted for Approval' && <Send className="w-3 h-3 text-blue-600" />}
                            {demand.status}
                          </span>
                        </td>

                        {/* Show / Hide Itemized Table */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => toggleExpand(demand.id)}
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

                        {/* Row Actions by Status */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            {isDraft && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => onEditDemand(demand)}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-50 border border-blue-200 rounded transition-colors cursor-pointer"
                                  title="Edit full form"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onFinalizeDemand(demand.id)}
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
                                onClick={() => onSubmitDemand(demand.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors shadow-xs cursor-pointer"
                              >
                                <Send className="w-3 h-3" />
                                <span>Submit</span>
                              </button>
                            )}

                            {demand.status === 'Submitted for Approval' && (
                              <span className="text-[11px] text-blue-600 font-medium italic">
                                In Admin Review
                              </span>
                            )}

                            {demand.status === 'Approved' && (
                              <span className="text-[11px] text-emerald-700 font-semibold">
                                ✓ Approved
                              </span>
                            )}

                            {demand.status === 'Rejected' && (
                              <span className="text-[11px] text-rose-700 font-semibold">
                                ✕ Rejected
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* 4.1 Demand Itemized Table (Expandable & Editable for Drafts) */}
                      {isExpanded && (
                        <tr className="bg-slate-50/70 border-b border-slate-200">
                          <td colSpan={11} className="p-4 pl-12 pr-6">
                            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3">
                              {/* Itemized Table Header: Date, Reference No. */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 text-xs">
                                <div className="flex items-center gap-4">
                                  <span className="font-semibold text-slate-800">
                                    Itemized Table for Ref: <span className="font-mono text-blue-700">{demand.referenceNo}</span>
                                  </span>
                                  <span className="text-slate-300">·</span>
                                  <span className="text-slate-600">
                                    Date: <span className="font-mono">{demand.date}</span>
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
                                        onClick={() => handleInlineAddRow(demand)}
                                        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 border border-blue-200 rounded cursor-pointer"
                                      >
                                        <Plus className="w-3 h-3" />
                                        <span>Add Row</span>
                                      </button>
                                    </>
                                  ) : (
                                    <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                                      <Lock className="w-3 h-3 text-slate-400" />
                                      Locked ({demand.status})
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Columns: Sr. No., Item Name, Quantity, Rate, Amount (= Quantity x Rate) */}
                              <div className="border border-slate-200 rounded-md overflow-hidden">
                                <table className="w-full text-left border-collapse text-xs">
                                  <thead>
                                    <tr className="bg-slate-50 text-[11px] font-semibold text-slate-600 border-b border-slate-200">
                                      <th className="py-2 px-3 w-16 text-center">Sr. No.</th>
                                      <th className="py-2 px-3">Item Name</th>
                                      <th className="py-2 px-3 w-28 text-right">Quantity</th>
                                      <th className="py-2 px-3 w-28 text-right">Rate</th>
                                      <th className="py-2 px-3 w-32 text-right">Amount</th>
                                      {isDraft && <th className="py-2 px-2 w-12 text-center"></th>}
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {demand.items.map((it, idx) => (
                                      <tr key={it.id} className="hover:bg-slate-50/40">
                                        <td className="py-2 px-3 text-center font-mono text-slate-500 font-medium">
                                          {it.srNo}
                                        </td>
                                        <td className="py-2 px-3">
                                          {isDraft ? (
                                            <input
                                              type="text"
                                              value={it.itemName}
                                              onChange={(e) =>
                                                handleInlineItemChange(
                                                  demand,
                                                  idx,
                                                  'itemName',
                                                  e.target.value
                                                )
                                              }
                                              className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-300 rounded focus:bg-white focus:ring-1 focus:ring-blue-500 text-slate-900"
                                            />
                                          ) : (
                                            <span className="font-medium text-slate-800">
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
                                                  demand,
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
                                              value={it.rate}
                                              onChange={(e) =>
                                                handleInlineItemChange(
                                                  demand,
                                                  idx,
                                                  'rate',
                                                  e.target.value
                                                )
                                              }
                                              className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-300 rounded focus:bg-white text-right font-mono tabular-nums"
                                            />
                                          ) : (
                                            <span className="font-mono tabular-nums text-slate-700">
                                              {it.rate.toFixed(2)}
                                            </span>
                                          )}
                                        </td>
                                        <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                                          {it.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        {isDraft && (
                                          <td className="py-2 px-2 text-center">
                                            <button
                                              type="button"
                                              disabled={demand.items.length <= 1}
                                              onClick={() => handleInlineDeleteRow(demand, idx)}
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
                                        {demand.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </td>
                                      {isDraft && <td></td>}
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
    </div>
  );
};
