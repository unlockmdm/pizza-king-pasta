// Server-side Square checkout: creates a PICKUP order and charges it.
// Runs in the Vite dev server (see vite.config.ts) and in the Cloudflare Worker (worker/index.ts).
// The Square access token never reaches the browser.
// Every price is computed here from the shared pricing module: the browser only says what was chosen.
import { pickupProblem } from '../src/lib/hours';
import { HST_PERCENT, MAX_LINES, MAX_QTY, orderTotalCents, priceLine, type PricedLine } from '../src/lib/pricing';

export interface PayEnv {
  SQUARE_ACCESS_TOKEN?: string;
  SQUARE_ENV?: string; // 'sandbox' | 'production'
  VITE_SQUARE_LOCATION_ID?: string;
}

/** One cart line as the browser sends it: what was chosen (by id) and how many. Never a price. */
interface InLine { spec: unknown; qty: number }
interface PayBody {
  sourceId: string;
  verificationToken?: string;
  idempotencyKey: string;
  lines: InLine[];
  customer: { name: string; phone: string; email: string };
  note?: string;
  /** ISO time for a scheduled pickup; omitted = as soon as possible. */
  pickupAt?: string;
  /** What the customer saw, in cents. The charge is refused if the server's or Square's total differs. */
  expectedTotal: number;
}

export interface PayResult { status: number; json: Record<string, unknown> }

/**
 * Signed code that lets the customer's confirmation screen check one order's status (and nothing else).
 * HMAC-SHA256 of the order ID, keyed from the server-only Square token, so it can't be forged or guessed.
 */
async function statusToken(orderId: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode('order-status:' + secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(orderId)));
  return Array.from(sig.slice(0, 16), (b) => b.toString(16).padStart(2, '0')).join('');
}

export type OrderStage = 'received' | 'preparing' | 'ready' | 'completed' | 'canceled';

/**
 * GET /api/order-status?id=...&t=...: the pickup order's current stage, as set by the kitchen in Square POS.
 * Square fulfillment states: PROPOSED (new) -> RESERVED (accepted) -> PREPARED (ready) -> COMPLETED (picked up).
 * Returns only the stage: no names, phone numbers or items.
 */
export async function handleStatus(id: string | null, t: string | null, env: PayEnv): Promise<PayResult> {
  const token = env.SQUARE_ACCESS_TOKEN;
  if (!token) return fail(500, 'Order status is unavailable right now.');
  if (!id || !t || !/^[A-Za-z0-9_-]{8,64}$/.test(id) || !/^[0-9a-f]{32}$/.test(t)) return fail(400, 'Unknown order.');
  if ((await statusToken(id, token)) !== t) return fail(403, 'Unknown order.');
  const base = env.SQUARE_ENV === 'production' ? 'https://connect.squareup.com' : 'https://connect.squareupsandbox.com';
  const r = await fetch(base + '/v2/orders/' + id, { headers: { Authorization: 'Bearer ' + token, 'Square-Version': API_VERSION } });
  if (!r.ok) return fail(502, 'Order status is unavailable right now.');
  const o = ((await r.json().catch(() => ({}))) as Record<string, any>).order || {};
  const f = (o.fulfillments || [])[0] || {};
  const fs = String(f.state || '');
  const stage: OrderStage =
    o.state === 'CANCELED' || fs === 'CANCELED' || fs === 'FAILED' ? 'canceled'
      : fs === 'COMPLETED' || o.state === 'COMPLETED' ? 'completed'
        : fs === 'PREPARED' ? 'ready'
          : fs === 'RESERVED' ? 'preparing'
            : 'received';
  return { status: 200, json: { ok: true, stage } };
}

const API_VERSION = '2024-10-17';
const cents = (n: number) => Math.round(n * 100);
const clip = (s: unknown, n: number) => String(s ?? '').slice(0, n);
const fail = (status: number, message: string, extra?: Record<string, unknown>): PayResult => ({ status, json: { ok: false, message, ...extra } });

/** "905 555 0101" → "+19055550101"; anything else is passed through trimmed. */
function phoneE164(p: string) {
  const d = p.replace(/\D/g, '');
  if (d.length === 10) return '+1' + d;
  if (d.length === 11 && d.startsWith('1')) return '+' + d;
  return p.trim();
}

