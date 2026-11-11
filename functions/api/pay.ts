// Cloudflare Pages Function: POST /api/pay (same handler the Vite dev server uses).
// Set SQUARE_ACCESS_TOKEN (secret), SQUARE_ENV and VITE_SQUARE_LOCATION_ID in the Pages project settings.
import { handlePay, type PayEnv } from '../../server/square';

export const onRequestPost = async ({ request, env }: { request: Request; env: PayEnv }) => {
  let body: unknown = {};
  try { body = await request.json(); } catch { /* handled as invalid input */ }
  const out = await handlePay(body, env);
  return new Response(JSON.stringify(out.json), {
    status: out.status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
};
