# AI Content Poster Modal — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a two-step AI modal to PosterMaker that generates, reviews, and applies multi-slide carousel copy for Content-type templates.

**Architecture:** A new `ai-content-poster` edge function returns structured JSON slide objects. A `ContentPosterModal` component owns the input/review UX. `PosterMaker.tsx` wires the modal in and injects copy into cloned template JSON to create canvas slides.

**Tech Stack:** Deno (edge function), React 18, Fabric.js v7, Supabase JS v2, Gemini REST API, Tailwind CSS (CDN).

## Global Constraints

- All copy in Bahasa Indonesia with Islami tone — never English in user-facing strings
- Tailwind stays CDN-based — no PostCSS imports
- TypeScript strict mode — no `any` without cast comment
- Brand name must be `"Alfatih Dunia Wisata"` exactly
- Gemini model read from `GEMINI_MODEL` Supabase secret
- Admin auth: verify Supabase JWT in every edge function
- No test runner is configured — use browser-based verification for each task
- `@` alias resolves to the project root (not `src/`)

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `supabase/functions/ai-content-poster/index.ts` | Edge function: call Gemini, return typed slide JSON |
| Create | `services/contentPosterService.ts` | Client service: call edge function, export types |
| Modify | `src/components/admin/PosterMaker/TemplatePanel.tsx` | Add 2 cover templates to `BASE_TEMPLATES`; filter them from picker |
| Modify | `services/posterAutofillService.ts` | Add `'content'` to `TemplateType` union |
| Modify | `src/pages/admin/PosterMaker.tsx` | Add `content` case to `getTemplateType` + `renderAiInputs`; wire modal |
| Create | `src/components/admin/PosterMaker/ContentPosterModal.tsx` | Two-step modal: input → review → apply |

---

## Task 1: Edge Function `ai-content-poster`

**Files:**
- Create: `supabase/functions/ai-content-poster/index.ts`

**Interfaces:**
- Produces: `POST /functions/v1/ai-content-poster` → `{ slides: ContentSlide[] }`
- Request: `{ topic: string, category: string, notes?: string, regenerateIndex?: number | null }`

- [ ] **Step 1: Create the edge function file**

```typescript
// supabase/functions/ai-content-poster/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CoverSlide {
  slideType: 'cover'
  title: string
  subtitle: string
}

interface TipSlide {
  slideType: 'tip'
  number: number
  title: string
  body: string
}

type ContentSlide = CoverSlide | TipSlide

interface RequestBody {
  topic: string
  category: string
  notes?: string
  regenerateIndex?: number | null
}

const buildFullPrompt = (topic: string, category: string, notes?: string): string => {
  const notesBlock = notes?.trim() ? `\nCatatan tambahan: ${notes.trim()}` : ''
  return `Kamu adalah copywriter profesional Alfatih Dunia Wisata — travel agent premium Indonesia untuk Umroh dan wisata Halal.

Buat konten slide carousel Instagram berdasarkan topik berikut:
Topik: ${topic}
Label Kategori: ${category}${notesBlock}

Tulis dalam Bahasa Indonesia dengan nuansa Islami yang hangat.
Inferensikan jumlah tip slides dari topik (misal "5 Tips" → 5 tip slides). Selalu buat 1 cover slide di awal.

Kembalikan HANYA JSON valid tanpa markdown fence, komentar, atau teks lain di luar JSON. Format tepat:
{
  "slides": [
    { "slideType": "cover", "title": "...", "subtitle": "..." },
    { "slideType": "tip", "number": 1, "title": "...", "body": "..." }
  ]
}

Aturan:
- Cover slide: title adalah judul utama carousel (menarik, ~5-8 kata), subtitle adalah kalimat pendukung (1 kalimat)
- Tip slide: title adalah nama tip (singkat, ~4-7 kata), body adalah penjelasan 2-3 kalimat, maksimal 220 karakter
- Semua teks Bahasa Indonesia
- Nada: hangat, inspiratif, Islami`
}

const buildRegeneratePrompt = (topic: string, category: string, slideIndex: number, notes?: string): string => {
  const notesBlock = notes?.trim() ? `\nCatatan tambahan: ${notes.trim()}` : ''
  const isCover = slideIndex === 0
  const slideLabel = isCover
    ? 'cover slide (slide pertama, bukan tip)'
    : `tip slide nomor ${slideIndex}`
  return `Kamu adalah copywriter profesional Alfatih Dunia Wisata — travel agent premium Indonesia untuk Umroh dan wisata Halal.

