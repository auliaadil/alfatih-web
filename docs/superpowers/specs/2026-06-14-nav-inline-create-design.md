# Nav Visibility Fix + Inline Entity Creation in PackageWizard

**Date:** 2026-06-14
**Status:** Approved

---

## Problem

1. **Categories and Airports are invisible in the sidebar.** Their pages and routes exist (`/admin/categories`, `/admin/airports`) but are missing from `NAV_GROUPS` in `AdminLayout.tsx`. All roles — including superadmin — cannot navigate to them from the sidebar.

2. **No inline creation in PackageWizard.** When filling out a package, if a user doesn't find the category, airline, hotel, or airport they need, they must abandon the wizard, navigate to the standalone management page, create the item, and return. There is no path to create items inline.

---

## Part 1 — Nav Fix

**File:** `src/pages/admin/AdminLayout.tsx`

Add two nav items to the existing "Resources" group, which already has `allowedRoles: ['admin', 'superadmin']`:

```
Resources
  Airlines        ← existing
  Hotels          ← existing
  Airports        ← ADD (icon: PlaneTakeoff)
  Categories      ← ADD (icon: Tag)
```

Import `PlaneTakeoff` and `Tag` from `lucide-react` (both already used in the Airports and Categories pages, so they exist in the project).

---

## Part 2 — Inline Entity Creation

### Pattern

Each entity type gets a small **"+ New [Entity]"** button placed near its selector. Clicking opens a `SlideOver` with the minimum required fields for that entity. On successful save:
- The in-memory list is refreshed from Supabase.
- The new item is **auto-selected** in the draft.
- The SlideOver closes.

The `SlideOver` component from `src/components/admin/ui.tsx` is reused as-is.

### Step 1 — Category (file: `Step1BasicInfo.tsx`)

**Trigger:** Small "+ New" text link/button to the right of the "Category" `<FormField>` label.

**Form fields:**
- Name (required) — text input
- Slug — auto-generated from name, editable

**After save:**
- Call `supabase.from('categories').select('name').order('name')` to refresh the list.
- Call `updateDraft({ category: newName })` to auto-select.

**Props change:** `Step1BasicInfo` currently receives `categories: string[]`. Add two new props:
- `onCategoryCreated: (name: string) => void` — called after save so `PackageWizard` can refresh its `categories` state.

Actually, simpler: pass a `refreshCategories` callback from `PackageWizard` into `Step1BasicInfo`, and let `Step1BasicInfo` own the SlideOver + save logic, calling `refreshCategories()` after success.

Even simpler: `Step1BasicInfo` already imports `supabase` directly. It can own the full inline-create SlideOver, fetch its own category refresh, and call `updateDraft({ category: newName })`. No prop changes needed beyond what's already there. `PackageWizard` will also need to be notified so its `categories` state stays in sync — pass a `onCategoryCreated` callback prop.

**Final prop change to `Step1BasicInfo`:**
```ts
interface Props {
  draft: WizardDraft;
  updateDraft: (p: Partial<WizardDraft>) => void;
  onNext: () => void;
  categories: string[];
  onCategoryCreated: (name: string) => void; // NEW
}
```

`PackageWizard` passes `onCategoryCreated={(name) => setCategories(prev => [...prev, name].sort())}`.

### Step 2 — Airline (file: `Step2FlightHotels.tsx`)

**Trigger:** "+ New Airline" button below the "Airlines" section header, above the search input.

**Form fields:**
- Name (required)
- IATA code (optional, 2-3 chars)
- Logo URL (optional)

**After save:**
- Re-fetch airlines from Supabase.
- Auto-check the new airline: call `toggleAirline(newAirline.id)`.

`Step2FlightHotels` already owns its own `airlines` state and fetches from Supabase — the refresh and auto-select are fully contained within the component. No prop changes.

### Step 2 — Hotel (file: `Step2FlightHotels.tsx`)

**Trigger:** "+ New Hotel" button below the "Hotels" section header, above the search input.

**Form fields:**
- Name (required)
- Location (required)
- Stars (1–5, default 4)

**After save:**
- Re-fetch hotels from Supabase.
- Auto-check the new hotel: call `toggleHotel(newHotel.id)`.

Fully contained within `Step2FlightHotels`. No prop changes.

### Step 2 — Airport (file: `Step2FlightHotels.tsx`)

**Trigger:** Single "+ New Airport" button above the flight routes section (not per-leg), since airports are shared across all legs.

**Form fields:**
- IATA code (required, uppercase, 3 chars)
- Name (required)
- City (optional)
- Country (optional)

**After save:**
- Re-fetch airports from Supabase.
- Do **not** auto-select into a specific leg — the user doesn't know which leg/direction is intended. The new airport appears in all leg dropdowns immediately after the list refreshes.

This is intentional: unlike airlines/hotels (where "I just created it so I want it"), airports are endpoints on specific legs — auto-selecting the wrong leg/direction would require undoing.

---

## Implementation Scope

| File | Change |
|------|--------|
| `src/pages/admin/AdminLayout.tsx` | Add Airports + Categories to Resources nav group |
| `src/components/admin/PackageWizard/Step1BasicInfo.tsx` | Add inline category create SlideOver; add `onCategoryCreated` prop |
| `src/pages/admin/PackageWizard.tsx` | Pass `onCategoryCreated` to Step1BasicInfo |
| `src/components/admin/PackageWizard/Step2FlightHotels.tsx` | Add inline create SlideOvers for airline, hotel, airport |

No new files needed. No schema changes needed. No new UI primitives needed.

---

## Out of Scope

- Inline editing or deletion of existing entities from the wizard.
- Inline creation from `PackageForm.tsx` (the legacy form, not the wizard).
- Role-gating the inline create buttons (all wizard users can already manage packages; if they can create packages they should be able to create the dependencies).
