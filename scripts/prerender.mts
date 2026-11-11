// Post-build: write one real HTML file per page (dist/index.html, dist/menu.html, dist/pizza.html, ...), each with
// its own title, description, canonical URL, social tags, structured data (schema.org Restaurant + Menu) and a
// readable copy of the page content. Search engines and link previews get full pages without running JavaScript;
// the React app replaces the content the moment it loads. Also writes sitemap.xml and robots.txt.
// Run with: tsx scripts/prerender.mts (part of `npm run build`).
import fs from 'node:fs';
import path from 'node:path';
import { PAGES, PAGE_IDS, SITE_URL, canonicalUrl, type PageId } from '../src/lib/seo.ts';
import { CAT_MENU, COMBOS, MENU_SECTIONS, MOMOS, PASTA_BASES, PASTA_SAUCES, PIZZAS, SIZE_KEYS, SIZE_NAMES, TOPPINGS, pricesFor } from '../src/lib/pricing/index.ts';
import { SHOP } from '../src/lib/catalog.ts';

const DIST = path.resolve('dist');
const template = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const money = (n: number) => '$' + n.toFixed(2);
const OG_IMAGE = SITE_URL + '/assets/pizza-king-and-pasta-brampton-wood-fired-indian-pizza.jpg';

// ---------------------------------------------------------------------------
// Structured data
// ---------------------------------------------------------------------------
const restaurant = {
  '@context': 'https://schema.org',
  '@type': 'Restaurant',
  '@id': SITE_URL + '/#restaurant',
  name: 'Pizza King & Pasta',
  url: SITE_URL + '/',
  image: [OG_IMAGE],
  logo: SITE_URL + '/apple-touch-icon.png',
  telephone: '+1-905-460-9494',
  priceRange: '$$',
  servesCuisine: ['Pizza', 'Indian', 'Italian', 'Pasta'],
  description: PAGES.home.description,
  address: { '@type': 'PostalAddress', streetAddress: '10-511 Ray Lawson Blvd', addressLocality: 'Brampton', addressRegion: 'ON', postalCode: 'L6Y 0N2', addressCountry: 'CA' },
  areaServed: { '@type': 'City', name: 'Brampton' },
  openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], opens: '16:00', closes: '02:00' }],
  hasMenu: SITE_URL + '/menu',
  acceptsReservations: 'False',
  paymentAccepted: 'Credit card, Debit card, Apple Pay, Google Pay',
  currenciesAccepted: 'CAD',
  sameAs: [SHOP.doordash],
  potentialAction: {
    '@type': 'OrderAction',
    target: { '@type': 'EntryPoint', urlTemplate: SITE_URL + '/menu', inLanguage: 'en-CA', actionPlatform: ['https://schema.org/DesktopWebPlatform', 'https://schema.org/MobileWebPlatform'] },
    deliveryMethod: ['http://purl.org/goodrelations/v1#DeliveryModePickUp'],
  },
};

const offer = (prices: number[]) =>
  prices.length === 1
    ? { '@type': 'Offer', price: prices[0].toFixed(2), priceCurrency: 'CAD' }
    : { '@type': 'AggregateOffer', lowPrice: Math.min(...prices).toFixed(2), highPrice: Math.max(...prices).toFixed(2), priceCurrency: 'CAD' };

const menuLd = {
  '@context': 'https://schema.org',
  '@type': 'Menu',
  '@id': SITE_URL + '/menu#menu',
  name: 'Pizza King & Pasta menu',
  url: SITE_URL + '/menu',
  inLanguage: 'en-CA',
  hasMenuSection: [
    {
      '@type': 'MenuSection',
      name: 'Pizzas',
      description: 'Small, medium, large or X-large. Wood-fired or conventional oven. Build your own includes 4 toppings (meat and paneer count as 2).',
      hasMenuItem: Object.entries(PIZZAS).map(([k, p]) => ({
        '@type': 'MenuItem',
        name: k === 'byo' ? 'Build your own pizza' : p.name + ' pizza',
        ...(p.tops.length ? { description: p.tops.map((t) => TOPPINGS[t]?.name || t).join(', ') } : {}),
        offers: offer(SIZE_KEYS.map((z) => pricesFor(k)[z])),
      })),
    },
    {
      '@type': 'MenuSection',
      name: 'Pickup combos',
      hasMenuItem: Object.values(COMBOS).map((c) => ({ '@type': 'MenuItem', name: c.name + ' combo', offers: offer([c.price]) })),
    },
    ...MENU_SECTIONS.map((sec) => ({
    '@type': 'MenuSection',
    name: sec.title,
    hasMenuItem: sec.rows.map(([, name, desc, opts, veg]) => ({
      '@type': 'MenuItem',
      name,
      ...(desc ? { description: desc } : {}),
      ...(opts.length ? { offers: offer(opts.map(([, p]) => p)) } : {}),
      ...(veg ? { suitableForDiet: 'https://schema.org/VegetarianDiet' } : {}),
    })),
  })),
  ],
};

