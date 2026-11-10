// Port of design_handoff_pizza_king_website/prototype/MeatFavourites.dc.html
// Meat Favourites category page: photo hero, filter chips, Build Your Own card, meat pizzas with S/M/L/XL.
// Renders inside the homepage shell (no header/footer here).
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import type { BuilderItem, MeatFavouritesProps, NewLine, SizeKey } from '../lib/types';
import { Hov, Photo } from '../lib/ui';
import { SIZE_NAMES, SIZE_PRICES, U, creditOf, pricesFor } from '../lib/catalog';
import { money } from '../lib/format';
import { useWidth } from '../lib/hooks';

// ---------- Data (the prototype's const arrays are the spec) ----------

interface MeatPizza {
  id: string;
  name: string;
  desc: string;
  /** Topping ids for the Pizza Builder (see TOPS there). */
  tops: string[];
  /** Unsplash photo id. */
  pic: string;
  /** Photographer name and Unsplash handle, for the credit. */
  by: string;
  h: string;
  chicken?: boolean;
  cured?: boolean;
  tag?: string;
}

const PIZZAS: MeatPizza[] = [
  { id: 'meat-lover', name: 'Meat Lover', desc: 'Pepperoni, ham, bacon, sausages', tops: ['pepperoni', 'ham', 'bacon', 'sausage'], pic: '1692737580547-b45bb4a02356', by: 'David Foodphototasty', h: 'phototastyfood', cured: true },
  { id: 'butter-chicken', name: 'Butter Chicken', desc: 'Tandoori chicken, green pepper, onion', tops: ['tandoori-chicken', 'green-peppers', 'red-onions'], pic: '1604382354936-07c5d9983bd3', by: 'Shourav Sheikh', h: 'shouravsheikh', chicken: true },
  { id: 'chicken-shawarma', name: 'Shawarma Chicken', desc: 'Garlic base, shawarma chicken, hot peppers, onions', tops: ['shawarma-chicken', 'hot-peppers', 'red-onions'], pic: '1590947132387-155cc02f3212', by: 'Vit Ch', h: 'v_uk_europe', chicken: true, tag: 'Spicy' },
  { id: 'non-veg', name: 'Non-Vegetarian', desc: 'Grilled chicken, sausage, hot salami, ham', tops: ['grilled-chicken', 'sausage', 'hot-salami', 'ham'], pic: '1593560708920-61dd98c46a4e', by: 'Saundarya Srinivasan', h: 'saundiii', chicken: true, cured: true },
  { id: 'pepperoni', name: 'Pepperoni', desc: 'Pepperoni and mozzarella', tops: ['pepperoni'], pic: '1611915365928-565c527a0590', by: 'Tamas Pap', h: 'tamasp', cured: true },
  { id: 'canadian', name: 'Canadian', desc: 'Pepperoni, mushroom, bacon', tops: ['pepperoni', 'mushrooms', 'bacon'], pic: '1565299624946-b28f40a0ae38', by: 'Chad Montano', h: 'briewilly', cured: true },
  { id: 'hawaiian', name: 'Hawaiian', desc: 'Pineapple, bacon, ham', tops: ['pineapple', 'bacon', 'ham'], pic: '1594007654729-407eedc4be65', by: 'Saahil Khatkhate', h: 'saahilkhatkhate', cured: true },
  { id: 'bismark', name: 'Bismark', desc: 'Sun dried tomatoes, grilled chicken, sausage', tops: ['sun-dried', 'grilled-chicken', 'sausage'], pic: '1655673654158-9f7285b7d1ea', by: 'RUSU CIPRIAN', h: 'tehnosign', chicken: true, cured: true },
  { id: 'four-seasons', name: 'Four Seasons', desc: 'Ham, mushrooms, artichokes, black olives', tops: ['ham', 'mushrooms', 'olives'], pic: '1604382355076-af4b0eb60143', by: 'Shourav Sheikh', h: 'shouravsheikh', cured: true },
];

type FilterId = 'all' | 'chicken' | 'cured';
const FILTERS: [FilterId, string, (p: MeatPizza) => boolean][] = [
  ['all', 'All', () => true],
  ['chicken', 'Chicken', (p) => !!p.chicken],
  ['cured', 'Pepperoni, ham & sausage', (p) => !!p.cured],
];

