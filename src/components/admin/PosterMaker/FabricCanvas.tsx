import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState } from 'react';
import { Canvas, Rect, Textbox, Circle, Line, Path, PencilBrush, FabricImage, FabricObject } from 'fabric';
import { installSceneSnap } from './fabricSnap';

export type CanvasSize = 'post' | 'story';

const CANVAS_DIMENSIONS: Record<CanvasSize, { width: number; height: number }> = {
    post: { width: 1080, height: 1350 },
    story: { width: 1080, height: 1920 },
};

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

export interface FabricCanvasRef {
    getCanvas: () => Canvas | null;
    addText: (text?: string) => void;
    isTextPlacementMode: () => boolean;
    cancelTextPlacement: () => void;
    addRect: () => void;
    addCircle: () => void;
    addLine: () => void;
    addImageFromUrl: (url: string) => void;
    deleteSelected: () => void;
    bringForward: () => void;
    sendBackward: () => void;
    sendToFront: () => void;
    sendToBack: () => void;
    copySelected: () => void;
    paste: () => void;
    duplicateSelected: () => void;
    alignLeft: () => void;
    alignCenter: () => void;
    alignRight: () => void;
    exportPng: () => Promise<string | null>;
    loadTemplate: (json: object) => void;
    setCanvasSize: (size: CanvasSize) => void;
    setZoom: (level: number) => void;
    getZoom: () => number;
    getFitScale: () => number;
    undo: () => void;
    redo: () => void;
    addArrow: () => void;
    addDivider: () => void;
    setFreehandMode: (enabled: boolean) => void;
    isFreehandMode: () => boolean;
    cancelDraw: () => void;
}

interface FabricCanvasProps {
    canvasSize: CanvasSize;
    onSelectionChange?: (obj: FabricObject | null) => void;
    onCanvasModified?: () => void;
    onHistoryChange?: (canUndo: boolean, canRedo: boolean) => void;
    onZoomChange?: (zoom: number) => void;
    onObjectTransforming?: (obj: FabricObject) => void;
    onDrawModeChange?: (mode: string | null) => void;
}

// Module-level clipboard so copy/paste works across renders
let clipboard: FabricObject | null = null;

