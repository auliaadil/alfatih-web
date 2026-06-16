# Draw Mode for Shape Tools — Design Spec

**Date:** 2026-06-16  
**Scope:** Poster Maker — `FabricCanvas.tsx`, `EditorToolbar.tsx`, `PosterMaker.tsx`

---

## Problem

All shape tool buttons (Rect, Circle, Line, Arrow, Divider) currently place objects at hardcoded fixed coordinates the moment the user clicks the toolbar button. Users have no control over initial position or size. The Text tool already uses a superior "click-to-place" mode; shape tools need a drag-to-draw equivalent.

## Goal

Shape tool buttons enter a **draw mode**: user drags on the canvas to define both position and size. Releasing the mouse finalizes the shape. Clicking without a meaningful drag does nothing.

---

## Architecture

### New refs in `FabricCanvas.tsx`

```ts
const drawModeRef    = useRef<'rect'|'circle'|'line'|'arrow'|'divider'|null>(null);
const drawStartRef   = useRef<{ x: number; y: number } | null>(null);
const previewObjectRef = useRef<FabricObject | null>(null);
```

These are refs (not state) — no re-renders during the drag loop.

### New prop on `FabricCanvasProps`

```ts
onDrawModeChange?: (mode: string | null) => void;
```

Fires when draw mode starts or ends so the parent can sync toolbar highlight state.

### Modified `FabricCanvasRef` methods

The public API names are **unchanged**. Their behavior changes internally:

| Method | Old behavior | New behavior |
|--------|-------------|--------------|
| `addRect()` | Drops rect at (150,150) | Enters draw mode `'rect'` (or cancels if already active) |
| `addCircle()` | Drops circle at (200,200) | Enters draw mode `'circle'` |
| `addLine()` | Drops line at fixed coords | Enters draw mode `'line'` |
| `addArrow()` | Drops arrow at center | Enters draw mode `'arrow'` |
| `addDivider()` | Drops wavy path at center | Enters draw mode `'divider'` |

### New `FabricCanvasRef` method

```ts
cancelDraw(): void;  // exits draw mode, restores cursor/selection, removes preview
```

### New state in `PosterMaker.tsx`

```ts
const [activeDrawTool, setActiveDrawTool] = useState<string | null>(null);
```

Updated by `onDrawModeChange` callback from `FabricCanvas`.

### `EditorToolbar.tsx`

New prop: `activeDrawTool: string | null`. Shape buttons use `active={activeDrawTool === '<type>' || undefined}` — the existing `ToolBtn` `active` pattern.

---

## Canvas Interaction Flow

All event handlers live inside the `useEffect` that initializes the Fabric canvas.

### `mouse:down`

1. If `drawModeRef.current` is null → fall through to existing text-placement logic.
2. If `e.target` is an existing object → ignore (user clicked on an object, not empty canvas).
3. Save `e.scenePoint` into `drawStartRef`.
4. Create a preview object for the active shape type, tagged `(obj as any).isPreview = true`.
5. Set `selectable: false, evented: false, opacity: 0.5` on the preview.
6. `canvas.add(previewObj)`.
7. `canvas.selection = false` (disables rubber-band group selection during draw).

### `mouse:move`

Guard: `drawModeRef.current && drawStartRef.current && previewObjectRef.current`.

Compute deltas from `drawStartRef` to `e.scenePoint`, update preview in-place (see Shape Logic below), then `previewObj.setCoords(); canvas.requestRenderAll()`.

### `mouse:up`

1. Same guard.
2. Compute `distance = Math.sqrt(dx² + dy²)`. If `distance < 5` canvas-px → do nothing, stay in draw mode.
3. Finalize shape (see Shape Logic below).
4. Exit draw mode: clear refs, `canvas.selection = true`, cursor → `default`/`move`, call `onDrawModeChange?.(null)`.

### Escape key (`keydown` on `document`)

- If draw mode active: `canvas.remove(previewObj)`, exit draw mode, call `onDrawModeChange?.(null)`.
- Also cancels text placement mode (fixes existing gap — no escape handler existed).
- Listener cleaned up in `useEffect` return.

### History safety

Preview objects are tagged `isPreview: true` so `object:added / object:removed` handlers skip history and `onCanvasModified` for them:

```ts
canvas.on('object:added', (e) => {
    if ((e.target as any).isPreview) return;
    onCanvasModified?.();
    saveHistory(canvas);
});
canvas.on('object:removed', (e) => {
    if ((e.target as any).isPreview) return;
    onCanvasModified?.();
    saveHistory(canvas);
});
```

The final object (added on mouse:up without `isPreview`) writes to history normally.

---

## Shape-Specific Draw Logic

### Rect

- **Preview created at mouse:down:** `new Rect({ left:sx, top:sy, width:0, height:0, fill:'#10b981', rx:12, ry:12, opacity:0.5 })`
- **On mouse:move:** `rect.set({ left:min(sx,cx), top:min(sy,cy), width:|dx|, height:|dy| })`
- **On mouse:up:** finalize in-place — `set({ selectable:true, evented:true, opacity:0.9 })`, delete `isPreview`, `canvas.setActiveObject(rect)`, `saveHistory(canvas)`, `onCanvasModified?.()`

