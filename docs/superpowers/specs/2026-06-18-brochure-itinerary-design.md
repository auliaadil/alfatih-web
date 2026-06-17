# Brochure & Itinerary Generation — Design Spec

**Date:** 2026-06-18  
**Status:** Approved

## Context

Admin users need to generate two marketing assets from a tour package without leaving the admin panel:

1. **Brochure** — a visual promotional image (.png/.webp) in the style of the reference Alhijaz brochures, featuring destination photos, pricing tiers, hotel names, and included features. Produced via the existing Poster Maker canvas so the admin can tweak layout before exporting.
2. **Itinerary PDF** — a multi-page structured document listing the day-by-day program, hotels, pricing, and included/not-included items. Produced server-side and downloaded in one click.

Both actions are triggered from a new Package Detail side panel in the Packages admin page.

## Architecture

Four new or modified pieces:

| Piece | Type | Change |
|---|---|---|
| `src/pages/admin/PackageDetailPanel.tsx` | New component | Right-side slide-over drawer |
| `src/pages/admin/Packages.tsx` | Modified | Wire up new panel, replace old "Participants" button |
| `src/pages/admin/PosterMaker.tsx` | Modified | Detect `?packageId&mode=brochure` params on mount |
| `supabase/functions/generate-itinerary-pdf/index.ts` | New edge function | PDF generation via pdfmake |
| `services/itineraryPdfService.ts` | New service | Frontend fetch wrapper for the edge function |

The existing `PackageDetailModal.tsx` (participants-only view) is superseded by the new panel and can be removed or kept as-is.

## 1. Package Detail Side Panel

**File:** `src/pages/admin/PackageDetailPanel.tsx`

A fixed right-side drawer (`translate-x` animated, `z-50`, backdrop overlay). Opens when the admin clicks a "Detail" button added to each package card's action row.

**Data fetching:** On open, fetch the full package record with joined airlines and hotels:

```ts
supabase
  .from('packages')
  .select('*, airlines(*), hotels(*)')
  .eq('id', pkg.id)
  .single()
```

The card already holds the raw package row, so only the join is needed.

**Panel layout (top → bottom):**

- **Header:** Package image (h-40, `object-cover`) + title + category `StatusBadge` + close button
- **Key info row:** departure date, duration, airline name (from joined `airlines[0].name`)
- **Pricing table:** one row per `room_options` entry — name + IDR-formatted price; amber highlight on cheapest tier
- **Hotels:** two-column grid — Makkah hotels left, Madinah hotels right; star rating shown as amber dots
- **Participants:** quota bar + registered count (same data as old `PackageDetailModal`, fetched from `participants` join)
- **Included / Not Included:** two-column numbered lists from `included[]` and `not_included[]`
- **Sticky action bar (bottom):**
  - `"Buat Brosur"` — `ImageIcon` icon, primary blue button → `navigate('/admin/poster-maker?packageId=<id>&mode=brochure')`
  - `"Download Itinerary PDF"` — `FileDown` icon, ghost/outline button → calls `itineraryPdfService`, shows spinner while loading

**Brand:** white background, `text-primary` (`#0084FF`) for section headings, `text-secondary` (`#F59E0B`) for price highlights, `text-dark` (`#0F172A`) for body text.

## 2. Brochure Flow — Poster Maker Integration

**File:** `src/pages/admin/PosterMaker.tsx`

**On mount**, read `useSearchParams()` for `packageId` and `mode`:

```ts
const [searchParams] = useSearchParams();
const brochurePackageId = searchParams.get('packageId');
const isBrochureMode = searchParams.get('mode') === 'brochure';
```

If both are present:

1. Fetch the package from Supabase and set it into the existing `pkg` state (same state used by AI Autofill).
2. Show a dismissible info banner below the toolbar:
   > *"Mode Brosur aktif — pilih template lalu klik AI Autofill untuk mengisi otomatis dari paket ini."*
3. Auto-open the template picker panel (`setShowTemplatePanel(true)` or equivalent) so the user lands directly on template selection.

**No-template empty state:** `STARTER_TEMPLATES` is currently empty and user-saved templates may not exist yet. When brochure mode opens and no templates are available (neither starter nor saved), the template picker must show a clear empty state instead of a blank panel:

> *"Belum ada template tersedia. Buat dan simpan template brosur di Poster Maker terlebih dahulu, lalu coba lagi."*

The user can still dismiss the banner and work on a blank canvas if they choose. Template creation is **out of scope** for this feature — templates will be built separately.

No changes to autofill logic, template rendering, or export. The existing `exportPng()` → download flow is the brochure output.

## 3. Itinerary PDF — Edge Function

**File:** `supabase/functions/generate-itinerary-pdf/index.ts`

- **Auth:** JWT-verified (Supabase admin token), same pattern as `ai-poster-autofill`.
- **Request body:**
  ```ts
  { package: TourPackage, siteSettings: { whatsapp: string, phone: string } }
  ```
- **Response:** `Content-Type: application/pdf`, binary stream.
- **Library:** `pdfmake` loaded via ESM (`https://esm.sh/pdfmake`). Runs in Deno without headless Chrome.

**PDF document definition:**

| Section | pdfmake construct |
|---|---|
| Cover | Full-width image (logo), large `text` for title, two columns: departure date left / duration right, airline name |
| Day-by-day | Iterate `itinerary[]` — each day gets a filled-rect header (primary blue `#0084FF`) with day number + date, then `ul` for activities, `text` for description |
| Hotels | Two-column `columns` block — Makkah left, Madinah right, stars rendered as `★` characters in amber |
| Pricing | `table` with three columns: Quad / Triple / Double; IDR formatting via `Intl.NumberFormat('id-ID')` |
| Included | Numbered `ol` from `included[]` |
| Not Included | Numbered `ol` from `not_included[]` |
| Closing | Centered Alfatih tagline text + WhatsApp number |

**Styles:** light (`#FFFFFF`) page background, `#0084FF` section header fills with white text, `#F59E0B` accent on pricing column headers, body font Roboto (pdfmake default).

**File:** `services/itineraryPdfService.ts`

```ts
export async function downloadItineraryPdf(pkg: TourPackage, siteSettings: SiteSettings) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-itinerary-pdf`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${session!.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ package: pkg, siteSettings }),
  });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Itinerary - ${pkg.title} - ${pkg.departure_date}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
```

The button in the panel sets a local `isPdfLoading` boolean state; the service call is awaited inside a try/finally to reset it.

## Verification

1. **Panel opens:** click "Detail" on any package card → panel slides in from right with package data loaded.
2. **Brochure flow:** click "Buat Brosur" → navigates to `/admin/poster-maker?packageId=<id>&mode=brochure` → banner appears → template picker auto-opens → select a template → AI Autofill populates fields from the package → export PNG downloads.
3. **Itinerary PDF:** click "Download Itinerary PDF" → spinner shows → PDF downloads with correct filename → PDF contains all sections (cover, day-by-day, hotels, pricing, included/not-included, closing).
4. **Auth guard:** calling `generate-itinerary-pdf` without a valid JWT returns 401.
5. **Empty itinerary:** package with no `itinerary[]` entries renders the PDF without the day-by-day section (skipped, not errored).
