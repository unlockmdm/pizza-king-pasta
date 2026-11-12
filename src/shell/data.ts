// Homepage data, ported verbatim from `Pizza King Home v2.dc.html`. These arrays are the spec.
import { U } from '../lib/catalog';
import { money } from '../lib/format';
import { COMBOS } from '../lib/pricing';
import type { BuilderItem, Deal } from '../lib/types';

export interface Special {
  id: string;
  name: string;
  desc: string;
  veg: boolean;
  tag?: string;
  img: string;
  by: string;
  h: string;
}

export const SPECIALS: Special[] = [
  { id: 'shahi-paneer', name: 'Shahi Paneer', desc: 'Tandoori paneer, green peppers, red onions, jalapeños', veg: true, img: U('1655673654158-9f7285b7d1ea'), by: 'RUSU CIPRIAN', h: 'tehnosign' },
  { id: 'butter-chicken', name: 'Butter Chicken', desc: 'Tandoori chicken, green peppers, red onions', veg: false, img: U('1604382354936-07c5d9983bd3'), by: 'Shourav Sheikh', h: 'shouravsheikh' },
  { id: 'chicken-shawarma', name: 'Shawarma Chicken', desc: 'Garlic base, shawarma chicken, hot peppers, red onions', veg: false, tag: 'Spicy', img: 'assets/pizzas/shawarma-chicken.webp', by: '', h: '' },
  { id: 'meat-lover', name: 'Meat Lover', desc: 'Pepperoni, ham, bacon, sausage', veg: false, img: U('1692737580547-b45bb4a02356'), by: 'David Foodphototasty', h: 'phototastyfood' },
];

export const DEALS: (Deal & { by: string; h: string })[] = [
  { id: 'one-large', name: COMBOS['one-large'].name, price: COMBOS['one-large'].price, desc: '1 large pizza with 1 topping, wood-fired or conventional oven', img: U('1593560708920-61dd98c46a4e'), by: 'Saundarya Srinivasan', h: 'saundiii' },
  { id: 'two-large', name: COMBOS['two-large'].name, price: COMBOS['two-large'].price, desc: '2 large pizzas with 4 toppings each (meat counts as 2), 2 dips, 2 pops, plus sugarcane juice or wood-oven corn', img: U('1604382355076-af4b0eb60143'), by: 'Shourav Sheikh', h: 'shouravsheikh' },
  { id: 'two-medium', name: COMBOS['two-medium'].name, price: COMBOS['two-medium'].price, desc: '2 medium pizzas with 4 toppings each (meat counts as 2), 2 dips, 2 pops, plus sugarcane juice or wood-oven corn', img: U('1682264788192-9abdec90c425'), by: 'Joanie Simon', h: 'joaniesimon' },
  { id: 'two-small', name: COMBOS['two-small'].name, price: COMBOS['two-small'].price, desc: '2 small pizzas with 4 toppings each (meat counts as 2) and 2 dips', img: U('1600628421066-f6bda6a7b976'), by: 'Klara Kulikova', h: 'kkalerry' },
];

export type TileId = 'byo' | 'specials' | 'meat' | 'combos' | 'pasta' | 'wings' | 'juice' | 'gelato';
export interface Tile {
  id: TileId;
  name: string;
  sub: string;
  bg: string;
  fg: string;
  img: string;
  by?: string;
  h?: string;
  creditText?: string;
  target?: string;
}

export const TILES: Tile[] = [
  { id: 'byo', name: 'Build your own', sub: '4 toppings · meat counts as 2', bg: '#EDEDF0', fg: '#1A1414', img: U('1593560708920-61dd98c46a4e'), by: 'Saundarya Srinivasan', h: 'saundiii' },
  { id: 'specials', name: 'House specials', sub: 'Indian-fusion and classic', bg: '#D7192D', fg: '#fff', img: U('1565299624946-b28f40a0ae38'), by: 'Chad Montano', h: 'briewilly', target: 'bestsellers' },
  { id: 'meat', name: 'Meat favourites', sub: 'Pepperoni, bacon, sausage', bg: '#C2511F', fg: '#fff', img: U('1611915365928-565c527a0590'), by: 'Tamas Pap', h: 'tamasp' },
  { id: 'combos', name: 'Pickup combos', sub: 'From ' + money(Math.min(...Object.values(COMBOS).map((c) => c.price))), bg: '#1A1414', fg: '#fff', img: U('1594007654729-407eedc4be65'), by: 'Saahil Khatkhate', h: 'saahilkhatkhate', target: 'deals' },
  { id: 'pasta', name: 'Pasta & momos', sub: 'Rosé, Alfredo, tomato', bg: '#F2B53A', fg: '#1A1414', img: 'assets/menu/pasta.jpg', creditText: 'Photo: Dllu, Wikimedia Commons, CC BY-SA 4.0' },
  { id: 'wings', name: 'Wings & sides', sub: 'Wings, tandoori, salads, sides', bg: '#7A2E1D', fg: '#fff', img: 'assets/ingredients/tandoori-chicken.png' },
  { id: 'juice', name: 'Drinks', sub: 'Juice, lassi, coffee, beer', bg: '#1E6E6A', fg: '#fff', img: 'assets/menu/juice-mix-red.webp', creditText: 'Photo: JIP, Wikimedia Commons, CC BY-SA 4.0' },
  { id: 'gelato', name: 'Gelato & shakes', sub: 'Cones, cups, thick shakes', bg: '#F4C6CF', fg: '#1A1414', img: 'assets/menu/gelato.jpg', creditText: 'Photo: Rizka Budiati, Wikimedia Commons, CC BY 2.0' },
];

