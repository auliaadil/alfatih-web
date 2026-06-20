# Multi-Canvas Slides & Great Vibes Font — Design Spec

**Date:** 2026-06-20
**Scope:** PosterMaker — multi-slide carousel support (horizontal scroll) + Great Vibes heading font

---

## Overview

Two features shipped together:

1. **Multi-canvas slides** — a single PosterMaker "work" can contain multiple canvas slides, placed horizontally so the user scrolls left/right. Designed for Instagram carousel posts (Tour Promotion, Documentation, Content categories typically span multiple photos).
2. **Great Vibes font** — loaded from Google Fonts, set as the default heading font in all starter poster templates, and exposed in the PropertiesPanel font picker.

---

## 1. Architecture Decision

**Approach: Single FabricCanvas + JSON slide store (virtual slides)**

Keep exactly one `FabricCanvas` component mounted in the DOM at all times. Maintain a `slides: PosterSlide[]` array in state. On slide switch:

1. Snapshot the active canvas → `canvas.toJSON()` + thumbnail → stored in `slides[activeSlideIndex]`
2. Load the new slide's JSON into the same canvas via `canvasRef.current?.loadTemplate(json)`

This requires zero refactoring of `FabricCanvas`, `EditorToolbar`, `LayerPanel`, `PropertiesPanel`, or `CanvasZoom` — they all continue targeting the single active canvas.

Rejected alternatives:
- **Multiple mounted FabricCanvas instances** — heavy DOM/memory, complex ref routing.
- **Fabric.js multi-page trick** — not natively supported in v7, more complexity for no gain.

---

## 2. Data Model

### New Types (in `src/pages/admin/PosterMaker.tsx`)

```typescript
interface PosterSlide {
    id: string;          // Date.now() string
    json: any;           // fabric canvas.toJSON() snapshot
    thumbnail: string;   // low-res JPEG data URL (same as draft thumbnail mechanism)
}

interface PosterDraft {
    id: string;
    name: string;
    slides: PosterSlide[];   // ordered; minimum 1
    canvasSize: CanvasSize;  // all slides share the same size
    created_at: string;
}
```

### Invariants

- All slides in a work share the same `canvasSize` (`post` or `story`). Size cannot be mixed.
- Templates remain **single-canvas**. A template is one slide's JSON. Multi-slide is a work/draft concept only.
- Minimum 1 slide per work. Delete button is hidden when only 1 slide remains.

### Backward Compatibility

Old drafts stored `{ id, name, json, thumbnail, created_at }`. On load, detect and auto-migrate:

```typescript
function normalizeDraft(raw: any): PosterDraft {
    if (raw.slides) return raw;
    return {
        ...raw,
        slides: [{ id: '1', json: raw.json, thumbnail: raw.thumbnail ?? '' }],
        canvasSize: raw.json?.width === 1080 && raw.json?.height === 1920 ? 'story' : 'post',
    };
}
```

---

## 3. State Changes in `PosterMaker.tsx`

Replace:
```typescript
// nothing slide-aware today
```

Add:
```typescript
const [slides, setSlides] = useState<PosterSlide[]>([]);
const [activeSlideIndex, setActiveSlideIndex] = useState(0);
```

Helper — snapshot the active canvas into the slides array (called before any slide switch):
```typescript
const snapshotActiveSlide = () => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas || slides.length === 0) return;
    const json = canvas.toJSON();
    const thumbnail = generateThumbnail() ?? '';
    setSlides(prev => prev.map((s, i) =>
        i === activeSlideIndex ? { ...s, json, thumbnail } : s
    ));
};
```

---

## 4. Slide Operations

### Switch slide
```
snapshotActiveSlide()
setActiveSlideIndex(newIndex)
canvasRef.current?.loadTemplate(slides[newIndex].json)
```
Undo/redo history resets naturally (new template load clears history, same as today).

### Add blank slide
```
new slide = { id: Date.now(), json: blankJson(canvasSize), thumbnail: '' }
setSlides([...slides, newSlide])
switch to slides.length (the new slide)
```
`blankJson(size)` = `{ version: '7.2.0', width: 1080, height: size === 'post' ? 1350 : 1920, objects: [], background: '#ffffff' }`

### Duplicate slide
```
clone = { ...slides[activeSlideIndex], id: Date.now() }
insert clone at activeSlideIndex + 1
switch to activeSlideIndex + 1
```
The duplicated slide loads the same JSON into the canvas — the user immediately gets an editable copy.

### Delete slide
```
remove slides[activeSlideIndex]
newIndex = Math.min(activeSlideIndex, slides.length - 2)
switch to newIndex
```
Delete button is disabled/hidden when `slides.length === 1`.

---

## 5. Slide Strip UI

