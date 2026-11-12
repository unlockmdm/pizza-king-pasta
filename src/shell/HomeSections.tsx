import { useEffect, useState, type CSSProperties, type MouseEvent } from 'react';
import { creditOf, pricesFor, SHOP, U } from '../lib/catalog';
import { money } from '../lib/format';
import { COMBOS } from '../lib/pricing';
import { Hov, IconArrow, IconPlus, Photo } from '../lib/ui';
import { scatter } from '../lib/scatter';
import { BYO_SETS, DEALS, SPECIALS, TILES, type Tile } from './data';

const SECTION: CSSProperties = { maxWidth: 1320, margin: '0 auto', padding: 'clamp(56px,7vw,96px) clamp(16px,3vw,32px) 0', display: 'flex', flexDirection: 'column', gap: 24, scrollMarginTop: 84 };
const H2: CSSProperties = { margin: 0, fontWeight: 900, fontSize: 'clamp(34px,4vw,52px)', lineHeight: 1, letterSpacing: '-.04em' };
const LEAD: CSSProperties = { fontSize: 17, color: '#636366' };
const ARROW_DOT: CSSProperties = { position: 'absolute', right: 18, bottom: 18, width: 48, height: 48, borderRadius: '50%', background: '#fff', color: '#1A1414', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const ARROW_DOT_SM: CSSProperties = { ...ARROW_DOT, right: 12, bottom: 12, width: 40, height: 40 };
const PRODUCT_SHADOW = 'drop-shadow(0 8px 10px rgba(70,0,10,.35)) drop-shadow(0 2px 3px rgba(70,0,10,.35))';

/** Build Your Own tile: topping cut-outs drop onto the pizza in a sunflower spiral, cycling every 2.6s. */
export function ByoToppings({ si }: { si: number }) {
  const set = BYO_SETS[si % BYO_SETS.length];
  // Evenly spread, nothing touching (lib/scatter); toppings interleaved so they mix.
  const per = 7;
  const items: { k: string; t: number; i: number; src: string; w: number }[] = [];
  for (let i = 0; i < per; i++) set.forEach(([name, imgs, w], t) => items.push({ k: name, t, i, src: imgs[(i + t) % imgs.length], w: w * (0.92 + ((i * 37 + t * 11) % 16) / 100) }));
  const pos = scatter(items.map((it) => ({ k: it.k, r: it.w * 0.42 })), 140, 'byo' + si);
  return (
    <>
      {items.map((it, n) => {
        const rot = ((n * 73 + si * 41) % 360) + 'deg';
        return (
          <img
            key={si + '-' + n}
            src={'assets/toppings/pz/' + it.src + '.png'}
            alt=""
            style={{
              position: 'absolute', left: 180 + pos[n].x + 'px', top: 180 + pos[n].y + 'px',
              width: it.w + 'px', '--r': rot, transform: 'translate(-50%,-50%) rotate(' + rot + ')',
              opacity: 0,
              animation: 'pkDrop .5s cubic-bezier(.2,.8,.2,1) ' + (n * 0.025).toFixed(3) + 's forwards',
            } as CSSProperties}
          />
        );
      })}
    </>
  );
}

function ByoTile({ ph, onClick }: { ph: boolean; onClick: () => void }) {
  const [byoSi, setByoSi] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setByoSi((x) => (x + 1) % BYO_SETS.length), 2600);
    return () => clearInterval(t);
  }, []);
  return (
    <Hov as="button" onClick={onClick} aria-label="Build your own pizza, 4 toppings included, meat counts as 2" style={{ gridArea: 'byo', position: 'relative', minHeight: 0, padding: 0, border: 0, borderRadius: ph ? 24 : 36, overflow: 'hidden', background: '#1A1414', color: '#fff', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer', transition: 'transform .3s' }} hover={{ transform: 'translateY(-3px)' }}>
      <span style={{ position: 'absolute', left: '50%', top: ph ? 78 : 120, width: 360, height: 360, marginLeft: -180, transform: ph ? 'scale(.62)' : undefined, transformOrigin: '50% 0' }}>
        <span style={{ position: 'absolute', inset: 0, animation: 'pkSpin 60s linear infinite' }}>
          <img src="assets/pizza-base.webp" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
          <ByoToppings si={byoSi} />
        </span>
      </span>
      <span style={{ position: 'absolute', left: ph ? 16 : 24, right: ph ? 16 : 24, top: ph ? 16 : 22, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontWeight: 900, fontSize: ph ? 19 : 24, lineHeight: 1.1, letterSpacing: '-.03em', whiteSpace: ph ? 'normal' : 'nowrap' }}>Build your own</span>
        <span style={{ fontSize: ph ? 13 : 14, color: 'rgba(255,255,255,.7)' }}>4 toppings · meat counts as 2</span>
        {ph ? null : <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', opacity: 0.92, marginTop: 6, minHeight: 18 }}>{BYO_SETS[byoSi].map((x) => x[0]).join(' · ')}</span>}
      </span>
      <span style={ph ? ARROW_DOT_SM : ARROW_DOT}><IconArrow /></span>
    </Hov>
  );
}

/** Hero combo slides: Two Large, Two Medium, Two Small. Auto-advances every 5s (paused on hover / reduced motion). */
const SLIDES = [
  { id: 'two-large', title: 'Two Large', line: ['2 large pizzas, 4 toppings each,', '2 dips and 2 pops'], scale: 1, pops: 2 },
  { id: 'two-medium', title: 'Two Medium', line: ['2 medium pizzas, 4 toppings each,', '2 dips and 2 pops'], scale: 0.88, pops: 2 },
  { id: 'two-small', title: 'Two Small', line: ['2 small pizzas, 4 toppings each,', 'and 2 dips'], scale: 0.76, pops: 0 },
] as const;

function ComboSlides({ ph, w, onDeal }: { ph: boolean; w: number; onDeal: (id: string) => void }) {
  const [i, setI] = useState(0);
  const [hold, setHold] = useState(false);
  useEffect(() => {
    if (hold || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const t = setTimeout(() => setI((n) => (n + 1) % SLIDES.length), 5000);
    return () => clearTimeout(t);
  }, [i, hold]);
  const shade = (k: number) => ({ position: 'absolute', left: '8%', right: '8%', bottom: '-6%', height: '22%', borderRadius: '50%', background: 'radial-gradient(closest-side,rgba(40,0,6,.45),rgba(40,0,6,0))', opacity: k } as CSSProperties);
  const fade = (on: boolean): CSSProperties => ({ position: 'absolute', inset: 0, opacity: on ? 1 : 0, transition: 'opacity .7s ease', pointerEvents: on ? 'auto' : 'none' });
  return (
    <Hov
      role="region"
      aria-roledescription="carousel"
      aria-label="Pickup combos"
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={() => setHold(false)}
      style={{ gridArea: 'deal', position: 'relative', minHeight: 0, borderRadius: ph ? 28 : 36, background: '#D7192D', color: '#fff', overflow: 'hidden', transition: 'transform .3s' }}
      hover={{ transform: 'translateY(-3px)' }}
    >
      {SLIDES.map((d, k) => {
        const on = k === i;
        const big = ph ? 200 : 330, small = ph ? 176 : 300;
        // Centre of each pizza measured from the tile's top-right, using the Two Large layout as the reference.
        const r1 = ph ? -46 : -60, t1 = ph ? -40 : -90, r2 = ph ? 54 : 170, t2 = ph ? 104 : 110;
        const c1x = r1 + (big * d.scale) / 2, c1y = t1 + (big * d.scale) / 2;
        const dx = r2 + small / 2 - (r1 + big / 2), dy = t2 + small / 2 - (t1 + big / 2);
        const p2 = { right: c1x + dx * d.scale - (small * d.scale) / 2, top: c1y + dy * d.scale - (small * d.scale) / 2 };
        return (
          <div key={d.id} aria-hidden={!on} style={fade(on)}>
            {/* Pizzas: smaller for smaller sizes, same spot so the switch feels like the same table. */}
            <div style={{ position: 'absolute', right: ph ? -46 : -60, top: ph ? -40 : -90, width: big * d.scale, height: big * d.scale, transition: 'width .7s, height .7s' }}>
              <span aria-hidden="true" style={shade(1)} />
              <img src="assets/combo/pizza-meat.webp" alt="" decoding="async" style={{ position: 'relative', width: '100%', height: '100%', objectFit: 'contain', animation: 'pkSpin 40s linear infinite', willChange: 'transform' }} />
            </div>
            {/* Second pizza keeps the Two Large spacing, scaled with the pizza size, so smaller pizzas stay close together. */}
            <div style={{ position: 'absolute', right: p2.right, top: p2.top, width: small * d.scale, height: small * d.scale }}>
              <span aria-hidden="true" style={shade(1)} />
              <img src="assets/combo/pizza-veg.webp" alt="" decoding="async" style={{ position: 'relative', width: '100%', height: '100%', objectFit: 'contain', animation: 'pkSpin 50s linear reverse infinite', willChange: 'transform' }} />
            </div>
            <div aria-hidden="true" style={{ position: 'absolute', right: ph ? 8 : 18, bottom: ph ? 10 : 14, width: 236, height: 128, display: 'flex', pointerEvents: 'none', transform: ph ? (w < 380 ? 'scale(.5)' : 'scale(.64)') : undefined, transformOrigin: 'right bottom' }}>
              <span style={{ position: 'absolute', left: 14, right: 8, bottom: -4, height: 20, borderRadius: '50%', background: 'radial-gradient(closest-side,rgba(60,0,8,.5),rgba(60,0,8,0))' }} />
              {d.pops ? <img src="assets/combo/coke.png" alt="" style={{ position: 'absolute', left: 68, bottom: 10, height: 108, filter: PRODUCT_SHADOW }} /> : null}
              {d.pops ? <img src="assets/combo/coke.png" alt="" style={{ position: 'absolute', left: 118, bottom: 4, height: 112, filter: PRODUCT_SHADOW }} /> : null}
              <img src="assets/combo/garlic-cup.webp" alt="" style={{ position: 'absolute', left: d.pops ? 0 : 50, bottom: 8, width: 92, filter: PRODUCT_SHADOW }} />
              <img src="assets/combo/garlic-cup.webp" alt="" style={{ position: 'absolute', right: 0, bottom: 6, width: 92, filter: PRODUCT_SHADOW }} />
            </div>
            <div style={{ position: 'absolute', inset: 0, padding: ph ? '22px 22px' : '26px 30px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: ph ? 'linear-gradient(90deg,rgba(215,25,45,.96) 0%,rgba(215,25,45,.82) 42%,rgba(215,25,45,0) 72%)' : 'linear-gradient(90deg,rgba(215,25,45,.92) 0%,rgba(215,25,45,.6) 34%,rgba(215,25,45,0) 52%)' }}>
              <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase' }}>Pickup combo</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: ph ? 12 : 16, maxWidth: 300 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <span style={{ fontWeight: 900, fontSize: ph ? 38 : 46, lineHeight: 0.9, letterSpacing: '-.05em' }}>{d.title}<br />{money(COMBOS[d.id].price)}</span>
                  <span style={{ fontSize: ph ? 14 : 15, fontWeight: 600, lineHeight: 1.4 }}>{d.line[0]}<br />{d.line[1]}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <Hov
                    as="button"
                    tabIndex={on ? 0 : -1}
                    onClick={() => onDeal(d.id)}
                    aria-label={'Customize ' + d.title + ' combo, ' + money(COMBOS[d.id].price)}
                    style={{ height: 44, padding: '0 20px', border: 0, borderRadius: 999, background: '#fff', color: '#D7192D', fontFamily: 'inherit', fontWeight: 900, fontSize: 15, display: 'flex', alignItems: 'center', flex: 'none', cursor: 'pointer', transition: 'transform .2s' }}
                    hover={{ transform: 'scale(1.04)' }}
                  >
                    Customize
                  </Hov>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      {/* Slide dots: under the price on the left, out of the way of the pizzas. */}
      <div role="tablist" aria-label="Choose a combo" style={{ position: 'absolute', left: ph ? 22 : 30, top: ph ? 50 : 56, display: 'flex', gap: 6, zIndex: 2 }}>
        {SLIDES.map((d, k) => (
          <button
            key={d.id}
            role="tab"
            aria-selected={k === i}
            aria-label={d.title}
            onClick={() => setI(k)}
            style={{ width: k === i ? 22 : 8, height: 8, padding: 0, border: 0, borderRadius: 999, background: k === i ? '#fff' : 'rgba(255,255,255,.45)', cursor: 'pointer', transition: 'width .3s, background .3s' }}
          />
        ))}
      </div>
    </Hov>
  );
}

export interface HomeHandlers {
  onStart: () => void;
  onMenu: (e?: MouseEvent) => void;
  onTwoLarge: () => void;
  onByo: () => void;
  onPasta: () => void;
  onTile: (t: Tile) => void;
  onSpecial: (id: string) => void;
  onDeal: (id: string) => void;
}

export default function HomeSections({ w, h }: { w: number; h: HomeHandlers }) {

  const desk = w >= 1000, tab = w >= 600, ph = !tab;
  const clamp2 = { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as const;
  const bentoCols = desk ? '1.55fr 1fr 1fr' : '1fr 1fr';
  const bentoRows = desk ? 'minmax(0,1fr) minmax(0,1fr)' : tab ? '560px 320px 300px' : '480px 290px 220px';
  const bentoAreas = desk ? '"hero deal deal" "hero byo pasta"' : '"hero hero" "deal deal" "byo pasta"';
  const bentoH = desk ? 'clamp(640px,calc(100vh - 110px),800px)' : 'auto';
  const bentoFont = desk ? 'clamp(64px,6.8vw,96px)' : tab ? '84px' : '15vw';
  const tileCols = desk ? 'repeat(4,minmax(0,1fr))' : 'repeat(2,minmax(0,1fr))';
  const specialCols = w >= 1100 ? 'repeat(4,minmax(0,1fr))' : 'repeat(2,minmax(0,1fr))';
  const dealCols = w >= 1100 ? 'repeat(4,minmax(0,1fr))' : 'repeat(2,minmax(0,1fr))';
  const ovenCols = w >= 960 ? 'minmax(0,1fr) minmax(0,1fr)' : 'minmax(0,1fr)';

  return (
    <main id="top">
      {/* ---------- Hero bento ---------- */}
      <section style={{ maxWidth: 1320, margin: '0 auto', padding: '16px clamp(16px,3vw,32px) 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: bentoCols, gridTemplateRows: bentoRows, gridTemplateAreas: bentoAreas, gap: ph ? 10 : 14, height: bentoH }}>
          {/* Hero tile */}
          <div style={{ gridArea: 'hero', position: 'relative', minHeight: 0, borderRadius: ph ? 28 : 36, overflow: 'hidden', color: '#fff', background: '#1A1414' }}>
            <img src="assets/hero-oven.webp" alt="Pizza coming out of the wood-fired oven at Pizza King & Pasta in Brampton" {...{ fetchpriority: "high" }} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 35%' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg,rgba(14,8,8,.9) 0%,rgba(14,8,8,.5) 34%,rgba(14,8,8,.08) 66%)' }} />
            <div style={{ position: 'absolute', left: 'clamp(22px,3vw,40px)', right: 'clamp(22px,3vw,40px)', bottom: 'clamp(22px,3vw,40px)', display: 'flex', flexDirection: 'column', gap: 24 }}>
              <h1 style={{ margin: 0, fontWeight: 700, fontSize: bentoFont, lineHeight: 0.9, letterSpacing: '-.045em', textShadow: '0 2px 18px rgba(0,0,0,.45)' }}>
                <span style={{ display: 'block', marginBottom: ph ? 12 : 16, fontSize: ph ? 12 : 14, fontWeight: 800, lineHeight: 1.3, letterSpacing: ph ? '.08em' : '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.82)', animation: 'pkUp 1s cubic-bezier(.2,.8,.2,1) both' }}>{w < 440 ? 'Desi & wood-fired pizza · Brampton' : 'Indian-style & wood-fired pizza · Brampton'}</span>
                <span style={{ display: 'block', animation: 'pkUp 1s cubic-bezier(.2,.8,.2,1) both' }}>Wood-fired.</span>
                <span style={{ display: 'block', color: '#FF4B57', animation: 'pkUp 1s cubic-bezier(.2,.8,.2,1) .12s both' }}>Made to order.</span>
              </h1>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, animation: 'pkUp 1s cubic-bezier(.2,.8,.2,1) .24s both' }}>
                <Hov
                  as="button"
                  onClick={h.onStart}
                  style={{ height: 60, padding: '0 10px 0 28px', border: 0, borderRadius: 999, background: '#D7192D', color: '#fff', fontFamily: 'inherit', fontWeight: 900, fontSize: 18, display: 'flex', alignItems: 'center', gap: 14, whiteSpace: 'nowrap', cursor: 'pointer', transition: 'background .2s,transform .2s' }}
                  hover={{ background: '#C0121F', transform: 'translateY(-2px)' }}
                >
                  Start your order
                  <span style={{ width: 40, height: 40, borderRadius: '50%', background: '#fff', color: '#D7192D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconArrow /></span>
                </Hov>
                <Hov
                  as="a"
                  href="#menu"
                  onClick={h.onMenu}
                  style={{ height: 60, padding: '0 28px', borderRadius: 999, background: 'rgba(255,255,255,.14)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.3)', color: '#fff', textDecoration: 'none', fontWeight: 800, fontSize: 18, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', transition: 'background .2s' }}
                  hover={{ background: 'rgba(255,255,255,.24)', color: '#fff' }}
                >
                  See the menu
                </Hov>
              </div>
            </div>
          </div>

          {/* Pickup combo tile: slideshow of the combos (own component so its timer doesn't re-render the page) */}
          <ComboSlides ph={ph} w={w} onDeal={h.onDeal} />

          {/* Build your own tile (own component so its 2.6s topping cycle doesn't re-render the page) */}
          <ByoTile ph={ph} onClick={h.onByo} />

          {/* Fresh pasta tile */}
          <Hov as="button" onClick={h.onPasta} aria-label="Fresh pasta: rosé, Alfredo, tomato" style={{ gridArea: 'pasta', position: 'relative', minHeight: 0, padding: 0, border: 0, borderRadius: ph ? 24 : 36, overflow: 'hidden', background: '#F2F2F5', color: '#fff', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer', transition: 'transform .3s' }} hover={{ transform: 'translateY(-3px)' }}>
            <img src="assets/menu/pasta-trio.webp" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(14,8,8,.78) 0%,rgba(14,8,8,.35) 30%,rgba(14,8,8,0) 55%)' }} />
            <span style={{ position: 'absolute', left: ph ? 16 : 24, right: ph ? 16 : 24, top: ph ? 16 : 22, display: 'flex', flexDirection: 'column', gap: 2, textShadow: '0 1px 8px rgba(0,0,0,.35)' }}>
              <span style={{ fontWeight: 900, fontSize: ph ? 19 : 24, lineHeight: 1.1, letterSpacing: '-.03em', whiteSpace: 'nowrap' }}>Fresh pasta</span>
              <span style={{ fontSize: ph ? 13 : 14, color: 'rgba(255,255,255,.88)' }}>Rosé, Alfredo, tomato</span>
            </span>
            <span style={ph ? ARROW_DOT_SM : ARROW_DOT}><IconArrow /></span>
          </Hov>
        </div>
      </section>

      {/* ---------- Menu categories ---------- */}
      <section id="menu" style={SECTION}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <h2 style={H2}>Menu</h2>
          <Hov as="a" href="#menu" onClick={h.onMenu} style={{ fontWeight: 700, fontSize: 15, color: '#1A1414', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }} hover={{ color: '#D7192D' }}>
            View full menu <span aria-hidden="true">→</span>
          </Hov>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: tileCols, gap: 14 }}>
          {TILES.map((t) => {
            const c = creditOf(t);
            return (
              <Hov key={t.id} as="button" onClick={() => h.onTile(t)} style={{ position: 'relative', border: 0, padding: 0, textAlign: 'left', cursor: 'pointer', background: t.bg, color: t.fg, borderRadius: 28, overflow: 'hidden', aspectRatio: '3/4', display: 'flex', flexDirection: 'column', transition: 'transform .25s ease' }} hover={{ transform: 'translateY(-4px)' }}>
                <div style={{ position: 'relative', zIndex: 2, padding: w < 400 ? '16px 16px 0' : '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 3, pointerEvents: 'none' }}>
                  <span style={{ fontWeight: 900, fontSize: w < 400 ? 18 : 21, lineHeight: 1.05, letterSpacing: '-.025em' }}>{t.name}</span>
                  <span style={{ fontSize: w < 400 ? 13 : 14, fontWeight: 600, opacity: 0.8, lineHeight: 1.3 }}>{t.sub}</span>
                </div>
                {/* Portrait photos fill the tile on wide screens; on phones the text wraps, so they sit at the bottom like `full`. */}
                {t.fill && w >= 720 ? (
                  <div style={{ position: 'absolute', inset: 0 }}>
                    <img src={t.img} alt="" loading="lazy" decoding="async" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 100%' }} />
                    <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '30%', background: 'linear-gradient(180deg,' + t.bg + 'CC,' + t.bg + '00)' }} />
                  </div>
                ) : t.full || t.fill ? (
                  <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, aspectRatio: '1/1' }}>
                    <img src={t.img} alt="" loading="lazy" decoding="async" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: t.fill ? '50% 30%' : undefined }} />
                    <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '34%', background: 'linear-gradient(180deg,' + t.bg + ' 0%,' + t.bg + 'B3 35%,' + t.bg + '00 100%)' }} />
                  </div>
                ) : (
                  <div style={{ position: 'absolute', left: w < 400 ? '17%' : '9%', right: w < 400 ? '17%' : '9%', bottom: w < 400 ? '-10%' : '-13%', aspectRatio: '1/1', borderRadius: '50%', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,.28)' }}>
                    <Photo src={t.img} shape="circle" credit={c.credit} creditHref={c.creditHref} />
                  </div>
                )}
              </Hov>
            );
          })}
        </div>
      </section>

      {/* ---------- House specials ---------- */}
      <section id="bestsellers" style={SECTION}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2 style={H2}>House specials</h2>
            <span style={LEAD}>Signature pizzas, Indian-fusion and classic. Choose size, crust and oven when you add one.</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: specialCols, gap: ph ? 10 : 16 }}>
          {SPECIALS.map((p) => {
            const c = creditOf(p);
            return (
              <Hov
                key={p.id}
                as="article"
                onClick={() => h.onSpecial(p.id)}
                style={{ cursor: 'pointer', background: '#fff', borderRadius: ph ? 20 : 28, padding: ph ? 6 : 10, display: 'flex', flexDirection: 'column', boxShadow: '0 0 0 1px rgba(26,20,20,.06),0 12px 32px rgba(26,20,20,.06)', transition: 'transform .25s ease,box-shadow .25s ease' }}
                hover={{ transform: 'translateY(-4px)', boxShadow: '0 0 0 1px rgba(26,20,20,.06),0 26px 50px rgba(26,20,20,.13)' }}
              >
                <div style={{ position: 'relative', aspectRatio: '1/1', borderRadius: ph ? 15 : 20, overflow: 'hidden', background: '#F0F0F3' }}>
                  <Photo src={p.img} alt={p.name + ' pizza'} credit={c.credit} creditHref={c.creditHref} />
                </div>
                <div style={{ padding: ph ? '10px 4px 2px 6px' : '16px 8px 6px', display: 'flex', flexDirection: 'column', gap: ph ? 8 : 14, flex: 1 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: ph ? 3 : 6, flex: 1 }}>
                    <span style={{ fontWeight: 900, fontSize: ph ? 16 : 21, lineHeight: ph ? 1.15 : undefined, letterSpacing: '-.025em' }}>{p.name}</span>
                    <span style={{ fontSize: ph ? 12.5 : 15, lineHeight: ph ? 1.4 : 1.45, color: '#636366', ...(ph ? clamp2 : {}) }}>{p.desc}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: ph ? 6 : 12 }}>
                    <span style={{ fontSize: ph ? 13.5 : 16, fontWeight: 700 }}>From {money(pricesFor(p.id).S)}</span>
                    <Hov as="button" aria-label={'Customize ' + p.name} style={{ width: ph ? 36 : 44, height: ph ? 36 : 44, flex: 'none', border: 0, borderRadius: '50%', background: '#1A1414', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background .2s' }} hover={{ background: '#D7192D' }}>
                      <IconPlus />
                    </Hov>
                  </div>
                </div>
              </Hov>
            );
          })}
        </div>
      </section>

      {/* ---------- Pickup combos ---------- */}
      <section id="deals" style={SECTION}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h2 style={H2}>Pickup combos</h2>
          <span style={LEAD}>Combo prices for online pickup orders.</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: dealCols, gap: ph ? 10 : 16 }}>
          {DEALS.map((d) => {
            const c = creditOf(d);
            return (
              <Hov
                key={d.id}
                as="article"
                onClick={() => h.onDeal(d.id)}
                style={{ position: 'relative', aspectRatio: ph ? '3/4' : '4/5', borderRadius: ph ? 20 : 28, overflow: 'hidden', background: '#1A1210', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', cursor: 'pointer', transition: 'transform .3s cubic-bezier(.2,.8,.2,1),box-shadow .3s' }}
                hover={{ transform: 'translateY(-6px)', boxShadow: '0 26px 50px rgba(26,20,20,.22)' }}
              >
                <div style={{ position: 'absolute', inset: 0 }}>
                  <Photo src={d.img} alt={d.name + ' combo'} credit={c.credit} creditHref={c.creditHref} style={{ bottom: 'auto', height: '100%' }} />
                </div>
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(0deg,rgba(18,10,8,.94) 0%,rgba(18,10,8,.72) 34%,rgba(18,10,8,0) 66%)' }} />
                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: ph ? 8 : 14, padding: ph ? 12 : 22 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: ph ? 4 : 6 }}>
                    <span style={{ fontWeight: 900, fontSize: ph ? 18 : 26, lineHeight: 1, letterSpacing: '-.03em' }}>{d.name}</span>
                    <span style={{ fontSize: ph ? 12 : 14, lineHeight: ph ? 1.35 : 1.45, color: '#DADADD', textWrap: 'pretty', ...(ph ? clamp2 : {}) } as CSSProperties}>{d.desc}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: ph ? 6 : 12 }}>
                    <span style={{ fontWeight: 900, fontSize: ph ? 24 : 38, lineHeight: 1, letterSpacing: '-.045em' }}>{money(d.price)}</span>
                    <Hov
                      as="button"
                      onClick={(e: MouseEvent) => { e.stopPropagation(); h.onDeal(d.id); }}
                      aria-label={'Customize ' + d.name + ' combo'}
                      style={{ width: ph ? 38 : 52, height: ph ? 38 : 52, flex: 'none', border: 0, borderRadius: '50%', background: '#fff', color: '#1A1414', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .2s,color .2s,transform .2s' }}
                      hover={{ background: '#D7192D', color: '#fff', transform: 'scale(1.06)' }}
                    >
                      <IconPlus stroke={3} />
                    </Hov>
                  </div>
                </div>
              </Hov>
            );
          })}
        </div>
      </section>

      {/* ---------- Wood oven ---------- */}
      <section id="oven" style={{ ...SECTION, display: 'block' }}>
        <div style={{ display: 'grid', gridTemplateColumns: ovenCols, background: '#1A1414', color: '#fff', borderRadius: ph ? 28 : 32, overflow: 'hidden' }}>
          <div style={{ position: 'relative', minHeight: w >= 960 ? 460 : 0, aspectRatio: w >= 960 ? 'auto' : tab ? '16/9' : '4/3' }}>
            <Photo src={U('1651981075280-9a9e01acbff0', 1400)} alt="Wood-fired pizza oven" credit="Photo by Daniel on Unsplash" creditHref="https://unsplash.com/@unsplashbydan" />
          </div>
          <div style={{ padding: 'clamp(28px,5vw,64px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 'clamp(24px,3vw,36px)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: '#FF7A85' }}>Our ovens</span>
              <h2 style={{ margin: 0, fontWeight: 900, fontSize: 'clamp(32px,4vw,54px)', lineHeight: 1, letterSpacing: '-.04em', textWrap: 'balance' } as CSSProperties}>Wood-fired or conventional, on every pizza.</h2>
              <p style={{ margin: 0, fontSize: 'clamp(16px,1.4vw,18px)', lineHeight: 1.55, color: '#CFC6C0', maxWidth: 460, textWrap: 'pretty' } as CSSProperties}>Pick the wood-fired oven or the conventional oven when you order. Same price either way.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: ph ? 'repeat(2,minmax(0,1fr))' : 'repeat(auto-fit,minmax(200px,1fr))', gap: ph ? 8 : 12 }}>
              <div style={{ background: '#D7192D', borderRadius: ph ? 18 : 22, padding: ph ? 14 : 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontWeight: 900, fontSize: 20, letterSpacing: '-.02em' }}>Wood-fired</span>
                <span style={{ fontSize: 15, lineHeight: 1.45, color: '#fff' }}>Smoky, blistered crust. Our default.</span>
              </div>
              <div style={{ background: '#2C2424', borderRadius: ph ? 18 : 22, padding: ph ? 14 : 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontWeight: 900, fontSize: 20, letterSpacing: '-.02em' }}>Conventional</span>
                <span style={{ fontSize: 15, lineHeight: 1.45, color: '#CFC6C0' }}>Even bake, softer crust.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Hours & location ---------- */}
      <section id="visit" style={{ ...SECTION, display: 'block', padding: 'clamp(56px,7vw,96px) clamp(16px,3vw,32px)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: ovenCols, gap: 16 }}>
          <div style={{ background: '#F2F2F5', borderRadius: 32, padding: 'clamp(28px,4vw,56px)', display: 'flex', flexDirection: 'column', gap: 32 }}>
            <h2 style={H2}>Hours &amp; location</h2>
            <div style={{ display: 'grid', gridTemplateColumns: ph ? 'repeat(2,minmax(0,1fr))' : 'repeat(auto-fit,minmax(200px,1fr))', gap: ph ? 20 : 24 }}>
              <InfoBlock label="Address"><a href={SHOP.mapsSearch} target="_blank" rel="noopener noreferrer" style={{ color: '#1A1414', textDecoration: 'none' }}>{SHOP.street}<br />{SHOP.cityLine}</a></InfoBlock>
              <InfoBlock label="Hours"><span>{SHOP.hoursDays}<br />{SHOP.hoursText}</span></InfoBlock>
              <InfoBlock label="Phone"><a href={SHOP.phoneHref} style={{ fontSize: 17, fontWeight: 600, color: '#1A1414', textDecoration: 'none' }}>{SHOP.phoneText}</a></InfoBlock>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <Hov as="a" href={SHOP.mapsSearch} target="_blank" rel="noreferrer" style={{ background: '#1A1414', color: '#fff', borderRadius: 999, padding: '15px 24px', fontWeight: 800, fontSize: 15, textDecoration: 'none' }} hover={{ background: '#D7192D', color: '#fff' }}>Get directions</Hov>
              <Hov as="a" href={SHOP.phoneHref} style={{ background: '#fff', color: '#1A1414', borderRadius: 999, padding: '15px 24px', fontWeight: 800, fontSize: 15, textDecoration: 'none', boxShadow: '0 0 0 1px rgba(26,20,20,.12)' }} hover={{ color: '#D7192D' }}>Call the shop</Hov>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 24, borderTop: '1px solid rgba(26,20,20,.1)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: '#636366' }}>Delivery</span>
                <span style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.45, textWrap: 'pretty' } as CSSProperties}>Available through {SHOP.ubereatsAvailable ? 'DoorDash and Uber Eats' : 'DoorDash'}.</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                <AppPill href={SHOP.doordash} logo={SHOP.doordashLogo} name="DoorDash" h={14} />
                <AppPill href={SHOP.ubereats} logo={SHOP.ubereatsLogo} name="Uber Eats" h={18} off={!SHOP.ubereatsAvailable} />
              </div>
              {SHOP.ubereatsAvailable ? null : <span style={{ fontSize: 13, lineHeight: 1.45, color: '#636366' }}>Ordering delivery through Uber Eats is currently unavailable.</span>}
            </div>
          </div>
          <div style={{ position: 'relative', borderRadius: 32, overflow: 'hidden', minHeight: 380, background: '#2A1E1A', display: ph ? 'none' : undefined }}>
            <Photo src="assets/storefront.webp" alt="Pizza King &amp; Pasta storefront at 511 Ray Lawson Blvd, Brampton" position="45% 50%" />
          </div>
        </div>
      </section>
    </main>
  );
}

function InfoBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: '#636366' }}>{label}</span>
      <span style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.45 }}>{children}</span>
    </div>
  );
}

/** White pill linking to the shop's page in a delivery app (Hours & location). */
function AppPill({ href, logo, name, h, off }: { href: string; logo: string; name: string; h: number; off?: boolean }) {
  if (off) {
    // Same pill, greyed out and not clickable (the note under the pills explains why).
    return (
      <span aria-disabled="true" aria-label={'Order delivery on ' + name + ' (currently unavailable)'} style={{ display: 'flex', alignItems: 'center', gap: 10, height: 50, background: '#F7F7F8', color: '#AEAEB2', borderRadius: 999, padding: '0 20px', boxShadow: '0 0 0 1px rgba(26,20,20,.08)', cursor: 'not-allowed', userSelect: 'none' }}>
        <img src={logo} alt={name} style={{ display: 'block', height: h, width: 'auto', flex: 'none', filter: 'grayscale(1)', opacity: 0.4 }} />
        <IconArrowUpRight />
      </span>
    );
  }
  return (
    <Hov as="a" href={href} target="_blank" rel="noopener noreferrer" aria-label={'Order delivery on ' + name} style={{ display: 'flex', alignItems: 'center', gap: 10, height: 50, background: '#fff', color: '#1A1414', borderRadius: 999, padding: '0 20px', textDecoration: 'none', boxShadow: '0 0 0 1px rgba(26,20,20,.12)', transition: 'box-shadow .15s' }} hover={{ boxShadow: '0 0 0 2px #1A1414', color: '#1A1414' }}>
      <img src={logo} alt={name} style={{ display: 'block', height: h, width: 'auto', flex: 'none' }} />
      <IconArrowUpRight />
    </Hov>
  );
}

export const IconArrowUpRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }} aria-hidden="true"><path d="M7 17 17 7M8 7h9v9" /></svg>
);
