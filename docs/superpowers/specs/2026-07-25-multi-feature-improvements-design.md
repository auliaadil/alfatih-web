# Design: Multi-Feature Improvements
**Date:** 2026-07-25

---

## 1. Package — Publish Toggle

### Goal
Admin can mark a package as published or unpublished. Only published packages appear on the public site.

### Database
```sql
ALTER TABLE packages ADD COLUMN is_published boolean NOT NULL DEFAULT true;
```
Default `true` keeps all existing packages visible immediately.

### Admin (Packages page)
- Add a "Status" column to the packages table with a toggle switch (green = published, gray = unpublished).
- Clicking the toggle calls `supabase.from('packages').update({ is_published: !current }).eq('id', id)` inline — no wizard required.
- The `WizardDraft` type gets an `is_published: boolean` field (defaults to `true`) so it can also be set during package creation in Step 1.

### Public
- `Home.tsx` and `PackageDetailPage.tsx` append `.eq('is_published', true)` to all package selects.
- `TourPackage` type in `types.ts` gets `is_published?: boolean`.

---

## 2. Package Wizard — Inline Airline/Hotel Form Parity

### Goal
When adding an airline or hotel from within the Package Wizard, the form is identical to the standalone Airlines/Hotels admin pages.

### Approach
Extract the form body from each page into a shared component:

- `src/components/admin/AirlineForm.tsx` — contains all fields: name, IATA code, logo (upload/URL tab), country. Accepts `onSave(airline)` callback.
- `src/components/admin/HotelForm.tsx` — contains all fields: name, location, stars, country, maps URL, room types editor. Accepts `onSave(hotel)` callback.

**Airlines.tsx** and **Hotels.tsx** render these components inside their existing SlideOver — behaviour unchanged.

**Step2FlightHotels.tsx** renders the same components inside its existing quick-add SlideOver. After `onSave` fires, the new record is auto-toggled into `draft.airline_ids` / `draft.hotel_ids`.

---

## 3. Text Campaign — Instagram Caption Prompt

### Goal
Instagram captions must be short (max 2 paragraphs) and emoji-rich.

### Change
In `supabase/functions/ai-text-campaign/index.ts`, update both Instagram prompt blocks (the `channel === 'instagram'` branch for `paket-wisata` type and the `type === 'instagram'` branch) to include:
```
- Maksimal 2 paragraf, tidak lebih.
- Wajib gunakan emoji yang relevan di setiap baris penting (hook, fitur utama, CTA).
- Hindari kalimat formal panjang — tulis singkat, padat, menarik perhatian.
- Akhiri dengan 1 baris hashtag populer (maks 5 hashtag).
```

---

## 4. Orders — View Action + Multi-Attachment Receipts

### Goal
- Admin can view an order in a read-only slide-over without opening the edit form.
- Multiple receipt files (images or PDFs) can be attached to an order.

### Database
```sql
CREATE TABLE order_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);
```
The existing `payment_proof_url` column is kept for backwards compatibility but is no longer used for new uploads.

Storage bucket: `order-attachments` (private, admin-only upload policy).

### Components
- **`src/components/admin/OrderView.tsx`** — read-only SlideOver showing: customer info, package, branch, participants, payment status, amount paid, notes, and an attachments gallery (images show inline thumbnail; PDFs show a file icon + filename + "Buka" link).
- **`src/components/admin/OrderAttachmentUploader.tsx`** — multi-file uploader (reuses the `BookingAttachmentList` pattern): upload button, list of uploaded files with delete. Used inside `OrderForm`.

### Orders.tsx
- Add a "View" button (blue ghost: `text-blue-600 hover:bg-blue-50`) before "Edit" in the actions column.
- Clicking "View" opens `OrderView` for that order.

### OrderForm.tsx
- Replace the single `payment_proof_url` field with `OrderAttachmentUploader`.
- On save, attachments are already persisted to `order_attachments` during upload — no change to the orders INSERT/UPDATE payload needed.

---

## 5. Site Settings — Logo Upload + Phone Number Consistency

### Logo Upload
Replace the two URL text inputs for `siskopatuh_logo_url` and `pasti_umrah_logo_url` with a two-tab picker (Upload / URL), identical to the airline logo picker pattern in `Airlines.tsx`.

Storage bucket: `site-assets` (new, public read).

The upload tab accepts image files, uploads to `site-assets/logos/<filename>`, and saves the public URL. The URL tab keeps the existing text input as fallback.

