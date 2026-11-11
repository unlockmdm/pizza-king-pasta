// App shell: ported from `Pizza King Home v2.dc.html` (the prototype's root component).
// Owns the cart, pickup/delivery mode, which in-place page is showing, and the open sheets.
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import CartCheckout from './components/CartCheckout';
import CategoryPage from './components/CategoryPage';
import ComboBuilder from './components/ComboBuilder';
import MeatFavourites from './components/MeatFavourites';
import MenuPage from './components/MenuPage';
import PastaPage from './components/PastaPage';
import PizzaBuilder, { preloadPizzaImages } from './components/PizzaBuilder';
import { creditOf, isShopOpen, pricesFor, SIZE_PRICES } from './lib/catalog';
import { money } from './lib/format';
import { useWidth } from './lib/hooks';
import type { BuilderItem, CartLine, Mode, NewLine } from './lib/types';
import { BASE_TOPS, BYO, DEALS, SPECIALS, type Tile } from './shell/data';
import Footer from './shell/Footer';
import Header from './shell/Header';
import HomeSections from './shell/HomeSections';
import StartSheet from './shell/StartSheet';
import { AddedToast, InfoToast, type Added } from './shell/Toasts';

type View = 'home' | 'menu' | 'pasta' | 'meat' | 'wings' | 'juice' | 'gelato';
const VIEWS: View[] = ['home', 'menu', 'pasta', 'meat', 'wings', 'juice', 'gelato'];
const CART_KEY = 'pkp-home-v2-cart';
const MODE_KEY = 'pkp-v2-mode';

const readJSON = <T,>(k: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};
const writeJSON = (k: string, v: unknown) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* storage unavailable (private mode): the site still works, it just won't remember */
  }
};
const viewFromUrl = (): View => {
  const v = new URLSearchParams(window.location.search).get('view') as View | null;
  return v && VIEWS.includes(v) ? v : 'home';
};

/** Thumbnail for the "Added" toast when a line doesn't bring its own image. */
function guessImg(t: string) {
  t = t.toLowerCase();
  if (/juice|lassi|sugarcane|coconut/.test(t)) return 'assets/menu/juice-mix.png';
  if (/gelato|shake|scoop|cone/.test(t)) return 'assets/menu/gelato.jpg';
  if (/pasta|penne|spaghetti|alfredo|ros[eé]|momo/.test(t)) return 'assets/menu/pasta.jpg';
  if (/pizza|combo|crust|small|medium|large|paneer|pepperoni|meat|veg/.test(t)) return 'assets/pizza-base.webp';
  return '';
}

type SavedMode = { mode: Mode; addr: string; when: string } | null;

