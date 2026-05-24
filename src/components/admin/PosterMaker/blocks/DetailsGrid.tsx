import React from 'react';
import { FieldValues, BlockConfig } from '../types';

interface Props { fields: FieldValues; config: BlockConfig['config'] }

const PAD = { sm: 24, md: 40, lg: 56 };
const ICONS = ['📅', '⏱', '🏨', '✈', '👥', '⭐'];

export const DetailsGrid: React.FC<Props> = ({ fields, config }) => {
  const p = PAD[config.padding ?? 'md'];
  const bg = config.background ?? 'transparent';
  const items = [1, 2, 3, 4, 5, 6]
    .map((n, i) => ({ icon: ICONS[i], text: fields[`detail_${n}`] }))
    .filter(item => item.text);

  return (
    <div style={{ width: '100%', padding: `${p}px 48px`, background: bg }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {items.map(({ icon, text }, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 16,
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 12, padding: '16px 20px',
          }}>
            <span style={{ fontSize: 28 }}>{icon}</span>
            <span style={{
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              color: '#E2E8F0', fontSize: 22, fontWeight: 600,
            }}>
              {text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
