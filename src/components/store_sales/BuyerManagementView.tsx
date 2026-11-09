import React, { useState, useMemo } from 'react';
import type { BuyerRecord, CoalSellRecord, BuyerType, SaleProvince } from '../../types/storeSales.ts';
import ConfirmModal from './ConfirmModal.tsx';

interface BuyerManagementViewProps {
  buyers: BuyerRecord[];
  coalSells: CoalSellRecord[];
  onAddBuyer: (buyer: Omit<BuyerRecord, 'id' | 'createdAt'>) => void;
  onUpdateBuyer: (buyer: BuyerRecord) => void;
  onDeleteBuyer: (id: string) => void;
}

export const BuyerManagementView: React.FC<BuyerManagementViewProps> = ({
  buyers,
  coalSells,
  onAddBuyer,
  onUpdateBuyer,
  onDeleteBuyer,
}) => {
  // Tabs: 'list' | 'add'
  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');

  // Form State
  const [formData, setFormData] = useState({
    buyerNTN: '',
    buyerCNIC: '',
    buyerName: '',
    buyerType: 'Registered' as BuyerType,
    saleOrganization: 'Punjab' as SaleProvince,
    phone: '',
    city: '',
    address: '',
  });

  // Edit State
  const [editingBuyer, setEditingBuyer] = useState<BuyerRecord | null>(null);

  // Search & Filter & Sort
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [provinceFilter, setProvinceFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'name' | 'type' | 'province'>('name');
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

  // Buyer purchase stats
  const buyerStats = useMemo(() => {
    const stats: { [buyerName: string]: { totalPurchasedTons: number; totalSpentPKR: number; invoicesCount: number } } = {};
    buyers.forEach(b => {
      const invoices = coalSells.filter(s => s.buyerName.toLowerCase() === b.buyerName.toLowerCase() || s.buyerId === b.id);
      stats[b.id] = {
        totalPurchasedTons: invoices.reduce((sum, s) => sum + s.quantity, 0),
        totalSpentPKR: invoices.reduce((sum, s) => sum + s.totalValue, 0),
        invoicesCount: invoices.length,
      };
    });
    return stats;
  }, [buyers, coalSells]);

  // Filtered Buyers
  const filteredBuyers = useMemo(() => {
    return buyers.filter(b => {
      const matchSearch =
        b.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.buyerNTN.includes(searchTerm) ||
        b.buyerCNIC.includes(searchTerm) ||
        (b.city && b.city.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchType = typeFilter === 'all' ? true : b.buyerType === typeFilter;
      const matchProvince = provinceFilter === 'all' ? true : b.saleOrganization === provinceFilter;

      return matchSearch && matchType && matchProvince;
    }).sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.buyerName.localeCompare(b.buyerName);
      else if (sortField === 'type') cmp = a.buyerType.localeCompare(b.buyerType);
      else if (sortField === 'province') cmp = (a.saleOrganization || '').localeCompare(b.saleOrganization || '');
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [buyers, searchTerm, typeFilter, provinceFilter, sortField, sortOrder]);

  // Handle Add Buyer Form Submit
  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.buyerName.trim()) {
      alert('Please enter a valid Buyer Name');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Confirm Add Buyer',
      message: `Are you sure you want to register buyer "${formData.buyerName.trim()}" (${formData.buyerType}, ${formData.saleOrganization})?`,
      confirmLabel: 'Confirm & Save',
      variant: 'primary',
      onConfirm: () => {
        onAddBuyer({
          buyerName: formData.buyerName.trim(),
          buyerNTN: formData.buyerNTN.trim(),
          buyerCNIC: formData.buyerCNIC.trim(),
          buyerType: formData.buyerType,
          saleOrganization: formData.saleOrganization,
          phone: formData.phone.trim() || undefined,
          city: formData.city.trim() || undefined,
          address: formData.address.trim() || undefined,
        });
        setFormData({
          buyerNTN: '',
          buyerCNIC: '',
          buyerName: '',
          buyerType: 'Registered',
          saleOrganization: 'Punjab',
          phone: '',
          city: '',
          address: '',
        });
        setActiveTab('list');
      },
    });
  };

  // Handle Edit Submit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBuyer) return;

    setConfirmModal({
      isOpen: true,
      title: 'Confirm Update Buyer',
      message: `Are you sure you want to update details for "${editingBuyer.buyerName}"?`,
      confirmLabel: 'Save Changes',
      variant: 'primary',
      onConfirm: () => {
        onUpdateBuyer(editingBuyer);
        setEditingBuyer(null);
      },
    });
  };

  // Handle Delete
  const handleDeleteClick = (buyer: BuyerRecord) => {
    const hasInvoices = coalSells.some(
      s => s.buyerId === buyer.id || s.buyerName.toLowerCase() === buyer.buyerName.toLowerCase()
    );

    let warning = '';
    if (hasInvoices) {
      warning = ' Notice: This buyer has historical coal purchase invoices logged in the system.';
    }

    setConfirmModal({
      isOpen: true,
      title: 'Confirm Remove Buyer',
      message: `Are you sure you want to remove buyer "${buyer.buyerName}"?${warning}`,
      confirmLabel: 'Delete Buyer',
      variant: 'danger',
      onConfirm: () => {
        onDeleteBuyer(buyer.id);
      },
    });
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Sr', 'Buyer Name', 'Buyer NTN', 'Buyer CNIC', 'Type', 'Sale Org (Province)', 
      'City', 'Phone', 'Total Invoices', 'Purchased (Tons)', 'Total Billed (PKR)'
    ];

    const rows = filteredBuyers.map((b, idx) => {
      const stats = buyerStats[b.id] || { totalPurchasedTons: 0, totalSpentPKR: 0, invoicesCount: 0 };
      return [
        idx + 1,
        `"${b.buyerName.replace(/"/g, '""')}"`,
        `"${b.buyerNTN}"`,
        `"${b.buyerCNIC}"`,
        b.buyerType,
        b.saleOrganization,
        `"${(b.city || '').replace(/"/g, '""')}"`,
        `"${(b.phone || '').replace(/"/g, '""')}"`,
        stats.invoicesCount,
        stats.totalPurchasedTons,
        stats.totalSpentPKR,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `coal_buyers_${new Date().toISOString().slice(0, 10)}.csv`);
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
          <title>Buyer Directory - Coal Management</title>
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
          <h1>REGISTERED BUYERS DIRECTORY</h1>
          <h2>Commercial & Industrial Clients (Generated: ${new Date().toLocaleDateString()})</h2>
          <table>
            <thead>
              <tr>
                <th>Sr.</th>
                <th>Buyer Name</th>
                <th>Buyer NTN</th>
                <th>Buyer CNIC</th>
                <th>Type</th>
                <th>Province</th>
                <th>City</th>
                <th class="num">Invoices</th>
                <th class="num">Tons Purchased</th>
                <th class="num">Total Billed (PKR)</th>
              </tr>
            </thead>
            <tbody>
              ${filteredBuyers.map((b, idx) => {
                const stats = buyerStats[b.id] || { totalPurchasedTons: 0, totalSpentPKR: 0, invoicesCount: 0 };
                return `
                  <tr>
                    <td>${idx + 1}</td>
                    <td><strong>${b.buyerName}</strong></td>
                    <td>${b.buyerNTN || '-'}</td>
                    <td>${b.buyerCNIC || '-'}</td>
                    <td>${b.buyerType}</td>
                    <td>${b.saleOrganization}</td>
                    <td>${b.city || '-'}</td>
                    <td class="num">${stats.invoicesCount}</td>
                    <td class="num">${stats.totalPurchasedTons.toLocaleString()} Tons</td>
                    <td class="num font-bold">PKR ${stats.totalSpentPKR.toLocaleString()}</td>
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
      {/* Sub Tabs */}
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
            📋 View Buyers List ({buyers.length})
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'add'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            ➕ Add Buyer Form
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
              <span>🖨️ Print Directory</span>
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: ADD BUYER FORM */}
      {activeTab === 'add' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-2xl mx-auto">
          <div className="border-b border-slate-100 pb-4 mb-5">
            <h2 className="text-lg font-semibold text-slate-900">Add Buyer Profile</h2>
            <p className="text-xs text-slate-500 mt-1">
              Add commercial client profile with tax identifiers and sales organization jurisdiction.
            </p>
          </div>

          <form onSubmit={handleSubmitAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Buyer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fauji Cement Co. Ltd."
                  value={formData.buyerName}
                  onChange={e => setFormData({ ...formData, buyerName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Buyer Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.buyerType}
                  onChange={e => setFormData({ ...formData, buyerType: e.target.value as BuyerType })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                >
                  <option value="Registered">Registered</option>
                  <option value="Unregistered">Unregistered</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Buyer NTN</label>
                <input
                  type="text"
                  placeholder="e.g. 3920194-7"
                  value={formData.buyerNTN}
                  onChange={e => setFormData({ ...formData, buyerNTN: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Buyer CNIC</label>
                <input
                  type="text"
                  placeholder="e.g. 54400-1928301-3"
                  value={formData.buyerCNIC}
                  onChange={e => setFormData({ ...formData, buyerCNIC: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sale Organization <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.saleOrganization}
                  onChange={e => setFormData({ ...formData, saleOrganization: e.target.value as SaleProvince })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                >
                  <option value="Balochistan">Balochistan</option>
                  <option value="Sindh">Sindh</option>
                  <option value="Punjab">Punjab</option>
                  <option value="KPK">KPK</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  placeholder="e.g. +92 51 9283741"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  placeholder="e.g. Rawalpindi"
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
              <textarea
                rows={2}
                placeholder="Full billing address..."
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
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
                Save Buyer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: VIEW BUYERS LIST */}
      {activeTab === 'list' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Filters */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search buyer name, NTN, CNIC, city..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg w-60 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                />
                <span className="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
              </div>

              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">All Buyer Types</option>
                <option value="Registered">Registered</option>
                <option value="Unregistered">Unregistered</option>
              </select>

              <select
                value={provinceFilter}
                onChange={e => setProvinceFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">All Provinces</option>
                <option value="Balochistan">Balochistan</option>
                <option value="Sindh">Sindh</option>
                <option value="Punjab">Punjab</option>
                <option value="KPK">KPK</option>
              </select>

              <select
                value={sortField}
                onChange={e => setSortField(e.target.value as any)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="name">Sort by Name</option>
                <option value="type">Sort by Type</option>
                <option value="province">Sort by Province</option>
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-2 py-1.5 text-xs border border-slate-300 rounded-lg bg-white hover:bg-slate-100"
              >
                {sortOrder === 'asc' ? '⬆️ Asc' : '⬇️ Desc'}
              </button>
            </div>

            <div className="text-xs font-semibold text-slate-600">
              Showing {filteredBuyers.length} of {buyers.length} buyers
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Sr.</th>
                  <th className="px-4 py-3 text-left">Buyer Name</th>
                  <th className="px-4 py-3 text-left">Buyer NTN</th>
                  <th className="px-4 py-3 text-left">Buyer CNIC</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Sale Org (Province)</th>
                  <th className="px-4 py-3 text-left">City</th>
                  <th className="px-4 py-3 text-right">Invoices</th>
                  <th className="px-4 py-3 text-right">Tons Bought</th>
                  <th className="px-4 py-3 text-right">Total PKR</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredBuyers.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-8 text-center text-slate-400">
                      No buyers found matching search criteria. Click "Add Buyer Form" to create one.
                    </td>
                  </tr>
                ) : (
                  filteredBuyers.map((b, idx) => {
                    const stats = buyerStats[b.id] || { totalPurchasedTons: 0, totalSpentPKR: 0, invoicesCount: 0 };
                    return (
                      <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                          {b.buyerName}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-700">{b.buyerNTN || '-'}</td>
                        <td className="px-4 py-3 font-mono text-slate-700">{b.buyerCNIC || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            b.buyerType === 'Registered' 
                              ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {b.buyerType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700 font-medium">{b.saleOrganization}</td>
                        <td className="px-4 py-3 text-slate-600">{b.city || '-'}</td>
                        <td className="px-4 py-3 text-right font-medium text-slate-700">{stats.invoicesCount}</td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-800 font-mono whitespace-nowrap">
                          {stats.totalPurchasedTons.toLocaleString()} Tons
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-medium text-slate-800 whitespace-nowrap">
                          {stats.totalSpentPKR.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => setEditingBuyer(b)}
                              className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteClick(b)}
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
      {editingBuyer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-slate-200">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-semibold text-slate-900">Edit Buyer Profile</h3>
              <p className="text-xs text-slate-500">Update identification and organization jurisdiction.</p>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Buyer Name</label>
                <input
                  type="text"
                  required
                  value={editingBuyer.buyerName}
                  onChange={e => setEditingBuyer({ ...editingBuyer, buyerName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Buyer Type</label>
                  <select
                    value={editingBuyer.buyerType}
                    onChange={e => setEditingBuyer({ ...editingBuyer, buyerType: e.target.value as BuyerType })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    <option value="Registered">Registered</option>
                    <option value="Unregistered">Unregistered</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sale Organization</label>
                  <select
                    value={editingBuyer.saleOrganization}
                    onChange={e => setEditingBuyer({ ...editingBuyer, saleOrganization: e.target.value as SaleProvince })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    <option value="Balochistan">Balochistan</option>
                    <option value="Sindh">Sindh</option>
                    <option value="Punjab">Punjab</option>
                    <option value="KPK">KPK</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Buyer NTN</label>
                  <input
                    type="text"
                    value={editingBuyer.buyerNTN}
                    onChange={e => setEditingBuyer({ ...editingBuyer, buyerNTN: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Buyer CNIC</label>
                  <input
                    type="text"
                    value={editingBuyer.buyerCNIC}
                    onChange={e => setEditingBuyer({ ...editingBuyer, buyerCNIC: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={editingBuyer.city || ''}
                    onChange={e => setEditingBuyer({ ...editingBuyer, city: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={editingBuyer.phone || ''}
                    onChange={e => setEditingBuyer({ ...editingBuyer, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingBuyer(null)}
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

export default BuyerManagementView;
