import {
  AppSettings,
  ApprovedLogItem,
  Customer,
  ExpenseEntry,
  KhataTransaction,
  PaymentSettings,
  PendingVerification,
  ProActivation,
} from '../types';
import { getDeviceFingerprint, getTodayISO, verifyApprovalToken } from './cryptoAndFormat';

export const FREE_ENTRY_LIMIT = 15;

const KEYS = {
  CUSTOMERS: 'hisabxpro_customers_v1',
  KHATA_TX: 'hisabxpro_khata_tx_v1',
  EXPENSES: 'hisabxpro_expenses_v1',
  PAYMENT_SETTINGS: 'hisabxpro_payment_settings_v1',
  APP_SETTINGS: 'hisabxpro_app_settings_v1',
  PRO_ACTIVATION: 'hisabxpro_pro_activation_v1',
  PENDING_VERIFICATION: 'hisabxpro_pending_verification_v1',
  APPROVED_LOGS: 'hisabxpro_approved_logs_v1',
  INITIALIZED: 'hisabxpro_seeded_v1',
};

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  easypaisaNumber: '03054951984',
  accountTitle: 'Wahaj Rasool',
  whatsappNumber: '03054951984',
  feeAmount: 499,
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  businessName: 'HisabxPro Trading & Home',
  ownerName: 'Account Owner',
  monthlyBudget: 120000,
  appPinEnabled: false,
  appPin: '1234',
  adminPin: '7860',
};

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function monthsAgoISO(monthsAgo: number, dayOfMonth = 12): string {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo);
  d.setDate(Math.min(dayOfMonth, 28));
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getSeedData(): {
  customers: Customer[];
  khataTransactions: KhataTransaction[];
  expenses: ExpenseEntry[];
} {
  const customers: Customer[] = [
    {
      id: 'cust-1',
      name: 'Tariq Electronics',
      phone: '03001122334',
      notes: 'Hall Road Wholesale Partner',
      createdAt: monthsAgoISO(2, 4),
    },
    {
      id: 'cust-2',
      name: 'Bilal Hardware Store',
      phone: '03214455667',
      notes: 'Monthly credit cycle',
      createdAt: monthsAgoISO(1, 10),
    },
    {
      id: 'cust-3',
      name: 'Sana Boutique & Fabrics',
      phone: '03337788990',
      notes: 'Advance deposit account',
      createdAt: daysAgoISO(18),
    },
    {
      id: 'cust-4',
      name: 'Kamran Logistics',
      phone: '03459900112',
      notes: 'Freight & delivery settlements',
      createdAt: daysAgoISO(9),
    },
  ];

  // 6 Khata transactions
  const khataTransactions: KhataTransaction[] = [
    {
      id: 'ktx-1',
      customerId: 'cust-1',
      type: 'udhaar',
      amount: 45000,
      note: 'Inverter & copper wiring stock',
      date: daysAgoISO(12),
      createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    },
    {
      id: 'ktx-2',
      customerId: 'cust-1',
      type: 'jama',
      amount: 15000,
      note: 'Partial cash installment received',
      date: daysAgoISO(4),
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    },
    {
      id: 'ktx-3',
      customerId: 'cust-2',
      type: 'udhaar',
      amount: 22500,
      note: 'Sanitary fittings invoice #408',
      date: daysAgoISO(8),
      createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    },
    {
      id: 'ktx-4',
      customerId: 'cust-3',
      type: 'jama',
      amount: 18000,
      note: 'Advance booking deposit',
      date: daysAgoISO(6),
      createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    },
    {
      id: 'ktx-5',
      customerId: 'cust-3',
      type: 'udhaar',
      amount: 9500,
      note: 'First batch dispatched',
      date: daysAgoISO(2),
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 'ktx-6',
      customerId: 'cust-4',
      type: 'udhaar',
      amount: 12000,
      note: 'Lahore-Islamabad cargo credit',
      date: daysAgoISO(1),
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
  ];

  // 6 Personal/Home Expense & Income entries (Total seeded entries = 6 + 6 = 12 / 15 free)
  const expenses: ExpenseEntry[] = [
    {
      id: 'exp-1',
      entryType: 'income',
      title: 'Monthly Salary & Retainer',
      amount: 145000,
      category: 'Salary',
      paymentMethod: 'Bank Transfer',
      date: daysAgoISO(15),
      note: 'Primary monthly deposit',
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    },
    {
      id: 'exp-2',
      entryType: 'expense',
      title: 'Imtiaz Monthly Rashan & Grocery',
      amount: 24500,
      category: 'Grocery & Rashan',
      paymentMethod: 'Card',
      date: daysAgoISO(10),
      note: 'Kitchen essentials & flour/oil',
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    },
    {
      id: 'exp-3',
      entryType: 'expense',
      title: 'LESCO & SNGPL Utility Bills',
      amount: 16800,
      category: 'Electricity/Gas Bills',
      paymentMethod: 'EasyPaisa',
      date: daysAgoISO(7),
      note: 'Home electricity and gas bill',
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    },
    {
      id: 'exp-4',
      entryType: 'expense',
      title: 'PSO Hi-Octane Fuel Refill',
      amount: 8500,
      category: 'Petrol & Fuel',
      paymentMethod: 'Cash',
      date: daysAgoISO(3),
      note: 'Full tank commute fuel',
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: 'exp-5',
      entryType: 'expense',
      title: 'Family Dinner — Monal',
      amount: 7200,
      category: 'Food & Dining',
      paymentMethod: 'Card',
      date: daysAgoISO(1),
      note: 'Weekend dinner',
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      id: 'exp-6',
      entryType: 'expense',
      title: 'Home Rent & Society Maintenance',
      amount: 35000,
      category: 'Rent',
      paymentMethod: 'Bank Transfer',
      date: getTodayISO(),
      note: 'Monthly house rent',
      createdAt: new Date().toISOString(),
    },
  ];

  return { customers, khataTransactions, expenses };
}

function safeParse<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSave<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota errors
  }
}

