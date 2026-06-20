# AI Content Poster Modal — Design Spec

**Date:** 2026-06-21
**Status:** Approved

---

## Overview

When the user picks a **Content** template in PosterMaker (e.g. "Tips Umrah Post"), the AI tab shows a "Buat Konten AI" button that opens a two-step modal. The user types a topic (e.g. "5 Tips membawa anak saat Umrah"), optionally customises the category label and adds notes, and the AI generates per-slide copywriting. The user reviews and edits each slide's text inline — including per-slide regeneration — before confirming to render all slides on canvas.

This feature covers both educational tips and Islamic reminders; the category label and notes field give the user control over tone and purpose.

---

## User Flow

1. User picks a Content template (post or story) in the New Design modal.
2. Right sidebar auto-switches to the **AI tab** (existing behaviour for non-blank templates).
3. AI tab for `content` templateType shows a single **"✦ Buat Konten AI"** button (currently `renderAiInputs()` returns `null` for this type).
4. Clicking opens **`ContentPosterModal`** — a full-screen overlay.

### Step 1 — Input

| Field | Default | Required |
|---|---|---|
| Topic | empty | yes |
| Category label | `TIPS UMRAH` | yes |
| Notes / extra instructions | empty | no |
| Aspect ratio | inherited from current canvas | yes |

User clicks **"Generate ✦"** → loading state while edge function runs.

### Step 2 — Review

- Stacked slide cards: **1 cover card** + **N tip cards** (N inferred by AI from topic).
- Each card shows:
  - Slide label: "Cover" or "Tip 1", "Tip 2" …
  - Editable **title** field (single line)
  - Editable **body** field (textarea) — cover card shows **subtitle** instead
  - **"↺ Regenerate"** button — re-calls edge function for that one slide index, replaces only that card's content
- User edits freely before confirming.
- **"Terapkan ke Kanvas"** button at the bottom applies all slides.

---

## Edge Function: `ai-content-poster`

**File:** `supabase/functions/ai-content-poster/index.ts`

**Auth:** Supabase JWT required (admin-only, same as other poster functions).

### Request Body

```typescript
{
  topic: string           // e.g. "5 Tips membawa anak saat Umrah"
  category: string        // e.g. "TIPS UMRAH" or "PENGINGAT ISLAMI"
  notes?: string          // optional extra instructions
  regenerateIndex?: number | null  // null = full generation; 0 = cover, 1–N = tip slide
}
```

### Response Body

```typescript
{
  slides: Array<CoverSlide | TipSlide>
}

interface CoverSlide {
  slideType: 'cover'
  title: string    // main headline
  subtitle: string // supporting line
}

interface TipSlide {
  slideType: 'tip'
  number: number   // 1-based
  title: string    // Dancing Script headline
  body: string     // body paragraph (2–4 sentences)
}
```

### AI Prompt Strategy

- Instruct Gemini to return **only raw JSON** — no markdown fences, no commentary.
- The prompt embeds the full JSON schema so Gemini knows the exact shape.
- AI infers slide count from the topic text (e.g. "5 Tips" → 5 tip slides + 1 cover).
- On `regenerateIndex !== null`, the prompt asks for only that single slide object (same schema, unwrapped from the array).
- On `JSON.parse()` failure, retry once with an explicit "return only the JSON object, nothing else" prefix.
- All copy in **Bahasa Indonesia**, Islami tone.

---

## New Templates (Cover Slide)

Two new entries added to `BASE_TEMPLATES` in `TemplatePanel.tsx`. They share the same visual language as the tip templates (white background, amber top bar, blue footer, left amber vertical strip) but replace the large number + tip layout with a centered cover layout.

### `content-cover-post` (1080 × 1350)

Elements:
- White background `#F8FAFC`
- Amber top bar (14px)
- Blue footer bar (140px from y=1210)
- Left amber vertical strip (6px wide, y=160–1040)
- Category label: `TIPS UMRAH` — amber, top-left, 16px, charSpacing 180
- Main title: Dancing Script 68px, `#0F172A`, centered vertically in the body zone
- Gold separator line between title and subtitle
- Subtitle: 24px `Plus Jakarta Sans`, `#64748B`
- Footer: brand name (white left), contact line (white right), license (white center)

### `content-cover-story` (1080 × 1920)

Same layout scaled to story dimensions.

These templates are **internal only** — excluded from the "Pilih Template" grid by filtering on id prefix `content-cover-`.

---

## New Files

### `services/contentPosterService.ts`

```typescript
export interface ContentSlide { ... }  // CoverSlide | TipSlide union

export const generateContentPoster = async (
  topic: string,
  category: string,
  notes?: string,
  regenerateIndex?: number
): Promise<ContentSlide[]> => { ... }
```

Calls `${SUPABASE_URL}/functions/v1/ai-content-poster` with Bearer token from active session. Returns typed slide array.

### `src/components/admin/PosterMaker/ContentPosterModal.tsx`

Self-contained modal component. Props:

```typescript
interface ContentPosterModalProps {
  isOpen: boolean
  initialAspectRatio: 'post' | 'story'
  onClose: () => void
  onApply: (slides: ContentSlide[], aspectRatio: 'post' | 'story') => void
}
```

Internal state:
- `step: 'input' | 'review'`
- `topic`, `category`, `notes`, `aspectRatio` — form fields
- `slides: ContentSlide[]` — reviewed slide array
- `isGenerating: boolean` — full-modal spinner
- `regeneratingIndex: number | null` — per-card spinner

---

## PosterMaker.tsx Changes

### New state

```typescript
const [isContentModalOpen, setIsContentModalOpen] = useState(false)
```

### `renderAiInputs()` — new `content` case

```typescript
case 'content':
  return (
    <button onClick={() => setIsContentModalOpen(true)} ...>
      ✦ Buat Konten AI
    </button>
  )
```

### `onApply` handler

```typescript
const handleContentPosterApply = (slides: ContentSlide[], aspectRatio: 'post' | 'story') => {
  setIsContentModalOpen(false)
  // For each ContentSlide, deep-clone the matching template JSON
  // (content-cover-post/story or content-post/story), inject title/body/number
  // Set slides state, load slide 0 on canvas
}
```

The injection logic follows the same pattern as the existing `generatedSlides` handler (lines 483–523 of PosterMaker.tsx): deep-clone template JSON, find text objects by known marker values, replace with reviewed copy.

---

## Slide-to-Canvas Mapping

| Slide type | Template used | Text nodes replaced |
|---|---|---|
| `cover` | `content-cover-post` / `content-cover-story` | category label, title, subtitle |
| `tip` | `content-post` / `content-story` | category label, number (`01`), title (Dancing Script), body text |

The category label on every slide is taken from the modal's **category** field (not from AI output), so it's consistent across the carousel.

---

## Out of Scope

- Saving/history of generated content (user saves the draft via existing "Simpan Draft" button).
- Generating content for non-Content template types.
- The `onApply` handler **does** call `setCanvasSize(aspectRatio)` when the modal's selection differs from the current canvas — so the canvas resizes to match what the user picked in the modal. This is in-scope; what's out of scope is any additional auto-detection beyond inheriting `initialAspectRatio` from the current canvas.
