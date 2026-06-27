# Documentation Feature — Design Spec

**Date:** 2026-06-27  
**Status:** Approved

## Overview

A trip album feature managed from the admin panel. Each album is a collection of photos from a completed trip, optionally linked to an existing package. Albums serve three purposes:

1. **Public showcase** — a "Perjalanan Kami" masonry grid section on the homepage
2. **Poster Maker asset source** — a new Albums tab in the Asset Panel for inserting trip photos into canvases
3. **Future itinerary PDF asset** — photos from albums linked to the same destination/package can be reused in PDF generation

---

## Data Model

### `documentations` table

| column | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `title` | text | auto-filled from package name, or free text |
| `category_id` | uuid FK → categories | not nullable; auto-filled if package linked |
| `package_id` | uuid nullable FK → packages | optional link; triggers auto-fill |
| `departure_date` | date nullable | auto-filled from package, else null |
| `arrival_date` | date nullable | auto-filled from package, else null |
| `description` | text nullable | auto-filled from package description, else free text |
| `cover_photo_url` | text nullable | URL of one of the album's uploaded photos |
| `published` | bool default false | controls visibility on public page |
| `created_at` | timestamptz default now() | |

### `documentation_photos` table

| column | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `documentation_id` | uuid FK → documentations ON DELETE CASCADE | |
| `storage_url` | text | public URL from Supabase Storage |
| `sort_order` | int | for drag-to-reorder in the album editor |
| `created_at` | timestamptz default now() | |

### Supabase Storage

- Bucket: `documentation-photos`
- Access: public read, authenticated write
- Path pattern: `{documentation_id}/{filename}`

### RLS

- `documentations`: authenticated full access; public SELECT on `published = true` rows
- `documentation_photos`: authenticated full access; public SELECT (photos are public via storage URLs anyway)

---

## Admin UI

### Navigation

New item **"Documentations"** under the **Operations** nav group in `AdminLayout`, using the `BookImage` lucide icon. Visible to all authenticated roles.

Route: `/admin/documentations`

### List Page (`/admin/documentations`)

- `PageHeader` with "+ New Album" button
- `SearchInput` (filter by title) + Category dropdown filter
- Table columns: cover thumbnail (48×36px), title, category badge, package link (or "—"), departure date, photo count, published badge
- Sort by: created date (default), departure date
- Pagination: PAGE_SIZE 10
- Per-row actions: **View** (blue), **Edit**, **Delete**
- View and Edit both open SlideOver panels (see below)

### SlideOver: New / Edit Album

Standard `SlideOver` component from `src/components/admin/ui.tsx`. Width: `lg` (`max-w-2xl`, ~672px) to accommodate the photo grid.

**Header:** "New Album" / "Edit Album" title + close button

**Body (scrollable):**

1. **Package link toggle** (on/off)
   - When ON: package selector dropdown; selecting a package auto-fills title, category, departure date, arrival date, description (all remain editable after auto-fill)
   - When OFF: all fields are free-input; category is required

2. **Metadata fields:**
   - Title (text input)
   - Category (required select from `categories` table)
   - Departure Date + Arrival Date (date inputs, nullable)
   - Description (textarea, nullable)

3. **Photos section** (below a divider):
   - Drag-and-drop upload zone (multi-file, images only)
   - Files uploaded to `documentation-photos` bucket under `{documentation_id}/`
   - 4-column photo grid showing uploaded photos
   - Click a photo → set as `cover_photo_url`; shows "COVER" badge
   - Drag to reorder → updates `sort_order` on `documentation_photos` rows
   - Per-photo delete button → removes from storage + deletes DB row

**Footer:**
- Published toggle (left)
- Cancel + Save Album buttons (right)

### SlideOver: View Album (read-only)

Same SlideOver component, read-only.

**Header:** Album title + category badge + date range + published status badge + Edit button + close button

**Body:**
- Cover photo (full-width, 160px tall, rounded)
- Description text
- Package link badge (if linked)
- "All Photos (N)" label + full photo grid (4 columns)

---

## Public Page

### "Perjalanan Kami" Section

New section on the homepage (`Home.tsx`), positioned after the tour packages section and before testimonials.

- Fetches `documentations` where `published = true`, ordered by `departure_date DESC`
- Displays at most 6 albums initially (no pagination on public page)
- Section heading: **"Perjalanan Kami"** with a short subtitle

