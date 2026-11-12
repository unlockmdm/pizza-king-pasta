// Port of design_handoff_pizza_king_website/prototype/PastaPage.dc.html
// Pasta Bar (sauce → base → sticky summary) plus momos.
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { PastaPageProps } from '../lib/types';
import { Hov, Photo, IconBack, IconCheck, IconMinus, IconPlus } from '../lib/ui';
import { useWidth } from '../lib/hooks';
import { U } from '../lib/catalog';
import { money } from '../lib/format';
import { MOMOS as MOMO_DATA, PASTA_BASES, PASTA_EXTRAS, PASTA_REMOVE, PASTA_SAUCES, SPICES as SPICE_LIST, mustPrice, type LineSpec } from '../lib/pricing';

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
  /** Tile background behind the ingredient cut-outs. */
  tint: string;
  /** [ingredient file, x %, y %, width %, rotation deg] */
  ings: readonly (readonly [file: string, x: number, y: number, w: number, r: number])[];
  desc: string;
  /** Price per sauce. A missing sauce means the base isn't offered with it. */
  p: Partial<Record<SauceId, number>>;
}
const BASE_UI: Record<BaseId, Pick<Base, 'veg' | 'tint' | 'ings'>> = {
  classic: { tint: '#F6F0E4', ings: [['ginger', 34, 44, 46, -12], ['coriander', 68, 58, 44, 18]] },
  veggie: { veg: true, tint: '#EAF3E6', ings: [['broccoli', 30, 36, 36, -10], ['mushrooms', 70, 34, 34, 14], ['green-peppers', 34, 70, 36, 8], ['red-onions', 70, 70, 34, -16]] },
  chicken: { tint: '#F7ECE4', ings: [['tandoori-chicken', 46, 48, 52, -6], ['green-peppers', 78, 30, 30, 20], ['red-onions', 78, 72, 30, -12]] },
};
const BASES: readonly Base[] = PASTA_BASES.map((b) => ({ ...b, ...BASE_UI[b.id] }));

/** Bowl photo per `${base}-${sauce}`; falls back to the sauce photo. */
const PHOTO: Partial<Record<`${BaseId}-${SauceId}`, string>> = {
  'chicken-tomato': '1611270629569-8b357cb88da9',
};

type MomoId = 'veg' | 'nonveg';
/** Spice level, same options as the shop's Square "Pasta Spice Level" list. */
const SPICES = SPICE_LIST;

const MOMOS: readonly (readonly [id: MomoId, name: string, price: number])[] = MOMO_DATA;

const HERO_IMG = 'assets/menu/pasta-rose.png';
const HERO_IMG_WIDE = 'assets/menu/pasta-rose.png';
const MOMOS_IMG = 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?fm=jpg&q=72&w=1000&auto=format&fit=crop';

// ---------- Static styles ----------

