// Vercel serverless function: POST /api/pay  (same handler the Vite dev server uses).
import type { IncomingMessage, ServerResponse } from 'node:http';
import { handlePay, type PayEnv } from '../server/square';

export default async function handler(req: IncomingMessage & { body?: unknown }, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    res.end();
    return;
  }
  let body = req.body;
  if (body === undefined || typeof body === 'string') {
    let text = typeof body === 'string' ? body : '';
    if (!text) for await (const chunk of req) text += chunk;
    try { body = JSON.parse(text || '{}'); } catch { body = {}; }
  }
  const out = await handlePay(body, process.env as PayEnv);
  res.statusCode = out.status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(out.json));
}
