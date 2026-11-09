import { ActivityLog, ActivityLogCategory } from '../types/activityLog';
import { User } from '../types/user';

const STORAGE_KEY = 'ahcm_erp_activity_logs';

type LogListener = (logs: ActivityLog[]) => void;
const listeners: Set<LogListener> = new Set();

function formatDateTime(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${dd}-${mm}-${yyyy} ${hh}:${min}:${ss}`;
}

export function getActivityLogs(): ActivityLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {}
  return [];
}

export function subscribeActivityLogs(listener: LogListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners(logs: ActivityLog[]) {
  listeners.forEach((fn) => {
    try {
      fn(logs);
    } catch {}
  });
}

export interface RecordActivityOptions {
  action: string;
  category: ActivityLogCategory;
  description?: string;
  details?: string | Record<string, any>;
  userId?: string;
  username?: string;
  userName?: string;
  userRole?: string;
  user?: Partial<User> | null;
  status?: 'success' | 'warning' | 'info' | 'SUCCESS' | 'WARNING' | 'FAILED' | 'INFO';
}

export function recordActivity(
  actionOrOptions: string | RecordActivityOptions,
  detailsArg?: string,
  categoryArg?: ActivityLogCategory,
  userArg?: Partial<User> | null,
  statusArg: 'success' | 'warning' | 'info' = 'info'
): ActivityLog {
  const now = new Date();
  
  let action = '';
  let details = '';
  let category: ActivityLogCategory = 'AUTH';
  let userId = 'sys';
  let username = 'system';
  let userName = 'System';
  let userRole = 'system';
  let status: 'success' | 'warning' | 'info' = 'info';

  if (typeof actionOrOptions === 'object' && actionOrOptions !== null) {
    const opts = actionOrOptions;
    action = opts.action;
    category = opts.category;
    details = typeof opts.details === 'string' 
      ? opts.details 
      : opts.details 
      ? JSON.stringify(opts.details) 
      : opts.description || '';
    userId = opts.userId || opts.user?.id || 'sys';
    username = opts.username || opts.user?.username || 'system';
    userName = opts.userName || opts.user?.name || username;
    userRole = opts.userRole || opts.user?.role || 'system';

    const rawStatus = (opts.status || 'info').toLowerCase();
    if (rawStatus === 'success') status = 'success';
    else if (rawStatus === 'warning') status = 'warning';
    else if (rawStatus === 'failed' || rawStatus === 'error') status = 'warning';
    else status = 'info';
  } else {
    action = actionOrOptions;
    details = detailsArg || '';
    category = categoryArg || 'AUTH';
    userId = userArg?.id || 'sys';
    username = userArg?.username || 'system';
    userName = userArg?.name || userArg?.username || 'System';
    userRole = userArg?.role || 'system';
    status = statusArg;
  }

  const entry: ActivityLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: now.toISOString(),
    displayDate: formatDateTime(now),
    userId,
    username,
    userName,
    userRole,
    category,
    action,
    details,
    ipAddress: 'Web Client',
    status,
  };

  try {
    const existing = getActivityLogs();
    // Keep last 500 entries to maintain high performance
    const updated = [entry, ...existing].slice(0, 500);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    notifyListeners(updated);
  } catch {}

  return entry;
}

export function clearActivityLogs(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    notifyListeners([]);
  } catch {}
}
