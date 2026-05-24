# Poster Maker Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Fabric.js canvas editor with a React/CSS block-based poster editor that is maintainable, bug-free, and exports print-quality images.

**Architecture:** Templates are React components with typed field schemas. The editor is a two-panel layout: a structured field form on the left, a live CSS-scaled preview on the right. New templates are composed from stacked layout blocks in a block builder modal. Export uses `html-to-image` (already installed) to capture at 2× or 4× pixel ratio.

**Tech Stack:** React 19, TypeScript, Tailwind (CDN), `html-to-image` (already installed), Supabase, Plus Jakarta Sans + Cormorant Garamond (already loaded via Google Fonts in `index.html`).

**Reference spec:** `docs/superpowers/specs/2026-05-24-poster-maker-redesign.md`

---

## File Map

**Create:**
- `src/components/admin/PosterMaker/types.ts` — shared types
- `src/components/admin/PosterMaker/blocks/HeaderBlock.tsx`
- `src/components/admin/PosterMaker/blocks/HeroImageBlock.tsx`
- `src/components/admin/PosterMaker/blocks/TextBlock.tsx`
- `src/components/admin/PosterMaker/blocks/DetailsGrid.tsx`
- `src/components/admin/PosterMaker/blocks/TestimonialBlock.tsx`
- `src/components/admin/PosterMaker/blocks/PromoBlock.tsx`
- `src/components/admin/PosterMaker/blocks/FooterBlock.tsx`
- `src/components/admin/PosterMaker/blocks/index.ts`
- `src/components/admin/PosterMaker/templates/conversion.tsx`
- `src/components/admin/PosterMaker/templates/edu-reminder.tsx`
- `src/components/admin/PosterMaker/templates/aspiration.tsx`
- `src/components/admin/PosterMaker/templates/social-proof.tsx`
- `src/components/admin/PosterMaker/templates/index.ts`
- `src/components/admin/PosterMaker/exportPoster.ts`
- `src/components/admin/PosterMaker/FieldForm.tsx`
- `src/components/admin/PosterMaker/LivePreview.tsx`
- `src/components/admin/PosterMaker/BlockBuilder.tsx`
- `src/components/admin/PosterMaker/PosterEditor.tsx`
- `supabase/migrations/20260525_poster_maker_v2.sql`

**Rewrite:**
- `src/components/admin/PosterMaker/DraftPanel.tsx`
- `src/components/admin/PosterMaker/TemplateSelector.tsx`
- `src/components/admin/PosterMaker/AssetPanel.tsx` — remove `Canvas` dependency
- `src/services/posterTemplates.ts`
- `services/posterAutofillService.ts`
- `supabase/functions/ai-poster-autofill/index.ts`
- `src/pages/admin/PosterMaker.tsx`

**Delete** (after new code builds):
- `src/components/admin/PosterMaker/FabricCanvas.tsx`
- `src/components/admin/PosterMaker/LayerPanel.tsx`
- `src/components/admin/PosterMaker/PropertiesPanel.tsx`
- `src/components/admin/PosterMaker/CanvasContextMenu.tsx`
- `src/components/admin/PosterMaker/CanvasZoom.tsx`
- `src/components/admin/PosterMaker/EditorToolbar.tsx`
- `src/components/admin/PosterMaker/PosterCanvas.tsx`
- `src/components/admin/PosterMaker/TemplatePanel.tsx`
- `src/components/admin/PosterMaker/fabricSnap.ts`
- `src/components/admin/PosterMaker/fabricShadow.ts`
- `src/components/admin/PosterMaker/fabricCornerRadius.ts`
- `src/components/admin/PosterMaker/templateThumbnail.ts`
- `src/components/admin/PosterMaker/blocks/PosterHeader.tsx`
- `src/components/admin/PosterMaker/blocks/PosterFooter.tsx`
- `src/components/admin/PosterMaker/blocks/PosterDetails.tsx`
- `src/components/admin/PosterMaker/blocks/PosterImageBlock.tsx`
- `src/components/admin/PosterMaker/blocks/PosterPromo.tsx`

---

## Task 1: Shared Types

**Files:**
- Create: `src/components/admin/PosterMaker/types.ts`

- [ ] **Step 1: Create types.ts**

```typescript
// src/components/admin/PosterMaker/types.ts

export type AspectRatio = 'post' | 'story';
export type TemplateCategory = 'conversion' | 'edu-reminder' | 'aspiration' | 'social-proof' | 'blank';
export type FieldType = 'text' | 'textarea' | 'image' | 'color';

export interface FieldSchema {
  id: string;
  label: string;
  type: FieldType;
  maxLength?: number;
  placeholder?: string;
}

export type FieldValues = Record<string, string>;

export interface PosterTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  aspectRatio: AspectRatio;
  previewColors: [string, string, string];
  fields: FieldSchema[];
  Component: React.FC<FieldValues>;
}

export type BlockType =
  | 'HeaderBlock'
  | 'HeroImageBlock'
  | 'TextBlock'
  | 'DetailsGrid'
  | 'TestimonialBlock'
  | 'PromoBlock'
  | 'FooterBlock';

export interface BlockConfig {
  type: BlockType;
  config: {
    padding?: 'sm' | 'md' | 'lg';
    background?: string;
    fontSize?: 'sm' | 'md' | 'lg';
    imageFit?: 'cover' | 'contain';
    textAlign?: 'left' | 'center' | 'right';
  };
}

export interface SavedTemplate {
  id: string;
  name: string;
  description: string;
  aspect_ratio: AspectRatio;
  template_type: string;
  blocks: BlockConfig[] | null;
  field_schema: FieldSchema[] | null;
  canvas_json: object | null;
  thumbnail_data_url?: string;
  thumbnail_url?: string;
  starter_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PosterDraft {
  id: string;
  name: string;
  templateId: string;
  aspectRatio: AspectRatio;
  fieldValues: FieldValues;
  thumbnail: string;
  createdAt: number;
}
```

- [ ] **Step 2: Check TypeScript compiles**

```bash
cd /path/to/project && npx tsc --noEmit
```

Expected: no errors (file has no imports yet).

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/PosterMaker/types.ts
git commit -m "feat: add poster maker v2 shared types"
```

---

## Task 2: Block Components

Block components render within poster templates. Each uses **inline styles only** (no Tailwind classes) so `html-to-image` captures them correctly. All assume a 1080px-wide parent container.

**Files:**
- Create: `src/components/admin/PosterMaker/blocks/HeaderBlock.tsx`
- Create: `src/components/admin/PosterMaker/blocks/HeroImageBlock.tsx`
- Create: `src/components/admin/PosterMaker/blocks/TextBlock.tsx`
- Create: `src/components/admin/PosterMaker/blocks/DetailsGrid.tsx`
- Create: `src/components/admin/PosterMaker/blocks/TestimonialBlock.tsx`
- Create: `src/components/admin/PosterMaker/blocks/PromoBlock.tsx`
- Create: `src/components/admin/PosterMaker/blocks/FooterBlock.tsx`
- Create: `src/components/admin/PosterMaker/blocks/index.ts`

- [ ] **Step 1: Create HeaderBlock.tsx**

```tsx
// src/components/admin/PosterMaker/blocks/HeaderBlock.tsx
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
```

- [ ] **Step 2: Create HeroImageBlock.tsx**

```tsx
// src/components/admin/PosterMaker/blocks/HeroImageBlock.tsx
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
```

- [ ] **Step 3: Create TextBlock.tsx**

```tsx
// src/components/admin/PosterMaker/blocks/TextBlock.tsx
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
```

- [ ] **Step 4: Create DetailsGrid.tsx**

```tsx
// src/components/admin/PosterMaker/blocks/DetailsGrid.tsx
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
```

- [ ] **Step 5: Create TestimonialBlock.tsx**

```tsx
// src/components/admin/PosterMaker/blocks/TestimonialBlock.tsx
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
```

- [ ] **Step 6: Create PromoBlock.tsx**

```tsx
// src/components/admin/PosterMaker/blocks/PromoBlock.tsx
import React from 'react';
import { FieldValues, BlockConfig } from '../types';

interface Props { fields: FieldValues; config: BlockConfig['config'] }

const PAD = { sm: 24, md: 40, lg: 56 };

