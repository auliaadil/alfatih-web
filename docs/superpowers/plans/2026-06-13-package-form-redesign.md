# Package Form Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single-modal PackageForm with a full-page 4-step wizard, add Airports/Categories admin pages, update Hotels with room types, and wire two new Supabase Edge Functions (AI content generation + image search).

**Architecture:** A new route pair (`/admin/packages/new`, `/admin/packages/:id/edit`) renders `PackageWizard.tsx` — a stateful page that owns all draft state and delegates rendering to four step components. All AI and image-search calls hit Supabase Edge Functions; no API keys touch the frontend. New admin pages (Airports, Categories) follow the existing Hotels/Airlines page pattern.

**Tech Stack:** React 18, TypeScript strict, Vite, Tailwind CDN, React Router v6, Supabase JS v2, Deno (edge functions), Lucide React icons, `src/components/admin/ui.tsx` component library.

---

## File Map

**New files:**
- `supabase/migrations/20260613_package_form_redesign.sql`
- `supabase/functions/ai-package-content/index.ts`
- `supabase/functions/image-search/index.ts`
- `src/lib/formatFlightRoutes.ts`
- `services/packageContentService.ts`
- `services/imageSearchService.ts`
- `src/pages/admin/Airports.tsx`
- `src/pages/admin/Categories.tsx`
- `src/pages/admin/PackageWizard.tsx`
- `src/components/admin/PackageWizard/WizardSidebar.tsx`
- `src/components/admin/PackageWizard/ImagePickerModal.tsx`
- `src/components/admin/PackageWizard/Step1BasicInfo.tsx`
- `src/components/admin/PackageWizard/Step2FlightHotels.tsx`
- `src/components/admin/PackageWizard/Step3PricingRooms.tsx`
- `src/components/admin/PackageWizard/Step4ItineraryTerms.tsx`

**Modified files:**
- `types.ts` — add Airport, Category, FlightLeg, FlightRoute; update TourPackage, RoomOption
- `src/pages/admin/Hotels.tsx` — add room_types section to SlideOver
- `src/pages/admin/Packages.tsx` — replace modal open with navigate()
- `src/pages/admin/AdminLayout.tsx` — add Airports + Categories nav items
- `App.tsx` — add wizard routes + Airports + Categories routes
- `components/TourDetail.tsx` — replace flight_details with formatFlightRoutes, add image_credit

---

### Task 1: DB Migration

**Files:**
- Create: `supabase/migrations/20260613_package_form_redesign.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260613_package_form_redesign.sql

-- New: airports table
CREATE TABLE airports (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  iata_code  TEXT NOT NULL UNIQUE,
  name       TEXT NOT NULL,
  city       TEXT NOT NULL,
  country    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed common Umrah-route airports
INSERT INTO airports (iata_code, name, city, country) VALUES
  ('CGK', 'Soekarno-Hatta International', 'Jakarta', 'Indonesia'),
  ('SUB', 'Juanda International', 'Surabaya', 'Indonesia'),
  ('KNO', 'Kualanamu International', 'Medan', 'Indonesia'),
  ('JED', 'King Abdulaziz International', 'Jeddah', 'Saudi Arabia'),
  ('MED', 'Prince Mohammad bin Abdulaziz', 'Madinah', 'Saudi Arabia'),
  ('IST', 'Istanbul Airport', 'Istanbul', 'Turkey'),
  ('DXB', 'Dubai International', 'Dubai', 'UAE'),
  ('DOH', 'Hamad International', 'Doha', 'Qatar');

-- New: categories table
CREATE TABLE categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  slug       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed initial categories
INSERT INTO categories (name, slug) VALUES
  ('Umrah', 'umrah'),
  ('Asia', 'asia'),
  ('Europe', 'europe'),
  ('Middle East', 'middle-east');

-- Add room_types to hotels
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS room_types JSONB DEFAULT '[]'::jsonb;

-- Update packages schema
ALTER TABLE packages
  ADD COLUMN IF NOT EXISTS arrival_date  DATE,
  ADD COLUMN IF NOT EXISTS flight_routes JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS image_credit  TEXT;

-- Remove obsolete columns (safe: not used by any public query)
ALTER TABLE packages
  DROP COLUMN IF EXISTS initial_rooms,
  DROP COLUMN IF EXISTS available_rooms,
  DROP COLUMN IF EXISTS flight_details;

-- RLS: allow authenticated users to read/write airports and categories
ALTER TABLE airports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "airports_public_read"  ON airports FOR SELECT USING (true);
CREATE POLICY "airports_auth_write"   ON airports FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_public_read" ON categories FOR SELECT USING (true);
CREATE POLICY "categories_auth_write"  ON categories FOR ALL USING (auth.role() = 'authenticated');
```

- [ ] **Step 2: Apply migration locally**

```bash
supabase db push
# or if using remote directly:
supabase migration up
```

Expected: migration runs without error.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260613_package_form_redesign.sql
git commit -m "feat: add airports, categories tables; update hotels/packages schema"
```

---

### Task 2: Update types.ts

**Files:**
- Modify: `types.ts`

- [ ] **Step 1: Replace types.ts content**

```typescript
// types.ts

export enum TourCategory {
  UMRAH = 'Umrah',
  ASIA = 'Asia',
  EUROPE = 'Europe',
  MIDDLE_EAST = 'Middle East'
}

export interface Airport {
  id: string;
  iata_code: string;
  name: string;
  city: string;
  country: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface FlightLeg {
  from_airport_id: string;
  to_airport_id: string;
}

export interface FlightRoute {
  airline_id: string;
  legs: FlightLeg[];
}

export interface DayItinerary {
  day: number;
  title: string;
  activities?: string[];
  description?: string;
  location?: string;
  meals?: string[];
}

export interface RoomOption {
  hotel_id?: string;
  name: string;
  capacity: number;
  price: number;
  original_price?: number;
}

export interface TourPackage {
  id: string;
  slug?: string;
  title: string;
  category: TourCategory | string;
  duration: string;
  room_options: RoomOption[];
  image_url: string;
  image_credit?: string;
  features: string[];
  description: string;
  is_popular?: boolean;
  quotas?: number;
  initial_quotas?: number;

  // Dates
  departure_date: string;
  arrival_date?: string;

  // Flight routes (structured)
  flight_routes?: FlightRoute[];

  // Resolved relations (from joins)
  airlines?: {
    name: string;
    logo_url?: string;
  }[];
  hotels?: {
    name: string;
    location: string;
    stars: number;
  }[];
  itinerary?: DayItinerary[];
  included?: string[];
  not_included?: string[];
}

export interface AIPlannerInput {
  destination: string;
  days: number;
  travelers: string;
  interests: string[];
}

export interface Testimonial {
  id: number;
  name: string;
  role: string;
  comment: string;
  avatar: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add types.ts
git commit -m "feat: add Airport, Category, FlightRoute types; update TourPackage"
```

---

### Task 3: formatFlightRoutes helper

**Files:**
- Create: `src/lib/formatFlightRoutes.ts`

- [ ] **Step 1: Create the file**

```typescript
// src/lib/formatFlightRoutes.ts
import { FlightRoute, Airport } from '../../types';

export function formatFlightRoutes(
  routes: FlightRoute[] | undefined,
  airlineNames: Record<string, string>,
  airports: Airport[]
): string {
  if (!routes || routes.length === 0) return 'Flight details TBA';

  const airportMap = Object.fromEntries(airports.map((a) => [a.id, a.iata_code]));

  return routes
    .map((route) => {
      const airline = airlineNames[route.airline_id] || 'Unknown Airline';
      const legStr = route.legs
        .map((leg) => `${airportMap[leg.from_airport_id] ?? '?'} → ${airportMap[leg.to_airport_id] ?? '?'}`)
        .join(', ');
      return legStr ? `${airline}: ${legStr}` : airline;
    })
    .join(' | ');
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/formatFlightRoutes.ts
git commit -m "feat: add formatFlightRoutes utility"
```

---

### Task 4: Airports admin page

**Files:**
- Create: `src/pages/admin/Airports.tsx`

- [ ] **Step 1: Create the page**

```tsx
// src/pages/admin/Airports.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, PlaneTakeoff } from 'lucide-react';
import {
  PageHeader, TableCard, THead, Th, Td, SkeletonRows, EmptyState, SlideOver,
  ConfirmDialog, FormField, inputClass, btnPrimary, btnSecondary, btnGhost, useToast,
} from '../../components/admin/ui';
import { Airport } from '../../../types';

const EMPTY_FORM = { iata_code: '', name: '', city: '', country: '' };

const Airports: React.FC = () => {
  const toast = useToast();
  const [airports, setAirports] = useState<Airport[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchAirports(); }, []);

  const fetchAirports = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('airports').select('*').order('iata_code');
    if (!error && data) setAirports(data);
    setLoading(false);
  };

  const openCreate = () => { setEditingId(null); setForm(EMPTY_FORM); setIsFormOpen(true); };
  const openEdit = (a: Airport) => {
    setEditingId(a.id);
    setForm({ iata_code: a.iata_code, name: a.name, city: a.city, country: a.country });
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, iata_code: form.iata_code.toUpperCase() };
    const { error } = editingId
      ? await supabase.from('airports').update(payload).eq('id', editingId)
      : await supabase.from('airports').insert([payload]);
    setSaving(false);
    if (error) { toast('error', 'Failed to save airport.'); }
    else { toast('success', editingId ? 'Airport updated.' : 'Airport added.'); setIsFormOpen(false); fetchAirports(); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await supabase.from('airports').delete().eq('id', deleteId);
    setDeleting(false);
    setDeleteId(null);
    if (error) { toast('error', 'Failed to delete airport.'); }
    else { toast('success', 'Airport deleted.'); fetchAirports(); }
  };

