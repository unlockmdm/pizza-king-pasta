// Order confirmation ("Order placed") — the approved design from CartCheckout.dc.html (handoff v2).
import type { CSSProperties } from 'react';
import { HST, SHOP } from '../lib/catalog';
import { money } from '../lib/format';
import { useLockBody, useWidth } from '../lib/hooks';
import type { CartLine } from '../lib/types';
import { Hov } from '../lib/ui';

export type PayKind = 'card' | 'gpay' | 'apple' | 'store';

export interface Confirmation {
  no: string; // "Order #4821"
  name: string;
  when: string; // 'As soon as possible' or a slot label
  items: CartLine[];
  email: string;
  phone: string;
  pay: PayKind;
  /** Square card brand (VISA, MASTERCARD…) or digits typed in the demo form. */
  cardBrand?: string;
  last4?: string;
  receiptUrl?: string;
}

type Stage = 'oven' | 'ready';

/** Progress shown only while the order is in the oven. */
const STEPS: [string, 'done' | 'now' | 'next'][] = [['Received', 'done'], ['In the oven', 'now'], ['Ready for pickup', 'next']];

const BRAND: Record<string, [name: string, w: string, h: string, bg: string]> = {
  visa: ['Visa', '38px', '14px', '#fff'],
  mc: ['Mastercard', '36px', '24px', '#fff'],
  amex: ['American Express', '52px', '36px', '#1F72CD'],
  discover: ['Discover', '40px', '14px', '#fff'],
  apple: ['Apple Pay', '40px', '18px', '#000'],
  google: ['Google Pay', '42px', '18px', '#fff'],
};

function brandKey(c: Confirmation): string {
  if (c.pay === 'apple') return 'apple';
  if (c.pay === 'gpay') return 'google';
  if (c.pay === 'store') return 'store';
  const b = (c.cardBrand || '').toUpperCase();
  if (b === 'VISA') return 'visa';
  if (b === 'MASTERCARD') return 'mc';
  if (b === 'AMERICAN_EXPRESS') return 'amex';
  if (b === 'DISCOVER' || b === 'DISCOVER_DINERS') return 'discover';
  const d = b.replace(/\D/g, ''); // demo form digits
  if (/^3[47]/.test(d)) return 'amex';
  if (/^(5[1-5]|2[2-7])/.test(d)) return 'mc';
  if (/^4/.test(d)) return 'visa';
  if (/^6/.test(d)) return 'discover';
  return 'card';
}

const ember = (right: string, bottom: string, size: number, anim: string): CSSProperties => ({
  position: 'absolute', right, bottom, width: size, height: size, borderRadius: '50%', background: '#FFB347',
  boxShadow: '0 0 8px 2px rgba(255,140,40,.9)', animation: anim, opacity: 0,
});
const steam = (left: string, bottom: string, w: number, h: number, anim: string): CSSProperties => ({
  position: 'absolute', left, bottom, width: w, height: h, borderRadius: '50%',
  background: 'radial-gradient(ellipse at 50% 60%,rgba(255,255,255,.6),rgba(255,255,255,0) 70%)',
  filter: 'blur(9px)', mixBlendMode: 'screen', opacity: 0, animation: anim,
});