/** Plain-English message for the customer from a Square error list. */
function friendly(errors: { code?: string; detail?: string }[] = []): string {
  const code = errors[0]?.code || '';
  const map: Record<string, string> = {
    CARD_DECLINED: 'Your card was declined. Try another card.',
    GENERIC_DECLINE: 'Your card was declined. Try another card.',
    INSUFFICIENT_FUNDS: 'Your card was declined for insufficient funds. Try another card.',
    CVV_FAILURE: 'Check the security code (CVV) and try again.',
    ADDRESS_VERIFICATION_FAILURE: 'The postal code doesn’t match this card. Check it and try again.',
    INVALID_EXPIRATION: 'Check the card’s expiry date and try again.',
    EXPIRATION_FAILURE: 'This card has expired. Try another card.',
    INVALID_CARD: 'Check the card number and try again.',
    CARD_DECLINED_VERIFICATION_REQUIRED: 'Your bank needs to verify this payment. Try again and follow your bank’s prompt.',
    INVALID_PHONE_NUMBER: 'Enter a valid phone number.',
    INVALID_EMAIL_ADDRESS: 'Enter a valid email address.',
  };
  return map[code] || 'Your payment didn’t go through. Please try again, or call 905-460-9494.';
}

export async function handlePay(raw: unknown, env: PayEnv): Promise<PayResult> {
  const token = env.SQUARE_ACCESS_TOKEN;
  const locationId = env.VITE_SQUARE_LOCATION_ID;
  if (!token || !locationId) {
    // Names only (never values), so a misconfigured host is easy to diagnose.
    const missing = [!token && 'SQUARE_ACCESS_TOKEN', !locationId && 'VITE_SQUARE_LOCATION_ID'].filter(Boolean);
    return fail(500, 'Online payment is unavailable right now. Please call 905-460-9494 to order.', { missing });
  }
  const base = env.SQUARE_ENV === 'production' ? 'https://connect.squareup.com' : 'https://connect.squareupsandbox.com';

  // ---- validate input ----
  const b = (raw || {}) as Partial<PayBody>;
  if (!b.sourceId || typeof b.sourceId !== 'string') return fail(400, 'We didn’t receive your payment details. Please enter them again.');
  if (!b.idempotencyKey || typeof b.idempotencyKey !== 'string') return fail(400, 'Something went wrong on our end. Please refresh the page and try again.');
  const inLines = Array.isArray(b.lines) ? (b.lines as Partial<InLine>[]) : [];
  if (!inLines.length) return fail(400, 'Your order is empty. Add an item to continue.');
  if (inLines.length > MAX_LINES) return fail(400, 'Your order has too many different items. Please call 905-460-9494 for large orders.');
  // ---- price every line on the server; the browser never sends a price ----
  const lines: (PricedLine & { qty: number })[] = [];
  for (const l of inLines) {
    if (!l || typeof l !== 'object') return fail(400, 'Something in your cart changed. Please refresh and try again.', { code: 'BAD_LINE' });
    if (!Number.isInteger(l.qty) || (l.qty as number) < 1 || (l.qty as number) > MAX_QTY) return fail(400, 'Each item quantity must be between 1 and ' + MAX_QTY + '.', { code: 'BAD_QTY' });
    const q = priceLine(l.spec);
    if ('error' in q) {
      console.warn('[pay] rejected line spec:', q.error);
      return fail(400, 'Something in your cart changed. Please refresh and try again.', { code: 'BAD_LINE' });
    }
    lines.push({ ...q, qty: l.qty as number });
  }
  const serverTotal = orderTotalCents(lines);
  // The customer must have seen exactly this total (the browser uses the same pricing code, so any
  // difference means prices changed since the page loaded, or the request was edited).
  if (typeof b.expectedTotal !== 'number' || serverTotal !== b.expectedTotal) {
    return fail(409, 'Some prices changed while you were ordering. Please refresh and try again.', { code: 'PRICE_CHANGED', total: serverTotal });
  }
  // ---- opening hours (shop time): no ASAP orders while closed, no pickup times outside hours ----
  const pickupAt = typeof b.pickupAt === 'string' && b.pickupAt ? b.pickupAt : undefined;
  const timing = pickupProblem(pickupAt);
  if (timing) return fail(409, timing, { code: 'CLOSED' });
  const c = b.customer || ({} as PayBody['customer']);
  if (!c.name?.trim() || (c.phone || '').replace(/\D/g, '').length < 10 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.email || '')) {
    return fail(400, 'Enter your name, a 10-digit phone number and a valid email.');
  }
  const sq = async (path: string, body: unknown) => {
    const r = await fetch(base + path, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Square-Version': API_VERSION, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const j = (await r.json().catch(() => ({}))) as Record<string, any>;
    return { ok: r.ok, status: r.status, j };
  };

  // ---- 1. create the order (shows in Square Order Manager once paid) ----
  const pickupDetails: Record<string, unknown> = {
    recipient: { display_name: clip(c.name.trim(), 255), email_address: clip(c.email.trim(), 255), phone_number: phoneE164(c.phone) },
    note: clip(b.note, 500) || undefined,
    schedule_type: pickupAt ? 'SCHEDULED' : 'ASAP',
  };
  if (pickupAt) pickupDetails.pickup_at = new Date(pickupAt).toISOString();
  else pickupDetails.prep_time_duration = 'PT20M';

  const order = await sq('/v2/orders', {
    idempotency_key: b.idempotencyKey + '-o',
    order: {
      location_id: locationId,
      source: { name: 'Website' },
      // Names, kitchen notes and prices all come from priceLine above (server-side), never the browser.
      line_items: lines.map((l) => ({
        name: clip(l.name, 500),
        quantity: String(l.qty),
        note: clip(l.note, 2000) || undefined,
        base_price_money: { amount: cents(l.unit), currency: 'CAD' },
      })),
      taxes: [{ uid: 'hst', name: 'HST', percentage: String(HST_PERCENT), type: 'ADDITIVE', scope: 'ORDER' }],
      fulfillments: [{ type: 'PICKUP', state: 'PROPOSED', pickup_details: pickupDetails }],
    },
  });
  if (!order.ok) {
    console.error('[square] create order failed', order.status, JSON.stringify(order.j.errors));
    return fail(502, friendly(order.j.errors), { step: 'order' });
  }
  const o = order.j.order;
  // Cancel an unpaid order so it never clutters the shop's order list (best effort).
  // The order version may have moved on, and the pickup fulfillment must be cancelled with it.
  const cancelOrder = async () => {
    try {
      const headers = { Authorization: 'Bearer ' + token, 'Square-Version': API_VERSION, 'Content-Type': 'application/json' };
      const cur = (await (await fetch(base + '/v2/orders/' + o.id, { headers })).json()) as Record<string, any>;
      const fresh = cur.order || o;
      await fetch(base + '/v2/orders/' + o.id, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          idempotency_key: b.idempotencyKey + '-c',
          order: {
            location_id: locationId,
            version: fresh.version,
            state: 'CANCELED',
            fulfillments: (fresh.fulfillments || []).map((f: { uid: string }) => ({ uid: f.uid, state: 'CANCELED' })),
          },
        }),
      });
    } catch { /* leaving an unpaid order behind is harmless */ }
  };
  const total = Number(o?.total_money?.amount ?? 0);
  // Never charge more than the customer saw. (orderTotals mirrors Square's math, so these normally match exactly.)
  if (total > (b.expectedTotal as number) || total < (b.expectedTotal as number) - 1) {
    console.error('[square] order total differs from the shown total', total, b.expectedTotal);
    await cancelOrder();
    return fail(409, 'Some prices changed while you were ordering. Please refresh and try again.', { code: 'PRICE_CHANGED', total });
  }

  // ---- 2. charge the card against the order ----
  const payment = await sq('/v2/payments', {
    idempotency_key: b.idempotencyKey + '-p',
    source_id: b.sourceId,
    verification_token: b.verificationToken || undefined,
    amount_money: { amount: total, currency: 'CAD' },
    order_id: o.id,
    location_id: locationId,
    buyer_email_address: c.email.trim(),
    note: 'Website pickup order',
    autocomplete: true,
  });
  if (!payment.ok) {
    console.error('[square] payment failed', payment.status, JSON.stringify(payment.j.errors));
    await cancelOrder();
    return fail(402, friendly(payment.j.errors), { step: 'payment' });
  }
  const p = payment.j.payment;
  return {
    status: 200,
    json: {
      ok: true,
      orderId: o.id,
      statusToken: await statusToken(o.id, token),
      orderNumber: p?.receipt_number || String(o.id).slice(-6).toUpperCase(),
      receiptUrl: p?.receipt_url || null,
      total,
      cardBrand: p?.card_details?.card?.card_brand || null,
      cardLast4: p?.card_details?.card?.last_4 || null,
    },
  };
}
