import React, { useState } from 'react';
import { 
  FolderTree, 
  FileSpreadsheet, 
  BookOpen, 
  Scale, 
  Layers, 
  Plus, 
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { 
  ChartAccount, 
  VoucherDocument, 
  VoucherLine 
} from '../../types/accounting';
import { NavTarget } from '../../types';
import { formatWholeNumber } from '../../utils/formatters';
import { ChartOfAccountsView } from './ChartOfAccountsView';
import { VoucherEntryForm } from './VoucherEntryForm';
import { VouchersListView } from './VouchersListView';
import { LedgersView } from './LedgersView';
import { TrialBalanceView } from './TrialBalanceView';
import { sortAccountsByCode } from '../../utils/accountSort';

interface AccountingScreenProps {
  navTarget?: NavTarget | null;
  accounts: ChartAccount[];
  vouchers: VoucherDocument[];
  onAddAccount: (account: ChartAccount) => void;
  onUpdateAccount: (account: ChartAccount) => void;
  onDeleteAccount?: (id: string) => void;
  onImportAccounts?: (
    importedAccounts: ChartAccount[],
    overrideAll: boolean
  ) => Promise<{ success: boolean; count?: number; error?: string }> | void;
  onSaveVoucher: (voucher: VoucherDocument) => void;
  onDeleteVoucher?: (id: string) => void;
  onApproveVoucher: (id: string) => void;
  onPostVoucher: (id: string) => void;
  onCancelVoucher: (id: string, reason: string) => void;
  onReverseVoucher: (id: string, reason: string) => void;
}

export type AccountantTab = 
  | 'chart_of_accounts' 
  | 'voucher_entry' 
  | 'vouchers_list' 
  | 'ledgers' 
  | 'trial_balance';

export const AccountingScreen: React.FC<AccountingScreenProps> = ({
  navTarget,
  accounts,
  vouchers,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
  onImportAccounts,
  onSaveVoucher,
  onDeleteVoucher,
  onApproveVoucher,
  onPostVoucher,
  onCancelVoucher,
  onReverseVoucher,
}) => {
  const [activeTab, setActiveTab] = useState<AccountantTab>('chart_of_accounts');
  const [editingVoucher, setEditingVoucher] = useState<VoucherDocument | null>(null);
  const [openAddAccount, setOpenAddAccount] = useState<boolean>(false);
  const [isEditBannerActive, setIsEditBannerActive] = useState<boolean>(false);

  // Sync with navTarget from Sidebar
  React.useEffect(() => {
    if (!navTarget || navTarget.module !== 'accounting') return;

    if (navTarget.subPage === 'add_account') {
      setActiveTab('chart_of_accounts');
      setOpenAddAccount(true);
      setIsEditBannerActive(false);
    } else if (navTarget.subPage === 'chart_of_accounts') {
      setActiveTab('chart_of_accounts');
      setOpenAddAccount(false);
      setIsEditBannerActive(false);
    } else if (navTarget.subPage === 'create_voucher') {
      setEditingVoucher(null);
      setActiveTab('voucher_entry');
      setIsEditBannerActive(false);
    } else if (navTarget.subPage === 'edit_voucher') {
      setEditingVoucher(null);
      setActiveTab('vouchers_list');
      setIsEditBannerActive(true);
    } else if (navTarget.subPage === 'voucher_register') {
      setEditingVoucher(null);
      setActiveTab('vouchers_list');
      setIsEditBannerActive(false);
    } else if (navTarget.subPage === 'general_ledger') {
      setActiveTab('ledgers');
      setIsEditBannerActive(false);
    } else if (navTarget.subPage === 'trial_balance') {
      setActiveTab('trial_balance');
      setIsEditBannerActive(false);
    }
  }, [navTarget]);

  const handleEditVoucher = (voucher: VoucherDocument) => {
    setEditingVoucher(voucher);
    setIsEditBannerActive(false);
    setActiveTab('voucher_entry');
  };

  const handleOpenNewVoucher = () => {
    setEditingVoucher(null);
    setIsEditBannerActive(false);
    setActiveTab('voucher_entry');
  };

  const sortedAccounts = React.useMemo(() => sortAccountsByCode(accounts), [accounts]);

  const totalVoucherVolume = vouchers.reduce((sum, v) => sum + v.totalDebit, 0);

  return (
    <div className="space-y-6">
      {/* Accountant Module Top Header & Sub-Navigation */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                Independent Finance & Audit
              </span>
              <span className="text-slate-300">/</span>
              <span className="text-xs text-slate-500">Accountant Workspace</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
              Accounting Module
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Standard Chart of Accounts (T-C-GG-SSS), 5 voucher types (CP, CR, BP, BR, JV), approval/posting workflows, and immutable General Ledger.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[11px]">COA Accounts</span>
              <span className="text-sm font-bold font-mono tabular-nums text-slate-900">
                {accounts.length} Heads
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Vouchers Posted</span>
              <span className="text-sm font-bold font-mono tabular-nums text-slate-900">
                {vouchers.filter((v) => v.status === 'Posted').length} / {vouchers.length}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Posted Ledger Turnover</span>
              <span className="text-sm font-bold font-mono tabular-nums text-emerald-700">
                {formatWholeNumber(vouchers.filter((v) => v.status === 'Posted').reduce((sum, v) => sum + v.totalDebit, 0))}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons Bar for Accountant Tools */}
        <div className="pt-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Accountant Tools:
            </span>

            <div className="flex flex-wrap items-center gap-2">
              {/* Tab 1: Chart of Accounts */}
              <button
                type="button"
                onClick={() => setActiveTab('chart_of_accounts')}
                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shadow-xs whitespace-nowrap cursor-pointer ${
                  activeTab === 'chart_of_accounts'
                    ? 'bg-emerald-600 text-white ring-2 ring-emerald-600/30'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <FolderTree className="w-3.5 h-3.5 shrink-0" />
                <span>Chart of Accounts</span>
              </button>

              {/* Tab 2: Double-Entry Voucher */}
              <button
                type="button"
                onClick={handleOpenNewVoucher}
                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shadow-xs whitespace-nowrap cursor-pointer ${
                  activeTab === 'voucher_entry'
                    ? 'bg-emerald-600 text-white ring-2 ring-emerald-600/30'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span>Create Voucher (CP/CR/BP/BR/JV)</span>
              </button>

              {/* Tab 3: Vouchers List */}
              <button
                type="button"
                onClick={() => {
                  setEditingVoucher(null);
                  setActiveTab('vouchers_list');
                }}
                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shadow-xs whitespace-nowrap cursor-pointer ${
                  activeTab === 'vouchers_list'
                    ? 'bg-emerald-600 text-white ring-2 ring-emerald-600/30'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
                <span>Vouchers Register</span>
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
                  {vouchers.length}
                </span>
              </button>

              {/* Tab 4: General Ledger */}
              <button
                type="button"
                onClick={() => setActiveTab('ledgers')}
                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shadow-xs whitespace-nowrap cursor-pointer ${
                  activeTab === 'ledgers'
                    ? 'bg-emerald-600 text-white ring-2 ring-emerald-600/30'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 shrink-0" />
                <span>General Ledger</span>
              </button>

              {/* Tab 5: Trial Balance */}
              <button
                type="button"
                onClick={() => setActiveTab('trial_balance')}
                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shadow-xs whitespace-nowrap cursor-pointer ${
                  activeTab === 'trial_balance'
                    ? 'bg-emerald-600 text-white ring-2 ring-emerald-600/30'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <Scale className="w-3.5 h-3.5 shrink-0" />
                <span>Trial Balance</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      <div>
        {activeTab === 'chart_of_accounts' && (
          <ChartOfAccountsView
            accounts={sortedAccounts}
            vouchers={vouchers}
            initialOpenAdd={openAddAccount}
            onAddAccount={onAddAccount}
            onUpdateAccount={onUpdateAccount}
            onDeleteAccount={onDeleteAccount}
            onImportAccounts={onImportAccounts}
          />
        )}

        {activeTab === 'voucher_entry' && (
          <VoucherEntryForm
            accounts={sortedAccounts}
            initialVoucher={editingVoucher}
            existingVouchers={vouchers}
            onSaveVoucher={(v) => {
              onSaveVoucher(v);
              setEditingVoucher(null);
            }}
            onNavigateToView={() => {
              setEditingVoucher(null);
              setActiveTab('vouchers_list');
            }}
          />
        )}

        {activeTab === 'vouchers_list' && (
          <VouchersListView
            vouchers={vouchers}
            onEditVoucher={handleEditVoucher}
            onDeleteVoucher={onDeleteVoucher}
            onApproveVoucher={onApproveVoucher}
            onPostVoucher={onPostVoucher}
            onCancelVoucher={onCancelVoucher}
            onReverseVoucher={onReverseVoucher}
            onNavigateToCreate={handleOpenNewVoucher}
            isEditModeBanner={isEditBannerActive}
          />
        )}

        {activeTab === 'ledgers' && (
          <LedgersView
            accounts={sortedAccounts}
            vouchers={vouchers}
            onViewVoucherDetails={() => {
              setActiveTab('vouchers_list');
            }}
          />
        )}

        {activeTab === 'trial_balance' && (
          <TrialBalanceView
            accounts={sortedAccounts}
            vouchers={vouchers}
          />
        )}
      </div>
    </div>
  );
};
