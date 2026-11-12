// Cart / checkout / receipt thumbnail for one line, worked out from what was actually ordered:
// pizzas are drawn with their own sauce and toppings, everything else gets that item's photo.
import type { CSSProperties } from 'react';
import type { CartLine, Half } from '../lib/types';
import { PIZZAS, SLICES, type LineSpec, type PizzaOpts } from '../lib/pricing';
import { ITEM_PHOTOS, U } from '../lib/catalog';
import { PizzaArt } from './PizzaBuilder';

type Photo = { src: string; fit: 'cover' | 'contain' };
const cover = (src: string): Photo => ({ src, fit: 'cover' });
const cut = (src: string): Photo => ({ src, fit: 'contain' });
const un = (id: string) => cover(U(id, 300));

const POP: Record<string, string> = { coke: 'n-coke', 'coca-cola': 'n-coke', pepsi: 'n-pepsi', sprite: 'n-sprite', 'canada-dry': 'n-canada-dry', 'orange-crush': 'n-crush', crush: 'n-crush' };
const popPhoto = (brand: string) => cut('assets/pops/' + (POP[brand.toLowerCase().replace(/\s+/g, '-')] || 'n-coke') + '.png');
const brandIn = (text: string) => ['Coke', 'Coca-Cola', 'Pepsi', 'Sprite', 'Canada Dry', 'Orange Crush'].find((b) => text.toLowerCase().includes(b.toLowerCase()));

const SHAKE: Record<string, string> = { mango: 'mango', strawberry: 'strawberry', banana: 'banana', badam: 'badam', papaya: 'papaya' };
const JUICE: Record<string, Photo> = {
  orange: cut('assets/menu/juice-cup-orange.webp'),
  pineapple: cut('assets/menu/juice-cup-pineapple.webp'),
  mix: cut('assets/menu/juice-cup-clean.webp'),
};
const DIP: Record<string, string> = { 'dip-garlic': 'garlic', 'dip-ranch': 'ranch', 'dip-chipotle': 'chipotle', 'dip-jalapeno': 'jalapeno-cheddar', 'dip-marinara': 'marinara' };
const WINGS: Record<string, string> = { hot: '1608039755401-742074f0548d', honey: '1567620832903-9fc6debc209f', 'honey-garlic': '1567620832903-9fc6debc209f', garlic: '1567620832903-9fc6debc209f', bbq: '1527477396000-e27163b481c2' };

/** Photo for a menu / category item id (both pages use the same ids for most things). */
function itemPhoto(id: string, opts: Record<string, string> = {}, text = ''): Photo | null {
  const flav = (opts.flav || '').toLowerCase();
  if (id === 'pop') return opts.brand === 'water' || /\bwater\b/i.test(text) ? cover('assets/menu/water.webp') : popPhoto(opts.brand || brandIn(text) || 'coke');
  if (id === 'shake') { const f = flav || Object.keys(SHAKE).find((k) => text.toLowerCase().includes(k)) || 'mango'; return cover('assets/menu/' + (SHAKE[f] || 'mango') + '-shake.webp'); }
  if (id === 'fresh' || id === 'fruit-juice') { const f = flav || Object.keys(JUICE).find((k) => text.toLowerCase().includes(k)) || 'mix'; return JUICE[f] || JUICE.mix; }
  if (id === 'wings') return WINGS[flav] ? un(WINGS[flav]) : cut('assets/ingredients/tandoori-chicken.png');
  if (DIP[id]) return cut('assets/dips/' + DIP[id] + '.png');
  if (id.startsWith('dip-')) return cut('assets/combo/garlic-dip.png');
  if (/pasta-rose$/.test(id)) return cover('assets/menu/pasta-rose.png');
  if (/pasta-alfredo$/.test(id)) return cover('assets/menu/pasta-alfredo.png');
  if (/pasta-tomato$/.test(id)) return un('1598866594230-a7c12756260f');
  // Same photo as the item's card on the category pages and the full menu.
  const shared = ITEM_PHOTOS[id === 'gelato-cone' ? 'cone' : id];
  if (!shared) return null;
  return shared.indexOf('assets/') === 0 ? (/\.png$/.test(shared) ? cut(shared) : cover(shared)) : un(shared);
}

type Look = { pizzas: { sauce: string; tops: [string, Half][]; doneness: string; slices: number }[] } | Photo;

function lookFor(spec: LineSpec | undefined, text: string): Look | null {
  if (!spec) return null;
  const pz = (o: Pick<PizzaOpts, 'sauce' | 'tops' | 'doneness'>, slices: number) => ({ sauce: o.sauce, tops: o.tops, doneness: o.doneness, slices });
  switch (spec.k) {
    case 'pizza': return { pizzas: [pz(spec, SLICES[spec.size])] };
    case 'house': return { pizzas: [{ sauce: 'Regular', tops: (PIZZAS[spec.id]?.tops || []).map((t): [string, Half] => [t, 'whole']), doneness: 'Regular', slices: SLICES[spec.size] }] };
    case 'combo': return { pizzas: spec.pizzas.slice(0, 2).map((o) => pz(o, 8)) };
    case 'menu': return spec.id === 'momos' ? itemPhoto('momos') : itemPhoto(spec.id, {}, spec.opt + ' ' + text);
    case 'cat': return itemPhoto(spec.id, spec.opts, text);
    case 'pasta': return itemPhoto(spec.base === 'classic' ? 'pasta-' + spec.sauce : spec.base + '-pasta-' + spec.sauce);
    case 'momo': return itemPhoto('momos');
    case 'upsell': return itemPhoto(spec.id, { flav: spec.flavour.toLowerCase() }, spec.flavour);
  }
  return null;
}

const box: CSSProperties = { position: 'relative', width: '100%', height: '100%', display: 'block' };

/** Fills its (square, rounded, overflow-hidden) parent. */
export default function LineThumb({ line }: { line: CartLine }) {
  const look = lookFor(line.spec, (line.summary || '') + ' ' + line.name) || (line.img ? (/\.png($|\?)/i.test(line.img) ? cut(line.img) : cover(line.img)) : null);
  // No real photo (e.g. water, coconut juice): a plain cup outline beats a misleading picture.
  if (!look) return (
    <span aria-hidden="true" style={{ ...box, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="42%" height="42%" viewBox="0 0 24 24" fill="none" stroke="#B4B4BA" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h12l-1.6 15.2a2 2 0 0 1-2 1.8H9.6a2 2 0 0 1-2-1.8z" /><path d="M6.6 9.5h10.8" /></svg>
    </span>
  );
  if ('pizzas' in look) {
    const two = look.pizzas.length > 1;
    return (
      <span aria-hidden="true" style={box}>
        {look.pizzas.map((p, i) => (
          <span key={i} style={{ position: 'absolute', width: two ? '66%' : '86%', aspectRatio: '1/1', left: two ? (i ? '30%' : '4%') : '7%', top: two ? (i ? '30%' : '4%') : '7%', zIndex: i + 1 }}>
            <PizzaArt sauce={p.sauce} tops={p.tops} doneness={p.doneness} slices={p.slices} />
          </span>
        ))}
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      style={{ ...box, backgroundImage: "url('" + look.src + "')", backgroundPosition: 'center', backgroundRepeat: 'no-repeat', ...(look.fit === 'cover' ? { backgroundSize: 'cover' } : { backgroundSize: 'contain', backgroundOrigin: 'content-box', padding: '12%', boxSizing: 'border-box', mixBlendMode: 'multiply' }) }}
    />
  );
}
