# Bullet & Numbering Feature — Design Spec

**Date:** 2026-06-20  
**Status:** Approved

## Problem

Bullet lists in the Poster Maker are currently implemented as two side-by-side `Textbox` objects: a narrow one containing `◆\n◆\n◆` (colored) and a wide one with the item text. This requires manual X/Y positioning and `lineHeight` tuning to keep them aligned, and the bullet color is controlled by a separate object's fill — making the two impossible to move/resize as a unit.

## Solution Overview

Approach A: Reuse `fabric.Textbox` with a custom `bulletList` metadata property. Bullet prefixes are baked into `.text`; Fabric's per-character `.styles` map colors only the prefix characters. This gives inline canvas editing, undo/redo, copy/paste, and serialization for free.

---

## Data Model

A bullet list is a `fabric.Textbox` with one additional custom property:

```ts
bulletList: {
  style: 'diamond' | 'number'
  bulletColor: string   // hex color for the prefix characters
}
```

### Text format

| Style    | `.text` example                         |
|----------|-----------------------------------------|
| Diamond  | `"◆ First item\n◆ Second item"`         |
| Numbered | `"1. First item\n2. Second item"`       |

The `.text` field stores lines **with** prefixes baked in. Empty lines have no prefix.

### Color split

- **Bullet color** — controlled by `bulletList.bulletColor`; applied to prefix chars via `.styles`
- **Text color** — controlled by the standard `.fill` property; uses the existing "Fill Color" picker in PropertiesPanel

### Styles map

Fabric's per-character `styles` object colors just the prefix characters of each line:

```
Line 0: styles[0][0] = { fill: bulletColor }, styles[0][1] = { fill: bulletColor }  // "◆ "
Line 1: styles[1][0] = { fill: bulletColor }, styles[1][1] = { fill: bulletColor }
```

For numbered lists the prefix length is variable (`"1. "` = 3 chars, `"10. "` = 4 chars) — the styles map is rebuilt from scratch on every normalize call.

---

## New File: `fabricBulletList.ts`

All bullet list logic lives in `src/components/admin/PosterMaker/fabricBulletList.ts`. It exports:

### Types

```ts
export interface BulletListConfig {
  style: 'diamond' | 'number'
  bulletColor: string
}
```

### `createBulletListTextbox(canvas, config?)`

Creates and returns a `fabric.Textbox` pre-configured as a bullet list. Default config:

| Property      | Default value                          |
|---------------|----------------------------------------|
| `style`       | `'diamond'`                            |
| `bulletColor` | `'#F59E0B'`                            |
| `fill`        | `'#0F172A'`                            |
| `fontSize`    | `18`                                   |
| `lineHeight`  | `1.8`                                  |
| `fontFamily`  | `'Plus Jakarta Sans, sans-serif'`      |
| `text`        | 3 lines: `"◆ Fasilitas pertama\n◆ Fasilitas kedua\n◆ Fasilitas ketiga"` |

Positioned at canvas center. After creation, `applyBulletStyles` is called to initialize `.styles`.

### `normalizeBulletList(obj)`

Called on `text:editing:exited` when `obj.bulletList` exists. Steps:

1. Split `.text` by `\n`
2. Strip existing prefix from each line:
   - Diamond: `line.startsWith('◆ ') ? line.slice(2) : line`
   - Numbered: `line.replace(/^\d+\.\s/, '')`
