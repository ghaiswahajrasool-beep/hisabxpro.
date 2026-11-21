import React, { useMemo, useState } from 'react';
import { Crown, Download, FileText, PieChart, TrendingUp } from 'lucide-react';
import { Customer, ExpenseEntry, KhataTransaction } from '../types';
import { getCategoryMeta } from '../utils/categories';
import { formatPKR } from '../utils/cryptoAndFormat';
import { CategoryDonutChart, DonutSlice, MonthlyBarPoint, MonthlyCashflowBarChart } from './Charts';

interface AnalyticsViewProps {
  isPro: boolean;
  customers: Customer[];
  khataTransactions: KhataTransaction[];
  expenses: ExpenseEntry[];
  onExportCsv: () => void;
  onOpenPdfReport: () => void;
  onSelectCustomer: (customerId: string) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  isPro,
  customers,
  khataTransactions,
  expenses,
  onExportCsv,
  onOpenPdfReport,
  onSelectCustomer,
}) => {
  const [donutMode, setDonutMode] = useState<'expenses' | 'khata'>('expenses');

  const totalIncome = expenses
    .filter((e) => e.entryType === 'income')
    .reduce((s, e) => s + e.amount, 0);
  const totalExpenses = expenses
    .filter((e) => e.entryType === 'expense')
    .reduce((s, e) => s + e.amount, 0);

  const savingsRate =
    totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0;

  // Expense Donut Slices
  const expenseSlices: DonutSlice[] = useMemo(() => {
    const map = new Map<string, number>();
    expenses
      .filter((e) => e.entryType === 'expense')
      .forEach((e) => map.set(e.category, (map.get(e.category) || 0) + e.amount));
    return Array.from(map.entries())
      .map(([label, value]) => ({
        label,
        value,
        color: getCategoryMeta(label).color,
      }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  // Customer balances for Khata Donut & Top Debtors/Creditors
  const customerBalances = useMemo(() => {
    const map = new Map<string, number>();
    customers.forEach((c) => map.set(c.id, 0));
    khataTransactions.forEach((t) => {
      map.set(t.customerId, (map.get(t.customerId) || 0) + (t.type === 'udhaar' ? t.amount : -t.amount));
    });
    return customers.map((c) => ({
      customer: c,
      balance: map.get(c.id) || 0,
    }));
  }, [customers, khataTransactions]);

  const khataSlices: DonutSlice[] = useMemo(() => {
    const palette = ['#10B981', '#D4AF37', '#38BDF8', '#A78BFA', '#F59E0B', '#F43F5E'];
    return customerBalances
      .filter((item) => item.balance !== 0)
      .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance))
      .slice(0, 6)
      .map((item, idx) => ({
        label: item.customer.name,
        value: Math.abs(item.balance),
        color: palette[idx % palette.length],
      }));
  }, [customerBalances]);

  // 6-Month Cashflow Bar Data
  const monthlyPoints: MonthlyBarPoint[] = useMemo(() => {
    const points: MonthlyBarPoint[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short' });

      const inflow =
        expenses
          .filter((e) => e.entryType === 'income' && e.date.startsWith(key))
          .reduce((s, e) => s + e.amount, 0) +
        khataTransactions
          .filter((t) => t.type === 'jama' && t.date.startsWith(key))
          .reduce((s, t) => s + t.amount, 0);

      const outflow =
        expenses
          .filter((e) => e.entryType === 'expense' && e.date.startsWith(key))
          .reduce((s, e) => s + e.amount, 0) +
        khataTransactions
          .filter((t) => t.type === 'udhaar' && t.date.startsWith(key))
          .reduce((s, t) => s + t.amount, 0);

      points.push({ monthLabel: label, inflow, outflow });
    }
    return points;
  }, [expenses, khataTransactions]);

  const topReceivables = customerBalances
    .filter((i) => i.balance > 0)
    .sort((a, b) => b.balance - a.balance);
  const topPayables = customerBalances
    .filter((i) => i.balance < 0)
    .sort((a, b) => a.balance - b.balance);

  return (
    <div className="space-y-5">
      {/* Header + Export Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <PieChart className="w-5 h-5 text-[#F3D474]" />
            Executive Cashflow Analytics
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time PKR performance across Business Khata &amp; Personal Expenses
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onExportCsv}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-slate-700 text-xs font-semibold text-white flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-[#F3D474]" />
            Export Excel (CSV)
            {!isPro && <Crown className="w-3.5 h-3.5 text-[#F3D474]" />}
          </button>
          <button
            type="button"
            onClick={onOpenPdfReport}
            className="min-h-[42px] px-4 py-2 rounded-xl gold-btn text-xs font-bold flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4" />
            Branded PDF Report
            {!isPro && <Crown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5">
          <p className="text-xs text-slate-400">Net Savings Rate</p>
          <p
            className={`text-2xl font-extrabold font-mono-num mt-1 ${
              savingsRate >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {savingsRate}%
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {formatPKR(Math.max(0, totalIncome - totalExpenses))} retained
          </p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <p className="text-xs text-slate-400">Total Khata Volume</p>
          <p className="text-2xl font-extrabold font-mono-num text-[#F3D474] mt-1">
            {formatPKR(khataTransactions.reduce((s, t) => s + t.amount, 0))}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Across {khataTransactions.length} ledger transactions
          </p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <p className="text-xs text-slate-400">Top Expense Category</p>
          <p className="text-xl font-bold text-white mt-1 truncate">
            {expenseSlices[0]?.label || 'None'}
          </p>
          <p className="text-[11px] text-rose-400 font-mono-num mt-1">
            {expenseSlices[0] ? formatPKR(expenseSlices[0].value) : 'Rs. 0'}
          </p>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 glass-card rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-bold text-white">Distribution Donut</h3>
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#070B19] border border-slate-800">
              <button
                type="button"
                onClick={() => setDonutMode('expenses')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                  donutMode === 'expenses'
                    ? 'bg-[#D4AF37]/20 text-[#F3D474]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Expenses
              </button>
              <button
                type="button"
                onClick={() => setDonutMode('khata')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                  donutMode === 'khata'
                    ? 'bg-[#D4AF37]/20 text-[#F3D474]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Khata
              </button>
            </div>
          </div>

          <CategoryDonutChart
            slices={donutMode === 'expenses' ? expenseSlices : khataSlices}
            centerLabel={donutMode === 'expenses' ? 'Total Spent' : 'Active Khata'}
            emptyText={
              donutMode === 'expenses'
                ? 'Log daily expenses to see category distribution.'
                : 'Add customer Khata entries to see party distribution.'
            }
          />
        </div>

        <div className="lg:col-span-7 glass-card rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              6-Month Cashflow Comparison
            </h3>
          </div>
          <MonthlyCashflowBarChart data={monthlyPoints} />
        </div>
      </div>

      {/* Top Receivables & Payables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="glass-card-subtle rounded-3xl p-5 sm:p-6 space-y-3">
          <h3 className="text-sm font-bold text-emerald-400">
            Top Lena Hai (Customer Receivables)
          </h3>
          {topReceivables.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">No outstanding receivables.</p>
          ) : (
            <div className="divide-y divide-slate-800/70">
              {topReceivables.slice(0, 5).map((item) => (
                <button
                  key={item.customer.id}
                  type="button"
                  onClick={() => onSelectCustomer(item.customer.id)}
                  className="w-full py-2.5 flex items-center justify-between text-left hover:bg-white/[0.03] px-2 -mx-2 rounded-lg"
                >
                  <span className="text-sm text-slate-200 font-medium">
                    {item.customer.name}
                  </span>
                  <span className="text-sm font-bold font-mono-num text-emerald-400">
                    {formatPKR(item.balance)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card-subtle rounded-3xl p-5 sm:p-6 space-y-3">
          <h3 className="text-sm font-bold text-rose-400">
            Top Dena Hai (Payables / Advances)
          </h3>
          {topPayables.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">No pending payables.</p>
          ) : (
            <div className="divide-y divide-slate-800/70">
              {topPayables.slice(0, 5).map((item) => (
                <button
                  key={item.customer.id}
                  type="button"
                  onClick={() => onSelectCustomer(item.customer.id)}
                  className="w-full py-2.5 flex items-center justify-between text-left hover:bg-white/[0.03] px-2 -mx-2 rounded-lg"
                >
                  <span className="text-sm text-slate-200 font-medium">
                    {item.customer.name}
                  </span>
                  <span className="text-sm font-bold font-mono-num text-rose-400">
                    {formatPKR(Math.abs(item.balance))}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
