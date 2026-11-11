// Port of design_handoff_pizza_king_website/prototype/CategoryPage.dc.html
// One shared template for Wings & Sides, Drinks Bar and Gelato & Shakes (prop `category`).
import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import type { CategoryId, CategoryPageProps } from '../lib/types';
import { Hov, Photo, IconArrow, IconBack, IconCheck, IconClose, IconMinus, IconPlus } from '../lib/ui';
import { useLockBody, useWidth } from '../lib/hooks';
import { U } from '../lib/catalog';
import { money } from '../lib/format';
import { CAT_MENU, mustPrice, type LineSpec } from '../lib/pricing';

// ---------- Data (the prototype's `const` arrays are the spec) ----------

interface Opt {
  id: string;
  label: string;
  price?: number;
  long?: string;
  img?: string;
}
interface Group {
  id: string;
  label?: string;
  /** Chips (wrap) instead of a segmented control. */
  chips?: boolean;
  opts: Opt[];
}
interface Item {
  id: string;
  /** Filter id. */
  f?: string;
  name: string;
  desc?: string;
  tag?: string;
  veg?: boolean;
  /** Unsplash photo id or `assets/...` path; empty = no real photo (empty box on purpose). */
  img: string;
  price?: number;
  /** Default option id per group id. */
  def?: Record<string, string>;
  groups?: Group[];
}
interface Category {
  hero: { img: string; eyebrow: string; t1: string; t2: string; p: string };
  filters?: [id: string, label: string][];
  noun?: string;
  items: Item[];
}

/** Unsplash id → URL; `assets/...` paths pass through; empty stays empty. */
const IMG = (id: string | undefined, w = 800) => (!id ? '' : id.indexOf('assets/') === 0 ? id : U(id, w));

// Items, options and prices come from the shared pricing module (CAT_MENU). This file only adds the visuals.
/** Per item: filter id, tag, vegetarian, photo (Unsplash id or `assets/...`; empty = no real photo on purpose). */
const ITEM_UI: Record<string, { f?: string; tag?: string; veg?: boolean; img: string }> = {
  // wings & sides
  wings: { f: 'tandoor', tag: 'Wood oven', img: '1608039755401-742074f0548d' },
  leg: { f: 'tandoor', img: '1617692855027-33b14f061079' },
  fish: { f: 'tandoor', img: '' },
  wedges: { f: 'sides', veg: true, img: '1623238913973-21e45cced554' },
  'garlic-bread': { f: 'sides', veg: true, img: '' },
  sub: { f: 'sides', img: '1509722747041-616f39b57569' },
  'nv-salad': { f: 'sides', img: '1546069901-ba9599a7e63c' },
  'v-salad': { f: 'sides', veg: true, img: '1512621776951-a57141f2eefd' },
  corn: { f: 'sides', veg: true, img: 'assets/ingredients/corn.jpg' },
  chaat: { f: 'sides', veg: true, img: '1490474418585-ba9bad8fd0ea' },
  // drinks
  fresh: { f: 'juice', img: '1600271886742-f049cd451bba' },
  sugarcane: { f: 'juice', img: '' },
  lemonade: { f: 'juice', img: '' },
  coconut: { f: 'juice', img: '' },
  lassi: { f: 'lassi', img: '' },
  espresso: { f: 'hot', img: '1510591509098-f4fdc6d0ff04' },
  hot: { f: 'hot', img: '1509042239860-f550ce710b93' },
  pop: { f: 'soft', img: '' },
  water: { f: 'soft', img: '' },
  beer: { f: 'beer', img: '1600788886242-5c96aabe3757' },
  // gelato & shakes
  cone: { img: '1497034825429-c343d7c6a68f' },
  cup: { img: '1570197788417-0e82375c9371' },
  shake: { img: '1505252585461-04db1eb84625' },
};
/** Option groups shown as wrapping chips instead of a segmented control ("item.group"; spice is always chips). */
const CHIPS = new Set(['lassi.flav', 'hot.kind', 'pop.brand', 'beer.brand', 'cone.flav', 'cup.flav', 'shake.flav']);
/** Option photos ("item.option" → Unsplash id). */
const OPT_IMG: Record<string, string> = {
  'wings.hot': '1608039755401-742074f0548d', 'wings.honey': '1567620832903-9fc6debc209f', 'wings.bbq': '1527477396000-e27163b481c2',
  'fresh.orange': '1600271886742-f049cd451bba', 'fresh.pineapple': '1534353473418-4cfa6c56fd38', 'fresh.guava': '1497534446932-c925b458314e', 'fresh.mix': '1622597467836-f3285f2131b8',
  'lassi.strawberry': '1589733955941-5eeaf752f6dd',
  'shake.mango': '1525385133512-2f3bdd039054', 'shake.strawberry': '1579954115545-a95591f28bfc', 'shake.vanilla': '1568901839119-631418a3910d', 'shake.cherry': '1600718374662-0483d2b9da44',
};
const withUi = (cat: CategoryId): Item[] =>
  CAT_MENU[cat].items.map((it) => ({
    ...it,
    ...ITEM_UI[it.id],
    groups: it.groups?.map((g) => ({
      ...g,
      chips: g.id === 'spice' || CHIPS.has(it.id + '.' + g.id) || undefined,
      opts: g.opts.map((x) => (OPT_IMG[it.id + '.' + x.id] ? { ...x, img: OPT_IMG[it.id + '.' + x.id] } : x)),
    })),
  }));

