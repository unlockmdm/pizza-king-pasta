// Port of design_handoff_pizza_king_website/prototype/PastaPage.dc.html
// Pasta Bar: one card per sauce, each opening PastaSheet (pasta, spice, extras), plus momos.
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { PastaPageProps } from '../lib/types';
import { Hov, Photo, IconBack } from '../lib/ui';
import { useWidth } from '../lib/hooks';
import { U, itemPhoto } from '../lib/catalog';
import { money } from '../lib/format';
import { MOMOS as MOMO_DATA, PASTA_BASES, PASTA_SAUCES, mustPrice, type LineSpec } from '../lib/pricing';
import PastaSheet from './PastaSheet';

// ---------- Data (the prototype's `const` arrays are the spec) ----------

type SauceId = 'rose' | 'alfredo' | 'tomato';
type BaseId = 'classic' | 'veggie' | 'chicken';

/** [id, name, description, Unsplash photo id] */
type Sauce = readonly [id: SauceId, name: string, desc: string, photo: string];
const SAUCE_UI: Record<SauceId, [desc: string, photo: string]> = {
  rose: ['Tomato, cream, parmesan', 'assets/menu/pasta-rose.png'],
  alfredo: ['Cream, parmesan', 'assets/menu/pasta-alfredo.png'],
  tomato: ['Tomato sauce', '1598866594230-a7c12756260f'],
};
// Names and prices come from the shared pricing module.
const SAUCES: readonly Sauce[] = PASTA_SAUCES.map(([id, name]): Sauce => [id, name, ...SAUCE_UI[id]]);

interface Base {
  id: BaseId;
  name: string;
  veg?: boolean;
  desc: string;
  /** Price per sauce. A missing sauce means the base isn't offered with it. */
  p: Partial<Record<SauceId, number>>;
}
const BASES: readonly Base[] = PASTA_BASES.map((b) => ({ ...b, veg: b.id === 'veggie' }));

type MomoId = 'veg' | 'nonveg';

const MOMOS: readonly (readonly [id: MomoId, name: string, price: number])[] = MOMO_DATA;

const HERO_IMG = 'assets/menu/pasta-rose.png';
const HERO_IMG_WIDE = 'assets/menu/pasta-rose.png';
const MOMOS_IMG = itemPhoto('momos', 1000);

// ---------- Static styles ----------