Location: center column (col-span-9), between the canvas area and `CanvasZoom`.

```
┌─────────────────────────────────────────────────┐
│                  Canvas editor                  │
├─────────────────────────────────────────────────┤
│  [1 🖼] [2 🖼] [3 🖼]  ···  [+ Add Slide]       │  ← horizontal scroll
├─────────────────────────────────────────────────┤
│  Zoom: 35% · Fit                                │
└─────────────────────────────────────────────────┘
```

**Each slide chip:**
- Fixed width (`w-16` or `w-20`), aspect ratio matches canvas size (4:5 for post, 9:16 for story)
- Shows thumbnail image; falls back to a gray placeholder if thumbnail is empty
- Slide number badge in corner
- Active slide: `border-2 border-primary ring-2 ring-primary/20`
- Hover: reveals a `×` delete button (top-right) and a duplicate icon (bottom-right)

**Add Slide button:** `border-2 border-dashed border-gray-300` pill at the end of the strip, always visible.

**Horizontal scroll:** `overflow-x-auto` on the strip container; no max slide count enforced (Instagram allows up to 10, but the editor does not enforce this).

---

## 6. Export

**Single slide:** behavior unchanged — one PNG downloads, file name `alfatih-poster-slide-1-{timestamp}.png`.

**Multi-slide:** sequential export loop:

```
snapshotActiveSlide()
for i in 0..slides.length:
    loadTemplate(slides[i].json)
    await short settle (~100ms)
    dataUrl = await exportPng()
    triggerDownload(`alfatih-poster-slide-${i+1}-${timestamp}.png`, dataUrl)
reload(slides[activeSlideIndex].json)   // restore editing state
```

The existing Download button label stays unchanged. The user sees one download-per-slide triggered sequentially by the browser.

---

## 7. Draft Save & Load

**Save:** `snapshotActiveSlide()` first, then persist:
```typescript
const draft: PosterDraft = {
    id: Date.now().toString(),
    name: `Draft ${new Date().toLocaleString('id-ID')}`,
    slides: currentSlides,   // full array
    canvasSize,
    created_at: new Date().toISOString(),
};
```
Thumbnail shown in "Buat Desain Baru" modal = `slides[0].thumbnail`.

**Load draft:** `normalizeDraft(raw)` → set `slides` → set `canvasSize` → `loadTemplate(slides[0].json)` → `setActiveSlideIndex(0)`.

**Save/Update Template:** saves only `slides[activeSlideIndex].json` (active slide only). Templates remain single-canvas.

---

## 8. Initialisation

**Pick template:** `slides = [{ id: Date.now(), json: template.json, thumbnail: '' }]`, `activeSlideIndex = 0`

**Pick blank:** `slides = [{ id: Date.now(), json: blankJson(size), thumbnail: '' }]`, `activeSlideIndex = 0`

**Pick draft:** `slides = normalizeDraft(draft).slides`, `activeSlideIndex = 0`

---

## 9. Great Vibes Font

### Load

Add to `index.html` `<head>` (alongside existing Tailwind CDN and Inter font links):

```html
<link href="https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap" rel="stylesheet">
```

### Default heading font in templates

In `TemplatePanel.tsx` (`BASE_TEMPLATES` array), all textbox objects that serve as the **main title/heading** — identified by `fontSize >= 48` and `fontWeight: '800'` — switch `fontFamily` from `'Plus Jakarta Sans, sans-serif'` to `'Great Vibes, cursive'`.

Body text, labels, CTA buttons, footer text, and category tags remain `'Plus Jakarta Sans, sans-serif'`.

### Font picker

In `PropertiesPanel.tsx`, add `'Great Vibes'` to the font family dropdown so users can apply it to any text object manually.

---

## 10. Files Changed

| File | Change |
|------|--------|
| `index.html` | Add Google Fonts link for Great Vibes |
| `src/pages/admin/PosterMaker.tsx` | Add `slides`/`activeSlideIndex` state, slide operations, updated draft save/load, updated export loop, `SlideStrip` component |
| `src/components/admin/PosterMaker/TemplatePanel.tsx` | Update heading `fontFamily` to `'Great Vibes, cursive'` for title textboxes in `BASE_TEMPLATES` |
| `src/components/admin/PosterMaker/PropertiesPanel.tsx` | Add Great Vibes to font family options |

No changes to `FabricCanvas.tsx`, `EditorToolbar.tsx`, `LayerPanel.tsx`, `CanvasZoom.tsx`, or any edge functions.

---

## Out of Scope

- Reordering slides via drag-and-drop (can be added later)
- ZIP export of all slides as one archive
- Per-slide canvas size variation
- Slide count enforcement (no Instagram 10-slide cap)
- Template multi-slide support (templates remain single-canvas)
