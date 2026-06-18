import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Loader2, Sparkles, LayoutTemplate, Save, X, Plus, Clock } from 'lucide-react';
import { applyTemplateContent, TemplateInputs, TemplateType } from '../../../services/posterAutofillService';
import { fetchTemplate, fetchTemplates, saveTemplate, updateTemplate, SavedTemplate } from '../../services/posterTemplates';
import { supabase } from '../../lib/supabase';
import { TourPackage } from '../../../types';
import { useToast } from '../../components/admin/ui';
import FabricCanvas, { FabricCanvasRef, CanvasSize } from '../../components/admin/PosterMaker/FabricCanvas';
import EditorToolbar from '../../components/admin/PosterMaker/EditorToolbar';
import LayerPanel from '../../components/admin/PosterMaker/LayerPanel';
import PropertiesPanel from '../../components/admin/PosterMaker/PropertiesPanel';
import CanvasZoom from '../../components/admin/PosterMaker/CanvasZoom';
import CanvasContextMenu from '../../components/admin/PosterMaker/CanvasContextMenu';
import AssetPanel from '../../components/admin/PosterMaker/AssetPanel';
import { STARTER_TEMPLATES, PosterTemplate, TemplateThumbnail } from '../../components/admin/PosterMaker/TemplatePanel';
import { FabricObject, FabricImage, Rect } from 'fabric';

// ── Draft helpers ────────────────────────────────────────────────────────────
interface PosterDraft {
    id: string;
    name: string;
    json: any;
    thumbnail: string;
    created_at: string;
}

const DRAFTS_KEY = 'alfatih_poster_drafts';
const MAX_DRAFTS = 10;

function loadDraftsFromStorage(): PosterDraft[] {
    try { return JSON.parse(localStorage.getItem(DRAFTS_KEY) ?? '[]'); }
    catch { return []; }
}

const getTemplateType = (template: PosterTemplate): TemplateType => {
    if (template.id.includes('conversion')) return 'conversion';
    if (template.id.includes('aspiration')) return 'aspiration';
    if (template.id.includes('edu-reminder')) return 'edu-reminder';
    if (template.id.includes('social-proof')) return 'social-proof';
    return 'blank';
};

const savedToPoster = (t: SavedTemplate): PosterTemplate => ({
    id: t.id,
    name: t.name,
    description: t.description,
    previewColors: ['#94A3B8', '#F8FAFC', '#0F172A'],
    aspectRatio: t.aspect_ratio,
    json: t.canvas_json,
});

// ── Save Template Modal ──────────────────────────────────────────────────────
interface SaveModalProps {
    initialName: string;
    isEditing: boolean;
    isStarterOverride: boolean;
    isSaving: boolean;
    onSaveNew: (name: string, description: string) => void;
    onUpdate: (name: string, description: string) => void;
    onClose: () => void;
}

