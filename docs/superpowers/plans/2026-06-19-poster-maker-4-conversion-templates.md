# Poster Maker — 4 Conversion Templates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 8 new `PosterTemplate` objects (4 designs × post + story) to `BASE_TEMPLATES` in `TemplatePanel.tsx`.

**Architecture:** All 8 templates are pure data — Fabric.js canvas JSON objects appended to the existing `BASE_TEMPLATES` array. No new files, no type changes, no service changes. The `injectFooterData()` function and `getTemplateType()` already handle all new templates without modification.

**Tech Stack:** Fabric.js v7, React, TypeScript, Tailwind CDN

## Global Constraints

- Canvas sizes: Post = `1080 × 1350`, Story = `1080 × 1920`
- All object coordinates use `originX: 'left', originY: 'top'`
- Font: `Plus Jakarta Sans, sans-serif` throughout
- Brand palette: `#0084FF` (blue), `#F59E0B` (gold/amber), `#D4A373` (tan), `#F8FAFC` (off-white), `#F1F5F9` (surface), `#0F172A` (dark), `#64748B` (slate), `#FFFFFF` (white)
- Post footer: `top: 1210, height: 140, fill: '#0084FF'` — standard across all post templates
- Story footer: `top: 1740, height: 180, fill: '#0084FF'` — standard across all story templates
- Post CTA button: `top: 1140, left: 340, width: 400, height: 60, rx: 30`
- Story CTA button: `top: 1590, left: 320, width: 440, height: 70, rx: 35`
- Footer contact text must contain `|` and `.com` or `@` so `injectFooterData()` replaces it
- Footer license text must contain `PPIU` or `Penyelenggara` so `injectFooterData()` replaces it
- All IDs must contain the word `conversion` for `getTemplateType()` to return `'conversion'`
- Image placeholder: `https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=960&q=80`
- `crossOrigin: 'anonymous'` on all image objects (required for thumbnail generation)
- No automated tests exist in this project — verification is manual via the dev server

---

## File Map

| File | Change |
|---|---|
| `src/components/admin/PosterMaker/TemplatePanel.tsx` | Append 8 objects to `BASE_TEMPLATES` array |

---

## Task 1: Promo/Diskon templates

Price discount is the hero: original price struck through, discounted price large, HEMAT badge, urgency strip.

**Files:**
- Modify: `src/components/admin/PosterMaker/TemplatePanel.tsx` — append to `BASE_TEMPLATES`

---

- [ ] **Step 1: Append `promo-post-conversion` to `BASE_TEMPLATES`**

Open `src/components/admin/PosterMaker/TemplatePanel.tsx`. Find the closing `];` of `BASE_TEMPLATES` (currently after the `brochure-story-conversion` object). Insert before the `];`:

```typescript
    {
        id: 'promo-post-conversion',
        name: 'Promo Diskon Umrah (Post)',
        description: 'Harga coret dengan badge HEMAT dan urgency kursi tersisa. Mendukung AI Auto-Fill.',
        previewColors: ['#0084FF', '#F59E0B', '#EF4444'],
        aspectRatio: 'post',
        json: {
            version: '7.2.0',
            width: 1080,
            height: 1350,
            objects: [
                // Background
                { type: 'rect', left: 0, top: 0, width: 1080, height: 1350, fill: '#F8FAFC', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Top accent bar
                { type: 'rect', left: 0, top: 0, width: 1080, height: 15, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Gold divider
                { type: 'rect', left: 60, top: 245, width: 200, height: 4, fill: '#D4A373', originX: 'left', originY: 'top', selectable: true },
                // Main image
                { type: 'image', left: 60, top: 350, width: 960, height: 355, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=960&q=80', rx: 12, ry: 12, crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
                // HEMAT badge background
                { type: 'rect', left: 60, top: 730, width: 200, height: 44, rx: 22, ry: 22, fill: '#0084FF', originX: 'left', originY: 'top', selectable: true },
                // CTA button background
                { type: 'rect', left: 340, top: 1140, width: 400, height: 60, rx: 30, ry: 30, fill: '#0084FF', originX: 'left', originY: 'top', selectable: true },
                // Footer background
                { type: 'rect', left: 0, top: 1210, width: 1080, height: 140, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Category
                { type: 'textbox', left: 60, top: 100, width: 960, text: 'PROMO TERBATAS', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', charSpacing: 150, originX: 'left', originY: 'top', editable: true },
                // Title
                { type: 'textbox', left: 60, top: 140, width: 960, text: 'Umrah Premium Syawal 1447H', fontSize: 50, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#0F172A', lineHeight: 1.2, originX: 'left', originY: 'top', editable: true },
                // Description
                { type: 'textbox', left: 60, top: 268, width: 960, text: 'Nikmati perjalanan ibadah yang aman, nyaman, dan khusyuk bersama travel berizin resmi PPIU.', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#64748B', lineHeight: 1.4, originX: 'left', originY: 'top', editable: true },
                // HEMAT badge text
                { type: 'textbox', left: 60, top: 741, width: 200, text: 'HEMAT 18%', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', textAlign: 'center', charSpacing: 50, originX: 'left', originY: 'top', editable: true },
                // Original price label
                { type: 'textbox', left: 285, top: 736, width: 250, text: 'Harga Normal', fontSize: 13, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#64748B', originX: 'left', originY: 'top', editable: true },
                // Original price (strikethrough)
                { type: 'textbox', left: 282, top: 756, width: 300, text: 'Rp 36.000.000', fontSize: 26, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#94A3B8', linethrough: true, originX: 'left', originY: 'top', editable: true },
                // Discounted price label
                { type: 'textbox', left: 610, top: 736, width: 250, text: 'Harga Promo', fontSize: 13, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#F59E0B', originX: 'left', originY: 'top', editable: true },
                // Discounted price
                { type: 'textbox', left: 600, top: 748, width: 420, text: 'Rp 29.500.000', fontSize: 38, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', originX: 'left', originY: 'top', editable: true },
                // Room pricing
                { type: 'textbox', left: 60, top: 820, width: 960, text: 'Quad: Rp 29.500.000 | Triple: Rp 31.500.000 | Double: Rp 33.500.000', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#64748B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Urgency
                { type: 'textbox', left: 60, top: 855, width: 960, text: '⚡ Sisa 8 Kursi Tersisa!', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#EF4444', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Feature bullet diamonds
                { type: 'textbox', left: 100, top: 900, width: 30, text: '◆\n◆\n◆\n◆', fontSize: 12, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#F59E0B', textAlign: 'center', lineHeight: 2.3, originX: 'left', originY: 'top', editable: true },
                // Feature list
                { type: 'textbox', left: 142, top: 900, width: 838, text: 'Hotel Makkah: Anjum / Setaraf (*5)\nHotel Madinah: Front Taiba / Setaraf (*5)\nTiket Pesawat Saudia Airlines direct Jeddah\nMuthawwif Pembimbing Ibadah Berpengalaman', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#0F172A', lineHeight: 1.5, originX: 'left', originY: 'top', editable: true },
                // CTA text
                { type: 'textbox', left: 340, top: 1159, width: 400, text: 'DAFTAR SEKARANG', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', textAlign: 'center', charSpacing: 100, originX: 'left', originY: 'top', editable: true },
                // Footer brand
                { type: 'textbox', left: 60, top: 1235, width: 300, text: 'ALFATIH DUNIA WISATA', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', originX: 'left', originY: 'top', editable: true },
                // Footer contact
                { type: 'textbox', left: 380, top: 1235, width: 640, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
                // Footer license
                { type: 'textbox', left: 60, top: 1280, width: 960, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 12, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
            ]
        }
    },
```

