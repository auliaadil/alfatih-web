# Country FK + Seed Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce a `countries` reference table, migrate airlines/hotels/airports to a `country_id` FK, populate seed data, and ship a shared `CountrySelect` inline-add dropdown across all three admin forms.

**Architecture:** One Supabase migration handles all schema + seed changes (countries table, FKs, data migration for airports.country text, seed rows for airlines/hotels/new airports). A single shared `CountrySelect` React component encapsulates the dropdown and inline add-country modal. Airlines, Hotels, and Airports pages are updated independently to use the component.

**Tech Stack:** React 18, TypeScript strict, Supabase JS v2, Tailwind CSS (CDN), Lucide React

---

## File Map

| File | Action |
|------|--------|
| `supabase/migrations/20260615_countries_fk.sql` | Create — all schema + seed SQL |
| `src/components/admin/CountrySelect.tsx` | Create — shared dropdown + inline add modal |
| `types.ts` | Modify — update `Airport` interface (`country` → `country_id` + `countries` join shape) |
| `src/pages/admin/Airlines.tsx` | Modify — add `country_id`, `CountrySelect`, Country table column |
| `src/pages/admin/Hotels.tsx` | Modify — add `country_id`, `CountrySelect`, Country table column |
| `src/pages/admin/Airports.tsx` | Modify — replace `country TEXT` with `country_id` FK + `CountrySelect` |

---

### Task 1: Write migration SQL

**Files:**
- Create: `supabase/migrations/20260615_countries_fk.sql`

- [ ] Create the file with the following content:

```sql
-- ============================================================
-- 1. countries reference table
-- ============================================================
CREATE TABLE countries (
  id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE
);

INSERT INTO countries (name) VALUES
  ('Indonesia'),
  ('Saudi Arabia'),
  ('UAE'),
  ('Qatar'),
  ('Turkey'),
  ('Oman'),
  ('Jordan'),
  ('Egypt'),
  ('Malaysia'),
  ('Singapore'),
  ('Thailand')
ON CONFLICT (name) DO NOTHING;

ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "countries_public_read" ON countries FOR SELECT USING (true);
CREATE POLICY "countries_auth_write"  ON countries FOR ALL   USING (auth.role() = 'authenticated');

-- ============================================================
-- 2. airlines — add country_id FK (nullable, no existing rows)
-- ============================================================
ALTER TABLE airlines ADD COLUMN IF NOT EXISTS country_id UUID REFERENCES countries(id);

-- ============================================================
-- 3. hotels — add country_id FK (nullable, no existing rows)
-- ============================================================
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS country_id UUID REFERENCES countries(id);

-- ============================================================
-- 4. airports — migrate country TEXT → country_id FK
-- ============================================================
ALTER TABLE airports ADD COLUMN IF NOT EXISTS country_id UUID REFERENCES countries(id);

UPDATE airports
SET country_id = (SELECT id FROM countries WHERE name = airports.country);

ALTER TABLE airports ALTER COLUMN country_id SET NOT NULL;
ALTER TABLE airports DROP COLUMN IF EXISTS country;

-- ============================================================
-- 5. Seed airlines (15 records)
-- ============================================================
INSERT INTO airlines (name, country_id) VALUES
  ('Garuda Indonesia',   (SELECT id FROM countries WHERE name = 'Indonesia')),
  ('Lion Air',           (SELECT id FROM countries WHERE name = 'Indonesia')),
  ('Batik Air',          (SELECT id FROM countries WHERE name = 'Indonesia')),
  ('Citilink',           (SELECT id FROM countries WHERE name = 'Indonesia')),
  ('Saudia',             (SELECT id FROM countries WHERE name = 'Saudi Arabia')),
  ('flynas',             (SELECT id FROM countries WHERE name = 'Saudi Arabia')),
  ('Emirates',           (SELECT id FROM countries WHERE name = 'UAE')),
  ('Air Arabia',         (SELECT id FROM countries WHERE name = 'UAE')),
  ('Etihad Airways',     (SELECT id FROM countries WHERE name = 'UAE')),
  ('Qatar Airways',      (SELECT id FROM countries WHERE name = 'Qatar')),
  ('Turkish Airlines',   (SELECT id FROM countries WHERE name = 'Turkey')),
  ('Oman Air',           (SELECT id FROM countries WHERE name = 'Oman')),
  ('Malaysia Airlines',  (SELECT id FROM countries WHERE name = 'Malaysia')),
  ('AirAsia',            (SELECT id FROM countries WHERE name = 'Malaysia')),
  ('Singapore Airlines', (SELECT id FROM countries WHERE name = 'Singapore'));

-- ============================================================
-- 6. Seed hotels (16 records)
-- ============================================================
INSERT INTO hotels (name, location, stars, room_types, country_id) VALUES
  ('Dar Al Tawhid Intercontinental', 'Makkah',   5, '[]', (SELECT id FROM countries WHERE name = 'Saudi Arabia')),
  ('Anjum Hotel Makkah',             'Makkah',   5, '[]', (SELECT id FROM countries WHERE name = 'Saudi Arabia')),
  ('Pullman ZamZam Makkah',          'Makkah',   5, '[]', (SELECT id FROM countries WHERE name = 'Saudi Arabia')),
  ('Swissotel Al Maqam Makkah',      'Makkah',   5, '[]', (SELECT id FROM countries WHERE name = 'Saudi Arabia')),
  ('Hilton Suites Makkah',           'Makkah',   5, '[]', (SELECT id FROM countries WHERE name = 'Saudi Arabia')),
  ('Le Meridien Towers Makkah',      'Makkah',   5, '[]', (SELECT id FROM countries WHERE name = 'Saudi Arabia')),
  ('Royal Dar Al Hijra',             'Makkah',   4, '[]', (SELECT id FROM countries WHERE name = 'Saudi Arabia')),
  ('Al Safwah Royale Orchid',        'Makkah',   4, '[]', (SELECT id FROM countries WHERE name = 'Saudi Arabia')),
  ('Anwar Al Madinah Mövenpick',     'Madinah',  5, '[]', (SELECT id FROM countries WHERE name = 'Saudi Arabia')),
  ('Dar Al Iman InterContinental',   'Madinah',  5, '[]', (SELECT id FROM countries WHERE name = 'Saudi Arabia')),
  ('Oberoi Madinah',                 'Madinah',  5, '[]', (SELECT id FROM countries WHERE name = 'Saudi Arabia')),
  ('Hilton Madinah',                 'Madinah',  5, '[]', (SELECT id FROM countries WHERE name = 'Saudi Arabia')),
  ('Al Shohada Hotel',               'Madinah',  4, '[]', (SELECT id FROM countries WHERE name = 'Saudi Arabia')),
  ('JW Marriott Hotel Dubai',        'Dubai',    5, '[]', (SELECT id FROM countries WHERE name = 'UAE')),
  ('Kempinski Mall of the Emirates', 'Dubai',    5, '[]', (SELECT id FROM countries WHERE name = 'UAE')),
  ('Conrad Istanbul Bosphorus',      'Istanbul', 5, '[]', (SELECT id FROM countries WHERE name = 'Turkey'));

-- ============================================================
-- 7. Seed additional airports (6 records)
-- ============================================================
INSERT INTO airports (iata_code, name, city, country_id) VALUES
  ('AUH', 'Abu Dhabi International',    'Abu Dhabi',    (SELECT id FROM countries WHERE name = 'UAE')),
  ('AMM', 'Queen Alia International',   'Amman',        (SELECT id FROM countries WHERE name = 'Jordan')),
  ('CAI', 'Cairo International',        'Cairo',        (SELECT id FROM countries WHERE name = 'Egypt')),
  ('KUL', 'Kuala Lumpur International', 'Kuala Lumpur', (SELECT id FROM countries WHERE name = 'Malaysia')),
  ('SIN', 'Changi International',       'Singapore',    (SELECT id FROM countries WHERE name = 'Singapore')),
  ('BKK', 'Suvarnabhumi International', 'Bangkok',      (SELECT id FROM countries WHERE name = 'Thailand'))
ON CONFLICT (iata_code) DO NOTHING;
```

