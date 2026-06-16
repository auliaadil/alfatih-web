# Poster Maker UX Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance the admin Poster Maker with a canvas-first layout (template picker moves to a modal), three new drawing tools (arrow, freehand pencil, decorative divider), an expanded font picker with inline preview and Plus Jakarta Sans as default, and a cleaned-up layer panel.

**Architecture:** Five self-contained tasks in dependency order — layer cleanup and font picker are independent; FabricCanvas new methods must precede EditorToolbar wiring; the layout restructure (Task 5) depends on Tasks 3 & 4 for the new tool props. No backend changes.

**Tech Stack:** React 18, TypeScript, Fabric.js v7, Lucide React 0.562, Tailwind CSS (CDN)

**Spec:** `docs/superpowers/specs/2026-06-16-poster-maker-ux-enhancements-design.md`

---

## File Map

| File | Task | What changes |
|------|------|-------------|
| `src/components/admin/PosterMaker/LayerPanel.tsx` | 1 | Remove 4 z-order buttons per row; fix name truncation |
| `src/components/admin/PosterMaker/PropertiesPanel.tsx` | 2 | Expand GOOGLE_FONTS; add `FontPicker` component; change default font |
| `src/components/admin/PosterMaker/FabricCanvas.tsx` | 3 | Add `addArrow`, `addDivider`, `setFreehandMode`, `isFreehandMode` to ref; update `addText` default font |
| `src/components/admin/PosterMaker/EditorToolbar.tsx` | 4 | Add Arrow, Freehand, Divider buttons + `isFreehandActive` prop |
| `src/pages/admin/PosterMaker.tsx` | 5 | Remove left sidebar + `viewState`; add `NewDesignModal`; grid 9/3; freehand brush strip; AI tab in right panel |

---

## Task 1: Layer Panel Cleanup

**File:** `src/components/admin/PosterMaker/LayerPanel.tsx`

Remove the 4 z-order buttons (ChevronsUp, ChevronUp, ChevronDown, ChevronsDown) and their handler functions from every layer row. Keep only Eye, Lock, Delete. Fix name truncation.

- [ ] **Step 1: Open the file and remove unused imports**

In `LayerPanel.tsx` line 3, remove `ChevronUp, ChevronDown, ChevronsUp, ChevronsDown` from the lucide-react import. The line should become:

```ts
import { Eye, EyeOff, Lock, Unlock, Trash2, Type, Square, Image, Circle as CircleIcon, Minus } from 'lucide-react';
```

- [ ] **Step 2: Remove the four z-order handler functions**

Delete these four functions entirely from the component body (lines ~82–110 in the original):
- `handleSendToFront`
- `handleSendToBack`
- `handleMoveUp`
- `handleMoveDown`

- [ ] **Step 3: Replace the layer row JSX**

Find the `return` inside the `objects.map(...)` call. Replace the entire `<div key={idx} ...>` element with this slimmed version:

```tsx
<div
  key={idx}
  draggable
  onDragStart={(e) => handleDragStart(e, idx)}
  onDragOver={(e) => handleDragOver(e, idx)}
  onDragLeave={() => setDragOverIdx(null)}
  onDrop={(e) => handleDrop(e, idx)}
  onDragEnd={handleDragEnd}
  onClick={() => handleSelect(obj)}
  className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all text-sm border-2
    ${dragOverIdx === idx ? 'border-t-primary border-transparent' : 'border-transparent'}
    ${draggedIdx === idx ? 'opacity-50 scale-95' : 'opacity-100'}
    ${isActive && draggedIdx !== idx
      ? 'bg-emerald-50 border-primary/30 text-primary font-medium'
      : 'hover:bg-gray-50 text-gray-700'
    }`}
