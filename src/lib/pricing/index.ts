// Shared pricing: the browser shows these prices and the payment server charges them.
// `priceLine(spec)` is the single authority for a cart line's unit price, name and kitchen summary.
// Pure TypeScript (no React, DOM or import.meta.env) so the Cloudflare Worker can import it too.
import type { CategoryId, SizeKey, SizePrices } from '../types';
import {
  CAT_MENU, CHEESES, COMBOS, COMBO_DIPS, COMBO_POPS, COMBO_SIDES, CRUSTS, CUTS, DONENESS, EXTRA_CHEESE, EXTRA_DIP, HALVES, HST_PERCENT,
  MENU_SECTIONS, MOMOS, NOTES_MAX, OVENS, PASTA_BASES, PASTA_EXTRAS, PASTA_REMOVE, PASTA_SAUCES, PIZZAS, PIZZA_SAUCES, SEASONINGS, SIZE_KEYS, SIZE_NAMES,
  SPICES, TOPPINGS, TOP_PRICE, UPSELLS, includedFor, pricesFor, type CatItem,
} from './data';

export * from './data';

/** Money is rounded to cents the same way everywhere (client display and server charge). */
export const round2 = (n: number) => Math.round(n * 100) / 100;

// ---------------------------------------------------------------------------
// Line specs: what was chosen, by id. Sent to the server instead of a price.
// ---------------------------------------------------------------------------

export type Half = (typeof HALVES)[number];
/** The Pizza Builder's choices (everything except which pizza and size). */
export interface PizzaOpts {
  crust: string;
  bake: string;
  sauce: string;
  cheese: string;
  spice: string;
  doneness: string;
  cut: string;
  /** [topping id, placement], in the order they were added. */
  tops: [string, Half][];
  /** Free seasonings (names from SEASONINGS). */
  free: string[];
  /** Note for the kitchen, up to NOTES_MAX characters. */
  notes: string;
}
export type PizzaSpec = { k: 'pizza'; id: string; size: SizeKey } & PizzaOpts;
export type LineSpec =
  /** A pizza from the builder (house pizza or Build Your Own). */
  | PizzaSpec
  /** A house pizza added as-is (Meat favourites "+"). */
  | { k: 'house'; id: string; size: SizeKey }
  /** A pickup combo; `pizzas` has one entry per pizza in the deal. */
  | { k: 'combo'; id: string; pizzas: PizzaOpts[]; dips: Record<string, number>; pops: Record<string, number>; side: string | null }
  /** A row on the full menu page. `opt` is the option label ('' for a single price). */
  | { k: 'menu'; id: string; opt: string; spice?: string }
  /** An item on a category page, with one option id per group. */
  | { k: 'cat'; cat: CategoryId; id: string; opts: Record<string, string> }
  /** `extras` / `remove`: Square's Extra Pasta Topping(s) and Remove Pasta Toppings (ids from PASTA_EXTRAS / PASTA_REMOVE). */
  | { k: 'pasta'; base: string; sauce: string; spice: string; extras?: string[]; remove?: string[] }
  | { k: 'momo'; id: string }
  /** Cart upsell with its flavour. */
  | { k: 'upsell'; id: string; flavour: string };

export interface PricedLine {
  /** Unit price in dollars, rounded to cents. */
  unit: number;
  /** Line name, as shown in the cart. */
  name: string;
  /** Short summary, as shown in the cart. */
  summary: string;
  /** Full detail for the kitchen (Square line note): the summary plus everything chosen. */
  note: string;
}
export type PriceResult = PricedLine | { error: string };

export const MAX_LINES = 60;
export const MAX_QTY = 50;

// ---------------------------------------------------------------------------
// Pizza price and text (the Pizza Builder uses these too)
// ---------------------------------------------------------------------------

export interface PizzaQuote {
  /** Size price for this pizza. */
  base: number;
  unit: number;
  /** Charge above the size price (extra toppings). */
  extra: number;
  included: number;
  /** Included-topping units used (meat and paneer count as 2). */
  used: number;
  /** How many toppings are charged as extras. */
  extraCount: number;
  /** Which toppings are the charged extras (the fewest possible: heaviest first, latest added first). */
  extraIds: string[];
  topCost: number;
  cheeseCost: number;
}
/** Weight of a topping: how many of the included toppings it uses. */
export const topWeight = (id: string) => TOPPINGS[id]?.wt || 1;
/**
 * Price of a pizza: the size price plus TOP_PRICE for each extra topping.
 * Toppings use the included allowance by weight; when they don't fit, the fewest toppings are charged
 * (each extra costs the same, meat or veggie), always the cheapest way for the customer.
 */
