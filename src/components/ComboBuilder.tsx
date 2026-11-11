// Port of design_handoff_pizza_king_website/prototype/ComboBuilder.dc.html
// Pickup combo builder: full-screen sheet. Pizzas open the Pizza Builder in "combo" mode.
import { useState, type CSSProperties } from 'react';
import type { ComboBuilderProps, ComboContext, NewLine, PizzaConfig, SizeKey } from '../lib/types';
import { SIZE_NAMES } from '../lib/catalog';
import { money } from '../lib/format';
import { Hov } from '../lib/ui';
import { useEscape, useLockBody } from '../lib/hooks';
import PizzaBuilder from './PizzaBuilder';

// ---------- Spec data (from the prototype; these arrays are the spec) ----------
const EXTRA_DIP = 1.33; // Square: dipping sauce $1.33
const MAX_DIPS = 8;

type DipId = 'garlic' | 'ranch' | 'chipotle' | 'jalapeno-cheddar' | 'marinara';
const DIPS: [DipId, string][] = [
  ['garlic', 'Creamy garlic'],
  ['ranch', 'Ranch'],
  ['chipotle', 'Chipotle'],
  ['jalapeno-cheddar', 'Jalapeño cheddar'],
  ['marinara', 'Marinara'],
];

type PopName = 'Coca-Cola' | 'Pepsi' | 'Sprite' | 'Canada Dry' | 'Orange Crush';
const POPS: PopName[] = ['Coca-Cola', 'Pepsi', 'Sprite', 'Canada Dry', 'Orange Crush'];
/** Trimmed, same-height cans. */
const POP_IMG: Record<PopName, string> = {
  'Coca-Cola': 'n-coke.png',
  Pepsi: 'n-pepsi.png',
  Sprite: 'n-sprite.png',
  'Canada Dry': 'n-canada-dry.png',
  'Orange Crush': 'n-crush.png',
};

type SideId = 'sugarcane' | 'corn';
/** [id, name, img, worth, desc] */
const SIDES: [SideId, string, string, string, string][] = [
  ['sugarcane', 'Sugarcane juice', 'assets/menu/juice-mix.png', '$6.81', 'Fresh pressed, ice cold'],
  ['corn', 'Wood-oven corn', 'assets/ingredients/corn.jpg', '$5.00', 'Sweet corn from the wood oven'],
];

interface Spec {
  size: SizeKey;
  pizzas: number;
  tops: number;
  dips: number;
  pops: number;
  side: boolean;
}
const SPEC: Record<string, Spec> = {
  'one-large': { size: 'L', pizzas: 1, tops: 1, dips: 0, pops: 0, side: false },
  'two-large': { size: 'L', pizzas: 2, tops: 4, dips: 2, pops: 2, side: true },
  'two-medium': { size: 'M', pizzas: 2, tops: 4, dips: 2, pops: 2, side: true },
  'two-small': { size: 'S', pizzas: 2, tops: 4, dips: 2, pops: 0, side: false },
};

/**
 * The Pizza Builder's config, sent back as the 3rd `onAdd` argument (prototype) and as `line.meta`.
 * `extra` = charge above the size price.
 */
type ComboCfg = Partial<PizzaConfig>;
interface PizzaPick {
  summary: string;
  cfg: ComboCfg;
}

const isCfg = (x: unknown): x is ComboCfg => !!x && typeof x === 'object' && ('extra' in x || 'topNames' in x);

// ---------- Small shared pieces ----------
const CheckSvg = ({ size = 14, stroke = 3.6, style }: { size?: number; stroke?: number; style?: CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);
const MinusSvg = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
    <path d="M5 12h14" />
  </svg>
);
const PlusSvg = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

