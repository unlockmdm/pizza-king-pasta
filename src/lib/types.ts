// Shared types. Component prop interfaces live here so every screen is coded against the same contract.

export type Mode = 'pickup' | 'delivery';
export type SizeKey = 'S' | 'M' | 'L' | 'XL';
export type SizePrices = Record<SizeKey, number>;

/** One line in the cart. `key` encodes the item + its options so identical builds merge. */
export interface CartLine {
  key: string;
  name: string;
  summary?: string;
  /** Unit price in dollars. */
  unit: number;
  qty: number;
  /** Optional thumbnail. If omitted, the shell guesses one from the name. */
  img?: string;
  /** Free-form detail (e.g. chosen toppings) for the receipt / future Square order. */
  meta?: Record<string, unknown>;
}

/** A line about to be added (qty passed separately). */
export type NewLine = Omit<CartLine, 'qty'>;
export type OnAdd = (line: NewLine, qty?: number) => void;

/** A pickup combo (walk-in special). */
export interface Deal {
  id: string;
  name: string;
  price: number;
  desc: string;
  img?: string;
  credit?: string;
  creditHref?: string;
}

/** What the Pizza Builder opens with: a special, Build Your Own, or a custom item from a category page. */
export interface BuilderItem {
  id: string;
  name: string;
  desc?: string;
  /** Topping ids already on the pizza (see TOPS in PizzaBuilder). */
  tops: string[];
  /** Number of toppings included in the base price (BYO = 4). */
  included?: number;
  veg?: boolean;
  tag?: string;
  img?: string;
  credit?: string;
  creditHref?: string;
  /** Size prices for this pizza, if they differ from the standard SIZE_PRICES (from Square). */
  prices?: SizePrices;
  [extra: string]: unknown;
}

/** Topping placement on the pizza. */
export type Half = 'left' | 'whole' | 'right';

/**
 * The Pizza Builder's chosen options (prototype field names, verbatim).
 * PizzaBuilder sends it back on every add: as `line.meta`, and also as a 3rd `onAdd`
 * argument (prototype signature `onAdd(line, qty, cfg)`). The Combo Builder stores it
 * per pizza and passes it back as `ComboContext.init` to reopen that pizza for editing.
 */
export type PizzaConfig = {
  tops: Record<string, Half>;
  free: Record<string, boolean>;
  crust: string;
  bake: string;
  sauce: string;
  cheese: string;
  /** Spice level (Square: Pizza Spice Level). */
  spice?: string;
  doneness: string;
  cut: string;
  notes: string;
  /** Price above the size's base price (extra toppings). 0 when everything is included. */
  extra: number;
  /** Topping names, with " (left half)" / " (right half)" suffixes. */
  topNames: string[];
  crustName: string;
  sauceName: string;
  cheeseName: string;
};

/**
 * Context passed when the Pizza Builder is opened from the Combo Builder
 * (prototype `editCombo`: `{ size, btn, init }`).
 * The matching `item` is `{ id: 'byo', name, desc, tops: [], included: <deal toppings> }`.
 */
export type ComboContext = {
  /** The combo's pizza size; the builder locks to it. */
  size: SizeKey;
  /** Add button label, e.g. "Save pizza 1" or "Add to order". Defaults to "Save pizza". */
  btn?: string;
  /** Previously saved config for this pizza (the cfg from an earlier save), restored on open. */
  init?: Partial<PizzaConfig> | null;
};

// ---------- Component props ----------

export interface PizzaBuilderProps {
  item: BuilderItem;
  sizePrices: SizePrices;
  combo?: ComboContext;
  onClose: () => void;
  onAdd: OnAdd;
}

export interface ComboBuilderProps {
  deal: Deal;
  sizePrices: SizePrices;
  onClose: () => void;
  onAdd: OnAdd;
}

export interface MenuPageProps {
  onAdd: OnAdd;
  /** Open the combo builder for a walk-in special (shell handles pickup-only switch). */
  onDeal: (id: string) => void;
}

export type CategoryId = 'wings' | 'juice' | 'gelato';

export interface CategoryPageProps {
  category: CategoryId;
  onAdd: OnAdd;
  onBack: () => void;
  onMenu: () => void;
}

export interface PastaPageProps {
  onAdd: OnAdd;
  onBack: () => void;
  onMenu: () => void;
}

export interface MeatFavouritesProps {
  onAdd: OnAdd;
  onCustomize: (item: BuilderItem) => void;
  onBack: () => void;
  onMenu: () => void;
  onBuild: () => void;
}

export interface CartCheckoutProps {
  pageBg: string;
  lines: CartLine[];
  mode: Mode;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onQty: (key: string, delta: number) => void;
  onAdd: (line: NewLine) => void;
  onMode: (m: Mode) => void;
  /** "Browse the menu" from the empty cart. */
  onBrowse: () => void;
  /** Order placed: shell clears the cart. */
  onPlaced: () => void;
  /** Pickup time from the start sheet: 'asap' or a slot label like "7:30 PM". */
  when?: string;
}