const S = {
  root: { fontFamily: "'Figtree',system-ui,sans-serif", color: '#1A1414', background: '#fff', paddingBottom: 96 },
  heroSection: { maxWidth: 1320, margin: '0 auto', padding: '16px clamp(16px,3vw,32px) 0' },
  hero: { position: 'relative', borderRadius: 32, overflow: 'hidden', background: '#1A1210', color: '#fff', display: 'grid', minHeight: 'clamp(320px,40vh,420px)' },
  heroImgNarrow: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' },
  heroShadeNarrow: { position: 'absolute', inset: 0, background: 'linear-gradient(0deg,rgba(26,18,16,.95) 0%,rgba(26,18,16,.55) 55%,rgba(26,18,16,.25) 100%)' },
  heroBody: { position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 40, padding: 'clamp(22px,4vw,52px)' },
  back: {
    alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8, height: 44, padding: '0 18px 0 14px', border: 0, borderRadius: 999,
    background: 'rgba(255,255,255,.12)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.24)', color: '#fff', fontFamily: 'inherit', fontWeight: 800, fontSize: 15, cursor: 'pointer',
  },
  backHover: { background: 'rgba(255,255,255,.22)' },
  heroText: { display: 'flex', flexDirection: 'column', gap: 18 },
  eyebrow: { fontSize: 12, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase', color: '#F2B53A' },
  h1: { margin: 0, fontWeight: 900, fontSize: 'clamp(48px,6.6vw,92px)', lineHeight: 0.9, letterSpacing: '-.055em' },
  heroP: { margin: 0, maxWidth: 440, fontSize: 17, lineHeight: 1.5, color: '#D9D0CA', textWrap: 'pretty' },
  heroMediaWide: { position: 'relative', minHeight: '100%' },
  heroShadeWide: { position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(90deg,#1A1210 0%,rgba(26,18,16,0) 40%)' },

  body: { maxWidth: 1320, margin: '0 auto', padding: '40px clamp(16px,3vw,32px) 0', display: 'flex', flexDirection: 'column', gap: 18 },
  h2: { margin: 0, fontWeight: 900, fontSize: 'clamp(28px,3vw,36px)', letterSpacing: '-.04em' },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,280px),1fr))', gap: 16 },
  card: { display: 'flex', flexDirection: 'column', padding: 0, border: 0, borderRadius: 24, overflow: 'hidden', background: '#fff', boxShadow: '0 0 0 1px #E6E6EA', fontFamily: 'inherit', color: '#1A1414', textAlign: 'left', cursor: 'pointer', transition: 'transform .2s,box-shadow .2s' },
  cardHover: { transform: 'translateY(-3px)', boxShadow: '0 0 0 1px #E6E6EA, 0 16px 32px rgba(26,20,20,.10)' },
  cardImg: { display: 'block', aspectRatio: '16/10', backgroundColor: '#EDEDF0', backgroundSize: 'cover', backgroundPosition: 'center' },
  cardBody: { display: 'flex', flexDirection: 'column', gap: 6, padding: '16px 18px 18px' },
  cardTitle: { fontWeight: 900, fontSize: 22, letterSpacing: '-.03em', lineHeight: 1.15 },
  cardDesc: { fontSize: 14, lineHeight: 1.4, color: '#646467' },
  cardFoot: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 8 },
  cardPrice: { fontWeight: 900, fontSize: 17 },
  cardCta: { height: 40, padding: '0 18px', borderRadius: 999, background: '#D7192D', color: '#fff', fontWeight: 800, fontSize: 15, display: 'flex', alignItems: 'center' },
  redHover: { background: '#B5121F' },

  momoSection: { maxWidth: 1320, margin: '0 auto', padding: '48px clamp(16px,3vw,32px) 0' },
  momoWrap: { display: 'flex', flexDirection: 'column', gap: 18, borderTop: '1px solid #EDEDF0' },
  momoHead: { display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 28 },
  momoEyebrow: { fontSize: 12, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: '#818184' },
  momoCard: { display: 'grid', borderRadius: 28, overflow: 'hidden', background: '#1A1414', color: '#fff' },
  momoMedia: { position: 'relative', minHeight: 260, background: '#2A2020' },
  momoBody: { display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 22, padding: 'clamp(22px,3vw,36px)' },
  momoText: { display: 'flex', flexDirection: 'column', gap: 8 },
  momoTitle: { fontWeight: 900, fontSize: 'clamp(30px,3vw,40px)', letterSpacing: '-.045em', lineHeight: 1 },
  momoDesc: { fontSize: 15, lineHeight: 1.5, color: '#CFC6C0' },
  momoSeg: { display: 'flex', gap: 4, padding: 4, borderRadius: 999, background: 'rgba(255,255,255,.1)' },
  momoSegBtn: { flex: 1, minWidth: 0, height: 48, border: 0, borderRadius: 999, fontFamily: 'inherit', fontWeight: 800, fontSize: 15, whiteSpace: 'nowrap', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background .2s,color .2s' },
  momoSegPrice: { opacity: 0.7, fontWeight: 700 },
  momoAdd: { height: 54, border: 0, borderRadius: 999, color: '#fff', fontFamily: 'inherit', fontWeight: 800, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px', transition: 'background .2s' },
} satisfies Record<string, CSSProperties>;

// ---------- Component ----------

export default function PastaPage({ onAdd, onBack }: PastaPageProps) {
  const w = useWidth();
  const [momo, setMomo] = useState<MomoId>('veg');
  const [open, setOpen] = useState<SauceId | null>(null);
  const [addedM, setAddedM] = useState<MomoId | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);

  /** One shared timer resets both "Added" states after 1.4s, as in the prototype. */
  const flash = (apply: () => void) => {
    clearTimeout(timer.current);
    apply();
    timer.current = setTimeout(() => setAddedM(null), 1400);
  };

  const wide = w >= 980;
  const momoSel = MOMOS.find((m) => m[0] === momo) || MOMOS[0];

  const back = (e?: { preventDefault?: () => void }) => { e?.preventDefault?.(); onBack?.(); };
  const addMomo = () => {
    const m = momoSel;
    const spec: LineSpec = { k: 'momo', id: m[0] };
    const q = mustPrice(spec);
    onAdd?.({ key: 'momos-' + m[0], name: q.name, summary: q.summary, unit: q.unit, spec }, 1);
    flash(() => setAddedM(m[0]));
  };

  return (
    <div style={S.root}>
      <section style={S.heroSection}>
        <div style={{ ...S.hero, gridTemplateColumns: wide ? 'minmax(0,1.1fr) minmax(0,1fr)' : 'minmax(0,1fr)' }}>
          {!wide ? (
            <>
              <img src={HERO_IMG} alt="" style={S.heroImgNarrow} />
              <div style={S.heroShadeNarrow} />
            </>
          ) : null}
          <div style={S.heroBody}>
            <Hov as="button" type="button" onClick={back} style={S.back} hover={S.backHover}>
              <IconBack size={16} stroke={2.8} />
              Back
            </Hov>
            <div style={S.heroText}>
              <span style={S.eyebrow}>Pasta & momos</span>
              <h1 style={S.h1}>
                Hot pasta,
                <br />
                <span style={{ color: '#F2B53A' }}>cooked to order.</span>
              </h1>
              <p style={S.heroP}>Chicken, veggie or regular, in rosé, Alfredo or tomato sauce. Finished with parmesan, ginger and parsley.</p>
            </div>
          </div>
          {wide ? (
            <div style={S.heroMediaWide}>
              <Photo src={HERO_IMG_WIDE} alt="" credit="Photo on Unsplash" creditHref="https://unsplash.com" eager />
              <div style={S.heroShadeWide} />
            </div>
          ) : null}
        </div>
      </section>

      <section style={S.body}>
        <h2 style={S.h2}>Choose your pasta</h2>
        {/* One card per sauce; the card opens the pasta choices (chicken / veggie / regular), spice and extras. */}
        <div style={S.cards}>
          {SAUCES.map(([sid, sname, sdesc, pic]) => {
            const from = Math.min(...BASES.map((b) => b.p[sid] ?? Infinity));
            const img = pic.indexOf('assets/') === 0 ? pic : U(pic, 900);
            return (
              <Hov as="button" key={sid} type="button" onClick={() => setOpen(sid)} aria-label={sname + ' Sauce Pasta, from ' + money(from)} style={S.card} hover={S.cardHover}>
                <span aria-hidden="true" style={{ ...S.cardImg, backgroundImage: `url('${img}')` }} />
                <span style={S.cardBody}>
                  <span style={S.cardTitle}>{sname} Sauce Pasta</span>
                  <span style={S.cardDesc}>{sdesc} · Chicken, veggie{BASES.some((b) => b.id === 'classic' && b.p[sid] != null) ? ' or regular' : ''}</span>
                  <span style={S.cardFoot}>
                    <span style={S.cardPrice}>From {money(from)}</span>
                    <span style={S.cardCta}>Choose</span>
                  </span>
                </span>
              </Hov>
            );
          })}
        </div>
      </section>

      {open ? (
        <PastaSheet
          sauce={open}
          img={(() => { const p = (SAUCES.find((x) => x[0] === open) || SAUCES[0])[3]; return p.indexOf('assets/') === 0 ? p : U(p, 900); })()}
          onClose={() => setOpen(null)}
          onAdd={(line, qty) => { setOpen(null); onAdd?.(line, qty); }}
        />
      ) : null}

      <section style={S.momoSection}>
        <div style={{ maxWidth: 'none' }}>
          <div style={S.momoWrap}>
            <div style={S.momoHead}>
              <span style={S.momoEyebrow}>Also on the menu</span>
              <h2 style={S.h2}>Momos</h2>
            </div>
            <div style={{ ...S.momoCard, gridTemplateColumns: wide ? 'minmax(0,1.1fr) minmax(0,1fr)' : 'minmax(0,1fr)' }}>
              <div style={S.momoMedia}>
                <Photo src={MOMOS_IMG} alt="Steamed momos" credit="Photo on Unsplash" creditHref="https://unsplash.com" />
              </div>
              <div style={S.momoBody}>
                <div style={S.momoText}>
                  <span style={S.momoTitle}>Steamed dumplings</span>
                  <span style={S.momoDesc}>Veggie or non-veggie, made to order.</span>
                </div>
                <div role="radiogroup" aria-label="Momos" style={S.momoSeg}>
                  {MOMOS.map(([id, name, pr]) => {
                    const on = momo === id;
                    return (
                      <button key={id} type="button" role="radio" aria-checked={on} onClick={() => setMomo(id)} style={{ ...S.momoSegBtn, background: on ? '#fff' : 'transparent', color: on ? '#1A1414' : '#fff' }}>
                        {name}
                        <span style={S.momoSegPrice}>{money(pr)}</span>
                      </button>
                    );
                  })}
                </div>
                <Hov as="button" type="button" onClick={addMomo} style={{ ...S.momoAdd, background: addedM ? '#1E8A4C' : '#D7192D' }} hover={S.redHover}>
                  <span>{addedM ? 'Added' : 'Add to order'}</span>
                  <span>{money(momoSel[2])}</span>
                </Hov>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
