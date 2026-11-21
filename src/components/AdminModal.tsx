import React, { useState } from 'react';
import {
  Check,
  Copy,
  KeyRound,
  Lock,
  Save,
  Settings2,
  Shield,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import { AppSettings, ApprovedLogItem, PaymentSettings } from '../types';
import { generateApprovalToken } from '../utils/cryptoAndFormat';

interface AdminModalProps {
  isOpen: boolean;
  appSettings: AppSettings;
  paymentSettings: PaymentSettings;
  approvedLogs: ApprovedLogItem[];
  onUpdateAppSettings: (next: AppSettings) => void;
  onUpdatePaymentSettings: (next: PaymentSettings) => void;
  onAddApprovedLog: (item: ApprovedLogItem) => void;
  onClearApprovedLogs: () => void;
  onClose: () => void;
  onNotify: (msg: string, tone?: 'gold' | 'emerald' | 'rose') => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  appSettings,
  paymentSettings,
  approvedLogs,
  onUpdateAppSettings,
  onUpdatePaymentSettings,
  onAddApprovedLog,
  onClearApprovedLogs,
  onClose,
  onNotify,
}) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Tab inside Admin Panel
  const [adminTab, setAdminTab] = useState<'generator' | 'payment' | 'logs'>('generator');

  // Approval Generator State
  const [custTid, setCustTid] = useState('');
  const [custDeviceHash, setCustDeviceHash] = useState('');
  const [custName, setCustName] = useState('');
  const [generatedToken, setGeneratedToken] = useState('');
  const [copiedToken, setCopiedToken] = useState(false);

  // Payment Editor State
  const [easypaisaNumber, setEasypaisaNumber] = useState(paymentSettings.easypaisaNumber);
  const [accountTitle, setAccountTitle] = useState(paymentSettings.accountTitle);
  const [whatsappNumber, setWhatsappNumber] = useState(paymentSettings.whatsappNumber);
  const [feeAmount, setFeeAmount] = useState(String(paymentSettings.feeAmount));
  const [newAdminPin, setNewAdminPin] = useState(appSettings.adminPin);

  if (!isOpen) return null;

  const handleClose = () => {
    setAuthenticated(false);
    setPinInput('');
    setPinError('');
    onClose();
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === appSettings.adminPin) {
      setAuthenticated(true);
      setPinError('');
      setEasypaisaNumber(paymentSettings.easypaisaNumber);
      setAccountTitle(paymentSettings.accountTitle);
      setWhatsappNumber(paymentSettings.whatsappNumber);
      setFeeAmount(String(paymentSettings.feeAmount));
      setNewAdminPin(appSettings.adminPin);
    } else {
      setPinError('Incorrect Owner Admin PIN.');
    }
  };

  const handleGenerateToken = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTid = custTid.replace(/\D/g, '');
    const cleanDevice = custDeviceHash.trim().toUpperCase();
    if (!/^\d{11}$/.test(cleanTid)) {
      onNotify('Customer TID must be exactly 11 digits.', 'rose');
      return;
    }
    if (cleanDevice.length < 4) {
      onNotify('Please enter the customer Device Token / Hash.', 'rose');
      return;
    }

    const token = generateApprovalToken(cleanTid, cleanDevice);
    setGeneratedToken(token);

    const logItem: ApprovedLogItem = {
      id: `log-${Date.now()}`,
      tid: cleanTid,
      deviceHash: cleanDevice,
      token,
      customerName: custName.trim() || undefined,
      approvedAt: new Date().toISOString(),
    };
    onAddApprovedLog(logItem);
    onNotify('Device-locked Approval Token generated & logged!', 'gold');
  };

  const handleCopyToken = async (tokenText: string) => {
    try {
      await navigator.clipboard.writeText(tokenText);
      setCopiedToken(true);
      onNotify('Approval Token copied!', 'gold');
      setTimeout(() => setCopiedToken(false), 2000);
    } catch {
      onNotify(`Token: ${tokenText}`, 'gold');
    }
  };

  const handleSavePaymentSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedFee = Number(feeAmount);
    if (!easypaisaNumber.trim() || !accountTitle.trim() || !whatsappNumber.trim() || Number.isNaN(parsedFee) || parsedFee <= 0) {
      onNotify('Please fill all payment fields with valid values.', 'rose');
      return;
    }
    onUpdatePaymentSettings({
      easypaisaNumber: easypaisaNumber.trim(),
      accountTitle: accountTitle.trim(),
      whatsappNumber: whatsappNumber.trim(),
      feeAmount: Math.round(parsedFee),
    });

    if (newAdminPin.trim().length >= 4 && newAdminPin.trim() !== appSettings.adminPin) {
      onUpdateAppSettings({
        ...appSettings,
        adminPin: newAdminPin.trim(),
      });
    }
    onNotify('Live payment & admin settings saved!', 'emerald');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl my-auto rounded-3xl glass-card gold-border-glow overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

        {!authenticated ? (
          <form onSubmit={handleVerifyPin} className="p-6 sm:p-8 space-y-5 max-w-md mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-[#F3D474]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Owner Admin Access</h2>
                  <p className="text-xs text-slate-400">Enter security PIN to unlock console</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
                aria-label="Close Admin PIN"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Owner PIN</label>
              <input
                type="password"
                inputMode="numeric"
                autoFocus
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Enter PIN (default: 7860)"
                className="w-full px-4 py-3 rounded-xl bg-[#070B19] border border-slate-700 text-center text-lg tracking-[0.4em] font-mono-num text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            {pinError && <p className="text-xs text-rose-400 text-center">{pinError}</p>}

            <button
              type="submit"
              className="w-full min-h-[46px] rounded-xl gold-btn font-bold text-sm flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              Unlock Owner Console
            </button>
          </form>
        ) : (
          <div className="p-5 sm:p-7 space-y-5 max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-[#F3D474]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">HisabxPro Owner Console</h2>
                  <p className="text-xs text-slate-400">
                    Generate device-locked tokens &amp; manage live EasyPaisa settings
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-Navigation */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#070B19]/90 border border-slate-800">
              <button
                type="button"
                onClick={() => setAdminTab('generator')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                  adminTab === 'generator'
                    ? 'bg-[#D4AF37]/20 text-[#F3D474] border border-[#D4AF37]/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                Approval Generator
              </button>
              <button
                type="button"
                onClick={() => setAdminTab('payment')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                  adminTab === 'payment'
                    ? 'bg-[#D4AF37]/20 text-[#F3D474] border border-[#D4AF37]/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Settings2 className="w-3.5 h-3.5" />
                Payment &amp; PIN
              </button>
              <button
                type="button"
                onClick={() => setAdminTab('logs')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                  adminTab === 'logs'
                    ? 'bg-[#D4AF37]/20 text-[#F3D474] border border-[#D4AF37]/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                Approved Log ({approvedLogs.length})
              </button>
            </div>

            {adminTab === 'generator' && (
              <form onSubmit={handleGenerateToken} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Customer 11-Digit TID</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={11}
                      value={custTid}
                      onChange={(e) => setCustTid(e.target.value.replace(/\D/g, '').slice(0, 11))}
                      placeholder="e.g. 24819043211"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#070B19] border border-slate-700 text-sm font-mono-num text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Device Token (Hash)</label>
                    <input
                      type="text"
                      value={custDeviceHash}
                      onChange={(e) => setCustDeviceHash(e.target.value.toUpperCase())}
                      placeholder="e.g. HX-7A3F9B21"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#070B19] border border-slate-700 text-sm font-mono-num text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Customer Name (Optional)</label>
                    <input
                      type="text"
                      value={custName}
                      onChange={(e) => setCustName(e.target.value)}
                      placeholder="e.g. Ali Raza"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#070B19] border border-slate-700 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full min-h-[46px] rounded-xl gold-btn font-bold text-sm flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  Generate Device-Locked Approval Token
                </button>

                {generatedToken && (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/35 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-emerald-300">Issued Device-Locked Token</p>
                      <p className="text-xl font-bold text-white font-mono-num tracking-wider mt-0.5">
                        {generatedToken}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyToken(generatedToken)}
                      className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-500 text-[#070B19] font-bold text-xs flex items-center gap-1.5 hover:bg-emerald-400 transition-colors"
                    >
                      {copiedToken ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copiedToken ? 'Copied!' : 'Copy Token'}
                    </button>
                  </div>
                )}
              </form>
            )}

            {adminTab === 'payment' && (
              <form onSubmit={handleSavePaymentSettings} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">EasyPaisa Account Number</label>
                    <input
                      type="text"
                      value={easypaisaNumber}
                      onChange={(e) => setEasypaisaNumber(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#070B19] border border-slate-700 text-sm font-mono-num text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Account Title</label>
                    <input
                      type="text"
                      value={accountTitle}
                      onChange={(e) => setAccountTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#070B19] border border-slate-700 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">WhatsApp Verification Number</label>
                    <input
                      type="text"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#070B19] border border-slate-700 text-sm font-mono-num text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Lifetime Fee (PKR)</label>
                    <input
                      type="number"
                      min={1}
                      value={feeAmount}
                      onChange={(e) => setFeeAmount(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#070B19] border border-slate-700 text-sm font-mono-num text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800">
                  <label className="block text-xs text-slate-400 mb-1">Change Owner Admin PIN (min 4 digits)</label>
                  <input
                    type="text"
                    value={newAdminPin}
                    onChange={(e) => setNewAdminPin(e.target.value.replace(/\s/g, ''))}
                    className="w-full sm:w-64 px-3.5 py-2.5 rounded-xl bg-[#070B19] border border-slate-700 text-sm font-mono-num text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full min-h-[46px] rounded-xl gold-btn font-bold text-sm flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Live Payment &amp; PIN Settings
                </button>
              </form>
            )}

            {adminTab === 'logs' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">History of all issued device-locked approvals</p>
                  {approvedLogs.length > 0 && (
                    <button
                      type="button"
                      onClick={onClearApprovedLogs}
                      className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Clear Log
                    </button>
                  )}
                </div>

                {approvedLogs.length === 0 ? (
                  <div className="py-10 text-center text-sm text-slate-400 rounded-2xl bg-[#070B19]/60 border border-slate-800">
                    No customer approvals generated yet.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {approvedLogs.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl bg-[#070B19]/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="space-y-0.5">
                          <div className="text-xs font-semibold text-white">
                            {item.customerName || 'Pro Customer'}{' '}
                            <span className="text-slate-500">·</span>{' '}
                            <span className="font-mono-num text-[#F3D474]">TID {item.tid}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono-num">
                            Device: {item.deviceHash} · {new Date(item.approvedAt).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono-num text-emerald-400 font-semibold">
                            {item.token}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyToken(item.token)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300"
                            aria-label="Copy token"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