const CATS: Record<CategoryId, Category> = {
  wings: {
    hero: { img: '1608039755401-742074f0548d', eyebrow: CAT_MENU.wings.label, t1: 'Tandoori', t2: 'wings.', p: 'Wings from the wood oven in hot, honey garlic or BBQ. Also tandoori chicken and fish, salads and sides.' },
    filters: [['all', 'All'], ['tandoor', 'Wings & tandoori'], ['sides', 'Sides & salads']],
    items: withUi('wings'),
  },
  juice: {
    hero: { img: '1622597467836-f3285f2131b8', eyebrow: CAT_MENU.juice.label, t1: 'Fresh juice.', t2: 'Lassi and chai.', p: 'Fruit and sugarcane juice, lassi, coffee, masala tea, pop, and beer by the bottle or can.' },
    filters: [['all', 'All'], ['juice', 'Juice'], ['lassi', 'Lassi'], ['hot', 'Coffee & chai'], ['soft', 'Pop & water'], ['beer', 'Beer']],
    noun: 'drinks',
    items: withUi('juice'),
  },
  gelato: {
    hero: { img: '1501443762994-82bd5dace89a', eyebrow: CAT_MENU.gelato.label, t1: 'Gelato &', t2: 'shakes.', p: 'Gelato in a cone or cup, in ten flavours, and thick shakes.' },
    noun: 'items',
    items: withUi('gelato'),
  },
};

// ---------- Static styles ----------

