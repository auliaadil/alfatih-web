# Poster Maker — 4 New Conversion Templates

**Date:** 2026-06-19  
**Scope:** 8 new `PosterTemplate` entries (4 designs × 2 aspect ratios) in `TemplatePanel.tsx`

---

## Context

The Poster Maker currently ships 2 starter templates, both of type `conversion`:
- `brochure-post-conversion` — Post 1080×1350
- `brochure-story-conversion` — Story 1080×1920

These 8 new templates extend the conversion category with different visual compositions and content emphases. All share the same brand palette and clean-light design language.

---

## Brand Palette

| Token | Value | Usage |
|---|---|---|
| Blue | `#0084FF` | CTA, footer, accents |
| Gold/Amber | `#F59E0B` | Category label, price highlight, divider |
| Tan | `#D4A373` | Decorative divider line |
| Off-white | `#F8FAFC` | Background |
| Surface | `#F1F5F9` | Card/chip backgrounds |
| Dark | `#0F172A` | Primary text |
| Slate | `#64748B` | Secondary text |
| White | `#FFFFFF` | Text on dark backgrounds |

Font: `Plus Jakarta Sans, sans-serif` throughout.

---

## Shared Conventions (all 8 templates)

- **Top accent bar:** 15px gold (`#F59E0B`) strip at y=0, full width — visual anchor same as existing.
- **Footer bar:** 140px blue (`#0084FF`) bar at canvas bottom — same structure as existing. Contains brand name (left), contact line (right), license line (centered).
- **Footer injection:** All contact/license textboxes use the same pipe-separated pattern so `injectFooterData()` replaces them automatically from `SiteSettings`.
- **CTA button:** Rounded rect + text ("DAFTAR SEKARANG"), blue, positioned above footer.
- **Image source:** Kaaba/Makkah Unsplash placeholder (`photo-1564507592333-c60657eea523`) with `crossOrigin: 'anonymous'`.
- **AI Auto-Fill:** `getTemplateType()` in `PosterMaker.tsx` maps IDs containing `'conversion'` → `'conversion'`. All 8 IDs include `conversion` so they inherit AI Auto-Fill.

---

## Template Designs

### Design 1 — Diskon/Promo (`promo-conversion`)

**IDs:** `promo-post-conversion`, `promo-story-conversion`  
**Content emphasis:** Price discount is the hero — original price struck through, discounted price large, urgency strip.

**Layout (Post 1080×1350):**
```
[Gold top bar 15px]
[Category label: "PROMO TERBATAS"]
[Package title — large]
[Description — 2 lines]
[Image — 960×380]
[Price row: "Harga Normal" struck + "Harga Promo" large gold + "HEMAT X%"badge blue pill]
[Room pricing line]
[Feature list — 4 items]
[CTA button]
[Blue footer bar]
```

**New text nodes vs existing:**
- `txt-price-original` — "Rp 36.000.000" with `linethrough: true`, fill `#94A3B8`
- `txt-price-discounted` — "Rp 29.500.000", fontSize 48, fill `#F59E0B`, fontWeight `800`
- `txt-hemat-badge` — "HEMAT 18%", on a blue rounded rect pill, fill `#FFFFFF`
- `txt-urgency` — "⚡ Sisa 8 Kursi Tersisa!", fill `#EF4444`, fontWeight `700`

---

### Design 2 — Hotel & Airline Highlight (`hotel-airline-conversion`)

**IDs:** `hotel-airline-post-conversion`, `hotel-airline-story-conversion`  
**Content emphasis:** Two images side-by-side (hotel | plane/airline) with quality labels beneath each. For packages where accommodation + flight quality is the selling point.

**Layout (Post 1080×1350):**
```
[Gold top bar 15px]
[Category label + Title + Description]
[Left image 460×340 (hotel) | Right image 460×340 (airline/plane)]
[Label row: "Hotel ★★★★★ Makkah" | "Penerbangan Langsung Jeddah"]
[3-column info cards: date | duration | price]
[Feature list — 3 items (condensed)]
[CTA button]
[Blue footer bar]
```

**Structural difference from existing:**
- Two `Image` objects side-by-side (460px wide each, 60px gap) instead of one wide image.
- Two label textboxes beneath each image with star rating and airline label.
- Feature list condensed to 3 items (hotel, airline, muthawwif) — avoids crowding.

---

### Design 3 — Feature Grid (`feature-grid-conversion`)

**IDs:** `feature-grid-post-conversion`, `feature-grid-story-conversion`  
**Content emphasis:** Package inclusions as a 2×2 card grid. Price is one of the 4 grid cells rather than a standalone element.

**Layout (Post 1080×1350):**
```
[Gold top bar 15px]
[Category label + Title + Description]
[Image — 960×300 (shorter)]
[2×2 grid of feature cards (each 460×160, radius 16):
  [🕌 Hotel / Anjum Makkah *5]  [✈ Penerbangan / Saudia Direct]
  [📅 Durasi / 12 Hari]         [💰 Harga Mulai / Rp 32.5 Jt (gold)]
]
[Room pricing line]
[CTA button]
[Blue footer bar]
```

**Grid cards:** Each card has an emoji label (Textbox, fontSize 28) + field name (fontSize 14, slate) + value (fontSize 22, dark/gold for price cell).

---

### Design 4 — Departure Focus (`departure-focus-conversion`)

**IDs:** `departure-focus-post-conversion`, `departure-focus-story-conversion`  
**Content emphasis:** Departure date is the hero stat. Best for packages where the departure window (e.g. Syawal season) is the primary hook.

**Layout (Post 1080×1350):**
```
[Gold top bar 15px]
[Category label + Title]
[Full-width image — 960×450 (taller)]
[Departure date banner — very large: "12 OKT 2026" + flanking labels "KEBERANGKATAN" / "1447H"]
[2-column row: Price | Duration]
[Condensed feature list — 3 items]
[CTA button]
[Blue footer bar]
```

**Date banner:** "12 OKT 2026" at fontSize 72, fontWeight `800`, fill `#0F172A`, centered. Flanking text "KEBERANGKATAN" (left, fontSize 14, gold, charSpacing 150) and "1447H" (right, same style).

---

## File Change

**Single file:** `src/components/admin/PosterMaker/TemplatePanel.tsx`

Add 8 objects to `BASE_TEMPLATES` array — 4 post entries followed by their 4 story counterparts. No new files, no type changes, no service changes needed (all 8 IDs contain `'conversion'` so `getTemplateType()` resolves correctly without modification).

**Post canvas:** `width: 1080, height: 1350`  
**Story canvas:** `width: 1080, height: 1920` — all y-coordinates scaled by factor ~1.42, image heights proportionally increased.

---

## Out of Scope

- No new TemplateType values.
- No changes to `posterAutofillService.ts` or the edge function.
- No new files.
- No changes to `PosterMaker.tsx` (getTemplateType already handles all `conversion` IDs).
