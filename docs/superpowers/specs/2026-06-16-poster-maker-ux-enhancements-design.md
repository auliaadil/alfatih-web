# Poster Maker UX Enhancements — Design Spec

**Date:** 2026-06-16  
**Status:** Approved

---

## Overview

Enhance the Poster Maker admin page across six areas: layout restructure (canvas-first), new drawing tools, improved font picker, blank canvas + size picker in a new design modal, and layer panel cleanup.

All changes are isolated to the admin Poster Maker area. No backend or database changes required.

---

## 1. Layout Restructure

### Current state
Three-column layout `3 | 6 | 3` where the left col-span-3 holds the "Pilih Template" sidebar at all times. Canvas gets only half the screen width (col-span-6). When `viewState === 'pick-template'` an overlay blocks the canvas.

### New layout
Remove the left sidebar entirely during editing. Change to a two-column layout: **canvas (col-span-9) | right panel (col-span-3)**.

The template picker moves out of the sidebar and into a full-screen modal.

**Files affected:** `src/pages/admin/PosterMaker.tsx`

### Layout grid change
```
Before: grid-cols-12 → [3 left] [6 canvas] [3 right]
After:  grid-cols-12 → [9 canvas] [3 right]  (when editing)
```

The left sidebar (`viewState === 'pick-template'` card) is removed from the JSX. The `viewState` state variable and `'pick-template'` / `'fill-content'` / `'editing'` flow are replaced by a modal-driven flow.

### "Buat / Ganti Desain" button
- Shown in the page header at all times (replaces the old "Ganti Template" sidebar state)
- Label: "Buat / Ganti Desain"
- Opens the New Design Modal

### AI Content panel
Moved from the left sidebar into the right panel as a new `ai` tab (alongside `layers`, `properties`, `assets`, `drafts`). Only shown when a non-blank template is loaded and `editingTemplateId` is null.

---

## 2. New Design Modal

A full-screen modal (`fixed inset-0 z-50`) triggered by the "Buat / Ganti Desain" header button. Also auto-opens on page load when no template/draft is already loaded (e.g. first visit, or after a page refresh with no `location.state`).

### Contents

**Step 1 — Canvas size picker** (top of modal)
- Two toggle cards: `Post 4:5 (1080×1350)` and `Story 9:16 (1080×1920)`
- Default: `post`
- Selecting a size updates `canvasSize` state

**Step 2 — Template grid** (below size picker)
- First card: **"Kanvas Kosong"** — white card with dashed green border and `+` icon
  - On click: closes modal, sets canvas to chosen size with white background, clears `loadedTemplate`. Canvas is immediately editable.
- Remaining cards: existing starter templates (filtered by selected aspect ratio) + custom saved templates
- Each card shows thumbnail and name (same as current left sidebar cards)
- On template click: closes modal, loads template, sets canvas size. Non-blank templates (`templateType !== 'blank'`) surface the AI inputs in the right panel's `ai` tab automatically.

**Footer**
- "Mulai Mendesain →" button — always enabled (Post is pre-selected by default). Clicking it when "Kanvas Kosong" is implicitly selected (no template clicked yet) starts with a blank canvas.

### Behavior notes
- When switching size in the picker, the template grid re-filters to show only templates matching that aspect ratio
- Custom templates always appear before starter templates in the grid
- Modal can be dismissed via the `✕` button only if a canvas is already loaded (i.e. not the initial first-open)

**Files affected:** `src/pages/admin/PosterMaker.tsx`

---

## 3. New Drawing Tools

### 3a. Arrow (`→`)

Added to `EditorToolbar` between the existing Line and Image buttons.

**Implementation:**
- `FabricCanvasRef` gets `addArrow(): void`
- Implemented in `FabricCanvas.tsx` using `fabric.Path` with an SVG arrow path
- Arrow path: horizontal right-pointing arrow centered on canvas, ~300px wide
- Default: `fill: '#1a1a1a'`, no stroke
- Fully selectable, scalable, rotatable like any Fabric object
- Color controlled via Fill Color in Properties panel

