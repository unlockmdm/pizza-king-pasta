// Every price and price rule on the site. Pure data: no React, DOM or import.meta.env, so the
// browser and the payment server (Cloudflare Worker / Vite dev plugin) both import it and can't drift.
// Prices match the shop's Square catalog (checked Nov 10, 2026). Square is the source of truth.
// Items not in Square keep their flyer price.
import type { CategoryId, SizeKey, SizePrices } from '../types';

/** Ontario HST, as a whole percent (Square's order tax uses the same number). */
export const HST_PERCENT = 13;
export const HST = HST_PERCENT / 100;

// ---------------------------------------------------------------------------
// Pizzas
// ---------------------------------------------------------------------------

export const SIZE_KEYS: SizeKey[] = ['S', 'M', 'L', 'XL'];
export const SIZE_NAMES: Record<SizeKey, string> = { S: 'Small', M: 'Medium', L: 'Large', XL: 'X-Large' };

/** Build Your Own / Custom Pizza and the classic specials. */
export const SIZE_PRICES: SizePrices = { S: 12.0, M: 14.6, L: 16.5, XL: 22.8 };
const DESI: SizePrices = { S: 13.0, M: 15.5, L: 17.3, XL: 23.8 };
const CLASSIC_XL_2250: SizePrices = { S: 12.0, M: 14.6, L: 16.5, XL: 22.5 };
/** Per-pizza size prices where they differ from SIZE_PRICES. */
export const PIZZA_PRICES: Record<string, SizePrices> = {
  'butter-chicken': DESI,
  'shahi-paneer': DESI,
  'chicken-shawarma': DESI,
  'tandoori-fish': DESI,
  pepperoni: { S: 12.0, M: 15.5, L: 17.3, XL: 23.8 },
  bismark: CLASSIC_XL_2250,
  'non-veg': CLASSIC_XL_2250,
  'sea-food': CLASSIC_XL_2250,
};
export const pricesFor = (id: string): SizePrices => PIZZA_PRICES[id] || SIZE_PRICES;

/** Extra topping price by size, from the shop's Square catalog (Extra Veggie / Extra Meat Toppings lists). */
export const TOP_PRICE: Record<SizeKey, number> = { S: 1.15, M: 2.25, L: 2.5, XL: 3.5 };
/** Toppings included in Build Your Own, and the minimum for every house pizza. */
export const BYO_INCLUDED = 4;
/** Extra cheese surcharge (the cheese level "Extra" isn't offered; extra cheese is a topping). */
export const EXTRA_CHEESE = 0;

export type TopCat = 'Veggie' | 'Meat';
/**
 * [id, name, category, weight]. Weight = how many of the included toppings it uses.
 * Owner rule (Nov 2026): every meat, Shahi/Tandoori paneer (marked "(2 Toppings)" in Square) and extra cheese count as 2;
 * other veggies count as 1. So 4 included toppings = 4 veggies, 1 meat + 2 veggies, or 2 meats.
 * Past the included toppings, each extra topping costs TOP_PRICE once, meat or veggie (matches Square's counter prices).
 */
