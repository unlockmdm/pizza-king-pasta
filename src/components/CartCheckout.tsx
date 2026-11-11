// Port of design_handoff_pizza_king_website/prototype/CartCheckout.dc.html
// Floating cart bar, cart drawer, checkout and the order-placed confirmation.
import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties, type MouseEvent, type ReactNode } from 'react';
import type { CartCheckoutProps, CartLine, Mode } from '../lib/types';
import { SHOP } from '../lib/catalog';
import { canOrderAsap, isValidWhen, slotToIso, timeSlots } from '../lib/hours';
import { UPSELLS as UPSELL_DATA, mustPrice, orderTotals, type LineSpec } from '../lib/pricing';
import { CARD_STYLE, isSafari, loadSquare, newKey, SQUARE_ENABLED, SQUARE_SANDBOX, submitPayment, type SqCard, type SqCardEvent, type SqCardState, type SqPaymentRequest, type SqWallet } from '../lib/square';
import { money } from '../lib/format';
import { Hov } from '../lib/ui';
import { useEscape, useKeyboardOpen, useLockBody, useWidth } from '../lib/hooks';
import './CartCheckout.css';
import OrderConfirmation, { type Confirmation } from './OrderConfirmation';
import LineThumb from './LineThumb';

// ---------- Data (from the prototype) ----------

interface Upsell {
  key: string;
  name: string;
  unit: number;
  img: string;
  summary: string;
  flavours: string[];
}
// Upsells ask for a flavour before adding, so the kitchen always knows what to make.
// Names, prices and flavours come from the shared pricing module; only the photos live here.
const UPSELL_IMG: Record<string, string> = { 'fruit-juice': 'assets/menu/juice-mix.png', 'gelato-cone': 'assets/menu/gelato.jpg' };
const UPSELLS: Upsell[] = UPSELL_DATA.map((u) => ({ ...u, img: UPSELL_IMG[u.key] || '' }));

const TIP_PRESETS = [0, 10, 15, 18] as const;
const DEFAULT_TIP = 15;

type Step = 'cart' | 'checkout';
type Pay = 'card' | 'store';
type FieldKey = 'name' | 'phone' | 'email' | 'street' | 'unit' | 'note' | 'card' | 'exp' | 'cvc' | 'zip';
type Form = Record<FieldKey, string>;
const EMPTY_FORM: Form = { name: '', phone: '', email: '', street: '', unit: '', note: '', card: '', exp: '', cvc: '', zip: '' };

type Done = Confirmation;

// ---------- Shared styles ----------
const FONT = "'Figtree',system-ui,sans-serif";
const h2: CSSProperties = { margin: '0 0 14px 2px', fontWeight: 900, fontSize: 22, letterSpacing: '-.03em', color: '#1A1414' };
const card: CSSProperties = { background: '#fff', borderRadius: 24, padding: 16, display: 'flex', flexDirection: 'column', gap: 10, boxShadow: '0 0 0 1px rgba(26,20,20,.05),0 1px 2px rgba(26,20,20,.04)' };
const fieldLabel: CSSProperties = { display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2, minHeight: 62, padding: '9px 16px', borderRadius: 16, cursor: 'text' };
const fieldCaption: CSSProperties = { fontSize: 12, fontWeight: 700, color: '#818184' };
const fieldInput: CSSProperties = { width: '100%', height: 28, padding: 0, border: 0, background: 'transparent', fontFamily: 'inherit', fontSize: 17, fontWeight: 500, color: '#1A1414', outline: 'none' };
const cardInput: CSSProperties = { height: 56, padding: '0 16px', border: 0, background: 'transparent', fontFamily: 'inherit', fontSize: 16, color: '#1A1414', outline: 'none', minWidth: 0 };
const errText: CSSProperties = { display: 'block', margin: '10px 0 0 4px', fontSize: 13, fontWeight: 700, color: '#C11425' };
const stepBtn: CSSProperties = { width: 40, height: 40, border: 0, borderRadius: '50%', background: 'transparent', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const segBase: CSSProperties = { height: 46, border: 0, borderRadius: 12, fontFamily: 'inherit', cursor: 'pointer' };

const CheckSvg = ({ size, stroke }: { size: number; stroke: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);
const PlusSvg = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

function Field({
  label,
  bg,
  error,
  errId,
  children,
}: {
  label: string;
  bg: string;
  error?: string;
  errId?: string;
  children: ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
      <label style={{ ...fieldLabel, background: error ? '#FFF5F6' : bg, boxShadow: error ? 'inset 0 0 0 1.5px #D7192D' : 'none', transition: 'box-shadow .15s, background .15s' }}>
        <span style={{ ...fieldCaption, color: error ? '#C11425' : fieldCaption.color }}>{label}</span>
        {children}
      </label>
      {error ? (
        <span id={errId} style={fieldErr}>
          <ErrIcon />
          {error}
        </span>
      ) : null}
    </div>
  );
}

const fieldErr: CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: 6, padding: '0 4px', fontSize: 13, lineHeight: 1.35, fontWeight: 700, color: '#C11425' };
const ErrIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true" style={{ flex: 'none', marginTop: 1 }}><circle cx="12" cy="12" r="9.5" /><path d="M12 7.5v5.5M12 16.5v.01" /></svg>
);

// Customer-facing messages for Square's card fields (we hide Square's own message line so every error looks the same).
const CARD_FIELDS = ['cardNumber', 'expirationDate', 'cvv', 'postalCode'] as const;
const CARD_EMPTY: Record<string, string> = { cardNumber: 'Enter your card number.', expirationDate: 'Enter the expiry date (MM/YY).', cvv: 'Enter the security code (CVV).', postalCode: 'Enter your billing postal code.' };
const CARD_BAD: Record<string, string> = { cardNumber: 'Check your card number.', expirationDate: 'Check the expiry date. It should be MM/YY and in the future.', cvv: 'Check the security code (CVV).', postalCode: 'Check your billing postal code.' };
const joinList = (a: string[]) => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);

const hexToRgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
};

const newOrderNo = () => 'Order #' + (1000 + Math.floor(Math.random() * 9000));

