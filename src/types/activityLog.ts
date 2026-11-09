export type ActivityLogCategory = 
  | 'AUTH'
  | 'USER_MANAGEMENT'
  | 'PROFILE'
  | 'PROCUREMENT'
  | 'TREASURY'
  | 'ACCOUNTING'
  | 'STORE_MANAGEMENT'
  | 'COAL_MANAGEMENT';

export interface ActivityLog {
  id: string;
  timestamp: string;
  displayDate: string;
  userId: string;
  username: string;
  userName: string;
  userRole: string;
  category: ActivityLogCategory;
  action: string;
  details: string;
  ipAddress?: string;
  status: 'success' | 'warning' | 'info';
}
