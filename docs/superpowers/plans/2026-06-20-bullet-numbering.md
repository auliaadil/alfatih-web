# Bullet & Numbering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fragile two-textbox `◆` hack with a self-contained `bulletList` Textbox that supports diamond and numbered styles with independent bullet and text colors.

**Architecture:** A regular `fabric.Textbox` carries a custom `bulletList: { style, bulletColor }` property. Bullet prefixes are baked into `.text`; Fabric's per-character `.styles` map colors only the prefix characters. A `text:editing:exited` canvas event normalizes prefixes on every edit exit.

**Tech Stack:** Fabric.js v7, React, TypeScript, Tailwind CSS (CDN), lucide-react

## Global Constraints

- Tailwind stays CDN-based — do not migrate to PostCSS.
- All content stays in Bahasa Indonesia.
- TypeScript strict mode — no `any` without cast justification.
- New PosterMaker logic goes in `src/components/admin/PosterMaker/`.
- `canvas.toJSON(['bulletList'])` everywhere `canvas.toJSON()` is called.
- `npm run dev` starts at `http://localhost:3000`.

---

### Task 1: `fabricBulletList.ts` — core bullet logic

**Files:**
- Create: `src/components/admin/PosterMaker/fabricBulletList.ts`

**Interfaces:**
- Produces:
  - `BulletListConfig` — type used by Tasks 2, 3
  - `createBulletListTextbox(canvas, config?)` — used by Task 2
  - `normalizeBulletList(obj)` — used by Task 2
  - `applyBulletStyles(obj)` — used by Task 2, 3
  - `changeBulletStyle(obj, newStyle, canvas)` — used by Task 3
  - `changeBulletColor(obj, newColor, canvas)` — used by Task 3

- [ ] **Step 1: Create `fabricBulletList.ts` with the full implementation**

```typescript
// src/components/admin/PosterMaker/fabricBulletList.ts
import { Textbox, Canvas } from 'fabric';

export interface BulletListConfig {
  style: 'diamond' | 'number';
  bulletColor: string;
}

type BulletTextbox = Textbox & { bulletList: BulletListConfig };

export function applyBulletStyles(obj: BulletTextbox): void {
  const { bulletColor, style } = obj.bulletList;
  const lines = obj.text.split('\n');
  const styles: Record<number, Record<number, { fill: string }>> = {};

  lines.forEach((line, lineIndex) => {
    let prefixLen = 0;
    if (style === 'diamond' && line.startsWith('◆ ')) {
      prefixLen = 2;
    } else if (style === 'number') {
      const match = line.match(/^(\d+\. )/);
      if (match) prefixLen = match[1].length;
    }
    if (prefixLen > 0) {
      styles[lineIndex] = {};
      for (let i = 0; i < prefixLen; i++) {
        styles[lineIndex][i] = { fill: bulletColor };
      }
    }
  });

  obj.set({ styles });
}

export function normalizeBulletList(obj: BulletTextbox): void {
  const { style } = obj.bulletList;
  const lines = obj.text.split('\n');

  const cleanLines = lines.map(line => {
    if (style === 'diamond') return line.startsWith('◆ ') ? line.slice(2) : line;
    return line.replace(/^\d+\.\s/, '');
  });

  let counter = 1;
  const newLines = cleanLines.map(line => {
    if (line === '') return '';
    if (style === 'diamond') return `◆ ${line}`;
    return `${counter++}. ${line}`;
  });

  obj.set({ text: newLines.join('\n') });
  applyBulletStyles(obj);
}

export function changeBulletStyle(
  obj: BulletTextbox,
  newStyle: 'diamond' | 'number',
  canvas: Canvas
): void {
  obj.bulletList = { ...obj.bulletList, style: newStyle };
  normalizeBulletList(obj);
  canvas.requestRenderAll();
}

export function changeBulletColor(
  obj: BulletTextbox,
  newColor: string,
  canvas: Canvas
): void {
  obj.bulletList = { ...obj.bulletList, bulletColor: newColor };
  applyBulletStyles(obj);
  canvas.requestRenderAll();
}

export function createBulletListTextbox(
  canvas: Canvas,
  config?: Partial<BulletListConfig>
): Textbox {
  const bulletList: BulletListConfig = {
    style: config?.style ?? 'diamond',
    bulletColor: config?.bulletColor ?? '#F59E0B',
  };

  const defaultText =
    '◆ Fasilitas pertama\n◆ Fasilitas kedua\n◆ Fasilitas ketiga';

  const tb = new Textbox(defaultText, {
    left: ((canvas.width ?? 1080) / 2) - 400,
    top: ((canvas.height ?? 1350) / 2) - 54,
    originX: 'left',
    originY: 'top',
    width: 800,
    fontSize: 18,
    lineHeight: 1.8,
    fontFamily: 'Plus Jakarta Sans, sans-serif',
    fill: '#0F172A',
    fontWeight: '500',
    editable: true,
  });

  (tb as BulletTextbox).bulletList = bulletList;
  applyBulletStyles(tb as BulletTextbox);

  return tb;
}
```

