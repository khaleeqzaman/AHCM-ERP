import React, { useState } from 'react';
import { Landmark, ArrowLeft, CheckCircle2, AlertCircle, Building2 } from 'lucide-react';
import { BankRecord } from '../../types/treasury';

interface AddBankFormProps {
  existingBanks: BankRecord[];
  onAddBank: (bank: BankRecord) => void;
  onNavigateToList: () => void;
}

export const AddBankForm: React.FC<AddBankFormProps> = ({
  existingBanks,
  onAddBank,
  onNavigateToList,
}) => {
  const [bankName, setBankName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const nextSrNo = existingBanks.length + 1;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!bankName.trim()) {
      setError('Bank Name is required.');
      return;
    }
    if (!branchName.trim()) {
      setError('Branch Name is required.');
      return;
    }
    if (!branchCode.trim()) {
      setError('Branch Code is required.');
      return;
    }

    const newBank: BankRecord = {
      id: `bank-${Date.now()}`,
      srNo: nextSrNo,
      bankName: bankName.trim(),
      branchName: branchName.trim(),
      branchCode: branchCode.trim(),
      address: address.trim() || 'N/A',
      createdAt: new Date().toISOString(),
    };

    onAddBank(newBank);
    setSuccess(`Bank "${newBank.bankName}" added successfully.`);

    // Reset fields
    setBankName('');
    setBranchName('');
    setBranchCode('');
    setAddress('');

    setTimeout(() => {
      setSuccess(null);
      onNavigateToList();
    }, 1200);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Bank Management
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">Institution Setup</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <Landmark className="w-5 h-5 text-blue-600" />
            Add Bank Form
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Register a new partner commercial bank and branch code into the treasury directory.
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateToList}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>View List of Banks</span>
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Form Container */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* Sr. Auto-generated display */}
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-slate-800">Bank Directory Index (Sr. No.)</span>
            </div>
            <span className="font-mono text-sm font-bold text-blue-700 bg-white px-2.5 py-1 rounded border border-slate-200">
              #{nextSrNo} (Auto-generated)
            </span>
          </div>

          {/* Bank Name */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Bank Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Standard Chartered Bank, Citibank, National Bank"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 font-medium"
            />
          </div>

          {/* Branch Name & Branch Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Branch Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Civic Centre Corporate Branch"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Branch Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 0421, SC-019"
                value={branchCode}
                onChange={(e) => setBranchCode(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 font-mono"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Branch Address *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Full physical street address, building, district, city..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onNavigateToList}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              Save Bank
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
