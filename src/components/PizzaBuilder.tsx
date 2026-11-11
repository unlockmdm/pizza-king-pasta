// Live pizza builder. Port of design_handoff_pizza_king_website 2/prototype/PizzaBuilder.dc.html.
import { Fragment, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import type { Half, NewLine, PizzaBuilderProps, PizzaConfig, SizeKey, SizePrices } from '../lib/types';
import { Hov } from '../lib/ui';
import { useEscape, useLockBody, useWidth } from '../lib/hooks';
import { CHEESES, PIZZA_SAUCES, SEASONINGS, SLICES, SPICES, TOPPING_ROWS, TOP_PRICE, EXTRA_CHEESE, pizzaQuote, pizzaSummary, priceLine, pricesFor, pizzaTopNames, type PizzaSpec, type TopCat } from '../lib/pricing';
import { money } from '../lib/format';
import './PizzaBuilder.css';

// ---------------------------------------------------------------------------
// Data (the prototype's const arrays are the spec for content and pricing)
// ---------------------------------------------------------------------------

const IMG = 'assets/ingredients/';
const BASE_IMG = 'assets/pizza-base.webp';

/** Per-topping scale factor applied to the cut-out sprite sizes. Default 0.8. */
const TSCALE: Record<string, number> = { pineapple: 0.62, tomatoes: 0.7, broccoli: 0.68, zucchini: 0.68, eggplant: 0.68, mushrooms: 0.75, 'hot-peppers': 0.7, 'sun-dried': 0.72, corn: 1, olives: 0.9, 'green-olives': 0.9, pepperoni: 0.62, 'veg-pepperoni': 0.62, 'hot-salami': 0.62, anchovies: 0.55, bacon: 0.5, ham: 0.5, sausage: 0.6, 'tandoori-chicken': 0.55, 'butter-chicken': 0.75, 'grilled-chicken': 0.5, 'shawarma-chicken': 0.6, shrimp: 0.7, 'seafood-mix': 0.6, 'chicken-kabab': 0.5 };

/**
 * Topping cut-out sprites: [path under assets/toppings/ without .png, size as % of pizza width].
 * Tandoori paneer (`paneer`) uses the reddish-orange tpan-* pieces; Shahi paneer uses the yellow shahi-* pieces.
 * Toppings without an entry (feta, extra cheese) have no cut-out yet and don't render on the pizza.
 */
const SPR: Record<string, [string, number][]> = {"mushrooms":[["pz/mushroom-0",16.5],["pz/mushroom-1",13.8]],"green-peppers":[["pz/gp-0",20.1],["pz/gp-1",15.1],["pz/gp-2",9.1],["pz/gp-3",11.1]],"red-pepper":[["pz/rp-0",15.6],["pz/rp-1",8.6],["pz/rp-2",12.1]],"tomatoes":[["pz/tomato-0",18.5]],"green-olives":[["pz/gol-0",8]],"olives":[["pz/bol-0",9.6]],"hot-peppers":[["pz/hotp-0",17.1]],"pineapple":[["pz/pine-0",14.3]],"jalapenos":[["pz/jal-0",13.2]],"sun-dried":[["pz/sund-0",15.1]],"broccoli":[["pz/broc-0",18.5]],"corn":[["pz/corn-0",6],["pz/corn-1",6],["pz/corn-2",6],["pz/corn-3",6],["pz/corn-4",6],["pz/corn-5",6],["pz/corn-6",6],["pz/corn-7",6],["pz/corn-8",6]],"pepperoni":[["pz/mpep-0",19.6],["pz/mpep-1",19]],"veg-pepperoni":[["pz/mpep-0",19.6],["pz/mpep-1",19]],"hot-salami":[["pz/mpep-0",19.6],["pz/mpep-1",19]],"zucchini":[["pz/zuc-0",18.5]],"eggplant":[["pz/egg-0",17]],"red-onions":[["pz/onion-0",15],["pz/onion-1",10.2]],"paneer":[["pz/tpan-0",10.5],["pz/tpan-1",9.3],["pz/tpan-2",15.3]],"shahi-paneer":[["pz/shahi-0",12.3],["pz/shahi-1",12.3]],"soya-champ":[["pz/paneer-1",12.3],["pz/paneer-2",9.3]],"sausage":[["pz/isaus-0",16]],"shrimp":[["pz/shrimp-0",14.2]],"seafood-mix":[["pz/shrimp-0",14.2],["pz/anch-0",21.5]],"anchovies":[["pz/anch-0",21.5]],"bacon":[["pz/bacon-0",23]],"ham":[["pz/ham-0",23]],"tandoori-chicken":[["pz/tand-0",19],["pz/tand-1",16.5]],"butter-chicken":[["pz/butter-0",11.5],["pz/butter-1",13],["pz/butter-2",10]],"grilled-chicken":[["pz/grilled-0",25.5],["pz/grilled-1",17]],"shawarma-chicken":[["pz/shaw-0",17]],"chicken-kabab":[["pz/kabab-0",22]]};

/** Deterministic pseudo-random number in [0, 1) from a string (FNV-1a + murmur finaliser). */
const hash = (s: string) => {
  let x = 2166136261;
  for (let i = 0; i < s.length; i++) x = Math.imul(x ^ s.charCodeAt(i), 16777619);
  x ^= x >>> 16; x = Math.imul(x, 2246822507); x ^= x >>> 13; x = Math.imul(x, 3266489909); x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
};

interface Topping {
  id: string;
  name: string;
  cat: TopCat;
  /** How many toppings it counts as. */
  wt: number;
  img: string | null;
  hasImg: boolean;
  fit: 'cover' | 'contain';
  iw: string;
  initials: string;
}

/** Ingredient photo per topping (names, categories and weights come from the shared pricing data). */
const TOP_IMG: Record<string, string | null> = {
  mushrooms: 'mushrooms.png', 'green-peppers': 'green-peppers.png', 'red-pepper': 'red-pepper.png', tomatoes: 'tomatoes.png',
  'green-olives': 'olives.png', 'soya-champ': 'soya-champ.jpg', olives: 'olives.png', 'red-onions': 'red-onions.png',
  'hot-peppers': 'chilli.png', pineapple: 'pineapple.png', jalapenos: 'jalapenos.png', 'sun-dried': 'sun-dried.png',
  broccoli: 'broccoli.png', corn: 'corn.jpg', 'shahi-paneer': 'shahi-paneer-y.jpg', paneer: 'paneer.jpg',
  'veg-pepperoni': 'pepperoni.jpg', 'extra-mozz': 'extra-mozz.png', feta: 'feta.jpg', zucchini: 'zucchini.png', eggplant: 'eggplant.png',
  pepperoni: 'pepperoni.jpg', anchovies: null, bacon: 'bacon.png', ham: 'ham.png', sausage: 'sausage.png',
  'grilled-chicken': 'shawarma-chicken.png', 'tandoori-chicken': 'tandoori-chicken.png', 'butter-chicken': 'butter-chicken.png',
  'shawarma-chicken': 'shawarma-chicken.png', 'seafood-mix': 'shrimp.png', shrimp: 'shrimp.png', 'chicken-kabab': null, 'hot-salami': 'pepperoni.jpg',
};
const TOP_ROWS: [string, string, TopCat, string | null, number][] = TOPPING_ROWS.map(([id, name, cat, wt]) => [id, name, cat, TOP_IMG[id] ?? null, wt]);

const TOPS: Topping[] = TOP_ROWS.map(([id, name, cat, f, wt]) => ({
  id, name, cat, wt: wt || 1,
  img: f ? IMG + f : null,
  hasImg: !!f,
  fit: f && f.endsWith('.jpg') ? 'cover' : 'contain',
  iw: f && f.endsWith('.jpg') ? '100%' : '80%',
  initials: name.split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase(),
}));
const TOPMAP: Record<string, Topping> = Object.fromEntries(TOPS.map((t) => [t.id, t]));

const FREE = SEASONINGS;
const FREE_IMG: Record<string, string> = { Ginger: 'ginger.png', Garlic: 'sauce-garlic.png', Coriander: 'coriander.png', 'Red chilli': 'red-chilli.png', 'Green chilli': 'chilli.png', Oregano: 'oregano.png', 'Italian spice': 'italian-spice.png' };

// [value, display label, file under assets/sauces/ without .png]. 'Regular' is shown as "Marinara".
const SAUCE_FILE: Record<string, string> = { Regular: 'tomato', 'Butter chicken': 'butter-chicken', 'Shahi paneer': 'shahi-paneer', Garlic: 'garlic', Hot: 'hot', BBQ: 'bbq', Pesto: 'pesto', 'Honey garlic': 'honey-garlic' };
const SAUCES: [string, string, string][] = PIZZA_SAUCES.map(([v, label]) => [v, label, SAUCE_FILE[v] || 'tomato']);
const sauceImg = (f: string) => 'assets/sauces/' + f + '.png';
/** Live pizza base image per sauce. Regular (marinara) keeps the plain base photo. */
const SAUCE_BASE: Record<string, string> = { 'Butter chicken': 'assets/sauce-base/butter-chicken.webp', 'Shahi paneer': 'assets/sauce-base/shahi-paneer.webp', Garlic: 'assets/sauce-base/garlic.webp', Hot: 'assets/sauce-base/hot.webp', BBQ: 'assets/sauce-base/bbq.webp', Pesto: 'assets/sauce-base/pesto.webp', 'Honey garlic': 'assets/sauce-base/honey-garlic.webp' };

/** Crust cards: [value, subtitle, stacked-disc layer count]. */
const CRUSTS: [string, string, number][] = [['Regular', 'Our standard crust', 9], ['Thin', 'Light and crispy', 3], ['Thick', 'Soft and bready', 13]];
/** Brown gradient discs stacked under the top photo (darkest at the bottom). */
const crustLayers = (t: number) => Array.from({ length: t }, (_, j) => {
  const k = j / Math.max(1, t - 1);
  return { z: j - t + 'px', bg: 'rgb(' + Math.round(150 + 60 * k) + ',' + Math.round(96 + 52 * k) + ',' + Math.round(48 + 34 * k) + ')' };
});
interface OvenCard { v: string; desc: string; img: string; bg: string; r: string; b: string; w: string; h: string; fit: string; pos: string; ar: string }
const OVENS: OvenCard[] = [
  { v: 'Wood-fired', desc: 'Smoky, blistered crust. Our default.', img: 'assets/oven-wood-fired.png', bg: '#120B08', r: '0', b: '0', w: '100%', h: '100%', fit: 'cover', pos: '40% 45%', ar: 'auto' },
  { v: 'Conventional', desc: 'Even bake, softer crust. Same price.', img: 'assets/oven-conventional.webp', bg: '#120B08', r: '0', b: '0', w: '100%', h: '100%', fit: 'cover', pos: '50% 60%', ar: 'auto' },
];
/** Cheese level: [meter bars, photo width]. */
const CL: Record<string, [number, string | null]> = { Light: [1, '58%'], Regular: [2, '74%'], Extra: [3, '92%'], None: [0, null] };

const SIZES: [SizeKey, string, number][] = [['S', 'Small', 24], ['M', 'Medium', 29], ['L', 'Large', 34], ['XL', 'X-Large', 40]];
const SCALE: Record<SizeKey, number> = { S: 0.8, M: 0.87, L: 0.94, XL: 1 };
// Extra topping price (TOP_PRICE), spice levels and cheese levels come from the shared pricing module.

const SECS: [SecKey, string][] = [['crust', 'Oven & crust'], ['sauce', 'Base sauce'], ['cheese', 'Cheese'], ['tops', 'Toppings'], ['notes', 'Instructions']];
type SecKey = 'crust' | 'sauce' | 'cheese' | 'tops' | 'notes';
const HV: [Half, string, string][] = [['left', 'Left half', 'M12 3.5a8.5 8.5 0 0 0 0 17z'], ['whole', 'Whole pizza', 'M12 3.5a8.5 8.5 0 1 1 0 17a8.5 8.5 0 1 1 0-17z'], ['right', 'Right half', 'M12 3.5a8.5 8.5 0 0 1 0 17z']];

/** Bake level treatment (same filter on the option tile and on the live pizza). */
const DONENESS_FILTER: Record<string, string> = { Light: 'brightness(1.1) saturate(.7) contrast(.95)', Regular: 'none', 'Well done': 'brightness(.78) saturate(1.25) contrast(1.12) sepia(.12)' };
/** Knife lines, in the 76x76 box of the pizza photo. */
const CUT_PATH: Record<string, string> = { Triangles: 'M38 9V67M9 38H67M17.5 17.5L58.5 58.5M58.5 17.5L17.5 58.5', Squares: 'M27 10V66M49 10V66M10 27H66M10 49H66', Uncut: '' };
// Cut is not a customer choice: every pizza is cut into triangles.
const CHIP_GROUPS: ['doneness', string, string[]][] = [['doneness', 'Bake', ['Regular', 'Light', 'Well done']]];
/** Size picker icon: a pizza with one knife line per pair of slices (S 6, M 8, L 10, XL 12). */
const sliceCuts = (n: number) => Array.from({ length: n / 2 }, (_, i) => { const a = (Math.PI * 2 * i) / n - Math.PI / 2, x = 19 * Math.cos(a), y = 19 * Math.sin(a); return 'M' + (20 + x).toFixed(2) + ' ' + (20 + y).toFixed(2) + 'L' + (20 - x).toFixed(2) + ' ' + (20 - y).toFixed(2); }).join('');

const DEFAULTS = { size: 'L' as SizeKey, crust: 'Regular', bake: 'Wood-fired', sauce: 'Regular', cheese: 'Regular', spice: 'No spice', doneness: 'Regular', cut: 'Triangles', notes: '', qty: 1 };

// ---------------------------------------------------------------------------
// Live pizza: scatter cut-outs with deterministic positions
// ---------------------------------------------------------------------------

interface Piece { key: string; src: string; x: string; y: string; w: string; tf: string }

function buildPieces(tops: Record<string, Half>): Piece[] {
  const keys = Object.keys(tops);
  const want: { k: string; ti: number; sp: [string, number][]; side: Half; n: number }[] = [];
  keys.forEach((k, ti) => {
    const sp = SPR[k];
    if (!sp) return;
    const side = tops[k];
    const avg = (sp.reduce((t, x) => t + x[1], 0) / sp.length) * (TSCALE[k] || 0.8);
    const full = avg <= 6.5 ? 14 : avg <= 9 ? 10 : avg <= 12 ? 8 : 7;
    want.push({ k, ti, sp, side, n: side === 'whole' ? full : Math.ceil(full * 0.55) });
  });
  const cap = 0.42 * 0.42 * Math.PI * 0.42;
  let area = 0;
  want.forEach((w) => {
    const avg = ((w.sp.reduce((t, x) => t + x[1], 0) / w.sp.length) * (TSCALE[w.k] || 0.8)) / 100;
    area += w.n * avg * avg * 0.7;
  });
  const fit = area > cap ? Math.sqrt(cap / area) : 1;
  const items: { k: string; i: number; side: Half; src: string; size: number }[] = [];
  want.forEach((w) => {
    const n = Math.max(w.side === 'whole' ? 3 : 2, Math.round(w.n * Math.min(1, fit * 1.15)));
    const shrink = Math.max(0.78, Math.min(1, fit * 1.25));
    for (let i = 0; i < n; i++) {
      const pick = w.sp[(i + w.ti) % w.sp.length];
      items.push({ k: w.k, i, side: w.side, src: pick[0], size: pick[1] * (TSCALE[w.k] || 0.8) * shrink * (0.88 + hash(w.k + 'z' + i) * 0.24) });
    }
  });
  items.sort((p, q) => q.size - p.size || (p.k < q.k ? -1 : 1));
  const placed: { k: string; x: number; y: number; r: number }[] = [];
  const pieces: Piece[] = [];
  items.forEach((it) => {
    const rr = it.size / 200;
    const maxR = 0.425 - rr * 0.9;
    let best: { x: number; y: number } | null = null;
    let bestScore = -1e9;
    for (let c = 0; c < 48; c++) {
      const u = hash(it.k + 'u' + it.i + '-' + c), v = hash(it.k + 'v' + it.i + '-' + c);
      let ang = u * Math.PI * 2;
      if (it.side === 'left') ang = Math.PI / 2 + u * Math.PI;
      if (it.side === 'right') ang = -Math.PI / 2 + u * Math.PI;
      const rad = Math.sqrt(v) * maxR;
      const x = Math.cos(ang) * rad, y = Math.sin(ang) * rad;
      if (it.side === 'left' && x > -rr * 0.6) continue;
      if (it.side === 'right' && x < rr * 0.6) continue;
      let score = 1e9;
      placed.forEach((p) => {
        const d = Math.hypot(p.x - x, p.y - y) - (p.r + rr) * 0.92;
        const same = p.k === it.k ? 0.6 : 1;
        if (d * same < score) score = d * same;
      });
      score = Math.min(score, (maxR - rad) * 1.4 + 0.02);
      if (score > bestScore) { bestScore = score; best = { x, y }; }
    }
    if (!best) best = { x: 0, y: 0 };
    placed.push({ k: it.k, x: best.x, y: best.y, r: rr });
    const cx = 50 + best.x * 100, cy = 50 + best.y * 100;
    pieces.push({
      key: it.k + '-' + it.i,
      src: 'assets/toppings/' + it.src + '.png',
      x: (cx - it.size / 2).toFixed(2) + '%',
      y: (cy - it.size / 2).toFixed(2) + '%',
      w: it.size.toFixed(2) + '%',
      tf: 'rotate(' + Math.round(hash(it.k + 'r' + it.i) * 360) + 'deg)' + (hash(it.k + 'f' + it.i) > 0.5 ? ' scaleX(-1)' : ''),
    });
  });
  return pieces;
}

/** Layers of the live pizza: base photo (swapped per sauce), topping cut-outs, knife lines. */
/** Every image the live pizza can need: the 8 bases and all topping cut-outs. */
const PRELOAD = [BASE_IMG, ...Object.values(SAUCE_BASE), ...Object.values(SPR).flat().map(([p]) => 'assets/toppings/' + p + '.png')];
let preloaded = false;
export function preloadPizzaImages() {
  if (preloaded) return;
  preloaded = true;
  for (const src of PRELOAD) {
    const im = new Image();
    im.decoding = 'async';
    im.src = src;
  }
}

/** Show `src` only once it has downloaded and decoded; until then keep the previous image (no half-drawn pizza). */
function useReadySrc(src: string) {
  const [shown, setShown] = useState(src);
  useEffect(() => {
    if (src === shown) return;
    let live = true;
    const im = new Image();
    im.src = src;
    const done = () => { if (live) setShown(src); };
    (im.decode ? im.decode() : Promise.resolve()).then(done, done);
    return () => { live = false; };
  }, [src, shown]);
  return shown;
}

function PizzaLayers({ pieces, label, sauce, doneness, cut }: { pieces: Piece[]; label?: string; sauce: string; doneness: string; cut: string }) {
  const tone = DONENESS_FILTER[doneness] || 'none';
  const base = useReadySrc(SAUCE_BASE[sauce] || BASE_IMG);
  const cuts = CUT_PATH[cut] || '';
  return (
    <>
      {/* Cheap static shadow instead of a CSS drop-shadow filter (filters repaint on every change). */}
      <span aria-hidden="true" style={{ position: 'absolute', left: '6%', right: '6%', bottom: '-4%', height: '16%', borderRadius: '50%', background: 'radial-gradient(closest-side,rgba(26,20,20,.24),rgba(26,20,20,0))', pointerEvents: 'none' }} />
      <img
        src={base}
        alt={label || ''}
        aria-hidden={label ? undefined : true}
        decoding="async"
        draggable={false}
        style={{ position: 'relative', display: 'block', width: '100%', height: '100%', objectFit: 'cover', filter: tone === 'none' ? undefined : tone, transition: 'filter .2s' }}
      />
      {pieces.map((pc) => (
        <span
          key={pc.key}
          aria-hidden="true"
          style={{ display: 'block', flex: 'none', backgroundImage: "url('" + pc.src + "')", backgroundPosition: 'center', backgroundRepeat: 'no-repeat', position: 'absolute', left: pc.x, top: pc.y, width: pc.w, aspectRatio: '1/1', backgroundSize: 'contain', transform: pc.tf, filter: tone === 'none' ? undefined : tone, pointerEvents: 'none' }}
        />
      ))}
      {cuts ? (
        <svg aria-hidden="true" width="100%" height="100%" viewBox="0 0 76 76" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', animation: 'pbIn .25s ease both' }}>
          <path d={cuts} stroke="rgba(70,35,10,.55)" strokeWidth={2} vectorEffect="non-scaling-stroke" fill="none" strokeLinecap="round" />
          <path d={cuts} stroke="rgba(255,240,215,.55)" strokeWidth={1} vectorEffect="non-scaling-stroke" fill="none" strokeLinecap="round" transform="translate(.25,.25)" />
        </svg>
      ) : null}
    </>
  );
}

// ---------------------------------------------------------------------------
// Small shared pieces
// ---------------------------------------------------------------------------

interface Slot { bg: string; fill: string; sz: string; bs: string; bc: string; sh: string }
interface Status { done: boolean; text: string; aria: string; bg: string; fg: string; slots: Slot[] }

const Check = ({ size, stroke }: { size: number; stroke: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

/** Red check badge in the corner of a selected tile. */
const Badge = ({ size, inset, icon, iconStroke, extra }: { size: number; inset: number; icon: number; iconStroke: number; extra?: CSSProperties }) => (
  <span style={{ position: 'absolute', top: inset, right: inset, width: size, height: size, borderRadius: '50%', background: '#D7192D', display: 'flex', alignItems: 'center', justifyContent: 'center', ...extra }}>
    <Check size={icon} stroke={iconStroke} />
  </span>
);

const h2Style: CSSProperties = { margin: 0, fontWeight: 900, fontSize: 24, letterSpacing: '-.03em' };

function SectionHead({ title, st }: { title: string; st: Status }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px 20px', flexWrap: 'wrap' }}>
      <h2 style={h2Style}>{title}</h2>
      <div role="status" aria-label={st.aria} style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 12, height: 44, padding: '0 6px 0 16px', borderRadius: 999, background: st.bg, color: st.fg, transition: 'background .25s,color .25s' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 800, whiteSpace: 'nowrap' }}>
          {st.done ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
          ) : null}
          {st.text}
        </span>
        <span style={{ display: 'flex', paddingLeft: 8 }}>
          {st.slots.map((t, i) => (
            <span key={i} style={{ width: 34, height: 34, boxSizing: 'border-box', marginLeft: -8, borderRadius: '50%', border: '2px ' + t.bs + ' ' + t.bc, backgroundColor: t.fill, backgroundImage: t.bg, backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundSize: t.sz, boxShadow: t.sh, transition: 'border-color .2s' }} />
          ))}
        </span>
      </div>
    </div>
  );
}