- [ ] Commit:

```bash
git add supabase/migrations/20260615_countries_fk.sql
git commit -m "feat: add countries FK migration + seed data for airlines, hotels, airports"
```

---

### Task 2: Apply migration

- [ ] Push migration to Supabase:

```bash
supabase db push
```

Expected output: migration applies without errors. The `airports.country` column is dropped and replaced by `country_id`.

- [ ] Verify in the Supabase Dashboard → Table Editor:
  - `countries` table: 11 rows (Indonesia through Thailand)
  - `airlines` table: 15 rows, `country_id` column present and populated
  - `hotels` table: 16 rows, `country_id` column present and populated
  - `airports` table: 14 rows total (8 existing + 6 new), no `country` TEXT column, `country_id` NOT NULL

---

### Task 3: Create CountrySelect component

**Files:**
- Create: `src/components/admin/CountrySelect.tsx`

- [ ] Create `src/components/admin/CountrySelect.tsx`:

```tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { selectClass, inputClass, btnPrimary, btnSecondary, useToast } from './ui';

interface Country { id: string; name: string; }

interface CountrySelectProps {
  value: string;
  onChange: (id: string) => void;
  required?: boolean;
}

const CountrySelect: React.FC<CountrySelectProps> = ({ value, onChange, required }) => {
  const toast = useToast();
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchCountries(); }, []);

  const fetchCountries = async () => {
    setLoading(true);
    const { data } = await supabase.from('countries').select('id, name').order('name');
    if (data) setCountries(data);
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === '__add__') {
      setModalOpen(true);
      return;
    }
    onChange(e.target.value);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data, error } = await supabase
      .from('countries')
      .insert([{ name: newName.trim() }])
      .select('id, name')
      .single();
    setSaving(false);
    if (error) {
      toast('error', error.code === '23505' ? 'Country already exists.' : 'Failed to add country.');
      return;
    }
    await fetchCountries();
    onChange(data.id);
    setNewName('');
    setModalOpen(false);
  };

  return (
    <>
      <select
        className={selectClass}
        value={value}
        onChange={handleChange}
        required={required}
        disabled={loading}
      >
        <option value="">Select country…</option>
        {countries.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
        <option value="__add__">＋ Add new country…</option>
      </select>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Add Country</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <input
                type="text"
                required
                autoFocus
                className={inputClass}
                placeholder="e.g., Kuwait"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => { setModalOpen(false); setNewName(''); }}
                  className={btnSecondary}
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} className={btnPrimary}>
                  {saving ? 'Adding…' : 'Add Country'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default CountrySelect;
```

- [ ] Commit:

```bash
git add src/components/admin/CountrySelect.tsx
git commit -m "feat: add CountrySelect component with inline add-country modal"
```

---

### Task 4: Update Airport interface in types.ts

**Files:**
- Modify: `types.ts:8-14`

- [ ] Replace the `Airport` interface:

Old:
```ts
export interface Airport {
  id: string;
  iata_code: string;
  name: string;
  city: string;
  country: string;
}
```

New:
```ts
export interface Airport {
  id: string;
  iata_code: string;
  name: string;
  city: string;
  country_id: string;
  countries?: { name: string };
}
```

- [ ] Commit:

```bash
git add types.ts
git commit -m "feat: update Airport interface — country TEXT to country_id FK"
```

---

### Task 5: Update Airlines.tsx

**Files:**
- Modify: `src/pages/admin/Airlines.tsx`

- [ ] Update the `Airline` interface (line 10):

Old:
```ts
interface Airline { id: string; name: string; logo_url: string | null; }
```

New:
```ts
interface Airline {
  id: string;
  name: string;
  logo_url: string | null;
  country_id: string | null;
  countries: { name: string } | null;
}
```