export const PromoBlock: React.FC<Props> = ({ fields, config }) => {
  const p = PAD[config.padding ?? 'md'];
  const bg = config.background ?? '#0084FF';
  return (
    <div style={{
      width: '100%', padding: `${p}px 48px`, background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div>
        <div style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: 'rgba(255,255,255,0.7)', fontSize: 22, fontWeight: 600, marginBottom: 4 }}>
          Mulai dari
        </div>
        <div style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#FFFFFF', fontSize: 64, fontWeight: 800, lineHeight: 1 }}>
          {fields.promo_price || 'Hubungi Kami'}
        </div>
      </div>
      {fields.cta_text && (
        <div style={{
          background: '#FFFFFF', color: '#0084FF', fontSize: 28, fontWeight: 800,
          padding: '16px 40px', borderRadius: 12,
          fontFamily: '"Plus Jakarta Sans", sans-serif',
        }}>
          {fields.cta_text}
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 7: Create FooterBlock.tsx**

```tsx
// src/components/admin/PosterMaker/blocks/FooterBlock.tsx
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
```

- [ ] **Step 8: Create blocks/index.ts**

```typescript
// src/components/admin/PosterMaker/blocks/index.ts
export { HeaderBlock } from './HeaderBlock';
export { HeroImageBlock } from './HeroImageBlock';
export { TextBlock } from './TextBlock';
export { DetailsGrid } from './DetailsGrid';
export { TestimonialBlock } from './TestimonialBlock';
export { PromoBlock } from './PromoBlock';
export { FooterBlock } from './FooterBlock';
```

- [ ] **Step 9: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 10: Commit**

```bash
git add src/components/admin/PosterMaker/blocks/
git commit -m "feat: add poster maker block components"
```

---

## Task 3: Template Components

Four poster templates as React components + field schemas. Each renders at 1080px wide with inline styles.

**Files:**
- Create: `src/components/admin/PosterMaker/templates/conversion.tsx`
- Create: `src/components/admin/PosterMaker/templates/edu-reminder.tsx`
- Create: `src/components/admin/PosterMaker/templates/aspiration.tsx`
- Create: `src/components/admin/PosterMaker/templates/social-proof.tsx`
- Create: `src/components/admin/PosterMaker/templates/index.ts`

- [ ] **Step 1: Create conversion.tsx**

```tsx
// src/components/admin/PosterMaker/templates/conversion.tsx
import React from 'react';
import { PosterTemplate, FieldValues } from '../types';

const ConversionPoster: React.FC<FieldValues> = (f) => {
  const accent = f.accent_color || '#0084FF';
  const features = [f.feature_1, f.feature_2, f.feature_3, f.feature_4].filter(Boolean);

  return (
    <div style={{ width: 1080, height: 1350, position: 'relative', overflow: 'hidden', background: '#0F172A', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
      {/* Hero image */}
      {f.hero_image && (
        <img src={f.hero_image} alt="" crossOrigin="anonymous" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '65%', objectFit: 'cover', opacity: 0.45 }} />
      )}
      {/* Gradient */}
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, ${accent}22 0%, #0F172A 58%)` }} />

      {/* Brand header */}
      <div style={{ position: 'absolute', top: 48, left: 48, right: 48, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 }}>
        <div style={{ color: '#FFFFFF', fontSize: 28, fontWeight: 800 }}>Alfatih Dunia Wisata</div>
        {f.badge_text && (
          <div style={{ background: accent, color: '#FFFFFF', fontSize: 22, fontWeight: 700, padding: '8px 24px', borderRadius: 99 }}>{f.badge_text}</div>
        )}
      </div>

      {/* Content area */}
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
```

- [ ] **Step 2: Create edu-reminder.tsx**

```tsx
// src/components/admin/PosterMaker/templates/edu-reminder.tsx
import React from 'react';
import { PosterTemplate, FieldValues } from '../types';

const EduReminderPoster: React.FC<FieldValues> = (f) => {
  const items = [1,2,3,4,5].map(n => ({ title: f[`item_${n}_title`], desc: f[`item_${n}_desc`] })).filter(i => i.title);

  return (
    <div style={{ width: 1080, height: 1350, background: '#F8FAFC', fontFamily: '"Plus Jakarta Sans", sans-serif', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: '#0084FF', padding: '48px 48px 40px', flexShrink: 0 }}>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Alfatih Dunia Wisata</div>
        <div style={{ color: '#FFFFFF', fontSize: 60, fontWeight: 800, lineHeight: 1.15 }}>
          {f.headline || 'Tips Umroh untuk Anda'}
        </div>
        {f.intro && (
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 26, fontWeight: 500, marginTop: 16 }}>{f.intro}</div>
        )}
      </div>

      {/* Items */}
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

      {/* Footer */}
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
    { id: 'headline',     type: 'text', label: 'Judul Poster',    placeholder: '5 Barang Wajib Dibawa Saat Umroh' },
    { id: 'intro',        type: 'text', label: 'Kalimat Pengantar', placeholder: 'Persiapkan diri Anda dengan baik' },
    { id: 'item_1_title', type: 'text', label: 'Item 1 — Judul',   placeholder: 'Ihram & Perlengkapan Sholat' },
    { id: 'item_1_desc',  type: 'text', label: 'Item 1 — Deskripsi', placeholder: 'Bawa minimal 2 set kain ihram' },
    { id: 'item_2_title', type: 'text', label: 'Item 2 — Judul',   placeholder: 'Obat-obatan Pribadi' },
    { id: 'item_2_desc',  type: 'text', label: 'Item 2 — Deskripsi', placeholder: 'Siapkan obat rutin dan vitamin' },
    { id: 'item_3_title', type: 'text', label: 'Item 3 — Judul',   placeholder: 'Dokumen Perjalanan' },
    { id: 'item_3_desc',  type: 'text', label: 'Item 3 — Deskripsi', placeholder: 'Paspor, visa, dan buku kesehatan' },
    { id: 'item_4_title', type: 'text', label: 'Item 4 — Judul',   placeholder: 'Al-Quran & Buku Doa' },
    { id: 'item_4_desc',  type: 'text', label: 'Item 4 — Deskripsi', placeholder: 'Untuk ibadah optimal di tanah suci' },
    { id: 'item_5_title', type: 'text', label: 'Item 5 — Judul',   placeholder: 'Pakaian Syar\'i' },
    { id: 'item_5_desc',  type: 'text', label: 'Item 5 — Deskripsi', placeholder: 'Minimal 7 stel pakaian longgar' },
  ],
  Component: EduReminderPoster,
};
```

- [ ] **Step 3: Create aspiration.tsx**

```tsx
// src/components/admin/PosterMaker/templates/aspiration.tsx
import React from 'react';
import { PosterTemplate, FieldValues } from '../types';

const AspirationPoster: React.FC<FieldValues> = (f) => (
  <div style={{ width: 1080, height: 1920, position: 'relative', overflow: 'hidden', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
    {/* Background */}
    {f.hero_image ? (
      <img src={f.hero_image} alt="" crossOrigin="anonymous" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
    ) : (
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #0F172A 100%)' }} />
    )}
    {/* Dark overlay */}
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(15,23,42,0.5) 0%, rgba(15,23,42,0.85) 100%)' }} />

    {/* Brand top */}
    <div style={{ position: 'absolute', top: 64, left: 0, right: 0, textAlign: 'center', zIndex: 1 }}>
      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 28, fontWeight: 600, letterSpacing: 4, textTransform: 'uppercase' }}>
        Alfatih Dunia Wisata
      </div>
    </div>

    {/* Center quote */}
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 80px', textAlign: 'center', zIndex: 1 }}>
      <div style={{ color: '#F59E0B', fontSize: 80, lineHeight: 0.8, marginBottom: 24 }}>"</div>
      <div style={{ fontFamily: '"Cormorant Garamond", serif', color: '#FFFFFF', fontSize: 60, fontWeight: 600, fontStyle: 'italic', lineHeight: 1.4, marginBottom: 40 }}>
        {f.tagline || 'Melangkah ke Tanah Suci, Mewujudkan Impian Mulia'}
      </div>
      {f.sub_tagline && (
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 28, fontWeight: 500 }}>{f.sub_tagline}</div>
      )}
    </div>

    {/* Pillars */}
    <div style={{ position: 'absolute', bottom: 200, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 48, zIndex: 1 }}>
      {['Islami', 'Amanah', 'Premium'].map(p => (
        <div key={p} style={{ textAlign: 'center' }}>
          <div style={{ color: '#F59E0B', fontSize: 22, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>{p}</div>
        </div>
      ))}
    </div>

    {/* Footer */}
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
    { id: 'tagline',     type: 'textarea', label: 'Tagline Utama',    placeholder: 'Melangkah ke Tanah Suci, Mewujudkan Impian Mulia' },
    { id: 'sub_tagline', type: 'text',     label: 'Sub-tagline',      placeholder: 'Bergabunglah bersama kami dalam perjalanan suci' },
    { id: 'hero_image',  type: 'image',    label: 'Foto Latar' },
  ],
  Component: AspirationPoster,
};
```

- [ ] **Step 4: Create social-proof.tsx**

```tsx
// src/components/admin/PosterMaker/templates/social-proof.tsx
import React from 'react';
import { PosterTemplate, FieldValues } from '../types';