const sectionStyle = (first: boolean): CSSProperties => ({ display: 'flex', flexDirection: 'column', gap: 18, padding: '20px 0 40px', ...(first ? {} : { borderTop: '1px solid #E9E9EC' }) });
const tile = (on: boolean) => ({ border: on ? '2px solid #D7192D' : '1.5px solid #E6E6E9', bg: on ? '#FAFAFD' : '#fff' });
const photoSpan = (img: string, w: string, fit: string, extra?: CSSProperties): CSSProperties => ({ display: 'block', flex: 'none', backgroundImage: "url('" + img + "')", backgroundPosition: 'center', backgroundRepeat: 'no-repeat', width: w, height: w, backgroundSize: fit, mixBlendMode: 'multiply', ...extra });

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type BuilderState = typeof DEFAULTS & { tops: Record<string, Half>; free: Record<string, boolean>; cat: TopCat; sec: SecKey };

export default function PizzaBuilder({ item, sizePrices, combo, onClose, onAdd }: PizzaBuilderProps) {
  // Size prices come from the shared pricing module by pizza id (desi specials cost more than the classics),
  // so what the builder shows is exactly what the payment server charges.
  void sizePrices;
  const w = useWidth();
  const wide = w >= 960;
  useLockBody(true);
  useEscape(true, onClose);
  useEffect(preloadPizzaImages, []);
  const crustRows = w < 600; // phone: crust options as full-width rows
  const compactSteps = w < 700; // phone: only the current step shows its name
  const navRef = useRef<HTMLElement>(null);

  const baseTops = () => {
    const t: Record<string, Half> = {};
    (item?.tops || []).forEach((id) => { t[id] = 'whole'; });
    return t;
  };

  const [s, setS] = useState<BuilderState>(() => {
    const st: BuilderState = { ...DEFAULTS, tops: baseTops(), free: {}, cat: 'Veggie', sec: 'crust' };
    if (combo) {
      st.size = combo.size;
      st.qty = 1;
      const init = combo.init || {};
      (['crust', 'bake', 'sauce', 'cheese', 'spice', 'doneness', 'notes'] as const).forEach((k) => { if (typeof init[k] === 'string') st[k] = init[k] as string; });
      if (init.tops) st.tops = { ...init.tops };
      if (init.free) st.free = { ...init.free };
    }
    return st;
  });
  const set = (patch: Partial<BuilderState> | ((p: BuilderState) => Partial<BuilderState>)) =>
    setS((p) => ({ ...p, ...(typeof patch === 'function' ? patch(p) : patch) }));

  // ----- section scroll + scroll spy -----
  const rootRef = useRef<HTMLDivElement>(null);
  const refCrust = useRef<HTMLElement>(null);
  const refSauce = useRef<HTMLElement>(null);
  const refCheese = useRef<HTMLElement>(null);
  const refTops = useRef<HTMLElement>(null);
  const refNotes = useRef<HTMLElement>(null);
  const secRefs: Record<SecKey, RefObject<HTMLElement>> = { crust: refCrust, sauce: refSauce, cheese: refCheese, tops: refTops, notes: refNotes };
  const lock = useRef(0);
  const secTop = (k: SecKey) => {
    const r = rootRef.current!, el = secRefs[k].current!;
    return el.getBoundingClientRect().top - r.getBoundingClientRect().top + r.scrollTop;
  };
  const goSec = (k: SecKey) => {
    const r = rootRef.current;
    if (!r || !secRefs[k].current) return;
    lock.current = Date.now();
    set({ sec: k });
    r.scrollTo({ top: Math.max(0, secTop(k) - 128), behavior: 'smooth' });
  };
  const spy = () => {
    if (lock.current && Date.now() - lock.current < 700) return;
    const r = rootRef.current;
    if (!r) return;
    let cur: SecKey = SECS[0][0];
    for (const [k] of SECS) { if (secRefs[k].current && secTop(k) - r.scrollTop <= 160) cur = k; }
    if (r.scrollTop + r.clientHeight >= r.scrollHeight - 4) cur = SECS[SECS.length - 1][0];
    if (cur !== s.sec) set({ sec: cur });
  };

  const [noteFocus, setNoteFocus] = useState(false);

  // ----- derived values (renderVals) -----
  const keys = Object.keys(s.tops);
  // In a combo the deal sets the included toppings (and the pizza is priced as Build Your Own).
  const pid = item?.id || 'byo';
  const P: SizePrices = pricesFor(pid);
  const q = pizzaQuote(pid, s.size, keys, s.cheese, combo && item?.included != null ? item.included : undefined, P);
  const { included, used, extraCount, topCost, cheeseCost, unit, extra } = q;
  const wOf = (k: string) => TOPMAP[k]?.wt || 1;
  const cumOf: Record<string, number> = {};
  keys.reduce((a, k) => (cumOf[k] = a + wOf(k)), 0);
  const hasExtra = extra > 0.001;
  const sizeName = SIZES.find((x) => x[0] === s.size)![1];
  const topOf = (id: string) => TOPMAP[id] || ({ name: id } as Topping);
  const name = item?.name || 'Build Your Own';

  const whole = keys.filter((k) => s.tops[k] === 'whole').map((k) => topOf(k).name);
  const lh = keys.filter((k) => s.tops[k] === 'left').map((k) => topOf(k).name);
  const rh = keys.filter((k) => s.tops[k] === 'right').map((k) => topOf(k).name);
  const freeOn = FREE.filter((f) => s.free[f]);
  let ingredientLine = [s.crust + ' crust', s.bake.toLowerCase(), s.sauce === 'None' ? 'no sauce' : s.sauce === 'Regular' ? 'marinara sauce' : s.sauce.toLowerCase() + ' sauce', s.cheese === 'None' ? 'no cheese' : s.cheese === 'Regular' ? 'mozzarella' : s.cheese.toLowerCase() + ' mozzarella'].join(', ');
  if (whole.length) ingredientLine += ', ' + whole.join(', ');
  if (lh.length) ingredientLine += '. Left half: ' + lh.join(', ');
  if (rh.length) ingredientLine += '. Right half: ' + rh.join(', ');
  if (freeOn.length) ingredientLine += '. Seasonings: ' + freeOn.join(', ').toLowerCase();
  ingredientLine = ingredientLine.charAt(0).toUpperCase() + ingredientLine.slice(1) + '.';

  const pieces = useMemo(() => buildPieces(s.tops), [s.tops]);
  const curStep = Math.max(0, SECS.findIndex((x) => x[0] === s.sec));
  // Keep the current step visible in the sticky bar as the user scrolls through sections.
  useEffect(() => {
    const nav = navRef.current;
    const btn = nav?.querySelector<HTMLElement>('[data-step="' + curStep + '"]');
    if (nav && btn && nav.scrollWidth > nav.clientWidth) nav.scrollTo({ left: btn.offsetLeft - nav.clientWidth / 2 + btn.offsetWidth / 2, behavior: 'smooth' });
  }, [curStep]);

  // ----- section status pills -----
  const url = (u: string | null) => (u ? 'url("' + u + '")' : 'none');
  const slot = (im: string | null, fill?: string | null, sz?: string): Slot => ({ bg: url(im), fill: fill || '#fff', sz: sz || 'cover', bs: im || fill ? 'solid' : 'dashed', bc: im || fill ? '#fff' : '#C7C7CC', sh: im || fill ? '0 2px 8px rgba(26,20,20,.16)' : 'none' });
  const done = (text: string, slots: Slot[]): Status => ({ done: true, text, aria: text + ' selected', bg: '#E8F5EC', fg: '#1E7A3C', slots });
  const sa = SAUCES.find((x) => x[0] === s.sauce) || SAUCES[0];
  const chNone = s.cheese === 'None';
  const topImgs = keys.map((k) => topOf(k)).map((t) => (t.hasImg ? t.img : null));
  let tp: Status;
  if (included) {
    const n = Math.min(used, included), full = used >= included;
    tp = {
      done: full,
      text: extraCount ? n + ' of ' + included + ' + ' + extraCount + ' extra' : full ? 'All set' : n + ' of ' + included + ' included',
      aria: n + ' of ' + included + ' included toppings chosen' + (extraCount ? ', ' + extraCount + ' extra' : ''),
      bg: full ? '#E8F5EC' : '#F2F2F5',
      fg: full ? '#1E7A3C' : '#1A1414',
      slots: Array.from({ length: Math.max(included, keys.length) }, (_, i) => (i < keys.length ? slot(topImgs[i], topImgs[i] ? '#fff' : '#E6E6EA', '82%') : slot(null))),
    };
  } else {
    tp = { done: false, text: money(TOP_PRICE[s.size]) + ' each', aria: keys.length + ' toppings chosen', bg: '#F2F2F5', fg: '#1A1414', slots: keys.length ? keys.map((_, i) => slot(topImgs[i], '#E6E6EA', '82%')) : [slot(null)] };
  }
  const crT = done(s.crust, [slot(BASE_IMG, '#fff', '92%')]);
  const saT = done(sa[1], [slot(sauceImg(sa[2]), '#fff', '100%')]);
  const chT = done(chNone ? 'No cheese' : s.cheese + ' mozzarella', [chNone ? slot(null) : slot(IMG + 'extra-mozz.png', '#fff', '92%')]);

  // ----- actions -----
  const toggleTop = (id: string) =>
    set((p) => {
      const t = { ...p.tops };
      if (t[id]) delete t[id];
      else t[id] = 'whole';
      return { tops: t };
    });
  const reset = () => set({ ...DEFAULTS, ...(combo ? { size: combo.size } : {}), tops: baseTops(), free: {} });

  const add = () => {
    const tl = keys.map((k) => k + ':' + s.tops[k]).sort().join(',');
    const spec: PizzaSpec = {
      k: 'pizza', id: pid, size: s.size,
      crust: s.crust, bake: s.bake, sauce: s.sauce, cheese: s.cheese, spice: s.spice, doneness: s.doneness, cut: s.cut,
      tops: keys.map((k) => [k, s.tops[k]]), free: FREE.filter((f) => s.free[f]), notes: s.notes,
    };
    const cfg: PizzaConfig = {
      tops: s.tops, free: s.free, crust: s.crust, bake: s.bake, sauce: s.sauce, cheese: s.cheese, spice: s.spice, doneness: s.doneness, cut: s.cut, notes: s.notes,
      extra,
      topNames: pizzaTopNames(spec),
      crustName: s.crust, sauceName: s.sauce, cheeseName: s.cheese,
    };
    // Outside a combo the line is priced and named by the shared priceLine (the server does the same).
    const priced = combo ? null : priceLine(spec);
    const ok = priced && !('error' in priced) ? priced : null;
    const line: NewLine = {
      key: [item?.id, s.size, s.crust, s.bake, s.sauce, s.cheese, tl, s.spice, s.doneness, s.cut, FREE.filter((f) => s.free[f]).join('+'), s.notes.trim()].join('|'),
      name: ok ? ok.name : sizeName + ' ' + (item?.name || 'Build your own'),
      summary: ok ? ok.summary : pizzaSummary(spec, extraCount),
      unit: ok ? ok.unit : unit,
      meta: cfg,
      spec,
    };
    // Prototype signature is onAdd(line, qty, cfg); the cfg is also on line.meta for typed callers.
    (onAdd as (l: NewLine, q: number, c: PizzaConfig) => void)(line, s.qty, cfg);
  };

  const inc = () => { if (!combo) set((p) => ({ qty: Math.min(20, p.qty + 1) })); };
  const dec = () => set((p) => ({ qty: Math.max(1, p.qty - 1) }));

  const addText = combo ? combo.btn || 'Save pizza' : 'Add to order';
  const sizeCols = combo ? '1fr' : 'repeat(4,1fr)';
  const sizes = SIZES.filter(([k]) => !combo || k === combo.size).map(([k, nm, px], i) => {
    const on = s.size === k;
    return { k, label: nm, short: k, cuts: sliceCuts(SLICES[k]), slicesText: SLICES[k] + ' slices', price: combo ? 'In combo' : money(P[k]), px, on, fill: combo ? '#1A1414' : on ? '#D7192D' : '#DCDCDF', bg: combo ? '#fff' : on ? '#FFF1F2' : '#fff', divider: i ? '1px solid #E3E3E6' : '0', mBorder: on ? '#D7192D' : '#E3E3E6' };
  });
  const showQtyRow = !combo || hasExtra;
  const totalText = combo ? (hasExtra ? '+' + money(extra) : 'Included') : money(unit * s.qty);
  const mobileTotal = combo && !hasExtra ? '' : combo ? '+' + money(extra) : money(unit * s.qty);
  const hasExtras = !!(extraCount || cheeseCost);
  const extrasLine = 'Price includes ' + [extraCount ? extraCount + ' extra topping' + (extraCount > 1 ? 's' : '') + ' (' + money(topCost) + ')' : '', cheeseCost ? 'extra cheese (' + money(cheeseCost) + ')' : ''].filter(Boolean).join(' and ');
  const picked = keys.filter((k) => TOPMAP[k] && TOPMAP[k].img).slice(0, 8).map((k) => { const t = topOf(k); return { id: k, name: t.name, img: t.img as string, fit: t.fit, iw: t.iw === '100%' ? '100%' : '86%' }; });
  const pickedText = keys.length + ' topping' + (keys.length === 1 ? '' : 's') + (keys.length > 8 ? ' (+' + (keys.length - 8) + ')' : '');

  const pizzaBox: CSSProperties = { transform: 'scale(' + SCALE[s.size] + ')', transition: 'transform .5s cubic-bezier(.3,.8,.3,1)', borderRadius: '50%', overflow: 'visible', boxShadow: 'none' };
  const layers = (label?: string) => <PizzaLayers pieces={pieces} label={label} sauce={s.sauce} doneness={s.doneness} cut={s.cut} />;

  const stepper = (label: string, fn: () => void, ch: ReactNode) => (
    <Hov as="button" onClick={fn} aria-label={label} style={{ width: 40, height: 40, border: 0, borderRadius: '50%', background: 'transparent', fontSize: 20, fontWeight: 600, cursor: 'pointer', color: '#1A1414' }} hover={{ background: '#F0F0F3' }}>
      {ch}
    </Hov>
  );

  return (
    <div
      ref={rootRef}
      onScroll={spy}
      style={{ position: 'fixed', inset: 0, zIndex: combo ? 130 : 80, background: '#fff', overflow: 'auto', animation: 'pbIn .25s ease both', fontFamily: "'Figtree',system-ui,sans-serif", color: '#1A1414' }}
    >
      <header style={{ position: 'sticky', top: 0, zIndex: 21, background: '#fff', borderBottom: '1px solid #E9E9EC' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', height: 64, padding: '0 clamp(16px,3vw,32px)', display: 'grid', gridTemplateColumns: 'minmax(max-content,1fr) minmax(0,max-content) minmax(max-content,1fr)', alignItems: 'center', gap: w < 420 ? 8 : 16 }}>
          <Hov as="button" onClick={onClose} style={{ justifySelf: 'start', display: 'flex', alignItems: 'center', gap: 6, border: 0, background: 'transparent', height: 44, padding: '0 8px 0 0', fontFamily: 'inherit', fontWeight: 700, fontSize: 15, color: '#1A1414', cursor: 'pointer' }} hover={{ color: '#D7192D' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
            {combo ? 'Combo' : 'Menu'}
          </Hov>
          <span style={{ fontWeight: 900, fontSize: 18, whiteSpace: 'nowrap', letterSpacing: '-.03em', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
          <Hov as="button" onClick={reset} aria-label="Start over with the default pizza" title="Start over" style={{ justifySelf: 'end', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: 0, background: '#F2F2F5', height: 44, minWidth: 44, padding: w < 420 ? 0 : '0 18px 0 14px', borderRadius: 999, fontFamily: 'inherit', fontWeight: 800, fontSize: 15, color: '#1A1414', whiteSpace: 'nowrap', cursor: 'pointer', transition: 'background .2s,color .2s' }} hover={{ background: '#1A1414', color: '#fff' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></svg>
            {w < 420 ? null : 'Start over'}
          </Hov>
        </div>
      </header>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,3vw,32px) ' + (wide ? '64px' : '170px'), display: 'grid', gridTemplateColumns: wide ? 'minmax(0,1fr) 400px' : 'minmax(0,1fr)', gap: 56, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {!wide ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, paddingTop: 24 }}>
              <div style={{ position: 'relative', width: 'min(280px,72vw)', aspectRatio: '1/1', ...pizzaBox }}>{layers()}</div>
              <span style={{ fontSize: 14, color: '#636366', textAlign: 'center', maxWidth: 420, lineHeight: 1.5 }}>{ingredientLine}</span>
            </div>
          ) : null}

          <nav ref={navRef} className="pb-nav" aria-label="Steps" style={{ position: 'sticky', top: 64, zIndex: 20, transform: 'translateZ(40px)', background: '#fff', display: 'flex', alignItems: 'center', gap: compactSteps ? 6 : 12, padding: '14px 0', borderBottom: '1px solid #EFEFF2', boxShadow: '-8px 0 0 #fff,8px 0 0 #fff', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {SECS.map(([k, label], i) => {
              const on = i === curStep, dn = i < curStep;
              const showLabel = !compactSteps || on;
              return (
                <Fragment key={k}>
                  <button data-step={i} onClick={() => goSec(k)} aria-current={on ? 'step' : 'false'} aria-label={compactSteps && !on ? 'Step ' + (i + 1) + ': ' + label : undefined} style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 10, height: 44, padding: '0 2px', border: 0, background: 'transparent', fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    <span style={{ width: 28, height: 28, borderRadius: '50%', background: on ? '#D7192D' : dn ? '#1A1414' : '#fff', color: on || dn ? '#fff' : '#8E8E93', boxShadow: 'inset 0 0 0 1.5px ' + (on ? '#D7192D' : dn ? '#1A1414' : '#D5D5D9'), fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .25s,color .25s,box-shadow .25s' }}>{i + 1}</span>
                    {showLabel ? <span style={{ fontWeight: on ? 900 : 700, fontSize: 15, color: on || dn ? '#1A1414' : '#8E8E93', transition: 'color .25s', whiteSpace: 'nowrap' }}>{label}</span> : null}
                  </button>
                  {i < SECS.length - 1 ? <span aria-hidden="true" style={{ flex: compactSteps ? '1 0 10px' : '1 0 20px', minWidth: compactSteps ? 10 : 20, maxWidth: 64, height: 2, borderRadius: 2, background: dn ? '#1A1414' : '#E3E3E7', transition: 'background .25s' }} /> : null}
                </Fragment>
              );
            })}
          </nav>

          {/* ----- Oven & crust ----- */}
          <section ref={refCrust} style={sectionStyle(true)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 18 }}>
              <h2 style={h2Style}>Oven</h2>
              <div role="radiogroup" aria-label="Oven" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 }}>
                {OVENS.map((o) => {
                  const on = s.bake === o.v;
                  return (
                    <button key={o.v} role="radio" aria-checked={on} onClick={() => set({ bake: o.v })} style={{ position: 'relative', width: '100%', aspectRatio: '16/9', minHeight: 150, minWidth: 0, border: 0, padding: 0, borderRadius: 24, overflow: 'hidden', cursor: 'pointer', background: o.bg, outline: on ? '3px solid #D7192D' : '3px solid transparent', outlineOffset: 3, transition: 'outline-color .15s', fontFamily: 'inherit', color: '#fff', textAlign: 'left' }}>
                      <span aria-hidden="true" style={{ position: 'absolute', right: o.r, bottom: o.b, width: o.w, height: o.h, aspectRatio: o.ar, backgroundImage: "url('" + o.img + "')", backgroundSize: o.fit, backgroundPosition: o.pos, backgroundRepeat: 'no-repeat', transform: 'scale(' + (on ? 1.05 : 1) + ')', transition: 'transform .6s cubic-bezier(.3,.8,.3,1)' }} />
                      <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(18,11,8,0) 35%,rgba(18,11,8,.85) 100%)' }} />
                      <span style={{ position: 'absolute', left: 18, right: 18, bottom: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontWeight: 900, fontSize: w < 400 ? 18 : 'clamp(20px,2.2vw,26px)', lineHeight: 1, letterSpacing: '-.03em' }}>{o.v}</span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#E2D7D1', textWrap: 'pretty' } as CSSProperties}>{o.desc}</span>
                      </span>
                      {on ? <Badge size={30} inset={14} icon={15} iconStroke={3.6} extra={{ boxShadow: '0 4px 12px rgba(0,0,0,.25)', animation: 'pbPop .3s ease both' }} /> : null}
                    </button>
                  );
                })}
              </div>
            </div>
            <SectionHead title="Crust" st={crT} />
            <div style={{ display: 'grid', gridTemplateColumns: crustRows ? 'minmax(0,1fr)' : 'repeat(3,minmax(0,1fr))', gap: crustRows ? 10 : 12 }}>
              {CRUSTS.map(([val, sub, t]) => {
                const on = s.crust === val;
                const disc = (
                  <span style={{ position: 'relative', width: crustRows ? '78%' : '58%', aspectRatio: '1/1', transformStyle: 'preserve-3d', transform: 'rotateX(64deg) rotateZ(-10deg) scale(' + (on ? 1.06 : 1) + ')', transition: 'transform .6s cubic-bezier(.3,.8,.3,1)' }}>
                    {crustLayers(t).map((l, j) => (
                      <span key={j} style={{ position: 'absolute', inset: '3%', borderRadius: '50%', background: l.bg, transform: 'translateZ(' + l.z + ')' }} />
                    ))}
                    <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', backgroundImage: "url('" + BASE_IMG + "')", backgroundSize: 'cover', backgroundPosition: 'center', transform: 'translateZ(0px)' }} />
                  </span>
                );
                const shadow = <span style={{ position: 'absolute', left: '50%', top: '62%', width: '66%', height: '26%', transform: 'translateX(-50%)', borderRadius: '50%', background: 'radial-gradient(closest-side,rgba(60,30,10,.32),rgba(60,30,10,0))' }} />;
                if (crustRows) {
                  return (
                    <button key={val} onClick={() => set({ crust: val })} aria-pressed={on} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14, minHeight: 88, border: 0, padding: '6px 52px 6px 6px', borderRadius: 20, cursor: 'pointer', background: '#F4EFEA', outline: on ? '3px solid #D7192D' : '3px solid transparent', outlineOffset: 2, fontFamily: 'inherit', textAlign: 'left', transition: 'outline-color .15s' }}>
                      <span aria-hidden="true" style={{ position: 'relative', flex: 'none', width: 96, height: 76, display: 'flex', alignItems: 'center', justifyContent: 'center', perspective: 520, isolation: 'isolate', zIndex: 0 }}>
                        {shadow}
                        {disc}
                      </span>
                      <span style={{ display: 'flex', flexDirection: 'column', gap: 3, color: '#1A1414', minWidth: 0 }}>
                        <span style={{ fontWeight: 900, fontSize: 19, lineHeight: 1.05, letterSpacing: '-.03em' }}>{val}</span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#6E6E73' }}>{sub}</span>
                      </span>
                      {on ? <Badge size={28} inset={30} icon={14} iconStroke={3.6} extra={{ top: '50%', right: 16, marginTop: -14, boxShadow: '0 4px 12px rgba(0,0,0,.2)', animation: 'pbPop .3s ease both' }} /> : null}
                    </button>
                  );
                }
                return (
                  <button key={val} onClick={() => set({ crust: val })} aria-pressed={on} style={{ position: 'relative', aspectRatio: '16/11', border: 0, padding: 0, borderRadius: 20, overflow: 'hidden', cursor: 'pointer', background: '#F4EFEA', outline: on ? '3px solid #D7192D' : '3px solid transparent', outlineOffset: 3, transition: 'outline-color .15s', fontFamily: 'inherit', textAlign: 'left' }}>
                    <span aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '72%', display: 'flex', alignItems: 'center', justifyContent: 'center', perspective: 520, isolation: 'isolate', zIndex: 0 }}>
                      {shadow}
                      {disc}
                    </span>
                    <span style={{ position: 'absolute', left: 16, right: 16, bottom: 14, display: 'flex', flexDirection: 'column', gap: 2, color: '#1A1414' }}>
                      <span style={{ fontWeight: 900, fontSize: 'clamp(17px,1.9vw,22px)', lineHeight: 1, letterSpacing: '-.03em' }}>{val}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#6E6E73', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</span>
                    </span>
                    {on ? <Badge size={28} inset={12} icon={14} iconStroke={3.6} extra={{ boxShadow: '0 4px 12px rgba(0,0,0,.2)', animation: 'pbPop .3s ease both' }} /> : null}
                  </button>
                );
              })}
            </div>
          </section>

          {/* ----- Sauce ----- */}
          <section ref={refSauce} style={sectionStyle(false)}>
            <SectionHead title="Base sauce" st={saT} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,150px),1fr))', gap: 12 }}>
              {SAUCES.map(([v, label, f]) => {
                const on = s.sauce === v, t = tile(on);
                return (
                  <Hov as="button" key={v} onClick={() => set({ sauce: v })} aria-pressed={on} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '18px 12px 16px', borderRadius: 20, border: t.border, background: t.bg, cursor: 'pointer', fontFamily: 'inherit', color: '#1A1414', transition: 'background .15s,border-color .15s' }} hover={{ borderColor: '#1A1414' }}>
                    <span style={{ width: 92, height: 92, borderRadius: '50%', background: '#F1F1F4', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span aria-hidden="true" style={photoSpan(sauceImg(f), '100%', 'contain')} />
                    </span>
                    <span style={{ fontSize: 15, fontWeight: 700 }}>{label}</span>
                    {on ? <Badge size={24} inset={12} icon={12} iconStroke={3.6} extra={{ animation: 'pbPop .3s ease both' }} /> : null}
                  </Hov>
                );
              })}
            </div>
          </section>

          {/* ----- Cheese ----- */}
          <section ref={refCheese} style={sectionStyle(false)}>
            <SectionHead title="Cheese" st={chT} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,150px),1fr))', gap: 12 }}>
              {CHEESES.map((v) => {
                const on = s.cheese === v, t = tile(on);
                const [lvl, iw] = CL[v];
                return (
                  <Hov as="button" key={v} onClick={() => set({ cheese: v })} aria-pressed={on} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '18px 12px 16px', borderRadius: 20, border: t.border, background: t.bg, cursor: 'pointer', fontFamily: 'inherit', color: '#1A1414', transition: 'background .15s,border-color .15s' }} hover={{ borderColor: '#1A1414' }}>
                    <span style={{ width: 92, height: 92, borderRadius: '50%', background: '#F1F1F4', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {iw ? (
                        <span aria-hidden="true" style={photoSpan(IMG + 'extra-mozz.png', iw, 'contain', { transition: 'width .3s,height .3s' })} />
                      ) : (
                        <span style={{ width: 56, height: 56, borderRadius: '50%', border: '2px dashed #CFC6BF' }} />
                      )}
                    </span>
                    <span style={{ display: 'flex', gap: 4 }} aria-hidden="true">
                      {[1, 2, 3].map((i) => (
                        <span key={i} style={{ width: 16, height: 4, borderRadius: 2, background: i <= lvl ? (on ? '#D7192D' : '#1A1414') : '#DFDFE2' }} />
                      ))}
                    </span>
                    <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <span style={{ fontSize: 15, fontWeight: 700 }}>{v === 'None' ? 'No cheese' : v}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#636366', minHeight: 17 }}>{v === 'Extra' ? '+' + money(EXTRA_CHEESE) : ''}</span>
                    </span>
                    {on ? <Badge size={24} inset={12} icon={12} iconStroke={3.6} extra={{ animation: 'pbPop .3s ease both' }} /> : null}
                  </Hov>
                );
              })}
            </div>
          </section>

          {/* ----- Toppings ----- */}
          <section ref={refTops} style={sectionStyle(false)}>
            <SectionHead title="Toppings" st={tp} />
            <div role="tablist" className="pb-nav" style={{ display: 'flex', gap: 24, borderBottom: '1px solid #E9E9EC', overflowX: 'auto', scrollbarWidth: 'none' }}>
              {(['Veggie', 'Meat'] as TopCat[]).map((c) => {
                const n = keys.filter((k) => topOf(k).cat === c).length;
                const on = s.cat === c;
                return (
                  <button key={c} onClick={() => set({ cat: c })} role="tab" aria-selected={on} style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 8, border: 0, background: 'transparent', padding: '10px 0 12px', fontWeight: 700, fontSize: 15, color: on ? '#1A1414' : '#818184', boxShadow: 'inset 0 -2.5px 0 ' + (on ? '#1A1414' : 'transparent'), cursor: 'pointer', whiteSpace: 'nowrap', transition: 'color .15s' }}>
                    {c}
                    {n > 0 ? (
                      <span style={{ minWidth: 20, height: 20, padding: '0 6px', borderRadius: 999, background: '#D7192D', color: '#fff', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{n}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,156px),1fr))', gap: 12 }}>
              {TOPS.filter((t) => t.cat === s.cat).map((t) => {
                const on = !!s.tops[t.id];
                const free = on ? cumOf[t.id] <= included : used + t.wt <= included;
                const tl = tile(on);
                const priceText = free ? (t.wt > 1 ? 'Included · counts as 2' : 'Included') : '+' + money(TOP_PRICE[s.size] * (on ? Math.min(t.wt, cumOf[t.id] - included) : t.wt));
                return (
                  <div key={t.id} style={{ position: 'relative', display: 'flex', flexDirection: 'column', borderRadius: 20, border: tl.border, background: tl.bg, transition: 'background .15s,border-color .15s', animation: 'pbRise .25s ease both' }}>
                    <button onClick={() => toggleTop(t.id)} aria-pressed={on} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, border: 0, background: 'transparent', padding: '18px 10px 8px', cursor: 'pointer', fontFamily: 'inherit', color: '#1A1414' }}>
                      <span style={{ width: 96, height: 96, borderRadius: '50%', background: '#F1F1F4', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'scale(' + (on ? 1.06 : 1) + ')', transition: 'transform .3s cubic-bezier(.3,.8,.3,1)' }}>
                        {t.img ? (
                          <span aria-hidden="true" style={photoSpan(t.img, t.iw, t.fit)} />
                        ) : (
                          <span style={{ fontWeight: 900, fontSize: 26, color: '#B8ACA4', letterSpacing: '-.03em' }}>{t.initials}</span>
                        )}
                      </span>
                      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, textAlign: 'center' }}>
                        <span style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.25 }}>{t.name}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: free ? '#12663A' : '#636366' }}>{priceText}</span>
                      </span>
                    </button>
                    <div style={{ height: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 10px 12px' }}>
                      {on ? (
                        <div role="group" aria-label="Placement" style={{ display: 'flex', background: '#fff', border: '1px solid #DFDFE2', borderRadius: 999, padding: 3, gap: 2, animation: 'pbRise .2s ease both' }}>
                          {HV.map(([k, label, path]) => {
                            const a = s.tops[t.id] === k;
                            return (
                              <button key={k} onClick={() => set((p) => ({ tops: { ...p.tops, [t.id]: k } }))} title={label} aria-label={label} aria-pressed={a} style={{ width: 40, height: 40, border: 0, borderRadius: 999, background: a ? '#D7192D' : 'transparent', color: a ? '#fff' : '#818184', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .15s' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="2" /><path d={path} fill="currentColor" /></svg>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <Hov as="button" onClick={() => toggleTop(t.id)} tabIndex={-1} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 40, padding: '0 16px', borderRadius: 999, border: '1.5px solid #DFDFE2', background: '#fff', fontWeight: 700, fontSize: 13, color: '#1A1414', cursor: 'pointer' }} hover={{ borderColor: '#1A1414' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                          Add
                        </Hov>
                      )}
                    </div>
                    {on ? <Badge size={24} inset={12} icon={12} iconStroke={3.6} extra={{ animation: 'pbPop .3s ease both', pointerEvents: 'none' }} /> : null}
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 10 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>Seasonings</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#12663A' }}>No charge</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(104px,1fr))', gap: 10 }}>
                {FREE.map((f) => {
                  const on = !!s.free[f], t = tile(on);
                  const img = FREE_IMG[f] ? IMG + FREE_IMG[f] : null;
                  return (
                    <Hov as="button" key={f} onClick={() => set((p) => ({ free: { ...p.free, [f]: !p.free[f] } }))} aria-pressed={on} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '14px 8px 12px', borderRadius: 18, border: t.border, background: t.bg, cursor: 'pointer', color: '#1A1414', transition: 'background .15s,border-color .15s' }} hover={{ borderColor: '#1A1414' }}>
                      <span style={{ width: 60, height: 60, borderRadius: '50%', background: '#F1F1F4', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {img ? (
                          <span aria-hidden="true" style={photoSpan(img, '80%', 'contain')} />
                        ) : (
                          <span style={{ fontWeight: 900, fontSize: 18, color: '#B8ACA4' }}>{f.split(' ').map((x) => x[0]).join('').toUpperCase()}</span>
                        )}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700, textAlign: 'center', lineHeight: 1.2 }}>{f}</span>
                      {on ? <Badge size={20} inset={8} icon={10} iconStroke={4} /> : null}
                    </Hov>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ----- Instructions ----- */}
          <section ref={refNotes} style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '20px 0 24px', borderTop: '1px solid #E9E9EC' }}>
            <h2 style={h2Style}>Instructions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span style={{ fontSize: 15, fontWeight: 800 }}>Spice level</span>
              <div role="radiogroup" aria-label="Spice level" style={{ display: 'grid', gridTemplateColumns: w < 520 ? 'repeat(2,minmax(0,1fr))' : 'repeat(4,minmax(0,1fr))', gap: 10 }}>
                {SPICES.map((v, i) => {
                  const on = s.spice === v;
                  return (
                    <Hov as="button" key={v} role="radio" aria-checked={on} onClick={() => set({ spice: v })} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 54, padding: '0 10px', borderRadius: 16, border: on ? '2px solid #1A1414' : '1px solid #E6E6EA', background: '#fff', cursor: 'pointer', color: '#1A1414', fontFamily: 'inherit', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', transition: 'border-color .15s' }} hover={{ borderColor: '#1A1414' }}>
                      <span aria-hidden="true" style={{ display: 'flex', gap: 3 }}>
                        {[0, 1, 2].map((d) => <span key={d} style={{ width: 6, height: 6, borderRadius: '50%', background: d < i ? '#D7192D' : '#E3E3E7' }} />)}
                      </span>
                      {v}
                    </Hov>
                  );
                })}
              </div>
            </div>
            {CHIP_GROUPS.map(([key, label, opts]) => (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <span style={{ fontSize: 15, fontWeight: 800 }}>{label}</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10 }}>
                  {opts.map((v) => {
                    const on = s[key] === v, t = tile(on);
                    const cuts = '';
                    return (
                      <Hov as="button" key={v} onClick={() => set({ doneness: v })} aria-pressed={on} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '18px 8px 14px', borderRadius: 18, border: t.border, background: t.bg, cursor: 'pointer', color: '#1A1414', transition: 'background .15s,border-color .15s' }} hover={{ borderColor: '#1A1414' }}>
                        <span style={{ position: 'relative', width: 76, height: 76, display: 'block' }}>
                          <img src={BASE_IMG} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: key === 'doneness' ? DONENESS_FILTER[v] : 'none', transition: 'filter .2s' }} />
                          <svg width="76" height="76" viewBox="0 0 76 76" style={{ position: 'absolute', inset: 0 }}>
                            <path d={cuts} stroke="rgba(70,35,10,.55)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
                            <path d={cuts} stroke="rgba(255,240,215,.55)" strokeWidth=".7" fill="none" strokeLinecap="round" transform="translate(.6,.6)" />
                          </svg>
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 700 }}>{v}</span>
                        {on ? <Badge size={20} inset={8} icon={10} iconStroke={4} /> : null}
                      </Hov>
                    );
                  })}
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: '#F4F4F7', borderRadius: 20, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ fontSize: 15, fontWeight: 800 }}>Note for the kitchen</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#818184' }}>{s.notes.length}/140</span>
              </div>
              <textarea
                value={s.notes}
                onChange={(e) => set({ notes: e.target.value })}
                onFocus={() => setNoteFocus(true)}
                onBlur={() => setNoteFocus(false)}
                rows={3}
                maxLength={140}
                placeholder="Allergies or special requests"
                aria-label="Note for the kitchen"
                style={{ border: 0, borderRadius: 14, padding: '14px 16px', minHeight: 96, background: '#fff', fontFamily: 'inherit', fontSize: 15, lineHeight: 1.5, resize: 'vertical', outline: 'none', color: '#1A1414', boxShadow: noteFocus ? 'inset 0 0 0 2px #1A1414' : 'inset 0 0 0 1.5px #E6E6E9' }}
              />
            </div>
          </section>
        </div>

        {wide ? (
          <aside style={{ position: 'sticky', top: 88, display: 'flex', flexDirection: 'column', gap: 18, paddingTop: 24 }}>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1' }}>
              <div style={{ position: 'absolute', inset: '4%', ...pizzaBox }}>{layers(name)}</div>
            </div>
            {keys.length > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <div style={{ display: 'flex' }}>
                  {picked.map((p) => (
                    <span key={p.id} title={p.name} style={{ position: 'relative', width: 38, height: 38, marginLeft: -8, borderRadius: '50%', border: '2.5px solid #fff', background: '#F1F1F4', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(26,20,20,.12)', animation: 'pbPop .3s ease both' }}>
                      <span role="img" aria-label={p.name} style={photoSpan(p.img, p.iw, p.fit)} />
                    </span>
                  ))}
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#636366' }}>{pickedText}</span>
              </div>
            ) : null}
            <span style={{ fontSize: 14, lineHeight: 1.5, color: '#636366', textAlign: 'center', minHeight: 42 }}>{ingredientLine}</span>
            <div style={{ display: 'grid', gridTemplateColumns: sizeCols, border: '1px solid #E3E3E6', borderRadius: 18, overflow: 'hidden', background: '#fff' }}>
              {sizes.map((o) => (
                <button key={o.k} onClick={() => set({ size: o.k })} aria-pressed={o.on} style={{ border: 0, borderLeft: o.divider, background: o.bg, boxShadow: 'none', padding: '14px 4px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#1A1414', transition: 'background .15s' }}>
                  <span style={{ height: 40, display: 'flex', alignItems: 'center' }}>
                    <svg width={o.px} height={o.px} viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="19" fill={o.fill} /><path d={o.cuts} stroke="#fff" strokeWidth="1.6" strokeLinecap="round" /></svg>
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{o.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#636366' }}>{o.slicesText}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#636366' }}>{o.price}</span>
                </button>
              ))}
            </div>
            {showQtyRow ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                {combo && hasExtra ? <span style={{ fontSize: 15, fontWeight: 700, color: '#636366' }}>Extra charge</span> : null}
                {!combo ? (
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #E3E3E6', borderRadius: 999, height: 48, padding: '0 4px' }}>
                    {stepper('Decrease quantity', dec, '−')}
                    <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 800, fontSize: 17 }}>{s.qty}</span>
                    {stepper('Increase quantity', inc, '+')}
                  </div>
                ) : null}
                <span style={{ fontWeight: 900, fontSize: 32, letterSpacing: '-.03em' }}>{totalText}</span>
              </div>
            ) : null}
            <Hov as="button" onClick={add} style={{ height: 58, border: 0, borderRadius: 16, background: '#D7192D', color: '#fff', fontWeight: 900, fontSize: 16, cursor: 'pointer', transition: 'background .15s', letterSpacing: '-.03em' }} hover={{ background: '#B5121F' }}>
              {addText}
            </Hov>
            {hasExtras ? <span style={{ fontSize: 13, color: '#636366', textAlign: 'center' }}>{extrasLine}</span> : null}
          </aside>
        ) : null}
      </div>

      {!wide ? (
        <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 30, background: '#fff', borderTop: '1px solid #E9E9EC', padding: '12px 16px 16px', display: 'flex', flexDirection: 'column', gap: 10, boxShadow: '0 -10px 30px rgba(26,20,20,.08)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: sizeCols, gap: 6 }}>
            {sizes.map((o) => (
              <button key={o.k} onClick={() => set({ size: o.k })} aria-pressed={o.on} aria-label={o.label + ', ' + o.slicesText} style={{ border: '1.5px solid ' + o.mBorder, background: o.on ? '#FFF1F2' : '#fff', borderRadius: 12, height: 48, padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, fontFamily: 'inherit', cursor: 'pointer', color: '#1A1414' }}>
                <span style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.1 }}>{o.short}</span>
                <span style={{ fontSize: 11, fontWeight: 600, lineHeight: 1.1, color: '#636366', whiteSpace: 'nowrap' }}>{o.slicesText}</span>
              </button>
            ))}
          </div>
          <button onClick={add} style={{ height: 54, border: 0, borderRadius: 14, background: '#D7192D', color: '#fff', fontWeight: 900, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', letterSpacing: '-.03em' }}>
            <span>{addText}</span>
            <span>{mobileTotal}</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
