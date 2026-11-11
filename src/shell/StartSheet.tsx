import type { CSSProperties, ReactNode } from 'react';
import { SHOP } from '../lib/catalog';
import { useEffect } from 'react';
import { useLockBody } from '../lib/hooks';
import { canOrderAsap, timeSlots } from '../lib/hours';
import { Hov, IconArrow, IconCheck, IconClose, Photo } from '../lib/ui';
import type { Mode } from '../lib/types';

// Pickup times come from the shared hours module (Toronto time), which the payment server also checks.
export { timeSlots } from '../lib/hours';

const LABEL: CSSProperties = { fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#818184' };

export default function StartSheet({
  w, open, wMode, setWMode, addr, setAddr, addrErr, when, setWhen, onConfirm, onClose,
}: {
  w: number;
  /** Is the shop open right now. */
  open: boolean;
  wMode: Mode;
  setWMode: (m: Mode) => void;
  addr: string;
  setAddr: (v: string) => void;
  addrErr: string;
  when: string;
  setWhen: (v: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  useLockBody(true);
  const sheet = w < 560;
  const wide = w >= 820;
  void open;
  const asapOk = canOrderAsap();
  const slots = timeSlots();
  const later = when !== 'asap' || !asapOk;
  // Keep the saved choice valid: no ASAP while closed, and no pickup time that has passed.
  useEffect(() => {
    if (!asapOk && !slots.includes(when)) setWhen(slots[0] || 'asap');
    else if (asapOk && when !== 'asap' && !slots.includes(when)) setWhen('asap');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const isPickup = wMode === 'pickup';

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(18,12,12,.5)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', display: 'flex', alignItems: sheet ? 'flex-end' : 'center', justifyContent: 'center', padding: sheet ? 0 : 16, animation: 'pkpFade .2s ease both' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pkp-start-title"
        style={{ position: 'relative', width: wide ? 'min(960px,100%)' : sheet ? '100%' : 'min(540px,100%)', maxHeight: 'calc(100dvh - 24px)', overflow: 'auto', background: '#fff', borderRadius: sheet ? '28px 28px 0 0' : 28, boxShadow: '0 40px 120px rgba(18,12,12,.35)', display: 'grid', gridTemplateColumns: wide ? 'minmax(0,.92fr) minmax(0,1fr)' : 'minmax(0,1fr)', animation: sheet ? 'pkpUp .32s cubic-bezier(.2,.8,.2,1) both' : 'pkpIn .26s cubic-bezier(.2,.8,.2,1) both' }}
      >
        <div style={{ position: 'relative', minHeight: wide ? '100%' : 150, background: '#2A1E1A' }}>
          <Photo src="https://images.unsplash.com/photo-1513104890138-7c749659a591?fm=jpg&q=75&w=1200&auto=format&fit=crop" eager credit="Photo by Ivan Torres on Unsplash" creditHref="https://unsplash.com/@iavnt" />
          <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '60%', background: 'linear-gradient(180deg,rgba(14,9,9,.62),rgba(14,9,9,0))', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', left: 24, top: 22, right: 64, display: 'flex', alignItems: 'center', gap: 12, color: '#fff', pointerEvents: 'none' }}>
            <span style={{ width: 44, height: 44, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flex: 'none' }}>
              <img src="assets/chef-logo.png" alt="" style={{ width: 36, height: 'auto' }} />
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-.01em' }}>Pizza King &amp; Pasta</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,.85)' }}>Wood-fired pizza · Brampton</span>
            </span>
          </div>
        </div>

        <div style={{ padding: wide ? '34px 34px 30px' : '22px 20px 24px', display: 'flex', flexDirection: 'column', gap: 22, minWidth: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 44 }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#D7192D' }}>Online ordering</span>
            <h2 id="pkp-start-title" style={{ margin: 0, fontWeight: 800, fontSize: 34, lineHeight: 1.02, letterSpacing: '-.035em' }}>Start your order</h2>
            <span style={{ fontSize: 15, color: '#636366' }}>Choose pickup or delivery.</span>
          </div>

          {/* Pickup / Delivery segmented control */}
          <div role="tablist" style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#EFEFF2', borderRadius: 14, padding: 4 }}>
            <span style={{ position: 'absolute', top: 4, bottom: 4, left: isPickup ? 4 : '50%', width: 'calc(50% - 4px)', background: '#fff', borderRadius: 10, boxShadow: '0 1px 2px rgba(26,20,20,.1),0 3px 10px rgba(26,20,20,.06)', transition: 'left .28s cubic-bezier(.3,.8,.3,1)' }} />
            <SegBtn on={isPickup} onClick={() => setWMode('pickup')}>Pickup</SegBtn>
            <SegBtn on={!isPickup} onClick={() => setWMode('delivery')}>Delivery</SegBtn>
          </div>

          {isPickup ? (
            <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid #E4E4E7', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ height: 140, background: '#E9E9EC' }}>
                <iframe title="Map to Pizza King and Pasta" src={SHOP.mapsEmbed} loading="lazy" style={{ width: '100%', height: '100%', border: 0, display: 'block' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderTop: '1px solid #E4E4E7' }}>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{SHOP.street}</span>
                  <span style={{ fontSize: 13, color: '#636366' }}>{SHOP.cityLine}</span>
                </span>
                <Hov as="a" href={SHOP.mapsDirections} target="_blank" rel="noreferrer" style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 700, color: '#1A1414', textDecoration: 'none', whiteSpace: 'nowrap', border: '1px solid #E4E4E7', borderRadius: 999, padding: '8px 14px' }} hover={{ borderColor: '#1A1414' }}>
                  Directions
                </Hov>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.5, color: '#1A1414', textWrap: 'pretty' } as CSSProperties}>Delivery is handled by {SHOP.ubereatsAvailable ? 'DoorDash and Uber Eats' : 'DoorDash'}. You{'\u2019'}ll finish your order in their app.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <AppButton href={SHOP.doordash} logo={SHOP.doordashLogo} name="DoorDash" h={15} />
                <AppButton href={SHOP.ubereats} logo={SHOP.ubereatsLogo} name="Uber Eats" h={20} off={!SHOP.ubereatsAvailable} />
              </div>
              <span style={{ fontSize: 13, lineHeight: 1.45, color: '#636366' }}>
                Delivery fees and tips are paid in the app.
                {SHOP.ubereatsAvailable ? null : <><br />Ordering delivery through Uber Eats is currently unavailable.</>}
              </span>
            </div>
          )}

          {/* When */}
          {isPickup ? (<>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={LABEL}>When</span>
            <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid #E4E4E7', borderRadius: 16, overflow: 'hidden' }}>
              {asapOk ? (
                <WhenRow bg={later ? '#fff' : '#F8F8FB'} on={!later} title="As soon as possible" sub="" onClick={() => setWhen('asap')} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '14px 16px', background: '#FFF8E6' }}>
                  <span style={{ fontWeight: 800, fontSize: 15, color: '#1A1414' }}>We{'’'}re closed right now</span>
                  <span style={{ fontSize: 13, color: '#636366' }}>Open every day, {SHOP.hoursText}. Choose a pickup time below.</span>
                </div>
              )}
              {asapOk && slots.length ? (
                <WhenRow
                  bg={later ? '#F8F8FB' : '#fff'}
                  on={later}
                  border
                  title="Schedule for later"
                  sub={later && when !== 'asap' ? when : 'Pick a time'}
                  onClick={() => setWhen(when === 'asap' ? slots[0] || 'asap' : when)}
                />
              ) : null}
              {later && slots.length > 0 && (
                <div style={{ padding: '2px 16px 16px', background: '#F8F8FB', display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8 }}>
                  {slots.map((t) => {
                    const on = when === t;
                    return (
                      <button key={t} onClick={() => setWhen(t)} aria-pressed={on} style={{ border: '1px solid ' + (on ? '#1A1414' : '#E0E0E3'), background: on ? '#1A1414' : '#fff', color: on ? '#fff' : '#1A1414', borderRadius: 10, height: 40, fontWeight: 600, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background .15s,border-color .15s' }}>
                        {t}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <Hov as="button" onClick={onConfirm} style={{ marginTop: 'auto', border: 0, background: '#D7192D', color: '#fff', borderRadius: 14, height: 54, fontWeight: 700, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'background .15s' }} hover={{ background: '#B5121F' }}>
            Start pickup order
            <IconArrow size={18} stroke={2.6} />
          </Hov>
          </>) : null}
        </div>

        <Hov as="button" onClick={onClose} aria-label="Close" style={{ position: 'absolute', right: 16, top: 16, width: 44, height: 44, borderRadius: '50%', border: 0, background: wide ? '#EFEFF2' : '#fff', color: '#1A1414', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,.08)' }} hover={{ background: '#E3E3E6' }}>
          <IconClose />
        </Hov>
      </div>
    </div>
  );
}

function SegBtn({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button role="tab" aria-selected={on} onClick={onClick} style={{ position: 'relative', border: 0, background: 'transparent', height: 42, fontWeight: 700, fontSize: 15, color: on ? '#1A1414' : '#818184', cursor: 'pointer', transition: 'color .2s' }}>
      {children}
    </button>
  );
}

function WhenRow({ bg, on, border, title, sub, onClick }: { bg: string; on: boolean; border?: boolean; title: string; sub: string; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-pressed={on} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', border: 0, borderTop: border ? '1px solid #E4E4E7' : 0, background: bg, textAlign: 'left', cursor: 'pointer', color: '#1A1414', transition: 'background .15s' }}>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 15, fontWeight: 700 }}>{title}</span>
        {sub && <span style={{ fontSize: 13, color: '#636366' }}>{sub}</span>}
      </span>
      <span style={{ marginLeft: 'auto', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{on && <IconCheck color="#D7192D" />}</span>
    </button>
  );
}

/** "Order delivery on [logo] ↗" button for the Delivery tab. */
function AppButton({ href, logo, name, h, off }: { href: string; logo: string; name: string; h: number; off?: boolean }) {
  if (off) {
    // Same button, greyed out and not clickable (the note under the buttons explains why).
    return (
      <div aria-disabled="true" aria-label={'Order delivery on ' + name + ' (currently unavailable)'} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 60, padding: '0 20px', borderRadius: 14, background: '#F7F7F8', color: '#AEAEB2', boxShadow: 'inset 0 0 0 1px #E4E4E7', cursor: 'not-allowed', userSelect: 'none' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', minWidth: 0 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#AEAEB2', whiteSpace: 'nowrap' }}>Order delivery on</span>
          <img src={logo} alt={name} style={{ display: 'block', height: h, width: 'auto', flex: 'none', filter: 'grayscale(1)', opacity: 0.4 }} />
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }} aria-hidden="true"><path d="M7 17 17 7M8 7h9v9" /></svg>
      </div>
    );
  }
  return (
    <Hov as="a" href={href} target="_blank" rel="noopener noreferrer" aria-label={'Order delivery on ' + name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 60, padding: '0 20px', borderRadius: 14, background: '#fff', color: '#1A1414', textDecoration: 'none', boxShadow: 'inset 0 0 0 1px #E4E4E7', transition: 'box-shadow .15s' }} hover={{ boxShadow: 'inset 0 0 0 2px #1A1414', color: '#1A1414' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', minWidth: 0 }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: '#636366', whiteSpace: 'nowrap' }}>Order delivery on</span>
        <img src={logo} alt={name} style={{ display: 'block', height: h, width: 'auto', flex: 'none' }} />
      </span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }} aria-hidden="true"><path d="M7 17 17 7M8 7h9v9" /></svg>
    </Hov>
  );
}
