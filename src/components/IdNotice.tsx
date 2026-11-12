// Age / ID reminder shown wherever beer can be ordered (item pop-ups and checkout).
import type { CSSProperties } from 'react';
import { BEER_ID_NOTICE } from '../lib/pricing';

export default function IdNotice({ style }: { style?: CSSProperties }) {
  return (
    <div role="note" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 14px', borderRadius: 16, background: '#FFF6E5', boxShadow: 'inset 0 0 0 1px #F3D9A4', color: '#1A1414', ...style }}>
      <span aria-hidden="true" style={{ flex: 'none', height: 26, padding: '0 8px', borderRadius: 8, background: '#1A1414', color: '#fff', fontSize: 12, fontWeight: 900, display: 'flex', alignItems: 'center' }}>19+</span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
        <span style={{ fontWeight: 800, fontSize: 14 }}>{BEER_ID_NOTICE.title}</span>
        <span style={{ fontSize: 13, lineHeight: 1.45, color: '#5C4A2E' }}>{BEER_ID_NOTICE.body}</span>
      </span>
    </div>
  );
}
