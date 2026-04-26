import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Loader2, Sparkles, LayoutTemplate, Save, X, Image as ImageIcon } from 'lucide-react';
import { applyTemplateContent, TemplateInputs, TemplateType } from '../../../services/posterAI';
import { fetchTemplate, fetchTemplates, saveTemplate, updateTemplate, SavedTemplate } from '../../services/posterTemplates';
import { STARTER_TEMPLATES as ALL_STARTERS } from '../../components/admin/PosterMaker/TemplatePanel';
import { supabase } from '../../lib/supabase';
import { TourPackage } from '../../../types';
import FabricCanvas, { FabricCanvasRef, CanvasSize } from '../../components/admin/PosterMaker/FabricCanvas';
import EditorToolbar from '../../components/admin/PosterMaker/EditorToolbar';
import LayerPanel from '../../components/admin/PosterMaker/LayerPanel';
import PropertiesPanel from '../../components/admin/PosterMaker/PropertiesPanel';
import DraftPanel from '../../components/admin/PosterMaker/DraftPanel';
import CanvasZoom from '../../components/admin/PosterMaker/CanvasZoom';
import CanvasContextMenu from '../../components/admin/PosterMaker/CanvasContextMenu';
import AssetPanel from '../../components/admin/PosterMaker/AssetPanel';
import { STARTER_TEMPLATES, PosterTemplate, TemplateThumbnail } from '../../components/admin/PosterMaker/TemplatePanel';
import { FabricObject, FabricImage } from 'fabric';

type ViewState = 'pick-template' | 'fill-content' | 'editing';

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