const breadcrumb = (id: PageId) =>
  id === 'home'
    ? null
    : {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL + '/' },
          { '@type': 'ListItem', position: 2, name: PAGES[id].h1, item: canonicalUrl(id) },
        ],
      };

// ---------------------------------------------------------------------------
// Readable page content (replaced by the app when JavaScript runs)
// ---------------------------------------------------------------------------
const NAV: [PageId, string][] = [['home', 'Home'], ['menu', 'Menu'], ['meat', 'Pizzas'], ['pasta', 'Pasta & momos'], ['wings', 'Wings & sides'], ['juice', 'Drinks'], ['gelato', 'Gelato & shakes']];
const link = (id: PageId, text: string) => '<a href="' + (id === 'home' ? './' : PAGES[id].slug) + '">' + esc(text) + '</a>';
const list = (items: string[]) => '<ul>' + items.map((i) => '<li>' + i + '</li>').join('') + '</ul>';
const sizePrices = (id: string) => SIZE_KEYS.map((k) => SIZE_NAMES[k] + ' ' + money(pricesFor(id)[k])).join(', ');

const visit =
  '<h2>Visit or order</h2><p>' + esc(SHOP.street) + ', Brampton, ON L6Y 0N2. Phone <a href="tel:+19054609494">905-460-9494</a>. ' +
  'Open every day, ' + esc(SHOP.hoursText) + '. Order online for pickup, or get delivery through DoorDash.</p>';

function body(id: PageId): string {
  const m = PAGES[id];
  let main = '';
  if (id === 'home') {
    main =
      '<p>Pizza King &amp; Pasta is a pizza shop on Ray Lawson Blvd in Brampton. We make Indian-style (desi) pizzas such as butter chicken, shahi paneer, shawarma chicken and tandoori fish, ' +
      'classic pizzas like Meat Lover, Hawaiian and Greek, and build-your-own pizzas, baked in a wood-fired or conventional oven. We also serve pasta, steamed momos, tandoori wings, fresh juice, lassi and gelato, and we are open late, until 2 AM every night.</p>' +
      '<h2>Popular pizzas</h2>' + list(['Butter Chicken', 'Shahi Paneer', 'Shawarma Chicken', 'Tandoori Fish', 'Meat Lover', 'Hawaiian'].map((n) => esc(n) + ' pizza')) +
      '<h2>Pickup combos</h2>' + list(Object.values(COMBOS).map((c) => esc(c.name) + ' combo: ' + money(c.price)));
  } else if (id === 'menu') {
    main = '<h2>Pizzas</h2>' + list(Object.entries(PIZZAS).map(([k, p]) => '<strong>' + esc(k === 'byo' ? 'Build your own' : p.name) + '</strong>: ' + sizePrices(k))) +
      '<h2>Pickup combos</h2>' + list(Object.values(COMBOS).map((c) => esc(c.name) + ' combo ' + money(c.price))) +
      MENU_SECTIONS.map((sec) => '<h2>' + esc(sec.title) + '</h2>' + list(sec.rows.map(([, name, desc, opts]) => '<strong>' + esc(name) + '</strong>' + (desc ? ': ' + esc(desc) : '') + (opts.length ? ' (' + opts.map(([l, p]) => (l ? esc(l) + ' ' : '') + money(p)).join(', ') + ')' : '')))).join('');
  } else if (id === 'meat') {
    main = '<p>Choose small, medium, large or X-large, regular, thin or thick crust, and the wood-fired or conventional oven. Every pizza is cut into triangles.</p>' +
      list(Object.entries(PIZZAS).filter(([k]) => k !== 'byo').map(([k, p]) => '<strong>' + esc(p.name) + ' pizza</strong>: ' + esc(p.tops.map((t) => TOPPINGS[t]?.name || t).join(', ')) + '. ' + sizePrices(k))) +
      '<p><strong>Build your own</strong>: 4 toppings included (meat and paneer count as 2). ' + sizePrices('byo') + '.</p>';
  } else if (id === 'pasta') {
    main = '<h2>Pasta</h2>' + list(PASTA_BASES.map((b) => '<strong>' + esc(b.name) + ' pasta</strong>: ' + esc(b.desc) + '. ' + PASTA_SAUCES.filter(([s]) => b.p[s] != null).map(([s, n]) => esc(n) + ' ' + money(b.p[s] as number)).join(', '))) +
      '<h2>Steamed momos</h2>' + list(MOMOS.map(([, n, p]) => esc(n) + ' momos ' + money(p)));
  } else if (id === 'wings' || id === 'juice' || id === 'gelato') {
    main = list(CAT_MENU[id].items.map((it) => {
      const prices = (it.groups || []).flatMap((g) => g.opts.map((o) => o.price)).filter((p): p is number => p != null).concat(it.price != null ? [it.price] : []);
      const range = prices.length ? ' (' + (Math.min(...prices) === Math.max(...prices) ? money(prices[0]) : 'from ' + money(Math.min(...prices))) + ')' : '';
      return '<strong>' + esc(it.name) + '</strong>' + (it.desc ? ': ' + esc(it.desc) : '') + range;
    }));
  } else {
    main = '<p>' + esc(m.description) + '</p>';
  }
  return (
    '<div style="font-family:Figtree,system-ui,sans-serif;color:#1A1414;max-width:760px;margin:0 auto;padding:24px 16px;line-height:1.55">' +
    '<nav aria-label="Pages" style="display:flex;flex-wrap:wrap;gap:6px 14px;font-size:14px">' + NAV.map(([p, t]) => link(p, t)).join('') + '</nav>' +
    '<h1 style="font-size:32px;line-height:1.1;margin:20px 0 12px">' + esc(m.h1) + '</h1>' + main + visit + '</div>'
  );
}