- [ ] **Step 2: Verify the file compiles cleanly**

Run: `npm run build 2>&1 | grep -E "error|Error" | head -20`  
Expected: no TypeScript errors referencing `fabricBulletList.ts`

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/PosterMaker/fabricBulletList.ts
git commit -m "feat(poster): add fabricBulletList core logic"
```

---

### Task 2: Wire into `FabricCanvas.tsx` and update serialization

**Files:**
- Modify: `src/components/admin/PosterMaker/FabricCanvas.tsx`
- Modify: `src/pages/admin/PosterMaker.tsx`

**Interfaces:**
- Consumes: `createBulletListTextbox`, `normalizeBulletList` from Task 1
- Produces: `addBulletList: () => void` on `FabricCanvasRef` — used by Task 3

- [ ] **Step 1: Add import at the top of `FabricCanvas.tsx`**

After the existing imports (around line 2), add:

```typescript
import { createBulletListTextbox, normalizeBulletList } from './fabricBulletList';
```

- [ ] **Step 2: Add `addBulletList` to the `FabricCanvasRef` interface**

In `FabricCanvas.tsx`, the `FabricCanvasRef` interface starts at line 27. Add one line after `addDivider`:

```typescript
    addBulletList: () => void;
```

- [ ] **Step 3: Update `saveHistory` to include `bulletList` in serialization**

`saveHistory` is at line 108. Change line 113 from:

```typescript
            history.current.push(c.toJSON());
```

to:

```typescript
            history.current.push(c.toJSON(['bulletList']));
```

- [ ] **Step 4: Register `text:editing:exited` in the canvas setup `useEffect`**

In the canvas setup `useEffect` (starts at line 126), add these lines after the `canvas.on('object:removed', ...)` block (after line 157):

```typescript
            canvas.on('text:editing:exited', (e: any) => {
                const target = e.target;
                if (target && (target as any).bulletList) {
                    normalizeBulletList(target as any);
                    canvas.requestRenderAll();
                    onCanvasModified?.();
                    saveHistory(canvas);
                }
            });
```

- [ ] **Step 5: Add `addBulletList` implementation inside `useImperativeHandle`**

Find the `addText` implementation (around line 598). Add `addBulletList` after it, following the same pattern:

```typescript
            addBulletList: () => {
                const c = fabricRef.current;
                if (!c) return;
                const tb = createBulletListTextbox(c);
                c.add(tb);
                c.setActiveObject(tb);
                c.requestRenderAll();
            },
```

- [ ] **Step 6: Update the three `canvas.toJSON()` calls in `PosterMaker.tsx`**

File: `src/pages/admin/PosterMaker.tsx`

Line 781 — in `snapshotActiveSlide`:
```typescript
        const json = canvas.toJSON(['bulletList']);
