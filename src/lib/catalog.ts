// Shared business facts and pricing that more than one screen needs.
// Screen-specific menu data stays at the top of each component, mirroring the prototype.
import type { SizeKey, SizePrices } from './types';

export const SHOP = {
  name: 'Pizza King & Pasta',
  street: '10-511 Ray Lawson Blvd',
  cityLine: 'Brampton, ON L6Y 0N2',
  phoneText: '905-460-9494',
  phoneHref: 'tel:+19054609494',
  hoursDays: 'Every day',
  hoursText: '11 AM – 2 AM',
  mapsSearch: 'https://www.google.com/maps/search/?api=1&query=511+Ray+Lawson+Blvd+Brampton+ON',
  mapsDirections: 'https://www.google.com/maps/dir/?api=1&destination=511+Ray+Lawson+Blvd+Brampton+ON',
  mapsEmbed: 'https://www.google.com/maps?q=511+Ray+Lawson+Blvd,+Brampton,+ON+L6Y+0N2&z=15&output=embed',
} as const;

// Prices below match the shop's Square catalog (checked Nov 10, 2026). Square is the source of truth.
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
export const SIZE_NAMES: Record<SizeKey, string> = { S: 'Small', M: 'Medium', L: 'Large', XL: 'X-Large' };

export const HST = 0.13;
export const DELIVERY_FEE = 4.99;

/** Unsplash image URL, same params as the prototype. */
export const U = (id: string, w = 900) =>
  'https://images.unsplash.com/photo-' + id + '?fm=jpg&q=72&w=' + w + '&auto=format&fit=crop';

/** Build the credit/creditHref pair the prototype derives from `by`/`h`/`creditText`. */
export const creditOf = (o: { by?: string; h?: string; creditText?: string; creditHref?: string }) =>
  o.creditText
    ? { credit: o.creditText, creditHref: o.creditHref || '' }
    : { credit: o.by ? 'Photo by ' + o.by + ' on Unsplash' : '', creditHref: o.h ? 'https://unsplash.com/@' + o.h : '' };

/** Is the shop open right now (11:00–02:00, America/Toronto)? */
export function isShopOpen(): boolean {
  try {
    const h = +new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', hour: 'numeric', hourCycle: 'h23' }).format(new Date());
    return h >= 11 || h < 2;
  } catch {
    return true;
  }
}