const RING_ON = '0 0 0 3px #D7192D, 0 16px 32px rgba(215,25,45,.16)';
const RING_OFF = '0 0 0 1px #E6E6EA';

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

  body: { maxWidth: 1320, margin: '0 auto', padding: '40px clamp(16px,3vw,32px) 0', display: 'grid', gap: 40, alignItems: 'start' },
  steps: { display: 'flex', flexDirection: 'column', gap: 48, minWidth: 0 },
  step: { display: 'flex', flexDirection: 'column', gap: 18 },
  stepHead: { display: 'flex', flexDirection: 'column', gap: 6 },
  stepNum: { fontWeight: 900, fontSize: 14, letterSpacing: '.12em', color: '#D7192D' },
  h2: { margin: 0, fontWeight: 900, fontSize: 'clamp(28px,3vw,36px)', letterSpacing: '-.04em' },
  choiceGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,200px),1fr))', gap: 14 },
  choice: { display: 'flex', flexDirection: 'column', padding: 0, border: 0, borderRadius: 24, overflow: 'hidden', background: '#fff', fontFamily: 'inherit', color: '#1A1414', textAlign: 'left' },
  liftHover: { transform: 'translateY(-3px)' },
  choiceMedia: { position: 'relative', display: 'block', aspectRatio: '4/3', overflow: 'hidden' },
  sauceImg: { display: 'block', flex: 'none', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', position: 'absolute', inset: 0, width: '100%', height: '100%', backgroundSize: 'cover', transition: 'transform .5s cubic-bezier(.2,.8,.2,1)' },
  ing: { display: 'block', flex: 'none', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', position: 'absolute', aspectRatio: '1/1', backgroundSize: 'contain', filter: 'drop-shadow(0 10px 14px rgba(0,0,0,.18))', transition: 'transform .5s cubic-bezier(.2,.8,.2,1)' },
  tick: { position: 'absolute', right: 12, top: 12, width: 28, height: 28, borderRadius: '50%', boxShadow: '0 0 0 2px #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', transition: 'background .2s' },
  vegBadge: { position: 'absolute', left: 12, top: 12, height: 28, padding: '0 10px 0 8px', borderRadius: 999, background: '#fff', color: '#12663A', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(0,0,0,.1)' },
  vegDot: { width: 8, height: 8, borderRadius: '50%', background: '#1E9E4A' },
  choiceText: { display: 'flex', flexDirection: 'column', gap: 4, padding: '16px 18px 18px' },
  choiceName: { fontWeight: 900, fontSize: 21, letterSpacing: '-.03em' },
  choiceDesc: { fontSize: 14, lineHeight: 1.4, color: '#646467' },
  baseTitleRow: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 },
  basePrice: { fontWeight: 900, fontSize: 17, whiteSpace: 'nowrap' },

  aside: { top: 96, display: 'flex', flexDirection: 'column', borderRadius: 28, overflow: 'hidden', background: '#1A1414', color: '#fff' },
  bowlMedia: { position: 'relative', background: '#2A2020', overflow: 'hidden' },
  bowlImg: { display: 'block', flex: 'none', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', position: 'absolute', inset: 0, width: '100%', height: '100%', backgroundSize: 'cover' },
  bowlShade: { position: 'absolute', inset: 0, background: 'linear-gradient(0deg,rgba(26,20,20,1) 0%,rgba(26,20,20,0) 55%)' },
  bowlPill: {
    position: 'absolute', left: 20, top: 18, height: 30, padding: '0 12px', borderRadius: 999, background: 'rgba(255,255,255,.16)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
    fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center',
  },
  bowlBody: { display: 'flex', flexDirection: 'column', gap: 18, padding: '0 22px 22px', marginTop: -28, position: 'relative' },
  bowlHead: { display: 'flex', flexDirection: 'column', gap: 6 },
  bowlTitle: { fontWeight: 900, fontSize: 26, letterSpacing: '-.035em', lineHeight: 1.1 },
  bowlDesc: { fontSize: 14, lineHeight: 1.5, color: '#CFC6C0' },
  bowlActions: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
  stepper: { flex: 'none', display: 'flex', alignItems: 'center', gap: 2, height: 52, padding: '0 4px', borderRadius: 999, background: 'rgba(255,255,255,.1)' },
  stepBtn: { width: 44, height: 44, border: 0, borderRadius: '50%', background: 'transparent', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  stepBtnHover: { background: 'rgba(255,255,255,.12)' },
  qty: { minWidth: 20, textAlign: 'center', fontWeight: 900, fontSize: 17 },
  addBtn: { flex: '1 1 190px', minWidth: 0, height: 52, whiteSpace: 'nowrap', border: 0, borderRadius: 999, color: '#fff', fontFamily: 'inherit', fontWeight: 800, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '0 20px', transition: 'background .2s' },
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

const Tick = ({ on }: { on: boolean }) => (
  <span style={{ ...S.tick, background: on ? '#D7192D' : 'rgba(0,0,0,.25)' }}>
    <IconCheck size={13} stroke={3.6} />
  </span>
);

// ---------- Component ----------

export default function PastaPage({ onAdd, onBack }: PastaPageProps) {
  const w = useWidth();
  const [momo, setMomo] = useState<MomoId>('veg');
  const [sauceId, setSauce] = useState<SauceId>('rose');
  const [baseId, setBase] = useState<BaseId>('classic');
  const [qty, setQty] = useState(1);
  const [spice, setSpice] = useState(SPICES[0]);
  const [extras, setExtras] = useState<string[]>([]);
  const [remove, setRemove] = useState<string[]>([]);
  const [added, setAdded] = useState(false);
  const [addedM, setAddedM] = useState<MomoId | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);

  /** One shared timer resets both "Added" states after 1.4s, as in the prototype. */
  const flash = (apply: () => void) => {
    clearTimeout(timer.current);
    apply();
    timer.current = setTimeout(() => { setAdded(false); setAddedM(null); }, 1400);
  };

  const wide = w >= 980;
  // Phones: sauce and pasta choices as a compact list (small photo, name, price, tick) instead of tall photo cards.
  const ph = w < 600;
  const gridS: CSSProperties = ph ? { display: 'flex', flexDirection: 'column', gap: 10 } : S.choiceGrid;
  const choiceS: CSSProperties = ph ? { ...S.choice, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 10, borderRadius: 20 } : S.choice;
  const mediaS: CSSProperties = ph ? { ...S.choiceMedia, width: 76, height: 76, aspectRatio: 'auto', flex: 'none', borderRadius: 14 } : S.choiceMedia;
  const textS: CSSProperties = ph ? { ...S.choiceText, flex: 1, minWidth: 0, padding: 0, gap: 2 } : S.choiceText;
  const nameS: CSSProperties = ph ? { ...S.choiceName, fontSize: 18 } : S.choiceName;
  const descS: CSSProperties = ph ? { ...S.choiceDesc, fontSize: 13 } : S.choiceDesc;
  const tickAt = (on: boolean) => (ph ? <span aria-hidden="true" style={{ flex: 'none', width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', background: on ? '#D7192D' : '#fff', boxShadow: on ? 'none' : 'inset 0 0 0 2px #D9D9DE', marginRight: 4 }}>{on ? <IconCheck size={13} stroke={3.6} /> : null}</span> : null);
  const base = BASES.find((b) => b.id === baseId) || BASES[0];
  const sauce = SAUCES.find((x) => x[0] === sauceId) || SAUCES[0];
  // Removals only make sense for what's in this base (e.g. no "No chicken" on veggie pasta).
  const removable = PASTA_REMOVE.filter((x) => x[2].includes(baseId));
  const removeNow = remove.filter((id) => removable.some((x) => x[0] === id));
  const extraCost = extras.reduce((a, id) => a + (PASTA_EXTRAS.find((x) => x[0] === id)?.[2] || 0), 0);
  const price = (base.p[sauceId] ?? 0) + extraCost;
  const toggle = (set: (f: (v: string[]) => string[]) => void, id: string) => set((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]));
  const raw = PHOTO[`${baseId}-${sauceId}`] || sauce[3];
  const img = raw.indexOf('assets/') === 0 ? raw : U(raw, 900);
  const rawTitle = (base.id === 'classic' ? '' : base.name + ' ') + 'pasta, ' + sauce[1].toLowerCase() + ' sauce';
  const title = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
  const momoSel = MOMOS.find((m) => m[0] === momo) || MOMOS[0];

  const back = (e?: { preventDefault?: () => void }) => { e?.preventDefault?.(); onBack?.(); };
  const pickSauce = (id: SauceId) => {
    setSauce(id);
    setBase((cur) => (BASES.find((b) => b.id === cur)?.p[id] != null ? cur : 'veggie'));
  };
  const add = () => {
    const spec: LineSpec = { k: 'pasta', base: baseId, sauce: sauceId, spice, ...(extras.length ? { extras } : {}), ...(removeNow.length ? { remove: removeNow } : {}) };
    const q = mustPrice(spec);
    onAdd?.({ key: ['pasta', baseId, sauceId, spice, ...[...extras].sort(), ...removeNow.map((r) => 'no-' + r)].join('-'), name: q.name, summary: q.summary, unit: q.unit, spec }, qty);
    flash(() => { setAdded(true); setQty(1); setExtras([]); setRemove([]); });
  };
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
              <p style={S.heroP}>Choose rosé, Alfredo or tomato sauce, then classic, veggie or chicken. Finished with parmesan, ginger and parsley.</p>
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

      <section style={{ ...S.body, gridTemplateColumns: wide ? 'minmax(0,1fr) 380px' : 'minmax(0,1fr)' }}>
        <div style={S.steps}>
          <div style={S.step}>
            <div style={S.stepHead}>
              <span style={S.stepNum}>01</span>
              <h2 style={S.h2}>Choose your sauce</h2>
            </div>
            <div role="radiogroup" aria-label="Sauce" style={gridS}>
              {SAUCES.map(([id, name, desc, pic]) => {
                const on = sauceId === id;
                return (
                  <Hov
                    as="button"
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => pickSauce(id)}
                    style={{ ...choiceS, boxShadow: on ? RING_ON : RING_OFF, cursor: 'pointer', transition: 'box-shadow .2s,transform .2s' }}
                    hover={S.liftHover}
                  >
                    <span style={{ ...mediaS, background: '#EDEDF0' }}>
                      {/* Local photos (assets/...) as-is; Unsplash ids through U(). */}
                      <span aria-hidden="true" style={{ ...S.sauceImg, backgroundImage: `url('${pic.indexOf('assets/') === 0 ? pic : U(pic, 600)}')`, transform: `scale(${on && !ph ? 1.06 : 1})` }} />
                      {ph ? null : <Tick on={on} />}
                    </span>
                    <span style={textS}>
                      <span style={nameS}>{name}</span>
                      <span style={descS}>{desc}</span>
                    </span>
                    {tickAt(on)}
                  </Hov>
                );
              })}
            </div>
          </div>

          <div style={S.step}>
            <div style={S.stepHead}>
              <span style={S.stepNum}>02</span>
              <h2 style={S.h2}>Choose your pasta</h2>
            </div>
            <div role="radiogroup" aria-label="Pasta" style={gridS}>
              {BASES.map((b) => {
                const p = b.p[sauceId];
                const ok = p != null;
                const on = baseId === b.id;
                const zoom = on ? 1.08 : 1;
                return (
                  <Hov
                    as="button"
                    key={b.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    aria-disabled={!ok}
                    onClick={() => { if (ok) setBase(b.id); }}
                    style={{ ...choiceS, boxShadow: on ? RING_ON : RING_OFF, opacity: ok ? 1 : 0.4, cursor: ok ? 'pointer' : 'default', transition: 'box-shadow .2s,transform .2s,opacity .2s' }}
                    hover={ok ? S.liftHover : undefined}
                  >
                    <span style={{ ...mediaS, background: b.tint }}>
                      {b.ings.map(([f, x, y, iw, r]) => (
                        <span
                          key={f}
                          aria-hidden="true"
                          style={{ ...S.ing, backgroundImage: `url('assets/ingredients/${f}.png')`, left: x + '%', top: y + '%', width: iw + '%', transform: `translate(-50%,-50%) rotate(${r}deg) scale(${zoom})` }}
                        />
                      ))}
                      {ph ? null : <Tick on={on} />}
                      {b.veg && !ph ? (
                        <span style={S.vegBadge}>
                          <span style={S.vegDot} />
                          Veg
                        </span>
                      ) : null}
                    </span>
                    <span style={{ ...textS, flex: 1 }}>
                      <span style={S.baseTitleRow}>
                        <span style={nameS}>{b.name}{b.veg && ph ? <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 800, color: '#12663A', letterSpacing: 0 }}>Veg</span> : null}</span>
                        <span style={S.basePrice}>{ok ? money(p) : ''}</span>
                      </span>
                      <span style={descS}>{ok ? b.desc : 'Rosé or Alfredo only'}</span>
                    </span>
                    {tickAt(on)}
                  </Hov>
                );
              })}
            </div>
          </div>
        </div>

        <aside style={{ ...S.aside, position: wide ? 'sticky' : 'relative', top: wide ? 96 : undefined }}>
          <div style={{ ...S.bowlMedia, aspectRatio: wide ? '4/3' : '16/10' }}>
            <span role="img" aria-label={title} style={{ ...S.bowlImg, backgroundImage: `url('${img}')` }} />
            <div style={S.bowlShade} />
            <span style={S.bowlPill}>Your bowl</span>
          </div>
          <div style={S.bowlBody}>
            <div style={S.bowlHead}>
              <span style={S.bowlTitle}>{title}</span>
              <span style={S.bowlDesc}>{base.desc + ' · ' + sauce[2] + '. Prices before tax.'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: '#9C928C' }}>Spice level</span>
              <div role="radiogroup" aria-label="Spice level" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 6 }}>
                {SPICES.map((v, i) => {
                  const on = spice === v;
                  return (
                    <button key={v} type="button" role="radio" aria-checked={on} onClick={() => setSpice(v)} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 44, padding: '0 12px', border: 0, borderRadius: 12, background: on ? '#fff' : 'rgba(255,255,255,.08)', color: on ? '#1A1414' : '#fff', fontFamily: 'inherit', fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'background .15s,color .15s' }}>
                      <span aria-hidden="true" style={{ display: 'flex', gap: 3 }}>
                        {[0, 1, 2].map((d) => <span key={d} style={{ width: 6, height: 6, borderRadius: '50%', background: d < i ? '#FF5A4E' : on ? '#E3E3E7' : 'rgba(255,255,255,.22)' }} />)}
                      </span>
                      {v}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Square "Extra Pasta Topping(s)" and "Remove Pasta Toppings". */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: '#9C928C' }}>Extras</span>
              <div role="group" aria-label="Extras" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {PASTA_EXTRAS.map(([id, name, p]) => {
                  const on = extras.includes(id);
                  return (
                    <button key={id} type="button" aria-pressed={on} onClick={() => toggle(setExtras, id)} style={{ height: 38, padding: '0 12px', border: 0, borderRadius: 999, background: on ? '#fff' : 'rgba(255,255,255,.08)', color: on ? '#1A1414' : '#fff', fontFamily: 'inherit', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                      {name.replace(/^Extra /, '').replace(/^./, (c) => c.toUpperCase())} <span style={{ opacity: 0.7, fontWeight: 600 }}>+{money(p)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            {removable.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: '#9C928C' }}>Leave out</span>
                <div role="group" aria-label="Leave out" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {removable.map(([id, name]) => {
                    const on = removeNow.includes(id);
                    return (
                      <button key={id} type="button" aria-pressed={on} onClick={() => toggle(setRemove, id)} style={{ height: 38, padding: '0 12px', border: 0, borderRadius: 999, background: on ? '#fff' : 'rgba(255,255,255,.08)', color: on ? '#1A1414' : '#fff', fontFamily: 'inherit', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
            <div style={S.bowlActions}>
              <div style={S.stepper}>
                <Hov as="button" type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity" style={S.stepBtn} hover={S.stepBtnHover}>
                  <IconMinus size={15} stroke={3} />
                </Hov>
                <span style={S.qty}>{qty}</span>
                <Hov as="button" type="button" onClick={() => setQty((q) => Math.min(20, q + 1))} aria-label="Increase quantity" style={S.stepBtn} hover={S.stepBtnHover}>
                  <IconPlus size={15} stroke={3} />
                </Hov>
              </div>
              <Hov as="button" type="button" onClick={add} style={{ ...S.addBtn, background: added ? '#1E8A4C' : '#D7192D' }} hover={S.redHover}>
                <span>{added ? 'Added' : 'Add to order'}</span>
                <span>{money(price * qty)}</span>
              </Hov>
            </div>
          </div>
        </aside>
      </section>

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