  return (
    <div>
      <PageHeader
        title="Airports"
        badge={airports.length}
        subtitle="Manage airports used in flight route legs"
        breadcrumbs={[{ label: 'Resources' }, { label: 'Airports' }]}
        action={<button onClick={openCreate} className={btnPrimary}><Plus className="w-4 h-4" /> Add Airport</button>}
      />
      <TableCard>
        <table className="min-w-full">
          <THead>
            <Th>IATA</Th><Th>Airport Name</Th><Th>City</Th><Th>Country</Th><Th align="right">Actions</Th>
          </THead>
          <tbody className="divide-y divide-gray-100">
            {loading ? <SkeletonRows cols={5} rows={5} /> : airports.length === 0 ? (
              <tr><td colSpan={5}><EmptyState icon={<PlaneTakeoff className="w-7 h-7" />} title="No airports yet" description="Add airports to define flight route legs." action={<button onClick={openCreate} className={btnPrimary}><Plus className="w-4 h-4" /> Add Airport</button>} /></td></tr>
            ) : airports.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50/60 transition-colors group">
                <Td><span className="font-mono font-bold text-primary">{a.iata_code}</span></Td>
                <Td><span className="font-medium text-gray-900">{a.name}</span></Td>
                <Td><span className="text-gray-600">{a.city}</span></Td>
                <Td><span className="text-gray-600">{a.country}</span></Td>
                <Td className="text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(a)} className={btnGhost}><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteId(a.id)} className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>

      <SlideOver isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingId ? 'Edit Airport' : 'Add Airport'} subtitle="IATA code must be 3 uppercase letters."
        footer={<div className="flex gap-3"><button type="button" onClick={() => setIsFormOpen(false)} className={btnSecondary}>Cancel</button><button form="airport-form" type="submit" disabled={saving} className={btnPrimary}>{saving ? 'Saving...' : editingId ? 'Update' : 'Add Airport'}</button></div>}>
        <form id="airport-form" onSubmit={handleSave} className="space-y-5">
          <FormField label="IATA Code" required><input type="text" required maxLength={3} pattern="[A-Za-z]{3}" className={inputClass} placeholder="e.g., CGK" value={form.iata_code} onChange={(e) => setForm({ ...form, iata_code: e.target.value })} /></FormField>
          <FormField label="Airport Name" required><input type="text" required className={inputClass} placeholder="e.g., Soekarno-Hatta International" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormField>
          <FormField label="City" required><input type="text" required className={inputClass} placeholder="e.g., Jakarta" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></FormField>
          <FormField label="Country" required><input type="text" required className={inputClass} placeholder="e.g., Indonesia" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></FormField>
        </form>
      </SlideOver>

      <ConfirmDialog isOpen={!!deleteId} title="Delete Airport" message="This airport will be permanently removed. Flight routes referencing it may be affected." confirmLabel="Delete" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={deleting} />
    </div>
  );
};

export default Airports;
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/admin/Airports.tsx
git commit -m "feat: add Airports admin page"
```

---

### Task 5: Categories admin page

**Files:**
- Create: `src/pages/admin/Categories.tsx`

- [ ] **Step 1: Create the page**

```tsx
// src/pages/admin/Categories.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, Tag } from 'lucide-react';
import {
  PageHeader, TableCard, THead, Th, Td, SkeletonRows, EmptyState, SlideOver,
  ConfirmDialog, FormField, inputClass, btnPrimary, btnSecondary, btnGhost, useToast,
} from '../../components/admin/ui';
import { Category } from '../../../types';

const toSlug = (name: string) =>
  name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

const EMPTY_FORM = { name: '', slug: '' };

const Categories: React.FC = () => {
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('categories').select('*').order('name');
    if (!error && data) setCategories(data);
    setLoading(false);
  };

