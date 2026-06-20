# Poster Template Types & Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three new poster template types (Tour Promotion, Documentation, Content) with 6 new Fabric.js canvas templates, and add a type pill-filter row to the template panel.

**Architecture:** All changes live in a single file — `TemplatePanel.tsx`. The `PosterTemplate` interface gains a `type` field; all 10 existing templates get `type: 'Conversion'`; 6 new templates are appended to `BASE_TEMPLATES`; the `TemplatePanel` component gains local filter state and a pill row that filters before the Post/Story split.

**Tech Stack:** React, TypeScript, Fabric.js v7 (canvas JSON format), Tailwind CSS (CDN)

## Global Constraints

- Font: `Plus Jakarta Sans, sans-serif` — used in every textbox `fontFamily` value
- Colors: `#0084FF` blue, `#F59E0B` amber, `#D4A373` warm gold, `#0F172A` dark navy, `#64748B` slate, `#94A3B8` light slate, `#F8FAFC` off-white, `#F1F5F9` card bg, `#FFFFFF` white
- Footer text injected at runtime via `injectFooterData` — any textbox whose `text` contains `|` and `@` or `.com` becomes the contact line; any textbox whose `text` contains `Penyelenggara` or `No. Izin` becomes the license line
- Canvas sizes: Post = 1080 × 1350 px, Story = 1080 × 1920 px
- Tailwind: CDN-based — do NOT add PostCSS classes not already in use in the file
- All content in Bahasa Indonesia

---

## File Map

| File | Change |
|---|---|
| `src/components/admin/PosterMaker/TemplatePanel.tsx` | All changes — type, interface, templates, filter UI |

---

### Task 1: Add `TemplateType` and update `PosterTemplate` interface + mark all existing templates

**Files:**
- Modify: `src/components/admin/PosterMaker/TemplatePanel.tsx:6-13` (interface block)
- Modify: `src/components/admin/PosterMaker/TemplatePanel.tsx:83-1028` (10 existing template objects)

**Interfaces:**
- Produces: `TemplateType` union type, `PosterTemplate.type` field used by Tasks 2–5

- [ ] **Step 1: Add `TemplateType` type above the `PosterTemplate` interface**

In `TemplatePanel.tsx`, find the line `export interface PosterTemplate {` (line ~6) and add the type immediately before it:

```ts
export type TemplateType = 'Conversion' | 'Tour Promotion' | 'Documentation' | 'Content';

export interface PosterTemplate {
    id: string;
    name: string;
    description: string;
    type: TemplateType;
    previewColors: [string, string, string];
    aspectRatio: 'post' | 'story';
    json: object;
}
```

- [ ] **Step 2: Add `type: 'Conversion'` to all 10 existing templates**

Each template in `BASE_TEMPLATES` starts with `{ id: '...', name: '...', description: '...',`. Add `type: 'Conversion',` after `description`:

Templates to update (by id):
- `brochure-post-conversion`
- `brochure-story-conversion`
- `promo-post-conversion`
- `promo-story-conversion`
- `hotel-airline-post-conversion`
- `hotel-airline-story-conversion`
- `feature-grid-post-conversion`
- `feature-grid-story-conversion`
- `departure-focus-post-conversion`
- `departure-focus-story-conversion`

For each, the diff looks like:

```ts
// before
{
    id: 'brochure-post-conversion',
    name: 'Brosur Paket Umrah (Post)',
    description: 'Brosur promosi paket Umrah ...',
    previewColors: ['#0084FF', '#D4A373', '#F8FAFC'],

// after
{
    id: 'brochure-post-conversion',
    name: 'Brosur Paket Umrah (Post)',
    description: 'Brosur promosi paket Umrah ...',
    type: 'Conversion',
    previewColors: ['#0084FF', '#D4A373', '#F8FAFC'],
```

- [ ] **Step 3: Start dev server and verify TypeScript compiles**

```bash
npm run dev
```

