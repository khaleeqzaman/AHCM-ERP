import React, { useState } from 'react';
import { 
  Menu, 
  ChevronRight, 
  ShoppingCart, 
  ShieldCheck,
  Package,
  BarChart3,
  Settings as SettingsIcon,
  CheckCircle,
  FileText,
  Table,
  Scale,
  Vault
} from 'lucide-react';
import { 
  NavModule, 
  DemandDocument, 
  PurchaseDocument,
  DemandItem,
  PurchaseSummaryItem
} from './types';
import { ChartAccount, VoucherDocument } from './types/accounting';
import { 
  CashBookEntry, 
  BankRecord, 
  BankAccountRecord, 
  BankTransaction,
  CreditBookEntry
} from './types/treasury';
import { initialDemands, initialPurchases } from './data/mockData';
import { initialChartOfAccounts, initialVouchers } from './data/mockAccountingData';
import { 
  initialCashBookEntries, 
  initialBanks, 
  initialBankAccounts,
  initialCreditBookEntries
} from './data/mockTreasuryData';
import { Sidebar } from './components/Sidebar';
import { PurchaseScreen } from './components/PurchaseScreen';
import { AdminApprovalView } from './components/AdminApprovalView';
import { AccountingScreen } from './components/accounting/AccountingScreen';
import { TreasuryScreen } from './components/treasury/TreasuryScreen';
import { DashboardOverview } from './components/DashboardOverview';