const SocialProofPoster: React.FC<FieldValues> = (f) => (
  <div style={{ width: 1080, height: 1350, background: '#0F172A', fontFamily: '"Plus Jakarta Sans", sans-serif', display: 'flex', flexDirection: 'column' }}>
    {/* Header */}
    <div style={{ padding: '48px 48px 32px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Alfatih Dunia Wisata</div>
      <div style={{ color: '#0084FF', fontSize: 28, fontWeight: 700 }}>Kata Mereka yang Telah Bersama Kami</div>
    </div>

    {/* Stats */}
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

    {/* Testimonial */}
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

    {/* Footer */}
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
```

- [ ] **Step 5: Create templates/index.ts**

```typescript
// src/components/admin/PosterMaker/templates/index.ts
import { conversionTemplate } from './conversion';
import { eduReminderTemplate } from './edu-reminder';
import { aspirationTemplate } from './aspiration';
import { socialProofTemplate } from './social-proof';

export { conversionTemplate, eduReminderTemplate, aspirationTemplate, socialProofTemplate };

export const CODE_TEMPLATES = [
  conversionTemplate,
  eduReminderTemplate,
  aspirationTemplate,
  socialProofTemplate,
];
```

- [ ] **Step 6: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 7: Commit**

```bash
git add src/components/admin/PosterMaker/templates/
git commit -m "feat: add poster template React components"
```

---

## Task 4: Export Utility

**Files:**
- Create: `src/components/admin/PosterMaker/exportPoster.ts`

- [ ] **Step 1: Create exportPoster.ts**

```typescript
// src/components/admin/PosterMaker/exportPoster.ts
import React from 'react';
import ReactDOM from 'react-dom/client';
import { toPng } from 'html-to-image';
import { PosterTemplate, FieldValues, AspectRatio } from './types';

const DIMS: Record<AspectRatio, { w: number; h: number }> = {
  post:  { w: 1080, h: 1350 },
  story: { w: 1080, h: 1920 },
};

export const exportPosterPng = async (
  template: PosterTemplate,
  fieldValues: FieldValues,
  pixelRatio: 2 | 4 = 2,
): Promise<void> => {
  const { w, h } = DIMS[template.aspectRatio];

  const container = document.createElement('div');
  container.style.cssText = `position:fixed;left:-${w * 2}px;top:0;width:${w}px;height:${h}px;overflow:hidden;`;
  document.body.appendChild(container);

  const root = ReactDOM.createRoot(container);
  root.render(React.createElement(template.Component, fieldValues));

  await document.fonts.ready;
  // Let React finish painting
  await new Promise<void>(r => setTimeout(r, 150));

  try {
    const dataUrl = await toPng(container, { pixelRatio, width: w, height: h });
    const a = document.createElement('a');
    a.download = `alfatih-poster-${template.aspectRatio}-${Date.now()}.png`;
    a.href = dataUrl;
    a.click();
  } finally {
    root.unmount();
    document.body.removeChild(container);
  }
};

export const generateThumbnailDataUrl = async (
  template: PosterTemplate,
  fieldValues: FieldValues,
): Promise<string> => {
  const { w, h } = DIMS[template.aspectRatio];

  const container = document.createElement('div');
  container.style.cssText = `position:fixed;left:-${w * 2}px;top:0;width:${w}px;height:${h}px;overflow:hidden;`;
  document.body.appendChild(container);

  const root = ReactDOM.createRoot(container);
  root.render(React.createElement(template.Component, fieldValues));

  await document.fonts.ready;
  await new Promise<void>(r => setTimeout(r, 150));

  try {
    return await toPng(container, { pixelRatio: 0.2, width: w, height: h });
  } finally {
    root.unmount();
    document.body.removeChild(container);
  }
};
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/PosterMaker/exportPoster.ts
git commit -m "feat: add html-to-image based poster export utility"
```

---

## Task 5: FieldForm + LivePreview

**Files:**
- Create: `src/components/admin/PosterMaker/FieldForm.tsx`
- Create: `src/components/admin/PosterMaker/LivePreview.tsx`

- [ ] **Step 1: Create FieldForm.tsx**

```tsx
// src/components/admin/PosterMaker/FieldForm.tsx
import React from 'react';
import { FieldSchema, FieldValues, PosterTemplate } from './types';

interface Props {
  template: PosterTemplate;
  values: FieldValues;
  onChange: (id: string, value: string) => void;
  onPickImage: (fieldId: string) => void;
}

const BRAND_COLORS = ['#0084FF','#0066CC','#F59E0B','#0F172A','#FFFFFF','#22C55E','#EF4444','#8B5CF6'];

export const FieldForm: React.FC<Props> = ({ template, values, onChange, onPickImage }) => (
  <div className="space-y-4">
    {template.fields.map((field: FieldSchema) => (
      <div key={field.id}>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
          {field.label}
        </label>
        {field.type === 'text' && (
          <input
            type="text"
            value={values[field.id] ?? ''}
            onChange={e => onChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            maxLength={field.maxLength}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
        )}
        {field.type === 'textarea' && (
          <textarea
            value={values[field.id] ?? ''}
            onChange={e => onChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            rows={3}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
          />
        )}
        {field.type === 'image' && (
          <div className="space-y-2">
            {values[field.id] && (
              <img src={values[field.id]} alt="preview" className="w-full h-24 object-cover rounded-lg border border-gray-200" />
            )}
            <div className="flex gap-2">
              <button
                onClick={() => onPickImage(field.id)}
                className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 text-gray-600 hover:border-primary hover:text-primary transition text-center"
              >
                {values[field.id] ? 'Ganti Foto' : 'Pilih Foto'}
              </button>
              {values[field.id] && (
                <button
                  onClick={() => onChange(field.id, '')}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-2 text-red-400 hover:border-red-400 transition"
                >
                  Hapus
                </button>
              )}
            </div>
          </div>
        )}
        {field.type === 'color' && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {BRAND_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => onChange(field.id, c)}
                  style={{ background: c }}
                  className={`w-8 h-8 rounded-full border-2 transition ${values[field.id] === c ? 'border-primary scale-110' : 'border-gray-200'}`}
                  title={c}
                />
              ))}
            </div>
            <input
              type="color"
              value={values[field.id] || '#0084FF'}
              onChange={e => onChange(field.id, e.target.value)}
              className="w-full h-8 rounded cursor-pointer border border-gray-200"
            />
          </div>
        )}
      </div>
    ))}
  </div>
);
```

- [ ] **Step 2: Create LivePreview.tsx**

```tsx
// src/components/admin/PosterMaker/LivePreview.tsx
import React, { useRef, useEffect, useState } from 'react';
import { PosterTemplate, FieldValues, AspectRatio } from './types';

const DIMS: Record<AspectRatio, { w: number; h: number }> = {
  post:  { w: 1080, h: 1350 },
  story: { w: 1080, h: 1920 },
};

interface Props {
  template: PosterTemplate;
  fieldValues: FieldValues;
}

export const LivePreview: React.FC<Props> = ({ template, fieldValues }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);
  const { w, h } = DIMS[template.aspectRatio];

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / w);
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [w]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: h * scale, overflow: 'hidden', borderRadius: 12 }}>
      <div style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <template.Component {...fieldValues} />
      </div>
    </div>
  );
};
```

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/PosterMaker/FieldForm.tsx src/components/admin/PosterMaker/LivePreview.tsx
git commit -m "feat: add FieldForm and LivePreview components"
```

---

## Task 6: DraftPanel (rewritten)

Drafts stored in `localStorage` as `PosterDraft[]` (fieldValues + templateId, not Fabric.js JSON).

