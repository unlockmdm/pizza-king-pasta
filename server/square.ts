// Server-side Square checkout: creates a PICKUP order and charges it.
// Runs in the Vite dev server (see vite.config.ts) and as a Vercel function (api/pay.ts).
// The Square access token never reaches the browser.

export interface PayEnv {
  SQUARE_ACCESS_TOKEN?: string;
  SQUARE_ENV?: string; // 'sandbox' | 'production'
  VITE_SQUARE_LOCATION_ID?: string;
}

interface InLine { name: string; summary?: string; unit: number; qty: number }
interface PayBody {
  sourceId: string;
  verificationToken?: string;
  idempotencyKey: string;
  lines: InLine[];
  customer: { name: string; phone: string; email: string };
  note?: string;
  /** ISO time for a scheduled pickup; omitted = as soon as possible. */
  pickupAt?: string;
  /** What the customer saw, in cents. The charge is refused if Square's total differs. */
  expectedTotal: number;
}

export interface PayResult { status: number; json: Record<string, unknown> }

const API_VERSION = '2024-10-17';
const HST_PERCENT = '13';
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
    INSUFFICIENT_FUNDS: 'Your card was declined for insufficient funds.',
    CVV_FAILURE: 'The security code (CVV) is incorrect.',
    ADDRESS_VERIFICATION_FAILURE: 'The postal code doesn’t match your card.',
    INVALID_EXPIRATION: 'The card expiry date is invalid.',
    EXPIRATION_FAILURE: 'Your card has expired.',
    INVALID_CARD: 'The card number is invalid.',
    CARD_DECLINED_VERIFICATION_REQUIRED: 'Your bank needs to verify this payment. Try again.',
    INVALID_PHONE_NUMBER: 'Enter a valid phone number.',
    INVALID_EMAIL_ADDRESS: 'Enter a valid email address.',
  };
  return map[code] || 'Payment didn’t go through. Please try again.';
}

export async function handlePay(raw: unknown, env: PayEnv): Promise<PayResult> {
  const token = env.SQUARE_ACCESS_TOKEN;
  const locationId = env.VITE_SQUARE_LOCATION_ID;
  if (!token || !locationId) return fail(500, 'Online payments aren’t set up yet.');
  const base = env.SQUARE_ENV === 'production' ? 'https://connect.squareup.com' : 'https://connect.squareupsandbox.com';

  // ---- validate input ----
  const b = (raw || {}) as Partial<PayBody>;
  if (!b.sourceId || typeof b.sourceId !== 'string') return fail(400, 'Missing payment details.');
  if (!b.idempotencyKey || typeof b.idempotencyKey !== 'string') return fail(400, 'Missing request key.');
  const lines = Array.isArray(b.lines) ? b.lines : [];
  if (!lines.length || lines.length > 60) return fail(400, 'Your order is empty.');
  for (const l of lines) {
    if (typeof l?.name !== 'string' || !l.name.trim()) return fail(400, 'An item in your order is invalid.');
    if (!Number.isFinite(l.unit) || l.unit <= 0 || l.unit > 500) return fail(400, 'An item price is invalid.');
    if (!Number.isInteger(l.qty) || l.qty < 1 || l.qty > 50) return fail(400, 'An item quantity is invalid.');
  }
  const c = b.customer || ({} as PayBody['customer']);
  if (!c.name?.trim() || (c.phone || '').replace(/\D/g, '').length < 10 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.email || '')) {
    return fail(400, 'Enter your name, phone and email.');
  }
  // TODO before going live: re-price every line on the server from the menu (Square catalog)
  // instead of trusting `unit` from the browser.

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
    schedule_type: b.pickupAt ? 'SCHEDULED' : 'ASAP',
  };
  if (b.pickupAt) pickupDetails.pickup_at = b.pickupAt;
  else pickupDetails.prep_time_duration = 'PT20M';

  const order = await sq('/v2/orders', {
    idempotency_key: b.idempotencyKey + '-o',
    order: {
      location_id: locationId,
      source: { name: 'Website' },
      line_items: lines.map((l) => ({
        name: clip(l.name, 500),
        quantity: String(l.qty),
        note: clip(l.summary, 2000) || undefined,
        base_price_money: { amount: cents(l.unit), currency: 'CAD' },
      })),
      taxes: [{ uid: 'hst', name: 'HST', percentage: HST_PERCENT, type: 'ADDITIVE', scope: 'ORDER' }],
      fulfillments: [{ type: 'PICKUP', state: 'PROPOSED', pickup_details: pickupDetails }],
    },
  });
  if (!order.ok) {
    console.error('[square] create order failed', order.status, JSON.stringify(order.j.errors));
    return fail(502, friendly(order.j.errors), { step: 'order' });
  }
  const o = order.j.order;
  const total = Number(o?.total_money?.amount ?? 0);
  if (Number.isFinite(b.expectedTotal) && Math.abs(total - Number(b.expectedTotal)) > 1) {
    return fail(409, 'Prices changed while you were ordering. Please review your order and try again.', { total });
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
    // Cancel the unpaid order so it never clutters the shop's order list (best effort).
    // The failed payment bumps the order version, and the pickup fulfillment must be cancelled with it.
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
    return fail(402, friendly(payment.j.errors), { step: 'payment' });
  }
  const p = payment.j.payment;
  return {
    status: 200,
    json: {
      ok: true,
      orderId: o.id,
      orderNumber: p?.receipt_number || String(o.id).slice(-6).toUpperCase(),
      receiptUrl: p?.receipt_url || null,
      total,
      cardBrand: p?.card_details?.card?.card_brand || null,
      cardLast4: p?.card_details?.card?.last_4 || null,
    },
  };
}