export function initializeStoreIfNeeded(): void {
  try {
    const seeded = localStorage.getItem(KEYS.INITIALIZED);
    if (!seeded) {
      const seed = getSeedData();
      safeSave(KEYS.CUSTOMERS, seed.customers);
      safeSave(KEYS.KHATA_TX, seed.khataTransactions);
      safeSave(KEYS.EXPENSES, seed.expenses);
      safeSave(KEYS.PAYMENT_SETTINGS, DEFAULT_PAYMENT_SETTINGS);
      safeSave(KEYS.APP_SETTINGS, DEFAULT_APP_SETTINGS);
      localStorage.setItem(KEYS.INITIALIZED, 'true');
    }
  } catch {
    // Ignore storage access failure
  }
}

export function loadCustomers(): Customer[] {
  return safeParse<Customer[]>(KEYS.CUSTOMERS, []);
}
export function saveCustomers(customers: Customer[]): void {
  safeSave(KEYS.CUSTOMERS, customers);
}

export function loadKhataTransactions(): KhataTransaction[] {
  return safeParse<KhataTransaction[]>(KEYS.KHATA_TX, []);
}
export function saveKhataTransactions(txs: KhataTransaction[]): void {
  safeSave(KEYS.KHATA_TX, txs);
}

export function loadExpenses(): ExpenseEntry[] {
  return safeParse<ExpenseEntry[]>(KEYS.EXPENSES, []);
}
export function saveExpenses(expenses: ExpenseEntry[]): void {
  safeSave(KEYS.EXPENSES, expenses);
}

export function loadPaymentSettings(): PaymentSettings {
  return { ...DEFAULT_PAYMENT_SETTINGS, ...safeParse<Partial<PaymentSettings>>(KEYS.PAYMENT_SETTINGS, {}) };
}
export function savePaymentSettings(settings: PaymentSettings): void {
  safeSave(KEYS.PAYMENT_SETTINGS, settings);
}