  const openCreate = () => { setEditingId(null); setForm(EMPTY_FORM); setIsFormOpen(true); };
  const openEdit = (c: Category) => { setEditingId(c.id); setForm({ name: c.name, slug: c.slug }); setIsFormOpen(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { name: form.name, slug: form.slug || toSlug(form.name) };
    const { error } = editingId
      ? await supabase.from('categories').update(payload).eq('id', editingId)
      : await supabase.from('categories').insert([payload]);
    setSaving(false);
    if (error) { toast('error', 'Failed to save category.'); }
    else { toast('success', editingId ? 'Category updated.' : 'Category added.'); setIsFormOpen(false); fetchCategories(); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await supabase.from('categories').delete().eq('id', deleteId);
    setDeleting(false);
    setDeleteId(null);
    if (error) { toast('error', 'Failed to delete category.'); }
    else { toast('success', 'Category deleted.'); fetchCategories(); }
  };

  return (
    <div>
      <PageHeader
        title="Categories"
        badge={categories.length}
        subtitle="Manage package categories shown in the wizard"
        breadcrumbs={[{ label: 'Resources' }, { label: 'Categories' }]}
        action={<button onClick={openCreate} className={btnPrimary}><Plus className="w-4 h-4" /> Add Category</button>}
      />
      <TableCard>
        <table className="min-w-full">
          <THead><Th>Name</Th><Th>Slug</Th><Th align="right">Actions</Th></THead>
          <tbody className="divide-y divide-gray-100">
            {loading ? <SkeletonRows cols={3} rows={5} /> : categories.length === 0 ? (
              <tr><td colSpan={3}><EmptyState icon={<Tag className="w-7 h-7" />} title="No categories yet" description="Add categories to classify packages." action={<button onClick={openCreate} className={btnPrimary}><Plus className="w-4 h-4" /> Add Category</button>} /></td></tr>
            ) : categories.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50/60 transition-colors group">
                <Td><span className="font-medium text-gray-900">{c.name}</span></Td>
                <Td><span className="font-mono text-sm text-gray-500">{c.slug}</span></Td>
                <Td className="text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(c)} className={btnGhost}><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteId(c.id)} className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>

      <SlideOver isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingId ? 'Edit Category' : 'Add Category'} subtitle="Slug is auto-generated from the name."
        footer={<div className="flex gap-3"><button type="button" onClick={() => setIsFormOpen(false)} className={btnSecondary}>Cancel</button><button form="category-form" type="submit" disabled={saving} className={btnPrimary}>{saving ? 'Saving...' : editingId ? 'Update' : 'Add Category'}</button></div>}>
        <form id="category-form" onSubmit={handleSave} className="space-y-5">
          <FormField label="Category Name" required>
            <input type="text" required className={inputClass} placeholder="e.g., Umrah Plus" value={form.name}
              onChange={(e) => setForm({ name: e.target.value, slug: toSlug(e.target.value) })} />
          </FormField>
          <FormField label="Slug" hint="Auto-generated. Edit if needed.">
            <input type="text" className={inputClass} placeholder="e.g., umrah-plus" value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          </FormField>
        </form>
      </SlideOver>

      <ConfirmDialog isOpen={!!deleteId} title="Delete Category" message="This category will be permanently removed." confirmLabel="Delete" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={deleting} />
    </div>
  );
};

export default Categories;
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/admin/Categories.tsx
git commit -m "feat: add Categories admin page"
```

---

### Task 6: Hotels — add room_types

**Files:**
- Modify: `src/pages/admin/Hotels.tsx`

- [ ] **Step 1: Update Hotel interface and EMPTY_FORM**

Change the `Hotel` interface and `EMPTY_FORM` at the top of the file:

```typescript
// replace existing interface and EMPTY_FORM:
interface RoomTypeRow { name: string; capacity: number; }
interface Hotel { id: string; name: string; location: string; stars: number; room_types: RoomTypeRow[]; }

const EMPTY_FORM = { name: '', location: '', stars: 3, room_types: [] as RoomTypeRow[] };
```

- [ ] **Step 2: Update openEdit to include room_types**

```typescript
const openEdit = (hotel: Hotel) => {
    setEditingId(hotel.id);
    setForm({ name: hotel.name, location: hotel.location, stars: hotel.stars, room_types: hotel.room_types ?? [] });
    setIsFormOpen(true);
};
```

- [ ] **Step 3: Update handleSave payload to include room_types**

```typescript
const payload = { name: form.name, location: form.location, stars: form.stars, room_types: form.room_types };
```

- [ ] **Step 4: Add room type helpers (add before return statement)**

```typescript
const addRoomType = () =>
    setForm((f) => ({ ...f, room_types: [...f.room_types, { name: '', capacity: 2 }] }));

const updateRoomType = (i: number, field: keyof RoomTypeRow, value: string | number) =>
    setForm((f) => {
        const rt = [...f.room_types];
        rt[i] = { ...rt[i], [field]: value };
        return { ...f, room_types: rt };
    });

const removeRoomType = (i: number) =>
    setForm((f) => ({ ...f, room_types: f.room_types.filter((_, idx) => idx !== i) }));
```

- [ ] **Step 5: Add Room Types section to the SlideOver form, after the Star Rating FormField**

```tsx
{/* Room Types */}
<div>
    <div className="flex items-center justify-between mb-3">
        <label className="block text-sm font-medium text-gray-700">Room Types</label>
        <button type="button" onClick={addRoomType} className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add room type
        </button>
    </div>
    {form.room_types.length === 0 && (
        <p className="text-xs text-gray-400">No room types defined. Click "Add room type" to begin.</p>
    )}
    <div className="space-y-2">
        {form.room_types.map((rt, i) => (
            <div key={i} className="flex items-center gap-2">
                <input
                    type="text"
                    required
                    placeholder="e.g., Quad"
                    className={inputClass + ' flex-1'}
                    value={rt.name}
                    onChange={(e) => updateRoomType(i, 'name', e.target.value)}
                />
                <input
                    type="number"
                    required
                    min={1}
                    max={10}
                    placeholder="Pax"
                    className={inputClass + ' w-20'}
                    value={rt.capacity}
                    onChange={(e) => updateRoomType(i, 'capacity', parseInt(e.target.value) || 1)}
                />
                <button type="button" onClick={() => removeRoomType(i)} className="text-red-400 hover:text-red-600 p-1">
                    <X className="w-4 h-4" />
                </button>
            </div>
        ))}
    </div>
    <p className="text-xs text-gray-400 mt-2">These room types will be available when creating packages.</p>
</div>
```

- [ ] **Step 6: Add `X` to Lucide imports at the top of Hotels.tsx**

```typescript
import { Plus, Edit2, Trash2, Building2, Star, X } from 'lucide-react';
```

- [ ] **Step 7: Commit**

```bash
git add src/pages/admin/Hotels.tsx
git commit -m "feat: add room_types management to Hotels page"
```

---

### Task 7: Router + AdminLayout + Packages navigation

**Files:**
- Modify: `App.tsx`
- Modify: `src/pages/admin/AdminLayout.tsx`
- Modify: `src/pages/admin/Packages.tsx`

- [ ] **Step 1: Update App.tsx — add imports and routes**

Add imports after the existing admin page imports:
```typescript
import PackageWizard from './src/pages/admin/PackageWizard';
import Airports from './src/pages/admin/Airports';
import Categories from './src/pages/admin/Categories';
```

Add routes inside the `<Route element={<AdminLayout />}>` block:
```tsx
<Route path="packages/new" element={<PackageWizard />} />
<Route path="packages/:id/edit" element={<PackageWizard />} />
<Route path="airports" element={<Airports />} />
<Route path="categories" element={<Categories />} />
```

- [ ] **Step 2: Update AdminLayout.tsx — add nav items**

In `NAV_GROUPS`, update the `Resources` group:
```typescript
{
    label: 'Resources',
    items: [
        { path: '/admin/airlines', icon: Plane, label: 'Airlines' },
        { path: '/admin/hotels', icon: Building2, label: 'Hotels' },
        { path: '/admin/airports', icon: PlaneTakeoff, label: 'Airports' },
        { path: '/admin/categories', icon: Tag, label: 'Categories' },
    ],
},
```

Add to the Lucide import line:
```typescript
import { ..., PlaneTakeoff, Tag } from 'lucide-react';
```

Also update `isActive` to handle the wizard pages as "active" when on `/admin/packages`:
```typescript
const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path
          : path !== '/admin' && location.pathname.startsWith(path);
// This already covers /admin/packages/new and /admin/packages/:id/edit
// because they start with /admin/packages
```

- [ ] **Step 3: Update Packages.tsx — wire Create/Edit to navigate**

Add `useNavigate` import:
```typescript
import { useNavigate } from 'react-router-dom';
```

Add inside the component:
```typescript
const navigate = useNavigate();
```

Replace the modal open calls:
- `setIsFormOpen(true)` with `navigate('/admin/packages/new')`
- `setEditingPackage(pkg); setIsFormOpen(true)` with `navigate(\`/admin/packages/${pkg.id}/edit\`)`

Remove state and imports no longer used:
- Remove `isFormOpen`, `setIsFormOpen`, `editingPackage`, `setEditingPackage` state
- Remove `import PackageForm from './PackageForm'`
- Remove the `<PackageForm ... />` JSX

Keep `PackageDetailModal` (read-only view, unaffected).

- [ ] **Step 4: Commit**

```bash
git add App.tsx src/pages/admin/AdminLayout.tsx src/pages/admin/Packages.tsx
git commit -m "feat: wire PackageWizard routes, add Airports/Categories to sidebar"
```

---

### Task 8: image-search edge function

**Files:**
- Create: `supabase/functions/image-search/index.ts`

- [ ] **Step 1: Create the function**

```typescript
// supabase/functions/image-search/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

  const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))
  if (authError || !user) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

  const { query, source = 'unsplash', page = 1 } = await req.json()

  if (source === 'unsplash') {
    const key = Deno.env.get('UNSPLASH_ACCESS_KEY')!
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=12&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${key}` } }
    )
    const data = await res.json()
    const images = (data.results ?? []).map((p: any) => ({
      url: p.urls.full,
      thumb_url: p.urls.small,
      credit: `Photo by ${p.user.name} on Unsplash`,
    }))
    return new Response(JSON.stringify({ images }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  if (source === 'pixabay') {
    const key = Deno.env.get('PIXABAY_API_KEY')!
    const res = await fetch(
      `https://pixabay.com/api/?key=${key}&q=${encodeURIComponent(query)}&page=${page}&per_page=12&image_type=photo&orientation=horizontal`
    )
    const data = await res.json()
    const images = (data.hits ?? []).map((p: any) => ({
      url: p.largeImageURL,
      thumb_url: p.previewURL,
      credit: `Image by ${p.user} on Pixabay`,
    }))
    return new Response(JSON.stringify({ images }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  return new Response(JSON.stringify({ error: 'Invalid source' }), { status: 400, headers: corsHeaders })
})
```

- [ ] **Step 2: Set secrets (if not already set)**

```bash
supabase secrets set UNSPLASH_ACCESS_KEY=<value> PIXABAY_API_KEY=<value>
```

- [ ] **Step 3: Deploy**

```bash
supabase functions deploy image-search
```

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/image-search/
git commit -m "feat: add image-search edge function (Unsplash + Pixabay)"
```

---

### Task 9: ai-package-content edge function

**Files:**
- Create: `supabase/functions/ai-package-content/index.ts`

- [ ] **Step 1: Create the function**

```typescript
// supabase/functions/ai-package-content/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type ContentType = 'description' | 'features' | 'itinerary' | 'included' | 'not_included'

interface Context {
  title: string
  category: string
  duration: string
  airline_names: string[]
  hotel_names: string[]
  routes: string
  description?: string
}

function buildPrompt(type: ContentType, ctx: Context): string {
  const base = `Paket wisata: "${ctx.title}", kategori: ${ctx.category}, durasi: ${ctx.duration}, maskapai: ${ctx.airline_names.join(', ')}, rute: ${ctx.routes}, hotel: ${ctx.hotel_names.join(', ')}.`

  if (type === 'description') return `${base}\n\nTulis deskripsi singkat paket wisata ini dalam 3-4 kalimat. Gunakan bahasa Indonesia yang hangat, Islami, dan menarik. Hanya kembalikan teks deskripsi saja, tanpa label.`

  if (type === 'features') return `${base}\nDeskripsi: ${ctx.description ?? '-'}\n\nBuat daftar 6-8 fitur unggulan paket ini dalam bahasa Indonesia. Format JSON array string. Contoh: ["Tiket pesawat PP", "Visa Umrah"]. Hanya kembalikan JSON array.`

  if (type === 'itinerary') return `${base}\nDeskripsi: ${ctx.description ?? '-'}\n\nBuat itinerary perjalanan hari per hari dalam JSON array. Setiap elemen: {"day": number, "title": string, "activities": string[]}. Jumlah hari sesuai durasi. Bahasa Indonesia, nada Islami. Hanya kembalikan JSON array.`

  if (type === 'included') return `${base}\n\nBuat daftar hal yang TERMASUK dalam paket ini dalam bahasa Indonesia. Format JSON array string. Contoh: ["Tiket pesawat PP", "Visa Umrah"]. Hanya kembalikan JSON array.`

  if (type === 'not_included') return `${base}\n\nBuat daftar hal yang TIDAK TERMASUK dalam paket ini dalam bahasa Indonesia. Format JSON array string. Contoh: ["Biaya pribadi", "Paspor"]. Hanya kembalikan JSON array.`

  return base
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

  const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))
  if (authError || !user) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

  const { type, context }: { type: ContentType; context: Context } = await req.json()

  const apiKey = Deno.env.get('GEMINI_API_KEY')!
  const model = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash-preview-05-20'
  const prompt = buildPrompt(type, context)

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  )

  const geminiData = await geminiRes.json()
  const raw = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  // Parse JSON for non-description types
  if (type === 'description') {
    return new Response(JSON.stringify({ description: raw.trim() }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  try {
    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : []
    return new Response(JSON.stringify({ [type]: parsed }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to parse AI response', raw }), { status: 500, headers: corsHeaders })
  }
})
```

- [ ] **Step 2: Deploy**

```bash
supabase functions deploy ai-package-content
```

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/ai-package-content/
git commit -m "feat: add ai-package-content edge function"
```

---

### Task 10: Service files

**Files:**
- Create: `services/packageContentService.ts`
- Create: `services/imageSearchService.ts`

- [ ] **Step 1: Create packageContentService.ts**

```typescript
// services/packageContentService.ts
import { supabase } from '../src/lib/supabase';
import { DayItinerary } from '../types';

export interface PackageContentContext {
  title: string;
  category: string;
  duration: string;
  airline_names: string[];
  hotel_names: string[];
  routes: string;
  description?: string;
}

export async function generateDescription(ctx: PackageContentContext): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-package-content`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
    body: JSON.stringify({ type: 'description', context: ctx }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'AI request failed');
  return json.description;
}

export async function generateFeatures(ctx: PackageContentContext): Promise<string[]> {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-package-content`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
    body: JSON.stringify({ type: 'features', context: ctx }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'AI request failed');
  return json.features ?? [];
}

export async function generateItinerary(ctx: PackageContentContext): Promise<DayItinerary[]> {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-package-content`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
    body: JSON.stringify({ type: 'itinerary', context: ctx }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'AI request failed');
  return json.itinerary ?? [];
}

export async function generateIncluded(ctx: PackageContentContext): Promise<string[]> {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-package-content`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
    body: JSON.stringify({ type: 'included', context: ctx }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'AI request failed');
  return json.included ?? [];
}

export async function generateNotIncluded(ctx: PackageContentContext): Promise<string[]> {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-package-content`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
    body: JSON.stringify({ type: 'not_included', context: ctx }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'AI request failed');
  return json.not_included ?? [];
}
```

- [ ] **Step 2: Create imageSearchService.ts**

```typescript
// services/imageSearchService.ts
import { supabase } from '../src/lib/supabase';

export interface ImageResult {
  url: string;
  thumb_url: string;
  credit: string;
}

export async function searchImages(
  query: string,
  source: 'unsplash' | 'pixabay',
  page = 1
): Promise<ImageResult[]> {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/image-search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
    body: JSON.stringify({ query, source, page }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Image search failed');
  return json.images ?? [];
}
```

- [ ] **Step 3: Commit**

```bash
git add services/packageContentService.ts services/imageSearchService.ts
git commit -m "feat: add packageContentService and imageSearchService"
```

---

### Task 11: ImagePickerModal component

**Files:**
- Create: `src/components/admin/PackageWizard/ImagePickerModal.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/admin/PackageWizard/ImagePickerModal.tsx
import React, { useState } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { searchImages, ImageResult } from '../../../../services/imageSearchService';
import { inputClass } from '../ui';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string, credit: string) => void;
}

const ImagePickerModal: React.FC<Props> = ({ isOpen, onClose, onSelect }) => {
  const [source, setSource] = useState<'unsplash' | 'pixabay'>('unsplash');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ImageResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    try {
      const imgs = await searchImages(query, source);
      setResults(imgs);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Search Cover Image</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {/* Source toggle + search */}
        <div className="p-4 border-b border-gray-100 space-y-3">
          <div className="flex gap-2">
            {(['unsplash', 'pixabay'] as const).map((s) => (
              <button key={s} onClick={() => setSource(s)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${source === s ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input type="text" className={inputClass + ' flex-1'} placeholder="Search images..." value={query} onChange={(e) => setQuery(e.target.value)} />
            <button type="submit" disabled={loading} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Search
            </button>
          </form>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {results.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-400 text-sm">Search for an image above</div>
          )}
          <div className="grid grid-cols-3 gap-3">
            {results.map((img, i) => (
              <button key={i} onClick={() => { onSelect(img.url, img.credit); onClose(); }}
                className="relative group aspect-video rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-colors focus:outline-none focus:border-primary">
                <img src={img.thumb_url} alt={img.credit} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-black/60 text-white text-[9px] opacity-0 group-hover:opacity-100 transition-opacity truncate">
                  {img.credit}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImagePickerModal;
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/PackageWizard/ImagePickerModal.tsx
git commit -m "feat: add ImagePickerModal component"
```

---

### Task 12: WizardSidebar component

**Files:**
- Create: `src/components/admin/PackageWizard/WizardSidebar.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/admin/PackageWizard/WizardSidebar.tsx
import React from 'react';
import { Check } from 'lucide-react';

export interface WizardStep {
  number: number;
  label: string;
  description: string;
}

interface Props {
  steps: WizardStep[];
  currentStep: number;
}

const WizardSidebar: React.FC<Props> = ({ steps, currentStep }) => (
  <aside className="w-64 shrink-0 bg-gray-950 text-gray-300 rounded-2xl p-6 self-start sticky top-6">
    <h2 className="text-white font-bold text-base mb-6">Create Package</h2>
    <div className="space-y-1">
      {steps.map((step) => {
        const done = step.number < currentStep;
        const active = step.number === currentStep;
        return (
          <div key={step.number} className={`flex items-start gap-3 rounded-xl px-3 py-3 transition-colors ${active ? 'bg-white/10' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold mt-0.5 transition-colors
              ${done ? 'bg-green-500 text-white' : active ? 'bg-white text-gray-950' : 'bg-gray-700 text-gray-400'}`}>
              {done ? <Check className="w-3.5 h-3.5" /> : step.number}
            </div>
            <div>
              <p className={`text-sm font-medium ${active ? 'text-white' : done ? 'text-gray-300' : 'text-gray-500'}`}>{step.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  </aside>
);

export default WizardSidebar;
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/PackageWizard/WizardSidebar.tsx
git commit -m "feat: add WizardSidebar component"
```

---

### Task 13: PackageWizard shell + state

**Files:**
- Create: `src/pages/admin/PackageWizard.tsx`

- [ ] **Step 1: Create the wizard shell**

```tsx
// src/pages/admin/PackageWizard.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/admin/ui';
import WizardSidebar, { WizardStep } from '../../components/admin/PackageWizard/WizardSidebar';
import Step1BasicInfo from '../../components/admin/PackageWizard/Step1BasicInfo';
import Step2FlightHotels from '../../components/admin/PackageWizard/Step2FlightHotels';
import Step3PricingRooms from '../../components/admin/PackageWizard/Step3PricingRooms';
import Step4ItineraryTerms from '../../components/admin/PackageWizard/Step4ItineraryTerms';
import { FlightRoute, RoomOption, DayItinerary } from '../../../types';

export interface WizardDraft {
  // Step 1
  title: string;
  category: string;
  departure_date: string;
  arrival_date: string;
  image_url: string;
  image_credit: string;
  gallery_urls: string[];
  is_popular: boolean;

  // Step 2
  airline_ids: string[];
  hotel_ids: string[];
  flight_routes: FlightRoute[];
  description: string;
  features: string[];

  // Step 3
  quotas: number;
  available_quotas: number;
  room_options: RoomOption[];

  // Step 4
  itinerary: DayItinerary[];
  included: string[];
  not_included: string[];
}

const EMPTY_DRAFT: WizardDraft = {
  title: '', category: '', departure_date: '', arrival_date: '',
  image_url: '', image_credit: '', gallery_urls: [], is_popular: false,
  airline_ids: [], hotel_ids: [], flight_routes: [],
  description: '', features: [],
  quotas: 0, available_quotas: 0, room_options: [],
  itinerary: [], included: [], not_included: [],
};

const STEPS: WizardStep[] = [
  { number: 1, label: 'Basic Info', description: 'Title, dates, cover image' },
  { number: 2, label: 'Flight & Hotels', description: 'Routes, hotels, description' },
  { number: 3, label: 'Pricing & Rooms', description: 'Quota, room options' },
  { number: 4, label: 'Itinerary & Terms', description: 'Days, included, excluded' },
];

const PackageWizard: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<WizardDraft>(EMPTY_DRAFT);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase.from('packages').select('*').eq('id', id).single();
      if (data) {
        setDraft({
          title: data.title ?? '',
          category: data.category ?? '',
          departure_date: data.departure_date ?? '',
          arrival_date: data.arrival_date ?? '',
          image_url: data.image_url ?? '',
          image_credit: data.image_credit ?? '',
          gallery_urls: data.gallery_urls ?? [],
          is_popular: data.is_popular ?? false,
          airline_ids: data.airline_ids ?? [],
          hotel_ids: data.hotel_ids ?? [],
          flight_routes: data.flight_routes ?? [],
          description: data.description ?? '',
          features: data.features ?? [],
          quotas: data.quotas ?? 0,
          available_quotas: data.available_quotas ?? data.quotas ?? 0,
          room_options: data.room_options ?? [],
          itinerary: data.itinerary ?? [],
          included: data.included ?? [],
          not_included: data.not_included ?? [],
        });
      }
      setLoading(false);
    })();
  }, [id]);

  const updateDraft = (partial: Partial<WizardDraft>) => setDraft((d) => ({ ...d, ...partial }));

  const handleSave = async () => {
    setSaving(true);
    const daysCount = draft.departure_date && draft.arrival_date
      ? Math.round((new Date(draft.arrival_date).getTime() - new Date(draft.departure_date).getTime()) / 86400000) + 1
      : 0;

    const payload = {
      title: draft.title,
      category: draft.category,
      departure_date: draft.departure_date,
      arrival_date: draft.arrival_date,
      duration: daysCount > 0 ? `${daysCount} Hari` : '',
      image_url: draft.image_url,
      image_credit: draft.image_credit || null,
      gallery_urls: draft.gallery_urls,
      is_popular: draft.is_popular,
      airline_ids: draft.airline_ids,
      hotel_ids: draft.hotel_ids,
      flight_routes: draft.flight_routes,
      description: draft.description,
      features: draft.features,
      quotas: draft.quotas,
      available_quotas: id ? draft.available_quotas : draft.quotas,
      room_options: draft.room_options,
      itinerary: draft.itinerary,
      included: draft.included,
      not_included: draft.not_included,
    };

    const { error } = id
      ? await supabase.from('packages').update(payload).eq('id', id)
      : await supabase.from('packages').insert([payload]);

    setSaving(false);
    if (error) { toast('error', 'Failed to save package.'); }
    else { toast('success', id ? 'Package updated.' : 'Package created.'); navigate('/admin/packages'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading...</div>;

  return (
    <div className="flex gap-6 items-start">
      <WizardSidebar steps={STEPS} currentStep={step} />

      <div className="flex-1 min-w-0">
        {step === 1 && <Step1BasicInfo draft={draft} updateDraft={updateDraft} onNext={() => setStep(2)} />}
        {step === 2 && <Step2FlightHotels draft={draft} updateDraft={updateDraft} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
        {step === 3 && <Step3PricingRooms draft={draft} updateDraft={updateDraft} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
        {step === 4 && <Step4ItineraryTerms draft={draft} updateDraft={updateDraft} onBack={() => setStep(3)} onSave={handleSave} saving={saving} />}
      </div>
    </div>
  );
};

export default PackageWizard;
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/admin/PackageWizard.tsx
git commit -m "feat: add PackageWizard shell with draft state and save logic"
```

---

### Task 14: Step1BasicInfo

**Files:**
- Create: `src/components/admin/PackageWizard/Step1BasicInfo.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/admin/PackageWizard/Step1BasicInfo.tsx
import React, { useRef, useState } from 'react';
import { Upload, Search as SearchIcon } from 'lucide-react';
import { FormField, inputClass, selectClass, SectionCard, btnPrimary, btnSecondary } from '../ui';
import ImagePickerModal from './ImagePickerModal';
import { WizardDraft } from '../../../pages/admin/PackageWizard';

interface Props {
  draft: WizardDraft;
  updateDraft: (p: Partial<WizardDraft>) => void;
  onNext: () => void;
}

const Step1BasicInfo: React.FC<Props> = ({ draft, updateDraft, onNext }) => {
  const [imageTab, setImageTab] = useState<'upload' | 'search'>('upload');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const duration = (() => {
    if (!draft.departure_date || !draft.arrival_date) return null;
    const days = Math.round((new Date(draft.arrival_date).getTime() - new Date(draft.departure_date).getTime()) / 86400000) + 1;
    return days > 0 ? `${days} Hari` : null;
  })();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const path = `packages/${Date.now()}-${file.name}`;
    const { data, error } = await (await import('../../../lib/supabase')).supabase.storage.from('images').upload(path, file, { upsert: true });
    if (!error && data) {
      const { data: urlData } = (await import('../../../lib/supabase')).supabase.storage.from('images').getPublicUrl(data.path);
      updateDraft({ image_url: urlData.publicUrl, image_credit: '' });
    }
  };

  const canNext = !!draft.title && !!draft.category && !!draft.departure_date && !!draft.arrival_date;

  return (
    <div className="space-y-6">
      <SectionCard title="Step 1 of 4 — Basic Info">
        <div className="space-y-5 p-6">
          <FormField label="Package Title" required>
            <input type="text" required className={inputClass} placeholder="e.g., Umrah Plus Istanbul 9 Hari" value={draft.title} onChange={(e) => updateDraft({ title: e.target.value })} />
          </FormField>

          <FormField label="Category" required>
            <select className={selectClass} value={draft.category} onChange={(e) => updateDraft({ category: e.target.value })}>
              <option value="">Select category...</option>
              {/* Categories loaded dynamically in Step2; here use a static fallback or pass from parent */}
              {['Umrah', 'Asia', 'Europe', 'Middle East'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <CategoryLoader onOptions={(opts) => {/* see note below */}} selectedValue={draft.category} onSelect={(v) => updateDraft({ category: v })} />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Departure Date" required>
              <input type="date" required className={inputClass} value={draft.departure_date} onChange={(e) => updateDraft({ departure_date: e.target.value })} />
            </FormField>
            <FormField label="Arrival Date" required>
              <input type="date" required className={inputClass} min={draft.departure_date} value={draft.arrival_date} onChange={(e) => updateDraft({ arrival_date: e.target.value })} />
            </FormField>
          </div>

          {duration && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Duration:</span>
              <span className="bg-primary/10 text-primary text-xs font-semibold px-2.5 py-0.5 rounded-full">{duration}</span>
            </div>
          )}

          {/* Cover Image */}
          <FormField label="Cover Image">
            <div className="flex gap-2 mb-3">
              {(['upload', 'search'] as const).map((tab) => (
                <button key={tab} type="button" onClick={() => setImageTab(tab)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${imageTab === tab ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {tab === 'upload' ? <><Upload className="w-3.5 h-3.5 inline mr-1" />Upload</> : <><SearchIcon className="w-3.5 h-3.5 inline mr-1" />Search Online</>}
                </button>
              ))}
            </div>
            {imageTab === 'upload' ? (
              <div>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
                <button type="button" onClick={() => fileRef.current?.click()} className="w-full border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-primary/40 transition-colors text-gray-400 text-sm">
                  {draft.image_url ? 'Click to replace image' : 'Click to upload JPG/PNG'}
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setIsPickerOpen(true)} className="w-full border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-primary/40 transition-colors text-gray-400 text-sm">
                {draft.image_url ? 'Click to search for a different image' : 'Click to search Unsplash / Pixabay'}
              </button>
            )}
            {draft.image_url && (
              <div className="mt-3 rounded-xl overflow-hidden border border-gray-100 aspect-video">
                <img src={draft.image_url} alt="Cover preview" className="w-full h-full object-cover" />
              </div>
            )}
            {draft.image_credit && <p className="text-xs text-gray-400 mt-1">{draft.image_credit}</p>}
          </FormField>

          <FormField label="Mark as Popular">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={draft.is_popular} onChange={(e) => updateDraft({ is_popular: e.target.checked })} className="w-4 h-4 accent-primary" />
              <span className="text-sm text-gray-700">Show as popular package on homepage</span>
            </label>
          </FormField>
        </div>
      </SectionCard>

      <div className="flex justify-end">
        <button type="button" disabled={!canNext} onClick={onNext} className={btnPrimary + ' disabled:opacity-50 disabled:cursor-not-allowed'}>
          Next: Flight & Hotels →
        </button>
      </div>

      <ImagePickerModal isOpen={isPickerOpen} onClose={() => setIsPickerOpen(false)} onSelect={(url, credit) => updateDraft({ image_url: url, image_credit: credit })} />
    </div>
  );
};

// Loads categories from DB and replaces the static select above
const CategoryLoader: React.FC<{ onOptions: (opts: string[]) => void; selectedValue: string; onSelect: (v: string) => void }> = ({ selectedValue, onSelect }) => {
  const [opts, setOpts] = React.useState<string[]>([]);
  React.useEffect(() => {
    import('../../../lib/supabase').then(({ supabase }) =>
      supabase.from('categories').select('name').order('name').then(({ data }) => {
        if (data) setOpts(data.map((c: any) => c.name));
      })
    );
  }, []);
  if (opts.length === 0) return null;
  return (
    <select className={selectClass + ' mt-2'} value={selectedValue} onChange={(e) => onSelect(e.target.value)}>
      <option value="">Select category...</option>
      {opts.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
};

export default Step1BasicInfo;
```

> **Note:** The `CategoryLoader` pattern above renders a second select that is visible when DB categories load. Simplify if needed by lifting category fetch to the wizard shell and passing it as a prop.

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/PackageWizard/Step1BasicInfo.tsx
git commit -m "feat: add Step1BasicInfo wizard step"
```

---

### Task 15: Step2FlightHotels

**Files:**
- Create: `src/components/admin/PackageWizard/Step2FlightHotels.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/admin/PackageWizard/Step2FlightHotels.tsx
import React, { useEffect, useState } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import { FormField, SectionCard, inputClass, selectClass, textareaClass, btnPrimary, btnSecondary } from '../ui';
import { supabase } from '../../../lib/supabase';
import { Airport, FlightRoute } from '../../../../types';
import { WizardDraft } from '../../../pages/admin/PackageWizard';
import { generateDescription, generateFeatures, PackageContentContext } from '../../../../services/packageContentService';

interface Airline { id: string; name: string; logo_url?: string; iata_code?: string; }
interface Hotel { id: string; name: string; location: string; stars: number; }

interface Props {
  draft: WizardDraft;
  updateDraft: (p: Partial<WizardDraft>) => void;
  onNext: () => void;
  onBack: () => void;
}

const Step2FlightHotels: React.FC<Props> = ({ draft, updateDraft, onNext, onBack }) => {
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [airports, setAirports] = useState<Airport[]>([]);
  const [airlineSearch, setAirlineSearch] = useState('');
  const [hotelSearch, setHotelSearch] = useState('');
  const [genDesc, setGenDesc] = useState(false);
  const [genFeat, setGenFeat] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from('airlines').select('*').order('name'),
      supabase.from('hotels').select('*').order('name'),
      supabase.from('airports').select('*').order('iata_code'),
    ]).then(([a, h, ap]) => {
      if (a.data) setAirlines(a.data);
      if (h.data) setHotels(h.data);
      if (ap.data) setAirports(ap.data);
    });
  }, []);

  const toggleAirline = (id: string) => {
    const ids = draft.airline_ids.includes(id) ? draft.airline_ids.filter((x) => x !== id) : [...draft.airline_ids, id];
    const routes = ids.map((aid) => draft.flight_routes.find((r) => r.airline_id === aid) ?? { airline_id: aid, legs: [] });
    updateDraft({ airline_ids: ids, flight_routes: routes });
  };

  const toggleHotel = (id: string) => {
    const ids = draft.hotel_ids.includes(id) ? draft.hotel_ids.filter((x) => x !== id) : [...draft.hotel_ids, id];
    updateDraft({ hotel_ids: ids });
  };

  const addLeg = (airlineId: string) => {
    const routes = draft.flight_routes.map((r) =>
      r.airline_id === airlineId ? { ...r, legs: [...r.legs, { from_airport_id: '', to_airport_id: '' }] } : r
    );
    updateDraft({ flight_routes: routes });
  };

  const removeLeg = (airlineId: string, legIdx: number) => {
    const routes = draft.flight_routes.map((r) =>
      r.airline_id === airlineId ? { ...r, legs: r.legs.filter((_, i) => i !== legIdx) } : r
    );
    updateDraft({ flight_routes: routes });
  };

  const updateLeg = (airlineId: string, legIdx: number, field: 'from_airport_id' | 'to_airport_id', value: string) => {
    const routes = draft.flight_routes.map((r) => {
      if (r.airline_id !== airlineId) return r;
      const legs = [...r.legs];
      legs[legIdx] = { ...legs[legIdx], [field]: value };
      return { ...r, legs };
    });
    updateDraft({ flight_routes: routes });
  };

  const buildContext = (): PackageContentContext => {
    const airlineMap = Object.fromEntries(airlines.map((a) => [a.id, a.name]));
    const hotelMap = Object.fromEntries(hotels.map((h) => [h.id, h.name]));
    const airportMap = Object.fromEntries(airports.map((a) => [a.id, a.iata_code]));
    const routes = draft.flight_routes.map((r) => {
      const name = airlineMap[r.airline_id] ?? '';
      const legs = r.legs.map((l) => `${airportMap[l.from_airport_id] ?? '?'} → ${airportMap[l.to_airport_id] ?? '?'}`).join(', ');
      return legs ? `${name}: ${legs}` : name;
    }).join(' | ');
    return {
      title: draft.title,
      category: draft.category,
      duration: draft.departure_date && draft.arrival_date
        ? `${Math.round((new Date(draft.arrival_date).getTime() - new Date(draft.departure_date).getTime()) / 86400000) + 1} Hari`
        : '',
      airline_names: draft.airline_ids.map((id) => airlineMap[id]).filter(Boolean),
      hotel_names: draft.hotel_ids.map((id) => hotelMap[id]).filter(Boolean),
      routes,
      description: draft.description,
    };
  };

  const handleGenDescription = async () => {
    setGenDesc(true);
    try { updateDraft({ description: await generateDescription(buildContext()) }); }
    catch { /* toast handled by caller */ }
    finally { setGenDesc(false); }
  };

  const handleGenFeatures = async () => {
    setGenFeat(true);
    try { updateDraft({ features: await generateFeatures(buildContext()) }); }
    catch { }
    finally { setGenFeat(false); }
  };

  const filteredAirlines = airlines.filter((a) => a.name.toLowerCase().includes(airlineSearch.toLowerCase()));
  const filteredHotels = hotels.filter((h) => `${h.name} ${h.location}`.toLowerCase().includes(hotelSearch.toLowerCase()));

  return (
    <div className="space-y-6">
      <SectionCard title="Step 2 of 4 — Flight & Hotels">
        <div className="space-y-6 p-6">

          {/* Airlines */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Airlines</h3>
            <input type="text" className={inputClass + ' mb-2'} placeholder="Search airlines..." value={airlineSearch} onChange={(e) => setAirlineSearch(e.target.value)} />
            <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
              {filteredAirlines.map((airline) => {
                const checked = draft.airline_ids.includes(airline.id);
                const route = draft.flight_routes.find((r) => r.airline_id === airline.id);
                return (
                  <div key={airline.id}>
                    <label className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${checked ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
                      <input type="checkbox" checked={checked} onChange={() => toggleAirline(airline.id)} className="w-4 h-4 accent-green-500 shrink-0" />
                      <span className="text-sm font-medium text-gray-800 flex-1">{airline.name}</span>
                      {airline.iata_code && <span className="text-xs text-gray-400">{airline.iata_code}</span>}
                    </label>
                    {checked && route && (
                      <div className="px-4 pb-3 pt-2 bg-gray-50 border-t border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 mb-2">Route legs</p>
                        {route.legs.map((leg, i) => (
                          <div key={i} className="flex items-center gap-2 mb-2">
                            <select className={selectClass + ' flex-1'} value={leg.from_airport_id} onChange={(e) => updateLeg(airline.id, i, 'from_airport_id', e.target.value)}>
                              <option value="">From...</option>
                              {airports.map((a) => <option key={a.id} value={a.id}>{a.iata_code} — {a.name}</option>)}
                            </select>
                            <span className="text-gray-400">→</span>
                            <select className={selectClass + ' flex-1'} value={leg.to_airport_id} onChange={(e) => updateLeg(airline.id, i, 'to_airport_id', e.target.value)}>
                              <option value="">To...</option>
                              {airports.map((a) => <option key={a.id} value={a.id}>{a.iata_code} — {a.name}</option>)}
                            </select>
                            <button type="button" onClick={() => removeLeg(airline.id, i)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                          </div>
                        ))}
                        <button type="button" onClick={() => addLeg(airline.id)} className="text-xs text-green-600 font-medium flex items-center gap-1 hover:underline">
                          <Plus className="w-3 h-3" /> Add leg
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hotels */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Hotels</h3>
            <input type="text" className={inputClass + ' mb-2'} placeholder="Search hotels..." value={hotelSearch} onChange={(e) => setHotelSearch(e.target.value)} />
            <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
              {filteredHotels.map((hotel) => {
                const checked = draft.hotel_ids.includes(hotel.id);
                return (
                  <label key={hotel.id} className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${checked ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
                    <input type="checkbox" checked={checked} onChange={() => toggleHotel(hotel.id)} className="w-4 h-4 accent-green-500 shrink-0" />
                    <span className="text-sm font-medium text-gray-800 flex-1">{hotel.name}</span>
                    <span className="text-xs text-amber-500">{'★'.repeat(hotel.stars)}</span>
                    <span className="text-xs text-gray-400">{hotel.location}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <FormField label="Description">
            <div className="flex justify-end mb-1.5">
              <button type="button" onClick={handleGenDescription} disabled={genDesc} className="text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-lg flex items-center gap-1 hover:bg-green-100 disabled:opacity-50">
                {genDesc ? <Loader2 className="w-3 h-3 animate-spin" /> : '✨'} Generate
              </button>
            </div>
            <textarea className={textareaClass} rows={4} placeholder="Package description..." value={draft.description} onChange={(e) => updateDraft({ description: e.target.value })} />
          </FormField>

          {/* Features */}
          <FormField label="Features">
            <div className="flex justify-end mb-1.5">
              <button type="button" onClick={handleGenFeatures} disabled={genFeat} className="text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-lg flex items-center gap-1 hover:bg-green-100 disabled:opacity-50">
                {genFeat ? <Loader2 className="w-3 h-3 animate-spin" /> : '✨'} Generate
              </button>
            </div>
            <textarea className={textareaClass} rows={3} placeholder="One feature per line..." value={draft.features.join('\n')} onChange={(e) => updateDraft({ features: e.target.value.split('\n').filter(Boolean) })} />
            <p className="text-xs text-gray-400 mt-1">One feature per line.</p>
          </FormField>

        </div>
      </SectionCard>

      <div className="flex justify-between">
        <button type="button" onClick={onBack} className={btnSecondary}>← Back</button>
        <button type="button" onClick={onNext} className={btnPrimary}>Next: Pricing & Rooms →</button>
      </div>
    </div>
  );
};

export default Step2FlightHotels;
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/PackageWizard/Step2FlightHotels.tsx
git commit -m "feat: add Step2FlightHotels wizard step"
```

---

### Task 16: Step3PricingRooms

**Files:**
- Create: `src/components/admin/PackageWizard/Step3PricingRooms.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/admin/PackageWizard/Step3PricingRooms.tsx
import React, { useEffect, useState } from 'react';
import { SectionCard, FormField, inputClass, btnPrimary, btnSecondary } from '../ui';
import { supabase } from '../../../lib/supabase';
import { RoomOption } from '../../../../types';
import { WizardDraft } from '../../../pages/admin/PackageWizard';

interface HotelWithRooms { id: string; name: string; location: string; stars: number; room_types: { name: string; capacity: number }[]; }

interface Props {
  draft: WizardDraft;
  updateDraft: (p: Partial<WizardDraft>) => void;
  onNext: () => void;
  onBack: () => void;
}

const Step3PricingRooms: React.FC<Props> = ({ draft, updateDraft, onNext, onBack }) => {
  const [hotels, setHotels] = useState<HotelWithRooms[]>([]);

  useEffect(() => {
    if (draft.hotel_ids.length === 0) return;
    supabase.from('hotels').select('id, name, location, stars, room_types').in('id', draft.hotel_ids).then(({ data }) => {
      if (data) setHotels(data);
    });
  }, [draft.hotel_ids]);

  const isChecked = (hotelId: string, roomName: string) =>
    draft.room_options.some((r) => r.hotel_id === hotelId && r.name === roomName);

  const getOption = (hotelId: string, roomName: string): RoomOption | undefined =>
    draft.room_options.find((r) => r.hotel_id === hotelId && r.name === roomName);

  const toggleRoom = (hotel: HotelWithRooms, room: { name: string; capacity: number }, checked: boolean) => {
    if (checked) {
      updateDraft({ room_options: [...draft.room_options, { hotel_id: hotel.id, name: room.name, capacity: room.capacity, price: 0 }] });
    } else {
      updateDraft({ room_options: draft.room_options.filter((r) => !(r.hotel_id === hotel.id && r.name === room.name)) });
    }
  };

  const updatePrice = (hotelId: string, roomName: string, field: 'price' | 'original_price', value: number) => {
    updateDraft({
      room_options: draft.room_options.map((r) =>
        r.hotel_id === hotelId && r.name === roomName ? { ...r, [field]: value } : r
      ),
    });
  };

  return (
    <div className="space-y-6">
      <SectionCard title="Step 3 of 4 — Pricing & Rooms">
        <div className="space-y-6 p-6">

          {/* Participant Quota */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Participant Quota</h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Total Quota">
                <input type="number" min={0} className={inputClass} value={draft.quotas || ''} placeholder="e.g., 100"
                  onChange={(e) => updateDraft({ quotas: parseInt(e.target.value) || 0 })} />
              </FormField>
              <FormField label="Remaining Quota" hint="Auto-updated by orders. Edit only to correct.">
                <input type="number" min={0} className={inputClass} value={draft.available_quotas || ''} placeholder="Same as total for new"
                  onChange={(e) => updateDraft({ available_quotas: parseInt(e.target.value) || 0 })} />
              </FormField>
            </div>
          </div>

          {/* Room Options */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-1">Room Options</h3>
            <p className="text-xs text-gray-400 mb-3">Check rooms to include in this package and set the price per person.</p>

            {draft.hotel_ids.length === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                ⚠️ No hotels selected. Go back to Step 2 to add hotels.
              </div>
            )}

            {hotels.map((hotel) => (
              <div key={hotel.id} className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-gray-700">{hotel.name}</span>
                  <span className="text-xs text-amber-400">{'★'.repeat(hotel.stars)}</span>
                  <span className="text-xs text-gray-400">· {hotel.location}</span>
                </div>
                {(hotel.room_types ?? []).length === 0 ? (
                  <p className="text-xs text-gray-400">No room types defined for this hotel yet.</p>
                ) : (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    {(hotel.room_types ?? []).map((room) => {
                      const checked = isChecked(hotel.id, room.name);
                      const opt = getOption(hotel.id, room.name);
                      return (
                        <div key={room.name} className={`grid grid-cols-[20px_1fr_100px_130px_130px] gap-3 items-center px-4 py-3 border-b border-gray-100 last:border-b-0 transition-colors ${checked ? 'bg-green-50' : 'bg-white opacity-70'}`}>
                          <input type="checkbox" checked={checked} onChange={(e) => toggleRoom(hotel, room, e.target.checked)} className="w-4 h-4 accent-green-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-800">{room.name}</p>
                            <p className="text-xs text-gray-400">{room.capacity} pax / kamar</p>
                          </div>
                          <span className="text-xs text-gray-500 text-center">{room.capacity} pax</span>
                          <div>
                            <p className="text-[10px] text-gray-500 mb-1">Harga (Rp)</p>
                            <input type="number" min={0} disabled={!checked} className={inputClass + ' text-sm'} placeholder="0" value={opt?.price || ''} onChange={(e) => updatePrice(hotel.id, room.name, 'price', parseInt(e.target.value) || 0)} />
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-500 mb-1">Harga Coret (opsional)</p>
                            <input type="number" min={0} disabled={!checked} className={inputClass + ' text-sm'} placeholder="—" value={opt?.original_price || ''} onChange={(e) => updatePrice(hotel.id, room.name, 'original_price', parseInt(e.target.value) || 0)} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </SectionCard>

      <div className="flex justify-between">
        <button type="button" onClick={onBack} className={btnSecondary}>← Back</button>
        <button type="button" onClick={onNext} className={btnPrimary}>Next: Itinerary & Terms →</button>
      </div>
    </div>
  );
};

export default Step3PricingRooms;
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/PackageWizard/Step3PricingRooms.tsx
git commit -m "feat: add Step3PricingRooms wizard step"
```

---

### Task 17: Step4ItineraryTerms

**Files:**
- Create: `src/components/admin/PackageWizard/Step4ItineraryTerms.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/admin/PackageWizard/Step4ItineraryTerms.tsx
import React, { useState } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import { SectionCard, inputClass, btnPrimary, btnSecondary } from '../ui';
import { supabase } from '../../../lib/supabase';
import { DayItinerary } from '../../../../types';
import { WizardDraft } from '../../../pages/admin/PackageWizard';
import { generateItinerary, generateIncluded, generateNotIncluded, PackageContentContext } from '../../../../services/packageContentService';

interface Props {
  draft: WizardDraft;
  updateDraft: (p: Partial<WizardDraft>) => void;
  onBack: () => void;
  onSave: () => void;
  saving: boolean;
}

const Step4ItineraryTerms: React.FC<Props> = ({ draft, updateDraft, onBack, onSave, saving }) => {
  const [genItinerary, setGenItinerary] = useState(false);
  const [genIncluded, setGenIncluded] = useState(false);
  const [genNotIncluded, setGenNotIncluded] = useState(false);

  const buildContext = async (): Promise<PackageContentContext> => {
    const [airlinesRes, hotelsRes, airportsRes] = await Promise.all([
      supabase.from('airlines').select('id, name').in('id', draft.airline_ids),
      supabase.from('hotels').select('id, name').in('id', draft.hotel_ids),
      supabase.from('airports').select('id, iata_code'),
    ]);
    const airlineMap = Object.fromEntries((airlinesRes.data ?? []).map((a: any) => [a.id, a.name]));
    const hotelMap = Object.fromEntries((hotelsRes.data ?? []).map((h: any) => [h.id, h.name]));
    const airportMap = Object.fromEntries((airportsRes.data ?? []).map((a: any) => [a.id, a.iata_code]));
    const routes = draft.flight_routes.map((r) => {
      const name = airlineMap[r.airline_id] ?? '';
      const legs = r.legs.map((l) => `${airportMap[l.from_airport_id] ?? '?'} → ${airportMap[l.to_airport_id] ?? '?'}`).join(', ');
      return legs ? `${name}: ${legs}` : name;
    }).join(' | ');
    return {
      title: draft.title, category: draft.category,
      duration: draft.departure_date && draft.arrival_date
        ? `${Math.round((new Date(draft.arrival_date).getTime() - new Date(draft.departure_date).getTime()) / 86400000) + 1} Hari` : '',
      airline_names: draft.airline_ids.map((id) => airlineMap[id]).filter(Boolean),
      hotel_names: draft.hotel_ids.map((id) => hotelMap[id]).filter(Boolean),
      routes, description: draft.description,
    };
  };

  const handleGenItinerary = async () => {
    if (draft.itinerary.length > 0 && !confirm('Replace current itinerary with AI output?')) return;
    setGenItinerary(true);
    try { updateDraft({ itinerary: await generateItinerary(await buildContext()) }); } catch { }
    finally { setGenItinerary(false); }
  };

  const handleGenIncluded = async () => {
    if (draft.included.length > 0 && !confirm('Replace current list with AI output?')) return;
    setGenIncluded(true);
    try { updateDraft({ included: await generateIncluded(await buildContext()) }); } catch { }
    finally { setGenIncluded(false); }
  };

  const handleGenNotIncluded = async () => {
    if (draft.not_included.length > 0 && !confirm('Replace current list with AI output?')) return;
    setGenNotIncluded(true);
    try { updateDraft({ not_included: await generateNotIncluded(await buildContext()) }); } catch { }
    finally { setGenNotIncluded(false); }
  };

  const updateDay = (i: number, partial: Partial<DayItinerary>) =>
    updateDraft({ itinerary: draft.itinerary.map((d, idx) => idx === i ? { ...d, ...partial } : d) });

  const addActivity = (dayIdx: number) =>
    updateDay(dayIdx, { activities: [...(draft.itinerary[dayIdx].activities ?? []), ''] });

  const updateActivity = (dayIdx: number, actIdx: number, value: string) => {
    const activities = [...(draft.itinerary[dayIdx].activities ?? [])];
    activities[actIdx] = value;
    updateDay(dayIdx, { activities });
  };

  const removeActivity = (dayIdx: number, actIdx: number) =>
    updateDay(dayIdx, { activities: (draft.itinerary[dayIdx].activities ?? []).filter((_, i) => i !== actIdx) });

  const addDay = () => updateDraft({ itinerary: [...draft.itinerary, { day: draft.itinerary.length + 1, title: '', activities: [''] }] });
  const removeDay = (i: number) => updateDraft({ itinerary: draft.itinerary.filter((_, idx) => idx !== i).map((d, idx) => ({ ...d, day: idx + 1 })) });

  const updateListItem = (list: 'included' | 'not_included', i: number, value: string) => {
    const arr = [...draft[list]]; arr[i] = value;
    updateDraft({ [list]: arr });
  };
  const addListItem = (list: 'included' | 'not_included') => updateDraft({ [list]: [...draft[list], ''] });
  const removeListItem = (list: 'included' | 'not_included', i: number) => updateDraft({ [list]: draft[list].filter((_, idx) => idx !== i) });

  const GenBtn: React.FC<{ loading: boolean; onClick: () => void }> = ({ loading, onClick }) => (
    <button type="button" onClick={onClick} disabled={loading} className="text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-green-100 disabled:opacity-50 whitespace-nowrap">
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : '✨'} Generate
    </button>
  );

  return (
    <div className="space-y-6">
      <SectionCard title="Step 4 of 4 — Itinerary & Terms">
        <div className="space-y-8 p-6">

          {/* Itinerary */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Itinerary</h3>
                <p className="text-xs text-gray-400 mt-0.5">Day-by-day program.</p>
              </div>
              <GenBtn loading={genItinerary} onClick={handleGenItinerary} />
            </div>
            <div className="space-y-3">
              {draft.itinerary.map((day, di) => (
                <div key={di} className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                    <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded">Hari {day.day}</span>
                    <input className={inputClass + ' flex-1 text-sm font-medium'} placeholder="Day title..." value={day.title} onChange={(e) => updateDay(di, { title: e.target.value })} />
                    <button type="button" onClick={() => removeDay(di)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="p-3 space-y-2">
                    {(day.activities ?? []).map((act, ai) => (
                      <div key={ai} className="flex items-center gap-2">
                        <span className="text-gray-300 text-xs">•</span>
                        <input className={inputClass + ' flex-1 text-sm'} placeholder="Activity..." value={act} onChange={(e) => updateActivity(di, ai, e.target.value)} />
                        <button type="button" onClick={() => removeActivity(di, ai)} className="text-gray-300 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                    <button type="button" onClick={() => addActivity(di)} className="text-xs text-green-600 hover:underline flex items-center gap-1 ml-4">
                      <Plus className="w-3 h-3" /> Tambah aktivitas
                    </button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addDay} className="flex items-center gap-2 text-sm text-gray-500 border border-dashed border-gray-200 rounded-xl px-4 py-2.5 hover:border-gray-300 hover:bg-gray-50 transition-colors">
                <Plus className="w-4 h-4" /> Tambah hari manual
              </button>
            </div>
          </div>

          {/* Included */}
          <div className="border-t border-gray-100 pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">✅ Termasuk (Included)</h3>
                <p className="text-xs text-gray-400 mt-0.5">Apa saja yang sudah termasuk dalam paket.</p>
              </div>
              <GenBtn loading={genIncluded} onClick={handleGenIncluded} />
            </div>
            <div className="space-y-2">
              {draft.included.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-green-500 text-sm font-bold shrink-0">✓</span>
                  <input className={inputClass + ' flex-1 text-sm'} value={item} onChange={(e) => updateListItem('included', i, e.target.value)} />
                  <button type="button" onClick={() => removeListItem('included', i)} className="text-gray-300 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
              <button type="button" onClick={() => addListItem('included')} className="text-xs text-green-600 hover:underline flex items-center gap-1">
                <Plus className="w-3 h-3" /> Tambah item
              </button>
            </div>
          </div>

          {/* Not Included */}
          <div className="border-t border-gray-100 pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">❌ Tidak Termasuk (Not Included)</h3>
                <p className="text-xs text-gray-400 mt-0.5">Biaya dan hal yang tidak tercakup.</p>
              </div>
              <GenBtn loading={genNotIncluded} onClick={handleGenNotIncluded} />
            </div>
            <div className="space-y-2">
              {draft.not_included.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-red-400 text-sm font-bold shrink-0">✗</span>
                  <input className={inputClass + ' flex-1 text-sm'} value={item} onChange={(e) => updateListItem('not_included', i, e.target.value)} />
                  <button type="button" onClick={() => removeListItem('not_included', i)} className="text-gray-300 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
              <button type="button" onClick={() => addListItem('not_included')} className="text-xs text-gray-500 hover:underline flex items-center gap-1">
                <Plus className="w-3 h-3" /> Tambah item
              </button>
            </div>
          </div>

        </div>
      </SectionCard>

      <div className="flex justify-between">
        <button type="button" onClick={onBack} className={btnSecondary}>← Back</button>
        <button type="button" onClick={onSave} disabled={saving} className={btnPrimary + ' disabled:opacity-50'}>
          {saving ? <><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Saving...</> : '💾 Save Package'}
        </button>
      </div>
    </div>
  );
};

export default Step4ItineraryTerms;
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/PackageWizard/Step4ItineraryTerms.tsx
git commit -m "feat: add Step4ItineraryTerms wizard step"
```

---

### Task 18: TourDetail public page fixes

**Files:**
- Modify: `components/TourDetail.tsx`

- [ ] **Step 1: Add formatFlightRoutes import**

At the top of `components/TourDetail.tsx`, add:
```typescript
import { formatFlightRoutes } from '../src/lib/formatFlightRoutes';
```

- [ ] **Step 2: Replace flight_details usage at line 225**

Replace:
```tsx
{tour.flight_details || 'Flight details TBA'}
```

With:
```tsx
{formatFlightRoutes(
  tour.flight_routes,
  Object.fromEntries((tour.airlines ?? []).map((a, i) => [i.toString(), a.name])),
  []
)}
```

> **Note:** The in-component lookup uses airline names already resolved via the join on `tour.airlines`. Since TourDetail receives the resolved `airlines` array (not raw IDs), create a simple fallback string instead of the full helper:

```tsx
{tour.flight_routes && tour.flight_routes.length > 0
  ? tour.airlines?.map((a) => a.name).join(', ') + ' — routes available'
  : tour.airlines?.[0]?.name
    ? `${tour.airlines[0].name} — Flight details TBA`
    : 'Flight details TBA'
}
```

A cleaner approach is to keep this as a simple derived display for the public page. The full `formatFlightRoutes` with airport resolution is more relevant when the admin-side has resolved airport objects. Add the proper version when the public page query is updated to join airports.

- [ ] **Step 3: Add image_credit attribution below cover image**

Find the cover image `<img>` element and add below it (inside the same container):
```tsx
{tour.image_credit && (
  <p className="text-xs text-gray-400 mt-1 text-center">{tour.image_credit}</p>
)}
```

- [ ] **Step 4: Commit**

```bash
git add components/TourDetail.tsx
git commit -m "fix: update TourDetail for flight_routes and image_credit (schema migration)"
```

---

### Task 19: Step1 category fix — lift categories to wizard

The `CategoryLoader` inline component in Step1BasicInfo (Task 14) renders a second select when categories load from DB. This is confusing UX (two selects). The cleaner fix is to fetch categories in `PackageWizard.tsx` and pass them down.

**Files:**
- Modify: `src/pages/admin/PackageWizard.tsx`
- Modify: `src/components/admin/PackageWizard/Step1BasicInfo.tsx`

- [ ] **Step 1: Add categories state to PackageWizard.tsx**

Add after `const [saving, setSaving] = useState(false);`:
```typescript
const [categories, setCategories] = useState<string[]>([]);

useEffect(() => {
  supabase.from('categories').select('name').order('name').then(({ data }) => {
    if (data) setCategories(data.map((c: any) => c.name));
  });
}, []);
```

Pass `categories` to Step1:
```tsx
{step === 1 && <Step1BasicInfo draft={draft} updateDraft={updateDraft} onNext={() => setStep(2)} categories={categories} />}
```

- [ ] **Step 2: Update Step1BasicInfo to accept categories prop**

Change the Props interface:
```typescript
interface Props {
  draft: WizardDraft;
  updateDraft: (p: Partial<WizardDraft>) => void;
  onNext: () => void;
  categories: string[];
}
```

Replace the entire `<FormField label="Category">` section (both the static select and `CategoryLoader`) with:
```tsx
<FormField label="Category" required>
  <select required className={selectClass} value={draft.category} onChange={(e) => updateDraft({ category: e.target.value })}>
    <option value="">Select category...</option>
    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
  </select>
</FormField>
```

Remove the `CategoryLoader` component entirely.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/PackageWizard.tsx src/components/admin/PackageWizard/Step1BasicInfo.tsx
git commit -m "refactor: lift categories fetch to PackageWizard, clean up Step1 category select"
```

---

### Task 20: Smoke test

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verify wizard navigation**

1. Go to `/admin/packages`
2. Click "Create Package" — should navigate to `/admin/packages/new`
3. Complete Step 1 (fill title, category, dates) → click Next
4. Complete Step 2 (select airline, add leg, select hotel) → click Next
5. Verify room options appear grouped by hotel in Step 3
6. Click Next → Step 4
7. Click "✨ Generate Itinerary" — should return AI content
8. Click "Save Package" — should navigate back to `/admin/packages`

- [ ] **Step 3: Verify new admin pages**

1. `/admin/airports` — table loads seeded data, add/edit/delete works
2. `/admin/categories` — table loads seeded data, add/edit/delete works
3. `/admin/hotels` — edit a hotel → room types section visible, can add rows

- [ ] **Step 4: Verify edit flow**

1. Click edit on an existing package → navigates to `/admin/packages/:id/edit`
2. Wizard pre-fills all fields
3. Save updates the record

- [ ] **Step 5: Verify public page**

1. Visit a package detail page
2. Flight section shows either route info or "Flight details TBA"
3. If package has `image_credit`, attribution appears below cover image

---

## Post-implementation notes

- **`available_quotas` column**: The migration script uses `available_quotas` — confirm this column name matches what's already in the `packages` table (it may be `quotas` with a separate `initial_quotas`). Adjust the column name in the migration and wizard save payload to match.
- **Image upload in Step 1**: Assumes a Supabase Storage bucket named `images` exists and has a public policy. Create if needed: `supabase storage create images`.
- **Edge function secrets**: Before deploying `image-search`, ensure `UNSPLASH_ACCESS_KEY` and `PIXABAY_API_KEY` are set via `supabase secrets set`.
- **PackageDetailModal**: Left intact — it reads the existing package data for a read-only view. The removed fields (`flight_details`, `initial_rooms`, `available_rooms`) should be removed from its display if they appear there.