const S = {
  root: { fontFamily: "'Figtree',system-ui,sans-serif", color: '#1A1414', background: '#fff', paddingBottom: 96 },
  heroSection: { maxWidth: 1320, margin: '0 auto', padding: '16px clamp(16px,3vw,32px) 0' },
  hero: { position: 'relative', borderRadius: 32, overflow: 'hidden', minHeight: 'clamp(380px,48vh,480px)', background: '#1A1210', color: '#fff', display: 'flex' },
  heroShade: {
    position: 'absolute', inset: 0, pointerEvents: 'none',
    background: 'linear-gradient(0deg,rgba(18,10,8,.92) 0%,rgba(18,10,8,.5) 45%,rgba(18,10,8,.15) 100%),linear-gradient(90deg,rgba(18,10,8,.6) 0%,rgba(18,10,8,0) 65%)',
  },
  heroBody: { position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 48, padding: 'clamp(20px,4vw,52px)', pointerEvents: 'none' },
  back: {
    pointerEvents: 'auto', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8, height: 44, padding: '0 18px 0 14px', border: 0, borderRadius: 999,
    background: 'rgba(255,255,255,.14)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.28)',
    color: '#fff', fontFamily: 'inherit', fontWeight: 800, fontSize: 15, cursor: 'pointer', transition: 'background .2s',
  },
  backHover: { background: 'rgba(255,255,255,.26)' },
  heroText: { display: 'flex', flexDirection: 'column', gap: 18 },
  eyebrow: { fontSize: 12, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: '#FF8A80' },
  h1: { margin: 0, fontWeight: 900, fontSize: 'clamp(52px,7.4vw,104px)', lineHeight: 0.9, letterSpacing: '-.055em' },
  heroP: { margin: 0, maxWidth: 520, fontSize: 'clamp(16px,1.4vw,18px)', lineHeight: 1.5, color: '#DADADD', textWrap: 'pretty' },
  listSection: { maxWidth: 1320, margin: '0 auto', padding: '0 clamp(16px,3vw,32px)' },
  bar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, padding: '36px 0 24px' },
  tabs: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  tab: { display: 'flex', alignItems: 'center', gap: 8, height: 44, padding: '0 18px', border: 0, borderRadius: 999, fontFamily: 'inherit', fontWeight: 800, fontSize: 15, whiteSpace: 'nowrap', cursor: 'pointer', transition: 'background .2s,color .2s' },
  tabCount: { fontSize: 13, fontWeight: 700, opacity: 0.6 },
  count: { fontWeight: 900, fontSize: 'clamp(26px,2.6vw,34px)', letterSpacing: '-.04em' },
  fullMenu: { display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 15, color: '#1A1414', textDecoration: 'none' },
  fullMenuHover: { color: '#D7192D' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,290px),1fr))', gap: 20 },
  card: { cursor: 'pointer', display: 'flex', flexDirection: 'column', borderRadius: 28, overflow: 'hidden', background: '#fff', boxShadow: 'inset 0 0 0 1px #E8E8EB', transition: 'transform .3s cubic-bezier(.2,.8,.2,1),box-shadow .3s' },
  cardHover: { transform: 'translateY(-4px)', boxShadow: 'inset 0 0 0 1px #E8E8EB,0 22px 44px rgba(26,20,20,.12)' },
  cardMedia: { position: 'relative', aspectRatio: '4/3', background: '#EDEDF0' },
  badges: { position: 'absolute', left: 14, top: 14, display: 'flex', gap: 6, pointerEvents: 'none' },
  tag: { height: 30, padding: '0 12px', borderRadius: 999, background: '#fff', color: '#1A1414', fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', boxShadow: '0 4px 14px rgba(0,0,0,.12)' },
  veg: { height: 30, padding: '0 12px 0 10px', borderRadius: 999, background: '#fff', color: '#1E7A3C', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 14px rgba(0,0,0,.12)' },
  vegDot: { width: 8, height: 8, borderRadius: '50%', background: '#1E9E4A' },
  cardBody: { flex: 1, display: 'flex', flexDirection: 'column', gap: 18, padding: 20 },
  cardHead: { display: 'flex', flexDirection: 'column', gap: 6 },
  cardName: { fontWeight: 900, fontSize: 22, letterSpacing: '-.03em', lineHeight: 1.1 },
  cardDesc: { fontSize: 14, lineHeight: 1.45, color: '#646467', textWrap: 'pretty' },
  cardFoot: { marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  priceCol: { display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 },
  price: { fontWeight: 900, fontSize: 26, letterSpacing: '-.04em', lineHeight: 1 },
  sub: { fontSize: 12, fontWeight: 600, color: '#818184', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  addBtn: { width: 48, height: 48, flex: 'none', border: 0, borderRadius: '50%', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .2s,transform .2s' },
  addBtnHover: { transform: 'scale(1.06)' },
  // Customize sheet
  dialog: { position: 'fixed', inset: 0, zIndex: 200, display: 'flex', justifyContent: 'center' },
  scrim: { position: 'absolute', inset: 0, background: 'rgba(20,14,12,.5)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' },
  panel: { position: 'relative', width: '100%', maxWidth: 880, display: 'flex', background: '#fff', overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,.3)' },
  close: { position: 'absolute', right: 14, top: 14, width: 44, height: 44, border: 0, borderRadius: '50%', background: '#fff', color: '#1A1414', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 18px rgba(0,0,0,.18)' },
  sheetCol: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: 0 },
  sheetScroll: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 26, padding: '28px 28px 20px' },
  sheetHead: { display: 'flex', flexDirection: 'column', gap: 8 },
  sheetName: { fontWeight: 900, fontSize: 32, letterSpacing: '-.04em', lineHeight: 1.05 },
  sheetDesc: { fontSize: 15, lineHeight: 1.5, color: '#646467', textWrap: 'pretty' },
  groups: { display: 'flex', flexDirection: 'column', gap: 22 },
  group: { display: 'flex', flexDirection: 'column', gap: 8 },
  groupLabel: { fontSize: 13, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: '#818184' },
  seg: { display: 'flex', gap: 4, padding: 4, borderRadius: 999, background: '#EDEDF0' },
  segBtn: { flex: 1, minWidth: 0, height: 46, padding: '0 6px', border: 0, borderRadius: 999, fontFamily: 'inherit', fontWeight: 800, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer', transition: 'background .2s,color .2s' },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  chip: { height: 44, padding: '0 16px', border: 0, borderRadius: 999, fontFamily: 'inherit', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', cursor: 'pointer', transition: 'background .2s,color .2s' },
  sheetFoot: { display: 'flex', alignItems: 'center', gap: 12, padding: '16px 28px 24px', borderTop: '1px solid #EDEDF0' },
  stepper: { display: 'flex', alignItems: 'center', gap: 4, height: 56, padding: '0 6px', borderRadius: 999, background: '#EDEDF0' },
  stepBtn: { width: 44, height: 44, border: 0, borderRadius: '50%', background: 'transparent', color: '#1A1414', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  stepBtnHover: { background: '#fff' },
  qty: { minWidth: 22, textAlign: 'center', fontWeight: 900, fontSize: 17 },
  sheetAdd: { flex: 1, height: 56, border: 0, borderRadius: 999, background: '#D7192D', color: '#fff', fontFamily: 'inherit', fontWeight: 800, fontSize: 16, whiteSpace: 'nowrap', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '0 24px', transition: 'background .2s' },
  sheetAddHover: { background: '#B5121F' },
} satisfies Record<string, CSSProperties>;

// ---------- Component ----------

/** Remounts on category change so filter / selections / open sheet reset. */
export default function CategoryPage(props: CategoryPageProps) {
  return <CategoryView key={props.category} {...props} />;
}

type Sel = Record<string, Record<string, string>>;

function CategoryView({ category, onAdd, onBack, onMenu }: CategoryPageProps) {
  const w = useWidth();
  const ph = w < 600; // phone: two-column compact cards
  const [filter, setFilter] = useState('all');
  const [sel, setSel] = useState<Sel>({});
  const [added, setAdded] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (!open) return;
    const onK = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(null); };
    window.addEventListener('keydown', onK);
    return () => window.removeEventListener('keydown', onK);
  }, [open]);
  useLockBody(!!open);

  const key = category || 'wings';
  const cat = CATS[key] || CATS.wings;
  const ev = (fn?: () => void) => (e?: { preventDefault?: () => void }) => { e?.preventDefault?.(); fn?.(); };
  const filters = cat.filters || null;
  const shown = filters && filter !== 'all' ? cat.items.filter((i) => i.f === filter) : cat.items;
  const hero = { ...cat.hero, img: IMG(cat.hero.img, 2000) };

  const build = (it: Item) => {
    const groups = it.groups || [];
    const mine = sel[it.id] || {};
    const chosen = groups.map((g) => g.opts.find((x) => x.id === (mine[g.id] || (it.def && it.def[g.id]))) || g.opts[0]);
    const priced = chosen.filter((c) => c.price != null).pop();
    const price = (priced ? priced.price : it.price) ?? 0;
    const pic = chosen.filter((c) => c.img).pop();
    const sub = chosen.map((c) => c.long || c.label).join(' · ');
    const justAdded = added === it.id;
    const hasOpts = groups.length > 0;
    const minP = hasOpts
      ? Math.min(...groups.flatMap((g) => g.opts.map((x) => x.price)).filter((p): p is number => p != null).concat(it.price != null ? [it.price] : []))
      : price;
    const rawImg = pic ? pic.img : it.img;
    const addLine = (q: number) => {
      const spec: LineSpec = { k: 'cat', cat: key, id: it.id, opts: Object.fromEntries(groups.map((g, i) => [g.id, chosen[i].id])) };
      const pr = mustPrice(spec);
      onAdd?.({ key: [it.id].concat(chosen.map((c) => c.id)).join('-'), name: pr.name, summary: pr.summary, unit: pr.unit, img: IMG(rawImg), spec }, q);
      clearTimeout(timer.current);
      setAdded(it.id);
      setOpen(null);
      timer.current = setTimeout(() => setAdded(null), 1400);
    };
    const openOrAdd = () => {
      if (hasOpts) { setOpen(it.id); setQty(1); } else addLine(1);
    };
    return {
      it, groups, chosen, price, sub, justAdded, hasOpts, addLine, openOrAdd,
      img: IMG(rawImg),
      credit: rawImg && rawImg.indexOf('assets/') !== 0 ? 'Photo on Unsplash' : '',
      priceText: hasOpts && isFinite(minP) && minP !== price ? 'From ' + money(minP) : money(price),
      addAria: 'Add ' + it.name + (sub ? ', ' + sub : '') + ', ' + money(price),
    };
  };

  const pick = (itemId: string, groupId: string, optId: string) =>
    setSel((st) => ({ ...st, [itemId]: { ...(st[itemId] || {}), [groupId]: optId } }));

  const mob = w < 720;
  const oi = open ? cat.items.find((i) => i.id === open) : undefined;
  const m = oi ? build(oi) : null;

  return (
    <div style={S.root}>
      <section style={S.heroSection}>
        <div style={ph ? { ...S.hero, minHeight: 300, borderRadius: 28 } : S.hero}>
          <Photo src={hero.img} alt="" credit="Photo on Unsplash" creditHref="https://unsplash.com" eager />
          <div style={S.heroShade} />
          <div style={ph ? { ...S.heroBody, gap: 28 } : S.heroBody}>
            <Hov as="button" type="button" onClick={ev(onBack)} style={S.back} hover={S.backHover}>
              <IconBack size={16} stroke={2.8} />
              Back
            </Hov>
            <div style={S.heroText}>
              <span style={S.eyebrow}>{hero.eyebrow}</span>
              <h1 style={S.h1}>
                {hero.t1}
                <br />
                <span style={{ color: '#FF5A4E' }}>{hero.t2}</span>
              </h1>
              <p style={S.heroP}>{hero.p}</p>
            </div>
          </div>
        </div>
      </section>

      <section style={S.listSection}>
        <div style={ph ? { ...S.bar, padding: '24px 0 18px', gap: 12 } : S.bar}>
          {filters ? (
            <div role="tablist" aria-label="Filter items" className="pk-noscroll" style={ph ? { display: 'flex', gap: 8, flexWrap: 'nowrap', overflowX: 'auto', scrollbarWidth: 'none', margin: '0 -16px', padding: '2px 16px', width: 'calc(100% + 32px)', WebkitOverflowScrolling: 'touch' } : S.tabs}>
              {filters.map(([id, label]) => {
                const on = filter === id;
                const count = id === 'all' ? cat.items.length : cat.items.filter((i) => i.f === id).length;
                return (
                  <button key={id} type="button" role="tab" aria-selected={on} onClick={() => setFilter(id)} style={{ ...S.tab, background: on ? '#1A1414' : '#EDEDF0', color: on ? '#fff' : '#1A1414' }}>
                    {label}
                    <span style={S.tabCount}>{count}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <span style={S.count}>{cat.items.length + ' ' + (cat.noun || 'items')}</span>
          )}
          <Hov as="a" href="#menu" onClick={ev(onMenu)} style={S.fullMenu} hover={S.fullMenuHover}>
            View full menu
            <IconArrow size={14} stroke={2.8} />
          </Hov>
        </div>

        <div style={ph ? { ...S.grid, gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 } : S.grid}>
          {shown.map((it) => {
            const b = build(it);
            return (
              <Hov as="article" key={it.id} onClick={b.openOrAdd} style={ph ? { ...S.card, borderRadius: 18 } : S.card} hover={S.cardHover}>
                {/* Items without a real photo keep an empty image box on purpose (owner rule). */}
                <div style={S.cardMedia}>
                  <Photo src={b.img} alt={it.name} credit={b.credit} creditHref="https://unsplash.com" />
                  <div style={ph ? { ...S.badges, left: 8, top: 8, transform: 'scale(.85)', transformOrigin: 'left top' } : S.badges}>
                    {it.tag ? <span style={S.tag}>{it.tag}</span> : null}
                    {it.veg ? (
                      <span style={S.veg}>
                        <span style={S.vegDot} />
                        Vegetarian
                      </span>
                    ) : null}
                  </div>
                </div>
                <div style={ph ? { ...S.cardBody, gap: 8, padding: '10px 10px 10px 12px' } : S.cardBody}>
                  <div style={ph ? { ...S.cardHead, gap: 3 } : S.cardHead}>
                    <span style={ph ? { ...S.cardName, fontSize: 15, letterSpacing: '-.02em', lineHeight: 1.2 } : S.cardName}>{it.name}</span>
                    {it.desc ? <span style={ph ? { ...S.cardDesc, fontSize: 12.5, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } : S.cardDesc}>{it.desc}</span> : null}
                  </div>
                  <div style={S.cardFoot}>
                    <div style={S.priceCol}>
                      <span style={ph ? { ...S.price, fontSize: 16, letterSpacing: '-.02em' } : S.price}>{b.priceText}</span>
                      {ph ? null : <span style={S.sub}>{b.hasOpts ? 'Choose options' : ''}</span>}
                    </div>
                    <Hov
                      as="button"
                      type="button"
                      aria-label={b.addAria}
                      onClick={(e: MouseEvent) => { e.stopPropagation(); b.openOrAdd(); }}
                      style={{ ...S.addBtn, ...(ph ? { width: 36, height: 36 } : {}), background: b.justAdded ? '#1E8A4C' : '#D7192D' }}
                      hover={S.addBtnHover}
                    >
                      {b.justAdded ? <IconCheck size={18} stroke={3.2} /> : <IconPlus size={18} stroke={3} />}
                    </Hov>
                  </div>
                </div>
              </Hov>
            );
          })}
        </div>
      </section>

      {m ? (
        <div role="dialog" aria-modal="true" aria-label={m.it.name} style={{ ...S.dialog, alignItems: mob ? 'flex-end' : 'center', padding: mob ? '0' : '24px' }}>
          <div onClick={() => setOpen(null)} style={S.scrim} />
          <div style={{ ...S.panel, maxHeight: mob ? '92vh' : 'min(640px,90vh)', flexDirection: mob ? 'column' : 'row', borderRadius: mob ? '28px 28px 0 0' : '28px' }}>
            <div style={{ position: 'relative', flex: mob ? 'none' : '0 0 44%', minHeight: mob ? '220px' : '0', background: '#EDEDF0' }}>
              <Photo src={m.img} alt={m.it.name} credit={m.credit} creditHref="https://unsplash.com" />
              <button type="button" onClick={() => setOpen(null)} aria-label="Close" style={S.close}>
                <IconClose size={16} stroke={2.8} />
              </button>
            </div>
            <div style={S.sheetCol}>
              <div style={S.sheetScroll}>
                <div style={S.sheetHead}>
                  <span style={S.sheetName}>{m.it.name}</span>
                  {m.it.desc ? <span style={S.sheetDesc}>{m.it.desc}</span> : null}
                </div>
                <div style={S.groups}>
                  {m.groups.map((g, gi) => (
                    <div key={g.id} style={S.group}>
                      {g.label ? <span style={S.groupLabel}>{g.label}</span> : null}
                      {!g.chips ? (
                        <div role="radiogroup" aria-label={g.label || 'Option'} style={S.seg}>
                          {g.opts.map((x) => {
                            const on = x.id === m.chosen[gi].id;
                            return (
                              <button
                                key={x.id}
                                type="button"
                                role="radio"
                                aria-checked={on}
                                aria-label={(x.long || x.label) + (x.price != null ? ', ' + money(x.price) : '')}
                                onClick={() => pick(m.it.id, g.id, x.id)}
                                style={{ ...S.segBtn, background: on ? '#fff' : 'transparent', color: on ? '#1A1414' : '#818184', boxShadow: on ? '0 2px 8px rgba(26,20,20,.12)' : 'none' }}
                              >
                                {x.label}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div role="radiogroup" aria-label={g.label || 'Option'} style={S.chips}>
                          {g.opts.map((x) => {
                            const on = x.id === m.chosen[gi].id;
                            return (
                              <button
                                key={x.id}
                                type="button"
                                role="radio"
                                aria-checked={on}
                                onClick={() => pick(m.it.id, g.id, x.id)}
                                style={{ ...S.chip, background: on ? '#1A1414' : '#EDEDF0', color: on ? '#fff' : '#1A1414' }}
                              >
                                {x.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div style={S.sheetFoot}>
                <div style={S.stepper}>
                  <Hov as="button" type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity" style={S.stepBtn} hover={S.stepBtnHover}>
                    <IconMinus size={16} stroke={3} />
                  </Hov>
                  <span style={S.qty}>{qty}</span>
                  <Hov as="button" type="button" onClick={() => setQty((q) => Math.min(20, q + 1))} aria-label="Increase quantity" style={S.stepBtn} hover={S.stepBtnHover}>
                    <IconPlus size={16} stroke={3} />
                  </Hov>
                </div>
                <Hov as="button" type="button" onClick={() => m.addLine(qty)} style={S.sheetAdd} hover={S.sheetAddHover}>
                  <span>Add to order</span>
                  <span>{money(m.price * qty)}</span>
                </Hov>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
