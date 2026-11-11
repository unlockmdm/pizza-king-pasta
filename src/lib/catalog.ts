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
  mapsSearch: 'https://www.google.com/maps/search/?api=1&query=511+Ray+Lawson+Blvd+Brampton+ON',
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
export const U = (id: string, w = 900) =>
  'https://images.unsplash.com/photo-' + id + '?fm=jpg&q=72&w=' + w + '&auto=format&fit=crop';

/** Build the credit/creditHref pair the prototype derives from `by`/`h`/`creditText`. */
export const creditOf = (o: { by?: string; h?: string; creditText?: string; creditHref?: string }) =>
  o.creditText
    ? { credit: o.creditText, creditHref: o.creditHref || '' }
    : { credit: o.by ? 'Photo by ' + o.by + ' on Unsplash' : '', creditHref: o.h ? 'https://unsplash.com/@' + o.h : '' };

/** Is the shop open for ASAP orders right now (shared hours module, Toronto time). */
export { canOrderAsap as isShopOpen } from './hours';
