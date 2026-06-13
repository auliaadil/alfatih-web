# Design: Airline Logo Upload & Hotel Google Maps Link

**Date:** 2026-06-13  
**Status:** Approved

## Summary

Two improvements to the admin panel:

1. **Airlines** — Replace the fragile external logo URL field with a dual-mode input: upload to Supabase Storage or paste a URL. Image data is stored reliably in-project.
2. **Hotels** — Add an optional Google Maps share URL field. When present, the hotel location line on the public tour detail page becomes a clickable link.

---

## 1. Database

### Migration file
`supabase/migrations/20260613_airline_logo_hotel_maps.sql`

**Airlines table** — no column change. `logo_url TEXT` continues to hold the resolved image URL (either a Supabase Storage public URL or an external link).

**Hotels table** — add one column:
```sql
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS maps_url TEXT DEFAULT NULL;
```

**Supabase Storage** — create a new public bucket `airline-logos`:
- Public read access (anon can fetch images)
- Authenticated write access (only logged-in admins can upload/delete)
- Mirrors the existing `images` bucket pattern

---

## 2. Airlines Admin Form

**File:** `src/pages/admin/Airlines.tsx`

Replace the single "Logo URL" `FormField` with a dual-tab logo input:

### Tab: Upload
- `<input type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml">`
- On file select:
  1. Generate a path: `airline-logos/{uuid}.{ext}` (use `crypto.randomUUID()` or the editing airline's id when available)
  2. Call `supabase.storage.from('airline-logos').upload(path, file, { upsert: true })`
  3. On success, call `getPublicUrl(path)` and set `form.logo_url` to the returned URL
  4. Show an inline spinner during upload; disable the Save button while uploading
- Error: show a toast `'Logo upload failed'` if storage returns an error

### Tab: URL
- Plain `<input type="url">` — pastes directly into `form.logo_url` as today
- Hint: "Paste a direct image URL (JPG, PNG, SVG)"

### Shared preview
Both tabs show the same live logo preview below the input (already exists in the current form — keep as-is).

### Cleanup on delete
In `handleDelete`, before calling `supabase.from('airlines').delete()`:
- Check if `airline.logo_url` starts with the project's Supabase Storage base URL (`import.meta.env.VITE_SUPABASE_URL + '/storage/v1/object/public/airline-logos/'`)
- If yes, extract the storage path and call `supabase.storage.from('airline-logos').remove([path])`
- Proceed with the DB delete regardless of whether the storage delete succeeds (best-effort cleanup)

### State additions
```ts
const [logoTab, setLogoTab] = useState<'upload' | 'url'>('upload');
const [uploading, setUploading] = useState(false);
```
Disable the form's Save button while `uploading` is true.

---

## 3. Hotels Admin Form

**File:** `src/pages/admin/Hotels.tsx`

### Interface update
```ts
interface Hotel { id: string; name: string; location: string; stars: number; room_types: RoomTypeRow[]; maps_url: string | null; }
```

### EMPTY_FORM update
```ts
const EMPTY_FORM = { name: '', location: '', stars: 3, room_types: [] as RoomTypeRow[], maps_url: '' };
```

### openEdit update
Include `maps_url: hotel.maps_url || ''` when populating the edit form.

### handleSave update
Include `maps_url: form.maps_url || null` in the payload sent to Supabase.

### New form field
Add after the "Location" field, before "Star Rating":

```
Label:       Google Maps Link  (optional)
Input type:  url
Placeholder: https://maps.app.goo.gl/...
Hint:        Paste the share link from Google Maps. Shown as a clickable link on the public page.
```

---

## 4. Hotels Public Display

**File:** `components/TourDetail.tsx`

### Type update
The `hotel` object passed into the map already comes from the `hotels` join — add `maps_url?: string | null` to its local type.

### Location line change
Current:
```tsx
<p className="flex items-center gap-1.5 text-gray-500 text-xs">
  <MapPin className="w-3 h-3 text-primary" />
  {hotel.location}
</p>
```

Updated — wrap in a conditional link when `maps_url` is present:
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

No visual change for hotels without a `maps_url`.

---

## 5. Out of Scope

- Image resizing / compression before upload (logo files are small; not needed)
- Replacing the airline logo in the public TourDetail with a Storage-aware version (it already reads `logo_url` — no change needed)
- Map embed or coordinate parsing
- Existing `logo_url` rows pointing to broken external URLs (left as-is; admins can re-upload individually)
