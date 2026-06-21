# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build
npm run preview  # Preview production build
```

There are no test or lint scripts configured.

## Environment Variables

Create `.env.local` with:
```
VITE_SUPABASE_URL=
VITE_SUPABASE_API_KEY=
VITE_RECAPTCHA_SITE_KEY=
VITE_UNSPLASH_ACCESS_KEY=   # Unsplash Client-ID for image search in Poster Maker (50 req/hr free)
VITE_PIXABAY_API_KEY=       # Pixabay API key for image search in Poster Maker (100 req/min free)
```

AI API keys are managed as Supabase secrets (not in `.env.local`):
- `GEMINI_API_KEY` — Gemini API key
- `GEMINI_MODEL` — model name (e.g. `gemini-2.5-flash-preview-05-20`), swappable without redeployment
- `RECAPTCHA_SECRET_KEY` — Google reCAPTCHA secret for server-side verification
- `UNSPLASH_ACCESS_KEY` — Unsplash API key used by the `image-search` edge function (not the `VITE_` frontend key)
- `PIXABAY_API_KEY` — Pixabay API key used by the `image-search` edge function (not the `VITE_` frontend key)

Set via: `supabase secrets set GEMINI_API_KEY=<value> GEMINI_MODEL=<value> RECAPTCHA_SECRET_KEY=<value> UNSPLASH_ACCESS_KEY=<value> PIXABAY_API_KEY=<value>`

## Architecture

### Entry Points

- `index.html` — Loads Tailwind CSS via CDN script tag (intentional, not PostCSS). Custom theme colors (`primary`, `secondary`, `accent`, `dark`) are defined here in the Tailwind config inline script.
- `App.tsx` — Root router. Two areas: public (`/`, `/package/:slug`) and admin (`/admin/*` protected by `AuthGuard`).
- `index.tsx` — React DOM entry.

Note: The `@` alias resolves to the project root.

### Two Parallel Component Trees

The project has a **split structure**: root-level `components/` holds public-facing UI, while `src/` holds everything else including the admin area.

- `components/` (root) — Public UI: `Hero`, `Navbar`, `Footer`, `TourCard`, `TourDetail`, `AIPlanner`, `CompanyProfile`
- `src/pages/` — Page components: `Home.tsx`, `PackageDetailPage.tsx`, and `admin/` (Dashboard, Packages, Orders, PrivateTrips, Airlines, Hotels, PosterMaker, TextCampaign, SiteSettings, Login)
- `src/components/admin/PosterMaker/` — Fabric.js canvas editor broken into: `FabricCanvas`, `LayerPanel`, `PropertiesPanel`, `TemplatePanel`, `AssetPanel`, `EditorToolbar`, `TemplateSelector`, `SlideStrip`, `CanvasContextMenu`, `CanvasZoom`, fabric helpers (`fabricBulletList`, `fabricCornerRadius`, `fabricShadow`, `fabricSnap`), `templateThumbnail`, and a `blocks/` subdirectory for poster elements (`PosterHeader`, `PosterFooter`, `PosterDetails`, `PosterImageBlock`, `PosterPromo`)
- `src/components/AuthGuard.tsx` — Wraps admin routes; checks Supabase auth session

### Data Layer

- `src/lib/supabase.ts` — Single Supabase client (uses `VITE_SUPABASE_API_KEY`, not `VITE_SUPABASE_ANON_KEY`)
- `services/itineraryService.ts` — Thin fetch wrapper that calls the `ai-itinerary` Supabase Edge Function for itinerary generation
- `services/posterAutofillService.ts` — Thin fetch wrapper that calls the `ai-poster-autofill` Supabase Edge Function for AI Magic Auto-Fill in the Poster Maker
- `services/textCampaignService.ts` — Thin fetch wrapper that calls the `ai-text-campaign` Edge Function to generate multi-slide social-media copy
- `services/imageSearchService.ts` — Calls the `image-search` Edge Function (Unsplash + Pixabay) for in-editor image search
- `services/posterTemplates.ts` — Shared template/slide generation helpers used by PosterMaker and TextCampaign
- `services/itineraryPdfService.ts` — Calls the `generate-itinerary-pdf` Edge Function
- `services/packageContentService.ts` — Calls the `ai-package-content` Edge Function for AI-generated package descriptions
- `constants.ts` (root) — Static testimonials and interest lists
- `types.ts` (root) — Shared TypeScript types: `TourPackage`, `TourCategory`, `AIPlannerInput`, `Testimonial`
- `src/types/poster.ts` — Poster-specific types: `AspectRatio`, `LayoutType`, `TemplateConfig`

### Edge Functions

Supabase Edge Functions live in `supabase/functions/`. They run on Deno and call the Gemini REST API directly (no SDK). Secrets (`GEMINI_API_KEY`, `GEMINI_MODEL`, `RECAPTCHA_SECRET_KEY`) are injected at runtime — never committed.

- `supabase/functions/ai-itinerary/` — Public endpoint. Verifies reCAPTCHA v3 token (score ≥ 0.5), builds the Halal itinerary prompt, calls Gemini, returns `{ itinerary: string }`.
- `supabase/functions/ai-poster-autofill/` — Admin-only endpoint. Verifies Supabase JWT, builds poster copywriting prompt per template type, calls Gemini, returns updated `textNodes` array.
- `supabase/functions/ai-text-campaign/` — Admin-only. Generates multi-slide social-media copy (e.g. tip series) and returns an array of slide text objects for the Content poster templates.
- `supabase/functions/ai-package-content/` — Admin-only. Generates marketing copy for tour package descriptions.
- `supabase/functions/generate-itinerary-pdf/` — Admin-only. Renders and returns an itinerary PDF.
- `supabase/functions/image-search/` — Admin-only. Proxies Unsplash and Pixabay search for the PosterMaker asset panel.
- `supabase/functions/invite-user/` — Admin-only. Sends a Supabase auth invite email.
- `supabase/functions/remove-user/` — Admin-only. Deletes a Supabase auth user.

Deploy commands:
```bash
supabase functions deploy ai-itinerary
supabase functions deploy ai-poster-autofill
supabase functions deploy ai-text-campaign
supabase functions deploy ai-package-content
supabase functions deploy generate-itinerary-pdf
supabase functions deploy image-search
supabase functions deploy invite-user
supabase functions deploy remove-user
```

### Contexts

- `SiteSettingsContext` — Fetches `site_settings` table from Supabase on mount; provides contact info (WhatsApp, phone, email, social links) site-wide
- `LanguageContext` — Provides `t()` translation function for i18n

### Supabase Schema (key tables)

`packages`, `airlines`, `hotels`, `orders`, `private_trips`, `site_settings`. Migrations live in `supabase/migrations/`.

Home page manually joins packages with airlines/hotels by filtering on `airline_ids` and `hotel_ids` arrays stored on packages.

### Poster Maker

Built on Fabric.js v7. The canvas editor (`FabricCanvas.tsx`) manages a `fabric.Canvas` instance. `PosterCanvas.tsx` orchestrates the full editor layout. Undo/redo uses a custom history stack. Drafts are saved to Supabase with auto-generated thumbnails. Templates are defined as `TemplateConfig` objects with layout and styling options.

**Brand color palette used in templates:**
- Primary (Blue): `#0084ff` — used for footer bars in Content templates, links, CTA accents
- Secondary (Amber): `#F59E0B` — used for tip numbers, accent bars, callouts
- Neutral dark: `#0F172A` — heading text on light backgrounds
- White background: `#F8FAFC` — Content template backgrounds (redesigned from navy dark)

**Content templates** (`Tips Umrah` — post and story): white background, top amber accent bar, left amber vertical strip, blue footer bar (`#0084FF`) with white brand/contact text. Generated via the `ai-text-campaign` edge function which returns a `generatedSlides` array — each slide maps to one canvas JSON snapshot in the PosterMaker.

**Hijri date**: Package forms and the `ai-poster-autofill` prompt include automatic Hijri date calculation alongside the Gregorian departure date.

## Key Conventions

- Tailwind stays CDN-based — do not migrate to PostCSS unless explicitly instructed.
- Gemini model used: `gemini-2.5-flash-preview-05-20` (configured via `GEMINI_MODEL` Supabase secret; swappable without redeployment).
- All content and AI-generated itineraries must be in Bahasa Indonesia and maintain Halal/Islamic tone.
- TypeScript strict mode — avoid `any`; update `types.ts` when adding new data shapes.
- New admin pages go in `src/pages/admin/`, new admin components in `src/components/admin/`.