```

Line 845 — in `handleSaveNew`:
```typescript
            canvas_json: canvas.toJSON(['bulletList']),
```

Line 871 — in `handleUpdate`:
```typescript
            canvas_json: canvas.toJSON(['bulletList']),
```

- [ ] **Step 7: Start dev server and verify the canvas event fires**

Run: `npm run dev`

Open browser at `http://localhost:3000/admin/poster-maker`. Open DevTools console and run:

```javascript
// In console after page loads — paste this snippet to test
// (You'll add the button in Task 3; for now, verify via console)
const canvas = document.querySelector('canvas').__fabric;
// canvas should exist
console.log('canvas:', canvas);
```

The canvas object should exist. No red errors in console.

- [ ] **Step 8: Commit**

```bash
git add src/components/admin/PosterMaker/FabricCanvas.tsx src/pages/admin/PosterMaker.tsx
git commit -m "feat(poster): wire addBulletList and text:editing:exited into FabricCanvas"
```

---

### Task 3: `EditorToolbar.tsx` + `PropertiesPanel.tsx` — UI controls

**Files:**
- Modify: `src/components/admin/PosterMaker/EditorToolbar.tsx`
- Modify: `src/pages/admin/PosterMaker.tsx` (add `onAddBulletList` prop)
- Modify: `src/components/admin/PosterMaker/PropertiesPanel.tsx`

**Interfaces:**
- Consumes: `addBulletList` on `FabricCanvasRef` from Task 2
- Consumes: `changeBulletStyle`, `changeBulletColor`, `applyBulletStyles`, `BulletListConfig` from Task 1

- [ ] **Step 1: Add `List` to the lucide-react import in `EditorToolbar.tsx`**

Line 1 of `EditorToolbar.tsx`:

```typescript
import {
    Type, Square, Circle, Minus, ImagePlus, Trash2,
    AlignLeft, AlignCenter, AlignRight, AlignJustify, Link, Unlink,
    ChevronDown, ChevronRight, ChevronUp, ChevronsUp, ChevronsDown,
    Download, Loader2, RectangleHorizontal, RectangleVertical,
    Undo, Redo, Copy, Clipboard, CopyPlus,
    MoveRight, Pencil, Waves, MousePointer2, Hand, List
} from 'lucide-react';
```

- [ ] **Step 2: Add `onAddBulletList` to the `EditorToolbarProps` interface**

After `onAddText: () => void;`:

```typescript
    onAddBulletList: () => void;
```

- [ ] **Step 3: Add `onAddBulletList` to the destructured props**

In the `EditorToolbar` function signature, add `onAddBulletList` next to `onAddText`:

```typescript
const EditorToolbar: React.FC<EditorToolbarProps> = ({
    canvasSize, isExporting,
    onAddText, onAddBulletList, onAddRect, onAddCircle, onAddLine, onAddImage,
    // ... rest unchanged
```

- [ ] **Step 4: Add the List button after the Add Text button**

In the Insert Tools group (after `<ToolBtn onClick={onAddText} title="Add Text">`):

```tsx
<ToolBtn onClick={onAddBulletList} title="Add Bullet List"><List className="w-4 h-4" /></ToolBtn>
```

- [ ] **Step 5: Wire `onAddBulletList` in `PosterMaker.tsx`**

In the `<EditorToolbar ...>` block (around line 1118), add the prop after `onAddText`:

```tsx
onAddBulletList={() => { handleSetCursorMode('select'); canvasRef.current?.addBulletList(); }}
```

- [ ] **Step 6: Add imports to `PropertiesPanel.tsx`**

At the top of `PropertiesPanel.tsx`, after the existing imports:

```typescript
import { BulletListConfig, changeBulletStyle, changeBulletColor } from './fabricBulletList';
```

