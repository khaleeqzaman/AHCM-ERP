import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit2, 
  Search, 
  CheckCircle2, 
  AlertTriangle,
  Building,
  CreditCard,
  FileSpreadsheet
} from 'lucide-react';
import { BuyerRecord, BuyerType } from '../../types/storeSales';

interface BuyersViewProps {
  buyers: BuyerRecord[];
  onAddBuyer: (buyer: BuyerRecord) => void;
  onUpdateBuyer: (buyer: BuyerRecord) => void;
  onDeleteBuyer: (id: string) => void;
}

export const BuyersView: React.FC<BuyersViewProps> = ({
  buyers,
  onAddBuyer,
  onUpdateBuyer,
  onDeleteBuyer,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [buyerToDelete, setBuyerToDelete] = useState<BuyerRecord | null>(null);

  // Form fields
  const [formData, setFormData] = useState<{
    buyerNTN: string;
    buyerCNIC: string;
    buyerName: string;
    buyerType: BuyerType;
    phone: string;
    city: string;
  }>({
    buyerNTN: '',
    buyerCNIC: '',
    buyerName: '',
    buyerType: 'Registered',
    phone: '',
    city: '',
  });

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      buyerNTN: '',
      buyerCNIC: '',
      buyerName: '',
      buyerType: 'Registered',
      phone: '',
      city: '',
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (buyer: BuyerRecord) => {
    setEditingId(buyer.id);
    setFormData({
      buyerNTN: buyer.buyerNTN,
      buyerCNIC: buyer.buyerCNIC,
      buyerName: buyer.buyerName,
      buyerType: buyer.buyerType,
      phone: buyer.phone || '',
      city: buyer.city || '',
    });
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.buyerName.trim()) {
      alert('Buyer Name is required');
      return;
    }

    if (editingId) {
      onUpdateBuyer({
        id: editingId,
        buyerNTN: formData.buyerNTN.trim(),
        buyerCNIC: formData.buyerCNIC.trim(),
        buyerName: formData.buyerName.trim(),
        buyerType: formData.buyerType,
        phone: formData.phone.trim(),
        city: formData.city.trim(),
      });
      showNotice(`Buyer "${formData.buyerName}" updated successfully.`);
    } else {
      const newBuyer: BuyerRecord = {
        id: `buyer-${Date.now()}`,
        buyerNTN: formData.buyerNTN.trim(),
        buyerCNIC: formData.buyerCNIC.trim(),
        buyerName: formData.buyerName.trim(),
        buyerType: formData.buyerType,
        phone: formData.phone.trim(),
        city: formData.city.trim(),
      };
      onAddBuyer(newBuyer);
      showNotice(`Buyer "${formData.buyerName}" added successfully.`);
    }

    setIsFormOpen(false);
    setEditingId(null);
  };

  const handleConfirmDelete = () => {
    if (buyerToDelete) {
      onDeleteBuyer(buyerToDelete.id);
      showNotice(`Buyer "${buyerToDelete.buyerName}" removed.`);
      setBuyerToDelete(null);
    }
  };

  const filteredBuyers = buyers.filter((b) => {
    const matchesSearch = 
      b.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.buyerNTN.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.buyerCNIC.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.city && b.city.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = typeFilter === 'all' || b.buyerType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Store & Sales
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs text-slate-500">Commercial Directory</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Buyers Management
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Maintain registered and unregistered buyer profiles with NTN, CNIC, and category designations for POS invoicing.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Buyer</span>
        </button>
      </div>

      {notification && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Buyer Form Modal / Inline Box */}
      {isFormOpen && (
        <div className="bg-slate-50 border border-blue-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-600" />
              {editingId ? 'Edit Buyer Details' : 'Add New Buyer'}
            </h3>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Buyer Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.buyerName}
                onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })}
                placeholder="e.g. National Cement Ltd."
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Buyer NTN
              </label>
              <input
                type="text"
                value={formData.buyerNTN}
                onChange={(e) => setFormData({ ...formData, buyerNTN: e.target.value })}
                placeholder="e.g. 4192831-2"
                className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Buyer CNIC
              </label>
              <input
                type="text"
                value={formData.buyerCNIC}
                onChange={(e) => setFormData({ ...formData, buyerCNIC: e.target.value })}
                placeholder="e.g. 54401-1829301-3"
                className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Buyer Type
              </label>
              <select
                value={formData.buyerType}
                onChange={(e) => setFormData({ ...formData, buyerType: e.target.value as BuyerType })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="Registered">Registered</option>
                <option value="Unregistered">Unregistered</option>
                <option value="Corporate">Corporate</option>
                <option value="Wholesaler">Wholesaler</option>
                <option value="Retailer">Retailer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+92 300 1234567"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                City / Region
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g. Quetta / Lahore"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-2 flex items-end justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                {editingId ? 'Update Buyer' : 'Save Buyer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search buyers by name, NTN, CNIC, or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 whitespace-nowrap">Filter Type:</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">All Types ({buyers.length})</option>
            <option value="Registered">Registered</option>
            <option value="Unregistered">Unregistered</option>
            <option value="Corporate">Corporate</option>
            <option value="Wholesaler">Wholesaler</option>
            <option value="Retailer">Retailer</option>
          </select>
        </div>
      </div>

      {/* Buyers Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 w-12 text-center">Sr.</th>
                <th className="py-3 px-4">Buyer Name</th>
                <th className="py-3 px-4">Buyer NTN</th>
                <th className="py-3 px-4">Buyer CNIC</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredBuyers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No buyers found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredBuyers.map((b, idx) => (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-center text-slate-400 font-mono text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {b.buyerName}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {b.buyerNTN || '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {b.buyerCNIC || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        b.buyerType === 'Corporate'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : b.buyerType === 'Registered'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : b.buyerType === 'Wholesaler'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {b.buyerType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {b.phone || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {b.city || '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(b)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                          title="Edit Buyer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setBuyerToDelete(b)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          title="Delete Buyer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {buyerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Confirm Buyer Deletion</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to delete buyer <strong className="text-slate-900">{buyerToDelete.buyerName}</strong> (NTN: {buyerToDelete.buyerNTN || 'N/A'})?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBuyerToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                Delete Buyer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
