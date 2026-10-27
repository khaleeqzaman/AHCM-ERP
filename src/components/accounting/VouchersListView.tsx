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
  ArrowRight
} from 'lucide-react';
import { VoucherDocument, VoucherType } from '../../types/accounting';

interface VouchersListViewProps {
  vouchers: VoucherDocument[];
  onEditVoucher: (voucher: VoucherDocument) => void;
  onPostDraftVoucher: (id: string) => void;
  onNavigateToCreate: () => void;
}

export const VouchersListView: React.FC<VouchersListViewProps> = ({
  vouchers,
  onEditVoucher,
  onPostDraftVoucher,
  onNavigateToCreate,
}) => {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredVouchers = vouchers.filter((v) => {
    const matchesSearch =
      v.voucherNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.narration.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.referenceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.lines.some((l) => l.accountName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === 'All' || v.voucherType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Voucher Journal
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">Transaction Register</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            Vouchers Register (JV, PV, RV, CV)
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Audit history of all double-entry financial vouchers posted to the general ledger.
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateToCreate}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Voucher</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 border border-slate-200 rounded-xl shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search voucher #, narration, or account..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-700 font-medium"
          >
            <option value="All">All Voucher Types ({vouchers.length})</option>
            <option value="Journal Voucher (JV)">Journal Vouchers (JV)</option>
            <option value="Payment Voucher (PV)">Payment Vouchers (PV)</option>
            <option value="Receipt Voucher (RV)">Receipt Vouchers (RV)</option>
            <option value="Contra Voucher (CV)">Contra Vouchers (CV)</option>
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
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Voucher No.</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Narration</th>
                <th className="py-3 px-4 text-right">Debit</th>
                <th className="py-3 px-4 text-right">Credit</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Lines</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVouchers.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500">
                    No vouchers found matching search criteria. Click "New Voucher" to record one.
                  </td>
                </tr>
              ) : (
                filteredVouchers.map((voucher, idx) => {
                  const isExpanded = !!expandedIds[voucher.id];

                  return (
                    <React.Fragment key={voucher.id}>
                      <tr className={`hover:bg-slate-50/60 transition-colors ${isExpanded ? 'bg-slate-50/40' : ''}`}>
                        <td className="py-3 px-3 text-center font-mono text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                          {voucher.date}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-700 whitespace-nowrap">
                          {voucher.voucherNo}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                              voucher.voucherType.includes('Payment')
                                ? 'bg-amber-50 text-amber-800'
                                : voucher.voucherType.includes('Receipt')
                                ? 'bg-emerald-50 text-emerald-800'
                                : voucher.voucherType.includes('Contra')
                                ? 'bg-blue-50 text-blue-800'
                                : 'bg-purple-50 text-purple-800'
                            }`}
                          >
                            {voucher.voucherType.split(' ')[0]}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                          {voucher.referenceNo || '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-800 max-w-xs truncate">
                          {voucher.narration}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900 whitespace-nowrap">
                          {voucher.totalDebit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900 whitespace-nowrap">
                          {voucher.totalCredit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded ${
                              voucher.status === 'Posted'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {voucher.status === 'Posted' ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Lock className="w-3 h-3 text-slate-400" />}
                            {voucher.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => toggleExpand(voucher.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:text-emerald-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                          >
                            {isExpanded ? (
                              <>
                                <EyeOff className="w-3 h-3" />
                                <span>Hide ({voucher.lines.length})</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-3 h-3" />
                                <span>Show ({voucher.lines.length})</span>
                              </>
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => onEditVoucher(voucher)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 border border-emerald-300 rounded transition-colors cursor-pointer"
                            title="Edit voucher"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Double-Entry Details */}
                      {isExpanded && (
                        <tr className="bg-slate-50/70 border-b border-slate-200">
                          <td colSpan={11} className="p-4 pl-12 pr-6">
                            <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs space-y-2">
                              <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-100 font-semibold text-slate-800">
                                <span>
                                  Double-Entry Breakdown for <span className="font-mono text-emerald-700">{voucher.voucherNo}</span>
                                </span>
                                <span className="text-slate-500 font-normal">
                                  Balanced sum: {voucher.totalDebit.toFixed(2)}
                                </span>
                              </div>

                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="bg-slate-50 text-[11px] font-semibold text-slate-600 border-b border-slate-200">
                                    <th className="py-1.5 px-3 w-12 text-center">Sr.</th>
                                    <th className="py-1.5 px-3 w-28 font-mono">T-C-GG-SSS</th>
                                    <th className="py-1.5 px-3">Account Title</th>
                                    <th className="py-1.5 px-3">Line Particulars</th>
                                    <th className="py-1.5 px-3 w-28 text-right">Debit</th>
                                    <th className="py-1.5 px-3 w-28 text-right">Credit</th>
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
                                        {line.debit > 0 ? `${line.debit.toFixed(2)}` : '—'}
                                      </td>
                                      <td className="py-1.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                                        {line.credit > 0 ? `${line.credit.toFixed(2)}` : '—'}
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
                                      {voucher.totalDebit.toFixed(2)}
                                    </td>
                                    <td className="py-2 px-3 text-right font-mono text-emerald-800 font-bold">
                                      {voucher.totalCredit.toFixed(2)}
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
    </div>
  );
};
