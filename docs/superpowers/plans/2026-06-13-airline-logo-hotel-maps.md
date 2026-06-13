# Airline Logo Upload & Hotel Google Maps Link — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fragile airline logo URL field with a Supabase Storage upload (with URL fallback), and add an optional Google Maps link to hotels that becomes a clickable link on the public tour detail page.

**Architecture:** One SQL migration adds `hotels.maps_url`; the `airline-logos` storage bucket is created via Supabase CLI. `Airlines.tsx` gets a dual-tab logo input (upload → Storage → public URL, or paste URL). `Hotels.tsx` gets a new optional `maps_url` field. `types.ts` and `TourDetail.tsx` are updated to expose and render the map link.

**Tech Stack:** React, TypeScript, Supabase JS client (`supabase.storage`), Tailwind CSS (CDN), Lucide React icons.

---

## File Map

| Action | File |
|--------|------|
| Create | `supabase/migrations/20260613_airline_logo_hotel_maps.sql` |
| Modify | `src/pages/admin/Airlines.tsx` |
| Modify | `src/pages/admin/Hotels.tsx` |
| Modify | `types.ts` |
| Modify | `components/TourDetail.tsx` |

---

## Task 1: Database Migration & Storage Bucket

**Files:**
- Create: `supabase/migrations/20260613_airline_logo_hotel_maps.sql`

- [ ] **Step 1: Create the migration file**

Create `supabase/migrations/20260613_airline_logo_hotel_maps.sql` with this exact content:

```sql
-- Add Google Maps URL to hotels
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS maps_url TEXT DEFAULT NULL;
```

- [ ] **Step 2: Apply the migration**

```bash
supabase db push
```

Expected: migration applies cleanly. If you see "already exists" errors, that's fine — the `IF NOT EXISTS` guard handles it.

- [ ] **Step 3: Create the airline-logos storage bucket**

Run the following to create a public bucket for airline logos:

```bash
supabase storage create airline-logos --public
```

If the CLI version doesn't support `storage create`, create it via the Supabase dashboard:
1. Go to Storage → New bucket
2. Name: `airline-logos`
3. Toggle "Public bucket" ON
4. Save

- [ ] **Step 4: Verify bucket exists**

```bash
supabase storage ls
```

