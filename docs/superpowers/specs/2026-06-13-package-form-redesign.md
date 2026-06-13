# Package Form Redesign — Design Spec
Date: 2026-06-13

## Overview

Redesign the Create/Edit Package flow from a single scrollable modal into a full-page 4-step wizard. Simultaneously add four supporting features: Airports admin page, Categories admin page, Hotel room types, and two new Supabase Edge Functions (AI content generation + image search).

All AI calls are admin-only, JWT-verified, and routed through Supabase Edge Functions. No API keys in the frontend.

---

## Scope

| Piece | Type |
|---|---|
| `PackageForm` (new: `PackageWizard`) | Redesigned — full-page 4-step wizard |
| `Airports` admin page | New |
| `Categories` admin page | New |
| `Hotels` admin page | Updated — add room type definitions |
| `ai-package-content` edge function | New |
| `image-search` edge function | New |
| DB migration | New — `airports`, `categories` tables; schema changes on `hotels` and `packages` |

---

## Wizard Structure

The PackageForm modal is replaced by a full admin page (`/admin/packages/new`, `/admin/packages/:id/edit`) with a left sidebar showing 4 progress steps.

```
┌─────────────────┬────────────────────────────────────┐
│  Sidebar        │  Step content                       │
│                 │                                     │
│  ● Step 1       │  (active step form)                 │
│  ○ Step 2       │                                     │
│  ○ Step 3       │                                     │
│  ○ Step 4       │                         [Next →]    │
└─────────────────┴────────────────────────────────────┘
```

Navigation: "Next" and "Back" buttons. Steps are not freely skippable — each step validates before advancing. The final step has a "Save Package" button.

---

## Step 1 — Basic Info

**Fields:**
- **Title** — text input, required
- **Category** — `<select>` populated from `categories` table, required
- **Departure Date** — `<input type="date">`, required
- **Arrival Date** — `<input type="date">`, required
- **Duration** — read-only computed badge derived client-side from the two dates (e.g. `"9 Hari"`)
- **Cover Image** — tab switcher: "Upload" (file input, JPG/PNG) or "Search Online" (calls `image-search` edge function). Search shows source toggle (Unsplash / Pixabay), query input, and a 3-column image grid. Selected image URL stored directly; no re-upload.
- **Gallery** — existing multi-upload (unchanged)
- **Mark as Popular** — checkbox

**Removed from this step:** Brochure PDF (removed entirely from the form).

---

## Step 2 — Flight & Hotels

**Airlines section:**
- Searchable checkbox list (search filters by airline name)
- Checking an airline expands a "Route legs" sub-section beneath it
- Each leg: `from airport` → `to airport` (both `<select>` dropdowns populated from `airports` table)
- Multiple legs per airline (e.g. CGK→IST, IST→JED)
- "+ Add leg" button per airline; "✕" removes a leg

**Hotels section:**
- Searchable checkbox list (search filters by hotel name or location)
- Each row shows hotel name, star rating, city
- No room type selection here — that happens in Step 3

**Description & Features** (appear below hotels, after context is available):
- **Description** — textarea, editable. Optional "✨ Generate" button calls `ai-package-content` with `type: "description"` and context: title, category, duration, selected airlines, selected hotels.
- **Features** — tag-style input (comma-separated internally), editable. Optional "✨ Generate" button calls `ai-package-content` with `type: "features"`, adds description to context.
- Both fields are fully editable regardless of whether AI is used.

---

## Step 3 — Pricing & Rooms

**Participant Quota:**
- **Total quota** — number input (initial capacity)
- **Remaining quota** — read-only, shown greyed out. Decremented automatically by orders. Editable only for existing packages (manual correction).

**Room Options:**
- Room types are sourced from the selected hotels' `room_types` JSONB definitions
- Grouped by hotel (each hotel gets a header + its room types as rows)
- Each row: checkbox, room name, capacity, price input (Rp), optional strikethrough price input
- Unchecked rows have disabled price fields
- Only checked + priced rooms are saved to `room_options` on the package
- Warning banner shown if no hotels were selected in Step 2

---

## Step 4 — Itinerary & Terms

Three independent sections, each with a "✨ Generate" button that calls `ai-package-content` with the appropriate `type`. All sections are fully editable manually. Generating one section does not affect the others.

**Itinerary:**
- Day cards: each card has an inline-editable title and a list of activities (inline text inputs)
- Collapsed state shows day number + title + activity count
- "✕" removes a day; "✕" on an activity removes just that activity
- "+ Tambah hari manual" adds a blank day card
- "✨ Generate Itinerary" replaces the current itinerary with AI output (prompts confirmation if itinerary already has content)

**Termasuk (Included):**
- List of inline text inputs with green "✓" prefix
- "+ Tambah item" adds a blank row
- "✨ Generate" replaces with AI output (prompts confirmation if list has content)

**Tidak Termasuk (Not Included):**
- Same pattern as Included, with red "✗" prefix

---

## New Admin Pages

### Airports
Same page pattern as Hotels/Airlines (`PageHeader`, `TableCard`, `SlideOver` form).

**Fields:** IATA code (3-char uppercase, e.g. `CGK`), Name (`Soekarno-Hatta International`), City, Country.

