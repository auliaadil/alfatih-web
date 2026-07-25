# Multi-Feature Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 7 product improvements: package publish toggle, shared airline/hotel forms in wizard, shorter Instagram captions, order view + multi-receipt attachments, logo upload in site settings, category T&C for PDF, and public PDF view replacing the brosur download.

**Architecture:** All changes are frontend-only React/TypeScript except for one Supabase SQL migration (all schema changes in one file), two Supabase Storage buckets (created via CLI), one edge function update (generate-itinerary-pdf), and one edge function prompt update (ai-text-campaign). The frontend changes are isolated per feature with no cross-task dependencies.

**Tech Stack:** React 19, TypeScript, Tailwind CSS (CDN), Supabase (client + storage + edge functions), pdf-lib (Deno, edge function only).

## Global Constraints

- Tailwind stays CDN-based — do not add PostCSS or a build step.
- All user-facing copy must be in Bahasa Indonesia.
- `types.ts` is at the repo root (not `src/types/`) — always update it there.
- The `@` alias resolves to the repo root (not `src/`), so `@/types` = `/types.ts` and `@/src/lib/supabase` = `/src/lib/supabase.ts`.
- Admin CRUD pattern: no separate routes — use SlideOver/Modal components in the index page.
- Action buttons: View = `text-blue-600 hover:bg-blue-50`, Edit = default ghost, Delete = `text-red-500 hover:bg-red-50`.
- No linting or test runner is configured. Verify each task manually in the browser (`npm run dev`, http://localhost:3000).
- Never hardcode phone numbers — always read from `useSiteSettings()`.

---

## File Map

| File | Change |
|---|---|
| `supabase/migrations/20260725000001_multi_feature_improvements.sql` | NEW — all schema additions |
| `types.ts` | ADD fields to `TourPackage`, `Category`; ADD `OrderAttachment` interface |
| `src/pages/admin/Packages.tsx` | ADD Status (publish) column with inline toggle |
| `src/components/admin/PackageWizard/Step1BasicInfo.tsx` | ADD `is_published` toggle at bottom |
| `src/pages/admin/PackageWizard.tsx` | ADD `is_published` to `WizardDraft` and `EMPTY_DRAFT` |
| `src/components/admin/AirlineForm.tsx` | NEW — extracted airline form with all fields |
| `src/components/admin/HotelForm.tsx` | NEW — extracted hotel form with all fields |
| `src/pages/admin/Airlines.tsx` | REPLACE inline form body with `<AirlineForm>` |
| `src/pages/admin/Hotels.tsx` | REPLACE inline form body with `<HotelForm>` |
| `src/components/admin/PackageWizard/Step2FlightHotels.tsx` | REPLACE minimal inline forms with `<AirlineForm>` and `<HotelForm>` |
| `supabase/functions/ai-text-campaign/index.ts` | UPDATE both Instagram prompt blocks |
| `src/components/admin/OrderView.tsx` | NEW — read-only order slide-over |
| `src/services/orderAttachmentService.ts` | NEW — upload/list/delete for order_attachments |
| `src/components/admin/OrderAttachmentUploader.tsx` | NEW — multi-file uploader for order receipts |
| `src/pages/admin/Orders.tsx` | ADD View button; wire OrderView |
| `src/components/admin/OrderForm/OrderForm.tsx` | REPLACE single proof URL field with `<OrderAttachmentUploader>` |
| `src/pages/admin/SiteSettings.tsx` | REPLACE URL inputs for logos with upload/URL tab pickers |
| `src/components/admin/PosterMaker/TemplatePanel.tsx` | FIX hardcoded phone in `DEFAULT_FOOTER` |
| `src/pages/admin/Categories.tsx` | ADD terms_conditions textarea to form |
| `supabase/functions/generate-itinerary-pdf/index.ts` | ADD T&C section before closing footer; accept `termsConditions` param |
| `services/itineraryPdfService.ts` | ADD `generateAndSaveItineraryPdf` function |
| `src/pages/admin/PackageDetailPanel.tsx` | UPDATE PDF button to Lihat/Regenerate flow; fetch category TnC |
| `components/TourDetail.tsx` | REMOVE brosur button; ADD Lihat Itinerary button |
| `src/pages/Home.tsx` | ADD `.eq('is_published', true)` filter |
| `src/pages/PackageDetailPage.tsx` | ADD `.eq('is_published', true)` filter |

---

## Task 1: DB Migration + Storage Buckets

**Files:**
- Create: `supabase/migrations/20260725000001_multi_feature_improvements.sql`

**Interfaces:**
- Produces: `packages.is_published`, `packages.itinerary_pdf_url`, `categories.terms_conditions`, `order_attachments` table

- [ ] **Step 1: Write migration file**

```sql
-- supabase/migrations/20260725000001_multi_feature_improvements.sql

-- packages: publish toggle (default true keeps existing packages visible)
ALTER TABLE packages
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;

-- packages: persist generated itinerary PDF URL
ALTER TABLE packages
  ADD COLUMN IF NOT EXISTS itinerary_pdf_url text;

-- categories: terms & conditions per category
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS terms_conditions text;

-- order receipts: multi-file attachment table (same pattern as booking_attachments)
CREATE TABLE IF NOT EXISTS order_attachments (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    uuid        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  file_url    text        NOT NULL,
  file_name   text        NOT NULL,
  file_type   text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE order_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users manage order_attachments"
  ON order_attachments FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

- [ ] **Step 2: Apply migration**

```bash
supabase db push
```

Verify in Supabase dashboard → Table Editor that:
- `packages` has `is_published` (boolean, default true) and `itinerary_pdf_url` (text, nullable)
- `categories` has `terms_conditions` (text, nullable)
- `order_attachments` table exists with the correct columns

- [ ] **Step 3: Create storage buckets via CLI**

```bash
# Public bucket for site logos (siskopatuh, 5 pasti umrah)
supabase storage create site-assets --public

# Private bucket for order receipt uploads
supabase storage create order-attachments
```

If the CLI doesn't support `storage create`, create both buckets manually in the Supabase Dashboard → Storage tab:
- `site-assets`: Public
- `order-attachments`: Private (authenticated upload, public download via signed URL)

Also create `itinerary-pdfs` bucket (public, for persisted itinerary PDFs):
```bash
supabase storage create itinerary-pdfs --public
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260725000001_multi_feature_improvements.sql
git commit -m "feat: add migrations for publish toggle, itinerary PDF url, category TnC, order attachments"
```

---

## Task 2: TypeScript Types

**Files:**
- Modify: `types.ts`

**Interfaces:**
- Produces: `TourPackage.is_published`, `TourPackage.itinerary_pdf_url`, `Category.terms_conditions`, `OrderAttachment` interface

- [ ] **Step 1: Add fields to `TourPackage`**

In `types.ts`, locate the `TourPackage` interface (line ~51). After `brochure_url?: string;` add:

```typescript
  is_published?: boolean;
  itinerary_pdf_url?: string;
```

- [ ] **Step 2: Add field to `Category`**

In `types.ts`, locate the `Category` interface (line ~17). Change it to:

```typescript
export interface Category {
  id: string;
  name: string;
  slug: string;
  terms_conditions?: string;
}
```

- [ ] **Step 3: Add `OrderAttachment` interface**

After the `BookingAttachment` interface at the bottom of `types.ts`, add:

```typescript
export interface OrderAttachment {
  id: string;
  order_id: string;
  file_url: string;
  file_name: string;
  file_type?: string;
  created_at: string;
}
```

- [ ] **Step 4: Commit**

```bash
git add types.ts
git commit -m "feat: extend TourPackage and Category types; add OrderAttachment interface"
```

---

## Task 3: Package Publish Toggle

**Files:**
- Modify: `src/pages/admin/Packages.tsx`
- Modify: `src/pages/admin/PackageWizard.tsx`
- Modify: `src/components/admin/PackageWizard/Step1BasicInfo.tsx`
- Modify: `src/pages/Home.tsx`
- Modify: `src/pages/PackageDetailPage.tsx`

**Interfaces:**
- Consumes: `TourPackage.is_published` (Task 2)

- [ ] **Step 1: Add `is_published` to WizardDraft**

In `src/pages/admin/PackageWizard.tsx`, add `is_published: boolean;` to the `WizardDraft` interface and `is_published: true,` to `EMPTY_DRAFT`:

```typescript
// In WizardDraft interface, after `is_popular: boolean;`:
  is_published: boolean;

// In EMPTY_DRAFT, after `is_popular: false,`:
  is_published: true,
```

Also update the Supabase upsert payload to include `is_published`. Find the `upsert` call (it will have `title`, `category`, etc.) and add `is_published: draft.is_published` to it.

- [ ] **Step 2: Add toggle to Step1BasicInfo**

In `src/components/admin/PackageWizard/Step1BasicInfo.tsx`, after the `is_popular` toggle (or at the bottom of the SectionCard form), add:

```tsx
<div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
  <div>
    <p className="text-sm font-medium text-gray-700">Published</p>
    <p className="text-xs text-gray-400 mt-0.5">Tampilkan paket ini di halaman publik</p>
  </div>
  <button
    type="button"
    onClick={() => updateDraft({ is_published: !draft.is_published })}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
      draft.is_published ? 'bg-primary' : 'bg-gray-200'
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
        draft.is_published ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
</div>
```

- [ ] **Step 3: Add Status column with inline toggle to Packages list**

In `src/pages/admin/Packages.tsx`:

a) Add `Eye, EyeOff` to the lucide-react import.

b) Add an `updatingId` state: `const [updatingId, setUpdatingId] = useState<string | null>(null);`

c) Add toggle handler after `handleDelete`:

```typescript
const handleTogglePublish = async (pkg: any) => {
  setUpdatingId(pkg.id);
  const { error } = await supabase
    .from('packages')
    .update({ is_published: !pkg.is_published })
    .eq('id', pkg.id);
  setUpdatingId(null);
  if (error) {
    toast('error', 'Failed to update publish status.');
  } else {
    setPackages(prev =>
      prev.map(p => p.id === pkg.id ? { ...p, is_published: !p.is_published } : p)
    );
  }
};
```

d) In `THead`, after `<Th width="20%">Quota</Th>` add `<Th width="10%">Status</Th>`. Adjust the Actions `width` to `"10%"`.

e) In the row, after the Quota `<Td>`, add:

```tsx
<Td>
  <button
    onClick={() => handleTogglePublish(pkg)}
    disabled={updatingId === pkg.id}
    title={pkg.is_published ? 'Published — klik untuk hide' : 'Unpublished — klik untuk publish'}
    className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
  >
    {updatingId === pkg.id ? (
      <span className="text-gray-400">…</span>
    ) : pkg.is_published !== false ? (
      <><Eye className="w-3.5 h-3.5 text-emerald-500" /><span className="text-emerald-600">Published</span></>
    ) : (
      <><EyeOff className="w-3.5 h-3.5 text-gray-400" /><span className="text-gray-500">Hidden</span></>
    )}
  </button>
</Td>
```

Also update `SkeletonRows` and `colSpan` from `5` to `6` wherever they appear in the same table.

- [ ] **Step 4: Filter public pages**

In `src/pages/Home.tsx`, find the `supabase.from('packages').select(...)` call and append `.eq('is_published', true)` before `.order(...)`.

In `src/pages/PackageDetailPage.tsx`, find the packages fetch and append `.eq('is_published', true)`.

- [ ] **Step 5: Verify**

1. `npm run dev` → go to Admin → Packages.
2. Confirm a "Status" column shows "Published" (green) for all existing packages.
3. Click the toggle on one package — it should switch to "Hidden" instantly.
4. Open the public home page (http://localhost:3000) — that package should be gone.
5. Toggle it back to Published — it should reappear on the public page.
6. Create a new package via the wizard — the toggle in Step 1 should default to Published.

- [ ] **Step 6: Commit**

```bash
git add src/pages/admin/Packages.tsx src/pages/admin/PackageWizard.tsx src/components/admin/PackageWizard/Step1BasicInfo.tsx src/pages/Home.tsx src/pages/PackageDetailPage.tsx
git commit -m "feat: add package publish toggle for admin and public page filtering"
```

---

## Task 4: Shared AirlineForm + HotelForm

**Files:**
- Create: `src/components/admin/AirlineForm.tsx`
- Create: `src/components/admin/HotelForm.tsx`
- Modify: `src/pages/admin/Airlines.tsx`
- Modify: `src/pages/admin/Hotels.tsx`
- Modify: `src/components/admin/PackageWizard/Step2FlightHotels.tsx`

**Interfaces:**
- Produces:
  - `AirlineForm` props: `{ editingId?: string | null; initialData?: { name: string; logo_url: string; country_id: string }; onSaved: (row: { id: string; name: string; logo_url: string | null; country_id: string | null }) => void; onCancel: () => void; formId?: string; }`
  - `HotelForm` props: `{ editingId?: string | null; initialData?: { name: string; location: string; stars: number; room_types: RoomTypeRow[]; maps_url: string; country_id: string }; onSaved: (row: { id: string; name: string; location: string; stars: number }) => void; onCancel: () => void; formId?: string; }`

- [ ] **Step 1: Create `AirlineForm.tsx`**

```tsx
// src/components/admin/AirlineForm.tsx
import React, { useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { FormField, inputClass, btnPrimary, btnSecondary, useToast } from './ui';
import CountrySelect from './CountrySelect';

interface AirlineRow { id: string; name: string; logo_url: string | null; country_id: string | null; }
interface AirlineFormData { name: string; logo_url: string; country_id: string; }

interface Props {
  editingId?: string | null;
  initialData?: AirlineFormData;
  onSaved: (row: AirlineRow) => void;
  onCancel: () => void;
  formId?: string;
}

const EMPTY: AirlineFormData = { name: '', logo_url: '', country_id: '' };

const AirlineForm: React.FC<Props> = ({ editingId, initialData, onSaved, onCancel, formId = 'airline-form' }) => {
  const toast = useToast();
  const [form, setForm] = useState<AirlineFormData>(initialData ?? EMPTY);
  const [logoTab, setLogoTab] = useState<'upload' | 'url'>(initialData?.logo_url ? 'url' : 'upload');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast('error', 'File terlalu besar. Maksimum 2 MB.'); e.target.value = ''; return; }
    setUploading(true);
    const ext = (file.name.split('.').pop() ?? 'png').toLowerCase().slice(0, 5);
    const path = `${crypto.randomUUID()}.${ext}`;
    const { data, error } = await supabase.storage.from('airline-logos').upload(path, file, { upsert: true, contentType: file.type || 'image/png' });
    if (error) { toast('error', 'Logo upload failed.'); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('airline-logos').getPublicUrl(data.path);
    setForm(f => ({ ...f, logo_url: urlData.publicUrl }));
    setUploading(false);
    toast('success', 'Logo uploaded.');
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { name: form.name.trim(), logo_url: form.logo_url || null, country_id: form.country_id || null };
    if (editingId) {
      const { error } = await supabase.from('airlines').update(payload).eq('id', editingId);
      setSaving(false);
      if (error) { toast('error', 'Failed to save airline.'); return; }
      toast('success', 'Airline updated.');
      onSaved({ id: editingId, ...payload });
    } else {
      const { data, error } = await supabase.from('airlines').insert([payload]).select().single();
      setSaving(false);
      if (error) { toast('error', 'Failed to save airline.'); return; }
      toast('success', 'Airline added.');
      onSaved(data as AirlineRow);
    }
  };

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-5">
      <FormField label="Airline Name" required>
        <input type="text" required className={inputClass} placeholder="e.g., Garuda Indonesia"
          value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
      </FormField>

      <FormField label="Logo">
        <div className="flex gap-2 mb-3">
          {(['upload', 'url'] as const).map(tab => (
            <button key={tab} type="button" onClick={() => setLogoTab(tab)}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${logoTab === tab ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {tab === 'upload' ? 'Upload' : 'URL'}
            </button>
          ))}
        </div>
        {logoTab === 'upload' ? (
          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-gray-300 cursor-pointer hover:border-primary hover:bg-blue-50/30 transition-colors">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Upload className="w-4 h-4 text-gray-400" />}
            <span className="text-sm text-gray-500">{uploading ? 'Uploading...' : 'Click to upload logo'}</span>
            <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={uploading} />
          </label>
        ) : (
          <input type="url" className={inputClass} placeholder="https://..." value={form.logo_url}
            onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))} />
        )}
        {form.logo_url && (
          <img src={form.logo_url} alt="Preview" className="mt-2 h-10 object-contain rounded border border-gray-100 bg-gray-50 p-1" />
        )}
      </FormField>

      <FormField label="Country">
        <CountrySelect value={form.country_id} onChange={v => setForm(f => ({ ...f, country_id: v }))} />
      </FormField>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className={btnSecondary}>Cancel</button>
        <button type="submit" disabled={saving || uploading} className={btnPrimary}>
          {saving ? 'Saving...' : editingId ? 'Update Airline' : 'Add Airline'}
        </button>
      </div>
    </form>
  );
};

