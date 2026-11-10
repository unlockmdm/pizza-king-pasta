// Port of design_handoff_pizza_king_website/prototype/CartCheckout.dc.html
// Floating cart bar, cart drawer, checkout and the order-placed confirmation.
import { useEffect, useState, type ChangeEvent, type CSSProperties, type MouseEvent, type ReactNode } from 'react';
import type { CartCheckoutProps, CartLine, Mode } from '../lib/types';
import { DELIVERY_FEE, HST, SHOP } from '../lib/catalog';
import { money } from '../lib/format';
import { Hov } from '../lib/ui';
import { useEscape, useLockBody, useWidth } from '../lib/hooks';
import './CartCheckout.css';

// ---------- Data (from the prototype) ----------
const FEE = DELIVERY_FEE;

/** [img, size, background-size] thumbnail guessed from the item name. */
type Thumb = [string, string, string];
const thumbOf = (name: string): Thumb => {
  const n = (name || '').toLowerCase();
  if (/juice|lassi|coconut|sugarcane/.test(n)) return ['assets/menu/juice-mix.png', '100%', 'cover'];
  if (/gelato|shake|scoop|cone/.test(n)) return ['assets/menu/gelato.jpg', '100%', 'cover'];
  if (/pasta|penne|spaghetti|momo/.test(n)) return ['assets/menu/pasta.jpg', '100%', 'cover'];
  if (/wing|tandoori chicken|leg|fish/.test(n)) return ['assets/ingredients/tandoori-chicken.png', '82%', 'contain'];
  return ['assets/pizza-base.png', '86%', 'contain'];
};
/** A line's own `img` wins over the name guess (cut-out PNGs are contained, photos cover). */
const thumbFor = (l: CartLine): Thumb =>
  l.img ? (/\.png($|\?)/i.test(l.img) ? [l.img, '86%', 'contain'] : [l.img, '100%', 'cover']) : thumbOf(l.name);

interface Upsell {
  key: string;
  name: string;
  unit: number;
  img: string;
  summary: string;
}
const UPSELLS: Upsell[] = [
  { key: 'fruit-juice', name: 'Fresh juice', unit: 6.8, img: 'assets/menu/juice-mix.png', summary: 'Large' },
  { key: 'gelato-cone', name: 'Gelato cone', unit: 5.99, img: 'assets/menu/gelato.jpg', summary: 'Vanilla' },
];

const TIP_PRESETS = [0, 10, 15, 18] as const;
const DEFAULT_TIP = 15;

type Step = 'cart' | 'checkout';
type Pay = 'card' | 'store';
type FieldKey = 'name' | 'phone' | 'email' | 'street' | 'unit' | 'note' | 'card' | 'exp' | 'cvc' | 'zip';
type Form = Record<FieldKey, string>;
const EMPTY_FORM: Form = { name: '', phone: '', email: '', street: '', unit: '', note: '', card: '', exp: '', cvc: '', zip: '' };

