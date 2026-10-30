import React, { useState } from 'react';
import { 
  Building2, 
  Save, 
  CheckCircle2, 
  MapPin, 
  FileSpreadsheet, 
  Phone, 
  Mail, 
  FileText 
} from 'lucide-react';
import { CompanySettings } from '../../types/storeSales';

interface CompanySettingsViewProps {
  settings: CompanySettings;
  onSaveSettings: (settings: CompanySettings) => void;
}

export const CompanySettingsView: React.FC<CompanySettingsViewProps> = ({
  settings,
  onSaveSettings,
}) => {
  const [formData, setFormData] = useState<CompanySettings>(settings);
  const [notification, setNotification] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setNotification('Company settings saved successfully. All export headers will use these details.');
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Store & Sales
          </span>
          <span className="text-slate-300">/</span>
          <span className="text-xs text-slate-500">System Configuration</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-slate-700" />
          Company Settings & Report Header Configuration
        </h2>
        <p className="text-sm text-slate-600 mt-0.5">
          Define company name and physical address used automatically on the headers of all generated reports, POS sheets, and exports.
        </p>
      </div>

      {notification && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Settings Form */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Company Name (Export Title) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              placeholder="e.g. AHCM Mining & Minerals Corp."
              className="w-full text-sm font-semibold px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              This name will be displayed at the very top of all Coal Sales Reports, POS sheets, and Store Summaries.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Company Address <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Plot number, industrial area, city, province..."
              className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Physical mining site or head office address printed below company name on report headers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Company NTN / STRN
              </label>
              <input
                type="text"
                value={formData.ntnNumber}
                onChange={(e) => setFormData({ ...formData, ntnNumber: e.target.value })}
                placeholder="e.g. 7829104-5"
                className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                placeholder="+92 81 2839100"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="info@ahcm-minerals.com"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Company Settings</span>
            </button>
          </div>
        </form>
      </div>

      {/* Live Export Header Preview */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-slate-500" />
            Live Export Header Preview
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Automatic styling for CSV & Printouts</span>
        </div>

        <div className="bg-white border border-slate-300 rounded-lg p-6 text-center shadow-xs space-y-1">
          <h3 className="text-lg font-extrabold uppercase tracking-wide text-slate-900">
            {formData.companyName || 'COMPANY NAME'}
          </h3>
          <p className="text-xs text-slate-600 max-w-lg mx-auto font-medium">
            {formData.address || 'Company Address Line'}
          </p>
          <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 pt-1 font-mono">
            {formData.ntnNumber && <span>NTN: {formData.ntnNumber}</span>}
            {formData.contactNumber && <span>Phone: {formData.contactNumber}</span>}
            {formData.email && <span>Email: {formData.email}</span>}
          </div>
          <div className="pt-3 border-t border-dashed border-slate-200 mt-3">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded">
              MONTHLY COAL SALES REPORT — OCTOBER 2026
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