### Circle

- **Preview created at mouse:down:** `new Circle({ left:sx, top:sy, radius:0, fill:'#f59e0b', opacity:0.5 })`
- **On mouse:move:**
  ```
  r = min(|dx|, |dy|) / 2
  cx = (sx + currentX) / 2
  cy = (sy + currentY) / 2
  circle.set({ left: cx − r, top: cy − r, radius: r })
  ```
- **On mouse:up:** finalize in-place same as Rect

### Line

- **Preview created at mouse:down:** `new Line([sx,sy,sx,sy], { stroke:'#1a1a1a', strokeWidth:4, opacity:0.5 })`
- **On mouse:move:** `line.set({ x1:sx, y1:sy, x2:cx, y2:cy })`
- **On mouse:up:** finalize in-place same as Rect

### Arrow

Uses a Line as drag preview, replaced by a Path on mouse:up.

- **Preview:** `new Line([sx,sy,sx,sy], { stroke:'#1a1a1a', strokeWidth:4, opacity:0.5, isPreview:true })`
- **On mouse:move:** `line.set({ x2:cx, y2:cy })`
- **On mouse:up:**
  1. `canvas.remove(previewLine)` — suppressed from history by `isPreview`
  2. `length = sqrt(dx²+dy²)`, `angle = atan2(dy,dx) × 180/π`
  3. Build dynamic arrow path **centered around (0,0)**, pointing right:
     ```
     headLen = min(55, length × 0.35)
     half    = length / 2
     bodyEnd = half − headLen      // where body meets head
     if bodyEnd > 0:
       M −half −8 L {bodyEnd} −8 L {bodyEnd} −18 L {half} 0 L {bodyEnd} 18 L {bodyEnd} 8 L −half 8 Z
     else (short drag → triangle only):
       M −half −18 L {half} 0 L −half 18 Z
     ```
  4. Place at drag midpoint with center origin so Fabric's rotation-around-center is correct:
     ```
     new Path(path, {
         left:   (sx + ex) / 2,
         top:    (sy + ey) / 2,
         originX: 'center',
         originY: 'center',
         angle,
         fill: '#1a1a1a',
     })
     ```
     This guarantees the tail lands at (sx,sy) and tip at (ex,ey) after rotation.
  5. `canvas.add(finalArrow)` → triggers history

### Divider

Uses a Line as drag preview, replaced by the wavy Path on mouse:up.

- **Preview:** `new Line([sx,sy,sx,sy], { stroke:'#1a1a1a', strokeWidth:4, opacity:0.5, isPreview:true })`
- **On mouse:move:** `line.set({ x2:cx, y2:cy })`
- **On mouse:up:**
  1. `canvas.remove(previewLine)`
  2. `width = |dx|`, uses existing `buildWavyPath(width)` helper already in the file
  3. `new Path(wavyPath, { left:min(sx,cx), top:min(sy,cy), stroke:'#1a1a1a', strokeWidth:4, fill:'' })`
  4. `canvas.add(finalDivider)` → triggers history

---

## Toolbar & PosterMaker Wiring

### `EditorToolbar.tsx`

Add `activeDrawTool: string | null` to `EditorToolbarProps`.

Shape buttons:
```tsx
<ToolBtn onClick={onAddRect}    title="Add Rectangle"          active={activeDrawTool === 'rect'    || undefined}>
<ToolBtn onClick={onAddCircle}  title="Add Circle"             active={activeDrawTool === 'circle'  || undefined}>
<ToolBtn onClick={onAddLine}    title="Add Line"               active={activeDrawTool === 'line'    || undefined}>
<ToolBtn onClick={onAddArrow}   title="Tambah Panah"           active={activeDrawTool === 'arrow'   || undefined}>
<ToolBtn onClick={onAddDivider} title="Tambah Divider Dekoratif" active={activeDrawTool === 'divider' || undefined}>
```

### `PosterMaker.tsx`

1. `const [activeDrawTool, setActiveDrawTool] = useState<string | null>(null)`
2. `<FabricCanvas ... onDrawModeChange={(mode) => setActiveDrawTool(mode)} />`
3. `<EditorToolbar ... activeDrawTool={activeDrawTool} />`
4. In `handleToggleFreehand`: if turning freehand on, call `canvasRef.current?.cancelDraw()` and `setActiveDrawTool(null)` first.
5. Anywhere `setIsFreehandActive(false)` is already called (template load, pick-blank, etc.) — also call `setActiveDrawTool(null)`.

---

## Cursor States

| State | Canvas cursor |
|-------|--------------|
| Default (no mode) | `default` / `move` on objects |
| Text placement mode | `text` (unchanged) |
| Draw mode active | `crosshair` |

---

## Out of Scope

- Shift-constrain to 45°/90° angles (future enhancement)
- Ellipse tool (distinct from Circle)
- Multi-segment polyline
