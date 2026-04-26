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
VITE_GEMINI_API_KEY=
GEMINI_API_KEY=
VITE_RECAPTCHA_SITE_KEY=
VITE_UNSPLASH_ACCESS_KEY=   # Unsplash Client-ID for image search in Poster Maker (50 req/hr free)
VITE_PIXABAY_API_KEY=       # Pixabay API key for image search in Poster Maker (100 req/min free)
```

Note: Gemini key is exposed to client-side as `process.env.API_KEY` via Vite's `define` plugin in `vite.config.ts`. The `@` alias resolves to the project root.

## Architecture

### Entry Points

- `index.html` — Loads Tailwind CSS via CDN script tag (intentional, not PostCSS). Custom theme colors (`primary`, `secondary`, `accent`, `dark`) are defined here in the Tailwind config inline script.
- `App.tsx` — Root router. Two areas: public (`/`, `/package/:slug`) and admin (`/admin/*` protected by `AuthGuard`).
- `index.tsx` — React DOM entry.

### Two Parallel Component Trees

The project has a **split structure**: root-level `components/` holds public-facing UI, while `src/` holds everything else including the admin area.

- `components/` (root) — Public UI: `Hero`, `Navbar`, `Footer`, `TourCard`, `TourDetail`, `AIPlanner`, `CompanyProfile`
- `src/pages/` — Page components: `Home.tsx`, `PackageDetailPage.tsx`, and `admin/` (Dashboard, Packages, Orders, PrivateTrips, Airlines, Hotels, PosterMaker, SiteSettings, Login)
- `src/components/admin/PosterMaker/` — Fabric.js canvas editor broken into: `FabricCanvas`, `LayerPanel`, `PropertiesPanel`, `TemplatePanel`, `DraftPanel`, `EditorToolbar`, `TemplateSelector`, and a `blocks/` subdirectory for individual poster elements (`PosterHeader`, `PosterFooter`, `PosterDetails`, `PosterImageBlock`, `PosterPromo`)
- `src/components/AuthGuard.tsx` — Wraps admin routes; checks Supabase auth session

### Data Layer

- `src/lib/supabase.ts` — Single Supabase client (uses `VITE_SUPABASE_API_KEY`, not `VITE_SUPABASE_ANON_KEY`)
- `services/geminiService.ts` — Gemini AI calls for itinerary generation (reads `process.env.API_KEY`)
- `services/posterAI.ts` — Gemini AI calls for AI Magic Auto-Fill in the Poster Maker
- `constants.ts` (root) — Static testimonials and interest lists
- `types.ts` (root) — Shared TypeScript types: `TourPackage`, `TourCategory`, `AIPlannerInput`, `Testimonial`
- `src/types/poster.ts` — Poster-specific types: `AspectRatio`, `LayoutType`, `TemplateConfig`

### Contexts

- `SiteSettingsContext` — Fetches `site_settings` table from Supabase on mount; provides contact info (WhatsApp, phone, email, social links) site-wide
- `LanguageContext` — Provides `t()` translation function for i18n

### Supabase Schema (key tables)

`packages`, `airlines`, `hotels`, `orders`, `private_trips`, `site_settings`. Migrations live in `supabase/migrations/`.

Home page manually joins packages with airlines/hotels by filtering on `airline_ids` and `hotel_ids` arrays stored on packages.

### Poster Maker

Built on Fabric.js v7. The canvas editor (`FabricCanvas.tsx`) manages a `fabric.Canvas` instance. `PosterCanvas.tsx` orchestrates the full editor layout. Undo/redo uses a custom history stack. Drafts are saved to Supabase with auto-generated thumbnails. Templates are defined as `TemplateConfig` objects with layout and styling options.

## Key Conventions

- Tailwind stays CDN-based — do not migrate to PostCSS unless explicitly instructed.
- Gemini model used: `gemini-2.5-flash-preview-05-20` (check `geminiService.ts` for current model name).
- All content and AI-generated itineraries must be in Bahasa Indonesia and maintain Halal/Islamic tone.
- TypeScript strict mode — avoid `any`; update `types.ts` when adding new data shapes.
- New admin pages go in `src/pages/admin/`, new admin components in `src/components/admin/`.
