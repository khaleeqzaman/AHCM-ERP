import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  FileText, 
  Save, 
  CheckCircle2, 
  Printer, 
  Download, 
  RotateCcw, 
  Eye, 
  ShieldCheck, 
  Layers
} from 'lucide-react';
import { CompanySettings } from '../../types/storeSales';
import { User } from '../../types/user';
import { exportUniversalCsv, getCachedCompanySettings } from '../../utils/exportCsv';
import { printConcernedTable } from '../../utils/printTable';
import { getTodayFormatted } from '../../utils/formatters';

interface SettingsScreenProps {
  companySettings: CompanySettings;
  onSaveSettings: (settings: CompanySettings) => void;
  currentUser?: User;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  companySettings: initialSettings,
  onSaveSettings,
  currentUser,
}) => {
  const [formData, setFormData] = useState<CompanySettings>(() => {
    return initialSettings && initialSettings.companyName
      ? initialSettings
      : getCachedCompanySettings();
  });

  const [isSaved, setIsSaved] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (initialSettings && initialSettings.companyName) {
      setFormData(initialSettings);
    }
  }, [initialSettings]);

  const handleChange = (field: keyof CompanySettings, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    setIsSaved(false);
  };

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Company physical/office address is required';
    }
    if (!formData.contactNumber?.trim()) {
      newErrors.contactNumber = 'Contact phone number is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!formData.email.includes('@')) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSaveSettings(formData);
    setIsSaved(true);
    setSavedMessage('Company settings saved successfully! All CSV exports and print operations will now use this updated header.');
    setTimeout(() => {
      setIsSaved(false);
    }, 4500);
  };

  const handleResetToDefault = () => {
    const defaultSettings: CompanySettings = {
      companyName: 'AL-HAMD COAL MINES & METALS (PVT) LTD.',
      address: 'Office #102, Mining Complex, Quetta / Head Office, Pakistan',
      contactNumber: '+92 81 2839102',
      email: 'info@alhamdmining.com',
      ntnNumber: '7382910-4',
      openingCoalStock: 0,
    };
    setFormData(defaultSettings);
    setErrors({});
  };

  const handleTestPrint = () => {
    printConcernedTable('live-header-preview-box', 'Sample Document Header Preview', {
      companySettings: formData,
      tableName: 'Official Preview Table',
      reportDate: getTodayFormatted(),
      subtitle: 'System Header Verification Document',
    });
  };

  const handleTestExport = () => {
    exportUniversalCsv('system_header_preview_export.csv', {
      tableName: 'System Configuration Preview Table',
      companySettings: formData,
      reportDate: getTodayFormatted(),
      headers: ['Setting Field', 'Configured Value', 'Status'],
      rows: [
        ['Company Legal Name', formData.companyName, 'Active'],
        ['Head Office Address', formData.address, 'Active'],
        ['Contact Phone', formData.contactNumber, 'Active'],
        ['Official Email', formData.email, 'Active'],
        ['NTN Registration', formData.ntnNumber, 'Active'],
      ],
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Company & Document Header Settings
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                Admin Console
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure official company name, address, phone, email, and NTN. These details are automatically embedded as the official header in all CSV exports and printed reports across all modules.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleTestPrint}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Preview standard print layout with configured header"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Test Print</span>
          </button>
          <button
            type="button"
            onClick={handleTestExport}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
            title="Download test CSV with configured header"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Test Export</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {isSaved && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 text-emerald-800 shadow-xs animate-in fade-in duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="text-xs font-medium">{savedMessage}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration Form */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Organization Profile & Header Information
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Ensure accuracy as these fields will brand all formal statements and registers.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetToDefault}
              className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              title="Reset form fields to system defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Defaults</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Company Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Company Legal Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  placeholder="e.g. AL-HAMD COAL MINES & METALS (PVT) LTD."
                  className={`w-full pl-9 pr-3 py-2 text-xs font-medium rounded-lg border ${
                    errors.companyName ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:ring-blue-200'
                  } focus:outline-hidden focus:ring-2 bg-slate-50/50 text-slate-900`}
                />
              </div>
              {errors.companyName && (
                <p className="text-[11px] text-red-600 mt-1 font-medium">{errors.companyName}</p>
              )}
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Head Office & Physical Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute top-2.5 left-3 text-slate-400 pointer-events-none">
                  <MapPin className="w-4 h-4" />
                </div>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="e.g. Office #102, Mining Complex, Quetta / Head Office, Pakistan"
                  className={`w-full pl-9 pr-3 py-2 text-xs font-medium rounded-lg border ${
                    errors.address ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:ring-blue-200'
                  } focus:outline-hidden focus:ring-2 bg-slate-50/50 text-slate-900`}
                />
              </div>
              {errors.address && (
                <p className="text-[11px] text-red-600 mt-1 font-medium">{errors.address}</p>
              )}
            </div>

            {/* Contact Phone & Email in Two Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Contact Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={formData.contactNumber}
                    onChange={(e) => handleChange('contactNumber', e.target.value)}
                    placeholder="e.g. +92 81 2839102"
                    className={`w-full pl-9 pr-3 py-2 text-xs font-medium rounded-lg border ${
                      errors.contactNumber ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:ring-blue-200'
                    } focus:outline-hidden focus:ring-2 bg-slate-50/50 text-slate-900`}
                  />
                </div>
                {errors.contactNumber && (
                  <p className="text-[11px] text-red-600 mt-1 font-medium">{errors.contactNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Official Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="e.g. info@alhamdmining.com"
                    className={`w-full pl-9 pr-3 py-2 text-xs font-medium rounded-lg border ${
                      errors.email ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:ring-blue-200'
                    } focus:outline-hidden focus:ring-2 bg-slate-50/50 text-slate-900`}
                  />
                </div>
                {errors.email && (
                  <p className="text-[11px] text-red-600 mt-1 font-medium">{errors.email}</p>
                )}
              </div>
            </div>

            {/* NTN Number & Opening Coal Stock */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  National Tax Number (NTN / STRN)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={formData.ntnNumber}
                    onChange={(e) => handleChange('ntnNumber', e.target.value)}
                    placeholder="e.g. 7382910-4"
                    className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-200 bg-slate-50/50 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Opening Coal Stock (Tons)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Layers className="w-4 h-4" />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.openingCoalStock ?? 0}
                    onChange={(e) => handleChange('openingCoalStock', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-200 bg-slate-50/50 text-slate-900 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                Persistent to Cloud SQL & Local Storage
              </span>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Company Settings</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Document Header Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Live Document Header Preview
                </h3>
              </div>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                Print & Export Layout
              </span>
            </div>

            {/* Paper-like Preview Card */}
            <div
              id="live-header-preview-box"
              className="bg-amber-50/20 border-2 border-dashed border-slate-300 rounded-xl p-5 shadow-inner"
            >
              {/* Header Rendering */}
              <div className="text-center space-y-1 pb-3">
                <h4 className="text-base font-extrabold uppercase tracking-wider text-slate-950 font-serif">
                  {formData.companyName.trim() || 'AL-HAMD COAL MINES & METALS (PVT) LTD.'}
                </h4>
                {formData.address && (
                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed max-w-sm mx-auto">
                    {formData.address}
                  </p>
                )}
                <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 font-mono flex-wrap pt-0.5">
                  {formData.contactNumber && <span>Phone: {formData.contactNumber}</span>}
                  {formData.email && <span>• Email: {formData.email}</span>}
                  {formData.ntnNumber && <span>• NTN: {formData.ntnNumber}</span>}
                </div>
              </div>

              {/* Concerned Table Name & Date Line */}
              <div className="mt-2 pt-2 border-t-2 border-slate-900 flex items-center justify-between text-xs font-bold">
                <div>
                  <span className="uppercase tracking-wider text-slate-950 font-black text-xs">
                    Sample Concerned Table Name
                  </span>
                  <div className="text-[10px] font-normal text-slate-500">
                    Official Audit & Operational Record
                  </div>
                </div>
                <div className="text-right font-mono text-[11px] text-slate-800 font-semibold">
                  Date: {getTodayFormatted()}
                </div>
              </div>

              {/* Sample Table Mock */}
              <div className="mt-4 pt-2 border-t border-slate-200">
                <table className="w-full text-left text-[10px] text-slate-600">
                  <thead>
                    <tr className="border-b border-slate-300 text-slate-900 font-bold">
                      <th className="py-1">Col 1</th>
                      <th className="py-1">Col 2</th>
                      <th className="py-1 text-right">Amount / Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-200/60">
                      <td className="py-1">Sample Row Entry A</td>
                      <td className="py-1">Active</td>
                      <td className="py-1 text-right font-mono font-bold">1,450.00</td>
                    </tr>
                    <tr>
                      <td className="py-1">Sample Row Entry B</td>
                      <td className="py-1">Verified</td>
                      <td className="py-1 text-right font-mono font-bold">3,820.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
              <strong>Header Compliance:</strong> All operations for export and print will mention this company header, followed by the concerned table name and date on line 4 & 5 (CSV) and top document section (Print).
            </p>
          </div>

          {/* Quick Specifications Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
            <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">
              Document Header Standard
            </span>
            <ul className="text-[11px] text-slate-600 space-y-1 list-disc pl-4">
              <li>Line 1: <strong>Company Name</strong> (legal entity)</li>
              <li>Line 2: <strong>Address</strong> (headquarters/site location)</li>
              <li>Line 3: <strong>Contact Info</strong> (Phone, Email, NTN)</li>
              <li>Line 4: <strong>Concerned Table Name</strong></li>
              <li>Line 5: <strong>Date</strong> (date of statement/generation)</li>
              <li>Line 6+: <strong>Table Headers & Data Rows</strong></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
