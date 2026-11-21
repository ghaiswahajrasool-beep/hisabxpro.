import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  Crown,
  Home,
  Lock,
  Plus,
  Receipt,
  Settings,
  X,
} from 'lucide-react';
import { AdminModal } from './components/AdminModal';
import { AnalyticsView } from './components/AnalyticsView';
import { ExpensesView } from './components/ExpensesView';
import { HomeView } from './components/HomeView';
import { KhataView } from './components/KhataView';
import { PdfStatementModal } from './components/PdfStatementModal';
import { PinLockScreen } from './components/PinLockScreen';
import { SettingsView } from './components/SettingsView';
import { UpgradeModal } from './components/UpgradeModal';
import {
  AppSettings,
  ApprovedLogItem,
  Customer,
  ExpenseCategory,
  ExpenseEntry,
  IncomeCategory,
  KhataTransaction,
  KhataTxType,
  PaymentMethod,
  PaymentSettings,
  PdfReportRequest,
  PendingVerification,
  ProActivation,
  TabId,
} from './types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from './utils/categories';
import { getDeviceFingerprint, getTodayISO } from './utils/cryptoAndFormat';
import {
  downloadCsvExport,
  downloadJsonBackup,
  FREE_ENTRY_LIMIT,
  getSeedData,
  initializeStoreIfNeeded,
  loadAppSettings,
  loadApprovedLogs,
  loadCustomers,
  loadExpenses,
  loadKhataTransactions,
  loadPaymentSettings,
  loadPendingVerification,
  loadProActivation,
  saveAppSettings,
  saveApprovedLogs,
  saveCustomers,
  saveExpenses,
  saveKhataTransactions,
  savePaymentSettings,
  savePendingVerification,
  saveProActivation,
} from './utils/storage';

