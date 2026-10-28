import React, { useState } from 'react';
import { Landmark, Plus, Search, Building2, CreditCard, Trash2 } from 'lucide-react';
import { BankRecord, BankAccountRecord } from '../../types/treasury';

interface ListBanksViewProps {
  banks: BankRecord[];
  bankAccounts: BankAccountRecord[];
  onNavigateToAddBank: () => void;
  onNavigateToAddAccount: (preselectedBankId?: string) => void;
  onDeleteBank?: (id: string) => void;
}

export const ListBanksView: React.FC<ListBanksViewProps> = ({
  banks,
  bankAccounts,
  onNavigateToAddBank,
  onNavigateToAddAccount,
  onDeleteBank,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBanks = banks.filter((b) => {
    const term = searchTerm.toLowerCase();
    return (
      b.bankName.toLowerCase().includes(term) ||
      b.branchName.toLowerCase().includes(term) ||
      b.branchCode.toLowerCase().includes(term) ||
      b.address.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Bank Management
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">Directory</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <Landmark className="w-5 h-5 text-blue-600" />
            List of Banks
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Registered partner banks, branch codes, and physical banking facilities.
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateToAddBank}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Bank</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-3.5 border border-slate-200 rounded-xl shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search bank name, branch code, city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
          />
        </div>

        <div className="text-xs text-slate-500">
          Total Banks: <strong className="text-slate-900 font-mono">{banks.length}</strong>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-3 w-14 text-center">Sr.</th>
                <th className="py-3 px-4 w-64">Bank Name</th>
                <th className="py-3 px-4 w-60">Branch Name</th>
                <th className="py-3 px-4 w-32 font-mono">Branch Code</th>
                <th className="py-3 px-4">Address</th>
                <th className="py-3 px-4 text-center w-32">Linked Accounts</th>
                <th className="py-3 px-4 text-center w-36">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBanks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No banks found matching search. Click "Add Bank" to register a new bank.
                  </td>
                </tr>
              ) : (
                filteredBanks.map((bank, index) => {
                  const linkedAccountsCount = bankAccounts.filter((a) => a.bankId === bank.id).length;

                  return (
                    <tr key={bank.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 text-center font-mono text-slate-500 font-medium">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>{bank.bankName}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {bank.branchName}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-blue-700 whitespace-nowrap">
                        {bank.branchCode}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={bank.address}>
                        {bank.address}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-slate-100 text-slate-700">
                          <CreditCard className="w-3 h-3 text-slate-500" />
                          {linkedAccountsCount}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onNavigateToAddAccount(bank.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-50 border border-blue-200 rounded transition-colors cursor-pointer"
                            title="Add Account for this Bank"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Account</span>
                          </button>

                          {onDeleteBank && (
                            <button
                              type="button"
                              onClick={() => onDeleteBank(bank.id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete Bank"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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
    </div>
  );
};