interface Done {
  no: string;
  when: string;
  where: string;
  total: string;
  pickup: boolean;
  name: string;
}

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
  children,
}: {
  label: string;
  bg: string;
  children: ReactNode;
}) {
  return (
    <label style={{ ...fieldLabel, background: bg }}>
      <span style={fieldCaption}>{label}</span>
      {children}
    </label>
  );
}

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
  const [pay, setPay] = useState<Pay>('card');
  const [tip, setTip] = useState<number>(DEFAULT_TIP);
  const [f, setF] = useState<Form>(EMPTY_FORM);
  const [tried, setTried] = useState(false);
  const [triedX, setTriedX] = useState(false);
  const [done, setDone] = useState<Done | null>(null);

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
  const sub = lines.reduce((a, l) => a + l.qty * l.unit, 0);
  const fee = pickup ? 0 : FEE;
  const tax = (sub + fee) * HST;
  const tipAmt = pickup ? 0 : (sub * tip) / 100;
  const grand = sub + fee + tax + tipAmt;

  const set = (k: FieldKey) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const v = e.target.value;
    setF((st) => ({ ...st, [k]: v }));
  };
  const digits = f.card.replace(/\D/g, '');
  const errs = {
    email: !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim()),
    name: !f.name.trim(),
    phone: f.phone.replace(/\D/g, '').length < 10,
    street: !pickup && !f.street.trim(),
    card: pay === 'card' && (digits.length < 15 || !/\d{2}\s*\/\s*\d{2}/.test(f.exp) || f.cvc.replace(/\D/g, '').length < 3),
  };
  const show = (k: keyof typeof errs) => tried && errs[k];
  const err = {
    street: show('street'),
    cardB: show('card') ? '#D7192D' : 'transparent',
    card: show('card'),
    express: triedX && (errs.name || errs.phone || errs.email || errs.street),
    any: show('name') || show('phone') || show('email'),
    detailsMsg: show('name') ? 'Enter your name.' : show('phone') ? 'Enter a 10-digit phone number.' : 'Enter a valid email for your receipt.',
  };

  const pageBg = p.pageBg || '#FFFFFF';
  const pageBgA = hexToRgba(pageBg, 0.88);
  const fieldBg = pageBg.toUpperCase() === '#FFFFFF' ? '#F4F4F5' : '#F3F3F6';
  const countText = count + (count === 1 ? ' item' : ' items');
  const setMode = (m: Mode) => p.onMode(m);
  // Owner rule: no wait-time estimates. Timing is ASAP (or scheduled from the start sheet).
  const doneWhen = 'As soon as possible';
  const where = pickup ? SHOP.street : f.street + (f.unit ? ', ' + f.unit : '');
  const firstName = f.name.split(' ')[0];

  const express = (method: string) => {
    if (!count) return;
    if (errs.name || errs.phone || errs.email || errs.street) {
      setTried(true);
      setTriedX(true);
      return;
    }
    setDone({ no: newOrderNo(), when: doneWhen, where, total: money(grand) + ' · ' + method, pickup, name: firstName });
    setStep('cart');
    setTried(false);
    setTriedX(false);
    p.onPlaced();
  };
  const place = () => {
    if (count === 0) return;
    if (Object.values(errs).some(Boolean)) {
      setTried(true);
      return;
    }
    setDone({ no: newOrderNo(), when: doneWhen, where, total: money(grand), pickup, name: firstName });
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

  const rows = lines.map((l) => {
    const [thumb, thumbW, thumbFit] = thumbFor(l);
    return { ...l, thumb, thumbW, thumbFit, totalText: money(l.unit * l.qty), isOne: l.qty === 1 };
  });
  const upsells = UPSELLS.filter((u) => !lines.some((l) => l.key === u.key));

  const modeCards: { id: Mode; label: string; sub: string }[] = [
    { id: 'pickup', label: 'Pickup', sub: 'Ready as soon as possible' },
    { id: 'delivery', label: 'Delivery', sub: money(FEE) + ' · Our own drivers' },
  ];
  const pays: { id: Pay; short: string }[] = [
    { id: 'card', short: 'Card' },
    { id: 'store', short: pickup ? 'Pay at pickup' : 'Pay on delivery' },
  ];
  const lblW = w >= 560 ? 76 : 64;
  const twoCols = w >= 560 ? '1fr 1fr' : '1fr';

  const thumbBox = (r: (typeof rows)[number]) => (
    <span
      aria-hidden="true"
      style={{
        display: 'block',
        flex: 'none',
        backgroundImage: "url('" + r.thumb + "')",
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        width: r.thumbW,
        height: r.thumbW,
        backgroundSize: r.thumbFit,
      }}
    />
  );

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
                <img src="assets/pizza-base.png" alt="" style={{ width: 120, height: 120, opacity: 0.9 }} />
                <span style={{ fontWeight: 900, fontSize: 22, letterSpacing: '-.03em' }}>Your order is empty</span>
                <span style={{ fontSize: 15, color: '#636366' }}>Add a pizza to get started.</span>
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
                            onClick={() => p.onAdd({ key: u.key, name: u.name, summary: u.summary, unit: u.unit })}
                            style={{
                              position: 'relative',
                              flex: 1,
                              minWidth: 0,
                              padding: 0,
                              border: 0,
                              borderRadius: 22,
                              overflow: 'hidden',
                              background: '#EFEFF2',
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
                    </div>
                  ) : null}
                </div>

                <footer style={{ padding: '16px 22px 22px', background: '#fff', boxShadow: '0 -1px 0 #EAEAED', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: 14, color: '#818184' }}>Subtotal · taxes at checkout</span>
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
          style={{ position: 'fixed', inset: 0, zIndex: 90, background: pageBg, overflow: 'auto', animation: 'ccFade .2s ease both', fontFamily: FONT, color: '#1A1414' }}
        >
          <header style={{ position: 'sticky', top: 0, zIndex: 2, background: pageBgA, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
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
              padding: '12px clamp(16px,3vw,32px) 120px',
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
                <h2 style={h2}>Pickup or delivery</h2>
                <div style={card}>
                  <div role="radiogroup" aria-label="Order type" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {modeCards.map((m) => {
                      const on = mode === m.id;
                      return (
                        <button
                          key={m.id}
                          role="radio"
                          aria-checked={on}
                          onClick={() => setMode(m.id)}
                          style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 14,
                            minHeight: 76,
                            padding: '14px 16px',
                            border: 0,
                            borderRadius: 20,
                            background: on ? '#fff' : '#F6F6F7',
                            boxShadow: 'inset 0 0 0 ' + (on ? '2px' : '0px') + ' ' + (on ? '#1A1414' : 'transparent'),
                            fontFamily: 'inherit',
                            textAlign: 'left',
                            color: '#1A1414',
                            cursor: 'pointer',
                            transition: 'box-shadow .2s',
                          }}
                        >
                          <span style={{ width: 44, height: 44, flex: 'none', borderRadius: 14, background: on ? '#D7192D' : '#F4F4F5', color: on ? '#fff' : '#1A1414', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .2s' }}>
                            {m.id === 'pickup' ? (
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 9.5 5.5 4h13L20 9.5" />
                                <path d="M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0" />
                                <path d="M5 12v8h14v-8" />
                                <path d="M10 20v-5h4v5" />
                              </svg>
                            ) : (
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="6" cy="17" r="2.5" />
                                <circle cx="18" cy="17" r="2.5" />
                                <path d="M8.5 17h7M15 7h2.5l3 7.5M12 17l-2-8H6" />
                                <path d="M15 7l-2 10" />
                              </svg>
                            )}
                          </span>
                          <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontWeight: 800, fontSize: 17 }}>{m.label}</span>
                            <span style={{ fontSize: 13, color: '#818184' }}>{m.sub}</span>
                          </span>
                          <span
                            style={{
                              marginLeft: 'auto',
                              flex: 'none',
                              width: 22,
                              height: 22,
                              borderRadius: '50%',
                              background: on ? '#1A1414' : '#fff',
                              boxShadow: 'inset 0 0 0 ' + (on ? '0 #1A1414' : '1.5px #D9D3CE'),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff',
                            }}
                          >
                            <CheckSvg size={12} stroke={3.4} />
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {pickup ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '0 18px', minHeight: 64 }}>
                      <span style={{ width: lblW, flex: 'none', fontSize: 15, fontWeight: 700, color: '#1A1414' }}>Store</span>
                      <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1, padding: '12px 0' }}>
                        <span style={{ fontSize: 16, fontWeight: 600 }}>{SHOP.street}</span>
                        <span style={{ fontSize: 13, color: '#818184' }}>Brampton · {SHOP.phoneText}</span>
                      </span>
                    </div>
                  ) : (
                    <>
                      <Field label="Address" bg={fieldBg}>
                        <input value={f.street} onChange={set('street')} autoComplete="street-address" placeholder="Street address" style={fieldInput} />
                      </Field>
                      <Field label="Unit" bg={fieldBg}>
                        <input value={f.unit} onChange={set('unit')} placeholder="Apt, suite or buzzer (optional)" style={fieldInput} />
                      </Field>
                    </>
                  )}
                </div>
                {err.street ? <span style={errText}>Enter a delivery address.</span> : null}
              </section>

              {/* Contact */}
              <section>
                <h2 style={h2}>Contact</h2>
                <div style={card}>
                  <Field label="Full name" bg={fieldBg}>
                    <input value={f.name} onChange={set('name')} autoComplete="name" placeholder="First and last name" style={fieldInput} />
                  </Field>
                  <div style={{ display: 'grid', gridTemplateColumns: twoCols, gap: 10 }}>
                    <Field label="Phone" bg={fieldBg}>
                      <input value={f.phone} onChange={set('phone')} type="tel" autoComplete="tel" placeholder="(905) 555-0123" style={fieldInput} />
                    </Field>
                    <Field label="Email" bg={fieldBg}>
                      <input value={f.email} onChange={set('email')} type="email" autoComplete="email" placeholder="you@example.com" style={fieldInput} />
                    </Field>
                  </div>
                </div>
                {err.any ? <span style={errText}>{err.detailsMsg}</span> : null}
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
                    placeholder="Allergies, extra crispy, cut in squares, buzzer code…"
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
                  {err.express ? <span style={{ fontSize: 13, fontWeight: 700, color: '#C11425', marginTop: -6 }}>Fill in your details above first.</span> : null}
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
                  {!pickup ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 700 }}>Tip your driver</span>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 320, overflow: 'auto' }}>
                {rows.map((l) => (
                  <div key={l.key} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: 12, borderRadius: 20, background: '#fff' }}>
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
                {!pickup ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Delivery</span>
                    <span style={{ color: '#1A1414', fontWeight: 700 }}>{money(FEE)}</span>
                  </div>
                ) : null}
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
              {wide ? (
                <Hov
                  as="button"
                  onClick={place}
                  style={{ height: 58, border: 0, borderRadius: 18, background: '#D7192D', color: '#fff', fontFamily: 'inherit', fontWeight: 800, fontSize: 17, cursor: 'pointer', transition: 'background .2s' }}
                  hover={{ background: '#BF1222' }}
                >
                  Place order
                </Hov>
              ) : null}
            </aside>
          </div>

          {!wide ? (
            <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, padding: '12px 16px calc(12px + env(safe-area-inset-bottom))', background: pageBgA, backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}>
              <button
                onClick={place}
                style={{ width: '100%', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', border: 0, borderRadius: 18, background: '#D7192D', color: '#fff', fontFamily: 'inherit', fontWeight: 800, fontSize: 17, cursor: 'pointer' }}
              >
                <span>Place order</span>
                <span style={{ fontWeight: 900 }}>{money(grand)}</span>
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ---------- Order placed ---------- */}
      {done ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Order placed"
          style={{ position: 'fixed', inset: 0, zIndex: 90, background: '#F8F8FB', overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'ccFade .25s ease both', fontFamily: FONT, color: '#1A1414' }}
        >
          <div style={{ width: 'min(520px,100%)', background: '#fff', borderRadius: 32, padding: 'clamp(24px,5vw,40px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, textAlign: 'center', animation: 'ccUp .4s cubic-bezier(.2,.8,.2,1) both' }}>
            <span style={{ width: 72, height: 72, borderRadius: '50%', background: '#1E8A4C', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckSvg size={32} stroke={3} />
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: '#818184' }}>{done.no}</span>
              <span style={{ fontWeight: 900, fontSize: 'clamp(30px,5vw,40px)', letterSpacing: '-.045em', lineHeight: 1 }}>Order placed</span>
              <span style={{ fontSize: 16, color: '#636366', lineHeight: 1.5, textWrap: 'pretty' } as CSSProperties}>
                {'Thanks, ' + (done.name || 'friend') + '. We’ll text you ' + (done.pickup ? 'when it’s ready.' : 'when your driver is on the way.')}
              </span>
            </div>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, padding: 16, borderRadius: 20, background: '#F4F4F7', textAlign: 'left', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: '#636366' }}>{done.pickup ? 'Ready for pickup' : 'Arriving'}</span>
                <span style={{ fontWeight: 800 }}>{done.when}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: '#636366' }}>{done.pickup ? 'Pick up at' : 'Delivering to'}</span>
                <span style={{ fontWeight: 800, textAlign: 'right' }}>{done.where}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: '#636366' }}>Total</span>
                <span style={{ fontWeight: 800 }}>{done.total}</span>
              </div>
            </div>
            <button
              onClick={() => setDone(null)}
              style={{ width: '100%', height: 56, border: 0, borderRadius: 999, background: '#1A1414', color: '#fff', fontFamily: 'inherit', fontWeight: 800, fontSize: 16, cursor: 'pointer' }}
            >
              Back to menu
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
