import React, { useState } from 'react';
import { CreditCard, ArrowLeft, CheckCircle2, AlertCircle, Building2 } from 'lucide-react';
import { BankRecord, BankAccountRecord } from '../../types/treasury';
import { DatePickerInput } from '../common/DatePickerInput';

interface AddBankAccountFormProps {
  banks: BankRecord[];
  existingAccounts: BankAccountRecord[];
  initialSelectedBankId?: string;
  onAddAccount: (account: BankAccountRecord) => void;
  onNavigateToList: () => void;
}

export const AddBankAccountForm: React.FC<AddBankAccountFormProps> = ({
  banks,
  existingAccounts,
  initialSelectedBankId,
  onAddAccount,
  onNavigateToList,
}) => {
  const getTodayDDMMYYYY = () => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const [selectedBankId, setSelectedBankId] = useState<string>(
    initialSelectedBankId || banks[0]?.id || ''
  );
  const [accountNumber, setAccountNumber] = useState('');
  const [accountTitle, setAccountTitle] = useState('');
  const [openingBalance, setOpeningBalance] = useState<number | ''>('');
  const [openingBalanceDate, setOpeningBalanceDate] = useState(getTodayDDMMYYYY());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const nextSrNo = existingAccounts.length + 1;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const targetBank = banks.find((b) => b.id === selectedBankId);
    if (!targetBank) {
      setError('Please select a valid partner bank.');
      return;
    }
    if (!accountNumber.trim()) {
      setError('Account Number is required.');
      return;
    }
    if (!accountTitle.trim()) {
      setError('Account Title is required.');
      return;
    }
    if (openingBalance === '' || isNaN(Number(openingBalance))) {
      setError('Please enter a valid Opening Balance.');
      return;
    }
    if (!openingBalanceDate.trim()) {
      setError('Opening Balance Date (format: DD-MM-YYYY) is required.');
      return;
    }

    const newAccount: BankAccountRecord = {
      id: `acc-${Date.now()}`,
      srNo: nextSrNo,
      bankId: targetBank.id,
      bankName: targetBank.bankName,
      accountNumber: accountNumber.trim(),
      accountTitle: accountTitle.trim(),
      openingBalance: Number(openingBalance) || 0,
      openingBalanceDate: openingBalanceDate.trim(),
      transactions: [],
    };

    onAddAccount(newAccount);
    setSuccess(`Bank Account ${newAccount.accountNumber} added successfully.`);

    // Reset
    setAccountNumber('');
    setAccountTitle('');
    setOpeningBalance('');

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
            <span className="text-xs text-slate-500">Account Onboarding</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            Add Bank Account Form
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Attach a new bank ledger account with opening balance and value date.
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateToList}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>View List of Bank Accounts</span>
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
          {/* Select Bank (Dropdown populated with bank names from List of Banks) */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Select Bank *
            </label>
            <select
              value={selectedBankId}
              onChange={(e) => setSelectedBankId(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 font-medium"
            >
              {banks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.bankName} — Branch {b.branchCode} ({b.branchName})
                </option>
              ))}
            </select>
          </div>

          {/* Account Title */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Account Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. AHCM ERP Main Operating Account, Trade Escrow Account"
              value={accountTitle}
              onChange={(e) => setAccountTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 font-medium"
            />
          </div>

          {/* Account Number */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Account No. *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. PK92HABB0004210982341201 or SCB-USD-0019283746"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 font-mono font-semibold"
            />
          </div>

          {/* Opening Balance and Date of Opening Balance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Opening Balance *
              </label>
              <input
                type="number"
                step="1"
                min="0"
                required
                placeholder="0"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value === '' ? '' : Math.round(Number(e.target.value)))}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 font-mono tabular-nums font-semibold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Date of Opening Balance *
              </label>
              <DatePickerInput
                required
                value={openingBalanceDate}
                onChange={(newDate) => setOpeningBalanceDate(newDate)}
                outputFormat="DD-MM-YYYY"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 font-mono"
              />
            </div>
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
              Save Bank Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
