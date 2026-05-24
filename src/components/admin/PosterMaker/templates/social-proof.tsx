import React from 'react';
import { PosterTemplate, FieldValues } from '../types';

const SocialProofPoster: React.FC<FieldValues> = (f) => (
  <div style={{ width: 1080, height: 1350, background: '#0F172A', fontFamily: '"Plus Jakarta Sans", sans-serif', display: 'flex', flexDirection: 'column' }}>
    <div style={{ padding: '48px 48px 32px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Alfatih Dunia Wisata</div>
      <div style={{ color: '#0084FF', fontSize: 28, fontWeight: 700 }}>Kata Mereka yang Telah Bersama Kami</div>
    </div>

    <div style={{ display: 'flex', padding: '32px 48px', gap: 48, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      {[
        { value: f.stat_1 || '1000+', label: 'Jamaah' },
        { value: f.stat_2 || '12 Thn', label: 'Pengalaman' },
        { value: `★ ${f.rating || '5.0'}`, label: 'Rating' },
      ].map(({ value, label }, i) => (
        <div key={i} style={{ textAlign: 'center' }}>
          <div style={{ color: '#F59E0B', fontSize: 44, fontWeight: 800 }}>{value}</div>
          <div style={{ color: '#64748B', fontSize: 20, fontWeight: 600 }}>{label}</div>
        </div>
      ))}
    </div>

    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 80px', textAlign: 'center' }}>
      <div style={{ color: '#0084FF', fontSize: 100, fontFamily: '"Cormorant Garamond", serif', lineHeight: 0.5, marginBottom: 32 }}>"</div>
      <div style={{ fontFamily: '"Cormorant Garamond", serif', color: '#F1F5F9', fontSize: 44, fontStyle: 'italic', lineHeight: 1.5, marginBottom: 40 }}>
        {f.quote || 'Perjalanan umroh yang luar biasa. Pelayanan sangat profesional dan penuh keikhlasan.'}
      </div>
      <div style={{ color: '#FFFFFF', fontSize: 26, fontWeight: 700, marginBottom: 8 }}>
        {f.author_name || 'Ibu Sari W.'}
      </div>
      <div style={{ color: '#0084FF', fontSize: 22, fontWeight: 600 }}>
        {f.batch || 'Umroh Reguler, Januari 2026'}
      </div>
    </div>

    <div style={{ padding: '24px 48px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: 20 }}>
      <span>@alfatih.umroh</span><span>adwisata.com</span><span>PPIU: 123456</span>
    </div>
  </div>
);

export const socialProofTemplate: PosterTemplate = {
  id: 'social-proof',
  name: 'Bukti Sosial',
  description: 'Poster testimoni jamaah dengan statistik kepercayaan',
  category: 'social-proof',
  aspectRatio: 'post',
  previewColors: ['#0F172A', '#0084FF', '#F59E0B'],
  fields: [
    { id: 'quote',       type: 'textarea', label: 'Kutipan Testimoni',  placeholder: 'Perjalanan umroh yang luar biasa...' },
    { id: 'author_name', type: 'text',     label: 'Nama Jamaah',        placeholder: 'Ibu Sari W.' },
    { id: 'batch',       type: 'text',     label: 'Rombongan / Batch',  placeholder: 'Umroh Reguler, Januari 2026' },
    { id: 'stat_1',      type: 'text',     label: 'Statistik 1',        placeholder: '1000+' },
    { id: 'stat_2',      type: 'text',     label: 'Statistik 2',        placeholder: '12 Thn' },
    { id: 'rating',      type: 'text',     label: 'Rating Bintang',     placeholder: '5.0' },
  ],
  Component: SocialProofPoster,
};