interface Track {
  done: boolean;
  text: string;
  aria: string;
  bg: string;
  fg: string;
  slots: { bg: string; sz: string; bs: string; bc: string; sh: string }[];
}
const url = (u?: string) => (u ? 'url("' + u + '")' : 'none');
const track = (imgs: string[], max: number, sz: string, unit?: string): Track => {
  const n = imgs.length;
  const done = n >= max;
  return {
    done,
    text: done ? 'All set' : n + ' of ' + max + (unit ? ' ' + unit : ''),
    aria: n + ' of ' + max + ' chosen',
    bg: done ? '#E8F5EC' : '#F2F2F5',
    fg: done ? '#1E7A3C' : '#1A1414',
    slots: Array.from({ length: max }, (_, i) => {
      const im = imgs[i];
      return { bg: url(im), sz, bs: im ? 'solid' : 'dashed', bc: im ? '#fff' : '#C7C7CC', sh: im ? '0 2px 8px rgba(26,20,20,.16)' : 'none' };
    }),
  };
};

function Tracker({ t }: { t: Track }) {
  return (
    <div
      role="status"
      aria-label={t.aria}
      style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 12, height: 44, padding: '0 6px 0 16px', borderRadius: 999, background: t.bg, color: t.fg, transition: 'background .25s,color .25s' }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 800, whiteSpace: 'nowrap' }}>
        {t.done ? <CheckSvg /> : null}
        {t.text}
      </span>
      <span style={{ display: 'flex', paddingLeft: 8 }}>
        {t.slots.map((s, i) => (
          <span
            key={i}
            style={{
              width: 34,
              height: 34,
              boxSizing: 'border-box',
              marginLeft: -8,
              borderRadius: '50%',
              border: '2px ' + s.bs + ' ' + s.bc,
              backgroundColor: '#fff',
              backgroundImage: s.bg,
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: s.sz,
              boxShadow: s.sh,
              transition: 'border-color .2s',
            }}
          />
        ))}
      </span>
    </div>
  );
}