export default function App() {
  const w = useWidth();
  const saved = useMemo(() => readJSON<SavedMode>(MODE_KEY, null), []);

  // The site is pickup-only (delivery goes through DoorDash / Uber Eats).
  const [mode, setMode] = useState<Mode | null>(saved ? 'pickup' : null);
  const [addr, setAddr] = useState(saved?.addr ?? '');
  const [when, setWhen] = useState(saved?.when ?? 'asap');
  const [cart, setCart] = useState<CartLine[]>(() => {
    const c = readJSON<unknown>(CART_KEY, []);
    return Array.isArray(c) ? (c as CartLine[]) : [];
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [view, setViewState] = useState<View>(viewFromUrl);
  // Start sheet: shown on a first visit (no saved pickup/delivery choice yet).
  const [welcome, setWelcome] = useState(!saved);
  const [wMode, setWMode] = useState<Mode>('pickup');
  const [addrErr, setAddrErr] = useState('');
  const [item, setItem] = useState<{ id: string; custom?: BuilderItem } | null>(null);
  const [combo, setCombo] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; cart: boolean } | null>(null);
  const [added, setAdded] = useState<Added | null>(null);

  const open = isShopOpen();
  const pickup = true;
  void mode;
  const count = cart.reduce((a, l) => a + l.qty, 0);

  // ---- timers / pointer tracking ----
  const toastT = useRef<number>();
  const addedT = useRef<number>();
  const addN = useRef(0);
  const lastPt = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const onPt = (e: PointerEvent) => { lastPt.current = { x: e.clientX, y: e.clientY }; };
    document.addEventListener('pointerdown', onPt, true);
    return () => document.removeEventListener('pointerdown', onPt, true);
  }, []);

  // Warm the pizza builder's images once the page has settled, so opening it is instant.
  useEffect(() => {
    const t = window.setTimeout(() => {
      const ric = (window as unknown as { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback;
      if (ric) ric(preloadPizzaImages); else preloadPizzaImages();
    }, 2500);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => writeJSON(CART_KEY, cart), [cart]);
  useEffect(() => { if (mode) writeJSON(MODE_KEY, { mode: 'pickup', addr: '', when }); }, [mode, when]);

  // Escape closes the start sheet and cart (builders handle their own Escape).
  useEffect(() => {
    const on = (e: KeyboardEvent) => { if (e.key === 'Escape') { setWelcome(false); setCartOpen(false); } };
    document.addEventListener('keydown', on);
    return () => document.removeEventListener('keydown', on);
  }, []);

  // ---- in-place pages, with browser Back support ----
  const setView = useCallback((v: View) => {
    setViewState(v);
    const url = v === 'home' ? window.location.pathname : '?view=' + v;
    if (viewFromUrl() !== v) window.history.pushState({ view: v }, '', url);
  }, []);
  useEffect(() => {
    const onPop = () => setViewState(viewFromUrl());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 84, behavior: 'smooth' });
  };
  /** Scroll to a homepage section, switching back to the homepage first if needed. */
  const goSection = (id: string) => (e?: MouseEvent) => {
    e?.preventDefault();
    if (view !== 'home') {
      setView('home');
      setTimeout(() => scrollToId(id), 60);
    } else scrollToId(id);
  };
  const openView = (v: View) => (e?: MouseEvent) => {
    e?.preventDefault();
    setView(v);
    window.scrollTo({ top: 0 });
  };
  const openMenu = openView('menu');
  const backToTiles = () => { setView('home'); setTimeout(() => scrollToId('menu'), 60); };

  // ---- toasts ----
  const showToast = (text: string, withCart = false) => {
    clearTimeout(toastT.current);
    setToast({ text, cart: withCart });
    toastT.current = window.setTimeout(() => setToast(null), 2600);
  };

  /** "+1" dot that flies from the tap point to the cart. */
  const flyDot = (q: number) => {
    const p = lastPt.current;
    if (!p || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const dot = document.createElement('div');
    dot.textContent = '+' + q;
    Object.assign(dot.style, { position: 'fixed', left: p.x - 22 + 'px', top: p.y - 22 + 'px', width: '44px', height: '44px', borderRadius: '50%', background: '#D7192D', color: '#fff', font: "900 15px 'Figtree',system-ui,sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: '300', pointerEvents: 'none', boxShadow: '0 10px 24px rgba(215,25,45,.4)' });
    document.body.appendChild(dot);
    const tx = window.innerWidth - 140 - p.x, ty = window.innerHeight - 44 - p.y;
    const an = dot.animate?.([
      { transform: 'translate(0,0) scale(.4)', opacity: 0 },
      { transform: 'translate(' + tx * 0.15 + 'px,' + (ty * 0.15 - 90) + 'px) scale(1.15)', opacity: 1, offset: 0.25 },
      { transform: 'translate(' + tx + 'px,' + ty + 'px) scale(.5)', opacity: 0.9 },
    ], { duration: 750, easing: 'cubic-bezier(.5,0,.75,1)' });
    if (an) an.onfinish = () => dot.remove(); else dot.remove();
  };

  // ---- cart ----
  const addLine = (line: NewLine, n?: number) => {
    const q = n || 1;
    setCart((c) => {
      const i = c.findIndex((l) => l.key === line.key);
      if (i >= 0) return c.map((l, j) => (j === i ? { ...l, qty: l.qty + q } : l));
      return [...c, { ...line, qty: q }];
    });
    clearTimeout(addedT.current);
    setToast(null);
    setAdded({
      n: ++addN.current,
      img: 'img' in line && line.img !== undefined ? line.img : guessImg(line.name + ' ' + (line.summary || '')),
      name: line.name,
      summary: line.summary || '',
      price: money((line.unit || 0) * q),
      qty: q,
    });
    addedT.current = window.setTimeout(() => setAdded(null), 3800);
    flyDot(q);
  };
  const changeQty = (key: string, d: number) => setCart((c) => c.map((l) => (l.key === key ? { ...l, qty: l.qty + d } : l)).filter((l) => l.qty > 0));

  // ---- start sheet ----
  const openStart = (tab: Mode = 'pickup') => { setWMode(tab); setAddrErr(''); setWelcome(true); };
  const confirmWelcome = () => {
    setMode('pickup');
    setWelcome(false);
    setAddrErr('');
    showToast('Pickup' + (when === 'asap' ? ', as soon as possible' : ' at ' + when));
  };

  // ---- combos (pickup only) ----
  const addDeal = (id: string) => setCombo(id);

  const onTile = (t: Tile) => {
    if (t.id === 'byo') setItem({ id: 'byo' });
    else if (t.id === 'meat' || t.id === 'pasta' || t.id === 'wings' || t.id === 'juice' || t.id === 'gelato') openView(t.id)();
    else if (t.target) scrollToId(t.target);
  };

  // What the Pizza Builder opens with.
  const builderItem: BuilderItem | null = (() => {
    if (!item) return null;
    if (item.custom) return item.custom;
    if (item.id === 'byo') return { ...BYO, ...creditOf(BYO) };
    const p = SPECIALS.find((x) => x.id === item.id);
    return p ? { ...p, ...creditOf(p), img: p.img.replace('w=900', 'w=1000'), tops: BASE_TOPS[p.id] || [], prices: pricesFor(p.id) } : null;
  })();
  const comboDeal = combo ? DEALS.find((d) => d.id === combo) ?? null : null;

  const modeLabel = w < 480 ? 'Pickup' : when === 'asap' ? 'Pickup · ' + (open ? 'ASAP' : '11 AM') : 'Pickup · ' + when;
  const toastBottom = count > 0 ? '100px' : '24px';
  const ctaText = open ? 'Start your order' : 'Order for later';

  const pageProps = { onAdd: addLine, onBack: backToTiles, onMenu: () => openMenu() };

  return (
    <>
      <Header
        w={w}
        modeLabel={modeLabel}
        cartCount={count}
        onHome={(e) => { e?.preventDefault(); setView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        onMenu={openMenu}
        onBest={goSection('bestsellers')}
        onDeals={goSection('deals')}
        onVisit={goSection('visit')}
        onStart={() => openStart()}
        onCart={() => { setCartOpen(true); setToast(null); }}
      />

      {view === 'home' && (
        <HomeSections
          w={w}
          h={{
            onStart: () => openStart(),
            onMenu: openMenu,
            onTwoLarge: () => addDeal('two-large'),
            onByo: () => setItem({ id: 'byo' }),
            onPasta: openView('pasta'),
            onTile,
            onSpecial: (id) => setItem({ id }),
            onDeal: addDeal,
          }}
        />
      )}
      {view === 'menu' && <MenuPage onAdd={addLine} onDeal={addDeal} />}
      {(view === 'wings' || view === 'juice' || view === 'gelato') && <CategoryPage key={view} category={view} {...pageProps} />}
      {view === 'pasta' && <PastaPage {...pageProps} />}
      {view === 'meat' && (
        <MeatFavourites {...pageProps} onCustomize={(it) => setItem({ id: it.id, custom: it })} onBuild={() => setItem({ id: 'byo' })} />
      )}

      <Footer
        w={w}
        padBottom={count > 0 ? '124px' : '28px'}
        ctaText={ctaText}
        onStart={openMenu}
        onMenu={openMenu}
        onBest={goSection('bestsellers')}
        onDeals={goSection('deals')}
        onOven={goSection('oven')}
        onPickup={(e) => { e?.preventDefault(); setMode('pickup'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        onDelivery={(e) => { e?.preventDefault(); openStart('delivery'); }}
      />

      {added && <AddedToast added={added} right={w < 560 ? '16px' : '24px'} bottom={toastBottom} />}
      {toast && <InfoToast text={toast.text} bottom={toastBottom} onViewCart={toast.cart && !cartOpen ? () => { setCartOpen(true); setToast(null); } : undefined} />}

      {welcome && (
        <StartSheet
          w={w}
          open={open}
          wMode={wMode}
          setWMode={(m) => { setWMode(m); setAddrErr(''); }}
          addr={addr}
          setAddr={(v) => { setAddr(v); setAddrErr(''); }}
          addrErr={addrErr}
          when={when}
          setWhen={setWhen}
          onConfirm={confirmWelcome}
          onClose={() => setWelcome(false)}
        />
      )}

      {comboDeal && (
        <ComboBuilder
          deal={{ ...comboDeal, ...creditOf(comboDeal) }}
          sizePrices={SIZE_PRICES}
          onClose={() => setCombo(null)}
          onAdd={(line, qty) => { setCombo(null); addLine(line, qty); }}
        />
      )}
      {builderItem && (
        <PizzaBuilder
          item={builderItem}
          sizePrices={SIZE_PRICES}
          onClose={() => setItem(null)}
          onAdd={(line, qty) => { setItem(null); addLine(line, qty); }}
        />
      )}

      <CartCheckout
        pageBg="#FFFFFF"
        lines={cart}
        mode="pickup"
        open={cartOpen}
        onOpen={() => { setCartOpen(true); setToast(null); }}
        onClose={() => setCartOpen(false)}
        onQty={changeQty}
        onAdd={(line) => addLine(line)}
        onMode={() => setMode('pickup')}
        onBrowse={() => { setCartOpen(false); goSection('bestsellers')(); }}
        onPlaced={() => { setCart([]); setCartOpen(false); }}
        when={when}
      />
    </>
  );
}
