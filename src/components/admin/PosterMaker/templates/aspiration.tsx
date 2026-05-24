import React from 'react';
import { PosterTemplate, FieldValues } from '../types';

const AspirationPoster: React.FC<FieldValues> = (f) => (
  <div style={{ width: 1080, height: 1920, position: 'relative', overflow: 'hidden', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
    {f.hero_image ? (
      <img src={f.hero_image} alt="" crossOrigin="anonymous" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
    ) : (
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #0F172A 100%)' }} />
    )}
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(15,23,42,0.5) 0%, rgba(15,23,42,0.85) 100%)' }} />

    <div style={{ position: 'absolute', top: 64, left: 0, right: 0, textAlign: 'center', zIndex: 1 }}>
      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 28, fontWeight: 600, letterSpacing: 4, textTransform: 'uppercase' }}>
        Alfatih Dunia Wisata
      </div>
    </div>

    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 80px', textAlign: 'center', zIndex: 1 }}>
      <div style={{ color: '#F59E0B', fontSize: 80, lineHeight: 0.8, marginBottom: 24, fontFamily: '"Cormorant Garamond", serif' }}>"</div>
      <div style={{ fontFamily: '"Cormorant Garamond", serif', color: '#FFFFFF', fontSize: 60, fontWeight: 600, fontStyle: 'italic', lineHeight: 1.4, marginBottom: 40 }}>
        {f.tagline || 'Melangkah ke Tanah Suci, Mewujudkan Impian Mulia'}
      </div>
      {f.sub_tagline && (
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 28, fontWeight: 500 }}>{f.sub_tagline}</div>
      )}
    </div>

    <div style={{ position: 'absolute', bottom: 200, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 48, zIndex: 1 }}>
      {['Islami', 'Amanah', 'Premium'].map(p => (
        <div key={p} style={{ textAlign: 'center' }}>
          <div style={{ color: '#F59E0B', fontSize: 22, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>{p}</div>
        </div>
      ))}
    </div>

    <div style={{ position: 'absolute', bottom: 64, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: '0 64px', zIndex: 1 }}>
      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 22 }}>@alfatih.umroh</span>
      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 22 }}>adwisata.com</span>
    </div>
  </div>
);

export const aspirationTemplate: PosterTemplate = {
  id: 'aspiration',
  name: 'Aspirasi & Inspirasi',
  description: 'Poster tagline spiritual dengan foto latar',
  category: 'aspiration',
  aspectRatio: 'story',
  previewColors: ['#0F172A', '#1E3A5F', '#F59E0B'],
  fields: [
    { id: 'tagline',     type: 'textarea', label: 'Tagline Utama',   placeholder: 'Melangkah ke Tanah Suci, Mewujudkan Impian Mulia' },
    { id: 'sub_tagline', type: 'text',     label: 'Sub-tagline',     placeholder: 'Bergabunglah bersama kami dalam perjalanan suci' },
    { id: 'hero_image',  type: 'image',    label: 'Foto Latar' },
  ],
  Component: AspirationPoster,
};
