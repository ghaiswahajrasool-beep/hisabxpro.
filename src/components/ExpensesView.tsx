import React, { useMemo, useState } from 'react';
import {
  Crown,
  Edit3,
  FileText,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import {
  ExpenseCategory,
  ExpenseEntry,
  IncomeCategory,
  PaymentMethod,
} from '../types';
import {
  EXPENSE_CATEGORIES,
  getCategoryMeta,
  INCOME_CATEGORIES,
} from '../utils/categories';
import { formatPKR, formatShortDate, getTodayISO } from '../utils/cryptoAndFormat';
import { AnimatedCounter } from './AnimatedCounter';

interface ExpensesViewProps {
  isPro: boolean;
  canAddEntry: boolean;
  expenses: ExpenseEntry[];
  monthlyBudget: number;
  onUpdateBudget: (budget: number) => void;
  onAddEntry: (entry: Omit<ExpenseEntry, 'id' | 'createdAt'>) => void;
  onUpdateEntry: (id: string, entry: Omit<ExpenseEntry, 'id' | 'createdAt'>) => void;
  onDeleteEntry: (id: string) => void;
  onOpenPdfReport: () => void;
  onOpenUpgrade: (feature?: string) => void;
  onNotify: (msg: string, tone?: 'gold' | 'emerald' | 'rose') => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  isPro,
  canAddEntry,
  expenses,
  monthlyBudget,
  onUpdateBudget,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
  onOpenPdfReport,
  onOpenUpgrade,
  onNotify,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Budget edit state
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState(String(monthlyBudget));

  // Add/Edit Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ExpenseEntry | null>(null);
  const [entryType, setEntryType] = useState<'expense' | 'income'>('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory | IncomeCategory>('Food & Dining');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [date, setDate] = useState(getTodayISO());
  const [note, setNote] = useState('');

  const totalIncome = useMemo(
    () => expenses.filter((e) => e.entryType === 'income').reduce((s, e) => s + e.amount, 0),
    [expenses]
  );
  const totalExpenses = useMemo(
    () => expenses.filter((e) => e.entryType === 'expense').reduce((s, e) => s + e.amount, 0),
    [expenses]
  );
  const netBalance = totalIncome - totalExpenses;
  const budgetRatio =
    monthlyBudget > 0 ? Math.min(100, Math.round((totalExpenses / monthlyBudget) * 100)) : 0;

  // Category breakdown for expenses
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    EXPENSE_CATEGORIES.forEach((cat) => map.set(cat, 0));
    expenses
      .filter((e) => e.entryType === 'expense')
      .forEach((e) => map.set(e.category, (map.get(e.category) || 0) + e.amount));
    return EXPENSE_CATEGORIES.map((cat) => ({
      category: cat,
      amount: map.get(cat) || 0,
    }));
  }, [expenses]);

  const filteredEntries = useMemo(() => {
    return expenses
      .filter((item) => {
        if (typeFilter !== 'all' && item.entryType !== typeFilter) return false;
        if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
        const q = searchQuery.trim().toLowerCase();
        if (
          q &&
          !item.title.toLowerCase().includes(q) &&
          !item.category.toLowerCase().includes(q) &&
          !(item.note || '').toLowerCase().includes(q)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  }, [expenses, typeFilter, selectedCategory, searchQuery]);

  const openAddModal = (defaultType: 'expense' | 'income') => {
    if (!canAddEntry) {
      onOpenUpgrade('Unlimited Khata & Expense Entries');
      return;
    }
    setEditingEntry(null);
    setEntryType(defaultType);
    setTitle('');
    setAmount('');
    setCategory(defaultType === 'expense' ? 'Food & Dining' : 'Salary');
    setPaymentMethod('Cash');
    setDate(getTodayISO());
    setNote('');
    setModalOpen(true);
  };

  const openEditModal = (entry: ExpenseEntry) => {
    setEditingEntry(entry);
    setEntryType(entry.entryType);
    setTitle(entry.title);
    setAmount(String(entry.amount));
    setCategory(entry.category);
    setPaymentMethod(entry.paymentMethod);
    setDate(entry.date);
    setNote(entry.note || '');
    setModalOpen(true);
  };

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(amount);
    if (!title.trim() || Number.isNaN(num) || num <= 0) {
      onNotify('Please enter a title and valid PKR amount.', 'rose');
      return;
    }

    const payload: Omit<ExpenseEntry, 'id' | 'createdAt'> = {
      entryType,
      title: title.trim(),
      amount: Math.round(num),
      category,
      paymentMethod,
      date: date || getTodayISO(),
      note: note.trim(),
    };

    if (editingEntry) {
      onUpdateEntry(editingEntry.id, payload);
      onNotify('Entry updated.', 'emerald');
    } else {
      onAddEntry(payload);
      onNotify(
        entryType === 'income' ? 'Income added.' : 'Expense logged.',
        entryType === 'income' ? 'emerald' : 'gold'
      );
    }
    setModalOpen(false);
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(budgetDraft);
    if (Number.isNaN(num) || num <= 0) {
      onNotify('Enter a valid monthly budget amount.', 'rose');
      return;
    }
    onUpdateBudget(Math.round(num));
    setEditingBudget(false);
    onNotify('Monthly budget updated.', 'emerald');
  };

  return (
    <div className="space-y-5">
      {/* Top KPI & Budget Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-4 sm:p-5">
          <p className="text-xs text-slate-400">Total Income / Salary</p>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">
            <AnimatedCounter value={totalIncome} />
          </div>
        </div>
        <div className="glass-card rounded-2xl p-4 sm:p-5">
          <p className="text-xs text-slate-400">Ghar &amp; Daily Kharcha</p>
          <div className="text-2xl font-extrabold text-rose-400 mt-1">
            <AnimatedCounter value={totalExpenses} />
          </div>
        </div>
        <div className="glass-card rounded-2xl p-4 sm:p-5">
          <p className="text-xs text-slate-400">Net Cash Remaining</p>
          <div
            className={`text-2xl font-extrabold mt-1 ${
              netBalance >= 0 ? 'text-[#F3D474]' : 'text-rose-400'
            }`}
          >
            <AnimatedCounter value={netBalance} showSign={netBalance < 0} />
          </div>
        </div>
        <div className="glass-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Monthly Budget</span>
            <button
              type="button"
              onClick={() => {
                setBudgetDraft(String(monthlyBudget));
                setEditingBudget(!editingBudget);
              }}
              className="text-[#F3D474] hover:underline font-medium flex items-center gap-1"
            >
              <SlidersHorizontal className="w-3 h-3" />
              Edit
            </button>
          </div>

          {editingBudget ? (
            <form onSubmit={handleSaveBudget} className="flex gap-1.5 mt-2">
              <input
                type="number"
                min={1}
                value={budgetDraft}
                onChange={(e) => setBudgetDraft(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#070B19] border border-[#D4AF37]/40 text-xs font-mono-num text-white focus:outline-none"
              />
              <button type="submit" className="px-3 py-1.5 rounded-lg gold-btn text-xs font-bold">
                Save
              </button>
            </form>
          ) : (
            <>
              <div className="text-lg font-bold text-white font-mono-num mt-1">
                {formatPKR(monthlyBudget)}
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    budgetRatio >= 90 ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${budgetRatio}%` }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => openAddModal('expense')}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-xs font-bold text-rose-300 flex items-center gap-1.5"
          >
            <TrendingDown className="w-4 h-4" />
            Add Daily Expense
          </button>
          <button
            type="button"
            onClick={() => openAddModal('income')}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-xs font-bold text-emerald-300 flex items-center gap-1.5"
          >
            <TrendingUp className="w-4 h-4" />
            Add Income / Salary
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenPdfReport}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 border border-[#D4AF37]/40 text-xs font-bold text-[#F3D474] flex items-center gap-1.5"
        >
          <FileText className="w-4 h-4" />
          Print / Download Expense PDF
          {!isPro && <Crown className="w-3.5 h-3.5 text-[#F3D474]" />}
        </button>
      </div>

      {/* Category Filter Grid + Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Category Quick Breakdown */}
        <div className="lg:col-span-4 glass-card-subtle rounded-3xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Spending Categories</h3>
            {selectedCategory !== 'All' && (
              <button
                type="button"
                onClick={() => setSelectedCategory('All')}
                className="text-xs text-[#F3D474] hover:underline"
              >
                Show All
              </button>
            )}
          </div>

          <div className="space-y-2">
            {categoryBreakdown.map((item) => {
              const meta = getCategoryMeta(item.category);
              const isSelected = selectedCategory === item.category;
              const pct =
                totalExpenses > 0 ? Math.round((item.amount / totalExpenses) * 100) : 0;

              return (
                <button
                  key={item.category}
                  type="button"
                  onClick={() =>
                    setSelectedCategory(isSelected ? 'All' : item.category)
                  }
                  className={`w-full p-2.5 rounded-xl text-left transition-colors ${
                    isSelected
                      ? 'bg-[#D4AF37]/15 border border-[#D4AF37]/40'
                      : 'hover:bg-white/[0.04] border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${meta.textClass}`}
                        style={{ backgroundColor: meta.bgTint }}
                      >
                        {meta.renderIcon('w-4 h-4')}
                      </span>
                      <span className="text-xs font-medium text-slate-200 truncate">
                        {item.category}
                      </span>
                    </div>
                    <span className="text-xs font-bold font-mono-num text-white shrink-0">
                      {formatPKR(item.amount)}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-slate-800/90 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%`, backgroundColor: meta.color }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Expense & Income Feed */}
        <div className="lg:col-span-8 glass-card rounded-3xl p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search expenses, bills, salary..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070B19]/90 border border-slate-800 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#070B19]/90 border border-slate-800">
              {[
                { id: 'all', label: 'All' },
                { id: 'expense', label: 'Expenses' },
                { id: 'income', label: 'Income' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTypeFilter(t.id as 'all' | 'expense' | 'income')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    typeFilter === t.id
                      ? 'bg-[#D4AF37]/20 text-[#F3D474]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {filteredEntries.length === 0 ? (
            <div className="py-14 text-center space-y-3">
              <p className="text-sm text-slate-400">No expense or income entries found.</p>
              <button
                type="button"
                onClick={() => openAddModal('expense')}
                className="px-4 py-2 rounded-xl gold-btn text-xs font-bold inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Log First Expense
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/70 max-h-[540px] overflow-y-auto pr-1">
              {filteredEntries.map((item) => {
                const meta = getCategoryMeta(item.category);
                const isIncome = item.entryType === 'income';
                return (
                  <div
                    key={item.id}
                    className="py-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.textClass}`}
                        style={{ backgroundColor: meta.bgTint }}
                      >
                        {meta.renderIcon('w-4 h-4')}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{item.title}</p>
                        <p className="text-xs text-slate-400 truncate">
                          {item.category} · {item.paymentMethod} · {formatShortDate(item.date)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-sm font-bold font-mono-num ${
                          isIncome ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isIncome ? '+' : '-'} {formatPKR(item.amount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                        aria-label="Edit entry"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteEntry(item.id);
                          onNotify('Entry deleted.', 'rose');
                        }}
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                        aria-label="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Expense Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <form
            onSubmit={handleSaveEntry}
            className="w-full max-w-md rounded-3xl glass-card gold-border-glow p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {editingEntry ? 'Edit Entry' : 'Log Cashflow Entry'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#070B19] border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setEntryType('expense');
                  setCategory('Food & Dining');
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-colors ${
                  entryType === 'expense'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'text-slate-400'
                }`}
              >
                Daily Expense
              </button>
              <button
                type="button"
                onClick={() => {
                  setEntryType('income');
                  setCategory('Salary');
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-colors ${
                  entryType === 'income'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400'
                }`}
              >
                Income / Salary
              </button>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Title / Description</label>
              <input
                type="text"
                required
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  entryType === 'expense' ? 'e.g. LESCO Bill or PSO Fuel' : 'e.g. Monthly Salary'
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#070B19] border border-slate-700 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Amount (PKR)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 2500"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070B19] border border-slate-700 text-base font-bold font-mono-num text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#070B19] border border-slate-700 text-xs font-mono-num text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as ExpenseCategory | IncomeCategory)
                  }
                  className="w-full px-3 py-2.5 rounded-xl bg-[#070B19] border border-slate-700 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                >
                  {(entryType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#070B19] border border-slate-700 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                >
                  {['Cash', 'EasyPaisa', 'JazzCash', 'Bank Transfer', 'Card'].map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Optional Note</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Additional details..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#070B19] border border-slate-700 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 text-slate-300 text-sm font-semibold"
              >
                Cancel
              </button>
              <button type="submit" className="flex-1 py-2.5 rounded-xl gold-btn text-sm font-bold">
                {editingEntry ? 'Update Entry' : 'Save Entry'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
