// Port of design_handoff_pizza_king_website/prototype/MenuPage.dc.html
// Full menu with a sticky section bar (scroll-spy), walk-in specials with composed pizza scenes,
// and the photo-card grid for every other section. Renders inside the homepage shell.
import { useCallback, useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import type { BuilderItem, CategoryId, MenuPageProps, NewLine } from '../lib/types';
import { Hov, Photo } from '../lib/ui';
import { useEscape, useWidth } from '../lib/hooks';
import { PIZZA_PHOTOS, pricesFor, SIZE_PRICES, U } from '../lib/catalog';
import { CAT_MENU, COMBOS, MENU_SECTIONS, PIZZAS as PIZZA_DATA, SPICES, mustPrice, type LineSpec, type PastaBaseId, type PastaSauceId, type MenuOpt, type MenuRow, type MenuSection } from '../lib/pricing';
import { money } from '../lib/format';
import PizzaBuilder from './PizzaBuilder';
import MenuOptionsSheet, { type SheetTarget } from './MenuOptionsSheet';
import './MenuPage.css';

// ---------- Data (the prototype's const arrays are the spec) ----------

const PIZZA_IMG = U(PIZZA_PHOTOS.byo, 1000);
/** Menu tile photo (prototype uses q=70, w=600 here, unlike the shared U()). */
const UI = (id: string) => 'https://images.unsplash.com/photo-' + id + '?fm=jpg&q=70&w=600&auto=format&fit=crop';
/** Pizza photos come from the shared PIZZA_PHOTOS list (same photo on every page). */
const PIZZA_PHOTO = PIZZA_PHOTOS;
/**
 * Row photos. The prototype also maps `lassi` to assets/menu/juice.jpg (the mixed-juice photo);
 * that is dropped here because the README lists lassi as an item with no real photo
 * ("leave an empty image box rather than a misleading picture").
 */
const ROW_PIC: Record<string, string> = {
  sugarcane: 'assets/menu/sugarcane.webp',
  'fruit-juice': 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?fm=jpg&q=70&w=600&auto=format&fit=crop',
  espresso: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?fm=jpg&q=70&w=600&auto=format&fit=crop',
  hot: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?fm=jpg&q=70&w=600&auto=format&fit=crop',
  beer: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?fm=jpg&q=70&w=600&auto=format&fit=crop',
  shake: 'assets/menu/mango-shake.webp',
  momos: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?fm=jpg&q=70&w=600&auto=format&fit=crop',
  chaat: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?fm=jpg&q=70&w=600&auto=format&fit=crop',
  sub: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?fm=jpg&q=70&w=600&auto=format&fit=crop',
  'nv-salad': 'assets/menu/chicken-salad.webp',
  'v-salad': 'assets/menu/garden-salad.webp',
  wedges: 'https://images.unsplash.com/photo-1623238913973-21e45cced554?fm=jpg&q=70&w=600&auto=format&fit=crop',
  leg: 'https://images.unsplash.com/photo-1617692855027-33b14f061079?fm=jpg&q=70&w=600&auto=format&fit=crop',
  'dip-garlic': 'assets/dips/menu-garlic.png',
  'dip-ranch': 'assets/dips/menu-ranch.png',
  'dip-chipotle': 'assets/dips/menu-chipotle.png',
  'dip-jalapeno': 'assets/dips/menu-jalapeno-cheddar.png',
  'dip-marinara': 'assets/dips/menu-marinara.png',
  wings: 'assets/ingredients/tandoori-chicken.png',
  'pasta-rose': 'assets/menu/pasta-rose.png',
  'pasta-alfredo': 'assets/menu/pasta-alfredo.png',
  'veg-pasta-rose': 'assets/menu/pasta-rose.png',
  'veg-pasta-alfredo': 'assets/menu/pasta-alfredo.png',
  'ch-pasta-rose': 'assets/menu/pasta-rose.png',
  'ch-pasta-alfredo': 'assets/menu/pasta-alfredo.png',
  'veg-pasta-tomato': 'https://images.unsplash.com/photo-1598866594230-a7c12756260f?fm=jpg&q=70&w=600&auto=format&fit=crop',
  'ch-pasta-tomato': 'https://images.unsplash.com/photo-1598866594230-a7c12756260f?fm=jpg&q=70&w=600&auto=format&fit=crop',
  cone: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?fm=jpg&q=70&w=600&auto=format&fit=crop',
  cup: 'assets/menu/gelato-cup.webp',
  corn: 'assets/menu/sweet-corn.webp',
};

/** Per-section colours used by the photo-card grid (the prototype's unused list-row fields are omitted). */
interface Theme { accent: string; btnBg: string; btnFg: string }
const THEME: Record<string, Theme> = {
  pizzas: { accent: '#D7192D', btnBg: '#D7192D', btnFg: '#fff' },
  tandoori: { accent: '#C2511F', btnBg: '#D7192D', btnFg: '#fff' },
  sides: { accent: '#6E8B3D', btnBg: '#1A1414', btnFg: '#fff' },
  dips: { accent: '#D7192D', btnBg: '#1A1414', btnFg: '#fff' },
  pasta: { accent: '#E0A526', btnBg: '#1A1414', btnFg: '#fff' },
  gelato: { accent: '#E46A92', btnBg: '#C2335F', btnFg: '#fff' },
  drinks: { accent: '#1E6E6A', btnBg: '#1E6E6A', btnFg: '#fff' },
};

// ---------- Walk-in scenes: base pizza + scattered topping cut-outs, Coke cans, dip cups ----------

const PZ = (n: string) => 'assets/toppings/pz/' + n + '.png';
/** [cut-out variants, width % of pizza, piece count] */
type Recipe = [string[], number, number][];
const RECIPES: Record<string, Recipe> = {
  pep: [[['pep-0', 'pep-1'], 14, 11]],
  veg: [[['mushroom-0', 'mushroom-1'], 16, 5], [['gp-0', 'gp-1', 'gp-2', 'gp-3'], 16, 5], [['onion-0', 'onion-1'], 15, 4], [['bol-0'], 8.5, 6]],
  meat: [[['pep-0', 'pep-1'], 14, 6], [['bacon-0'], 17, 3], [['isaus-0'], 11, 5], [['gp-0', 'gp-2'], 15, 3]],
  tand: [[['tand-0', 'tand-1'], 15, 5], [['rp-0', 'rp-1'], 15, 4], [['onion-0', 'onion-1'], 15, 4], [['jal-0'], 9.5, 4]],
  // Per-pizza recipes from the prototype (not used by the walk-in scenes, kept with the data).
  byo: [],
  napoli: [[['anch-0'], 14, 5], [['gol-0'], 8.5, 7]],
  'four-seasons': [[['ham-0'], 15, 4], [['mushroom-0', 'mushroom-1'], 15, 5], [['bol-0'], 8.5, 6]],
  'italian-veg': [[['zuc-0'], 15, 4], [['rp-0', 'rp-1'], 15, 4], [['egg-0'], 15, 3], [['onion-0', 'onion-1'], 15, 4]],
  'non-veg': [[['grilled-0', 'grilled-1'], 16, 3], [['isaus-0'], 11, 4], [['pep-0', 'pep-1'], 14, 4], [['ham-0'], 15, 2]],
  bismark: [[['sund-0'], 13, 5], [['grilled-0', 'grilled-1'], 16, 3], [['isaus-0'], 11, 4]],
  'sea-food': [[['shrimp-0'], 15, 6], [['anch-0'], 14, 3]],
  'chicken-shawarma': [[['shaw-0'], 16, 5], [['hotp-0'], 10, 5], [['onion-0', 'onion-1'], 15, 4]],
  'butter-chicken': [[['butter-0', 'butter-1', 'butter-2'], 13, 6], [['gp-0', 'gp-1', 'gp-2', 'gp-3'], 15, 4], [['onion-0', 'onion-1'], 15, 4]],
  'shahi-paneer': [[['shahi-0', 'shahi-1', 'shahi-2'], 11, 6], [['gp-0', 'gp-1', 'gp-2'], 15, 3], [['onion-0', 'onion-1'], 15, 3], [['jal-0'], 9.5, 4]],
  greek: [[['paneer-0', 'paneer-1', 'paneer-2', 'paneer-3'], 10, 6], [['bol-0'], 8.5, 6], [['tomato-0'], 16, 4]],
  hawaiian: [[['pine-0'], 13, 6], [['bacon-0'], 17, 3], [['ham-0'], 15, 3]],
  'meat-lover': [[['pep-0', 'pep-1'], 14, 5], [['ham-0'], 15, 2], [['bacon-0'], 17, 2], [['isaus-0'], 11, 4]],
  canadian: [[['pep-0', 'pep-1'], 14, 6], [['mushroom-0', 'mushroom-1'], 15, 5], [['bacon-0'], 17, 3]],
  'tandoori-fish': [[['tand-0', 'tand-1'], 14, 5], [['mushroom-0', 'mushroom-1'], 15, 4], [['onion-0', 'onion-1'], 15, 3], [['gp-0', 'gp-2'], 15, 3]],
};

interface Piece { src: string; x: string; y: string; w: string; r: string; fx: number }
interface Layer { src: string; ar: string; l: string; t: string; w: string; z: number; r: string; f: string; tops: Piece[] }

/** Deterministic (seeded) scatter of topping pieces over the pizza, spaced so they don't pile up. */
const scatter = (recipe: Recipe, seed: number): Piece[] => {
  let a = seed * 9973 + 7;
  const rnd = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const pts: [number, number, number][] = [];
  const out: Piece[] = [];
  recipe.forEach(([srcs, w, n]) => {
    for (let k = 0; k < n; k++) {
      let best: [number, number] = [0.5, 0.5];
      let bd = -1;
      for (let tries = 0; tries < 40; tries++) {
        const ang = rnd() * Math.PI * 2;
        const rad = Math.sqrt(rnd()) * 0.33;
        const x = 0.5 + Math.cos(ang) * rad;
        const y = 0.5 + Math.sin(ang) * rad;
        const d = pts.reduce((m, p) => Math.min(m, Math.hypot(p[0] - x, p[1] - y) - (p[2] + w / 100) / 2), 9);
        if (d > bd) { bd = d; best = [x, y]; }
        if (d > 0.015) break;
      }
      pts.push([best[0], best[1], w / 100]);
      out.push({
        src: PZ(srcs[k % srcs.length]),
        x: (best[0] * 100).toFixed(1) + '%',
        y: (best[1] * 100).toFixed(1) + '%',
        w: (w * (0.9 + rnd() * 0.2)).toFixed(1) + '%',
        r: Math.round(rnd() * 360) + 'deg',
        fx: rnd() > 0.5 ? -1 : 1,
      });
    }
  });
  return out;
};

const SH = 'drop-shadow(0 14px 18px rgba(0,0,0,.5))';
const SH2 = 'drop-shadow(0 8px 10px rgba(0,0,0,.45))';
const pizza = (cx: number, cy: number, w: number, recipe: string, seed: number, z?: number): Layer => ({
  src: 'assets/pizza-base.webp', ar: '1/1', l: cx + '%', t: cy + '%', w: w + '%', z: z || 1,
  r: ((seed * 37) % 40) + 'deg', f: SH, tops: scatter(RECIPES[recipe], seed),
});
const prop = (src: string, cx: number, cy: number, w: number, r?: number, z?: number): Layer => ({
  src, ar: /coke/.test(src) ? '174/330' : /dips/.test(src) ? '600/470' : '1/1',
  l: cx + '%', t: cy + '%', w: w + '%', z: z || 5, r: (r || 0) + 'deg', f: SH2, tops: [],
});
const CAN = 'assets/combo/coke.png';
const DIP = (n: string) => 'assets/dips/' + n + '.png';
const comboScene = (w: number, sauces: [string, string], pops: boolean, seed: number, recipes: [string, string]): Layer[] => [
  pizza(33, 44, w, recipes[0], seed, 1),
  pizza(63, 57, w, recipes[1], seed + 3, 2),
  ...(pops ? [prop(CAN, 82, 52, 8.5, -6, 4), prop(CAN, 90.5, 57, 8.5, 5, 5)] : []),
  prop(DIP(sauces[0]), pops ? 76 : 84, 84, 13, -4, 6),
  prop(DIP(sauces[1]), pops ? 91 : 88, pops ? 87 : 66, 13, 5, pops ? 7 : 5),
];
const SCENES: Layer[][] = [
  // The prototype builds this scene with a garlic dip and then slices it off: a single pizza only.
  [pizza(50, 50, 56, 'pep', 2)],
  comboScene(50, ['garlic', 'marinara'], true, 5, ['pep', 'veg']),
  comboScene(43, ['ranch', 'chipotle'], true, 8, ['meat', 'tand']),
  comboScene(36, ['jalapeno-cheddar', 'garlic'], false, 11, ['veg', 'pep']),
];
const SCENE_ALT = ['One large pepperoni pizza', 'Two large pizzas with two dips and two pops', 'Two medium pizzas with two dips and two pops', 'Two small pizzas with two dips'];

/** [key, name, price, description, combo-builder deal id] */
const WALKINS: [string, string, number, string, string][] = ([
  ['walkin-1l', '1 large pizza with 1 topping, wood-fired or conventional oven', 'one-large'],
  ['walkin-2l', '2 large pizzas with 4 toppings each (meat counts as 2), 2 dips, 2 pops, plus sugarcane juice or wood-oven corn', 'two-large'],
  ['walkin-2m', '2 medium pizzas with 4 toppings each (meat counts as 2), 2 dips, 2 pops, plus sugarcane juice or wood-oven corn', 'two-medium'],
  ['walkin-2s', '2 small pizzas with 4 toppings each (meat counts as 2) and 2 dips', 'two-small'],
] as const).map(([key, desc, deal]) => [key, COMBOS[deal].name, COMBOS[deal].price, desc, deal]);

/** [id, name, description, builder topping ids, vegetarian]. Toppings come from the shared pricing data. */
const PIZZA_ROWS: [string, string, string, string[], boolean?][] = [
  ['napoli', 'Napoli', 'Anchovies, capers, green olives, oregano', []],
  ['four-seasons', 'Four Seasons', 'Ham, mushrooms, artichokes, black olives', []],
  ['italian-veg', 'Italian Vegetarian', 'Grilled zucchini, red peppers, eggplant, red onions', [], true],
  ['non-veg', 'Non-Vegetarian', 'Grilled chicken, sausage, hot salami, ham', []],
  ['bismark', 'Bismark', 'Sun-dried tomatoes, grilled chicken, sausage', []],
  ['sea-food', 'Sea Food', 'Shrimp, gambari, calamari, salmon', []],
  ['chicken-shawarma', 'Shawarma Chicken', 'Garlic base, shawarma chicken, hot peppers, red onions', []],
  ['butter-chicken', 'Butter Chicken', 'Tandoori chicken, green peppers, red onions', []],
  ['shahi-paneer', 'Shahi Paneer', 'Tandoori paneer, green peppers, red onions, jalapeños', [], true],
  ['greek', 'Greek', 'Feta, black olives, tomatoes', [], true],
  ['hawaiian', 'Hawaiian', 'Pineapple, bacon, ham', []],
  ['meat-lover', 'Meat Lover', 'Pepperoni, ham, bacon, sausage', []],
  ['canadian', 'Canadian', 'Pepperoni, mushrooms, bacon', []],
  ['tandoori-fish', 'Tandoori Fish', 'Tandoori fish, mushrooms, red onions, green peppers', []],
  ['pepperoni', 'Pepperoni', 'Pepperoni and mozzarella', []],
];
const PIZZAS = PIZZA_ROWS.map(([id, name, desc, , veg]): [string, string, string, string[], boolean?] => [id, name, desc, PIZZA_DATA[id].tops, veg]);

type Opt = MenuOpt;
type Row = MenuRow;
type Section = MenuSection;
// Menu rows and prices come from the shared pricing module (Square is the source of truth).
const SECTIONS: Section[] = MENU_SECTIONS;
const NAV: [string, string][] = [['walkin', 'Pickup combos'], ['pizzas', 'Pizzas'], ...SECTIONS.map((s): [string, string] => [s.id, s.title])];

/** Scroll-spy: a section becomes active once its top reaches 140px from the viewport top. */
const SPY_LINE = 140;
/** Nav click scrolls the section to 128px below the viewport top (shell header 68 + section bar). */
const SCROLL_OFFSET = 128;

// ---------- View models ----------

interface Tile {
  key: string;
  img: string;
  name: string;
  desc: string;
  veg: boolean;
  priceText: string;
  cta: string;
  act: () => void;
}
/** Menu rows that are the same item as a category-page item (so they get the same options): row key → [category, item id]. */
const CAT_TWIN: Record<string, [CategoryId, string]> = {
  wings: ['wings', 'wings'], leg: ['wings', 'leg'], fish: ['wings', 'fish'], wedges: ['wings', 'wedges'], 'garlic-bread': ['wings', 'garlic-bread'],
  sub: ['wings', 'sub'], 'nv-salad': ['wings', 'nv-salad'], 'v-salad': ['wings', 'v-salad'], corn: ['wings', 'corn'], chaat: ['wings', 'chaat'],
  'fruit-juice': ['juice', 'fresh'], sugarcane: ['juice', 'sugarcane'], lemonade: ['juice', 'lemonade'], coconut: ['juice', 'coconut'], lassi: ['juice', 'lassi'],
  espresso: ['juice', 'espresso'], hot: ['juice', 'hot'], pop: ['juice', 'pop'], water: ['juice', 'water'], beer: ['juice', 'beer'],
  cone: ['gelato', 'cone'], cup: ['gelato', 'cup'], shake: ['gelato', 'shake'],
};
/** Pasta rows → [base, sauce] for the pasta options (spice, extras, leave out). */
const PASTA_ROW: Record<string, [PastaBaseId, PastaSauceId]> = {
  'pasta-rose': ['classic', 'rose'], 'pasta-alfredo': ['classic', 'alfredo'],
  'veg-pasta-rose': ['veggie', 'rose'], 'veg-pasta-tomato': ['veggie', 'tomato'], 'veg-pasta-alfredo': ['veggie', 'alfredo'],
  'ch-pasta-rose': ['chicken', 'rose'], 'ch-pasta-tomato': ['chicken', 'tomato'], 'ch-pasta-alfredo': ['chicken', 'alfredo'],
};

interface Picker { name: string; spicy?: boolean; opts: { label: string; priceText: string; add: (spice?: string) => void }[] }

const VegMark = () => (
  <span title="Vegetarian" style={{ width: 15, height: 15, border: '1.5px solid #12663A', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', background: '#fff' }}>
    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#12663A' }} />
  </span>
);

const bgImg = (src: string): CSSProperties => ({
  display: 'block',
  flex: 'none',
  backgroundImage: "url('" + src + "')",
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
});

export default function MenuPage({ onAdd, onDeal }: MenuPageProps) {
  const w = useWidth();
  const [active, setActive] = useState<string>(NAV[0][0]);
  const [builder, setBuilder] = useState<BuilderItem | null>(null);
  const [picker, setPickerState] = useState<Picker | null>(null);
  const [sheet, setSheet] = useState<SheetTarget | null>(null);
  const [spice, setSpice] = useState(SPICES[0]);
  const setPicker = (p: Picker | null) => { setSpice(SPICES[0]); setPickerState(p); };

  useEffect(() => {
    const onScroll = () => {
      let cur = NAV[0][0];
      for (const [id] of NAV) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= SPY_LINE) cur = id;
      }
      // At the very bottom the last short section never reaches the line: count it once you hit the end.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) cur = NAV[NAV.length - 1][0];
      setActive(cur);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Keep the highlighted section tab in view: slide the bar sideways so it sits near the middle.
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const bar = barRef.current;
    const tab = bar?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!bar || !tab || bar.scrollWidth <= bar.clientWidth) return;
    const target = tab.offsetLeft - (bar.clientWidth - tab.offsetWidth) / 2;
    bar.scrollTo({ left: Math.max(0, Math.min(target, bar.scrollWidth - bar.clientWidth)), behavior: 'smooth' });
  }, [active]);

  const closePicker = useCallback(() => setPickerState(null), []);
  useEscape(!!picker, closePicker);
  const closeSheet = useCallback(() => setSheet(null), []);
  useEscape(!!sheet, closeSheet);

  const go = (id: string, e?: MouseEvent) => {
    if (e) e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET, behavior: 'smooth' });
    setActive(id);
  };

  const add = (line: NewLine, qty?: number) => {
    setPicker(null);
    onAdd(line, qty || 1);
  };

  // ----- renderVals -----
  const ph = w < 600; // phone: two-column compact cards
  const walkCols = w >= 1040 ? 'repeat(4,minmax(0,1fr))' : 'repeat(2,minmax(0,1fr))';
  const clamp2 = { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as const;

  const byo: BuilderItem = { id: 'byo', name: 'Build Your Own', tops: [], included: 4, img: PIZZA_IMG };
  const pizzaRows: Tile[] = [
    { key: 'byo', img: UI(PIZZA_PHOTOS.byo), name: 'Build Your Own', desc: '4 toppings included (meat counts as 2)', veg: false, priceText: 'From ' + money(SIZE_PRICES.S), cta: 'Customize', act: () => setBuilder(byo) },
    ...PIZZAS.map(([id, name, desc, tops, veg], i): Tile => {
      const photo = PIZZA_PHOTO[id];
      return {
        key: id,
        img: photo ? (photo.indexOf('assets/') === 0 ? photo : UI(photo)) : '',
        name,
        desc,
        veg: !!veg,
        priceText: 'From ' + money(pricesFor(id).S),
        cta: 'Customize',
        act: () => setBuilder({ id, name, desc, tops, img: PIZZA_IMG, prices: pricesFor(id) }),
      };
    }),
  ];

  const rowsOf = (sec: Section): Tile[] =>
    sec.rows.map(([key, name, desc, opts, spicy]) => {
      const lineOf = ([label]: Opt, spice?: string): NewLine => {
        const spec: LineSpec = { k: 'menu', id: key, opt: label, ...(spice ? { spice } : {}) };
        const q = mustPrice(spec);
        return { key: key + (label ? '-' + label : '') + (spice ? '-' + spice : ''), name: q.name, summary: q.summary, unit: q.unit, spec };
      };
      const multi = opts.length > 1 || !!spicy;
      const min = Math.min(...opts.map((o) => o[1]));
      // Items with their own options (flavour, sauce, sugar, ice, pasta extras...) open the same choices as their own page.
      const twin = CAT_TWIN[key];
      const pasta = PASTA_ROW[key];
      const twinItem = twin ? CAT_MENU[twin[0]].items.find((x) => x.id === twin[1]) : undefined;
      if (twin && twinItem) {
        const hasOpts = !!twinItem.groups?.length;
        return {
          key, img: ROW_PIC[key] || '', name, desc, veg: false,
          priceText: (hasOpts && multi ? 'From ' : '') + money(min),
          cta: hasOpts ? 'Choose' : 'Add',
          act: hasOpts
            ? () => setSheet({ kind: 'cat', cat: twin[0], id: twin[1] })
            : () => { const spec: LineSpec = { k: 'cat', cat: twin[0], id: twin[1], opts: {} }; const q = mustPrice(spec); add({ key: twin[1], name: q.name, summary: q.summary, unit: q.unit, spec }); },
        };
      }
      if (pasta) {
        return { key, img: ROW_PIC[key] || '', name, desc, veg: false, priceText: 'From ' + money(min), cta: 'Choose', act: () => setSheet({ kind: 'pasta', name, base: pasta[0], sauce: pasta[1] }) };
      }
      return {
        key,
        img: ROW_PIC[key] || '',
        name,
        desc,
        veg: false,
        priceText: (multi ? 'From ' : '') + money(min),
        cta: multi ? 'Choose' : 'Add',
        act: multi
          ? () => setPicker({ name, spicy: !!spicy, opts: opts.map((o) => ({ label: o[0] || 'Add to order', priceText: money(o[1]), add: (spice?: string) => add(lineOf(o, spice)) })) })
          : () => add(lineOf(opts[0])),
      };
    });

  const sections = [{ id: 'pizzas', title: 'Pizzas', rows: pizzaRows }, ...SECTIONS.map((sec) => ({ id: sec.id, title: sec.title, rows: rowsOf(sec) }))].map(
    (x) => ({ ...x, theme: THEME[x.id] }),
  );

  return (
    <div style={{ fontFamily: "'Figtree',system-ui,sans-serif", color: '#1A1414', background: '#fff', minHeight: '100vh' }}>
      {/* Sticky section bar, directly under the shell header (68px). z-index 60 keeps it above every price tag. */}
      <div style={{ position: 'sticky', top: 68, zIndex: 60, background: 'rgba(255,255,255,.96)', backdropFilter: 'saturate(1.6) blur(16px)', WebkitBackdropFilter: 'saturate(1.6) blur(16px)' }}>
        <nav aria-label="Menu sections" style={{ borderBottom: '1px solid #E9E9EC' }}>
          <div ref={barRef} style={{ position: 'relative', maxWidth: 1200, margin: '0 auto', padding: '0 clamp(16px,3vw,32px)', display: 'flex', gap: 28, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {NAV.map(([id, label]) => {
              const on = active === id;
              return (
                <a
                  key={id}
                  href={'#' + id}
                  onClick={(e) => go(id, e)}
                  aria-current={on ? 'true' : undefined}
                  style={{ flex: 'none', padding: '14px 0 13px', fontWeight: 700, fontSize: 15, color: on ? '#1A1414' : '#818184', textDecoration: 'none', whiteSpace: 'nowrap', boxShadow: 'inset 0 -2.5px 0 ' + (on ? '#D7192D' : 'transparent'), transition: 'color .2s' }}
                >
                  {label}
                </a>
              );
            })}
          </div>
        </nav>
      </div>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(16px,3vw,32px) 96px', display: 'flex', flexDirection: 'column' }}>
        <h1 style={{ margin: 0, padding: 'clamp(36px,5vw,64px) 0 0', fontWeight: 900, fontSize: 'clamp(44px,6vw,72px)', lineHeight: 1, letterSpacing: '-.045em' }}>Menu</h1>

        <section id="walkin" style={{ paddingTop: 32, scrollMarginTop: 124 }}>
          <div style={{ background: '#1A1414', color: '#fff', borderRadius: ph ? 24 : 28, padding: ph ? '20px 12px 12px' : 'clamp(24px,4vw,40px)', display: 'flex', flexDirection: 'column', gap: ph ? 16 : 24 }}>
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: ph ? 4 : 6, padding: ph ? '2px 8px 0' : 0 }}>
              <h2 style={{ margin: 0, fontWeight: 900, fontSize: ph ? 28 : 'clamp(32px,3.4vw,42px)', lineHeight: 1.05, letterSpacing: '-.04em' }}>Pickup combos</h2>
              <p style={{ margin: 0, color: '#BDB3AD', fontSize: ph ? 14 : 16, lineHeight: 1.45, maxWidth: 520 }}>Order ahead and grab them hot from the counter.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: walkCols, gap: ph ? 8 : 12 }}>
              {WALKINS.map(([key, name, price, desc, deal], i) => (
                <div key={key} style={{ background: '#2A2020', borderRadius: ph ? 16 : 22, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.06)' }}>
                  {/* z-index:0 + isolation keeps the price tag's z-index:20 inside this scene, under the sticky bar. */}
                  <span role="img" aria-label={SCENE_ALT[i]} style={{ position: 'relative', zIndex: 0, isolation: 'isolate', aspectRatio: '16/10', overflow: 'hidden', background: 'radial-gradient(110% 90% at 50% 38%,#4A3833 0%,#2E2321 58%,#211918 100%)' }}>
                    {SCENES[i].map((L, li) => (
                      <span key={li} style={{ position: 'absolute', left: L.l, top: L.t, width: L.w, zIndex: L.z, transform: 'translate(-50%,-50%) rotate(' + L.r + ')', filter: L.f }}>
                        <span aria-hidden="true" style={{ ...bgImg(L.src), width: '100%', aspectRatio: L.ar, backgroundSize: 'contain' }} />
                        {L.tops.map((t, ti) => (
                          <span
                            key={ti}
                            aria-hidden="true"
                            style={{ ...bgImg(t.src), position: 'absolute', left: t.x, top: t.y, width: t.w, aspectRatio: '1/1', backgroundSize: 'contain', transform: 'translate(-50%,-50%) rotate(' + t.r + ') scaleX(' + t.fx + ')', filter: 'drop-shadow(0 1px 1.5px rgba(0,0,0,.35))' }}
                          />
                        ))}
                      </span>
                    ))}
                    <span style={{ position: 'absolute', zIndex: 20, left: ph ? 8 : 12, bottom: ph ? 8 : 12, height: ph ? 28 : 38, padding: ph ? '0 10px' : '0 14px', borderRadius: 999, background: '#D7192D', color: '#fff', fontWeight: 900, fontSize: ph ? 14 : 19, letterSpacing: '-.02em', display: 'flex', alignItems: 'center', boxShadow: '0 6px 16px rgba(0,0,0,.25)' }}>{money(price)}</span>
                  </span>
                  <span style={{ padding: ph ? '10px 10px 10px' : '18px 20px 20px', display: 'flex', flexDirection: 'column', gap: ph ? 10 : 16, flex: 1 }}>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: ph ? 3 : 4, flex: 1 }}>
                      <span style={{ fontWeight: 800, fontSize: ph ? 14 : 18, lineHeight: 1.2 }}>{name}</span>
                      <span style={{ fontSize: ph ? 12 : 14, lineHeight: 1.4, color: '#CFC6C0', ...(ph ? clamp2 : {}) }}>{desc}</span>
                    </span>
                    <Hov
                      as="button"
                      type="button"
                      onClick={() => onDeal(deal)}
                      style={{ height: ph ? 40 : 46, border: 0, borderRadius: ph ? 12 : 14, background: '#fff', color: '#1A1414', fontWeight: 800, fontSize: ph ? 14 : 15, cursor: 'pointer', transition: 'background .15s,color .15s' }}
                      hover={{ background: '#D7192D', color: '#fff' }}
                    >
                      Customize
                    </Hov>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {sections.map((sec) => (
          <section key={sec.id} id={sec.id} style={{ paddingTop: ph ? 48 : 72, display: 'flex', flexDirection: 'column', gap: ph ? 14 : 20, scrollMarginTop: 124 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span style={{ width: 44, height: 6, borderRadius: 3, background: sec.theme.accent }} />
              <h2 style={{ margin: 0, fontWeight: 900, fontSize: 'clamp(30px,3.4vw,42px)', letterSpacing: '-.04em' }}>{sec.title}</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: ph ? 'repeat(2,minmax(0,1fr))' : 'repeat(auto-fill,minmax(min(100%,250px),1fr))', gap: ph ? 10 : 16 }}>
              {sec.rows.map((r) => (
                <Hov
                  key={r.key}
                  as="button"
                  type="button"
                  onClick={r.act}
                  aria-label={r.cta + ' ' + r.name + ', ' + r.priceText}
                  style={{ display: 'flex', flexDirection: 'column', border: 0, padding: 0, borderRadius: ph ? 18 : 24, overflow: 'hidden', background: '#fff', boxShadow: '0 0 0 1px #E9E9EC', textAlign: 'left', color: '#1A1414', cursor: 'pointer', transition: 'box-shadow .3s,transform .3s' }}
                  hover={{ transform: 'translateY(-4px)', boxShadow: '0 0 0 1px #DFDFE2,0 22px 44px rgba(26,20,20,.14)' }}
                >
                  <span style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden', background: '#F2F2F5' }}>
                    {r.img ? (
                      <Photo src={r.img} />
                    ) : (
                      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at 28% 22%,rgba(255,255,255,.32),rgba(255,255,255,0) 58%),' + sec.theme.accent }}>
                        <span style={{ fontWeight: 900, fontSize: ph ? 44 : 'clamp(56px,6vw,84px)', letterSpacing: '-.06em', color: '#fff', textShadow: '0 8px 24px rgba(0,0,0,.18)' }}>{r.name.charAt(0)}</span>
                      </span>
                    )}
                    <span style={{ position: 'absolute', left: 12, top: 12, display: 'flex', gap: 6 }}>{r.veg ? <VegMark /> : null}</span>
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: ph ? 3 : 6, padding: ph ? '10px 10px 10px 12px' : '16px 18px 18px', flex: 1 }}>
                    <span style={{ fontWeight: 800, fontSize: ph ? 15 : 18, lineHeight: 1.2, letterSpacing: '-.01em' }}>{r.name}</span>
                    <span style={{ fontSize: ph ? 12.5 : 14, lineHeight: 1.4, color: '#636366', flex: 1, ...(ph ? clamp2 : {}) }}>{r.desc}</span>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: ph ? 6 : 10, paddingTop: ph ? 8 : 12 }}>
                      <span style={{ fontWeight: 800, fontSize: ph ? 13.5 : 15, minWidth: 0 }}>{r.priceText}</span>
                      {ph ? (
                        <span aria-hidden="true" style={{ width: 36, height: 36, flex: 'none', borderRadius: '50%', background: sec.theme.btnBg, color: sec.theme.btnFg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                        </span>
                      ) : (
                        <span style={{ height: 42, padding: '0 16px', borderRadius: 999, background: sec.theme.btnBg, color: sec.theme.btnFg, fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>{r.cta}</span>
                      )}
                    </span>
                  </span>
                </Hov>
              ))}
            </div>
          </section>
        ))}
      </main>

      {picker ? (
        <div style={{ position: 'fixed', inset: 0, zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={closePicker} style={{ position: 'absolute', inset: 0, background: 'rgba(26,20,20,.45)', animation: 'pkmFade .2s ease both' }} />
          <div role="dialog" aria-modal="true" aria-label={picker.name} style={{ position: 'relative', width: 'min(420px,100%)', background: '#fff', borderRadius: 24, padding: 24, display: 'flex', flexDirection: 'column', gap: 6, boxShadow: '0 24px 60px rgba(26,20,20,.25)', animation: 'pkmIn .22s ease both' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, paddingBottom: 10 }}>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontWeight: 900, fontSize: 22, letterSpacing: '-.03em' }}>{picker.name}</span>
                <span style={{ fontSize: 14, color: '#636366' }}>{picker.spicy ? 'Choose a spice level and option' : 'Choose an option'}</span>
              </span>
              <button type="button" onClick={closePicker} aria-label="Close" style={{ width: 42, height: 42, border: 0, borderRadius: '50%', background: '#F2F2F5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1A1414', flex: 'none' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>
            {picker.spicy ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: '#636366' }}>Spice level</span>
                <div role="radiogroup" aria-label="Spice level" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 6 }}>
                  {SPICES.map((v, i) => {
                    const on = spice === v;
                    return (
                      <button key={v} type="button" role="radio" aria-checked={on} onClick={() => setSpice(v)} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 46, padding: '0 12px', border: 0, borderRadius: 12, background: on ? '#1A1414' : '#F2F2F5', color: on ? '#fff' : '#1A1414', fontFamily: 'inherit', fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'background .15s,color .15s' }}>
                        <span aria-hidden="true" style={{ display: 'flex', gap: 3 }}>
                          {[0, 1, 2].map((d) => <span key={d} style={{ width: 6, height: 6, borderRadius: '50%', background: d < i ? '#D7192D' : on ? 'rgba(255,255,255,.28)' : '#D9D9DE' }} />)}
                        </span>
                        {v}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
            {picker.opts.map((o) => (
              <Hov
                key={o.label}
                as="button"
                type="button"
                onClick={() => o.add(picker.spicy ? spice : undefined)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, height: 56, padding: '0 16px', border: 0, borderRadius: 14, background: '#F2F2F5', cursor: 'pointer', color: '#1A1414', transition: 'background .15s' }}
                hover={{ background: '#E9E9EC' }}
              >
                <span style={{ fontWeight: 700, fontSize: 16 }}>{o.label}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontWeight: 800, fontSize: 16 }}>{o.priceText}</span>
                  <span style={{ width: 30, height: 30, borderRadius: '50%', background: '#D7192D', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
                  </span>
                </span>
              </Hov>
            ))}
          </div>
        </div>
      ) : null}

      {sheet ? <MenuOptionsSheet target={sheet} onClose={() => setSheet(null)} onAdd={(line, qty) => { setSheet(null); add(line, qty); }} /> : null}

      {builder ? (
        <PizzaBuilder
          item={builder}
          sizePrices={SIZE_PRICES}
          onClose={() => setBuilder(null)}
          onAdd={(line, qty) => {
            setBuilder(null);
            add(line, qty);
          }}
        />
      ) : null}
    </div>
  );
}
