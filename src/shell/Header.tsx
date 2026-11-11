import { useEffect, useState, type MouseEvent } from 'react';
import { Hov, IconCart, IconChevronDown } from '../lib/ui';

type Nav = (e?: MouseEvent) => void;

// Longhand border properties on purpose: mixing the `borderBottom` shorthand with a `borderBottomColor` override
// makes React drop the override later, and the line falls back to the text colour (a stuck black underline).
const navLink = {
  color: '#1A1414', textDecoration: 'none', padding: '10px 0', borderBottomWidth: 2, borderBottomStyle: 'solid', borderBottomColor: 'transparent', transition: 'border-color .2s,color .2s',
} as const;
const navOn = { ...navLink, borderBottomColor: '#D7192D' } as const;

type Section = 'menu' | 'bestsellers' | 'deals' | 'visit' | null;
const SPY: Exclude<Section, null>[] = ['bestsellers', 'deals', 'visit'];

/** Which header link to underline: the Menu page, or the homepage section currently under the header. */
function useActive(view: string): Section {
  const [sec, setSec] = useState<Section>(null);
  useEffect(() => {
    if (view !== 'home') { setSec(null); return; }
    let raf = 0;
    const check = () => {
      raf = 0;
      const line = 120; // just below the sticky header
      let cur: Section = null;
      for (const id of SPY) {
        const el = document.getElementById(id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.top <= line && r.bottom > line) cur = id;
      }
      // At the very bottom the last section may never reach the line.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        const v = document.getElementById('visit');
        if (v && v.getBoundingClientRect().top < window.innerHeight) cur = 'visit';
      }
      setSec(cur);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(check); };
    check();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); if (raf) cancelAnimationFrame(raf); };
  }, [view]);
  return view === 'menu' ? 'menu' : sec;
}

export default function Header({
  w, view, modeLabel, cartCount, onHome, onMenu, onBest, onDeals, onVisit, onStart, onCart,
}: {
  w: number;
  view: string;
  modeLabel: string;
  cartCount: number;
  onHome: Nav;
  onMenu: Nav;
  onBest: Nav;
  onDeals: Nav;
  onVisit: Nav;
  onStart: () => void;
  onCart: () => void;
}) {
  const showNav = w >= 1180;
  const showWordmark = w >= 560;
  const showCartLabel = w >= 480;
  const active = useActive(view);
  const link = (id: Section) => ({ className: 'pk-nav-link', style: active === id ? navOn : navLink, 'aria-current': active === id ? ('true' as const) : undefined });
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 30, background: 'rgba(255,255,255,.86)', backdropFilter: 'saturate(1.6) blur(16px)', WebkitBackdropFilter: 'saturate(1.6) blur(16px)', borderBottom: '1px solid rgba(26,20,20,.07)' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '12px clamp(16px,3vw,32px)', display: 'flex', alignItems: 'center', gap: w >= 560 ? 24 : 12 }}>
        <a href="#top" onClick={onHome} aria-label="Pizza King & Pasta home" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#1A1414', flex: 'none' }}>
          <span style={{ width: 44, height: 44, borderRadius: '50%', background: '#fff', boxShadow: '0 0 0 1px rgba(26,20,20,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <img src="assets/chef-logo.png" alt="" style={{ width: 36, height: 'auto' }} />
          </span>
          {showWordmark && (
            <span style={{ fontWeight: 900, fontSize: 19, letterSpacing: '-.02em', whiteSpace: 'nowrap' }}>
              Pizza King <span style={{ color: '#D7192D' }}>&amp;</span> Pasta
            </span>
          )}
        </a>
        {showNav && (
          <nav style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 32, fontWeight: 600, fontSize: 15, whiteSpace: 'nowrap' }}>
            <a href="/menu" onClick={onMenu} {...link('menu')}>Menu</a>
            <a href="#bestsellers" onClick={onBest} {...link('bestsellers')}>Specials</a>
            <a href="#deals" onClick={onDeals} {...link('deals')}>Pickup combos</a>
            <a href="#visit" onClick={onVisit} {...link('visit')}>Hours &amp; location</a>
          </nav>
        )}
        <div style={{ marginLeft: 'auto', minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ position: 'relative', minWidth: 0 }}>
            <Hov
              as="button"
              onClick={onStart}
              aria-haspopup="dialog"
              style={{ maxWidth: '100%', height: 44, display: 'flex', alignItems: 'center', gap: 6, border: 0, background: '#F0F0F3', color: '#1A1414', borderRadius: 999, padding: '0 12px 0 16px', fontFamily: 'inherit', fontWeight: 800, fontSize: 15, cursor: 'pointer', whiteSpace: 'nowrap' }}
              hover={{ background: '#E6E6E9' }}
            >
              <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{modeLabel}</span>
              <IconChevronDown />
            </Hov>
          </div>
          <Hov
            as="button"
            onClick={onCart}
            aria-label={'Cart, ' + cartCount + (cartCount === 1 ? ' item' : ' items')}
            style={{ flex: 'none', height: 44, display: 'flex', alignItems: 'center', gap: 8, border: 0, background: '#1A1414', color: '#fff', borderRadius: 999, padding: '0 ' + (w >= 480 ? '18px' : '10px') + ' 0 14px', fontFamily: 'inherit', fontWeight: 700, fontSize: 15, cursor: 'pointer', whiteSpace: 'nowrap' }}
            hover={{ background: '#D7192D' }}
          >
            <IconCart />
            {showCartLabel && <span>Cart</span>}
            <span style={{ background: '#D7192D', color: '#fff', borderRadius: 999, minWidth: 22, height: 22, padding: '0 7px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>{cartCount}</span>
          </Hov>
        </div>
      </div>
    </header>
  );
}
