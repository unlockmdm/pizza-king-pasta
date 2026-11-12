import { useEffect, useRef, type CSSProperties } from 'react';
import { IconCheck } from '../lib/ui';
import type { CartLine } from '../lib/types';
import LineThumb from '../components/LineThumb';

export interface Added {
  n: number;
  img: string;
  name: string;
  summary: string;
  price: string;
  qty: number;
  /** The added line: drawn with the same thumbnail as the cart (real toppings, the chosen drink...). */
  line?: CartLine;
}

/** "Added to your order" card (bottom right). Names wrap and are never truncated. */
export function AddedToast({ added, right, bottom }: { added: Added; right: string; bottom: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const ck = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    ref.current?.animate?.([{ transform: 'translateY(24px) scale(.96)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 380, easing: 'cubic-bezier(.2,.9,.25,1.1)' });
    ck.current?.animate?.([{ transform: 'scale(0)' }, { transform: 'scale(1.2)', offset: 0.6 }, { transform: 'scale(1)' }], { duration: 480, delay: 120, fill: 'both', easing: 'ease-out' });
  }, [added.n]);

  return (
    <div
      ref={ref}
      role="status"
      aria-live="polite"
      style={{ position: 'fixed', right, bottom, zIndex: 60, width: 'min(380px,calc(100vw - 24px))', background: '#fff', color: '#1A1414', borderRadius: 24, boxShadow: '0 1px 2px rgba(26,20,20,.06),0 24px 56px -12px rgba(26,20,20,.3)', padding: '12px 18px 12px 12px', display: 'flex', alignItems: 'center', gap: 14 }}
    >
      <span style={{ position: 'relative', width: 72, height: 72, flex: 'none' }}>
        {added.line?.spec ? (
          <span role="img" aria-label={added.name} style={{ position: 'relative', width: 72, height: 72, borderRadius: 18, background: '#F2F2F5', display: 'block', overflow: 'hidden' }}>
            <LineThumb line={added.line} />
          </span>
        ) : added.img ? (
          <span role="img" aria-label={added.name} style={{ width: 72, height: 72, borderRadius: 18, background: '#F2F2F5 url("' + added.img + '") center/cover no-repeat', display: 'block' }} />
        ) : (
          <span style={{ width: 72, height: 72, borderRadius: 18, background: '#F2F2F5', display: 'block' }} />
        )}
        <span ref={ck} style={{ position: 'absolute', right: -6, bottom: -6, width: 26, height: 26, borderRadius: '50%', background: '#1E9E4A', color: '#fff', boxShadow: '0 0 0 3px #fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconCheck size={13} stroke={4} />
        </span>
      </span>
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#1E7A3C' }}>Added to your order</span>
        <span style={{ fontWeight: 900, fontSize: 17, letterSpacing: '-.025em', lineHeight: 1.2, textWrap: 'pretty' } as CSSProperties}>{(added.qty > 1 ? added.qty + ' × ' : '') + added.name}</span>
        {added.summary && (
          <span style={{ fontSize: 13, lineHeight: 1.35, color: '#646467', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{added.summary}</span>
        )}
      </span>
      <span style={{ flex: 'none', alignSelf: 'flex-start', paddingTop: 22, fontWeight: 900, fontSize: 17, letterSpacing: '-.025em' }}>{added.price}</span>
    </div>
  );
}

/** Dark info toast, centred at the bottom. Wraps; optional "View cart" button. */
export function InfoToast({ text, bottom, onViewCart }: { text: string; bottom: string; onViewCart?: () => void }) {
  return (
    <div role="status" aria-live="polite" style={{ position: 'fixed', left: '50%', bottom, transform: 'translateX(-50%)', zIndex: 50, background: '#1A1414', color: '#fff', borderRadius: 24, padding: '10px 10px 10px 20px', display: 'flex', alignItems: 'center', gap: 14, fontSize: 15, fontWeight: 600, lineHeight: 1.35, boxShadow: '0 16px 40px rgba(0,0,0,.3)', width: 'max-content', maxWidth: 'calc(100vw - 24px)' }}>
      <span style={{ minWidth: 0, padding: '4px 0', textWrap: 'pretty' } as CSSProperties}>{text}</span>
      {onViewCart && (
        <button onClick={onViewCart} style={{ border: 0, background: '#fff', color: '#1A1414', borderRadius: 999, padding: '9px 16px', fontWeight: 800, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }}>View cart</button>
      )}
    </div>
  );
}