3. Re-add fresh prefixes to non-empty lines:
   - Diamond: prepend `"◆ "`
   - Numbered: prepend `"1. "`, `"2. "`, etc. (empty lines don't increment the counter)
4. Set `.text = newLines.join('\n')`
5. Call `applyBulletStyles(obj)`

This means users never need to type bullet chars themselves — just write the content and exit editing.

### `applyBulletStyles(obj)`

Rebuilds `.styles` from scratch based on current `.text` and `bulletList.bulletColor`. Iterates lines, detects prefix length, writes per-char fill entries. Called after normalize and after bullet color/style changes in PropertiesPanel.

### `changeBulletStyle(obj, newStyle, canvas)`

Switches `obj.bulletList.style`, then calls `normalizeBulletList` (which re-prefixes all lines) and `canvas.requestRenderAll()`.

### `changeBulletColor(obj, newColor, canvas)`

Updates `obj.bulletList.bulletColor`, calls `applyBulletStyles(obj)`, then `canvas.requestRenderAll()`.

---

## FabricCanvas.tsx Changes

### `addBulletList()` method added to `FabricCanvasRef`

```ts
addBulletList: () => void
```

Calls `createBulletListTextbox(canvas)`, adds to canvas, sets as active object.

### `text:editing:exited` canvas event

Registered once in the `useEffect` that sets up the canvas:

```ts
fabricRef.current.on('text:editing:exited', ({ target }) => {
  if ((target as any).bulletList) {
    normalizeBulletList(target as any);
    onCanvasModified?.();
  }
});
```

### Serialization

Every `canvas.toJSON()` call is updated to `canvas.toJSON(['bulletList'])` — this covers:
- History snapshots (`saveHistory`)
- Draft save
- Export / `loadTemplate`

When loading, `bulletList` is restored verbatim from JSON. No post-load re-normalization is needed since `.styles` is also saved.

---

## EditorToolbar Changes

A `List` icon button (lucide-react `List`) is added to the Insert Tools group, between the `Type` (Add Text) button and `Square` (Add Rect):

```tsx
<ToolBtn onClick={onAddBulletList} title="Add Bullet List"><List className="w-4 h-4" /></ToolBtn>
```

Prop added: `onAddBulletList: () => void`.

---

## PropertiesPanel Changes

When `selectedObject` has a `bulletList` property, a **"Bullet List"** section is rendered above the Fill Color section.

### Section contents

**Style toggle** — two pill buttons:

| Button       | Action                            |
|--------------|-----------------------------------|
| `◆ Diamond`  | Calls `changeBulletStyle(obj, 'diamond', canvas)` |
| `1. Numbered` | Calls `changeBulletStyle(obj, 'number', canvas)` |

Active button highlighted with `bg-primary text-white`.

**Bullet Color picker** — identical pattern to Fill Color: `<input type="color">` + hex text input + 20-swatch `PRESET_COLORS` grid. On change calls `changeBulletColor(obj, newColor, canvas)`.

**Fill Color** (existing control, relabeled) — its label changes to **"Text Color"** when `bulletList` is present, to avoid confusion. Behavior unchanged.

### State sync

PropertiesPanel's `useEffect` (which reads `selectedObject` on selection change) is extended to also read `bulletList` and set local state for `bulletStyle` and `bulletColor` when present.

---

## Template Migration

The 8 `◆` hack pairs in `TemplatePanel.tsx` are replaced with single `bulletList` Textbox objects. Each pair currently consists of:

1. A narrow textbox: `text: '◆\n◆\n◆'`, colored fill, `width: ~30`, positioned at `left: 100`
2. A wide textbox: the actual item lines, `left: 142`, matching `lineHeight`

**Replacement:** One textbox combining both, with `bulletList: { style: 'diamond', bulletColor: <original fill color> }`, `left: 100`, `width: 880` (or appropriate), and `text` set to `"◆ Item one\n◆ Item two\n..."`. The `styles` object is pre-built inline in the template JSON.

Existing saved drafts that contain the old two-textbox pattern continue to load and render correctly — they remain as plain textboxes with no `bulletList` property. No draft migration is required.

---

## File Changes Summary

| File | Change |
|------|--------|
| `src/components/admin/PosterMaker/fabricBulletList.ts` | **New** — all bullet logic |
| `src/components/admin/PosterMaker/FabricCanvas.tsx` | Add `addBulletList` to ref, register `text:editing:exited` handler, add `['bulletList']` to all `toJSON` calls |
| `src/components/admin/PosterMaker/EditorToolbar.tsx` | Add `onAddBulletList` prop and List button |
| `src/components/admin/PosterMaker/PropertiesPanel.tsx` | Add "Bullet List" section; relabel Fill Color → "Text Color" when relevant |
| `src/components/admin/PosterMaker/TemplatePanel.tsx` | Replace 8 `◆` hack pairs with single `bulletList` Textbox objects |

---

## Out of Scope

- Round dot (`•`) or checkmark (`✔`) bullet styles — can be added later by extending `BulletListConfig.style`
- Nested/indented bullet levels
- Per-line bullet style overrides
- Editing via PropertiesPanel textarea (inline canvas editing only)