// ---------- Component ----------
export default function CartCheckout(p: CartCheckoutProps) {
  const w = useWidth();
  const wide = w >= 900;
  const [step, setStep] = useState<Step>('cart');
  const [upPick, setUpPick] = useState<string | null>(null);
  const [pay, setPay] = useState<Pay>('card');
  const [tip, setTip] = useState<number>(DEFAULT_TIP);
  const [f, setF] = useState<Form>(EMPTY_FORM);
  const [tried, setTried] = useState(false);
  const [triedX, setTriedX] = useState('');
  const [touched, setTouched] = useState<Partial<Record<'name' | 'phone' | 'email', boolean>>>({});
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const cardSt = useRef<Record<string, SqCardState>>({});
  const cardForce = useRef(false);
  const [cardErr, setCardErr] = useState('');
  const [done, setDone] = useState<Done | null>(null);
  // Square (live checkout) state
  const [busy, setBusy] = useState(false);
  const [payErr, setPayErr] = useState('');
  const [sqReady, setSqReady] = useState(false);
  const [sqLoadErr, setSqLoadErr] = useState('');
  const [wallets, setWallets] = useState({ gpay: false, apple: false });
  const sq = useRef<{ card?: SqCard; gpay?: SqWallet; apple?: SqWallet; req?: SqPaymentRequest }>({});
  const payKey = useRef(newKey());
  const totalRef = useRef('0.00');

  // Prototype componentDidUpdate: re-opening the cart always starts at the drawer.
  useEffect(() => {
    if (p.open) setStep('cart');
  }, [p.open]);

  useLockBody(!!p.open || !!done);
  useEscape(!!p.open, p.onClose);

  const lines = p.lines || [];
  const mode: Mode = p.mode === 'delivery' ? 'delivery' : 'pickup';
  const pickup = mode === 'pickup';
  const count = lines.reduce((a, l) => a + l.qty, 0);
  // Delivery goes through DoorDash / Uber Eats, so this checkout only ever charges pickup orders (no fee, no tip).
  // Totals come from the shared pricing module, which rounds HST exactly like the Square order that gets charged.
  const totals = orderTotals(lines);
  const sub = totals.sub;
  const tax = totals.tax;
  const tipAmt = 0;
  void tip; void setTip;
  const grand = totals.total;

  const set = (k: FieldKey) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const v = e.target.value;
    setF((st) => ({ ...st, [k]: v }));
  };
  const digits = f.card.replace(/\D/g, '');
  const errs = {
    email: !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(f.email.trim()),
    name: f.name.trim().length < 2,
    phone: !/^1?\d{10}$/.test(f.phone.replace(/\D/g, '')),
    street: !pickup && !f.street.trim(),
    card: pay === 'card' && !SQUARE_ENABLED && (digits.length < 15 || !/\d{2}\s*\/\s*\d{2}/.test(f.exp) || f.cvc.replace(/\D/g, '').length < 3),
  };
  const show = (k: keyof typeof errs) => tried && errs[k];
  // Contact fields: show an error after a submit attempt, or once someone leaves a field they started filling in.
  const showC = (k: 'name' | 'phone' | 'email') => errs[k] && (tried || (!!touched[k] && f[k].trim() !== ''));
  const msg = {
    name: showC('name') ? (f.name.trim() ? 'Enter your full name.' : 'Enter your name so we know whose order it is.') : '',
    phone: showC('phone') ? (f.phone.trim() ? 'Enter a 10-digit phone number, like 905-555-0123.' : 'Enter your phone number in case we need to reach you.') : '',
    email: showC('email') ? (f.email.trim() ? 'Check your email. It should look like name@example.com.' : 'Enter your email for your receipt.') : '',
  };
  const missing = [errs.name && 'name', errs.phone && 'phone number', errs.email && 'email'].filter(Boolean) as string[];
  const blur = (k: 'name' | 'phone' | 'email') => () => setTouched((t) => (t[k] ? t : { ...t, [k]: true }));
  // Scroll to (and focus) the first contact field that needs fixing.
  const goToFirstError = () => {
    const el = errs.name ? nameRef.current : errs.phone ? phoneRef.current : errs.email ? emailRef.current : null;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      el.focus({ preventScroll: true });
    });
  };
  const cardMessage = (force: boolean) => {
    const st = cardSt.current;
    for (const k of CARD_FIELDS) {
      const s = st[k];
      if (k === 'postalCode' && !s) continue; // Square only shows postal code for some cards
      if (s?.hasErrors) return CARD_BAD[k];
      if (force && !s?.isCompletelyValid) return s && !s.isEmpty ? CARD_BAD[k] : CARD_EMPTY[k];
    }
    return '';
  };
  const goToCard = () => requestAnimationFrame(() => document.getElementById('sq-card')?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
  const err = {
    street: show('street'),
    cardB: show('card') ? '#D7192D' : 'transparent',
    card: show('card'),
    express: triedX && (errs.name || errs.phone || errs.email || errs.street),

  };

  const pageBg = p.pageBg || '#FFFFFF';
  const pageBgA = hexToRgba(pageBg, 0.88);
  const fieldBg = pageBg.toUpperCase() === '#FFFFFF' ? '#F4F4F5' : '#F3F3F6';
  const countText = count + (count === 1 ? ' item' : ' items');
  const setMode = (m: Mode) => p.onMode(m);
  // Owner rule: no wait-time estimates. Timing is ASAP (or scheduled from the start sheet).
  const doneWhen = p.when && p.when !== 'asap' ? p.when : 'As soon as possible';
  // Opening hours: ASAP only while open, and a scheduled time must still be offered (the server checks too).
  const timeOk = isValidWhen(p.when);
  const timeMsg = timeOk
    ? ''
    : !p.when || p.when === 'asap'
      ? 'We\u2019re closed right now. We\u2019re open every day, ' + SHOP.hoursText + '. Choose a pickup time to continue.'
      : 'Your pickup time (' + p.when + ') is no longer available. Choose a new time to continue.';
  const goToTime = () => requestAnimationFrame(() => document.getElementById('cc-when')?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
  const where = pickup ? SHOP.street : f.street + (f.unit ? ', ' + f.unit : '');
  const firstName = f.name.split(' ')[0];

  // ---- Square Web Payments SDK (card + wallets), mounted while the pickup checkout is open ----
  const totalStr = (Math.round(grand * 100) / 100).toFixed(2);
  totalRef.current = totalStr;
  const sqActive = SQUARE_ENABLED && !!p.open && step === 'checkout' && pickup;
  useEffect(() => {
    if (!sqActive) return;
    let cancelled = false;
    const st = sq.current;
    (async () => {
      try {
        const payments = await loadSquare();
        if (cancelled) return;
        const card = await payments.card({ style: CARD_STYLE });
        if (cancelled) { void card.destroy(); return; }
        await card.attach('#sq-card');
        const onCard = (e: SqCardEvent) => {
          const d = e.detail;
          if (!d?.field) return;
          cardSt.current[d.field] = d.currentState || {};
          setCardErr(cardMessage(cardForce.current));
        };
        for (const ev of ['errorClassAdded', 'errorClassRemoved', 'focusClassRemoved', 'cardBrandChanged', 'postalCodeChanged']) card.addEventListener?.(ev, onCard);
        st.card = card;
        setSqReady(true);
        const req = payments.paymentRequest({ countryCode: 'CA', currencyCode: 'CAD', total: { amount: totalRef.current, label: SHOP.name } });
        st.req = req;
        if (!isSafari()) try {
          const g = await payments.googlePay(req);
          if (cancelled) { void g.destroy(); return; }
          await g.attach?.('#sq-gpay', { buttonColor: 'white', buttonSizeMode: 'fill', buttonType: 'long' });
          st.gpay = g;
          setWallets((x) => ({ ...x, gpay: true }));
        } catch { /* Google Pay not available on this device */ }
        try {
          const a = await payments.applePay(req);
          if (cancelled) { void a.destroy(); return; }
          st.apple = a;
          setWallets((x) => ({ ...x, apple: true }));
        } catch { /* Apple Pay needs Safari + a verified domain */ }
      } catch (e) {
        if (!cancelled) setSqLoadErr((e as Error).message || 'Card payments are unavailable right now. Please call 905-460-9494 to order.');
      }
    })();
    return () => {
      cancelled = true;
      void st.card?.destroy();
      void st.gpay?.destroy();
      void st.apple?.destroy();
      sq.current = {};
      setSqReady(false);
      setWallets({ gpay: false, apple: false });
    };
  }, [sqActive]);
  useEffect(() => { sq.current.req?.update({ total: { amount: totalStr, label: SHOP.name } }); }, [totalStr]);

  const charge = async (method: 'card' | 'gpay' | 'apple') => {
    if (busy || !count) return;
    if (!isValidWhen(p.when)) { setTried(true); goToTime(); return; }
    if (method === 'card') {
      // Check the card too, so every problem shows at once (not one per tap).
      cardForce.current = true;
      setCardErr(cardMessage(true));
    }
    if (errs.name || errs.phone || errs.email) {
      setTried(true);
      setTriedX(method === 'apple' ? 'Apple Pay' : method === 'gpay' ? 'Google Pay' : '');
      goToFirstError();
      return;
    }
    setTriedX('');
    const st = sq.current;
    const src = method === 'card' ? st.card : method === 'gpay' ? st.gpay : st.apple;
    if (!src) return;
    setBusy(true);
    setPayErr('');
    try {
      const [given, ...rest] = f.name.trim().split(/\s+/);
      const verification = {
        amount: totalStr, currencyCode: 'CAD', intent: 'CHARGE', customerInitiated: true, sellerKeyedIn: false,
        billingContact: { givenName: given, familyName: rest.join(' '), email: f.email.trim(), phone: f.phone.trim(), countryCode: 'CA' },
      };
      const t = method === 'card' ? await (src as SqCard).tokenize(verification) : await src.tokenize();
      if (t.status !== 'OK' || !t.token) {
        if (method === 'card') {
          const f0 = t.errors?.find((x) => x.field)?.field;
          setCardErr(cardMessage(true) || (f0 && CARD_BAD[f0]) || 'Check your card details and try again.');
          goToCard();
        }
        setBusy(false);
        return;
      }
      const r = await submitPayment({
        sourceId: t.token,
        idempotencyKey: payKey.current,
        // Only what was chosen and how many: the server prices every line itself.
        lines: lines.map((l) => ({ spec: l.spec, qty: l.qty })),
        customer: { name: f.name.trim(), phone: f.phone.trim(), email: f.email.trim() },
        note: f.note.trim() || undefined,
        pickupAt: slotToIso(p.when),
        expectedTotal: totals.totalCents,
      });
      payKey.current = newKey();
      if (!r.ok) {
        setPayErr(r.message || 'Payment didn\u2019t go through. Please try again.');
        setBusy(false);
        return;
      }
      const via = method === 'gpay' ? ' · Google Pay' : method === 'apple' ? ' · Apple Pay' : '';
      setDone({ no: 'Order #' + String(r.orderNumber || '').toUpperCase(), items: lines.map((l) => ({ ...l })), email: f.email.trim(), phone: f.phone.trim(), name: firstName, when: doneWhen, pay: method, cardBrand: r.cardBrand || undefined, last4: r.cardLast4 || undefined, receiptUrl: r.receiptUrl || undefined, orderId: r.orderId, statusToken: r.statusToken });
      setStep('cart');
      setTried(false);
      setTriedX('');
      setTouched({});
      cardForce.current = false;
      setCardErr('');
      setBusy(false);
      p.onPlaced();
    } catch {
      setPayErr('Payment didn\u2019t go through. Please try again.');
      setBusy(false);
    }
  };

  const express = (method: string) => {
    if (!count) return;
    if (errs.name || errs.phone || errs.email || errs.street) {
      setTried(true);
      setTriedX(method);
      goToFirstError();
      return;
    }
    setDone({ no: newOrderNo(), items: lines.map((l) => ({ ...l })), email: f.email.trim(), phone: f.phone.trim(), name: firstName, when: doneWhen, pay: method === 'Apple Pay' ? 'apple' : 'gpay' });
    setStep('cart');
    setTried(false);
    setTriedX('');
    p.onPlaced();
  };
  const place = () => {
    if (count === 0 || !pickup) return;
    if (SQUARE_ENABLED) { void charge('card'); return; }
    if (Object.values(errs).some(Boolean)) {
      setTried(true);
      goToFirstError();
      return;
    }
    setDone({ no: newOrderNo(), items: lines.map((l) => ({ ...l })), email: f.email.trim(), phone: f.phone.trim(), name: firstName, when: doneWhen, pay: pay === 'store' ? 'store' : 'card', cardBrand: f.card.replace(/\D/g, '') });
    setStep('cart');
    setTried(false);
    p.onPlaced();
  };

  const toCheckout = () => {
    setStep('checkout');
    setTried(false);
  };
  const backToCart = () => setStep('cart');
  const stop = (e: MouseEvent) => e.stopPropagation();

  const showBar = count > 0 && !p.open && !done;
  const showCart = !!p.open && step === 'cart';
  const showCheckout = !!p.open && step === 'checkout';
  // While typing on a phone the Place order bar would float above the keyboard over the form: hide it until the keyboard closes.
  const kbOpen = useKeyboardOpen();

  const rows = lines.map((l) => ({ ...l, totalText: money(l.unit * l.qty), isOne: l.qty === 1 }));
  const upsells = UPSELLS.filter((u) => !lines.some((l) => l.key.startsWith(u.key)));
  const pickU = upsells.find((u) => u.key === upPick);

  const modeCards: { id: Mode; label: string; sub: string }[] = [
    { id: 'pickup', label: 'Pickup', sub: 'Ready as soon as possible' },
    { id: 'delivery', label: 'Delivery', sub: SHOP.ubereatsAvailable ? 'DoorDash or Uber Eats' : 'DoorDash' },
  ];
  const pays: { id: Pay; short: string }[] = [
    { id: 'card', short: 'Card' },
    { id: 'store', short: pickup ? 'Pay at pickup' : 'Pay in the app' },
  ];
  const lblW = w >= 560 ? 76 : 64;
  const twoCols = w >= 560 ? '1fr 1fr' : '1fr';

  const thumbBox = (r: (typeof rows)[number]) => <LineThumb line={r} />;

  return (
    <>
      {/* ---------- Floating cart bar ---------- */}
      {showBar ? (
        <div
          style={{
            position: 'fixed',
            zIndex: 35,
            left: wide ? 'auto' : 12,
            right: wide ? 24 : 12,
            bottom: wide ? 24 : 'calc(12px + env(safe-area-inset-bottom))',
            width: wide ? 380 : 'auto',
            animation: 'ccUp .35s cubic-bezier(.2,.8,.2,1) both',
            fontFamily: FONT,
          }}
        >
          <Hov
            as="button"
            onClick={p.onOpen}
            aria-label={'View order, ' + count + ' items, ' + money(sub)}
            style={{
              width: '100%',
              height: 64,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '0 10px 0 12px',
              border: 0,
              borderRadius: 999,
              background: '#1A1414',
              color: '#fff',
              fontFamily: 'inherit',
              cursor: 'pointer',
              boxShadow: '0 18px 40px rgba(26,20,20,.32)',
              transition: 'transform .2s',
            }}
            hover={{ transform: 'translateY(-2px)' }}
          >
            <span style={{ position: 'relative', width: 44, height: 44, flex: 'none', borderRadius: '50%', background: '#D7192D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8z" />
                <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
              </svg>
              <span
                style={{
                  position: 'absolute',
                  right: -4,
                  top: -4,
                  minWidth: 22,
                  height: 22,
                  padding: '0 6px',
                  borderRadius: 999,
                  background: '#fff',
                  color: '#1A1414',
                  fontSize: 12,
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 0 2px #1A1414',
                  boxSizing: 'border-box',
                }}
              >
                {count}
              </span>
            </span>
            <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1, textAlign: 'left' }}>
              <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-.01em' }}>View order</span>
              <span style={{ fontSize: 13, color: '#BDB2AC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                {countText + (w < 360 ? '' : ' · ' + (pickup ? 'Pickup' : 'Delivery'))}
              </span>
            </span>
            <span style={{ fontWeight: 900, fontSize: 19, letterSpacing: '-.03em', paddingRight: 4 }}>{money(sub)}</span>
            <span style={{ width: 44, height: 44, flex: 'none', borderRadius: '50%', background: 'rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 15l6-6 6 6" />
              </svg>
            </span>
          </Hov>
        </div>
      ) : null}

      {/* ---------- Cart drawer ---------- */}
      {showCart ? (
        <div
          onClick={p.onClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            background: 'rgba(20,14,12,.45)',
            backdropFilter: 'blur(3px)',
            WebkitBackdropFilter: 'blur(3px)',
            display: 'flex',
            justifyContent: 'flex-end',
            animation: 'ccFade .2s ease both',
            fontFamily: FONT,
            color: '#1A1414',
          }}
        >
          <aside
            onClick={stop}
            role="dialog"
            aria-modal="true"
            aria-label="Your order"
            style={{ width: 'min(460px,100%)', height: '100%', background: '#fff', display: 'flex', flexDirection: 'column', boxShadow: '-24px 0 60px rgba(0,0,0,.18)', animation: 'ccIn .3s cubic-bezier(.2,.8,.2,1) both' }}
          >
            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 22, background: '#fff', borderBottom: '1px solid #E8E8EB' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontWeight: 900, fontSize: 24, letterSpacing: '-.035em', lineHeight: 1 }}>Your order</span>
                <span style={{ fontSize: 14, color: '#636366' }}>{countText}</span>
              </div>
              <Hov
                as="button"
                onClick={p.onClose}
                aria-label="Close"
                style={{ width: 44, height: 44, flex: 'none', border: 0, borderRadius: '50%', background: '#F0F0F3', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1A1414' }}
                hover={{ background: '#E6E6E9' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </Hov>
            </header>

            {count === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 40, textAlign: 'center' }}>
                <img src="assets/pizza-base.webp" alt="" style={{ width: 120, height: 120, opacity: 0.9 }} />
                <span style={{ fontWeight: 900, fontSize: 22, letterSpacing: '-.03em' }}>Your order is empty</span>
                <span style={{ fontSize: 15, color: '#636366' }}>Add items from the menu to start your order.</span>
                <button
                  onClick={p.onBrowse}
                  style={{ height: 48, padding: '0 24px', border: 0, borderRadius: 999, background: '#1A1414', color: '#fff', fontFamily: 'inherit', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}
                >
                  Browse the menu
                </button>
              </div>
            ) : (
              <>
                <div style={{ flex: 1, overflow: 'auto', padding: '4px 18px 8px', display: 'flex', flexDirection: 'column' }}>
                  {rows.map((l) => (
                    <div key={l.key} style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '14px 4px', borderBottom: '1px solid #EAEAED' }}>
                      <div style={{ width: 84, height: 84, flex: 'none', borderRadius: 22, background: '#EFEFF2', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{thumbBox(l)}</div>
                      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-.015em', lineHeight: 1.2 }}>{l.name}</span>
                          <span style={{ fontSize: 13, lineHeight: 1.35, color: '#818184', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{l.summary}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                          <span style={{ fontWeight: 900, fontSize: 17, letterSpacing: '-.03em' }}>{l.totalText}</span>
                          <div style={{ display: 'flex', alignItems: 'center', height: 44, borderRadius: 999, background: '#1A1414', color: '#fff', padding: 2, boxSizing: 'border-box' }}>
                            <button onClick={() => p.onQty(l.key, -1)} aria-label={l.isOne ? 'Remove ' + l.name : 'Remove one'} style={stepBtn}>
                              {l.isOne ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
                                </svg>
                              ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                                  <path d="M5 12h14" />
                                </svg>
                              )}
                            </button>
                            <span style={{ minWidth: 22, textAlign: 'center', fontWeight: 800, fontSize: 14 }}>{l.qty}</span>
                            <button onClick={() => p.onQty(l.key, 1)} aria-label="Add one" style={stepBtn}>
                              <PlusSvg />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {upsells.length ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '22px 4px 8px' }}>
                      <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: '-.02em' }}>Goes well with</span>
                      <div style={{ display: 'flex', gap: 12 }}>
                        {upsells.map((u) => (
                          <button
                            key={u.key}
                            onClick={() => setUpPick((k) => (k === u.key ? null : u.key))}
                            aria-expanded={upPick === u.key}
                            style={{
                              position: 'relative',
                              flex: 1,
                              minWidth: 0,
                              padding: 0,
                              border: 0,
                              borderRadius: 22,
                              overflow: 'hidden',
                              background: '#EFEFF2',
                              boxShadow: upPick === u.key ? 'inset 0 0 0 2px #1A1414' : 'none',
                              fontFamily: 'inherit',
                              textAlign: 'left',
                              cursor: 'pointer',
                              color: '#1A1414',
                              display: 'flex',
                              flexDirection: 'column',
                            }}
                          >
                            <span
                              aria-hidden="true"
                              style={{ display: 'block', flex: 'none', backgroundImage: "url('" + u.img + "')", backgroundPosition: 'center', backgroundRepeat: 'no-repeat', width: '100%', aspectRatio: '4/3', backgroundSize: 'cover' }}
                            />
                            <span style={{ display: 'flex', flexDirection: 'column', gap: 1, padding: '10px 12px 12px' }}>
                              <span style={{ fontWeight: 800, fontSize: 14 }}>{u.name}</span>
                              <span style={{ fontSize: 13, color: '#636366' }}>{money(u.unit)}</span>
                            </span>
                            <span
                              style={{ position: 'absolute', right: 10, top: 10, width: 34, height: 34, borderRadius: '50%', background: '#fff', color: '#1A1414', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,.15)' }}
                            >
                              <PlusSvg />
                            </span>
                          </button>
                        ))}
                      </div>
                      {pickU ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: '#636366' }}>Choose a flavour for your {pickU.name.toLowerCase()}</span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {pickU.flavours.map((f) => (
                              <button
                                key={f}
                                onClick={() => {
                                  const spec: LineSpec = { k: 'upsell', id: pickU.key, flavour: f };
                                  const q = mustPrice(spec);
                                  p.onAdd({ key: pickU.key + '-' + f.toLowerCase().replace(/[^a-z]+/g, '-'), name: q.name, summary: q.summary, unit: q.unit, spec });
                                  setUpPick(null);
                                }}
                                style={{ height: 38, padding: '0 14px', borderRadius: 999, border: '1px solid #E4E4E7', background: '#fff', color: '#1A1414', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                              >
                                {f}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <footer style={{ padding: '16px 22px 22px', background: '#fff', boxShadow: '0 -1px 0 #EAEAED', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: 14, color: '#818184' }}>Subtotal before HST</span>
                    <span style={{ fontWeight: 900, fontSize: 20, letterSpacing: '-.03em' }}>{money(sub)}</span>
                  </div>
                  <Hov
                    as="button"
                    onClick={toCheckout}
                    style={{ height: 58, border: 0, borderRadius: 18, background: '#D7192D', color: '#fff', fontFamily: 'inherit', fontWeight: 800, fontSize: 17, cursor: 'pointer', transition: 'background .2s' }}
                    hover={{ background: '#BF1222' }}
                  >
                    Go to checkout
                  </Hov>
                </footer>
              </>
            )}
          </aside>
        </div>
      ) : null}

      {/* ---------- Checkout ---------- */}
      {showCheckout ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Checkout"
          style={{ position: 'fixed', inset: 0, zIndex: 90, background: pageBg, overflow: 'auto', overscrollBehavior: 'contain', animation: 'ccFade .2s ease both', fontFamily: FONT, color: '#1A1414', boxShadow: '0 100vh 0 0 ' + pageBg }}
        >
          <header style={{ position: 'sticky', top: 0, zIndex: 10, background: pageBgA, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
            <div style={{ maxWidth: 1080, margin: '0 auto', height: 68, padding: '0 clamp(16px,3vw,32px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <button
                onClick={backToCart}
                aria-label="Back to order"
                style={{ width: 44, height: 44, flex: 'none', border: 0, borderRadius: '50%', background: '#fff', boxShadow: '0 0 0 1px #EAEAED', color: '#1A1414', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 6l-6 6 6 6" />
                </svg>
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src="assets/chef-logo.png" alt="" style={{ width: 30, height: 'auto' }} />
                <span style={{ fontWeight: 900, fontSize: 16, letterSpacing: '-.02em', whiteSpace: 'nowrap' }}>
                  Pizza King <span style={{ color: '#D7192D' }}>&amp;</span> Pasta
                </span>
              </div>
              <span aria-hidden="true" style={{ width: 44 }} />
            </div>
          </header>

          <div
            style={{
              maxWidth: 1080,
              margin: '0 auto',
              padding: '12px clamp(16px,3vw,32px) ' + (!wide && tried && missing.length ? 170 : 130) + 'px',
              display: 'grid',
              gridTemplateColumns: wide ? 'minmax(0,1fr) 360px' : 'minmax(0,1fr)',
              gap: 'clamp(24px,4vw,48px)',
              alignItems: 'start',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32, minWidth: 0 }}>
              <h1 style={{ margin: '8px 0 0 4px', fontWeight: 900, fontSize: 'clamp(34px,4.5vw,46px)', letterSpacing: '-.05em', lineHeight: 0.95 }}>Checkout</h1>

              {/* Pickup or delivery (no time picker: timing comes from the start sheet) */}
              <section>
                <h2 style={h2}>Pickup</h2>
                <div style={card}>
                  {pickup ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '0 18px', minHeight: 64 }}>
                      <span style={{ width: lblW, flex: 'none', fontSize: 15, fontWeight: 700, color: '#1A1414' }}>Store</span>
                      <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1, padding: '12px 0' }}>
                        <span style={{ fontSize: 16, fontWeight: 600 }}>{SHOP.street}</span>
                        <span style={{ fontSize: 13, color: '#818184' }}>Brampton · {SHOP.phoneText}</span>
                      </span>
                    </div>
                  ) : null}
                  {pickup ? (
                    <div id="cc-when" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '0 18px', minHeight: 60, boxShadow: '0 -1px 0 #EFEFF2', scrollMarginTop: 90 }}>
                      <span style={{ width: lblW, flex: 'none', fontSize: 15, fontWeight: 700, color: '#1A1414' }}>When</span>
                      <span style={{ flex: 1, minWidth: 0, fontSize: 16, fontWeight: 600, color: timeOk ? '#1A1414' : '#C11425' }}>
                        {timeOk ? doneWhen : canOrderAsap() ? 'Choose a time' : 'Closed now'}
                      </span>
                      {p.onWhen ? (
                        // A real <select> under a "Change" pill: phones open their own time wheel, right here in checkout.
                        <label style={{ position: 'relative', flex: 'none', height: 36, padding: '0 14px', borderRadius: 999, border: '1px solid #E4E4E7', background: '#fff', color: '#1A1414', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                          Change
                          <select
                            aria-label="Pickup time"
                            value={timeOk ? p.when || 'asap' : ''}
                            onChange={(e) => p.onWhen?.(e.target.value)}
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', fontSize: 16 }}
                          >
                            {!timeOk ? <option value="" disabled>Choose a time</option> : null}
                            {canOrderAsap() ? <option value="asap">As soon as possible</option> : null}
                            {timeSlots(new Date(), 48).map((t) => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </label>
                      ) : p.onChangeTime ? (
                        <button onClick={p.onChangeTime} style={{ flex: 'none', height: 36, padding: '0 14px', borderRadius: 999, border: '1px solid #E4E4E7', background: '#fff', color: '#1A1414', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                          Change
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                {timeMsg ? (
                  <span role="alert" style={{ ...fieldErr, marginTop: 10, background: '#FDECEE', borderRadius: 12, padding: '10px 12px' }}>
                    <ErrIcon />
                    {timeMsg}
                  </span>
                ) : null}
                {err.street ? <span style={errText}>Enter an address.</span> : null}
              </section>

              {pickup ? (<>
              {/* Contact */}
              <section>
                <h2 style={h2}>Contact</h2>
                <div style={card}>
                  <Field label="Full name" bg={fieldBg} error={msg.name} errId="err-name">
                    <input ref={nameRef} value={f.name} onChange={set('name')} onBlur={blur('name')} autoComplete="name" autoCapitalize="words" enterKeyHint="next" placeholder="First and last name" aria-invalid={!!msg.name} aria-describedby={msg.name ? 'err-name' : undefined} style={fieldInput} />
                  </Field>
                  <div style={{ display: 'grid', gridTemplateColumns: twoCols, gap: 10, alignItems: 'start' }}>
                    <Field label="Phone" bg={fieldBg} error={msg.phone} errId="err-phone">
                      <input ref={phoneRef} value={f.phone} onChange={set('phone')} onBlur={blur('phone')} type="tel" inputMode="tel" autoComplete="tel" enterKeyHint="next" placeholder="(905) 555-0123" aria-invalid={!!msg.phone} aria-describedby={msg.phone ? 'err-phone' : undefined} style={fieldInput} />
                    </Field>
                    <Field label="Email" bg={fieldBg} error={msg.email} errId="err-email">
                      <input ref={emailRef} value={f.email} onChange={set('email')} onBlur={blur('email')} type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} enterKeyHint="done" placeholder="you@example.com" aria-invalid={!!msg.email} aria-describedby={msg.email ? 'err-email' : undefined} style={fieldInput} />
                    </Field>
                  </div>
                </div>
              </section>

              {/* Note */}
              <section>
                <h2 style={h2}>Note for the kitchen</h2>
                <div style={{ ...card, gap: 12 }}>
                  <textarea
                    value={f.note}
                    onChange={set('note')}
                    rows={4}
                    maxLength={240}
                    aria-label="Note for the kitchen"
                    placeholder="Allergies, well done, cut in squares…"
                    style={{ width: '100%', minHeight: 120, padding: '14px 16px', border: 0, borderRadius: 16, background: fieldBg, fontFamily: 'inherit', fontSize: 16, lineHeight: 1.5, color: '#1A1414', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                  <span style={{ alignSelf: 'flex-end', fontSize: 12, color: '#818184' }}>{f.note.length}/240</span>
                </div>
              </section>

              {/* Payment
                  VISUAL MOCK ONLY. The express buttons and the card fields below get replaced by the
                  Square Web Payments SDK (Apple Pay / Google Pay buttons and the card element). Never
                  collect raw card numbers in our own inputs in production. */}
              <section>
                <h2 style={h2}>Payment</h2>
                <div style={{ ...card, padding: 18, gap: 16 }}>
                  {SQUARE_ENABLED ? (
                    <>
                      {SQUARE_SANDBOX ? (
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#8A5A00', background: '#FFF4D6', borderRadius: 12, padding: '10px 12px', lineHeight: 1.4 }}>
                          Test mode: card 4111 1111 1111 1111, any future date, CVV 111, ZIP 94103. No real money is charged.
                        </span>
                      ) : null}
                      <div style={{ display: 'grid', gridTemplateColumns: wallets.apple && wallets.gpay ? twoCols : '1fr', gap: 10 }}>
                        {wallets.apple ? (
                          <button onClick={() => void charge('apple')} disabled={busy} aria-label="Pay with Apple Pay" style={{ height: 56, border: 0, borderRadius: 14, background: '#000', color: '#fff', fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif", fontWeight: 600, fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                            <svg width="18" height="22" viewBox="0 0 22 26" fill="currentColor" aria-hidden="true"><path d="M17.9 13.8c0-3 2.5-4.5 2.6-4.6-1.4-2.1-3.6-2.3-4.4-2.4-1.9-.2-3.6 1.1-4.6 1.1-.9 0-2.4-1.1-3.9-1-2 0-3.9 1.2-5 3-2.1 3.7-.5 9.1 1.5 12.1 1 1.5 2.2 3.1 3.8 3 1.5-.1 2.1-1 3.9-1s2.4 1 3.9 1c1.6 0 2.7-1.5 3.7-3 1.2-1.7 1.6-3.3 1.7-3.4-.1 0-3.2-1.2-3.2-4.8zM14.9 4.9c.8-1 1.4-2.4 1.3-3.8-1.2.1-2.7.8-3.5 1.8-.8.9-1.5 2.3-1.3 3.7 1.3.1 2.7-.7 3.5-1.7z" /></svg>
                            <span>Pay</span>
                          </button>
                        ) : null}
                        {/* Square renders the official Google Pay button into this box. */}
                        <div id="sq-gpay" onClick={() => void charge('gpay')} style={{ height: wallets.gpay ? 52 : 0, overflow: wallets.gpay ? 'visible' : 'hidden' }} />
                      </div>
                      {err.express ? (
                        <span role="alert" style={{ ...fieldErr, background: '#FDECEE', borderRadius: 12, padding: '10px 12px' }}>
                          <ErrIcon />
                          {'Add your ' + joinList(missing) + ' above, then tap ' + triedX + ' again.'}
                        </span>
                      ) : null}
                      {wallets.apple || wallets.gpay ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 13, fontWeight: 700, color: '#818184' }}>
                          <span style={{ flex: 1, height: 1, background: '#E8E8EB' }} />
                          or pay with card
                          <span style={{ flex: 1, height: 1, background: '#E8E8EB' }} />
                        </div>
                      ) : null}
                      {/* Square's secure card fields (an iframe): card numbers never touch our code or server. */}
                      <div id="sq-card" style={{ minHeight: sqReady ? undefined : 90, scrollMarginTop: 90 }} />
                      {cardErr ? (
                        <span role="alert" style={{ ...fieldErr, marginTop: -6 }}>
                          <ErrIcon />
                          {cardErr}
                        </span>
                      ) : null}
                      {!sqReady && !sqLoadErr ? <span style={{ fontSize: 13, color: '#818184', marginTop: -70, paddingLeft: 4 }}>Loading secure card form…</span> : null}
                      {sqLoadErr ? <span style={{ fontSize: 13, fontWeight: 700, color: '#C11425' }}>{sqLoadErr}</span> : null}
                      {payErr ? <span role="alert" style={{ fontSize: 14, fontWeight: 700, color: '#C11425', background: '#FDECEE', borderRadius: 12, padding: '10px 12px' }}>{payErr}</span> : null}
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#818184' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
                        Encrypted and processed by Square. We never see or store your card.
                      </span>
                    </>
                  ) : (
                  <>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#636366', background: '#F2F2F5', borderRadius: 12, padding: '10px 12px' }}>Demo checkout: no card is charged.</span>
                  <div style={{ display: 'grid', gridTemplateColumns: twoCols, gap: 10 }}>
                    <Hov
                      as="button"
                      onClick={() => express('Apple Pay')}
                      aria-label="Pay with Apple Pay"
                      style={{
                        height: 56,
                        border: 0,
                        borderRadius: 14,
                        background: '#000',
                        color: '#fff',
                        fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Text','Figtree',sans-serif",
                        fontWeight: 600,
                        fontSize: 20,
                        letterSpacing: '-.01em',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                        transition: 'opacity .2s',
                      }}
                      hover={{ opacity: 0.86 }}
                    >
                      <svg width="18" height="22" viewBox="0 0 22 26" fill="currentColor" aria-hidden="true">
                        <path d="M17.9 13.8c0-3 2.5-4.5 2.6-4.6-1.4-2.1-3.6-2.3-4.4-2.4-1.9-.2-3.6 1.1-4.6 1.1-.9 0-2.4-1.1-3.9-1-2 0-3.9 1.2-5 3-2.1 3.7-.5 9.1 1.5 12.1 1 1.5 2.2 3.1 3.8 3 1.5-.1 2.1-1 3.9-1s2.4 1 3.9 1c1.6 0 2.7-1.5 3.7-3 1.2-1.7 1.6-3.3 1.7-3.4-.1 0-3.2-1.2-3.2-4.8zM14.9 4.9c.8-1 1.4-2.4 1.3-3.8-1.2.1-2.7.8-3.5 1.8-.8.9-1.5 2.3-1.3 3.7 1.3.1 2.7-.7 3.5-1.7z" />
                      </svg>
                      <span>Pay</span>
                    </Hov>
                    <Hov
                      as="button"
                      onClick={() => express('Google Pay')}
                      aria-label="Pay with Google Pay"
                      style={{
                        height: 56,
                        border: 0,
                        borderRadius: 14,
                        background: '#fff',
                        boxShadow: 'inset 0 0 0 1.5px #DADCE0',
                        color: '#3C4043',
                        fontFamily: "'Figtree',sans-serif",
                        fontWeight: 600,
                        fontSize: 20,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        transition: 'box-shadow .2s',
                      }}
                      hover={{ boxShadow: 'inset 0 0 0 1.5px #3C4043' }}
                    >
                      <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                      </svg>
                      <span>Pay</span>
                    </Hov>
                  </div>
                  {err.express ? (
                        <span role="alert" style={{ ...fieldErr, background: '#FDECEE', borderRadius: 12, padding: '10px 12px' }}>
                          <ErrIcon />
                          {'Add your ' + joinList(missing) + ' above, then tap ' + triedX + ' again.'}
                        </span>
                      ) : null}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 13, fontWeight: 700, color: '#818184' }}>
                    <span style={{ flex: 1, height: 1, background: '#E8E8EB' }} />
                    or pay another way
                    <span style={{ flex: 1, height: 1, background: '#E8E8EB' }} />
                  </div>
                  <div role="radiogroup" aria-label="Payment" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, padding: 4, borderRadius: 16, background: '#F0F0F3' }}>
                    {pays.map((o) => {
                      const on = pay === o.id;
                      return (
                        <button
                          key={o.id}
                          role="radio"
                          aria-checked={on}
                          onClick={() => setPay(o.id)}
                          style={{
                            ...segBase,
                            background: on ? '#fff' : 'transparent',
                            color: on ? '#1A1414' : '#717174',
                            boxShadow: on ? '0 2px 8px rgba(26,20,20,.12)' : 'none',
                            fontWeight: 800,
                            fontSize: 14,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {o.short}
                        </button>
                      );
                    })}
                  </div>
                  {pay === 'card' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ borderRadius: 18, boxShadow: 'inset 0 0 0 1.5px ' + err.cardB, background: fieldBg, overflow: 'hidden' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 12, height: 60, padding: '0 18px', borderBottom: '1.5px solid rgba(26,20,20,.07)' }}>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#818184" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
                            <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
                            <path d="M2.5 9.5h19" />
                          </svg>
                          <input
                            value={f.card}
                            onChange={set('card')}
                            aria-label="Card number"
                            inputMode="numeric"
                            autoComplete="cc-number"
                            placeholder="Card number"
                            style={{ flex: 1, height: '100%', border: 0, background: 'transparent', fontFamily: 'inherit', fontSize: 16, color: '#1A1414', outline: 'none', minWidth: 0, letterSpacing: '.03em' }}
                          />
                          <span style={{ display: 'flex', gap: 4, flex: 'none' }}>
                            <span style={{ height: 22, padding: '0 6px', borderRadius: 5, background: '#1A1F71', color: '#fff', fontSize: 11, fontWeight: 900, fontStyle: 'italic', display: 'flex', alignItems: 'center' }}>VISA</span>
                            <span style={{ width: 34, height: 22, borderRadius: 5, background: '#F0F0F3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#EB001B' }} />
                              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#F79E1B', marginLeft: -5, mixBlendMode: 'multiply' }} />
                            </span>
                            <span style={{ height: 22, padding: '0 5px', borderRadius: 5, background: '#2E77BC', color: '#fff', fontSize: 10, fontWeight: 900, display: 'flex', alignItems: 'center' }}>AMEX</span>
                          </span>
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
                          <input value={f.exp} onChange={set('exp')} aria-label="Expiry" autoComplete="cc-exp" placeholder="MM / YY" style={{ ...cardInput, borderRight: '1.5px solid rgba(26,20,20,.07)' }} />
                          <input value={f.cvc} onChange={set('cvc')} aria-label="CVC" inputMode="numeric" autoComplete="cc-csc" placeholder="CVC" style={{ ...cardInput, borderRight: '1.5px solid rgba(26,20,20,.07)' }} />
                          <input value={f.zip} onChange={set('zip')} aria-label="Postal code" autoComplete="postal-code" placeholder="Postal code" style={cardInput} />
                        </div>
                      </div>
                      {err.card ? <span style={{ fontSize: 13, fontWeight: 700, color: '#C11425' }}>Check your card details.</span> : null}
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#818184' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="5" y="11" width="14" height="10" rx="2" />
                          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                        </svg>
                        Encrypted and processed by Square. We never store your card.
                      </span>
                    </div>
                  ) : null}
                  </>
                  )}
                  {!pickup ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 700 }}>Tip</span>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 4, padding: 4, borderRadius: 16, background: '#F0F0F3' }}>
                        {TIP_PRESETS.map((t) => {
                          const on = tip === t;
                          return (
                            <button
                              key={t}
                              onClick={() => setTip(t)}
                              aria-pressed={on}
                              style={{
                                ...segBase,
                                background: on ? '#fff' : 'transparent',
                                color: '#1A1414',
                                boxShadow: on ? '0 2px 8px rgba(26,20,20,.12)' : 'none',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 0,
                              }}
                            >
                              <span style={{ fontWeight: 800, fontSize: 14 }}>{t ? t + '%' : 'None'}</span>
                              <span style={{ fontSize: 11, color: '#818184' }}>{t ? money((sub * t) / 100) : ''}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              </section>
              </>) : null}
            </div>

            {/* Receipt */}
            <aside style={{ position: wide ? 'sticky' : 'static', top: 84, background: '#F7F7F8', borderRadius: 28, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontWeight: 900, fontSize: 22, letterSpacing: '-.03em' }}>Your order</span>
                  <span style={{ fontSize: 14, color: '#818184' }}>{countText}</span>
                </span>
                <button onClick={backToCart} style={{ border: 0, background: 'transparent', fontFamily: 'inherit', fontWeight: 700, fontSize: 14, color: '#D7192D', cursor: 'pointer', padding: '6px 0' }}>
                  Edit
                </button>
              </div>
              {/* Phones: list every item in full (a small scroll box inside the page cut cards off). Desktop sidebar: cap it so the total stays in view. */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, ...(wide ? { maxHeight: 'min(420px, 45vh)', overflow: 'auto', overscrollBehavior: 'contain' } : {}) }}>
                {rows.map((l) => (
                  <div key={l.key} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: 12, borderRadius: 20, background: '#fff', flex: 'none' }}>
                    <div style={{ width: 56, height: 56, flex: 'none', borderRadius: 14, background: '#EFEFF2', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>{thumbBox(l)}</div>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontWeight: 800, fontSize: 15, lineHeight: 1.25, textWrap: 'pretty' } as CSSProperties}>{l.name}</span>
                      <span style={{ fontSize: 13, lineHeight: 1.45, color: '#818184', textWrap: 'pretty' } as CSSProperties}>{l.summary}</span>
                    </div>
                    <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flex: 'none' }}>
                      <span style={{ fontWeight: 800, fontSize: 15 }}>{l.totalText}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#818184' }}>×{l.qty}</span>
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 15, color: '#636366' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Subtotal</span>
                  <span style={{ color: '#1A1414', fontWeight: 700 }}>{money(sub)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>HST (13%)</span>
                  <span style={{ color: '#1A1414', fontWeight: 700 }}>{money(tax)}</span>
                </div>
                {tipAmt > 0 ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Tip</span>
                    <span style={{ color: '#1A1414', fontWeight: 700 }}>{money(tipAmt)}</span>
                  </div>
                ) : null}
                <div style={{ height: 1, background: '#E5E5E8', margin: '4px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', color: '#1A1414' }}>
                  <span style={{ fontWeight: 800, fontSize: 17 }}>Total</span>
                  <span style={{ fontWeight: 900, fontSize: 30, letterSpacing: '-.045em' }}>{money(grand)}</span>
                </div>
              </div>
              <span style={{ fontSize: 12.5, lineHeight: 1.45, color: '#818184', padding: '0 4px' }}>
                By placing your order you agree to our{' '}
                <a href="terms" target="_blank" rel="noopener" style={{ color: '#636366' }}>Terms of service</a> and{' '}
                <a href="privacy" target="_blank" rel="noopener" style={{ color: '#636366' }}>Privacy policy</a>.
              </span>
              {wide && pickup ? (
                <Hov
                  as="button"
                  onClick={place}
                  disabled={busy}
                  aria-busy={busy}
                  style={{ height: 58, border: 0, borderRadius: 18, background: busy ? '#8E8E93' : '#D7192D', color: '#fff', fontFamily: 'inherit', fontWeight: 800, fontSize: 17, cursor: busy ? 'progress' : 'pointer', transition: 'background .2s' }}
                  hover={busy ? undefined : { background: '#BF1222' }}
                >
                  {busy ? 'Processing payment…' : 'Place order'}
                </Hov>
              ) : null}
            </aside>
          </div>

          {!wide && pickup && !kbOpen ? (
            <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 16px calc(12px + env(safe-area-inset-bottom))', background: pageBgA, backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', boxShadow: '0 -1px 0 rgba(26,20,20,.06)' }}>
              {tried && (!timeOk || missing.length || cardErr) ? (
                <span role="status" style={{ ...fieldErr, justifyContent: 'center' }}>
                  <ErrIcon />
                  {!timeOk ? 'Choose a pickup time to place your order.' : missing.length ? 'Add your ' + joinList(missing) + ' to place your order.' : cardErr}
                </span>
              ) : null}
              <button
                onClick={place}
                disabled={busy}
                aria-busy={busy}
                style={{ width: '100%', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', border: 0, borderRadius: 18, background: busy ? '#8E8E93' : '#D7192D', color: '#fff', fontFamily: 'inherit', fontWeight: 800, fontSize: 17, cursor: busy ? 'progress' : 'pointer' }}
              >
                <span>{busy ? 'Processing payment…' : 'Place order'}</span>
                <span style={{ fontWeight: 900 }}>{money(grand)}</span>
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ---------- Order placed (approved confirmation design) ---------- */}
      {done ? <OrderConfirmation done={done} onClose={() => setDone(null)} /> : null}
    </>
  );
}
