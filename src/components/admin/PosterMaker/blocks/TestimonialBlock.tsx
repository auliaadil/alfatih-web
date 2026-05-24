import React from 'react';
import { FieldValues, BlockConfig } from '../types';

interface Props { fields: FieldValues; config: BlockConfig['config'] }

const PAD = { sm: 24, md: 40, lg: 56 };

export const TestimonialBlock: React.FC<Props> = ({ fields, config }) => {
  const p = PAD[config.padding ?? 'md'];
  const bg = config.background ?? 'transparent';
  return (
    <div style={{ width: '100%', padding: `${p}px 48px`, background: bg, textAlign: 'center' }}>
      {fields.quote && (
        <div style={{
          fontFamily: '"Cormorant Garamond", serif',
          color: '#F1F5F9',
          fontSize: 36,
          fontStyle: 'italic',
          lineHeight: 1.5,
          marginBottom: 24,
        }}>
          "{fields.quote}"
        </div>
      )}
      {fields.author_name && (
        <div style={{
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          color: '#0084FF',
          fontSize: 24,
          fontWeight: 700,
          marginBottom: 8,
        }}>
          {fields.author_name}
        </div>
      )}
      {fields.batch && (
        <div style={{
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          color: '#64748B',
          fontSize: 20,
          fontWeight: 500,
        }}>
          {fields.batch}
        </div>
      )}
    </div>
  );
};
