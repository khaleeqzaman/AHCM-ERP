import React, { useState } from 'react';
import { 
  FolderTree, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  X, 
  Hash, 
  Layers, 
  BookOpen, 
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { ChartAccount, AccountType } from '../../types/accounting';

interface ChartOfAccountsViewProps {
  accounts: ChartAccount[];
  onAddAccount: (account: ChartAccount) => void;
  onUpdateAccount: (account: ChartAccount) => void;
}

export const ChartOfAccountsView: React.FC<ChartOfAccountsViewProps> = ({
  accounts,
  onAddAccount,
  onUpdateAccount,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Form State for New Account
  const [selectedType, setSelectedType] = useState<AccountType>('Asset');
  const [typeDigit, setTypeDigit] = useState<number>(1);
  const [classDigit, setClassDigit] = useState<number>(1);
  const [groupCode, setGroupCode] = useState<string>('01');
  const [subCode, setSubCode] = useState<string>('003');
  const [accountName, setAccountName] = useState<string>('');
  const [classification, setClassification] = useState<string>('Current Assets');
  const [groupName, setGroupName] = useState<string>('Cash & Cash Equivalents');
  const [normalBalance, setNormalBalance] = useState<'Debit' | 'Credit'>('Debit');
  const [openingBalance, setOpeningBalance] = useState<number | ''>(0);
  const [description, setDescription] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Auto-update Type Digit & Normal Balance when Account Type changes
  const handleTypeChange = (type: AccountType) => {
    setSelectedType(type);
    switch (type) {
      case 'Asset':
        setTypeDigit(1);
        setClassDigit(1);
        setClassification('Current Assets');
        setGroupName('Cash & Cash Equivalents');
        setNormalBalance('Debit');
        break;
      case 'Liability':
        setTypeDigit(2);
        setClassDigit(1);
        setClassification('Current Liabilities');
        setGroupName('Trade & Other Payables');
        setNormalBalance('Credit');
        break;
      case 'Equity':
        setTypeDigit(3);
        setClassDigit(1);
        setClassification('Share Capital');
        setGroupName('Owner Equity');
        setNormalBalance('Credit');
        break;
      case 'Revenue':
        setTypeDigit(4);
        setClassDigit(1);
        setClassification('Operating Revenue');
        setGroupName('Sales Revenue');
        setNormalBalance('Credit');
        break;
      case 'Expense':
        setTypeDigit(5);
        setClassDigit(1);
        setClassification('Cost of Goods Sold');
        setGroupName('Direct Costs');
        setNormalBalance('Debit');
        break;
    }
  };

  const computedCode = `${typeDigit}-${classDigit}-${groupCode.padStart(2, '0')}-${subCode.padStart(3, '0')}`;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!accountName.trim()) {
      setFormError('Account name is required.');
      return;
    }

    const codeExists = accounts.some(
      (a) => a.code.toLowerCase() === computedCode.toLowerCase()
    );
    if (codeExists) {
      setFormError(`Account code "${computedCode}" already exists. Please adjust Group or Sub-code.`);
      return;
    }

    const newAccount: ChartAccount = {
      id: `coa-${Date.now()}`,
      code: computedCode,
      typeDigit,
      classDigit,
      groupCode: groupCode.padStart(2, '0'),
      subCode: subCode.padStart(3, '0'),
      name: accountName.trim(),
      accountType: selectedType,
      classification,
      groupName,
      normalBalance,
      openingBalance: Number(openingBalance) || 0,
      currentBalance: Number(openingBalance) || 0,
      description: description.trim(),
      isActive: true,
    };

    onAddAccount(newAccount);
    setIsAddModalOpen(false);
    setNotification(`Account ${newAccount.code} — ${newAccount.name} added successfully.`);
    setTimeout(() => setNotification(null), 3500);

    // Reset
    setAccountName('');
    setDescription('');
    setOpeningBalance(0);
  };

  const filteredAccounts = accounts.filter((a) => {
    const matchesSearch =
      a.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.classification.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'All' || a.accountType === typeFilter;
    return matchesSearch && matchesType;
  });

  // Calculate COA Totals
  const totalAssets = accounts
    .filter((a) => a.accountType === 'Asset')
    .reduce((sum, a) => sum + a.currentBalance, 0);
  const totalLiabilities = accounts
    .filter((a) => a.accountType === 'Liability')
    .reduce((sum, a) => sum + a.currentBalance, 0);
  const totalEquity = accounts
    .filter((a) => a.accountType === 'Equity')
    .reduce((sum, a) => sum + a.currentBalance, 0);

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Accountant System
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">T-C-GG-SSS Standard</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-emerald-600" />
            Standard Chart of Accounts (COA)
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Structured 4-tier hierarchy: Type (T) - Classification (C) - Group (GG) - Subsidiary (SSS).
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Account (T-C-GG-SSS)</span>
        </button>
      </div>

      {/* Notification */}
      {notification && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* COA Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {(['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'] as AccountType[]).map((type) => {
          const count = accounts.filter((a) => a.accountType === type).length;
          const typeDigit =
            type === 'Asset'
              ? '1'
              : type === 'Liability'
              ? '2'
              : type === 'Equity'
              ? '3'
              : type === 'Revenue'
              ? '4'
              : '5';

          return (
            <div
              key={type}
              onClick={() => setTypeFilter(typeFilter === type ? 'All' : type)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                typeFilter === type
                  ? 'border-emerald-500 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-500'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-slate-500">Tier {typeDigit}</span>
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                    type === 'Asset' || type === 'Expense'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {type === 'Asset' || type === 'Expense' ? 'Normal Dr' : 'Normal Cr'}
                </span>
              </div>
              <div className="text-sm font-bold text-slate-900 mt-1">{type}s</div>
              <div className="text-xs text-slate-500 mt-0.5">{count} accounts</div>
            </div>
          );
        })}
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-3.5 border border-slate-200 rounded-xl shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search code (e.g. 1-1-01), account name, or group..."
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
            <option value="All">All Types ({accounts.length})</option>
            <option value="Asset">1 - Assets ({accounts.filter((a) => a.accountType === 'Asset').length})</option>
            <option value="Liability">2 - Liabilities ({accounts.filter((a) => a.accountType === 'Liability').length})</option>
            <option value="Equity">3 - Equity ({accounts.filter((a) => a.accountType === 'Equity').length})</option>
            <option value="Revenue">4 - Revenue ({accounts.filter((a) => a.accountType === 'Revenue').length})</option>
            <option value="Expense">5 - Expenses ({accounts.filter((a) => a.accountType === 'Expense').length})</option>
          </select>
        </div>
      </div>

      {/* COA Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4 font-mono">T-C-GG-SSS Code</th>
                <th className="py-3 px-4">Account Title & Description</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Classification</th>
                <th className="py-3 px-4">Group</th>
                <th className="py-3 px-4 text-center">Normal</th>
                <th className="py-3 px-4 text-right">Opening Bal</th>
                <th className="py-3 px-4 text-right">Current Bal</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No accounts match the current filter. Click "Add Account" to create a new T-C-GG-SSS account.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* T-C-GG-SSS Code */}
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700 whitespace-nowrap">
                      {acc.code}
                    </td>

                    {/* Name */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{acc.name}</div>
                      {acc.description && (
                        <div className="text-[11px] text-slate-500 truncate max-w-sm">
                          {acc.description}
                        </div>
                      )}
                    </td>

                    {/* Account Type */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                          acc.accountType === 'Asset'
                            ? 'bg-blue-50 text-blue-700'
                            : acc.accountType === 'Liability'
                            ? 'bg-amber-50 text-amber-800'
                            : acc.accountType === 'Equity'
                            ? 'bg-purple-50 text-purple-700'
                            : acc.accountType === 'Revenue'
                            ? 'bg-emerald-50 text-emerald-800'
                            : 'bg-rose-50 text-rose-800'
                        }`}
                      >
                        {acc.accountType}
                      </span>
                    </td>

                    {/* Classification */}
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {acc.classification}
                    </td>

                    {/* Group */}
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {acc.groupName}
                    </td>

                    {/* Normal Balance */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className="font-mono text-[11px] font-semibold text-slate-700">
                        {acc.normalBalance}
                      </span>
                    </td>

                    {/* Opening Bal */}
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600 whitespace-nowrap">
                      {acc.openingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Current Bal */}
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900 whitespace-nowrap">
                      {acc.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className="text-[11px] text-emerald-700 font-medium">
                        Active
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Account Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 max-w-xl w-full p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[11px] font-mono font-semibold text-emerald-600 uppercase tracking-wider">
                  T-C-GG-SSS Standard Architecture
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Create Chart of Account Head
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              {/* Computed Code Live Banner */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-emerald-800 font-medium block">
                    Generated T-C-GG-SSS Code:
                  </span>
                  <span className="font-mono text-base font-bold text-emerald-900 tracking-wider">
                    {computedCode}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-emerald-700 bg-white px-2 py-1 rounded border border-emerald-200">
                  Normal: {normalBalance}
                </span>
              </div>

              {/* 4 Code Segment Controls */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    T (Type Digit) *
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => handleTypeChange(e.target.value as AccountType)}
                    className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded font-medium text-slate-900"
                  >
                    <option value="Asset">1 - Asset</option>
                    <option value="Liability">2 - Liability</option>
                    <option value="Equity">3 - Equity</option>
                    <option value="Revenue">4 - Revenue</option>
                    <option value="Expense">5 - Expense</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    C (Class Digit) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="9"
                    required
                    value={classDigit}
                    onChange={(e) => setClassDigit(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    GG (Group 2-digit) *
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    required
                    value={groupCode}
                    onChange={(e) => setGroupCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded font-mono text-slate-900"
                    placeholder="01"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    SSS (Sub 3-digit) *
                  </label>
                  <input
                    type="text"
                    maxLength={3}
                    required
                    value={subCode}
                    onChange={(e) => setSubCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded font-mono text-slate-900"
                    placeholder="001"
                  />
                </div>
              </div>

              {/* Account Name */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Account Title / Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Factory Equipment Repairs & Overhaul"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900"
                />
              </div>

              {/* Classification and Group Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Classification Category
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Current Assets, Operating Expenses"
                    value={classification}
                    onChange={(e) => setClassification(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Group Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Cash & Bank, Direct Costs"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                </div>
              </div>

              {/* Opening Balance & Normal Balance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Opening Balance
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={openingBalance === 0 ? '' : openingBalance}
                    onChange={(e) => setOpeningBalance(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 font-mono tabular-nums"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Normal Balance
                  </label>
                  <select
                    value={normalBalance}
                    onChange={(e) => setNormalBalance(e.target.value as 'Debit' | 'Credit')}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  >
                    <option value="Debit">Debit (Dr)</option>
                    <option value="Credit">Credit (Cr)</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Description / Purpose
                </label>
                <input
                  type="text"
                  placeholder="Ledger audit notes, purpose, regulatory standard..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