Expected output includes `airline-logos` in the list.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260613_airline_logo_hotel_maps.sql
git commit -m "feat: add hotels.maps_url column and airline-logos storage bucket"
```

---

## Task 2: Airlines Admin — Dual-Tab Logo Input

**Files:**
- Modify: `src/pages/admin/Airlines.tsx`

This task replaces the single "Logo URL" field with a two-tab component: "Upload" (file → Supabase Storage) and "URL" (paste link). Both tabs share the same preview.

- [ ] **Step 1: Add new state and imports**

At the top of `Airlines.tsx`, the current imports are:
```tsx
import { Plus, Edit2, Trash2, Plane } from 'lucide-react';
```

Add `Upload, Link` to the lucide import:
```tsx
import { Plus, Edit2, Trash2, Plane, Upload, Link } from 'lucide-react';
```

Inside the `Airlines` component, after the existing `useState` declarations, add:
```tsx
const [logoTab, setLogoTab] = useState<'upload' | 'url'>('upload');
const [uploading, setUploading] = useState(false);
```

- [ ] **Step 2: Add the logo upload handler**

Add this function inside the `Airlines` component, after `fetchAirlines`:

```tsx
const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop() ?? 'png';
    const path = `${crypto.randomUUID()}.${ext}`;
    const { data, error } = await supabase.storage
        .from('airline-logos')
        .upload(path, file, { upsert: true });
    if (error) {
        toast('error', 'Logo upload failed.');
        setUploading(false);
        return;
    }
    const { data: urlData } = supabase.storage.from('airline-logos').getPublicUrl(data.path);
    setForm((f) => ({ ...f, logo_url: urlData.publicUrl }));
    setUploading(false);
    e.target.value = '';
};
```

- [ ] **Step 3: Reset logoTab when form opens**

In `openCreate`, add `setLogoTab('upload');` after `setForm(EMPTY_FORM);`:
```tsx
const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setLogoTab('upload');
    setIsFormOpen(true);
};
```

In `openEdit`, add `setLogoTab(airline.logo_url ? 'url' : 'upload');` after `setForm(...)`:
```tsx
const openEdit = (airline: Airline) => {
    setEditingId(airline.id);
    setForm({ name: airline.name, logo_url: airline.logo_url || '' });
    setLogoTab(airline.logo_url ? 'url' : 'upload');
    setIsFormOpen(true);
};
```

- [ ] **Step 4: Replace the Logo URL FormField in the form**

In the `<form id="airline-form">`, find and replace the existing `<FormField label="Logo URL" ...>` block (including the preview `div` below it) with:

```tsx
<FormField label="Logo">
    {/* Tab switcher */}
    <div className="flex rounded-lg border border-gray-200 overflow-hidden mb-3 w-fit">
        {(['upload', 'url'] as const).map((tab) => (
            <button
                key={tab}
                type="button"
                onClick={() => setLogoTab(tab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                    logoTab === tab
                        ? 'bg-primary text-white'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
            >
                {tab === 'upload' ? <Upload className="w-3 h-3" /> : <Link className="w-3 h-3" />}
                {tab === 'upload' ? 'Upload' : 'URL'}
            </button>
        ))}
    </div>

    {logoTab === 'upload' ? (
        <label className={`flex items-center justify-center gap-2 cursor-pointer rounded-lg border-2 border-dashed border-gray-200 p-4 hover:border-primary/40 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            <Upload className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">
                {uploading ? 'Uploading...' : 'Click to upload JPG / PNG / WebP / SVG'}
            </span>
            <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/svg+xml"
                className="sr-only"
                onChange={handleLogoUpload}
                disabled={uploading}
            />
        </label>
    ) : (
        <input
            type="url"
            className={inputClass}
            placeholder="https://..."
            value={form.logo_url}
            onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
        />
    )}

    {/* Shared preview */}
    {form.logo_url && (
        <div className="rounded-xl border border-gray-200 p-4 bg-gray-50 mt-3">
            <p className="text-xs text-gray-500 mb-2">Preview</p>
            <img src={form.logo_url} alt="Logo preview" className="h-10 max-w-[180px] object-contain" />
        </div>
    )}
</FormField>
```

- [ ] **Step 5: Disable Save button while uploading**

Find the Save button in the SlideOver footer:
```tsx
<button
    form="airline-form"
    type="submit"
    disabled={saving}
    className={btnPrimary}
>
```

Change `disabled={saving}` to `disabled={saving || uploading}`:
```tsx
<button
    form="airline-form"
    type="submit"
    disabled={saving || uploading}
    className={btnPrimary}
>
```

- [ ] **Step 6: Manual smoke test**

```bash
npm run dev
```

1. Go to Admin → Airlines → Add Airline
2. Upload tab: select a PNG — confirm preview appears and `logo_url` resolves to a Supabase Storage URL
3. URL tab: paste any direct image URL — confirm preview appears
4. Save and confirm the airline appears in the table with its logo
5. Edit the airline — confirm the form opens with the URL tab active (since a URL is already set)

- [ ] **Step 7: Commit**

```bash
git add src/pages/admin/Airlines.tsx
git commit -m "feat: replace airline logo URL input with dual-tab upload/URL picker"
```

---

## Task 3: Airlines Admin — Storage Cleanup on Delete

**Files:**
- Modify: `src/pages/admin/Airlines.tsx`

When an airline is deleted and its logo was uploaded to `airline-logos`, clean up the storage file.

- [ ] **Step 1: Update handleDelete to clean up stored logo**

Replace the existing `handleDelete` function with:

```tsx
const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);

    // Best-effort cleanup of uploaded logo
    const target = airlines.find((a) => a.id === deleteId);
    const storagePrefix = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/airline-logos/`;
    if (target?.logo_url?.startsWith(storagePrefix)) {
        const storagePath = target.logo_url.slice(storagePrefix.length);
        await supabase.storage.from('airline-logos').remove([storagePath]);
    }

    const { error } = await supabase.from('airlines').delete().eq('id', deleteId);
    setDeleting(false);
    setDeleteId(null);
    if (error) {
        toast('error', 'Failed to delete airline.');
    } else {
        toast('success', 'Airline deleted.');
        fetchAirlines();
    }
};
```

- [ ] **Step 2: Manual smoke test**

1. Add an airline with an uploaded logo (Task 2)
2. Delete that airline
3. Verify the row is gone from the table
4. Go to Supabase dashboard → Storage → `airline-logos` and confirm the file is gone

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/Airlines.tsx
git commit -m "feat: delete airline-logos storage file when airline is removed"
```

---

## Task 4: Hotels Admin — maps_url Field

**Files:**
- Modify: `src/pages/admin/Hotels.tsx`

- [ ] **Step 1: Update the Hotel interface**

Find:
```tsx
interface Hotel { id: string; name: string; location: string; stars: number; room_types: RoomTypeRow[]; }
```

Replace with:
```tsx
interface Hotel { id: string; name: string; location: string; stars: number; room_types: RoomTypeRow[]; maps_url: string | null; }
```

- [ ] **Step 2: Update EMPTY_FORM**

Find:
```tsx
const EMPTY_FORM = { name: '', location: '', stars: 3, room_types: [] as RoomTypeRow[] };
```

Replace with:
```tsx
const EMPTY_FORM = { name: '', location: '', stars: 3, room_types: [] as RoomTypeRow[], maps_url: '' };
```

- [ ] **Step 3: Update openEdit to include maps_url**

Find:
```tsx
setForm({ name: hotel.name, location: hotel.location, stars: hotel.stars, room_types: hotel.room_types ?? [] });
```

Replace with:
```tsx
setForm({ name: hotel.name, location: hotel.location, stars: hotel.stars, room_types: hotel.room_types ?? [], maps_url: hotel.maps_url || '' });
```

- [ ] **Step 4: Update handleSave payload**

Find:
```tsx
const payload = { name: form.name, location: form.location, stars: form.stars, room_types: form.room_types };
```

Replace with:
```tsx
const payload = { name: form.name, location: form.location, stars: form.stars, room_types: form.room_types, maps_url: form.maps_url || null };
```

- [ ] **Step 5: Add the maps_url form field**

In the `<form id="hotel-form">`, find the closing `</FormField>` of the "Location" field and add this block immediately after it (before the "Star Rating" FormField):

```tsx
<FormField label="Google Maps Link" hint="Paste the share link from Google Maps. Shown as a clickable link on the public page.">
    <input
        type="url"
        className={inputClass}
        placeholder="https://maps.app.goo.gl/..."
        value={form.maps_url}
        onChange={(e) => setForm({ ...form, maps_url: e.target.value })}
    />
</FormField>
```

- [ ] **Step 6: Manual smoke test**

```bash
npm run dev
```

1. Go to Admin → Hotels → Add Hotel
2. Fill in name, location, paste a Google Maps share URL in the new field
3. Save — confirm no error
4. Edit the same hotel — confirm the maps_url field is populated
5. Clear the field and save — confirm it saves as null (no error)

- [ ] **Step 7: Commit**

```bash
git add src/pages/admin/Hotels.tsx
git commit -m "feat: add optional Google Maps link field to hotel admin form"
```

---

## Task 5: Hotels Public Display — Clickable Map Link in TourDetail

**Files:**
- Modify: `types.ts`
- Modify: `components/TourDetail.tsx`

- [ ] **Step 1: Add maps_url to the hotels shape in types.ts**

Find in `types.ts`:
```ts
  hotels?: {
    name: string;
    location: string;
    stars: number;
  }[];
```

Replace with:
```ts
  hotels?: {
    name: string;
    location: string;
    stars: number;
    maps_url?: string | null;
  }[];
```

- [ ] **Step 2: Update the hotel location line in TourDetail.tsx**

In `components/TourDetail.tsx`, find the hotel location paragraph (around line 286–289):
```tsx
<p className="flex items-center gap-1.5 text-gray-500 text-xs">
  <MapPin className="w-3 h-3 text-primary" />
  {hotel.location}
</p>
```

Replace with:
```tsx
{hotel.maps_url ? (
  <a
    href={hotel.maps_url}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-1.5 text-gray-500 text-xs hover:text-primary transition-colors"
  >
    <MapPin className="w-3 h-3 text-primary" />
    {hotel.location}
  </a>
) : (
  <p className="flex items-center gap-1.5 text-gray-500 text-xs">
    <MapPin className="w-3 h-3 text-primary" />
    {hotel.location}
  </p>
)}
```

- [ ] **Step 3: Manual smoke test**

```bash
npm run dev
```

1. Open a package detail page that includes a hotel with `maps_url` set
2. Go to the "Maskapai & Hotel" tab
3. Hover over the hotel location — confirm it looks like a link (text turns primary color)
4. Click it — confirm it opens Google Maps in a new tab
5. Check a hotel without `maps_url` — confirm the location still renders as plain text with no visual change

- [ ] **Step 4: Commit**

```bash
git add types.ts components/TourDetail.tsx
git commit -m "feat: make hotel location a clickable Google Maps link when maps_url is set"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** Migration ✓, airline-logos bucket ✓, dual-tab upload/URL ✓, upload handler ✓, delete cleanup ✓, hotels maps_url column ✓, hotels form field ✓, types.ts update ✓, TourDetail conditional link ✓
- [x] **No placeholders:** All steps contain full code blocks
- [x] **Type consistency:** `maps_url: string | null` used consistently across Hotels interface, EMPTY_FORM, openEdit, handleSave, types.ts, and TourDetail
- [x] **Storage path:** `airline-logos/` prefix consistent across upload handler and delete cleanup