```ts
// Arrow SVG path (right-pointing, normalized to ~300×40px bounding box)
const arrowPath = 'M 0 15 L 250 15 L 250 0 L 300 20 L 250 40 L 250 25 L 0 25 Z';
```

**Toolbar button:** `→` icon (Lucide `MoveRight`)

### 3b. Freehand / Pencil (`✏️`)

A **toggle mode** button in the toolbar (not a one-shot insert like other tools).

**Implementation in `FabricCanvas.tsx`:**
- `FabricCanvasRef` gets `setFreehandMode(enabled: boolean): void` and `isFreehandMode(): boolean`
- When enabled: `canvas.isDrawingMode = true`, `canvas.freeDrawingBrush = new PencilBrush(canvas)`
- Brush defaults: `color: '#1a1a1a'`, `width: 4`
- When disabled: `canvas.isDrawingMode = false`
- After each stroke (`path:created` event): save to history, refresh layers. Freehand mode stays active until the user clicks the button again or presses Escape.

**Toolbar button:** `✏️` icon (Lucide `Pencil`), renders with `active` state highlight when freehand mode is on.

**Mini brush toolbar:** When freehand mode is active, a small floating strip appears above the canvas (absolutely positioned) showing:
- Brush color swatch (color input)
- Brush width slider (2–40px)
- "Esc to cancel" hint text

**Keyboard:** `Escape` exits freehand mode.

**Files affected:** `FabricCanvas.tsx`, `EditorToolbar.tsx`, `src/pages/admin/PosterMaker.tsx`

### 3c. Decorative Divider (`〰`)

Added to `EditorToolbar` after the Freehand button.

**Implementation:**
- `FabricCanvasRef` gets `addDivider(): void`
- Implemented as `fabric.Path` with an SVG wavy line path spanning ~80% of canvas width
- Placed horizontally centered, vertically at 50% of canvas height
- Default: `stroke: '#1a1a1a'`, `strokeWidth: 4`, `fill: 'transparent'`
- Color controlled via Stroke color in Properties panel

The path is built at runtime from canvas width so it always spans 80% of the canvas:

```ts
function buildWavyPath(w: number): string {
  const seg = 8;
  const segW = w / seg;
  const amp = 20;
  let d = `M 0 0`;
  for (let i = 0; i < seg; i++) {
    const x1 = i * segW + segW / 4;
    const x2 = i * segW + (3 * segW) / 4;
    const x3 = (i + 1) * segW;
    const y = i % 2 === 0 ? -amp : amp;
    d += ` C ${x1} ${y} ${x2} ${y} ${x3} 0`;
  }
  return d;
}
// Place path centered: left = canvas.width * 0.1, top = canvas.height / 2
```

**Toolbar button:** `〰` icon (Lucide `Waves` or custom SVG icon)

**Files affected:** `FabricCanvas.tsx`, `EditorToolbar.tsx`

---

## 4. Font Picker Enhancement

**File affected:** `src/components/admin/PosterMaker/PropertiesPanel.tsx`

### 4a. Plus Jakarta Sans as default

- Add `'Plus Jakarta Sans'` as the first entry in `GOOGLE_FONTS`
- Change `loadGoogleFont` eager-load slice from `GOOGLE_FONTS.slice(0, 10)` to include Plus Jakarta Sans explicitly
- Change default `fontFamily` state from `'Inter'` to `'Plus Jakarta Sans'`
- In `FabricCanvas.tsx` `addText()`: set `fontFamily: 'Plus Jakarta Sans'`

### 4b. Expanded font list

Replace `GOOGLE_FONTS` array with an expanded set (~35 fonts), organized in groups but stored as a flat array:

