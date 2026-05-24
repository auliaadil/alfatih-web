# Poster Maker Redesign: HTML/CSS Block-Based Editor

**Date:** 2026-05-24
**Status:** Approved

## Problem

The current Poster Maker is ~3,300 lines built on Fabric.js v7 — a full canvas editor with layers, snapping, undo/redo, copy/paste, and templates defined as raw Fabric.js JSON blobs. This causes three compounding problems:

1. **Template maintenance is fragile** — `TemplatePanel.tsx` is 791 lines of inline Fabric.js JSON. Adding or changing a template requires editing low-level canvas object coordinates.
2. **Runtime bugs are endemic** — Fabric.js object selection, rendering, and state sync issues surface regularly.
3. **The abstraction is wrong** — admins need to change text, images, and occasionally colors/styling. They don't need layers, snapping, z-order, or free-form canvas placement.

## Solution

Replace Fabric.js with a React/CSS template system:
- Templates are React components + typed field schemas (not JSON blobs)
- The editor is a structured form sidebar + live preview (not a canvas)
- New templates are built by stacking predefined layout blocks (not freeform canvas)
- Export uses `html2canvas` at configurable scale (no server-side renderer)

## Data Model

### Template (code-defined)

Each template lives in `src/components/admin/PosterMaker/templates/<id>.tsx`:

```ts
interface PosterTemplate {
  id: string
  name: string
  description: string
  category: 'conversion' | 'edu-reminder' | 'aspiration' | 'social-proof'
  aspectRatio: 'post' | 'story'  // post = 1080×1350, story = 1080×1920
  previewColors: [string, string, string]
  fields: FieldSchema[]
  Component: (props: FieldValues) => JSX.Element
}

interface FieldSchema {
  id: string
  label: string
  type: 'text' | 'textarea' | 'image' | 'color'
  maxLength?: number
  placeholder?: string
}

type FieldValues = Record<string, string>
```

Example field schema for `conversion` template:
```ts
[
  { id: 'headline',     type: 'text',  label: 'Judul Paket' },
  { id: 'price',        type: 'text',  label: 'Harga Mulai' },
  { id: 'departure',    type: 'text',  label: 'Tanggal Keberangkatan' },
  { id: 'hero_image',   type: 'image', label: 'Foto Utama' },
  { id: 'accent_color', type: 'color', label: 'Warna Aksen' },
]
```

### Admin-Created Templates (Supabase)

Block-builder templates are saved to a new `poster_templates` table:

```sql
create table poster_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  aspect_ratio text not null,  -- 'post' | 'story'
  blocks jsonb not null,        -- BlockConfig[]
  field_schema jsonb not null,  -- FieldSchema[] derived from blocks
  thumbnail_url text,
  created_at timestamptz default now()
);
```

`BlockConfig` is a serialized configuration for one block (type + settings), e.g.:
```ts
{ type: 'HeroImageBlock', config: { fit: 'cover', overlay: true } }
{ type: 'TextBlock',      config: { align: 'center', size: 'lg' } }
```

### Draft (Supabase)

Drafts store `fieldValues` + `templateId` instead of Fabric.js JSON:

```sql
-- alter existing drafts table:
-- replace canvas_json column with:
template_id text not null,
field_values jsonb not null,
```

Existing drafts (Fabric.js JSON) are archived — no migration. Old records are kept but ignored by the new editor.

### AI Autofill Payload

The `ai-poster-autofill` edge function payload changes from:
```json
{ "textNodes": [{ "id": "...", "text": "..." }] }
```
to:
```json
{ "templateType": "...", "fieldValues": { "headline": "...", "price": "..." }, "package": { ... } }
```

Response changes from `[{ id, text }]` to `{ fieldValues: { ... } }`. Gemini prompt logic and template-type branching stay the same.

## Editor UI

### Layout

Two-panel layout replacing `PosterCanvas.tsx` and all child panels:

```
┌─────────────────────────────────────────────────────────────────┐
│  [Template ▼]  [Post | Story]            [New Template]  [Export]│
├──────────────────────┬──────────────────────────────────────────┤
│  Content Sidebar     │  Live Preview                            │
│  (~320px)            │                                          │
│                      │   ┌──────────────────────────┐          │
│  Judul Paket         │   │                          │          │
│  [____________]      │   │  poster component        │          │
│                      │   │  scaled to fit           │          │
│  Harga Mulai         │   │                          │          │
│  [____________]      │   └──────────────────────────┘          │
│                      │                                          │
│  Foto Utama          │                                          │
│  [Pick Image]        │                                          │
│                      │                                          │
│  [AI Magic Fill]     │                                          │
│  [Save Draft]        │                                          │
└──────────────────────┴──────────────────────────────────────────┘
```

### Left Panel (Content Sidebar)

Auto-generated from the active template's `fields` array. Field type → input:
- `text` → `<input type="text" />`
- `textarea` → `<textarea />`
- `image` → image picker (reuses `AssetPanel` Unsplash/Pixabay search)
- `color` → color swatch constrained to brand palette + free-pick escape hatch

