import {
  createElement,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ElementType,
  type PointerEvent,
  type ReactNode,
} from 'react';

/**
 * `Hov` replaces the prototype's `style-hover="…"` attribute.
 *   <Hov as="button" style={{...}} hover={{ background: '#C0121F' }} onClick={...}>…</Hov>
 * The hover style is merged over `style` while a mouse pointer is over the element
 * (touch taps don't leave it stuck in the hover state).
 */
type HovProps<T extends ElementType> = {
  as?: T;
  style?: CSSProperties;
  hover?: CSSProperties;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, 'style' | 'as' | 'children'>;

export function Hov<T extends ElementType = 'div'>(props: HovProps<T>) {
  const { as, style, hover, onPointerEnter, onPointerLeave, children, ...rest } = props as HovProps<ElementType> & {
    onPointerEnter?: (e: PointerEvent) => void;
    onPointerLeave?: (e: PointerEvent) => void;
  };
  const [on, setOn] = useState(false);
  return createElement(
    as || 'div',
    {
      ...rest,
      style: on && hover ? { ...style, ...hover } : style,
      onPointerEnter: (e: PointerEvent) => {
        if (e.pointerType === 'mouse') setOn(true);
        onPointerEnter?.(e);
      },
      onPointerLeave: (e: PointerEvent) => {
        setOn(false);
        onPointerLeave?.(e);
      },
    },
    children,
  );
}

/**
 * `Photo` replaces the prototype's `<image-slot>`.
 * Fills its positioned parent (position:absolute; inset:0). If `src` is empty it renders an
 * empty neutral box, as the design asks ("leave an empty image box rather than a misleading picture").
 * `credit` shows the small attribution chip bottom-left (required for Unsplash / CC photos).
 */
export function Photo({
  src,
  alt = '',
  credit,
  creditHref,
  shape = 'rect',
  fit = 'cover',
  position,
  style,
  imgStyle,
  eager,
  creditTop,
}: {
  src?: string;
  alt?: string;
  credit?: string;
  creditHref?: string;
  shape?: 'rect' | 'circle';
  fit?: CSSProperties['objectFit'];
  position?: string;
  style?: CSSProperties;
  imgStyle?: CSSProperties;
  eager?: boolean;
  /** Put the credit chip top-left instead of bottom-left (for cards with text over the bottom of the photo). */
  creditTop?: boolean;
}) {
  return (
    <span
      style={{
        position: 'absolute',
        inset: 0,
        display: 'block',
        overflow: 'hidden',
        borderRadius: shape === 'circle' ? '50%' : undefined,
        background: src ? undefined : 'rgba(127,127,127,.14)',
        ...style,
      }}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: fit, objectPosition: position, display: 'block', ...imgStyle }}
        />
      ) : null}
      {src && credit ? (
        <span
          style={{
            position: 'absolute',
            left: shape === 'circle' ? '50%' : 6,
            transform: shape === 'circle' ? 'translateX(-50%)' : undefined,
            bottom: creditTop ? undefined : shape === 'circle' ? '16%' : 6,
            top: creditTop ? 6 : undefined,
            maxWidth: 'calc(100% - 12px)',
            padding: '3px 7px',
            borderRadius: 5,
            background: 'rgba(0,0,0,.55)',
            color: '#fff',
            font: '10px/1.2 system-ui,-apple-system,sans-serif',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            zIndex: 1,
          }}
        >
          {creditHref ? (
            <a href={creditHref} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: 'inherit', textDecoration: 'none' }}>
              {credit}
            </a>
          ) : (
            credit
          )}
        </span>
      ) : null}
    </span>
  );
}

// ---------- Icons used across screens (stroke icons, currentColor) ----------
type IconProps = { size?: number; stroke?: number; color?: string; style?: CSSProperties };
const svg = (d: ReactNode, { size = 16, stroke = 3, color = 'currentColor', style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', ...style }} aria-hidden="true">
    {d}
  </svg>
);
export const IconArrow = (p: IconProps) => svg(<path d="M5 12h14M13 6l6 6-6 6" />, p);
export const IconBack = (p: IconProps) => svg(<path d="M19 12H5M11 18l-6-6 6-6" />, p);
export const IconPlus = (p: IconProps) => svg(<path d="M12 5v14M5 12h14" />, { stroke: 2.8, size: 18, ...p });
export const IconMinus = (p: IconProps) => svg(<path d="M5 12h14" />, { stroke: 2.8, size: 18, ...p });
export const IconCheck = (p: IconProps) => svg(<path d="M5 12.5l4.5 4.5L19 7.5" />, { stroke: 3, size: 18, ...p });
export const IconClose = (p: IconProps) => svg(<path d="M6 6l12 12M18 6L6 18" />, { size: 14, ...p });
export const IconChevronDown = (p: IconProps) => svg(<path d="M6 9l6 6 6-6" />, { stroke: 2.6, ...p });
export const IconCart = (p: IconProps) =>
  svg(
    <>
      <path d="M2.5 3.5h2.6l2.3 11.1a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.5L21 7.5H6" />
      <circle cx="10" cy="20.2" r="1.5" />
      <circle cx="17.5" cy="20.2" r="1.5" />
    </>,
    { size: 20, stroke: 2.2, ...p },
  );
export const IconPin = (p: IconProps) =>
  svg(
    <>
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
      <path d="M12 12.2a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2z" />
    </>,
    { size: 20, stroke: 2.2, ...p },
  );
