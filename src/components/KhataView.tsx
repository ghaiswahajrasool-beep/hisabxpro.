import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Crown,
  Edit3,
  FileText,
  MessageCircle,
  Phone,
  Plus,
  Search,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import { Customer, KhataTransaction, KhataTxType } from '../types';
import {
  formatPKR,
  formatShortDate,
  formatWhatsAppPhone,
  getTodayISO,
  openExternalLink,
} from '../utils/cryptoAndFormat';
import { AnimatedCounter } from './AnimatedCounter';

interface KhataViewProps {
  businessName: string;
  isPro: boolean;
  canAddEntry: boolean;
  customers: Customer[];
  transactions: KhataTransaction[];
  selectedCustomerId: string | null;
  onSelectCustomer: (id: string | null) => void;
  onAddCustomer: (data: Omit<Customer, 'id' | 'createdAt'>) => string;
  onUpdateCustomer: (id: string, data: Omit<Customer, 'id' | 'createdAt'>) => void;
  onDeleteCustomer: (id: string) => void;
  onAddTransaction: (tx: Omit<KhataTransaction, 'id' | 'createdAt'>) => void;
  onUpdateTransaction: (id: string, tx: Omit<KhataTransaction, 'id' | 'createdAt'>) => void;
  onDeleteTransaction: (id: string) => void;
  onOpenPdfStatement: (customerId: string) => void;
  onOpenUpgrade: (feature?: string) => void;
  onNotify: (msg: string, tone?: 'gold' | 'emerald' | 'rose') => void;
}