export const TOPPING_ROWS: [string, string, TopCat, number][] = [
  ['mushrooms', 'Mushrooms', 'Veggie', 1], ['green-peppers', 'Green pepper', 'Veggie', 1], ['red-pepper', 'Red pepper', 'Veggie', 1], ['tomatoes', 'Tomatoes', 'Veggie', 1],
  ['green-olives', 'Green olives', 'Veggie', 1], ['soya-champ', 'Soya champ', 'Veggie', 1], ['olives', 'Black olives', 'Veggie', 1], ['red-onions', 'Onions', 'Veggie', 1],
  ['hot-peppers', 'Hot pepper', 'Veggie', 1], ['pineapple', 'Pineapple', 'Veggie', 1], ['jalapenos', 'Jalapeño pepper', 'Veggie', 1], ['sun-dried', 'Sun dried tomatoes', 'Veggie', 1],
  ['broccoli', 'Broccoli', 'Veggie', 1], ['corn', 'Sweet corn', 'Veggie', 1], ['shahi-paneer', 'Shahi paneer', 'Veggie', 2], ['paneer', 'Tandoori paneer', 'Veggie', 2],
  ['veg-pepperoni', 'Veggie pepperoni', 'Veggie', 1], ['extra-mozz', 'Extra cheese', 'Veggie', 2], ['feta', 'Feta cheese', 'Veggie', 1], ['zucchini', 'Zucchini', 'Veggie', 1], ['eggplant', 'Eggplant', 'Veggie', 1],
  ['pepperoni', 'Pepperoni', 'Meat', 2], ['anchovies', 'Anchovies', 'Meat', 2], ['bacon', 'Bacon', 'Meat', 2], ['ham', 'Ham', 'Meat', 2], ['sausage', 'Hot Italian sausage', 'Meat', 2],
  ['grilled-chicken', 'Grilled chicken', 'Meat', 2], ['tandoori-chicken', 'Tandoori chicken', 'Meat', 2], ['butter-chicken', 'Butter chicken', 'Meat', 2],
  ['shawarma-chicken', 'Shawarma chicken', 'Meat', 2], ['seafood-mix', 'Sea food mix', 'Meat', 2], ['shrimp', 'Shrimp', 'Meat', 2], ['chicken-kabab', 'Chicken kabab', 'Meat', 2], ['hot-salami', 'Hot salami', 'Meat', 2],
];
export interface ToppingInfo { id: string; name: string; cat: TopCat; wt: number }
export const TOPPINGS: Record<string, ToppingInfo> = Object.fromEntries(TOPPING_ROWS.map(([id, name, cat, wt]) => [id, { id, name, cat, wt }]));

/** Base sauce: [value, display label]. 'Regular' is shown as "Marinara". */
export const PIZZA_SAUCES: [string, string][] = [['Regular', 'Marinara'], ['Butter chicken', 'Butter chicken'], ['Shahi paneer', 'Shahi paneer'], ['Garlic', 'Garlic'], ['Hot', 'Hot sauce'], ['BBQ', 'BBQ'], ['Pesto', 'Pesto'], ['Honey garlic', 'Honey garlic']];
export const CRUSTS = ['Regular', 'Thin', 'Thick'];
export const OVENS = ['Wood-fired', 'Conventional'];
export const CHEESES = ['Light', 'Regular', 'None'];
/** Spice level, same options as Square's "Pizza Spice Level" / "Pasta Spice Level" lists. */
export const SPICES = ['No spice', 'Little spicy', 'Medium spicy', 'Extra spicy'];
export const DONENESS = ['Regular', 'Light', 'Well done'];
// Every pizza is cut into triangles (not a customer choice since handoff 3).
export const CUTS = ['Triangles'];
/** Slices per size, shown on the size picker. */
export const SLICES: Record<SizeKey, number> = { S: 6, M: 8, L: 10, XL: 12 };
/** Free seasonings. */
export const SEASONINGS = ['Ginger', 'Garlic', 'Coriander', 'Red chilli', 'Green chilli', 'Oregano', 'Italian spice'];
export const HALVES = ['left', 'whole', 'right'] as const;
export const NOTES_MAX = 140;
export const PIZZA_DEFAULTS = { size: 'L' as SizeKey, crust: 'Regular', bake: 'Wood-fired', sauce: 'Regular', cheese: 'Regular', spice: 'No spice', doneness: 'Regular', cut: 'Triangles' };