export default function App() {
  const [currentModule, setCurrentModule] = useState<NavModule>('purchase');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Fully independent data states (Business Rule 8)
  const [demands, setDemands] = useState<DemandDocument[]>(initialDemands);
  const [purchases, setPurchases] = useState<PurchaseDocument[]>(initialPurchases);

  // 100% ISOLATED ACCOUNTANT DATA STATE (Completely independent from Purchase)
  const [accounts, setAccounts] = useState<ChartAccount[]>(initialChartOfAccounts);
  const [vouchers, setVouchers] = useState<VoucherDocument[]>(initialVouchers);

  // 100% ISOLATED TREASURY (CASHIER) DATA STATE (Completely separate from Accounts & Purchase)
  const [cashBookEntries, setCashBookEntries] = useState<CashBookEntry[]>(initialCashBookEntries);
  const [creditBookEntries, setCreditBookEntries] = useState<CreditBookEntry[]>(initialCreditBookEntries);
  const [banks, setBanks] = useState<BankRecord[]>(initialBanks);
  const [bankAccounts, setBankAccounts] = useState<BankAccountRecord[]>(initialBankAccounts);

  // Demand Handlers
  const handleSaveDemand = (demand: DemandDocument) => {
    setDemands((prev) => {
      const exists = prev.some((d) => d.id === demand.id);
      if (exists) {
        return prev.map((d) => (d.id === demand.id ? demand : d));
      }
      return [demand, ...prev];
    });
  };

  const handleFinalizeDemand = (id: string) => {
    setDemands((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, status: 'Finalized', updatedAt: new Date().toISOString().substring(0, 16) } : d
      )
    );
  };

  const handleSubmitDemand = (id: string) => {
    setDemands((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, status: 'Submitted for Approval', updatedAt: new Date().toISOString().substring(0, 16) } : d
      )
    );
  };

  const handleSubmitMultipleDemands = (ids: string[]) => {
    setDemands((prev) =>
      prev.map((d) =>
        ids.includes(d.id)
          ? { ...d, status: 'Submitted for Approval', updatedAt: new Date().toISOString().substring(0, 16) }
          : d
      )
    );
  };

  const handleUpdateDemandItems = (id: string, updatedItems: DemandItem[]) => {
    setDemands((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const total = Number(
          updatedItems.reduce((sum, it) => sum + it.amount, 0).toFixed(2)
        );
        return {
          ...d,
          items: updatedItems,
          totalAmount: total,
          updatedAt: new Date().toISOString().substring(0, 16),
        };
      })
    );
  };

  const handleApproveDemand = (id: string, remark?: string) => {
    setDemands((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, status: 'Approved', adminRemark: remark } : d
      )
    );
  };

  const handleRejectDemand = (id: string, remark?: string) => {
    setDemands((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, status: 'Rejected', adminRemark: remark } : d
      )
    );
  };

  // Purchase Handlers
  const handleSavePurchase = (purchase: PurchaseDocument) => {
    setPurchases((prev) => {
      const exists = prev.some((p) => p.id === purchase.id);
      if (exists) {
        return prev.map((p) => (p.id === purchase.id ? purchase : p));
      }
      return [purchase, ...prev];
    });
  };

  const handleFinalizePurchase = (id: string) => {
    setPurchases((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: 'Finalized', updatedAt: new Date().toISOString().substring(0, 16) } : p
      )
    );
  };

  const handleSubmitPurchase = (id: string) => {
    setPurchases((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: 'Submitted for Approval', updatedAt: new Date().toISOString().substring(0, 16) } : p
      )
    );
  };

  const handleSubmitMultiplePurchases = (ids: string[]) => {
    setPurchases((prev) =>
      prev.map((p) =>
        ids.includes(p.id)
          ? { ...p, status: 'Submitted for Approval', updatedAt: new Date().toISOString().substring(0, 16) }
          : p
      )
    );
  };

  const handleUpdatePurchaseItems = (id: string, updatedItems: PurchaseSummaryItem[]) => {
    setPurchases((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const total = Number(
          updatedItems.reduce((sum, it) => sum + (Number(it.amount) || 0), 0).toFixed(2)
        );
        return {
          ...p,
          items: updatedItems,
          totalAmount: total,
          updatedAt: new Date().toISOString().substring(0, 16),
        };
      })
    );
  };

  const handleApprovePurchase = (id: string, remark?: string) => {
    setPurchases((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: 'Approved', adminRemark: remark } : p
      )
    );
  };

  const handleRejectPurchase = (id: string, remark?: string) => {
    setPurchases((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: 'Rejected', adminRemark: remark } : p
      )
    );
  };

  // ACCOUNTANT HANDLERS (Completely isolated)
  const handleAddAccount = (account: ChartAccount) => {
    setAccounts((prev) => [...prev, account]);
  };

  const handleUpdateAccount = (account: ChartAccount) => {
    setAccounts((prev) =>
      prev.map((a) => (a.id === account.id ? account : a))
    );
  };

  const handleSaveVoucher = (voucher: VoucherDocument) => {
    setVouchers((prev) => {
      const exists = prev.some((v) => v.id === voucher.id);
      if (exists) {
        return prev.map((v) => (v.id === voucher.id ? voucher : v));
      }
      return [voucher, ...prev];
    });

    // Update account balances
    if (voucher.status === 'Posted') {
      voucher.lines.forEach((line) => {
        setAccounts((prevAccounts) =>
          prevAccounts.map((acc) => {
            if (acc.id === line.accountId) {
              const delta =
                acc.normalBalance === 'Debit'
                  ? line.debit - line.credit
                  : line.credit - line.debit;
              return {
                ...acc,
                currentBalance: Number((acc.currentBalance + delta).toFixed(2)),
              };
            }
            return acc;
          })
        );
      });
    }
  };

  const handlePostDraftVoucher = (voucherId: string) => {
    const target = vouchers.find((v) => v.id === voucherId);
    if (!target) return;

    setVouchers((prev) =>
      prev.map((v) =>
        v.id === voucherId
          ? { ...v, status: 'Posted', postedAt: new Date().toISOString().substring(0, 16) }
          : v
      )
    );

    // Update account balances
    target.lines.forEach((line) => {
      setAccounts((prevAccounts) =>
        prevAccounts.map((acc) => {
          if (acc.id === line.accountId) {
            const delta =
              acc.normalBalance === 'Debit'
                ? line.debit - line.credit
                : line.credit - line.debit;
            return {
              ...acc,
              currentBalance: Number((acc.currentBalance + delta).toFixed(2)),
            };
          }
          return acc;
        })
      );
    });
  };

  const handleUpdateLedgerEntry = (
    voucherId: string,
    lineId: string,
    updatedDebit: number,
    updatedCredit: number,
    updatedDescription: string
  ) => {
    setVouchers((prevVouchers) =>
      prevVouchers.map((voucher) => {
        if (voucher.id !== voucherId) return voucher;

        const updatedLines = voucher.lines.map((l) => {
          if (l.id !== lineId) return l;
          return {
            ...l,
            debit: updatedDebit,
            credit: updatedCredit,
            description: updatedDescription,
          };
        });

        const newTotalDebit = Number(
          updatedLines.reduce((sum, l) => sum + l.debit, 0).toFixed(2)
        );
        const newTotalCredit = Number(
          updatedLines.reduce((sum, l) => sum + l.credit, 0).toFixed(2)
        );

        return {
          ...voucher,
          lines: updatedLines,
          totalDebit: newTotalDebit,
          totalCredit: newTotalCredit,
        };
      })
    );
  };

  // TREASURY / CASHIER HANDLERS (Completely isolated)
  const handleAddCashBookEntry = (entry: CashBookEntry) => {
    setCashBookEntries((prev) => [entry, ...prev].map((e, idx) => ({ ...e, srNo: idx + 1 })));
  };

  const handleUpdateCashBookEntry = (
    id: string,
    field: 'date' | 'description' | 'credit' | 'debit',
    value: string | number
  ) => {
    setCashBookEntries((prev) =>
      prev.map((entry) => {
        if (entry.id !== id) return entry;
        const updated = { ...entry, [field]: value };
        // Auto-calculated balance: Credit - Debit
        updated.balance = (Number(updated.credit) || 0) - (Number(updated.debit) || 0);
        return updated;
      })
    );
  };

  const handleDeleteCashBookEntry = (id: string) => {
    setCashBookEntries((prev) => {
      const filtered = prev.filter((e) => e.id !== id);
      return filtered.map((e, idx) => ({ ...e, srNo: idx + 1 }));
    });
  };

  // CREDIT BOOK REGISTER HANDLERS
  const handleAddCreditBookEntry = (entry: CreditBookEntry) => {
    setCreditBookEntries((prev) => [entry, ...prev].map((e, idx) => ({ ...e, srNo: idx + 1 })));
  };

  const handleUpdateCreditBookEntry = (
    id: string,
    field: 'date' | 'name' | 'purpose' | 'amount',
    value: string | number
  ) => {
    setCreditBookEntries((prev) =>
      prev.map((entry) => {
        if (entry.id !== id) return entry;
        return { ...entry, [field]: value };
      })
    );
  };

  const handleDeleteCreditBookEntry = (id: string) => {
    setCreditBookEntries((prev) => {
      const filtered = prev.filter((e) => e.id !== id);
      return filtered.map((e, idx) => ({ ...e, srNo: idx + 1 }));
    });
  };

  const handleResetCreditBook = () => {
    setCreditBookEntries([]);
  };

  const handleBulkUpdateCreditBookEntries = (updatedEntries: CreditBookEntry[]) => {
    setCreditBookEntries(updatedEntries);
  };

  const handleAddBank = (bank: BankRecord) => {
    setBanks((prev) => [...prev, bank]);
  };

  const handleDeleteBank = (id: string) => {
    setBanks((prev) => {
      const filtered = prev.filter((b) => b.id !== id);
      return filtered.map((b, idx) => ({ ...b, srNo: idx + 1 }));
    });
  };

  const handleAddBankAccount = (account: BankAccountRecord) => {
    setBankAccounts((prev) => [...prev, account]);
  };

  const handleDeleteBankAccount = (id: string) => {
    setBankAccounts((prev) => {
      const filtered = prev.filter((a) => a.id !== id);
      return filtered.map((a, idx) => ({ ...a, srNo: idx + 1 }));
    });
  };

  const handleAddBankTransaction = (accountId: string, transaction: BankTransaction) => {
    setBankAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id !== accountId) return acc;
        return {
          ...acc,
          transactions: [transaction, ...acc.transactions].map((t, idx) => ({ ...t, srNo: idx + 1 })),
        };
      })
    );
  };

  const handleUpdateBankTransaction = (
    accountId: string,
    transactionId: string,
    field: 'date' | 'payeeDescription' | 'category' | 'depositDebit' | 'withdrawalPayment',
    value: string | number
  ) => {
    setBankAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id !== accountId) return acc;
        const updatedTxs = acc.transactions.map((tx) => {
          if (tx.id !== transactionId) return tx;
          const updated = { ...tx, [field]: value };
          // Auto-calculated balance: Deposit - Withdrawal
          updated.balance = (Number(updated.depositDebit) || 0) - (Number(updated.withdrawalPayment) || 0);
          return updated;
        });
        return {
          ...acc,
          transactions: updatedTxs,
        };
      })
    );
  };

  const handleDeleteBankTransaction = (accountId: string, transactionId: string) => {
    setBankAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id !== accountId) return acc;
        const filtered = acc.transactions.filter((tx) => tx.id !== transactionId);
        const renumbered = filtered.map((tx, idx) => ({ ...tx, srNo: idx + 1 }));
        return {
          ...acc,
          transactions: renumbered,
        };
      })
    );
  };

  const pendingApprovalsCount =
    demands.filter((d) => d.status === 'Submitted for Approval').length +
    purchases.filter((p) => p.status === 'Submitted for Approval').length;

  return (
    <div className="min-h-screen bg-slate-100/70 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentModule={currentModule}
        onSelectModule={setCurrentModule}
        isOpenMobile={isMobileSidebarOpen}
        onToggleMobile={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        pendingApprovalsCount={pendingApprovalsCount}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb Navigation */}
            <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <button
                type="button"
                onClick={() => setCurrentModule('dashboard')}
                className="hover:text-slate-800 transition-colors cursor-pointer"
              >
                Dashboard
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-900 capitalize font-semibold">
                {currentModule === 'purchase'
                  ? 'Purchase Module'
                  : currentModule === 'accounting'
                  ? 'Accounts'
                  : currentModule === 'treasury'
                  ? 'Treasury (Cashier)'
                  : currentModule === 'admin_approvals'
                  ? 'Admin Approval Console'
                  : currentModule}
              </span>
            </nav>
          </div>

          {/* Top Bar Right Actions & Role quick indicator */}
          <div className="flex items-center gap-2.5">
            {/* Direct Switch: Purchaser View */}
            <button
              type="button"
              onClick={() => setCurrentModule('purchase')}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border cursor-pointer ${
                currentModule === 'purchase'
                  ? 'bg-blue-50 text-blue-700 border-blue-200 font-semibold shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Purchaser</span>
            </button>

            {/* Direct Switch: Accountant Module */}
            <button
              type="button"
              onClick={() => setCurrentModule('accounting')}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border cursor-pointer ${
                currentModule === 'accounting'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Scale className="w-3.5 h-3.5 text-emerald-700" />
              <span>Accounts</span>
            </button>

            {/* Direct Switch: Treasury (Cashier) */}
            <button
              type="button"
              onClick={() => setCurrentModule('treasury')}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border cursor-pointer ${
                currentModule === 'treasury'
                  ? 'bg-amber-50 text-amber-800 border-amber-200 font-semibold shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Vault className="w-3.5 h-3.5 text-amber-700" />
              <span>Treasury</span>
            </button>

            {/* Direct Switch: Admin Approvals */}
            <button
              type="button"
              onClick={() => setCurrentModule('admin_approvals')}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border cursor-pointer ${
                currentModule === 'admin_approvals'
                  ? 'bg-purple-50 text-purple-700 border-purple-200 font-semibold shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Approvals</span>
              {pendingApprovalsCount > 0 && (
                <span className="font-mono text-[10px] bg-purple-600 text-white px-1.5 py-0.2 rounded-full font-bold">
                  {pendingApprovalsCount}
                </span>
              )}
            </button>

            <div className="w-px h-5 bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs font-semibold">
                AC
              </div>
              <span className="text-xs font-medium text-slate-800 hidden md:inline">
                Accountant / Officer
              </span>
            </div>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* Purchase Module */}
          {currentModule === 'purchase' && (
            <PurchaseScreen
              demands={demands}
              purchases={purchases}
              onSaveDemand={handleSaveDemand}
              onSavePurchase={handleSavePurchase}
              onFinalizeDemand={handleFinalizeDemand}
              onFinalizePurchase={handleFinalizePurchase}
              onSubmitDemand={handleSubmitDemand}
              onSubmitMultipleDemands={handleSubmitMultipleDemands}
              onSubmitPurchase={handleSubmitPurchase}
              onSubmitMultiplePurchases={handleSubmitMultiplePurchases}
              onUpdateDemandItems={handleUpdateDemandItems}
              onUpdatePurchaseItems={handleUpdatePurchaseItems}
              onApproveDemand={handleApproveDemand}
              onRejectDemand={handleRejectDemand}
              onApprovePurchase={handleApprovePurchase}
              onRejectPurchase={handleRejectPurchase}
            />
          )}

          {/* ISOLATED ACCOUNTANT MODULE */}
          {currentModule === 'accounting' && (
            <AccountingScreen
              accounts={accounts}
              vouchers={vouchers}
              onAddAccount={handleAddAccount}
              onUpdateAccount={handleUpdateAccount}
              onSaveVoucher={handleSaveVoucher}
              onPostDraftVoucher={handlePostDraftVoucher}
              onUpdateLedgerEntry={handleUpdateLedgerEntry}
            />
          )}

          {/* ISOLATED TREASURY MODULE (CASHIER) */}
          {currentModule === 'treasury' && (
            <TreasuryScreen
              cashBookEntries={cashBookEntries}
              creditBookEntries={creditBookEntries}
              banks={banks}
              bankAccounts={bankAccounts}
              onAddCashBookEntry={handleAddCashBookEntry}
              onUpdateCashBookEntry={handleUpdateCashBookEntry}
              onDeleteCashBookEntry={handleDeleteCashBookEntry}
              onAddCreditBookEntry={handleAddCreditBookEntry}
              onUpdateCreditBookEntry={handleUpdateCreditBookEntry}
              onDeleteCreditBookEntry={handleDeleteCreditBookEntry}
              onResetCreditBook={handleResetCreditBook}
              onBulkUpdateCreditBookEntries={handleBulkUpdateCreditBookEntries}
              onAddBank={handleAddBank}
              onDeleteBank={handleDeleteBank}
              onAddBankAccount={handleAddBankAccount}
              onDeleteBankAccount={handleDeleteBankAccount}
              onAddBankTransaction={handleAddBankTransaction}
              onUpdateBankTransaction={handleUpdateBankTransaction}
              onDeleteBankTransaction={handleDeleteBankTransaction}
            />
          )}

          {/* Admin Approval Console */}
          {currentModule === 'admin_approvals' && (
            <AdminApprovalView
              demands={demands}
              purchases={purchases}
              onApproveDemand={handleApproveDemand}
              onRejectDemand={handleRejectDemand}
              onApprovePurchase={handleApprovePurchase}
              onRejectPurchase={handleRejectPurchase}
            />
          )}

          {/* Dashboard Overview */}
          {currentModule === 'dashboard' && (
            <DashboardOverview
              demands={demands}
              purchases={purchases}
              onNavigateToPurchase={() => setCurrentModule('purchase')}
              onNavigateToApprovals={() => setCurrentModule('admin_approvals')}
            />
          )}

          {/* Reports */}
          {currentModule === 'reports' && (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4">
              <BarChart3 className="w-12 h-12 text-slate-400 mx-auto" />
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Audit Reports & Cross-Module Ledger Logs
                </h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Demand vs Purchase financial reconciliation, status turnaround times, and Admin approval audit history.
                </p>
              </div>
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentModule('purchase')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Go to Purchase Module
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentModule('accounting')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer"
                >
                  Go to Accounts
                </button>
              </div>
            </div>
          )}

          {/* Settings */}
          {currentModule === 'settings' && (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4">
              <SettingsIcon className="w-12 h-12 text-slate-400 mx-auto" />
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  System Settings & Workflow Configurations
                </h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Manage reference number generation prefixes, automated workflow thresholds, and approver assignments.
                </p>
              </div>
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentModule('purchase')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Go to Purchase Module
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentModule('accounting')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer"
                >
                  Go to Accounts
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