**Files:**
- Rewrite: `src/components/admin/PosterMaker/DraftPanel.tsx`

- [ ] **Step 1: Rewrite DraftPanel.tsx**

```tsx
// src/components/admin/PosterMaker/DraftPanel.tsx
import React, { useState, useEffect } from 'react';
import { Trash2, Save } from 'lucide-react';
import { PosterDraft, PosterTemplate, FieldValues } from './types';
import { generateThumbnailDataUrl } from './exportPoster';

const STORAGE_KEY = 'alfatih_poster_drafts_v2';

interface Props {
  template: PosterTemplate;
  fieldValues: FieldValues;
  onLoadDraft: (templateId: string, fieldValues: FieldValues) => void;
}

export const DraftPanel: React.FC<Props> = ({ template, fieldValues, onLoadDraft }) => {
  const [drafts, setDrafts] = useState<PosterDraft[]>([]);
  const [draftName, setDraftName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setDrafts(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const persist = (d: PosterDraft[]) => {
    setDrafts(d);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const thumbnail = await generateThumbnailDataUrl(template, fieldValues);
      const draft: PosterDraft = {
        id: Date.now().toString(),
        name: draftName.trim() || `Draft ${new Date().toLocaleString('id-ID')}`,
        templateId: template.id,
        aspectRatio: template.aspectRatio,
        fieldValues,
        thumbnail,
        createdAt: Date.now(),
      };
      persist([draft, ...drafts]);
      setDraftName('');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Hapus draft ini?')) persist(drafts.filter(d => d.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={draftName}
          onChange={e => setDraftName(e.target.value)}
          placeholder="Nama Draft"
          className="flex-1 text-xs border border-gray-300 rounded focus:ring-primary focus:border-primary"
        />
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-1 bg-primary text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-blue-600 transition disabled:opacity-50"
        >
          <Save className="w-3 h-3" />
          {isSaving ? '...' : 'Simpan'}
        </button>
      </div>

      {drafts.length === 0 ? (
        <div className="text-center py-8 text-sm text-gray-400 bg-gray-50 rounded border border-dashed border-gray-200">
          Belum ada draft tersimpan.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {drafts.map(draft => (
            <div
              key={draft.id}
              onClick={() => onLoadDraft(draft.templateId, draft.fieldValues)}
              className="group relative bg-gray-50 rounded-lg border border-gray-200 overflow-hidden cursor-pointer hover:border-primary transition"
            >
              {draft.thumbnail && (
                <img src={draft.thumbnail} alt={draft.name} className="w-full h-auto object-cover" />
              )}
              <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2">
                <p className="text-[10px] text-white font-medium truncate">{draft.name}</p>
                <p className="text-[8px] text-gray-300">{new Date(draft.createdAt).toLocaleDateString('id-ID')}</p>
              </div>
              <button
                onClick={(e) => handleDelete(draft.id, e)}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition shadow"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DraftPanel;
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/PosterMaker/DraftPanel.tsx
git commit -m "feat: rewrite DraftPanel for field-values based drafts"
```

---

## Task 7: Database Migration

**Files:**
- Create: `supabase/migrations/20260525_poster_maker_v2.sql`

- [ ] **Step 1: Create migration file**

```sql
-- supabase/migrations/20260525_poster_maker_v2.sql

-- Make canvas_json nullable (old Fabric.js data is archived, new block-based templates have NULL here)
ALTER TABLE public.poster_templates
  ALTER COLUMN canvas_json DROP NOT NULL;

-- Add columns for block-based templates
ALTER TABLE public.poster_templates
  ADD COLUMN IF NOT EXISTS blocks JSONB,
  ADD COLUMN IF NOT EXISTS field_schema JSONB,
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS starter_id TEXT;
```

- [ ] **Step 2: Apply migration**

```bash
supabase db push
```

Expected: migration applies without error.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260525_poster_maker_v2.sql
git commit -m "feat: migrate poster_templates table for block-based editor"
```

---

## Task 8: posterTemplates Service (rewrite)

**Files:**
- Rewrite: `src/services/posterTemplates.ts`

- [ ] **Step 1: Rewrite posterTemplates.ts**

```typescript
// src/services/posterTemplates.ts
import { supabase } from '../lib/supabase';
import { SavedTemplate, BlockConfig, FieldSchema, AspectRatio } from '../components/admin/PosterMaker/types';

export type { SavedTemplate };

export type SavedTemplateInsert = {
  name: string;
  description: string;
  aspect_ratio: AspectRatio;
  template_type: string;
  blocks: BlockConfig[];
  field_schema: FieldSchema[];
  thumbnail_data_url?: string;
  canvas_json?: null;
};

export const fetchTemplates = async (): Promise<SavedTemplate[]> => {
  const { data, error } = await supabase
    .from('poster_templates')
    .select('*')
    .not('blocks', 'is', null)
    .order('created_at', { ascending: false });
  if (error) { console.error('fetchTemplates:', error); return []; }
  return data ?? [];
};

export const fetchTemplate = async (id: string): Promise<SavedTemplate | null> => {
  const { data, error } = await supabase
    .from('poster_templates')
    .select('*')
    .eq('id', id)
    .single();
  if (error) { console.error('fetchTemplate:', error); return null; }
  return data;
};

export const saveTemplate = async (payload: SavedTemplateInsert): Promise<SavedTemplate | null> => {
  const { data, error } = await supabase
    .from('poster_templates')
    .insert({ ...payload, canvas_json: null })
    .select()
    .single();
  if (error) { console.error('saveTemplate:', error); return null; }
  return data;
};

export const updateTemplate = async (id: string, payload: Partial<SavedTemplateInsert>): Promise<boolean> => {
  const { error } = await supabase
    .from('poster_templates')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) { console.error('updateTemplate:', error); return false; }
  return true;
};

export const deleteTemplate = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from('poster_templates').delete().eq('id', id);
  if (error) { console.error('deleteTemplate:', error); return false; }
  return true;
};
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/services/posterTemplates.ts
git commit -m "feat: rewrite posterTemplates service for block-based schema"
```

---

## Task 9: TemplateSelector

Merges code-defined templates and Supabase block-based templates. Builds `PosterTemplate` (with a `Component`) from saved `blocks` at runtime.

**Files:**
- Rewrite: `src/components/admin/PosterMaker/TemplateSelector.tsx`

- [ ] **Step 1: Rewrite TemplateSelector.tsx**

```tsx
// src/components/admin/PosterMaker/TemplateSelector.tsx
import React, { useEffect, useState } from 'react';
import { LayoutTemplate, Plus } from 'lucide-react';
import { PosterTemplate, FieldValues, SavedTemplate, BlockConfig } from './types';
import { CODE_TEMPLATES } from './templates';
import { fetchTemplates } from '../../services/posterTemplates';
import {
  HeaderBlock, HeroImageBlock, TextBlock, DetailsGrid,
  TestimonialBlock, PromoBlock, FooterBlock,
} from './blocks';

const BlockMap: Record<string, React.FC<{ fields: FieldValues; config: BlockConfig['config'] }>> = {
  HeaderBlock, HeroImageBlock, TextBlock, DetailsGrid,
  TestimonialBlock, PromoBlock, FooterBlock,
};

const BLOCK_FIELDS: Record<string, string[]> = {
  HeaderBlock:      ['brand_name', 'tagline'],
  HeroImageBlock:   ['hero_image'],
  TextBlock:        ['headline', 'body_text'],
  DetailsGrid:      ['detail_1','detail_2','detail_3','detail_4','detail_5','detail_6'],
  TestimonialBlock: ['quote', 'author_name', 'batch'],
  PromoBlock:       ['promo_price', 'cta_text'],
  FooterBlock:      ['social_handle', 'contact', 'ppiu_number'],
};

const buildComponent = (blocks: BlockConfig[]): React.FC<FieldValues> => {
  const BlocksComponent: React.FC<FieldValues> = (fields) => (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      {blocks.map((block, i) => {
        const Block = BlockMap[block.type];
        return Block ? <Block key={i} fields={fields} config={block.config} /> : null;
      })}
    </div>
  );
  return BlocksComponent;
};

