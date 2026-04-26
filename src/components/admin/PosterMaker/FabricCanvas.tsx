import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState } from 'react';
import { Canvas, Rect, Textbox, Circle, Line, FabricImage, FabricObject } from 'fabric';
import { installSceneSnap } from './fabricSnap';

export type CanvasSize = 'post' | 'story';

const CANVAS_DIMENSIONS: Record<CanvasSize, { width: number; height: number }> = {
    post: { width: 1080, height: 1350 },
    story: { width: 1080, height: 1920 },
};

export interface FabricCanvasRef {
    getCanvas: () => Canvas | null;
    addText: (text?: string) => void;
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
}

interface FabricCanvasProps {
    canvasSize: CanvasSize;
    onSelectionChange?: (obj: FabricObject | null) => void;
    onCanvasModified?: () => void;
    onHistoryChange?: (canUndo: boolean, canRedo: boolean) => void;
    onZoomChange?: (zoom: number) => void;
    onObjectTransforming?: (obj: FabricObject) => void;
}

// Module-level clipboard so copy/paste works across renders
let clipboard: FabricObject | null = null;

const FabricCanvas = forwardRef<FabricCanvasRef, FabricCanvasProps>(
    ({ canvasSize, onSelectionChange, onCanvasModified, onHistoryChange, onZoomChange, onObjectTransforming }, ref) => {
        const canvasEl = useRef<HTMLCanvasElement>(null);
        const fabricRef = useRef<Canvas | null>(null);
        const [scale, setScale] = useState(0.35);
        const scaleRef = useRef(0.35);

        // History State
        const history = useRef<object[]>([]);
        const historyIndex = useRef<number>(-1);
        const isHistoryProcessing = useRef(false);

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
            canvas.on('object:added', () => { onCanvasModified?.(); saveHistory(canvas); });
            canvas.on('object:removed', () => { onCanvasModified?.(); saveHistory(canvas); });
            canvas.on('object:scaling', (e) => { if (e.target) onObjectTransforming?.(e.target as FabricObject); });
            canvas.on('object:moving', (e) => { if (e.target) onObjectTransforming?.(e.target as FabricObject); });

            // When Fabric focuses its hidden textarea for text editing, Chrome silently
            // scrolls overflow:hidden ancestors to bring the element into view. Reset
            // any such scroll in the next frame (after Chrome's auto-scroll fires).
            canvas.on('text:editing:entered', () => {
                requestAnimationFrame(() => {
                    let el: HTMLElement | null = canvasEl.current?.parentElement ?? null;
                    while (el && el !== document.body) {
                        if (el.scrollTop !== 0) el.scrollTop = 0;
                        if (el.scrollLeft !== 0) el.scrollLeft = 0;
                        el = el.parentElement;
                    }
                });
            });

            return () => {
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
                const tb = new Textbox(text || 'Edit this text', {
                    left: 100, top: 100, originX: 'left', originY: 'top',
                    width: 500, fontSize: 48, fontFamily: 'Inter, sans-serif',
                    fill: '#1a1a1a', fontWeight: '700', editable: true,
                });
                c.add(tb);
                c.setActiveObject(tb);
                c.requestRenderAll();
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
