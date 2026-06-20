# Text Campaign & Poster Maker Integration Implementation Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate Text Campaign with Poster Maker by adding a "Konten Edukasi & Interaksi" type that generates multi-slide text and allows 1-click export to Poster Maker canvases.

**Architecture:** We will update the Supabase Edge Function to support the new prompt. The frontend will parse the text into slides and use `react-router` state to pass the content to the PosterMaker component, which will instantiate Fabric canvases for each slide.

**Tech Stack:** React, TypeScript, Tailwind CSS, Supabase Edge Functions, React Router.

---

### Task 1: Update Edge Function for "konten-edukasi"

**Files:**
- Modify: `supabase/functions/ai-text-campaign/index.ts`

**Step 1: Write the failing test**
(Skipped for Edge Function, proceed to implementation)

**Step 2: Write minimal implementation**

Modify `supabase/functions/ai-text-campaign/index.ts`.
In `RequestBody` interface, change the `type` property:
```typescript
interface RequestBody {
  type: 'paket-wisata' | 'konten-edukasi' | 'instagram'
  channel: 'whatsapp' | 'instagram'
  topic?: string
  audience?: string
  slideCount?: number
  // ... keep other properties
```
Extract these properties inside `Deno.serve`:
```typescript
    const { type, channel, occasion, theme, notes, topic, audience, slideCount } = body
```
Add the block for `type === 'konten-edukasi'`:
```typescript
    } else if (type === 'konten-edukasi') {
      if (!topic) {
        return new Response(JSON.stringify({ error: 'Topic required for konten-edukasi type' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      contextBlock = `Topik: ${topic}\nTarget Audiens: ${audience || 'Umum'}\nJumlah Slide: ${slideCount || 1}`
      
      instructionBlock = `Tulis konten edukasi/interaksi (carousel/poster slides) dengan ketentuan:
- Format jawaban WAJIB menggunakan marker slide seperti ini:
[SLIDE 1]
Judul: ...
Teks: ...
[SLIDE 2]
Judul: ...
Teks: ...
- Buat tepat ${slideCount || 1} slide.
- Slide 1 biasanya sebagai Hook/Judul Utama.
- Slide terakhir biasanya Call to Action.
- Jangan tambahkan teks apa pun di luar blok [SLIDE N].`
    }
```

**Step 3: Commit**
```bash
git add supabase/functions/ai-text-campaign/index.ts
git commit -m "feat(ai): support konten-edukasi type in edge function"
```

---

### Task 2: Update textCampaignService.ts

**Files:**
- Modify: `services/textCampaignService.ts`

**Step 1: Write minimal implementation**

Update `CampaignType` and `GenerateCampaignInput` in `services/textCampaignService.ts`.

```typescript
export type CampaignType = 'paket-wisata' | 'konten-edukasi' | 'instagram'

export interface GenerateCampaignInput {
  type: CampaignType
  channel: CampaignChannel
  package?: TourPackage
  occasion?: string
  occasionPackage?: TourPackage | null
  theme?: string
  notes?: string
  topic?: string
  audience?: string
  slideCount?: number
}
```

**Step 2: Commit**
```bash
git add services/textCampaignService.ts
git commit -m "feat: add konten-edukasi type to service"
```

---

### Task 3: Refactor TextCampaign UI

**Files:**
- Modify: `src/pages/admin/TextCampaign.tsx`

**Step 1: Write minimal implementation**

In `src/pages/admin/TextCampaign.tsx`:
1. Remove `hari-raya` dependencies (state, labels, logic).
2. Add state for `topic`, `audience`, and `slideCount` (default 3).
3. Update `TYPE_LABELS`, `TYPE_BADGE`.
4. Update the Message Type options (Left Panel) with `konten-edukasi`.
5. Update `handleGenerate` to pass the new fields.
6. Split the Left and Right panels based on the new "Brief" and "Draft" UI mockup.
7. Add a function `parseSlides(output: string)` that splits the text by `[SLIDE X]` if it exists.
8. Render the slides individually if it's a multi-slide output.
9. Add the "Desain ke Poster" button, which uses `useNavigate` to route to `/admin/poster-maker` with `{ state: { generatedSlides: parsedSlides } }`.

*(Note: Full UI implementation code will be applied during execution, replacing standard inputs with refined Tailwind layouts as designed).*

**Step 2: Commit**
```bash
git add src/pages/admin/TextCampaign.tsx
git commit -m "feat: refactor Text Campaign UI for Content Poster"
```

---

### Task 4: Handle State in Poster Maker

**Files:**
- Modify: `src/pages/admin/PosterMaker.tsx`

**Step 1: Write minimal implementation**

In `PosterMaker.tsx`:
1. Use `useLocation()` to read `state.generatedSlides`.
2. Wait for the user to select a template (or if a template is already selected, or prompt them to select one).
3. Provide a way to auto-fill the template using `services/posterAutofillService.ts` or directly populating multiple canvases.
4. If `generatedSlides` is present, loop through it and create $N$ instances of the selected template's canvas state, filling in the title/text for each slide.

**Step 2: Commit**
```bash
git add src/pages/admin/PosterMaker.tsx
git commit -m "feat: handle generated slides in Poster Maker"
```
