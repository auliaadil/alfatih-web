# Poster Maker Redesign — Design Spec

**Date:** 2026-05-24  
**Status:** Approved

## Problem

The current Poster Maker (~3,300 lines across 20 files) is a full Fabric.js canvas editor — essentially a mini-Canva built from scratch. Pain points:

- Templates are 791-line raw Fabric.js JSON blobs, fragile and unreadable
- Fabric.js runtime bugs: rendering glitches, undo/redo failures, object selection issues
- The full editor surface (layers panel, snapping, z-order, copy/paste) is overkill for what admins actually do
- The whole canvas abstraction is the wrong fit for structured poster content

## Goals

- Admins can edit text, swap images, and tweak colors on existing templates
- Admins can create new templates by composing predefined layout blocks
- Export to PNG suitable for social media (Instagram, WhatsApp) and print (A4/A3 flyers)
- No external design services — fully in-house, open source only
- Dramatically less code to maintain

## Approach: HTML/CSS Block-Based Editor

Replace Fabric.js with React/CSS templates, a structured field form editor, and an `html2canvas` export pipeline.

---

## Section 1: Data Model & Template Architecture

### Template Definition

Each template is a TypeScript module in `src/components/admin/PosterMaker/templates/`:

```ts
interface TemplateDefinition {
  id: string
  name: string
  description: string
  aspectRatio: 'post' | 'story'           // post = 1080×1350, story = 1080×1920
  category: 'conversion' | 'edu-reminder' | 'aspiration' | 'social-proof' | 'blank'
  previewColors: [string, string, string]  // [accent, body bg, footer]
  fields: FieldSchema[]
  component: React.FC<FieldValues>
}
```

### Field Schema

```ts
interface FieldSchema {
  id: string
  label: string
  type: 'text' | 'textarea' | 'image' | 'color'
  maxLength?: number
  placeholder?: string
}

type FieldValues = Record<string, string>
```

Example fields for the `conversion` template:
```ts
{ id: 'headline',     type: 'text',    label: 'Judul Paket',             maxLength: 60 }
{ id: 'price',        type: 'text',    label: 'Harga Mulai',             maxLength: 30 }
{ id: 'departure',    type: 'text',    label: 'Tanggal Keberangkatan',   maxLength: 30 }
{ id: 'features',     type: 'textarea',label: 'Keunggulan (per baris)',  maxLength: 200 }
{ id: 'hero_image',   type: 'image',   label: 'Foto Utama' }
{ id: 'accent_color', type: 'color',   label: 'Warna Aksen' }
```

### Render Component

A pure React component at a fixed 1080px canvas width:
```tsx
const ConversionTemplate: React.FC<FieldValues> = ({ headline, price, hero_image, accent_color }) => (
  <div style={{ width: 1080, height: 1350, background: accent_color }}>
    {/* poster layout in plain HTML/CSS */}
  </div>
)
```

No canvas API, no imperative handle, no JSON blob. Just props in, JSX out.

### Template Registry

`templates/index.ts` exports a `getTemplates()` function that merges developer-defined templates (imported statically from `templates/*.tsx`) with admin-created templates loaded from Supabase at runtime. Both types conform to `TemplateDefinition`. The editor receives the merged list and treats them identically.

### Admin-Created Templates

Saved to a new `poster_templates` Supabase table:

```sql
create table poster_templates (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  aspect_ratio text not null,
  blocks      jsonb not null,   -- serialized BlockConfig[]
  created_at  timestamptz default now()
);
```

The field schema is derived at runtime from the block configuration — each block type contributes known fields (e.g. `HeroImageBlock` always contributes an `image` field).

### AI Autofill

The `ai-poster-autofill` edge function payload changes from `textNodes[]` to `fieldValues{}`:

```ts
// Old
{ templateType, textNodes: [{ id, text }] }

// New
{ templateType, fieldValues: { headline: '...', price: '...' } }
```

The Gemini prompt and template-type branching logic stays the same; only the input/output serialization changes.

---

## Section 2: Editor UI

### Layout

Two-panel layout replacing `PosterCanvas.tsx` and all child panels:

```
┌─────────────────────┬──────────────────────────────────┐
│   Content Sidebar   │         Live Preview             │
│   (~320px)          │         (scaled poster)          │
│                     │                                  │
│  [Template Select]  │                                  │
│  [Post | Story]     │   ┌──────────────────────────┐   │
│                     │   │                          │   │
│  Field: Headline    │   │   Poster Component       │   │
│  [____________]     │   │   (re-renders on input)  │   │
│                     │   │                          │   │
│  Field: Foto Utama  │   └──────────────────────────┘   │
│  [Image Picker]     │                                  │
│                     │                                  │
│  [AI Magic Fill]    │                                  │
│  [Save Draft]       │                                  │
└─────────────────────┴──────────────────────────────────┘
│  [Export PNG]  [Export Print]  [Drafts]  [New Template] │
└─────────────────────────────────────────────────────────┘
```

### Field Form

Auto-generated from the active template's `fields` array:
- `text` → `<input type="text">`
- `textarea` → `<textarea>`
- `image` → existing `AssetPanel` image picker (Unsplash/Pixabay)
- `color` → color swatch from brand palette + free-pick fallback

