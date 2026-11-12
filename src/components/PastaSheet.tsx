// Pasta pop-up, opened from a sauce card on the pasta page: pick chicken / veggie / regular for that
// sauce (tick boxes, like the shop's own sketch), then optional spice, extras, leave-outs and quantity.
import { useState, type CSSProperties } from 'react';
import type { NewLine } from '../lib/types';
import { PASTA_BASES, PASTA_EXTRAS, PASTA_REMOVE, SPICES, mustPrice, type LineSpec, type PastaBaseId, type PastaSauceId } from '../lib/pricing';
import { money } from '../lib/format';
import { Hov, IconCheck } from '../lib/ui';
import { useEscape, useLockBody } from '../lib/hooks';

const SAUCE_NAME: Record<PastaSauceId, string> = { rose: 'Rosé', alfredo: 'Alfredo', tomato: 'Tomato' };
/** e.g. "Chicken Pasta with Rosé Sauce" (owner wants Pasta and Sauce capitalized). */
export const pastaName = (base: string, sauce: PastaSauceId) => base + ' Pasta with ' + SAUCE_NAME[sauce] + ' Sauce';

const label: CSSProperties = { fontSize: 13, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: '#636366' };
const hint: CSSProperties = { fontSize: 13, fontWeight: 600, color: '#8E8E93' };
const chip = (on: boolean): CSSProperties => ({ minHeight: 40, padding: '8px 14px', border: 0, borderRadius: 999, background: on ? '#1A1414' : '#F2F2F5', color: on ? '#fff' : '#1A1414', fontFamily: 'inherit', fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'background .15s,color .15s' });
const box = (on: boolean): CSSProperties => ({ flex: 'none', width: 24, height: 24, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', background: on ? '#D7192D' : '#fff', boxShadow: on ? 'none' : 'inset 0 0 0 2px #CFCFD5', transition: 'background .15s' });
const row = (on: boolean): CSSProperties => ({ display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 60, padding: '12px 14px', border: 0, borderRadius: 16, background: on ? '#FFF3F4' : '#F7F7F9', boxShadow: on ? 'inset 0 0 0 2px #D7192D' : 'none', fontFamily: 'inherit', color: '#1A1414', textAlign: 'left', cursor: 'pointer', transition: 'background .15s,box-shadow .15s' });

export default function PastaSheet({ sauce, img, onAdd, onClose }: { sauce: PastaSauceId; img: string; onAdd: (line: NewLine, qty: number) => void; onClose: () => void }) {
  useLockBody(true);
  useEscape(true, onClose);
  const bases = PASTA_BASES.filter((b) => b.p[sauce] != null);
  const [baseId, setBase] = useState<PastaBaseId | null>(null);
  const [spice, setSpice] = useState(SPICES[0]);
  const [extras, setExtras] = useState<string[]>([]);
  const [remove, setRemove] = useState<string[]>([]);
  const [qty, setQty] = useState(1);
  const toggle = (set: (f: (v: string[]) => string[]) => void, id: string) => set((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]));

  // Leave-outs only for what's in the chosen pasta (no "No chicken" on veggie).
  const removable = baseId ? PASTA_REMOVE.filter((x) => x[2].includes(baseId)) : [];
  const removeNow = remove.filter((id) => removable.some((x) => x[0] === id));
  const spec: LineSpec | null = baseId ? { k: 'pasta', base: baseId, sauce, spice, ...(extras.length ? { extras } : {}), ...(removeNow.length ? { remove: removeNow } : {}) } : null;
  const q = spec ? mustPrice(spec) : null;
  const title = SAUCE_NAME[sauce] + ' Sauce Pasta';

  const add = () => {
    if (!spec || !q || !baseId) return;
    onAdd({ key: ['pasta', baseId, sauce, spice, ...[...extras].sort(), ...removeNow.map((r) => 'no-' + r)].join('-'), name: q.name, summary: q.summary, unit: q.unit, spec }, qty);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(26,20,20,.45)', animation: 'pkmFade .2s ease both' }} />
      <div role="dialog" aria-modal="true" aria-label={title} style={{ position: 'relative', width: 'min(480px,100%)', maxHeight: 'calc(100dvh - 32px)', background: '#fff', borderRadius: 24, display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(26,20,20,.25)', animation: 'pkmIn .22s ease both', overflow: 'hidden' }}>
        <div style={{ overflowY: 'auto', overscrollBehavior: 'contain', display: 'flex', flexDirection: 'column' }}>
          <div style={{ position: 'relative', flex: 'none', aspectRatio: '16/9', backgroundColor: '#EDEDF0', backgroundImage: `url('${img}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <button type="button" onClick={onClose} aria-label="Close" style={{ position: 'absolute', right: 14, top: 14, width: 42, height: 42, border: 0, borderRadius: '50%', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1A1414', boxShadow: '0 4px 14px rgba(0,0,0,.15)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22, padding: '20px 20px 18px' }}>
            <span style={{ fontWeight: 900, fontSize: 26, letterSpacing: '-.035em', lineHeight: 1.1 }}>{title}</span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={label}>Choose your pasta</span>
                <span style={hint}>Required</span>
              </span>
              <div role="radiogroup" aria-label="Pasta" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {bases.map((b) => {
                  const on = baseId === b.id;
                  return (
                    <button key={b.id} type="button" role="radio" aria-checked={on} onClick={() => setBase(b.id)} style={row(on)}>
                      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontWeight: 800, fontSize: 16 }}>{pastaName(b.name, sauce)}</span>
                        <span style={{ fontSize: 13, lineHeight: 1.35, color: '#646467' }}>{b.desc}</span>
                      </span>
                      <span style={{ flex: 'none', fontWeight: 900, fontSize: 16 }}>{money(b.p[sauce] as number)}</span>
                      <span aria-hidden="true" style={box(on)}>{on ? <IconCheck size={14} stroke={3.6} /> : null}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Spice is optional: tick one, or leave all unticked (sent to the kitchen as "No spice"). */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={label}>Spice level</span>
                <span style={hint}>Optional</span>
              </span>
              <div role="group" aria-label="Spice level" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {SPICES.slice(1).map((v) => {
                  const on = spice === v;
                  return (
                    <button key={v} type="button" aria-pressed={on} onClick={() => setSpice((cur) => (cur === v ? SPICES[0] : v))} style={{ ...row(on), minHeight: 50 }}>
                      <span style={{ flex: 1, fontWeight: 700, fontSize: 15 }}>{v}</span>
                      <span aria-hidden="true" style={box(on)}>{on ? <IconCheck size={14} stroke={3.6} /> : null}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Square "Extra Pasta Topping(s)" and "Remove Pasta Toppings". */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={label}>Extras</span>
                <span style={hint}>Optional</span>
              </span>
              <div role="group" aria-label="Extras" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {PASTA_EXTRAS.map(([id, name, p]) => (
                  <button key={id} type="button" aria-pressed={extras.includes(id)} onClick={() => toggle(setExtras, id)} style={chip(extras.includes(id))}>
                    {name.replace(/^Extra /, '').replace(/^./, (c) => c.toUpperCase())} <span style={{ opacity: 0.7, fontWeight: 600 }}>+{money(p)}</span>
                  </button>
                ))}
              </div>
            </div>
            {removable.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={label}>Leave out</span>
                <div role="group" aria-label="Leave out" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {removable.map(([id, name]) => <button key={id} type="button" aria-pressed={removeNow.includes(id)} onClick={() => toggle(setRemove, id)} style={chip(removeNow.includes(id))}>{name}</button>)}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, padding: '12px 20px 20px', borderTop: '1px solid #F0F0F2' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#F2F2F5', borderRadius: 999, padding: 4 }}>
            <button type="button" aria-label="Decrease quantity" onClick={() => setQty((n) => Math.max(1, n - 1))} style={{ width: 40, height: 40, border: 0, borderRadius: '50%', background: '#fff', cursor: 'pointer', fontSize: 18, fontWeight: 800, color: '#1A1414' }}>−</button>
            <span style={{ minWidth: 22, textAlign: 'center', fontWeight: 800 }}>{qty}</span>
            <button type="button" aria-label="Increase quantity" onClick={() => setQty((n) => Math.min(20, n + 1))} style={{ width: 40, height: 40, border: 0, borderRadius: '50%', background: '#fff', cursor: 'pointer', fontSize: 18, fontWeight: 800, color: '#1A1414' }}>+</button>
          </div>
          <Hov
            as="button"
            type="button"
            disabled={!q}
            onClick={add}
            style={{ flex: 1, height: 48, border: 0, borderRadius: 999, background: q ? '#D7192D' : '#E3E3E7', color: q ? '#fff' : '#8E8E93', fontFamily: 'inherit', fontWeight: 800, fontSize: 16, cursor: q ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: q ? 'space-between' : 'center', padding: '0 20px' }}
            hover={q ? { background: '#B8121F' } : undefined}
          >
            {q ? (
              <>
                <span>Add to order</span>
                <span>{money(q.unit * qty)}</span>
              </>
            ) : (
              <span>Choose a pasta</span>
            )}
          </Hov>
        </div>
      </div>
    </div>
  );
}
