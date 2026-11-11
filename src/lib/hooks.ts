import { useEffect, useSyncExternalStore } from 'react';

const subscribe = (cb: () => void) => {
  window.addEventListener('resize', cb);
  return () => window.removeEventListener('resize', cb);
};

/**
 * Viewport width. Replaces the prototype's `this.state.w`; every responsive value
 * in the design is computed from it (breakpoints: <600 phone, 600–999 tablet, ≥1000 desktop).
 */
export function useWidth(): number {
  return useSyncExternalStore(subscribe, () => window.innerWidth, () => 1200);
}

/** Lock page scroll while a full-screen sheet / drawer is open. Ref-counted so nested sheets are safe. */
let locks = 0;
export function useLockBody(active: boolean) {
  useEffect(() => {
    if (!active) return;
    locks++;
    if (locks > 1) return () => { locks--; };
    // iPhone Safari ignores overflow:hidden and scrolls the page underneath when the keyboard opens,
    // so pin the body in place instead and put the scroll position back afterwards.
    const y = window.scrollY;
    const b = document.body.style;
    const prev = { position: b.position, top: b.top, left: b.left, right: b.right, width: b.width };
    const prevHtml = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    Object.assign(b, { position: 'fixed', top: -y + 'px', left: '0', right: '0', width: '100%' });
    return () => {
      locks--;
      if (locks > 0) return;
      Object.assign(b, prev);
      document.documentElement.style.overflow = prevHtml;
      window.scrollTo(0, y);
    };
  }, [active]);
}

/** True while the on-screen keyboard is up (phones): the visible area is much shorter than the window. */
export function useKeyboardOpen(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const vv = window.visualViewport;
      vv?.addEventListener('resize', cb);
      window.addEventListener('resize', cb);
      return () => { vv?.removeEventListener('resize', cb); window.removeEventListener('resize', cb); };
    },
    () => !!window.visualViewport && window.innerHeight - window.visualViewport.height > 140,
    () => false,
  );
}

/** Run `fn` on Escape while active. */
export function useEscape(active: boolean, fn: () => void) {
  useEffect(() => {
    if (!active) return;
    const on = (e: KeyboardEvent) => { if (e.key === 'Escape') fn(); };
    document.addEventListener('keydown', on);
    return () => document.removeEventListener('keydown', on);
  }, [active, fn]);
}
