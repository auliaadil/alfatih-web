# Poster Template Types & Filter — Design Spec

**Date:** 2026-06-20  
**Scope:** `src/components/admin/PosterMaker/TemplatePanel.tsx`

---

## Problem

All 10 existing canvas templates in `TemplatePanel.tsx` are "Conversion Brochure" posters (sales-focused: price, features, CTA). Three meaningful template categories have no representation:

- **Tour Promotion** — destination/experience showcase (no price, no CTA)
- **Documentation** — trip recap with jamaah testimonial
- **Content** — engagement tips, Islamic reminders, motivational quotes

The template panel also only filters by size (Post / Story), making it harder to find templates by purpose as the library grows.

---

## Goals

1. Add `type` field to `PosterTemplate` to categorise each template.
2. Add 6 new Fabric.js JSON templates — one Post + one Story per missing type.
3. Add a type pill-filter row at the top of `TemplatePanel` (All | Conversion | Tour Promotion | Documentation | Content).

---

## Data Model

### `PosterTemplate` — add `type` field

```ts
export type TemplateType = 'Conversion' | 'Tour Promotion' | 'Documentation' | 'Content';

export interface PosterTemplate {
    id: string;
    name: string;
    description: string;
    type: TemplateType;          // ← new
    previewColors: [string, string, string];
    aspectRatio: 'post' | 'story';
    json: object;
}
```

All 10 existing templates get `type: 'Conversion'`.

---

## New Templates

### Brand tokens (shared across all new templates)

| Role | Value |
|---|---|
| Primary blue | `#0084FF` |
| Amber/gold | `#F59E0B` |
| Warm gold | `#D4A373` |
| Dark navy | `#0F172A` |
| Slate | `#64748B` |
| Light slate | `#94A3B8` |
| Off-white bg | `#F8FAFC` |
| Card bg | `#F1F5F9` |
| Font | Plus Jakarta Sans |

---

### 1. Tour Promotion — Post (`tour-promo-post`)

**Purpose:** Destination/experience showcase. No price, no CTA, no feature list.  
**Canvas:** 1080 × 1350 px  
**Layout:**
- Full-bleed Kaabah/Madinah image (top 70% of canvas)
- Heavy dark gradient overlay on image bottom (so text is readable)
- Top amber accent bar (14 px)
- Header section (above image): amber category label ("UMRAH PREMIUM"), dark navy title ("Madinah Al-Munawwarah"), gold `#D4A373` divider line
- On-image bottom overlay text: white tagline ("Kota Cahaya yang Menyejukkan Hati"), white italic sub-tagline
- Blue footer bar with brand name + contact

---

### 2. Tour Promotion — Story (`tour-promo-story`)

**Purpose:** Same as post variant, 9:16 format.  
**Canvas:** 1080 × 1920 px  
**Layout:** Same structure scaled for story ratio — image fills ~55% of height, text zones above and over-image.

---

### 3. Documentation — Post (`documentation-post`)

**Purpose:** Trip recap with jamaah testimonial.  
**Canvas:** 1080 × 1350 px  
**Layout:**
- Left panel (50% width): tall trip photo, edge-to-edge
- Amber vertical separator (4 px)
- Right panel (50% width): white background
  - Large gold quotation mark `❝` (decorative, ~80 px)
  - Testimonial quote text in dark navy
  - Thin amber divider line
  - Jamaah name in amber bold
  - Trip date/package in slate gray
- Blue footer bar with brand

---

### 4. Documentation — Story (`documentation-story`)

**Purpose:** Same as post variant, 9:16 format.  
**Canvas:** 1080 × 1920 px  
**Layout:**
- Top 55%: full-width trip photo
- Semi-transparent white overlay panel (opacity 0.92) anchored to bottom of photo
- Large decorative `❝` in amber
- Quote text in dark navy
- Jamaah name + date below
- Blue footer bar

---

### 5. Content — Post (`content-post`)

**Purpose:** Engagement tip / Islamic reminder. No image, no price — pure typography.  
**Canvas:** 1080 × 1350 px  
**Layout:**
- Full dark navy `#0F172A` background (intentional visual contrast in feed)
- Thin amber top accent bar (14 px)
- Large amber tip number ("01") in top-left, ~120 px font
- Thin gold `#D4A373` separator line under the number
- Tip title in white, ~52 px bold
- Body text in light slate `#94A3B8`, ~20 px
- Thin amber bottom accent bar (14 px) instead of full footer
- Brand name + contact in small white text above bottom bar

---

### 6. Content — Story (`content-story`)

**Purpose:** Same as post variant, 9:16 format.  
**Canvas:** 1080 × 1920 px  
**Layout:** Same dark navy structure, scaled for story — more vertical breathing room, tip number larger (~150 px).

---

## Filter UI

### Location

Between the "Templates" heading and the first template group in `TemplatePanel`.

### Interaction

```
[ All ] [ Conversion ] [ Tour Promotion ] [ Documentation ] [ Content ]
```

- State: `const [typeFilter, setTypeFilter] = useState<TemplateType | 'All'>('All')`
- Filtered list: `liveTemplates.filter(t => typeFilter === 'All' || t.type === typeFilter)`
- Post/Story section split happens **after** filtering — the section headers remain, they just show fewer cards (or "Belum ada template." if zero)

### Pill styles

| State | Background | Text |
|---|---|---|
| Active | `#0084FF` | `#FFFFFF` |
| Inactive | `#F1F5F9` | `#64748B` |
| Inactive hover | `#E2E8F0` | `#64748B` |

Pill shape: `rounded-full px-3 py-1 text-[10px] font-semibold`. Row: `flex flex-wrap gap-1.5 mb-4`.

---

## Files Changed

| File | Change |
|---|---|
| `TemplatePanel.tsx` | Add `TemplateType` type, `type` field to `PosterTemplate`, add `type` to all 10 existing templates, add 6 new template objects, add filter state + pill row UI |

No other files change — the `TemplateSelector.tsx` (`TemplateConfig` system) is unaffected.

---

## Out of Scope

- AI Auto-Fill support for the new templates (Documentation and Content templates don't have the same field structure as Conversion; this can be added later)
- Changes to `TemplateSelector.tsx` or `poster.ts`
