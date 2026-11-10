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
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      locks--;
      if (locks === 0) document.documentElement.style.overflow = prev === 'hidden' ? '' : prev;
    };
  }, [active]);
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
