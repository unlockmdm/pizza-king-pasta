// Options pop-up for the full menu page: the same choices as the category pages and the pasta bar
// (flavour, size, sauce, Square's sugar / ice / black salt adjustments, pasta extras), so an item
// added from /menu reaches the kitchen exactly like one added from its own page.
import { useState } from 'react';
import type { CategoryId, NewLine } from '../lib/types';
import { CAT_MENU, PASTA_EXTRAS, PASTA_REMOVE, SPICES, mustPrice, visibleGroups, type LineSpec, type PastaBaseId, type PastaSauceId } from '../lib/pricing';
import { money } from '../lib/format';
import { Hov } from '../lib/ui';

export type SheetTarget =
  | { kind: 'cat'; cat: CategoryId; id: string }
  | { kind: 'pasta'; name: string; base: PastaBaseId; sauce: PastaSauceId };

const label = { fontSize: 13, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: '#636366' } as const;
const chipRow = { display: 'flex', flexWrap: 'wrap', gap: 6 } as const;
const chip = (on: boolean) => ({ minHeight: 40, padding: '8px 14px', border: 0, borderRadius: 999, background: on ? '#1A1414' : '#F2F2F5', color: on ? '#fff' : '#1A1414', fontFamily: 'inherit', fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'background .15s,color .15s' }) as const;

export default function MenuOptionsSheet({ target, onAdd, onClose }: { target: SheetTarget; onAdd: (line: NewLine, qty: number) => void; onClose: () => void }) {
  const item = target.kind === 'cat' ? CAT_MENU[target.cat].items.find((x) => x.id === target.id) : undefined;
  const allGroups = item?.groups || [];
  const [sel, setSel] = useState<Record<string, string>>(() => Object.fromEntries(allGroups.map((g) => [g.id, item?.def?.[g.id] || g.opts[0].id])));
  // Groups hidden by the current choice (e.g. can size for water) are not shown or sent.
  const groups = visibleGroups(allGroups, (id) => sel[id]);
  const [spice, setSpice] = useState(SPICES[0]);
  const [extras, setExtras] = useState<string[]>([]);
  const [remove, setRemove] = useState<string[]>([]);
  const [qty, setQty] = useState(1);
  const toggle = (set: (f: (v: string[]) => string[]) => void, id: string) => set((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]));

  const removable = target.kind === 'pasta' ? PASTA_REMOVE.filter((x) => x[2].includes(target.base)) : [];
  const spec: LineSpec =
    target.kind === 'cat'
      ? { k: 'cat', cat: target.cat, id: target.id, opts: Object.fromEntries(groups.map((g) => [g.id, sel[g.id]])) }
      : { k: 'pasta', base: target.base, sauce: target.sauce, spice, ...(extras.length ? { extras } : {}), ...(remove.length ? { remove } : {}) };
  const q = mustPrice(spec);
  const title = target.kind === 'cat' ? item?.name || '' : target.name;
  const key =
    target.kind === 'cat'
      ? [target.id, ...groups.map((g) => sel[g.id])].join('-')
      : ['pasta', target.base, target.sauce, spice, ...[...extras].sort(), ...remove.map((r) => 'no-' + r)].join('-');

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(26,20,20,.45)', animation: 'pkmFade .2s ease both' }} />
      <div role="dialog" aria-modal="true" aria-label={title} style={{ position: 'relative', width: 'min(460px,100%)', maxHeight: 'calc(100dvh - 32px)', background: '#fff', borderRadius: 24, display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(26,20,20,.25)', animation: 'pkmIn .22s ease both', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: '22px 22px 8px' }}>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontWeight: 900, fontSize: 22, letterSpacing: '-.03em' }}>{title}</span>
            {item?.desc ? <span style={{ fontSize: 14, color: '#636366' }}>{item.desc}</span> : null}
          </span>
          <button type="button" onClick={onClose} aria-label="Close" style={{ width: 42, height: 42, border: 0, borderRadius: '50%', background: '#F2F2F5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1A1414', flex: 'none' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <div style={{ overflowY: 'auto', overscrollBehavior: 'contain', padding: '8px 22px 16px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {groups.map((g) => (
            <div key={g.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={label}>{g.label || 'Option'}</span>
              <div role="radiogroup" aria-label={g.label || 'Option'} style={chipRow}>
                {g.opts.map((x) => {
                  const on = sel[g.id] === x.id;
                  return (
                    <button key={x.id} type="button" role="radio" aria-checked={on} onClick={() => setSel((s) => ({ ...s, [g.id]: x.id }))} style={chip(on)}>
                      {x.long && g.id === 'size' ? x.long : x.label}
                      {x.price != null ? <span style={{ opacity: 0.7, fontWeight: 600 }}> {money(x.price)}</span> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {target.kind === 'pasta' ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={label}>Spice level <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 600 }}>· optional</span></span>
                <div role="group" aria-label="Spice level" style={chipRow}>
                  {SPICES.slice(1).map((v) => <button key={v} type="button" aria-pressed={spice === v} onClick={() => setSpice((cur) => (cur === v ? SPICES[0] : v))} style={chip(spice === v)}>{v}</button>)}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={label}>Extras</span>
                <div role="group" aria-label="Extras" style={chipRow}>
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
                  <div role="group" aria-label="Leave out" style={chipRow}>
                    {removable.map(([id, name]) => <button key={id} type="button" aria-pressed={remove.includes(id)} onClick={() => toggle(setRemove, id)} style={chip(remove.includes(id))}>{name}</button>)}
                  </div>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
        <div style={{ display: 'flex', gap: 10, padding: '12px 22px 22px', borderTop: '1px solid #F0F0F2' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#F2F2F5', borderRadius: 999, padding: 4 }}>
            <button type="button" aria-label="Decrease quantity" onClick={() => setQty((n) => Math.max(1, n - 1))} style={{ width: 40, height: 40, border: 0, borderRadius: '50%', background: '#fff', cursor: 'pointer', fontSize: 18, fontWeight: 800, color: '#1A1414' }}>−</button>
            <span style={{ minWidth: 22, textAlign: 'center', fontWeight: 800 }}>{qty}</span>
            <button type="button" aria-label="Increase quantity" onClick={() => setQty((n) => Math.min(20, n + 1))} style={{ width: 40, height: 40, border: 0, borderRadius: '50%', background: '#fff', cursor: 'pointer', fontSize: 18, fontWeight: 800, color: '#1A1414' }}>+</button>
          </div>
          <Hov
            as="button"
            type="button"
            onClick={() => onAdd({ key, name: q.name, summary: q.summary, unit: q.unit, spec }, qty)}
            style={{ flex: 1, height: 48, border: 0, borderRadius: 999, background: '#D7192D', color: '#fff', fontFamily: 'inherit', fontWeight: 800, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}
            hover={{ background: '#B8121F' }}
          >
            <span>Add to order</span>
            <span>{money(q.unit * qty)}</span>
          </Hov>
        </div>
      </div>
    </div>
  );
}