### Live Preview

The poster component receives `fieldValues` as props and re-renders on every input change. Scaled down using `transform: scale(fitScale)` — no canvas sync, no imperative API.

### Removed vs. Today

| Removed | Replaced by |
|---|---|
| `FabricCanvas.tsx` (418 lines) | Poster React component |
| `LayerPanel.tsx` (245 lines) | (not needed) |
| `PropertiesPanel.tsx` (461 lines) | Auto-generated field form (~60 lines) |
| `CanvasContextMenu.tsx` | (not needed) |
| `CanvasZoom.tsx` | CSS `transform: scale()` |
| `fabricSnap.ts`, `fabricShadow.ts`, `fabricCornerRadius.ts` | (not needed) |
| `TemplatePanel.tsx` (791 lines of JSON) | One file per template in `templates/` |
| Fabric.js dependency | `html2canvas` |

---

## Section 3: Block Builder

### Purpose

Allows admins to design new templates by composing predefined layout blocks without writing code.

### Available Blocks

| Block | Fields contributed |
|---|---|
| `HeaderBlock` | logo visibility, tagline text |
| `HeroImageBlock` | image URL, overlay opacity |
| `TextBlock` | headline text, body text, alignment |
| `DetailsGrid` | up to 6 icon+label pairs |
| `TestimonialBlock` | quote, name, batch |
| `PromoBlock` | CTA text, price text, button label |
| `FooterBlock` | social handle, PPIU text, contact info |

### Layout Constraint

Blocks stack **vertically only** — no free-form placement, no overlapping. This eliminates the entire class of Fabric.js z-order and coordinate bugs. All current template layouts are vertically stacked zones, so this covers real needs.

### Block Builder UI

Three-column modal:
1. **Left:** Block palette with visual thumbnails — click or drag to add
2. **Center:** Stacked block canvas — drag to reorder, click to select, delete button per block
3. **Right:** Block config panel — padding, background color (brand palette), font size tier (`sm`/`md`/`lg`), image fit, text alignment. No arbitrary pixel values.

### Saving

Saves `BlockConfig[]` JSON to `poster_templates` Supabase table. Loaded at runtime and rendered by the same block components used in the editor preview.

---

## Section 4: Export

### Social Media (Default)

`html2canvas` at `scale: 2` → 2160px wide PNG. Suitable for Instagram posts/stories and WhatsApp.

Fonts must be pre-loaded via `FontFace` API before capture; wait for `document.fonts.ready` to avoid blank-text exports.

### Print Quality

Second export option "Export for Print": `html2canvas` at `scale: 4` → 4320px wide PNG. Sufficient for A4/A3 flyers at 300dpi equivalent. Capture takes ~3-5s; show a loading spinner.

No server-side headless renderer needed — browser-side scaling achieves the required resolution without infrastructure complexity.

### Draft Thumbnails

`html2canvas` at `scale: 0.2` → 216px wide thumbnail saved to Supabase alongside the `fieldValues` + `templateId`. Same as today's approach but without Fabric.js.

### Draft Storage

Old format:
```json
{ "canvasJson": { "version": "6.0.0", "objects": [...] } }
```

New format:
```json
{ "templateId": "conversion-v1", "fieldValues": { "headline": "...", "price": "..." } }
```

---

## Section 5: Migration

### Deleted

- All of `src/components/admin/PosterMaker/` (20 files, ~3,300 lines)
- `fabric` npm dependency
- `services/posterAutofillService.ts` payload shape updated

### Kept / Reused

- `AssetPanel.tsx` — reused as-is for `image` field type
- `DraftPanel.tsx` — rewritten for new draft format, same UI and Supabase queries
- `TemplateSelector.tsx` — reused with new data shape
- `ai-poster-autofill` edge function — prompt logic kept, payload shape updated
- The 4 existing template designs are recreated as React/CSS components with identical visual output

### Existing Drafts

Old Fabric.js JSON drafts are unreadable by the new editor. **Decision: clean break.** Old drafts are soft-deleted (marked `archived = true`). Admins start fresh. No migration script — drafts are working documents, not final deliverables.

### Rollout

Admin-only feature, no public-facing impact. Single PR, no feature flags.

---

## File Structure (New)

```
src/components/admin/PosterMaker/
  PosterEditor.tsx               # main two-panel editor (replaces PosterCanvas.tsx)
  FieldForm.tsx                  # auto-generated field form from schema
  PosterPreview.tsx              # scaled live preview wrapper
  ExportButton.tsx               # html2canvas export logic
  BlockBuilder/
    BlockBuilder.tsx             # three-column modal
    BlockPalette.tsx
    BlockCanvas.tsx
    BlockConfigPanel.tsx
    blocks/
      HeaderBlock.tsx
      HeroImageBlock.tsx
      TextBlock.tsx
      DetailsGrid.tsx
      TestimonialBlock.tsx
      PromoBlock.tsx
      FooterBlock.tsx
  templates/
    index.ts                     # exports all TemplateDefinition[]
    conversion.tsx
    edu-reminder.tsx
    aspiration.tsx
    social-proof.tsx
```