- [ ] Update `EMPTY_FORM` (line 12):

Old:
```ts
const EMPTY_FORM = { name: '', logo_url: '' };
```

New:
```ts
const EMPTY_FORM = { name: '', logo_url: '', country_id: '' };
```

- [ ] Add import for `CountrySelect` after the existing imports block (after line 8):

```ts
import CountrySelect from '../../components/admin/CountrySelect';
```

- [ ] Update `fetchAirlines` query (line 71):

Old:
```ts
const { data, error } = await supabase.from('airlines').select('*').order('name');
```

New:
```ts
const { data, error } = await supabase.from('airlines').select('*, countries(name)').order('name');
```

- [ ] Update `openEdit` to populate `country_id` (line 83–88):

Old:
```ts
const openEdit = (airline: Airline) => {
    setEditingId(airline.id);
    setForm({ name: airline.name, logo_url: airline.logo_url || '' });
    setLogoTab(airline.logo_url ? 'url' : 'upload');
    setIsFormOpen(true);
};
```

New:
```ts
const openEdit = (airline: Airline) => {
    setEditingId(airline.id);
    setForm({ name: airline.name, logo_url: airline.logo_url || '', country_id: airline.country_id || '' });
    setLogoTab(airline.logo_url ? 'url' : 'upload');
    setIsFormOpen(true);
};
```

- [ ] Update `handleSave` payload (line 93):

Old:
```ts
const payload = { name: form.name, logo_url: form.logo_url || null };
```

New:
```ts
const payload = { name: form.name, logo_url: form.logo_url || null, country_id: form.country_id || null };
```

- [ ] Update `filtered` to search by country name (lines 132–134):

Old:
```ts
const filtered = airlines.filter((a) =>
    (a.name ?? '').toLowerCase().includes(searchQuery.toLowerCase())
);
```

New:
```ts
const filtered = airlines.filter((a) =>
    [a.name, a.countries?.name].some((f) =>
        (f ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    )
);
```

- [ ] In the table `<THead>`, add Country column after Airline Name:

Old:
```tsx
<Th sortKey="name" currentSort={sort} onSort={handleSort}>Airline Name</Th>
<Th align="right">Actions</Th>
```

New:
```tsx
<Th sortKey="name" currentSort={sort} onSort={handleSort}>Airline Name</Th>
<Th>Country</Th>
<Th align="right">Actions</Th>
```

- [ ] In the table row, add Country `<Td>` after the Airline Name cell:

Old:
```tsx
<Td>
    <span className="font-medium text-gray-900">{airline.name}</span>
</Td>
<Td className="text-right">
```

New:
```tsx
<Td>
    <span className="font-medium text-gray-900">{airline.name}</span>
</Td>
<Td>
    <span className="text-gray-600">{airline.countries?.name ?? '—'}</span>
</Td>
<Td className="text-right">
```

- [ ] Update both `colSpan={3}` values in the EmptyState `<td>` cells to `colSpan={4}` (there are two — one for empty list, one for no-search-results).

- [ ] Add Country field to the form, after the Airline Name `<FormField>` block (after the `</FormField>` that wraps the name input):

```tsx
<FormField label="Country">
    <CountrySelect
        value={form.country_id}
        onChange={(id) => setForm((f) => ({ ...f, country_id: id }))}
    />
</FormField>
```

- [ ] Commit:

```bash
git add src/pages/admin/Airlines.tsx
git commit -m "feat: add country to Airlines admin (FK + CountrySelect + table column)"
```

---

### Task 6: Update Hotels.tsx

**Files:**
- Modify: `src/pages/admin/Hotels.tsx`

- [ ] Update the `Hotel` interface (line 13):

Old:
```ts
interface Hotel { id: string; name: string; location: string; stars: number; room_types: RoomTypeRow[]; maps_url: string | null; }
```

New:
```ts
interface Hotel {
  id: string;
  name: string;
  location: string;
  stars: number;
  room_types: RoomTypeRow[];
  maps_url: string | null;
  country_id: string | null;
  countries: { name: string } | null;
}
```

