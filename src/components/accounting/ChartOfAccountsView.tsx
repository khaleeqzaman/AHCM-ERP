import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  AlertCircle,
  Upload,
  Download,
  Printer,
  Edit2,
  Trash2,
  FileText,
  Check,
  AlertTriangle,
  RefreshCw,
  FileSpreadsheet,
  FileJson,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Info
} from 'lucide-react';
import { ChartAccount, AccountType, VoucherDocument } from '../../types/accounting';
import { formatWholeNumber } from '../../utils/formatters';
import {
  STANDARD_COA_TEMPLATE,
  downloadCoaTemplateFile,
  exportAccountsToJsonFile,
  exportAccountsToCsvFile,
  parseAndValidateAccountsJson,
  formatChartAccountToJson,
  EMPTY_MONTHLY_RECORD,
  normalizeAccountType
} from '../../utils/chartOfAccountsJson';
import { printConcernedTable } from '../../utils/printTable';
import { PrintDocumentHeader } from '../common/PrintDocumentHeader';

interface ChartOfAccountsViewProps {
  accounts: ChartAccount[];
  vouchers?: VoucherDocument[];
  initialOpenAdd?: boolean;
  onAddAccount: (account: ChartAccount) => void;
  onUpdateAccount: (account: ChartAccount) => void;
  onDeleteAccount?: (accountId: string) => void;
  onImportAccounts?: (importedAccounts: ChartAccount[], overrideAll: boolean) => void;
}

