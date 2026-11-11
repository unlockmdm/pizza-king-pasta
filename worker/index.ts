// Cloudflare Worker: POST /api/pay -> Square (same handler as the Vite dev server); everything else -> static site.
// Runtime secrets/vars (Worker settings): SQUARE_ACCESS_TOKEN (secret), SQUARE_ENV, VITE_SQUARE_LOCATION_ID.
import { handlePay, type PayEnv } from '../server/square';

interface Env extends PayEnv {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/pay') {
      if (request.method !== 'POST') return new Response(null, { status: 405, headers: { Allow: 'POST' } });
      let body: unknown = {};
      try { body = await request.json(); } catch { /* handled as invalid input */ }
      const out = await handlePay(body, env);
      return new Response(JSON.stringify(out.json), { status: out.status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    }
    // Apple Pay domain verification (Square). Served from a plain asset so dot-folders don't matter.
    if (url.pathname === '/.well-known/apple-developer-merchantid-domain-association') {
      const r = await env.ASSETS.fetch(new Request(new URL('/apple-pay-domain-association.txt', url), request));
      return new Response(r.body, { status: r.status, headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' } });
    }
    return env.ASSETS.fetch(request);
  },
};