const FabricCanvas = forwardRef<FabricCanvasRef, FabricCanvasProps>(
    ({ canvasSize, onSelectionChange, onCanvasModified, onHistoryChange, onZoomChange, onObjectTransforming, onDrawModeChange }, ref) => {
        const canvasEl = useRef<HTMLCanvasElement>(null);
        const wrapperRef = useRef<HTMLDivElement>(null);
        const fabricRef = useRef<Canvas | null>(null);
        const [scale, setScale] = useState(0.35);
        const scaleRef = useRef(0.35);

        // History State
        const history = useRef<object[]>([]);
        const historyIndex = useRef<number>(-1);
        const isHistoryProcessing = useRef(false);
        const freehandRef = useRef(false);
        const textPlacementRef = useRef(false);
        const drawModeRef    = useRef<'rect' | 'circle' | 'line' | 'arrow' | 'divider' | null>(null);
        const drawStartRef   = useRef<{ x: number; y: number } | null>(null);
        const previewObjectRef = useRef<FabricObject | null>(null);

        const updateHistoryState = () => {
            if (onHistoryChange) {
                const canUndo = historyIndex.current > 0;
                const canRedo = historyIndex.current < history.current.length - 1;
                onHistoryChange(canUndo, canRedo);
            }
        };

        const saveHistory = (c: Canvas) => {
            if (isHistoryProcessing.current) return;
            if (historyIndex.current < history.current.length - 1) {
                history.current = history.current.slice(0, historyIndex.current + 1);
            }
            history.current.push(c.toJSON());
            historyIndex.current = history.current.length - 1;
            updateHistoryState();
        };

        const calcFitScale = () => {
            const dims = CANVAS_DIMENSIONS[canvasSize];
            const maxH = window.innerHeight - 200;
            const maxW = Math.min(820, window.innerWidth * 0.52);
            return Math.min(maxW / dims.width, maxH / dims.height, 0.65);
        };

        // Initialize canvas
        useEffect(() => {
            if (!canvasEl.current) return;

            const dims = CANVAS_DIMENSIONS[canvasSize];
            const canvas = new Canvas(canvasEl.current, {
                width: dims.width,
                height: dims.height,
                backgroundColor: '#ffffff',
                preserveObjectStacking: true,
                uniformScaling: false,
                uniScaleKey: 'shiftKey',
            });

            fabricRef.current = canvas;
            installSceneSnap(canvas);

            setTimeout(() => saveHistory(canvas), 100);

            canvas.on('selection:created', (e) => onSelectionChange?.(e.selected?.[0] || null));
            canvas.on('selection:updated', (e) => onSelectionChange?.(e.selected?.[0] || null));
            canvas.on('selection:cleared', () => onSelectionChange?.(null));
            canvas.on('object:modified', () => { onCanvasModified?.(); saveHistory(canvas); });
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
            canvas.on('object:scaling', (e) => { if (e.target) onObjectTransforming?.(e.target as FabricObject); });
            canvas.on('object:moving', (e) => { if (e.target) onObjectTransforming?.(e.target as FabricObject); });

            canvas.on('mouse:down', (e) => {
                const { x, y } = e.scenePoint;

                // --- Text placement mode ---
                if (textPlacementRef.current) {
                    if (e.target) return;
                    textPlacementRef.current = false;
                    canvas.defaultCursor = 'default';
                    canvas.hoverCursor = 'move';
                    const tb = new Textbox('', {
                        left: x, top: y, originX: 'left', originY: 'top',
                        width: 400, fontSize: 48,
                        fontFamily: 'Plus Jakarta Sans, sans-serif',
                        fill: '#1a1a1a', fontWeight: 'normal', editable: true,
                    });
                    canvas.add(tb);
                    canvas.setActiveObject(tb);
                    canvas.requestRenderAll();
                    tb.enterEditing();
                    tb.on('editing:exited', () => {
                        if (!tb.text || tb.text.trim() === '') {
                            canvas.remove(tb);
                            canvas.requestRenderAll();
                        }
                    });
                    return;
                }

                // --- Draw mode ---
                if (!drawModeRef.current) return;
                if (e.target) return; // ignore clicks on existing objects

                drawStartRef.current = { x, y };
                canvas.selection = false;

                const mode = drawModeRef.current;
                let preview: FabricObject;

                if (mode === 'rect') {
                    preview = new Rect({
                        left: x, top: y, originX: 'left', originY: 'top',
                        width: 1, height: 1, fill: '#10b981', rx: 12, ry: 12,
                    });
                } else if (mode === 'circle') {
                    preview = new Circle({
                        left: x, top: y, originX: 'left', originY: 'top',
                        radius: 1, fill: '#f59e0b',
                    });
                } else {
                    // line, arrow, divider — Line as lightweight preview
                    preview = new Line([x, y, x, y], {
                        stroke: '#1a1a1a', strokeWidth: 4,
                    });
                }

                (preview as any).isPreview = true;
                preview.set({ selectable: false, evented: false, opacity: 0.5 });
                previewObjectRef.current = preview;
                canvas.add(preview);
            });

            canvas.on('mouse:move', (e) => {
                if (!drawModeRef.current || !drawStartRef.current || !previewObjectRef.current) return;
                const { x: cx, y: cy } = e.scenePoint;
                const { x: sx, y: sy } = drawStartRef.current;
                const mode = drawModeRef.current;
                const preview = previewObjectRef.current;

                if (mode === 'rect') {
                    (preview as Rect).set({
                        left: Math.min(sx, cx),
                        top:  Math.min(sy, cy),
                        width:  Math.abs(cx - sx),
                        height: Math.abs(cy - sy),
                    });
                } else if (mode === 'circle') {
                    const radius  = Math.min(Math.abs(cx - sx), Math.abs(cy - sy)) / 2;
                    const centerX = (sx + cx) / 2;
                    const centerY = (sy + cy) / 2;
                    (preview as Circle).set({ left: centerX - radius, top: centerY - radius, radius });
                } else {
                    // line / arrow / divider — update the preview Line endpoint
                    (preview as Line).set({ x2: cx, y2: cy });
                }

                preview.setCoords();
                canvas.requestRenderAll();
            });

            canvas.on('mouse:up', (e) => {
                if (!drawModeRef.current || !drawStartRef.current || !previewObjectRef.current) return;
                const { x: ex, y: ey } = e.scenePoint;
                const { x: sx, y: sy } = drawStartRef.current;
                const dx = ex - sx;
                const dy = ey - sy;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const mode = drawModeRef.current;
                const preview = previewObjectRef.current;

                if (distance < 5) {
                    // Too small — remove preview, stay in draw mode so user can retry
                    canvas.remove(preview);
                    previewObjectRef.current = null;
                    drawStartRef.current = null;
                    canvas.selection = true;
                    return;
                }

                if (mode === 'rect') {
                    delete (preview as any).isPreview;
                    preview.set({ selectable: true, evented: true, opacity: 0.9 });
                    preview.setCoords();
                    canvas.setActiveObject(preview);
                    canvas.requestRenderAll();
                    saveHistory(canvas);
                    onCanvasModified?.();
                } else if (mode === 'circle') {
                    delete (preview as any).isPreview;
                    preview.set({ selectable: true, evented: true, opacity: 0.9 });
                    preview.setCoords();
                    canvas.setActiveObject(preview);
                    canvas.requestRenderAll();
                    saveHistory(canvas);
                    onCanvasModified?.();
                } else if (mode === 'line') {
                    delete (preview as any).isPreview;
                    preview.set({ selectable: true, evented: true, opacity: 1 });
                    preview.setCoords();
                    canvas.setActiveObject(preview);
                    canvas.requestRenderAll();
                    saveHistory(canvas);
                    onCanvasModified?.();
                } else if (mode === 'arrow') {
                    canvas.remove(preview); // isPreview flag → skipped by history handler
                    const length  = distance;
                    const angle   = Math.atan2(dy, dx) * (180 / Math.PI);
                    const headLen = Math.min(55, length * 0.35);
                    const half    = length / 2;
                    const bodyEnd = half - headLen;
                    const arrowPath = bodyEnd > 0
                        ? `M ${-half} -8 L ${bodyEnd} -8 L ${bodyEnd} -18 L ${half} 0 L ${bodyEnd} 18 L ${bodyEnd} 8 L ${-half} 8 Z`
                        : `M ${-half} -18 L ${half} 0 L ${-half} 18 Z`;
                    const arrow = new Path(arrowPath, {
                        left: (sx + ex) / 2,
                        top:  (sy + ey) / 2,
                        originX: 'center',
                        originY: 'center',
                        angle,
                        fill: '#1a1a1a',
                    });
                    canvas.add(arrow);
                    arrow.setCoords();
                    canvas.setActiveObject(arrow);
                    canvas.requestRenderAll();
                } else if (mode === 'divider') {
                    canvas.remove(preview);
                    const width = Math.max(80, distance);
                    const divider = new Path(buildWavyPath(width), {
                        left: Math.min(sx, ex),
                        top:  Math.min(sy, ey),
                        originX: 'left',
                        originY: 'top',
                        stroke: '#1a1a1a',
                        strokeWidth: 4,
                        fill: '',
                        strokeLineCap: 'round',
                        strokeLineJoin: 'round',
                    });
                    canvas.add(divider);
                    divider.setCoords();
                    canvas.setActiveObject(divider);
                    canvas.requestRenderAll();
                }

                // Exit draw mode
                previewObjectRef.current = null;
                drawStartRef.current     = null;
                drawModeRef.current      = null;
                canvas.selection         = true;
                canvas.defaultCursor     = 'default';
                canvas.hoverCursor       = 'move';
                onDrawModeChange?.(null);
            });

            // Fabric appends a hidden <textarea> (the keystroke sink for text editing)
            // and positions it via _calcTextareaPosition. That math mixes UNSCALED
            // in-canvas coords (clientWidth/Height ignore our ancestor `transform:
            // scale`) with the SCALED canvas offset from getBoundingClientRect, so the
            // returned document position lands far below the visible caret. On focus —
            // and again on every keystroke (updateTextareaPosition) — the browser
            // scroll-into-views that offscreen textarea, scrolling the window and
            // revealing blank space below the layout.
            //
            // Fix at the source: clamp the returned position into the current viewport.
            // If the (invisible, 1px, opacity:0) textarea is already on-screen, the
            // browser has nothing to scroll to — independent of scroll-into-view quirks
            // for any particular container. _calcTextareaPosition is used for both the
            // initial placement and every per-keystroke update, so patching it covers
            // all cases. Textbox extends IText (where the method lives) and is the only
            // editable text class used here, incl. objects rehydrated by loadFromJSON.
            type CaretProto = {
                _calcTextareaPosition?: () => { top: string; left: string; [k: string]: unknown };
                __caretClampPatched?: boolean;
            };
            const caretProto = Textbox.prototype as unknown as CaretProto;
            if (!caretProto.__caretClampPatched) {
                const original = caretProto._calcTextareaPosition!;
                caretProto.__caretClampPatched = true;
                caretProto._calcTextareaPosition = function (this: unknown) {
                    const r = original.call(this);
                    const top = parseFloat(r.top);
                    const left = parseFloat(r.left);
                    const clampedTop = Math.min(
                        Math.max(top, window.scrollY + 2),
                        window.scrollY + window.innerHeight - 6,
                    );
                    const clampedLeft = Math.min(
                        Math.max(left, window.scrollX + 2),
                        window.scrollX + window.innerWidth - 6,
                    );
                    return { ...r, top: `${clampedTop}px`, left: `${clampedLeft}px` };
                };
            }

            // TEMP DIAGNOSTIC — remove once verified. Silent on success: only logs if
            // the page still scrolls during text editing, reporting which element moved
            // and where Fabric's textarea actually is, so the real culprit is unambiguous.
            const onEditEntered = () => {
                const startY = window.scrollY;
                const startX = window.scrollX;
                const onScroll = (ev: Event) => {
                    const ta = document.querySelector('textarea[data-fabric="textarea"]') as HTMLElement | null;
                    const tgt = ev.target === document ? document.scrollingElement : (ev.target as HTMLElement);
                    // eslint-disable-next-line no-console
                    console.warn('[poster-caret-scroll] page scrolled during text edit', {
                        scrolledEl: tgt ? `${tgt.tagName}.${(tgt as HTMLElement).className || ''}` : String(ev.target),
                        windowScroll: { x: window.scrollX, y: window.scrollY, wasX: startX, wasY: startY },
                        textarea: ta
                            ? { parent: ta.parentElement?.tagName, top: ta.style.top, left: ta.style.left, rect: ta.getBoundingClientRect() }
                            : 'NOT FOUND',
                    });
                };
                document.addEventListener('scroll', onScroll, { capture: true, once: true });
                const cleanup = () => {
                    document.removeEventListener('scroll', onScroll, true);
                    canvas.off('text:editing:exited', cleanup);
                };
                canvas.on('text:editing:exited', cleanup);
            };
            canvas.on('text:editing:entered', onEditEntered);

            const handleEscape = (ev: KeyboardEvent) => {
                if (ev.key !== 'Escape') return;
                const c = fabricRef.current;
                if (!c) return;
                // Cancel text placement
                if (textPlacementRef.current) {
                    textPlacementRef.current = false;
                    c.defaultCursor = 'default';
                    c.hoverCursor = 'move';
                }
                // Cancel draw mode
                if (drawModeRef.current) {
                    if (previewObjectRef.current) {
                        c.remove(previewObjectRef.current);
                        previewObjectRef.current = null;
                    }
                    drawStartRef.current = null;
                    drawModeRef.current = null;
                    c.selection = true;
                    c.defaultCursor = 'default';
                    c.hoverCursor = 'move';
                    onDrawModeChange?.(null);
                    c.requestRenderAll();
                }
            };
            document.addEventListener('keydown', handleEscape);

            return () => {
                document.removeEventListener('keydown', handleEscape);
                canvas.off('text:editing:entered', onEditEntered);
                if (caretProto.__caretClampPatched) {
                    delete caretProto._calcTextareaPosition; // restore inherited IText method
                    delete caretProto.__caretClampPatched;
                }
                canvas.dispose();
                fabricRef.current = null;
            };
        }, [canvasSize]);

        // Calculate scale to fit in viewport
        useEffect(() => {
            const updateScale = () => {
                const s = calcFitScale();
                setScale(s);
                scaleRef.current = s;
                onZoomChange?.(s);
            };
            updateScale();
            window.addEventListener('resize', updateScale);
            return () => window.removeEventListener('resize', updateScale);
        }, [canvasSize]);

        useImperativeHandle(ref, () => ({
            getCanvas: () => fabricRef.current,

            addText: (text?: string) => {
                const c = fabricRef.current;
                if (!c) return;
                if (text !== undefined) {
                    // Programmatic: place at center with provided text
                    const tb = new Textbox(text, {
                        left: (c.width ?? 1080) / 2 - 200,
                        top: (c.height ?? 1350) / 2 - 24,
                        originX: 'left', originY: 'top',
                        width: 400, fontSize: 48,
                        fontFamily: 'Plus Jakarta Sans, sans-serif',
                        fill: '#1a1a1a', fontWeight: 'normal', editable: true,
                    });
                    c.add(tb);
                    c.setActiveObject(tb);
                    c.requestRenderAll();
                } else {
                    // Interactive: wait for click to place
                    textPlacementRef.current = true;
                    c.defaultCursor = 'text';
                    c.hoverCursor = 'text';
                }
            },

            isTextPlacementMode: () => textPlacementRef.current,

            cancelTextPlacement: () => {
                const c = fabricRef.current;
                textPlacementRef.current = false;
                if (c) { c.defaultCursor = 'default'; c.hoverCursor = 'move'; }
            },

            addRect: () => {
                const c = fabricRef.current;
                if (!c) return;
                const rect = new Rect({
                    left: 150, top: 150, originX: 'left', originY: 'top',
                    width: 300, height: 200, fill: '#10b981', rx: 12, ry: 12, opacity: 0.9,
                });
                c.add(rect);
                c.setActiveObject(rect);
                c.requestRenderAll();
            },

            addCircle: () => {
                const c = fabricRef.current;
                if (!c) return;
                const circle = new Circle({
                    left: 200, top: 200, originX: 'left', originY: 'top',
                    radius: 100, fill: '#f59e0b', opacity: 0.9,
                });
                c.add(circle);
                c.setActiveObject(circle);
                c.requestRenderAll();
            },

            addLine: () => {
                const c = fabricRef.current;
                if (!c) return;
                const line = new Line([100, 300, 500, 300], {
                    stroke: '#1a1a1a', strokeWidth: 4, originX: 'left', originY: 'top',
                });
                c.add(line);
                c.setActiveObject(line);
                c.requestRenderAll();
            },

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
                    originY: 'top',
                });
                c.add(divider);
                c.setActiveObject(divider);
                c.requestRenderAll();
            },

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

            cancelDraw: () => {
                const c = fabricRef.current;
                if (!c || !drawModeRef.current) return;
                if (previewObjectRef.current) {
                    c.remove(previewObjectRef.current);
                    previewObjectRef.current = null;
                }
                drawStartRef.current = null;
                drawModeRef.current = null;
                c.selection = true;
                c.defaultCursor = 'default';
                c.hoverCursor = 'move';
                onDrawModeChange?.(null);
            },

            addImageFromUrl: (url: string) => {
                const c = fabricRef.current;
                if (!c) return;
                const imgElement = document.createElement('img');
                imgElement.crossOrigin = 'anonymous';
                imgElement.onload = () => {
                    const fabricImg = new FabricImage(imgElement, {
                        left: 50, top: 50, originX: 'left', originY: 'top',
                    });
                    const maxDim = 500;
                    const imgScale = Math.min(maxDim / fabricImg.width!, maxDim / fabricImg.height!, 1);
                    fabricImg.scale(imgScale);
                    c.add(fabricImg);
                    c.setActiveObject(fabricImg);
                    c.requestRenderAll();
                };
                imgElement.onerror = () => console.error('Failed to load image:', url);
                imgElement.src = url;
            },

            deleteSelected: () => {
                const c = fabricRef.current;
                if (!c) return;
                const active = c.getActiveObjects();
                if (active.length > 0) {
                    active.forEach(obj => c.remove(obj));
                    c.discardActiveObject();
                    c.requestRenderAll();
                }
            },

            bringForward: () => {
                const c = fabricRef.current;
                if (!c) return;
                const active = c.getActiveObject();
                if (active) { c.bringObjectForward(active); c.requestRenderAll(); }
            },

            sendBackward: () => {
                const c = fabricRef.current;
                if (!c) return;
                const active = c.getActiveObject();
                if (active) { c.sendObjectBackwards(active); c.requestRenderAll(); }
            },

            sendToFront: () => {
                const c = fabricRef.current;
                if (!c) return;
                const active = c.getActiveObject();
                if (active) { c.bringObjectToFront(active); c.requestRenderAll(); }
            },

            sendToBack: () => {
                const c = fabricRef.current;
                if (!c) return;
                const active = c.getActiveObject();
                if (active) { c.sendObjectToBack(active); c.requestRenderAll(); }
            },

            copySelected: () => {
                const c = fabricRef.current;
                if (!c) return;
                const active = c.getActiveObject();
                if (active) {
                    active.clone().then((cloned: FabricObject) => { clipboard = cloned; });
                }
            },

            paste: () => {
                const c = fabricRef.current;
                if (!c || !clipboard) return;
                clipboard.clone().then((cloned: FabricObject) => {
                    c.discardActiveObject();
                    cloned.set({ left: (cloned.left ?? 0) + 20, top: (cloned.top ?? 0) + 20 });
                    c.add(cloned);
                    c.setActiveObject(cloned);
                    c.requestRenderAll();
                    clipboard = cloned;
                });
            },

            duplicateSelected: () => {
                const c = fabricRef.current;
                if (!c) return;
                const active = c.getActiveObject();
                if (!active) return;
                active.clone().then((cloned: FabricObject) => {
                    c.discardActiveObject();
                    cloned.set({ left: (cloned.left ?? 0) + 20, top: (cloned.top ?? 0) + 20 });
                    c.add(cloned);
                    c.setActiveObject(cloned);
                    c.requestRenderAll();
                });
            },

            alignLeft: () => {
                const c = fabricRef.current;
                if (!c) return;
                const active = c.getActiveObject();
                if (active) { active.set({ left: 0 }); c.requestRenderAll(); }
            },

            alignCenter: () => {
                const c = fabricRef.current;
                if (!c) return;
                const active = c.getActiveObject();
                if (active) { c.centerObjectH(active); c.requestRenderAll(); }
            },

            alignRight: () => {
                const c = fabricRef.current;
                if (!c) return;
                const active = c.getActiveObject();
                if (active) {
                    active.set({ left: c.width! - active.getScaledWidth() });
                    c.requestRenderAll();
                }
            },

            exportPng: async () => {
                const c = fabricRef.current;
                if (!c) return null;
                c.discardActiveObject();
                c.requestRenderAll();
                await new Promise(r => setTimeout(r, 100));
                return c.toDataURL({ format: 'png', multiplier: 1, quality: 1 });
            },

            loadTemplate: (json: object) => {
                const c = fabricRef.current;
                if (!c) return;
                c.loadFromJSON(json).then(() => {
                    c.requestRenderAll();
                    onCanvasModified?.();
                });
            },

            setCanvasSize: (size: CanvasSize) => {
                const c = fabricRef.current;
                if (!c) return;
                const dims = CANVAS_DIMENSIONS[size];
                c.setDimensions({ width: dims.width, height: dims.height });
                c.requestRenderAll();
                saveHistory(c);
            },

            setZoom: (level: number) => {
                setScale(level);
                scaleRef.current = level;
                onZoomChange?.(level);
            },

            getZoom: () => scaleRef.current,

            getFitScale: () => calcFitScale(),

            undo: () => {
                if (historyIndex.current > 0) {
                    isHistoryProcessing.current = true;
                    historyIndex.current -= 1;
                    const c = fabricRef.current;
                    if (c) {
                        c.loadFromJSON(history.current[historyIndex.current]).then(() => {
                            c.requestRenderAll();
                            onCanvasModified?.();
                            isHistoryProcessing.current = false;
                            updateHistoryState();
                        });
                    }
                }
            },

            redo: () => {
                if (historyIndex.current < history.current.length - 1) {
                    isHistoryProcessing.current = true;
                    historyIndex.current += 1;
                    const c = fabricRef.current;
                    if (c) {
                        c.loadFromJSON(history.current[historyIndex.current]).then(() => {
                            c.requestRenderAll();
                            onCanvasModified?.();
                            isHistoryProcessing.current = false;
                            updateHistoryState();
                        });
                    }
                }
            },
        }));

        const dims = CANVAS_DIMENSIONS[canvasSize];

        return (
            <div
                ref={wrapperRef}
                className="flex-1 flex items-start justify-center py-6 bg-gray-100 rounded-lg border border-gray-200"
                style={{ overflow: 'clip' }}
            >
                <div
                    style={{ width: dims.width * scale, height: dims.height * scale, flexShrink: 0, overflow: 'clip' }}
                    className="shadow-2xl rounded-sm"
                >
                    <div
                        style={{
                            transform: `scale(${scale})`,
                            transformOrigin: 'top left',
                            width: dims.width,
                            height: dims.height,
                        }}
                    >
                        <canvas ref={canvasEl} />
                    </div>
                </div>
            </div>
        );
    }
);

FabricCanvas.displayName = 'FabricCanvas';
export default FabricCanvas;