**Layout: Masonry Grid**

- 3-column masonry grid on desktop, 2-column on tablet, 1-column on mobile
- Each tile shows the `cover_photo_url` as background, with a gradient overlay at the bottom containing the album title and photo count
- Tiles have varying heights for visual rhythm (first tile taller)

**Lightbox on click:**

Clicking an album tile opens a full-screen lightbox showing:
- All photos from `documentation_photos` for that album (ordered by `sort_order`)
- Album title + description in a header bar
- Left/right navigation arrows
- Close button (ESC also closes)

Lightbox is implemented as a local component (no external library) using a portal.

---

## Poster Maker — Asset Panel

### New "Albums" Tab

Added as the last tab in `AssetPanel.tsx` alongside existing tabs (Images, Icons, Shapes, etc.).

**Filter bar (two cascading dropdowns):**
1. **Category** — filters the album dropdown below it; "All Categories" shows everything
2. **Album** — lists only albums matching the selected category; "All Albums" shows photos from all matched albums

Filter logic: `documentation_photos` joined to `documentations` filtered by `category_id` (if set) and `documentation_id` (if set), ordered by `sort_order`.

**Photo grid:**
- 3-column grid of square thumbnails
- Hover shows a purple highlight border
- Click inserts the photo as a new image object on the Fabric.js canvas (same behavior as clicking an image in the Images tab)
- "Load more" button (load 30 at a time)

**Footer hint:** "Click any photo to insert into canvas"

---

## Itinerary PDF Integration

### Where it plugs in

The "Download Itinerary PDF" button lives in `PackageDetailPanel.tsx` (`handleDownloadPdf`). Currently it calls `downloadItineraryPdf(pkg, siteSettings)` immediately. With this feature, clicking the button first opens a **Photo Picker modal** — the PDF only generates after the admin confirms their selection (or skips it).

### Photo Picker modal

Triggered by the "Download Itinerary PDF" button in `PackageDetailPanel`. Rendered as a full-screen modal (not SlideOver — needs more horizontal space).

Photos are assigned **per day** of the itinerary — **maximum 1 photo per day**. Each day is optional — days without a photo render as text-only, exactly as today. Days with a photo get it embedded inline below that day's activities.

**Layout: two-panel**

- **Left panel (fixed ~280px):** list of itinerary days, e.g. "Day 1 — Keberangkatan", "Day 2 — Madinah", etc. Each day row shows a count badge when photos are assigned (e.g. "3 foto"). Clicking a day selects it and loads the right panel for that day.
- **Right panel (flex):** album browser for the selected day
  - Category dropdown filter (cascades into album dropdown)
  - Album dropdown filter
  - Photo grid with radio-style single selection — clicking a photo assigns it to this day; clicking again deselects it
  - The selected photo shows a checkmark overlay; selecting a new photo replaces the previous selection

**Footer:**
- Total assigned count (e.g. "12 foto untuk 4 hari")
- Skip button — generates PDF with no photos
- Generate PDF button (always enabled)

### Data shape passed to the edge function

```ts
dayPhotos: { day: number; photoUrls: string[] }[]
// e.g. [{ day: 2, photoUrls: ["https://..."] }, { day: 7, photoUrls: ["https://..."] }]
// Days not in the array render as text-only
// UI enforces max 1 photo per day; array shape kept for future scalability
```

Passed as an additional field in the POST body alongside the existing `package` and `siteSettings`.

### Photos in the PDF

For each day that has photos in `dayPhotos`, the edge function renders the photos **inline below that day's activity list** — a 2-column image strip (max 4 photos per day to keep page layout manageable). Days with no entry in `dayPhotos` render unchanged.

Changes required:
- `PackageDetailPanel.tsx` — replace direct `handleDownloadPdf` call with picker modal open
- `itineraryPdfService.ts` — add optional `dayPhotos?: { day: number; photoUrls: string[] }[]` param to `downloadItineraryPdf`
- `supabase/functions/generate-itinerary-pdf/index.ts` — after rendering each day's activities, check `dayPhotos` for that day and embed its photo(s) inline (full content width, ~160px tall per photo)

---

## Out of Scope (this iteration)

- Per-photo captions
- Tags / manual tagging (filtering uses category, album, and date from the album record)
- Public album detail page (only the homepage section + admin view panel)
