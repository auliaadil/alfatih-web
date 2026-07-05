# AI Agent Orientation: Alfatih Dunia Wisata

This document provides context and guidelines for AI agents working on the **Alfatih Dunia Wisata** codebase.

## 🧠 Project Context

**Alfatih Dunia Wisata** is a premium travel agency website built with **React**, **Vite**, and **TypeScript**. 
The core value proposition is **Umrah** and **Halal-friendly** international travel. The standout feature is an **AI-powered Private Trip Planner** that generates custom itineraries using Google's Gemini AI.

## ⚙️ Commands & Environment

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build
npm run preview  # Preview production build
```

There are no test or lint scripts configured.

### Environment Variables

Create `.env.local` with:
```
VITE_SUPABASE_URL=
VITE_SUPABASE_API_KEY=
VITE_RECAPTCHA_SITE_KEY=
VITE_UNSPLASH_ACCESS_KEY=   # Unsplash Client-ID for image search in Poster Maker (50 req/hr free)
VITE_PIXABAY_API_KEY=       # Pixabay API key for image search in Poster Maker (100 req/min free)
```

AI API keys and backend secrets are managed as Supabase secrets (not in `.env.local`):
- `GEMINI_API_KEY` — Gemini API key
- `GEMINI_MODEL` — model name (e.g. `gemini-2.5-flash-preview-05-20`), swappable without redeployment
- `RECAPTCHA_SECRET_KEY` — Google reCAPTCHA secret for server-side verification
- `UNSPLASH_ACCESS_KEY` — Unsplash API key used by the `image-search` edge function (not the `VITE_` frontend key)
- `PIXABAY_API_KEY` — Pixabay API key used by the `image-search` edge function (not the `VITE_` frontend key)

Set via: `supabase secrets set GEMINI_API_KEY=<value> GEMINI_MODEL=<value> RECAPTCHA_SECRET_KEY=<value> UNSPLASH_ACCESS_KEY=<value> PIXABAY_API_KEY=<value>`

## 🏗 Architecture & Structure

### Core Technologies
- **Frontend**: React 19 (Hooks, functional components).
- **Build Tool**: Vite (Fast HMR, optimized builds).
- **Styling**: Tailwind CSS (v3 via CDN script in `index.html` - *Note: This is unusual for production apps but intentional for this prototype/demo.*).

### Entry Points
- `index.html` — Loads Tailwind CSS via CDN script tag (intentional, not PostCSS). Custom theme colors (`primary`, `secondary`, `accent`, `dark`) are defined here in the Tailwind config inline script.
- `App.tsx` — Root router. Two areas: public (`/`, `/package/:slug`) and admin (`/admin/*` protected by `AuthGuard`).
- `index.tsx` — React DOM entry.

Note: The `@` alias resolves to the project root.

### Two Parallel Component Trees
The project has a **split structure**: root-level `components/` holds public-facing UI, while `src/` holds everything else including the admin area.

- `components/` (root) — Public UI: `Hero`, `Navbar`, `Footer`, `TourCard`, `TourDetail`, `AIPlanner`, `CompanyProfile`
- `src/pages/` — Page components: `Home.tsx`, `PackageDetailPage.tsx`, and `admin/` (Dashboard, Packages, Orders, PrivateTrips, Airlines, Hotels, Documentations, PosterMaker, TextCampaign, SiteSettings, Login)
- `src/components/admin/PosterMaker/` — Fabric.js canvas editor broken into smaller components.
- `src/components/AuthGuard.tsx` — Wraps admin routes; checks Supabase auth session

### Data Layer
- `src/lib/supabase.ts` — Single Supabase client (uses `VITE_SUPABASE_API_KEY`, not `VITE_SUPABASE_ANON_KEY`)
- `services/` — Thin fetch wrappers that call Supabase Edge Functions (`itineraryService.ts`, `posterAutofillService.ts`, `textCampaignService.ts`, etc.)
- `constants.ts` (root) — Static testimonials and interest lists
- `types.ts` (root) & `src/types/` — Shared TypeScript types

### Edge Functions
Supabase Edge Functions live in `supabase/functions/`. They run on Deno and call the Gemini REST API directly (no SDK). Secrets are injected at runtime — never committed.

- `supabase/functions/ai-itinerary/` — Public endpoint. Verifies reCAPTCHA v3 token (score ≥ 0.5), builds the Halal itinerary prompt, calls Gemini.
- `supabase/functions/ai-poster-autofill/` — Admin-only. Verifies Supabase JWT, builds poster copywriting prompt per template type, calls Gemini.
- `supabase/functions/ai-text-campaign/` — Admin-only. Generates multi-slide social-media copy.
- `supabase/functions/ai-package-content/` — Admin-only. Generates marketing copy for tour package descriptions.
- `supabase/functions/generate-itinerary-pdf/` — Admin-only. Renders and returns an itinerary PDF.
- `supabase/functions/image-search/` — Admin-only. Proxies Unsplash and Pixabay search.

Deploy commands:
```bash
supabase functions deploy ai-itinerary
supabase functions deploy ai-poster-autofill
supabase functions deploy ai-text-campaign
supabase functions deploy ai-package-content
supabase functions deploy generate-itinerary-pdf
supabase functions deploy image-search
```

### Supabase Schema
Key tables: `packages`, `airlines`, `hotels`, `orders`, `private_trips`, `site_settings`, `documentations`. Migrations live in `supabase/migrations/`.

## 🛠 Default CRUD Style for Admin Features

For future CRUD features in the admin area, strictly follow the established design pattern seen in the `Documentations` feature:

### Index / List Views
- **Header**: Use the `PageHeader` component with a `title`, `subtitle`, and an action button (e.g., `+ New [Item]`) using the `btnPrimary` class.
- **Layout**: Use `TableCard` for the main list layout.
- **Table Structure**: Use `THead`, `Th` (with `sortKey`, `currentSort`, `onSort` props for sortable columns), and `Td`.
- **Loading State**: Use `SkeletonRows` when fetching data.
- **Empty State**: Use the `EmptyState` component with a relevant icon from `lucide-react` when no records exist.
- **Search & Filter**: Place a `SearchInput` and native `<select>` filters in a flex row above the `TableCard`.
- **Pagination**: Use the `Pagination` component below the `TableCard`.
- **Actions Column**: Use **text buttons** (not icons) with the `btnGhost` class. 
  - Standard actions are: `View`, `Edit`, and `Delete`. 
  - The Delete button must use red styling: `className={`${btnGhost} text-red-500 hover:bg-red-50 text-xs px-2 py-1`}`.
  - The View button must use blue styling: `className={`${btnGhost} text-blue-600 hover:bg-blue-50 text-xs px-2 py-1`}`.
  - The Edit button should use default ghost styling: `className={`${btnGhost} text-xs px-2 py-1`}`.

### Detail / Form Views
- Do not use separate routes for simple CRUD forms. Use Modal or SlideOver components (e.g., `DocumentationForm`, `DocumentationView`) rendered in the index page and managed by boolean state variables (e.g., `formOpen`, `viewOpen`).

## 📝 Guidelines for AI Agents

1.  **Tailwind Usage**: Tailwind stays CDN-based — do not migrate to PostCSS unless explicitly instructed.
2.  **Model Configuration**: Gemini model used is configured via `GEMINI_MODEL` Supabase secret.
3.  **Language & Tone**: All content and AI-generated itineraries must be in Bahasa Indonesia and maintain Halal/Islamic tone.
4.  **Type Safety**: TypeScript strict mode — avoid `any`; update `types.ts` when adding new data shapes.
5.  **Component Modularity**: New admin pages go in `src/pages/admin/`, new admin components in `src/components/admin/`.
6.  **Brand color palette used in templates**: Primary (Blue) `#0084ff`, Secondary (Amber) `#F59E0B`, Neutral dark `#0F172A`, White background `#F8FAFC`.