>
  <span className={`shrink-0 ${isActive ? 'text-primary' : 'text-gray-400'}`}>
    {getObjectIcon(obj)}
  </span>
  <span className="truncate flex-1 min-w-0 text-xs font-medium">
    {getObjectLabel(obj, objects.length - 1 - idx)}
  </span>

  <button
    onClick={(e) => { e.stopPropagation(); handleToggleVisible(obj); }}
    className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600 flex-shrink-0"
    title={isVisible ? 'Sembunyikan' : 'Tampilkan'}
  >
    {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
  </button>
  <button
    onClick={(e) => { e.stopPropagation(); handleToggleLock(obj); }}
    className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600 flex-shrink-0"
    title={isLocked ? 'Buka Kunci' : 'Kunci'}
  >
    {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
  </button>
  <button
    onClick={(e) => { e.stopPropagation(); handleDelete(obj); }}
    className="p-1 hover:bg-red-100 rounded text-gray-400 hover:text-red-500 flex-shrink-0"
    title="Hapus"
  >
    <Trash2 className="w-3 h-3" />
  </button>
</div>
```

- [ ] **Step 4: Verify the dev server still compiles**

```bash
npm run dev
```

Open http://localhost:3000/admin/poster-maker. Add a few objects, check that layer rows now show only 3 buttons (eye, lock, delete) and that long names truncate cleanly instead of wrapping.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/PosterMaker/LayerPanel.tsx
git commit -m "feat(poster-maker): slim layer rows — remove z-order buttons, fix name truncation"
```

---

## Task 2: Font Picker Enhancement

**File:** `src/components/admin/PosterMaker/PropertiesPanel.tsx`

Replace the native `<select>` with a custom `FontPicker` component. Expand GOOGLE_FONTS to 31 fonts with Plus Jakarta Sans first. Change the default font.

- [ ] **Step 1: Replace the GOOGLE_FONTS array**

Find the `GOOGLE_FONTS` constant near the top of `PropertiesPanel.tsx` and replace it entirely:

```ts
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
  'Pacifico', 'Dancing Script', 'Caveat',
  // Arabic
  'Amiri', 'Noto Sans Arabic', 'Cairo', 'Tajawal',
];
```

- [ ] **Step 2: Update eager-load to always include Plus Jakarta Sans**

Find the line:
```ts
GOOGLE_FONTS.slice(0, 10).forEach(loadGoogleFont);
```
Replace with:
```ts
['Plus Jakarta Sans', ...GOOGLE_FONTS.slice(0, 9)].forEach(loadGoogleFont);
```

- [ ] **Step 3: Change the default fontFamily state**

Find:
```ts
const [fontFamily, setFontFamily] = useState('Inter');
```
Change to:
```ts
const [fontFamily, setFontFamily] = useState('Plus Jakarta Sans');
```

- [ ] **Step 4: Add the FontPicker component**

Add this component definition immediately before the `PropertiesPanel` component (after the `GOOGLE_FONTS` constant and `loadGoogleFont` function):

```tsx
const FontPicker: React.FC<{ value: string; onChange: (font: string) => void }> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    GOOGLE_FONTS.forEach(loadGoogleFont);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const filtered = GOOGLE_FONTS.filter(f => f.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between border border-gray-300 rounded-lg px-2 py-1.5 bg-white hover:border-primary transition text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        style={{ fontFamily: value }}
      >
        <span className="truncate min-w-0">{value}</span>
        <ChevronDown className={`w-3 h-3 text-gray-400 ml-2 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input
              autoFocus
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari font..."
              className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.map(font => (
              <button
                key={font}
                onClick={() => { onChange(font); setOpen(false); setSearch(''); }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between transition border-l-2
                  ${value === font ? 'border-primary bg-emerald-50/50' : 'border-transparent'}`}
                style={{ fontFamily: font }}
              >
                <span className="truncate min-w-0">{font}</span>
                {font === 'Plus Jakarta Sans' && (
                  <span className="text-[9px] font-bold bg-primary text-white px-1.5 py-0.5 rounded-full ml-2 flex-shrink-0" style={{ fontFamily: 'Inter, sans-serif' }}>
                    DEFAULT
                  </span>
                )}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-4 text-xs text-gray-400 text-center">Tidak ditemukan</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 5: Replace the `<select>` with `<FontPicker />`**

Inside `PropertiesPanel`, find the Font section (inside the `{isText && (...)}` block). Replace:

```tsx
<select
  value={fontFamily}
  onChange={(e) => handleFontChange(e.target.value)}
  className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
  style={{ fontFamily }}
>
  {GOOGLE_FONTS.map(f => (
    <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
  ))}
</select>
```

With:

```tsx
<FontPicker value={fontFamily} onChange={handleFontChange} />
```

- [ ] **Step 6: Verify**

In the dev server, select a text object on the canvas. The font section should now show a styled button. Clicking it opens a scrollable dropdown with font names rendered in their typefaces. Searching filters the list. Selecting a font applies it to the text.

- [ ] **Step 7: Commit**

```bash
git add src/components/admin/PosterMaker/PropertiesPanel.tsx
git commit -m "feat(poster-maker): FontPicker with inline preview, Plus Jakarta Sans default, 28-font list"
```

---

## Task 3: FabricCanvas New Methods

**File:** `src/components/admin/PosterMaker/FabricCanvas.tsx`

Add `addArrow`, `addDivider`, `setFreehandMode`, `isFreehandMode` to the ref. Update `addText` default font.

- [ ] **Step 1: Update imports**

Find the import line:
```ts
import { Canvas, Rect, Textbox, Circle, Line, FabricImage, FabricObject } from 'fabric';
```
Add `Path` and `PencilBrush`:
```ts
import { Canvas, Rect, Textbox, Circle, Line, Path, PencilBrush, FabricImage, FabricObject } from 'fabric';
```

- [ ] **Step 2: Add `buildWavyPath` helper**

Add this pure function immediately before the `FabricCanvas` component definition:

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
```

- [ ] **Step 3: Add `freehandRef` inside the component**

Inside the `FabricCanvas` component body, after the existing `useRef` declarations, add:

```ts
const freehandRef = useRef(false);
```

- [ ] **Step 4: Update the `FabricCanvasRef` interface**

Find the `FabricCanvasRef` interface near the top of the file. Add four new method signatures:

```ts
export interface FabricCanvasRef {
  // ... existing methods ...
  addArrow: () => void;
  addDivider: () => void;
  setFreehandMode: (enabled: boolean) => void;
  isFreehandMode: () => boolean;
}
```

- [ ] **Step 5: Update `addText` default font**

Inside `useImperativeHandle`, find the `addText` implementation. Change `fontFamily: 'Inter, sans-serif'` to:

```ts
fontFamily: 'Plus Jakarta Sans, sans-serif',
```

- [ ] **Step 6: Add `addArrow` to `useImperativeHandle`**

Add after the existing `addLine` method:

```ts
addArrow: () => {
  const c = fabricRef.current;
  if (!c) return;
  const arrowPath = 'M 0 15 L 250 15 L 250 0 L 300 20 L 250 40 L 250 25 L 0 25 Z';
  const arrow = new Path(arrowPath, {
    left: (c.width ?? 1080) / 2 - 150,
    top: (c.height ?? 1350) / 2 - 20,
    fill: '#1a1a1a',
    stroke: '',
    strokeWidth: 0,
    originX: 'left',
    originY: 'top',
  });
  c.add(arrow);
  c.setActiveObject(arrow);
  c.requestRenderAll();
},
```

- [ ] **Step 7: Add `addDivider` to `useImperativeHandle`**

Add after `addArrow`:

```ts
addDivider: () => {
  const c = fabricRef.current;
  if (!c) return;
  const w = (c.width ?? 1080) * 0.8;
  const divider = new Path(buildWavyPath(w), {
    left: (c.width ?? 1080) * 0.1,
    top: (c.height ?? 1350) / 2,
    stroke: '#1a1a1a',
    strokeWidth: 4,
    fill: '',
    strokeLineCap: 'round',
    strokeLineJoin: 'round',
    originX: 'left',
    originY: 'center',
  });
  c.add(divider);
  c.setActiveObject(divider);
  c.requestRenderAll();
},
```

- [ ] **Step 8: Add `setFreehandMode` and `isFreehandMode` to `useImperativeHandle`**

Add after `addDivider`:

```ts
setFreehandMode: (enabled: boolean) => {
  const c = fabricRef.current;
  if (!c) return;
  freehandRef.current = enabled;
  c.isDrawingMode = enabled;
  if (enabled) {
    const brush = new PencilBrush(c);
    brush.color = '#1a1a1a';
    brush.width = 4;
    c.freeDrawingBrush = brush;
  } else {
    c.selection = true;
  }
},

isFreehandMode: () => freehandRef.current,
```

- [ ] **Step 9: Verify the dev server compiles**

```bash
npm run dev
```

There should be no TypeScript errors. The new methods are on the ref but not yet wired to the toolbar — that's fine for now.

- [ ] **Step 10: Commit**

```bash
git add src/components/admin/PosterMaker/FabricCanvas.tsx
git commit -m "feat(poster-maker): add addArrow, addDivider, setFreehandMode to FabricCanvas ref"
```

---

## Task 4: EditorToolbar New Tools

**File:** `src/components/admin/PosterMaker/EditorToolbar.tsx`

Add three new insert buttons (Arrow, Freehand toggle, Divider) and an `isFreehandActive` prop.

- [ ] **Step 1: Update lucide-react imports**

Find the import line at the top. Add `MoveRight, Pencil, Waves`:

```ts
import {
  Type, Square, Circle, Minus, ImagePlus, Trash2,
  AlignLeft, AlignCenter, AlignRight,
  ChevronUp, ChevronDown, ChevronsUp, ChevronsDown,
  Download, Loader2, RectangleHorizontal, RectangleVertical,
  Undo, Redo, Copy, Clipboard, CopyPlus,
  MoveRight, Pencil, Waves,
} from 'lucide-react';
```

- [ ] **Step 2: Add new props to `EditorToolbarProps`**

Find the `EditorToolbarProps` interface. Add:

```ts
interface EditorToolbarProps {
  // ... existing props ...
  onAddArrow: () => void;
  onToggleFreehand: () => void;
  onAddDivider: () => void;
  isFreehandActive: boolean;
}
```

- [ ] **Step 3: Destructure new props in the component signature**

Find the `EditorToolbar: React.FC<EditorToolbarProps> = ({` line. Add `onAddArrow, onToggleFreehand, onAddDivider, isFreehandActive` to the destructuring:

```ts
const EditorToolbar: React.FC<EditorToolbarProps> = ({
  canvasSize, isExporting,
  onAddText, onAddRect, onAddCircle, onAddLine, onAddImage,
  onAddArrow, onToggleFreehand, onAddDivider, isFreehandActive,
  onDelete, onAlignLeft, onAlignCenter, onAlignRight,
  onBringForward, onSendBackward, onSendToFront, onSendToBack,
  onCopy, onPaste, onDuplicate,
  onExport, onSetCanvasSize,
  onUndo, onRedo, canUndo, canRedo,
}) => {
```

- [ ] **Step 4: Add the three new buttons after the Line button**

Find:
```tsx
<ToolBtn onClick={onAddLine} title="Add Line"><Minus className="w-4 h-4" /></ToolBtn>
<ToolBtn onClick={onAddImage} title="Add Image"><ImagePlus className="w-4 h-4" /></ToolBtn>
```

Replace with:
```tsx
<ToolBtn onClick={onAddLine} title="Add Line"><Minus className="w-4 h-4" /></ToolBtn>
<ToolBtn onClick={onAddArrow} title="Tambah Panah"><MoveRight className="w-4 h-4" /></ToolBtn>
<ToolBtn
  onClick={onToggleFreehand}
  title="Gambar Bebas (Freehand)"
  active={isFreehandActive}
>
  <Pencil className="w-4 h-4" />
</ToolBtn>
<ToolBtn onClick={onAddDivider} title="Tambah Divider Dekoratif"><Waves className="w-4 h-4" /></ToolBtn>
<ToolBtn onClick={onAddImage} title="Add Image"><ImagePlus className="w-4 h-4" /></ToolBtn>
```

- [ ] **Step 5: Verify**

```bash
npm run dev
```

The toolbar should show Arrow, Pencil, and Waves buttons between the Line and Image buttons. The Pencil button should highlight when `isFreehandActive` is true. There will be TypeScript errors in `PosterMaker.tsx` because it hasn't been updated yet — those are expected and will be fixed in Task 5.

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/PosterMaker/EditorToolbar.tsx
git commit -m "feat(poster-maker): add Arrow, Freehand, Divider buttons to EditorToolbar"
```

---

## Task 5: Layout Restructure + New Design Modal

**File:** `src/pages/admin/PosterMaker.tsx`

This is the largest change. It removes `viewState`, adds the `NewDesignModal` component, restructures the grid to 9/3, adds the freehand brush strip, and wires everything up.

- [ ] **Step 1: Remove the `ViewState` type and replace imports/state**

At the top of `PosterMaker.tsx`, find:
```ts
type ViewState = 'pick-template' | 'fill-content' | 'editing';
```
Delete it entirely.

Find:
```ts
import { Loader2, Sparkles, LayoutTemplate, Save, X, Image as ImageIcon } from 'lucide-react';
```
Replace with (adds `Plus`):
```ts
import { Loader2, Sparkles, LayoutTemplate, Save, X, Image as ImageIcon, Plus } from 'lucide-react';
```

- [ ] **Step 2: Replace state declarations**

Find and delete:
```ts
const [viewState, setViewState] = useState<ViewState>('pick-template');
```

Add these new state variables after the existing `canvasSize` state:
```ts
const [isNewDesignModalOpen, setIsNewDesignModalOpen] = useState(true);
const [isFreehandActive, setIsFreehandActive] = useState(false);
const [brushColor, setBrushColor] = useState('#1a1a1a');
const [brushWidth, setBrushWidth] = useState(4);
```

Update `rightTab` type to include `'ai'`:
```ts
const [rightTab, setRightTab] = useState<'layers' | 'properties' | 'assets' | 'drafts' | 'ai'>('layers');
```

- [ ] **Step 3: Add the `NewDesignModal` component**

Add this entire component definition immediately before the `// ── Main Component` comment:

```tsx
// ── New Design Modal ──────────────────────────────────────────────────────────
interface NewDesignModalProps {
  canDismiss: boolean;
  starterOverrides: Map<string, SavedTemplate>;
  customTemplates: SavedTemplate[];
  onPickBlank: (size: CanvasSize) => void;
  onPickStarter: (t: PosterTemplate) => void;
  onPickCustom: (t: SavedTemplate) => void;
  onClose: () => void;
}

const NewDesignModal: React.FC<NewDesignModalProps> = ({
  canDismiss, starterOverrides, customTemplates,
  onPickBlank, onPickStarter, onPickCustom, onClose,
}) => {
  const [size, setSize] = useState<CanvasSize>('post');
  const visibleStarters = STARTER_TEMPLATES.filter(t => t.aspectRatio === size);
  const visibleCustom = customTemplates.filter(t => t.aspect_ratio === size);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-5 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Buat Desain Baru</h2>
          {canDismiss && (
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 transition">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Size picker */}
        <div className="flex-shrink-0 mb-5">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Ukuran Kanvas</p>
          <div className="flex gap-3">
            {(['post', 'story'] as const).map(s => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`flex-1 border-2 rounded-xl p-3 text-center transition-all ${
                  size === s ? 'border-primary bg-emerald-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`text-2xl font-black leading-none ${size === s ? 'text-primary' : 'text-gray-400'}`}>
                  {s === 'post' ? '4:5' : '9:16'}
                </div>
                <div className={`text-[10px] font-semibold mt-1 ${size === s ? 'text-primary' : 'text-gray-400'}`}>
                  {s === 'post' ? 'Post · 1080×1350' : 'Story · 1080×1920'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Template grid */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Pilih Template</p>
          <div className="grid grid-cols-4 gap-3">
            {/* Blank canvas */}
            <button
              onClick={() => onPickBlank(size)}
              className="border-2 border-dashed border-primary rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-all group flex flex-col items-center justify-center"
              style={{ aspectRatio: size === 'post' ? '4/5' : '9/16' }}
            >
              <Plus className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold text-primary mt-1 text-center leading-tight">
                Kanvas<br/>Kosong
              </span>
            </button>

            {/* Custom templates */}
            {visibleCustom.map(t => (
              <button
                key={t.id}
                onClick={() => onPickCustom(t)}
                className="rounded-xl border border-blue-200 hover:border-primary hover:shadow-md transition-all overflow-hidden bg-white"
                style={{ aspectRatio: size === 'post' ? '4/5' : '9/16' }}
                title={t.name}
              >
                {t.thumbnail_data_url
                  ? <img src={t.thumbnail_data_url} alt={t.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-gray-100 flex items-center justify-center"><LayoutTemplate className="w-5 h-5 text-gray-300" /></div>
                }
              </button>
            ))}

            {/* Starter templates */}
            {visibleStarters.map(t => {
              const override = starterOverrides.get(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => onPickStarter(t)}
                  className="rounded-xl border border-gray-200 hover:border-primary hover:shadow-md transition-all overflow-hidden bg-white relative"
                  style={{ aspectRatio: size === 'post' ? '4/5' : '9/16' }}
                  title={t.name}
                >
                  {override?.thumbnail_data_url
                    ? <img src={override.thumbnail_data_url} alt={t.name} className="w-full h-full object-cover" />
                    : <TemplateThumbnail t={t} />
                  }
                  {override && (
                    <span className="absolute top-1 right-1 text-[8px] font-bold bg-primary text-white px-1.5 py-0.5 rounded-full leading-none">
                      Modified
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => onPickBlank(size)}
          className="mt-5 w-full py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition flex-shrink-0"
        >
          Mulai Mendesain →
        </button>
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Update handler functions**

**Replace `handlePickTemplate`** — remove `setViewState` calls, close modal instead:

```ts
const handlePickTemplate = (template: PosterTemplate) => {
  setLoadedStarterId(template.id);
  const override = starterOverrides.get(template.id);
  if (override) {
    setLoadedTemplate(template);
    setCanvasSize(override.aspect_ratio);
    setEditingTemplateId(override.id);
    setEditingTemplateName(override.name);
    setTimeout(() => canvasRef.current?.loadTemplate(override.canvas_json), 200);
    setIsNewDesignModalOpen(false);
    return;
  }
  setLoadedTemplate(template);
  setCanvasSize(template.aspectRatio);
  setEditingTemplateId(null);
  setEditingTemplateName(template.name);
  setTimeout(() => canvasRef.current?.loadTemplate(template.json), 200);
  const type = getTemplateType(template);
  if (type !== 'blank') setRightTab('ai');
  setIsNewDesignModalOpen(false);
};
```

**Replace `handlePickCustomTemplate`**:

```ts
const handlePickCustomTemplate = (t: SavedTemplate) => {
  const poster = savedToPoster(t);
  setLoadedTemplate(poster);
  setCanvasSize(t.aspect_ratio);
  setEditingTemplateId(t.id);
  setEditingTemplateName(t.name);
  setTimeout(() => canvasRef.current?.loadTemplate(t.canvas_json), 200);
  setIsNewDesignModalOpen(false);
};
```

**Add `handlePickBlank`** (new function):

```ts
const handlePickBlank = (size: CanvasSize) => {
  setLoadedTemplate(null);
  setEditingTemplateId(null);
  setEditingTemplateName('');
  setLoadedStarterId(null);
  setCanvasSize(size);
  setTimeout(() => {
    const canvas = canvasRef.current?.getCanvas();
    if (canvas) {
      canvas.clear();
      canvas.backgroundColor = '#ffffff';
      canvas.requestRenderAll();
    }
  }, 200);
  setIsNewDesignModalOpen(false);
};
```

**Replace `handleChangeTemplate`**:

```ts
const handleChangeTemplate = () => {
  setIsNewDesignModalOpen(true);
};
```

**Update `handleGenerateAndApply`** — remove the `setViewState('editing')` line near the end. The function stays the same otherwise; just delete:
```ts
setViewState('editing');
```

**Add freehand handlers** (new functions):

```ts
const handleToggleFreehand = () => {
  const next = !isFreehandActive;
  setIsFreehandActive(next);
  canvasRef.current?.setFreehandMode(next);
};

const handleBrushColorChange = (color: string) => {
  setBrushColor(color);
  const canvas = canvasRef.current?.getCanvas();
  if (canvas?.freeDrawingBrush) (canvas.freeDrawingBrush as any).color = color;
};

const handleBrushWidthChange = (width: number) => {
  setBrushWidth(width);
  const canvas = canvasRef.current?.getCanvas();
  if (canvas?.freeDrawingBrush) (canvas.freeDrawingBrush as any).width = width;
};
```

- [ ] **Step 5: Update the keyboard listener**

Inside the existing `handleKeyDown` `useEffect`, add an Escape handler. Find the `} else if (e.key === 'Delete' || e.key === 'Backspace') {` branch and add after it:

```ts
} else if (e.key === 'Escape') {
  if (canvasRef.current?.isFreehandMode()) {
    canvasRef.current.setFreehandMode(false);
    setIsFreehandActive(false);
  }
}
```

- [ ] **Step 6: Replace the main `return` JSX**

Replace the entire `return (...)` in `PosterMaker` with the following. This restructures the grid from 3/6/3 to 9/3, removes the left sidebar, adds the freehand strip, wires the new modal, and adds the `ai` tab:

```tsx
return (
  <div className="flex flex-col gap-4 overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
    {/* Header */}
    <div className="flex items-start justify-between gap-4 flex-shrink-0">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Poster Maker</h1>
        <p className="mt-1 text-sm text-gray-500">
          Design marketing posters with a full canvas editor, AI-powered copy, and your package assets.
        </p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <button
          onClick={handleChangeTemplate}
          className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 text-gray-600 rounded-lg text-sm font-semibold hover:border-gray-400 transition"
        >
          <LayoutTemplate className="w-4 h-4" />
          Buat / Ganti Desain
        </button>
        <button
          onClick={() => setIsSaveModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 border-2 border-primary text-primary rounded-lg text-sm font-semibold hover:bg-blue-50 transition"
        >
          <Save className="w-4 h-4" />
          {editingTemplateId ? 'Update / Simpan Template' : 'Simpan Template'}
        </button>
      </div>
    </div>

    {/* Toolbar */}
    <EditorToolbar
      canvasSize={canvasSize}
      isExporting={isExporting}
      onAddText={() => canvasRef.current?.addText()}
      onAddRect={() => canvasRef.current?.addRect()}
      onAddCircle={() => canvasRef.current?.addCircle()}
      onAddLine={() => canvasRef.current?.addLine()}
      onAddArrow={() => canvasRef.current?.addArrow()}
      onToggleFreehand={handleToggleFreehand}
      onAddDivider={() => canvasRef.current?.addDivider()}
      onAddImage={handleAddImage}
      isFreehandActive={isFreehandActive}
      onDelete={() => canvasRef.current?.deleteSelected()}
      onAlignLeft={() => canvasRef.current?.alignLeft()}
      onAlignCenter={() => canvasRef.current?.alignCenter()}
      onAlignRight={() => canvasRef.current?.alignRight()}
      onBringForward={() => canvasRef.current?.bringForward()}
      onSendBackward={() => canvasRef.current?.sendBackward()}
      onSendToFront={() => canvasRef.current?.sendToFront()}
      onSendToBack={() => canvasRef.current?.sendToBack()}
      onCopy={() => canvasRef.current?.copySelected()}
      onPaste={() => canvasRef.current?.paste()}
      onDuplicate={() => canvasRef.current?.duplicateSelected()}
      onExport={handleExport}
      onSetCanvasSize={handleSizeChange}
      onUndo={() => canvasRef.current?.undo()}
      onRedo={() => canvasRef.current?.redo()}
      canUndo={canUndo}
      canRedo={canRedo}
    />

    {/* Main Layout — 9/3 */}
    <div className="grid grid-cols-1 lg:grid-cols-12 lg:grid-rows-1 gap-4 flex-1 min-h-0">

      {/* Center: Canvas (col-span-9) */}
      <div className="lg:col-span-9 lg:h-full flex flex-col relative">

        {/* Freehand brush strip */}
        {isFreehandActive && (
          <div className="flex items-center gap-4 px-4 py-2 bg-violet-50 border border-violet-200 rounded-lg mb-2 flex-shrink-0">
            <span className="text-xs font-semibold text-violet-700 flex items-center gap-1.5">
              ✏️ Mode Gambar Bebas
            </span>
            <div className="flex items-center gap-2">
              <label className="text-xs text-violet-600">Warna</label>
              <input
                type="color"
                value={brushColor}
                onChange={e => handleBrushColorChange(e.target.value)}
                className="w-7 h-7 rounded border border-violet-200 cursor-pointer p-0"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-violet-600">Ukuran: {brushWidth}px</label>
              <input
                type="range" min={2} max={40} value={brushWidth}
                onChange={e => handleBrushWidthChange(parseInt(e.target.value))}
                className="w-24 accent-violet-600"
              />
            </div>
            <span className="text-xs text-violet-400 ml-auto">Tekan Esc untuk keluar</span>
          </div>
        )}

        <div
          className="flex-1 min-h-0 flex flex-col"
          onContextMenu={e => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY }); }}
          onWheel={e => {
            if (!e.ctrlKey && !e.metaKey) return;
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.05 : 0.05;
            const next = Math.min(2, Math.max(0.1, parseFloat((zoom + delta).toFixed(2))));
            canvasRef.current?.setZoom(next);
          }}
        >
          <FabricCanvas
            ref={canvasRef}
            canvasSize={canvasSize}
            onSelectionChange={handleSelectionChange}
            onCanvasModified={() => { refreshLayers(); setPropRefreshKey(k => k + 1); }}
            onHistoryChange={handleHistoryChange}
            onZoomChange={setZoom}
            onObjectTransforming={handleObjectTransforming}
          />
        </div>
        <CanvasZoom
          zoom={zoom}
          fitScale={canvasRef.current?.getFitScale() ?? zoom}
          onZoomChange={level => canvasRef.current?.setZoom(level)}
          onFit={() => {
            const fit = canvasRef.current?.getFitScale() ?? zoom;
            canvasRef.current?.setZoom(fit);
          }}
        />
      </div>

      {/* Right Sidebar (col-span-3) */}
      <div className="lg:col-span-3 lg:h-full">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
          <div className="flex border-b border-gray-200 overflow-x-auto flex-shrink-0">
            {(['layers', 'properties', 'assets', 'drafts'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setRightTab(tab)}
                className={`flex-1 py-2.5 text-xs font-semibold capitalize transition whitespace-nowrap ${
                  rightTab === tab
                    ? 'text-primary border-b-2 border-primary bg-blue-50/50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
            {loadedTemplate && templateType !== 'blank' && !editingTemplateId && (
              <button
                onClick={() => setRightTab('ai')}
                className={`flex-1 py-2.5 text-xs font-semibold transition whitespace-nowrap ${
                  rightTab === 'ai'
                    ? 'text-primary border-b-2 border-primary bg-blue-50/50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                ✦ AI
              </button>
            )}
          </div>
          <div className="p-4 overflow-y-auto flex-1 min-h-0">
            {rightTab === 'layers' && (
              <LayerPanel
                canvas={canvasRef.current?.getCanvas() || null}
                refreshKey={layerRefreshKey}
              />
            )}
            {rightTab === 'properties' && (
              <PropertiesPanel
                canvas={canvasRef.current?.getCanvas() || null}
                selectedObject={selectedObject}
                refreshKey={propRefreshKey}
              />
            )}
            {rightTab === 'assets' && (
              <AssetPanel onAddImage={url => canvasRef.current?.addImageFromUrl(url)} />
            )}
            {rightTab === 'drafts' && (
              <DraftPanel
                canvas={canvasRef.current?.getCanvas() || null}
                onLoadDraft={handleLoadDraft}
              />
            )}
            {rightTab === 'ai' && loadedTemplate && templateType !== 'blank' && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  AI Content
                </h3>
                {renderAiInputs()}
                <button
                  onClick={handleGenerateAndApply}
                  disabled={isGenerating}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition disabled:opacity-50"
                >
                  {isGenerating
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Sparkles className="w-4 h-4" />
                  }
                  Generate & Terapkan
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Save Template Modal */}
    {isSaveModalOpen && (
      <SaveModal
        initialName={editingTemplateName}
        isEditing={!!editingTemplateId}
        isStarterOverride={!!loadedStarterId && !editingTemplateId}
        isSaving={isSaving}
        onSaveNew={handleSaveNew}
        onUpdate={handleUpdate}
        onClose={() => setIsSaveModalOpen(false)}
      />
    )}

    {/* New Design Modal */}
    {isNewDesignModalOpen && (
      <NewDesignModal
        canDismiss={loadedTemplate !== null || editingTemplateId !== null}
        starterOverrides={starterOverrides}
        customTemplates={customTemplates}
        onPickBlank={handlePickBlank}
        onPickStarter={handlePickTemplate}
        onPickCustom={handlePickCustomTemplate}
        onClose={() => setIsNewDesignModalOpen(false)}
      />
    )}

    {/* Context Menu */}
    {contextMenu && (
      <CanvasContextMenu
        x={contextMenu.x}
        y={contextMenu.y}
        selectedObject={selectedObject}
        onClose={() => setContextMenu(null)}
        onCopy={() => canvasRef.current?.copySelected()}
        onPaste={() => canvasRef.current?.paste()}
        onDuplicate={() => canvasRef.current?.duplicateSelected()}
        onSendToFront={() => canvasRef.current?.sendToFront()}
        onBringForward={() => canvasRef.current?.bringForward()}
        onSendBackward={() => canvasRef.current?.sendBackward()}
        onSendToBack={() => canvasRef.current?.sendToBack()}
        onToggleLock={handleContextMenuToggleLock}
        onDelete={() => canvasRef.current?.deleteSelected()}
      />
    )}
  </div>
);
```

- [ ] **Step 7: Clean up unused variables**

Remove references to `viewState`, `setViewState` anywhere they appear as leftover dead code (search for `viewState` in the file and delete any remaining uses). Also remove the unused `renderStarterGroup` and `renderCustomGroup` functions that were part of the old left sidebar — they are no longer called.

- [ ] **Step 8: Verify full flow**

```bash
npm run dev
```

Check:
1. Page loads → "Buat Desain Baru" modal opens automatically
2. Size toggle switches between Post/Story
3. Clicking "Kanvas Kosong" or "Mulai Mendesain →" closes modal and shows blank canvas
4. "Buat / Ganti Desain" button in header reopens modal
5. Canvas takes ~75% of the width
6. Arrow button adds a right-pointing arrow shape
7. Pencil button activates freehand mode: brush strip appears, drawing works, Esc exits
8. Waves button adds a wavy divider line
9. Layer rows show only 3 buttons (eye, lock, delete), names don't wrap
10. Selecting a text object → Properties tab → font picker opens dropdown with font previews
11. "✦ AI" tab appears in right panel when a non-blank template is loaded

- [ ] **Step 9: Commit**

```bash
git add src/pages/admin/PosterMaker.tsx
git commit -m "feat(poster-maker): canvas-first layout, NewDesignModal, freehand brush strip, AI tab"
```

---

## Self-Review Checklist

- [x] Layer panel: z-order buttons removed, `min-w-0` truncation fix ✓
- [x] Font picker: `FontPicker` component, 28-font list, Plus Jakarta Sans default and badge ✓
- [x] `addText` default font updated to Plus Jakarta Sans ✓
- [x] `addArrow` uses correct SVG path, centered on canvas ✓
- [x] `addDivider` uses `buildWavyPath` at 80% canvas width, centered ✓
- [x] `setFreehandMode` restores `canvas.selection = true` on disable ✓
- [x] `isFreehandMode()` reads from `freehandRef` (fresh value, no stale closure) ✓
- [x] Escape key calls `canvasRef.current?.isFreehandMode()` to avoid stale closure ✓
- [x] `handlePickTemplate` removes `setViewState` and closes modal ✓
- [x] `handleGenerateAndApply` has `setViewState('editing')` removed ✓
- [x] `NewDesignModal` `canDismiss` prevents close on first open ✓
- [x] AI tab only visible for non-blank, non-edit-mode templates ✓
- [x] `renderStarterGroup`/`renderCustomGroup` dead code removed ✓
- [x] `handleLoadDraft` still works (no viewState dependency) ✓
