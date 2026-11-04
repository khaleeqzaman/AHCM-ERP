import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Search, 
  Filter, 
  Eye, 
  EyeOff, 
  Edit3, 
  Plus, 
  CheckCircle2, 
  Lock, 
  ShieldCheck, 
  Printer, 
  RotateCcw, 
  XCircle, 
  AlertCircle, 
  X, 
  Check, 
  Calendar,
  Layers,
  ArrowRight,
  Send,
  Building2
} from 'lucide-react';
import { VoucherDocument, VoucherType, VoucherStatus } from '../../types/accounting';
import { formatWholeNumber } from '../../utils/formatters';

interface VouchersListViewProps {
  vouchers: VoucherDocument[];
  onEditVoucher: (voucher: VoucherDocument) => void;
  onApproveVoucher: (id: string) => void;
  onPostVoucher: (id: string) => void;
  onCancelVoucher: (id: string, reason: string) => void;
  onReverseVoucher: (id: string, reason: string) => void;
  onNavigateToCreate: () => void;
}

export const VouchersListView: React.FC<VouchersListViewProps> = ({
  vouchers,
  onEditVoucher,
  onApproveVoucher,
  onPostVoucher,
  onCancelVoucher,
  onReverseVoucher,
  onNavigateToCreate,
}) => {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Modals state
  const [viewVoucher, setViewVoucher] = useState<VoucherDocument | null>(null);
  const [printVoucher, setPrintVoucher] = useState<VoucherDocument | null>(null);
  const [reverseModalVoucher, setReverseModalVoucher] = useState<VoucherDocument | null>(null);
  const [reversalReason, setReversalReason] = useState('');
  const [cancelModalVoucher, setCancelModalVoucher] = useState<VoucherDocument | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getTypeCode = (type: VoucherType): string => {
    if (type.startsWith('CP')) return 'CP';
    if (type.startsWith('CR')) return 'CR';
    if (type.startsWith('BP')) return 'BP';
    if (type.startsWith('BR')) return 'BR';
    return 'JV';
  };

  const getStatusBadge = (status: VoucherStatus) => {
    switch (status) {
      case 'Draft':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Draft
          </span>
        );
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
            <ShieldCheck className="w-3 h-3 text-blue-600" />
            Approved
          </span>
        );
      case 'Posted':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Posted (Locked)
          </span>
        );
      case 'Reversed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
            <RotateCcw className="w-3 h-3 text-amber-600" />
            Reversed
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  const filteredVouchers = vouchers.filter((v) => {
    const matchesSearch =
      v.voucherNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.narration.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.referenceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.lines.some(
        (l) =>
          l.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          l.accountCode.toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesType =
      typeFilter === 'All' ||
      v.voucherType === typeFilter ||
      getTypeCode(v.voucherType) === typeFilter;
    const matchesStatus = statusFilter === 'All' || v.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleApprove = (v: VoucherDocument) => {
    onApproveVoucher(v.id);
    showNotification(`Voucher ${v.voucherNo} marked as Approved.`);
    if (viewVoucher?.id === v.id) {
      setViewVoucher({
        ...viewVoucher,
        status: 'Approved',
        approvedBy: 'Finance Manager',
        approvedAt: new Date().toISOString().substring(0, 16),
      });
    }
  };

  const handlePost = (v: VoucherDocument) => {
    onPostVoucher(v.id);
    showNotification(`Voucher ${v.voucherNo} posted to General Ledger.`);
    if (viewVoucher?.id === v.id) {
      setViewVoucher({
        ...viewVoucher,
        status: 'Posted',
        postedBy: 'Chief Accountant',
        postedAt: new Date().toISOString().substring(0, 16),
      });
    }
  };

  const handleConfirmCancel = () => {
    if (!cancelModalVoucher) return;
    const reason = cancelReason.trim() || 'Cancelled by authorized user';
    onCancelVoucher(cancelModalVoucher.id, reason);
    showNotification(`Voucher ${cancelModalVoucher.voucherNo} cancelled.`);
    setCancelModalVoucher(null);
    setCancelReason('');
    if (viewVoucher?.id === cancelModalVoucher.id) {
      setViewVoucher({
        ...viewVoucher,
        status: 'Cancelled',
        cancelReason: reason,
        cancelledBy: 'Finance Officer',
        cancelledAt: new Date().toISOString().substring(0, 16),
      });
    }
  };

  const handleConfirmReverse = () => {
    if (!reverseModalVoucher) return;
    const reason = reversalReason.trim() || 'Reversed by finance audit';
    onReverseVoucher(reverseModalVoucher.id, reason);
    showNotification(
      `Voucher ${reverseModalVoucher.voucherNo} reversed. Reversal entry generated.`
    );
    setReverseModalVoucher(null);
    setReversalReason('');
    if (viewVoucher?.id === reverseModalVoucher.id) {
      setViewVoucher({
        ...viewVoucher,
        status: 'Reversed',
        reversalReason: reason,
        reversedBy: 'Finance Auditor',
        reversedAt: new Date().toISOString().substring(0, 16),
      });
    }
  };

  const handleTriggerPrint = (v: VoucherDocument) => {
    setPrintVoucher(v);
  };

  // Metrics for quick summary
  const totalTurnover = vouchers
    .filter((v) => v.status === 'Posted')
    .reduce((sum, v) => sum + v.totalDebit, 0);
  const pendingApprovalCount = vouchers.filter((v) => v.status === 'Draft').length;
  const approvedCount = vouchers.filter((v) => v.status === 'Approved').length;
  const postedCount = vouchers.filter((v) => v.status === 'Posted').length;

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Voucher Management System
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">Official Journal</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            Voucher Register (CP, CR, BP, BR, JV)
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Audit history, approval workflows, posting controls, slip printing, and controlled voucher reversals.
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateToCreate}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Voucher</span>
        </button>
      </div>

      {/* Success / Info Toast */}
      {notification && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Quick Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <span className="text-slate-500 block text-[11px]">Total Vouchers</span>
          <span className="text-lg font-bold font-mono text-slate-900 mt-0.5 block">
            {vouchers.length}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Across 5 standard types
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <span className="text-slate-500 block text-[11px]">Draft & Pending</span>
          <span className="text-lg font-bold font-mono text-amber-700 mt-0.5 block">
            {pendingApprovalCount} Draft · {approvedCount} Appr
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Awaiting posting
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <span className="text-slate-500 block text-[11px]">Posted to General Ledger</span>
          <span className="text-lg font-bold font-mono text-emerald-700 mt-0.5 block">
            {postedCount} Active
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Reflecting in GL & Trial Balance
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <span className="text-slate-500 block text-[11px]">Posted Turnover</span>
          <span className="text-lg font-bold font-mono text-emerald-800 mt-0.5 block">
            PKR {formatWholeNumber(totalTurnover)}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Debit / Credit equilibrium
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 border border-slate-200 rounded-xl shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search voucher #, narration, account code, reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-700 font-medium"
            >
              <option value="All">All Types ({vouchers.length})</option>
              <option value="CP">CP — Cash Payment</option>
              <option value="CR">CR — Cash Receipt</option>
              <option value="BP">BP — Bank Payment</option>
              <option value="BR">BR — Bank Receipt</option>
              <option value="JV">JV — Journal Voucher</option>
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-700 font-medium"
          >
            <option value="All">All Statuses</option>
            <option value="Draft">Draft Only</option>
            <option value="Approved">Approved Only</option>
            <option value="Posted">Posted Only</option>
            <option value="Reversed">Reversed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Vouchers Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-3 w-12 text-center">Sr.</th>
                <th className="py-3 px-3 w-28">Date</th>
                <th className="py-3 px-3 font-mono">Voucher No.</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Reference</th>
                <th className="py-3 px-4">Narration</th>
                <th className="py-3 px-3 text-right">Debit (PKR)</th>
                <th className="py-3 px-3 text-right">Credit (PKR)</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-center">Register Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVouchers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    No vouchers found matching search criteria. Click "New Voucher" to record a financial transaction.
                  </td>
                </tr>
              ) : (
                filteredVouchers.map((voucher, idx) => {
                  const isExpanded = !!expandedIds[voucher.id];
                  const code = getTypeCode(voucher.voucherType);
                  const isDraft = voucher.status === 'Draft';
                  const isApproved = voucher.status === 'Approved';
                  const isPosted = voucher.status === 'Posted';
                  const isLocked = !isDraft;

                  return (
                    <React.Fragment key={voucher.id}>
                      <tr
                        className={`hover:bg-slate-50/60 transition-colors ${
                          isExpanded ? 'bg-slate-50/40' : ''
                        }`}
                      >
                        <td className="py-3 px-3 text-center font-mono text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-700 whitespace-nowrap">
                          {voucher.date}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setViewVoucher(voucher)}
                            className="text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer flex items-center gap-1"
                            title="Click to view full voucher details"
                          >
                            <span>{voucher.voucherNo}</span>
                          </button>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                              code === 'CP'
                                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                : code === 'CR'
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                : code === 'BP'
                                ? 'bg-blue-100 text-blue-900 border border-blue-200'
                                : code === 'BR'
                                ? 'bg-cyan-100 text-cyan-900 border border-cyan-200'
                                : 'bg-purple-100 text-purple-900 border border-purple-200'
                            }`}
                          >
                            {code}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">
                          {voucher.referenceNo || '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-800 max-w-xs truncate" title={voucher.narration}>
                          {voucher.narration}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-slate-900 whitespace-nowrap">
                          {formatWholeNumber(voucher.totalDebit)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-slate-900 whitespace-nowrap">
                          {formatWholeNumber(voucher.totalCredit)}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {getStatusBadge(voucher.status)}
                        </td>

                        {/* Complete 6 Actions Strip */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            {/* 1. View Details */}
                            <button
                              type="button"
                              onClick={() => setViewVoucher(voucher)}
                              className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                              title="View full voucher details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* 2. Edit (Draft only) */}
                            {isDraft ? (
                              <button
                                type="button"
                                onClick={() => onEditVoucher(voucher)}
                                className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                                title="Edit voucher (Draft)"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled
                                className="p-1.5 text-slate-300 cursor-not-allowed"
                                title="Editing locked: only Draft vouchers can be edited"
                              >
                                <Lock className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* 3. Approval (Draft only) */}
                            {isDraft && (
                              <button
                                type="button"
                                onClick={() => handleApprove(voucher)}
                                className="p-1.5 text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                                title="Approve voucher"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* 4. Posting (Draft or Approved) */}
                            {(isDraft || isApproved) && (
                              <button
                                type="button"
                                onClick={() => handlePost(voucher)}
                                className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                                title="Post voucher to General Ledger"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* 5. Print Slip */}
                            <button
                              type="button"
                              onClick={() => handleTriggerPrint(voucher)}
                              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                              title="Print voucher slip"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {/* 6. Reverse / Cancel (Controlled process) */}
                            {isPosted && (
                              <button
                                type="button"
                                onClick={() => setReverseModalVoucher(voucher)}
                                className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-md transition-colors cursor-pointer"
                                title="Reverse voucher (Controlled GAAP reversal entry)"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {(isDraft || isApproved) && (
                              <button
                                type="button"
                                onClick={() => setCancelModalVoucher(voucher)}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                title="Cancel voucher"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Toggle quick table rows */}
                            <button
                              type="button"
                              onClick={() => toggleExpand(voucher.id)}
                              className="p-1 text-slate-400 hover:text-slate-600"
                              title={isExpanded ? 'Hide lines' : 'Show lines inline'}
                            >
                              {isExpanded ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Layers className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Inline Double-Entry Breakdown */}
                      {isExpanded && (
                        <tr className="bg-slate-50/70 border-b border-slate-200">
                          <td colSpan={10} className="p-4 pl-12 pr-6">
                            <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs space-y-2">
                              <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-100 font-semibold text-slate-800">
                                <span>
                                  Transaction Lines for <span className="font-mono text-emerald-700">{voucher.voucherNo}</span> ({voucher.voucherType})
                                </span>
                                <span className="text-slate-500 font-normal">
                                  Balanced sum: PKR {formatWholeNumber(voucher.totalDebit)}
                                </span>
                              </div>

                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="bg-slate-50 text-[11px] font-semibold text-slate-600 border-b border-slate-200">
                                    <th className="py-1.5 px-3 w-12 text-center">Sr.</th>
                                    <th className="py-1.5 px-3 w-32 font-mono">Account Code</th>
                                    <th className="py-1.5 px-3">Account Title</th>
                                    <th className="py-1.5 px-3">Line Particulars</th>
                                    <th className="py-1.5 px-3 w-28 text-right">Debit (PKR)</th>
                                    <th className="py-1.5 px-3 w-28 text-right">Credit (PKR)</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {voucher.lines.map((line) => (
                                    <tr key={line.id}>
                                      <td className="py-1.5 px-3 text-center font-mono text-slate-500">
                                        {line.srNo}
                                      </td>
                                      <td className="py-1.5 px-3 font-mono font-medium text-emerald-700">
                                        {line.accountCode}
                                      </td>
                                      <td className="py-1.5 px-3 font-semibold text-slate-800">
                                        {line.accountName}
                                      </td>
                                      <td className="py-1.5 px-3 text-slate-600">
                                        {line.description || voucher.narration}
                                      </td>
                                      <td className="py-1.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                                        {line.debit > 0 ? formatWholeNumber(line.debit) : '—'}
                                      </td>
                                      <td className="py-1.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                                        {line.credit > 0 ? formatWholeNumber(line.credit) : '—'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr className="bg-slate-50 border-t border-slate-200 font-semibold text-xs">
                                    <td colSpan={4} className="py-2 px-3 text-right uppercase text-[11px] text-slate-600">
                                      Total:
                                    </td>
                                    <td className="py-2 px-3 text-right font-mono text-emerald-800 font-bold">
                                      {formatWholeNumber(voucher.totalDebit)}
                                    </td>
                                    <td className="py-2 px-3 text-right font-mono text-emerald-800 font-bold">
                                      {formatWholeNumber(voucher.totalCredit)}
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

      {/* MODAL 1: FULL VOUCHER VIEW MODAL */}
      {viewVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 text-left space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold font-mono">
                  {getTypeCode(viewVoucher.voucherType)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 font-mono">
                      {viewVoucher.voucherNo}
                    </h3>
                    {getStatusBadge(viewVoucher.status)}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {viewVoucher.voucherType} · Transaction Date: {viewVoucher.date}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewVoucher(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Header Particulars Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Voucher Type</span>
                <span className="font-semibold text-slate-800">{viewVoucher.voucherType}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">External Ref</span>
                <span className="font-mono font-medium text-slate-800">{viewVoucher.referenceNo || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Prepared By</span>
                <span className="font-medium text-slate-800">{viewVoucher.preparedBy || 'Accountant'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Approval / Posting</span>
                <span className="font-medium text-slate-800">
                  {viewVoucher.postedAt
                    ? `Posted: ${viewVoucher.postedAt}`
                    : viewVoucher.approvedAt
                    ? `Approved: ${viewVoucher.approvedAt}`
                    : 'Pending'}
                </span>
              </div>
            </div>

            {/* Narration */}
            <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl text-xs">
              <span className="font-semibold text-emerald-900 block text-[11px] uppercase tracking-wider mb-0.5">
                General Narration
              </span>
              <p className="text-slate-800">{viewVoucher.narration}</p>
            </div>

            {/* Reversal / Cancellation notices if applicable */}
            {viewVoucher.status === 'Reversed' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <RotateCcw className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Reversed Voucher Notice:</span> This voucher was officially reversed.
                  {viewVoucher.reversalReason && <span> Reason: "{viewVoucher.reversalReason}".</span>}
                  {viewVoucher.reversedAt && <span> Timestamp: {viewVoucher.reversedAt}.</span>}
                </div>
              </div>
            )}

            {viewVoucher.status === 'Cancelled' && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-2">
                <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Cancelled Voucher:</span> This draft/voucher was cancelled.
                  {viewVoucher.cancelReason && <span> Reason: "{viewVoucher.cancelReason}".</span>}
                </div>
              </div>
            )}

            {/* Itemized Lines */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-semibold text-slate-600 border-b border-slate-200">
                    <th className="py-2 px-3 w-12 text-center">Sr.</th>
                    <th className="py-2 px-3 w-32 font-mono">Account Code</th>
                    <th className="py-2 px-3">Chart Account Title</th>
                    <th className="py-2 px-3">Line Particulars</th>
                    <th className="py-2 px-3 w-28 text-right">Debit (PKR)</th>
                    <th className="py-2 px-3 w-28 text-right">Credit (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {viewVoucher.lines.map((l) => (
                    <tr key={l.id}>
                      <td className="py-2 px-3 text-center font-mono text-slate-500">{l.srNo}</td>
                      <td className="py-2 px-3 font-mono font-bold text-emerald-700">{l.accountCode}</td>
                      <td className="py-2 px-3 font-semibold text-slate-800">{l.accountName}</td>
                      <td className="py-2 px-3 text-slate-600">{l.description || viewVoucher.narration}</td>
                      <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900">
                        {l.debit > 0 ? formatWholeNumber(l.debit) : '—'}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900">
                        {l.credit > 0 ? formatWholeNumber(l.credit) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 border-t-2 border-slate-200 font-bold text-xs">
                    <td colSpan={4} className="py-2.5 px-3 text-right uppercase text-[11px] text-slate-700">
                      Voucher Balanced Totals:
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-800 text-sm">
                      {formatWholeNumber(viewVoucher.totalDebit)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-800 text-sm">
                      {formatWholeNumber(viewVoucher.totalCredit)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleTriggerPrint(viewVoucher)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Voucher Slip</span>
                </button>

                {viewVoucher.status === 'Draft' && (
                  <button
                    type="button"
                    onClick={() => {
                      const v = viewVoucher;
                      setViewVoucher(null);
                      onEditVoucher(v);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit (Draft)</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {viewVoucher.status === 'Draft' && (
                  <button
                    type="button"
                    onClick={() => handleApprove(viewVoucher)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Approve Voucher</span>
                  </button>
                )}

                {(viewVoucher.status === 'Draft' || viewVoucher.status === 'Approved') && (
                  <button
                    type="button"
                    onClick={() => handlePost(viewVoucher)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Post to General Ledger</span>
                  </button>
                )}

                {viewVoucher.status === 'Posted' && (
                  <button
                    type="button"
                    onClick={() => setReverseModalVoucher(viewVoucher)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reverse Voucher</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setViewVoucher(null)}
                  className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PRINTABLE VOUCHER SLIP */}
      {printVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-left space-y-5 max-h-[95vh] overflow-y-auto">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 print:hidden">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Print Preview
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintVoucher(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Voucher Printable Document */}
            <div className="border-2 border-slate-800 rounded-xl p-6 sm:p-7 space-y-5 bg-white text-slate-900 font-sans print:border-black print:p-0">
              {/* Header */}
              <div className="text-center pb-4 border-b-2 border-slate-800 space-y-1">
                <div className="flex items-center justify-center gap-2 text-slate-900">
                  <Building2 className="w-5 h-5 text-emerald-700" />
                  <span className="text-base font-extrabold uppercase tracking-wider">
                    AL-HAMD COAL MINES & FABRICATIONS
                  </span>
                </div>
                <div className="text-xs font-semibold uppercase tracking-widest text-slate-700">
                  Finance & Accounts Division · General Ledger
                </div>
                <div className="inline-block mt-2 px-3 py-1 bg-slate-900 text-white font-mono font-bold text-xs uppercase tracking-wider rounded">
                  {printVoucher.voucherType}
                </div>
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <div className="flex">
                    <span className="w-28 text-slate-500 font-medium">Voucher No:</span>
                    <span className="font-mono font-bold text-slate-900">{printVoucher.voucherNo}</span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-slate-500 font-medium">Reference:</span>
                    <span className="font-mono text-slate-800">{printVoucher.referenceNo || '—'}</span>
                  </div>
                </div>
                <div className="space-y-1.5 text-right sm:text-left">
                  <div className="flex sm:justify-end">
                    <span className="w-28 text-slate-500 font-medium">Date:</span>
                    <span className="font-mono font-bold text-slate-900">{printVoucher.date}</span>
                  </div>
                  <div className="flex sm:justify-end">
                    <span className="w-28 text-slate-500 font-medium">Status:</span>
                    <span className="font-semibold text-slate-900">{printVoucher.status}</span>
                  </div>
                </div>
              </div>

              {/* Narration */}
              <div className="p-2.5 bg-slate-50 border border-slate-300 rounded-md text-xs">
                <span className="font-bold text-slate-700 block text-[10px] uppercase tracking-wider">
                  Description / Particulars:
                </span>
                <span className="text-slate-900">{printVoucher.narration}</span>
              </div>

              {/* Lines Table */}
              <div className="border border-slate-800 rounded-md overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-[11px] font-bold border-b border-slate-800">
                      <th className="py-2 px-3 w-10 text-center">Sr.</th>
                      <th className="py-2 px-3 w-28 font-mono">Account Code</th>
                      <th className="py-2 px-3">Account Title</th>
                      <th className="py-2 px-3 w-28 text-right">Debit (PKR)</th>
                      <th className="py-2 px-3 w-28 text-right">Credit (PKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {printVoucher.lines.map((l) => (
                      <tr key={l.id}>
                        <td className="py-2 px-3 text-center font-mono">{l.srNo}</td>
                        <td className="py-2 px-3 font-mono font-bold">{l.accountCode}</td>
                        <td className="py-2 px-3 font-semibold">
                          <div>{l.accountName}</div>
                          {l.description && (
                            <div className="text-[10px] text-slate-500 font-normal">{l.description}</div>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold">
                          {l.debit > 0 ? formatWholeNumber(l.debit) : '—'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold">
                          {l.credit > 0 ? formatWholeNumber(l.credit) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 border-t-2 border-slate-800 font-bold text-xs">
                      <td colSpan={3} className="py-2.5 px-3 text-right uppercase text-[11px]">
                        Total Amount:
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-sm">
                        {formatWholeNumber(printVoucher.totalDebit)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-sm">
                        {formatWholeNumber(printVoucher.totalCredit)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Formal Signature Blocks */}
              <div className="pt-8 grid grid-cols-4 gap-4 text-center text-xs">
                <div className="border-t border-slate-400 pt-1.5">
                  <div className="font-bold text-slate-800">Prepared By</div>
                  <div className="text-[10px] text-slate-500">{printVoucher.preparedBy || 'Accountant'}</div>
                </div>
                <div className="border-t border-slate-400 pt-1.5">
                  <div className="font-bold text-slate-800">Checked By</div>
                  <div className="text-[10px] text-slate-500">Internal Audit</div>
                </div>
                <div className="border-t border-slate-400 pt-1.5">
                  <div className="font-bold text-slate-800">Approved By</div>
                  <div className="text-[10px] text-slate-500">{printVoucher.approvedBy || 'Finance Director'}</div>
                </div>
                <div className="border-t border-slate-400 pt-1.5">
                  <div className="font-bold text-slate-800">Received By</div>
                  <div className="text-[10px] text-slate-500">Payee Signature</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CONTROLLED CANCELLATION MODAL */}
      {cancelModalVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-left space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Cancel Voucher ({cancelModalVoucher.voucherNo})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Controlled cancellation of draft or unposted voucher. This will deactivate the voucher.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Voucher Type:</span>
                <span className="font-medium text-slate-800">{cancelModalVoucher.voucherType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Amount:</span>
                <span className="font-mono font-bold text-slate-900">
                  PKR {formatWholeNumber(cancelModalVoucher.totalDebit)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Cancellation *
              </label>
              <textarea
                rows={3}
                required
                placeholder="State the audit reason for cancelling this voucher..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500 focus:bg-white text-slate-900"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setCancelModalVoucher(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: CONTROLLED REVERSAL MODAL (FOR POSTED VOUCHERS) */}
      {reverseModalVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-left space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Reverse Posted Voucher ({reverseModalVoucher.voucherNo})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Controlled GAAP accounting process: creates an automated inverse reversal journal voucher to neutralize ledger entries with complete audit history.
                </p>
              </div>
            </div>

            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs space-y-1.5 text-amber-900">
              <div className="flex justify-between">
                <span className="font-medium">Original Posting Amount:</span>
                <span className="font-mono font-bold">PKR {formatWholeNumber(reverseModalVoucher.totalDebit)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Posting Date:</span>
                <span className="font-mono">{reverseModalVoucher.date}</span>
              </div>
              <p className="text-[11px] text-amber-800 pt-1 border-t border-amber-200/60">
                A reversal voucher with inverted debits and credits will be generated and posted automatically.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Reversal *
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Cheque returned by bank, invoice billing error, duplicate ledger transaction..."
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setReverseModalVoucher(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleConfirmReverse}
                className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                Confirm Controlled Reversal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