/** Every pizza the builder can open, with the toppings already on it. 'byo' starts empty with 4 included. */
export const PIZZAS: Record<string, { name: string; tops: string[] }> = {
  byo: { name: 'Build Your Own', tops: [] },
  napoli: { name: 'Napoli', tops: ['anchovies', 'green-olives'] },
  'four-seasons': { name: 'Four Seasons', tops: ['ham', 'mushrooms', 'olives'] },
  'italian-veg': { name: 'Italian Vegetarian', tops: ['zucchini', 'red-pepper', 'eggplant', 'red-onions'] },
  'non-veg': { name: 'Non-Vegetarian', tops: ['grilled-chicken', 'sausage', 'hot-salami', 'ham'] },
  bismark: { name: 'Bismark', tops: ['sun-dried', 'grilled-chicken', 'sausage'] },
  'sea-food': { name: 'Sea Food', tops: ['shrimp', 'seafood-mix'] },
  'chicken-shawarma': { name: 'Shawarma Chicken', tops: ['shawarma-chicken', 'hot-peppers', 'red-onions'] },
  'butter-chicken': { name: 'Butter Chicken', tops: ['tandoori-chicken', 'green-peppers', 'red-onions'] },
  'shahi-paneer': { name: 'Shahi Paneer', tops: ['paneer', 'green-peppers', 'red-onions', 'jalapenos'] },
  greek: { name: 'Greek', tops: ['feta', 'olives', 'tomatoes'] },
  hawaiian: { name: 'Hawaiian', tops: ['pineapple', 'bacon', 'ham'] },
  'meat-lover': { name: 'Meat Lover', tops: ['pepperoni', 'ham', 'bacon', 'sausage'] },
  canadian: { name: 'Canadian', tops: ['pepperoni', 'mushrooms', 'bacon'] },
  'tandoori-fish': { name: 'Tandoori Fish', tops: ['mushrooms', 'red-onions', 'green-peppers'] },
  pepperoni: { name: 'Pepperoni', tops: ['pepperoni'] },
};
/** Toppings included in a pizza's base price: BYO = 4, a house pizza = its own toppings' weight (at least 4). */
export const includedFor = (id: string): number =>
  id === 'byo' ? BYO_INCLUDED : Math.max(BYO_INCLUDED, (PIZZAS[id]?.tops || []).reduce((a, k) => a + (TOPPINGS[k]?.wt || 1), 0));

// ---------------------------------------------------------------------------
// Pickup combos
// ---------------------------------------------------------------------------

export interface ComboDef { name: string; price: number; size: SizeKey; pizzas: number; tops: number; dips: number; pops: number; side: boolean }
export const COMBOS: Record<string, ComboDef> = {
  'one-large': { name: 'One Large', price: 11.99, size: 'L', pizzas: 1, tops: 1, dips: 0, pops: 0, side: false },
  'two-large': { name: 'Two Large', price: 36.0, size: 'L', pizzas: 2, tops: 4, dips: 2, pops: 2, side: true },
  'two-medium': { name: 'Two Medium', price: 32.0, size: 'M', pizzas: 2, tops: 4, dips: 2, pops: 2, side: true },
  'two-small': { name: 'Two Small', price: 25.99, size: 'S', pizzas: 2, tops: 4, dips: 2, pops: 0, side: false },
};
/** Dipping sauce on its own (Square: $1.33). Combos only let you pick the included dips. */
export const EXTRA_DIP = 1.33;
export const COMBO_DIPS: [string, string][] = [['garlic', 'Creamy garlic'], ['ranch', 'Ranch'], ['chipotle', 'Chipotle'], ['jalapeno-cheddar', 'Jalapeño cheddar'], ['marinara', 'Marinara']];
export const COMBO_POPS = ['Coca-Cola', 'Pepsi', 'Sprite', 'Canada Dry', 'Orange Crush'];
/** Free side in the bigger combos: [id, name]. */
export const COMBO_SIDES: [string, string][] = [['sugarcane', 'Sugarcane juice'], ['corn', 'Wood-oven corn']];

// ---------------------------------------------------------------------------
// Full menu rows (MenuPage)
// ---------------------------------------------------------------------------

