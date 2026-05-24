import React from 'react';
import { FieldValues, BlockConfig } from '../types';

interface Props { fields: FieldValues; config: BlockConfig['config'] }

const PAD = { sm: 16, md: 28, lg: 40 };

export const FooterBlock: React.FC<Props> = ({ fields, config }) => {
  const p = PAD[config.padding ?? 'md'];
  const bg = config.background ?? '#0F172A';
  return (
    <div style={{
      width: '100%', padding: `${p}px 48px`, background: bg,
      borderTop: '1px solid rgba(255,255,255,0.1)',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <span style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#64748B', fontSize: 20 }}>
        {fields.social_handle || '@alfatih.umroh'}
      </span>
      <span style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#64748B', fontSize: 20 }}>
        {fields.contact || 'adwisata.com'}
      </span>
      <span style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#64748B', fontSize: 20 }}>
        PPIU: {fields.ppiu_number || '123456'}
      </span>
    </div>
  );
};