- [ ] **Step 7: Add `bulletListConfig` state in `PropertiesPanel`**

Inside `PropertiesPanel` (after the existing `const [blur, setBlur]` state line):

```typescript
    const [bulletListConfig, setBulletListConfig] = useState<BulletListConfig | null>(null);
```

- [ ] **Step 8: Read `bulletList` in the selection `useEffect`**

In the `useEffect` that reads `selectedObject` (around line 165), add at the end of the effect body, before the closing `}`:

```typescript
        const bl = (selectedObject as any).bulletList as BulletListConfig | undefined;
        setBulletListConfig(bl ?? null);
```

- [ ] **Step 9: Add bullet list change handlers**

After the `handleBlur` function (around line 304), add:

```typescript
    const handleBulletStyleChange = (style: 'diamond' | 'number') => {
        if (!canvas || !selectedObject || !bulletListConfig) return;
        setBulletListConfig(prev => prev ? { ...prev, style } : null);
        changeBulletStyle(selectedObject as any, style, canvas);
    };

    const handleBulletColorChange = (color: string) => {
        if (!canvas || !selectedObject || !bulletListConfig) return;
        setBulletListConfig(prev => prev ? { ...prev, bulletColor: color } : null);
        changeBulletColor(selectedObject as any, color, canvas);
    };
```

- [ ] **Step 10: Add "Bullet List" section to the render**

In the `PropertiesPanel` return, add this block **before** the `{/* Fill Color */}` section:

```tsx
            {/* Bullet List */}
            {bulletListConfig && (
                <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Bullet List</label>
                    <div className="flex gap-1 mb-3">
                        <button
                            onClick={() => handleBulletStyleChange('diamond')}
                            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition ${bulletListConfig.style === 'diamond' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            ◆ Diamond
                        </button>
                        <button
                            onClick={() => handleBulletStyleChange('number')}
                            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition ${bulletListConfig.style === 'number' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            1. Numbered
                        </button>
                    </div>

                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Bullet Color</label>
                    <div className="flex items-center gap-2 mb-2">
                        <input type="color" value={bulletListConfig.bulletColor}
                            onChange={(e) => handleBulletColorChange(e.target.value)}
                            className="w-8 h-8 rounded-md border border-gray-300 cursor-pointer p-0" />
                        <input type="text" value={bulletListConfig.bulletColor}
                            onChange={(e) => handleBulletColorChange(e.target.value)}
                            className="flex-1 text-xs font-mono border border-gray-300 rounded-lg px-2 py-1.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                    </div>
                    <div className="grid grid-cols-10 gap-1 mb-2">
                        {PRESET_COLORS.map(c => (
                            <button key={c} onClick={() => handleBulletColorChange(c)}
                                className={`w-6 h-6 rounded-md border-2 transition hover:scale-110 ${bulletListConfig.bulletColor === c ? 'border-primary' : 'border-gray-200'}`}
                                style={{ backgroundColor: c }} />
                        ))}
                    </div>
                </div>
            )}
```

- [ ] **Step 11: Relabel "Fill Color" → "Text Color" when a bullet list is selected**

Find the `{/* Fill Color */}` label in `PropertiesPanel.tsx`:

```tsx
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Fill Color</label>
```

Change to:

```tsx
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                    {bulletListConfig ? 'Text Color' : 'Fill Color'}
                </label>
```

- [ ] **Step 12: Manual verification in the browser**

1. Run `npm run dev`, open `http://localhost:3000/admin/poster-maker`
2. Click the **List** icon in the toolbar — a 3-line diamond list should appear at canvas center
3. Select it — Properties Panel should show a **Bullet List** section with ◆ Diamond / 1. Numbered toggle and a Bullet Color picker
4. Click **1. Numbered** — the list should re-render as `1. Fasilitas pertama\n2. ...`
5. Click bullet color swatch — only the prefix color changes, text color stays dark
6. Double-click the object to edit — change the text of a line, click away — verify the prefix auto-restores
7. In numbered mode, delete the middle line, click away — verify numbers renumber to 1. 2.
8. Undo (Ctrl+Z) — verify the list reverts correctly