const SIZE_KEYS: SizeKey[] = ['S', 'M', 'L', 'XL'];
const DEFAULT_SIZE: SizeKey = 'L';
/** How long the "+" button stays green with a check after adding. */
const ADDED_MS = 1400;

const HERO_IMG = U('1611915365928-565c527a0590', 2000);
const BYO_IMG = U('1513104890138-7c749659a591', 800);

const tagStyle = { position: 'absolute', left: 14, top: 14, height: 30, padding: '0 12px', borderRadius: 999, background: '#fff', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', boxShadow: '0 4px 14px rgba(0,0,0,.12)' } as const;

export default function MeatFavourites({ onAdd, onCustomize, onBack, onMenu, onBuild }: MeatFavouritesProps) {
  const [filter, setFilter] = useState<FilterId>('all');
  const [sizes, setSizes] = useState<Partial<Record<string, SizeKey>>>({});
  const ph = useWidth() < 600; // phone: two-column compact cards
  const [added, setAdded] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const add = (p: MeatPizza, size: SizeKey) => {
    const line: NewLine = {
      key: [p.id, size, 'regular', 'house'].join('-'),
      name: SIZE_NAMES[size] + ' ' + p.name,
      summary: 'Regular crust · house toppings',
      unit: pricesFor(p.id)[size],
    };
    onAdd(line, 1);
    window.clearTimeout(timer.current);
    setAdded(p.id);
    timer.current = window.setTimeout(() => setAdded(null), ADDED_MS);
  };

  const customize = (p: MeatPizza) => {
    const item: BuilderItem = { id: p.id, name: p.name, desc: p.desc, tops: p.tops, img: U(p.pic, 1000), prices: pricesFor(p.id), ...creditOf(p) };
    onCustomize(item);
  };

  const ev = (fn: () => void) => (e: MouseEvent) => {
    e.preventDefault();
    fn();
  };
  const test = (FILTERS.find((f) => f[0] === filter) || FILTERS[0])[2];

  return (
    <div style={{ fontFamily: "'Figtree',system-ui,sans-serif", color: '#1A1414', background: '#fff', paddingBottom: 96 }}>
      {/* Hero */}
      <section style={{ maxWidth: 1320, margin: '0 auto', padding: '16px clamp(16px,3vw,32px) 0' }}>
        <div style={{ position: 'relative', borderRadius: ph ? 28 : 32, overflow: 'hidden', minHeight: ph ? 300 : 'clamp(380px,48vh,480px)', background: '#1A1210', color: '#fff', display: 'flex' }}>
          <Photo src={HERO_IMG} alt="" credit="Photo by Tamas Pap on Unsplash" creditHref="https://unsplash.com/@tamasp" eager />
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(0deg,rgba(18,10,8,.92) 0%,rgba(18,10,8,.5) 45%,rgba(18,10,8,.15) 100%),linear-gradient(90deg,rgba(18,10,8,.6) 0%,rgba(18,10,8,0) 65%)' }} />
          <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: ph ? 28 : 48, padding: 'clamp(20px,4vw,52px)', pointerEvents: 'none' }}>
            <Hov
              as="button"
              type="button"
              onClick={ev(onBack)}
              style={{ pointerEvents: 'auto', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8, height: 44, padding: '0 18px 0 14px', border: 0, borderRadius: 999, background: 'rgba(255,255,255,.14)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.28)', color: '#fff', fontFamily: 'inherit', fontWeight: 800, fontSize: 15, cursor: 'pointer', transition: 'background .2s' }}
              hover={{ background: 'rgba(255,255,255,.26)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
              Back
            </Hov>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: '#FF8A80' }}>Pizza · 8 recipes</span>
              <h1 style={{ margin: 0, fontWeight: 900, fontSize: 'clamp(52px,7.4vw,104px)', lineHeight: 0.9, letterSpacing: '-.055em' }}>
                Meat
                <br />
                <span style={{ color: '#FF5A4E' }}>Favourites.</span>
              </h1>
              <p style={{ margin: 0, maxWidth: 520, fontSize: 'clamp(16px,1.4vw,18px)', lineHeight: 1.5, color: '#DADADD', textWrap: 'pretty' }}>Pepperoni, ham, bacon, sausage and chicken on our wood-fired crust.</p>
            </div>
          </div>
          <a href="https://unsplash.com/@tamasp" target="_blank" rel="noreferrer" style={{ position: 'absolute', right: 20, top: 16, fontSize: 11, color: 'rgba(255,255,255,.55)', textDecoration: 'none' }}>Photo: Tamas Pap / Unsplash</a>
        </div>
      </section>

      <section style={{ maxWidth: 1320, margin: '0 auto', padding: '0 clamp(16px,3vw,32px)' }}>
        {/* Filters + full menu link */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, padding: '36px 0 24px' }}>
          <div role="tablist" aria-label="Filter pizzas" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {FILTERS.map(([id, label, fn]) => {
              const on = filter === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setFilter(id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, height: 44, padding: '0 18px', border: 0, borderRadius: 999, background: on ? '#1A1414' : '#EDEDF0', color: on ? '#fff' : '#1A1414', fontFamily: 'inherit', fontWeight: 800, fontSize: 15, cursor: 'pointer', transition: 'background .2s,color .2s' }}
                >
                  {label}
                  <span style={{ fontSize: 13, fontWeight: 700, opacity: 0.6 }}>{PIZZAS.filter(fn).length}</span>
                </button>
              );
            })}
          </div>
          <Hov
            as="a"
            href="#menu"
            onClick={ev(onMenu)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 15, color: '#1A1414', textDecoration: 'none' }}
            hover={{ color: '#D7192D' }}
          >
            Full menu
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </Hov>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: ph ? 'repeat(2,minmax(0,1fr))' : 'repeat(auto-fill,minmax(min(100%,290px),1fr))', gap: ph ? 10 : 20 }}>
          {/* Build Your Own always first */}
          <Hov
            as="article"
            style={{ display: 'flex', flexDirection: ph ? 'row' : 'column', gridColumn: ph ? '1 / -1' : undefined, borderRadius: ph ? 22 : 28, overflow: 'hidden', background: '#D7192D', color: '#fff', transition: 'transform .3s cubic-bezier(.2,.8,.2,1),box-shadow .3s' }}
            hover={{ transform: 'translateY(-4px)', boxShadow: '0 22px 44px rgba(215,25,45,.28)' }}
          >
            <div style={{ position: 'relative', aspectRatio: ph ? undefined : '4/3', width: ph ? '40%' : undefined, flex: ph ? 'none' : undefined, minHeight: ph ? 180 : undefined, background: '#B51424' }}>
              <Photo src={BYO_IMG} alt="" credit="Photo by Ivan Torres on Unsplash" creditHref="https://unsplash.com/@iavnt" />
              {ph ? null : <span style={{ ...tagStyle, color: '#D7192D' }}>Build your own</span>}
            </div>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: ph ? 14 : 20, padding: ph ? 16 : 22 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontWeight: 900, fontSize: ph ? 24 : 'clamp(30px,2.8vw,38px)', lineHeight: 0.95, letterSpacing: '-.05em' }}>
                  Your meats.
                  <br />
                  Your way.
                </span>
                <span style={{ fontSize: 14, lineHeight: 1.45, color: '#EDEDF0' }}>Pick any 4 toppings, from {money(SIZE_PRICES.S)}.</span>
              </div>
              <Hov
                as="button"
                type="button"
                onClick={ev(onBuild)}
                style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 12, height: ph ? 46 : 56, padding: ph ? '0 5px 0 16px' : '0 8px 0 24px', border: 0, borderRadius: 999, background: '#fff', color: '#1A1414', fontFamily: 'inherit', fontWeight: 800, fontSize: ph ? 14 : 16, cursor: 'pointer', transition: 'transform .2s' }}
                hover={{ transform: 'translateY(-2px)' }}
              >
                Start building
                <span style={{ width: ph ? 36 : 40, height: ph ? 36 : 40, borderRadius: '50%', background: '#D7192D', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </span>
              </Hov>
            </div>
          </Hov>

          {PIZZAS.filter(test).map((p) => {
            const size = sizes[p.id] || DEFAULT_SIZE;
            const justAdded = added === p.id;
            const { credit, creditHref } = creditOf(p);
            return (
              <Hov
                key={p.id}
                as="article"
                style={{ display: 'flex', flexDirection: 'column', borderRadius: ph ? 18 : 28, overflow: 'hidden', background: '#fff', boxShadow: 'inset 0 0 0 1px #E8E8EB', transition: 'transform .3s cubic-bezier(.2,.8,.2,1),box-shadow .3s' }}
                hover={{ transform: 'translateY(-4px)', boxShadow: 'inset 0 0 0 1px #E8E8EB,0 22px 44px rgba(26,20,20,.12)' }}
              >
                <div onClick={() => customize(p)} style={{ position: 'relative', aspectRatio: '4/3', background: '#EDEDF0', cursor: 'pointer' }}>
                  <Photo src={U(p.pic, 800)} alt={p.name + ' pizza'} credit={credit} creditHref={creditHref} />
                  {p.tag ? <span style={{ ...tagStyle, color: '#1A1414', ...(ph ? { left: 8, top: 8, height: 24, padding: '0 9px', fontSize: 11 } : {}) }}>{p.tag}</span> : null}
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: ph ? 10 : 18, padding: ph ? '10px 10px 10px' : '20px 20px 20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: ph ? 3 : 6, padding: ph ? '0 2px' : 0 }}>
                    <Hov
                      as="button"
                      type="button"
                      onClick={() => customize(p)}
                      style={{ alignSelf: 'flex-start', padding: 0, border: 0, background: 'none', fontFamily: 'inherit', fontWeight: 900, fontSize: ph ? 15 : 22, letterSpacing: ph ? '-.02em' : '-.03em', lineHeight: ph ? 1.2 : 1.1, color: '#1A1414', textAlign: 'left', cursor: 'pointer' }}
                      hover={{ color: '#D7192D' }}
                    >
                      {p.name}
                    </Hov>
                    <span style={{ fontSize: ph ? 12.5 : 14, lineHeight: ph ? 1.4 : 1.45, color: '#646467', textWrap: 'pretty', ...(ph ? { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } : {}) }}>{p.desc}</span>
                  </div>
                  <div role="radiogroup" aria-label="Size" style={{ marginTop: 'auto', display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: ph ? 2 : 4, padding: ph ? 3 : 4, borderRadius: 999, background: '#EDEDF0' }}>
                    {SIZE_KEYS.map((k) => {
                      const on = k === size;
                      return (
                        <button
                          key={k}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          aria-label={SIZE_NAMES[k] + ', ' + money(pricesFor(p.id)[k])}
                          onClick={() => setSizes((st) => ({ ...st, [p.id]: k }))}
                          style={{ height: ph ? 34 : 40, padding: 0, border: 0, borderRadius: 999, background: on ? '#fff' : 'transparent', color: on ? '#1A1414' : '#818184', boxShadow: on ? '0 2px 8px rgba(26,20,20,.12)' : 'none', fontFamily: 'inherit', fontWeight: 800, fontSize: 13, cursor: 'pointer', transition: 'background .2s,color .2s' }}
                        >
                          {k}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                      <span style={{ fontWeight: 900, fontSize: ph ? 17 : 26, letterSpacing: ph ? '-.02em' : '-.04em', lineHeight: 1 }}>{money(pricesFor(p.id)[size])}</span>
                      <span style={{ fontSize: ph ? 11 : 12, fontWeight: 600, color: '#818184' }}>{SIZE_NAMES[size]}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Hov
                        as="button"
                        type="button"
                        onClick={() => customize(p)}
                        style={{ display: ph ? 'none' : undefined, height: 48, padding: '0 16px', border: 0, borderRadius: 999, background: '#fff', boxShadow: 'inset 0 0 0 1.5px #DBDBDE', color: '#1A1414', fontFamily: 'inherit', fontWeight: 800, fontSize: 14, cursor: 'pointer', transition: 'box-shadow .2s' }}
                        hover={{ boxShadow: 'inset 0 0 0 1.5px #1A1414' }}
                      >
                        Customize
                      </Hov>
                      <Hov
                        as="button"
                        type="button"
                        onClick={() => add(p, size)}
                        aria-label={'Add ' + SIZE_NAMES[size] + ' ' + p.name + ', ' + money(pricesFor(p.id)[size])}
                        style={{ width: ph ? 38 : 48, height: ph ? 38 : 48, flex: 'none', border: 0, borderRadius: '50%', background: justAdded ? '#1E8A4C' : '#D7192D', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .2s,transform .2s' }}
                        hover={{ transform: 'scale(1.06)' }}
                      >
                        {justAdded ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
                        )}
                      </Hov>
                    </div>
                  </div>
                </div>
              </Hov>
            );
          })}
        </div>
      </section>
    </div>
  );
}
