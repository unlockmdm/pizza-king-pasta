// Search and sharing metadata for every page. Pure TS: used by the app (document title, meta tags on
// navigation) and by scripts/prerender.mts (per-page HTML files, sitemap, structured data).
// Titles stay under ~60 characters and descriptions under ~155 so Google shows them in full.

export const SITE_URL = 'https://pizzakingandpasta.ca';

export type PageId = 'home' | 'menu' | 'meat' | 'pasta' | 'wings' | 'juice' | 'gelato' | 'terms' | 'privacy';

export interface PageMeta {
  /** URL path segment ('' for the homepage). */
  slug: string;
  title: string;
  description: string;
  /** Main heading for the prerendered page body. */
  h1: string;
  /** Sitemap priority, 0–1. Legal pages are listed but low. */
  priority: number;
}

export const PAGES: Record<PageId, PageMeta> = {
  home: {
    slug: '',
    title: 'Indian Pizza in Brampton | Pizza King & Pasta',
    description: 'Indian pizza in Brampton: butter chicken, shahi paneer and tandoori pizza from a wood-fired oven, plus pasta and wings. Order online for pickup. Open till 2 AM.',
    h1: 'Indian pizza and wood-fired pizza in Brampton',
    priority: 1,
  },
  menu: {
    slug: 'menu',
    title: 'Menu: Pizza, Pasta, Wings & Drinks | Pizza King & Pasta',
    description: 'Full menu with prices: butter chicken, shahi paneer and classic pizzas, pickup combos, pasta, momos, tandoori wings, fresh juice and gelato in Brampton.',
    h1: 'Pizza King & Pasta menu',
    priority: 0.9,
  },
  meat: {
    slug: 'pizza',
    title: 'Butter Chicken & Paneer Pizza in Brampton | Pizza King & Pasta',
    description: 'Butter chicken, shahi paneer, shawarma chicken and tandoori pizzas, plus Meat Lover, Hawaiian and more. Wood-fired or conventional oven. Order for pickup.',
    h1: 'Indian-style and classic pizzas',
    priority: 0.9,
  },
  pasta: {
    slug: 'pasta',
    title: 'Pasta & Momos in Brampton | Pizza King & Pasta',
    description: 'Chicken, veggie or regular pasta in rosé, Alfredo or tomato sauce, cooked to order, plus steamed veggie and non-veggie momos. Order online for pickup in Brampton.',
    h1: 'Pasta and momos',
    priority: 0.8,
  },
  wings: {
    slug: 'wings',
    title: 'Tandoori Wings & Sides in Brampton | Pizza King & Pasta',
    description: 'Tandoori wings in hot, honey garlic or BBQ, tandoori chicken and fish, potato wedges, garlic bread, salads and fruit chaat. Order for pickup in Brampton.',
    h1: 'Tandoori wings and sides',
    priority: 0.8,
  },
  juice: {
    slug: 'drinks',
    title: 'Fresh Juice, Coffee & Chai in Brampton | Pizza King & Pasta',
    description: 'Fresh fruit and sugarcane juice, lemonade, masala tea, coffee, pop and beer. Order with your pizza for pickup at Pizza King & Pasta in Brampton.',
    h1: 'Juice, coffee and drinks',
    priority: 0.7,
  },
  gelato: {
    slug: 'gelato',
    title: 'Gelato & Thick Shakes in Brampton | Pizza King & Pasta',
    description: 'Gelato in a cone or cup and thick shakes in mango, strawberry, banana, badam and papaya. Order with your pizza for pickup in Brampton.',
    h1: 'Gelato and thick shakes',
    priority: 0.7,
  },
  terms: {
    slug: 'terms',
    title: 'Terms of Service | Pizza King & Pasta',
    description: 'Terms for ordering from Pizza King & Pasta in Brampton: pickup orders, payment, refunds, allergens and alcohol.',
    h1: 'Terms of Service',
    priority: 0.2,
  },
  privacy: {
    slug: 'privacy',
    title: 'Privacy Policy | Pizza King & Pasta',
    description: 'How Pizza King & Pasta collects, uses and protects your information when you order online.',
    h1: 'Privacy Policy',
    priority: 0.2,
  },
};

export const PAGE_IDS = Object.keys(PAGES) as PageId[];

/** Page for a URL path segment (e.g. 'pizza' -> 'meat'). Unknown -> undefined. */
export const pageForSlug = (slug: string): PageId | undefined => PAGE_IDS.find((id) => PAGES[id].slug === slug);

export const canonicalUrl = (id: PageId) => SITE_URL + '/' + PAGES[id].slug;