- [ ] **Step 13: Commit**

```bash
git add src/components/admin/PosterMaker/EditorToolbar.tsx \
        src/components/admin/PosterMaker/PropertiesPanel.tsx \
        src/pages/admin/PosterMaker.tsx
git commit -m "feat(poster): add List button and Bullet List section in PropertiesPanel"
```

---

### Task 4: Migrate 8 template `◆` pairs in `TemplatePanel.tsx`

**Files:**
- Modify: `src/components/admin/PosterMaker/TemplatePanel.tsx`

**Interfaces:**
- Consumes: `bulletList` property shape from Task 1 (no imports needed — plain object literals)

**Background:** Each pair consists of (a) a narrow `◆\n◆\n◆` column textbox and (b) a wider text textbox positioned side by side. Replace each pair with one textbox at the bullet column's `left`/`top`, spanning the combined width, with `bulletList` and `styles` set inline.

The `styles` format for a diamond list with N lines is:
```js
{ 0: { 0: { fill: COLOR }, 1: { fill: COLOR } }, 1: { ... }, ... }
```
(each line index → char 0 and char 1 get the bullet color, since `◆ ` is 2 chars)

- [ ] **Step 1: Replace pair in `brochure-post-conversion` (line ~115)**

**Find and remove** these two objects (the narrow ◆ column at `left:100, top:970` and the text at `left:142, top:970`):

```javascript
                { top: 970, fill: '#F59E0B', left: 100, text: '◆\n◆\n◆\n◆\n◆', type: 'Textbox', /* ... long form ... */ },
                { top: 970, fill: '#0F172A', left: 142, text: 'Hotel Makkah: Anjum / Setaraf (*5)\n...', type: 'Textbox', /* ... */ },
```

**Replace with:**

```javascript
                // Feature bullet list (5 items, amber diamonds)
                { type: 'textbox', left: 100, top: 970, width: 880, text: '◆ Hotel Makkah: Anjum / Setaraf (*5)\n◆ Hotel Madinah: Front Taiba / Setaraf (*5)\n◆ Tiket Pesawat Saudia Airlines direct Jeddah\n◆ Muthawwif Pembimbing Ibadah Berpengalaman\n◆ Air Zamzam 5 Liter & Perlengkapan Umrah Lengkap', fontSize: 18, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#0F172A', lineHeight: 1.8, textAlign: 'left', originX: 'left', originY: 'top', editable: true, bulletList: { style: 'diamond', bulletColor: '#F59E0B' }, styles: { 0: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } }, 1: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } }, 2: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } }, 3: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } }, 4: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } } } },
```

- [ ] **Step 2: Replace pair in `brochure-story-conversion` (line ~381)**

**Find and remove** the two objects at `top:1370` (narrow ◆ at `left:120`, text at `left:166`).

**Replace with:**

```javascript
                // Feature bullet list (5 items, amber diamonds)
                { type: 'textbox', left: 120, top: 1370, width: 840, text: '◆ Hotel Makkah: Anjum / Setaraf (*5)\n◆ Hotel Madinah: Front Taiba / Setaraf (*5)\n◆ Tiket Pesawat Saudia Airlines direct Jeddah\n◆ Muthawwif Pembimbing Ibadah Berpengalaman\n◆ Air Zamzam 5 Liter & Perlengkapan Umrah Lengkap', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#0F172A', lineHeight: 1.8, textAlign: 'left', originX: 'left', originY: 'top', editable: true, bulletList: { style: 'diamond', bulletColor: '#F59E0B' }, styles: { 0: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } }, 1: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } }, 2: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } }, 3: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } }, 4: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } } } },
```