export function pizzaQuote(id: string, size: SizeKey, topIds: string[], cheese: string, included = includedFor(id), P: SizePrices = pricesFor(id)): PizzaQuote {
  const used = topIds.reduce((a, k) => a + topWeight(k), 0);
  // Drop the heaviest toppings (latest added first on ties) until the rest fit in the allowance.
  const order = topIds.map((k, i) => ({ k, i, w: topWeight(k) })).sort((x, y) => y.w - x.w || y.i - x.i);
  const extraIds: string[] = [];
  let rest = used;
  for (const t of order) {
    if (rest <= included) break;
    extraIds.push(t.k);
    rest -= t.w;
  }
  const extraCount = extraIds.length;
  const topCost = extraCount * TOP_PRICE[size];
  const cheeseCost = cheese === 'Extra' ? EXTRA_CHEESE : 0;
  const unit = round2(P[size] + topCost + cheeseCost);
  const extra = round2(unit - P[size]);
  return { base: P[size], unit, extra, included, used, extraCount, extraIds, topCost, cheeseCost };
}

const topName = (id: string) => TOPPINGS[id]?.name || id;
const lc = (s: string) => s.toLowerCase();

/** Cart summary for a builder pizza, e.g. "Thin crust · Wood-fired · +2 toppings". */
export function pizzaSummary(o: PizzaOpts, extraCount: number): string {
  const parts = [o.crust + ' crust', o.bake];
  if (o.sauce !== 'Regular') parts.push(o.sauce === 'None' ? 'no sauce' : lc(o.sauce) + ' sauce');
  if (o.cheese !== 'Regular') parts.push(o.cheese === 'None' ? 'no cheese' : lc(o.cheese) + ' cheese');
  if (extraCount) parts.push('+' + extraCount + ' topping' + (extraCount > 1 ? 's' : ''));
  if (o.tops.some(([, h]) => h !== 'whole')) parts.push('half & half');
  if (o.spice !== 'No spice') parts.push(lc(o.spice));
  if (o.doneness !== 'Regular') parts.push(lc(o.doneness));
  return parts.join(' · ');
}
/** Topping names with " (left half)" / " (right half)" suffixes. */
export const pizzaTopNames = (o: PizzaOpts) => o.tops.map(([k, h]) => topName(k) + (h === 'left' ? ' (left half)' : h === 'right' ? ' (right half)' : ''));
/** One combo pizza, as the combo summary lists it. */
export function comboPizzaBits(o: PizzaOpts): string {
  const names = pizzaTopNames(o);
  const bits = [names.length ? names.join(', ') : 'Cheese only'];
  if (o.crust !== 'Regular') bits.push(lc(o.crust) + ' crust');
  if (o.sauce !== 'Regular') bits.push(lc(o.sauce) + ' sauce');
  if (o.cheese !== 'Regular') bits.push(o.cheese === 'None' ? 'no cheese' : lc(o.cheese) + ' cheese');
  if (o.spice !== 'No spice') bits.push(lc(o.spice));
  if (o.notes.trim()) bits.push('Note: ' + o.notes.trim());
  return bits.join(' · ');
}
/** Everything the kitchen needs that the short summaries leave out. */
function pizzaKitchen(o: PizzaOpts, withTops: boolean): string {
  const bits: string[] = [];
  if (withTops) {
    const names = pizzaTopNames(o);
    bits.push('Toppings: ' + (names.length ? names.join(', ') : 'none (cheese only)'));
  } else {
    bits.push(o.bake);
    if (o.doneness !== 'Regular') bits.push(lc(o.doneness));
  }
  if (o.free.length) bits.push('Seasonings: ' + lc(o.free.join(', ')));
  if (withTops && o.notes.trim()) bits.push('Note: ' + o.notes.trim());
  return bits.join(' · ');
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);
const isStr = (x: unknown): x is string => typeof x === 'string';
const oneOf = (x: unknown, list: readonly string[]): x is string => isStr(x) && list.includes(x);
const own = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k);
class Bad extends Error {}
const bad = (why: string): never => { throw new Bad(why); };

