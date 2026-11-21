import React from 'react';
import { Printer, X } from 'lucide-react';
import { AppSettings, Customer, ExpenseEntry, KhataTransaction, PdfReportRequest } from '../types';
import { formatPKR, formatShortDate, getTodayISO } from '../utils/cryptoAndFormat';

interface PdfStatementModalProps {
  request: PdfReportRequest | null;
  appSettings: AppSettings;
  customers: Customer[];
  khataTransactions: KhataTransaction[];
  expenses: ExpenseEntry[];
  onClose: () => void;
}

export const PdfStatementModal: React.FC<PdfStatementModalProps> = ({
  request,
  appSettings,
  customers,
  khataTransactions,
  expenses,
  onClose,
}) => {
  if (!request) return null;

  const handlePrint = () => {
    window.print();
  };

  let title = '';
  let subtitle = '';
  let kpiLeft = { label: '', value: '' };
  let kpiMid = { label: '', value: '' };
  let kpiRight = { label: '', value: '' };
  let rows: { date: string; description: string; category: string; amount: string; tone: 'emerald' | 'rose' | 'neutral' }[] = [];

  if (request.mode === 'customer') {
    const customer = customers.find((c) => c.id === request.customerId);
    const txs = khataTransactions
      .filter((t) => t.customerId === request.customerId)
      .sort((a, b) => b.date.localeCompare(a.date));

    const totalGiven = txs.filter((t) => t.type === 'udhaar').reduce((s, t) => s + t.amount, 0);
    const totalReceived = txs.filter((t) => t.type === 'jama').reduce((s, t) => s + t.amount, 0);
    const balance = totalGiven - totalReceived;

    title = `Customer Khata Statement — ${customer?.name || 'Customer'}`;
    subtitle = `Phone: ${customer?.phone || 'N/A'} · Generated ${formatShortDate(getTodayISO())}`;
    kpiLeft = { label: 'Total Udhaar Given', value: formatPKR(totalGiven) };
    kpiMid = { label: 'Total Cash Received (Jama)', value: formatPKR(totalReceived) };
    kpiRight = {
      label: balance >= 0 ? 'Net Receivable (Lena Hai)' : 'Net Payable (Dena Hai)',
      value: formatPKR(Math.abs(balance)),
    };

    rows = txs.map((tx) => ({
      date: formatShortDate(tx.date),
      description: tx.note || (tx.type === 'udhaar' ? 'Udhaar Given' : 'Cash Received'),
      category: tx.type === 'udhaar' ? 'Give Udhaar (Dena)' : 'Receive Cash (Lena)',
      amount: `${tx.type === 'udhaar' ? '-' : '+'} ${formatPKR(tx.amount)}`,
      tone: tx.type === 'jama' ? 'emerald' : 'rose',
    }));
  } else {
    const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date));
    const totalIncome = sorted.filter((e) => e.entryType === 'income').reduce((s, e) => s + e.amount, 0);
    const totalExpense = sorted.filter((e) => e.entryType === 'expense').reduce((s, e) => s + e.amount, 0);
    const netSavings = totalIncome - totalExpense;

    title = `Executive Income & Expense Statement`;
    subtitle = `${request.monthLabel} · Generated ${formatShortDate(getTodayISO())}`;
    kpiLeft = { label: 'Total Income', value: formatPKR(totalIncome) };
    kpiMid = { label: 'Total Expenses', value: formatPKR(totalExpense) };
    kpiRight = { label: 'Net Cashflow Balance', value: formatPKR(netSavings, { showSign: true }) };

    rows = sorted.map((exp) => ({
      date: formatShortDate(exp.date),
      description: exp.title + (exp.note ? ` — ${exp.note}` : ''),
      category: `${exp.category} (${exp.paymentMethod})`,
      amount: `${exp.entryType === 'income' ? '+' : '-'} ${formatPKR(exp.amount)}`,
      tone: exp.entryType === 'income' ? 'emerald' : 'rose',
    }));
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-3xl my-auto rounded-3xl bg-white text-slate-900 shadow-2xl overflow-hidden print-only-container">
        {/* Toolbar hidden on print */}
        <div className="no-print flex items-center justify-between gap-3 px-6 py-4 bg-[#070B19] text-white border-b border-[#D4AF37]/30">
          <div>
            <p className="text-sm font-bold text-[#F3D474]">Branded PDF Statement Preview</p>
            <p className="text-xs text-slate-400">Ready for executive print or Save as PDF</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl gold-btn font-bold text-xs flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
              aria-label="Close PDF preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document */}
        <div className="p-6 sm:p-10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b-2 border-slate-200">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-amber-700">
                HisabxPro Official Statement
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 mt-1">{appSettings.businessName}</h1>
              <p className="text-sm text-slate-600 mt-0.5">Prepared by {appSettings.ownerName}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-sm font-bold text-slate-900">{title}</p>
              <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
            </div>
          </div>

          {/* KPI Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-xs text-slate-500">{kpiLeft.label}</p>
              <p className="text-lg font-bold text-slate-900 font-mono-num mt-1">{kpiLeft.value}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-xs text-slate-500">{kpiMid.label}</p>
              <p className="text-lg font-bold text-slate-900 font-mono-num mt-1">{kpiMid.value}</p>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <p className="text-xs text-amber-800">{kpiRight.label}</p>
              <p className="text-lg font-bold text-amber-950 font-mono-num mt-1">{kpiRight.value}</p>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-300 text-xs font-semibold text-slate-600">
                  <th className="py-2.5 pr-4">Date</th>
                  <th className="py-2.5 pr-4">Description</th>
                  <th className="py-2.5 pr-4">Category / Type</th>
                  <th className="py-2.5 text-right">Amount (PKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      No transactions recorded in this statement yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((r, idx) => (
                    <tr key={idx}>
                      <td className="py-3 pr-4 text-xs text-slate-600 whitespace-nowrap">{r.date}</td>
                      <td className="py-3 pr-4 font-medium text-slate-900">{r.description}</td>
                      <td className="py-3 pr-4 text-xs text-slate-600">{r.category}</td>
                      <td
                        className={`py-3 text-right font-mono-num font-semibold whitespace-nowrap ${
                          r.tone === 'emerald' ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {r.amount}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>Generated via HisabxPro Executive Ledger</span>
            <span>All amounts in Pakistani Rupees (PKR)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
