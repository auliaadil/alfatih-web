import React from 'react';
import { FieldValues, BlockConfig } from '../types';

interface Props { fields: FieldValues; config: BlockConfig['config'] }

const PAD = { sm: 24, md: 40, lg: 56 };

export const HeaderBlock: React.FC<Props> = ({ fields, config }) => {
  const p = PAD[config.padding ?? 'md'];
  const bg = config.background ?? '#0F172A';
  return (
    <div style={{
      width: '100%',
      padding: `${p}px 48px`,
      background: bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <div style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#FFFFFF', fontSize: 32, fontWeight: 800 }}>
        {fields.brand_name || 'Alfatih Dunia Wisata'}
      </div>
      {fields.tagline && (
        <div style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#94A3B8', fontSize: 22, fontWeight: 500 }}>
          {fields.tagline}
        </div>
      )}
    </div>
  );
};
