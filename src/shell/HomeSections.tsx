import { useEffect, useState, type CSSProperties, type MouseEvent } from 'react';
import { creditOf, pricesFor, SHOP, U } from '../lib/catalog';
import { money } from '../lib/format';
import { Hov, IconArrow, IconPlus, Photo } from '../lib/ui';
import { BYO_SETS, DEALS, SPECIALS, TILES, type Tile } from './data';

const SECTION: CSSProperties = { maxWidth: 1320, margin: '0 auto', padding: 'clamp(56px,7vw,96px) clamp(16px,3vw,32px) 0', display: 'flex', flexDirection: 'column', gap: 24, scrollMarginTop: 84 };
const H2: CSSProperties = { margin: 0, fontWeight: 900, fontSize: 'clamp(34px,4vw,52px)', lineHeight: 1, letterSpacing: '-.04em' };
const LEAD: CSSProperties = { fontSize: 17, color: '#636366' };
const ARROW_DOT: CSSProperties = { position: 'absolute', right: 18, bottom: 18, width: 48, height: 48, borderRadius: '50%', background: '#fff', color: '#1A1414', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const ARROW_DOT_SM: CSSProperties = { ...ARROW_DOT, right: 12, bottom: 12, width: 40, height: 40 };
const PRODUCT_SHADOW = 'drop-shadow(0 8px 10px rgba(70,0,10,.35)) drop-shadow(0 2px 3px rgba(70,0,10,.35))';

/** Build Your Own tile: topping cut-outs drop onto the pizza in a sunflower spiral, cycling every 2.6s. */
function ByoToppings({ si }: { si: number }) {
  const set = BYO_SETS[si % BYO_SETS.length];
  const per = 5, N = set.length * per, GA = 2.39996;
  const out: JSX.Element[] = [];
  for (let k = 0; k < per; k++) {
    set.forEach(([, imgs, w], t) => {
      const i = k * set.length + t;
      const rr = Math.sqrt((i + 0.6) / N) * 128;
      const a = i * GA + si * 0.7;
      const rot = ((i * 73 + si * 41) % 360) + 'deg';
      out.push(
        <img
          key={si + '-' + i}
          src={'assets/toppings/pz/' + imgs[(k + t) % imgs.length] + '.png'}
          alt=""
          style={{
            position: 'absolute', left: 180 + Math.cos(a) * rr + 'px', top: 180 + Math.sin(a) * rr + 'px',
            width: w * (0.9 + ((i * 37) % 20) / 100) + 'px', '--r': rot, transform: 'translate(-50%,-50%) rotate(' + rot + ')',
            opacity: 0, filter: 'drop-shadow(0 3px 3px rgba(0,0,0,.35))',
            animation: 'pkDrop .5s cubic-bezier(.2,.8,.2,1) ' + (i * 0.025).toFixed(3) + 's forwards',
          } as CSSProperties}
        />,
      );
    });
  }
  return <>{out}</>;
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
  // Cycle the Build Your Own toppings.
  const [byoSi, setByoSi] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setByoSi((s) => (s + 1) % BYO_SETS.length), 2600);
    return () => clearInterval(t);
  }, []);

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
            <img src={U('1565299624946-b28f40a0ae38', 1800).replace('q=72', 'q=75')} alt="Wood-fired pizza" {...{ fetchpriority: "high" }} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', animation: 'pkZoom 18s ease-in-out infinite alternate' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg,rgba(14,8,8,.9),rgba(14,8,8,.1) 62%)' }} />
            <div style={{ position: 'absolute', left: 'clamp(22px,3vw,40px)', right: 'clamp(22px,3vw,40px)', bottom: 'clamp(22px,3vw,40px)', display: 'flex', flexDirection: 'column', gap: 24 }}>
              <h1 style={{ margin: 0, fontWeight: 900, fontSize: bentoFont, lineHeight: 0.86, letterSpacing: '-.065em' }}>
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

          {/* Pickup combo tile */}
          <Hov style={{ gridArea: 'deal', position: 'relative', minHeight: 0, borderRadius: ph ? 28 : 36, background: '#D7192D', color: '#fff', overflow: 'hidden', transition: 'transform .3s' }} hover={{ transform: 'translateY(-3px)' }}>
            <div style={{ position: 'absolute', right: ph ? -46 : -60, top: ph ? -40 : -90, width: ph ? 200 : 330, height: ph ? 200 : 330, filter: 'drop-shadow(0 24px 40px rgba(0,0,0,.35))' }}>
              <img src="assets/pizza-base.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', animation: 'pkSpin 40s linear infinite' }} />
            </div>
            <div style={{ position: 'absolute', right: ph ? 54 : 170, top: ph ? 104 : 110, width: ph ? 176 : 300, height: ph ? 176 : 300, filter: 'drop-shadow(0 24px 40px rgba(0,0,0,.35))' }}>
              <img src="assets/pizza-base.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', animation: 'pkSpin 50s linear reverse infinite' }} />
            </div>
            <div aria-hidden="true" style={{ position: 'absolute', right: ph ? 8 : 18, bottom: ph ? 10 : 14, width: 236, height: 128, display: 'flex', pointerEvents: 'none', transform: ph ? (w < 380 ? 'scale(.5)' : 'scale(.64)') : undefined, transformOrigin: 'right bottom' }}>
              <span style={{ position: 'absolute', left: 14, right: 8, bottom: -4, height: 20, borderRadius: '50%', background: 'radial-gradient(closest-side,rgba(60,0,8,.5),rgba(60,0,8,0))' }} />
              <img src="assets/combo/coke.png" alt="" style={{ position: 'absolute', left: 68, bottom: 10, height: 108, filter: PRODUCT_SHADOW }} />
              <img src="assets/combo/coke.png" alt="" style={{ position: 'absolute', left: 118, bottom: 4, height: 112, filter: PRODUCT_SHADOW }} />
              <img src="assets/combo/pk-garlic-dip.png" alt="" style={{ position: 'absolute', left: 0, bottom: 8, width: 84, filter: PRODUCT_SHADOW }} />
              <img src="assets/combo/pk-garlic-dip.png" alt="" style={{ position: 'absolute', right: 0, bottom: 6, width: 84, filter: PRODUCT_SHADOW }} />
            </div>
            <div style={{ position: 'absolute', inset: 0, padding: ph ? '22px 22px' : '26px 30px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: ph ? 'linear-gradient(90deg,rgba(215,25,45,.96) 0%,rgba(215,25,45,.82) 42%,rgba(215,25,45,0) 72%)' : 'linear-gradient(90deg,rgba(215,25,45,.92) 0%,rgba(215,25,45,.6) 34%,rgba(215,25,45,0) 52%)' }}>
              <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase' }}>Pickup combo</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: ph ? 12 : 16, maxWidth: 300 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <span style={{ fontWeight: 900, fontSize: ph ? 38 : 46, lineHeight: 0.9, letterSpacing: '-.05em' }}>Two Large<br />$36.00</span>
                  <span style={{ fontSize: ph ? 14 : 15, fontWeight: 600, lineHeight: 1.4 }}>2 large pizzas, 4 toppings each,<br />2 dips and 2 pops</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <Hov
                    as="button"
                    onClick={h.onTwoLarge}
                    aria-label="Customize Two Large combo, $36.00"
                    style={{ height: 44, padding: '0 20px', border: 0, borderRadius: 999, background: '#fff', color: '#D7192D', fontFamily: 'inherit', fontWeight: 900, fontSize: 15, display: 'flex', alignItems: 'center', flex: 'none', cursor: 'pointer', transition: 'transform .2s' }}
                    hover={{ transform: 'scale(1.04)' }}
                  >
                    Customize
                  </Hov>
                </div>
              </div>
            </div>
          </Hov>

          {/* Build your own tile */}
          <Hov as="button" onClick={h.onByo} aria-label="Build your own pizza, any 4 toppings" style={{ gridArea: 'byo', position: 'relative', minHeight: 0, padding: 0, border: 0, borderRadius: ph ? 24 : 36, overflow: 'hidden', background: '#1A1414', color: '#fff', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer', transition: 'transform .3s' }} hover={{ transform: 'translateY(-3px)' }}>
            <span style={{ position: 'absolute', left: '50%', top: ph ? 78 : 120, width: 360, height: 360, marginLeft: -180, transform: ph ? 'scale(.62)' : undefined, transformOrigin: '50% 0' }}>
              <span style={{ position: 'absolute', inset: 0, animation: 'pkSpin 60s linear infinite' }}>
                <img src="assets/pizza-base.png" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
                <ByoToppings si={byoSi} />
              </span>
            </span>
            <span style={{ position: 'absolute', left: ph ? 16 : 24, right: ph ? 16 : 24, top: ph ? 16 : 22, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontWeight: 900, fontSize: ph ? 19 : 24, lineHeight: 1.1, letterSpacing: '-.03em', whiteSpace: ph ? 'normal' : 'nowrap' }}>Build your own</span>
              <span style={{ fontSize: ph ? 13 : 14, color: 'rgba(255,255,255,.7)' }}>Any 4 toppings</span>
              {ph ? null : <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', opacity: 0.92, marginTop: 6, minHeight: 18 }}>{BYO_SETS[byoSi].map((x) => x[0]).join(' · ')}</span>}
            </span>
            <span style={ph ? ARROW_DOT_SM : ARROW_DOT}><IconArrow /></span>
          </Hov>

          {/* Fresh pasta tile */}
          <Hov as="button" onClick={h.onPasta} aria-label="Fresh pasta: rosé, Alfredo, tomato" style={{ gridArea: 'pasta', position: 'relative', minHeight: 0, padding: 0, border: 0, borderRadius: ph ? 24 : 36, overflow: 'hidden', background: '#F2F2F5', color: '#fff', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer', transition: 'transform .3s' }} hover={{ transform: 'translateY(-3px)' }}>
            <img src="assets/menu/pasta.jpg" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', animation: 'pkZoom 16s ease-in-out -4s infinite alternate' }} />
            <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(14,8,8,.55),rgba(14,8,8,0) 45%)' }} />
            <span style={{ position: 'absolute', left: ph ? 16 : 24, right: ph ? 16 : 24, top: ph ? 16 : 22, display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                <div style={{ position: 'absolute', left: w < 400 ? '17%' : '9%', right: w < 400 ? '17%' : '9%', bottom: w < 400 ? '-10%' : '-13%', aspectRatio: '1/1', borderRadius: '50%', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,.28)' }}>
                  <Photo src={t.img} shape="circle" credit={c.credit} creditHref={c.creditHref} />
                </div>
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
            <span style={LEAD}>Our most-ordered pizzas. Choose size, crust and oven when you add one.</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: specialCols, gap: ph ? 10 : 16 }}>
          {SPECIALS.map((p) => {
            const c = creditOf(p);
            const meta = [p.veg ? 'Vegetarian' : null, p.tag || null].filter(Boolean).join(' · ');
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
                    {meta && <span style={{ fontSize: ph ? 10.5 : 12, fontWeight: 800, letterSpacing: '.07em', textTransform: 'uppercase', color: p.veg ? '#12663A' : '#C11425' }}>{meta}</span>}
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
          <span style={LEAD}>Walk-in combo prices, available on online pickup orders.</span>
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
                <span style={{ fontSize: 15, lineHeight: 1.45, color: '#fff' }}>Smoky, blistered, charred crust. Our default.</span>
              </div>
              <div style={{ background: '#2C2424', borderRadius: ph ? 18 : 22, padding: ph ? 14 : 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontWeight: 900, fontSize: 20, letterSpacing: '-.02em' }}>Conventional</span>
                <span style={{ fontSize: 15, lineHeight: 1.45, color: '#CFC6C0' }}>Even bake, softer crust. The classic.</span>
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
              <InfoBlock label="Address"><span>{SHOP.street}<br />{SHOP.cityLine}</span></InfoBlock>
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
                <span style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.45, textWrap: 'pretty' } as CSSProperties}>Available through DoorDash and Uber Eats.</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                <AppPill href={SHOP.doordash} logo={SHOP.doordashLogo} name="DoorDash" h={14} />
                <AppPill href={SHOP.ubereats} logo={SHOP.ubereatsLogo} name="Uber Eats" h={18} />
              </div>
            </div>
          </div>
          <div style={{ position: 'relative', borderRadius: 32, overflow: 'hidden', minHeight: 380, background: '#2A1E1A', display: ph ? 'none' : undefined }}>
            <Photo src={U('1555072956-7758afb20e8f', 1400)} alt="" credit="Photo by Pinar Kucuk on Unsplash" creditHref="https://unsplash.com/@pinarimsi" />
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
function AppPill({ href, logo, name, h }: { href: string; logo: string; name: string; h: number }) {
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
