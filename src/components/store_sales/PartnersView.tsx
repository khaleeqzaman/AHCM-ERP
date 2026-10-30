import React, { useState } from 'react';
import { 
  Handshake, 
  Plus, 
  Trash2, 
  Edit2, 
  Search, 
  CheckCircle2, 
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { PartnerRecord } from '../../types/storeSales';

interface PartnersViewProps {
  partners: PartnerRecord[];
  onAddPartner: (partner: PartnerRecord) => void;
  onUpdatePartner: (partner: PartnerRecord) => void;
  onDeletePartner: (id: string) => void;
  onToggleActive: (id: string) => void;
  onToggleShowInReport: (id: string) => void;
}

export const PartnersView: React.FC<PartnersViewProps> = ({
  partners,
  onAddPartner,
  onUpdatePartner,
  onDeletePartner,
  onToggleActive,
  onToggleShowInReport,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [partnerToDelete, setPartnerToDelete] = useState<PartnerRecord | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    code: string;
    notes: string;
    isActive: boolean;
    showInReport: boolean;
  }>({
    name: '',
    code: '',
    notes: '',
    isActive: true,
    showInReport: true,
  });

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      name: '',
      code: '',
      notes: '',
      isActive: true,
      showInReport: true,
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (p: PartnerRecord) => {
    setEditingId(p.id);
    setFormData({
      name: p.name,
      code: p.code,
      notes: p.notes || '',
      isActive: p.isActive,
      showInReport: p.showInReport,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Partner Name is required');
      return;
    }

    if (editingId) {
      onUpdatePartner({
        id: editingId,
        name: formData.name.trim(),
        code: formData.code.trim() || formData.name.substring(0, 4).toUpperCase(),
        notes: formData.notes.trim(),
        isActive: formData.isActive,
        showInReport: formData.showInReport,
      });
      showNotice(`Partner "${formData.name}" updated successfully.`);
    } else {
      const newPartner: PartnerRecord = {
        id: `partner-${Date.now()}`,
        name: formData.name.trim(),
        code: formData.code.trim() || formData.name.substring(0, 4).toUpperCase(),
        notes: formData.notes.trim(),
        isActive: formData.isActive,
        showInReport: formData.showInReport,
      };
      onAddPartner(newPartner);
      showNotice(`Partner "${formData.name}" created and added as report column.`);
    }

    setIsFormOpen(false);
    setEditingId(null);
  };

  const handleConfirmDelete = () => {
    if (partnerToDelete) {
      onDeletePartner(partnerToDelete.id);
      showNotice(`Partner "${partnerToDelete.name}" deleted.`);
      setPartnerToDelete(null);
    }
  };

  const filteredPartners = partners.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      p.code.toLowerCase().includes(term) ||
      (p.notes && p.notes.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Store & Sales
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs text-slate-500">Mining & Commercial Partners</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <Handshake className="w-5 h-5 text-emerald-600" />
            Partners Directory & Report Columns
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Manage mining syndicates and lease partners. Enable or disable column visibility in the Monthly Coal Sales Report.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Partner</span>
        </button>
      </div>

      {notification && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Form Modal / Inline Box */}
      {isFormOpen && (
        <div className="bg-slate-50 border border-emerald-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Handshake className="w-4 h-4 text-emerald-600" />
              {editingId ? 'Edit Partner' : 'Add New Partner'}
            </h3>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Partner / Company Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Balochistan Coal Mining Syndicate"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Short Code (Column Header)
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g. BCMS"
                className="w-full text-xs font-mono uppercase px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lease Details / Notes
              </label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Lease block, pit reference, or contact remarks..."
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            <div className="flex items-center gap-6 sm:col-span-3 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span>Active Status (Allows recording sales)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.showInReport}
                  onChange={(e) => setFormData({ ...formData, showInReport: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span>Show as Column in Coal Sales Report</span>
              </label>
            </div>

            <div className="sm:col-span-3 flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                {editingId ? 'Update Partner' : 'Save Partner'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search partners by name, code, or lease notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Partners Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 w-12 text-center">Sr.</th>
                <th className="py-3 px-4">Partner Name</th>
                <th className="py-3 px-4">Short Code</th>
                <th className="py-3 px-4">Lease / Notes</th>
                <th className="py-3 px-4 text-center">Active Status</th>
                <th className="py-3 px-4 text-center">Coal Report Column</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredPartners.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No partners found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredPartners.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-center text-slate-400 font-mono text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {p.name}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                        {p.code}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {p.notes || '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => onToggleActive(p.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors cursor-pointer ${
                          p.isActive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                        title="Click to toggle active status"
                      >
                        {p.isActive ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Active</span>
                          </>
                        ) : (
                          <span>Deactivated</span>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => onToggleShowInReport(p.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors cursor-pointer ${
                          p.showInReport
                            ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                            : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                        }`}
                        title="Toggle inclusion as column in Coal Sales Report"
                      >
                        {p.showInReport ? (
                          <>
                            <Eye className="w-3 h-3 text-blue-600" />
                            <span>Included</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3 text-slate-400" />
                            <span>Hidden</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                          title="Edit Partner"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPartnerToDelete(p)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          title="Delete Partner"
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
      {partnerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Confirm Partner Removal</h3>
                <p className="text-xs text-slate-500">This will remove partner from column reports.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to delete partner <strong className="text-slate-900">{partnerToDelete.name}</strong> ({partnerToDelete.code})?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPartnerToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                Delete Partner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