function checkPizzaOpts(x: unknown): PizzaOpts {
  if (!isObj(x)) bad('pizza options missing');
  const o = x as Record<string, unknown>;
  if (!oneOf(o.crust, CRUSTS)) bad('crust');
  if (!oneOf(o.bake, OVENS)) bad('oven');
  if (!oneOf(o.sauce, PIZZA_SAUCES.map((s) => s[0]))) bad('sauce');
  if (!oneOf(o.cheese, CHEESES)) bad('cheese');
  if (!oneOf(o.spice, SPICES)) bad('spice');
  if (!oneOf(o.doneness, DONENESS)) bad('doneness');
  // Cut is no longer a choice: any old value is ignored and every pizza is cut into triangles.
  if (!Array.isArray(o.tops) || o.tops.length > Object.keys(TOPPINGS).length) bad('toppings');
  const seen = new Set<string>();
  const tops = (o.tops as unknown[]).map((t): [string, Half] => {
    if (!Array.isArray(t) || t.length !== 2 || !isStr(t[0]) || !own(TOPPINGS, t[0]) || !oneOf(t[1], HALVES)) bad('topping');
    const [id, h] = t as [string, Half];
    if (seen.has(id)) bad('duplicate topping');
    seen.add(id);
    return [id, h];
  });
  if (!Array.isArray(o.free) || o.free.length > SEASONINGS.length) bad('seasonings');
  const free = o.free as unknown[];
  if (free.some((f) => !oneOf(f, SEASONINGS)) || new Set(free).size !== free.length) bad('seasoning');
  if (!isStr(o.notes) || o.notes.length > NOTES_MAX) bad('notes');
  return { crust: o.crust as string, bake: o.bake as string, sauce: o.sauce as string, cheese: o.cheese as string, spice: o.spice as string, doneness: o.doneness as string, cut: CUTS[0], tops, free: free as string[], notes: o.notes as string };
}
const checkSize = (x: unknown): SizeKey => (oneOf(x, SIZE_KEYS) ? (x as SizeKey) : bad('size'));
/** {id: count} with known ids and whole counts; returns the total. */
function checkCounts(x: unknown, ids: string[], what: string): number {
  if (!isObj(x)) bad(what);
  let n = 0;
  for (const [k, v] of Object.entries(x as Record<string, unknown>)) {
    if (!ids.includes(k) || !Number.isInteger(v) || (v as number) < 1 || (v as number) > 50) bad(what);
    n += v as number;
  }
  return n;
}

// ---------------------------------------------------------------------------
// priceLine
// ---------------------------------------------------------------------------