- [ ] Update `EMPTY_FORM` (line 15):

Old:
```ts
const EMPTY_FORM = { name: '', location: '', stars: 3, room_types: [] as RoomTypeRow[], maps_url: '' };
```

New:
```ts
const EMPTY_FORM = { name: '', location: '', stars: 3, room_types: [] as RoomTypeRow[], maps_url: '', country_id: '' };
```

- [ ] Add import for `CountrySelect` after the existing imports block:

```ts
import CountrySelect from '../../components/admin/CountrySelect';
```

- [ ] Update `fetchHotels` query (line 51–53):

Old:
```ts
const { data, error } = await supabase.from('hotels').select('*').order('name');
```

New:
```ts
const { data, error } = await supabase.from('hotels').select('*, countries(name)').order('name');
```

- [ ] Update `openEdit` to populate `country_id` (line 63–66):

Old:
```ts
const openEdit = (hotel: Hotel) => {
    setEditingId(hotel.id);
    setForm({ name: hotel.name, location: hotel.location, stars: hotel.stars, room_types: hotel.room_types ?? [], maps_url: hotel.maps_url || '' });
    setIsFormOpen(true);
};
```

New:
```ts
const openEdit = (hotel: Hotel) => {
    setEditingId(hotel.id);
    setForm({ name: hotel.name, location: hotel.location, stars: hotel.stars, room_types: hotel.room_types ?? [], maps_url: hotel.maps_url || '', country_id: hotel.country_id || '' });
    setIsFormOpen(true);
};
```

- [ ] Update `handleSave` payload (line 72):

Old:
```ts
const payload = { name: form.name, location: form.location, stars: form.stars, room_types: form.room_types, maps_url: form.maps_url || null };
```

New:
```ts
const payload = { name: form.name, location: form.location, stars: form.stars, room_types: form.room_types, maps_url: form.maps_url || null, country_id: form.country_id || null };
```

- [ ] Update `filtered` to search by country name (lines 116–120):

Old:
```ts
const filtered = hotels.filter((h) =>
    [h.name, h.location].some((f) =>
        (f ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    )
);
```

New:
```ts
const filtered = hotels.filter((h) =>
    [h.name, h.location, h.countries?.name].some((f) =>
        (f ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    )
);
```

- [ ] In the table `<THead>`, add Country column after Location:

Old:
```tsx
<Th sortKey="location" currentSort={sort} onSort={handleSort}>Location</Th>
<Th sortKey="stars" currentSort={sort} onSort={handleSort}>Rating</Th>
```

New:
```tsx
<Th sortKey="location" currentSort={sort} onSort={handleSort}>Location</Th>
<Th>Country</Th>
<Th sortKey="stars" currentSort={sort} onSort={handleSort}>Rating</Th>
```

- [ ] In the table row, add Country `<Td>` after the Location cell:

Old:
```tsx
<Td>
    <span className="text-gray-600">{hotel.location}</span>
</Td>
<Td>
    <StarRating count={hotel.stars} />
</Td>
```

New:
```tsx
<Td>
    <span className="text-gray-600">{hotel.location}</span>
</Td>
<Td>
    <span className="text-gray-600">{hotel.countries?.name ?? '—'}</span>
</Td>
<Td>
    <StarRating count={hotel.stars} />
</Td>
```

- [ ] Update both `colSpan={4}` values in the EmptyState `<td>` cells to `colSpan={5}`.

- [ ] Add Country field to the form, after the Location `<FormField>` block and before the Google Maps Link field:

```tsx
<FormField label="Country">
    <CountrySelect
        value={form.country_id}
        onChange={(id) => setForm((f) => ({ ...f, country_id: id }))}
    />
</FormField>
```

- [ ] Commit:

```bash
git add src/pages/admin/Hotels.tsx
git commit -m "feat: add country to Hotels admin (FK + CountrySelect + table column)"
```

---

### Task 7: Update Airports.tsx