// ── Main Component ────────────────────────────────────────────────────────────
const PosterMaker: React.FC = () => {
    const canvasRef = useRef<FabricCanvasRef>(null);
    const location = useLocation();

    const [viewState, setViewState] = useState<ViewState>('pick-template');
    const [loadedTemplate, setLoadedTemplate] = useState<PosterTemplate | null>(null);
    const [canvasSize, setCanvasSize] = useState<CanvasSize>('post');
    const [isExporting, setIsExporting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [layerRefreshKey, setLayerRefreshKey] = useState(0);
    const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
    const [rightTab, setRightTab] = useState<'layers' | 'properties' | 'drafts' | 'assets'>('layers');
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

    useEffect(() => {
        fetchPackages();
        loadCustomTemplates();
    }, []);

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
                setViewState('editing');
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
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                canvasRef.current?.deleteSelected();
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

    const handlePickTemplate = (template: PosterTemplate) => {
        setLoadedStarterId(template.id);

        const override = starterOverrides.get(template.id);
        if (override) {
            // Load the saved override instead of the hardcoded template
            setLoadedTemplate(template);
            setCanvasSize(override.aspect_ratio);
            setEditingTemplateId(override.id);
            setEditingTemplateName(override.name);
            setTimeout(() => canvasRef.current?.loadTemplate(override.canvas_json), 200);
            setViewState('editing');
            return;
        }

        setLoadedTemplate(template);
        setCanvasSize(template.aspectRatio);
        setEditingTemplateId(null);
        setEditingTemplateName(template.name);
        setTimeout(() => canvasRef.current?.loadTemplate(template.json), 200);
        const type = getTemplateType(template);
        setViewState(type === 'blank' ? 'editing' : 'fill-content');
    };

    const handlePickCustomTemplate = (t: SavedTemplate) => {
        const poster = savedToPoster(t);
        setLoadedTemplate(poster);
        setCanvasSize(t.aspect_ratio);
        setEditingTemplateId(t.id);
        setEditingTemplateName(t.name);
        setTimeout(() => canvasRef.current?.loadTemplate(t.canvas_json), 200);
        setViewState('editing');
    };

    const handleChangeTemplate = () => {
        setLoadedTemplate(null);
        setEditingTemplateId(null);
        setEditingTemplateName('');
        setLoadedStarterId(null);
        setViewState('pick-template');
    };

    const handleLoadDraft = (json: any) => {
        if (json.width === 1080 && json.height === 1350) setCanvasSize('post');
        else if (json.width === 1080 && json.height === 1920) setCanvasSize('story');
        setTimeout(() => canvasRef.current?.loadTemplate(json), 200);
        setLoadedTemplate(null);
        setEditingTemplateId(null);
        setEditingTemplateName('');
        setLoadedStarterId(null);
        setViewState('editing');
    };

    const handleSelectionChange = (obj: FabricObject | null) => {
        setSelectedObject(obj);
        refreshLayers();
        setPropRefreshKey(k => k + 1);
        if (obj) setRightTab('properties');
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
        return canvas.toDataURL({ format: 'jpeg', multiplier: 0.15, quality: 0.8 });
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
            alert(`Template "${name}" berhasil disimpan.`);
        } else {
            alert('Gagal menyimpan template. Coba lagi.');
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
            alert(`Template "${name}" berhasil diperbarui.`);
        } else {
            alert('Gagal memperbarui template. Coba lagi.');
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
                        const newImg = new FabricImage(imgElement, {
                            left: imgObj.left,
                            top: imgObj.top,
                            originX: imgObj.originX,
                            originY: imgObj.originY,
                        });
                        const scaleX = originalWidth / newImg.width!;
                        const scaleY = originalHeight / newImg.height!;
                        newImg.scale(Math.max(scaleX, scaleY));
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
            setViewState('editing');
        } catch (e) {
            console.error(e);
            alert('Gagal menerapkan konten AI.');
        } finally {
            setIsGenerating(false);
        }
    };

    const templateType = useMemo(() => loadedTemplate ? getTemplateType(loadedTemplate) : null, [loadedTemplate]);
    const postTemplates = useMemo(() => STARTER_TEMPLATES.filter(t => t.aspectRatio === 'post'), []);
    const storyTemplates = useMemo(() => STARTER_TEMPLATES.filter(t => t.aspectRatio === 'story'), []);
    const customPost = useMemo(() => customTemplates.filter(t => t.aspect_ratio === 'post'), [customTemplates]);
    const customStory = useMemo(() => customTemplates.filter(t => t.aspect_ratio === 'story'), [customTemplates]);

    const renderStarterGroup = (title: string, subtitle: string, templates: PosterTemplate[]) => (
        <div className="mb-5">
            <div className="mb-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{title}</p>
                <p className="text-[9px] text-gray-300 mt-0.5">{subtitle}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
                {templates.map(t => {
                    const override = starterOverrides.get(t.id);
                    return (
                        <button
                            key={t.id}
                            onClick={() => handlePickTemplate(t)}
                            className="text-left rounded-lg border hover:border-primary hover:shadow-md transition-all group overflow-hidden bg-white relative border-gray-200"
                        >
                            {override && (
                                <span className="absolute top-1.5 right-1.5 z-10 text-[9px] font-bold bg-primary text-white px-1.5 py-0.5 rounded-full leading-none">
                                    Modified
                                </span>
                            )}
                            <div className="p-1.5">
                                {override?.thumbnail_data_url ? (
                                    <div className={`w-full overflow-hidden rounded ${t.aspectRatio === 'story' ? 'aspect-[9/16]' : 'aspect-[4/5]'}`}>
                                        <img src={override.thumbnail_data_url} alt={t.name} className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <TemplateThumbnail t={t} />
                                )}
                            </div>
                            <div className="px-2 pb-2">
                                <div className="text-[10px] font-bold text-gray-700 group-hover:text-primary leading-tight">{t.name}</div>
                                <div className="text-[9px] text-gray-400 mt-0.5 leading-tight line-clamp-1">{t.description}</div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );

    const renderCustomGroup = (title: string, subtitle: string, templates: SavedTemplate[]) => {
        if (templates.length === 0) return null;
        return (
            <div className="mb-5">
                <div className="mb-2">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-wider">{title}</p>
                    <p className="text-[9px] text-gray-300 mt-0.5">{subtitle}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {templates.map(t => (
                        <button
                            key={t.id}
                            onClick={() => handlePickCustomTemplate(t)}
                            className="text-left rounded-lg border border-blue-200 hover:border-primary hover:shadow-md transition-all group overflow-hidden bg-white"
                        >
                            <div className={`w-full bg-gray-100 overflow-hidden ${t.aspect_ratio === 'story' ? 'aspect-[9/16]' : 'aspect-[4/5]'}`}>
                                {t.thumbnail_data_url ? (
                                    <img src={t.thumbnail_data_url} alt={t.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <LayoutTemplate className="w-5 h-5 text-gray-300" />
                                    </div>
                                )}
                            </div>
                            <div className="px-2 py-1.5">
                                <div className="text-[10px] font-bold text-gray-700 group-hover:text-primary leading-tight line-clamp-1">{t.name}</div>
                                {t.description && (
                                    <div className="text-[9px] text-gray-400 mt-0.5 leading-tight line-clamp-1">{t.description}</div>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        );
    };

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
                {viewState === 'editing' && (
                    <button
                        onClick={() => setIsSaveModalOpen(true)}
                        className="flex-shrink-0 flex items-center gap-2 px-4 py-2 border-2 border-primary text-primary rounded-lg text-sm font-semibold hover:bg-blue-50 transition"
                    >
                        <Save className="w-4 h-4" />
                        {editingTemplateId ? 'Update / Simpan Template' : 'Simpan Template'}
                    </button>
                )}
            </div>

            {/* Toolbar */}
            <EditorToolbar
                canvasSize={canvasSize}
                isExporting={isExporting}
                onAddText={() => canvasRef.current?.addText()}
                onAddRect={() => canvasRef.current?.addRect()}
                onAddCircle={() => canvasRef.current?.addCircle()}
                onAddLine={() => canvasRef.current?.addLine()}
                onAddImage={handleAddImage}
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

            {/* Main Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 lg:grid-rows-1 gap-4 flex-1 min-h-0">

                {/* Left Sidebar */}
                <div className="lg:col-span-3 lg:h-full overflow-y-auto">
                    {viewState === 'pick-template' ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <LayoutTemplate className="w-4 h-4 text-gray-500" />
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-800">Pilih Template</h3>
                                    <p className="text-[10px] text-gray-400">Klik untuk mulai dengan template</p>
                                </div>
                            </div>

                            {/* Custom templates first (if any) */}
                            {renderCustomGroup('Template Tersimpan · Post', '1080 × 1350 px', customPost)}
                            {renderCustomGroup('Template Tersimpan · Story', '1080 × 1920 px', customStory)}

                            {/* Starter templates */}
                            {renderStarterGroup('Starter · Post (4:5)', '1080 × 1350 px', postTemplates)}
                            {renderStarterGroup('Starter · Story (9:16)', '1080 × 1920 px', storyTemplates)}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Active template badge */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
                                {loadedTemplate ? (
                                    <>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                {editingTemplateId ? 'Mengedit Template' : 'Template Aktif'}
                                            </span>
                                            <button onClick={handleChangeTemplate} className="text-[10px] font-semibold text-primary hover:underline">Ganti</button>
                                        </div>
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-10 flex-shrink-0">
                                                {editingTemplateId ? (
                                                    <div className="aspect-[4/5] bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                                                        <LayoutTemplate className="w-4 h-4 text-gray-300" />
                                                    </div>
                                                ) : (
                                                    <TemplateThumbnail t={loadedTemplate} />
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-gray-800 leading-tight">{loadedTemplate.name}</div>
                                                <div className="text-[10px] text-gray-400">
                                                    {loadedTemplate.aspectRatio === 'post' ? 'Post 4:5' : 'Story 9:16'}
                                                    {editingTemplateId && <span className="ml-1 text-primary font-semibold">· Custom</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <button
                                        onClick={handleChangeTemplate}
                                        className="w-full text-sm text-primary font-semibold flex items-center justify-center gap-1.5 py-1 hover:underline"
                                    >
                                        <LayoutTemplate className="w-3.5 h-3.5" />
                                        Ganti Template
                                    </button>
                                )}
                            </div>

                            {/* AI Content panel */}
                            {loadedTemplate && templateType !== 'blank' && !editingTemplateId && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                                    <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                                        {viewState === 'fill-content' ? 'Isi Konten' : 'AI Content'}
                                    </h3>
                                    <div className="space-y-3">
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
                                            {viewState === 'fill-content' ? 'Generate & Terapkan' : 'Update Konten'}
                                        </button>
                                        {viewState === 'fill-content' && (
                                            <button
                                                onClick={() => setViewState('editing')}
                                                className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition"
                                            >
                                                Lewati →
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Center: Canvas */}
                <div className="lg:col-span-6 lg:h-full flex flex-col relative">
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
                    {viewState === 'pick-template' && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="bg-white/80 backdrop-blur-sm rounded-xl px-6 py-4 text-center shadow-lg border border-gray-100">
                                <LayoutTemplate className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm font-semibold text-gray-500">Pilih template untuk memulai</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Sidebar */}
                <div className="lg:col-span-3 lg:h-full">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
                        <div className="flex border-b border-gray-200 overflow-x-auto flex-shrink-0">
                            {(['layers', 'properties', 'assets', 'drafts'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setRightTab(tab)}
                                    className={`flex-1 py-2.5 text-xs font-semibold capitalize transition whitespace-nowrap ${rightTab === tab
                                        ? 'text-primary border-b-2 border-primary bg-blue-50/50'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
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
                                <AssetPanel
                                    onAddImage={url => canvasRef.current?.addImageFromUrl(url)}
                                />
                            )}
                            {rightTab === 'drafts' && (
                                <DraftPanel
                                    canvas={canvasRef.current?.getCanvas() || null}
                                    onLoadDraft={handleLoadDraft}
                                />
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