function price(spec: unknown): PricedLine {
  if (!isObj(spec)) bad('spec missing');
  const s = spec as Record<string, unknown>;
  switch (s.k) {
    case 'pizza': {
      if (!isStr(s.id) || !own(PIZZAS, s.id)) bad('unknown pizza');
      const id = s.id as string;
      const size = checkSize(s.size);
      const o = checkPizzaOpts(s);
      const q = pizzaQuote(id, size, o.tops.map((t) => t[0]), o.cheese);
      const summary = pizzaSummary(o, q.extraCount);
      return { unit: q.unit, name: SIZE_NAMES[size] + ' ' + PIZZAS[id].name, summary, note: summary + ' · ' + pizzaKitchen(o, true) };
    }
    case 'house': {
      if (!isStr(s.id) || s.id === 'byo' || !own(PIZZAS, s.id)) bad('unknown pizza');
      const id = s.id as string;
      const size = checkSize(s.size);
      const summary = 'Regular crust · house toppings';
      return { unit: pricesFor(id)[size], name: SIZE_NAMES[size] + ' ' + PIZZAS[id].name, summary, note: summary };
    }
    case 'combo': {
      if (!isStr(s.id) || !own(COMBOS, s.id)) bad('unknown combo');
      const c = COMBOS[s.id as string];
      if (!Array.isArray(s.pizzas) || s.pizzas.length !== c.pizzas) bad('combo pizzas');
      const pizzas = (s.pizzas as unknown[]).map(checkPizzaOpts);
      const dipIds = COMBO_DIPS.map((d) => d[0]);
      const nd = checkCounts(s.dips, dipIds, 'dips');
      const np = checkCounts(s.pops, COMBO_POPS, 'pops');
      // The combo builder only lets you pick exactly the included dips and pops.
      if (nd !== c.dips) bad('dip count');
      if (np !== c.pops) bad('pop count');
      const side = c.side ? (oneOf(s.side, COMBO_SIDES.map((x) => x[0])) ? (s.side as string) : bad('side')) : s.side == null ? null : bad('side');
      // Same arithmetic as the combo builder: each pizza's extra is rounded, then the total.
      const extra = pizzas.reduce((a, p) => a + Math.max(0, pizzaQuote('byo', c.size, p.tops.map((t) => t[0]), p.cheese, c.tops).extra), 0);
      const extraDips = Math.max(0, nd - c.dips);
      const unit = round2(c.price + extra + extraDips * EXTRA_DIP);
      const dips = s.dips as Record<string, number>;
      const pops = s.pops as Record<string, number>;
      let summary: string;
      if (c.pizzas === 1 && !c.dips && !c.pops && !c.side) summary = comboPizzaBits(pizzas[0]);
      else {
        const parts = pizzas.map((p, i) => 'Pizza ' + (i + 1) + ': ' + comboPizzaBits(p));
        const dl = COMBO_DIPS.filter(([id]) => dips[id]).map(([id, n]) => (dips[id] > 1 ? dips[id] + '× ' : '') + n);
        const pl = COMBO_POPS.filter((n) => pops[n]).map((n) => (pops[n] > 1 ? pops[n] + '× ' : '') + n);
        if (dl.length) parts.push('Dips: ' + dl.join(', '));
        if (pl.length) parts.push('Pops: ' + pl.join(', '));
        if (c.side) parts.push(COMBO_SIDES.find((x) => x[0] === side)![1]);
        summary = parts.join(' · ');
      }
      const kitchen = pizzas.map((p, i) => (c.pizzas > 1 ? 'Pizza ' + (i + 1) + ': ' : '') + SIZE_NAMES[c.size] + ', ' + pizzaKitchen(p, false)).join(' · ');
      return { unit, name: c.name + ' combo', summary, note: summary + ' · ' + kitchen };
    }
    case 'menu': {
      let row: (typeof MENU_SECTIONS)[number]['rows'][number] | undefined;
      let sec: (typeof MENU_SECTIONS)[number] | undefined;
      for (const x of MENU_SECTIONS) {
        const r = x.rows.find((y) => y[0] === s.id);
        if (r) { row = r; sec = x; break; }
      }
      if (!row || !sec) bad('unknown menu item');
      const [, name, desc, opts, spicy] = row!;
      const opt = opts.find((x) => x[0] === s.opt) || bad('menu option');
      let spice: string | undefined;
      if (spicy) spice = oneOf(s.spice, SPICES) ? (s.spice as string) : bad('spice');
      else if (s.spice != null) bad('spice');
      const summary = [desc || sec!.title, spice].filter(Boolean).join(' · ');
      return { unit: opt[1], name: opt[0] ? name + ', ' + lc(opt[0]) : name, summary, note: summary };
    }
    case 'cat': {
      if (!isStr(s.cat) || !own(CAT_MENU, s.cat)) bad('unknown category');
      const cat = CAT_MENU[s.cat as CategoryId];
      const it: CatItem = cat.items.find((x) => x.id === s.id) || bad('unknown item');
      const groups = it.groups || [];
      if (!isObj(s.opts)) bad('options');
      const sel = s.opts as Record<string, unknown>;
      if (Object.keys(sel).some((g) => !groups.some((x) => x.id === g))) bad('option group');
      // A group whose first choice is the quiet default (sugar, ice, black salt...) may be left out: carts saved before it existed still work.
      const chosen = groups.map((g) => (sel[g.id] == null && g.opts[0].quiet ? g.opts[0] : g.opts.find((x) => x.id === sel[g.id]) || bad('option')));
      const priced = chosen.filter((c) => c.price != null).pop();
      const unit = (priced ? priced.price : it.price) ?? 0;
      // Default "no change" choices (Regular sugar, No ice...) stay off the line and the kitchen ticket.
      const sub = chosen.filter((c) => !c.quiet).map((c) => c.long || c.label).join(' · ').replace(/ · and /g, ' and ');
      const summary = sub || it.desc || cat.label;
      return { unit, name: it.name, summary, note: summary };
    }
    case 'pasta': {
      const base = PASTA_BASES.find((b) => b.id === s.base) || bad('pasta base');
      const sauce = PASTA_SAUCES.find((x) => x[0] === s.sauce) || bad('pasta sauce');
      const unit = base.p[sauce[0]] ?? bad('pasta combination');
      if (!oneOf(s.spice, SPICES)) bad('spice');
      const pick = (v: unknown, ids: string[], what: string): string[] => {
        if (v == null) return [];
        if (!Array.isArray(v) || v.length > ids.length || new Set(v).size !== v.length || v.some((x) => !oneOf(x, ids))) bad(what);
        return ids.filter((id) => (v as string[]).includes(id)); // canonical order
      };
      const extras = pick(s.extras, PASTA_EXTRAS.map((x) => x[0]), 'pasta extras');
      const remove = pick(s.remove, PASTA_REMOVE.filter((x) => x[2].includes(base.id)).map((x) => x[0]), 'pasta remove');
      const extraCost = extras.reduce((a, id) => a + PASTA_EXTRAS.find((x) => x[0] === id)![2], 0);
      // e.g. "Chicken Pasta with Rosé Sauce", "Regular Pasta with Alfredo Sauce" (owner wants Pasta and Sauce capitalized).
      const raw = base.name + ' Pasta with ' + sauce[1] + ' Sauce';
      const changes = [...remove.map((id) => PASTA_REMOVE.find((x) => x[0] === id)![1]), ...extras.map((id) => PASTA_EXTRAS.find((x) => x[0] === id)![1])];
      const summary = [base.desc, s.spice as string, ...changes].join(' · ');
      return { unit: round2(unit + extraCost), name: raw.charAt(0).toUpperCase() + raw.slice(1), summary, note: summary };
    }
    case 'momo': {
      const m = MOMOS.find((x) => x[0] === s.id) || bad('momos');
      return { unit: m[2], name: m[1] + ' momos', summary: 'Steamed dumplings', note: 'Steamed dumplings' };
    }
    case 'upsell': {
      const u = UPSELLS.find((x) => x.key === s.id) || bad('upsell');
      if (!oneOf(s.flavour, u.flavours)) bad('flavour');
      const summary = [u.summary, s.flavour as string].filter(Boolean).join(' · ');
      return { unit: u.unit, name: u.name, summary, note: summary };
    }
    default:
      return bad('unknown line type');
  }
}