```ts
const GOOGLE_FONTS = [
  // Sans-serif (default)
  'Plus Jakarta Sans', 'Inter', 'Poppins', 'Montserrat', 'Raleway',
  'Work Sans', 'DM Sans', 'Nunito', 'Rubik', 'Outfit', 'Lato',
  'Open Sans', 'Ubuntu', 'Figtree',
  // Serif
  'Playfair Display', 'Merriweather', 'Lora', 'Source Serif 4',
  // Display / Bold
  'Bebas Neue', 'Anton', 'Oswald', 'Black Han Sans',
  // Decorative / Script
  'Pacifico', 'Dancing Script', 'Caveat',
  // Arabic
  'Amiri', 'Noto Sans Arabic', 'Cairo', 'Tajawal',
];
```

### 4c. Custom font picker component

Replace the native `<select>` in the Font section with a custom `FontPicker` component defined in `PropertiesPanel.tsx`.

**Component behavior:**
- **Collapsed:** A styled button showing the current font name rendered `style={{ fontFamily: currentFont }}`. Chevron down icon on right.
- **Expanded:** Dropdown positioned absolutely below the trigger (inside the panel scroll context). Contains:
  - A search `<input>` that filters the font list live (case-insensitive match on font name)
  - A scrollable list (`max-h-48 overflow-y-auto`) of font options
  - Each option: font name rendered `style={{ fontFamily: font }}` — loads the Google Font on first render if not already loaded
  - Selected font: left border highlight (`border-l-2 border-primary`) + "DEFAULT" badge for Plus Jakarta Sans
  - On click: calls `handleFontChange(font)`, collapses dropdown
- **Click-outside:** closes the dropdown (uses a `useEffect` with `document.addEventListener('mousedown', ...)`)
- **Lazy loading:** calls `loadGoogleFont(font)` when the dropdown opens (loads all fonts in the visible list, not all 35 upfront)

---

## 5. Layer Panel Cleanup

**File affected:** `src/components/admin/PosterMaker/LayerPanel.tsx`

### Problem
Each layer row currently contains 7 action buttons: ChevronsUp, ChevronUp, ChevronDown, ChevronsDown, Eye, Lock, Trash2. This crowds out the layer name, causing it to truncate or wrap.

### Fix
Remove the 4 z-order buttons (ChevronsUp, ChevronUp, ChevronDown, ChevronsDown) from the layer row. Keep only **Eye**, **Lock**, **Delete**.

Z-order operations remain accessible via:
- The top EditorToolbar (existing Send to Front / Bring Forward / Send Backward / Send to Back buttons)
- The right-click context menu (existing)

Also add `title` attribute to each button so the icon-only row is still discoverable.

Layer name display: change from `truncate flex-1` to `truncate flex-1 min-w-0` to prevent flex overflow breaking truncation.

---

## 6. Summary of File Changes

| File | Changes |
|------|---------|
| `src/pages/admin/PosterMaker.tsx` | Remove left sidebar, add New Design Modal, move AI inputs to right panel tab, add freehand toolbar strip, update layout grid |
| `src/components/admin/PosterMaker/EditorToolbar.tsx` | Add Arrow, Freehand (toggle), Divider buttons; add `isFreehandMode` prop |
| `src/components/admin/PosterMaker/FabricCanvas.tsx` | Add `addArrow()`, `addDivider()`, `setFreehandMode()`, `isFreehandMode()` to ref; handle `path:created` event |
| `src/components/admin/PosterMaker/LayerPanel.tsx` | Remove 4 z-order buttons from layer rows; fix name truncation |
| `src/components/admin/PosterMaker/PropertiesPanel.tsx` | Replace `<select>` with `FontPicker` component; update `GOOGLE_FONTS` list; change default font to Plus Jakarta Sans |

---

## Out of Scope

- Triangle, Star, Speech Bubble, Polygon shapes (not requested)
- Mobile / responsive layout (Poster Maker is admin-only, desktop use assumed)
- Freehand brush style options beyond color and width (e.g. spray, marker)
- Custom canvas sizes beyond Post and Story