export default function OrderConfirmation({
  done, onClose, thumbFor, stage = 'oven',
}: {
  done: Confirmation;
  onClose: () => void;
  thumbFor: (l: CartLine) => [string, string, string];
  stage?: Stage;
}) {
  useLockBody(true);
  const w = useWidth();
  const ready = stage === 'ready';
  const items = done.items || [];
  const sub = items.reduce((a, l) => a + l.qty * l.unit, 0);
  const tax = sub * HST;
  const count = items.reduce((a, l) => a + l.qty, 0);
  const noShort = done.no.replace('Order ', '');
  const whenLine = ready ? 'Ready now' : /soon/i.test(done.when) ? 'Ready as soon as possible' : 'Ready at ' + done.when;
  const line = ready
    ? 'Your order is waiting at ' + SHOP.street + '. Your receipt was sent to ' + (done.email || 'your email') + '.'
    : 'Your order is in the kitchen. We’ll text ' + (done.phone ? done.phone.trim() : 'you') + ' when it’s ready' + (done.email ? ', and your receipt is on its way to ' + done.email.trim() + '.' : '.');

  const bk = brandKey(done);
  const L = BRAND[bk];
  const l4 = done.last4 || (done.cardBrand || '').replace(/\D/g, '').slice(-4);
  const payTitle = bk === 'apple' || bk === 'google' ? L[0] : bk === 'store' ? 'Pay at pickup' : (L ? L[0] : 'Card') + (l4 ? ' ending in ' + l4 : '');
  const paySub = bk === 'store' ? 'Cash, debit or card at the counter' : 'Processed by Square';

  const statusCard: CSSProperties = { position: 'relative', display: 'flex', alignItems: 'center', padding: 'clamp(22px,3vw,28px) clamp(24px,4vw,36px)', borderRadius: 32, color: '#fff', overflow: 'hidden' };
  const orderPill = (
    <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 12, marginTop: 10, padding: 8, borderRadius: 999, background: 'rgba(255,255,255,.12)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.2)' }}>
      <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', paddingLeft: 10 }}>Order number</span>
      <span style={{ height: 34, padding: '0 14px', borderRadius: 999, background: '#fff', color: '#1A1414', fontWeight: 900, fontSize: 15, letterSpacing: '-.01em', display: 'flex', alignItems: 'center' }}>{noShort}</span>
    </div>
  );
  const infoCard: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4, padding: 22, borderRadius: 24, background: '#F4F4F6' };
  const infoLink: CSSProperties = { marginTop: 10, fontWeight: 800, fontSize: 15, color: '#D7192D', textDecoration: 'none' };

  return (
    <div role="dialog" aria-modal="true" aria-label="Order confirmed" style={{ position: 'fixed', inset: 0, zIndex: 90, background: '#fff', overflow: 'auto', animation: 'ccFade .25s ease both', fontFamily: "'Figtree',system-ui,sans-serif", color: '#1A1414' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 2, background: 'rgba(255,255,255,.9)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid #EEEEF0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', height: 68, padding: '0 clamp(16px,3vw,32px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="assets/chef-logo.png" alt="" style={{ width: 40, height: 'auto' }} />
            <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: '-.03em', whiteSpace: 'nowrap' }}>Pizza King <span style={{ color: '#D7192D' }}>&amp;</span> Pasta</span>
          </span>
          <Hov as="button" onClick={onClose} aria-label="Close" style={{ width: 44, height: 44, border: 0, borderRadius: '50%', background: '#F2F2F5', color: '#1A1414', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .2s' }} hover={{ background: '#E6E6EA' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </Hov>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(28px,5vw,64px) clamp(16px,3vw,32px) 64px', display: 'grid', gridTemplateColumns: w >= 980 ? 'minmax(0,1fr) 420px' : 'minmax(0,1fr)', gap: 'clamp(28px,4vw,56px)', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28, minWidth: 0, animation: 'ccUp .5s cubic-bezier(.2,.8,.2,1) both' }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#818184', letterSpacing: '.01em' }}>{done.no}</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <h1 style={{ margin: 0, fontWeight: 900, fontSize: 'clamp(46px,7vw,92px)', lineHeight: 0.92, letterSpacing: '-.055em' }}>
              {'Thanks, ' + (done.name || 'friend') + '.'}
              <br />
              <span style={{ color: ready ? '#1E8A4C' : '#D7192D' }}>{ready ? 'It’s ready.' : 'We’re on it.'}</span>
            </h1>
            <p style={{ margin: 0, maxWidth: 520, fontSize: 'clamp(16px,1.4vw,18px)', lineHeight: 1.55, color: '#636366', textWrap: 'pretty' } as CSSProperties}>{line}</p>
          </div>

          {!ready ? (
            <div aria-label="Order status" style={{ ...statusCard, background: '#1A1414' }}>
              <img src="assets/oven.png" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 22%', transformOrigin: 'center top', animation: 'ocDrift 14s ease-in-out infinite alternate' }} />
              <span style={{ position: 'absolute', right: '-8%', top: '-30%', width: '62%', height: '100%', background: 'radial-gradient(ellipse at 55% 45%,rgba(255,150,50,.6),rgba(255,90,10,.28) 42%,transparent 70%)', mixBlendMode: 'screen', animation: 'ocFlicker 2.3s ease-in-out infinite' }} />
              <span style={{ position: 'absolute', right: '6%', top: '-10%', width: '40%', height: '70%', background: 'radial-gradient(ellipse at 50% 50%,rgba(255,200,90,.5),transparent 65%)', mixBlendMode: 'screen', animation: 'ocFlicker 1.4s ease-in-out .3s infinite' }} />
              <span style={{ position: 'absolute', right: '4%', bottom: '6%', width: '60%', height: '55%', background: 'radial-gradient(ellipse at 55% 50%,rgba(255,130,40,.35),transparent 70%)', mixBlendMode: 'screen', animation: 'ocFlicker 3.1s ease-in-out .8s infinite' }} />
              <span style={ember('18%', '48%', 4, 'ocEmberA 2.6s linear 0s infinite')} />
              <span style={ember('26%', '55%', 3, 'ocEmberB 3.5s linear .9s infinite')} />
              <span style={ember('12%', '40%', 3, 'ocEmberA 4.2s linear 1.6s infinite')} />
              <span style={ember('32%', '50%', 4, 'ocEmberB 4.8s linear 2.2s infinite')} />
              <span style={ember('8%', '58%', 2, 'ocEmberB 3.1s linear .5s infinite')} />
              <span style={ember('22%', '44%', 2, 'ocEmberA 5.4s linear 2.8s infinite')} />
              <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,rgba(18,10,8,.94) 0%,rgba(18,10,8,.78) 36%,rgba(18,10,8,.15) 72%,rgba(18,10,8,0) 100%)' }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', zIndex: 1 }}>
                <span style={{ fontWeight: 900, fontSize: 'clamp(38px,5vw,52px)', letterSpacing: '-.05em', lineHeight: 0.95 }}>In the oven</span>
                <span style={{ maxWidth: 340, fontSize: 16, lineHeight: 1.5, color: '#E2D7D1', textWrap: 'pretty' } as CSSProperties}>Wood-fired and made to order. We{'’'}ll text you the moment it{'’'}s ready.</span>
                {orderPill}
              </div>
            </div>
          ) : null}
          {!ready ? (
            <div role="list" aria-label="Order progress" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10 }}>
              {STEPS.map(([label, k]) => (
                <div key={label} role="listitem" aria-current={k === 'now' ? 'step' : undefined} style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
                  <span style={{ position: 'relative', display: 'block', height: 6, borderRadius: 999, background: '#EEEEF0', overflow: 'hidden' }}>
                    <span style={{ position: 'absolute', inset: 0, borderRadius: 999, background: k === 'next' ? 'transparent' : k === 'done' ? '#1E8A4C' : '#D7192D', transformOrigin: 'left center', animation: k === 'now' ? 'ccGrow 2.4s ease-in-out infinite' : 'none' }} />
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 800, color: k === 'next' ? '#9A9AA0' : '#1A1414', minWidth: 0 }}>
                    <span style={{ width: 8, height: 8, flex: 'none', borderRadius: '50%', background: k === 'done' ? '#1E8A4C' : k === 'now' ? '#D7192D' : '#D9D9DE', boxShadow: k === 'now' ? '0 0 0 4px rgba(215,25,45,.16)' : 'none' }} />
                    <span style={{ overflowWrap: 'anywhere' }}>{label}</span>
                  </span>
                </div>
              ))}
            </div>
          ) : null}
          {ready ? (
            <div aria-label="Order status" style={{ ...statusCard, background: '#120B08' }}>
              <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: w >= 760 ? '64%' : '100%', overflow: 'hidden' }}>
                <img src="assets/ready.jpg" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '60% 62%' }} />
                <span style={steam('34%', '46%', 56, 110, 'ccSteamA 5.2s ease-out 0s infinite')} />
                <span style={steam('46%', '50%', 70, 130, 'ccSteamB 6.1s ease-out 1.1s infinite')} />
                <span style={steam('58%', '48%', 60, 120, 'ccSteamA 5.6s ease-out 2.3s infinite')} />
                <span style={steam('70%', '46%', 74, 140, 'ccSteamB 6.6s ease-out .6s infinite')} />
                <span style={steam('82%', '44%', 54, 110, 'ccSteamA 5s ease-out 3s infinite')} />
              </div>
              <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,rgba(18,11,8,1) 0%,rgba(18,11,8,.88) 34%,rgba(18,11,8,.25) 62%,rgba(18,11,8,0) 80%)' }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', zIndex: 1 }}>
                <span style={{ fontWeight: 900, fontSize: 'clamp(38px,5vw,52px)', letterSpacing: '-.05em', lineHeight: 0.95 }}>Ready for pickup</span>
                <span style={{ maxWidth: 360, fontSize: 16, lineHeight: 1.5, color: '#E2D7D1', textWrap: 'pretty' } as CSSProperties}>Hot out of the oven. Give your name or order number at the counter.</span>
                {orderPill}
              </div>
            </div>
          ) : null}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,240px),1fr))', gap: 12 }}>
            <div style={infoCard}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#818184' }}>Pick up at</span>
              <span style={{ fontWeight: 900, fontSize: 19, letterSpacing: '-.02em' }}>{SHOP.street}</span>
              <span style={{ fontSize: 14, color: '#818184' }}>{SHOP.cityLine} · {whenLine}</span>
              <a href={SHOP.mapsDirections} target="_blank" rel="noopener noreferrer" style={infoLink}>Get directions →</a>
            </div>
            <div style={infoCard}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#818184' }}>Questions?</span>
              <span style={{ fontWeight: 900, fontSize: 19, letterSpacing: '-.02em' }}>{SHOP.phoneText}</span>
              <span style={{ fontSize: 14, color: '#818184' }}>Call the shop about this order</span>
              <a href={SHOP.phoneHref} style={infoLink}>Call now →</a>
            </div>
          </div>
        </div>

        <aside style={{ position: w >= 980 ? 'sticky' : 'static', top: 96, display: 'flex', flexDirection: 'column', borderRadius: 28, background: '#fff', boxShadow: '0 0 0 1px #EEEEF0,0 24px 60px rgba(26,20,20,.08)', overflow: 'hidden', animation: 'ccUp .6s .08s cubic-bezier(.2,.8,.2,1) both' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, padding: '24px 24px 16px' }}>
            <span style={{ fontWeight: 900, fontSize: 24, letterSpacing: '-.035em' }}>Receipt</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#818184', whiteSpace: 'nowrap' }}>{count + (count === 1 ? ' item' : ' items')}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', padding: '0 24px' }}>
            {items.map((l) => {
              const [thumb, thumbW, fit] = thumbFor(l);
              return (
                <div key={l.key} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderTop: '1px solid #F0F0F2' }}>
                  <span style={{ width: 52, height: 52, flex: 'none', borderRadius: 16, background: '#F2F2F5', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <span style={{ display: 'block', backgroundImage: "url('" + thumb + "')", backgroundPosition: 'center', backgroundRepeat: 'no-repeat', width: thumbW, height: thumbW, backgroundSize: fit }} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontWeight: 800, fontSize: 15, lineHeight: 1.25 }}>{l.name}</span>
                    {l.summary ? <span style={{ fontSize: 13, color: '#818184', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.summary}</span> : null}
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flex: 'none' }}>
                    <span style={{ fontWeight: 800, fontSize: 15 }}>{money(l.unit * l.qty)}</span>
                    {l.qty > 1 ? <span style={{ fontSize: 12, fontWeight: 700, color: '#818184' }}>{'×' + l.qty}</span> : null}
                  </span>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8, padding: '20px 24px 24px', background: '#F8F8FA', borderTop: '1px dashed #DCDCE0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, color: '#636366' }}><span>Subtotal</span><span style={{ fontWeight: 700, color: '#1A1414' }}>{money(sub)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, color: '#636366' }}><span>HST (13%)</span><span style={{ fontWeight: 700, color: '#1A1414' }}>{money(tax)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 12, borderTop: '1px solid #E6E6EA' }}>
              <span style={{ fontWeight: 900, fontSize: 18, whiteSpace: 'nowrap' }}>{bk === 'store' ? 'Total due at pickup' : 'Total paid'}</span>
              <span style={{ fontWeight: 900, fontSize: 28, letterSpacing: '-.04em' }}>{money(sub + tax)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 6 }}>
              <span style={{ width: 52, height: 36, flex: 'none', borderRadius: 8, background: L ? L[3] : '#fff', boxShadow: 'inset 0 0 0 1px #E3E3E7', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {L ? (
                  <img src={'assets/pay/' + bk + '.svg'} alt={L[0]} style={{ width: L[1], height: L[2], objectFit: 'contain' }} />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1414" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /></svg>
                )}
              </span>
              <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
                <span style={{ fontWeight: 800, fontSize: 14, color: '#1A1414' }}>{payTitle}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#818184' }}>{paySub}</span>
              </span>
              {done.receiptUrl ? (
                <a href={done.receiptUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 'none', fontSize: 13, fontWeight: 800, color: '#D7192D', textDecoration: 'none' }}>Receipt ↗</a>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
