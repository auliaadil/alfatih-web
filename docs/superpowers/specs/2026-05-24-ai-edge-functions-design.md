# AI Edge Functions Migration Design

**Date:** 2026-05-24
**Status:** Approved

## Goal

Migrate all direct Gemini API calls from client-side services into Supabase Edge Functions. This hides the Gemini API key from the browser, removes AI logic from the frontend bundle, and allows the model, provider, and prompt logic to be changed remotely without a frontend redeploy.

## Architecture Overview

Two Supabase Edge Functions replace the existing `@google/genai` SDK calls. Client-side services become thin `fetch` wrappers with identical public interfaces — calling components (`AIPlanner.tsx`, `PosterMaker.tsx`) require zero changes.

```
Client (browser)
  ├── AIPlanner
  │     └── services/itineraryService.ts  →  POST /functions/v1/ai-itinerary
  │                                            ├── verify reCAPTCHA token
  │                                            ├── build prompt
  │                                            └── POST Gemini REST → return text
  │
  └── PosterMaker (admin)
        └── services/posterAutofillService.ts  →  POST /functions/v1/ai-poster-autofill
                                                    ├── verify Supabase JWT
                                                    ├── build prompt
                                                    └── POST Gemini REST → return JSON
```

## Edge Functions

### `ai-itinerary` (public, reCAPTCHA-gated)

**File:** `supabase/functions/ai-itinerary/index.ts`

**Auth:** reCAPTCHA v3 — the client sends a token obtained from the existing `grecaptcha` instance in `AIPlanner`. The function verifies the token against Google's reCAPTCHA API. Requests with a score below 0.5 are rejected with HTTP 400.

**Request body:**
```json
{
  "recaptchaToken": "string",
  "destination": "string",
  "days": 7,
  "travelers": 2,
  "interests": ["string"]
}
```

**Response:**
```json
{ "itinerary": "string" }
```

**Flow:**
1. Verify reCAPTCHA token (reject score < 0.5)
2. Build Bahasa Indonesia Halal itinerary prompt (currently in `geminiService.ts`, moved here verbatim)
3. `fetch` Gemini REST API with `GEMINI_API_KEY` and `GEMINI_MODEL` secrets
4. Return `{ itinerary: response.text }`

---

### `ai-poster-autofill` (admin, JWT-gated)

**File:** `supabase/functions/ai-poster-autofill/index.ts`

**Auth:** Supabase JWT — extract `Authorization: Bearer <token>` header and verify against `SUPABASE_JWT_SECRET`. Reject with HTTP 401 if missing or invalid.

**Request body:**
```json
{
  "templateType": "conversion | aspiration | edu-reminder | social-proof | blank",
  "package": { "...TourPackage fields..." },
  "topic": "string (optional)",
  "tagline": "string (optional)",
  "testimonial": { "quote": "string", "name": "string", "batch": "string" },
  "textNodes": [{ "id": "string", "text": "string" }]
}
```

**Response:**
```json
[{ "id": "string", "text": "string" }]
```

**Flow:**
1. Verify Supabase JWT from `Authorization` header
2. Build poster copywriting prompt per `templateType` (logic moved from `posterAI.ts` verbatim)
3. `fetch` Gemini REST API
4. Parse and return the updated `textNodes` array

---

## Client-Side Services

### `services/itineraryService.ts` (renamed from `geminiService.ts`)

- Exports the same `generateItinerary(input: AIPlannerInput): Promise<string>` signature
- Reads reCAPTCHA token via `grecaptcha.execute(siteKey, { action: 'generate_itinerary' })`
- `fetch`es `${VITE_SUPABASE_URL}/functions/v1/ai-itinerary`
- Returns the `itinerary` string or the existing Indonesian error message on failure

### `services/posterAutofillService.ts` (renamed from `posterAI.ts`)

- Exports the same `applyTemplateContent()` and `generateTemplateAutofill()` signatures
- Reads JWT via `supabase.auth.getSession()` and attaches as `Authorization: Bearer`
- `fetch`es `${VITE_SUPABASE_URL}/functions/v1/ai-poster-autofill`
- Returns the parsed `textNodes` array or the original nodes on failure

**Removed from both files:**
- `import { GoogleGenAI } from "@google/genai"`
- `process.env.API_KEY` references
- `GoogleGenAI` client initialization

**Unchanged:**
- All calling components (`AIPlanner.tsx`, `PosterMaker.tsx`)
- All TypeScript types (`AIPlannerInput`, `TemplateInputs`, `TemplateType`)
- User-facing error message strings

## Supabase Secrets

Set via `supabase secrets set` — never committed to the repo.

| Secret | Purpose |
|---|---|
| `GEMINI_API_KEY` | Gemini API key (replaces `VITE_GEMINI_API_KEY` / `process.env.API_KEY`) |
| `GEMINI_MODEL` | Model name (e.g. `gemini-2.5-flash-preview-05-20`), swappable without redeployment |
| `RECAPTCHA_SECRET_KEY` | Google reCAPTCHA secret for server-side token verification |

## `.env.local` After Migration

```
VITE_SUPABASE_URL=
VITE_SUPABASE_API_KEY=
VITE_RECAPTCHA_SITE_KEY=        # stays — used client-side to obtain token
VITE_UNSPLASH_ACCESS_KEY=       # stays
VITE_PIXABAY_API_KEY=           # stays
# VITE_GEMINI_API_KEY — removed, now GEMINI_API_KEY Supabase secret
# GEMINI_API_KEY — removed, now GEMINI_API_KEY Supabase secret
```

## CORS & Deployment

- Both functions set `Access-Control-Allow-Origin` to the app's origin.
- Deploy via: `supabase functions deploy ai-itinerary` and `supabase functions deploy ai-poster-autofill`.
- During local dev, the Supabase client points to the hosted project URL — no local Supabase CLI required.
- Deployment commands can be added to the existing CI/CD tag-deploy workflow.

## Error Handling

| Condition | HTTP Status | Client behaviour |
|---|---|---|
| Bad/missing input | 400 | Return existing Indonesian error string |
| reCAPTCHA score < 0.5 | 400 | Return existing Indonesian error string |
| Missing/invalid JWT | 401 | Return original `textNodes` unchanged |
| Gemini API error | 500 | Return existing Indonesian error string |
