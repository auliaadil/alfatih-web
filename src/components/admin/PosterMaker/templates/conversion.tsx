import React from 'react';
import { PosterTemplate, FieldValues } from '../types';

const ConversionPoster: React.FC<FieldValues> = (f) => {
  const accent = f.accent_color || '#0084FF';
  const features = [f.feature_1, f.feature_2, f.feature_3, f.feature_4].filter(Boolean);

  return (
    <div style={{ width: 1080, height: 1350, position: 'relative', overflow: 'hidden', background: '#0F172A', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
      {f.hero_image && (
        <img src={f.hero_image} alt="" crossOrigin="anonymous" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '65%', objectFit: 'cover', opacity: 0.45 }} />
      )}
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, ${accent}22 0%, #0F172A 58%)` }} />

      <div style={{ position: 'absolute', top: 48, left: 48, right: 48, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 }}>
        <div style={{ color: '#FFFFFF', fontSize: 28, fontWeight: 800 }}>Alfatih Dunia Wisata</div>
        {f.badge_text && (
          <div style={{ background: accent, color: '#FFFFFF', fontSize: 22, fontWeight: 700, padding: '8px 24px', borderRadius: 99 }}>{f.badge_text}</div>
        )}
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '48px', zIndex: 1 }}>
        <div style={{ color: '#FFFFFF', fontSize: 68, fontWeight: 800, lineHeight: 1.1, marginBottom: 20 }}>
          {f.headline || 'Paket Umroh Premium'}
        </div>
        <div style={{ display: 'flex', gap: 32, marginBottom: 28, color: '#94A3B8', fontSize: 26, fontWeight: 600 }}>
          {f.departure && <span>📅 {f.departure}</span>}
          {f.duration && <span>⏱ {f.duration}</span>}
        </div>
        {features.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 36 }}>
            {features.map((feat, i) => (
              <div key={i} style={{ background: `${accent}22`, border: `1px solid ${accent}55`, color: '#E2E8F0', fontSize: 22, fontWeight: 600, padding: '8px 20px', borderRadius: 8 }}>
                ✓ {feat}
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: '#64748B', fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Mulai dari</div>
            <div style={{ color: '#F59E0B', fontSize: 68, fontWeight: 800, lineHeight: 1 }}>{f.price || 'Hubungi Kami'}</div>
            <div style={{ color: '#64748B', fontSize: 20 }}>/pax</div>
          </div>
          <div style={{ background: accent, color: '#FFFFFF', fontSize: 28, fontWeight: 800, padding: '18px 44px', borderRadius: 14 }}>
            Daftar Sekarang
          </div>
        </div>
        <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: 20 }}>
          <span>@alfatih.umroh</span><span>adwisata.com</span><span>PPIU: 123456</span>
        </div>
      </div>
    </div>
  );
};

export const conversionTemplate: PosterTemplate = {
  id: 'conversion',
  name: 'Konversi Paket',
  description: 'Poster promosi paket umroh dengan harga dan keunggulan',
  category: 'conversion',
  aspectRatio: 'post',
  previewColors: ['#0084FF', '#0F172A', '#F59E0B'],
  fields: [
    { id: 'headline',     type: 'text',  label: 'Judul Paket',          placeholder: 'Umroh Premium Ramadan 2026' },
    { id: 'badge_text',   type: 'text',  label: 'Badge Kategori',        placeholder: 'Umroh Premium' },
    { id: 'departure',    type: 'text',  label: 'Tanggal Keberangkatan', placeholder: '15 Maret 2026' },
    { id: 'duration',     type: 'text',  label: 'Durasi',                placeholder: '13 Hari / 12 Malam' },
    { id: 'price',        type: 'text',  label: 'Harga Mulai',           placeholder: 'Rp 28.500.000' },
    { id: 'feature_1',   type: 'text',  label: 'Keunggulan 1',          placeholder: 'Hotel Bintang 5' },
    { id: 'feature_2',   type: 'text',  label: 'Keunggulan 2',          placeholder: 'Muthawwif Berpengalaman' },
    { id: 'feature_3',   type: 'text',  label: 'Keunggulan 3',          placeholder: 'Tiket PP Included' },
    { id: 'feature_4',   type: 'text',  label: 'Keunggulan 4',          placeholder: 'Visa Umroh Termasuk' },
    { id: 'hero_image',  type: 'image', label: 'Foto Utama' },
    { id: 'accent_color', type: 'color', label: 'Warna Aksen' },
  ],
  Component: ConversionPoster,
};