/** [option label, price]: an empty label means a single fixed price. */
export type MenuOpt = [string, number];
/** [key, name, description, options, asks for spice level] */
export type MenuRow = [string, string, string, MenuOpt[], boolean?];
export interface MenuSection { id: string; title: string; rows: MenuRow[] }
const SIZES3 = (p: [number, number, number]): MenuOpt[] => [['Medium', p[0]], ['Large', p[1]], ['X-Large', p[2]]];
const JUICE: [number, number, number] = [6.81, 8.01, 10];
const SHAKE: [number, number, number] = [8.41, 9.29, 11.11];
const LEMONADE: [number, number, number] = [5.8, 7, 9];
const WINGS: [number, number][] = [[8, 10], [12, 12], [16, 14], [24, 22], [34, 31], [48, 42]];
const LEG_EACH = 5;
const FISH_PER_LB = 12.5;
// Square: Tandoori Fish 0.5 lb to 5 lb in half pounds, $12.50 a pound.
const FISH_LBS: [number, string][] = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((n): [number, string] => [n, n + ' lb']);
const CORN = 5;
const GELATO_SCOOP = 6;

export const MENU_SECTIONS: MenuSection[] = [
  { id: 'tandoori', title: 'Wings & tandoori', rows: [
    ['wings', 'Tandoori wings', 'Hot, honey garlic or BBQ', WINGS.map(([n, p]): MenuOpt => [n + ' wings', p]), true],
    ['leg', 'Tandoori chicken leg', 'Per piece', [['', LEG_EACH]]],
    ['fish', 'Tandoori fish', 'Per pound', FISH_LBS.map(([n, l]): MenuOpt => [l, n * FISH_PER_LB]), true],
  ] },
  { id: 'sides', title: 'Sides & salads', rows: [
    ['wedges', 'Potato wedges', '', [['Medium', 8], ['Large', 10]]],
    ['garlic-bread', 'Garlic bread', 'With or without cheese', [['With cheese', 8.01], ['Without cheese', 6.99]]],
    ['sub', 'Sub', 'Foot-long, veggie or non-veggie', [['Veggie', 10.18], ['Non-veggie', 11.06]], true],
    ['nv-salad', 'Non-veg salad', '', [['', 8.99]]],
    ['v-salad', 'Veg salad', '', [['', 7.99]]],
    ['corn', 'Sweet corn', 'Roasted in the wood oven', [['', CORN]]],
    ['chaat', 'Fruit chaat', 'With sweet potato', [['', 8.01]]],
  ] },
  { id: 'pasta', title: 'Pasta & momos', rows: [
    ['ch-pasta-rose', 'Chicken pasta with rosé sauce', 'Chicken, green peppers, onions', [['', 14.6]], true],
    ['veg-pasta-rose', 'Veggie pasta with rosé sauce', 'Green peppers, onions, broccoli, mushrooms', [['', 13.27]], true],
    ['pasta-rose', 'Regular pasta with rosé sauce', 'Tomato, cream, parmesan, ginger, parsley', [['', 12.5]], true],
    ['ch-pasta-alfredo', 'Chicken pasta with Alfredo sauce', 'Chicken, green peppers, onions', [['', 15.04]], true],
    ['veg-pasta-alfredo', 'Veggie pasta with Alfredo sauce', 'Green peppers, onions, broccoli, mushrooms', [['', 13.72]], true],
    ['pasta-alfredo', 'Regular pasta with Alfredo sauce', 'Cream, parmesan, ginger, parsley', [['', 13]], true],
    ['ch-pasta-tomato', 'Chicken pasta with tomato sauce', 'Chicken, green peppers, onions', [['', 14]], true],
    ['veg-pasta-tomato', 'Veggie pasta with tomato sauce', 'Green peppers, onions, broccoli, mushrooms', [['', 12.5]], true],
    ['momos', 'Momos', 'Veggie or non-veggie', [['Veggie', 9], ['Non-veggie', 11]]],
  ] },
  { id: 'gelato', title: 'Gelato & shakes', rows: [
    ['cone', 'Gelato cone', 'Vanilla, mango, pistachio, chocolate and more', [['', GELATO_SCOOP]]],
    ['cup', 'Gelato cup', 'Medium cup, choice of flavour', [['', GELATO_SCOOP]]],
    ['shake', 'Shake', 'Mango, strawberry, banana, badam, papaya', SIZES3(SHAKE)],
  ] },
  { id: 'drinks', title: 'Drinks', rows: [
    ['fruit-juice', 'Fresh fruit juice', 'Mix, orange, pineapple, guava', SIZES3(JUICE)],
    ['sugarcane', 'Sugarcane juice', '', SIZES3(JUICE)],
    ['lemonade', 'Lemonade', '', SIZES3(LEMONADE)],
    ['coconut', 'Fresh coconut juice', '', [['', 8.01]]],
    ['hot', 'Hot drinks', 'Indian coffee, Italian espresso, cappuccino, hot chocolate, masala tea', [['', 3.1]]],
    ['pop', 'Pop', 'Coke, Sprite, Canada Dry, Pepsi, Orange Crush', [['355 mL can', 1.99], ['2 L bottle', 5]]],
    ['water', 'Water', '500 mL bottle', [['', 1.99]]],
    ['beer', 'Beer', 'Canadian, Molson, Moosehead, Miller, Corona, Heineken, Stella', [['Bottle', 5.7], ['Can', 7.5]]],
  ] },
  // Dipping sauces always come last.
  { id: 'dips', title: 'Dipping sauces', rows: [
    ['dip-garlic', 'Creamy garlic', '', [['', EXTRA_DIP]]],
    ['dip-ranch', 'Ranch', '', [['', EXTRA_DIP]]],
    ['dip-chipotle', 'Chipotle', '', [['', EXTRA_DIP]]],
    ['dip-jalapeno', 'Jalapeño cheddar', '', [['', EXTRA_DIP]]],
    ['dip-marinara', 'Marinara', '', [['', EXTRA_DIP]]],
    ['dip-bbq', 'BBQ', '', [['', EXTRA_DIP]]],
    ['dip-honey', 'Honey', '', [['', EXTRA_DIP]]],
    ['dip-hot', 'Hot wing', '', [['', EXTRA_DIP]]],
    ['dip-chutney', 'Green chutney', '', [['', EXTRA_DIP]]],
  ] },
];

