import React from 'react';
import { FieldValues, BlockConfig } from '../types';

interface Props { fields: FieldValues; config: BlockConfig['config'] }

const PAD = { sm: 24, md: 40, lg: 56 };

export const PromoBlock: React.FC<Props> = ({ fields, config }) => {
  const p = PAD[config.padding ?? 'md'];
  const bg = config.background ?? '#0084FF';
  return (
    <div style={{
      width: '100%', padding: `${p}px 48px`, background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div>
        <div style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: 'rgba(255,255,255,0.7)', fontSize: 22, fontWeight: 600, marginBottom: 4 }}>
          Mulai dari
        </div>
        <div style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#FFFFFF', fontSize: 64, fontWeight: 800, lineHeight: 1 }}>
          {fields.promo_price || 'Hubungi Kami'}
        </div>
      </div>
      {fields.cta_text && (
        <div style={{
          background: '#FFFFFF', color: '#0084FF', fontSize: 28, fontWeight: 800,
          padding: '16px 40px', borderRadius: 12,
          fontFamily: '"Plus Jakarta Sans", sans-serif',
        }}>
          {fields.cta_text}
        </div>
      )}
    </div>
  );
};