- [ ] **Step 2: Append `promo-story-conversion` to `BASE_TEMPLATES`**

Immediately after the object from Step 1 (still before `];`):

```typescript
    {
        id: 'promo-story-conversion',
        name: 'Promo Diskon Umrah (Story)',
        description: 'Harga coret dengan badge HEMAT dan urgency kursi tersisa, format Story. Mendukung AI Auto-Fill.',
        previewColors: ['#0084FF', '#F59E0B', '#EF4444'],
        aspectRatio: 'story',
        json: {
            version: '7.2.0',
            width: 1080,
            height: 1920,
            objects: [
                // Background
                { type: 'rect', left: 0, top: 0, width: 1080, height: 1920, fill: '#F8FAFC', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Top accent bar
                { type: 'rect', left: 0, top: 0, width: 1080, height: 20, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Gold divider
                { type: 'rect', left: 80, top: 315, width: 250, height: 5, fill: '#D4A373', originX: 'left', originY: 'top', selectable: true },
                // Main image
                { type: 'image', left: 80, top: 500, width: 920, height: 490, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=960&q=80', rx: 16, ry: 16, crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
                // HEMAT badge background
                { type: 'rect', left: 80, top: 1020, width: 230, height: 54, rx: 27, ry: 27, fill: '#0084FF', originX: 'left', originY: 'top', selectable: true },
                // CTA button background
                { type: 'rect', left: 320, top: 1590, width: 440, height: 70, rx: 35, ry: 35, fill: '#0084FF', originX: 'left', originY: 'top', selectable: true },
                // Footer background
                { type: 'rect', left: 0, top: 1740, width: 1080, height: 180, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Category
                { type: 'textbox', left: 80, top: 140, width: 920, text: 'PROMO TERBATAS', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', charSpacing: 150, originX: 'left', originY: 'top', editable: true },
                // Title
                { type: 'textbox', left: 80, top: 190, width: 920, text: 'Umrah Premium Syawal 1447H', fontSize: 55, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#0F172A', lineHeight: 1.2, originX: 'left', originY: 'top', editable: true },
                // Description
                { type: 'textbox', left: 80, top: 355, width: 920, text: 'Nikmati perjalanan ibadah yang aman, nyaman, dan khusyuk bersama travel berizin resmi PPIU.', fontSize: 22, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#64748B', lineHeight: 1.4, originX: 'left', originY: 'top', editable: true },
                // HEMAT badge text
                { type: 'textbox', left: 80, top: 1033, width: 230, text: 'HEMAT 18%', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', textAlign: 'center', charSpacing: 50, originX: 'left', originY: 'top', editable: true },
                // Original price label
                { type: 'textbox', left: 340, top: 1026, width: 240, text: 'Harga Normal', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#64748B', originX: 'left', originY: 'top', editable: true },
                // Original price (strikethrough)
                { type: 'textbox', left: 336, top: 1050, width: 310, text: 'Rp 36.000.000', fontSize: 28, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#94A3B8', linethrough: true, originX: 'left', originY: 'top', editable: true },
                // Discounted price label
                { type: 'textbox', left: 680, top: 1026, width: 240, text: 'Harga Promo', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#F59E0B', originX: 'left', originY: 'top', editable: true },
                // Discounted price
                { type: 'textbox', left: 665, top: 1040, width: 415, text: 'Rp 29.500.000', fontSize: 44, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', originX: 'left', originY: 'top', editable: true },
                // Room pricing
                { type: 'textbox', left: 80, top: 1155, width: 920, text: 'Quad: Rp 29.500.000 | Triple: Rp 31.500.000 | Double: Rp 33.500.000', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#64748B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Urgency
                { type: 'textbox', left: 80, top: 1200, width: 920, text: '⚡ Sisa 8 Kursi Tersisa!', fontSize: 22, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#EF4444', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Feature bullet diamonds
                { type: 'textbox', left: 120, top: 1258, width: 34, text: '◆\n◆\n◆\n◆', fontSize: 13, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#F59E0B', textAlign: 'center', lineHeight: 2.46, originX: 'left', originY: 'top', editable: true },
                // Feature list
                { type: 'textbox', left: 166, top: 1258, width: 754, text: 'Hotel Makkah: Anjum / Setaraf (*5)\nHotel Madinah: Front Taiba / Setaraf (*5)\nTiket Pesawat Saudia Airlines direct Jeddah\nMuthawwif Pembimbing Ibadah Berpengalaman', fontSize: 22, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#0F172A', lineHeight: 1.6, originX: 'left', originY: 'top', editable: true },
                // CTA text
                { type: 'textbox', left: 320, top: 1611, width: 440, text: 'DAFTAR SEKARANG', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', textAlign: 'center', charSpacing: 100, originX: 'left', originY: 'top', editable: true },
                // Footer brand
                { type: 'textbox', left: 80, top: 1765, width: 320, text: 'ALFATIH DUNIA WISATA', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', originX: 'left', originY: 'top', editable: true },
                // Footer contact
                { type: 'textbox', left: 420, top: 1765, width: 580, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
                // Footer license
                { type: 'textbox', left: 80, top: 1825, width: 920, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 14, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
            ]
        }
    },
```