Buat ulang SATU slide untuk carousel Instagram:
Topik Carousel: ${topic}
Label Kategori: ${category}
Slide yang dibuat ulang: ${slideLabel}${notesBlock}

Kembalikan HANYA JSON valid untuk satu slide object, tanpa markdown fence atau teks lain. Format tepat:
${isCover
  ? '{ "slideType": "cover", "title": "...", "subtitle": "..." }'
  : `{ "slideType": "tip", "number": ${slideIndex}, "title": "...", "body": "..." }`
}

Aturan: Bahasa Indonesia, nuansa Islami, body maksimal 220 karakter.`
}

const callGemini = async (prompt: string, apiKey: string, model: string): Promise<string> => {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  )
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Gemini API error ${res.status}: ${errText}`)
  }
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

const stripFences = (text: string): string =>
  text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()

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
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
    authHeader.replace('Bearer ', '')
  )
  if (authError || !user) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders })
  }

  try {
    const body: RequestBody = await req.json()
    const { topic, category, notes, regenerateIndex } = body

    if (!topic?.trim() || !category?.trim()) {
      return new Response(JSON.stringify({ error: 'topic and category are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const model = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash-preview-05-20'
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Server misconfiguration' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const isSingleSlide = regenerateIndex != null
    const prompt = isSingleSlide
      ? buildRegeneratePrompt(topic, category, regenerateIndex!, notes)
      : buildFullPrompt(topic, category, notes)

    let rawText = stripFences(await callGemini(prompt, apiKey, model))

    let parsed: any
    try {
      parsed = JSON.parse(rawText)
    } catch {
      const retryText = stripFences(
        await callGemini(`Return ONLY the raw JSON, no markdown:\n\n${prompt}`, apiKey, model)
      )
      parsed = JSON.parse(retryText)
    }

    if (isSingleSlide) {
      // Single-slide regenerate: parsed is the slide object itself
      return new Response(JSON.stringify({ slides: [parsed as ContentSlide] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ slides: parsed.slides as ContentSlide[] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('ai-content-poster error:', message)
    return new Response(JSON.stringify({ error: 'Internal server error', detail: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
```

- [ ] **Step 2: Deploy the edge function**

```bash
cd /Users/mekari/Documents/personal-projects/alfatih-dunia-wisata
supabase functions deploy ai-content-poster
```

Expected: `Deployed ai-content-poster`

- [ ] **Step 3: Smoke-test with curl**

Get a valid JWT first (copy from browser DevTools → Application → Local Storage → `sb-<project>-auth-token` → `access_token`).

```bash
curl -X POST https://<PROJECT_REF>.supabase.co/functions/v1/ai-content-poster \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"topic":"3 Tips Khusyuk Saat Umrah","category":"TIPS UMRAH"}'
```

Expected: JSON with `slides` array: 1 cover + 3 tip objects.

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/ai-content-poster/index.ts
git commit -m "feat: add ai-content-poster edge function"
```

---

## Task 2: Client Service `contentPosterService.ts`

**Files:**
- Create: `services/contentPosterService.ts`

**Interfaces:**
- Produces: `generateContentPoster(topic, category, notes?, regenerateIndex?)` → `Promise<ContentSlide[]>`
- Produces types: `ContentSlide`, `CoverSlide`, `TipSlide` (imported by ContentPosterModal and PosterMaker)

- [ ] **Step 1: Create the service file**

```typescript
// services/contentPosterService.ts
import { supabase } from '@/src/lib/supabase'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

export interface CoverSlide {
  slideType: 'cover'
  title: string
  subtitle: string
}

export interface TipSlide {
  slideType: 'tip'
  number: number
  title: string
  body: string
}

export type ContentSlide = CoverSlide | TipSlide

export const generateContentPoster = async (
  topic: string,
  category: string,
  notes?: string,
  regenerateIndex?: number
): Promise<ContentSlide[]> => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Sesi tidak ditemukan. Silakan login ulang.')

  const body: Record<string, unknown> = { topic, category }
  if (notes?.trim()) body.notes = notes.trim()
  if (regenerateIndex !== undefined) body.regenerateIndex = regenerateIndex

  const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-content-poster`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error((data as any).error ?? `HTTP ${res.status}`)
  }

  const data = await res.json()
  if (!Array.isArray(data.slides)) throw new Error('Respons AI tidak valid.')
  return data.slides as ContentSlide[]
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build 2>&1 | head -30
```

Expected: build succeeds (no type errors for new file).

- [ ] **Step 3: Commit**

```bash
git add services/contentPosterService.ts
git commit -m "feat: add contentPosterService client"
```

---

## Task 3: Cover Templates + `TemplateType` extension

**Files:**
- Modify: `services/posterAutofillService.ts` — add `'content'` to `TemplateType`
- Modify: `src/components/admin/PosterMaker/TemplatePanel.tsx` — add 2 cover templates, filter from picker
- Modify: `src/pages/admin/PosterMaker.tsx` — add `content` to `getTemplateType()`

**Interfaces:**
- Consumes: `BASE_TEMPLATES` array in `TemplatePanel.tsx`
- Produces: `starterTemplates` includes `content-cover-post` and `content-cover-story`; they do NOT appear in the "Pilih Template" grid

- [ ] **Step 1: Extend `TemplateType` in `posterAutofillService.ts`**

Open `services/posterAutofillService.ts`. Find the `TemplateType` export and add `'content'`:

```typescript
// Before:
export type TemplateType = 'conversion' | 'aspiration' | 'edu-reminder' | 'social-proof' | 'blank'

// After:
export type TemplateType = 'conversion' | 'aspiration' | 'edu-reminder' | 'social-proof' | 'content' | 'blank'
```

- [ ] **Step 2: Add `content` case to `getTemplateType()` in `PosterMaker.tsx`**

Find `getTemplateType` (around line 54 of `src/pages/admin/PosterMaker.tsx`):

```typescript
// Before:
const getTemplateType = (template: PosterTemplate): TemplateType => {
    if (template.id.includes('conversion')) return 'conversion';
    if (template.id.includes('aspiration')) return 'aspiration';
    if (template.id.includes('edu-reminder')) return 'edu-reminder';
    if (template.id.includes('social-proof')) return 'social-proof';
    return 'blank';
};

// After:
const getTemplateType = (template: PosterTemplate): TemplateType => {
    if (template.id.includes('conversion')) return 'conversion';
    if (template.id.includes('aspiration')) return 'aspiration';
    if (template.id.includes('edu-reminder')) return 'edu-reminder';
    if (template.id.includes('social-proof')) return 'social-proof';
    if (template.id.includes('content')) return 'content';
    return 'blank';
};
```

- [ ] **Step 3: Add the two cover templates to `BASE_TEMPLATES` in `TemplatePanel.tsx`**

In `src/components/admin/PosterMaker/TemplatePanel.tsx`, find `BASE_TEMPLATES` array and add these two entries right after the `content-story` entry (before the closing `];`):

```typescript
    {
        id: 'content-cover-post',
        name: 'Tips Umrah — Cover (Post)',
        description: 'Cover slide untuk carousel Tips Umrah, format Post. Dipakai secara internal oleh AI Content Modal.',
        type: 'Content',
        previewColors: ['#F8FAFC', '#F59E0B', '#0084FF'],
        aspectRatio: 'post',
        json: {
            version: '7.2.0',
            width: 1080,
            height: 1350,
            objects: [
                { type: 'rect', left: 0, top: 0, width: 1080, height: 1350, fill: '#F8FAFC', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'rect', left: 0, top: 0, width: 1080, height: 14, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'rect', left: 0, top: 1210, width: 1080, height: 140, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'rect', left: 80, top: 160, width: 6, height: 880, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'rect', left: 120, top: 355, width: 440, height: 4, fill: '#D4A373', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'rect', left: 120, top: 720, width: 300, height: 2, fill: '#F59E0B', opacity: 0.6, originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'rect', left: 120, top: 1080, width: 160, height: 2, fill: '#F59E0B', opacity: 0.6, originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'textbox', left: 120, top: 148, width: 900, text: 'TIPS UMRAH', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', charSpacing: 180, originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 120, top: 380, width: 900, text: 'Judul Konten\nCarousel Anda', fontSize: 72, fontFamily: 'Dancing Script', fontWeight: '800', fill: '#0F172A', lineHeight: 1.2, originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 120, top: 740, width: 900, text: 'Kalimat pendukung yang menggambarkan isi carousel ini.', fontSize: 24, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#64748B', lineHeight: 1.55, originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 60, top: 1228, width: 300, text: 'ALFATIH DUNIA WISATA', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', charSpacing: 150, originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 380, top: 1228, width: 640, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 60, top: 1300, width: 960, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '400', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
            ]
        }
    },
    {
        id: 'content-cover-story',
        name: 'Tips Umrah — Cover (Story)',
        description: 'Cover slide untuk carousel Tips Umrah, format Story. Dipakai secara internal oleh AI Content Modal.',
        type: 'Content',
        previewColors: ['#F8FAFC', '#F59E0B', '#0084FF'],
        aspectRatio: 'story',
        json: {
            version: '7.2.0',
            width: 1080,
            height: 1920,
            objects: [
                { type: 'rect', left: 0, top: 0, width: 1080, height: 1920, fill: '#F8FAFC', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'rect', left: 0, top: 0, width: 1080, height: 20, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'rect', left: 0, top: 1740, width: 1080, height: 180, fill: '#0084FF', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'rect', left: 80, top: 200, width: 6, height: 1340, fill: '#F59E0B', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'rect', left: 120, top: 520, width: 500, height: 5, fill: '#D4A373', originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'rect', left: 120, top: 990, width: 360, height: 3, fill: '#F59E0B', opacity: 0.6, originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'rect', left: 120, top: 1594, width: 200, height: 3, fill: '#F59E0B', opacity: 0.6, originX: 'left', originY: 'top', selectable: false, evented: false },
                { type: 'textbox', left: 120, top: 188, width: 900, text: 'TIPS UMRAH', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#F59E0B', charSpacing: 180, originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 120, top: 548, width: 900, text: 'Judul Konten\nCarousel Anda', fontSize: 90, fontFamily: 'Dancing Script', fontWeight: '800', fill: '#0F172A', lineHeight: 1.2, originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 120, top: 1016, width: 900, text: 'Kalimat pendukung yang menggambarkan isi carousel ini.', fontSize: 28, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 'normal', fill: '#64748B', lineHeight: 1.55, originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 80, top: 1758, width: 300, text: 'ALFATIH DUNIA WISATA', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fill: '#FFFFFF', charSpacing: 150, originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 400, top: 1758, width: 640, text: 'adwisata.com  |  @alfatih.umroh  |  +62 815-164-222-5', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fill: '#FFFFFF', textAlign: 'right', originX: 'left', originY: 'top', editable: true },
                { type: 'textbox', left: 60, top: 1818, width: 960, text: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU) No. Izin: 1234/2024', fontSize: 16, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '400', fill: '#FFFFFF', textAlign: 'center', originX: 'left', originY: 'top', editable: true },
            ]
        }
    },
```

- [ ] **Step 4: Filter cover templates from the "Pilih Template" grid**

In `src/pages/admin/PosterMaker.tsx`, find the `NewDesignModal` component's `visibleStarters` computation (around line 198):

```typescript
// Before:
const visibleStarters = starterTemplates.filter(t =>
    t.aspectRatio === size && (typeFilter === 'All' || t.type === typeFilter)
);

// After:
const visibleStarters = starterTemplates.filter(t =>
    t.aspectRatio === size &&
    (typeFilter === 'All' || t.type === typeFilter) &&
    !t.id.startsWith('content-cover-')
);
```

- [ ] **Step 5: Verify in browser**

```bash
npm run dev
```

1. Open PosterMaker → "Buat / Ganti Desain"
2. Filter by "Content" — only "Tips Umrah (Post)" and "Tips Umrah (Story)" visible, no cover templates
3. Pick "Tips Umrah (Post)" — right sidebar shows **AI tab** (previously it was hidden because `getTemplateType` returned `'blank'`)
4. AI tab now shows (will be empty for `content` case until Task 4 adds the button — that's expected)

- [ ] **Step 6: Commit**

```bash
git add services/posterAutofillService.ts \
        src/components/admin/PosterMaker/TemplatePanel.tsx \
        src/pages/admin/PosterMaker.tsx
git commit -m "feat: add content-cover templates and content TemplateType"
```

---

## Task 4: `ContentPosterModal` Component

**Files:**
- Create: `src/components/admin/PosterMaker/ContentPosterModal.tsx`

**Interfaces:**
- Consumes: `generateContentPoster` from `services/contentPosterService`
- Consumes: `useToast` from `src/components/admin/ui`
- Produces: `ContentPosterModal` default export
- Produces props: `{ initialAspectRatio, onClose, onApply(slides, aspectRatio, category) }`

- [ ] **Step 1: Create the modal component**

```tsx
// src/components/admin/PosterMaker/ContentPosterModal.tsx
import React, { useState } from 'react';
import { X, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { ContentSlide, CoverSlide, TipSlide, generateContentPoster } from '../../../../services/contentPosterService';
import { useToast } from '../ui';

interface ContentPosterModalProps {
    initialAspectRatio: 'post' | 'story'
    onClose: () => void
    onApply: (slides: ContentSlide[], aspectRatio: 'post' | 'story', category: string) => void
}

const ContentPosterModal: React.FC<ContentPosterModalProps> = ({
    initialAspectRatio, onClose, onApply,
}) => {
    const toast = useToast();
    const [step, setStep] = useState<'input' | 'review'>('input');
    const [topic, setTopic] = useState('');
    const [category, setCategory] = useState('TIPS UMRAH');
    const [notes, setNotes] = useState('');
    const [aspectRatio, setAspectRatio] = useState<'post' | 'story'>(initialAspectRatio);
    const [slides, setSlides] = useState<ContentSlide[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);

    const handleGenerate = async () => {
        if (!topic.trim()) {
            toast('warning', 'Masukkan topik terlebih dahulu.');
            return;
        }
        setIsGenerating(true);
        try {
            const result = await generateContentPoster(
                topic.trim(),
                category.trim() || 'TIPS UMRAH',
                notes.trim() || undefined
            );
            setSlides(result);
            setStep('review');
        } catch (err) {
            toast('error', err instanceof Error ? err.message : 'Gagal membuat konten AI.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRegenerateSlide = async (slideIndex: number) => {
        setRegeneratingIndex(slideIndex);
        try {
            const result = await generateContentPoster(
                topic.trim(),
                category.trim() || 'TIPS UMRAH',
                notes.trim() || undefined,
                slideIndex
            );
            setSlides(prev => prev.map((s, i) => i === slideIndex ? result[0] : s));
        } catch (err) {
            toast('error', err instanceof Error ? err.message : 'Gagal meregenerasi slide.');
        } finally {
            setRegeneratingIndex(null);
        }
    };

    const updateSlideField = (index: number, field: string, value: string) => {
        setSlides(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <h2 className="text-base font-bold text-gray-900">
                            {step === 'input' ? 'Buat Konten AI' : 'Review Copywriting'}
                        </h2>
                        {step === 'review' && (
                            <span className="text-xs text-gray-400 ml-1">{slides.length} slide</span>
                        )}
                    </div>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 transition">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {step === 'input' ? (
                        <div className="space-y-4">

                            {/* Topic */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                    Topik <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={e => setTopic(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleGenerate(); }}
                                    placeholder="misal: 5 Tips membawa anak saat Umrah"
                                    className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors placeholder:text-gray-300"
                                    autoFocus
                                />
                                <p className="text-[11px] text-gray-400 mt-1">
                                    AI membaca jumlah slide dari topik — misal "5 Tips" → 6 slide (1 cover + 5 tips)
                                </p>
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                    Label Kategori
                                </label>
                                <input
                                    type="text"
                                    value={category}
                                    onChange={e => setCategory(e.target.value.toUpperCase())}
                                    placeholder="TIPS UMRAH"
                                    className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors placeholder:text-gray-300 tracking-widest font-semibold"
                                />
                                <p className="text-[11px] text-gray-400 mt-1">
                                    Muncul di bagian atas setiap slide — misal: PENGINGAT ISLAMI, TIPS HAJI
                                </p>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                    Catatan Tambahan{' '}
                                    <span className="text-gray-400 font-normal normal-case">(opsional)</span>
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="misal: target ibu muda dengan anak balita, gaya bahasa ringan dan tidak formal"
                                    rows={3}
                                    className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors placeholder:text-gray-300 resize-none"
                                />
                            </div>

                            {/* Aspect ratio */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                    Ukuran Slide
                                </label>
                                <div className="flex gap-2">
                                    {(['post', 'story'] as const).map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setAspectRatio(s)}
                                            className={`flex-1 border-2 rounded-xl p-3 text-center transition-all ${
                                                aspectRatio === s
                                                    ? 'border-primary bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className={`text-xl font-black leading-none ${aspectRatio === s ? 'text-primary' : 'text-gray-400'}`}>
                                                {s === 'post' ? '4:5' : '9:16'}
                                            </div>
                                            <div className={`text-[10px] font-semibold mt-1 ${aspectRatio === s ? 'text-primary' : 'text-gray-400'}`}>
                                                {s === 'post' ? 'Post · 1080×1350' : 'Story · 1080×1920'}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {slides.map((slide, index) => {
                                const isCover = slide.slideType === 'cover';
                                const isRegenerating = regeneratingIndex === index;
                                return (
                                    <div key={index} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                                                {isCover ? '✦ Cover' : `Tip ${(slide as TipSlide).number}`}
                                            </span>
                                            <button
                                                onClick={() => handleRegenerateSlide(index)}
                                                disabled={isRegenerating || regeneratingIndex !== null || isGenerating}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-gray-500 hover:text-primary border border-gray-200 hover:border-primary rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                <RefreshCw className={`w-3 h-3 ${isRegenerating ? 'animate-spin' : ''}`} />
                                                Regenerate
                                            </button>
                                        </div>

                                        {isRegenerating ? (
                                            <div className="flex items-center gap-2 py-4 text-gray-400">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span className="text-sm">Menulis ulang slide...</span>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <input
                                                    type="text"
                                                    value={isCover ? (slide as CoverSlide).title : (slide as TipSlide).title}
                                                    onChange={e => updateSlideField(index, 'title', e.target.value)}
                                                    placeholder="Judul"
                                                    className="w-full text-sm font-semibold border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                                                />
                                                <textarea
                                                    value={isCover ? (slide as CoverSlide).subtitle : (slide as TipSlide).body}
                                                    onChange={e => updateSlideField(index, isCover ? 'subtitle' : 'body', e.target.value)}
                                                    placeholder={isCover ? 'Subjudul' : 'Isi / penjelasan'}
                                                    rows={3}
                                                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors resize-none"
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 px-6 py-4 border-t border-gray-200 flex-shrink-0">
                    {step === 'input' ? (
                        <>
                            <button
                                onClick={onClose}
                                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating || !topic.trim()}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGenerating
                                    ? <><Loader2 className="w-4 h-4 animate-spin" />Generating...</>
                                    : <><Sparkles className="w-4 h-4" />Generate</>
                                }
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => setStep('input')}
                                disabled={isGenerating}
                                className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-40"
                            >
                                ← Ubah Input
                            </button>
                            <button
                                onClick={() => onApply(slides, aspectRatio, category.trim() || 'TIPS UMRAH')}
                                disabled={regeneratingIndex !== null}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-blue-600 transition disabled:opacity-50"
                            >
                                <Sparkles className="w-4 h-4" />
                                Terapkan ke Kanvas
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContentPosterModal;
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | head -30
```

Expected: no type errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/PosterMaker/ContentPosterModal.tsx
git commit -m "feat: add ContentPosterModal component"
```

---

## Task 5: Wire Modal into `PosterMaker.tsx`

**Files:**
- Modify: `src/pages/admin/PosterMaker.tsx`

**Interfaces:**
- Consumes: `ContentPosterModal` from `./ContentPosterModal`
- Consumes: `ContentSlide`, `CoverSlide`, `TipSlide` from `services/contentPosterService`

- [ ] **Step 1: Add imports at the top of `PosterMaker.tsx`**

After the existing import block, add:

```typescript
import ContentPosterModal from '../../components/admin/PosterMaker/ContentPosterModal';
import { ContentSlide, CoverSlide, TipSlide } from '../../../services/contentPosterService';
```

- [ ] **Step 2: Add modal state**

In the `PosterMaker` component, near the other `useState` declarations (around line 378), add:

```typescript
const [isContentModalOpen, setIsContentModalOpen] = useState(false);
```

- [ ] **Step 3: Add `content` case to `renderAiInputs()`**

Find `renderAiInputs()` (around line 1056). Add a new `case 'content':` before `default`:

```typescript
        case 'content':
            return (
                <button
                    onClick={() => setIsContentModalOpen(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition"
                >
                    <Sparkles className="w-4 h-4" />
                    Buat Konten AI
                </button>
            );
        default:
```

- [ ] **Step 4: Add `handleContentPosterApply`**

Add this function inside the `PosterMaker` component, near `handleGenerateAndApply` (around line 935):

```typescript
    const handleContentPosterApply = (
        contentSlides: ContentSlide[],
        newAspectRatio: 'post' | 'story',
        category: string,
    ) => {
        setIsContentModalOpen(false);
        setCanvasSize(newAspectRatio);

        const coverTemplateId = newAspectRatio === 'post' ? 'content-cover-post' : 'content-cover-story';
        const tipTemplateId = newAspectRatio === 'post' ? 'content-post' : 'content-story';

        const coverTemplate = starterTemplates.find(t => t.id === coverTemplateId);
        const tipTemplate = starterTemplates.find(t => t.id === tipTemplateId);

        if (!coverTemplate || !tipTemplate) {
            toast('error', 'Template tidak ditemukan.');
            return;
        }

        const newSlides = contentSlides.map((slide, idx) => {
            const isCover = slide.slideType === 'cover';
            const baseTemplate = isCover ? coverTemplate : tipTemplate;
            const slideJson = JSON.parse(JSON.stringify(baseTemplate.json));

            // Inject category label (charSpacing 180, fill '#F59E0B')
            const catObj = slideJson.objects.find(
                (o: any) => o.charSpacing === 180 && o.fill === '#F59E0B'
            );
            if (catObj) catObj.text = category;

            if (isCover) {
                const coverSlide = slide as CoverSlide;
                // Title: Dancing Script
                const titleObj = slideJson.objects.find((o: any) => o.fontFamily === 'Dancing Script');
                if (titleObj) titleObj.text = coverSlide.title;
                // Subtitle: starts with 'Kalimat pendukung'
                const subObj = slideJson.objects.find(
                    (o: any) => o.text && o.text.startsWith('Kalimat pendukung')
                );
                if (subObj) subObj.text = coverSlide.subtitle;
            } else {
                const tipSlide = slide as TipSlide;
                // Number: text '01'
                const numObj = slideJson.objects.find((o: any) => o.text === '01');
                if (numObj) numObj.text = String(tipSlide.number).padStart(2, '0');
                // Title: Dancing Script
                const titleObj = slideJson.objects.find((o: any) => o.fontFamily === 'Dancing Script');
                if (titleObj) titleObj.text = tipSlide.title;
                // Body: starts with 'Sebelum berangkat'
                const bodyObj = slideJson.objects.find(
                    (o: any) => o.text && o.text.startsWith('Sebelum berangkat')
                );
                if (bodyObj) bodyObj.text = tipSlide.body;
            }

            return { id: `slide-${Date.now()}-${idx}`, json: slideJson, thumbnail: '' };
        });

        setSlides(newSlides);
        setActiveSlideIndex(0);
        const firstTemplate = contentSlides[0]?.slideType === 'cover' ? coverTemplate : tipTemplate;
        setLoadedTemplate(firstTemplate);
        setEditingTemplateId(null);
        setEditingTemplateName('');
        setLoadedStarterId(null);
        setTimeout(() => canvasRef.current?.loadTemplate(newSlides[0].json), 200);
        setRightTab('layers');
    };
```

- [ ] **Step 5: Add modal to JSX**

Find the `{/* Context Menu */}` block near the bottom of the PosterMaker JSX (around line 1398). Add the modal just before it:

```tsx
            {/* Content Poster Modal */}
            {isContentModalOpen && (
                <ContentPosterModal
                    initialAspectRatio={canvasSize}
                    onClose={() => setIsContentModalOpen(false)}
                    onApply={handleContentPosterApply}
                />
            )}
```

- [ ] **Step 6: Verify build**

```bash
npm run build 2>&1 | head -30
```

Expected: no type errors.

- [ ] **Step 7: Full E2E test in browser**

```bash
npm run dev
```

Test the complete flow:

1. Open `/admin/poster-maker`
2. Pick "Tips Umrah (Post)" from the template grid
3. AI tab appears in right sidebar — click it
4. "Buat Konten AI" button is visible — click it
5. Modal opens with Input step
6. Fill in: topic = "5 Tips Persiapan Umrah untuk Ibu Hamil", category = "TIPS UMRAH", notes = "gaya bahasa lembut dan supportif"
7. Pick Post (4:5) if not already selected
8. Click Generate — loading spinner shows while AI runs
9. Modal switches to Review step with 6 slide cards (1 cover + 5 tips)
10. Edit one title directly in the input field — changes are reflected
11. Click Regenerate on one tip card — that card shows spinner, then updates with new copy
12. Click "Terapkan ke Kanvas"
13. Modal closes, canvas shows slide 1 (cover) with AI-generated title and subtitle
14. Slide strip at bottom shows 6 slides — click through them to verify all have correct copy
15. Export PNG works for all slides

- [ ] **Step 8: Commit**

```bash
git add src/pages/admin/PosterMaker.tsx
git commit -m "feat: wire ContentPosterModal into PosterMaker — AI Content carousel generation"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Covered in |
|---|---|
| Modal inside PosterMaker | Task 4 + Task 5 |
| Topic input | Task 4: `topic` field |
| Category label override | Task 4: `category` field |
| Notes / extra instructions | Task 4: `notes` field |
| Aspect ratio selector | Task 4: Post/Story toggle |
| AI infers slide count from topic | Task 1: prompt design |
| Cover slide + tip slides | Task 1: `slideType` union; Task 3: cover templates |
| Distinct cover slide layout | Task 3: `content-cover-post/story` templates |
| Per-slide regenerate button | Task 4: `handleRegenerateSlide` + `regenerateIndex` param in Task 1 |
| Editable copy before applying | Task 4: `updateSlideField` + controlled inputs |
| Slides render on canvas | Task 5: `handleContentPosterApply` |
| Cover templates hidden from picker | Task 3: `!t.id.startsWith('content-cover-')` filter |
| canvas resizes to modal's aspect ratio | Task 5: `setCanvasSize(newAspectRatio)` |

**Type consistency check:**

- `ContentSlide` / `CoverSlide` / `TipSlide` defined in `contentPosterService.ts` (Task 2), imported in `ContentPosterModal.tsx` (Task 4) and `PosterMaker.tsx` (Task 5) ✓
- `TemplateType = 'content'` added in `posterAutofillService.ts` (Task 3), used in `getTemplateType()` and `renderAiInputs()` (Task 3 + Task 5) ✓
- `onApply(slides, aspectRatio, category)` signature consistent between modal props (Task 4) and handler (Task 5) ✓