// ---------------------------------------------------------------------------
// Write the pages
// ---------------------------------------------------------------------------
const setTag = (html: string, re: RegExp, value: string) => {
  if (!re.test(html)) throw new Error('prerender: template is missing ' + re);
  return html.replace(re, (_m, a: string, b: string) => a + esc(value) + b);
};

for (const id of PAGE_IDS) {
  const m = PAGES[id];
  let html = template;
  html = html.replace(/<title>[^<]*<\/title>/, '<title>' + esc(m.title) + '</title>');
  html = setTag(html, /(<meta name="description" content=")[^"]*(")/, m.description);
  html = setTag(html, /(<link rel="canonical" href=")[^"]*(")/, canonicalUrl(id));
  html = setTag(html, /(<meta property="og:title" content=")[^"]*(")/, m.title);
  html = setTag(html, /(<meta property="og:description" content=")[^"]*(")/, m.description);
  html = setTag(html, /(<meta property="og:url" content=")[^"]*(")/, canonicalUrl(id));
  if (id === 'terms' || id === 'privacy') html = html.replace('content="index, follow, max-image-preview:large"', 'content="index, follow"');
  const ld = [restaurant, id === 'menu' ? menuLd : null, breadcrumb(id)].filter(Boolean);
  html = html.replace('<!--SEO-JSONLD-->', ld.map((o) => '<script type="application/ld+json">' + JSON.stringify(o).replace(/</g, '\\u003c') + '</script>').join('\n    '));
  html = html.replace('<!--SEO-BODY-->', body(id));
  fs.writeFileSync(path.join(DIST, id === 'home' ? 'index.html' : m.slug + '.html'), html);
}

const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(
  path.join(DIST, 'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    PAGE_IDS.map((id) => '  <url><loc>' + canonicalUrl(id) + '</loc><lastmod>' + today + '</lastmod><priority>' + PAGES[id].priority.toFixed(1) + '</priority></url>').join('\n') +
    '\n</urlset>\n',
);
fs.writeFileSync(path.join(DIST, 'robots.txt'), 'User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ' + SITE_URL + '/sitemap.xml\n');
console.log('prerendered ' + PAGE_IDS.length + ' pages, sitemap.xml and robots.txt');
