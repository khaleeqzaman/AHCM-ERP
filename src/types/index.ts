export type NavModule = 
  | 'dashboard' 
  | 'purchase' 
  | 'accounting' 
  | 'treasury' 
  | 'store_sales' 
  | 'admin_approvals' 
  | 'users' 
  | 'reports' 
  | 'settings';

export * from './user';

export type PurchaseViewMode = 
  | 'demand_form' 
  | 'purchase_form' 
  | 'view_demands' 
  | 'view_purchases'
  | 'admin_approvals';

export type DocumentStatus = 
  | 'Draft' 
  | 'Finalized' 
  | 'Submitted for Approval' 
  | 'Approved' 
  | 'Rejected';

export type DemandType = 'Daily' | 'Monthly';
export type DemandCategory = 'New' | 'R&M';

export interface DemandItem {
  id: string;
  srNo: number;
  itemName: string;
  quantity: number;
  rate: number;
  amount: number; // Quantity * Rate
}

export interface DemandDocument {
  id: string;
  demandType: DemandType;
  category: DemandCategory;
  date: string;
  referenceNo: string;
  items: DemandItem[];
  totalAmount: number;
  status: DocumentStatus;
  adminRemark?: string;
  updatedAt: string;
}

export type PaymentType = 'Cash' | 'Cheque';

export interface PurchaseSummaryItem {
  id: string;
  srNo: number;
  companyName: string;
  itemName: string;
  quantity: number;
  amount: number; // Manual input
  remarks: string;
}

export interface PurchaseDocument {
  id: string;
  paymentType: PaymentType;
  date: string;
  reference: string;
  items: PurchaseSummaryItem[];
  totalAmount: number;
  status: DocumentStatus;
  adminRemark?: string;
  updatedAt: string;
}
