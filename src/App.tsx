import React, { useState, useEffect } from 'react';
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
  Vault,
  Boxes,
  Users as UsersIcon,
  LogOut
} from 'lucide-react';
import { 
  NavModule, 
  DemandDocument, 
  PurchaseDocument,
  DemandItem,
  PurchaseSummaryItem,
  User,
  UserRole
} from './types';
import { initialUsers } from './data/mockUsers';
import { LoginScreen } from './components/auth/LoginScreen';
import { UsersScreen } from './components/users/UsersScreen';
import { RoleDashboard } from './components/dashboard/RoleDashboard';
import { ChartAccount, VoucherDocument } from './types/accounting';
import { 
  CashBookEntry, 
  BankRecord, 
  BankAccountRecord, 
  BankTransaction,
  CreditBookEntry
} from './types/treasury';
import { 
  CompanySettings, 
  BuyerRecord, 
  PartnerRecord, 
  PosCoalSellEntry, 
  CoalSellRecord, 
  StockItem, 
  StockEntry, 
  VehicleRecord, 
  VehicleConsumptionRecord 
} from './types/storeSales';
import { TableDefinition, OldLedgerDataMap, ImportSummary } from './types/oldLedger';
import { initialDemands, initialPurchases } from './data/mockData';
import { initialChartOfAccounts, initialVouchers } from './data/mockAccountingData';
import { 
  initialCashBookEntries, 
  initialBanks, 
  initialBankAccounts,
  initialCreditBookEntries
} from './data/mockTreasuryData';
import { 
  initialCompanySettings, 
  initialBuyers, 
  initialPartners, 
  initialPosEntries, 
  initialCoalSellRecords, 
  initialStockItems, 
  initialStockEntries, 
  initialVehicles, 
  initialVehicleConsumptions 
} from './data/mockStoreSalesData';
import { standardOldLedgerSchemas, initialOldLedgerData } from './data/mockOldLedgerData';
import { Sidebar } from './components/Sidebar';
import { PurchaseScreen } from './components/PurchaseScreen';
import { AdminApprovalView } from './components/AdminApprovalView';
import { AccountingScreen } from './components/accounting/AccountingScreen';
import { TreasuryScreen } from './components/treasury/TreasuryScreen';
import { StoreSalesScreen } from './components/store_sales/StoreSalesScreen';