/** Authoritative price, name and summary for one cart line, or an error if anything in the spec is invalid. */
export function priceLine(spec: unknown): PriceResult {
  try {
    const r = price(spec);
    if (!Number.isFinite(r.unit) || r.unit <= 0) return { error: 'no price' };
    return r;
  } catch (e) {
    if (e instanceof Bad) return { error: e.message };
    return { error: 'invalid' };
  }
}

/** Client-side: price a spec the UI just built. Throws if the UI built something the server would reject. */
export function mustPrice(spec: LineSpec): PricedLine {
  const r = priceLine(spec);
  if ('error' in r) throw new Error('Unpriceable cart line (' + r.error + '): ' + JSON.stringify(spec));
  return r;
}
/** Strip a builder pizza spec down to its options (for a combo slot). */
export const pizzaOptsOf = ({ crust, bake, sauce, cheese, spice, doneness, cut, tops, free, notes }: PizzaOpts): PizzaOpts => ({ crust, bake, sauce, cheese, spice, doneness, cut, tops, free, notes });

/**
 * Order totals in cents, computed the way Square computes the order it charges: each line is its unit
 * price in cents × qty, and 13% HST is applied to the subtotal and rounded half-to-even (banker's
 * rounding). Probing Square sandbox orders confirmed this ($16.50 -> HST $2.14; $15.50 -> $2.02; two
 * $16.50 lines -> $4.29). The checkout shows these numbers, so the customer sees exactly what is charged.
 */
export function orderTotals(lines: { unit: number; qty: number }[]) {
  const subCents = lines.reduce((a, l) => a + Math.round(l.unit * 100) * l.qty, 0);
  const t = subCents * HST_PERCENT;
  const q = Math.floor(t / 100), r = t - q * 100;
  const taxCents = r > 50 ? q + 1 : r < 50 ? q : q % 2 ? q + 1 : q;
  const totalCents = subCents + taxCents;
  return { subCents, taxCents, totalCents, sub: subCents / 100, tax: taxCents / 100, total: totalCents / 100 };
}
export const orderTotalCents = (lines: { unit: number; qty: number }[]) => orderTotals(lines).totalCents;