**Table columns:** IATA code, Name, City, Country, actions (edit/delete).

Seeded with commonly-used airports for Umrah routes at migration time (CGK, SUB, KNO, JED, MED, IST, DXB, DOH).

### Categories
Same page pattern.

**Fields:** Name (e.g. `Umrah Plus`), Slug (auto-generated from name, editable).

**Table columns:** Name, Slug, actions.

Initial seed: Umrah, Asia, Europe, Middle East (matching current hardcoded values).

### Hotels — Room Types update
The existing Hotels SlideOver form gets a "Room Types" section appended below the current fields.

**Room type row:** Name (e.g. `Quad`), Capacity (number). "+ Add room type" / "✕" remove.

Stored as `room_types JSONB` on the `hotels` table: `[{name: "Quad", capacity: 4}]`.

---

## Data Model

### New table: `airports`
```sql
CREATE TABLE airports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  iata_code   TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  city        TEXT NOT NULL,
  country     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

### New table: `categories`
```sql
CREATE TABLE categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  slug       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Updated: `hotels`
```sql
ALTER TABLE hotels ADD COLUMN room_types JSONB DEFAULT '[]'::jsonb;
-- Shape: [{name: "Quad", capacity: 4}, {name: "Triple", capacity: 3}]
```

### Updated: `packages`
```sql
ALTER TABLE packages
  ADD COLUMN arrival_date    DATE,
  ADD COLUMN flight_routes   JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN image_credit    TEXT,
  DROP COLUMN initial_rooms,
  DROP COLUMN available_rooms,
  DROP COLUMN flight_details;

-- flight_routes shape:
-- [{airline_id: "uuid", legs: [{from_airport_id: "uuid", to_airport_id: "uuid"}]}]

-- room_options shape updated to include hotel_id:
-- [{hotel_id: "uuid", name: "Quad", capacity: 4, price: 28000000, original_price: null}]
```

### Types (`types.ts`)
- Add `Airport`, `Category` interfaces
- Update `TourPackage`: add `arrival_date`, `flight_routes`, `image_credit`; remove `available_rooms`, `initial_rooms`, `flight_details`
- Update `RoomOption`: add `hotel_id`

---

## Edge Functions

### `ai-package-content`
**Auth:** Supabase JWT required (admin-only, same as `ai-poster-autofill`).

**Request:**
```ts
{
  type: "description" | "features" | "itinerary" | "included" | "not_included",
  context: {
    title: string,
    category: string,
    duration: string,           // e.g. "9 Hari"
    airline_names: string[],
    hotel_names: string[],
    routes: string,             // human-readable, e.g. "CGK → IST → JED"
    description?: string,       // provided for features/itinerary/included/not_included
  }
}
```

**Response per type:**
- `description` → `{description: string}`
- `features` → `{features: string[]}`
- `itinerary` → `{itinerary: DayItinerary[]}`
- `included` → `{included: string[]}`
- `not_included` → `{not_included: string[]}`

All output in Bahasa Indonesia with Halal/Islamic tone.

### `image-search`
**Auth:** Supabase JWT required.

**Request:**
```ts
{
  query: string,
  source: "unsplash" | "pixabay",
  page?: number   // default 1
}
```

**Response:**
```ts
{
  images: Array<{
    url: string,       // full-size URL
    thumb_url: string, // thumbnail for grid display
    credit: string     // "Photo by X on Unsplash" or "Image by X on Pixabay"
  }>
}
```

Secrets used: `UNSPLASH_ACCESS_KEY`, `PIXABAY_API_KEY` — must be set as Supabase secrets via `supabase secrets set`. The existing Vite env vars (`VITE_UNSPLASH_ACCESS_KEY`, `VITE_PIXABAY_API_KEY`) are not used by this function; all API calls happen server-side.

---

## Router Changes

`App.tsx` currently renders `PackageForm` as a modal inside `Packages.tsx`. This changes:

- Add routes `/admin/packages/new` and `/admin/packages/:id/edit` to the admin router
- `Packages.tsx` "Create" and "Edit" buttons navigate to these routes instead of opening a modal
- `PackageDetailModal` stays as-is (read-only view, unaffected)
- Add `Airports` and `Categories` to the admin sidebar and router

---

## Public Page Changes

Two targeted changes required in public-facing components due to schema changes. No visual redesign.

### `TourDetail.tsx`
- **Flight info** — `tour.flight_details` (line 225) is replaced with a `formatFlightRoutes(routes, airlines)` helper that derives a display string from `tour.flight_routes`. Example output: `"Garuda Indonesia: CGK → IST → JED"`. Falls back to `"Flight details TBA"` if `flight_routes` is empty.
- **Image credit** — render `tour.image_credit` as a small attribution caption below the cover image when present (required by Unsplash terms of service).

### `TourCard.tsx`
- No changes needed. `room_options` shape change (adding `hotel_id`) is backward-compatible — cheapest-room price calculation is unaffected.

### `formatFlightRoutes` helper
A pure utility function in `src/lib/formatFlightRoutes.ts`. Takes `flight_routes` JSONB and a lookup of airline names, returns a human-readable string. Used by `TourDetail` and any future components that need to display route info.

---

## Out of Scope

- Public-facing package detail page visual redesign
- Order form changes
- Poster Maker integration