/** Toppings already on each house special when it opens in the builder. */
// Same toppings as the shared pricing data (PIZZAS), listed in the homepage's own order (it sets the scatter on the live pizza).
// Prices never depend on this order: the builder and the server count toppings from the spec.
export const BASE_TOPS: Record<string, string[]> = {
  'shahi-paneer': ['paneer', 'green-peppers', 'red-onions', 'jalapenos'],
  'butter-chicken': ['tandoori-chicken', 'green-peppers', 'red-onions'],
  'chicken-shawarma': ['shawarma-chicken', 'red-onions', 'hot-peppers'],
  'meat-lover': ['pepperoni', 'ham', 'bacon', 'sausage'],
};

export const BYO: BuilderItem & { by: string; h: string } = {
  id: 'byo', name: 'Build Your Own', desc: '4 toppings included (meat counts as 2)', tops: [], included: 4,
  img: U('1593560708920-61dd98c46a4e', 1000), by: 'Saundarya Srinivasan', h: 'saundiii',
};

/** Build Your Own tile animation: [label, cut-out ids, piece width px]. */
export const BYO_SETS: [string, string[], number][][] = [
  [['Pepperoni', ['pep-0', 'pep-1'], 48], ['Mushrooms', ['mushroom-0', 'mushroom-1'], 40], ['Green peppers', ['gp-0', 'gp-1', 'gp-2', 'gp-3'], 34], ['Black olives', ['bol-0'], 24]],
  [['Shahi paneer', ['shahi-0', 'shahi-1', 'shahi-2'], 30], ['Red onions', ['onion-0', 'onion-1'], 34], ['Green peppers', ['gp-0', 'gp-2'], 34], ['Jalapeños', ['jal-0'], 28]],
  [['Tandoori chicken', ['tand-0', 'tand-1'], 38], ['Red onions', ['onion-0', 'onion-1'], 34], ['Red peppers', ['rp-0', 'rp-1', 'rp-2'], 34], ['Pineapple', ['pine-0'], 32]],
  [['Pepperoni', ['pep-0', 'pep-1'], 48], ['Italian sausage', ['isaus-0'], 32], ['Bacon', ['bacon-0'], 46], ['Black olives', ['bol-0'], 24]],
  [['Broccoli', ['broc-0'], 40], ['Tomatoes', ['tomato-0'], 40], ['Green olives', ['gol-0'], 24], ['Sweet corn', ['corn-0', 'corn-2', 'corn-4', 'corn-6'], 16]],
  [['Grilled chicken', ['grilled-0', 'grilled-1'], 44], ['Mushrooms', ['mushroom-0', 'mushroom-1'], 40], ['Red onions', ['onion-0', 'onion-1'], 34], ['Jalapeños', ['jal-0'], 28]],
];

/** Footer FAQ: short, factual answers (also what people tend to search for). */
export const FAQ: [string, string][] = [
  ['What is Indian-style (desi) pizza?', 'Pizza with Indian flavours: butter chicken or shahi paneer sauce, tandoori chicken or paneer, green chilli, ginger and coriander. Pick a desi pizza from the menu, or build your own with these toppings.'],
  ['What are your hours?', 'Every day, 4 PM to 2 AM. You can also order ahead online and pick a later pickup time.'],
  ['Do you deliver?', 'Delivery is through DoorDash. For pickup, order on this website and pay online, then collect your order at the counter.'],
  ['Where are you located?', '511 Ray Lawson Blvd, Unit 10, Brampton, ON L6Y 0N2. Call us at 905-460-9494.'],
  ['Can I choose the oven?', 'Yes. Every pizza can be baked in our wood-fired oven or a conventional oven, at the same price.'],
  ['How many slices are in each size?', 'Small 6, medium 8, large 10 and X-large 12. Every pizza is cut into triangles.'],
];
