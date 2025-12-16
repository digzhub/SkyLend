export interface Collector {
  id: number | string;
  name: string;
  area: string;
  pass: string;
  startDate?: string;
  dailyRate: number; 
  monthlyRate?: number;
  quota?: number; // New Daily Quota
}

export interface Investor {
  id: string;
  name: string;
  capitalInvested: number;
  dateJoined: string;
  dividendRate: number; // Percentage (e.g., 0.05 for 5%)
  totalPayouts: number;
}

export interface Asset {
  id: string;
  name: string;
  type: 'Vehicle' | 'Electronics' | 'Furniture' | 'Other';
  value: number;
  assignedTo: string; // Collector ID or 'Unassigned'
  status: 'Good' | 'Maintenance' | 'Lost' | 'Disposed';
  purchaseDate: string;
  notes?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string; // Collector ID or Name
  dueDate: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  priority: 'Low' | 'Medium' | 'High';
}

export interface Loan {
  id: string;
  name: string;
  area: string;
  principal: number;
  total: number;
  balance: number;
  daily: number;
  term: number;
  date: string; 
  status: 'Active' | 'Paid';
  address?: string;
  cellNumber?: string;
  serviceFee?: number;
  deliveryCharge?: number;
  collateral?: string;
  notes?: string;
}

export interface Transaction {
  id: string;
  date: string; 
  simpleDate: string; 
  type: 'Collection' | 'Disbursement' | 'Expense' | 'Capital' | 'Payroll' | 'Dividend';
  desc: string;
  amt: number;
  user: string;
  category?: string; 
}

export interface Attendance {
  id?: string;
  date: string;
  empId: number | string;
  status: 'Present' | 'Absent' | 'Rest Day';
}

export interface PayrollRecord {
  id: string;
  date: string;
  month: string;
  empId: number | string;
  empName: string;
  daysPresent: number;
  dailyRate: number;
  grossPay: number;
  deductions: number;
  netPay: number;
  status: 'Paid';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SYSTEM';
  details: string;
}

export interface DB {
  collectors: Collector[];
  investors: Investor[];
  tasks: Task[];
  assets: Asset[];
  loans: Loan[];
  ledger: Transaction[];
  attendance: Attendance[];
  payroll: PayrollRecord[];
  audit: AuditLog[]; 
}

export type UserRole = 'admin' | 'collector';

export interface CurrentUser extends Collector {
  role: UserRole;
}

export type Tab = 'dashboard' | 'collect' | 'loans' | 'pastdue' | 'reports' | 'ledger' | 'settings' | 'masterlist' | 'attendance' | 'payroll' | 'audit' | 'investors' | 'tasks' | 'intelligence' | 'assets' | 'legal' | 'ranking';

export type CreditScore = {
  score: number;
  label: 'Elite' | 'Good' | 'Fair' | 'Risk';
  color: string;
  bg: string;
};

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}

export interface GoogleSheetsConfig {
  sheetId: string;
  apiKey: string;
  tabName?: string;
}