**Files:**
- Modify: `src/pages/admin/Airports.tsx`

- [ ] Update `EMPTY_FORM` (line 11):

Old:
```ts
const EMPTY_FORM = { iata_code: '', name: '', city: '', country: '' };
```

New:
```ts
const EMPTY_FORM = { iata_code: '', name: '', city: '', country_id: '' };
```

- [ ] Add import for `CountrySelect` after the existing imports block:

```ts
import CountrySelect from '../../components/admin/CountrySelect';
```

- [ ] Update `fetchAirports` query (line 35–36):

Old:
```ts
const { data, error } = await supabase.from('airports').select('*').order('iata_code');
```

New:
```ts
const { data, error } = await supabase.from('airports').select('*, countries(name)').order('iata_code');
```

- [ ] Update `openEdit` to use `country_id` (line 43–46):

Old:
```ts
const openEdit = (a: Airport) => {
    setEditingId(a.id);
    setForm({ iata_code: a.iata_code, name: a.name, city: a.city, country: a.country });
    setIsFormOpen(true);
};
```

New:
```ts
const openEdit = (a: Airport) => {
    setEditingId(a.id);
    setForm({ iata_code: a.iata_code, name: a.name, city: a.city, country_id: a.country_id });
    setIsFormOpen(true);
};
```

- [ ] Update `filtered` to search by country name (lines 74–78):

Old:
```ts
const filtered = airports.filter((a) =>
    [a.iata_code, a.name, a.city, a.country].some((f) =>
      (f ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    )
);
```

New:
```ts
const filtered = airports.filter((a) =>
    [a.iata_code, a.name, a.city, a.countries?.name].some((f) =>
      (f ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    )
);
```

- [ ] Update the Country `<Td>` in the table row to use the join result (line 126):

Old:
```tsx
<Td><span className="text-gray-600">{a.country}</span></Td>
```

New:
```tsx
<Td><span className="text-gray-600">{a.countries?.name ?? ''}</span></Td>
```

- [ ] In the form, replace the Country text `<input>` with `CountrySelect` (line 148):

Old:
```tsx
<FormField label="Country" required><input type="text" required className={inputClass} placeholder="e.g., Indonesia" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></FormField>
```

New:
```tsx
<FormField label="Country" required>
    <CountrySelect
        value={form.country_id}
        onChange={(id) => setForm({ ...form, country_id: id })}
        required
    />
</FormField>
```

- [ ] Commit:

```bash
git add src/pages/admin/Airports.tsx
git commit -m "feat: migrate Airports to country_id FK + CountrySelect"
```

---

### Task 8: Verify in browser

- [ ] Start the dev server:

```bash
npm run dev
```

- [ ] **Airlines** (`/admin/airlines`):
  - Table shows Logo / Airline Name / Country / Actions columns
  - All 15 seeded airlines show their country name (e.g., Garuda Indonesia → Indonesia)
  - Click **Add Airline** → form has a Country dropdown listing all 11 countries + "＋ Add new country…"
  - Select "＋ Add new country…" → inline modal opens, type "Kuwait", click **Add Country** → dropdown refreshes and auto-selects Kuwait
  - Save the airline → it appears in the table with "Kuwait" in the Country column
  - Search "saudi" → filters to airlines from Saudi Arabia

- [ ] **Hotels** (`/admin/hotels`):
  - Table shows Hotel Name / Location / Country / Rating / Actions columns
  - Seeded hotels show Saudi Arabia, UAE, or Turkey in Country column
  - Add/Edit form shows Country after Location field
  - Inline add-country modal works identically

- [ ] **Airports** (`/admin/airports`):
  - Table Country column shows country names (not IDs)
  - Edit an existing airport (e.g., CGK) → Country select pre-fills to "Indonesia"
  - Adding a new airport works with CountrySelect (required field)
  - Search "malaysia" returns KUL

- [ ] Commit any fixups discovered during verification:

```bash
git add -p
git commit -m "fix: post-verification fixups for country FK feature"
```