export const KhataView: React.FC<KhataViewProps> = ({
  businessName,
  isPro,
  canAddEntry,
  customers,
  transactions,
  selectedCustomerId,
  onSelectCustomer,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  onOpenPdfStatement,
  onOpenUpgrade,
  onNotify,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'lena' | 'dena'>('all');

  // Customer Add/Edit Modal
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custNotes, setCustNotes] = useState('');

  // Transaction Add/Edit Modal
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<KhataTransaction | null>(null);
  const [txCustomerId, setTxCustomerId] = useState('');
  const [txType, setTxType] = useState<KhataTxType>('udhaar');
  const [txAmount, setTxAmount] = useState('');
  const [txDate, setTxDate] = useState(getTodayISO());
  const [txNote, setTxNote] = useState('');

  // Delete confirmation modal
  const [confirmDeleteCustId, setConfirmDeleteCustId] = useState<string | null>(null);

  const customerSummaries = useMemo(() => {
    return customers.map((cust) => {
      const custTxs = transactions.filter((t) => t.customerId === cust.id);
      const totalGiven = custTxs
        .filter((t) => t.type === 'udhaar')
        .reduce((s, t) => s + t.amount, 0);
      const totalReceived = custTxs
        .filter((t) => t.type === 'jama')
        .reduce((s, t) => s + t.amount, 0);
      const balance = totalGiven - totalReceived; // >0 = Lena Hai (Receivable), <0 = Dena Hai (Payable)
      const latestDate = custTxs.reduce((max, t) => (t.date > max ? t.date : max), '');
      return {
        customer: cust,
        totalGiven,
        totalReceived,
        balance,
        txCount: custTxs.length,
        latestDate,
      };
    });
  }, [customers, transactions]);

  const totalLenaHai = customerSummaries
    .filter((s) => s.balance > 0)
    .reduce((sum, s) => sum + s.balance, 0);
  const totalDenaHai = customerSummaries
    .filter((s) => s.balance < 0)
    .reduce((sum, s) => sum + Math.abs(s.balance), 0);

  const filteredSummaries = customerSummaries.filter((item) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.customer.name.toLowerCase().includes(q) ||
      item.customer.phone.toLowerCase().includes(q);
    if (!matchesSearch) return false;
    if (filterMode === 'lena') return item.balance > 0;
    if (filterMode === 'dena') return item.balance < 0;
    return true;
  });

  const selectedSummary = customerSummaries.find((s) => s.customer.id === selectedCustomerId) || null;
  const selectedTxs = useMemo(() => {
    if (!selectedCustomerId) return [];
    return transactions
      .filter((t) => t.customerId === selectedCustomerId)
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  }, [transactions, selectedCustomerId]);

  const openNewCustomerModal = () => {
    setEditingCustomer(null);
    setCustName('');
    setCustPhone('');
    setCustNotes('');
    setCustomerModalOpen(true);
  };

  const openEditCustomerModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setCustName(cust.name);
    setCustPhone(cust.phone);
    setCustNotes(cust.notes || '');
    setCustomerModalOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim()) {
      onNotify('Customer name is required.', 'rose');
      return;
    }
    if (editingCustomer) {
      onUpdateCustomer(editingCustomer.id, {
        name: custName.trim(),
        phone: custPhone.trim(),
        notes: custNotes.trim(),
      });
      onNotify('Customer details updated.', 'emerald');
    } else {
      const newId = onAddCustomer({
        name: custName.trim(),
        phone: custPhone.trim(),
        notes: custNotes.trim(),
      });
      onSelectCustomer(newId);
      onNotify('Customer added to Khata.', 'emerald');
    }
    setCustomerModalOpen(false);
  };

  const openAddTxModal = (customerId: string, defaultType: KhataTxType) => {
    if (!canAddEntry) {
      onOpenUpgrade('Unlimited Khata & Expense Entries');
      return;
    }
    setEditingTx(null);
    setTxCustomerId(customerId);
    setTxType(defaultType);
    setTxAmount('');
    setTxDate(getTodayISO());
    setTxNote('');
    setTxModalOpen(true);
  };

  const openEditTxModal = (tx: KhataTransaction) => {
    setEditingTx(tx);
    setTxCustomerId(tx.customerId);
    setTxType(tx.type);
    setTxAmount(String(tx.amount));
    setTxDate(tx.date);
    setTxNote(tx.note);
    setTxModalOpen(true);
  };

  const handleSaveTx = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(txAmount);
    if (!txCustomerId || Number.isNaN(num) || num <= 0) {
      onNotify('Please select a customer and enter a valid PKR amount.', 'rose');
      return;
    }

    if (editingTx) {
      onUpdateTransaction(editingTx.id, {
        customerId: txCustomerId,
        type: txType,
        amount: Math.round(num),
        date: txDate || getTodayISO(),
        note: txNote.trim(),
      });
      onNotify('Khata transaction updated.', 'emerald');
    } else {
      onAddTransaction({
        customerId: txCustomerId,
        type: txType,
        amount: Math.round(num),
        date: txDate || getTodayISO(),
        note: txNote.trim(),
      });
      onNotify(
        txType === 'udhaar' ? 'Udhaar entry recorded.' : 'Cash payment recorded.',
        'emerald'
      );
    }
    setTxModalOpen(false);
  };

  const handleWhatsAppReminder = (cust: Customer, balance: number) => {
    if (!isPro) {
      onOpenUpgrade('1-Click WhatsApp Udhaar Reminder');
      return;
    }
    const phone = formatWhatsAppPhone(cust.phone);
    if (!phone) {
      onNotify('Please add a valid customer phone number first.', 'rose');
      return;
    }

    const absBal = formatPKR(Math.abs(balance));
    const msg =
      balance >= 0
        ? `Assalam-o-Alaikum ${cust.name} Sahib,\nUmeed hai aap khairiyat se honge. ${businessName} ke khata ke mutabiq aap ka baqaya balance *${absBal}* (Lena Hai) wajib-ul-ada hai. Bara-e-meharbani jald payment clear farma dein. Shukriya!`
        : `Assalam-o-Alaikum ${cust.name} Sahib,\n${businessName} ke khata ke mutabiq aap ke *${absBal}* advance hamare paas jama hain. Shukriya!`;

    openExternalLink(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`);
    onNotify(`Opening WhatsApp reminder for ${cust.name}...`, 'emerald');
  };

  return (
    <div className="space-y-5">
      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-4 sm:p-5">
          <p className="text-xs text-slate-400">Total Lena Hai (Receivable)</p>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">
            <AnimatedCounter value={totalLenaHai} />
          </div>
        </div>
        <div className="glass-card rounded-2xl p-4 sm:p-5">
          <p className="text-xs text-slate-400">Total Dena Hai (Payable)</p>
          <div className="text-2xl font-extrabold text-rose-400 mt-1">
            <AnimatedCounter value={totalDenaHai} />
          </div>
        </div>
        <div className="glass-card rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-400">Active Customers</p>
            <p className="text-2xl font-extrabold text-white font-mono-num mt-1">
              {customers.length}
            </p>
          </div>
          <button
            type="button"
            onClick={openNewCustomerModal}
            className="min-h-[44px] px-4 py-2 rounded-xl gold-btn text-xs font-bold flex items-center gap-1.5 whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            Add Customer
          </button>
        </div>
      </div>

      {/* Main Split: Customer List + Selected Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Customer Directory Column */}
        <div
          className={`lg:col-span-5 glass-card-subtle rounded-3xl p-4 sm:p-5 space-y-4 ${
            selectedSummary ? 'hidden lg:block' : 'block'
          }`}
        >
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customer or phone..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070B19]/90 border border-slate-800 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#070B19]/80 border border-slate-800/80">
            {[
              { id: 'all', label: 'All' },
              { id: 'lena', label: 'Lena Hai' },
              { id: 'dena', label: 'Dena Hai' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterMode(tab.id as 'all' | 'lena' | 'dena')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  filterMode === tab.id
                    ? 'bg-[#D4AF37]/20 text-[#F3D474] border border-[#D4AF37]/35'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {filteredSummaries.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <p className="text-sm text-slate-400">No customers match this filter.</p>
              <button
                type="button"
                onClick={openNewCustomerModal}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-[#D4AF37]/30 text-xs font-semibold text-[#F3D474]"
              >
                + Add First Customer
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/70 max-h-[540px] overflow-y-auto pr-1">
              {filteredSummaries.map((item) => {
                const isSelected = item.customer.id === selectedCustomerId;
                const bal = item.balance;
                return (
                  <button
                    key={item.customer.id}
                    type="button"
                    onClick={() => onSelectCustomer(item.customer.id)}
                    className={`w-full py-3.5 px-3 rounded-xl flex items-center justify-between gap-3 text-left transition-colors ${
                      isSelected
                        ? 'bg-[#D4AF37]/12 border border-[#D4AF37]/35'
                        : 'hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37]/20 to-slate-800 border border-[#D4AF37]/25 flex items-center justify-center text-sm font-bold text-[#F3D474] shrink-0">
                        {item.customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {item.customer.name}
                        </p>
                        <p className="text-xs text-slate-400 truncate font-mono-num">
                          {item.customer.phone || 'No phone'}
                          {item.latestDate ? ` · ${formatShortDate(item.latestDate)}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p
                        className={`text-sm font-bold font-mono-num ${
                          bal > 0
                            ? 'text-emerald-400'
                            : bal < 0
                            ? 'text-rose-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {formatPKR(Math.abs(bal))}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {bal > 0 ? 'Lena Hai' : bal < 0 ? 'Dena Hai' : 'Settled'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Customer Ledger Detail Panel */}
        <div
          className={`lg:col-span-7 glass-card rounded-3xl p-5 sm:p-6 ${
            selectedSummary ? 'block' : 'hidden lg:block'
          }`}
        >
          {!selectedSummary ? (
            <div className="py-20 text-center space-y-3">
              <p className="text-base font-semibold text-white">Select a Customer Ledger</p>
              <p className="text-sm text-slate-400 max-w-sm mx-auto">
                Choose any customer on the left to record Udhaar or Cash Received, send a WhatsApp
                reminder, or print a branded PDF statement.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onSelectCustomer(null)}
                    className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white/5 text-slate-300"
                    aria-label="Back to customer list"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedSummary.customer.name}</h2>
                    <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                      <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span className="font-mono-num">
                        {selectedSummary.customer.phone || 'No phone saved'}
                      </span>
                      {selectedSummary.customer.notes && (
                        <>
                          <span>·</span>
                          <span>{selectedSummary.customer.notes}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditCustomerModal(selectedSummary.customer)}
                    className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-slate-300"
                    aria-label="Edit customer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteCustId(selectedSummary.customer.id)}
                    className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                    aria-label="Delete customer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Balance Banner */}
              <div className="p-4 rounded-2xl bg-[#070B19]/85 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-400">
                    {selectedSummary.balance > 0
                      ? 'Net Balance (Lena Hai — Receivable)'
                      : selectedSummary.balance < 0
                      ? 'Net Balance (Dena Hai — Payable)'
                      : 'Account Settled'}
                  </p>
                  <p
                    className={`text-2xl font-extrabold font-mono-num mt-0.5 ${
                      selectedSummary.balance > 0
                        ? 'text-emerald-400'
                        : selectedSummary.balance < 0
                        ? 'text-rose-400'
                        : 'text-slate-300'
                    }`}
                  >
                    {formatPKR(Math.abs(selectedSummary.balance))}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleWhatsAppReminder(selectedSummary.customer, selectedSummary.balance)
                    }
                    className="min-h-[42px] px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-xs font-semibold text-emerald-300 flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp Reminder
                    {!isPro && <Crown className="w-3.5 h-3.5 text-[#F3D474]" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenPdfStatement(selectedSummary.customer.id)}
                    className="min-h-[42px] px-3.5 py-2 rounded-xl bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 border border-[#D4AF37]/35 text-xs font-semibold text-[#F3D474] flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <FileText className="w-4 h-4" />
                    PDF Statement
                    {!isPro && <Crown className="w-3.5 h-3.5 text-[#F3D474]" />}
                  </button>
                </div>
              </div>

              {/* Dual Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => openAddTxModal(selectedSummary.customer.id, 'udhaar')}
                  className="min-h-[48px] px-4 py-3 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-sm font-bold text-rose-300 flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Give Udhaar (Dena Hai)
                </button>
                <button
                  type="button"
                  onClick={() => openAddTxModal(selectedSummary.customer.id, 'jama')}
                  className="min-h-[48px] px-4 py-3 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-sm font-bold text-emerald-300 flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Receive Cash (Lena Hai)
                </button>
              </div>

              {/* Transactions List */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 mb-2">
                  Ledger Entries ({selectedTxs.length})
                </h3>
                {selectedTxs.length === 0 ? (
                  <p className="py-10 text-center text-sm text-slate-400 rounded-2xl bg-[#070B19]/50 border border-slate-800/70">
                    No transactions recorded for {selectedSummary.customer.name} yet.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-800/70 max-h-[360px] overflow-y-auto pr-1">
                    {selectedTxs.map((tx) => (
                      <div
                        key={tx.id}
                        className="py-3 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {tx.note || (tx.type === 'udhaar' ? 'Udhaar Given' : 'Cash Received')}
                          </p>
                          <p className="text-xs text-slate-400">
                            {tx.type === 'udhaar' ? 'Give Udhaar (Dena Hai)' : 'Receive Cash (Lena Hai)'}{' '}
                            · {formatShortDate(tx.date)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-sm font-bold font-mono-num ${
                              tx.type === 'jama' ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {tx.type === 'jama' ? '+' : '-'} {formatPKR(tx.amount)}
                          </span>
                          <button
                            type="button"
                            onClick={() => openEditTxModal(tx)}
                            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                            aria-label="Edit entry"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteTransaction(tx.id);
                              onNotify('Transaction deleted.', 'rose');
                            }}
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                            aria-label="Delete entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Customer Modal */}
      {customerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <form
            onSubmit={handleSaveCustomer}
            className="w-full max-w-md rounded-3xl glass-card gold-border-glow p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h3>
              <button
                type="button"
                onClick={() => setCustomerModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Customer Full Name</label>
              <input
                type="text"
                required
                autoFocus
                value={custName}
                onChange={(e) => setCustName(e.target.value)}
                placeholder="e.g. Tariq Electronics"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#070B19] border border-slate-700 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Phone / WhatsApp Number</label>
              <input
                type="tel"
                value={custPhone}
                onChange={(e) => setCustPhone(e.target.value)}
                placeholder="03XX-XXXXXXX"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#070B19] border border-slate-700 text-sm font-mono-num text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Notes / Shop Address (Optional)</label>
              <input
                type="text"
                value={custNotes}
                onChange={(e) => setCustNotes(e.target.value)}
                placeholder="e.g. Hall Road Wholesale"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#070B19] border border-slate-700 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCustomerModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 text-slate-300 text-sm font-semibold"
              >
                Cancel
              </button>
              <button type="submit" className="flex-1 py-2.5 rounded-xl gold-btn text-sm font-bold">
                {editingCustomer ? 'Save Changes' : 'Create Customer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add / Edit Khata Transaction Modal */}
      {txModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <form
            onSubmit={handleSaveTx}
            className="w-full max-w-md rounded-3xl glass-card gold-border-glow p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {editingTx ? 'Edit Khata Entry' : 'New Khata Entry'}
              </h3>
              <button
                type="button"
                onClick={() => setTxModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#070B19] border border-slate-800">
              <button
                type="button"
                onClick={() => setTxType('udhaar')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-colors ${
                  txType === 'udhaar'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'text-slate-400'
                }`}
              >
                Give Udhaar (Dena)
              </button>
              <button
                type="button"
                onClick={() => setTxType('jama')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-colors ${
                  txType === 'jama'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400'
                }`}
              >
                Receive Cash (Lena)
              </button>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Amount (PKR)</label>
              <input
                type="number"
                required
                min={1}
                autoFocus
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#070B19] border border-slate-700 text-lg font-bold font-mono-num text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Date</label>
                <input
                  type="date"
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#070B19] border border-slate-700 text-xs font-mono-num text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Customer</label>
                <select
                  value={txCustomerId}
                  onChange={(e) => setTxCustomerId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#070B19] border border-slate-700 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Note / Bill Details</label>
              <input
                type="text"
                value={txNote}
                onChange={(e) => setTxNote(e.target.value)}
                placeholder="e.g. Invoice #104 or Cash installment"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#070B19] border border-slate-700 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setTxModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 text-slate-300 text-sm font-semibold"
              >
                Cancel
              </button>
              <button type="submit" className="flex-1 py-2.5 rounded-xl gold-btn text-sm font-bold">
                {editingTx ? 'Update Entry' : 'Save Entry'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirm Delete Customer Modal */}
      {confirmDeleteCustId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl glass-card border border-rose-500/40 p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Delete Customer Ledger?</h3>
            <p className="text-sm text-slate-300">
              This removes the customer and all their Khata transactions permanently from this device.
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmDeleteCustId(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 text-slate-300 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteCustomer(confirmDeleteCustId);
                  setConfirmDeleteCustId(null);
                  onNotify('Customer ledger removed.', 'rose');
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-sm font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
