# AI Edge Functions Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move all Gemini API calls from client-side services into two Supabase Edge Functions, hiding the API key from the browser and making the model and prompt logic remotely changeable.

**Architecture:** Two Edge Functions (`ai-itinerary`, `ai-poster-autofill`) own all prompt engineering and Gemini REST calls. Client-side services (`itineraryService.ts`, `posterAutofillService.ts`) become thin fetch wrappers with identical public interfaces — no changes to `AIPlanner.tsx` or `PosterMaker.tsx`. The `ai-itinerary` function is gated by reCAPTCHA v3 server-side verification; `ai-poster-autofill` requires a valid Supabase JWT.

**Tech Stack:** Supabase Edge Functions (Deno), Gemini REST API (fetch, no SDK), Supabase `@supabase/supabase-js` (via esm.sh in Deno), React/TypeScript (client)

---

## File Map

**Create:**
- `supabase/functions/ai-itinerary/index.ts` — edge function: reCAPTCHA verify → build itinerary prompt → Gemini REST → return `{ itinerary }`
- `supabase/functions/ai-poster-autofill/index.ts` — edge function: JWT verify → build poster prompt → Gemini REST → return updated `textNodes`
- `services/itineraryService.ts` — thin fetch wrapper; same `generateItinerary(input)` signature as old `geminiService.ts`
- `services/posterAutofillService.ts` — thin fetch wrapper; same `applyTemplateContent()` and `generateTemplateAutofill()` signatures as old `posterAI.ts`

**Modify:**
- `components/AIPlanner.tsx:4` — update import path from `geminiService` → `itineraryService`
- `src/pages/admin/PosterMaker.tsx:4` — update import path from `posterAI` → `posterAutofillService`
- `vite.config.ts` — remove `define` entries for `process.env.API_KEY` and `process.env.GEMINI_API_KEY`; remove `loadEnv` import

**Delete:**
- `services/geminiService.ts`
- `services/posterAI.ts`

---

## Task 1: Create `ai-itinerary` edge function

**Files:**
- Create: `supabase/functions/ai-itinerary/index.ts`

- [ ] **Step 1: Create the functions directory**

```bash
mkdir -p supabase/functions/ai-itinerary
```

- [ ] **Step 2: Write the edge function**

