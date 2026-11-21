export function formatPKR(amount: number, options?: { showSign?: boolean; compact?: boolean }): string {
  const abs = Math.abs(Math.round(amount));
  const formatted = abs.toLocaleString('en-PK');
  const sign = options?.showSign ? (amount > 0 ? '+' : amount < 0 ? '-' : '') : amount < 0 ? '-' : '';
  return `${sign}Rs. ${formatted}`;
}

export function formatShortDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatWhatsAppPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('92')) return digits;
  if (digits.startsWith('0')) return `92${digits.slice(1)}`;
  if (digits.length === 10 && digits.startsWith('3')) return `92${digits}`;
  return digits;
}

export function openExternalLink(url: string): void {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

const DEVICE_SALT_KEY = 'hisabxpro_device_hw_salt_v1';

function fnv1a32(input: string, seed = 0x811c9dc5): number {
  let hash = seed >>> 0;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/**
 * Generates a deterministic Device Hardware Fingerprint bound to this browser/device.
 * Uses hardware traits + a persistent installation salt so it stays stable across reloads
 * on this device while differing across any other device.
 */
export function getDeviceFingerprint(): string {
  let installSalt = '';
  try {
    installSalt = localStorage.getItem(DEVICE_SALT_KEY) || '';
    if (!installSalt) {
      const rand =
        typeof crypto !== 'undefined' && crypto.getRandomValues
          ? Array.from(crypto.getRandomValues(new Uint8Array(8)))
              .map((b) => b.toString(16).padStart(2, '0'))
              .join('')
          : `${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`;
      installSalt = rand.toUpperCase();
      localStorage.setItem(DEVICE_SALT_KEY, installSalt);
    }
  } catch {
    installSalt = 'FALLBACK-SALT';
  }

  const hwTraits = [
    navigator.userAgent || 'ua',
    navigator.platform || 'plat',
    `${window.screen?.width || 0}x${window.screen?.height || 0}`,
    String(window.screen?.colorDepth || 24),
    String(navigator.hardwareConcurrency || 4),
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    installSalt,
  ].join('|');

  const h1 = fnv1a32(hwTraits, 0x811c9dc5);
  const h2 = fnv1a32(hwTraits.split('').reverse().join(''), 0x9e3779b9);
  const combined = ((h1 ^ (h2 >>> 3)) >>> 0).toString(16).toUpperCase().padStart(8, '0');
  return `HX-${combined}`;
}

const APPROVAL_MASTER_SECRET = 'HISABXPRO_OBSIDIAN_GOLD_2026_V1';

/**
 * Deterministic Device-Locked Approval Token Generator.
 * Binds an 11-digit EasyPaisa TID + Device Hash into a unique HXP-XXXX-XXXX-XXXX key.
 * Only works on the device matching `deviceHash` and the matching `tid`.
 */
export function generateApprovalToken(tid: string, deviceHash: string): string {
  const cleanTid = tid.replace(/\s+/g, '').toUpperCase();
  const cleanDevice = deviceHash.trim().toUpperCase();
  const payload = `${cleanTid}::${cleanDevice}::${APPROVAL_MASTER_SECRET}`;

  const seg1 = fnv1a32(payload, 0x811c9dc5);
  const seg2 = fnv1a32(`${APPROVAL_MASTER_SECRET}|${cleanDevice}|${cleanTid}`, 0x9e3779b9);
  const seg3 = fnv1a32(`${cleanTid}#${seg1.toString(16)}#${cleanDevice}`, 0x517cc1b7);

  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const encodeBlock = (num: number): string => {
    let n = num >>> 0;
    let out = '';
    for (let i = 0; i < 4; i++) {
      out += alphabet[n % alphabet.length];
      n = Math.floor(n / alphabet.length) ^ ((num >>> (i * 5)) & 0x1f);
    }
    return out;
  };

  return `HXP-${encodeBlock(seg1)}-${encodeBlock(seg2)}-${encodeBlock(seg3)}`;
}

export function verifyApprovalToken(tid: string, deviceHash: string, candidateToken: string): boolean {
  const normalizedTid = tid.replace(/\s+/g, '');
  if (!/^\d{11}$/.test(normalizedTid)) return false;
  const expected = generateApprovalToken(normalizedTid, deviceHash);
  return candidateToken.trim().toUpperCase() === expected;
}