- [ ] **Step 3: Replace pair in `promo-post-conversion` (line ~526)**

**Find and remove** the two objects at `top:904` (narrow ◆ at `left:100, fill:'#0084FF'`, text at `left:142`).

**Replace with:**

```javascript
                // Feature bullet list (4 items, blue diamonds)
                { type: 'textbox', left: 100, top: 904, width: 880, text: '◆ Hotel Makkah: Anjum / Setaraf (*5)\n◆ Hotel Madinah: Front Taiba / Setaraf (*5)\n◆ Tiket Pesawat Saudia Airlines direct Jeddah\n◆ Muthawwif Pembimbing Ibadah Berpengalaman', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#0F172A', lineHeight: 1.8, textAlign: 'left', originX: 'left', originY: 'top', editable: true, bulletList: { style: 'diamond', bulletColor: '#0084FF' }, styles: { 0: { 0: { fill: '#0084FF' }, 1: { fill: '#0084FF' } }, 1: { 0: { fill: '#0084FF' }, 1: { fill: '#0084FF' } }, 2: { 0: { fill: '#0084FF' }, 1: { fill: '#0084FF' } }, 3: { 0: { fill: '#0084FF' }, 1: { fill: '#0084FF' } } } },
```

- [ ] **Step 4: Replace pair in `promo-story-conversion` (line ~589)**

**Find and remove** the two objects at `top:1325` (narrow ◆ at `left:100, fill:'#0084FF'`, text at `left:146`).

**Replace with:**

```javascript
                // Feature bullet list (4 items, blue diamonds)
                { type: 'textbox', left: 100, top: 1325, width: 880, text: '◆ Hotel Makkah: Anjum / Setaraf (*5)\n◆ Hotel Madinah: Front Taiba / Setaraf (*5)\n◆ Tiket Pesawat Saudia Airlines direct Jeddah\n◆ Muthawwif Pembimbing Ibadah Berpengalaman', fontSize: 20, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#0F172A', lineHeight: 1.8, textAlign: 'left', originX: 'left', originY: 'top', editable: true, bulletList: { style: 'diamond', bulletColor: '#0084FF' }, styles: { 0: { 0: { fill: '#0084FF' }, 1: { fill: '#0084FF' } }, 1: { 0: { fill: '#0084FF' }, 1: { fill: '#0084FF' } }, 2: { 0: { fill: '#0084FF' }, 1: { fill: '#0084FF' } }, 3: { 0: { fill: '#0084FF' }, 1: { fill: '#0084FF' } } } },
```

- [ ] **Step 5: Replace pair in `hotel-airline-post-conversion` (line ~660)**

**Find and remove** the two objects at `top:898` (narrow ◆ at `left:100, fill:'#F59E0B'`, text at `left:142`).

**Replace with:**

```javascript
                // Feature bullet list (3 items, amber diamonds)
                { type: 'textbox', left: 100, top: 898, width: 880, text: '◆ Hotel Makkah: Anjum / Setaraf (*5) & Madinah: Front Taiba / Setaraf (*5)\n◆ Maskapai Penerbangan Langsung Jeddah tanpa Transit\n◆ Muthawwif Pembimbing Ibadah Berpengalaman', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#0F172A', lineHeight: 1.8, textAlign: 'left', originX: 'left', originY: 'top', editable: true, bulletList: { style: 'diamond', bulletColor: '#F59E0B' }, styles: { 0: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } }, 1: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } }, 2: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } } } },
```

- [ ] **Step 6: Replace pair in `hotel-airline-story-conversion` (line ~731)**

**Find and remove** the two objects at `top:1238` (narrow ◆ at `left:100, fill:'#F59E0B'`, text at `left:148`).

**Replace with:**

