// Even, natural-looking topping placement ("best candidate" blue-noise sampling).
// Pieces are placed one at a time, toppings interleaved, each where it has the most room:
// no two pieces touch, and pieces of the same topping keep extra distance so every topping
// is spread over the whole pizza instead of clumping or forming lines.

export interface ScatterItem {
  /** Topping id (pieces with the same id push each other further apart). */
  k: string;
  /** Piece radius, in the same units as the pizza radius. */
  r: number;
  /** Which part of the pizza this piece may go on. */
  side?: 'whole' | 'left' | 'right';
}

/** Small deterministic random generator so the same pizza always looks the same. */
function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Positions (centred on 0,0) for `items` on a pizza of radius `R`.
 * `items` should already be interleaved across toppings (a, b, c, a, b, c...).
 */
export function scatter(items: ScatterItem[], R: number, seed: string, tries = 90): { x: number; y: number }[] {
  const rand = rng(seed);
  const placed: { x: number; y: number; r: number; k: string }[] = [];
  const out: { x: number; y: number }[] = [];
  for (const it of items) {
    const maxR = Math.max(0, R - it.r * 0.95);
    let best = { x: 0, y: 0 };
    let bestScore = -Infinity;
    for (let c = 0; c < tries; c++) {
      const a = rand() * Math.PI * 2;
      const d = Math.sqrt(rand()) * maxR;
      const x = Math.cos(a) * d, y = Math.sin(a) * d;
      if (it.side === 'left' && x > -it.r * 0.6) continue;
      if (it.side === 'right' && x < it.r * 0.6) continue;
      // Room around this spot: gap to the nearest piece (same topping counts as closer),
      // and to the crust edge, so pieces also reach the outer slices.
      let score = (maxR - d) * 1.6 + it.r * 0.6;
      for (const p of placed) {
        const gap = Math.hypot(p.x - x, p.y - y) - (p.r + it.r);
        const g = p.k === it.k ? gap - (p.r + it.r) * 0.9 : gap;
        if (g < score) score = g;
      }
      if (score > bestScore) { bestScore = score; best = { x, y }; }
    }
    placed.push({ ...best, r: it.r, k: it.k });
    out.push(best);
  }
  return out;
}