initializeStoreIfNeeded();

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [customers, setCustomers] = useState<Customer[]>(() => loadCustomers());
  const [khataTransactions, setKhataTransactions] = useState<KhataTransaction[]>(() =>
    loadKhataTransactions()
  );
  const [expenses, setExpenses] = useState<ExpenseEntry[]>(() => loadExpenses());
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(() =>
    loadPaymentSettings()
  );
  const [appSettings, setAppSettings] = useState<AppSettings>(() => loadAppSettings());
  const [proActivation, setProActivation] = useState<ProActivation | null>(() =>
    loadProActivation()
  );
  const [pendingVerification, setPendingVerification] = useState<PendingVerification | null>(() =>
    loadPendingVerification()
  );
  const [approvedLogs, setApprovedLogs] = useState<ApprovedLogItem[]>(() => loadApprovedLogs());

  const [deviceHash] = useState<string>(() => getDeviceFingerprint());
  const isPro = Boolean(proActivation?.activated);
  const totalEntriesUsed = khataTransactions.length + expenses.length;
  const canAddEntry = isPro || totalEntriesUsed < FREE_ENTRY_LIMIT;

  // Startup PIN Lock
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const settings = loadAppSettings();
    const pro = loadProActivation();
    return Boolean(pro?.activated && settings.appPinEnabled);
  });

  // Selected Customer in Khata
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    () => loadCustomers()[0]?.id || null
  );

  // Modals
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<string | undefined>(undefined);
  const [adminOpen, setAdminOpen] = useState(false);
  const [pdfRequest, setPdfRequest] = useState<PdfReportRequest | null>(null);

  // Quick Entry Modals triggered from Home or Top CTA
  const [quickKhataOpen, setQuickKhataOpen] = useState(false);
  const [qkCustId, setQkCustId] = useState('');
  const [qkType, setQkType] = useState<KhataTxType>('udhaar');
  const [qkAmount, setQkAmount] = useState('');
  const [qkDate, setQkDate] = useState(getTodayISO());
  const [qkNote, setQkNote] = useState('');

  const [quickExpOpen, setQuickExpOpen] = useState(false);
  const [qeType, setQeType] = useState<'expense' | 'income'>('expense');
  const [qeTitle, setQeTitle] = useState('');
  const [qeAmount, setQeAmount] = useState('');
  const [qeCat, setQeCat] = useState<ExpenseCategory | IncomeCategory>('Food & Dining');
  const [qeMethod, setQeMethod] = useState<PaymentMethod>('Cash');
  const [qeDate, setQeDate] = useState(getTodayISO());
  const [qeNote, setQeNote] = useState('');

  // Toast notifications
  const [toast, setToast] = useState<{ msg: string; tone: 'gold' | 'emerald' | 'rose' } | null>(
    null
  );
  const toastTimerRef = useRef<number | null>(null);

  const notify = (msg: string, tone: 'gold' | 'emerald' | 'rose' = 'gold') => {
    setToast({ msg, tone });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 3200);
  };

  // Hidden 6-tap Logo Admin Panel trigger
  const logoTapsRef = useRef<number[]>([]);
  const handleLogoTap = () => {
    const now = Date.now();
    const recent = logoTapsRef.current.filter((t) => now - t < 2800);
    recent.push(now);
    logoTapsRef.current = recent;
    if (recent.length >= 6) {
      logoTapsRef.current = [];
      setAdminOpen(true);
    }
  };

  // Persist changes cleanly
  useEffect(() => saveCustomers(customers), [customers]);
  useEffect(() => saveKhataTransactions(khataTransactions), [khataTransactions]);
  useEffect(() => saveExpenses(expenses), [expenses]);
  useEffect(() => savePaymentSettings(paymentSettings), [paymentSettings]);
  useEffect(() => saveAppSettings(appSettings), [appSettings]);
  useEffect(() => saveApprovedLogs(approvedLogs), [approvedLogs]);

  const openUpgradeModal = (feature?: string) => {
    setUpgradeFeature(feature);
    setUpgradeOpen(true);
  };

  // Customer CRUD
  const handleAddCustomer = (data: Omit<Customer, 'id' | 'createdAt'>): string => {
    const id = `cust-${Date.now()}`;
    const next: Customer = {
      id,
      ...data,
      createdAt: new Date().toISOString(),
    };
    setCustomers((prev) => [next, ...prev]);
    return id;
  };

  const handleUpdateCustomer = (id: string, data: Omit<Customer, 'id' | 'createdAt'>) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
  };

  const handleDeleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    setKhataTransactions((prev) => prev.filter((t) => t.customerId !== id));
    if (selectedCustomerId === id) {
      setSelectedCustomerId(null);
    }
  };

  // Khata Tx CRUD
  const handleAddKhataTx = (tx: Omit<KhataTransaction, 'id' | 'createdAt'>) => {
    if (!canAddEntry) {
      openUpgradeModal('Unlimited Khata & Expense Entries');
      return;
    }
    const next: KhataTransaction = {
      id: `ktx-${Date.now()}`,
      ...tx,
      createdAt: new Date().toISOString(),
    };
    setKhataTransactions((prev) => [next, ...prev]);
  };

  const handleUpdateKhataTx = (id: string, tx: Omit<KhataTransaction, 'id' | 'createdAt'>) => {
    setKhataTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...tx } : t)));
  };

  const handleDeleteKhataTx = (id: string) => {
    setKhataTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // Expense CRUD
  const handleAddExpense = (entry: Omit<ExpenseEntry, 'id' | 'createdAt'>) => {
    if (!canAddEntry) {
      openUpgradeModal('Unlimited Khata & Expense Entries');
      return;
    }
    const next: ExpenseEntry = {
      id: `exp-${Date.now()}`,
      ...entry,
      createdAt: new Date().toISOString(),
    };
    setExpenses((prev) => [next, ...prev]);
  };

  const handleUpdateExpense = (id: string, entry: Omit<ExpenseEntry, 'id' | 'createdAt'>) => {
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...entry } : e)));
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  // Pro Actions
  const handleOpenPdf = (req: PdfReportRequest) => {
    if (!isPro) {
      openUpgradeModal('1-Click Branded PDF Invoice & Report');
      return;
    }
    setPdfRequest(req);
  };

  const handleExportCsv = () => {
    if (!isPro) {
      openUpgradeModal('Excel (CSV) Export');
      return;
    }
    downloadCsvExport(customers, khataTransactions, expenses);
    notify('Excel-compatible CSV downloaded!', 'emerald');
  };

  const handleExportJson = () => {
    if (!isPro) {
      openUpgradeModal('JSON Backup');
      return;
    }
    downloadJsonBackup(customers, khataTransactions, expenses, appSettings);
    notify('Full JSON backup downloaded!', 'emerald');
  };

  const handleImportJson = (jsonText: string) => {
    if (!isPro) {
      openUpgradeModal('JSON Restore');
      return;
    }
    try {
      const parsed = JSON.parse(jsonText);
      const payload = parsed?.data || parsed;
      if (
        !Array.isArray(payload?.customers) ||
        !Array.isArray(payload?.khataTransactions) ||
        !Array.isArray(payload?.expenses)
      ) {
        notify('Invalid HisabxPro JSON backup file.', 'rose');
        return;
      }
      setCustomers(payload.customers);
      setKhataTransactions(payload.khataTransactions);
      setExpenses(payload.expenses);
      if (payload.appSettings) {
        setAppSettings((prev) => ({
          ...prev,
          businessName: payload.appSettings.businessName || prev.businessName,
          ownerName: payload.appSettings.ownerName || prev.ownerName,
          monthlyBudget: Number(payload.appSettings.monthlyBudget) || prev.monthlyBudget,
        }));
      }
      setSelectedCustomerId(payload.customers[0]?.id || null);
      notify('Backup restored cleanly!', 'emerald');
    } catch {
      notify('Could not parse JSON backup file.', 'rose');
    }
  };

  // Quick Launchers from Home
  const triggerQuickKhata = () => {
    if (!canAddEntry) {
      openUpgradeModal('Unlimited Khata & Expense Entries');
      return;
    }
    if (customers.length === 0) {
      setActiveTab('khata');
      notify('Add a customer first to record Khata entries.', 'gold');
      return;
    }
    setQkCustId(customers[0].id);
    setQkType('udhaar');
    setQkAmount('');
    setQkDate(getTodayISO());
    setQkNote('');
    setQuickKhataOpen(true);
  };

  const triggerQuickExpense = (type: 'expense' | 'income') => {
    if (!canAddEntry) {
      openUpgradeModal('Unlimited Khata & Expense Entries');
      return;
    }
    setQeType(type);
    setQeTitle('');
    setQeAmount('');
    setQeCat(type === 'expense' ? 'Food & Dining' : 'Salary');
    setQeMethod('Cash');
    setQeDate(getTodayISO());
    setQeNote('');
    setQuickExpOpen(true);
  };

  const currentMonthLabel = useMemo(
    () =>
      new Date().toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      }),
    []
  );

  if (isLocked && isPro && appSettings.appPinEnabled) {
    return (
      <PinLockScreen
        expectedPin={appSettings.appPin}
        businessName={appSettings.businessName}
        onUnlock={() => setIsLocked(false)}
      />
    );
  }

  const navItems: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { id: 'khata', label: 'Khata', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'expenses', label: 'Expenses', icon: <Receipt className="w-5 h-5" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-[#070B19] text-slate-100 relative overflow-x-hidden pb-28">
      {/* Ambient Deep Royal Midnight Navy & Gold Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden no-print">
        <div className="absolute -top-40 -left-32 w-[480px] h-[480px] rounded-full bg-[#D4AF37]/[0.07] blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-[520px] h-[520px] rounded-full bg-emerald-500/[0.06] blur-[130px]" />
        <div className="absolute bottom-0 left-1/3 w-[420px] h-[420px] rounded-full bg-indigo-500/[0.07] blur-[120px]" />
      </div>

      {/* Top Navigation Bar (Strict 3-Zone Contract) */}
      <header className="sticky top-0 z-30 bg-[#070B19]/80 backdrop-blur-xl border-b border-slate-800/80 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark (Tap 6x rapidly for Hidden Owner Admin Panel) */}
          <button
            type="button"
            onClick={handleLogoTap}
            className="text-left focus:outline-none select-none whitespace-nowrap shrink-0 flex items-center gap-2.5"
          >
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#F3D474] via-[#D4AF37] to-[#9A7414] flex items-center justify-center text-[#070B19] font-extrabold text-sm shadow-lg shadow-[#D4AF37]/25">
              H
            </span>
            <span className="text-lg font-extrabold tracking-tight text-white">
              Hisabx<span className="gold-gradient-text">Pro</span>
            </span>
          </button>

          {/* Zone 2: Desktop Text Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'text-[#F3D474] font-semibold border-b-2 border-[#D4AF37]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single Primary Action */}
          <div className="flex items-center gap-2 shrink-0">
            {isPro && appSettings.appPinEnabled && (
              <button
                type="button"
                onClick={() => setIsLocked(true)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-slate-300"
                aria-label="Lock App"
              >
                <Lock className="w-4 h-4" />
              </button>
            )}
            {isPro ? (
              <button
                type="button"
                onClick={() => triggerQuickExpense('expense')}
                className="px-4 py-2 rounded-xl gold-btn text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" />
                Quick Entry
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openUpgradeModal('Lifetime Pro')}
                className="px-4 py-2 rounded-xl gold-btn text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Crown className="w-3.5 h-3.5" />
                Go Pro
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Viewport */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 no-print">
        {activeTab === 'home' && (
          <HomeView
            businessName={appSettings.businessName}
            isPro={isPro}
            totalEntriesUsed={totalEntriesUsed}
            freeLimit={FREE_ENTRY_LIMIT}
            customers={customers}
            khataTransactions={khataTransactions}
            expenses={expenses}
            monthlyBudget={appSettings.monthlyBudget}
            onNavigate={setActiveTab}
            onQuickAddKhata={triggerQuickKhata}
            onQuickAddExpense={triggerQuickExpense}
            onOpenPdfReport={() =>
              handleOpenPdf({ mode: 'expenses', monthLabel: currentMonthLabel })
            }
            onOpenUpgrade={openUpgradeModal}
          />
        )}

        {activeTab === 'khata' && (
          <KhataView
            businessName={appSettings.businessName}
            isPro={isPro}
            canAddEntry={canAddEntry}
            customers={customers}
            transactions={khataTransactions}
            selectedCustomerId={selectedCustomerId}
            onSelectCustomer={setSelectedCustomerId}
            onAddCustomer={handleAddCustomer}
            onUpdateCustomer={handleUpdateCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onAddTransaction={handleAddKhataTx}
            onUpdateTransaction={handleUpdateKhataTx}
            onDeleteTransaction={handleDeleteKhataTx}
            onOpenPdfStatement={(customerId) =>
              handleOpenPdf({ mode: 'customer', customerId })
            }
            onOpenUpgrade={openUpgradeModal}
            onNotify={notify}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesView
            isPro={isPro}
            canAddEntry={canAddEntry}
            expenses={expenses}
            monthlyBudget={appSettings.monthlyBudget}
            onUpdateBudget={(budget) =>
              setAppSettings((prev) => ({ ...prev, monthlyBudget: budget }))
            }
            onAddEntry={handleAddExpense}
            onUpdateEntry={handleUpdateExpense}
            onDeleteEntry={handleDeleteExpense}
            onOpenPdfReport={() =>
              handleOpenPdf({ mode: 'expenses', monthLabel: currentMonthLabel })
            }
            onOpenUpgrade={openUpgradeModal}
            onNotify={notify}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            isPro={isPro}
            customers={customers}
            khataTransactions={khataTransactions}
            expenses={expenses}
            onExportCsv={handleExportCsv}
            onOpenPdfReport={() =>
              handleOpenPdf({ mode: 'expenses', monthLabel: currentMonthLabel })
            }
            onSelectCustomer={(customerId) => {
              setSelectedCustomerId(customerId);
              setActiveTab('khata');
            }}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            isPro={isPro}
            proActivation={proActivation}
            deviceHash={deviceHash}
            totalEntriesUsed={totalEntriesUsed}
            freeLimit={FREE_ENTRY_LIMIT}
            appSettings={appSettings}
            onUpdateAppSettings={setAppSettings}
            onOpenUpgrade={openUpgradeModal}
            onExportCsv={handleExportCsv}
            onExportJson={handleExportJson}
            onImportJson={handleImportJson}
            onOpenPdfReport={() =>
              handleOpenPdf({ mode: 'expenses', monthLabel: currentMonthLabel })
            }
            onLockNow={() => setIsLocked(true)}
            onResetDemoData={() => {
              const seed = getSeedData();
              setCustomers(seed.customers);
              setKhataTransactions(seed.khataTransactions);
              setExpenses(seed.expenses);
              setSelectedCustomerId(seed.customers[0]?.id || null);
              notify('Sample ledger restored!', 'emerald');
            }}
            onClearAllData={() => {
              setCustomers([]);
              setKhataTransactions([]);
              setExpenses([]);
              setSelectedCustomerId(null);
              notify('All local ledger data cleared.', 'rose');
            }}
            onNotify={notify}
          />
        )}
      </main>

      {/* Floating Bottom Navigation Bar */}
      <nav
        aria-label="Primary Navigation"
        className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-24px)] max-w-lg rounded-2xl glass-card gold-border-glow px-2 py-1.5 no-print"
      >
        <div className="grid grid-cols-5 items-center gap-1">
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`min-h-[48px] rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all ${
                  active
                    ? 'bg-[#D4AF37]/18 text-[#F3D474]'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {item.icon}
                <span className="text-[10px] font-semibold tracking-tight whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Quick Khata Entry Modal */}
      {quickKhataOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm no-print">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const num = Number(qkAmount);
              if (!qkCustId || Number.isNaN(num) || num <= 0) {
                notify('Select a customer and enter a valid PKR amount.', 'rose');
                return;
              }
              handleAddKhataTx({
                customerId: qkCustId,
                type: qkType,
                amount: Math.round(num),
                date: qkDate || getTodayISO(),
                note: qkNote.trim(),
              });
              setQuickKhataOpen(false);
              notify('Khata entry recorded!', 'emerald');
            }}
            className="w-full max-w-md rounded-3xl glass-card gold-border-glow p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Quick Khata Entry</h3>
              <button
                type="button"
                onClick={() => setQuickKhataOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#070B19] border border-slate-800">
              <button
                type="button"
                onClick={() => setQkType('udhaar')}
                className={`py-2 rounded-lg text-xs font-bold ${
                  qkType === 'udhaar'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'text-slate-400'
                }`}
              >
                Give Udhaar (Dena)
              </button>
              <button
                type="button"
                onClick={() => setQkType('jama')}
                className={`py-2 rounded-lg text-xs font-bold ${
                  qkType === 'jama'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400'
                }`}
              >
                Receive Cash (Lena)
              </button>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Customer</label>
              <select
                value={qkCustId}
                onChange={(e) => setQkCustId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#070B19] border border-slate-700 text-sm text-white"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Amount (PKR)</label>
                <input
                  type="number"
                  required
                  min={1}
                  autoFocus
                  value={qkAmount}
                  onChange={(e) => setQkAmount(e.target.value)}
                  placeholder="5000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070B19] border border-slate-700 text-base font-bold font-mono-num text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Date</label>
                <input
                  type="date"
                  value={qkDate}
                  onChange={(e) => setQkDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#070B19] border border-slate-700 text-xs font-mono-num text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Note</label>
              <input
                type="text"
                value={qkNote}
                onChange={(e) => setQkNote(e.target.value)}
                placeholder="Bill or cash details..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#070B19] border border-slate-700 text-sm text-white"
              />
            </div>
            <button type="submit" className="w-full py-3 rounded-xl gold-btn text-sm font-bold">
              Save Khata Entry
            </button>
          </form>
        </div>
      )}

      {/* Quick Expense/Income Modal */}
      {quickExpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm no-print">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const num = Number(qeAmount);
              if (!qeTitle.trim() || Number.isNaN(num) || num <= 0) {
                notify('Enter title and valid PKR amount.', 'rose');
                return;
              }
              handleAddExpense({
                entryType: qeType,
                title: qeTitle.trim(),
                amount: Math.round(num),
                category: qeCat,
                paymentMethod: qeMethod,
                date: qeDate || getTodayISO(),
                note: qeNote.trim(),
              });
              setQuickExpOpen(false);
              notify(qeType === 'income' ? 'Income logged!' : 'Expense logged!', 'emerald');
            }}
            className="w-full max-w-md rounded-3xl glass-card gold-border-glow p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {qeType === 'income' ? 'Quick Add Income' : 'Quick Add Expense'}
              </h3>
              <button
                type="button"
                onClick={() => setQuickExpOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#070B19] border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setQeType('expense');
                  setQeCat('Food & Dining');
                }}
                className={`py-2 rounded-lg text-xs font-bold ${
                  qeType === 'expense'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'text-slate-400'
                }`}
              >
                Daily Expense
              </button>
              <button
                type="button"
                onClick={() => {
                  setQeType('income');
                  setQeCat('Salary');
                }}
                className={`py-2 rounded-lg text-xs font-bold ${
                  qeType === 'income'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400'
                }`}
              >
                Income / Salary
              </button>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Title</label>
              <input
                type="text"
                required
                autoFocus
                value={qeTitle}
                onChange={(e) => setQeTitle(e.target.value)}
                placeholder={qeType === 'expense' ? 'e.g. Petrol or Grocery' : 'e.g. Salary'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#070B19] border border-slate-700 text-sm text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Amount (PKR)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={qeAmount}
                  onChange={(e) => setQeAmount(e.target.value)}
                  placeholder="2500"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070B19] border border-slate-700 text-base font-bold font-mono-num text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Date</label>
                <input
                  type="date"
                  value={qeDate}
                  onChange={(e) => setQeDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#070B19] border border-slate-700 text-xs font-mono-num text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Category</label>
                <select
                  value={qeCat}
                  onChange={(e) => setQeCat(e.target.value as ExpenseCategory | IncomeCategory)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#070B19] border border-slate-700 text-xs text-white"
                >
                  {(qeType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Method</label>
                <select
                  value={qeMethod}
                  onChange={(e) => setQeMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#070B19] border border-slate-700 text-xs text-white"
                >
                  {['Cash', 'EasyPaisa', 'JazzCash', 'Bank Transfer', 'Card'].map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button type="submit" className="w-full py-3 rounded-xl gold-btn text-sm font-bold">
              Save Entry
            </button>
          </form>
        </div>
      )}

      {/* Upgrade to Lifetime Pro Modal */}
      <UpgradeModal
        isOpen={upgradeOpen}
        triggeredFeature={upgradeFeature}
        deviceHash={deviceHash}
        paymentSettings={paymentSettings}
        pendingVerification={pendingVerification}
        onSavePending={(pending) => {
          setPendingVerification(pending);
          savePendingVerification(pending);
        }}
        onActivatePro={(activation) => {
          setProActivation(activation);
          saveProActivation(activation);
        }}
        onClose={() => setUpgradeOpen(false)}
        onNotify={notify}
      />

      {/* Hidden Owner Admin Panel Modal */}
      <AdminModal
        isOpen={adminOpen}
        appSettings={appSettings}
        paymentSettings={paymentSettings}
        approvedLogs={approvedLogs}
        onUpdateAppSettings={setAppSettings}
        onUpdatePaymentSettings={setPaymentSettings}
        onAddApprovedLog={(item) => setApprovedLogs((prev) => [item, ...prev])}
        onClearApprovedLogs={() => {
          setApprovedLogs([]);
          notify('Approved customer log cleared.', 'rose');
        }}
        onClose={() => setAdminOpen(false)}
        onNotify={notify}
      />

      {/* Branded PDF Statement Modal */}
      <PdfStatementModal
        request={pdfRequest}
        appSettings={appSettings}
        customers={customers}
        khataTransactions={khataTransactions}
        expenses={expenses}
        onClose={() => setPdfRequest(null)}
      />

      {/* Global Floating Toast */}
      {toast && (
        <div
          role="status"
          className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-2xl backdrop-blur-xl shadow-2xl border text-xs font-semibold flex items-center gap-2 no-print ${
            toast.tone === 'emerald'
              ? 'bg-emerald-950/90 border-emerald-500/45 text-emerald-200'
              : toast.tone === 'rose'
              ? 'bg-rose-950/90 border-rose-500/45 text-rose-200'
              : 'bg-[#121931]/95 border-[#D4AF37]/50 text-[#FDE68A]'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