### Right Panel (Live Preview)

The poster `Component` receives current `fieldValues` as props. Rendered at 1080px width inside a `div`, scaled down via `transform: scale(fitScale)` to fit the panel. Updates on every keystroke — pure React re-render, no canvas sync.

### What's Removed

| Removed | Replacement |
|---|---|
| `FabricCanvas.tsx` (418 lines) | Poster React component |
| `LayerPanel.tsx` (245 lines) | Not needed |
| `PropertiesPanel.tsx` (461 lines) | Auto-generated field form (~60 lines) |
| `CanvasContextMenu.tsx` | Not needed |
| `CanvasZoom.tsx` | CSS `transform: scale()` |
| `fabricSnap.ts` | Not needed |
| `fabricShadow.ts` | Not needed |
| `fabricCornerRadius.ts` | Not needed |
| `TemplatePanel.tsx` (791 lines) | One file per template in `templates/` |
| `fabric` npm dependency | `html2canvas` |

`DraftPanel.tsx`, `AssetPanel.tsx`, and `TemplateSelector.tsx` are rewritten with the new data shapes but keep the same UI structure.

The `TemplateSelector` merges two sources at load time: code-defined templates (imported statically from `templates/index.ts`) and admin-created templates fetched from the `poster_templates` Supabase table. Both are typed as `PosterTemplate` — admin templates have their `Component` reconstructed at runtime from the stored `blocks` array using the same block components.

## Block Builder

Opened via "New Template" button. Full-screen modal with three columns.

### Left — Block Palette

Fixed library of block types with visual thumbnails:

| Block | Fields contributed |
|---|---|
| `HeaderBlock` | `logo_image`, `brand_name`, `tagline` |
| `HeroImageBlock` | `hero_image` |
| `TextBlock` | `headline`, `body_text` |
| `DetailsGrid` | `detail_1` … `detail_6` (text fields; icon is decorative, hardcoded per slot index) |
| `TestimonialBlock` | `quote`, `author_name`, `batch` |
| `PromoBlock` | `promo_price`, `cta_text` |
| `FooterBlock` | `social_handle`, `ppiu_number`, `contact` |

### Center — Block Canvas

Stacked list of added blocks. Drag to reorder. Click to select. Delete button per block. No free-form placement — blocks are always vertically stacked. Total poster height is the sum of block heights.

### Right — Block Config Panel

Per-block settings:
- `padding`: `sm` / `md` / `lg`
- `background`: brand color palette picker
- `fontSize`: `sm` / `md` / `lg`
- `imageFit`: `cover` / `contain` (image blocks only)
- `textAlign`: `left` / `center` / `right` (text blocks only)

No arbitrary pixel values.

### Saving

On save:
1. Serialize `BlockConfig[]` to JSON
2. Derive `FieldSchema[]` from block types
3. Insert row into `poster_templates`
4. Generate thumbnail via `html2canvas` at `scale: 0.2`
5. Upload thumbnail to Supabase Storage, store URL

The saved template is immediately available in the template selector.

## Export

### Social Media (default)
`html2canvas` capture at `scale: 2` → 2160×2700px (post) or 2160×3840px (story). Font pre-load via `FontFace` API before capture, waiting on `document.fonts.ready`.

### Print Quality
"Export for Print" option: `html2canvas` at `scale: 4` → 4320×5400px. Loading spinner during capture (~3-5s). Suitable for A4/A3 flyers.

No server-side headless renderer. All export is browser-side.

## Migration

### Code
- Delete all of `src/components/admin/PosterMaker/`
- Remove `fabric` from `package.json`, add `html2canvas`
- Create `src/components/admin/PosterMaker/` fresh with new structure
- Recreate the 4 existing template designs as React/CSS components (same visual output)
- Rewrite `ai-poster-autofill` edge function for new payload shape

### Supabase
- Add `poster_templates` table (migration file)
- Alter `drafts` table: add `template_id` + `field_values` columns, keep `canvas_json` as nullable (archived data)

### Existing Drafts
Clean break — old Fabric.js JSON drafts are not migrated. They remain in the database but the new editor ignores them. Admins start fresh.

### Rollout
Single PR. Admin-only feature, no public impact. No feature flags needed.

## File Structure (new)

```
src/components/admin/PosterMaker/
  PosterEditor.tsx           — main two-panel editor layout
  FieldForm.tsx              — auto-generated form from field schema
  LivePreview.tsx            — scaled poster preview
  BlockBuilder.tsx           — new template modal
  DraftPanel.tsx             — rewritten draft list
  AssetPanel.tsx             — reused image picker
  TemplateSelector.tsx       — rewritten template dropdown
  exportPoster.ts            — html2canvas export logic
  templates/
    index.ts                 — exports all templates
    conversion.tsx
    edu-reminder.tsx
    aspiration.tsx
    social-proof.tsx
  blocks/
    HeaderBlock.tsx
    HeroImageBlock.tsx
    TextBlock.tsx
    DetailsGrid.tsx
    TestimonialBlock.tsx
    PromoBlock.tsx
    FooterBlock.tsx
```
