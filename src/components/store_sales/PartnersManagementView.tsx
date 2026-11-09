import React, { useState, useMemo } from 'react';
import type { PartnerRecord, CoalStockRecord, CoalSellRecord } from '../../types/storeSales.ts';
import ConfirmModal from './ConfirmModal.tsx';

interface PartnersManagementViewProps {
  partners: PartnerRecord[];
  coalStocks: CoalStockRecord[];
  coalSells: CoalSellRecord[];
  onAddPartner: (partner: Omit<PartnerRecord, 'id' | 'createdAt'>) => void;
  onUpdatePartner: (partner: PartnerRecord) => void;
  onDeletePartner: (id: string) => void;
}

export const PartnersManagementView: React.FC<PartnersManagementViewProps> = ({
  partners,
  coalStocks,
  coalSells,
  onAddPartner,
  onUpdatePartner,
  onDeletePartner,
}) => {
  // Tabs: 'list' | 'add'
  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    contactPerson: '',
    phone: '',
    notes: '',
    isActive: true,
  });

  // Edit State
  const [editingPartner, setEditingPartner] = useState<PartnerRecord | null>(null);

  // Search & Filter & Sort
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortField, setSortField] = useState<'name' | 'code' | 'stock'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: 'primary' | 'danger';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Partner stock stats
  const partnerStats = useMemo(() => {
    const stats: { [partnerId: string]: { stockAdded: number; sold: number; netBalance: number } } = {};
    partners.forEach(p => {
      const stockAdded = coalStocks.filter(s => s.partnerId === p.id).reduce((sum, s) => sum + (s.quantity ?? 0), 0);
      const sold = coalSells.filter(s => s.partnerId === p.id).reduce((sum, s) => sum + (s.quantity ?? 0), 0);
      stats[p.id] = {
        stockAdded,
        sold,
        netBalance: stockAdded - sold,
      };
    });
    return stats;
  }, [partners, coalStocks, coalSells]);

  // Filtered partners
  const filteredPartners = useMemo(() => {
    return partners.filter(p => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.contactPerson && p.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.phone && p.phone.includes(searchTerm));
      
      const matchStatus =
        statusFilter === 'all' ? true : statusFilter === 'active' ? p.isActive : !p.isActive;

      return matchSearch && matchStatus;
    }).sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortField === 'code') cmp = a.code.localeCompare(b.code);
      else if (sortField === 'stock') {
        const aBal = partnerStats[a.id]?.netBalance || 0;
        const bBal = partnerStats[b.id]?.netBalance || 0;
        cmp = aBal - bBal;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [partners, searchTerm, statusFilter, sortField, sortOrder, partnerStats]);

  // Handle Add Partner
  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter a valid partner name');
      return;
    }

    const partnerName = formData.name.trim();
    const partnerCode = formData.code.trim().toUpperCase() || partnerName.substring(0, 3).toUpperCase();

    setConfirmModal({
      isOpen: true,
      title: 'Confirm Add Mining Partner',
      message: `Are you sure you want to register "${partnerName}" (${partnerCode}) as a mining partner?`,
      confirmLabel: 'Confirm & Save',
      variant: 'primary',
      onConfirm: () => {
        onAddPartner({
          name: partnerName,
          code: partnerCode,
          contactPerson: formData.contactPerson.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          notes: formData.notes.trim() || undefined,
          isActive: formData.isActive,
        });
        setFormData({
          name: '',
          code: '',
          contactPerson: '',
          phone: '',
          notes: '',
          isActive: true,
        });
        setActiveTab('list');
      },
    });
  };

  // Handle Edit Submit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPartner) return;

    setConfirmModal({
      isOpen: true,
      title: 'Confirm Update Partner',
      message: `Are you sure you want to save changes for partner "${editingPartner.name}"?`,
      confirmLabel: 'Save Changes',
      variant: 'primary',
      onConfirm: () => {
        onUpdatePartner(editingPartner);
        setEditingPartner(null);
      },
    });
  };

  // Handle Delete
  const handleDeleteClick = (partner: PartnerRecord) => {
    const hasStocks = coalStocks.some(s => s.partnerId === partner.id);
    const hasSells = coalSells.some(s => s.partnerId === partner.id);

    let extraWarning = '';
    if (hasStocks || hasSells) {
      extraWarning = ' Note: This partner has existing coal stock or sales records associated with them.';
    }

    setConfirmModal({
      isOpen: true,
      title: 'Confirm Remove Partner',
      message: `Are you sure you want to remove partner "${partner.name}"?${extraWarning}`,
      confirmLabel: 'Delete Partner',
      variant: 'danger',
      onConfirm: () => {
        onDeletePartner(partner.id);
      },
    });
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Sr', 'Partner Name', 'Code', 'Status', 'Contact Person', 'Phone', 'Stock Added (Tons)', 'Sold (Tons)', 'Net Balance (Tons)', 'Notes'];
    const rows = filteredPartners.map((p, idx) => {
      const stats = partnerStats[p.id] || { stockAdded: 0, sold: 0, netBalance: 0 };
      return [
        idx + 1,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.code}"`,
        p.isActive ? 'Active' : 'Inactive',
        `"${(p.contactPerson || '').replace(/"/g, '""')}"`,
        `"${(p.phone || '').replace(/"/g, '""')}"`,
        stats.stockAdded,
        stats.sold,
        stats.netBalance,
        `"${(p.notes || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `mining_partners_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print List
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Mining Partners Directory</title>
          <style>
            body { font-family: system-ui, sans-serif; margin: 24px; color: #1e293b; }
            h1 { font-size: 20px; margin-bottom: 4px; }
            h2 { font-size: 14px; font-weight: normal; color: #64748b; margin-top: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 11px; }
            th, td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; }
            th { background: #0f172a; color: white; }
            .num { text-align: right; }
          </style>
        </head>
        <body>
          <h1>MINING PARTNERS REGISTER</h1>
          <h2>Active Extraction & Seam Allocation Partners (Generated: ${new Date().toLocaleDateString()})</h2>
          <table>
            <thead>
              <tr>
                <th>Sr.</th>
                <th>Partner Name</th>
                <th>Code</th>
                <th>Status</th>
                <th>Contact Person</th>
                <th>Phone</th>
                <th class="num">Stock Inflow (Tons)</th>
                <th class="num">Sold (Tons)</th>
                <th class="num">Partner Balance (Tons)</th>
              </tr>
            </thead>
            <tbody>
              ${filteredPartners.map((p, idx) => {
                const stats = partnerStats[p.id] || { stockAdded: 0, sold: 0, netBalance: 0 };
                return `
                  <tr>
                    <td>${idx + 1}</td>
                    <td><strong>${p.name}</strong></td>
                    <td>${p.code}</td>
                    <td>${p.isActive ? 'Active' : 'Inactive'}</td>
                    <td>${p.contactPerson || '-'}</td>
                    <td>${p.phone || '-'}</td>
                    <td class="num">${stats.stockAdded.toLocaleString()} Tons</td>
                    <td class="num">${stats.sold.toLocaleString()} Tons</td>
                    <td class="num font-bold">${stats.netBalance.toLocaleString()} Tons</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'list'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            📋 View Partners List ({partners.length})
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'add'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            ➕ Add Partner Name
          </button>
        </div>

        {activeTab === 'list' && (
          <div className="flex space-x-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center space-x-1.5 shadow-sm"
            >
              <span>📥 Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center space-x-1.5 shadow-sm"
            >
              <span>🖨️ Print Partners</span>
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: ADD PARTNER */}
      {activeTab === 'add' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-2xl mx-auto">
          <div className="border-b border-slate-100 pb-4 mb-5">
            <h2 className="text-lg font-semibold text-slate-900">Add Mining Partner</h2>
            <p className="text-xs text-slate-500 mt-1">
              Add a partner linked to coal stock and POS sales invoices.
            </p>
          </div>

          <form onSubmit={handleSubmitAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Partner Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Quetta Energy Minerals Co."
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Partner Code / Acronym (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. QEM"
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  placeholder="e.g. Haji Gul Mohammad"
                  value={formData.contactPerson}
                  onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. +92 300 9382101"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contract Notes / Seam Allocation
              </label>
              <textarea
                rows={2}
                placeholder="Details of concession block or extraction agreement..."
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="partnerActive"
                checked={formData.isActive}
                onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="partnerActive" className="text-xs text-slate-700 font-medium">
                Active Mining Partner (Available for selection in coal stock and sales)
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-semibold shadow-sm"
              >
                Save Partner
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: VIEW PARTNERS LIST */}
      {activeTab === 'list' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Filters */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search partner, code, contact..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg w-56 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                />
                <span className="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
              </div>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>

              <select
                value={sortField}
                onChange={e => setSortField(e.target.value as any)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="name">Sort by Name</option>
                <option value="code">Sort by Code</option>
                <option value="stock">Sort by Net Balance</option>
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-2 py-1.5 text-xs border border-slate-300 rounded-lg bg-white hover:bg-slate-100"
              >
                {sortOrder === 'asc' ? '⬆️ Asc' : '⬇️ Desc'}
              </button>
            </div>

            <div className="text-xs font-semibold text-slate-600">
              Showing {filteredPartners.length} of {partners.length} partners
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Sr.</th>
                  <th className="px-4 py-3 text-left">Partner Name</th>
                  <th className="px-4 py-3 text-left">Code</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Contact Person</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-right">Stock Inflow (Tons)</th>
                  <th className="px-4 py-3 text-right">Sold / Dispatched (Tons)</th>
                  <th className="px-4 py-3 text-right">Partner Balance</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredPartners.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                      No partners found matching the search. Click "Add Partner Name" to register one.
                    </td>
                  </tr>
                ) : (
                  filteredPartners.map((p, idx) => {
                    const stats = partnerStats[p.id] || { stockAdded: 0, sold: 0, netBalance: 0 };
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                          {p.name}
                        </td>
                        <td className="px-4 py-3 font-mono font-medium text-slate-700">{p.code}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            p.isActive 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {p.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{p.contactPerson || '-'}</td>
                        <td className="px-4 py-3 text-slate-600 font-mono">{p.phone || '-'}</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-700">
                          {stats.stockAdded.toLocaleString()} Tons
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-700">
                          {stats.sold.toLocaleString()} Tons
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-800 font-mono whitespace-nowrap">
                          {stats.netBalance.toLocaleString()} Tons
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => setEditingPartner(p)}
                              className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteClick(p)}
                              className="px-2 py-1 text-xs text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded"
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-slate-200">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-semibold text-slate-900">Edit Partner: {editingPartner.name}</h3>
              <p className="text-xs text-slate-500">Update contact and operational details.</p>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Partner Name</label>
                  <input
                    type="text"
                    required
                    value={editingPartner.name}
                    onChange={e => setEditingPartner({ ...editingPartner, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Partner Code</label>
                  <input
                    type="text"
                    required
                    value={editingPartner.code}
                    onChange={e => setEditingPartner({ ...editingPartner, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={editingPartner.contactPerson || ''}
                    onChange={e => setEditingPartner({ ...editingPartner, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={editingPartner.phone || ''}
                    onChange={e => setEditingPartner({ ...editingPartner, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={editingPartner.notes || ''}
                  onChange={e => setEditingPartner({ ...editingPartner, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="editPartnerActive"
                  checked={editingPartner.isActive}
                  onChange={e => setEditingPartner({ ...editingPartner, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="editPartnerActive" className="text-xs text-slate-700 font-medium">
                  Active Mining Partner
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPartner(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        variant={confirmModal.variant}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default PartnersManagementView;
