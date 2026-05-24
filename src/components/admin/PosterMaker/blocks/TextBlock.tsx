import React from 'react';
import { FieldValues, BlockConfig } from '../types';

interface Props { fields: FieldValues; config: BlockConfig['config'] }

const PAD = { sm: 24, md: 40, lg: 56 };
const HL = { sm: 48, md: 64, lg: 80 };
const BODY = { sm: 22, md: 26, lg: 32 };

export const TextBlock: React.FC<Props> = ({ fields, config }) => {
  const p = PAD[config.padding ?? 'md'];
  const bg = config.background ?? 'transparent';
  const align = config.textAlign ?? 'left';
  return (
    <div style={{ width: '100%', padding: `${p}px 48px`, background: bg, textAlign: align }}>
      {fields.headline && (
        <div style={{
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          color: '#FFFFFF',
          fontSize: HL[config.fontSize ?? 'md'],
          fontWeight: 800,
          lineHeight: 1.2,
          marginBottom: fields.body_text ? 16 : 0,
        }}>
          {fields.headline}
        </div>
      )}
      {fields.body_text && (
        <div style={{
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          color: '#94A3B8',
          fontSize: BODY[config.fontSize ?? 'md'],
          fontWeight: 500,
          lineHeight: 1.5,
        }}>
          {fields.body_text}
        </div>
      )}
    </div>
  );
};
