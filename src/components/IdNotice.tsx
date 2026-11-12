// Age / ID reminder shown wherever beer can be ordered (item pop-ups and checkout).
import type { CSSProperties } from 'react';
import { BEER_ID_NOTICE } from '../lib/pricing';

export default function IdNotice({ style }: { style?: CSSProperties }) {
  const n = BEER_ID_NOTICE;
  return (
    <div role="note" aria-label={n.title + '. ' + n.body + ' Accepted ID: ' + n.ids.join(', ') + '.'} style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16, borderRadius: 18, background: '#F6F6F8', color: '#1A1414', ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span aria-hidden="true" style={{ flex: 'none', width: 44, height: 44, borderRadius: '50%', background: '#1A1414', color: '#fff', fontWeight: 900, fontSize: 15, letterSpacing: '-.02em', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>19+</span>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <span style={{ fontWeight: 800, fontSize: 15 }}>{n.title}</span>
          <span style={{ fontSize: 13, lineHeight: 1.4, color: '#636366' }}>{n.body}</span>
        </span>
      </div>
      <div aria-hidden="true" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {n.ids.map((id) => (
          <span key={id} style={{ height: 28, padding: '0 10px', borderRadius: 999, background: '#fff', boxShadow: 'inset 0 0 0 1px #E4E4E8', fontSize: 12, fontWeight: 700, color: '#3A3A3C', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>{id}</span>
        ))}
      </div>
    </div>
  );
}