```javascript
                // Feature bullet list (3 items, amber diamonds)
                { type: 'textbox', left: 100, top: 1238, width: 880, text: '◆ Hotel Makkah: Anjum / Setaraf (*5) & Madinah: Front Taiba (*5)\n◆ Maskapai Penerbangan Langsung Jeddah tanpa Transit\n◆ Muthawwif Pembimbing Ibadah Berpengalaman', fontSize: 21, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#0F172A', lineHeight: 1.8, textAlign: 'left', originX: 'left', originY: 'top', editable: true, bulletList: { style: 'diamond', bulletColor: '#F59E0B' }, styles: { 0: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } }, 1: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } }, 2: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } } } },
```

- [ ] **Step 7: Replace pair in `feature-grid-post-conversion` (line ~956)**

**Find and remove** the two objects at `top:908` (narrow ◆ at `left:100, fill:'#F59E0B'`, text at `left:142`).

**Replace with:**

```javascript
                // Feature bullet list (3 items, amber diamonds)
                { type: 'textbox', left: 100, top: 908, width: 880, text: '◆ Hotel Makkah & Madinah Bintang 5 dekat Masjidil Haram\n◆ Tiket Pesawat Saudia Airlines direct Jeddah\n◆ Muthawwif Pembimbing Ibadah Berpengalaman', fontSize: 17, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#0F172A', lineHeight: 1.8, textAlign: 'left', originX: 'left', originY: 'top', editable: true, bulletList: { style: 'diamond', bulletColor: '#F59E0B' }, styles: { 0: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } }, 1: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } }, 2: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } } } },
```

- [ ] **Step 8: Replace pair in `departure-focus-story-conversion` (line ~1027)**

**Find and remove** the two objects at `top:1240` (narrow ◆ at `left:100, fill:'#F59E0B'`, text at `left:148`).

**Replace with:**

```javascript
                // Feature bullet list (3 items, amber diamonds)
                { type: 'textbox', left: 100, top: 1240, width: 880, text: '◆ Hotel Makkah & Madinah Bintang 5 dekat Masjidil Haram\n◆ Tiket Pesawat Saudia Airlines direct Jeddah\n◆ Muthawwif Pembimbing Ibadah Berpengalaman', fontSize: 21, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '500', fill: '#0F172A', lineHeight: 1.8, textAlign: 'left', originX: 'left', originY: 'top', editable: true, bulletList: { style: 'diamond', bulletColor: '#F59E0B' }, styles: { 0: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } }, 1: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } }, 2: { 0: { fill: '#F59E0B' }, 1: { fill: '#F59E0B' } } } },
```

- [ ] **Step 9: Verify build passes**

Run: `npm run build 2>&1 | grep -E "error|Error" | head -20`  
Expected: no errors

- [ ] **Step 10: Visual verification of all 8 migrated templates**

1. `npm run dev`, open `http://localhost:3000/admin/poster-maker`
2. Open the **Templates** panel
3. Load each of these templates one by one and verify the bullet list renders with colored diamonds:
   - **Brosur Paket Umrah (Post)** — 5 amber ◆ items
   - **Brosur Paket Umrah (Story)** — 5 amber ◆ items
   - **Promo Diskon Umrah (Post)** — 4 blue ◆ items
   - **Promo Diskon Umrah (Story)** — 4 blue ◆ items
   - **Hotel & Penerbangan (Post)** — 3 amber ◆ items
   - **Hotel & Penerbangan (Story)** — 3 amber ◆ items
   - **Grid Fasilitas Umrah (Post)** — 3 amber ◆ items
   - **Fokus Keberangkatan (Story)** — 3 amber ◆ items
4. For each: select the bullet list → Properties Panel shows "Bullet List" section with ◆ Diamond active
5. Verify no leftover narrow ◆ column objects appear (no orphaned `◆\n◆` textboxes)

- [ ] **Step 11: Commit**

```bash
git add src/components/admin/PosterMaker/TemplatePanel.tsx
git commit -m "feat(poster): migrate 8 template bullet pairs to unified bulletList textbox"
```
