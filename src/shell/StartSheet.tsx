import type { CSSProperties, ReactNode } from 'react';
import { SHOP } from '../lib/catalog';
import { useLockBody } from '../lib/hooks';
import { Hov, IconArrow, IconCheck, IconClose, IconPin, Photo } from '../lib/ui';
import type { Mode } from '../lib/types';

/** Next six half-hour slots (prototype `timeSlots`). When closed, starts at 11:00 AM. */
export function timeSlots(open: boolean): string[] {
  const out: string[] = [];
  const d = new Date();
  if (!open) {
    if (d.getHours() >= 2) d.setHours(11, 0, 0, 0);
  } else {
    d.setMinutes(d.getMinutes() < 30 ? 30 : 60, 0, 0);
    d.setMinutes(d.getMinutes() + 30);
  }
  for (let i = 0; i < 6; i++) {
    const hh = d.getHours();
    if (open && hh >= 2 && hh < 11) break;
    out.push(d.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' }).replace('a.m.', 'AM').replace('p.m.', 'PM'));
    d.setMinutes(d.getMinutes() + 30);
  }
  return out;
}

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
  const slots = timeSlots(open);
  const later = when !== 'asap' || !open;
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={LABEL}>Deliver to</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, border: '1.5px solid ' + (addrErr ? '#D7192D' : '#E3E3E6'), borderRadius: 14, padding: '0 16px', height: 54, background: '#fff', transition: 'border-color .15s' }}>
                <IconPin color="#636366" />
                <input
                  value={addr}
                  onChange={(e) => setAddr(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') onConfirm(); }}
                  placeholder="Street address or postal code"
                  aria-label="Delivery address"
                  autoComplete="street-address"
                  style={{ flex: 1, minWidth: 0, border: 0, outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 16, color: '#1A1414', height: '100%' }}
                />
              </div>
              {addrErr ? (
                <span role="alert" style={{ fontSize: 13, color: '#B5121F', fontWeight: 600 }}>{addrErr}</span>
              ) : (
                <span style={{ fontSize: 13, color: '#636366' }}>Delivered by our own drivers.</span>
              )}
            </div>
          )}

          {/* When */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={LABEL}>When</span>
            <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid #E4E4E7', borderRadius: 16, overflow: 'hidden' }}>
              <WhenRow bg={later ? '#fff' : '#F8F8FB'} on={!later} title={open ? 'As soon as possible' : 'Next available'} sub={open ? '' : '11:00 AM'} onClick={() => setWhen('asap')} />
              <WhenRow
                bg={later ? '#F8F8FB' : '#fff'}
                on={later}
                border
                title="Schedule for later"
                sub={later && when !== 'asap' ? when : 'Pick a time'}
                onClick={() => setWhen(when === 'asap' ? slots[0] || 'asap' : when)}
              />
              {later && (
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
            {isPickup ? 'Start pickup order' : 'Start delivery order'}
            <IconArrow size={18} stroke={2.6} />
          </Hov>
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