- [ ] **Step 3: Verify Task 1 templates**

Run `npm run dev`. Open `http://localhost:3000`, navigate to Admin → Poster Maker. In the Templates panel, confirm two new entries appear: "Promo Diskon Umrah (Post)" and "Promo Diskon Umrah (Story)". Click each — verify the canvas loads with:
- Strikethrough original price visible
- Blue "HEMAT 18%" pill badge
- Red urgency line "⚡ Sisa 8 Kursi Tersisa!"
- Footer injected with site contact info

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/PosterMaker/TemplatePanel.tsx
git commit -m "feat(poster): add promo-diskon conversion templates (post + story)"
```

---

## Task 2: Hotel & Airline Highlight templates

Two side-by-side images (hotel | airline) with quality labels. Emphasises accommodation and flight quality.

**Files:**
- Modify: `src/components/admin/PosterMaker/TemplatePanel.tsx`

---

- [ ] **Step 1: Append `hotel-airline-post-conversion`**

```typescript
    {
        id: 'hotel-airline-post-conversion',
        name: 'Hotel & Penerbangan (Post)',
        description: 'Dua foto berdampingan: hotel bintang 5 dan penerbangan langsung. Mendukung AI Auto-Fill.',
        previewColors: ['#0084FF', '#F59E0B', '#F1F5F9'],
        aspectRatio: 'post',
        json: {
            version: '7.2.0',
            width: 1080,
            height: 1350,
            objects: [
                // Background
                { type: 'rect', left: 0, top: 0, width: 1080, height: 1350, fill: '#F8FAFC', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Top accent bar
                { type: 'rect', left: 0, top: 0, width: 1080, height: 15, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Gold divider
                { type: 'rect', left: 60, top: 245, width: 200, height: 4, fill: '#D4A373', originX: 'left', originY: 'top', selectable: true },
                // Hotel image (left)
                { type: 'image', left: 60, top: 340, width: 455, height: 320, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=455&h=320&q=80', rx: 12, ry: 12, crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
                // Airline image (right)
                { type: 'image', left: 565, top: 340, width: 455, height: 320, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=455&h=320&q=80', rx: 12, ry: 12, crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
                // Info card 1 background (date)
                { type: 'rect', left: 60, top: 745, width: 300, height: 100, rx: 12, ry: 12, fill: '#F1F5F9', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Info card 2 background (duration)
                { type: 'rect', left: 390, top: 745, width: 300, height: 100, rx: 12, ry: 12, fill: '#F1F5F9', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Info card 3 background (price)
                { type: 'rect', left: 720, top: 745, width: 300, height: 100, rx: 12, ry: 12, fill: '#F1F5F9', originX: 'left', originY: 'top', selectable: false, evented: false },
                // CTA button background
                { type: 'rect', left: 340, top: 1140, width: 400, height: 60, rx: 30, ry: 30, fill: '#0084FF', originX: 'left', originY: 'top', selectable: true },
                // Footer background
                { type: 'rect', left: 0, top: 1210, width: 1080, height: 140, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Category
                { type: 'textbox', left: 60, top: 100, width: 960, text: 'PAKET PREMIUM UMRAH', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', charSpacing: 150, originX: 'left', originY: 'top', editable: true },
                // Title
                { type: 'textbox', left: 60, top: 140, width: 960, text: 'Umrah Premium Syawal 1447H', fontSize: 50, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#0F172A', lineHeight: 1.2, originX: 'left', originY: 'top', editable: true },
                // Description
                { type: 'textbox', left: 60, top: 270, width: 960, text: 'Nikmati pengalaman ibadah dengan fasilitas premium — hotel bintang 5 dan penerbangan langsung.', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#64748B', lineHeight: 1.4, originX: 'left', originY: 'top', editable: true },
                // Hotel image label
                { type: 'textbox', left: 60, top: 674, width: 455, text: '🏨 Hotel Bintang 5 Makkah', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Airline image label
                { type: 'textbox', left: 565, top: 674, width: 455, text: '✈ Penerbangan Langsung Jeddah', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Card 1 text (date)
                { type: 'textbox', left: 60, top: 766, width: 300, text: 'Keberangkatan\n12 Okt 2026', fontSize: 22, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', textAlign: 'center', lineHeight: 1.3, originX: 'left', originY: 'top', editable: true },
                // Card 2 text (duration)
                { type: 'textbox', left: 390, top: 766, width: 300, text: 'Durasi\n12 Hari', fontSize: 22, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', textAlign: 'center', lineHeight: 1.3, originX: 'left', originY: 'top', editable: true },
                // Card 3 text (price)
                { type: 'textbox', left: 720, top: 766, width: 300, text: 'Harga Mulai\nRp 32.5 Jt', fontSize: 22, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#F59E0B', textAlign: 'center', lineHeight: 1.3, originX: 'left', originY: 'top', editable: true },
                // Room pricing
                { type: 'textbox', left: 60, top: 875, width: 960, text: 'Quad: Rp 32.500.000 | Triple: Rp 34.500.000 | Double: Rp 36.500.000', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#64748B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Feature bullet diamonds
                { type: 'textbox', left: 100, top: 918, width: 30, text: '◆\n◆\n◆', fontSize: 12, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#F59E0B', textAlign: 'center', lineHeight: 2.3, originX: 'left', originY: 'top', editable: true },
                // Feature list
                { type: 'textbox', left: 142, top: 918, width: 838, text: 'Hotel Makkah: Anjum / Setaraf (*5) & Madinah: Front Taiba / Setaraf (*5)\nTiket Pesawat Saudia Airlines Penerbangan Langsung Jeddah\nMuthawwif Pembimbing Ibadah & Air Zamzam 5L', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#0F172A', lineHeight: 1.5, originX: 'left', originY: 'top', editable: true },
                // CTA text
                { type: 'textbox', left: 340, top: 1159, width: 400, text: 'DAFTAR SEKARANG', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', textAlign: 'center', charSpacing: 100, originX: 'left', originY: 'top', editable: true },
                // Footer brand
                { type: 'textbox', left: 60, top: 1235, width: 300, text: 'ALFATIH DUNIA WISATA', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', originX: 'left', originY: 'top', editable: true },
                // Footer contact
                { type: 'textbox', left: 380, top: 1235, width: 640, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
                // Footer license
                { type: 'textbox', left: 60, top: 1280, width: 960, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 12, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
            ]
        }
    },
```

- [ ] **Step 2: Append `hotel-airline-story-conversion`**

```typescript
    {
        id: 'hotel-airline-story-conversion',
        name: 'Hotel & Penerbangan (Story)',
        description: 'Dua foto berdampingan: hotel bintang 5 dan penerbangan langsung, format Story. Mendukung AI Auto-Fill.',
        previewColors: ['#0084FF', '#F59E0B', '#F1F5F9'],
        aspectRatio: 'story',
        json: {
            version: '7.2.0',
            width: 1080,
            height: 1920,
            objects: [
                // Background
                { type: 'rect', left: 0, top: 0, width: 1080, height: 1920, fill: '#F8FAFC', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Top accent bar
                { type: 'rect', left: 0, top: 0, width: 1080, height: 20, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Gold divider
                { type: 'rect', left: 80, top: 315, width: 250, height: 5, fill: '#D4A373', originX: 'left', originY: 'top', selectable: true },
                // Hotel image (left)
                { type: 'image', left: 80, top: 500, width: 440, height: 430, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=440&h=430&q=80', rx: 14, ry: 14, crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
                // Airline image (right)
                { type: 'image', left: 560, top: 500, width: 440, height: 430, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=440&h=430&q=80', rx: 14, ry: 14, crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
                // Info card 1 (date)
                { type: 'rect', left: 80, top: 1060, width: 280, height: 120, rx: 14, ry: 14, fill: '#F1F5F9', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Info card 2 (duration)
                { type: 'rect', left: 400, top: 1060, width: 280, height: 120, rx: 14, ry: 14, fill: '#F1F5F9', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Info card 3 (price)
                { type: 'rect', left: 720, top: 1060, width: 280, height: 120, rx: 14, ry: 14, fill: '#F1F5F9', originX: 'left', originY: 'top', selectable: false, evented: false },
                // CTA button background
                { type: 'rect', left: 320, top: 1590, width: 440, height: 70, rx: 35, ry: 35, fill: '#0084FF', originX: 'left', originY: 'top', selectable: true },
                // Footer background
                { type: 'rect', left: 0, top: 1740, width: 1080, height: 180, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Category
                { type: 'textbox', left: 80, top: 140, width: 920, text: 'PAKET PREMIUM UMRAH', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', charSpacing: 150, originX: 'left', originY: 'top', editable: true },
                // Title
                { type: 'textbox', left: 80, top: 190, width: 920, text: 'Umrah Premium Syawal 1447H', fontSize: 55, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#0F172A', lineHeight: 1.2, originX: 'left', originY: 'top', editable: true },
                // Description
                { type: 'textbox', left: 80, top: 358, width: 920, text: 'Nikmati pengalaman ibadah dengan fasilitas premium — hotel bintang 5 dan penerbangan langsung.', fontSize: 22, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#64748B', lineHeight: 1.4, originX: 'left', originY: 'top', editable: true },
                // Hotel label
                { type: 'textbox', left: 80, top: 946, width: 440, text: '🏨 Hotel Bintang 5 Makkah', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Airline label
                { type: 'textbox', left: 560, top: 946, width: 440, text: '✈ Penerbangan Langsung', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Card 1 text
                { type: 'textbox', left: 80, top: 1082, width: 280, text: 'Keberangkatan\n12 Okt 2026', fontSize: 22, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', textAlign: 'center', lineHeight: 1.3, originX: 'left', originY: 'top', editable: true },
                // Card 2 text
                { type: 'textbox', left: 400, top: 1082, width: 280, text: 'Durasi\n12 Hari', fontSize: 22, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', textAlign: 'center', lineHeight: 1.3, originX: 'left', originY: 'top', editable: true },
                // Card 3 text
                { type: 'textbox', left: 720, top: 1082, width: 280, text: 'Harga Mulai\nRp 32.5 Jt', fontSize: 22, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#F59E0B', textAlign: 'center', lineHeight: 1.3, originX: 'left', originY: 'top', editable: true },
                // Room pricing
                { type: 'textbox', left: 80, top: 1215, width: 920, text: 'Quad: Rp 32.500.000 | Triple: Rp 34.500.000 | Double: Rp 36.500.000', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#64748B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Feature bullet diamonds
                { type: 'textbox', left: 120, top: 1270, width: 34, text: '◆\n◆\n◆', fontSize: 13, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#F59E0B', textAlign: 'center', lineHeight: 2.46, originX: 'left', originY: 'top', editable: true },
                // Feature list
                { type: 'textbox', left: 166, top: 1270, width: 754, text: 'Hotel Makkah: Anjum / Setaraf (*5) & Madinah: Front Taiba (*5)\nTiket Pesawat Saudia Airlines Penerbangan Langsung Jeddah\nMuthawwif Pembimbing Ibadah & Air Zamzam 5L', fontSize: 22, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#0F172A', lineHeight: 1.6, originX: 'left', originY: 'top', editable: true },
                // CTA text
                { type: 'textbox', left: 320, top: 1611, width: 440, text: 'DAFTAR SEKARANG', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', textAlign: 'center', charSpacing: 100, originX: 'left', originY: 'top', editable: true },
                // Footer brand
                { type: 'textbox', left: 80, top: 1765, width: 320, text: 'ALFATIH DUNIA WISATA', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', originX: 'left', originY: 'top', editable: true },
                // Footer contact
                { type: 'textbox', left: 420, top: 1765, width: 580, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
                // Footer license
                { type: 'textbox', left: 80, top: 1825, width: 920, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 14, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
            ]
        }
    },
```

- [ ] **Step 3: Verify Task 2 templates**

In the Poster Maker, load "Hotel & Penerbangan (Post)" and "(Story)". Confirm:
- Two images render side by side
- Labels appear below each image
- 3 info cards render with date/duration/price
- Footer is injected correctly

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/PosterMaker/TemplatePanel.tsx
git commit -m "feat(poster): add hotel-airline conversion templates (post + story)"
```

---

## Task 3: Feature Grid templates

Shorter image, then a 2×2 card grid of package highlights. Price is one of the 4 grid cells.

**Files:**
- Modify: `src/components/admin/PosterMaker/TemplatePanel.tsx`

---

- [ ] **Step 1: Append `feature-grid-post-conversion`**

```typescript
    {
        id: 'feature-grid-post-conversion',
        name: 'Grid Fasilitas Umrah (Post)',
        description: 'Highlight 4 fasilitas utama dalam grid 2×2 termasuk harga. Mendukung AI Auto-Fill.',
        previewColors: ['#0084FF', '#F59E0B', '#F1F5F9'],
        aspectRatio: 'post',
        json: {
            version: '7.2.0',
            width: 1080,
            height: 1350,
            objects: [
                // Background
                { type: 'rect', left: 0, top: 0, width: 1080, height: 1350, fill: '#F8FAFC', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Top accent bar
                { type: 'rect', left: 0, top: 0, width: 1080, height: 15, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Gold divider
                { type: 'rect', left: 60, top: 245, width: 200, height: 4, fill: '#D4A373', originX: 'left', originY: 'top', selectable: true },
                // Main image (shorter)
                { type: 'image', left: 60, top: 340, width: 960, height: 280, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=960&h=280&q=80', rx: 12, ry: 12, crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
                // Grid card: Hotel (top-left)
                { type: 'rect', left: 60, top: 650, width: 460, height: 160, rx: 16, ry: 16, fill: '#F1F5F9', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Grid card: Airline (top-right)
                { type: 'rect', left: 560, top: 650, width: 460, height: 160, rx: 16, ry: 16, fill: '#F1F5F9', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Grid card: Duration (bottom-left)
                { type: 'rect', left: 60, top: 830, width: 460, height: 160, rx: 16, ry: 16, fill: '#F1F5F9', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Grid card: Price (bottom-right) — highlighted in blue tint
                { type: 'rect', left: 560, top: 830, width: 460, height: 160, rx: 16, ry: 16, fill: '#EFF6FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                // CTA button background
                { type: 'rect', left: 340, top: 1140, width: 400, height: 60, rx: 30, ry: 30, fill: '#0084FF', originX: 'left', originY: 'top', selectable: true },
                // Footer background
                { type: 'rect', left: 0, top: 1210, width: 1080, height: 140, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Category
                { type: 'textbox', left: 60, top: 100, width: 960, text: 'PAKET UMRAH LENGKAP', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', charSpacing: 150, originX: 'left', originY: 'top', editable: true },
                // Title
                { type: 'textbox', left: 60, top: 140, width: 960, text: 'Umrah Premium Syawal 1447H', fontSize: 50, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#0F172A', lineHeight: 1.2, originX: 'left', originY: 'top', editable: true },
                // Description
                { type: 'textbox', left: 60, top: 268, width: 960, text: 'Paket ibadah lengkap dengan fasilitas terbaik. Semua kebutuhan Anda selama perjalanan telah kami siapkan.', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#64748B', lineHeight: 1.4, originX: 'left', originY: 'top', editable: true },
                // Card Hotel: emoji
                { type: 'textbox', left: 60, top: 668, width: 460, text: '🕌', fontSize: 28, fontFamily: 'Plus Jakarta Sans, sans-serif', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Card Hotel: label
                { type: 'textbox', left: 60, top: 710, width: 460, text: 'Hotel', fontSize: 13, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#64748B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Card Hotel: value
                { type: 'textbox', left: 60, top: 730, width: 460, text: 'Anjum Makkah ★★★★★', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Card Airline: emoji
                { type: 'textbox', left: 560, top: 668, width: 460, text: '✈', fontSize: 28, fontFamily: 'Plus Jakarta Sans, sans-serif', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Card Airline: label
                { type: 'textbox', left: 560, top: 710, width: 460, text: 'Penerbangan', fontSize: 13, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#64748B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Card Airline: value
                { type: 'textbox', left: 560, top: 730, width: 460, text: 'Saudia Airlines Direct', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Card Duration: emoji
                { type: 'textbox', left: 60, top: 848, width: 460, text: '📅', fontSize: 28, fontFamily: 'Plus Jakarta Sans, sans-serif', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Card Duration: label
                { type: 'textbox', left: 60, top: 890, width: 460, text: 'Durasi', fontSize: 13, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#64748B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Card Duration: value
                { type: 'textbox', left: 60, top: 910, width: 460, text: '12 Hari', fontSize: 22, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Card Price: emoji
                { type: 'textbox', left: 560, top: 848, width: 460, text: '💰', fontSize: 28, fontFamily: 'Plus Jakarta Sans, sans-serif', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Card Price: label
                { type: 'textbox', left: 560, top: 890, width: 460, text: 'Harga Mulai', fontSize: 13, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#0084FF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Card Price: value
                { type: 'textbox', left: 560, top: 908, width: 460, text: 'Rp 32.5 Jt', fontSize: 28, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#0084FF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Room pricing
                { type: 'textbox', left: 60, top: 1022, width: 960, text: 'Quad: Rp 32.500.000 | Triple: Rp 34.500.000 | Double: Rp 36.500.000', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#64748B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // CTA text
                { type: 'textbox', left: 340, top: 1159, width: 400, text: 'DAFTAR SEKARANG', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', textAlign: 'center', charSpacing: 100, originX: 'left', originY: 'top', editable: true },
                // Footer brand
                { type: 'textbox', left: 60, top: 1235, width: 300, text: 'ALFATIH DUNIA WISATA', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', originX: 'left', originY: 'top', editable: true },
                // Footer contact
                { type: 'textbox', left: 380, top: 1235, width: 640, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
                // Footer license
                { type: 'textbox', left: 60, top: 1280, width: 960, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 12, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
            ]
        }
    },
```

- [ ] **Step 2: Append `feature-grid-story-conversion`**

```typescript
    {
        id: 'feature-grid-story-conversion',
        name: 'Grid Fasilitas Umrah (Story)',
        description: 'Highlight 4 fasilitas utama dalam grid 2×2 termasuk harga, format Story. Mendukung AI Auto-Fill.',
        previewColors: ['#0084FF', '#F59E0B', '#F1F5F9'],
        aspectRatio: 'story',
        json: {
            version: '7.2.0',
            width: 1080,
            height: 1920,
            objects: [
                // Background
                { type: 'rect', left: 0, top: 0, width: 1080, height: 1920, fill: '#F8FAFC', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Top accent bar
                { type: 'rect', left: 0, top: 0, width: 1080, height: 20, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Gold divider
                { type: 'rect', left: 80, top: 315, width: 250, height: 5, fill: '#D4A373', originX: 'left', originY: 'top', selectable: true },
                // Main image (shorter)
                { type: 'image', left: 80, top: 500, width: 920, height: 360, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=960&h=360&q=80', rx: 16, ry: 16, crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
                // Grid card: Hotel (top-left)
                { type: 'rect', left: 80, top: 900, width: 440, height: 190, rx: 18, ry: 18, fill: '#F1F5F9', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Grid card: Airline (top-right)
                { type: 'rect', left: 560, top: 900, width: 440, height: 190, rx: 18, ry: 18, fill: '#F1F5F9', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Grid card: Duration (bottom-left)
                { type: 'rect', left: 80, top: 1110, width: 440, height: 190, rx: 18, ry: 18, fill: '#F1F5F9', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Grid card: Price (bottom-right)
                { type: 'rect', left: 560, top: 1110, width: 440, height: 190, rx: 18, ry: 18, fill: '#EFF6FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                // CTA button background
                { type: 'rect', left: 320, top: 1590, width: 440, height: 70, rx: 35, ry: 35, fill: '#0084FF', originX: 'left', originY: 'top', selectable: true },
                // Footer background
                { type: 'rect', left: 0, top: 1740, width: 1080, height: 180, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Category
                { type: 'textbox', left: 80, top: 140, width: 920, text: 'PAKET UMRAH LENGKAP', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', charSpacing: 150, originX: 'left', originY: 'top', editable: true },
                // Title
                { type: 'textbox', left: 80, top: 190, width: 920, text: 'Umrah Premium Syawal 1447H', fontSize: 55, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#0F172A', lineHeight: 1.2, originX: 'left', originY: 'top', editable: true },
                // Description
                { type: 'textbox', left: 80, top: 358, width: 920, text: 'Paket ibadah lengkap dengan fasilitas terbaik. Semua kebutuhan Anda selama perjalanan telah kami siapkan.', fontSize: 22, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#64748B', lineHeight: 1.4, originX: 'left', originY: 'top', editable: true },
                // Hotel: emoji
                { type: 'textbox', left: 80, top: 918, width: 440, text: '🕌', fontSize: 32, fontFamily: 'Plus Jakarta Sans, sans-serif', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Hotel: label
                { type: 'textbox', left: 80, top: 964, width: 440, text: 'Hotel', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#64748B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Hotel: value
                { type: 'textbox', left: 80, top: 986, width: 440, text: 'Anjum Makkah ★★★★★', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Airline: emoji
                { type: 'textbox', left: 560, top: 918, width: 440, text: '✈', fontSize: 32, fontFamily: 'Plus Jakarta Sans, sans-serif', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Airline: label
                { type: 'textbox', left: 560, top: 964, width: 440, text: 'Penerbangan', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#64748B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Airline: value
                { type: 'textbox', left: 560, top: 986, width: 440, text: 'Saudia Airlines Direct', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Duration: emoji
                { type: 'textbox', left: 80, top: 1128, width: 440, text: '📅', fontSize: 32, fontFamily: 'Plus Jakarta Sans, sans-serif', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Duration: label
                { type: 'textbox', left: 80, top: 1174, width: 440, text: 'Durasi', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#64748B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Duration: value
                { type: 'textbox', left: 80, top: 1196, width: 440, text: '12 Hari', fontSize: 26, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Price: emoji
                { type: 'textbox', left: 560, top: 1128, width: 440, text: '💰', fontSize: 32, fontFamily: 'Plus Jakarta Sans, sans-serif', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Price: label
                { type: 'textbox', left: 560, top: 1174, width: 440, text: 'Harga Mulai', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#0084FF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Price: value
                { type: 'textbox', left: 560, top: 1192, width: 440, text: 'Rp 32.5 Jt', fontSize: 32, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#0084FF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Room pricing
                { type: 'textbox', left: 80, top: 1342, width: 920, text: 'Quad: Rp 32.500.000 | Triple: Rp 34.500.000 | Double: Rp 36.500.000', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#64748B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // CTA text
                { type: 'textbox', left: 320, top: 1611, width: 440, text: 'DAFTAR SEKARANG', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', textAlign: 'center', charSpacing: 100, originX: 'left', originY: 'top', editable: true },
                // Footer brand
                { type: 'textbox', left: 80, top: 1765, width: 320, text: 'ALFATIH DUNIA WISATA', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', originX: 'left', originY: 'top', editable: true },
                // Footer contact
                { type: 'textbox', left: 420, top: 1765, width: 580, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
                // Footer license
                { type: 'textbox', left: 80, top: 1825, width: 920, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 14, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
            ]
        }
    },
```

- [ ] **Step 3: Verify Task 3 templates**

Load "Grid Fasilitas Umrah (Post)" and "(Story)". Confirm:
- Shorter image above the grid
- 2×2 grid of cards with emoji + label + value
- Price card rendered in blue tint (`#EFF6FF`) with blue text
- Room pricing line below grid
- Footer injected

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/PosterMaker/TemplatePanel.tsx
git commit -m "feat(poster): add feature-grid conversion templates (post + story)"
```

---

## Task 4: Departure Focus templates

Large departure date as the hero stat. Best for packages where the season (e.g. Syawal) is the primary hook.

**Files:**
- Modify: `src/components/admin/PosterMaker/TemplatePanel.tsx`

---

- [ ] **Step 1: Append `departure-focus-post-conversion`**

```typescript
    {
        id: 'departure-focus-post-conversion',
        name: 'Fokus Keberangkatan (Post)',
        description: 'Tanggal keberangkatan besar sebagai focal point utama. Mendukung AI Auto-Fill.',
        previewColors: ['#0084FF', '#F59E0B', '#0F172A'],
        aspectRatio: 'post',
        json: {
            version: '7.2.0',
            width: 1080,
            height: 1350,
            objects: [
                // Background
                { type: 'rect', left: 0, top: 0, width: 1080, height: 1350, fill: '#F8FAFC', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Top accent bar
                { type: 'rect', left: 0, top: 0, width: 1080, height: 15, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Gold divider
                { type: 'rect', left: 60, top: 218, width: 200, height: 4, fill: '#D4A373', originX: 'left', originY: 'top', selectable: true },
                // Main image (taller)
                { type: 'image', left: 60, top: 310, width: 960, height: 415, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=960&h=415&q=80', rx: 12, ry: 12, crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
                // Date banner separator line
                { type: 'rect', left: 60, top: 744, width: 960, height: 2, fill: '#E2E8F0', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Price card background
                { type: 'rect', left: 60, top: 880, width: 455, height: 100, rx: 12, ry: 12, fill: '#F1F5F9', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Duration card background
                { type: 'rect', left: 565, top: 880, width: 455, height: 100, rx: 12, ry: 12, fill: '#F1F5F9', originX: 'left', originY: 'top', selectable: false, evented: false },
                // CTA button background
                { type: 'rect', left: 340, top: 1140, width: 400, height: 60, rx: 30, ry: 30, fill: '#0084FF', originX: 'left', originY: 'top', selectable: true },
                // Footer background
                { type: 'rect', left: 0, top: 1210, width: 1080, height: 140, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Category
                { type: 'textbox', left: 60, top: 100, width: 960, text: 'UMRAH REGULER', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', charSpacing: 150, originX: 'left', originY: 'top', editable: true },
                // Title
                { type: 'textbox', left: 60, top: 138, width: 960, text: 'Umrah Premium Syawal 1447H', fontSize: 46, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#0F172A', lineHeight: 1.2, originX: 'left', originY: 'top', editable: true },
                // Description (1 line)
                { type: 'textbox', left: 60, top: 240, width: 960, text: 'Bergabunglah bersama ribuan jamaah berpengalaman dalam perjalanan ibadah Umrah terbaik.', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#64748B', lineHeight: 1.4, originX: 'left', originY: 'top', editable: true },
                // Date label left: "KEBERANGKATAN"
                { type: 'textbox', left: 60, top: 762, width: 220, text: 'KEBERANGKATAN', fontSize: 11, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#F59E0B', charSpacing: 120, originX: 'left', originY: 'top', editable: true },
                // Date label left sub: season
                { type: 'textbox', left: 60, top: 782, width: 220, text: 'Syawal 1447H', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#64748B', originX: 'left', originY: 'top', editable: true },
                // Big date: center
                { type: 'textbox', left: 248, top: 750, width: 584, text: '12 OKT 2026', fontSize: 72, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#0F172A', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Date label right: "TAHUN HIJRIYAH" (right-aligned)
                { type: 'textbox', left: 800, top: 762, width: 220, text: 'TAHUN HIJRIYAH', fontSize: 11, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#F59E0B', charSpacing: 80, textAlign: 'right', originX: 'left', originY: 'top', editable: true },
                // Price card text
                { type: 'textbox', left: 60, top: 900, width: 455, text: 'Harga Mulai\nRp 32.5 Jt', fontSize: 24, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#F59E0B', textAlign: 'center', lineHeight: 1.3, originX: 'left', originY: 'top', editable: true },
                // Duration card text
                { type: 'textbox', left: 565, top: 900, width: 455, text: 'Durasi\n12 Hari', fontSize: 24, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', textAlign: 'center', lineHeight: 1.3, originX: 'left', originY: 'top', editable: true },
                // Room pricing
                { type: 'textbox', left: 60, top: 1006, width: 960, text: 'Quad: Rp 32.500.000 | Triple: Rp 34.500.000 | Double: Rp 36.500.000', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#64748B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Feature bullet diamonds
                { type: 'textbox', left: 100, top: 1048, width: 30, text: '◆\n◆\n◆', fontSize: 12, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#F59E0B', textAlign: 'center', lineHeight: 2.3, originX: 'left', originY: 'top', editable: true },
                // Feature list
                { type: 'textbox', left: 142, top: 1048, width: 838, text: 'Hotel Makkah & Madinah Bintang 5 dekat Masjidil Haram\nTiket Pesawat Saudia Airlines direct Jeddah\nMuthawwif Pembimbing & Air Zamzam 5L', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#0F172A', lineHeight: 1.5, originX: 'left', originY: 'top', editable: true },
                // CTA text
                { type: 'textbox', left: 340, top: 1159, width: 400, text: 'DAFTAR SEKARANG', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', textAlign: 'center', charSpacing: 100, originX: 'left', originY: 'top', editable: true },
                // Footer brand
                { type: 'textbox', left: 60, top: 1235, width: 300, text: 'ALFATIH DUNIA WISATA', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', originX: 'left', originY: 'top', editable: true },
                // Footer contact
                { type: 'textbox', left: 380, top: 1235, width: 640, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
                // Footer license
                { type: 'textbox', left: 60, top: 1280, width: 960, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 12, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
            ]
        }
    },
```

- [ ] **Step 2: Append `departure-focus-story-conversion`**

```typescript
    {
        id: 'departure-focus-story-conversion',
        name: 'Fokus Keberangkatan (Story)',
        description: 'Tanggal keberangkatan besar sebagai focal point utama, format Story. Mendukung AI Auto-Fill.',
        previewColors: ['#0084FF', '#F59E0B', '#0F172A'],
        aspectRatio: 'story',
        json: {
            version: '7.2.0',
            width: 1080,
            height: 1920,
            objects: [
                // Background
                { type: 'rect', left: 0, top: 0, width: 1080, height: 1920, fill: '#F8FAFC', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Top accent bar
                { type: 'rect', left: 0, top: 0, width: 1080, height: 20, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Gold divider
                { type: 'rect', left: 80, top: 300, width: 250, height: 5, fill: '#D4A373', originX: 'left', originY: 'top', selectable: true },
                // Main image (taller)
                { type: 'image', left: 80, top: 450, width: 920, height: 520, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=960&h=520&q=80', rx: 16, ry: 16, crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
                // Date banner separator line
                { type: 'rect', left: 80, top: 1000, width: 920, height: 2, fill: '#E2E8F0', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Price card background
                { type: 'rect', left: 80, top: 1145, width: 440, height: 120, rx: 14, ry: 14, fill: '#F1F5F9', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Duration card background
                { type: 'rect', left: 560, top: 1145, width: 440, height: 120, rx: 14, ry: 14, fill: '#F1F5F9', originX: 'left', originY: 'top', selectable: false, evented: false },
                // CTA button background
                { type: 'rect', left: 320, top: 1590, width: 440, height: 70, rx: 35, ry: 35, fill: '#0084FF', originX: 'left', originY: 'top', selectable: true },
                // Footer background
                { type: 'rect', left: 0, top: 1740, width: 1080, height: 180, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                // Category
                { type: 'textbox', left: 80, top: 140, width: 920, text: 'UMRAH REGULER', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', charSpacing: 150, originX: 'left', originY: 'top', editable: true },
                // Title
                { type: 'textbox', left: 80, top: 186, width: 920, text: 'Umrah Premium Syawal 1447H', fontSize: 52, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#0F172A', lineHeight: 1.2, originX: 'left', originY: 'top', editable: true },
                // Description
                { type: 'textbox', left: 80, top: 322, width: 920, text: 'Bergabunglah bersama ribuan jamaah berpengalaman dalam perjalanan ibadah Umrah terbaik.', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#64748B', lineHeight: 1.4, originX: 'left', originY: 'top', editable: true },
                // Date label left
                { type: 'textbox', left: 80, top: 1018, width: 240, text: 'KEBERANGKATAN', fontSize: 13, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#F59E0B', charSpacing: 100, originX: 'left', originY: 'top', editable: true },
                // Date label left sub
                { type: 'textbox', left: 80, top: 1042, width: 240, text: 'Syawal 1447H', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#64748B', originX: 'left', originY: 'top', editable: true },
                // Big date center
                { type: 'textbox', left: 278, top: 1005, width: 524, text: '12 OKT 2026', fontSize: 82, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#0F172A', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Date label right
                { type: 'textbox', left: 760, top: 1018, width: 240, text: 'TAHUN HIJRIYAH', fontSize: 13, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#F59E0B', charSpacing: 60, textAlign: 'right', originX: 'left', originY: 'top', editable: true },
                // Price card text
                { type: 'textbox', left: 80, top: 1168, width: 440, text: 'Harga Mulai\nRp 32.5 Jt', fontSize: 28, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#F59E0B', textAlign: 'center', lineHeight: 1.3, originX: 'left', originY: 'top', editable: true },
                // Duration card text
                { type: 'textbox', left: 560, top: 1168, width: 440, text: 'Durasi\n12 Hari', fontSize: 28, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#0F172A', textAlign: 'center', lineHeight: 1.3, originX: 'left', originY: 'top', editable: true },
                // Room pricing
                { type: 'textbox', left: 80, top: 1300, width: 920, text: 'Quad: Rp 32.500.000 | Triple: Rp 34.500.000 | Double: Rp 36.500.000', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#64748B', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
                // Feature bullet diamonds
                { type: 'textbox', left: 120, top: 1356, width: 34, text: '◆\n◆\n◆', fontSize: 13, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#F59E0B', textAlign: 'center', lineHeight: 2.46, originX: 'left', originY: 'top', editable: true },
                // Feature list
                { type: 'textbox', left: 166, top: 1356, width: 754, text: 'Hotel Makkah & Madinah Bintang 5 dekat Masjidil Haram\nTiket Pesawat Saudia Airlines direct Jeddah\nMuthawwif Pembimbing & Air Zamzam 5L', fontSize: 22, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#0F172A', lineHeight: 1.6, originX: 'left', originY: 'top', editable: true },
                // CTA text
                { type: 'textbox', left: 320, top: 1611, width: 440, text: 'DAFTAR SEKARANG', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', textAlign: 'center', charSpacing: 100, originX: 'left', originY: 'top', editable: true },
                // Footer brand
                { type: 'textbox', left: 80, top: 1765, width: 320, text: 'ALFATIH DUNIA WISATA', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', originX: 'left', originY: 'top', editable: true },
                // Footer contact
                { type: 'textbox', left: 420, top: 1765, width: 580, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
                // Footer license
                { type: 'textbox', left: 80, top: 1825, width: 920, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 14, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
            ]
        }
    },
```

- [ ] **Step 3: Verify Task 4 templates**

Load "Fokus Keberangkatan (Post)" and "(Story)". Confirm:
- Taller image fills more vertical space
- "12 OKT 2026" renders large and centered between the flanking labels
- "KEBERANGKATAN" and "TAHUN HIJRIYAH" small labels appear on each side
- 2-column price/duration cards visible
- Footer injected

- [ ] **Step 4: Final commit**

```bash
git add src/components/admin/PosterMaker/TemplatePanel.tsx
git commit -m "feat(poster): add departure-focus conversion templates (post + story)"
```

---

## Self-Review

**Spec coverage:**
- ✅ 4 designs × 2 aspect ratios = 8 templates
- ✅ All IDs contain `conversion` → `getTemplateType()` returns `'conversion'`
- ✅ Footer contact text contains `|` and `.com` → `injectFooterData()` replaces it
- ✅ Footer license text contains `PPIU` and `Penyelenggara` → `injectFooterData()` replaces it
- ✅ All templates use `crossOrigin: 'anonymous'` on images (required for thumbnail)
- ✅ Single file change only (`TemplatePanel.tsx`)
- ✅ Design 1: price discount with strikethrough, HEMAT badge, urgency
- ✅ Design 2: two images side-by-side with labels + 3 info cards
- ✅ Design 3: 2×2 feature grid, price cell in blue tint
- ✅ Design 4: large date banner as hero stat + 2-col cards

**Placeholder scan:** None found.

**Type consistency:** All `PosterTemplate` fields (`id`, `name`, `description`, `previewColors`, `aspectRatio`, `json`) are present in every object. `BASE_TEMPLATES` receives 8 new entries. `buildStarterTemplates()` and `injectFooterData()` require no changes.
