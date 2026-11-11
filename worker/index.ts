// Cloudflare Worker: POST /api/pay -> Square (same handler as the Vite dev server); everything else -> static site.
// Runtime secrets/vars (Worker settings): SQUARE_ACCESS_TOKEN (secret), SQUARE_ENV, VITE_SQUARE_LOCATION_ID.
// Static files get their security headers from public/_headers; responses made here add them explicitly.
import { handlePay, handleStatus, type PayEnv } from '../server/square';

interface RateLimiter { limit(o: { key: string }): Promise<{ success: boolean }> }
interface Env extends PayEnv {
  ASSETS: { fetch(request: Request): Promise<Response> };
  /** Workers rate limiting binding (wrangler.jsonc "ratelimits"): payment attempts per visitor per minute. */
  PAY_LIMITER?: RateLimiter;
}

// Only our own pages may call the payment endpoint from a browser.
const ALLOWED_ORIGINS = new Set([
  'https://pizzakingandpasta.ca',
  'https://www.pizzakingandpasta.ca',
]);
const MAX_BODY = 32 * 1024; // a big cart is a few KB

const SECURITY_HEADERS: Record<string, string> = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
};

const json = (status: number, body: unknown, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...SECURITY_HEADERS, ...extra },
  });

async function pay(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return json(405, { ok: false, message: 'Method not allowed.' }, { Allow: 'POST' });

  const origin = request.headers.get('Origin');
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return json(403, { ok: false, message: 'Please order from pizzakingandpasta.ca.' });

  if (!(request.headers.get('Content-Type') || '').toLowerCase().startsWith('application/json')) {
    return json(415, { ok: false, message: 'Something went wrong on our end. Please refresh the page and try again.' });
  }

  // Slow down card-testing bots: a few payment attempts per visitor per minute.
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (env.PAY_LIMITER) {
    const { success } = await env.PAY_LIMITER.limit({ key: ip });
    if (!success) return json(429, { ok: false, message: 'Too many attempts. Please wait a minute and try again, or call 905-460-9494.' }, { 'Retry-After': '60' });
  }

  const declared = Number(request.headers.get('Content-Length') || 0);
  if (declared > MAX_BODY) return json(413, { ok: false, message: 'Your order is too large to send. Please call 905-460-9494.' });
  const text = await request.text();
  if (text.length > MAX_BODY) return json(413, { ok: false, message: 'Your order is too large to send. Please call 905-460-9494.' });

  let body: unknown = {};
  try { body = JSON.parse(text); } catch { /* handled as invalid input by handlePay */ }
  const out = await handlePay(body, env);
  return json(out.status, out.json);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/pay') return pay(request, env);
    if (url.pathname === '/api/order-status') {
      if (request.method !== 'GET') return json(405, { ok: false, message: 'Method not allowed.' }, { Allow: 'GET' });
      const out = await handleStatus(url.searchParams.get('id'), url.searchParams.get('t'), env);
      return json(out.status, out.json);
    }
    // No other API routes exist; don't fall through to the site for /api/*.
    if (url.pathname.startsWith('/api/')) return json(404, { ok: false, message: 'Not found.' });
    // Apple Pay domain verification (Square). Served from a plain asset so dot-folders don't matter.
    if (url.pathname === '/.well-known/apple-developer-merchantid-domain-association') {
      const r = await env.ASSETS.fetch(new Request(new URL('/apple-pay-domain-association.txt', url), request));
      return new Response(r.body, { status: r.status, headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store', ...SECURITY_HEADERS } });
    }
    if (url.pathname.startsWith('/.well-known/')) return new Response('Not found', { status: 404, headers: SECURITY_HEADERS });
    return env.ASSETS.fetch(request);
  },
};