// ---------------------------------------------------------------------------
// Category pages (Wings & sides, Drinks, Gelato & shakes)
// ---------------------------------------------------------------------------

/** `quiet`: the default "no change" choice (Regular sugar, No ice...), left off the cart line and kitchen ticket. */
export interface CatOpt { id: string; label: string; price?: number; long?: string; quiet?: boolean }
export interface CatGroup { id: string; label?: string; opts: CatOpt[] }
export interface CatItem {
  id: string;
  name: string;
  desc?: string;
  /** Price when no chosen option carries one. */
  price?: number;
  /** Default option id per group id. */
  def?: Record<string, string>;
  groups?: CatGroup[];
}
const o = (id: string, label: string, x?: Partial<CatOpt>): CatOpt => ({ id, label, ...(x || {}) });
const CSIZES3 = (p: [number, number, number]): CatOpt[] => [
  o('M', 'M', { price: p[0], long: 'Medium' }),
  o('L', 'L', { price: p[1], long: 'Large' }),
  o('XL', 'XL', { price: p[2], long: 'X-Large' }),
];
const money2 = (n: number) => '$' + n.toFixed(2);
// Free drink adjustments, named as in the shop's Square modifier lists. First option = default, kept off the ticket.
const SUGAR_GROUP: CatGroup = { id: 'sugar', label: 'Sugar', opts: [o('reg', 'Regular', { quiet: true }), o('none', 'No sugar'), o('less', 'Less sugar'), o('extra', 'Extra sugar')] };
const ADD_ICE_GROUP: CatGroup = { id: 'ice', label: 'Ice', opts: [o('none', 'No ice', { quiet: true }), o('add', 'Add ice')] };
const LEMONADE_ICE_GROUP: CatGroup = { id: 'ice', label: 'Ice', opts: [o('reg', 'Regular', { quiet: true }), o('none', 'No ice'), o('less', 'Less ice'), o('extra', 'Extra ice')] };
const BLACK_SALT_GROUP: CatGroup = { id: 'salt', label: 'Black salt', opts: [o('reg', 'Regular', { quiet: true }), o('none', 'No black salt'), o('less', 'Less black salt'), o('extra', 'Extra black salt')] };
const SPICE_GROUP: CatGroup = { id: 'spice', label: 'Spice level', opts: SPICES.map((v) => o(v.toLowerCase().replace(/\s+/g, '-'), v)) };
export const GELATO_FLAVOURS = ['Vanilla', 'Mango', 'Strawberry', 'Banana', 'Pistachio', 'Black cherry', 'Cappuccino', 'Chocolate', 'Red velvet', 'Rum & raisin'];
const GELATO_OPTS: CatOpt[] = GELATO_FLAVOURS.map((f) => o(f.toLowerCase().replace(/[^a-z]+/g, '-'), f));
// Square lets the counter pick more than one gelato flavour: offer an optional second one.
const GELATO_SECOND: CatGroup = { id: 'flav2', label: 'Second flavour (optional)', opts: [o('none', 'None', { quiet: true }), ...GELATO_FLAVOURS.map((f) => o(f.toLowerCase().replace(/[^a-z]+/g, '-'), f, { long: 'and ' + f.toLowerCase() }))] };

