import React from 'react';
import { PosterTemplate, FieldValues } from '../types';

const EduReminderPoster: React.FC<FieldValues> = (f) => {
  const items = [1,2,3,4,5].map(n => ({ title: f[`item_${n}_title`], desc: f[`item_${n}_desc`] })).filter(i => i.title);

  return (
    <div style={{ width: 1080, height: 1350, background: '#F8FAFC', fontFamily: '"Plus Jakarta Sans", sans-serif', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#0084FF', padding: '48px 48px 40px', flexShrink: 0 }}>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Alfatih Dunia Wisata</div>
        <div style={{ color: '#FFFFFF', fontSize: 60, fontWeight: 800, lineHeight: 1.15 }}>
          {f.headline || 'Tips Umroh untuk Anda'}
        </div>
        {f.intro && (
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 26, fontWeight: 500, marginTop: 16 }}>{f.intro}</div>
        )}
      </div>

      <div style={{ flex: 1, padding: '40px 48px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {items.map(({ title, desc }, i) => (
          <div key={i} style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: '#0084FF', color: '#FFFFFF', fontSize: 28, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {i + 1}
            </div>
            <div>
              <div style={{ color: '#0F172A', fontSize: 28, fontWeight: 700, marginBottom: 4 }}>{title}</div>
              {desc && <div style={{ color: '#64748B', fontSize: 22, fontWeight: 500 }}>{desc}</div>}
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '24px 48px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', color: '#94A3B8', fontSize: 20 }}>
        <span>@alfatih.umroh</span><span>adwisata.com</span>
      </div>
    </div>
  );
};

export const eduReminderTemplate: PosterTemplate = {
  id: 'edu-reminder',
  name: 'Tips & Pengingat',
  description: 'Poster edukasi dengan daftar bernomor',
  category: 'edu-reminder',
  aspectRatio: 'post',
  previewColors: ['#0084FF', '#F8FAFC', '#0F172A'],
  fields: [
    { id: 'headline',     type: 'text', label: 'Judul Poster',      placeholder: '5 Barang Wajib Dibawa Saat Umroh' },
    { id: 'intro',        type: 'text', label: 'Kalimat Pengantar',  placeholder: 'Persiapkan diri Anda dengan baik' },
    { id: 'item_1_title', type: 'text', label: 'Item 1 — Judul',    placeholder: 'Ihram & Perlengkapan Sholat' },
    { id: 'item_1_desc',  type: 'text', label: 'Item 1 — Deskripsi', placeholder: 'Bawa minimal 2 set kain ihram' },
    { id: 'item_2_title', type: 'text', label: 'Item 2 — Judul',    placeholder: 'Obat-obatan Pribadi' },
    { id: 'item_2_desc',  type: 'text', label: 'Item 2 — Deskripsi', placeholder: 'Siapkan obat rutin dan vitamin' },
    { id: 'item_3_title', type: 'text', label: 'Item 3 — Judul',    placeholder: 'Dokumen Perjalanan' },
    { id: 'item_3_desc',  type: 'text', label: 'Item 3 — Deskripsi', placeholder: 'Paspor, visa, dan buku kesehatan' },
    { id: 'item_4_title', type: 'text', label: 'Item 4 — Judul',    placeholder: 'Al-Quran & Buku Doa' },
    { id: 'item_4_desc',  type: 'text', label: 'Item 4 — Deskripsi', placeholder: 'Untuk ibadah optimal di tanah suci' },
    { id: 'item_5_title', type: 'text', label: 'Item 5 — Judul',    placeholder: 'Pakaian Syar\'i' },
    { id: 'item_5_desc',  type: 'text', label: 'Item 5 — Deskripsi', placeholder: 'Minimal 7 stel pakaian longgar' },
  ],
  Component: EduReminderPoster,
};