const h2Style: CSSProperties = { margin: 0, fontWeight: 900, fontSize: 'clamp(26px,3vw,34px)', letterSpacing: '-.04em' };
const sectionStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 18 };
const headRowStyle: CSSProperties = { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px 20px', flexWrap: 'wrap' };
const stepperStyle: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', height: 44, padding: '0 4px', borderRadius: 999, background: '#F2F2F5' };
const stepBtnBase: CSSProperties = { width: 36, height: 36, border: 0, borderRadius: '50%', color: '#1A1414', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };

interface StepItem {
  id: string;
  name: string;
  img: string;
  n: number;
  ring: string;
  decOp: number;
  incOp: number;
  dec: () => void;
  inc: () => void;
}

// ---------- Component ----------
export default function ComboBuilder({ deal, sizePrices, onClose, onAdd }: ComboBuilderProps) {
  const sp = SPEC[deal.id] || SPEC['two-large'];
  const [pizzas, setPizzas] = useState<Record<number, PizzaPick>>({});
  const [dips, setDips] = useState<Record<string, number>>({});
  const [pops, setPops] = useState<Record<string, number>>({});
  const [side, setSide] = useState<SideId | null>(null);
  // A one-pizza deal with nothing else opens the Pizza Builder straight away.
  const [edit, setEdit] = useState<number | null>(sp.pizzas === 1 ? 0 : null);

  useLockBody(true);
  // Prototype: Escape closes the combo only when the Pizza Builder isn't open on top.
  useEscape(edit === null, onClose);

  const sum = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0);
  const nd = sum(dips);
  const np = sum(pops);
  const extra = Object.values(pizzas).reduce((a, p) => a + Math.max(0, p.cfg.extra || 0), 0);
  const extraDips = Math.max(0, nd - sp.dips);
  const total = deal.price + extra + extraDips * EXTRA_DIP;

  const step = (
    bag: Record<string, number>,
    setBag: (fn: (b: Record<string, number>) => Record<string, number>) => void,
    max: number,
    list: [string, string, string][],
  ): StepItem[] =>
    list.map(([id, name, img]) => {
      const n = bag[id] || 0;
      const full = sum(bag) >= max;
      return {
        id,
        name,
        img,
        n,
        ring: n ? 'inset 0 0 0 2px #D7192D' : 'inset 0 0 0 1px #E6E6EA',
        decOp: n ? 1 : 0.35,
        incOp: full ? 0.35 : 1,
        dec: () =>
          setBag((st) => {
            const b = { ...st };
            if (b[id]) b[id]--;
            if (!b[id]) delete b[id];
            return b;
          }),
        inc: () => setBag((st) => (sum(st) >= max ? st : { ...st, [id]: (st[id] || 0) + 1 })),
      };
    });

  const pz = Array.from({ length: sp.pizzas }, (_, i) => i);
  const missing = pz.find((i) => !pizzas[i]);
  const dipsOk = nd >= sp.dips;
  const popsOk = np >= sp.pops;
  const sideOk = !sp.side || !!side;
  const ready = missing == null && dipsOk && popsOk && sideOk;
  const editAt = (i: number) => () => setEdit(i);

  let primaryLabel = 'Add to order';
  let primary: () => void = () => {};
  if (missing != null) {
    primaryLabel = 'Customize pizza ' + (missing + 1);
    primary = editAt(missing);
  } else if (!dipsOk) primaryLabel = 'Choose ' + (sp.dips - nd) + ' more dip' + (sp.dips - nd > 1 ? 's' : '');
  else if (!popsOk) primaryLabel = 'Choose ' + (sp.pops - np) + ' more pop' + (sp.pops - np > 1 ? 's' : '');
  else if (!sideOk) primaryLabel = 'Choose juice or corn';
  if (ready)
    primary = () => {
      const parts = pz.map((i) => 'Pizza ' + (i + 1) + ': ' + (pizzas[i].summary || 'Cheese'));
      const dl = DIPS.filter(([id]) => dips[id]).map(([id, n]) => (dips[id] > 1 ? dips[id] + '× ' : '') + n);
      const pl = POPS.filter((n) => pops[n]).map((n) => (pops[n] > 1 ? pops[n] + '× ' : '') + n);
      if (dl.length) parts.push('Dips: ' + dl.join(', '));
      if (pl.length) parts.push('Pops: ' + pl.join(', '));
      if (sp.side) parts.push(SIDES.find((x) => x[0] === side)![1]);
      const key = [deal.id, JSON.stringify(pizzas), JSON.stringify(dips), JSON.stringify(pops), side].join('|');
      onAdd({ key, name: deal.name + ' combo', summary: parts.join(' · '), unit: Math.round(total * 100) / 100 }, 1);
    };

  const solo = sp.pizzas === 1 && !sp.dips && !sp.pops && !sp.side;
  const tw = (n: number) => n + (n > 1 ? ' toppings' : ' topping');

  const dipImgs = DIPS.flatMap(([id]) => Array<string>(dips[id] || 0).fill('assets/dips/top-' + id + '.png'));
  const popImgs = POPS.flatMap((n) => Array<string>(pops[n] || 0).fill('assets/pops/' + POP_IMG[n]));
  const pzImgs = pz.filter((i) => pizzas[i]).map(() => 'assets/pizza-base.webp');
  const sideImgs = side ? [SIDES.find((x) => x[0] === side)![2]] : [];
  const pzT = track(pzImgs, sp.pizzas, '118%', 'ready');
  const dipT = track(dipImgs, sp.dips || 0, '84%');
  const popT = track(popImgs, sp.pops || 0, 'auto 78%');
  const sideT = track(sideImgs, sp.side ? 1 : 0, 'cover');

  const title = deal.name + ' combo';
  const subtitle = [
    sp.pizzas + ' ' + SIZE_NAMES[sp.size].toLowerCase() + (sp.pizzas > 1 ? ' pizzas' : ' pizza'),
    tw(sp.tops) + (sp.pizzas > 1 ? ' each' : ''),
    sp.dips ? sp.dips + ' dips' : '',
    sp.pops ? sp.pops + ' pops' : '',
    'Pickup only',
  ]
    .filter(Boolean)
    .join(' · ');

  const pizzaCards = pz.map((i) => {
    const p = pizzas[i];
    return {
      i,
      kicker: p ? 'Done' : SIZE_NAMES[sp.size],
      kickerColor: p ? '#1E8A4C' : '#D7192D',
      done: !!p,
      name: sp.pizzas > 1 ? 'Pizza ' + (i + 1) : SIZE_NAMES[sp.size] + ' pizza',
      summary: p ? (p.summary || 'Cheese') + ((p.cfg.extra || 0) > 0.001 ? ' · +' + money(p.cfg.extra || 0) : '') : 'Pick your sauce, cheese and ' + tw(sp.tops) + '.',
      btn: p ? 'Edit' : 'Customize',
      btnBg: p ? '#F2F2F5' : '#D7192D',
      btnFg: p ? '#1A1414' : '#fff',
      ring: p ? 'inset 0 0 0 1px #E6E6EA' : 'inset 0 0 0 2px #D7192D',
    };
  });

  // Pick up to the included number of dips; extras are added separately from the menu (README "4. Combo builder").
  const dipItems = step(dips, setDips, sp.dips, DIPS.map(([id, n]) => [id, n, 'assets/dips/top-' + id + '.png']));
  const dipNote = 'Want more? Add extra dips from the menu.';
  const popItems = step(pops, setPops, sp.pops, POPS.map((n) => [n, n, 'assets/pops/' + POP_IMG[n]]));

  const sides = SIDES.map(([id, name, img, worth, desc]) => {
    const on = side === id;
    return {
      id,
      name,
      img,
      worth,
      desc,
      on,
      shadow: on ? '0 0 0 3px #fff,0 0 0 6px #D7192D,0 18px 40px rgba(215,25,45,.22)' : '0 10px 28px rgba(26,20,20,.12)',
      lift: on ? 'translateY(-3px)' : 'none',
      zoom: on ? 1.06 : 1,
      checkBg: on ? '#D7192D' : 'rgba(255,255,255,.18)',
      checkRing: on ? 'none' : 'inset 0 0 0 2px rgba(255,255,255,.85)',
      checkOp: on ? 1 : 0,
    };
  });

  const primaryBg = ready || missing != null ? '#D7192D' : '#9A9A9F';

  // ---------- Pizza Builder hand-off (field names match the prototype) ----------
  const editItem =
    edit != null
      ? { id: 'byo', name: solo ? deal.name : 'Pizza ' + (edit + 1), desc: SIZE_NAMES[sp.size] + ' · ' + tw(sp.tops) + ' included', tops: [] as string[], included: sp.tops }
      : null;
  const editCombo: ComboContext | null =
    edit != null ? { size: sp.size, btn: solo ? 'Add to order' : 'Save pizza ' + (edit + 1), init: pizzas[edit] ? pizzas[edit].cfg : null } : null;
  const closeEdit = () => (solo ? onClose() : setEdit(null));
  const saveEdit = (line: NewLine, _qty?: number, cfgArg?: ComboCfg) => {
    // The builder passes its config as the 3rd argument (prototype); fall back to line.meta.
    const meta = line.meta;
    const cfg: ComboCfg = cfgArg || (isCfg(meta) ? meta : null) || { extra: 0 };
    const bits = [cfg.topNames && cfg.topNames.length ? cfg.topNames.join(', ') : 'Cheese only'];
    if (cfg.crustName && cfg.crustName !== 'Regular') bits.push(cfg.crustName.toLowerCase() + ' crust');
    if (cfg.sauceName && cfg.sauceName !== 'Regular') bits.push(cfg.sauceName.toLowerCase() + ' sauce');
    if (cfg.cheeseName && cfg.cheeseName !== 'Regular') bits.push(cfg.cheeseName === 'None' ? 'no cheese' : cfg.cheeseName.toLowerCase() + ' cheese');
    if (cfg.spice && cfg.spice !== 'No spice') bits.push(cfg.spice.toLowerCase());
    if (cfg.notes && cfg.notes.trim()) bits.push('Note: ' + cfg.notes.trim());
    if (solo) {
      const ex = Math.max(0, cfg.extra || 0);
      onAdd({ key: [deal.id, JSON.stringify(cfg)].join('|'), name: deal.name + ' combo', summary: bits.join(' · '), unit: Math.round((deal.price + ex) * 100) / 100 }, 1);
      return;
    }
    const at = edit;
    if (at == null) return;
    setPizzas((st) => ({ ...st, [at]: { summary: bits.join(' · '), cfg } }));
    setEdit(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{ position: 'fixed', inset: 0, zIndex: 120, background: '#fff', color: '#1A1414', fontFamily: "'Figtree',system-ui,sans-serif", display: 'flex', flexDirection: 'column' }}
    >
      <header style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 14, minHeight: 72, padding: '10px clamp(16px,3vw,32px)', boxSizing: 'border-box', borderBottom: '1px solid #EDEDF0' }}>
        <Hov
          as="button"
          onClick={onClose}
          aria-label="Close"
          style={{ width: 44, height: 44, flex: 'none', border: 0, borderRadius: '50%', background: '#F2F2F5', color: '#1A1414', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          hover={{ background: '#E6E6EA' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </Hov>
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <span style={{ display: 'block', maxWidth: '100%', fontWeight: 900, fontSize: 20, letterSpacing: '-.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
          <span style={{ display: 'block', maxWidth: '100%', fontSize: 13, fontWeight: 600, lineHeight: 1.35, color: '#646467', textWrap: 'pretty' } as CSSProperties}>{subtitle}</span>
        </div>
        <span style={{ flex: 'none', fontWeight: 900, fontSize: 22, letterSpacing: '-.03em' }}>{money(deal.price)}</span>
      </header>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '32px clamp(16px,3vw,32px) 140px', display: 'flex', flexDirection: 'column', gap: 44 }}>
          {/* Pizzas */}
          <section style={sectionStyle}>
            <div style={headRowStyle}>
              <h2 style={h2Style}>{sp.pizzas > 1 ? 'Your pizzas' : 'Your pizza'}</h2>
              <Tracker t={pzT} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,320px),1fr))', gap: 16 }}>
              {pizzaCards.map((p) => (
                <Hov
                  as="button"
                  key={p.i}
                  onClick={editAt(p.i)}
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '14px 18px',
                    padding: 'clamp(14px,3.5vw,18px)',
                    border: 0,
                    borderRadius: 24,
                    background: '#fff',
                    boxShadow: p.ring,
                    textAlign: 'left',
                    fontFamily: 'inherit',
                    color: '#1A1414',
                    cursor: 'pointer',
                    transition: 'box-shadow .2s,transform .2s',
                  }}
                  hover={{ transform: 'translateY(-2px)' }}
                >
                  <span
                    style={{
                      position: 'relative',
                      width: 'clamp(84px,24vw,112px)',
                      height: 'clamp(84px,24vw,112px)',
                      flex: 'none',
                      borderRadius: '50%',
                      background: 'radial-gradient(circle,#FFFFFF 0%,#F2F2F5 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <img src="assets/pizza-base.webp" alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 10px 14px rgba(60,30,10,.22))' }} />
                    {p.done ? (
                      <span style={{ position: 'absolute', right: 2, top: 2, width: 30, height: 30, borderRadius: '50%', background: '#1E8A4C', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 3px #fff' }}>
                        <CheckSvg stroke={3.4} />
                      </span>
                    ) : null}
                  </span>
                  <span style={{ flex: '1 1 150px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: p.kickerColor }}>{p.kicker}</span>
                    <span style={{ fontWeight: 900, fontSize: 22, letterSpacing: '-.03em', lineHeight: 1.1 }}>{p.name}</span>
                    <span style={{ fontSize: 14, lineHeight: 1.45, color: '#646467', textWrap: 'pretty' } as CSSProperties}>{p.summary}</span>
                  </span>
                  <span style={{ flex: 'none', marginLeft: 'auto', height: 44, padding: '0 18px', borderRadius: 999, background: p.btnBg, color: p.btnFg, fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                    {p.btn}
                  </span>
                </Hov>
              ))}
            </div>
          </section>

          {/* Dips */}
          {sp.dips > 0 ? (
            <section style={sectionStyle}>
              <div style={headRowStyle}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <h2 style={h2Style}>Dipping sauces</h2>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#646467' }}>{dipNote}</span>
                </div>
                <Tracker t={dipT} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,180px),1fr))', gap: 14 }}>
                {dipItems.map((d) => (
                  <div key={d.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '18px 14px 14px', borderRadius: 22, background: '#fff', boxShadow: d.ring, transition: 'box-shadow .2s' }}>
                    <span
                      aria-hidden="true"
                      style={{
                        display: 'block',
                        flex: 'none',
                        backgroundImage: "url('" + d.img + "')",
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        width: 112,
                        height: 112,
                        backgroundSize: 'contain',
                      }}
                    />
                    <span style={{ fontWeight: 800, fontSize: 15, textAlign: 'center', lineHeight: 1.2, minHeight: 36, display: 'flex', alignItems: 'center' }}>{d.name}</span>
                    <div style={stepperStyle}>
                      <button onClick={d.dec} aria-label={'Remove ' + d.name} style={{ ...stepBtnBase, background: 'transparent', opacity: d.decOp }}>
                        <MinusSvg />
                      </button>
                      <span style={{ fontWeight: 900, fontSize: 16 }}>{d.n}</span>
                      <button onClick={d.inc} aria-label={'Add ' + d.name} style={{ ...stepBtnBase, background: '#fff', opacity: d.incOp, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
                        <PlusSvg />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* Pops */}
          {sp.pops > 0 ? (
            <section style={sectionStyle}>
              <div style={headRowStyle}>
                <h2 style={h2Style}>Pops</h2>
                <Tracker t={popT} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,150px),1fr))', gap: 12 }}>
                {popItems.map((d) => (
                  <div key={d.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '18px 14px 14px', borderRadius: 22, background: '#fff', boxShadow: d.ring, transition: 'box-shadow .2s' }}>
                    <span
                      aria-hidden="true"
                      style={{
                        display: 'block',
                        flex: 'none',
                        backgroundImage: "url('" + d.img + "')",
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        width: '100%',
                        height: 132,
                        backgroundSize: 'contain',
                        mixBlendMode: 'multiply',
                      }}
                    />
                    <span style={{ fontWeight: 800, fontSize: 15, textAlign: 'center', lineHeight: 1.2 }}>{d.name}</span>
                    <div style={stepperStyle}>
                      <button onClick={d.dec} aria-label={'Remove ' + d.name} style={{ ...stepBtnBase, background: 'transparent', opacity: d.decOp }}>
                        <MinusSvg />
                      </button>
                      <span style={{ minWidth: 16, textAlign: 'center', fontWeight: 900, fontSize: 16 }}>{d.n}</span>
                      <button onClick={d.inc} aria-label={'Add ' + d.name} style={{ ...stepBtnBase, background: '#fff', opacity: d.incOp, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
                        <PlusSvg />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* Free side */}
          {sp.side ? (
            <section style={sectionStyle}>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: '#D7192D' }}>On the house</span>
                  <h2 style={h2Style}>Pick your free extra</h2>
                </div>
                <Tracker t={sideT} />
              </div>
              <div role="radiogroup" aria-label="Free extra" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,280px),1fr))', gap: 16 }}>
                {sides.map((s) => (
                  <Hov
                    as="button"
                    key={s.id}
                    role="radio"
                    aria-checked={s.on}
                    onClick={() => setSide(s.id)}
                    style={{
                      position: 'relative',
                      aspectRatio: '16/10',
                      padding: 0,
                      border: 0,
                      borderRadius: 28,
                      overflow: 'hidden',
                      background: '#1A1210',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                      color: '#fff',
                      boxShadow: s.shadow,
                      transform: s.lift,
                      transition: 'box-shadow .25s,transform .3s cubic-bezier(.2,.8,.2,1)',
                    }}
                    hover={{ transform: 'translateY(-3px)' }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        display: 'block',
                        flex: 'none',
                        backgroundImage: "url('" + s.img + "')",
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        backgroundSize: 'cover',
                        transform: 'scale(' + s.zoom + ')',
                        transition: 'transform .6s cubic-bezier(.2,.8,.2,1)',
                      }}
                    />
                    <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg,rgba(18,10,8,.88) 0%,rgba(18,10,8,.35) 45%,rgba(18,10,8,0) 70%)' }} />
                    <span
                      style={{
                        position: 'absolute',
                        left: 18,
                        top: 18,
                        height: 32,
                        padding: '0 14px',
                        borderRadius: 999,
                        background: '#fff',
                        color: '#1A1414',
                        fontSize: 13,
                        fontWeight: 900,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        boxShadow: '0 6px 18px rgba(0,0,0,.18)',
                      }}
                    >
                      <span style={{ color: '#D7192D' }}>FREE</span>
                      <span style={{ color: '#8A7F79', textDecoration: 'line-through', fontWeight: 700 }}>{s.worth}</span>
                    </span>
                    <span
                      style={{
                        position: 'absolute',
                        right: 18,
                        top: 18,
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: s.checkBg,
                        boxShadow: s.checkRing,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        transition: 'background .2s',
                      }}
                    >
                      <CheckSvg size={18} stroke={3.2} style={{ opacity: s.checkOp, transition: 'opacity .2s' }} />
                    </span>
                    <span style={{ position: 'absolute', left: 20, right: 20, bottom: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontWeight: 900, fontSize: 'clamp(22px,2.4vw,28px)', letterSpacing: '-.035em', lineHeight: 1.05 }}>{s.name}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#E2D7D1' }}>{s.desc}</span>
                    </span>
                  </Hov>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>

      <footer style={{ position: 'absolute', left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', padding: '14px clamp(16px,3vw,32px) 18px', background: 'linear-gradient(0deg,#fff 70%,rgba(255,255,255,0))' }}>
        <Hov
          as="button"
          onClick={primary}
          style={{
            width: '100%',
            maxWidth: 560,
            height: 60,
            border: 0,
            borderRadius: 999,
            background: primaryBg,
            color: '#fff',
            fontFamily: 'inherit',
            fontWeight: 800,
            fontSize: 17,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '0 26px',
            boxShadow: '0 14px 30px rgba(215,25,45,.25)',
            transition: 'background .2s',
          }}
          hover={{ background: '#B5121F' }}
        >
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{primaryLabel}</span>
          <span style={{ whiteSpace: 'nowrap' }}>{money(total)}</span>
        </Hov>
      </footer>

      {editItem && editCombo ? (
        // PizzaBuilder renders its own fixed full-screen sheet; it sits above this one (prototype: z-index 130).
        <PizzaBuilder
          item={editItem}
          combo={editCombo}
          sizePrices={sizePrices}
          onClose={closeEdit}
          onAdd={saveEdit}
        />
      ) : null}
    </div>
  );
}
