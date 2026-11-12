// Shared business facts and pricing that more than one screen needs.
// Screen-specific menu data stays at the top of each component, mirroring the prototype.

export const SHOP = {
  name: 'Pizza King & Pasta',
  street: '511 Ray Lawson Blvd, Unit 10',
  cityLine: 'Brampton, ON L6Y 0N2',
  phoneText: '905-460-9494',
  phoneHref: 'tel:+19054609494',
  hoursDays: 'Every day',
  hoursText: '4 PM – 2 AM',
  mapsSearch: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Pizza King & Pasta, 511 Ray Lawson Blvd Unit 10, Brampton, ON L6Y 0N2'),
  mapsDirections: 'https://www.google.com/maps/dir/?api=1&destination=511+Ray+Lawson+Blvd+Brampton+ON',
  mapsEmbed: 'https://www.google.com/maps?q=511+Ray+Lawson+Blvd,+Brampton,+ON+L6Y+0N2&z=15&output=embed',
  // Delivery is handled by the apps (the shop has no drivers). Swap in the commission-free
  // DoorDash Online Ordering / Uber Eats Webshop links once the owner turns them on.
  // DoorDash Storefront (commission-free web ordering; customer pays delivery). Store 24430450.
  doordash: 'https://order.online/business/pizza-king-and-pasta-38819',
  /** Uber Eats is shown greyed out as "Currently unavailable" until the owner turns it back on. */
  ubereatsAvailable: false,
  ubereats: 'https://www.ubereats.com/ca/store/pizza-king-&-pasta/j1VSW4wkX02MplHbVNOSpg',
  doordashLogo: 'assets/brands/doordash.svg',
  ubereatsLogo: 'assets/brands/ubereats.svg',
} as const;

// Prices live in ./pricing (shared with the payment server). Re-exported here for existing imports.
export { HST, PIZZA_PRICES, SIZE_NAMES, SIZE_PRICES, pricesFor } from './pricing';

export const DELIVERY_FEE = 4.99;

/** Unsplash image URL, same params as the prototype. */
export const U = (id: string, w = 900) => id.indexOf('assets/') === 0 ? id :
  'https://images.unsplash.com/photo-' + id + '?fm=jpg&q=72&w=' + w + '&auto=format&fit=crop';

/** Build the credit/creditHref pair the prototype derives from `by`/`h`/`creditText`. */
export const creditOf = (o: { by?: string; h?: string; creditText?: string; creditHref?: string }) =>
  o.creditText
    ? { credit: o.creditText, creditHref: o.creditHref || '' }
    : { credit: o.by ? 'Photo by ' + o.by + ' on Unsplash' : '', creditHref: o.h ? 'https://unsplash.com/@' + o.h : '' };

/** Is the shop open for ASAP orders right now (shared hours module, Toronto time). */
export { canOrderAsap as isShopOpen } from './hours';

/**
 * The one photo for each pizza (Unsplash id or local `assets/...` path). Home specials, the
 * Meat favourites page and the full menu all read from here, so a pizza looks the same everywhere.
 * Every photo must show that pizza's actual toppings.
 */
export const PIZZA_PHOTOS: Record<string, string> = {
  byo: '1593560708920-61dd98c46a4e',
  napoli: 'assets/pizzas/napoli.webp',
  'four-seasons': '1559978137-8c560d91e9e1',
  'italian-veg': '1617470702892-e01504297e84',
  'non-veg': '1600628421055-4d30de868b8f',
  bismark: 'assets/pizzas/bismark.webp',
  'sea-food': 'assets/pizzas/sea-food.webp',
  'chicken-shawarma': 'assets/pizzas/shawarma-chicken.webp',
  'butter-chicken': 'assets/pizzas/butter-chicken.png',
  'shahi-paneer': 'assets/pizzas/shahi-paneer.png',
  greek: '1573821663912-6df460f9c684',
  hawaiian: 'assets/pizzas/hawaiian.webp',
  'meat-lover': '1628840042765-356cda07504e',
  canadian: 'assets/pizzas/canadian-photo.webp',
  'tandoori-fish': 'assets/pizzas/tandoori-fish.webp',
  pepperoni: '1692737580547-b45bb4a02356',
};
/** Photo URL for a pizza id at width `w` (local assets pass through). */
export const pizzaPhoto = (id: string, w = 900) => (PIZZA_PHOTOS[id] ? U(PIZZA_PHOTOS[id], w) : '');
