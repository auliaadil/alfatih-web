import React from 'react';
import { FieldValues, BlockConfig } from '../types';

interface Props { fields: FieldValues; config: BlockConfig['config']; height?: number }

export const HeroImageBlock: React.FC<Props> = ({ fields, config, height = 600 }) => (
  <div style={{ width: '100%', height, position: 'relative', overflow: 'hidden', background: '#1E293B' }}>
    {fields.hero_image && (
      <img
        src={fields.hero_image}
        alt=""
        crossOrigin="anonymous"
        style={{ width: '100%', height: '100%', objectFit: config.imageFit ?? 'cover' }}
      />
    )}
    {!fields.hero_image && (
      <div style={{
        width: '100%', height: '100%', display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: '#475569', fontSize: 28, fontFamily: '"Plus Jakarta Sans", sans-serif',
      }}>
        Foto Utama
      </div>
    )}
  </div>
);
