# Multi-Canvas Slides & Great Vibes Font Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add horizontal multi-slide carousel support to the PosterMaker (one FabricCanvas, virtual JSON slide store) and set Great Vibes as the default heading font in all starter templates.

**Architecture:** A single `FabricCanvas` stays mounted; slide state is kept as `PosterSlide[]` in `PosterMaker.tsx`. Switching slides snapshots the active canvas to JSON, then loads the next slide's JSON into the same canvas. A new `SlideStrip` component renders the horizontal thumbnail row. Great Vibes is loaded via Google Fonts and inserted into the font picker and template heading textboxes.

**Tech Stack:** React 18, TypeScript, Fabric.js v7, Tailwind CSS (CDN), Supabase, no test framework (verify manually in browser via `npm run dev`).

## Global Constraints

- Tailwind stays CDN-based — no PostCSS migration.
- All slides in one work share the same `canvasSize` (`post` = 1080×1350, `story` = 1080×1920).
- Templates remain single-canvas; multi-slide lives at the draft/work level only.
- Font load: Great Vibes weight 400 only (Google Fonts doesn't offer bold variants).
- Heading textboxes to update: `fontSize >= 48` AND `fontWeight === '800'` in `BASE_TEMPLATES`.
- Minimum 1 slide per work; delete hidden when `slides.length === 1`.
- No max slide count enforced in the editor.
- Bahasa Indonesia UI copy for all new labels.
- Dev server: `npm run dev` at `http://localhost:3000`.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/types/poster.ts` | Modify | Add `PosterSlide`, update `PosterDraft` |
| `index.html` | Modify | Add Google Fonts link for Great Vibes |
| `src/components/admin/PosterMaker/PropertiesPanel.tsx` | Modify | Add `'Great Vibes'` to `GOOGLE_FONTS` |
| `src/components/admin/PosterMaker/TemplatePanel.tsx` | Modify | Update heading `fontFamily` to `'Great Vibes, cursive'` |
| `src/components/admin/PosterMaker/SlideStrip.tsx` | Create | Horizontal slide thumbnail strip UI |
| `src/pages/admin/PosterMaker.tsx` | Modify | Slide state, operations, layout, export, draft save/load |

---

### Task 1: Load Great Vibes font + add to font picker

**Files:**
- Modify: `index.html`
- Modify: `src/components/admin/PosterMaker/PropertiesPanel.tsx:7-20`

**Interfaces:**
- Produces: `'Great Vibes'` available as a font option in the canvas text properties panel

- [ ] **Step 1: Add Google Fonts link to `index.html`**

Open `index.html`. Find the `<head>` section. Add after the existing font/CDN links (after the Tailwind `<script>` tag, before `</head>`):

```html
<link href="https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap" rel="stylesheet">
```

- [ ] **Step 2: Add `'Great Vibes'` to `GOOGLE_FONTS` in `PropertiesPanel.tsx`**

In `src/components/admin/PosterMaker/PropertiesPanel.tsx`, find the `GOOGLE_FONTS` array (lines 7-20). Add `'Great Vibes'` to the Decorative / Script section:

```typescript
const GOOGLE_FONTS = [
    // Sans-serif
    'Plus Jakarta Sans', 'Inter', 'Poppins', 'Montserrat', 'Raleway',
    'Work Sans', 'DM Sans', 'Nunito', 'Rubik', 'Outfit', 'Lato',
    'Open Sans', 'Ubuntu', 'Figtree',
    // Serif
    'Playfair Display', 'Merriweather', 'Lora', 'Source Serif 4',
    // Display / Bold
    'Bebas Neue', 'Anton', 'Oswald',
    // Decorative / Script
    'Great Vibes', 'Pacifico', 'Dancing Script', 'Caveat',
    // Arabic
    'Amiri', 'Noto Sans Arabic', 'Cairo', 'Tajawal',
];
```

- [ ] **Step 3: Verify in browser**

Run `npm run dev`. Open PosterMaker → pick any template → click a text object → open Properties tab → scroll the font picker. Confirm `Great Vibes` appears in the Decorative / Script section. Select it and confirm the text on canvas renders in the script font.

- [ ] **Step 4: Commit**

```bash
git add index.html src/components/admin/PosterMaker/PropertiesPanel.tsx
git commit -m "feat(poster): add Great Vibes font from Google Fonts to picker"
```

---

### Task 2: Update heading fontFamily in starter templates

**Files:**
- Modify: `src/components/admin/PosterMaker/TemplatePanel.tsx`

**Interfaces:**
- Consumes: `'Great Vibes'` font loaded globally (Task 1)
- Produces: All `BASE_TEMPLATES` title textboxes render in Great Vibes on canvas load

**Rule:** Any textbox object in `BASE_TEMPLATES` with `fontSize >= 48` AND `fontWeight === '800'` is a heading → change its `fontFamily` to `'Great Vibes, cursive'`.

- [ ] **Step 1: Find all heading textboxes in `BASE_TEMPLATES`**

In `TemplatePanel.tsx`, search for the pattern `fontSize: 5` (covers 50, 54, 58) and `fontSize: 4[89]` combined with `fontWeight: '800'`. Each match is a heading textbox.

For every matching textbox object, change:
```
fontFamily: 'Plus Jakarta Sans, sans-serif',
```
to:
```
fontFamily: 'Great Vibes, cursive',
```

Apply this to ALL templates in `BASE_TEMPLATES` — the Conversion, Tour Promotion, Documentation, and Content templates all have a main title textbox with large fontSize + fontWeight '800'.

- [ ] **Step 2: Verify in browser**

Run `npm run dev`. Open PosterMaker → Buat Desain Baru → pick `Brosur Paket Umrah (Post)` → confirm the main title ("Umrah Premium Syawal 1447H") renders in Great Vibes on canvas. Repeat for one Story template. Confirm body text / CTA / footer text remain in Plus Jakarta Sans.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/PosterMaker/TemplatePanel.tsx
git commit -m "feat(poster): set Great Vibes as default heading font in starter templates"
```

---

### Task 3: Add `PosterSlide` type + update `PosterDraft` + `normalizeDraft`

**Files:**
- Modify: `src/types/poster.ts`
- Modify: `src/pages/admin/PosterMaker.tsx` (types section + `loadDraftsFromStorage`)

**Interfaces:**
- Produces: `PosterSlide` type importable from `src/types/poster.ts`
- Produces: `normalizeDraft(raw)` function in `PosterMaker.tsx` that converts old single-canvas drafts to `slides` format

- [ ] **Step 1: Add `PosterSlide` to `src/types/poster.ts`**

Open `src/types/poster.ts` (currently has `AspectRatio`, `LayoutType`, `LayoutOptions`, `TemplateConfig`). Add at the bottom:

```typescript
export interface PosterSlide {
    id: string;
    json: any;
    thumbnail: string;
}
```

- [ ] **Step 2: Update `PosterDraft` interface in `PosterMaker.tsx`**

In `src/pages/admin/PosterMaker.tsx`, find the `PosterDraft` interface (around line 21):

Replace:
```typescript
interface PosterDraft {
    id: string;
    name: string;
    json: any;
    thumbnail: string;
    created_at: string;
}
```

With:
```typescript
interface PosterDraft {
    id: string;
    name: string;
    slides: PosterSlide[];
    canvasSize: CanvasSize;
    created_at: string;
}
```

Also add the import at the top of `PosterMaker.tsx` (add `PosterSlide` to the existing poster types import):
```typescript
import { PosterSlide } from '../../../types/poster';
```

- [ ] **Step 3: Add `normalizeDraft` function in `PosterMaker.tsx`**

After the `MAX_DRAFTS` constant (around line 30), add:

```typescript
function normalizeDraft(raw: any): PosterDraft {
    if (Array.isArray(raw.slides)) return raw as PosterDraft;
    const canvasSize: CanvasSize =
        raw.json?.width === 1080 && raw.json?.height === 1920 ? 'story' : 'post';
    return {
        id: raw.id,
        name: raw.name,
        slides: [{ id: '1', json: raw.json, thumbnail: raw.thumbnail ?? '' }],
        canvasSize,
        created_at: raw.created_at,
    };
}
```

- [ ] **Step 4: Update `loadDraftsFromStorage` to use `normalizeDraft`**

Find `loadDraftsFromStorage` (around line 32):

Replace:
```typescript
function loadDraftsFromStorage(): PosterDraft[] {
    try { return JSON.parse(localStorage.getItem(DRAFTS_KEY) ?? '[]'); }
    catch { return []; }
}
```

With:
```typescript
function loadDraftsFromStorage(): PosterDraft[] {
    try {
        const raw: any[] = JSON.parse(localStorage.getItem(DRAFTS_KEY) ?? '[]');
        return raw.map(normalizeDraft);
    } catch { return []; }
}
```

- [ ] **Step 5: Verify TypeScript compiles**

Run `npm run build` and confirm no TypeScript errors related to `PosterSlide` or `PosterDraft`. (Runtime verification comes in Task 4.)

- [ ] **Step 6: Commit**

```bash
git add src/types/poster.ts src/pages/admin/PosterMaker.tsx
git commit -m "feat(poster): add PosterSlide type and normalizeDraft for multi-slide drafts"
```

---

### Task 4: Slide state, operations, and init handler updates in `PosterMaker.tsx`

**Files:**
- Modify: `src/pages/admin/PosterMaker.tsx`

**Interfaces:**
- Consumes: `PosterSlide` from `src/types/poster.ts` (Task 3)
- Produces: `slides`, `activeSlideIndex`, `snapshotActiveSlide()`, `switchToSlide()`, `handleAddSlide()`, `handleDuplicateSlide()`, `handleDeleteSlide()` — consumed by Task 5 (SlideStrip)

- [ ] **Step 1: Add slide state variables**

In `PosterMaker.tsx`, after the existing state declarations (around line 361, after `const [zoom, setZoom] = useState(0.35)`), add:

```typescript
const [slides, setSlides] = useState<PosterSlide[]>([]);
const [activeSlideIndex, setActiveSlideIndex] = useState(0);
```

- [ ] **Step 2: Add `snapshotActiveSlide` helper**

Add after the `generateThumbnail` function (around line 710):

```typescript
const snapshotActiveSlide = (): PosterSlide[] => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas || slides.length === 0) return slides;
    const json = canvas.toJSON();
    const thumbnail = generateThumbnail() ?? '';
    const updated = slides.map((s, i) =>
        i === activeSlideIndex ? { ...s, json, thumbnail } : s
    );
    setSlides(updated);
    return updated;
};
```

- [ ] **Step 3: Add `switchToSlide` function**

Add after `snapshotActiveSlide`:

```typescript
const switchToSlide = (newIndex: number) => {
    if (newIndex === activeSlideIndex) return;
    const updated = snapshotActiveSlide();
    setActiveSlideIndex(newIndex);
    setTimeout(() => canvasRef.current?.loadTemplate(updated[newIndex].json), 100);
};
```

- [ ] **Step 4: Add `handleAddSlide` function**

```typescript
const handleAddSlide = () => {
    const blankJson = {
        version: '7.2.0',
        width: 1080,
        height: canvasSize === 'post' ? 1350 : 1920,
        objects: [],
        background: '#ffffff',
    };
    const newSlide: PosterSlide = { id: `${Date.now()}`, json: blankJson, thumbnail: '' };
    const updated = snapshotActiveSlide();
    const newSlides = [...updated, newSlide];
    setSlides(newSlides);
    const newIndex = newSlides.length - 1;
    setActiveSlideIndex(newIndex);
    setTimeout(() => canvasRef.current?.loadTemplate(blankJson), 100);
};
```

- [ ] **Step 5: Add `handleDuplicateSlide` function**

```typescript
const handleDuplicateSlide = (index: number) => {
    const updated = snapshotActiveSlide();
    const clone: PosterSlide = { ...updated[index], id: `${Date.now()}` };
    const newSlides = [...updated.slice(0, index + 1), clone, ...updated.slice(index + 1)];
    setSlides(newSlides);
    const newIndex = index + 1;
    setActiveSlideIndex(newIndex);
    setTimeout(() => canvasRef.current?.loadTemplate(clone.json), 100);
};
```

- [ ] **Step 6: Add `handleDeleteSlide` function**

```typescript
const handleDeleteSlide = (index: number) => {
    if (slides.length <= 1) return;
    const updated = snapshotActiveSlide();
    const newSlides = updated.filter((_, i) => i !== index);
    setSlides(newSlides);
    const newIndex = Math.min(index, newSlides.length - 1);
    setActiveSlideIndex(newIndex);
    setTimeout(() => canvasRef.current?.loadTemplate(newSlides[newIndex].json), 100);
};
```

- [ ] **Step 7: Update `handlePickBlank` to initialise slides**

Find `handlePickBlank` (around line 569). After `setCanvasSize(size)` and before `setTimeout(...)`, add:

```typescript
const blankJson = {
    version: '7.2.0',
    width: 1080,
    height: size === 'post' ? 1350 : 1920,
    objects: [],
    background: '#ffffff',
};
setSlides([{ id: `${Date.now()}`, json: blankJson, thumbnail: '' }]);
setActiveSlideIndex(0);
```

- [ ] **Step 8: Update `handlePickTemplate` to initialise slides**

Find `handlePickTemplate` (around line 622). After `setCanvasSize(template.aspectRatio)` (or after `setCanvasSize(override.aspect_ratio)` in the override branch), add:

In the **override branch** (when `override` exists):
```typescript
setSlides([{ id: `${Date.now()}`, json: override.canvas_json, thumbnail: '' }]);
setActiveSlideIndex(0);
```

In the **normal branch**:
```typescript
setSlides([{ id: `${Date.now()}`, json: template.json, thumbnail: '' }]);
setActiveSlideIndex(0);
```

- [ ] **Step 9: Update `handlePickCustomTemplate` to initialise slides**

Find `handlePickCustomTemplate` (around line 646). After `setCanvasSize(t.aspect_ratio)`, add:

```typescript
setSlides([{ id: `${Date.now()}`, json: t.canvas_json, thumbnail: '' }]);
setActiveSlideIndex(0);
```

- [ ] **Step 10: Update `handlePickDraft` to initialise slides**

Find `handlePickDraft` (around line 660). Replace the `setCanvasSize(...)` lines and the canvas-size detection logic with:

```typescript
const draft = normalizeDraft(d);   // d is the PosterDraft argument
setSlides(draft.slides);
setActiveSlideIndex(0);
setCanvasSize(draft.canvasSize);
setTimeout(() => canvasRef.current?.loadTemplate(draft.slides[0].json), 200);
```

Make sure to remove the old `canvas.toJSON()` size-detection `if` block that was previously inside `handlePickDraft`.

- [ ] **Step 11: Verify no TypeScript errors**

Run `npm run build`. Confirm zero errors.

- [ ] **Step 12: Smoke test in browser**

Run `npm run dev`. Open PosterMaker → pick a template → the canvas loads as before. No visible change yet (SlideStrip not wired — Task 5). Open the browser console and confirm no runtime errors.

- [ ] **Step 13: Commit**

```bash
git add src/pages/admin/PosterMaker.tsx
git commit -m "feat(poster): add slide state and operations for multi-canvas support"
```

---

### Task 5: `SlideStrip` component + wire into PosterMaker layout

**Files:**
- Create: `src/components/admin/PosterMaker/SlideStrip.tsx`
- Modify: `src/pages/admin/PosterMaker.tsx` (import + layout)

**Interfaces:**
- Consumes: `slides`, `activeSlideIndex`, `canvasSize`, `switchToSlide`, `handleAddSlide`, `handleDuplicateSlide`, `handleDeleteSlide` from Task 4
- Produces: visible horizontal slide strip between the canvas and CanvasZoom bar

- [ ] **Step 1: Create `SlideStrip.tsx`**

Create `src/components/admin/PosterMaker/SlideStrip.tsx` with the full content:

```tsx
import React from 'react';
import { Plus, Copy, Trash2 } from 'lucide-react';
import { PosterSlide } from '../../../types/poster';
import { CanvasSize } from './FabricCanvas';

interface SlideStripProps {
    slides: PosterSlide[];
    activeIndex: number;
    canvasSize: CanvasSize;
    onSwitch: (index: number) => void;
    onAdd: () => void;
    onDuplicate: (index: number) => void;
    onDelete: (index: number) => void;
}

const SlideStrip: React.FC<SlideStripProps> = ({
    slides, activeIndex, canvasSize, onSwitch, onAdd, onDuplicate, onDelete,
}) => {
    const chipWidth = canvasSize === 'post' ? 56 : 40;
    const aspectRatio = canvasSize === 'post' ? '4/5' : '9/16';

    return (
        <div className="flex items-end gap-2 py-2 px-1 overflow-x-auto flex-shrink-0 border-t border-gray-100">
            {slides.map((slide, index) => (
                <div
                    key={slide.id}
                    className="relative flex-shrink-0 group"
                    style={{ width: chipWidth }}
                >
                    <button
                        onClick={() => onSwitch(index)}
                        className={`w-full rounded overflow-hidden border-2 transition-all ${
                            index === activeIndex
                                ? 'border-primary ring-2 ring-primary/20'
                                : 'border-gray-200 hover:border-gray-400'
                        }`}
                        style={{ aspectRatio, display: 'block' }}
                        title={`Slide ${index + 1}`}
                    >
                        {slide.thumbnail
                            ? <img src={slide.thumbnail} alt={`Slide ${index + 1}`} className="w-full h-full object-cover" />
                            : <div className="w-full h-full bg-gray-100" style={{ aspectRatio }} />
                        }
                    </button>

                    {/* Slide number badge */}
                    <span className="absolute bottom-1 left-1 text-[8px] font-bold text-white bg-black/50 px-1 rounded leading-none pointer-events-none">
                        {index + 1}
                    </span>

                    {/* Hover actions */}
                    <div className="absolute -top-1 -right-1 hidden group-hover:flex flex-col gap-0.5 z-10">
                        <button
                            onClick={e => { e.stopPropagation(); onDuplicate(index); }}
                            className="w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center shadow"
                            title="Duplikat slide"
                        >
                            <Copy className="w-2.5 h-2.5" />
                        </button>
                        {slides.length > 1 && (
                            <button
                                onClick={e => { e.stopPropagation(); onDelete(index); }}
                                className="w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center shadow"
                                title="Hapus slide"
                            >
                                <Trash2 className="w-2.5 h-2.5" />
                            </button>
                        )}
                    </div>
                </div>
            ))}

            {/* Add slide button */}
            <button
                onClick={onAdd}
                className="flex-shrink-0 border-2 border-dashed border-gray-300 rounded hover:border-primary hover:bg-emerald-50 transition-all flex items-center justify-center"
                style={{ width: chipWidth, aspectRatio }}
                title="Tambah slide"
            >
                <Plus className="w-4 h-4 text-gray-400" />
            </button>
        </div>
    );
};

export default SlideStrip;
```

- [ ] **Step 2: Import `SlideStrip` in `PosterMaker.tsx`**

Add to the import block in `PosterMaker.tsx`:
```typescript
import SlideStrip from '../../components/admin/PosterMaker/SlideStrip';
```

- [ ] **Step 3: Wire `SlideStrip` into the layout**

In `PosterMaker.tsx`, find the center column section (the `<div className="lg:col-span-9 ...">` block around line 1055). The current structure is:

```tsx
<div className="lg:col-span-9 lg:h-full flex flex-col relative">
    {/* freehand strip */}
    <div ...> {/* canvas + context menu */}
        <FabricCanvas ... />
    </div>
    <CanvasZoom ... />
</div>
```

Add `SlideStrip` between the canvas div and `CanvasZoom`:

```tsx
<div className="lg:col-span-9 lg:h-full flex flex-col relative">
    {/* Freehand brush strip */}
    {isFreehandActive && ( ... )}

    <div className="flex-1 min-h-0 flex flex-col" ...>
        <FabricCanvas ... />
    </div>

    {/* Slide strip — only show once a design is open */}
    {slides.length > 0 && (
        <SlideStrip
            slides={slides}
            activeIndex={activeSlideIndex}
            canvasSize={canvasSize}
            onSwitch={switchToSlide}
            onAdd={handleAddSlide}
            onDuplicate={handleDuplicateSlide}
            onDelete={handleDeleteSlide}
        />
    )}

    <CanvasZoom ... />
</div>
```

- [ ] **Step 4: Verify in browser**

Run `npm run dev`. Open PosterMaker → pick any template. Confirm:
- Slide strip appears below the canvas showing 1 slide chip with no thumbnail (thumbnail is empty until you switch).
- Click "+ Add Slide" → a blank white canvas loads, strip shows 2 chips, chip 2 is active.
- Click chip 1 → original template reloads, chip 1 is highlighted.
- Hover chip → duplicate and delete icons appear. Click duplicate → new chip added after it, canvas loads the copy.
- With 2+ slides: hover → delete icon appears. Click delete → slide removed, adjacent slide loads.
- With 1 slide: hover → delete icon is hidden.
- Switching slides snapshots thumbnails: switch away and back, chip 1 now shows a thumbnail.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/PosterMaker/SlideStrip.tsx src/pages/admin/PosterMaker.tsx
git commit -m "feat(poster): add SlideStrip component for horizontal multi-slide navigation"
```

---

### Task 6: Multi-slide export + updated draft save/load

**Files:**
- Modify: `src/pages/admin/PosterMaker.tsx` (handleExport, handleSaveDraft, handlePickDraft)

**Interfaces:**
- Consumes: `slides`, `activeSlideIndex`, `snapshotActiveSlide()` from Task 4
- Produces: per-slide PNG downloads; drafts saved/loaded with full `slides` array

- [ ] **Step 1: Update `handleExport` for multi-slide loop**

Find `handleExport` (around line 552). Replace the entire function with:

```typescript
const handleExport = async () => {
    setIsExporting(true);
    const timestamp = Date.now();
    try {
        const updated = snapshotActiveSlide();
        const currentIndex = activeSlideIndex;

        for (let i = 0; i < updated.length; i++) {
            canvasRef.current?.loadTemplate(updated[i].json);
            // Wait for Fabric.js to finish rendering
            await new Promise<void>(resolve => setTimeout(resolve, 300));

            const dataUrl = await canvasRef.current?.exportPng();
            if (dataUrl) {
                const link = document.createElement('a');
                link.download = updated.length === 1
                    ? `alfatih-poster-${canvasSize}-${timestamp}.png`
                    : `alfatih-poster-slide-${i + 1}-${timestamp}.png`;
                link.href = dataUrl;
                link.click();
            }
            // Small gap between browser download triggers
            await new Promise<void>(resolve => setTimeout(resolve, 100));
        }

        // Restore active slide
        canvasRef.current?.loadTemplate(updated[currentIndex].json);
    } finally {
        setIsExporting(false);
    }
};
```

- [ ] **Step 2: Update `handleSaveDraft` for multi-slide**

Find `handleSaveDraft` (around line 677). Replace with:

```typescript
const handleSaveDraft = () => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;
    const updatedSlides = snapshotActiveSlide();
    const newDraft: PosterDraft = {
        id: `${Date.now()}`,
        name: `Draft ${new Date().toLocaleString('id-ID')}`,
        slides: updatedSlides,
        canvasSize,
        created_at: new Date().toISOString(),
    };
    const updated = [newDraft, ...drafts].slice(0, MAX_DRAFTS);
    setDrafts(updated);
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(updated));
    toast('success', 'Draft disimpan.');
};
```

- [ ] **Step 3: Verify draft thumbnail in `NewDesignModal`**

The `NewDesignModal` shows `d.thumbnail` for each draft. Old drafts had a top-level `thumbnail`; new drafts have `slides[0].thumbnail`. Update the draft thumbnail reference in the modal.

In `PosterMaker.tsx`, find the `NewDesignModal` component's draft rendering (around line 233). Change:
```tsx
{d.thumbnail
    ? <img src={d.thumbnail} alt={d.name} className="w-full h-full object-cover" />
    : <div ...><Clock .../></div>
}
```
To:
```tsx
{d.slides[0]?.thumbnail
    ? <img src={d.slides[0].thumbnail} alt={d.name} className="w-full h-full object-cover" />
    : <div className="w-full h-full bg-gray-100 flex items-center justify-center"><Clock className="w-4 h-4 text-gray-300" /></div>
}
```

- [ ] **Step 4: Verify in browser**

Run `npm run dev`. Test the full workflow:

**Draft save/load:**
- Pick a template, add 2 more slides, edit something on each.
- Click "Simpan Draft" → toast confirms.
- Click "Buat / Ganti Desain" → draft appears in the modal with the first slide's thumbnail.
- Click the draft → editor opens with all 3 slides restored in the strip.

**Export:**
- Open a 1-slide design → click Download → one file downloads named `alfatih-poster-post-{timestamp}.png`.
- Add a second slide → click Download → two files download named `alfatih-poster-slide-1-{timestamp}.png` and `alfatih-poster-slide-2-{timestamp}.png`.
- After export, the active slide is restored on canvas.

**Old draft backward compat:**
- If you have old drafts in localStorage (with `json` field, no `slides`), they should load correctly. Open DevTools → Application → LocalStorage → paste an old-format draft string → reload → pick the old draft from the modal → confirms it opens without error.

- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/PosterMaker.tsx
git commit -m "feat(poster): multi-slide export and draft save/load with backward compat"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|-----------------|------|
| All slides share same canvas size | Task 4 (canvasSize shared, no per-slide size) |
| Each slide exports as separate PNG | Task 6 Step 1 |
| Duplicate slide | Task 4 Step 5 |
| Horizontal scroll strip | Task 5 Step 1 (overflow-x-auto) |
| Add blank slide | Task 4 Step 4 |
| Delete slide (min 1) | Task 4 Step 6, SlideStrip hides delete when length=1 |
| Switch slide snapshots active canvas | Task 4 Steps 2–3 |
| Backward compat for old drafts | Task 3 Step 3 (normalizeDraft) |
| Draft thumbnail = slides[0].thumbnail | Task 6 Step 3 |
| Templates remain single-canvas | Tasks 4 Steps 7–10 init with 1 slide |
| Great Vibes in font picker | Task 1 Step 2 |
| Great Vibes as heading default in templates | Task 2 |
| Great Vibes loaded via Google Fonts | Task 1 Step 1 |
| No changes to FabricCanvas/toolbar/panels | Confirmed — zero edits to those files |

All spec requirements covered. No gaps found.
