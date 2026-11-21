export type TabId = 'home' | 'khata' | 'expenses' | 'analytics' | 'settings';

export type KhataTxType = 'udhaar' | 'jama'; // 'udhaar' = Give Udhaar (Credit Given), 'jama' = Receive Cash (Payment Received)

export interface Customer {
  id: string;
  name: string;
  phone: string;
  notes?: string;
  createdAt: string;
}

export interface KhataTransaction {
  id: string;
  customerId: string;
  type: KhataTxType;
  amount: number;
  note: string;
  date: string; // YYYY-MM-DD
  createdAt: string;
}

export type ExpenseCategory =
  | 'Food & Dining'
  | 'Petrol & Fuel'
  | 'Electricity/Gas Bills'
  | 'Grocery & Rashan'
  | 'Rent'
  | 'Medical'
  | 'Shopping'
  | 'Other';

export type IncomeCategory =
  | 'Salary'
  | 'Business Profit'
  | 'Freelance'
  | 'Other Income';

export type PaymentMethod = 'Cash' | 'EasyPaisa' | 'JazzCash' | 'Bank Transfer' | 'Card';

export interface ExpenseEntry {
  id: string;
  entryType: 'expense' | 'income';
  title: string;
  amount: number;
  category: ExpenseCategory | IncomeCategory;
  paymentMethod: PaymentMethod;
  date: string; // YYYY-MM-DD
  note?: string;
  createdAt: string;
}

export interface PaymentSettings {
  easypaisaNumber: string;
  accountTitle: string;
  whatsappNumber: string;
  feeAmount: number;
}

export interface ApprovedLogItem {
  id: string;
  tid: string;
  deviceHash: string;
  token: string;
  customerName?: string;
  approvedAt: string;
}

export interface PendingVerification {
  fullName: string;
  mobile: string;
  tid: string;
  deviceHash: string;
  submittedAt: string;
}

export interface ProActivation {
  activated: boolean;
  tid: string;
  deviceHash: string;
  token: string;
  activatedAt: string;
}

export interface AppSettings {
  businessName: string;
  ownerName: string;
  monthlyBudget: number;
  appPinEnabled: boolean;
  appPin: string;
  adminPin: string;
}

export type PdfReportRequest =
  | { mode: 'customer'; customerId: string }
  | { mode: 'expenses'; monthLabel: string };