Expected: No TypeScript errors in terminal. Browser opens `http://localhost:3000`. Navigate to Admin → Poster Maker → Templates panel. All 10 existing templates still appear.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/PosterMaker/TemplatePanel.tsx
git commit -m "feat(poster): add TemplateType and type field to PosterTemplate interface"
```

---

### Task 2: Add Tour Promotion templates (Post + Story)

**Files:**
- Modify: `src/components/admin/PosterMaker/TemplatePanel.tsx` — append 2 objects to `BASE_TEMPLATES`

**Interfaces:**
- Consumes: `TemplateType` from Task 1
- Produces: templates `tour-promo-post` and `tour-promo-story` in `BASE_TEMPLATES`

**Layout description:**
- Amber top accent bar
- Header: category label ("DESTINASI PILIHAN"), title ("Madinah Al-Munawwarah"), gold divider, description tagline
- Full-bleed Kaabah image below header
- Dark overlay on bottom of image with white text tagline
- Blue footer bar with brand + contact (injected by `injectFooterData`)

- [ ] **Step 1: Append Tour Promotion Post to `BASE_TEMPLATES`**

Add the following object at the end of `BASE_TEMPLATES` (before the closing `]`):

```ts
{
    id: 'tour-promo-post',
    name: 'Destinasi Pilihan (Post)',
    description: 'Showcase destinasi dengan foto dramatis dan tagline editorial. Tanpa harga atau CTA.',
    type: 'Tour Promotion',
    previewColors: ['#0F172A', '#F59E0B', '#D4A373'],
    aspectRatio: 'post',
    json: {
        version: '7.2.0',
        width: 1080,
        height: 1350,
        objects: [
            // Background
            { type: 'rect', left: 0, top: 0, width: 1080, height: 1350, fill: '#F8FAFC', originX: 'left', originY: 'top', selectable: false, evented: false },
            // Full-bleed image
            { type: 'image', left: 0, top: 270, width: 1080, height: 940, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1080&h=940&q=80', crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
            // Dark overlay on bottom of image (for tagline readability)
            { type: 'rect', left: 0, top: 970, width: 1080, height: 240, fill: '#0F172A', opacity: 0.80, originX: 'left', originY: 'top', selectable: false, evented: false },
            // Top amber accent bar (renders over image top edge)
            { type: 'rect', left: 0, top: 0, width: 1080, height: 14, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
            // Gold divider under header text
            { type: 'rect', left: 80, top: 212, width: 200, height: 4, fill: '#D4A373', originX: 'left', originY: 'top', selectable: true },
            // Footer background
            { type: 'rect', left: 0, top: 1210, width: 1080, height: 140, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
            // Category label
            { type: 'textbox', left: 80, top: 80, width: 920, text: 'DESTINASI PILIHAN', fontSize: 14, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', charSpacing: 180, originX: 'left', originY: 'top', editable: true },
            // Title
            { type: 'textbox', left: 80, top: 112, width: 920, text: 'Madinah Al-Munawwarah', fontSize: 52, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#0F172A', lineHeight: 1.15, originX: 'left', originY: 'top', editable: true },
            // Description
            { type: 'textbox', left: 80, top: 228, width: 920, text: 'Kota cahaya yang menyejukkan hati setiap hamba yang rindu kepada-Nya.', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#64748B', lineHeight: 1.4, originX: 'left', originY: 'top', editable: true },
            // Tagline on dark overlay
            { type: 'textbox', left: 80, top: 988, width: 920, text: 'Kota Cahaya yang Menyejukkan Hati', fontSize: 32, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', lineHeight: 1.2, originX: 'left', originY: 'top', editable: true },
            // Sub-tagline on overlay
            { type: 'textbox', left: 80, top: 1042, width: 920, text: 'Rasakan ketenangan beribadah bersama ribuan jamaah terpilih Alfatih Dunia Wisata.', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#CBD5E1', lineHeight: 1.4, originX: 'left', originY: 'top', editable: true },
            // Amber highlight on overlay
            { type: 'rect', left: 80, top: 1130, width: 120, height: 4, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
            // Footer brand
            { type: 'textbox', left: 60, top: 1235, width: 300, text: 'ALFATIH DUNIA WISATA', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', originX: 'left', originY: 'top', editable: true },
            // Footer contact (injected by injectFooterData)
            { type: 'textbox', left: 380, top: 1235, width: 640, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
            // Footer license (injected by injectFooterData)
            { type: 'textbox', left: 60, top: 1280, width: 960, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 12, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
        ]
    }
},
```

- [ ] **Step 2: Append Tour Promotion Story to `BASE_TEMPLATES`**

```ts
{
    id: 'tour-promo-story',
    name: 'Destinasi Pilihan (Story)',
    description: 'Showcase destinasi dengan foto dramatis dan tagline editorial, format Story. Tanpa harga atau CTA.',
    type: 'Tour Promotion',
    previewColors: ['#0F172A', '#F59E0B', '#D4A373'],
    aspectRatio: 'story',
    json: {
        version: '7.2.0',
        width: 1080,
        height: 1920,
        objects: [
            // Background
            { type: 'rect', left: 0, top: 0, width: 1080, height: 1920, fill: '#F8FAFC', originX: 'left', originY: 'top', selectable: false, evented: false },
            // Full-bleed image (from below header to footer)
            { type: 'image', left: 0, top: 320, width: 1080, height: 1420, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1080&h=1420&q=80', crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
            // Dark overlay on bottom of image
            { type: 'rect', left: 0, top: 1390, width: 1080, height: 350, fill: '#0F172A', opacity: 0.82, originX: 'left', originY: 'top', selectable: false, evented: false },
            // Top amber accent bar
            { type: 'rect', left: 0, top: 0, width: 1080, height: 20, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
            // Gold divider under header text
            { type: 'rect', left: 80, top: 290, width: 220, height: 5, fill: '#D4A373', originX: 'left', originY: 'top', selectable: true },
            // Footer background
            { type: 'rect', left: 0, top: 1740, width: 1080, height: 180, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
            // Category label
            { type: 'textbox', left: 80, top: 110, width: 920, text: 'DESTINASI PILIHAN', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', charSpacing: 180, originX: 'left', originY: 'top', editable: true },
            // Title
            { type: 'textbox', left: 80, top: 148, width: 920, text: 'Madinah Al-Munawwarah', fontSize: 62, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#0F172A', lineHeight: 1.15, originX: 'left', originY: 'top', editable: true },
            // Description
            { type: 'textbox', left: 80, top: 308, width: 920, text: 'Kota cahaya yang menyejukkan hati setiap hamba yang rindu kepada-Nya.', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#64748B', lineHeight: 1.4, originX: 'left', originY: 'top', editable: true },
            // Tagline on dark overlay
            { type: 'textbox', left: 80, top: 1408, width: 920, text: 'Kota Cahaya yang Menyejukkan Hati', fontSize: 42, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', lineHeight: 1.2, originX: 'left', originY: 'top', editable: true },
            // Sub-tagline on overlay
            { type: 'textbox', left: 80, top: 1472, width: 920, text: 'Rasakan ketenangan beribadah bersama ribuan jamaah terpilih Alfatih Dunia Wisata.', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#CBD5E1', lineHeight: 1.4, originX: 'left', originY: 'top', editable: true },
            // Amber highlight on overlay
            { type: 'rect', left: 80, top: 1612, width: 140, height: 5, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
            // Footer brand
            { type: 'textbox', left: 80, top: 1770, width: 320, text: 'ALFATIH DUNIA WISATA', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', originX: 'left', originY: 'top', editable: true },
            // Footer contact (injected)
            { type: 'textbox', left: 420, top: 1770, width: 580, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
            // Footer license (injected)
            { type: 'textbox', left: 80, top: 1844, width: 920, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 14, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
        ]
    }
},
```

- [ ] **Step 3: Verify in browser**

Dev server should still be running. Refresh the Templates panel. Confirm:
- Two new "Destinasi Pilihan" cards appear under Post and Story groups
- Thumbnails render with the dark image + amber/gold treatment
- Clicking a card loads the template onto canvas without errors in console

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/PosterMaker/TemplatePanel.tsx
git commit -m "feat(poster): add Tour Promotion templates (post + story)"
```

---

### Task 3: Add Documentation templates (Post + Story)

**Files:**
- Modify: `src/components/admin/PosterMaker/TemplatePanel.tsx` — append 2 objects to `BASE_TEMPLATES`

**Interfaces:**
- Consumes: `TemplateType` from Task 1
- Produces: templates `documentation-post` and `documentation-story`

**Layout description — Post:**
- Left half: tall trip photo (edge-to-edge, full height)
- Amber vertical separator (4 px)
- Right half: white panel with large decorative `❝`, quote text, star rating, divider, jamaah name + trip info
- Blue footer bar

**Layout description — Story:**
- Top half: full-width trip photo with dark overlay at bottom
- Category + title text on photo overlay
- Bottom half: white testimonial area with quote, stars, name
- Blue footer

- [ ] **Step 1: Append Documentation Post to `BASE_TEMPLATES`**

```ts
{
    id: 'documentation-post',
    name: 'Testimonial Jamaah (Post)',
    description: 'Kisah perjalanan jamaah — foto di kiri, kutipan testimoni di kanan. Tanpa harga.',
    type: 'Documentation',
    previewColors: ['#F59E0B', '#0F172A', '#FFFFFF'],
    aspectRatio: 'post',
    json: {
        version: '7.2.0',
        width: 1080,
        height: 1350,
        objects: [
            // Background (white for right panel)
            { type: 'rect', left: 0, top: 0, width: 1080, height: 1350, fill: '#FFFFFF', originX: 'left', originY: 'top', selectable: false, evented: false },
            // Left photo (tall, edge-to-edge from top to footer)
            { type: 'image', left: 0, top: 0, width: 510, height: 1210, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=510&h=1210&q=80', crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
            // Right panel background (ensure white even if canvas bg changes)
            { type: 'rect', left: 514, top: 0, width: 566, height: 1210, fill: '#FFFFFF', originX: 'left', originY: 'top', selectable: false, evented: false },
            // Amber vertical separator
            { type: 'rect', left: 510, top: 0, width: 4, height: 1210, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
            // Top amber accent bar (renders over photo top)
            { type: 'rect', left: 0, top: 0, width: 1080, height: 14, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
            // Gold decorative divider in right column
            { type: 'rect', left: 540, top: 148, width: 200, height: 3, fill: '#D4A373', originX: 'left', originY: 'top', selectable: false, evented: false },
            // Amber divider between quote and name
            { type: 'rect', left: 540, top: 560, width: 220, height: 3, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
            // Footer background
            { type: 'rect', left: 0, top: 1210, width: 1080, height: 140, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
            // Right column: category
            { type: 'textbox', left: 540, top: 70, width: 500, text: 'KISAH JAMAAH', fontSize: 13, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', charSpacing: 180, originX: 'left', originY: 'top', editable: true },
            // Right column: title
            { type: 'textbox', left: 540, top: 98, width: 500, text: 'Cerita dari Tanah Suci', fontSize: 32, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#0F172A', lineHeight: 1.2, originX: 'left', originY: 'top', editable: true },
            // Large decorative quote mark
            { type: 'textbox', left: 536, top: 162, width: 520, text: '❝', fontSize: 90, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', lineHeight: 1, originX: 'left', originY: 'top', editable: false },
            // Quote text
            { type: 'textbox', left: 540, top: 270, width: 500, text: 'Subhanallah, perjalanan umrah bersama Alfatih sangat luar biasa. Pembimbing ibadah yang sabar, hotel dekat Masjidil Haram, dan pelayanan yang penuh kasih. InsyaAllah kami ingin kembali.', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#0F172A', lineHeight: 1.55, originX: 'left', originY: 'top', editable: true },
            // Star rating
            { type: 'textbox', left: 540, top: 524, width: 500, text: '⭐⭐⭐⭐⭐', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '400', fill: '#F59E0B', originX: 'left', originY: 'top', editable: true },
            // Jamaah name
            { type: 'textbox', left: 540, top: 578, width: 500, text: 'Ibu Sari Wulandari', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#F59E0B', originX: 'left', originY: 'top', editable: true },
            // Package name
            { type: 'textbox', left: 540, top: 612, width: 500, text: 'Umrah Premium Syawal 1447H', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#64748B', originX: 'left', originY: 'top', editable: true },
            // Trip date
            { type: 'textbox', left: 540, top: 638, width: 500, text: '12 – 24 Oktober 2026', fontSize: 14, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '400', fill: '#94A3B8', originX: 'left', originY: 'top', editable: true },
            // Footer brand
            { type: 'textbox', left: 60, top: 1235, width: 300, text: 'ALFATIH DUNIA WISATA', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', originX: 'left', originY: 'top', editable: true },
            // Footer contact (injected)
            { type: 'textbox', left: 380, top: 1235, width: 640, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
            // Footer license (injected)
            { type: 'textbox', left: 60, top: 1280, width: 960, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 12, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
        ]
    }
},
```

- [ ] **Step 2: Append Documentation Story to `BASE_TEMPLATES`**

```ts
{
    id: 'documentation-story',
    name: 'Testimonial Jamaah (Story)',
    description: 'Kisah perjalanan jamaah — foto besar di atas, kutipan testimoni di bawah, format Story.',
    type: 'Documentation',
    previewColors: ['#F59E0B', '#0F172A', '#FFFFFF'],
    aspectRatio: 'story',
    json: {
        version: '7.2.0',
        width: 1080,
        height: 1920,
        objects: [
            // Background
            { type: 'rect', left: 0, top: 0, width: 1080, height: 1920, fill: '#FFFFFF', originX: 'left', originY: 'top', selectable: false, evented: false },
            // Full-width trip photo (top half)
            { type: 'image', left: 0, top: 0, width: 1080, height: 960, scaleX: 1, scaleY: 1, src: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1080&h=960&q=80', crossOrigin: 'anonymous', originX: 'left', originY: 'top', selectable: true },
            // Dark overlay bottom of photo
            { type: 'rect', left: 0, top: 820, width: 1080, height: 140, fill: '#0F172A', opacity: 0.72, originX: 'left', originY: 'top', selectable: false, evented: false },
            // Top amber accent bar
            { type: 'rect', left: 0, top: 0, width: 1080, height: 20, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
            // Amber horizontal separator between photo and testimonial
            { type: 'rect', left: 0, top: 960, width: 1080, height: 6, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
            // Amber divider between quote and name
            { type: 'rect', left: 80, top: 1430, width: 280, height: 4, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
            // Footer background
            { type: 'rect', left: 0, top: 1740, width: 1080, height: 180, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
            // Photo overlay: category
            { type: 'textbox', left: 80, top: 832, width: 920, text: 'KISAH JAMAAH', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', charSpacing: 180, originX: 'left', originY: 'top', editable: true },
            // Photo overlay: title
            { type: 'textbox', left: 80, top: 864, width: 920, text: 'Cerita dari Tanah Suci', fontSize: 36, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', originX: 'left', originY: 'top', editable: true },
            // Large decorative quote mark
            { type: 'textbox', left: 76, top: 988, width: 920, text: '❝', fontSize: 100, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', lineHeight: 1, originX: 'left', originY: 'top', editable: false },
            // Quote text
            { type: 'textbox', left: 80, top: 1112, width: 920, text: 'Subhanallah, perjalanan umrah bersama Alfatih sangat luar biasa. Pembimbing ibadah yang sabar, hotel dekat Masjidil Haram, dan pelayanan yang penuh kasih sayang. InsyaAllah kami ingin kembali bersama keluarga.', fontSize: 26, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#0F172A', lineHeight: 1.6, originX: 'left', originY: 'top', editable: true },
            // Star rating
            { type: 'textbox', left: 80, top: 1390, width: 920, text: '⭐⭐⭐⭐⭐', fontSize: 22, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '400', fill: '#F59E0B', originX: 'left', originY: 'top', editable: true },
            // Jamaah name
            { type: 'textbox', left: 80, top: 1450, width: 920, text: 'Ibu Sari Wulandari', fontSize: 24, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#F59E0B', originX: 'left', originY: 'top', editable: true },
            // Package name
            { type: 'textbox', left: 80, top: 1492, width: 920, text: 'Umrah Premium Syawal 1447H', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#64748B', originX: 'left', originY: 'top', editable: true },
            // Trip date
            { type: 'textbox', left: 80, top: 1526, width: 920, text: '12 – 24 Oktober 2026', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '400', fill: '#94A3B8', originX: 'left', originY: 'top', editable: true },
            // Footer brand
            { type: 'textbox', left: 80, top: 1770, width: 320, text: 'ALFATIH DUNIA WISATA', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', originX: 'left', originY: 'top', editable: true },
            // Footer contact (injected)
            { type: 'textbox', left: 420, top: 1770, width: 580, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '700', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
            // Footer license (injected)
            { type: 'textbox', left: 80, top: 1844, width: 920, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 14, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
        ]
    }
},
```

- [ ] **Step 3: Verify in browser**

Refresh Templates panel. Confirm:
- Two "Testimonial Jamaah" cards appear under Post and Story groups
- Post thumbnail shows split-panel layout (dark left, white right)
- Story thumbnail shows stacked photo + white testimonial block
- Loading either onto canvas works without console errors

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/PosterMaker/TemplatePanel.tsx
git commit -m "feat(poster): add Documentation templates (post + story)"
```

---

### Task 4: Add Content templates (Post + Story)

**Files:**
- Modify: `src/components/admin/PosterMaker/TemplatePanel.tsx` — append 2 objects to `BASE_TEMPLATES`

**Interfaces:**
- Consumes: `TemplateType` from Task 1
- Produces: templates `content-post` and `content-story`

**Layout description:**
- Full dark navy `#0F172A` background (intentional visual contrast vs. light conversion templates)
- Thin amber top + bottom accent bars — no full blue footer (brand info is minimal, in the dark area)
- Large amber tip number `01` (150–160 px) as dominant visual anchor
- Gold `#D4A373` separator below the number
- White tip title in large bold
- Light slate `#94A3B8` body text
- Small amber brand name + slate contact below content

- [ ] **Step 1: Append Content Post to `BASE_TEMPLATES`**

```ts
{
    id: 'content-post',
    name: 'Tips Umrah (Post)',
    description: 'Konten edukatif bergaya editorial — tipografi besar di atas latar navy gelap. Tanpa foto.',
    type: 'Content',
    previewColors: ['#0F172A', '#F59E0B', '#94A3B8'],
    aspectRatio: 'post',
    json: {
        version: '7.2.0',
        width: 1080,
        height: 1350,
        objects: [
            // Dark navy background
            { type: 'rect', left: 0, top: 0, width: 1080, height: 1350, fill: '#0F172A', originX: 'left', originY: 'top', selectable: false, evented: false },
            // Top amber accent bar
            { type: 'rect', left: 0, top: 0, width: 1080, height: 14, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
            // Bottom amber accent bar
            { type: 'rect', left: 0, top: 1300, width: 1080, height: 14, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
            // Left amber vertical accent strip
            { type: 'rect', left: 80, top: 160, width: 6, height: 880, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
            // Gold separator below big number
            { type: 'rect', left: 120, top: 430, width: 440, height: 4, fill: '#D4A373', originX: 'left', originY: 'top', selectable: false, evented: false },
            // Thin amber divider before brand
            { type: 'rect', left: 120, top: 1080, width: 160, height: 2, fill: '#F59E0B', opacity: 0.6, originX: 'left', originY: 'top', selectable: false, evented: false },
            // Category label
            { type: 'textbox', left: 120, top: 148, width: 900, text: 'TIPS UMRAH', fontSize: 13, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', charSpacing: 180, originX: 'left', originY: 'top', editable: true },
            // Large tip number
            { type: 'textbox', left: 100, top: 178, width: 400, text: '01', fontSize: 200, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', lineHeight: 1, originX: 'left', originY: 'top', editable: true },
            // Tip title
            { type: 'textbox', left: 120, top: 460, width: 900, text: 'Niat yang Ikhlas\nadalah Kunci Ibadah', fontSize: 52, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', lineHeight: 1.2, originX: 'left', originY: 'top', editable: true },
            // Body text
            { type: 'textbox', left: 120, top: 642, width: 900, text: 'Sebelum berangkat, pastikan niat Anda murni karena Allah SWT semata. Ibadah yang diterima bukan hanya tentang fisik yang hadir di Tanah Suci — tetapi tentang hati yang hadir dan khusyuk dalam setiap doa dan amalan selama di sana.', fontSize: 22, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#94A3B8', lineHeight: 1.65, originX: 'left', originY: 'top', editable: true },
            // Brand name
            { type: 'textbox', left: 120, top: 1096, width: 600, text: 'ALFATIH DUNIA WISATA', fontSize: 14, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', charSpacing: 150, originX: 'left', originY: 'top', editable: true },
            // Contact (injected by injectFooterData)
            { type: 'textbox', left: 120, top: 1126, width: 840, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 13, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#64748B', originX: 'left', originY: 'top', editable: true },
            // License (injected by injectFooterData)
            { type: 'textbox', left: 120, top: 1154, width: 840, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 11, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '400', fill: '#475569', originX: 'left', originY: 'top', editable: true },
        ]
    }
},
```

- [ ] **Step 2: Append Content Story to `BASE_TEMPLATES`**

```ts
{
    id: 'content-story',
    name: 'Tips Umrah (Story)',
    description: 'Konten edukatif bergaya editorial — tipografi besar di atas latar navy gelap, format Story.',
    type: 'Content',
    previewColors: ['#0F172A', '#F59E0B', '#94A3B8'],
    aspectRatio: 'story',
    json: {
        version: '7.2.0',
        width: 1080,
        height: 1920,
        objects: [
            // Dark navy background
            { type: 'rect', left: 0, top: 0, width: 1080, height: 1920, fill: '#0F172A', originX: 'left', originY: 'top', selectable: false, evented: false },
            // Top amber accent bar
            { type: 'rect', left: 0, top: 0, width: 1080, height: 20, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
            // Bottom amber accent bar
            { type: 'rect', left: 0, top: 1858, width: 1080, height: 20, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
            // Left amber vertical accent strip
            { type: 'rect', left: 80, top: 200, width: 6, height: 1340, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
            // Gold separator below big number
            { type: 'rect', left: 120, top: 640, width: 500, height: 5, fill: '#D4A373', originX: 'left', originY: 'top', selectable: false, evented: false },
            // Thin amber divider before brand
            { type: 'rect', left: 120, top: 1594, width: 200, height: 3, fill: '#F59E0B', opacity: 0.6, originX: 'left', originY: 'top', selectable: false, evented: false },
            // Category label
            { type: 'textbox', left: 120, top: 188, width: 900, text: 'TIPS UMRAH', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', charSpacing: 180, originX: 'left', originY: 'top', editable: true },
            // Large tip number
            { type: 'textbox', left: 96, top: 226, width: 500, text: '01', fontSize: 280, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', lineHeight: 1, originX: 'left', originY: 'top', editable: true },
            // Tip title
            { type: 'textbox', left: 120, top: 678, width: 900, text: 'Niat yang Ikhlas\nadalah Kunci Ibadah', fontSize: 62, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', lineHeight: 1.2, originX: 'left', originY: 'top', editable: true },
            // Body text
            { type: 'textbox', left: 120, top: 946, width: 900, text: 'Sebelum berangkat, pastikan niat Anda murni karena Allah SWT semata. Ibadah yang diterima bukan hanya tentang fisik yang hadir di Tanah Suci — tetapi tentang hati yang hadir dan khusyuk dalam setiap doa dan amalan selama di sana.\n\nPersiapkan diri Anda dengan memperbanyak doa, tilawah, dan meningkatkan akhlak sebelum keberangkatan.', fontSize: 26, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#94A3B8', lineHeight: 1.65, originX: 'left', originY: 'top', editable: true },
            // Brand name
            { type: 'textbox', left: 120, top: 1612, width: 800, text: 'ALFATIH DUNIA WISATA', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', charSpacing: 150, originX: 'left', originY: 'top', editable: true },
            // Contact (injected)
            { type: 'textbox', left: 120, top: 1648, width: 840, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#64748B', originX: 'left', originY: 'top', editable: true },
            // License (injected)
            { type: 'textbox', left: 120, top: 1686, width: 840, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 13, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '400', fill: '#475569', originX: 'left', originY: 'top', editable: true },
        ]
    }
},
```

- [ ] **Step 3: Verify in browser**

Refresh Templates panel. Confirm:
- Two "Tips Umrah" cards appear under Post and Story groups
- Thumbnails show dark navy background with amber number — visually distinct from all conversion templates
- Loading either template onto canvas works

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/PosterMaker/TemplatePanel.tsx
git commit -m "feat(poster): add Content templates (post + story)"
```

---

### Task 5: Add type pill-filter row to TemplatePanel

**Files:**
- Modify: `src/components/admin/PosterMaker/TemplatePanel.tsx:1071–1124` (the `TemplatePanel` component)

**Interfaces:**
- Consumes: `TemplateType` from Task 1, `PosterTemplate.type` from all templates
- Produces: interactive filter that narrows the template grid by type

- [ ] **Step 1: Add filter state and filtered list to `TemplatePanel`**

Find the `TemplatePanel` component (around line 1071). Replace the opening lines:

```tsx
// before
const TemplatePanel: React.FC<TemplatePanelProps> = ({ onLoadTemplate }) => {
    const siteSettings = useSiteSettings();
    const liveTemplates = useMemo(() => buildStarterTemplates(siteSettings), [siteSettings]);
    const postTemplates  = liveTemplates.filter(t => t.aspectRatio === 'post');
    const storyTemplates = liveTemplates.filter(t => t.aspectRatio === 'story');
```

```tsx
// after
const FILTER_PILLS: Array<TemplateType | 'All'> = ['All', 'Conversion', 'Tour Promotion', 'Documentation', 'Content'];

const TemplatePanel: React.FC<TemplatePanelProps> = ({ onLoadTemplate }) => {
    const siteSettings = useSiteSettings();
    const liveTemplates = useMemo(() => buildStarterTemplates(siteSettings), [siteSettings]);
    const [typeFilter, setTypeFilter] = useState<TemplateType | 'All'>('All');

    const filteredTemplates = typeFilter === 'All'
        ? liveTemplates
        : liveTemplates.filter(t => t.type === typeFilter);

    const postTemplates  = filteredTemplates.filter(t => t.aspectRatio === 'post');
    const storyTemplates = filteredTemplates.filter(t => t.aspectRatio === 'story');
```

- [ ] **Step 2: Add pill row to the JSX return**

Find the return block in `TemplatePanel`. It currently looks like:

```tsx
return (
    <div>
        <div className="flex items-center gap-2 mb-4">
            <LayoutTemplate className="w-4 h-4 text-gray-500" />
            <div>
                <h3 className="text-sm font-semibold text-gray-800">Templates</h3>
                <p className="text-[10px] text-gray-400">Design system Alfatih Dunia Wisata</p>
            </div>
        </div>
        {renderGroup('Instagram Post (4:5)', '1080 × 1350 px', postTemplates)}
        {renderGroup('Instagram Story (9:16)', '1080 × 1920 px', storyTemplates)}
    </div>
);
```

Replace with:

```tsx
return (
    <div>
        <div className="flex items-center gap-2 mb-3">
            <LayoutTemplate className="w-4 h-4 text-gray-500" />
            <div>
                <h3 className="text-sm font-semibold text-gray-800">Templates</h3>
                <p className="text-[10px] text-gray-400">Design system Alfatih Dunia Wisata</p>
            </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-4">
            {FILTER_PILLS.map(pill => (
                <button
                    key={pill}
                    onClick={() => setTypeFilter(pill)}
                    className={`rounded-full px-3 py-1 text-[10px] font-semibold transition-colors ${
                        typeFilter === pill
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                >
                    {pill}
                </button>
            ))}
        </div>
        {renderGroup('Instagram Post (4:5)', '1080 × 1350 px', postTemplates)}
        {renderGroup('Instagram Story (9:16)', '1080 × 1920 px', storyTemplates)}
    </div>
);
```

- [ ] **Step 3: Verify filter behaviour in browser**

Refresh the Templates panel. Check:

1. **All** pill selected by default — all 16 templates visible (10 Conversion + 6 new)
2. Click **Conversion** — only the 10 existing conversion templates appear
3. Click **Tour Promotion** — only 2 "Destinasi Pilihan" cards appear (Post + Story)
4. Click **Documentation** — only 2 "Testimonial Jamaah" cards appear
5. Click **Content** — only 2 "Tips Umrah" cards appear
6. Each filtered view still shows the "Instagram Post (4:5)" and "Instagram Story (9:16)" section headers; if a type has no template for a size, that section shows "Belum ada template."
7. The active pill turns solid blue (`bg-primary`); inactive pills are gray

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/PosterMaker/TemplatePanel.tsx
git commit -m "feat(poster): add template type filter pill row to TemplatePanel"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| Add `TemplateType` union type | Task 1 |
| Add `type` field to `PosterTemplate` interface | Task 1 |
| Mark all 10 existing templates `type: 'Conversion'` | Task 1 |
| Tour Promotion Post template | Task 2 |
| Tour Promotion Story template | Task 2 |
| Documentation Post template | Task 3 |
| Documentation Story template | Task 3 |
| Content Post template | Task 4 |
| Content Story template | Task 4 |
| Filter state `useState<TemplateType \| 'All'>('All')` | Task 5 |
| Pill row with All/Conversion/Tour Promotion/Documentation/Content | Task 5 |
| Active pill: `#0084FF` bg, white text | Task 5 (`bg-primary text-white`) |
| Inactive pill: `#F1F5F9` bg, `#64748B` text | Task 5 (`bg-gray-100 text-gray-500`) |
| Hover: `#E2E8F0` | Task 5 (`hover:bg-gray-200`) |
| Filter happens before Post/Story split | Task 5 |
| `injectFooterData` compatibility | All templates include the correct contact/license text patterns |

**Placeholder scan:** None found — all steps include complete code.

**Type consistency:** `TemplateType` defined in Task 1, used verbatim in `FILTER_PILLS` and `typeFilter` state in Task 5. `PosterTemplate.type` set in Tasks 2–4 using the same union values.