const savedToTemplate = (t: SavedTemplate): PosterTemplate => ({
  id: t.id,
  name: t.name,
  description: t.description,
  category: 'blank',
  aspectRatio: t.aspect_ratio,
  previewColors: ['#94A3B8', '#F8FAFC', '#0F172A'],
  fields: t.field_schema ?? (t.blocks ?? []).flatMap(b =>
    (BLOCK_FIELDS[b.type] ?? []).map(fid => ({ id: fid, label: fid, type: 'text' as const }))
  ),
  Component: buildComponent(t.blocks ?? []),
});

interface Props {
  onSelect: (template: PosterTemplate) => void;
  onNewTemplate: () => void;
}

export const TemplateSelector: React.FC<Props> = ({ onSelect, onNewTemplate }) => {
  const [savedTemplates, setSavedTemplates] = useState<PosterTemplate[]>([]);

  useEffect(() => {
    fetchTemplates().then(rows => setSavedTemplates(rows.map(savedToTemplate)));
  }, []);

  const all = [...savedTemplates, ...CODE_TEMPLATES];
  const post = all.filter(t => t.aspectRatio === 'post');
  const story = all.filter(t => t.aspectRatio === 'story');

  const renderGroup = (title: string, subtitle: string, templates: PosterTemplate[]) => (
    <div className="mb-6">
      <div className="mb-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{title}</p>
        <p className="text-[9px] text-gray-300 mt-0.5">{subtitle}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {templates.map(t => (
          <button
            key={t.id}
            onClick={() => onSelect(t)}
            className="text-left rounded-lg border border-gray-200 hover:border-primary hover:shadow-md transition-all overflow-hidden bg-white"
          >
            <div className="p-2">
              <div
                className={`w-full rounded overflow-hidden ${t.aspectRatio === 'story' ? 'aspect-[9/16]' : 'aspect-[4/5]'}`}
                style={{ background: `linear-gradient(135deg, ${t.previewColors[0]}, ${t.previewColors[1]})` }}
              />
            </div>
            <div className="px-2 pb-2">
              <div className="text-[10px] font-bold text-gray-700 group-hover:text-primary leading-tight">{t.name}</div>
              <div className="text-[9px] text-gray-400 mt-0.5 line-clamp-1">{t.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-800">Pilih Template</h3>
        </div>
        <button
          onClick={onNewTemplate}
          className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
        >
          <Plus className="w-3 h-3" /> Buat Baru
        </button>
      </div>
      {renderGroup('Post (4:5)', '1080 × 1350 px', post)}
      {renderGroup('Story (9:16)', '1080 × 1920 px', story)}
    </div>
  );
};

export default TemplateSelector;
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/PosterMaker/TemplateSelector.tsx
git commit -m "feat: rewrite TemplateSelector with merged code+DB templates"
```

---

## Task 10: BlockBuilder

Full-screen modal for creating new templates from blocks.

**Files:**
- Create: `src/components/admin/PosterMaker/BlockBuilder.tsx`

- [ ] **Step 1: Create BlockBuilder.tsx**

```tsx
// src/components/admin/PosterMaker/BlockBuilder.tsx
import React, { useState } from 'react';
import { X, Plus, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { BlockConfig, BlockType, FieldSchema, AspectRatio } from './types';
import { saveTemplate } from '../../services/posterTemplates';

const BLOCK_DEFS: { type: BlockType; label: string; description: string }[] = [
  { type: 'HeaderBlock',      label: 'Header',       description: 'Logo + nama brand' },
  { type: 'HeroImageBlock',   label: 'Foto Utama',   description: 'Foto full-width' },
  { type: 'TextBlock',        label: 'Teks',         description: 'Judul + paragraf' },
  { type: 'DetailsGrid',      label: 'Grid Detail',  description: 'Ikon + label (max 6)' },
  { type: 'TestimonialBlock', label: 'Testimoni',    description: 'Kutipan + nama' },
  { type: 'PromoBlock',       label: 'Promo',        description: 'Harga + tombol CTA' },
  { type: 'FooterBlock',      label: 'Footer',       description: 'Sosial + kontak' },
];

const BLOCK_FIELDS_MAP: Record<BlockType, string[]> = {
  HeaderBlock:      ['brand_name', 'tagline'],
  HeroImageBlock:   ['hero_image'],
  TextBlock:        ['headline', 'body_text'],
  DetailsGrid:      ['detail_1','detail_2','detail_3','detail_4','detail_5','detail_6'],
  TestimonialBlock: ['quote', 'author_name', 'batch'],
  PromoBlock:       ['promo_price', 'cta_text'],
  FooterBlock:      ['social_handle', 'contact', 'ppiu_number'],
};

const FIELD_TYPE_MAP: Record<string, 'text' | 'image' | 'textarea'> = {
  hero_image: 'image',
  tagline:    'textarea',
  quote:      'textarea',
};

const deriveFieldSchema = (blocks: BlockConfig[]): FieldSchema[] => {
  const seen = new Set<string>();
  return blocks.flatMap(b =>
    (BLOCK_FIELDS_MAP[b.type] ?? [])
      .filter(id => !seen.has(id) && seen.add(id))
      .map(id => ({
        id,
        label: id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        type: (FIELD_TYPE_MAP[id] ?? 'text') as 'text' | 'image' | 'textarea',
      }))
  );
};

const defaultConfig = (): BlockConfig['config'] => ({ padding: 'md', fontSize: 'md', textAlign: 'left' });

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

export const BlockBuilder: React.FC<Props> = ({ onClose, onSaved }) => {
  const [name, setName] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('post');
  const [blocks, setBlocks] = useState<BlockConfig[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const addBlock = (type: BlockType) => {
    const already = blocks.some(b => b.type === type);
    if (already) { alert(`Block "${type}" sudah ditambahkan.`); return; }
    setBlocks(prev => [...prev, { type, config: defaultConfig() }]);
    setSelected(blocks.length);
  };

  const removeBlock = (i: number) => {
    setBlocks(prev => prev.filter((_, idx) => idx !== i));
    setSelected(null);
  };

  const moveUp = (i: number) => {
    if (i === 0) return;
    setBlocks(prev => { const a = [...prev]; [a[i-1], a[i]] = [a[i], a[i-1]]; return a; });
    setSelected(i - 1);
  };

  const moveDown = (i: number) => {
    if (i === blocks.length - 1) return;
    setBlocks(prev => { const a = [...prev]; [a[i], a[i+1]] = [a[i+1], a[i]]; return a; });
    setSelected(i + 1);
  };

  const updateConfig = (key: keyof BlockConfig['config'], value: string) => {
    if (selected === null) return;
    setBlocks(prev => prev.map((b, i) => i === selected ? { ...b, config: { ...b.config, [key]: value } } : b));
  };

  const handleSave = async () => {
    if (!name.trim() || blocks.length === 0) return;
    setIsSaving(true);
    try {
      const field_schema = deriveFieldSchema(blocks);
      const result = await saveTemplate({
        name: name.trim(),
        description: '',
        aspect_ratio: aspectRatio,
        template_type: 'custom',
        blocks,
        field_schema,
      });
      if (result) { onSaved(); onClose(); }
      else alert('Gagal menyimpan template.');
    } finally {
      setIsSaving(false);
    }
  };

  const selBlock = selected !== null ? blocks[selected] : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-stretch">
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-base font-bold text-gray-900">Buat Template Baru</h2>
            <p className="text-xs text-gray-500">Susun blok untuk membuat layout poster</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nama template..."
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none w-56"
            />
            <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm font-semibold">
              {(['post', 'story'] as AspectRatio[]).map(ar => (
                <button key={ar} onClick={() => setAspectRatio(ar)}
                  className={`px-4 py-2 transition ${aspectRatio === ar ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                  {ar === 'post' ? 'Post' : 'Story'}
                </button>
              ))}
            </div>
            <button onClick={handleSave} disabled={!name.trim() || blocks.length === 0 || isSaving}
              className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-blue-600 transition disabled:opacity-40">
              {isSaving ? 'Menyimpan...' : 'Simpan Template'}
            </button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Block palette */}
          <div className="w-56 border-r border-gray-200 p-4 overflow-y-auto flex-shrink-0">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Tambah Blok</p>
            <div className="space-y-2">
              {BLOCK_DEFS.map(b => (
                <button key={b.type} onClick={() => addBlock(b.type)}
                  disabled={blocks.some(x => x.type === b.type)}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-primary hover:bg-blue-50 transition disabled:opacity-40 disabled:cursor-not-allowed">
                  <div className="text-sm font-semibold text-gray-800">{b.label}</div>
                  <div className="text-xs text-gray-400">{b.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Block canvas */}
          <div className="flex-1 p-6 overflow-y-auto">
            {blocks.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
                Tambahkan blok dari panel kiri untuk mulai membangun template
              </div>
            ) : (
              <div className="max-w-xl mx-auto space-y-2">
                {blocks.map((b, i) => (
                  <div
                    key={i}
                    onClick={() => setSelected(i)}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${selected === i ? 'border-primary bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-800">
                        {BLOCK_DEFS.find(d => d.type === b.type)?.label ?? b.type}
                      </div>
                      <div className="text-xs text-gray-400">
                        Padding: {b.config.padding} · Font: {b.config.fontSize}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={e => { e.stopPropagation(); moveUp(i); }} disabled={i === 0} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                      <button onClick={e => { e.stopPropagation(); moveDown(i); }} disabled={i === blocks.length-1} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                      <button onClick={e => { e.stopPropagation(); removeBlock(i); }} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Config panel */}
          <div className="w-64 border-l border-gray-200 p-4 overflow-y-auto flex-shrink-0">
            {selBlock ? (
              <div className="space-y-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Konfigurasi: {BLOCK_DEFS.find(d => d.type === selBlock.type)?.label}
                </p>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Padding</label>
                  <select value={selBlock.config.padding ?? 'md'} onChange={e => updateConfig('padding', e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-primary">
                    <option value="sm">Kecil</option>
                    <option value="md">Sedang</option>
                    <option value="lg">Besar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Ukuran Font</label>
                  <select value={selBlock.config.fontSize ?? 'md'} onChange={e => updateConfig('fontSize', e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-primary">
                    <option value="sm">Kecil</option>
                    <option value="md">Sedang</option>
                    <option value="lg">Besar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Warna Latar</label>
                  <input type="color" value={selBlock.config.background ?? '#0F172A'}
                    onChange={e => updateConfig('background', e.target.value)}
                    className="w-full h-10 rounded border border-gray-200 cursor-pointer" />
                </div>
                {(selBlock.type === 'TextBlock' || selBlock.type === 'TestimonialBlock') && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Rata Teks</label>
                    <select value={selBlock.config.textAlign ?? 'left'} onChange={e => updateConfig('textAlign', e.target.value)}
                      className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-primary">
                      <option value="left">Kiri</option>
                      <option value="center">Tengah</option>
                      <option value="right">Kanan</option>
                    </select>
                  </div>
                )}
                {selBlock.type === 'HeroImageBlock' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Fit Gambar</label>
                    <select value={selBlock.config.imageFit ?? 'cover'} onChange={e => updateConfig('imageFit', e.target.value)}
                      className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-primary">
                      <option value="cover">Cover (penuh)</option>
                      <option value="contain">Contain (proporsional)</option>
                    </select>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center mt-8">Klik blok untuk mengkonfigurasinya</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockBuilder;
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/PosterMaker/BlockBuilder.tsx
git commit -m "feat: add BlockBuilder modal for creating new poster templates"
```

---

## Task 11: AssetPanel (remove Fabric dependency)

**Files:**
- Modify: `src/components/admin/PosterMaker/AssetPanel.tsx`

The existing `AssetPanel` passes image URLs to `onAddImage(url)`. The new editor calls this to set an image field value. The interface doesn't change — just ensure no Fabric.js import.

- [ ] **Step 1: Check AssetPanel for Fabric.js imports**

```bash
grep -n "fabric\|FabricObject\|Canvas" src/components/admin/PosterMaker/AssetPanel.tsx
```

If any fabric imports exist, remove them. The component only needs `onAddImage: (url: string) => void` in props.

- [ ] **Step 2: Verify AssetPanel props interface**

Open `src/components/admin/PosterMaker/AssetPanel.tsx`. Ensure the props type is:

```typescript
interface AssetPanelProps {
  onAddImage: (url: string) => void;
}
```

If it already matches this shape, no changes needed.

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit if changed**

```bash
git add src/components/admin/PosterMaker/AssetPanel.tsx
git commit -m "chore: remove fabric dependency from AssetPanel"
```

---

## Task 12: AI Autofill Service + Edge Function

Changes payload from `textNodes[]` to `fieldValues{}`.

**Files:**
- Rewrite: `services/posterAutofillService.ts`
- Rewrite: `supabase/functions/ai-poster-autofill/index.ts`

- [ ] **Step 1: Rewrite posterAutofillService.ts**

```typescript
// services/posterAutofillService.ts
import { supabase } from '@/src/lib/supabase';
import { TemplateCategory, FieldValues } from '@/src/components/admin/PosterMaker/types';
import { TourPackage } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export type TemplateType = TemplateCategory;

export interface AutofillInputs {
  templateType: TemplateType;
  fieldValues: FieldValues;
  package?: TourPackage;
  topic?: string;
  tagline?: string;
  testimonial?: { quote: string; name: string; batch: string };
}

export const applyAutofill = async (inputs: AutofillInputs): Promise<FieldValues> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return inputs.fieldValues;

    const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-poster-autofill`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(inputs),
    });

    if (!res.ok) return inputs.fieldValues;
    const json = await res.json();
    return json.fieldValues ?? inputs.fieldValues;
  } catch (err) {
    console.error('posterAutofillService error:', err);
    return inputs.fieldValues;
  }
};
```

- [ ] **Step 2: Rewrite ai-poster-autofill edge function**

```typescript
// supabase/functions/ai-poster-autofill/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const formatPrice = (price?: number) =>
  price
    ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price)
    : 'Hubungi Kami'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

  try {
    const { templateType, fieldValues, package: pkg, topic, tagline, testimonial } = await req.json()

    if (!fieldValues || templateType === 'blank') {
      return new Response(JSON.stringify({ fieldValues: fieldValues ?? {} }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let contextBlock = ''
    let instructionBlock = ''

    switch (templateType) {
      case 'conversion': {
        if (!pkg) return new Response(JSON.stringify({ fieldValues }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        const startingPrice = formatPrice(pkg.room_options?.[0]?.price)
        const tiers = (pkg.room_options || []).slice(0, 3).map((r: { name: string; price?: number }) => `${r.name}: ${formatPrice(r.price)}`).join(' | ')
        const features = (pkg.features || []).slice(0, 6).join(', ')
        contextBlock = `Nama Paket: ${pkg.title}\nTanggal: ${pkg.departure_date}\nDurasi: ${pkg.duration}\nKategori: ${pkg.category}\nHarga Mulai: ${startingPrice}\nTipe Kamar: ${tiers}\nKeunggulan: ${features}\nDeskripsi: ${(pkg.description || '').substring(0, 200)}`
        instructionBlock = `- Isi "headline" dengan nama paket yang menarik.\n- Isi "badge_text" dengan kategori paket (maks 3 kata).\n- Isi "departure" dengan tanggal keberangkatan.\n- Isi "duration" dengan durasi perjalanan.\n- Isi "price" dengan harga mulai aktual.\n- Isi "feature_1" s/d "feature_4" dengan keunggulan utama paket (maks 5 kata per item).\n- Jangan ubah field yang tidak terdaftar.`
        break
      }
      case 'edu-reminder': {
        contextBlock = `Topik: ${topic || 'Tips Umroh'}`
        instructionBlock = `- Isi "headline" dengan judul daftar yang menarik (contoh: "5 Barang Wajib Dibawa Saat Umroh").\n- Isi "intro" dengan kalimat pengantar singkat.\n- Isi "item_1_title" s/d "item_5_title" dengan tips/langkah yang relevan (maks 6 kata).\n- Isi "item_1_desc" s/d "item_5_desc" dengan penjelasan singkat (maks 12 kata).`
        break
      }
      case 'aspiration': {
        contextBlock = `Tagline kustom: ${tagline?.trim() || '(generate tagline spiritual menginspirasi)'}`
        instructionBlock = `- Isi "tagline" dengan tagline spiritual yang menginspirasi.\n- Isi "sub_tagline" dengan kalimat undangan hangat dan profesional.`
        break
      }
      case 'social-proof': {
        const hasData = testimonial && (testimonial.quote || testimonial.name || testimonial.batch)
        contextBlock = hasData
          ? `Kutipan: "${testimonial.quote}"\nNama: ${testimonial.name}\nRombongan: ${testimonial.batch}`
          : '(AI buat testimoni jamaah Umroh yang realistis dan positif)'
        instructionBlock = `- Isi "quote" dengan kutipan testimoni (atau generate jika tidak ada data).\n- Isi "author_name" dengan nama jamaah.\n- Isi "batch" dengan info rombongan.\n- Pertahankan "stat_1", "stat_2", "rating" jika sudah ada nilainya.`
        break
      }
      default:
        return new Response(JSON.stringify({ fieldValues }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const currentValues = Object.entries(fieldValues as Record<string, string>)
      .map(([k, v]) => `  "${k}": "${v}"`)
      .join('\n')

    const prompt = `
Kamu adalah copywriter profesional Alfatih Dunia Wisata — travel agent premium Indonesia untuk Umroh dan wisata Halal.

Tipe Template: ${templateType}

Data Konten:
${contextBlock}

Nilai field poster saat ini:
{
${currentValues}
}

Instruksi:
${instructionBlock}

ATURAN WAJIB:
1. Kembalikan HANYA objek JSON dengan field yang diubah — key sama persis seperti di atas.
2. Panjang teks baru harus mirip dengan aslinya agar tata letak poster tidak rusak.
3. JANGAN ubah: "Alfatih Dunia Wisata", "@alfatih.umroh", "adwisata.com", nomor PPIU.
4. Gunakan Bahasa Indonesia untuk semua konten kecuali teks yang memang aslinya berbahasa Inggris.
5. Kembalikan format: { "fieldValues": { "key": "value", ... } } — tanpa markdown, tanpa penjelasan.`

    const model = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash-preview-05-20'
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) return new Response(JSON.stringify({ error: 'Server misconfiguration' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) }
    )

    if (!geminiRes.ok) throw new Error(`Gemini API error ${geminiRes.status}`)

    const geminiData = await geminiRes.json()
    const raw = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'
    const cleaned = raw.replace(/```json/gi, '').replace(/```/gi, '').trim()

    let parsed: { fieldValues?: Record<string, string> }
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      throw new Error('Gemini returned invalid JSON')
    }

    const merged = { ...fieldValues, ...(parsed.fieldValues ?? {}) }

    return new Response(JSON.stringify({ fieldValues: merged }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('ai-poster-autofill error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
```

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Deploy edge function**

```bash
supabase functions deploy ai-poster-autofill
```

- [ ] **Step 5: Commit**

```bash
git add services/posterAutofillService.ts supabase/functions/ai-poster-autofill/index.ts
git commit -m "feat: update AI autofill to fieldValues payload shape"
```

---

## Task 13: PosterEditor (main component)

**Files:**
- Create: `src/components/admin/PosterMaker/PosterEditor.tsx`

- [ ] **Step 1: Create PosterEditor.tsx**

```tsx
// src/components/admin/PosterMaker/PosterEditor.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, Download, Printer, Save, LayoutTemplate } from 'lucide-react';
import { PosterTemplate, FieldValues, AspectRatio } from './types';
import { CODE_TEMPLATES } from './templates';
import { FieldForm } from './FieldForm';
import { LivePreview } from './LivePreview';
import { DraftPanel } from './DraftPanel';
import AssetPanel from './AssetPanel';
import { TemplateSelector } from './TemplateSelector';
import { BlockBuilder } from './BlockBuilder';
import { exportPosterPng } from './exportPoster';
import { applyAutofill, AutofillInputs } from '../../../services/posterAutofillService';
import { supabase } from '../../lib/supabase';
import { TourPackage } from '../../../types';

type View = 'pick-template' | 'editing';
type RightTab = 'assets' | 'drafts';

interface AiState {
  isGenerating: boolean;
  selectedPackageId: string;
  packages: TourPackage[];
  topic: string;
  tagline: string;
  testimonialQuote: string;
  testimonialName: string;
  testimonialBatch: string;
}

export const PosterEditor: React.FC = () => {
  const [view, setView] = useState<View>('pick-template');
  const [template, setTemplate] = useState<PosterTemplate | null>(null);
  const [fieldValues, setFieldValues] = useState<FieldValues>({});
  const [activeImageField, setActiveImageField] = useState<string | null>(null);
  const [rightTab, setRightTab] = useState<RightTab>('drafts');
  const [isExporting, setIsExporting] = useState(false);
  const [showBlockBuilder, setShowBlockBuilder] = useState(false);
  const [refreshTemplates, setRefreshTemplates] = useState(0);
  const [ai, setAi] = useState<AiState>({
    isGenerating: false,
    selectedPackageId: '',
    packages: [],
    topic: '',
    tagline: '',
    testimonialQuote: '',
    testimonialName: '',
    testimonialBatch: '',
  });

  useEffect(() => {
    supabase.from('packages').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data && data.length > 0) {
        setAi(prev => ({ ...prev, packages: data, selectedPackageId: data[0].id }));
      }
    });
  }, []);

  const handleSelectTemplate = (t: PosterTemplate) => {
    setTemplate(t);
    setFieldValues({});
    setView('editing');
  };

  const handleFieldChange = useCallback((id: string, value: string) => {
    setFieldValues(prev => ({ ...prev, [id]: value }));
  }, []);

  const handlePickImage = (fieldId: string) => {
    setActiveImageField(fieldId);
    setRightTab('assets');
  };

  const handleImageSelected = (url: string) => {
    if (activeImageField) {
      setFieldValues(prev => ({ ...prev, [activeImageField]: url }));
      setActiveImageField(null);
    }
  };

  const handleLoadDraft = (templateId: string, values: FieldValues) => {
    const found = CODE_TEMPLATES.find(t => t.id === templateId);
    if (found) {
      setTemplate(found);
      setFieldValues(values);
      setView('editing');
    }
  };

  const handleExport = async (pixelRatio: 2 | 4) => {
    if (!template) return;
    setIsExporting(true);
    try {
      await exportPosterPng(template, fieldValues, pixelRatio);
    } finally {
      setIsExporting(false);
    }
  };

  const handleAiAutofill = async () => {
    if (!template) return;
    const inputs: AutofillInputs = {
      templateType: template.category,
      fieldValues,
    };
    if (template.category === 'conversion') {
      inputs.package = ai.packages.find(p => p.id === ai.selectedPackageId);
    } else if (template.category === 'edu-reminder') {
      inputs.topic = ai.topic;
    } else if (template.category === 'aspiration') {
      inputs.tagline = ai.tagline;
    } else if (template.category === 'social-proof') {
      inputs.testimonial = { quote: ai.testimonialQuote, name: ai.testimonialName, batch: ai.testimonialBatch };
    }

    setAi(prev => ({ ...prev, isGenerating: true }));
    try {
      const updated = await applyAutofill(inputs);
      setFieldValues(updated);
    } finally {
      setAi(prev => ({ ...prev, isGenerating: false }));
    }
  };

  const renderAiInputs = () => {
    if (!template || template.category === 'blank') return null;
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 mt-3">
        <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" /> AI Magic Fill
        </h3>
        <div className="space-y-3">
          {template.category === 'conversion' && (
            <select
              value={ai.selectedPackageId}
              onChange={e => setAi(prev => ({ ...prev, selectedPackageId: e.target.value }))}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:border-primary outline-none"
            >
              {ai.packages.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          )}
          {template.category === 'edu-reminder' && (
            <input type="text" value={ai.topic} onChange={e => setAi(prev => ({ ...prev, topic: e.target.value }))}
              placeholder="Topik (contoh: Tips Umroh)" className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:border-primary outline-none" />
          )}
          {template.category === 'aspiration' && (
            <textarea value={ai.tagline} onChange={e => setAi(prev => ({ ...prev, tagline: e.target.value }))}
              placeholder="Tagline kustom (opsional, AI generate jika kosong)" rows={2}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:border-primary outline-none resize-none" />
          )}
          {template.category === 'social-proof' && (
            <div className="space-y-2">
              <textarea value={ai.testimonialQuote} onChange={e => setAi(prev => ({ ...prev, testimonialQuote: e.target.value }))}
                placeholder="Kutipan testimoni (opsional)" rows={2}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:border-primary outline-none resize-none" />
              <input type="text" value={ai.testimonialName} onChange={e => setAi(prev => ({ ...prev, testimonialName: e.target.value }))}
                placeholder="Nama jamaah" className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:border-primary outline-none" />
              <input type="text" value={ai.testimonialBatch} onChange={e => setAi(prev => ({ ...prev, testimonialBatch: e.target.value }))}
                placeholder="Rombongan (Umroh Syawal, Maret 2026)" className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:border-primary outline-none" />
            </div>
          )}
          <button onClick={handleAiAutofill} disabled={ai.isGenerating}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition disabled:opacity-50">
            {ai.isGenerating ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate & Terapkan
          </button>
        </div>
      </div>
    );
  };

  if (view === 'pick-template') {
    return (
      <div className="flex flex-col gap-4" style={{ height: 'calc(100vh - 64px)' }}>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Poster Maker</h1>
          <p className="mt-1 text-sm text-gray-500">Pilih template untuk mulai membuat poster marketing.</p>
        </div>
        <div className="flex-1 min-h-0">
          <TemplateSelector
            key={refreshTemplates}
            onSelect={handleSelectTemplate}
            onNewTemplate={() => setShowBlockBuilder(true)}
          />
        </div>
        {showBlockBuilder && (
          <BlockBuilder
            onClose={() => setShowBlockBuilder(false)}
            onSaved={() => { setRefreshTemplates(k => k + 1); setShowBlockBuilder(false); }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0 overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 px-0 py-3 flex-shrink-0 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('pick-template')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition">
            <LayoutTemplate className="w-4 h-4" /> Ganti Template
          </button>
          {template && (
            <span className="text-sm font-semibold text-gray-800">{template.name}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => handleExport(2)} disabled={isExporting || !template}
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:border-primary hover:text-primary transition disabled:opacity-40">
            <Download className="w-4 h-4" /> Ekspor
          </button>
          <button onClick={() => handleExport(4)} disabled={isExporting || !template}
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:border-primary hover:text-primary transition disabled:opacity-40">
            <Printer className="w-4 h-4" /> Cetak (4×)
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 min-h-0 gap-0">
        {/* Left sidebar — field form */}
        <div className="w-80 flex-shrink-0 border-r border-gray-200 overflow-y-auto p-4 bg-white">
          {template && (
            <>
              <FieldForm
                template={template}
                values={fieldValues}
                onChange={handleFieldChange}
                onPickImage={handlePickImage}
              />
              {renderAiInputs()}
            </>
          )}
        </div>

        {/* Center — live preview */}
        <div className="flex-1 min-w-0 bg-gray-100 flex items-center justify-center p-8 overflow-hidden">
          {template && (
            <div className="w-full max-w-sm">
              <LivePreview template={template} fieldValues={fieldValues} />
            </div>
          )}
        </div>

        {/* Right sidebar — assets + drafts */}
        <div className="w-72 flex-shrink-0 border-l border-gray-200 flex flex-col bg-white">
          <div className="flex border-b border-gray-200 flex-shrink-0">
            {(['drafts', 'assets'] as RightTab[]).map(tab => (
              <button key={tab} onClick={() => setRightTab(tab)}
                className={`flex-1 py-2.5 text-xs font-semibold capitalize transition ${rightTab === tab ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}>
                {tab === 'drafts' ? 'Draft' : 'Foto'}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {rightTab === 'assets' && (
              <AssetPanel onAddImage={handleImageSelected} />
            )}
            {rightTab === 'drafts' && template && (
              <DraftPanel template={template} fieldValues={fieldValues} onLoadDraft={handleLoadDraft} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PosterEditor;
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/PosterMaker/PosterEditor.tsx
git commit -m "feat: add PosterEditor two-panel layout component"
```

---

## Task 14: Update PosterMaker Page

Replace the 959-line `PosterMaker.tsx` page with a simple wrapper around `PosterEditor`.

**Files:**
- Rewrite: `src/pages/admin/PosterMaker.tsx`

- [ ] **Step 1: Rewrite PosterMaker.tsx**

```tsx
// src/pages/admin/PosterMaker.tsx
import React from 'react';
import PosterEditor from '../../components/admin/PosterMaker/PosterEditor';

const PosterMaker: React.FC = () => {
  return <PosterEditor />;
};

export default PosterMaker;
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/PosterMaker.tsx
git commit -m "feat: replace PosterMaker page with new PosterEditor"
```

---

## Task 15: Delete Fabric.js Files

**Files:** (all in `src/components/admin/PosterMaker/`)
- Delete: `FabricCanvas.tsx`, `LayerPanel.tsx`, `PropertiesPanel.tsx`, `CanvasContextMenu.tsx`, `CanvasZoom.tsx`, `EditorToolbar.tsx`, `PosterCanvas.tsx`, `TemplatePanel.tsx`, `fabricSnap.ts`, `fabricShadow.ts`, `fabricCornerRadius.ts`, `templateThumbnail.ts`
- Delete: `blocks/PosterHeader.tsx`, `blocks/PosterFooter.tsx`, `blocks/PosterDetails.tsx`, `blocks/PosterImageBlock.tsx`, `blocks/PosterPromo.tsx`

- [ ] **Step 1: Delete old Fabric.js component files**

```bash
rm src/components/admin/PosterMaker/FabricCanvas.tsx \
   src/components/admin/PosterMaker/LayerPanel.tsx \
   src/components/admin/PosterMaker/PropertiesPanel.tsx \
   src/components/admin/PosterMaker/CanvasContextMenu.tsx \
   src/components/admin/PosterMaker/CanvasZoom.tsx \
   src/components/admin/PosterMaker/EditorToolbar.tsx \
   src/components/admin/PosterMaker/PosterCanvas.tsx \
   src/components/admin/PosterMaker/TemplatePanel.tsx \
   src/components/admin/PosterMaker/fabricSnap.ts \
   src/components/admin/PosterMaker/fabricShadow.ts \
   src/components/admin/PosterMaker/fabricCornerRadius.ts \
   src/components/admin/PosterMaker/templateThumbnail.ts \
   src/components/admin/PosterMaker/blocks/PosterHeader.tsx \
   src/components/admin/PosterMaker/blocks/PosterFooter.tsx \
   src/components/admin/PosterMaker/blocks/PosterDetails.tsx \
   src/components/admin/PosterMaker/blocks/PosterImageBlock.tsx \
   src/components/admin/PosterMaker/blocks/PosterPromo.tsx
```

- [ ] **Step 2: Remove fabric from package.json**

Edit `package.json` — delete the `"fabric": "^7.2.0"` line from `dependencies`.

Then run:

```bash
npm install
```

- [ ] **Step 3: TypeScript check — must pass cleanly**

```bash
npx tsc --noEmit
```

Expected: **zero errors**. If errors remain, they indicate imports of deleted files — fix them before proceeding.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: delete Fabric.js files and remove fabric dependency"
```

---

## Task 16: Verification

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

Expected: no compile errors in terminal output. Browser at `http://localhost:3000`.

- [ ] **Step 2: Navigate to Poster Maker**

Log in to admin (`/admin/login`), then go to `/admin/poster-maker`.

Expected: Template selector screen with 4 template cards (Konversi Paket, Tips & Pengingat, Aspirasi & Inspirasi, Bukti Sosial).

- [ ] **Step 3: Test editor flow**

1. Click "Konversi Paket" — editor opens with field form on left, live preview on right.
2. Type in "Judul Paket" field — preview updates in real time.
3. Click "Pilih Foto" on "Foto Utama" — right panel switches to Foto tab with image picker.
4. Select an image from Unsplash — image appears in preview.
5. Click "Ekspor" — PNG file downloads.

- [ ] **Step 4: Test AI autofill**

1. With the Konversi template open, select a package from the AI Magic Fill dropdown.
2. Click "Generate & Terapkan".
3. Expected: text fields update with AI-generated content, preview updates.

- [ ] **Step 5: Test draft save/load**

1. Fill in some fields, go to Draft tab, save a draft.
2. Return to template picker, pick a template, then load the saved draft.
3. Expected: field values restore correctly.

- [ ] **Step 6: Test Block Builder**

1. On the template picker screen, click "Buat Baru".
2. Add a HeaderBlock, HeroImageBlock, TextBlock, FooterBlock.
3. Configure padding on TextBlock.
4. Enter a name and click "Simpan Template".
5. Expected: modal closes, new template appears in the template selector.

- [ ] **Step 7: Production build check**

```bash
npm run build
```

Expected: build completes without errors.

- [ ] **Step 8: Commit verification result**

```bash
git add -A
git commit -m "feat: complete Poster Maker v2 — HTML/CSS block-based editor replaces Fabric.js"
```
