// Opening hours, in shop time (Toronto). Pure TS: shared by the browser and the payment server,
// so both agree on when ASAP orders are allowed and which pickup times are valid.
//
// Open every day 4 PM to 2 AM. Last orders 15 minutes before close.

export const SHOP_TZ = 'America/Toronto';
const OPEN_MIN = 16 * 60; // 4:00 PM
const OPEN_LENGTH = 10 * 60; // until 2:00 AM
/** Shown to customers wherever the opening time is mentioned. */
export const OPENS_AT = '4 PM';
const LAST_ORDER = OPEN_LENGTH - 15; // 1:45 AM, in minutes after opening
const SLOT_MIN = 30;
const MIN = 60_000;

type Parts = { y: number; mo: number; d: number; h: number; mi: number };

const fmtParts = new Intl.DateTimeFormat('en-CA', {
  timeZone: SHOP_TZ, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hourCycle: 'h23',
});

function parts(t: Date): Parts {
  const o: Record<string, number> = {};
  for (const p of fmtParts.formatToParts(t)) if (p.type !== 'literal') o[p.type] = +p.value;
  return { y: o.year, mo: o.month, d: o.day, h: o.hour % 24, mi: o.minute };
}

/** Minutes since today's opening (4 PM), wrapping past midnight: 0 = 4:00 PM, 600 = 2:00 AM. */
function sinceOpen(t: Date): number {
  const p = parts(t);
  return (p.h * 60 + p.mi - OPEN_MIN + 1440) % 1440;
}

/** The Date for a wall-clock time in Toronto (handles daylight saving). */
function torontoTime(y: number, mo: number, d: number, h: number, mi: number): Date {
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const offset = (t: number) => {
    const p = parts(new Date(t));
    return Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi) - t;
  };
  let t = guess - offset(guess);
  const o2 = offset(t);
  if (guess - o2 !== t) t = guess - o2;
  return new Date(t);
}

/** Is the shop open right now. */
export function isOpenNow(now = new Date()): boolean {
  return sinceOpen(now) < OPEN_LENGTH;
}

/** Can someone order for ASAP pickup right now (open, and not inside the last 15 minutes). */
export function canOrderAsap(now = new Date()): boolean {
  return sinceOpen(now) < LAST_ORDER;
}

const label = (t: Date) =>
  t.toLocaleTimeString('en-CA', { timeZone: SHOP_TZ, hour: 'numeric', minute: '2-digit' }).replace(/a\.?m\.?/i, 'AM').replace(/p\.?m\.?/i, 'PM');

/** Upcoming pickup times as { label, at }: half-hour steps, at least 30 minutes out, within opening hours. */
export function pickupSlots(now = new Date(), count = 8): { label: string; at: Date }[] {
  let t: Date;
  if (canOrderAsap(now)) {
    const soonest = now.getTime() + 30 * MIN;
    t = new Date(Math.ceil(soonest / (SLOT_MIN * MIN)) * SLOT_MIN * MIN);
  } else {
    // Closed (1:45 AM to 4 PM, always after midnight): first slot is opening time today.
    const p = parts(now);
    t = torontoTime(p.y, p.mo, p.d, Math.floor(OPEN_MIN / 60), OPEN_MIN % 60);
  }
  const out: { label: string; at: Date }[] = [];
  while (out.length < count && sinceOpen(t) <= LAST_ORDER) {
    out.push({ label: label(t), at: t });
    t = new Date(t.getTime() + SLOT_MIN * MIN);
  }
  return out;
}

/** Labels only (what the start sheet shows and what we save as the chosen time). */
export function timeSlots(now = new Date(), count = 8): string[] {
  return pickupSlots(now, count).map((s) => s.label);
}

/** The ISO time for a chosen slot label, or undefined if it isn't a currently valid pickup time. */
export function slotToIso(lbl: string | undefined, now = new Date()): string | undefined {
  if (!lbl || lbl === 'asap') return undefined;
  return pickupSlots(now, 48).find((s) => s.label === lbl)?.at.toISOString();
}

/** Is a saved pickup choice still usable (ASAP while open, or a slot that's still offered). */
export function isValidWhen(when: string | undefined, now = new Date()): boolean {
  if (!when || when === 'asap') return canOrderAsap(now);
  return !!slotToIso(when, now);
}

/**
 * Server check. Returns a customer-facing reason the order can't be accepted, or null if the timing is fine.
 * pickupAt is an ISO time for scheduled orders, or undefined for ASAP.
 */
export function pickupProblem(pickupAt: string | undefined, now = new Date()): string | null {
  if (!pickupAt) {
    return canOrderAsap(now) ? null : 'We’re closed right now. We open at ' + OPENS_AT + '. Please choose a pickup time and try again.';
  }
  const t = new Date(pickupAt);
  if (Number.isNaN(t.getTime())) return 'That pickup time isn’t valid. Please choose another time.';
  const ahead = t.getTime() - now.getTime();
  // 20 minutes of slack for someone who sat on the checkout page; a full day ahead at most.
  if (ahead < -20 * MIN) return 'That pickup time has passed. Please choose a new time.';
  if (ahead > 26 * 60 * MIN) return 'Please choose a pickup time within the next day.';
  if (sinceOpen(t) > LAST_ORDER) return 'We’re closed at that time. We’re open ' + OPENS_AT + ' to 2 AM. Please choose another time.';
  return null;
}
