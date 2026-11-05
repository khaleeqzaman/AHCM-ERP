import React, { useState, useEffect } from 'react';
import { 
  Database, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  RefreshCw, 
  Copy, 
  Trash2, 
  ChevronDown, 
  ChevronRight,
  Send,
  ArrowDownLeft,
  ExternalLink
} from 'lucide-react';
import { 
  getDbApiDiagnosticLogs, 
  clearDbApiDiagnosticLogs, 
  subscribeDbApiDiagnostics, 
  DiagnosticLogEntry,
  apiCheckDatabaseStatus,
  apiRunHealthPing,
  DatabaseStatusResponse
} from '../../api/client';

interface DatabaseDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshDatabase: () => Promise<void>;
  isRefreshing: boolean;
}

export const DatabaseDiagnosticsModal: React.FC<DatabaseDiagnosticsModalProps> = ({
  isOpen,
  onClose,
  onRefreshDatabase,
  isRefreshing,
}) => {
  const [logs, setLogs] = useState<DiagnosticLogEntry[]>([]);
  const [filter, setFilter] = useState<'all' | 'errors' | 'success'>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [dbStatus, setDbStatus] = useState<DatabaseStatusResponse | null>(null);
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const fetchLiveStatus = async () => {
    try {
      const [health, db] = await Promise.all([
        apiRunHealthPing(),
        apiCheckDatabaseStatus(),
      ]);
      setServerOnline(!!health && health.status === 'ok');
      setDbStatus(db);
    } catch {
      setServerOnline(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setLogs(getDbApiDiagnosticLogs());
      fetchLiveStatus();
    }
    const unsubscribe = subscribeDbApiDiagnostics(() => {
      setLogs(getDbApiDiagnosticLogs());
    });
    return unsubscribe;
  }, [isOpen]);

  const handleTestConnection = async () => {
    setIsTesting(true);
    await fetchLiveStatus();
    await onRefreshDatabase();
    setIsTesting(false);
  };

  const handleClearLogs = () => {
    clearDbApiDiagnosticLogs();
    setLogs([]);
  };

  const handleCopyLogs = () => {
    const jsonStr = JSON.stringify(logs, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  const filteredLogs = logs.filter((l) => {
    if (filter === 'errors') return !l.success;
    if (filter === 'success') return l.success;
    return true;
  });

  const successCount = logs.filter((l) => l.success).length;
  const errorCount = logs.filter((l) => !l.success).length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Database API Diagnostics</h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Live Supabase
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time request/response inspector & network error tracer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isRefreshing || isTesting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${(isRefreshing || isTesting) ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Connectivity Banner */}
        <div className="bg-slate-900 text-white p-3.5 border-b border-slate-800 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-sans text-[11px]">Backend API:</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                  serverOnline === true 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : serverOnline === false
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${serverOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                  {serverOnline ? 'Online (HTTP 200)' : serverOnline === false ? 'Offline' : 'Checking...'}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-sans text-[11px]">Supabase DB:</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                  dbStatus?.connected
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${dbStatus?.connected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  {dbStatus?.connected ? 'PostgreSQL Connected' : 'Checking connection...'}
                </span>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 font-sans">
              Proxy Port: <span className="font-mono text-slate-200 font-bold">3000</span>
            </div>
          </div>
        </div>

        {/* Status Bar & Filters */}
        <div className="px-4 py-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                filter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Calls ({logs.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('success')}
              className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors flex items-center gap-1 ${
                filter === 'success'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Success ({successCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilter('errors')}
              className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors flex items-center gap-1 ${
                filter === 'errors'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-50 text-red-700 hover:bg-red-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Errors ({errorCount})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLogs}
              disabled={logs.length === 0}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded font-semibold cursor-pointer disabled:opacity-40"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
            </button>
            <button
              type="button"
              onClick={handleClearLogs}
              disabled={logs.length === 0}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-red-600 bg-red-50 hover:bg-red-100 rounded font-semibold cursor-pointer disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Cold Start Explanation Notice if errors present */}
        {errorCount > 0 && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-[11px] text-amber-800 flex items-center justify-between gap-2">
            <span className="font-sans">
              <strong>Notice:</strong> 404 errors with <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">sin1::...</code> occur when browser calls hit the URL before the server boots. Click <strong>Test Connection</strong> to verify live status or <strong>Clear</strong> to purge stale errors.
            </span>
            <button
              type="button"
              onClick={handleClearLogs}
              className="shrink-0 font-bold underline hover:text-amber-950 cursor-pointer"
            >
              Purge Stale Errors
            </button>
          </div>
        )}

        {/* Logs List Viewport */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
          {filteredLogs.length === 0 ? (
            <div className="py-16 text-center text-slate-400 font-sans">
              <Database className="w-10 h-10 mx-auto text-slate-300 mb-2 opacity-60" />
              <p className="font-semibold text-slate-600">No diagnostic logs recorded yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Any operations you perform (adding demands, purchases, cash entries, users) will log their full payload and response here.
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              return (
                <div
                  key={log.id}
                  className={`border rounded-lg overflow-hidden transition-all shadow-2xs ${
                    log.success
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : 'border-red-300 bg-red-50/30'
                  }`}
                >
                  {/* Summary Row */}
                  <div
                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                    className="p-3 flex items-start justify-between gap-3 cursor-pointer select-none hover:bg-slate-100/50"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="mt-0.5">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                              log.method === 'POST'
                                ? 'bg-blue-100 text-blue-800'
                                : log.method === 'DELETE'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-slate-200 text-slate-800'
                            }`}
                          >
                            {log.method}
                          </span>

                          <span className="font-semibold text-slate-900 break-all">
                            {log.url}
                          </span>

                          <span className="text-[10px] text-slate-500 font-sans">
                            ({log.functionName})
                          </span>
                        </div>

                        <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {log.timestamp.substring(11, 19)}
                          </span>
                          <span>·</span>
                          <span className="text-slate-600 font-semibold">{log.durationMs}ms</span>
                          <span>·</span>
                          <span
                            className={`font-bold ${
                              log.success ? 'text-emerald-600' : 'text-red-600'
                            }`}
                          >
                            {log.status ? `HTTP ${log.status}` : log.success ? 'OK' : 'FAILED'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 mt-0.5">
                      {log.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="p-3 bg-slate-900 text-slate-200 border-t border-slate-200 space-y-3 text-[11px] font-mono leading-relaxed">
                      {/* Request Payload */}
                      <div>
                        <div className="flex items-center gap-1.5 text-blue-400 font-bold uppercase text-[10px] mb-1">
                          <Send className="w-3 h-3" />
                          <span>Request Payload Sent to Database:</span>
                        </div>
                        <pre className="bg-slate-950 p-2.5 rounded border border-slate-800 overflow-x-auto text-slate-300">
                          {log.payload !== undefined
                            ? JSON.stringify(log.payload, null, 2)
                            : '(no body payload)'}
                        </pre>
                      </div>

                      {/* Response or Error */}
                      {log.error ? (
                        <div>
                          <div className="flex items-center gap-1.5 text-red-400 font-bold uppercase text-[10px] mb-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Error Details:</span>
                          </div>
                          <pre className="bg-red-950/50 p-2.5 rounded border border-red-800 text-red-200 overflow-x-auto">
                            {log.error}
                          </pre>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase text-[10px] mb-1">
                            <ArrowDownLeft className="w-3 h-3" />
                            <span>Database Response Received:</span>
                          </div>
                          <pre className="bg-slate-950 p-2.5 rounded border border-slate-800 overflow-x-auto text-emerald-300">
                            {log.response !== undefined
                              ? JSON.stringify(log.response, null, 2)
                              : '(empty response)'}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Browser console also contains detailed logs with <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800 font-mono">[DB API]</code> prefix.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 font-semibold text-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
