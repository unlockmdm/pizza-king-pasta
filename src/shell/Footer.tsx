import type { CSSProperties, MouseEvent } from 'react';
import { SHOP } from '../lib/catalog';
import { Hov } from '../lib/ui';

type Nav = (e?: MouseEvent) => void;
const link = { color: '#fff', textDecoration: 'none' } as const;
const linkHover = { color: '#FF7A85' } as const;
const colHead = { fontSize: 13, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: '#87878A' } as const;

export default function Footer({
  w, padBottom, ctaText, onStart, onMenu, onBest, onDeals, onOven, onPickup, onDelivery,
}: {
  w: number;
  padBottom: string;
  ctaText: string;
  onStart: Nav;
  onMenu: Nav;
  onBest: Nav;
  onDeals: Nav;
  onOven: Nav;
  onPickup: Nav;
  onDelivery: Nav;
}) {
  const footCols = w >= 900 ? 'minmax(0,1.4fr) repeat(3,minmax(0,1fr))' : w >= 560 ? 'repeat(2,minmax(0,1fr))' : 'minmax(0,1fr)';
  return (
    <footer style={{ background: '#1A1414', color: '#fff', overflow: 'hidden' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '72px clamp(16px,3vw,32px) ' + padBottom, display: 'flex', flexDirection: 'column', gap: 56 }}>
        <div style={{ display: 'grid', gridTemplateColumns: footCols, gap: '40px 32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22, alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ width: 60, height: 60, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <img src="assets/chef-logo.png" alt="" style={{ width: 48, height: 'auto' }} />
              </span>
              <span style={{ fontWeight: 900, fontSize: 24, letterSpacing: '-.03em' }}>Pizza King <span style={{ color: '#FF5A6A' }}>&amp;</span> Pasta</span>
            </div>
            <Hov as="button" onClick={onStart} style={{ border: 0, background: '#D7192D', color: '#fff', borderRadius: 999, padding: '16px 28px', fontWeight: 800, fontSize: 16, cursor: 'pointer' }} hover={{ background: '#B5121F' }}>
              {ctaText}
            </Hov>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 15 }}>
            <span style={colHead}>Menu</span>
            <Hov as="a" href="#bestsellers" onClick={onBest} style={link} hover={linkHover}>House specials</Hov>
            <Hov as="a" href="#menu" onClick={onMenu} style={link} hover={linkHover}>Build your own</Hov>
            <Hov as="a" href="#menu" onClick={onMenu} style={link} hover={linkHover}>Pasta</Hov>
            <Hov as="a" href="#menu" onClick={onMenu} style={link} hover={linkHover}>Wings &amp; sides</Hov>
            <Hov as="a" href="#menu" onClick={onMenu} style={link} hover={linkHover}>Juice &amp; gelato</Hov>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 15 }}>
            <span style={colHead}>Order</span>
            <Hov as="a" href="#top" onClick={onPickup} style={link} hover={linkHover}>Pickup</Hov>
            <Hov as="a" href="#top" onClick={onDelivery} style={link} hover={linkHover}>Delivery</Hov>
            <Hov as="a" href="#deals" onClick={onDeals} style={link} hover={linkHover}>Pickup combos</Hov>
            <Hov as="a" href="#oven" onClick={onOven} style={link} hover={linkHover}>Our wood oven</Hov>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 15, lineHeight: 1.5 }}>
            <span style={colHead}>Visit</span>
            <span>{SHOP.street}<br />{SHOP.cityLine}</span>
            <span>{SHOP.hoursDays}, {SHOP.hoursText}</span>
            <Hov as="a" href={SHOP.phoneHref} style={link} hover={linkHover}>{SHOP.phoneText}</Hov>
          </div>
        </div>
        <div aria-hidden="true" style={{ fontWeight: 900, fontSize: 'clamp(44px,9.2vw,136px)', lineHeight: 0.85, letterSpacing: '-.06em', color: '#2A2222', textWrap: 'balance', userSelect: 'none' } as CSSProperties}>
          Pizza King &amp; Pasta
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '12px 32px', paddingTop: 22, borderTop: '1px solid #362C2C', fontSize: 13, color: '#87878A' }}>
          <span>© 2026 Pizza King &amp; Pasta · Prices exclude HST</span>
          <nav aria-label="Legal" style={{ display: 'flex', gap: 24 }}>
            <Hov as="a" href="#terms" style={{ color: '#C9C9CE', textDecoration: 'none' }} hover={{ color: '#fff' }}>Terms of Service</Hov>
            <Hov as="a" href="#privacy" style={{ color: '#C9C9CE', textDecoration: 'none' }} hover={{ color: '#fff' }}>Privacy Policy</Hov>
          </nav>
        </div>
      </div>
    </footer>
  );
}