const SaveModal: React.FC<SaveModalProps> = ({
    initialName, isEditing, isStarterOverride, isSaving, onSaveNew, onUpdate, onClose,
}) => {
    const [name, setName] = useState(initialName);
    const [description, setDescription] = useState('');

    const busy = isSaving;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-gray-900">Simpan Template</h2>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
                            Nama Template <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Promo Ramadan 2026"
                            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
                            Deskripsi (opsional)
                        </label>
                        <input
                            type="text"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Catatan singkat tentang template ini"
                            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-2 mt-5">
                    {/* Primary action */}
                    {isEditing ? (
                        <button
                            onClick={() => onUpdate(name, description)}
                            disabled={!name.trim() || busy}
                            className="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Update Template Ini
                        </button>
                    ) : isStarterOverride ? (
                        <button
                            onClick={() => onSaveNew(name, description)}
                            disabled={!name.trim() || busy}
                            className="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Simpan Perubahan ke Template Ini
                        </button>
                    ) : (
                        <button
                            onClick={() => onSaveNew(name, description)}
                            disabled={!name.trim() || busy}
                            className="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Simpan Template
                        </button>
                    )}

                    {/* Secondary: always allow saving as a brand-new template */}
                    {(isEditing || isStarterOverride) && (
                        <button
                            onClick={() => onSaveNew(name.trim() ? `${name} (Salinan)` : name, description)}
                            disabled={!name.trim() || busy}
                            className="w-full py-2.5 border border-gray-200 text-gray-500 rounded-lg text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            Simpan Sebagai Template Baru
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// ── New Design Modal ──────────────────────────────────────────────────────────
interface NewDesignModalProps {
    canDismiss: boolean;
    starterOverrides: Map<string, SavedTemplate>;
    customTemplates: SavedTemplate[];
    drafts: PosterDraft[];
    onPickBlank: (size: CanvasSize) => void;
    onPickStarter: (t: PosterTemplate) => void;
    onPickCustom: (t: SavedTemplate) => void;
    onPickDraft: (d: PosterDraft) => void;
    onDeleteDraft: (id: string) => void;
    onClose: () => void;
}

const NewDesignModal: React.FC<NewDesignModalProps> = ({
    canDismiss, starterOverrides, customTemplates, drafts,
    onPickBlank, onPickStarter, onPickCustom, onPickDraft, onDeleteDraft, onClose,
}) => {
    const [size, setSize] = useState<CanvasSize>('post');
    const visibleStarters = STARTER_TEMPLATES.filter(t => t.aspectRatio === size);
    const visibleCustom = customTemplates.filter(t => t.aspect_ratio === size);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
            role="dialog"
            aria-modal="true"
            aria-label="Buat Desain Baru"
            onKeyDown={e => { if (e.key === 'Escape' && canDismiss) onClose(); }}
        >
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

                {/* Drafts */}
                {drafts.length > 0 && (
                    <div className="flex-shrink-0 mb-5">
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Lanjutkan Draft</p>
                        <div className="flex gap-3 overflow-x-auto pb-1">
                            {drafts.map(d => (
                                <div key={d.id} className="relative flex-shrink-0 group cursor-pointer" style={{ width: 72 }}>
                                    <button
                                        onClick={() => onPickDraft(d)}
                                        className="w-full rounded-lg overflow-hidden border border-gray-200 hover:border-primary hover:shadow-md transition-all"
                                        style={{ aspectRatio: '4/5' }}
                                        title={d.name}
                                    >
                                        {d.thumbnail
                                            ? <img src={d.thumbnail} alt={d.name} className="w-full h-full object-cover" />
                                            : <div className="w-full h-full bg-gray-100 flex items-center justify-center"><Clock className="w-4 h-4 text-gray-300" /></div>
                                        }
                                    </button>
                                    <p className="text-[9px] text-gray-500 truncate mt-1 text-center">{new Date(d.created_at).toLocaleDateString('id-ID')}</p>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDeleteDraft(d.id); }}
                                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] items-center justify-center hidden group-hover:flex"
                                    >×</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

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

// ── Main Component ────────────────────────────────────────────────────────────
const PosterMaker: React.FC = () => {
    const canvasRef = useRef<FabricCanvasRef>(null);
    const location = useLocation();
    const toast = useToast();

    const [loadedTemplate, setLoadedTemplate] = useState<PosterTemplate | null>(null);
    const [canvasSize, setCanvasSize] = useState<CanvasSize>('post');
    const [isNewDesignModalOpen, setIsNewDesignModalOpen] = useState(true);
    const [isFreehandActive, setIsFreehandActive] = useState(false);
    const [activeDrawTool, setActiveDrawTool] = useState<'rect' | 'circle' | 'line' | 'arrow' | 'divider' | null>(null);
    const [cursorMode, setCursorMode] = useState<'select' | 'pan'>('select');
    const [brushColor, setBrushColor] = useState('#1a1a1a');
    const [brushWidth, setBrushWidth] = useState(4);
    const [isExporting, setIsExporting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [layerRefreshKey, setLayerRefreshKey] = useState(0);
    const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
    const [rightTab, setRightTab] = useState<'layers' | 'properties' | 'assets' | 'ai'>('layers');
    const [drafts, setDrafts] = useState<PosterDraft[]>(() => loadDraftsFromStorage());
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);
    const [propRefreshKey, setPropRefreshKey] = useState(0);

    // Zoom
    const [zoom, setZoom] = useState(0.35);

    // Context menu
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

    // Custom templates (from DB)
    const [customTemplates, setCustomTemplates] = useState<SavedTemplate[]>([]);

    // Map: starter_id → saved override (built fresh whenever customTemplates changes)
    const starterOverrides = useMemo(() => {
        const map = new Map<string, SavedTemplate>();
        customTemplates.forEach(t => { if (t.starter_id) map.set(t.starter_id, t); });
        return map;
    }, [customTemplates]);

    // Edit mode (navigated from Template Manager)
    const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
    const [editingTemplateName, setEditingTemplateName] = useState('');

    // Which built-in starter is currently open (null for pure custom or blank)
    const [loadedStarterId, setLoadedStarterId] = useState<string | null>(null);

    // Save modal
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // AI inputs
    const [topic, setTopic] = useState('');
    const [tagline, setTagline] = useState('');
    const [testimonialQuote, setTestimonialQuote] = useState('');
    const [testimonialName, setTestimonialName] = useState('');
    const [testimonialBatch, setTestimonialBatch] = useState('');

    // Packages
    const [packages, setPackages] = useState<TourPackage[]>([]);
    const [selectedPackageId, setSelectedPackageId] = useState<string>('');

    const [searchParams] = useSearchParams();
    const [isBrochureBannerVisible, setIsBrochureBannerVisible] = useState(false);

    const brochurePackageId = searchParams.get('packageId');
    const isBrochureMode = searchParams.get('mode') === 'brochure';

    useEffect(() => {
        fetchPackages();
        loadCustomTemplates();
    }, []);

    useEffect(() => {
        if (!isBrochureMode || !brochurePackageId) return;

        // Wait for packages to be loaded by the existing fetchPackages effect
        if (packages.length === 0) return;

        const found = packages.find(p => p.id === brochurePackageId);
        if (found) {
            setSelectedPackageId(found.id);
            setIsBrochureBannerVisible(true);
        }
    }, [isBrochureMode, brochurePackageId, packages]);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    // Handle incoming navigation state from Template Manager
    useEffect(() => {
        const state = location.state as { templateId?: string; templateName?: string; starterId?: string } | null;
        if (!state) return;

        // Open a custom (DB-saved) template for editing
        if (state.templateId) {
            setEditingTemplateId(state.templateId);
            setEditingTemplateName(state.templateName || '');

            fetchTemplate(state.templateId).then(t => {
                if (!t) return;
                const posterTemplate = savedToPoster(t);
                setLoadedTemplate(posterTemplate);
                setCanvasSize(t.aspect_ratio);
                setTimeout(() => canvasRef.current?.loadTemplate(t.canvas_json), 200);
                setIsNewDesignModalOpen(false);
            });
            return;
        }

        // Pre-pick a built-in starter template
        if (state.starterId) {
            const starter = STARTER_TEMPLATES.find(t => t.id === state.starterId);
            if (starter) handlePickTemplate(starter);
        }
    }, [location.state]);

    const fetchPackages = async () => {
        const { data, error } = await supabase.from('packages').select('*').order('created_at', { ascending: false });
        if (!error && data) {
            setPackages(data);
            if (data.length > 0) setSelectedPackageId(data[0].id);
        }
    };

    const loadCustomTemplates = async () => {
        setCustomTemplates(await fetchTemplates());
    };

    const refreshLayers = () => setLayerRefreshKey(k => k + 1);

    const handleHistoryChange = (undoable: boolean, redoable: boolean) => {
        setCanUndo(undoable);
        setCanRedo(redoable);
        refreshLayers();
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
            if (cmdOrCtrl && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
                e.preventDefault();
                canvasRef.current?.undo();
            } else if (cmdOrCtrl && e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
                e.preventDefault();
                canvasRef.current?.redo();
            } else if (cmdOrCtrl && (e.key === 'y' || e.key === 'Y')) {
                e.preventDefault();
                canvasRef.current?.redo();
            } else if (cmdOrCtrl && (e.key === 'c' || e.key === 'C')) {
                e.preventDefault();
                canvasRef.current?.copySelected();
            } else if (cmdOrCtrl && (e.key === 'v' || e.key === 'V')) {
                e.preventDefault();
                canvasRef.current?.paste();
            } else if (cmdOrCtrl && (e.key === 'd' || e.key === 'D')) {
                e.preventDefault();
                canvasRef.current?.duplicateSelected();
            } else if (!cmdOrCtrl && e.key.toLowerCase() === 'v' && !e.shiftKey) {
                if (!canvasRef.current?.isTextPlacementMode()) handleSetCursorMode('select');
            } else if (!cmdOrCtrl && e.key.toLowerCase() === 'h' && !e.shiftKey) {
                if (!canvasRef.current?.isTextPlacementMode()) handleSetCursorMode('pan');
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                canvasRef.current?.deleteSelected();
            } else if (e.key === 'Escape') {
                if (canvasRef.current?.isFreehandMode()) {
                    canvasRef.current.setFreehandMode(false);
                    setIsFreehandActive(false);
                } else if (canvasRef.current?.isTextPlacementMode()) {
                    canvasRef.current.cancelTextPlacement();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleContextMenuToggleLock = () => {
        const canvas = canvasRef.current?.getCanvas();
        if (!canvas || !selectedObject) return;
        const isLocked = selectedObject.lockMovementX;
        const next = !isLocked;
        selectedObject.set({
            lockMovementX: next, lockMovementY: next, lockRotation: next,
            lockScalingX: next, lockScalingY: next,
            hasControls: !next, selectable: !next, evented: !next,
        });
        if ('editable' in selectedObject) (selectedObject as any).editable = !next;
        canvas.requestRenderAll();
        refreshLayers();
    };

    const handleAddImage = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e: any) => {
            const file = e.target?.files?.[0];
            if (file) {
                const url = URL.createObjectURL(file);
                canvasRef.current?.addImageFromUrl(url);
            }
        };
        input.click();
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const dataUrl = await canvasRef.current?.exportPng();
            if (dataUrl) {
                const link = document.createElement('a');
                link.download = `alfatih-poster-${canvasSize}-${Date.now()}.png`;
                link.href = dataUrl;
                link.click();
            }
        } finally {
            setIsExporting(false);
        }
    };

    const handleSizeChange = (size: CanvasSize) => setCanvasSize(size);

    const handlePickBlank = (size: CanvasSize) => {
        canvasRef.current?.setFreehandMode(false);
        setIsFreehandActive(false);
        canvasRef.current?.cancelDraw();
        setActiveDrawTool(null);
        handleSetCursorMode('select');
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

    const handleToggleFreehand = () => {
        const next = !isFreehandActive;
        if (next) {
            canvasRef.current?.cancelDraw();
            setActiveDrawTool(null);
            setCursorMode('select');
            canvasRef.current?.setPanMode?.(false);
        }
        setIsFreehandActive(next);
        canvasRef.current?.setFreehandMode(next);
        if (next) {
            const canvas = canvasRef.current?.getCanvas();
            if (canvas?.freeDrawingBrush) {
                (canvas.freeDrawingBrush as any).color = brushColor;
                (canvas.freeDrawingBrush as any).width = brushWidth;
            }
        }
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

    const handlePickCustomTemplate = (t: SavedTemplate) => {
        const poster = savedToPoster(t);
        setLoadedTemplate(poster);
        setCanvasSize(t.aspect_ratio);
        setEditingTemplateId(t.id);
        setEditingTemplateName(t.name);
        setTimeout(() => canvasRef.current?.loadTemplate(t.canvas_json), 200);
        setIsNewDesignModalOpen(false);
    };

    const handleChangeTemplate = () => {
        setIsNewDesignModalOpen(true);
    };

    const handlePickDraft = (draft: PosterDraft) => {
        const json = draft.json;
        canvasRef.current?.setFreehandMode(false);
        setIsFreehandActive(false);
        canvasRef.current?.cancelDraw();
        setActiveDrawTool(null);
        handleSetCursorMode('select');
        if (json.width === 1080 && json.height === 1350) setCanvasSize('post');
        else if (json.width === 1080 && json.height === 1920) setCanvasSize('story');
        setTimeout(() => canvasRef.current?.loadTemplate(json), 200);
        setLoadedTemplate(null);
        setEditingTemplateId(null);
        setEditingTemplateName('');
        setLoadedStarterId(null);
        setIsNewDesignModalOpen(false);
    };

    const handleSaveDraft = () => {
        const canvas = canvasRef.current?.getCanvas();
        if (!canvas) return;
        const newDraft: PosterDraft = {
            id: `${Date.now()}`,
            name: `Draft ${new Date().toLocaleString('id-ID')}`,
            json: canvas.toJSON(),
            thumbnail: generateThumbnail() ?? '',
            created_at: new Date().toISOString(),
        };
        const updated = [newDraft, ...drafts].slice(0, MAX_DRAFTS);
        setDrafts(updated);
        localStorage.setItem(DRAFTS_KEY, JSON.stringify(updated));
        toast('success', 'Draft disimpan.');
    };

    const handleDeleteDraft = (id: string) => {
        const updated = drafts.filter(d => d.id !== id);
        setDrafts(updated);
        localStorage.setItem(DRAFTS_KEY, JSON.stringify(updated));
    };

    const handleSelectionChange = (obj: FabricObject | null) => {
        setSelectedObject(obj);
        refreshLayers();
        setPropRefreshKey(k => k + 1);
    };

    const handleObjectTransforming = (obj: FabricObject) => {
        setSelectedObject(obj);
        setPropRefreshKey(k => k + 1);
    };

    const generateThumbnail = (): string | undefined => {
        const canvas = canvasRef.current?.getCanvas();
        if (!canvas) return undefined;
        canvas.discardActiveObject();
        canvas.requestRenderAll();
        try {
            return canvas.toDataURL({ format: 'jpeg', multiplier: 0.15, quality: 0.8 });
        } catch {
            return undefined;
        }
    };

    const handleSaveNew = async (name: string, description: string) => {
        const canvas = canvasRef.current?.getCanvas();
        if (!canvas) return;
        setIsSaving(true);

        const templateType = loadedTemplate ? getTemplateType(loadedTemplate) : 'custom';
        const result = await saveTemplate({
            name: name.trim(),
            description: description.trim(),
            aspect_ratio: canvasSize,
            template_type: templateType,
            canvas_json: canvas.toJSON(),
            thumbnail_data_url: generateThumbnail(),
            starter_id: loadedStarterId,
        });

        setIsSaving(false);
        if (result) {
            setCustomTemplates(prev => [result, ...prev.filter(t => t.id !== result.id)]);
            setEditingTemplateId(result.id);
            setEditingTemplateName(result.name);
            setIsSaveModalOpen(false);
            toast('success', `Template "${name}" berhasil disimpan.`);
        } else {
            toast('error', 'Gagal menyimpan template. Coba lagi.');
        }
    };

    const handleUpdate = async (name: string, description: string) => {
        if (!editingTemplateId) return;
        const canvas = canvasRef.current?.getCanvas();
        if (!canvas) return;
        setIsSaving(true);

        const ok = await updateTemplate(editingTemplateId, {
            name: name.trim(),
            description: description.trim(),
            canvas_json: canvas.toJSON(),
            thumbnail_data_url: generateThumbnail(),
        });

        setIsSaving(false);
        if (ok) {
            setEditingTemplateName(name.trim());
            setCustomTemplates(prev =>
                prev.map(t => t.id === editingTemplateId
                    ? { ...t, name: name.trim(), description: description.trim() }
                    : t
                )
            );
            setIsSaveModalOpen(false);
            toast('success', `Template "${name}" berhasil diperbarui.`);
        } else {
            toast('error', 'Gagal memperbarui template. Coba lagi.');
        }
    };

    const handleGenerateAndApply = async () => {
        if (!loadedTemplate) return;
        const cr = canvasRef.current?.getCanvas();
        if (!cr) return;

        const templateType = getTemplateType(loadedTemplate);
        const inputs: TemplateInputs = { templateType };

        if (templateType === 'conversion') {
            const pkg = packages.find(p => p.id === selectedPackageId);
            if (!pkg) return;
            inputs.package = pkg;
        } else if (templateType === 'edu-reminder') {
            inputs.topic = topic;
        } else if (templateType === 'aspiration') {
            inputs.tagline = tagline;
        } else if (templateType === 'social-proof') {
            inputs.testimonial = { quote: testimonialQuote, name: testimonialName, batch: testimonialBatch };
        }

        setIsGenerating(true);
        try {
            const textObjects = cr.getObjects().filter(
                o => o.type === 'textbox' || o.type === 'text' || o.type === 'i-text'
            );
            const nodes = textObjects.map((obj: any, i) => ({ id: `txt-${i}`, text: obj.text || '', obj }));

            if (nodes.length > 0) {
                const replacements = await applyTemplateContent(inputs, nodes.map(n => ({ id: n.id, text: n.text })));
                replacements.forEach(rep => {
                    const node = nodes.find(n => n.id === rep.id);
                    if (node) node.obj.set({ text: rep.text });
                });
            }

            if (templateType === 'conversion' && inputs.package?.image_url) {
                const imageObjects = cr.getObjects().filter(o => o.type === 'image');
                imageObjects.forEach((imgObj: any) => {
                    const imgElement = document.createElement('img');
                    imgElement.crossOrigin = 'anonymous';
                    imgElement.onload = () => {
                        const originalWidth = imgObj.width * imgObj.scaleX;
                        const originalHeight = imgObj.height * imgObj.scaleY;
                        const originalIndex = cr.getObjects().indexOf(imgObj);

                        const newImg = new FabricImage(imgElement);
                        const coverScale = Math.max(
                            originalWidth / newImg.width!,
                            originalHeight / newImg.height!,
                        );

                        // Resolve placeholder top-left corner regardless of originX/Y
                        const ox = imgObj.originX || 'left';
                        const oy = imgObj.originY || 'top';
                        const anchorLeft = ox === 'center' ? imgObj.left - originalWidth / 2
                                         : ox === 'right'  ? imgObj.left - originalWidth
                                         : imgObj.left;
                        const anchorTop  = oy === 'center' ? imgObj.top - originalHeight / 2
                                         : oy === 'bottom' ? imgObj.top - originalHeight
                                         : imgObj.top;

                        // Center the scaled image within the placeholder bounds
                        const scaledW = newImg.width! * coverScale;
                        const scaledH = newImg.height! * coverScale;
                        newImg.set({
                            left: anchorLeft + (originalWidth - scaledW) / 2,
                            top: anchorTop + (originalHeight - scaledH) / 2,
                            originX: 'left',
                            originY: 'top',
                            scaleX: coverScale,
                            scaleY: coverScale,
                            clipPath: new Rect({
                                left: anchorLeft,
                                top: anchorTop,
                                width: originalWidth,
                                height: originalHeight,
                                absolutePositioned: true,
                            }),
                        });

                        cr.remove(imgObj);
                        cr.add(newImg);
                        cr.moveObjectTo(newImg, originalIndex);
                        cr.requestRenderAll();
                        refreshLayers();
                    };
                    imgElement.src = inputs.package!.image_url!;
                });
            }

            cr.requestRenderAll();
            refreshLayers();
        } catch (e) {
            console.error(e);
            toast('error', 'Gagal menerapkan konten AI.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSetCursorMode = (mode: 'select' | 'pan') => {
        setCursorMode(mode);
        if (mode === 'pan') {
            canvasRef.current?.setPanMode?.(true);
            canvasRef.current?.cancelDraw();
            setActiveDrawTool(null);
            canvasRef.current?.setFreehandMode(false);
            setIsFreehandActive(false);
        } else {
            canvasRef.current?.setPanMode?.(false);
        }
    };

    const templateType = useMemo(() => loadedTemplate ? getTemplateType(loadedTemplate) : null, [loadedTemplate]);

    const renderAiInputs = () => {
        switch (templateType) {
            case 'conversion':
                return (
                    <select
                        value={selectedPackageId}
                        onChange={(e) => setSelectedPackageId(e.target.value)}
                        className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-primary"
                    >
                        {packages.map(pkg => (
                            <option key={pkg.id} value={pkg.id}>{pkg.title}</option>
                        ))}
                    </select>
                );
            case 'edu-reminder':
                return (
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g. 5 Barang Wajib Dibawa Saat Umroh"
                        className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-primary"
                    />
                );
            case 'aspiration':
                return (
                    <textarea
                        value={tagline}
                        onChange={(e) => setTagline(e.target.value)}
                        placeholder='Tagline kustom (opsional, AI generate jika kosong)'
                        rows={2}
                        className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-primary resize-none"
                    />
                );
            case 'social-proof':
                return (
                    <div className="space-y-2">
                        <textarea
                            value={testimonialQuote}
                            onChange={(e) => setTestimonialQuote(e.target.value)}
                            placeholder="Kutipan testimoni (opsional, AI generate jika kosong)"
                            rows={2}
                            className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-primary resize-none"
                        />
                        <input
                            type="text"
                            value={testimonialName}
                            onChange={(e) => setTestimonialName(e.target.value)}
                            placeholder="Nama jamaah (opsional)"
                            className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-primary"
                        />
                        <input
                            type="text"
                            value={testimonialBatch}
                            onChange={(e) => setTestimonialBatch(e.target.value)}
                            placeholder="Rombongan (e.g. Umroh Syawal Maret 2026)"
                            className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-primary"
                        />
                    </div>
                );
            default:
                return null;
        }
    };

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
                        onClick={handleSaveDraft}
                        className="flex items-center gap-2 px-4 py-2 border-2 border-amber-400 text-amber-600 rounded-lg text-sm font-semibold hover:bg-amber-50 transition"
                    >
                        <Clock className="w-4 h-4" />
                        Simpan Draft
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
                cursorMode={cursorMode}
                onSetCursorMode={handleSetCursorMode}
                onAddText={() => { handleSetCursorMode('select'); canvasRef.current?.addText(); }}
                onAddRect={() => { handleSetCursorMode('select'); canvasRef.current?.addRect(); setActiveDrawTool('rect'); setIsFreehandActive(false); }}
                onAddCircle={() => { handleSetCursorMode('select'); canvasRef.current?.addCircle(); setActiveDrawTool('circle'); setIsFreehandActive(false); }}
                onAddLine={() => { handleSetCursorMode('select'); canvasRef.current?.addLine(); setActiveDrawTool('line'); setIsFreehandActive(false); }}
                onAddArrow={() => { handleSetCursorMode('select'); canvasRef.current?.addArrow(); setActiveDrawTool('arrow'); setIsFreehandActive(false); }}
                onAddDivider={() => { handleSetCursorMode('select'); canvasRef.current?.addDivider(); setActiveDrawTool('divider'); setIsFreehandActive(false); }}
                onToggleFreehand={handleToggleFreehand}
                onAddImage={() => { handleSetCursorMode('select'); handleAddImage(); }}
                isFreehandActive={isFreehandActive}
                activeDrawTool={activeDrawTool}
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

            {isBrochureMode && isBrochureBannerVisible && (
                <div className="flex items-center justify-between gap-3 px-4 py-2 bg-blue-50 border-b border-blue-200 text-sm flex-shrink-0">
                    <p className="text-blue-800">
                        <span className="font-semibold">Mode Brosur aktif</span> — pilih template lalu klik{' '}
                        <span className="font-semibold">AI Autofill</span> untuk mengisi otomatis dari paket ini.
                    </p>
                    <button
                        onClick={() => setIsBrochureBannerVisible(false)}
                        className="flex-shrink-0 text-blue-400 hover:text-blue-600 transition"
                        title="Tutup banner"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

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
                                <label htmlFor="freehand-color" className="text-xs text-violet-600">Warna</label>
                                <input
                                    id="freehand-color"
                                    type="color"
                                    value={brushColor}
                                    onChange={e => handleBrushColorChange(e.target.value)}
                                    className="w-7 h-7 rounded border border-violet-200 cursor-pointer p-0"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <label htmlFor="freehand-width" className="text-xs text-violet-600">Ukuran: {brushWidth}px</label>
                                <input
                                    id="freehand-width"
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
                            onDrawModeChange={(mode) => {
                                setActiveDrawTool(mode);
                                if (mode !== null) {
                                    setIsFreehandActive(false);
                                    canvasRef.current?.setFreehandMode(false);
                                }
                            }}
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
                            {(['layers', 'properties', 'assets'] as const).map(tab => (
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
                    drafts={drafts}
                    onPickBlank={handlePickBlank}
                    onPickStarter={handlePickTemplate}
                    onPickCustom={handlePickCustomTemplate}
                    onPickDraft={handlePickDraft}
                    onDeleteDraft={handleDeleteDraft}
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
};

export default PosterMaker;
