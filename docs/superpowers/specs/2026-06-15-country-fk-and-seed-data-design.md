# Design: Country FK + Seed Data for Airlines, Hotels & Airports

**Date:** 2026-06-15

## Overview

Add a `countries` reference table and migrate all three resource tables (airlines, hotels, airports) to use a FK instead of free-text country strings. All three admin forms get a shared `CountrySelect` component with an inline "Add country" quick-create modal so operators never leave the form to manage the country list.

## 1. Database

### 1.1 `countries` table

```sql
CREATE TABLE countries (
  id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE
);
```

Seeded with the countries relevant to Umroh, Middle East, and Southeast Asian travel:
Indonesia, Saudi Arabia, UAE, Qatar, Turkey, Oman, Jordan, Egypt, Malaysia, Singapore, Thailand.

### 1.2 `airlines` — add `country_id`

```sql
ALTER TABLE airlines ADD COLUMN country_id UUID REFERENCES countries(id);
```

No data migration needed (column was not previously present).

### 1.3 `hotels` — add `country_id`

```sql
ALTER TABLE hotels ADD COLUMN country_id UUID REFERENCES countries(id);
```

No data migration needed (column was not previously present).

### 1.4 `airports` — migrate from `country TEXT` to `country_id`

Airports already has `country TEXT NOT NULL` with seeded data. Migration steps:
1. Add `country_id UUID REFERENCES countries(id)` (nullable initially)
2. `UPDATE airports SET country_id = (SELECT id FROM countries WHERE name = airports.country)`
3. `ALTER TABLE airports ALTER COLUMN country_id SET NOT NULL`
4. `DROP COLUMN country`

The TypeScript `Airport` interface in `types.ts` will change:  
`country: string` → `country_id: string` + resolved name must be fetched via join.

### 1.5 RLS

Countries table follows the same pattern as airports/categories:
- Public SELECT
- Authenticated INSERT/UPDATE/DELETE

### 1.6 Seed data

**Airlines (15 entries):**
Garuda Indonesia, Lion Air, Batik Air, Citilink (Indonesia); Saudia, flynas (Saudi Arabia); Emirates, Air Arabia, Etihad Airways (UAE); Qatar Airways (Qatar); Turkish Airlines (Turkey); Oman Air (Oman); Malaysia Airlines, AirAsia (Malaysia); Singapore Airlines (Singapore).

**Hotels (16 entries):**
- Makkah (8): Dar Al Tawhid Intercontinental, Anjum Hotel, Pullman ZamZam, Swissotel Al Maqam, Hilton Suites, Le Meridien Towers, Royal Dar Al Hijra, Al Safwah Royale Orchid
- Madinah (5): Anwar Al Madinah Mövenpick, Dar Al Iman InterContinental, Oberoi Madinah, Hilton Madinah, Al Shohada Hotel
- Transit (3): JW Marriott Dubai, Kempinski Mall of the Emirates (Dubai), Conrad Istanbul Bosphorus

**Airports — Middle East & SEA hubs (6 new entries):**
AUH (Abu Dhabi, UAE), AMM (Amman, Jordan), CAI (Cairo, Egypt), KUL (Kuala Lumpur, Malaysia), SIN (Singapore, Singapore), BKK (Bangkok, Thailand). No additional Indonesian airports added.

## 2. Shared `CountrySelect` Component

**Location:** `src/components/admin/CountrySelect.tsx`

**Props:**
```ts
interface CountrySelectProps {
  value: string;          // country_id UUID or ''
  onChange: (id: string) => void;
  required?: boolean;
}
```

**Behaviour:**
- Fetches `countries` table on first render, caches in component state.
- Renders a `<select>` (using existing `selectClass`) listing all countries sorted A–Z.
- Last option in the list: `＋ Add new country…` (value sentinel `__add__`).
- Selecting `__add__` does NOT submit the select — it prevents default, resets select to previous value, and opens a small inline modal.
- **Inline modal:** A centered overlay (same pattern as `ConfirmDialog`) with a single text input for the country name + Cancel / Add buttons.
  - On submit: `INSERT INTO countries (name)` → on success, refreshes the list, auto-selects the new entry, closes modal.
  - Duplicate name: surfaces the Supabase `23505` error as a toast "Country already exists."
- The component is self-contained; parent only receives `onChange(id)`.

## 3. Admin Page Changes

### 3.1 Airlines.tsx

- `Airline` interface: add `country_id: string | null`.
- `EMPTY_FORM`: add `country_id: ''`.
- Replace the text input for country (not yet present) with `<CountrySelect>`.
- Table: add **Country** column (resolved name via `countries` join or a lookup map built from the fetched list).
- `fetchAirlines`: `select('*, countries(name)')` so the name is available for display without a second round-trip.
- `handleSave` payload: `{ ..., country_id: form.country_id || null }`.
- Search filter: include country name in the match.
- `openEdit`: set `country_id`.

### 3.2 Hotels.tsx

Same changes as Airlines. The `Hotel` interface gains `country_id: string | null`. The form gains `<CountrySelect>` after the Location field. Table gains a **Country** column after Location.

### 3.3 Airports.tsx

- `Airport` interface in `types.ts`: replace `country: string` with `country_id: string` and `country_name?: string` (populated by join).
- `fetchAirports`: `select('*, countries(name)')`.
- Form: replace the Country text input with `<CountrySelect>`.
- Table: display `a.countries?.name ?? ''` (join result) in the Country column.
- Search filter: use the resolved name.

## 4. Out of Scope

- No standalone Countries admin page.
- No edit/delete of countries from the UI (migration handles the seed list; operators add via inline modal only).
- No additional Indonesian airports (per user decision).

## 5. File Changelist

| File | Change |
|------|--------|
| `supabase/migrations/20260615_countries_fk.sql` | New migration |
| `src/components/admin/CountrySelect.tsx` | New component |
| `src/pages/admin/Airlines.tsx` | Add country_id, CountrySelect, table column |
| `src/pages/admin/Hotels.tsx` | Add country_id, CountrySelect, table column |
| `src/pages/admin/Airports.tsx` | Migrate country text → country_id, CountrySelect |
| `types.ts` | Update Airport interface |