export default function App() {
  // User Management & Persistence
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('ahcm_erp_users');
    if (saved) {
      try {
        const parsed: User[] = JSON.parse(saved);
        // Refresh default users to ensure updated names (Abdul Hakeem, Sheeraz, Zohaib, Ghani)
        return parsed.map((u) => {
          const match = initialUsers.find((init) => init.id === u.id || init.username === u.username);
          if (match) {
            return { ...u, name: match.name };
          }
          return u;
        });
      } catch (e) {
        // ignore
      }
    }
    return initialUsers;
  });

  // Current authenticated user - Entry point is Signin Page (null initially)
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('ahcm_erp_active_user');
    if (saved) {
      try {
        const parsed: User = JSON.parse(saved);
        const match = initialUsers.find((init) => init.id === parsed.id || init.username === parsed.username);
        if (match) {
          return { ...parsed, name: match.name };
        }
        return parsed;
      } catch (e) {
        // ignore
      }
    }
    return null;
  });

  const [currentModule, setCurrentModule] = useState<NavModule>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Sync users to localStorage
  useEffect(() => {
    localStorage.setItem('ahcm_erp_users', JSON.stringify(users));
  }, [users]);

  // Sync active session
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('ahcm_erp_active_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('ahcm_erp_active_user');
    }
  }, [currentUser]);

  // Role permissions mapping
  const getAllowedModules = (role: UserRole): NavModule[] => {
    switch (role) {
      case 'purchaser':
        return ['dashboard', 'purchase'];
      case 'cashier':
        return ['dashboard', 'treasury'];
      case 'accountant':
        return ['dashboard', 'accounting'];
      case 'store_manager':
        return ['dashboard', 'store_sales'];
      case 'admin':
      default:
        return [
          'dashboard', 
          'admin_approvals', 
          'users', 
          'purchase', 
          'accounting', 
          'treasury', 
          'store_sales', 
          'reports', 
          'settings'
        ];
    }
  };

  // Enforce role isolation guard on module navigation
  useEffect(() => {
    if (currentUser) {
      const allowed = getAllowedModules(currentUser.role);
      if (!allowed.includes(currentModule)) {
        setCurrentModule('dashboard');
      }
    }
  }, [currentUser, currentModule]);

  // Auth Handlers
  const handleLogin = (user: User) => {
    const now = new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });
    const updated = { ...user, lastLogin: now };
    setCurrentUser(updated);
    setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
    setCurrentModule('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentModule('dashboard');
  };

  // Admin User Management Handlers
  const handleAddUser = (newUserData: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...newUserData,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      lastLogin: 'Never',
    };
    setUsers((prev) => [newUser, ...prev]);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    if (currentUser && currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
  };

  const handleDeleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleResetPassword = (userId: string, newPass: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, password: newPass } : u))
    );
    if (currentUser && currentUser.id === userId) {
      setCurrentUser({ ...currentUser, password: newPass });
    }
  };

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

  // 100% ISOLATED STORE & SALES DATA STATE (Completely separate from other modules)
  const [companySettings, setCompanySettings] = useState<CompanySettings>(initialCompanySettings);
  const [buyers, setBuyers] = useState<BuyerRecord[]>(initialBuyers);
  const [partners, setPartners] = useState<PartnerRecord[]>(initialPartners);
  const [posEntries, setPosEntries] = useState<PosCoalSellEntry[]>(initialPosEntries);
  const [coalSellRecords, setCoalSellRecords] = useState<CoalSellRecord[]>(initialCoalSellRecords);
  const [stockItems, setStockItems] = useState<StockItem[]>(initialStockItems);
  const [stockEntries, setStockEntries] = useState<StockEntry[]>(initialStockEntries);
  const [vehicles, setVehicles] = useState<VehicleRecord[]>(initialVehicles);
  const [vehicleConsumptions, setVehicleConsumptions] = useState<VehicleConsumptionRecord[]>(initialVehicleConsumptions);

  // 100% ISOLATED OLD LEDGER DATA STATE (Microsoft Access Engine) - 28 tables with empty rows until imported
  const [oldLedgerTables, setOldLedgerTables] = useState<TableDefinition[]>(standardOldLedgerSchemas);
  const [oldLedgerData, setOldLedgerData] = useState<OldLedgerDataMap>(initialOldLedgerData);
  const [oldLedgerImportSummary, setOldLedgerImportSummary] = useState<ImportSummary | null>(null);

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

  const handleDeleteDemand = (id: string) => {
    setDemands((prev) => prev.filter((d) => d.id !== id));
  };

  const handleDeletePurchase = (id: string) => {
    setPurchases((prev) => prev.filter((p) => p.id !== id));
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

  // 100% ISOLATED STORE & SALES HANDLERS
  const handleAddPosEntry = (entry: PosCoalSellEntry) => {
    setPosEntries((prev) => [entry, ...prev].map((e, idx) => ({ ...e, srNo: idx + 1 })));
  };

  const handleUpdatePosEntry = (entry: PosCoalSellEntry) => {
    setPosEntries((prev) => prev.map((e) => (e.id === entry.id ? entry : e)));
  };

  const handleDeletePosEntry = (id: string) => {
    setPosEntries((prev) => prev.filter((e) => e.id !== id).map((e, idx) => ({ ...e, srNo: idx + 1 })));
  };

  const handleAddCoalSellRecord = (record: CoalSellRecord) => {
    setCoalSellRecords((prev) => [record, ...prev]);
  };

  const handleUpdateCoalSellRecord = (record: CoalSellRecord) => {
    setCoalSellRecords((prev) => prev.map((r) => (r.id === record.id ? record : r)));
  };

  const handleDeleteCoalSellRecord = (id: string) => {
    setCoalSellRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAddPartner = (partner: PartnerRecord) => {
    setPartners((prev) => [...prev, partner]);
  };

  const handleUpdatePartner = (partner: PartnerRecord) => {
    setPartners((prev) => prev.map((p) => (p.id === partner.id ? partner : p)));
  };

  const handleDeletePartner = (id: string) => {
    setPartners((prev) => prev.filter((p) => p.id !== id));
  };

  const handleTogglePartnerActive = (id: string) => {
    setPartners((prev) => prev.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p)));
  };

  const handleTogglePartnerReportColumn = (id: string) => {
    setPartners((prev) => prev.map((p) => (p.id === id ? { ...p, showInReport: !p.showInReport } : p)));
  };

  const handleAddBuyer = (buyer: BuyerRecord) => {
    setBuyers((prev) => [buyer, ...prev]);
  };

  const handleUpdateBuyer = (buyer: BuyerRecord) => {
    setBuyers((prev) => prev.map((b) => (b.id === buyer.id ? buyer : b)));
  };

  const handleDeleteBuyer = (id: string) => {
    setBuyers((prev) => prev.filter((b) => b.id !== id));
  };

  const handleAddStockItem = (item: StockItem) => {
    setStockItems((prev) => [...prev, item]);
  };

  const handleAddStockEntry = (entry: StockEntry) => {
    setStockEntries((prev) => [entry, ...prev].map((e, idx) => ({ ...e, srNo: idx + 1 })));
  };

  const handleUpdateStockEntry = (entry: StockEntry) => {
    setStockEntries((prev) => prev.map((e) => (e.id === entry.id ? entry : e)));
  };

  const handleDeleteStockEntry = (id: string) => {
    setStockEntries((prev) => prev.filter((e) => e.id !== id).map((e, idx) => ({ ...e, srNo: idx + 1 })));
  };

  const handleAddVehicle = (vehicle: VehicleRecord) => {
    setVehicles((prev) => [...prev, vehicle]);
  };

  const handleUpdateVehicle = (vehicle: VehicleRecord) => {
    setVehicles((prev) => prev.map((v) => (v.id === vehicle.id ? vehicle : v)));
  };

  const handleDeleteVehicle = (id: string) => {
    setVehicles((prev) => prev.filter((v) => v.id !== id));
  };

  const handleAddVehicleConsumption = (record: VehicleConsumptionRecord) => {
    setVehicleConsumptions((prev) => [record, ...prev].map((c, idx) => ({ ...c, srNo: idx + 1 })));
  };

  const handleUpdateVehicleConsumption = (record: VehicleConsumptionRecord) => {
    setVehicleConsumptions((prev) => prev.map((c) => (c.id === record.id ? record : c)));
  };

  const handleDeleteVehicleConsumption = (id: string) => {
    setVehicleConsumptions((prev) => prev.filter((c) => c.id !== id).map((c, idx) => ({ ...c, srNo: idx + 1 })));
  };

  // 100% ISOLATED OLD LEDGER (MICROSOFT ACCESS) HANDLERS
  const handleOldLedgerImportSuccess = (
    newTables: TableDefinition[],
    newData: OldLedgerDataMap,
    summary: ImportSummary
  ) => {
    setOldLedgerTables(newTables);
    setOldLedgerData(newData);
    setOldLedgerImportSummary(summary);
  };

  const handleResetOldLedger = () => {
    setOldLedgerTables(standardOldLedgerSchemas);
    setOldLedgerData(initialOldLedgerData);
    setOldLedgerImportSummary(null);
  };

  const pendingApprovalsCount =
    demands.filter((d) => d.status === 'Submitted for Approval').length +
    purchases.filter((p) => p.status === 'Submitted for Approval').length;

  // App entry point is Login page if unauthenticated
  if (!currentUser) {
    return <LoginScreen users={users} onLogin={handleLogin} />;
  }

  const roleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'purchaser':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cashier':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'accountant':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'store_manager':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentModule={currentModule}
        onSelectModule={setCurrentModule}
        isOpenMobile={isMobileSidebarOpen}
        onToggleMobile={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        pendingApprovalsCount={pendingApprovalsCount}
        currentUser={currentUser}
        onLogout={handleLogout}
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
                {currentUser.role === 'admin'
                  ? 'Admin'
                  : currentUser.role === 'purchaser'
                  ? 'Purchaser'
                  : currentUser.role === 'cashier'
                  ? 'Cashier'
                  : currentUser.role === 'accountant'
                  ? 'Accountant'
                  : 'Store'}{' '}
                Dashboard
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-900 capitalize font-semibold">
                {currentModule === 'dashboard'
                  ? 'Overview & Metrics'
                  : currentModule === 'users'
                  ? 'Users Management'
                  : currentModule === 'purchase'
                  ? 'Purchase Module'
                  : currentModule === 'accounting'
                  ? 'Accounts'
                  : currentModule === 'treasury'
                  ? 'Treasury (Cashier)'
                  : currentModule === 'store_sales'
                  ? 'Store & Sales'
                  : currentModule === 'admin_approvals'
                  ? 'Admin Approvals'
                  : currentModule}
              </span>
            </nav>
          </div>

          {/* Top Bar Right Actions: Role-based shortcuts & User Profile */}
          <div className="flex items-center gap-2.5">
            {/* Admin: Users Management Shortcut */}
            {currentUser.role === 'admin' && (
              <button
                type="button"
                onClick={() => setCurrentModule('users')}
                className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border cursor-pointer ${
                  currentModule === 'users'
                    ? 'bg-purple-100 text-purple-800 border-purple-300 font-semibold shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <UsersIcon className="w-3.5 h-3.5 text-purple-600" />
                <span>Users ({users.length})</span>
              </button>
            )}

            {/* Admin: Approvals Shortcut */}
            {currentUser.role === 'admin' && (
              <button
                type="button"
                onClick={() => setCurrentModule('admin_approvals')}
                className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border cursor-pointer ${
                  currentModule === 'admin_approvals'
                    ? 'bg-purple-100 text-purple-800 border-purple-300 font-semibold shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                <span>Approvals</span>
                {pendingApprovalsCount > 0 && (
                  <span className="font-mono text-[10px] bg-purple-600 text-white px-1.5 py-0.2 rounded-full font-bold">
                    {pendingApprovalsCount}
                  </span>
                )}
              </button>
            )}

            {/* Purchaser: Quick shortcut */}
            {(currentUser.role === 'purchaser' || currentUser.role === 'admin') && (
              <button
                type="button"
                onClick={() => setCurrentModule('purchase')}
                className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border cursor-pointer ${
                  currentModule === 'purchase'
                    ? 'bg-blue-50 text-blue-700 border-blue-200 font-semibold shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5 text-blue-600" />
                <span>Purchase Desk</span>
              </button>
            )}

            {/* Cashier: Quick shortcut */}
            {(currentUser.role === 'cashier' || currentUser.role === 'admin') && (
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
            )}

            {/* Accountant: Quick shortcut */}
            {(currentUser.role === 'accountant' || currentUser.role === 'admin') && (
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
            )}

            {/* Store Manager: Quick shortcut */}
            {(currentUser.role === 'store_manager' || currentUser.role === 'admin') && (
              <button
                type="button"
                onClick={() => setCurrentModule('store_sales')}
                className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border cursor-pointer ${
                  currentModule === 'store_sales'
                    ? 'bg-cyan-50 text-cyan-800 border-cyan-200 font-semibold shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Boxes className="w-3.5 h-3.5 text-cyan-600" />
                <span>Store & Sales</span>
              </button>
            )}

            <div className="w-px h-5 bg-slate-200 hidden sm:block" />

            {/* User Profile Info */}
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase ${
                  currentUser.role === 'admin'
                    ? 'bg-purple-600 text-white'
                    : currentUser.role === 'purchaser'
                    ? 'bg-blue-600 text-white'
                    : currentUser.role === 'cashier'
                    ? 'bg-amber-600 text-white'
                    : currentUser.role === 'accountant'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-cyan-600 text-white'
                }`}
              >
                {currentUser.username.slice(0, 2)}
              </div>

              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold text-slate-800 leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-500 font-mono capitalize">
                  @{currentUser.username} · {currentUser.role.replace('_', ' ')}
                </div>
              </div>

              {/* Sign Out Button */}
              <button
                type="button"
                onClick={handleLogout}
                title="Sign out of system"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors cursor-pointer ml-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* Role-Specific Dashboard (Admin, Purchaser, Cashier, Accountant, Store Manager) */}
          {currentModule === 'dashboard' && (
            <RoleDashboard
              currentUser={currentUser}
              demands={demands}
              purchases={purchases}
              accounts={accounts}
              vouchers={vouchers}
              cashBookEntries={cashBookEntries}
              creditBookEntries={creditBookEntries}
              banks={banks}
              bankAccounts={bankAccounts}
              posEntries={posEntries}
              stockItems={stockItems}
              stockEntries={stockEntries}
              vehicles={vehicles}
              consumptions={vehicleConsumptions}
              users={users}
              oldLedgerTables={oldLedgerTables}
              onNavigate={setCurrentModule}
            />
          )}

          {/* Admin Exclusive: User Management Module */}
          {currentModule === 'users' && currentUser.role === 'admin' && (
            <UsersScreen
              users={users}
              currentUser={currentUser}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              onResetPassword={handleResetPassword}
            />
          )}

          {/* Admin Exclusive: Approval Console */}
          {currentModule === 'admin_approvals' && currentUser.role === 'admin' && (
            <AdminApprovalView
              demands={demands}
              purchases={purchases}
              onApproveDemand={handleApproveDemand}
              onRejectDemand={handleRejectDemand}
              onApprovePurchase={handleApprovePurchase}
              onRejectPurchase={handleRejectPurchase}
            />
          )}

          {/* Purchase Module (Purchaser & Admin) */}
          {currentModule === 'purchase' && (currentUser.role === 'admin' || currentUser.role === 'purchaser') && (
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
              onDeleteDemand={handleDeleteDemand}
              onDeletePurchase={handleDeletePurchase}
            />
          )}

          {/* ISOLATED ACCOUNTANT MODULE (Accountant & Admin) */}
          {currentModule === 'accounting' && (currentUser.role === 'admin' || currentUser.role === 'accountant') && (
            <AccountingScreen
              accounts={accounts}
              vouchers={vouchers}
              onAddAccount={handleAddAccount}
              onUpdateAccount={handleUpdateAccount}
              onSaveVoucher={handleSaveVoucher}
              onPostDraftVoucher={handlePostDraftVoucher}
              onUpdateLedgerEntry={handleUpdateLedgerEntry}
              oldLedgerTables={oldLedgerTables}
              oldLedgerData={oldLedgerData}
              oldLedgerImportSummary={oldLedgerImportSummary}
              onOldLedgerImportSuccess={handleOldLedgerImportSuccess}
              onResetOldLedger={handleResetOldLedger}
            />
          )}

          {/* ISOLATED TREASURY MODULE (Cashier & Admin) */}
          {currentModule === 'treasury' && (currentUser.role === 'admin' || currentUser.role === 'cashier') && (
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

          {/* 100% ISOLATED STORE & SALES MODULE (Store Manager & Admin) */}
          {currentModule === 'store_sales' && (currentUser.role === 'admin' || currentUser.role === 'store_manager') && (
            <StoreSalesScreen
              posEntries={posEntries}
              coalSellRecords={coalSellRecords}
              partners={partners}
              buyers={buyers}
              stockItems={stockItems}
              stockEntries={stockEntries}
              vehicles={vehicles}
              consumptions={vehicleConsumptions}
              companySettings={companySettings}
              onAddPosEntry={handleAddPosEntry}
              onUpdatePosEntry={handleUpdatePosEntry}
              onDeletePosEntry={handleDeletePosEntry}
              onAddCoalSellRecord={handleAddCoalSellRecord}
              onUpdateCoalSellRecord={handleUpdateCoalSellRecord}
              onDeleteCoalSellRecord={handleDeleteCoalSellRecord}
              onAddPartner={handleAddPartner}
              onUpdatePartner={handleUpdatePartner}
              onDeletePartner={handleDeletePartner}
              onTogglePartnerActive={handleTogglePartnerActive}
              onTogglePartnerReportColumn={handleTogglePartnerReportColumn}
              onAddBuyer={handleAddBuyer}
              onUpdateBuyer={handleUpdateBuyer}
              onDeleteBuyer={handleDeleteBuyer}
              onAddStockItem={handleAddStockItem}
              onAddStockEntry={handleAddStockEntry}
              onUpdateStockEntry={handleUpdateStockEntry}
              onDeleteStockEntry={handleDeleteStockEntry}
              onAddVehicle={handleAddVehicle}
              onUpdateVehicle={handleUpdateVehicle}
              onDeleteVehicle={handleDeleteVehicle}
              onAddConsumption={handleAddVehicleConsumption}
              onUpdateConsumption={handleUpdateVehicleConsumption}
              onDeleteConsumption={handleDeleteVehicleConsumption}
              onSaveCompanySettings={setCompanySettings}
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
