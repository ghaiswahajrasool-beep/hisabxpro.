import React, { useEffect, useState } from 'react';
import {
  Check,
  Copy,
  Crown,
  ExternalLink,
  FileText,
  KeyRound,
  Lock,
  MessageCircle,
  ShieldCheck,
  Smartphone,
  X,
} from 'lucide-react';
import { PaymentSettings, PendingVerification, ProActivation } from '../types';
import {
  formatPKR,
  formatWhatsAppPhone,
  openExternalLink,
  verifyApprovalToken,
} from '../utils/cryptoAndFormat';

interface UpgradeModalProps {
  isOpen: boolean;
  triggeredFeature?: string;
  deviceHash: string;
  paymentSettings: PaymentSettings;
  pendingVerification: PendingVerification | null;
  onSavePending: (pending: PendingVerification) => void;
  onActivatePro: (activation: ProActivation) => void;
  onClose: () => void;
  onNotify: (msg: string, tone?: 'gold' | 'emerald' | 'rose') => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  triggeredFeature,
  deviceHash,
  paymentSettings,
  pendingVerification,
  onSavePending,
  onActivatePro,
  onClose,
  onNotify,
}) => {
  const [fullName, setFullName] = useState(pendingVerification?.fullName || '');
  const [mobile, setMobile] = useState(pendingVerification?.mobile || '');
  const [tid, setTid] = useState(pendingVerification?.tid || '');
  const [approvalToken, setApprovalToken] = useState('');
  const [copiedNum, setCopiedNum] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [waDispatched, setWaDispatched] = useState(Boolean(pendingVerification));
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    if (isOpen) {
      setErrorText('');
      if (pendingVerification) {
        setFullName(pendingVerification.fullName);
        setMobile(pendingVerification.mobile);
        setTid(pendingVerification.tid);
        setWaDispatched(true);
      }
    }
  }, [isOpen, pendingVerification]);

  if (!isOpen) return null;

  const cleanTid = tid.replace(/\D/g, '');
  const waMessage = `Assalam-o-Alaikum ${paymentSettings.accountTitle}! I have sent Rs. ${paymentSettings.feeAmount} for HisabxPro Lifetime Pro. Name: ${fullName.trim() || '[Name]'}, Mobile: ${mobile.trim() || '[Mobile]'}, EasyPaisa TID: ${cleanTid || '[TID]'}, Device Token: ${deviceHash}. Please approve my Pro account.`;
  const waPhone = formatWhatsAppPhone(paymentSettings.whatsappNumber);
  const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(waMessage)}`;

  const handleCopyNumber = async () => {
    try {
      await navigator.clipboard.writeText(paymentSettings.easypaisaNumber);
      setCopiedNum(true);
      onNotify('Copied! EasyPaisa number copied to clipboard.', 'gold');
      setTimeout(() => setCopiedNum(false), 2200);
    } catch {
      onNotify(`EasyPaisa: ${paymentSettings.easypaisaNumber}`, 'gold');
    }
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(waMessage);
      setCopiedMsg(true);
      onNotify('WhatsApp verification message copied!', 'emerald');
      setTimeout(() => setCopiedMsg(false), 2200);
    } catch {
      onNotify('Please copy the details manually.', 'rose');
    }
  };

  const handleVerifyOnWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');

    if (fullName.trim().length < 2) {
      setErrorText('Please enter your Full Name.');
      return;
    }
    const cleanMob = mobile.replace(/\D/g, '');
    if (cleanMob.length < 10) {
      setErrorText('Please enter a valid Sender Mobile Number.');
      return;
    }
    if (!/^\d{11}$/.test(cleanTid)) {
      setErrorText('EasyPaisa Transaction ID (TID) must be exactly 11 digits.');
      return;
    }

    const pending: PendingVerification = {
      fullName: fullName.trim(),
      mobile: mobile.trim(),
      tid: cleanTid,
      deviceHash,
      submittedAt: new Date().toISOString(),
    };
    onSavePending(pending);
    setWaDispatched(true);
    openExternalLink(waUrl);
    onNotify('Device bound to TID! Opening WhatsApp verification...', 'emerald');
  };

  const handleActivateToken = () => {
    setErrorText('');
    const targetTid = cleanTid || pendingVerification?.tid || '';
    if (!/^\d{11}$/.test(targetTid)) {
      setErrorText('Enter your 11-digit EasyPaisa TID in Step 1 first.');
      return;
    }
    if (!approvalToken.trim()) {
      setErrorText('Please enter the Approval Token sent to you on WhatsApp.');
      return;
    }

    const isValid = verifyApprovalToken(targetTid, deviceHash, approvalToken);
    if (!isValid) {
      setErrorText(
        'Invalid Approval Token for this TID & Device. Tokens are strictly device-locked and cannot be shared.'
      );
      return;
    }

    onActivatePro({
      activated: true,
      tid: targetTid,
      deviceHash,
      token: approvalToken.trim().toUpperCase(),
      activatedAt: new Date().toISOString(),
    });
    onNotify('HisabxPro Lifetime Pro unlocked permanently on this device!', 'gold');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
    >
      <div className="relative w-full max-w-2xl my-auto rounded-3xl glass-card gold-border-glow overflow-hidden">
        {/* Top Ambient Gold Rim */}
        <div className="h-1 w-full bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

        <div className="p-5 sm:p-7 max-h-[90vh] overflow-y-auto space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F3D474]/25 to-[#D4AF37]/10 border border-[#D4AF37]/40 flex items-center justify-center shrink-0">
                <Crown className="w-6 h-6 text-[#F3D474]" />
              </div>
              <div>
                <h2 id="upgrade-modal-title" className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Upgrade to <span className="gold-gradient-text">HisabxPro</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                  {triggeredFeature
                    ? `Unlock "${triggeredFeature}" and all executive tools permanently.`
                    : 'One-time Lifetime Pro unlock. Zero monthly subscriptions.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close upgrade modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Pro Benefits Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-200">
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.03] border border-slate-800">
              <Crown className="w-4 h-4 text-[#F3D474] shrink-0" />
              <span>Unlimited Customers, Khata &amp; Expense Entries</span>
            </div>
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.03] border border-slate-800">
              <FileText className="w-4 h-4 text-[#F3D474] shrink-0" />
              <span>1-Click Branded PDF Invoices &amp; Reports</span>
            </div>
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.03] border border-slate-800">
              <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>1-Click Urdu + English WhatsApp Udhaar Reminders</span>
            </div>
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.03] border border-slate-800">
              <Lock className="w-4 h-4 text-[#F3D474] shrink-0" />
              <span>4-Digit App Security PIN + CSV/JSON Backup</span>
            </div>
          </div>

          {/* Payment Details Card */}
          <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-[#121A33]/90 to-[#0A0F20]/95 border border-[#D4AF37]/35">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
              <span className="text-xs font-semibold text-[#F3D474] tracking-wide">
                EasyPaisa Lifetime Payment Details
              </span>
              <span className="text-sm font-bold text-emerald-400 font-mono-num">
                Lifetime Fee: {formatPKR(paymentSettings.feeAmount)}
              </span>
            </div>

            <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <p className="text-xs text-slate-400">EasyPaisa Account Number</p>
                <div className="flex items-center gap-2.5 mt-1">
                  <span className="text-lg sm:text-xl font-bold text-white font-mono-num tracking-wider">
                    {paymentSettings.easypaisaNumber}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyNumber}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#D4AF37]/15 text-[#F3D474] border border-[#D4AF37]/40 hover:bg-[#D4AF37]/25 transition-colors whitespace-nowrap"
                  >
                    {copiedNum ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedNum ? 'Copied!' : 'Copy Number'}
                  </button>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400">Account Title &amp; Device Lock</p>
                <p className="text-base font-semibold text-white mt-0.5">{paymentSettings.accountTitle}</p>
                <p className="text-[11px] text-slate-400 font-mono-num mt-0.5 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Device Hash: <span className="text-slate-200">{deviceHash}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Step 1 & 2 Form */}
          <form onSubmit={handleVerifyOnWhatsApp} className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                Step 1 &amp; 2: Enter Payment Details &amp; Verify on WhatsApp
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ali Raza"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070B19]/90 border border-slate-700/80 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Sender Mobile</label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="03XX-XXXXXXX"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070B19]/90 border border-slate-700/80 text-sm text-white font-mono-num placeholder:text-slate-500 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">11-Digit EasyPaisa TID</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={11}
                  value={tid}
                  onChange={(e) => setTid(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  placeholder="e.g. 24819043211"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070B19]/90 border border-slate-700/80 text-sm text-white font-mono-num placeholder:text-slate-500 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="submit"
                className="flex-1 min-h-[46px] px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#070B19] font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-500/20"
              >
                <MessageCircle className="w-4 h-4" />
                Verify Payment on WhatsApp
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              {waDispatched && (
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="min-h-[46px] px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  {copiedMsg ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedMsg ? 'Message Copied' : 'Copy WA Text'}
                </button>
              )}
            </div>
          </form>

          {/* Activation Token Input */}
          <div className="pt-4 border-t border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#F3D474]" />
                Enter Approval Token
              </h3>
              <span className="text-[11px] text-slate-400">Locked to Device {deviceHash}</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                value={approvalToken}
                onChange={(e) => setApprovalToken(e.target.value.toUpperCase())}
                placeholder="HXP-XXXX-XXXX-XXXX"
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#070B19]/90 border border-[#D4AF37]/40 text-sm text-[#FDE68A] font-mono-num tracking-wider placeholder:text-slate-500 focus:outline-none focus:border-[#D4AF37]"
              />
              <button
                type="button"
                onClick={handleActivateToken}
                className="min-h-[46px] px-6 py-2.5 rounded-xl gold-btn font-bold text-sm flex items-center justify-center gap-2 transition-all whitespace-nowrap"
              >
                <ShieldCheck className="w-4 h-4" />
                Activate Lifetime Pro
              </button>
            </div>

            {errorText && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3.5 py-2.5">
                {errorText}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