export default AirlineForm;
```

- [ ] **Step 2: Create `HotelForm.tsx`**

```tsx
// src/components/admin/HotelForm.tsx
import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { FormField, inputClass, selectClass, btnPrimary, btnSecondary, useToast } from './ui';
import CountrySelect from './CountrySelect';

interface RoomTypeRow { name: string; capacity: number; }
interface HotelRow { id: string; name: string; location: string; stars: number; }
interface HotelFormData {
  name: string; location: string; stars: number;
  room_types: RoomTypeRow[]; maps_url: string; country_id: string;
}

interface Props {
  editingId?: string | null;
  initialData?: HotelFormData;
  onSaved: (row: HotelRow) => void;
  onCancel: () => void;
  formId?: string;
}

const DEFAULT_ROOM_TYPES: RoomTypeRow[] = [
  { name: 'Quad', capacity: 4 },
  { name: 'Triple', capacity: 3 },
  { name: 'Double', capacity: 2 },
];

const EMPTY: HotelFormData = { name: '', location: '', stars: 3, room_types: DEFAULT_ROOM_TYPES, maps_url: '', country_id: '' };

const HotelForm: React.FC<Props> = ({ editingId, initialData, onSaved, onCancel, formId = 'hotel-form' }) => {
  const toast = useToast();
  const [form, setForm] = useState<HotelFormData>(initialData ?? EMPTY);
  const [saving, setSaving] = useState(false);

  const addRoomType = () => setForm(f => ({ ...f, room_types: [...f.room_types, { name: '', capacity: 2 }] }));
  const updateRoomType = (i: number, field: keyof RoomTypeRow, value: string | number) =>
    setForm(f => { const rt = [...f.room_types]; rt[i] = { ...rt[i], [field]: value }; return { ...f, room_types: rt }; });
  const removeRoomType = (i: number) => setForm(f => ({ ...f, room_types: f.room_types.filter((_, idx) => idx !== i) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name.trim(), location: form.location.trim(), stars: form.stars,
      room_types: form.room_types, maps_url: form.maps_url || null, country_id: form.country_id || null,
    };
    if (editingId) {
      const { error } = await supabase.from('hotels').update(payload).eq('id', editingId);
      setSaving(false);
      if (error) { toast('error', 'Failed to save hotel.'); return; }
      toast('success', 'Hotel updated.');
      onSaved({ id: editingId, name: payload.name, location: payload.location, stars: payload.stars });
    } else {
      const { data, error } = await supabase.from('hotels').insert([payload]).select().single();
      setSaving(false);
      if (error) { toast('error', 'Failed to save hotel.'); return; }
      toast('success', 'Hotel added.');
      onSaved(data as HotelRow);
    }
  };

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-5">
      <FormField label="Hotel Name" required>
        <input type="text" required className={inputClass} placeholder="e.g., Hilton Makkah"
          value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
      </FormField>
      <FormField label="Location" required>
        <input type="text" required className={inputClass} placeholder="e.g., Makkah, Saudi Arabia"
          value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
      </FormField>
      <FormField label="Star Rating">
        <select className={selectClass} value={form.stars} onChange={e => setForm(f => ({ ...f, stars: +e.target.value }))}>
          {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Bintang</option>)}
        </select>
      </FormField>
      <FormField label="Country">
        <CountrySelect value={form.country_id} onChange={v => setForm(f => ({ ...f, country_id: v }))} />
      </FormField>
      <FormField label="Google Maps URL" hint="Optional — link to the hotel on Google Maps">
        <input type="url" className={inputClass} placeholder="https://maps.google.com/..."
          value={form.maps_url} onChange={e => setForm(f => ({ ...f, maps_url: e.target.value }))} />
      </FormField>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Room Types</label>
        <div className="space-y-2 mb-2">
          {form.room_types.map((rt, i) => (
            <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
              <input type="text" className={`flex-1 ${inputClass}`} placeholder="Room type name" value={rt.name}
                onChange={e => updateRoomType(i, 'name', e.target.value)} />
              <input type="number" className="w-20 px-3 py-2 border border-gray-200 rounded-xl text-sm" min={1} max={10} value={rt.capacity}
                onChange={e => updateRoomType(i, 'capacity', +e.target.value)} title="Capacity (pax)" />
              <button type="button" onClick={() => removeRoomType(i)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addRoomType} className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-blue-700 transition-colors">
          <Plus className="w-4 h-4" /> Add Room Type
        </button>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className={btnSecondary}>Cancel</button>
        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving ? 'Saving...' : editingId ? 'Update Hotel' : 'Add Hotel'}
        </button>
      </div>
    </form>
  );
};

export default HotelForm;
```

- [ ] **Step 3: Update Airlines.tsx to use AirlineForm**

In `src/pages/admin/Airlines.tsx`:

a) Add import: `import AirlineForm from '../../components/admin/AirlineForm';`

b) Remove local state: `form`, `logoTab`, `uploading` states; remove `EMPTY_FORM` constant; remove `handleLogoUpload` and `handleSave` functions.

c) Keep: `isFormOpen`, `editingId`, `saving` (actually saving moves to AirlineForm, so remove `saving` too).

d) Update `openCreate`: `const openCreate = () => { setEditingId(null); setIsFormOpen(true); };`

e) Update `openEdit`: `const openEdit = (airline: Airline) => { setEditingId(airline.id); setIsFormOpen(true); };`

f) In the SlideOver, replace the entire `<form id="airline-form">…</form>` with:

```tsx
<AirlineForm
  editingId={editingId}
  initialData={editingId ? (() => {
    const a = airlines.find(x => x.id === editingId);
    return a ? { name: a.name, logo_url: a.logo_url || '', country_id: a.country_id || '' } : undefined;
  })() : undefined}
  onSaved={() => { fetchAirlines(); setIsFormOpen(false); }}
  onCancel={() => setIsFormOpen(false)}
/>
```

g) Remove the SlideOver `footer` prop (AirlineForm has its own buttons). Update SlideOver to not pass footer.

- [ ] **Step 4: Update Hotels.tsx to use HotelForm**

In `src/pages/admin/Hotels.tsx`:

a) Add import: `import HotelForm from '../../components/admin/HotelForm';`

b) Remove local state: `form`, `saving`; remove `EMPTY_FORM`, `DEFAULT_ROOM_TYPES`, `addRoomType`, `updateRoomType`, `removeRoomType`, `handleSave`.

c) Update `openCreate` and `openEdit` to just set `editingId` and open the form.

d) In the SlideOver, replace the form body with:

```tsx
<HotelForm
  editingId={editingId}
  initialData={editingId ? (() => {
    const h = hotels.find(x => x.id === editingId);
    return h ? { name: h.name, location: h.location, stars: h.stars, room_types: h.room_types ?? [], maps_url: h.maps_url || '', country_id: h.country_id || '' } : undefined;
  })() : undefined}
  onSaved={() => { fetchHotels(); setIsFormOpen(false); }}
  onCancel={() => setIsFormOpen(false)}
/>
```

e) Remove the SlideOver `footer` prop.

- [ ] **Step 5: Update Step2FlightHotels.tsx to use shared forms**

In `src/components/admin/PackageWizard/Step2FlightHotels.tsx`:

a) Add imports:
```typescript
import AirlineForm from '../AirlineForm';
import HotelForm from '../HotelForm';
```

b) Remove: `newAirlineForm`, `savingAirline`, `newHotelForm`, `savingHotel` states; remove `handleCreateAirline` and `handleCreateHotel` functions.

c) Keep: `airlineSlideOpen`, `hotelSlideOpen`, `setAirlineSlideOpen`, `setHotelSlideOpen`.

d) In the airline SlideOver, replace the form with:

```tsx
<AirlineForm
  onSaved={(airline) => {
    setAirlines(prev => [...prev, { id: airline.id, name: airline.name, logo_url: airline.logo_url ?? undefined, iata_code: undefined }]);
    toggleAirline(airline.id);
    setAirlineSlideOpen(false);
  }}
  onCancel={() => setAirlineSlideOpen(false)}
/>
```

e) In the hotel SlideOver, replace the form with:

```tsx
<HotelForm
  onSaved={(hotel) => {
    setHotels(prev => [...prev, { id: hotel.id, name: hotel.name, location: hotel.location, stars: hotel.stars }]);
    toggleHotel(hotel.id);
    setHotelSlideOpen(false);
  }}
  onCancel={() => setHotelSlideOpen(false)}
/>
```

(`toggleHotel` is the existing function that toggles a hotel id in `draft.hotel_ids`.)

- [ ] **Step 6: Verify**

1. Go to Admin → Airlines → Add Airline. Confirm all fields: Name, Logo (upload/URL), Country.
2. Go to Admin → Hotels → Add Hotel. Confirm all fields including Room Types and Maps URL.
3. Go to Admin → Packages → New Package → Step 2. Click "+ Add" next to airlines. Confirm the SlideOver shows the full AirlineForm. Add one — confirm it auto-selects.
4. Do the same for hotels.

- [ ] **Step 7: Commit**

```bash
git add src/components/admin/AirlineForm.tsx src/components/admin/HotelForm.tsx src/pages/admin/Airlines.tsx src/pages/admin/Hotels.tsx src/components/admin/PackageWizard/Step2FlightHotels.tsx
git commit -m "feat: extract shared AirlineForm and HotelForm with full fields; use in wizard quick-add"
```

---

## Task 5: Instagram Caption Prompt

**Files:**
- Modify: `supabase/functions/ai-text-campaign/index.ts`

- [ ] **Step 1: Update both Instagram prompt blocks**

Open `supabase/functions/ai-text-campaign/index.ts`. There are two places that set `instructionBlock` for Instagram content. Find them by searching for `caption Instagram`.

**Block 1** — `channel === 'instagram'` branch inside `type === 'paket-wisata'` (around line 106):

Replace the existing `instructionBlock = ...` with:

```typescript
instructionBlock = `Tulis caption Instagram promosi paket wisata dengan ketentuan:
- Maksimal 2 paragraf, tidak lebih.
- Baris pertama: hook yang menarik perhatian (bisa pertanyaan atau pernyataan impactful) + emoji relevan.
- Wajib gunakan emoji yang menarik di setiap baris penting (harga, fitur utama, CTA).
- Tulis singkat, padat, dan penuh semangat — hindari kalimat panjang formal.
- Akhiri dengan 1 baris hashtag populer (maks 5 hashtag).`;
```

**Block 2** — `type === 'instagram'` branch (around line 152):

Replace the existing `instructionBlock = ...` with:

```typescript
instructionBlock = `Tulis caption Instagram untuk paket wisata ini dengan ketentuan:
- Maksimal 2 paragraf, tidak lebih.
- Paragraf pertama: hook emosional yang kuat + destinasi utama + emoji.
- Paragraf kedua: 2-3 keunggulan paket + harga terbaik + CTA singkat + emoji.
- Wajib gunakan emoji yang relevan dan menarik di setiap baris penting.
- Hindari kalimat panjang dan formal — gaya kasual, energik, inspiratif.
- Akhiri dengan 1 baris hashtag populer (maks 5 hashtag).`;
```

- [ ] **Step 2: Deploy edge function**

```bash
supabase functions deploy ai-text-campaign
```

- [ ] **Step 3: Verify**

1. Go to Admin → Text Campaign.
2. Select a package, set Type = "Instagram", Channel = "Instagram".
3. Click Generate. The output should be max 2 paragraphs, emoji-rich, with hashtags at the end.

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/ai-text-campaign/index.ts
git commit -m "feat: update Instagram caption prompts — max 2 paragraphs, emoji-rich"
```

---

## Task 6: Orders — View Slide-Over + Multi-Attachment Receipts

**Files:**
- Create: `src/services/orderAttachmentService.ts`
- Create: `src/components/admin/OrderView.tsx`
- Create: `src/components/admin/OrderAttachmentUploader.tsx`
- Modify: `src/pages/admin/Orders.tsx`
- Modify: `src/components/admin/OrderForm/OrderForm.tsx`

**Interfaces:**
- Consumes: `OrderAttachment` interface (Task 2), `order-attachments` storage bucket (Task 1)
- Produces:
  - `orderAttachmentService.getAttachments(orderId: string): Promise<OrderAttachment[]>`
  - `orderAttachmentService.uploadAttachment(file: File, orderId: string): Promise<OrderAttachment>`
  - `orderAttachmentService.deleteAttachment(attachment: OrderAttachment): Promise<void>`
  - `<OrderView order={any} onClose={() => void} />` — read-only slide-over
  - `<OrderAttachmentUploader orderId={string | null} />` — multi-file uploader

- [ ] **Step 1: Create orderAttachmentService**

```typescript
// src/services/orderAttachmentService.ts
import { supabase } from '@/src/lib/supabase';
import type { OrderAttachment } from '@/types';

export const orderAttachmentService = {
  async getAttachments(orderId: string): Promise<OrderAttachment[]> {
    const { data, error } = await supabase
      .from('order_attachments')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as OrderAttachment[];
  },

  async uploadAttachment(file: File, orderId: string): Promise<OrderAttachment> {
    if (file.size > 5 * 1024 * 1024) throw new Error('File terlalu besar. Maksimum 5 MB.');
    const ext = file.name.split('.').pop() ?? 'bin';
    const path = `${orderId}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('order-attachments')
      .upload(path, file);
    if (uploadError) throw uploadError;
    const { data: { publicUrl } } = supabase.storage.from('order-attachments').getPublicUrl(path);
    const { data, error: dbError } = await supabase
      .from('order_attachments')
      .insert([{ order_id: orderId, file_url: publicUrl, file_name: file.name, file_type: file.type }])
      .select()
      .single();
    if (dbError) throw dbError;
    return data as OrderAttachment;
  },

  async deleteAttachment(attachment: OrderAttachment): Promise<void> {
    const urlParts = attachment.file_url.split('/order-attachments/');
    if (urlParts.length > 1) {
      await supabase.storage.from('order-attachments').remove([urlParts[1]]);
    }
    const { error } = await supabase.from('order_attachments').delete().eq('id', attachment.id);
    if (error) throw error;
  },
};
```

- [ ] **Step 2: Create OrderAttachmentUploader**

```tsx
// src/components/admin/OrderAttachmentUploader.tsx
import React, { useState, useEffect } from 'react';
import { Paperclip, Loader2, X, FileText, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { useToast, btnSecondary } from './ui';
import type { OrderAttachment } from '@/types';
import { orderAttachmentService } from '../../services/orderAttachmentService';

interface Props {
  orderId: string | null; // null when creating new order (pre-save)
}

const OrderAttachmentUploader: React.FC<Props> = ({ orderId }) => {
  const toast = useToast();
  const [attachments, setAttachments] = useState<OrderAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    orderAttachmentService.getAttachments(orderId)
      .then(setAttachments)
      .catch(() => toast('error', 'Gagal memuat lampiran.'))
      .finally(() => setLoading(false));
  }, [orderId]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !orderId) return;
    try {
      setUploading(true);
      const att = await orderAttachmentService.uploadAttachment(file, orderId);
      setAttachments(prev => [att, ...prev]);
      toast('success', 'Bukti pembayaran diunggah.');
    } catch (err: any) {
      toast('error', err.message || 'Upload gagal.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (att: OrderAttachment) => {
    try {
      await orderAttachmentService.deleteAttachment(att);
      setAttachments(prev => prev.filter(a => a.id !== att.id));
      toast('success', 'Lampiran dihapus.');
    } catch {
      toast('error', 'Gagal menghapus lampiran.');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-gray-400">Bukti Pembayaran</p>
        <label className={`${btnSecondary} cursor-pointer text-xs py-1.5 ${!orderId ? 'opacity-50 pointer-events-none' : ''}`}>
          {uploading ? <><Loader2 className="w-3 h-3 animate-spin mr-1" />Uploading…</> : 'Upload File'}
          <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} disabled={uploading || !orderId} />
        </label>
      </div>
      {!orderId && (
        <p className="text-xs text-gray-400 italic">Simpan order terlebih dahulu sebelum mengunggah bukti pembayaran.</p>
      )}
      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
      ) : attachments.length === 0 ? (
        <div className="text-center py-5 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          <Paperclip className="w-5 h-5 text-gray-300 mx-auto mb-1" />
          <p className="text-xs text-gray-400">Belum ada lampiran.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {attachments.map(att => (
            <li key={att.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 group">
              <div className="flex items-center gap-2 min-w-0">
                {att.file_type?.startsWith('image/') ? <ImageIcon className="w-4 h-4 text-blue-400 flex-shrink-0" /> : <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                <span className="text-sm text-gray-700 truncate">{att.file_name}</span>
              </div>
              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <a href={att.file_url} target="_blank" rel="noreferrer" className="p-1.5 text-gray-400 hover:text-primary bg-white rounded-md shadow-sm" title="Buka">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button type="button" onClick={() => handleDelete(att)} className="p-1.5 text-gray-400 hover:text-red-500 bg-white rounded-md shadow-sm" title="Hapus">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default OrderAttachmentUploader;
```

- [ ] **Step 3: Create OrderView**

```tsx
// src/components/admin/OrderView.tsx
import React, { useEffect, useState } from 'react';
import { SlideOver, StatusBadge } from './ui';
import { Loader2 } from 'lucide-react';
import type { OrderAttachment } from '@/types';
import { orderAttachmentService } from '../../services/orderAttachmentService';

interface Props {
  order: any;
  onClose: () => void;
}

const Field: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{label}</p>
    <p className="text-sm font-medium text-gray-900 mt-0.5">{value || '—'}</p>
  </div>
);

const OrderView: React.FC<Props> = ({ order, onClose }) => {
  const [attachments, setAttachments] = useState<OrderAttachment[]>([]);
  const [loadingAtts, setLoadingAtts] = useState(true);

  useEffect(() => {
    orderAttachmentService.getAttachments(order.id)
      .then(setAttachments)
      .catch(() => {})
      .finally(() => setLoadingAtts(false));
  }, [order.id]);

  return (
    <SlideOver isOpen onClose={onClose} title="Detail Order" subtitle={order.packages?.title || ''}>
      <div className="space-y-6">
        {/* Customer */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
          <Field label="Nama Customer" value={order.customer_name} />
          <Field label="WhatsApp / Telepon" value={order.customer_phone} />
          <Field label="Email" value={order.customer_email} />
          <Field label="Branch" value={order.branches?.name} />
        </div>

        {/* Payment */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Status Pembayaran</p>
            <div className="mt-1"><StatusBadge status={order.payment_status || 'Unknown'} /></div>
          </div>
          <Field label="Total Harga" value={order.total_price ? `Rp ${(order.total_price as number).toLocaleString('id-ID')}` : undefined} />
          {order.amount_paid > 0 && (
            <Field label="Sudah Dibayar" value={`Rp ${(order.amount_paid as number).toLocaleString('id-ID')}`} />
          )}
          <Field label="Pax" value={`${order.participant_count} orang`} />
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Catatan</p>
            <p className="text-sm text-gray-700 whitespace-pre-line">{order.notes}</p>
          </div>
        )}

        {/* Participants */}
        {order.participants?.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">Peserta</p>
            <ul className="space-y-2">
              {order.participants.map((p: any, i: number) => (
                <li key={p.id ?? i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm">
                  <span className="font-medium text-gray-900">{p.name}</span>
                  <span className="text-gray-500 text-xs">{p.room_type} · {p.gender === 'male' ? 'L' : p.gender === 'female' ? 'P' : '—'}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Attachments */}
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">Bukti Pembayaran</p>
          {loadingAtts ? (
            <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
          ) : attachments.length === 0 ? (
            <p className="text-sm text-gray-400 italic">Belum ada bukti pembayaran.</p>
          ) : (
            <ul className="space-y-2">
              {attachments.map(att => (
                <li key={att.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm text-gray-700 truncate">{att.file_name}</span>
                  </div>
                  {att.file_type?.startsWith('image/') ? (
                    <a href={att.file_url} target="_blank" rel="noreferrer">
                      <img src={att.file_url} alt={att.file_name} className="h-12 w-20 object-cover rounded-md border border-gray-200" />
                    </a>
                  ) : (
                    <a href={att.file_url} target="_blank" rel="noreferrer"
                      className="text-xs text-blue-600 hover:underline font-medium">Buka</a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </SlideOver>
  );
};

export default OrderView;
```

- [ ] **Step 4: Add View button to Orders.tsx**

In `src/pages/admin/Orders.tsx`:

a) Add import: `import OrderView from '../../components/admin/OrderView';`

b) Add state: `const [viewingOrder, setViewingOrder] = useState<any | null>(null);`

c) In the actions column, before the "Edit" button, add:

```tsx
<button
  onClick={() => setViewingOrder(order)}
  className={`${btnGhost} text-blue-600 hover:bg-blue-50 text-xs px-2 py-1`}
>
  View
</button>
```

d) At the bottom of the component (before the closing `</div>`), add:

```tsx
{viewingOrder && (
  <OrderView order={viewingOrder} onClose={() => setViewingOrder(null)} />
)}
```

- [ ] **Step 5: Update OrderForm to use OrderAttachmentUploader**

In `src/components/admin/OrderForm/OrderForm.tsx`:

a) Add import: `import OrderAttachmentUploader from '../OrderAttachmentUploader';`

b) Remove: `paymentProofUrl`, `uploadingProof` state; remove `handleProofUpload` function.

c) Remove `payment_proof_url` from the `payload` object in `handleSubmit` (or keep as `null` for backwards compat: `payment_proof_url: null`).

d) Find the section in the JSX that renders the proof upload field (search for `handleProofUpload` or `Lihat bukti`). Replace the entire proof upload section with:

```tsx
<OrderAttachmentUploader orderId={initialData?.id ?? null} />
```

Note: For new orders (`initialData = null`), `orderId` will be `null` and the uploader shows a "save first" message. After save/creation, if the user wants to add attachments they can reopen the edit form.

- [ ] **Step 6: Verify**

1. Go to Admin → Orders. Confirm a "View" button appears before "Edit" in each row.
2. Click View → confirm the slide-over shows customer info, participants, and an attachments section.
3. Click Edit on an existing order → scroll to the bottom of the form → confirm the `OrderAttachmentUploader` appears.
4. Upload a PDF or image → confirm it appears in the list.
5. Open View for that same order → confirm the uploaded file appears in the attachments section.

- [ ] **Step 7: Commit**

```bash
git add src/services/orderAttachmentService.ts src/components/admin/OrderView.tsx src/components/admin/OrderAttachmentUploader.tsx src/pages/admin/Orders.tsx src/components/admin/OrderForm/OrderForm.tsx
git commit -m "feat: add Order View slide-over and multi-file receipt attachments"
```

---

## Task 7: Site Settings — Logo Upload + Phone Fix

**Files:**
- Modify: `src/pages/admin/SiteSettings.tsx`
- Modify: `src/components/admin/PosterMaker/TemplatePanel.tsx`

- [ ] **Step 1: Add logo upload to SiteSettings**

In `src/pages/admin/SiteSettings.tsx`:

a) Add imports: `import { Upload, Loader2 } from 'lucide-react';` (add to existing lucide import).

b) Add state for upload tabs and uploading flag:

```typescript
const [siskoTab, setSiskoTab] = useState<'upload' | 'url'>('url');
const [pastiTab, setPastiTab] = useState<'upload' | 'url'>('url');
const [uploadingLogo, setUploadingLogo] = useState<'sisko' | 'pasti' | null>(null);
```

c) Add upload handler:

```typescript
const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'siskopatuh_logo_url' | 'pasti_umrah_logo_url') => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { toast('error', 'File terlalu besar. Maksimum 2 MB.'); e.target.value = ''; return; }
  setUploadingLogo(field === 'siskopatuh_logo_url' ? 'sisko' : 'pasti');
  const ext = (file.name.split('.').pop() ?? 'png').toLowerCase().slice(0, 5);
  const name = `${field === 'siskopatuh_logo_url' ? 'siskopatuh' : 'pasti-umrah'}-${Date.now()}.${ext}`;
  const { data, error } = await supabase.storage.from('site-assets').upload(`logos/${name}`, file, { upsert: true, contentType: file.type || 'image/png' });
  setUploadingLogo(null);
  if (error) { toast('error', 'Upload logo gagal.'); e.target.value = ''; return; }
  const { data: urlData } = supabase.storage.from('site-assets').getPublicUrl(data.path);
  set(field, urlData.publicUrl);
  toast('success', 'Logo berhasil diunggah.');
  e.target.value = '';
};
```

d) Replace the `siskopatuh_logo_url` FormField (currently a URL input) with:

```tsx
<FormField label="Logo Siskopatuh">
  <div className="space-y-3">
    <div className="flex gap-2">
      {(['upload', 'url'] as const).map(tab => (
        <button key={tab} type="button" onClick={() => setSiskoTab(tab)}
          className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${siskoTab === tab ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          {tab === 'upload' ? 'Upload' : 'URL'}
        </button>
      ))}
    </div>
    {siskoTab === 'upload' ? (
      <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-gray-300 cursor-pointer hover:border-primary hover:bg-blue-50/30 transition-colors">
        {uploadingLogo === 'sisko' ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Upload className="w-4 h-4 text-gray-400" />}
        <span className="text-sm text-gray-500">{uploadingLogo === 'sisko' ? 'Uploading...' : 'Klik untuk upload logo'}</span>
        <input type="file" className="hidden" accept="image/*" onChange={e => handleLogoUpload(e, 'siskopatuh_logo_url')} disabled={uploadingLogo !== null} />
      </label>
    ) : (
      <input type="url" className={inputClass} placeholder="https://..." value={settings?.siskopatuh_logo_url || ''} onChange={e => set('siskopatuh_logo_url', e.target.value)} />
    )}
    {settings?.siskopatuh_logo_url && (
      <img src={settings.siskopatuh_logo_url} alt="Siskopatuh" className="h-10 object-contain rounded border border-gray-100 bg-gray-50 p-1" />
    )}
  </div>
</FormField>
```

e) Do the same replacement for the `pasti_umrah_logo_url` FormField, using `pastiTab`, `setPastiTab`, and `uploadingLogo === 'pasti'`.

- [ ] **Step 2: Fix hardcoded phone in TemplatePanel**

In `src/components/admin/PosterMaker/TemplatePanel.tsx`, the component already imports and calls `useSiteSettings`. Find where that hook is used (likely near the top of the component function body, after the `PosterTemplate` and `FooterData` interfaces).

The `DEFAULT_FOOTER` constant is defined at module level (line 25-30) with a hardcoded phone. Since it's outside the component, it can't use the hook. Instead, build the footer inside the component using settings:

a) Remove the `DEFAULT_FOOTER` constant.

b) Inside the `TemplatePanel` component function (where `useSiteSettings` is called), add:

```typescript
const settings = useSiteSettings();
const footerFromSettings: FooterData = {
  instagram: settings.instagram || '',
  phone: settings.phone || '',
  email: settings.email || '',
  izin_ppiu: settings.izin_ppiu || '',
};
```

c) Find every reference to `DEFAULT_FOOTER` in the component and replace it with `footerFromSettings`.

- [ ] **Step 3: Verify**

1. Admin → Site Settings → Izin & Sertifikasi section. Confirm both logo fields show Upload / URL tabs.
2. Switch to Upload tab and upload an image → confirm the preview appears.
3. Admin → Poster Maker. Open a template — the contact line in the poster should show the actual phone from site settings, not `0811-1234-5678`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/admin/SiteSettings.tsx src/components/admin/PosterMaker/TemplatePanel.tsx
git commit -m "feat: logo upload for site settings; use settings.phone in poster template defaults"
```

---

## Task 8: Category Terms & Conditions

**Files:**
- Modify: `src/pages/admin/Categories.tsx`
- Modify: `supabase/functions/generate-itinerary-pdf/index.ts`

**Interfaces:**
- Consumes: `Category.terms_conditions` (Task 2), `categories.terms_conditions` column (Task 1)

- [ ] **Step 1: Add T&C textarea to Categories form**

In `src/pages/admin/Categories.tsx`:

a) Update `EMPTY_FORM`:

```typescript
const EMPTY_FORM = { name: '', slug: '', terms_conditions: '' };
```

b) Update `openEdit`:

```typescript
const openEdit = (c: Category) => {
  setEditingId(c.id);
  setForm({ name: c.name, slug: c.slug, terms_conditions: c.terms_conditions || '' });
  setIsFormOpen(true);
};
```

c) Update `handleSave` payload:

```typescript
const payload = {
  name: form.name,
  slug: form.slug || toSlug(form.name),
  terms_conditions: form.terms_conditions || null,
};
```

d) Add `textareaClass` to the import from `'../../components/admin/ui'`.

e) In the form inside SlideOver, after the slug `FormField`, add:

```tsx
<FormField label="Syarat & Ketentuan" hint="Akan ditampilkan di halaman akhir itinerary PDF. Kosongkan jika tidak ada.">
  <textarea
    rows={8}
    className={textareaClass}
    placeholder="Tulis syarat & ketentuan paket tour..."
    value={form.terms_conditions}
    onChange={(e) => setForm({ ...form, terms_conditions: e.target.value })}
  />
</FormField>
```

f) Update the `form` state type annotation (or `EMPTY_FORM` will infer correctly from the object literal — verify TypeScript is happy after the change).

- [ ] **Step 2: Add T&C section to PDF edge function**

In `supabase/functions/generate-itinerary-pdf/index.ts`:

a) Update the `buildItineraryPdf` function signature to accept `termsConditions`:

Find: `async function buildItineraryPdf(pkg: any, siteSettings: any, logoBase64: string | null, dayPhotos: any[]):`

Change to: `async function buildItineraryPdf(pkg: any, siteSettings: any, logoBase64: string | null, dayPhotos: any[], termsConditions = ''):`

b) After the "Tidak Termasuk" section (around line 352, after `ctx.y -= 8;`) and **before** the closing footer rectangle block, insert:

```typescript
// ── Syarat & Ketentuan ────────────────────────────────────────────────────
if (termsConditions && termsConditions.trim()) {
    drawSectionHeader(ctx, 'Syarat & Ketentuan');
    ctx.y -= 4;
    const lines = termsConditions.split('\n').filter(l => l.trim());
    for (const line of lines) {
        drawText(ctx, line.trim(), { fontSize: 8, color: COLOR_GRAY, indent: 4, maxWidth: CONTENT_W - 8 });
    }
    ctx.y -= 8;
}
```

c) Update the `Deno.serve` handler to pass `termsConditions`:

Find: `const { package: pkg, siteSettings, logoBase64, dayPhotos = [] } = await req.json();`

Change to: `const { package: pkg, siteSettings, logoBase64, dayPhotos = [], termsConditions = '' } = await req.json();`

Find: `const pdfBytes = await buildItineraryPdf(pkg, siteSettings ?? {}, logoBase64 ?? null, dayPhotos);`

Change to: `const pdfBytes = await buildItineraryPdf(pkg, siteSettings ?? {}, logoBase64 ?? null, dayPhotos, termsConditions ?? '');`

- [ ] **Step 3: Update PackageDetailPanel to fetch and pass TnC**

In `src/pages/admin/PackageDetailPanel.tsx`, update the `handleGeneratePdf` function to fetch the category T&C before calling the PDF service:

```typescript
const handleGeneratePdf = async (dayPhotos: { day: number; photoUrls: string[] }[]) => {
    setPickerOpen(false);
    setIsPdfLoading(true);
    try {
        // Fetch T&C for the package's category
        let termsConditions = '';
        if (pkg.category) {
            const { data: catData } = await supabase
                .from('categories')
                .select('terms_conditions')
                .eq('name', pkg.category)
                .maybeSingle();
            termsConditions = catData?.terms_conditions || '';
        }
        const fullPkg = { ...pkg, airlines, hotels };
        await downloadItineraryPdf(
            fullPkg,
            { whatsapp: settings.whatsapp, phone: settings.phone },
            dayPhotos,
            termsConditions,
        );
    } catch (err) {
        console.error('PDF generation failed:', err);
        alert('Gagal mengunduh itinerary. Silakan coba lagi.');
    } finally {
        setIsPdfLoading(false);
    }
};
```

Also update `downloadItineraryPdf` in `services/itineraryPdfService.ts` to accept and forward `termsConditions`:

In `services/itineraryPdfService.ts`, change the signature and body of `downloadItineraryPdf`:

```typescript
export async function downloadItineraryPdf(
    pkg: any,
    siteSettings: ItinerarySiteSettings,
    dayPhotos?: { day: number; photoUrls: string[] }[],
    termsConditions?: string,
): Promise<void> {
    // ... existing session/logo code ...
    const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-itinerary-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ package: pkg, siteSettings, logoBase64, dayPhotos: dayPhotos ?? [], termsConditions: termsConditions ?? '' }),
    });
    // ... rest unchanged ...
}
```

- [ ] **Step 4: Deploy edge function**

```bash
supabase functions deploy generate-itinerary-pdf
```

- [ ] **Step 5: Verify**

1. Admin → Categories → Edit a category. Confirm the "Syarat & Ketentuan" textarea appears.
2. Paste the example T&C text from the spec, save.
3. Admin → Packages → View a package that uses that category → click "Itinerary PDF" → go through the photo picker.
4. Open the downloaded PDF → confirm a "Syarat & Ketentuan" section appears at the end with the text you entered.

- [ ] **Step 6: Commit**

```bash
git add src/pages/admin/Categories.tsx supabase/functions/generate-itinerary-pdf/index.ts services/itineraryPdfService.ts src/pages/admin/PackageDetailPanel.tsx
git commit -m "feat: add category Terms & Conditions; render T&C section in itinerary PDF"
```

---

## Task 9: Public Page — Itinerary PDF View + Remove Brosur Button

**Files:**
- Modify: `services/itineraryPdfService.ts`
- Modify: `src/pages/admin/PackageDetailPanel.tsx`
- Modify: `components/TourDetail.tsx`

**Interfaces:**
- Consumes: `TourPackage.itinerary_pdf_url` (Task 2), `packages.itinerary_pdf_url` column (Task 1), `itinerary-pdfs` storage bucket (Task 1)
- Produces: `generateAndSaveItineraryPdf(pkg, siteSettings, dayPhotos, termsConditions): Promise<string>` — returns public URL

- [ ] **Step 1: Add `generateAndSaveItineraryPdf` to itineraryPdfService**

In `services/itineraryPdfService.ts`, add after `downloadItineraryPdf`:

```typescript
export async function generateAndSaveItineraryPdf(
    pkg: any,
    siteSettings: ItinerarySiteSettings,
    dayPhotos?: { day: number; photoUrls: string[] }[],
    termsConditions?: string,
): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const logoBase64 = await getLogoBase64();

    const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-itinerary-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ package: pkg, siteSettings, logoBase64, dayPhotos: dayPhotos ?? [], termsConditions: termsConditions ?? '' }),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`PDF generation failed: ${res.status} ${text}`);
    }

    const blob = await res.blob();

    // Upload to persistent storage (upsert so regenerating overwrites the same file)
    const fileName = `${pkg.id}/itinerary.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('itinerary-pdfs')
        .upload(fileName, blob, { upsert: true, contentType: 'application/pdf' });
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from('itinerary-pdfs').getPublicUrl(uploadData.path);

    // Save URL to package record
    await supabase.from('packages').update({ itinerary_pdf_url: publicUrl }).eq('id', pkg.id);

    return publicUrl;
}
```

- [ ] **Step 2: Update PackageDetailPanel PDF button flow**

In `src/pages/admin/PackageDetailPanel.tsx`:

a) Add import: `import { downloadItineraryPdf, generateAndSaveItineraryPdf } from '../../../services/itineraryPdfService';`

b) Add state: `const [pdfDialogOpen, setPdfDialogOpen] = useState(false);`

c) Change the "Itinerary PDF" button's `onClick`:

```typescript
// Old: onClick={handleDownloadPdf}  (which just setPickerOpen(true))
// New:
onClick={() => {
  if (pkg.itinerary_pdf_url) {
    setPdfDialogOpen(true);
  } else {
    setPickerOpen(true); // goes straight to photo picker → generate+save
  }
}}
```

d) Update `handleGeneratePdf` to call `generateAndSaveItineraryPdf` (which saves the URL) and then open the result:

```typescript
const handleGeneratePdf = async (dayPhotos: { day: number; photoUrls: string[] }[]) => {
    setPickerOpen(false);
    setPdfDialogOpen(false);
    setIsPdfLoading(true);
    try {
        let termsConditions = '';
        if (pkg.category) {
            const { data: catData } = await supabase
                .from('categories')
                .select('terms_conditions')
                .eq('name', pkg.category)
                .maybeSingle();
            termsConditions = catData?.terms_conditions || '';
        }
        const fullPkg = { ...pkg, airlines, hotels };
        const pdfUrl = await generateAndSaveItineraryPdf(
            fullPkg,
            { whatsapp: settings.whatsapp, phone: settings.phone },
            dayPhotos,
            termsConditions,
        );
        window.open(pdfUrl, '_blank');
    } catch (err) {
        console.error('PDF generation failed:', err);
        alert('Gagal mengunduh itinerary. Silakan coba lagi.');
    } finally {
        setIsPdfLoading(false);
    }
};
```

e) Add the PDF options dialog (rendered inline, not a full modal):

```tsx
{pdfDialogOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-2xl p-6 w-80 space-y-4">
      <h3 className="font-semibold text-gray-900">Itinerary PDF</h3>
      <p className="text-sm text-gray-500">PDF sudah pernah dibuat. Lihat versi sebelumnya atau generate ulang dengan foto terbaru.</p>
      <div className="flex flex-col gap-2">
        <button
          onClick={() => { window.open(pkg.itinerary_pdf_url, '_blank'); setPdfDialogOpen(false); }}
          className={btnPrimary}
        >
          Lihat PDF
        </button>
        <button
          onClick={() => { setPdfDialogOpen(false); setPickerOpen(true); }}
          className={btnSecondary}
        >
          Regenerate
        </button>
        <button
          onClick={() => setPdfDialogOpen(false)}
          className={`${btnGhost} text-xs`}
        >
          Batal
        </button>
      </div>
    </div>
  </div>
)}
```

Add `btnSecondary` to the import from `../../components/admin/ui` if not already there.

- [ ] **Step 3: Remove brosur button + add Lihat Itinerary in TourDetail**

In `components/TourDetail.tsx`:

a) Find the brosur button block (around line 489):
```tsx
{tour.brochure_url && (
  <button
    onClick={() => window.open(tour.brochure_url, '_blank')}
    ...
  >
    {t('detail_brochure')}
  </button>
)}
```
Delete this entire block.

b) In the same area (the CTA button group), add the Lihat Itinerary button:

```tsx
{tour.itinerary_pdf_url && (
  <a
    href={tour.itinerary_pdf_url}
    target="_blank"
    rel="noreferrer"
    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
  >
    <FileText className="w-4 h-4" />
    Lihat Itinerary
  </a>
)}
```

Make sure `FileText` is already in the lucide-react import (it is, at line 19).

- [ ] **Step 4: Verify**

1. Admin → Packages → View → click "Itinerary PDF" on a package without a saved PDF → photo picker appears → select photos → PDF generates, saves, opens in new tab.
2. Click "Itinerary PDF" again on the same package → dialog appears with "Lihat PDF" and "Regenerate" options.
3. Click "Lihat PDF" → the previously saved PDF opens without regenerating.
4. Click "Regenerate" → picker appears → new PDF saves + opens.
5. Open the public package detail page → confirm "Unduh Brosur" button is gone.
6. Confirm "Lihat Itinerary" button appears and opens the correct PDF.

- [ ] **Step 5: Commit**

```bash
git add services/itineraryPdfService.ts src/pages/admin/PackageDetailPanel.tsx components/TourDetail.tsx
git commit -m "feat: persist itinerary PDF URL; add Lihat/Regenerate PDF flow; remove brosur button on public page"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** All 7 feature areas are covered across Tasks 3–9.
- [x] **No placeholders:** All code blocks are complete; no "TBD" or "implement X" without code.
- [x] **Type consistency:** `OrderAttachment` defined in Task 2 → used in Tasks 6, 7. `termsConditions` param added to `downloadItineraryPdf` in Task 8 step 3 and to the signature in Task 9 step 1 — both consistent. `generateAndSaveItineraryPdf` defined in Task 9 step 1 and called in Task 9 step 2 with matching params.
- [x] **Storage buckets:** `site-assets` (Task 7), `order-attachments` (Task 6), `itinerary-pdfs` (Task 9) — all created in Task 1 step 3.
- [x] **Edge function deploys:** `ai-text-campaign` (Task 5), `generate-itinerary-pdf` (Tasks 8 + 9) — deploy steps included in each task.
- [x] **TemplatePanel `DEFAULT_FOOTER`:** Fixed in Task 7 step 2 — moved inside component to read from `useSiteSettings`.
- [x] **`downloadItineraryPdf` updated:** Task 8 step 3 adds `termsConditions` param, forwarding it to the edge function. Task 9 uses `generateAndSaveItineraryPdf` which is a separate function.