Create `supabase/functions/ai-itinerary/index.ts`:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { recaptchaToken, destination, days, travelers, interests } = await req.json()

    const recaptchaRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: Deno.env.get('RECAPTCHA_SECRET_KEY') ?? '',
        response: recaptchaToken ?? '',
      }),
    })
    const recaptchaData = await recaptchaRes.json()
    if (!recaptchaData.success || recaptchaData.score < 0.5) {
      return new Response(
        JSON.stringify({ error: 'reCAPTCHA verification failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const prompt = `
You are the "Alfatih Private Trip Assistant", a world-class travel expert for Alfatih Dunia Wisata.
Alfatih Dunia Wisata is a premium Indonesian travel agency specializing in Umrah and Halal-friendly international travel.

Task: Generate a detailed, inspiring, and practical PRIVATE TRIP draft itinerary based on user preferences.

User Preferences:
- Destination: ${destination}
- Duration: ${days} Days
- Travelers: ${travelers}
- Key Interests: ${(interests as string[]).join(', ')}

Strict Requirements:
1. Language: The itinerary MUST be generated in Indonesian (Bahasa Indonesia).
2. Tone: Warm, professional, and Islamic-friendly (use "Assalamualaikum", "InshaAllah" where appropriate).
3. Halal Focus: For non-Muslim countries, always suggest specific areas or tips for finding Halal food and mentioning prayer facilities (Masjids or Musallas).
4. Structure:
   - Start with an exciting "Draft Overview" for this Private Trip.
   - Day-by-day breakdown with titles (e.g., Hari 1: Kedatangan & Wisata Kota).
   - Include 3-4 specific activities per day.
   - End with "Pro Travel Tips" for this specific destination.
5. Formatting: Use clean Markdown (Bold headers, bullet points).
6. Signature: Explicitly remind the user that this is a draft and they must contact Alfatih Dunia Wisata to get the official itinerary and pricing (Cek harga dan itinerary resmi ke tim Alfatih).

Make it feel personalized and luxurious, but clearly state it's a draft reference.
`

    const model = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash-preview-05-20'
    const apiKey = Deno.env.get('GEMINI_API_KEY') ?? ''
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    )

    const geminiData = await geminiRes.json()
    const itinerary = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    return new Response(
      JSON.stringify({ itinerary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('ai-itinerary error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/ai-itinerary/index.ts
git commit -m "feat: add ai-itinerary edge function"
```

---

## Task 2: Create `ai-poster-autofill` edge function

**Files:**
- Create: `supabase/functions/ai-poster-autofill/index.ts`

- [ ] **Step 1: Create the functions directory**

```bash
mkdir -p supabase/functions/ai-poster-autofill
```

- [ ] **Step 2: Write the edge function**

Create `supabase/functions/ai-poster-autofill/index.ts`:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const formatPrice = (price?: number) =>
  price
    ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price)
    : 'Hubungi Kami'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders })
  }

  try {
    const { templateType, package: pkg, topic, tagline, testimonial, textNodes } = await req.json()

    if (!textNodes || textNodes.length === 0 || templateType === 'blank') {
      return new Response(JSON.stringify(textNodes ?? []), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let contextBlock = ''
    let instructionBlock = ''

    switch (templateType) {
      case 'conversion': {
        if (!pkg) {
          return new Response(JSON.stringify(textNodes), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        const startingPrice = formatPrice(pkg.room_options?.[0]?.price)
        const tiers = (pkg.room_options || [])
          .slice(0, 3)
          .map((r: { name: string; price?: number }) => `${r.name}: ${formatPrice(r.price)}`)
          .join(' | ')
        const features = (pkg.features || []).slice(0, 6).join(', ')
        contextBlock = `
Nama Paket: ${pkg.title}
Tanggal Keberangkatan: ${pkg.departure_date}
Durasi: ${pkg.duration}
Kategori: ${pkg.category}
Harga Mulai: ${startingPrice} per pax
Tipe Kamar: ${tiers}
Keunggulan: ${features}
Deskripsi: ${(pkg.description || '').substring(0, 200)}`
        instructionBlock = `
- Ganti headline utama dengan nama paket dan kata kunci unggulan.
- Ganti tanggal, durasi, harga dengan data aktual dari paket.
- Ganti baris benefit/keunggulan dengan fitur aktual dari paket (maks 10 kata per baris).
- Ganti teks kategori/label dengan nama kategori paket.
- Pertahankan teks singkat seperti label tombol (Daftar Sekarang, Hubungi Kami), social handle, nama brand, dan nomor lisensi PPIU.`
        break
      }
      case 'edu-reminder': {
        contextBlock = `Topik: ${topic || 'Tips Umroh'}`
        instructionBlock = `
- Ganti headline poster dengan judul daftar yang menarik dan sesuai topik (contoh: "5 Barang Wajib Dibawa Saat Umroh").
- Ganti sub-headline dengan kalimat pengantar singkat.
- Ganti setiap judul item daftar bernomor dengan tips/langkah yang relevan dengan topik (maks 6 kata).
- Ganti setiap deskripsi item dengan penjelasan singkat (maks 12 kata).
- Jangan ubah social handle, nama brand, dan tombol.`
        break
      }
      case 'aspiration': {
        contextBlock = `Tagline kustom: ${tagline?.trim() || '(generate tagline spiritual yang menginspirasi)'}`
        instructionBlock = `
- Ganti teks tagline/kutipan utama dengan tagline spiritual yang menginspirasi (boleh menggunakan kata dari konteks, atau generate sendiri jika kosong).
- Ganti sub-tagline dengan kalimat undangan yang hangat dan profesional.
- Pertahankan nama brand, social handle, badge, dan teks pillar seperti "Islami", "Amanah", "Premium".`
        break
      }
      case 'social-proof': {
        const hasData = testimonial && (testimonial.quote || testimonial.name || testimonial.batch)
        contextBlock = hasData
          ? `Kutipan: "${testimonial.quote}"\nNama: ${testimonial.name}\nRombongan: ${testimonial.batch}`
          : '(AI akan membuat testimoni jamaah Umroh yang realistis dan positif)'
        instructionBlock = `
- Ganti teks kutipan testimoni dengan kutipan yang diberikan (atau generate jika kosong). Pertahankan gaya italic dan panjang yang mirip.
- Ganti nama jamaah dan info rombongan dengan data yang diberikan (atau generate jika kosong).
- Pertahankan statistik (1000+ Jamaah, 12 Thn, ★5.0), nama brand, social handle, dan tombol.`
        break
      }
      default:
        return new Response(JSON.stringify(textNodes), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

    const prompt = `
Kamu adalah copywriter profesional Alfatih Dunia Wisata — travel agent premium Indonesia untuk Umroh dan wisata Halal.

Tipe Template: ${templateType}

Data Konten:
${contextBlock}

Text node yang ada di poster saat ini (field teks yang bisa diedit di kanvas):
${JSON.stringify(textNodes, null, 2)}

Instruksi penggantian:
${instructionBlock}

ATURAN WAJIB:
1. Hanya ubah nilai "text" setiap node — "id" TIDAK boleh diubah.
2. Panjang teks baru harus mirip dengan aslinya agar tata letak poster tidak rusak.
3. JANGAN ubah: "Alfatih Dunia Wisata", "@alfatih.umroh", "adwisata.com", nomor PPIU, label tombol singkat, dan teks brand statis.
4. Gunakan Bahasa Indonesia untuk semua konten kecuali teks yang memang aslinya berbahasa Inggris.
5. Kembalikan HANYA array JSON yang valid — tanpa markdown, tanpa penjelasan.

Format respons:
[{ "id": "...", "text": "..." }, ...]`

    const model = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash-preview-05-20'
    const apiKey = Deno.env.get('GEMINI_API_KEY') ?? ''
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    )

    const geminiData = await geminiRes.json()
    const raw = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]'
    const cleaned = raw.replace(/```json/gi, '').replace(/```/gi, '').trim()

    return new Response(cleaned, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('ai-poster-autofill error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/ai-poster-autofill/index.ts
git commit -m "feat: add ai-poster-autofill edge function"
```

---

## Task 3: Create `services/itineraryService.ts`

**Files:**
- Create: `services/itineraryService.ts`

The `AIPlanner.tsx` component already gets a reCAPTCHA token via `executeRecaptcha('generate_itinerary')` and blocks if it's null. This service gets its own token internally so the `generateItinerary(input)` signature stays unchanged and `AIPlanner.tsx` requires no edits.

- [ ] **Step 1: Create the file**

Create `services/itineraryService.ts`:

```typescript
import { AIPlannerInput } from '../types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY

async function getRecaptchaToken(): Promise<string | null> {
  if (!SITE_KEY) return null
  const g = (window as any).grecaptcha
  if (!g) return null
  return new Promise<string>((resolve) => {
    g.ready(() => g.execute(SITE_KEY, { action: 'generate_itinerary' }).then(resolve))
  })
}

export const generateItinerary = async (input: AIPlannerInput): Promise<string> => {
  try {
    const recaptchaToken = await getRecaptchaToken()
    const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-itinerary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...input, recaptchaToken }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return data.itinerary ?? 'Mohon maaf, saya tidak dapat membuat itinerary saat ini. Silakan coba lagi.'
  } catch (error) {
    console.error('itineraryService error:', error)
    return 'Maaf, sistem AI kami sedang mengalami kendala. Silakan coba lagi beberapa saat lagi.'
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add services/itineraryService.ts
git commit -m "feat: add itineraryService as thin edge function wrapper"
```

---

## Task 4: Create `services/posterAutofillService.ts`

**Files:**
- Create: `services/posterAutofillService.ts`

- [ ] **Step 1: Create the file**

Create `services/posterAutofillService.ts`:

```typescript
import { supabase } from '@/src/lib/supabase'
import { TourPackage } from '../types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

export type TemplateType = 'conversion' | 'aspiration' | 'edu-reminder' | 'social-proof' | 'blank'

export interface TemplateInputs {
  templateType: TemplateType
  package?: TourPackage
  topic?: string
  tagline?: string
  testimonial?: { quote: string; name: string; batch: string }
}

export const applyTemplateContent = async (
  inputs: TemplateInputs,
  textNodes: { id: string; text: string }[]
): Promise<{ id: string; text: string }[]> => {
  if (textNodes.length === 0 || inputs.templateType === 'blank') return textNodes

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return textNodes

    const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-poster-autofill`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ ...inputs, textNodes }),
    })

    if (!res.ok) return textNodes
    return await res.json()
  } catch (err) {
    console.error('posterAutofillService error:', err)
    return textNodes
  }
}

export const generateTemplateAutofill = async (
  tour: TourPackage,
  textNodes: { id: string; text: string }[]
): Promise<{ id: string; text: string }[]> =>
  applyTemplateContent({ templateType: 'conversion', package: tour }, textNodes)
```

- [ ] **Step 2: Commit**

```bash
git add services/posterAutofillService.ts
git commit -m "feat: add posterAutofillService as thin edge function wrapper"
```

---

## Task 5: Update imports in calling components

**Files:**
- Modify: `components/AIPlanner.tsx:4`
- Modify: `src/pages/admin/PosterMaker.tsx:4`

- [ ] **Step 1: Update `AIPlanner.tsx` import**

In `components/AIPlanner.tsx`, replace line 4:

```typescript
// Before
import { generateItinerary } from '../services/geminiService';

// After
import { generateItinerary } from '../services/itineraryService';
```

- [ ] **Step 2: Update `PosterMaker.tsx` import**

In `src/pages/admin/PosterMaker.tsx`, replace line 4:

```typescript
// Before
import { applyTemplateContent, TemplateInputs, TemplateType } from '../../../services/posterAI';

// After
import { applyTemplateContent, TemplateInputs, TemplateType } from '../../../services/posterAutofillService';
```

- [ ] **Step 3: Commit**

```bash
git add components/AIPlanner.tsx src/pages/admin/PosterMaker.tsx
git commit -m "refactor: update imports to new edge function service wrappers"
```

---

## Task 6: Set Supabase secrets and deploy edge functions

This task requires the Supabase CLI. Install if needed: `npm install -g supabase`

- [ ] **Step 1: Link to your Supabase project (skip if already linked)**

```bash
supabase login
supabase link
```

When prompted, select your project from the list.

- [ ] **Step 2: Set secrets**

```bash
supabase secrets set \
  GEMINI_API_KEY=<your-gemini-api-key> \
  GEMINI_MODEL=gemini-2.5-flash-preview-05-20 \
  RECAPTCHA_SECRET_KEY=<your-recaptcha-secret-key>
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically by Supabase into every edge function — do not set them manually.

- [ ] **Step 3: Deploy both functions**

```bash
supabase functions deploy ai-itinerary
supabase functions deploy ai-poster-autofill
```

Expected output for each:
```
Deploying function ai-itinerary...
Done.
```

- [ ] **Step 4: Smoke test `ai-itinerary` with curl**

```bash
curl -X POST \
  https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/ai-itinerary \
  -H "Content-Type: application/json" \
  -d '{"recaptchaToken":"test","destination":"Istanbul","days":5,"travelers":"Keluarga","interests":["kuliner","sejarah"]}'
```

Expected: HTTP 400 with `{ "error": "reCAPTCHA verification failed" }` (test token is rejected — this confirms the function is live and reCAPTCHA gate is working). A real token from the browser will return `{ "itinerary": "..." }`.

- [ ] **Step 5: Smoke test `ai-poster-autofill` with curl**

```bash
curl -X POST \
  https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/ai-poster-autofill \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected: HTTP 401 `Unauthorized` (missing JWT — confirms auth gate is working).

---

## Task 7: Clean up old files and remove Gemini SDK

**Files:**
- Delete: `services/geminiService.ts`
- Delete: `services/posterAI.ts`
- Modify: `vite.config.ts`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Delete old service files**

```bash
git rm services/geminiService.ts services/posterAI.ts
```

- [ ] **Step 2: Simplify `vite.config.ts`**

Remove the `loadEnv` import, the callback form, and both `define` entries. The full file after edit:

```typescript
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
```

- [ ] **Step 3: Remove `@google/genai` from dependencies**

```bash
npm uninstall @google/genai
```

- [ ] **Step 4: Update `CLAUDE.md` env vars section**

In `CLAUDE.md`, replace the `## Environment Variables` section with:

```markdown
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

Set via: `supabase secrets set GEMINI_API_KEY=<value> GEMINI_MODEL=<value> RECAPTCHA_SECRET_KEY=<value>`
```

Also update the note under `## Architecture > Entry Points` — remove the line:
> Note: Gemini key is exposed to client-side as `process.env.API_KEY` via Vite's `define` plugin in `vite.config.ts`.

And update `services/geminiService.ts` references in the Data Layer section to reflect the new service names.

- [ ] **Step 5: Verify build passes**

```bash
npm run build
```

Expected: clean build with no TypeScript errors. If there are import errors, check that `AIPlanner.tsx` and `PosterMaker.tsx` point to the new service files.

- [ ] **Step 6: Verify in browser**

```bash
npm run dev
```

1. Open `http://localhost:3000`
2. Use the AI Planner — fill in destination, select interests, click generate. Confirm an itinerary is returned (check Network tab: the request should go to `supabase.co/functions/v1/ai-itinerary`, not to `generativelanguage.googleapis.com`). Confirm no `GEMINI_API_KEY` appears in any request headers or response bodies.
3. Log in as admin, open Poster Maker, select a package template, click AI Magic Auto-Fill. Confirm the poster text nodes update (request should go to `supabase.co/functions/v1/ai-poster-autofill` with `Authorization: Bearer` header).

- [ ] **Step 7: Commit**

```bash
git add vite.config.ts CLAUDE.md package.json package-lock.json
git commit -m "chore: remove @google/genai SDK and clean up Gemini env vars"
```