### Phone Number Consistency
- Grep all hardcoded phone numbers in `components/` and `src/` (e.g. `62815`, `+62`).
- Replace each with a read from `SiteSettingsContext` (`settings.whatsapp` for WhatsApp links, `settings.phone` for display).
- No new DB changes needed — `site_settings` already has both fields.

---

## 6. Categories — Terms & Conditions

### Goal
Each category can have a customizable T&C block that is appended to the itinerary PDF.

### Database
```sql
ALTER TABLE categories ADD COLUMN terms_conditions text;
```

### Types
`Category` in `types.ts` gets `terms_conditions?: string`.

### Admin (Categories.tsx)
Add a `<textarea>` field for "Syarat & Ketentuan" in the existing category SlideOver form, after the slug field. Pre-populated with the stored value when editing.

### PDF Integration
In `supabase/functions/generate-itinerary-pdf/index.ts`:
- `packages.category` stores the category name as free text (no FK). Fetch `terms_conditions` by querying `categories` where `name = package.category`.
- When `terms_conditions` is non-empty, append a "Syarat & Ketentuan" section at the bottom of the PDF (after itinerary days), styled consistently with the rest of the document.
- Number each T&C line if the text contains numbered items.

---

## 7. Public Page — Remove "Unduh Brosur" + Show Generated PDF

### Unduh Brosur
Remove the button block at `TourDetail.tsx:489–495` that renders when `tour.brochure_url` is set.

### Itinerary PDF Column
```sql
ALTER TABLE packages ADD COLUMN itinerary_pdf_url text;
```

### PDF Generation Flow (PackageDetailPanel.tsx)
When admin clicks "Itinerary PDF":

**Case A — no `itinerary_pdf_url` yet:**
1. Show photo picker (existing `PdfPhotoPickerModal`).
2. Generate PDF via edge function.
3. Save the returned URL to `packages.itinerary_pdf_url`.
4. Open the PDF in a new tab.

**Case B — `itinerary_pdf_url` already set:**
Show an inline popover/dialog with two buttons:
- **Lihat PDF** — opens saved URL in a new tab. No generation.
- **Regenerate** — runs the full flow (photo picker → generate → overwrite `itinerary_pdf_url` → open).

### Public TourDetail.tsx
When `tour.itinerary_pdf_url` is set, show a **"Lihat Itinerary"** button (not download — `target="_blank"` link) in the same area where "Unduh Brosur" used to be. Hidden when `itinerary_pdf_url` is null.

`TourPackage` type gets `itinerary_pdf_url?: string`.

---

## Summary of DB Migrations

| Migration | Change |
|---|---|
| `packages` | ADD `is_published boolean DEFAULT true` |
| `packages` | ADD `itinerary_pdf_url text` |
| `categories` | ADD `terms_conditions text` |
| `order_attachments` | CREATE TABLE |
| Storage | CREATE BUCKET `site-assets` (public) |
| Storage | CREATE BUCKET `order-attachments` (private) |

## Summary of New/Changed Files

| File | Change |
|---|---|
| `types.ts` | Add fields to `TourPackage`, `Category` |
| `src/pages/admin/Packages.tsx` | Publish toggle column |
| `src/components/admin/PackageWizard/Step1BasicInfo.tsx` | Add `is_published` toggle |
| `src/components/admin/PackageWizard/Step2FlightHotels.tsx` | Use shared `AirlineForm`, `HotelForm` |
| `src/pages/admin/Airlines.tsx` | Use shared `AirlineForm` |
| `src/pages/admin/Hotels.tsx` | Use shared `HotelForm` |
| `src/components/admin/AirlineForm.tsx` | NEW — extracted airline form body |
| `src/components/admin/HotelForm.tsx` | NEW — extracted hotel form body |
| `supabase/functions/ai-text-campaign/index.ts` | Update Instagram prompt |
| `src/pages/admin/Orders.tsx` | Add View button, wire OrderView |
| `src/components/admin/OrderView.tsx` | NEW — read-only order slide-over |
| `src/components/admin/OrderAttachmentUploader.tsx` | NEW — multi-file receipt uploader |
| `src/components/admin/OrderForm/OrderForm.tsx` | Replace single proof URL with uploader |
| `src/pages/admin/SiteSettings.tsx` | Logo upload tabs, remove hardcoded phones |
| `src/pages/admin/Categories.tsx` | Add TnC textarea to form |
| `supabase/functions/generate-itinerary-pdf/index.ts` | Fetch + render T&C, save URL |
| `src/pages/admin/PackageDetailPanel.tsx` | Lihat/Regenerate PDF flow |
| `components/TourDetail.tsx` | Remove brosur button, add Lihat Itinerary |
