import React, { useState, useMemo } from 'react';
import { 
  Database, 
  Upload, 
  Table as TableIcon, 
  Search, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Layers, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  RefreshCw,
  Code2,
  FileCode,
  Info,
  FolderOpen
} from 'lucide-react';
import { TableDefinition, ColumnDefinition, OldLedgerDataMap, ImportSummary } from '../../types/oldLedger';
import { standardOldLedgerSchemas, initialOldLedgerData } from '../../data/mockOldLedgerData';
import { parseMdbOrAccdbFile } from '../../utils/mdbImporter';

interface OldLedgerScreenProps {
  tables: TableDefinition[];
  dataMap: OldLedgerDataMap;
  lastImportSummary?: ImportSummary | null;
  onImportSuccess: (newTables: TableDefinition[], newData: OldLedgerDataMap, summary: ImportSummary) => void;
  onResetToSampleData: () => void;
}

export const OldLedgerScreen: React.FC<OldLedgerScreenProps> = ({
  tables,
  dataMap,
  lastImportSummary,
  onImportSuccess,
  onResetToSampleData,
}) => {
  const [activeView, setActiveView] = useState<'view_account_info' | 'import_data'>('view_account_info');
  const [selectedTableName, setSelectedTableName] = useState<string>(tables[0]?.name || 'GLHIS');
  const [tableSearchTerm, setTableSearchTerm] = useState('');
  const [dataSearchTerm, setDataSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [showSqlSchemaModal, setShowSqlSchemaModal] = useState(false);

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Currently selected table schema & data
  const selectedTable = useMemo(() => {
    return tables.find((t) => t.name === selectedTableName) || tables[0];
  }, [tables, selectedTableName]);

  const rawTableRows = useMemo(() => {
    if (!selectedTable) return [];
    return dataMap[selectedTable.name] || [];
  }, [dataMap, selectedTable]);

  // Search filtered rows in the selected table
  const filteredRows = useMemo(() => {
    if (!dataSearchTerm.trim()) return rawTableRows;
    const term = dataSearchTerm.toLowerCase();
    return rawTableRows.filter((row) => {
      return Object.values(row).some((val) => {
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(term);
      });
    });
  }, [rawTableRows, dataSearchTerm]);

  // Paginated rows
  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  // Filtered table list for navigation
  const filteredTableList = useMemo(() => {
    if (!tableSearchTerm.trim()) return tables;
    const term = tableSearchTerm.toLowerCase();
    return tables.filter(
      (t) => t.name.toLowerCase().includes(term) || t.family.toLowerCase().includes(term)
    );
  }, [tables, tableSearchTerm]);

  // Group tables by family
  const groupedTables = useMemo(() => {
    const groups: Record<string, TableDefinition[]> = {};
    filteredTableList.forEach((t) => {
      if (!groups[t.family]) groups[t.family] = [];
      groups[t.family].push(t);
    });
    return groups;
  }, [filteredTableList]);

  // File Upload Handler (Replace Mode)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.mdb') && !lower.endsWith('.accdb')) {
      setImportError('Invalid file type. Please upload a Microsoft Access (.mdb or .accdb) file.');
      return;
    }

    setIsProcessingFile(true);
    setImportError(null);

    try {
      const result = await parseMdbOrAccdbFile(file);
      if (!result.success) {
        setImportError(result.error || 'Failed to read Microsoft Access database.');
        setIsProcessingFile(false);
        return;
      }

      // Replace mode: Override existing data completely
      onImportSuccess(result.tables, result.data, result.summary);
      setSelectedTableName(result.tables[0]?.name || '');
      setCurrentPage(1);
      setIsProcessingFile(false);
      setIsImportModalOpen(false);
      showNotice(
        `Import Successful: ${result.tables.length} tables and ${result.summary.totalRows.toLocaleString()} records loaded in replace mode from "${file.name}".`
      );
    } catch (err: any) {
      setImportError(err?.message || 'Error occurred while importing file.');
      setIsProcessingFile(false);
    }
  };

  // Generate Backtick SQL DDL Schema string
  const generatedSql = useMemo(() => {
    if (!selectedTable) return '';
    const colDefs = selectedTable.columns
      .map((c) => `  \`${c.name}\` ${c.type} NULL`)
      .join(',\n');

    const indexDefs = selectedTable.lookupIndexes.length > 0
      ? ',\n' + selectedTable.lookupIndexes.map((idx) => `  INDEX \`idx_${selectedTable.name.replace(/\s+/g, '_')}_${idx}\` (\`${idx}\`)`).join(',\n')
      : '';

    return `-- Microsoft Access 2007+ Mirrored Table Schema
-- Backtick-quoted identifiers (case-preserved)
CREATE TABLE \`${selectedTable.name}\` (
${colDefs}${indexDefs}
);

-- Query sample:
SELECT * FROM \`${selectedTable.name}\` LIMIT 25;`;
  }, [selectedTable]);

  // CSV Export for current table
  const handleExportTableCSV = () => {
    if (!selectedTable || rawTableRows.length === 0) {
      showNotice('No data rows to export for this table.');
      return;
    }

    const headers = selectedTable.columns.map((c) => `\`${c.name}\``).join(',');
    const rows = rawTableRows.map((row) => {
      return selectedTable.columns
        .map((c) => {
          const val = row[c.name];
          if (val === null || val === undefined) return '';
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(',');
    });

    const csvContent = headers + '\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Access_${selectedTable.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotice(`Exported ${rawTableRows.length} rows from table \`${selectedTable.name}\` to CSV.`);
  };

  return (
    <div className="space-y-6">
      {/* Module Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                Legacy Archive & Ingestion
              </span>
              <span className="text-slate-300">/</span>
              <span className="text-xs text-slate-500">Microsoft Access Engine</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1 flex items-center gap-2.5">
              <Database className="w-6 h-6 text-indigo-600" />
              <span>Old Ledger</span>
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Isolated archive for importing, querying, and auditing Microsoft Access (.accdb / .mdb) ledger databases with 100% fidelity.
            </p>
          </div>

          {/* Ledger Screen Action Buttons: Import Data(MDB file) , View Account Info */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              id="btn-import-data-mdb"
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Import Data(MDB file)</span>
            </button>

            <button
              type="button"
              id="btn-view-account-info"
              onClick={() => setActiveView('view_account_info')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors border cursor-pointer ${
                activeView === 'view_account_info'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <TableIcon className="w-4 h-4" />
              <span>View Account Info</span>
            </button>

            <button
              type="button"
              onClick={onResetToSampleData}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Reload Standard 28 Tables Schema & Data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Standard Tables</span>
            </button>
          </div>
        </div>

        {/* Status Strip */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 font-medium">
              <span className="text-slate-400">Total Tables:</span>
              <span className="font-bold font-mono text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                {tables.length}
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <span className="text-slate-400">Active Source:</span>
              <span className="font-bold text-indigo-700 font-mono">
                {lastImportSummary ? lastImportSummary.fileName : 'Standard Ledger Schema (28 Tables)'}
              </span>
            </div>
            {lastImportSummary && (
              <div className="flex items-center gap-1.5 font-medium">
                <span className="text-slate-400">Import Mode:</span>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200 text-[11px]">
                  Replace Mode (Overridden)
                </span>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-500 font-mono">
            Type Mappings: Text(n) &rarr; VARCHAR(n) · Long/Int &rarr; INT · Double &rarr; DOUBLE · Date &rarr; DATETIME
          </div>
        </div>
      </div>

      {notification && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Security notice regarding INTERFAC password sanitization */}
      <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block">Security Enforcement (Access Table `INTERFAC`):</span>
          <span>
            As per security requirements, columns `PASS1`, `PASS2`, and `PASS3` in table `INTERFAC` are strictly initialized and imported as NULL values to safeguard legacy Access system passwords.
          </span>
        </div>
      </div>

      {/* VIEW ACCOUNT INFO SCREEN */}
      {activeView === 'view_account_info' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column: Tables Navigation List */}
          <div className="lg:col-span-1 space-y-3">
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
              <div className="pb-2 border-b border-slate-100 mb-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filter tables..."
                    value={tableSearchTerm}
                    onChange={(e) => setTableSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Table Group List */}
              <div className="max-h-[640px] overflow-y-auto space-y-3 pr-1">
                {Object.entries(groupedTables).map(([family, famTables]) => (
                  <div key={family} className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block">
                      {family}
                    </span>
                    {famTables.map((tbl) => {
                      const isSelected = tbl.name === selectedTableName;
                      const rowsCount = dataMap[tbl.name]?.length ?? tbl.rowCount;
                      return (
                        <button
                          key={tbl.name}
                          type="button"
                          onClick={() => {
                            setSelectedTableName(tbl.name);
                            setCurrentPage(1);
                            setDataSearchTerm('');
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-mono transition-colors text-left cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white font-bold shadow-xs'
                              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <span className="truncate mr-1 font-semibold">`{tbl.name}`</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-sans shrink-0 ${
                            isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {rowsCount.toLocaleString()}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Table Viewer & Data Inspector */}
          <div className="lg:col-span-3 space-y-4">
            {selectedTable ? (
              <>
                {/* Table Header Bar */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                        {selectedTable.family}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs text-slate-500">
                        {selectedTable.columns.length} Columns
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs text-slate-500 font-mono">
                        {(dataMap[selectedTable.name]?.length ?? selectedTable.rowCount).toLocaleString()} Rows
                      </span>
                    </div>
                    <h2 className="text-xl font-bold font-mono text-slate-900 mt-0.5">
                      `{selectedTable.name}`
                    </h2>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setShowSqlSchemaModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                      title="View Backtick SQL Schema"
                    >
                      <Code2 className="w-3.5 h-3.5 text-slate-600" />
                      <span>SQL Schema</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleExportTableCSV}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                      title="Export current table to CSV"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-600" />
                      <span>Export CSV</span>
                    </button>
                  </div>
                </div>

                {/* Schema Metadata Pill Strip */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      Columns & Type Schema ({selectedTable.columns.length}):
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      All columns nullable · Non-unique lookup indexes added
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                    {selectedTable.columns.map((col) => (
                      <span
                        key={col.name}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white border border-slate-200 text-xs font-mono text-slate-800"
                      >
                        <span className="font-semibold text-indigo-950">`{col.name}`</span>
                        <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1 py-0.2 rounded">
                          {col.type}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Data Browser with Search & Pagination */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden space-y-3 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="relative flex-1 max-w-md">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder={`Search within \`${selectedTable.name}\`...`}
                        value={dataSearchTerm}
                        onChange={(e) => {
                          setDataSearchTerm(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>Rows per page:</span>
                      <select
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="px-2 py-1 border border-slate-300 rounded text-xs bg-white"
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                      <span className="font-mono text-slate-700">
                        {filteredRows.length} total rows
                      </span>
                    </div>
                  </div>

                  {/* Table Viewer with exact columns and values */}
                  <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-[500px]">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-mono uppercase tracking-wider text-[11px] sticky top-0 z-10">
                        <tr>
                          <th className="py-2.5 px-3 w-12 text-center bg-slate-200 border-r border-slate-300">
                            #
                          </th>
                          {selectedTable.columns.map((col) => (
                            <th
                              key={col.name}
                              className="py-2.5 px-3 border-r border-slate-200 whitespace-nowrap bg-slate-100"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-slate-900">`{col.name}`</span>
                                <span className="text-[9px] text-slate-500 font-sans font-normal lowercase">
                                  {col.type}
                                </span>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800 font-mono">
                        {paginatedRows.length === 0 ? (
                          <tr>
                            <td
                              colSpan={selectedTable.columns.length + 1}
                              className="py-12 text-center text-slate-400 font-sans"
                            >
                              {rawTableRows.length === 0
                                ? `Table \`${selectedTable.name}\` currently has 0 rows in database.`
                                : `No records found matching search "${dataSearchTerm}".`}
                            </td>
                          </tr>
                        ) : (
                          paginatedRows.map((row, rIdx) => {
                            const absoluteSr = (currentPage - 1) * pageSize + rIdx + 1;
                            return (
                              <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-2 px-3 text-center text-slate-400 text-[11px] bg-slate-50 border-r border-slate-200 font-sans">
                                  {absoluteSr}
                                </td>
                                {selectedTable.columns.map((col) => {
                                  const val = row[col.name];
                                  const isNull = val === null || val === undefined;
                                  return (
                                    <td
                                      key={col.name}
                                      className={`py-2 px-3 border-r border-slate-100 whitespace-nowrap text-[11px] ${
                                        isNull ? 'text-slate-300 italic' : 'text-slate-800'
                                      }`}
                                    >
                                      {isNull ? 'NULL' : String(val)}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-slate-600">
                    <div>
                      Showing{' '}
                      <span className="font-semibold text-slate-900">
                        {filteredRows.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
                      </span>{' '}
                      to{' '}
                      <span className="font-semibold text-slate-900">
                        {Math.min(currentPage * pageSize, filteredRows.length)}
                      </span>{' '}
                      of <span className="font-semibold text-slate-900">{filteredRows.length}</span> rows
                    </div>

                    <div className="flex items-center gap-1.5 self-center sm:self-auto">
                      <button
                        type="button"
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Previous</span>
                      </button>

                      <span className="px-3 py-1 font-mono text-slate-700">
                        Page {currentPage} of {totalPages}
                      </span>

                      <button
                        type="button"
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
                Select a table on the left to inspect its columns and data.
              </div>
            )}
          </div>
        </div>
      )}

      {/* IMPORT DATA MODAL (MDB / ACCDB) */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Import Data (Microsoft Access File)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Upload an `.accdb` or `.mdb` file. Tables will be mirrored in replace mode.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportError(null);
                }}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Ingestion Rules Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 space-y-1">
              <span className="font-bold block flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                Replace Mode Notice:
              </span>
              <p>
                Importing an Access file will completely override existing Old Ledger tables and mirror every user table, column name, and data value exactly as stored in Microsoft Access.
              </p>
              <p className="text-[11px] text-amber-800">
                System tables (`MSys*`), `Name AutoCorrect Save Failures`, and `f_*_Data` are automatically excluded. In table `INTERFAC`, password columns `PASS1/2/3` are safely left NULL.
              </p>
            </div>

            {importError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {/* File Upload Drop Area */}
            <div className="border-2 border-dashed border-indigo-200 rounded-xl p-8 text-center bg-indigo-50/30 hover:bg-indigo-50/50 transition-colors">
              <Database className="w-10 h-10 text-indigo-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800">
                Select Microsoft Access File (.accdb or .mdb)
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Supports Microsoft Access 2007, 2010, 2013, 2016, 2019, and 2021 database formats.
              </p>

              <div className="mt-4">
                <label className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer shadow-xs transition-colors">
                  <FolderOpen className="w-4 h-4" />
                  <span>Choose File to Import</span>
                  <input
                    type="file"
                    accept=".mdb,.accdb"
                    disabled={isProcessingFile}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {isProcessingFile && (
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-indigo-700 font-semibold">
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>Parsing database tables and records...</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span>All columns nullable · Non-unique lookup indexes</span>
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportError(null);
                }}
                className="px-4 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SQL SCHEMA GENERATOR MODAL */}
      {showSqlSchemaModal && selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  SQL Schema Definition with Backtick Identifiers: `{selectedTable.name}`
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSqlSchemaModal(false)}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Table and column names are case-preserved and quoted with backticks to support spaces, numbers, and reserved words (e.g., `ALL GLHIS`, `12Myglhis`, `DATE`, `VALUE`, `TERM`).
            </p>

            <div className="bg-slate-900 rounded-xl p-4 font-mono text-xs text-emerald-400 overflow-x-auto max-h-96">
              <pre>{generatedSql}</pre>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(generatedSql);
                  showNotice('SQL Schema copied to clipboard.');
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
              >
                Copy SQL DDL
              </button>
              <button
                type="button"
                onClick={() => setShowSqlSchemaModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