export const ChartOfAccountsView: React.FC<ChartOfAccountsViewProps> = ({
  accounts,
  vouchers = [],
  initialOpenAdd = false,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
  onImportAccounts,
}) => {
  // Navigation & Search Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [levelFilter, setLevelFilter] = useState<string>('All');
  const [transTypeFilter, setTransTypeFilter] = useState<string>('All');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 4000);
  };

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(initialOpenAdd);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ChartAccount | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<ChartAccount | null>(null);

  useEffect(() => {
    if (typeof initialOpenAdd === 'boolean') {
      setIsAddModalOpen(initialOpenAdd);
    }
  }, [initialOpenAdd]);

  // =========================================================
  // ADD ACCOUNT FORM STATE
  // =========================================================
  const [selectedType, setSelectedType] = useState<AccountType>('Asset');
  const [typeDigit, setTypeDigit] = useState<number>(1);
  const [classDigit, setClassDigit] = useState<number>(1);
  const [groupCode, setGroupCode] = useState<string>('01');
  const [subCode, setSubCode] = useState<string>('001');
  const [customAccountNo, setCustomAccountNo] = useState<string>('');
  const [useCustomAccountNo, setUseCustomAccountNo] = useState<boolean>(false);
  const [accountLevel, setAccountLevel] = useState<number>(3);
  const [accountTransType, setAccountTransType] = useState<'G' | 'T'>('T');
  const [parentAccountNo, setParentAccountNo] = useState<string>('');
  const [accountName, setAccountName] = useState<string>('');
  const [classification, setClassification] = useState<string>('Current Assets');
  const [groupName, setGroupName] = useState<string>('Cash & Cash Equivalents');
  const [normalBalance, setNormalBalance] = useState<'Debit' | 'Credit'>('Debit');
  const [openingBalance, setOpeningBalance] = useState<number | ''>(0);
  const [description, setDescription] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

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

  const computedCode = useCustomAccountNo && customAccountNo.trim() 
    ? customAccountNo.trim() 
    : `${typeDigit}-${classDigit}-${groupCode.padStart(2, '0')}-${subCode.padStart(3, '0')}`;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!accountName.trim()) {
      setFormError('Account title/name is required.');
      return;
    }

    const finalCode = computedCode.trim();
    if (!finalCode) {
      setFormError('Account Code or Number is required.');
      return;
    }

    const codeExists = accounts.some(
      (a) => (a.code || a.accountNo || '').toLowerCase() === finalCode.toLowerCase()
    );
    if (codeExists) {
      setFormError(`Account code/number "${finalCode}" already exists. Please choose a unique account number.`);
      return;
    }

    const openingVal = Number(openingBalance) || 0;
    const newAccount: ChartAccount = {
      id: `coa-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      code: finalCode,
      accountNo: finalCode,
      typeDigit,
      classDigit,
      groupCode: groupCode.padStart(2, '0'),
      subCode: subCode.padStart(3, '0'),
      name: accountName.trim(),
      accountType: selectedType,
      classification,
      groupName,
      normalBalance,
      openingBalance: openingVal,
      currentBalance: openingVal,
      description: description.trim(),
      isActive: true,
      level: accountLevel,
      transType: accountTransType,
      parentAccountNo: parentAccountNo.trim() || undefined,
      openingBalanceType: normalBalance === 'Debit' ? 'DR' : 'CR',
      monthly: { ...EMPTY_MONTHLY_RECORD },
    };

    onAddAccount(newAccount);
    setIsAddModalOpen(false);
    showNotification(`Account ${newAccount.code} — "${newAccount.name}" created successfully.`);

    // Reset Form
    setAccountName('');
    setDescription('');
    setOpeningBalance(0);
    setCustomAccountNo('');
    setUseCustomAccountNo(false);
  };

  // =========================================================
  // EDIT ACCOUNT MODAL STATE
  // =========================================================
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editType, setEditType] = useState<AccountType>('Asset');
  const [editLevel, setEditLevel] = useState<number>(3);
  const [editTransType, setEditTransType] = useState<'G' | 'T'>('T');
  const [editParentNo, setEditParentNo] = useState('');
  const [editClassification, setEditClassification] = useState('');
  const [editGroupName, setEditGroupName] = useState('');
  const [editNormalBalance, setEditNormalBalance] = useState<'Debit' | 'Credit'>('Debit');
  const [editOpeningBalance, setEditOpeningBalance] = useState<number>(0);
  const [editCurrentBalance, setEditCurrentBalance] = useState<number>(0);
  const [editDescription, setEditDescription] = useState('');
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [editFormError, setEditFormError] = useState<string | null>(null);

  const handleOpenEdit = (acc: ChartAccount) => {
    setEditingAccount(acc);
    setEditName(acc.name);
    setEditCode(acc.accountNo || acc.code);
    setEditType(acc.accountType);
    setEditLevel(acc.level || (acc.code.length <= 1 ? 1 : acc.code.length <= 2 ? 2 : acc.code.length <= 4 ? 3 : 4));
    setEditTransType((acc.transType as 'G' | 'T') || (acc.level && acc.level >= 4 ? 'T' : 'G'));
    setEditParentNo(acc.parentAccountNo || '');
    setEditClassification(acc.classification);
    setEditGroupName(acc.groupName);
    setEditNormalBalance(acc.normalBalance);
    setEditOpeningBalance(acc.openingBalance);
    setEditCurrentBalance(acc.currentBalance);
    setEditDescription(acc.description || '');
    setEditIsActive(acc.isActive !== false);
    setEditFormError(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;
    setEditFormError(null);

    const trimmedName = editName.trim();
    const trimmedCode = editCode.trim();

    if (!trimmedName) {
      setEditFormError('Account title/name is required.');
      return;
    }
    if (!trimmedCode) {
      setEditFormError('Account code/number is required.');
      return;
    }

    const codeExists = accounts.some(
      (a) => a.id !== editingAccount.id && (a.code || a.accountNo || '').toLowerCase() === trimmedCode.toLowerCase()
    );
    if (codeExists) {
      setEditFormError(`Another account already uses code "${trimmedCode}".`);
      return;
    }

    const updated: ChartAccount = {
      ...editingAccount,
      name: trimmedName,
      code: trimmedCode,
      accountNo: trimmedCode,
      accountType: editType,
      level: editLevel,
      transType: editTransType,
      parentAccountNo: editParentNo.trim() || undefined,
      classification: editClassification.trim(),
      groupName: editGroupName.trim(),
      normalBalance: editNormalBalance,
      openingBalance: Number(editOpeningBalance) || 0,
      currentBalance: Number(editCurrentBalance) || 0,
      description: editDescription.trim() || undefined,
      isActive: editIsActive,
      openingBalanceType: editNormalBalance === 'Debit' ? 'DR' : 'CR',
    };

    onUpdateAccount(updated);
    setEditingAccount(null);
    showNotification(`Account ${updated.code} — "${updated.name}" updated successfully.`);
  };

  // =========================================================
  // DELETE ACCOUNT MODAL STATE
  // =========================================================
  const handleOpenDelete = (acc: ChartAccount) => {
    setDeletingAccount(acc);
  };

  const vouchersUsingAccount = useMemo(() => {
    if (!deletingAccount) return [];
    return vouchers.filter((v) =>
      v.lines.some(
        (l) => l.accountId === deletingAccount.id || l.accountCode === deletingAccount.code || l.accountCode === deletingAccount.accountNo
      )
    );
  }, [deletingAccount, vouchers]);

  const handleConfirmDelete = () => {
    if (!deletingAccount) return;
    const deletedId = deletingAccount.id;
    const deletedName = deletingAccount.name;
    const deletedCode = deletingAccount.code || deletingAccount.accountNo;

    if (onDeleteAccount) {
      onDeleteAccount(deletedId);
    }
    setDeletingAccount(null);
    showNotification(`Account ${deletedCode} — "${deletedName}" removed from Chart of Accounts.`, 'warning');
  };

  // =========================================================
  // IMPORT JSON MODAL STATE
  // =========================================================
  const [jsonInput, setJsonInput] = useState<string>('');
  const [overrideAll, setOverrideAll] = useState<boolean>(false);
  const [importFeedback, setImportFeedback] = useState<{
    valid: boolean;
    message: string;
    parsedAccounts: ChartAccount[];
  }>({
    valid: false,
    message: 'Paste or upload a JSON array of accounts to begin.',
    parsedAccounts: [],
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate JSON on changes
  useEffect(() => {
    if (!jsonInput.trim()) {
      setImportFeedback({
        valid: false,
        message: 'Paste or upload a JSON array of accounts.',
        parsedAccounts: [],
      });
      return;
    }

    const res = parseAndValidateAccountsJson(jsonInput);
    if (res.success && res.accounts) {
      setImportFeedback({
        valid: true,
        message: `Successfully validated ${res.accounts.length} account head(s). Ready to import.`,
        parsedAccounts: res.accounts,
      });
    } else {
      setImportFeedback({
        valid: false,
        message: res.error || 'Invalid JSON syntax.',
        parsedAccounts: [],
      });
    }
  }, [jsonInput]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        setJsonInput(text);
      }
    };
    reader.readAsText(file);
    // Reset file input value so re-uploading same file works
    e.target.value = '';
  };

  const handleLoadSampleTemplateIntoBox = () => {
    setJsonInput(JSON.stringify(STANDARD_COA_TEMPLATE, null, 2));
  };

  const handleExecuteImport = () => {
    if (!importFeedback.valid || importFeedback.parsedAccounts.length === 0) {
      return;
    }

    const toImport = importFeedback.parsedAccounts;
    if (onImportAccounts) {
      onImportAccounts(toImport, overrideAll);
    }

    setIsImportModalOpen(false);
    setJsonInput('');
    showNotification(
      overrideAll
        ? `Successfully imported ${toImport.length} accounts. All prior accounts have been overridden.`
        : `Successfully imported / merged ${toImport.length} accounts.`
    );
  };

  // =========================================================
  // PRINT HANDLING
  // =========================================================
  const handleTriggerPrint = () => {
    printConcernedTable('printable-coa-register-sheet', 'Chart of Accounts Register', {
      tableName: 'Standard Chart of Accounts (COA) Register',
      reportDate: new Date().toLocaleDateString('en-GB'),
      subtitle: `Total Accounts: ${filteredAccounts.length}`,
    });
  };

  // Filtered & Sorted Accounts List
  const filteredAccounts = useMemo(() => {
    return accounts.filter((a) => {
      const codeStr = (a.code || a.accountNo || '').toLowerCase();
      const nameStr = (a.name || '').toLowerCase();
      const groupStr = (a.groupName || '').toLowerCase();
      const classStr = (a.classification || '').toLowerCase();
      const q = searchTerm.toLowerCase();

      const matchesSearch =
        codeStr.includes(q) ||
        nameStr.includes(q) ||
        groupStr.includes(q) ||
        classStr.includes(q);

      const matchesType = typeFilter === 'All' || a.accountType === typeFilter;
      const matchesLevel = levelFilter === 'All' || String(a.level || 3) === levelFilter;
      const matchesTrans = transTypeFilter === 'All' || (a.transType || 'T') === transTypeFilter;

      return matchesSearch && matchesType && matchesLevel && matchesTrans;
    }).sort((a, b) => {
      const codeA = a.code || a.accountNo || '';
      const codeB = b.code || b.accountNo || '';
      return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [accounts, searchTerm, typeFilter, levelFilter, transTypeFilter]);

  // =========================================================
  // PAGINATION & "SHOW ALL" STATE
  // =========================================================
  const [pageSize, setPageSize] = useState<number | 'all'>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Automatically reset to page 1 whenever search, filters, or page size change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, levelFilter, transTypeFilter, pageSize]);

  const totalFilteredCount = filteredAccounts.length;
  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalFilteredCount / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const displayedAccounts = useMemo(() => {
    if (pageSize === 'all') return filteredAccounts;
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return filteredAccounts.slice(startIndex, startIndex + pageSize);
  }, [filteredAccounts, safeCurrentPage, pageSize]);

  const startIndexDisplay = totalFilteredCount === 0 
    ? 0 
    : pageSize === 'all' 
    ? 1 
    : (safeCurrentPage - 1) * pageSize + 1;
  const endIndexDisplay = pageSize === 'all' 
    ? totalFilteredCount 
    : Math.min(safeCurrentPage * pageSize, totalFilteredCount);

  // Aggregate Metrics
  const totalAssets = accounts
    .filter((a) => a.accountType === 'Asset')
    .reduce((sum, a) => sum + (a.currentBalance || 0), 0);
  const totalLiabilities = accounts
    .filter((a) => a.accountType === 'Liability')
    .reduce((sum, a) => sum + (a.currentBalance || 0), 0);
  const totalEquity = accounts
    .filter((a) => a.accountType === 'Equity')
    .reduce((sum, a) => sum + (a.currentBalance || 0), 0);
  const totalRevenue = accounts
    .filter((a) => a.accountType === 'Revenue')
    .reduce((sum, a) => sum + (a.currentBalance || 0), 0);
  const totalExpenses = accounts
    .filter((a) => a.accountType === 'Expense')
    .reduce((sum, a) => sum + (a.currentBalance || 0), 0);

  return (
    <div className="space-y-6">
      {/* View Header with Operation Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Accountant System
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">Hierarchical General Ledger Chart</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-emerald-600" />
            Chart of Accounts (COA)
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Hierarchical chart of accounts supporting JSON import with override, export, print preview, and account modifications.
          </p>
        </div>

        {/* Action Buttons: Add, Import, Export, Print */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          {/* 1. Add Account */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Account</span>
          </button>

          {/* 2. Import JSON */}
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600" />
            <span>Import JSON</span>
          </button>

          {/* 3. Export JSON */}
          <button
            type="button"
            onClick={() => exportAccountsToJsonFile(accounts)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 rounded-lg transition-colors shadow-xs cursor-pointer"
            title="Download accounts in specified JSON schema"
          >
            <FileJson className="w-3.5 h-3.5 text-blue-600" />
            <span>Export JSON</span>
          </button>

          {/* 4. Export CSV */}
          <button
            type="button"
            onClick={() => exportAccountsToCsvFile(accounts)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 rounded-lg transition-colors shadow-xs cursor-pointer"
            title="Download accounts for Excel spreadsheet"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Export CSV</span>
          </button>

          {/* 5. Print Register */}
          <button
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print Register</span>
          </button>
        </div>
      </div>

      {/* Floating Notification Toast */}
      {notification && (
        <div
          className={`p-3.5 rounded-lg border text-xs flex items-center justify-between gap-2.5 transition-all shadow-xs ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : notification.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {notification.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />}
            {notification.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            <span className="font-medium">{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* COA Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {(['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'] as AccountType[]).map((type) => {
          const typeAccounts = accounts.filter((a) => a.accountType === type);
          const count = typeAccounts.length;
          const balance = typeAccounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0);
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
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                    type === 'Asset' || type === 'Expense'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {type === 'Asset' || type === 'Expense' ? 'Normal Dr' : 'Normal Cr'}
                </span>
              </div>
              <div className="text-sm font-bold text-slate-900 mt-1">{type}s</div>
              <div className="flex items-baseline justify-between mt-1 text-xs">
                <span className="text-slate-500">{count} heads</span>
                <span className="font-mono font-semibold text-slate-800 tabular-nums">
                  {formatWholeNumber(balance)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-3.5 border border-slate-200 rounded-xl shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search account code (e.g. 1101), name, or group..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Type Filter */}
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

          {/* Level Filter */}
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-700 font-medium"
          >
            <option value="All">All Hierarchy Levels</option>
            <option value="1">Level 1 (Class)</option>
            <option value="2">Level 2 (Group)</option>
            <option value="3">Level 3 (Control Head)</option>
            <option value="4">Level 4 (Subsidiary)</option>
          </select>

          {/* Trans Type Filter */}
          <select
            value={transTypeFilter}
            onChange={(e) => setTransTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-700 font-medium"
          >
            <option value="All">All Trans Types</option>
            <option value="G">G - Group / Control</option>
            <option value="T">T - Transaction Detail</option>
          </select>

          {/* Page Size & Show All Selector */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
            <span className="text-[11px] text-slate-500 font-medium">Rows:</span>
            <select
              value={String(pageSize)}
              onChange={(e) => {
                const val = e.target.value;
                setPageSize(val === 'all' ? 'all' : Number(val));
              }}
              className="px-2 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-700 font-medium"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="all">Show All ({totalFilteredCount})</option>
            </select>

            <button
              type="button"
              onClick={() => setPageSize((prev) => (prev === 'all' ? 25 : 'all'))}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                pageSize === 'all'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
              title={pageSize === 'all' ? 'Switch to Paginated View (25 per page)' : 'Show All Accounts on One Page'}
            >
              {pageSize === 'all' ? 'Paginate' : 'Show All'}
            </button>
          </div>

          {(searchTerm || typeFilter !== 'All' || levelFilter !== 'All' || transTypeFilter !== 'All') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('All');
                setLevelFilter('All');
                setTransTypeFilter('All');
              }}
              className="px-2.5 py-1.5 text-xs text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-200 rounded-lg cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* COA Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4 font-mono">Account No</th>
                <th className="py-3 px-4">Account Title & Classification</th>
                <th className="py-3 px-3 text-center">Type</th>
                <th className="py-3 px-2 text-center">Lvl</th>
                <th className="py-3 px-2 text-center">Tr</th>
                <th className="py-3 px-3">Parent</th>
                <th className="py-3 px-3 text-center">Normal</th>
                <th className="py-3 px-4 text-right">Opening Bal</th>
                <th className="py-3 px-4 text-right">Current Bal</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedAccounts.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500">
                    <p className="font-medium">No accounts found matching the current criteria.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      You can add new accounts or click "Import JSON" to load from template.
                    </p>
                  </td>
                </tr>
              ) : (
                displayedAccounts.map((acc) => {
                  const level = acc.level || (acc.code.length <= 1 ? 1 : acc.code.length <= 2 ? 2 : acc.code.length <= 4 ? 3 : 4);
                  const isGroup = acc.transType === 'G' || level <= 2;
                  const indentPadding = level === 1 ? 'pl-0' : level === 2 ? 'pl-3' : level === 3 ? 'pl-6' : 'pl-9';

                  return (
                    <tr
                      key={acc.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isGroup ? 'bg-slate-50/30 font-medium' : ''
                      }`}
                    >
                      {/* Account No / Code */}
                      <td className="py-3 px-4 font-mono font-bold text-emerald-800 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{acc.accountNo || acc.code}</span>
                        </div>
                      </td>

                      {/* Account Title */}
                      <td className="py-3 px-4">
                        <div className={`flex items-start ${indentPadding}`}>
                          {level > 1 && (
                            <span className="text-slate-300 mr-1.5 select-none font-mono">└─</span>
                          )}
                          <div>
                            <span className={`text-slate-900 ${level === 1 ? 'font-bold uppercase tracking-wide' : level === 2 ? 'font-semibold' : 'font-normal'}`}>
                              {acc.name}
                            </span>
                            <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                              {acc.groupName && <span>{acc.groupName}</span>}
                              {acc.classification && acc.classification !== acc.groupName && (
                                <>
                                  <span className="text-slate-300">·</span>
                                  <span>{acc.classification}</span>
                                </>
                              )}
                              {acc.description && (
                                <>
                                  <span className="text-slate-300">·</span>
                                  <span className="truncate max-w-xs">{acc.description}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${
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

                      {/* Level */}
                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                          L{level}
                        </span>
                      </td>

                      {/* Trans Type (G / T) */}
                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        <span
                          className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            acc.transType === 'G'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                          title={acc.transType === 'G' ? 'General Group Account' : 'Transactional Detail'}
                        >
                          {acc.transType || (level >= 4 ? 'T' : 'G')}
                        </span>
                      </td>

                      {/* Parent Account */}
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {acc.parentAccountNo || '—'}
                      </td>

                      {/* Normal Balance */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="font-mono text-[11px] font-semibold text-slate-600">
                          {acc.normalBalance === 'Debit' || acc.openingBalanceType === 'DR' ? 'DR' : 'CR'}
                        </span>
                      </td>

                      {/* Opening Bal */}
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600 whitespace-nowrap">
                        {formatWholeNumber(acc.openingBalance)}
                      </td>

                      {/* Current Bal */}
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900 whitespace-nowrap">
                        {formatWholeNumber(acc.currentBalance)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                            acc.isActive !== false
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {acc.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Action Buttons: Edit & Remove */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(acc)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                            title={`Edit ${acc.code} — ${acc.name}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDelete(acc)}
                            className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title={`Remove ${acc.code}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Summary & Pagination Controls */}
        <div className="bg-slate-50 px-4 py-3.5 border-t border-slate-200 space-y-3">
          {/* Row 1: Pagination Navigation Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span>
                Showing <strong className="text-slate-900 font-mono">{startIndexDisplay}–{endIndexDisplay}</strong> of{' '}
                <strong className="text-slate-900 font-mono">{totalFilteredCount}</strong> filtered accounts
                {pageSize !== 'all' && (
                  <span className="text-slate-400 font-mono ml-1">
                    (Page {safeCurrentPage} of {totalPages})
                  </span>
                )}
              </span>
              {pageSize === 'all' && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                  All Records Shown
                </span>
              )}
            </div>

            {/* Pagination Button Controls */}
            {pageSize !== 'all' && totalPages > 1 && (
              <div className="flex items-center gap-1">
                {/* First Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={safeCurrentPage <= 1}
                  className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  title="First Page"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>

                {/* Prev Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage <= 1}
                  className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {/* Page Number Buttons with Windowing */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => {
                    if (totalPages <= 7) return true;
                    if (p === 1 || p === totalPages) return true;
                    return Math.abs(p - safeCurrentPage) <= 2;
                  })
                  .map((p, idx, arr) => {
                    const prev = arr[idx - 1];
                    const showEllipsis = prev && p - prev > 1;

                    return (
                      <React.Fragment key={p}>
                        {showEllipsis && (
                          <span className="px-1 text-slate-400 select-none font-mono">…</span>
                        )}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(p)}
                          className={`min-w-7 h-7 px-2 text-xs font-mono font-medium rounded-md border transition-colors cursor-pointer ${
                            safeCurrentPage === p
                              ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}

                {/* Next Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage >= totalPages}
                  className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  title="Next Page"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                {/* Last Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={safeCurrentPage >= totalPages}
                  className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  title="Last Page"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Quick Switch Button in Footer */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500">Page size:</span>
              <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5 text-[11px] font-mono">
                {[10, 25, 50, 100].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setPageSize(sz)}
                    className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                      pageSize === sz
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPageSize('all')}
                  className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                    pageSize === 'all'
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Financial Aggregates Strip */}
          <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-600 gap-2">
            <span className="font-sans text-slate-500">
              System Totals: <strong className="text-slate-900">{accounts.length}</strong> accounts cataloged
            </span>
            <div className="flex flex-wrap items-center gap-4">
              <span>Assets: <strong className="text-slate-900">{formatWholeNumber(totalAssets)}</strong></span>
              <span>Liabilities: <strong className="text-slate-900">{formatWholeNumber(totalLiabilities)}</strong></span>
              <span>Equity: <strong className="text-slate-900">{formatWholeNumber(totalEquity)}</strong></span>
              <span>Revenue: <strong className="text-slate-900">{formatWholeNumber(totalRevenue)}</strong></span>
              <span>Expenses: <strong className="text-slate-900">{formatWholeNumber(totalExpenses)}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          MODAL 1: IMPORT JSON (WITH OVERRIDE OPTION & TEMPLATE DOWNLOAD)
          ========================================================= */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <FileJson className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Import Chart of Accounts from JSON
                  </h3>
                  <p className="text-xs text-slate-500">
                    Import accounts matching standard JSON structure with monthly breakdown and override option.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Template & Helper Bar */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-slate-600">
                  Need the standard format? Download the template file or load sample data.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={downloadCoaTemplateFile}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>Download Template (.json)</span>
                </button>
                <button
                  type="button"
                  onClick={handleLoadSampleTemplateIntoBox}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3 text-slate-500" />
                  <span>Load Sample Data</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded transition-colors cursor-pointer"
                >
                  <Upload className="w-3 h-3 text-slate-500" />
                  <span>Upload File</span>
                </button>
              </div>
            </div>

            {/* JSON Code Input Area */}
            <div className="flex-1 min-h-[160px] flex flex-col space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Paste Accounts JSON Array:</span>
                <span className="text-[11px] font-normal text-slate-400">
                  Supports [ {`{ "accountNo": "11", "accountName": "CURRENT ASSETS", ... }`} ]
                </span>
              </label>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder={`[\n  {\n    "accountNo": "11",\n    "accountName": "CURRENT ASSETS",\n    "accountType": "Asset",\n    "level": 2,\n    "transType": "G",\n    "parentAccountNo": "1",\n    "openingBalance": 0,\n    "openingBalanceType": "DR",\n    "monthly": {\n      "jan": { "credit": 0, "debit": 0 }\n    }\n  }\n]`}
                rows={9}
                className="w-full p-3 font-mono text-[11px] bg-slate-900 text-emerald-400 border border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>

            {/* Live Status and Validation Feedback */}
            <div
              className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                importFeedback.valid
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : jsonInput.trim()
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              {importFeedback.valid ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              <span className="font-medium">{importFeedback.message}</span>
            </div>

            {/* Mode Option: Override All Existing Accounts */}
            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={overrideAll}
                  onChange={(e) => setOverrideAll(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Override all existing accounts
                  </span>
                  <span className="text-[11px] text-slate-500">
                    If enabled, all existing accounts in Chart of Accounts and live Supabase table will be deleted and completely replaced by this imported JSON list.
                  </span>
                </div>
              </label>

              {overrideAll && (
                <div className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-1.5 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>
                    Caution: This will purge current accounts ({accounts.length} heads) and replace them with the {importFeedback.parsedAccounts.length} imported accounts.
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!importFeedback.valid || importFeedback.parsedAccounts.length === 0}
                onClick={handleExecuteImport}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer ${
                  importFeedback.valid && importFeedback.parsedAccounts.length > 0
                    ? overrideAll
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>
                  {overrideAll
                    ? `Override & Import (${importFeedback.parsedAccounts.length}) Accounts`
                    : `Import (${importFeedback.parsedAccounts.length}) Accounts`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 2: EDIT ACCOUNT MODAL
          ========================================================= */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 max-w-xl w-full p-6 shadow-xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[11px] font-mono font-semibold text-emerald-600 uppercase tracking-wider">
                  Account Master File
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Edit Account: {editingAccount.code}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingAccount(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editFormError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{editFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Account Number / Code */}
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Account No / Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                </div>

                {/* Account Type */}
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Account Type *
                  </label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as AccountType)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium"
                  >
                    <option value="Asset">Asset</option>
                    <option value="Liability">Liability</option>
                    <option value="Equity">Equity</option>
                    <option value="Revenue">Revenue</option>
                    <option value="Expense">Expense</option>
                  </select>
                </div>
              </div>

              {/* Account Title */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Account Title / Name *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
              </div>

              {/* Level, Trans Type, Parent */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Hierarchy Level
                  </label>
                  <select
                    value={editLevel}
                    onChange={(e) => setEditLevel(Number(e.target.value))}
                    className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded text-slate-900"
                  >
                    <option value={1}>1 - Class</option>
                    <option value={2}>2 - Group</option>
                    <option value={3}>3 - Control Head</option>
                    <option value={4}>4 - Detail / Subsidiary</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Trans Type
                  </label>
                  <select
                    value={editTransType}
                    onChange={(e) => setEditTransType(e.target.value as 'G' | 'T')}
                    className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded text-slate-900"
                  >
                    <option value="G">G (Group Head)</option>
                    <option value="T">T (Transactional)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Parent Account
                  </label>
                  <input
                    type="text"
                    value={editParentNo}
                    onChange={(e) => setEditParentNo(e.target.value)}
                    placeholder="e.g. 11"
                    className="w-full px-2 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded text-slate-900"
                  />
                </div>
              </div>

              {/* Classification and Group Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Classification
                  </label>
                  <input
                    type="text"
                    value={editClassification}
                    onChange={(e) => setEditClassification(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Group Name
                  </label>
                  <input
                    type="text"
                    value={editGroupName}
                    onChange={(e) => setEditGroupName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                </div>
              </div>

              {/* Normal Balance & Opening / Current Balances */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Normal Balance
                  </label>
                  <select
                    value={editNormalBalance}
                    onChange={(e) => setEditNormalBalance(e.target.value as 'Debit' | 'Credit')}
                    className="w-full px-2 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="Debit">Debit (DR)</option>
                    <option value="Credit">Credit (CR)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Opening Balance
                  </label>
                  <input
                    type="number"
                    value={editOpeningBalance}
                    onChange={(e) => setEditOpeningBalance(Number(e.target.value))}
                    className="w-full px-2 py-2 text-xs font-mono tabular-nums bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Current Balance
                  </label>
                  <input
                    type="number"
                    value={editCurrentBalance}
                    onChange={(e) => setEditCurrentBalance(Number(e.target.value))}
                    className="w-full px-2 py-2 text-xs font-mono tabular-nums font-bold bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Description / Audit Notes
                </label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
              </div>

              {/* Status Toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                />
                <label htmlFor="editIsActive" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Account is Active and available for vouchers and general ledger
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 3: DELETE ACCOUNT CONFIRMATION
          ========================================================= */}
      {deletingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Delete Account
                </h3>
                <p className="text-xs text-slate-500">
                  Confirm removal of account from standard ledger.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Account No:</span>
                <span className="font-mono font-bold text-slate-900">{deletingAccount.accountNo || deletingAccount.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Account Title:</span>
                <span className="font-semibold text-slate-900">{deletingAccount.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Type:</span>
                <span>{deletingAccount.accountType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Balance:</span>
                <span className="font-mono font-bold text-slate-900">{formatWholeNumber(deletingAccount.currentBalance)}</span>
              </div>
            </div>

            {vouchersUsingAccount.length > 0 && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Audit Trail Warning:</span>
                  <span>
                    This account is referenced in {vouchersUsingAccount.length} voucher(s). Removing it will preserve historical voucher records but unlink this head in future filters.
                  </span>
                </div>
              </div>
            )}

            {deletingAccount.currentBalance !== 0 && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>
                  Notice: This account carries a non-zero balance ({formatWholeNumber(deletingAccount.currentBalance)}). Consider transferring balance via Journal Voucher first.
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingAccount(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 4: PRINT REGISTER (HIGH DENSITY PRINTABLE SHEET)
          ========================================================= */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 max-w-4xl w-full p-6 shadow-xl space-y-4 max-h-[92vh] flex flex-col">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-slate-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Print Chart of Accounts Register
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTriggerPrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Preview Container */}
            <div id="printable-coa-register-sheet" className="flex-1 overflow-y-auto border border-slate-200 rounded-lg p-6 bg-white space-y-4 text-xs font-sans print-concerned-table">
              {/* Document Header */}
              <PrintDocumentHeader
                tableName="Standard Chart of Accounts (COA) Register"
                date={new Date().toLocaleDateString('en-GB')}
                subtitle={`Total Accounts: ${filteredAccounts.length}`}
              />

              {/* Printable Table */}
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="border-b border-slate-400 bg-slate-100 font-bold text-slate-900">
                    <th className="py-1.5 px-2 font-mono">Account No</th>
                    <th className="py-1.5 px-2">Account Title</th>
                    <th className="py-1.5 px-2 text-center">Type</th>
                    <th className="py-1.5 px-2 text-center">Lvl</th>
                    <th className="py-1.5 px-2 text-center">Tr</th>
                    <th className="py-1.5 px-2 text-center">Parent</th>
                    <th className="py-1.5 px-2 text-center">Norm</th>
                    <th className="py-1.5 px-2 text-right">Opening Bal</th>
                    <th className="py-1.5 px-2 text-right">Current Bal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredAccounts.map((acc) => {
                    const level = acc.level || (acc.code.length <= 1 ? 1 : acc.code.length <= 2 ? 2 : acc.code.length <= 4 ? 3 : 4);
                    const isGroup = acc.transType === 'G' || level <= 2;
                    return (
                      <tr key={acc.id} className={isGroup ? 'bg-slate-50 font-semibold' : ''}>
                        <td className="py-1 px-2 font-mono">{acc.accountNo || acc.code}</td>
                        <td className="py-1 px-2">
                          <span style={{ paddingLeft: `${(level - 1) * 12}px` }}>
                            {acc.name}
                          </span>
                        </td>
                        <td className="py-1 px-2 text-center">{acc.accountType}</td>
                        <td className="py-1 px-2 text-center font-mono">L{level}</td>
                        <td className="py-1 px-2 text-center font-mono">{acc.transType || (level >= 4 ? 'T' : 'G')}</td>
                        <td className="py-1 px-2 text-center font-mono">{acc.parentAccountNo || '—'}</td>
                        <td className="py-1 px-2 text-center font-mono">{acc.normalBalance === 'Debit' ? 'DR' : 'CR'}</td>
                        <td className="py-1 px-2 text-right font-mono tabular-nums">{formatWholeNumber(acc.openingBalance)}</td>
                        <td className="py-1 px-2 text-right font-mono tabular-nums font-bold">{formatWholeNumber(acc.currentBalance)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Financial Summary */}
              <div className="pt-4 border-t-2 border-slate-300 grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px] font-mono">
                <div className="p-2 border border-slate-200 rounded">
                  <span className="text-slate-500 block">Total Assets:</span>
                  <span className="font-bold text-slate-900">{formatWholeNumber(totalAssets)}</span>
                </div>
                <div className="p-2 border border-slate-200 rounded">
                  <span className="text-slate-500 block">Total Liabilities:</span>
                  <span className="font-bold text-slate-900">{formatWholeNumber(totalLiabilities)}</span>
                </div>
                <div className="p-2 border border-slate-200 rounded">
                  <span className="text-slate-500 block">Total Equity:</span>
                  <span className="font-bold text-slate-900">{formatWholeNumber(totalEquity)}</span>
                </div>
                <div className="p-2 border border-slate-200 rounded">
                  <span className="text-slate-500 block">Total Revenue:</span>
                  <span className="font-bold text-slate-900">{formatWholeNumber(totalRevenue)}</span>
                </div>
                <div className="p-2 border border-slate-200 rounded">
                  <span className="text-slate-500 block">Total Expenses:</span>
                  <span className="font-bold text-slate-900">{formatWholeNumber(totalExpenses)}</span>
                </div>
              </div>

              {/* Verification & Signatures */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-center text-[10px] text-slate-600">
                <div>
                  <div className="border-t border-slate-400 pt-1 font-semibold">Chief Accountant / Controller</div>
                  <div className="text-slate-400 text-[9px]">Verified & Reconciled</div>
                </div>
                <div>
                  <div className="border-t border-slate-400 pt-1 font-semibold">Managing Partner / Director</div>
                  <div className="text-slate-400 text-[9px]">Approved for Operations</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 5: ADD NEW ACCOUNT MODAL (T-C-GG-SSS / CUSTOM)
          ========================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 max-w-xl w-full p-6 shadow-xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[11px] font-mono font-semibold text-emerald-600 uppercase tracking-wider">
                  Chart of Accounts Master
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Create New Account Head
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
              {/* Account Number Toggle (Structured vs Direct) */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-emerald-800 font-medium block">
                      Account Code / Number:
                    </span>
                    <span className="font-mono text-base font-bold text-emerald-900 tracking-wider">
                      {computedCode}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-700 bg-white px-2 py-1 rounded border border-emerald-200">
                    Normal: {normalBalance}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-emerald-200/60">
                  <input
                    type="checkbox"
                    id="useCustomNo"
                    checked={useCustomAccountNo}
                    onChange={(e) => setUseCustomAccountNo(e.target.checked)}
                    className="w-3.5 h-3.5 text-emerald-600 rounded"
                  />
                  <label htmlFor="useCustomNo" className="text-[11px] text-emerald-900 cursor-pointer">
                    Enter custom account number (e.g. 11, 1101, 110101) instead of 4-part code
                  </label>
                </div>

                {useCustomAccountNo && (
                  <input
                    type="text"
                    placeholder="e.g. 1101 or 110101"
                    value={customAccountNo}
                    onChange={(e) => setCustomAccountNo(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-emerald-300 rounded text-slate-900 focus:outline-hidden"
                  />
                )}
              </div>

              {/* 4 Code Segment Controls (Only when not custom) */}
              {!useCustomAccountNo && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      T (Type) *
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
                      C (Class) *
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
                      GG (Group) *
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
                      SSS (Sub) *
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
              )}

              {/* Account Title */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Account Title / Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CASH AND BANK BALANCES or Quetta Coal Sales"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 font-semibold"
                />
              </div>

              {/* Hierarchy Level, Trans Type, Parent */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Hierarchy Level
                  </label>
                  <select
                    value={accountLevel}
                    onChange={(e) => setAccountLevel(Number(e.target.value))}
                    className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded text-slate-900"
                  >
                    <option value={1}>1 - Class</option>
                    <option value={2}>2 - Group</option>
                    <option value={3}>3 - Control Head</option>
                    <option value={4}>4 - Subsidiary</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Trans Type
                  </label>
                  <select
                    value={accountTransType}
                    onChange={(e) => setAccountTransType(e.target.value as 'G' | 'T')}
                    className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded text-slate-900"
                  >
                    <option value="G">G - Group Control</option>
                    <option value="T">T - Transaction</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Parent No
                  </label>
                  <input
                    type="text"
                    value={parentAccountNo}
                    onChange={(e) => setParentAccountNo(e.target.value)}
                    placeholder="e.g. 11"
                    className="w-full px-2 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded text-slate-900"
                  />
                </div>
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
                    step="1"
                    min="0"
                    value={openingBalance === 0 ? '' : openingBalance}
                    onChange={(e) => setOpeningBalance(e.target.value === '' ? '' : Math.round(Number(e.target.value)))}
                    placeholder="0"
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
                  Description / Audit Notes
                </label>
                <input
                  type="text"
                  placeholder="Ledger audit notes, purpose, operational details..."
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
                  Save Account Head
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