/** Each category's fallback summary (its hero eyebrow) and its items. */
export const CAT_MENU: Record<CategoryId, { label: string; items: CatItem[] }> = {
  wings: {
    label: 'Wings & sides',
    items: [
      {
        id: 'wings', name: 'Tandoori wings', desc: 'Hot wing, honey garlic, BBQ, honey or garlic. Extra dip ' + money2(EXTRA_DIP) + '.', def: { n: '12' },
        groups: [
          // Square "Wing Sauce": No Sauce, BBQ, Honey, Garlic, Hot Wing (honey + garlic together = honey garlic).
          { id: 'flav', label: 'Sauce', opts: [o('hot', 'Hot wing'), o('honey-garlic', 'Honey garlic'), o('bbq', 'BBQ'), o('honey', 'Honey'), o('garlic', 'Garlic'), o('none', 'No sauce')] },
          { id: 'n', label: 'Wings', opts: WINGS.map(([n, p]) => o(String(n), String(n), { price: p, long: n + ' wings' })) },
          SPICE_GROUP,
        ],
      },
      {
        id: 'leg', name: 'Tandoori chicken leg', desc: money2(LEG_EACH) + ' per piece',
        groups: [{ id: 'q', label: 'Pieces', opts: [1, 2, 3, 4].map((n) => o(String(n), String(n), { price: n * LEG_EACH, long: n + (n === 1 ? ' piece' : ' pieces') })) }],
      },
      {
        id: 'fish', name: 'Tandoori fish', desc: money2(FISH_PER_LB) + ' per pound',
        groups: [{ id: 'w', label: 'Weight', opts: FISH_LBS.map(([n, l]) => o(String(n), l, { price: n * FISH_PER_LB })) }, SPICE_GROUP],
      },
      { id: 'wedges', name: 'Potato wedges', desc: 'Medium or large', groups: [{ id: 's', opts: [o('M', 'Medium', { price: 8 }), o('L', 'Large', { price: 10 })] }] },
      { id: 'garlic-bread', name: 'Garlic bread', desc: 'With or without cheese', groups: [{ id: 'c', opts: [o('cheese', 'With cheese', { price: 8.01 }), o('plain', 'Without cheese', { price: 6.99 })] }] },
      { id: 'sub', name: 'Sub', desc: 'Foot-long, veggie or non-veggie', groups: [{ id: 'kind', opts: [o('veg', 'Veggie', { price: 10.18 }), o('nonveg', 'Non-veggie', { price: 11.06 })] }, SPICE_GROUP] },
      { id: 'nv-salad', name: 'Non-veg salad', price: 8.99 },
      { id: 'v-salad', name: 'Veg salad', price: 7.99 },
      { id: 'corn', name: 'Sweet corn', desc: 'Roasted in the wood oven', price: CORN },
      { id: 'chaat', name: 'Fruit chaat', desc: 'With sweet potato', price: 8.01 },
    ],
  },
  juice: {
    label: 'Drinks',
    items: [
      {
        id: 'fresh', name: 'Fresh fruit juice', desc: 'Orange, pineapple, guava or mix', def: { size: 'L' },
        groups: [
          { id: 'flav', label: 'Flavour', opts: [o('orange', 'Orange'), o('pineapple', 'Pineapple'), o('guava', 'Guava'), o('mix', 'Mix')] },
          { id: 'size', label: 'Size', opts: CSIZES3(JUICE) },
          BLACK_SALT_GROUP,
          ADD_ICE_GROUP,
        ],
      },
      { id: 'sugarcane', name: 'Sugarcane juice', def: { size: 'L' }, groups: [{ id: 'size', label: 'Size', opts: CSIZES3(JUICE) }, BLACK_SALT_GROUP, ADD_ICE_GROUP] },
      { id: 'lemonade', name: 'Lemonade', def: { size: 'L' }, groups: [{ id: 'size', label: 'Size', opts: CSIZES3(LEMONADE) }, SUGAR_GROUP, LEMONADE_ICE_GROUP] },
      { id: 'coconut', name: 'Fresh coconut juice', price: 8.01 },
      { id: 'hot', name: 'Hot drinks', price: 3.1, groups: [{ id: 'kind', label: 'Drink', opts: [o('coffee', 'Indian coffee'), o('espresso', 'Italian espresso'), o('cappuccino', 'Cappuccino'), o('choc', 'Hot chocolate'), o('masala', 'Masala tea')] }, SUGAR_GROUP] },
      {
        id: 'pop', name: 'Pop', desc: '355 mL can or 2 L bottle',
        groups: [
          { id: 'kind', label: 'Size', opts: [o('can', '355 mL can', { price: 1.99 }), o('2l', '2 L bottle', { price: 5 })] },
          { id: 'brand', label: 'Brand', opts: ['Coke', 'Sprite', 'Canada Dry', 'Pepsi', 'Orange Crush'].map((b) => o(b.toLowerCase().replace(/\s+/g, '-'), b)) },
        ],
      },
      { id: 'water', name: 'Water', desc: '500 mL bottle', price: 1.99 },
      {
        id: 'beer', name: 'Beer', desc: 'Bottle or can',
        groups: [
          { id: 'kind', label: 'Bottle or can', opts: [o('bottle', 'Bottle', { price: 5.7 }), o('can', 'Can', { price: 7.5 })] },
          { id: 'brand', label: 'Brand', opts: ['Canadian', 'Molson', 'Moosehead Blue', 'Miller', 'Corona', 'Heineken', 'Stella'].map((b) => o(b.toLowerCase().replace(/\s+/g, '-'), b)) },
        ],
      },
    ],
  },
  gelato: {
    label: 'Gelato & shakes',
    items: [
      { id: 'cone', name: 'Gelato cone', price: GELATO_SCOOP, groups: [{ id: 'flav', label: 'Flavour', opts: GELATO_OPTS }, GELATO_SECOND] },
      // Square calls gelato "Ice Cream": Cone $6.00, Medium Bowl $6.00 (Large Bowl has no price set yet).
      { id: 'cup', name: 'Gelato cup', desc: 'Medium cup', price: GELATO_SCOOP, groups: [{ id: 'flav', label: 'Flavour', opts: GELATO_OPTS }, GELATO_SECOND] },
      {
        id: 'shake', name: 'Thick shake',
        groups: [
          { id: 'flav', label: 'Flavour', opts: [o('mango', 'Mango'), o('strawberry', 'Strawberry'), o('banana', 'Banana'), o('badam', 'Badam'), o('papaya', 'Papaya')] },
          { id: 'size', label: 'Size', opts: CSIZES3(SHAKE) },
          SUGAR_GROUP,
          ADD_ICE_GROUP,
        ],
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// Pasta bar and momos
// ---------------------------------------------------------------------------

export type PastaSauceId = 'rose' | 'alfredo' | 'tomato';
export type PastaBaseId = 'classic' | 'veggie' | 'chicken';
/** [id, name] */
export const PASTA_SAUCES: [PastaSauceId, string][] = [['rose', 'Rosé'], ['alfredo', 'Alfredo'], ['tomato', 'Tomato']];
/** Price per sauce. A missing sauce means the base isn't offered with it. */
export const PASTA_BASES: { id: PastaBaseId; name: string; desc: string; p: Partial<Record<PastaSauceId, number>> }[] = [
  { id: 'chicken', name: 'Chicken', desc: 'Chicken, green peppers, onions', p: { rose: 14.6, tomato: 14, alfredo: 15.04 } },
  { id: 'veggie', name: 'Veggie', desc: 'Green peppers, onions, broccoli, mushrooms', p: { rose: 13.27, tomato: 12.5, alfredo: 13.72 } },
  // Square: "Regular Pasta With Rosé / Alfredo Sauce" (there is no regular pasta with tomato sauce).
  { id: 'classic', name: 'Regular', desc: 'Ginger and parsley', p: { rose: 12.5, alfredo: 13 } },
];
/** Square "Extra Pasta Topping(s)": [id, name, price]. */
export const PASTA_EXTRAS: [string, string, number][] = [['chicken', 'Extra chicken', 1.5], ['sauce', 'Extra sauce', 1.5], ['green-pepper', 'Extra green pepper', 1], ['onion', 'Extra onion', 1], ['broccoli', 'Extra broccoli', 1], ['mushroom', 'Extra mushroom', 1]];
/** Square "Remove Pasta Toppings": [id, name, bases that have it]. */
export const PASTA_REMOVE: [string, string, PastaBaseId[]][] = [['chicken', 'No chicken', ['chicken']], ['green-pepper', 'No green pepper', ['veggie', 'chicken']], ['onion', 'No onion', ['veggie', 'chicken']], ['broccoli', 'No broccoli', ['veggie']], ['mushroom', 'No mushroom', ['veggie']]];
export type MomoId = 'veg' | 'nonveg';
export const MOMOS: [MomoId, string, number][] = [['veg', 'Veggie', 9], ['nonveg', 'Non-veggie', 11]];

// ---------------------------------------------------------------------------
// Cart upsells (CartCheckout)
// ---------------------------------------------------------------------------

export interface UpsellDef { key: string; name: string; unit: number; summary: string; flavours: string[] }
// Upsells ask for a flavour before adding, so the kitchen always knows what to make.
export const UPSELLS: UpsellDef[] = [
  { key: 'fruit-juice', name: 'Fresh fruit juice', unit: JUICE[0], summary: 'Medium', flavours: ['Orange', 'Pineapple', 'Guava', 'Mix'] },
  { key: 'gelato-cone', name: 'Gelato cone', unit: GELATO_SCOOP, summary: '', flavours: GELATO_FLAVOURS },
];
