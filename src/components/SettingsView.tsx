import React, { useRef, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  Crown,
  Download,
  FileSpreadsheet,
  FileText,
  Lock,
  RotateCcw,
  Save,
  ShieldCheck,
  Smartphone,
  Trash2,
  Upload,
} from 'lucide-react';
import { AppSettings, ProActivation } from '../types';

interface SettingsViewProps {
  isPro: boolean;
  proActivation: ProActivation | null;
  deviceHash: string;
  totalEntriesUsed: number;
  freeLimit: number;
  appSettings: AppSettings;
  onUpdateAppSettings: (next: AppSettings) => void;
  onOpenUpgrade: (feature?: string) => void;
  onExportCsv: () => void;
  onExportJson: () => void;
  onImportJson: (jsonText: string) => void;
  onOpenPdfReport: () => void;
  onLockNow: () => void;
  onResetDemoData: () => void;
  onClearAllData: () => void;
  onNotify: (msg: string, tone?: 'gold' | 'emerald' | 'rose') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  isPro,
  proActivation,
  deviceHash,
  totalEntriesUsed,
  freeLimit,
  appSettings,
  onUpdateAppSettings,
  onOpenUpgrade,
  onExportCsv,
  onExportJson,
  onImportJson,
  onOpenPdfReport,
  onLockNow,
  onResetDemoData,
  onClearAllData,
  onNotify,
}) => {
  const [businessName, setBusinessName] = useState(appSettings.businessName);
  const [ownerName, setOwnerName] = useState(appSettings.ownerName);
  const [monthlyBudget, setMonthlyBudget] = useState(String(appSettings.monthlyBudget));
  const [pinDraft, setPinDraft] = useState(appSettings.appPin || '1234');
  const [confirmAction, setConfirmAction] = useState<'reset' | 'clear' | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedBudget = Number(monthlyBudget);
    onUpdateAppSettings({
      ...appSettings,
      businessName: businessName.trim() || 'HisabxPro Ledger',
      ownerName: ownerName.trim() || 'Account Owner',
      monthlyBudget: Number.isNaN(parsedBudget) || parsedBudget <= 0 ? 120000 : Math.round(parsedBudget),
    });
    onNotify('Business & profile preferences saved!', 'emerald');
  };

  const handleTogglePinLock = () => {
    if (!isPro) {
      onOpenUpgrade('4-Digit App Security PIN Lock');
      return;
    }
    const nextEnabled = !appSettings.appPinEnabled;
    if (nextEnabled && !/^\d{4}$/.test(pinDraft)) {
      onNotify('Enter a valid 4-digit numeric PIN first.', 'rose');
      return;
    }
    onUpdateAppSettings({
      ...appSettings,
      appPinEnabled: nextEnabled,
      appPin: /^\d{4}$/.test(pinDraft) ? pinDraft : appSettings.appPin,
    });
    onNotify(
      nextEnabled ? '4-Digit App Security PIN enabled!' : 'App Security PIN disabled.',
      'emerald'
    );
  };

  const handleUpdatePinCode = () => {
    if (!isPro) {
      onOpenUpgrade('4-Digit App Security PIN Lock');
      return;
    }
    if (!/^\d{4}$/.test(pinDraft)) {
      onNotify('Security PIN must be exactly 4 digits.', 'rose');
      return;
    }
    onUpdateAppSettings({
      ...appSettings,
      appPin: pinDraft,
    });
    onNotify('App Security PIN updated!', 'emerald');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      onImportJson(text);
    } catch {
      onNotify('Failed to read backup file.', 'rose');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Pro License Status Card */}
      <div className="glass-card gold-border-glow rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center shrink-0">
            <Crown className="w-6 h-6 text-[#F3D474]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">
                {isPro ? 'HisabxPro Lifetime Pro Active' : 'HisabxPro Free Plan'}
              </h2>
              {isPro && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            </div>
            {isPro && proActivation ? (
              <p className="text-xs text-slate-300 font-mono-num mt-1">
                TID: {proActivation.tid} · Device Locked: {deviceHash}
              </p>
            ) : (
              <p className="text-xs text-slate-300 mt-1">
                {totalEntriesUsed} of {freeLimit} free entries used · Upgrade for unlimited entries,
                WhatsApp reminders, PDF statements, CSV/JSON backup &amp; PIN Lock.
              </p>
            )}
          </div>
        </div>

        {!isPro && (
          <button
            type="button"
            onClick={() => onOpenUpgrade('Lifetime Pro')}
            className="min-h-[44px] px-5 py-2.5 rounded-xl gold-btn text-xs font-bold whitespace-nowrap shrink-0"
          >
            Unlock Lifetime Pro
          </button>
        )}
      </div>

      {/* Business & Profile Settings */}
      <form onSubmit={handleSaveProfile} className="glass-card-subtle rounded-3xl p-5 sm:p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#F3D474]" />
          Business &amp; Ledger Identity
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Business / Home Title</label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#070B19] border border-slate-700 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Owner Name (for PDFs)</label>
            <input
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#070B19] border border-slate-700 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Monthly Budget (PKR)</label>
            <input
              type="number"
              min={1}
              value={monthlyBudget}
              onChange={(e) => setMonthlyBudget(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#070B19] border border-slate-700 text-sm font-mono-num text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
        </div>
        <button
          type="submit"
          className="min-h-[42px] px-5 py-2 rounded-xl gold-btn text-xs font-bold inline-flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save Preferences
        </button>
      </form>

      {/* Pro Security: 4-Digit App PIN Lock */}
      <div className="glass-card-subtle rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#F3D474]" />
              4-Digit App Security PIN Lock
              {!isPro && <Crown className="w-4 h-4 text-[#F3D474]" />}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Require a 4-digit security code whenever HisabxPro opens.
            </p>
          </div>

          <button
            type="button"
            onClick={handleTogglePinLock}
            className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
              appSettings.appPinEnabled
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-white/5 text-slate-300 border-slate-700 hover:bg-white/10'
            }`}
          >
            {appSettings.appPinEnabled ? 'PIN Lock Enabled' : 'Enable PIN Lock'}
          </button>
        </div>

        <div className="flex flex-wrap items-end gap-3 pt-2 border-t border-slate-800/80">
          <div>
            <label className="block text-xs text-slate-400 mb-1">4-Digit Security PIN</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pinDraft}
              onChange={(e) => setPinDraft(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="w-36 px-3.5 py-2 rounded-xl bg-[#070B19] border border-slate-700 text-center text-base tracking-[0.4em] font-mono-num text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
          <button
            type="button"
            onClick={handleUpdatePinCode}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-slate-700 text-xs font-semibold text-white"
          >
            Update PIN
          </button>
          {appSettings.appPinEnabled && isPro && (
            <button
              type="button"
              onClick={onLockNow}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 border border-[#D4AF37]/40 text-xs font-semibold text-[#F3D474]"
            >
              Lock App Now
            </button>
          )}
        </div>
      </div>

      {/* Pro Backup & Export Suite */}
      <div className="glass-card-subtle rounded-3xl p-5 sm:p-6 space-y-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#F3D474]" />
            Executive Exports, Backup &amp; Restore
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-[#D4AF37]" />
            Current Device Fingerprint: <span className="font-mono-num text-slate-200">{deviceHash}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={onOpenPdfReport}
            className="min-h-[48px] px-4 py-3 rounded-2xl bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 border border-[#D4AF37]/40 text-xs font-bold text-[#F3D474] flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" />
            PDF Statement
            {!isPro && <Crown className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={onExportCsv}
            className="min-h-[48px] px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-slate-700 text-xs font-bold text-white flex items-center justify-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Excel (CSV)
            {!isPro && <Crown className="w-3.5 h-3.5 text-[#F3D474]" />}
          </button>

          <button
            type="button"
            onClick={onExportJson}
            className="min-h-[48px] px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-slate-700 text-xs font-bold text-white flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4 text-sky-400" />
            JSON Backup
            {!isPro && <Crown className="w-3.5 h-3.5 text-[#F3D474]" />}
          </button>

          <button
            type="button"
            onClick={() => {
              if (!isPro) {
                onOpenUpgrade('JSON Backup & Restore');
                return;
              }
              fileInputRef.current?.click();
            }}
            className="min-h-[48px] px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-slate-700 text-xs font-bold text-white flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4 text-[#F3D474]" />
            Restore JSON
            {!isPro && <Crown className="w-3.5 h-3.5 text-[#F3D474]" />}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Data Reset / Clear */}
      <div className="glass-card-subtle rounded-3xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white">Local Ledger Storage</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            All data is stored privately on this device. Reset sample entries or wipe clean anytime.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setConfirmAction('reset')}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restore Sample Data
          </button>
          <button
            type="button"
            onClick={() => setConfirmAction('clear')}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 text-xs font-semibold text-rose-300 flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear All Data
          </button>
        </div>
      </div>

      {/* In-App Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl glass-card gold-border-glow p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">
              {confirmAction === 'reset' ? 'Restore Sample Data?' : 'Clear All Ledger Data?'}
            </h3>
            <p className="text-sm text-slate-300">
              {confirmAction === 'reset'
                ? 'This will replace current customers and expenses with the starter sample ledger.'
                : 'This will permanently delete all customers, Khata transactions, and expenses from local storage.'}
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 text-slate-300 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmAction === 'reset') onResetDemoData();
                  else onClearAllData();
                  setConfirmAction(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-sm font-bold"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