export function loadAppSettings(): AppSettings {
  return { ...DEFAULT_APP_SETTINGS, ...safeParse<Partial<AppSettings>>(KEYS.APP_SETTINGS, {}) };
}
export function saveAppSettings(settings: AppSettings): void {
  safeSave(KEYS.APP_SETTINGS, settings);
}

export function loadPendingVerification(): PendingVerification | null {
  return safeParse<PendingVerification | null>(KEYS.PENDING_VERIFICATION, null);
}
export function savePendingVerification(pending: PendingVerification | null): void {
  if (!pending) {
    localStorage.removeItem(KEYS.PENDING_VERIFICATION);
  } else {
    safeSave(KEYS.PENDING_VERIFICATION, pending);
  }
}

export function loadApprovedLogs(): ApprovedLogItem[] {
  return safeParse<ApprovedLogItem[]>(KEYS.APPROVED_LOGS, []);
}
export function saveApprovedLogs(logs: ApprovedLogItem[]): void {
  safeSave(KEYS.APPROVED_LOGS, logs);
}

export function loadProActivation(): ProActivation | null {
  const saved = safeParse<ProActivation | null>(KEYS.PRO_ACTIVATION, null);
  if (!saved || !saved.activated) return null;
  const currentDevice = getDeviceFingerprint();
  if (saved.deviceHash !== currentDevice) return null;
  if (!verifyApprovalToken(saved.tid, currentDevice, saved.token)) return null;
  return saved;
}

export function saveProActivation(activation: ProActivation | null): void {
  if (!activation) {
    localStorage.removeItem(KEYS.PRO_ACTIVATION);
  } else {
    safeSave(KEYS.PRO_ACTIVATION, activation);
  }
}

export function downloadCsvExport(customers: Customer[], khataTxs: KhataTransaction[], expenses: ExpenseEntry[]): void {
  const customerMap = new Map(customers.map((c) => [c.id, c]));
  const rows: string[][] = [
    ['Section', 'Date', 'Party / Title', 'Category / Type', 'Direction', 'Amount (PKR)', 'Method / Phone', 'Notes'],
  ];

  khataTxs.forEach((tx) => {
    const cust = customerMap.get(tx.customerId);
    rows.push([
      'Customer Khata',
      tx.date,
      cust?.name || 'Unknown Customer',
      tx.type === 'udhaar' ? 'Give Udhaar (Dena)' : 'Receive Cash (Lena)',
      tx.type === 'udhaar' ? 'Outflow / Receivable' : 'Inflow / Payment',
      String(tx.amount),
      cust?.phone || '',
      tx.note || '',
    ]);
  });

  expenses.forEach((exp) => {
    rows.push([
      'Home & Daily Tracker',
      exp.date,
      exp.title,
      exp.category,
      exp.entryType === 'income' ? 'Income' : 'Expense',
      String(exp.amount),
      exp.paymentMethod,
      exp.note || '',
    ]);
  });

  const csvContent =
    '\uFEFF' +
    rows
      .map((r) =>
        r
          .map((cell) => {
            const escaped = String(cell).replace(/"/g, '""');
            return `"${escaped}"`;
          })
          .join(',')
      )
      .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `HisabxPro-Ledger-${getTodayISO()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadJsonBackup(
  customers: Customer[],
  khataTxs: KhataTransaction[],
  expenses: ExpenseEntry[],
  appSettings: AppSettings
): void {
  const payload = {
    app: 'HisabxPro',
    exportedAt: new Date().toISOString(),
    data: {
      customers,
      khataTransactions: khataTxs,
      expenses,
      appSettings: {
        businessName: appSettings.businessName,
        ownerName: appSettings.ownerName,
        monthlyBudget: appSettings.monthlyBudget,
      },
    },
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `HisabxPro-Backup-${getTodayISO()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
