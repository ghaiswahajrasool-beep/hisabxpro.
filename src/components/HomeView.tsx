import React from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Crown,
  FileText,
  Plus,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { Customer, ExpenseEntry, KhataTransaction, TabId } from '../types';
import { getCategoryMeta } from '../utils/categories';
import { formatPKR, formatShortDate } from '../utils/cryptoAndFormat';
import { AnimatedCounter } from './AnimatedCounter';
import { CategoryDonutChart, DonutSlice, MonthlyBarPoint, MonthlyCashflowBarChart } from './Charts';

interface HomeViewProps {
  businessName: string;
  isPro: boolean;
  totalEntriesUsed: number;
  freeLimit: number;
  customers: Customer[];
  khataTransactions: KhataTransaction[];
  expenses: ExpenseEntry[];
  monthlyBudget: number;
  onNavigate: (tab: TabId) => void;
  onQuickAddKhata: () => void;
  onQuickAddExpense: (type: 'expense' | 'income') => void;
  onOpenPdfReport: () => void;
  onOpenUpgrade: (feature?: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  businessName,
  isPro,
  totalEntriesUsed,
  freeLimit,
  customers,
  khataTransactions,
  expenses,
  monthlyBudget,
  onNavigate,
  onQuickAddKhata,
  onQuickAddExpense,
  onOpenPdfReport,
  onOpenUpgrade,
}) => {
  // Compute Khata totals per customer
  const customerBalances = new Map<string, number>();
  customers.forEach((c) => customerBalances.set(c.id, 0));
  khataTransactions.forEach((tx) => {
    const prev = customerBalances.get(tx.customerId) || 0;
    customerBalances.set(tx.customerId, prev + (tx.type === 'udhaar' ? tx.amount : -tx.amount));
  });

  let totalLenaHai = 0;
  let totalDenaHai = 0;
  customerBalances.forEach((bal) => {
    if (bal > 0) totalLenaHai += bal;
    else if (bal < 0) totalDenaHai += Math.abs(bal);
  });

  const totalIncome = expenses
    .filter((e) => e.entryType === 'income')
    .reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = expenses
    .filter((e) => e.entryType === 'expense')
    .reduce((sum, e) => sum + e.amount, 0);

  const netPosition = totalIncome - totalExpenses + (totalLenaHai - totalDenaHai);
  const budgetRatio = monthlyBudget > 0 ? Math.min(100, Math.round((totalExpenses / monthlyBudget) * 100)) : 0;

  // Category Donut data
  const catTotals = new Map<string, number>();
  expenses
    .filter((e) => e.entryType === 'expense')
    .forEach((e) => {
      catTotals.set(e.category, (catTotals.get(e.category) || 0) + e.amount);
    });

  const donutSlices: DonutSlice[] = Array.from(catTotals.entries())
    .map(([label, value]) => ({
      label,
      value,
      color: getCategoryMeta(label).color,
    }))
    .sort((a, b) => b.value - a.value);

  // 6-Month Cashflow Bar Chart
  const monthlyPoints: MonthlyBarPoint[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'short' });

    const expIn = expenses
      .filter((e) => e.entryType === 'income' && e.date.startsWith(key))
      .reduce((s, e) => s + e.amount, 0);
    const khataIn = khataTransactions
      .filter((t) => t.type === 'jama' && t.date.startsWith(key))
      .reduce((s, t) => s + t.amount, 0);

    const expOut = expenses
      .filter((e) => e.entryType === 'expense' && e.date.startsWith(key))
      .reduce((s, e) => s + e.amount, 0);
    const khataOut = khataTransactions
      .filter((t) => t.type === 'udhaar' && t.date.startsWith(key))
      .reduce((s, t) => s + t.amount, 0);

    monthlyPoints.push({
      monthLabel: label,
      inflow: expIn + khataIn,
      outflow: expOut + khataOut,
    });
  }

  // Combined recent activity
  const customerMap = new Map(customers.map((c) => [c.id, c.name]));
  const recentFeed = [
    ...khataTransactions.map((t) => ({
      id: t.id,
      date: t.date,
      createdAt: t.createdAt,
      title: customerMap.get(t.customerId) || 'Customer',
      subtitle: `${t.type === 'udhaar' ? 'Give Udhaar (Dena)' : 'Receive Cash (Lena)'} · ${t.note || 'Khata entry'}`,
      amount: t.amount,
      isPositive: t.type === 'jama',
      targetTab: 'khata' as TabId,
    })),
    ...expenses.map((e) => ({
      id: e.id,
      date: e.date,
      createdAt: e.createdAt,
      title: e.title,
      subtitle: `${e.category} · ${e.paymentMethod}`,
      amount: e.amount,
      isPositive: e.entryType === 'income',
      targetTab: 'expenses' as TabId,
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Top 2-Column Hero Split: 3D Luxury Metal Card + Quick Action & Budget Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Hero Metal Card */}
        <div className="lg:col-span-7 relative rounded-3xl overflow-hidden gold-border-glow min-h-[250px] flex flex-col justify-between p-6 sm:p-8 bg-[#0A0F21]">
          <img
            src="/src/assets/images/metal_card_bg_1795197530317.jpg"
            alt="Obsidian titanium luxury card surface"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover opacity-55 pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#070B19]/85 via-[#0B1228]/70 to-[#070B19]/92 pointer-events-none" />

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-[#F3D474] tracking-wide">
                {businessName} · Net Position
              </p>
              <div className="mt-2 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                <AnimatedCounter value={netPosition} showSign={netPosition < 0} />
              </div>
              <p className="text-xs text-slate-400 mt-1.5">
                Combined Cashflow + Receivable Balance (PKR)
              </p>
            </div>

            {isPro ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/45 text-xs font-bold text-[#FDE68A] shrink-0">
                <Crown className="w-3.5 h-3.5" />
                Lifetime Pro
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onOpenUpgrade('Lifetime Pro')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl gold-btn text-xs font-bold shrink-0 transition-transform active:scale-95"
              >
                <Crown className="w-3.5 h-3.5" />
                Upgrade Pro
              </button>
            )}
          </div>

          <div className="relative z-10 mt-8 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-[11px] text-slate-400">Lena Hai (Receivable)</p>
              <p className="text-sm sm:text-base font-bold text-emerald-400 font-mono-num mt-0.5">
                {formatPKR(totalLenaHai)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400">Dena Hai (Payable)</p>
              <p className="text-sm sm:text-base font-bold text-rose-400 font-mono-num mt-0.5">
                {formatPKR(totalDenaHai)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400">Total Income</p>
              <p className="text-sm sm:text-base font-bold text-emerald-300 font-mono-num mt-0.5">
                {formatPKR(totalIncome)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400">Total Expenses</p>
              <p className="text-sm sm:text-base font-bold text-rose-300 font-mono-num mt-0.5">
                {formatPKR(totalExpenses)}
              </p>
            </div>
          </div>
        </div>

        {/* Right Panel: Quick Actions & Monthly Budget */}
        <div className="lg:col-span-5 glass-card rounded-3xl p-5 sm:p-6 flex flex-col justify-between gap-5">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3.5">
              <h2 className="text-sm font-bold text-white">Quick Command Actions</h2>
              {!isPro && (
                <span className="text-xs font-mono-num text-slate-400">
                  {totalEntriesUsed} / {freeLimit} free entries
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={onQuickAddKhata}
                className="min-h-[48px] px-3.5 py-2.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-[#D4AF37]/30 text-left transition-all active:scale-[0.98]"
              >
                <div className="flex items-center justify-between">
                  <Users className="w-4 h-4 text-[#F3D474]" />
                  <Plus className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <p className="text-xs font-semibold text-white mt-2">Khata Entry</p>
              </button>

              <button
                type="button"
                onClick={() => onQuickAddExpense('expense')}
                className="min-h-[48px] px-3.5 py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-left transition-all active:scale-[0.98]"
              >
                <div className="flex items-center justify-between">
                  <TrendingDown className="w-4 h-4 text-rose-400" />
                  <Plus className="w-3.5 h-3.5 text-rose-300" />
                </div>
                <p className="text-xs font-semibold text-white mt-2">Add Expense</p>
              </button>

              <button
                type="button"
                onClick={() => onQuickAddExpense('income')}
                className="min-h-[48px] px-3.5 py-2.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-left transition-all active:scale-[0.98]"
              >
                <div className="flex items-center justify-between">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <Plus className="w-3.5 h-3.5 text-emerald-300" />
                </div>
                <p className="text-xs font-semibold text-white mt-2">Add Income</p>
              </button>

              <button
                type="button"
                onClick={onOpenPdfReport}
                className="min-h-[48px] px-3.5 py-2.5 rounded-2xl bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/35 text-left transition-all active:scale-[0.98]"
              >
                <div className="flex items-center justify-between">
                  <FileText className="w-4 h-4 text-[#F3D474]" />
                  {!isPro && <Crown className="w-3.5 h-3.5 text-[#F3D474]" />}
                </div>
                <p className="text-xs font-semibold text-white mt-2">PDF Statement</p>
              </button>
            </div>
          </div>

          {/* Budget Utilization */}
          <div className="pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-[#F3D474]" />
                Monthly Expense Budget
              </span>
              <span className="font-mono-num font-semibold text-slate-200">
                {formatPKR(totalExpenses)} / {formatPKR(monthlyBudget)}
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-800/90 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  budgetRatio >= 90
                    ? 'bg-gradient-to-r from-rose-500 to-rose-400'
                    : budgetRatio >= 70
                    ? 'bg-gradient-to-r from-amber-500 to-[#F3D474]'
                    : 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                }`}
                style={{ width: `${budgetRatio}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5">
              <span>{budgetRatio}% utilized</span>
              <button
                type="button"
                onClick={() => onNavigate('expenses')}
                className="text-[#F3D474] hover:underline font-medium"
              >
                Manage Expenses
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Row: Donut + Monthly Cashflow */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 glass-card-subtle rounded-3xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white">Expense Breakdown</h3>
            <button
              type="button"
              onClick={() => onNavigate('analytics')}
              className="text-xs font-medium text-[#F3D474] hover:underline"
            >
              Full Analytics
            </button>
          </div>
          <CategoryDonutChart slices={donutSlices} centerLabel="Total Spent" />
        </div>

        <div className="lg:col-span-7 glass-card-subtle rounded-3xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-white">6-Month Cashflow</h3>
            <span className="text-xs text-slate-400">PKR Inflow vs Outflow</span>
          </div>
          <MonthlyCashflowBarChart data={monthlyPoints} />
        </div>
      </div>

      {/* Recent Ledger Activity */}
      <div className="glass-card-subtle rounded-3xl p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Recent Ledger Activity</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Latest entries across Business Khata &amp; Home Expenses
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('khata')}
            className="text-xs font-medium text-[#F3D474] hover:underline"
          >
            View Khata
          </button>
        </div>

        {recentFeed.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">
            No transactions yet. Add your first Khata or Expense entry above.
          </p>
        ) : (
          <div className="divide-y divide-slate-800/70">
            {recentFeed.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.targetTab)}
                className="w-full py-3.5 px-2 -mx-2 rounded-xl hover:bg-white/[0.03] flex items-center justify-between gap-4 text-left transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      item.isPositive
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-rose-500/15 text-rose-400'
                    }`}
                  >
                    {item.isPositive ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{item.title}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {item.subtitle} · {formatShortDate(item.date)}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-sm font-bold font-mono-num shrink-0 ${
                    item.isPositive ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {item.isPositive ? '+' : '-'} {formatPKR(item.amount)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
