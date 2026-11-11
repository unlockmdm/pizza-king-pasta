// Browser side of the Square checkout: loads the Web Payments SDK and talks to /api/pay.
// When the Square env vars are missing (e.g. the GitHub Pages demo build) the checkout stays a demo.

const APP_ID = (import.meta.env.VITE_SQUARE_APP_ID as string | undefined) || '';
const LOCATION_ID = (import.meta.env.VITE_SQUARE_LOCATION_ID as string | undefined) || '';

export const SQUARE_ENABLED = !!(APP_ID && LOCATION_ID);
export const SQUARE_SANDBOX = APP_ID.startsWith('sandbox-');

/** True in Safari (macOS and every iOS browser that isn't Chrome/Firefox/Edge/Opera). Google Pay is hidden there; Apple Pay covers it. */
export function isSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /Safari\//.test(ua) && !/Chrome|Chromium|CriOS|FxiOS|EdgiOS|EdgA?\/|OPR\/|OPiOS|Android|SamsungBrowser/.test(ua);
}

const SDK_URL = SQUARE_SANDBOX ? 'https://sandbox.web.squarecdn.com/v1/square.js' : 'https://web.squarecdn.com/v1/square.js';

/* Minimal typings for the parts of the Web Payments SDK we use. */
export interface TokenResult { status: string; token?: string; errors?: { message?: string; field?: string }[]; details?: unknown }
export interface SqCardState { isCompletelyValid?: boolean; isEmpty?: boolean; hasErrors?: boolean }
export interface SqCardEvent { detail?: { field?: string; currentState?: SqCardState } }
export interface SqCard { attach(sel: string | HTMLElement): Promise<void>; addEventListener?(name: string, cb: (e: SqCardEvent) => void): void; tokenize(v?: unknown): Promise<TokenResult>; destroy(): Promise<boolean> }
export interface SqWallet { attach?(sel: string | HTMLElement, o?: unknown): Promise<void>; tokenize(): Promise<TokenResult>; destroy(): Promise<boolean> }
export interface SqPaymentRequest { update(o: unknown): boolean }
export interface SqPayments {
  card(o?: unknown): Promise<SqCard>;
  googlePay(r: SqPaymentRequest): Promise<SqWallet>;
  applePay(r: SqPaymentRequest): Promise<SqWallet>;
  paymentRequest(o: unknown): SqPaymentRequest;
  verifyBuyer(token: string, details: unknown): Promise<{ token?: string }>;
}
declare global { interface Window { Square?: { payments(appId: string, locationId: string): SqPayments } } }

let sdk: Promise<SqPayments> | null = null;
/** Load square.js once and create the payments object. */
export function loadSquare(): Promise<SqPayments> {
  if (!SQUARE_ENABLED) return Promise.reject(new Error('Square is not configured'));
  if (!sdk) {
    sdk = new Promise<SqPayments>((resolve, reject) => {
      const ready = () => (window.Square ? resolve(window.Square.payments(APP_ID, LOCATION_ID)) : reject(new Error('Square failed to load')));
      if (window.Square) return ready();
      const s = document.createElement('script');
      s.src = SDK_URL;
      s.async = true;
      s.onload = ready;
      s.onerror = () => { sdk = null; reject(new Error('The payment form couldn’t load. Check your connection and try again.')); };
      document.head.appendChild(s);
    });
  }
  return sdk;
}

/** Card element styled to sit inside the checkout's grey field. */
export const CARD_STYLE = {
  '.input-container': { borderColor: '#E4E4E7', borderRadius: '16px' },
  '.input-container.is-focus': { borderColor: '#1A1414' },
  '.input-container.is-error': { borderColor: '#D7192D' },
  '.message-text': { color: '#818184' },
  '.message-icon': { color: '#818184' },
  '.message-text.is-error': { color: '#C11425' },
  '.message-icon.is-error': { color: '#C11425' },
  input: { fontSize: '16px', color: '#1A1414', backgroundColor: '#FFFFFF' },
  'input::placeholder': { color: '#9A9A9E' },
  'input.is-error': { color: '#C11425' },
};

export interface PayRequest {
  sourceId: string;
  verificationToken?: string;
  idempotencyKey: string;
  lines: { name: string; summary?: string; unit: number; qty: number }[];
  customer: { name: string; phone: string; email: string };
  note?: string;
  pickupAt?: string;
  expectedTotal: number;
}
export interface PayResponse { ok: boolean; message?: string; orderNumber?: string; receiptUrl?: string | null; total?: number; cardBrand?: string | null; cardLast4?: string | null }

export async function submitPayment(body: PayRequest): Promise<PayResponse> {
  try {
    const r = await fetch('api/pay', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = (await r.json().catch(() => ({}))) as PayResponse;
    if (!r.ok || !j.ok) return { ok: false, message: j.message || 'Your payment didn’t go through. Please try again.' };
    return j;
  } catch {
    return { ok: false, message: 'We couldn’t reach the payment server. Check your connection and try again.' };
  }
}

export const newKey = () =>
  (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));

/** Turn a start-sheet slot label like "7:30 PM" into the next matching time (ISO), or undefined for ASAP. */
export function slotToIso(label: string | undefined): string | undefined {
  if (!label || label === 'asap') return undefined;
  const m = label.match(/(\d{1,2}):(\d{2})\s*([AP])\.?M/i);
  if (!m) return undefined;
  let h = +m[1] % 12;
  if (m[3].toUpperCase() === 'P') h += 12;
  const d = new Date();
  d.setHours(h, +m[2], 0, 0);
  if (d.getTime() < Date.now() - 5 * 60 * 1000) d.setDate(d.getDate() + 1);
  return d.toISOString();
}
