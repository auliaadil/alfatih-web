import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { generatePromoCopy, generateEducationalCopy, generateDocCopy, generateTemplateAutofill } from '../../../services/posterAI';
import { supabase } from '../../lib/supabase';
import { TourPackage } from '../../../types';
import FabricCanvas, { FabricCanvasRef, CanvasSize } from '../../components/admin/PosterMaker/FabricCanvas';
import EditorToolbar from '../../components/admin/PosterMaker/EditorToolbar';
import LayerPanel from '../../components/admin/PosterMaker/LayerPanel';
import PropertiesPanel from '../../components/admin/PosterMaker/PropertiesPanel';
import TemplatePanel, { PosterTemplate } from '../../components/admin/PosterMaker/TemplatePanel';
import DraftPanel from '../../components/admin/PosterMaker/DraftPanel';
import { FabricObject, FabricImage } from 'fabric';

const PosterMaker: React.FC = () => {
    const canvasRef = useRef<FabricCanvasRef>(null);

    const [canvasSize, setCanvasSize] = useState<CanvasSize>('post');
    const [isExporting, setIsExporting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [layerRefreshKey, setLayerRefreshKey] = useState(0);
    const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
    const [rightTab, setRightTab] = useState<'layers' | 'properties' | 'templates' | 'drafts'>('layers');
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);

    // AI inputs
    const [topic, setTopic] = useState('');
    const [location, setLocation] = useState('');
    const [aiCategory, setAiCategory] = useState<'promo' | 'content' | 'doc' | 'autofill'>('promo');

    // Packages
    const [packages, setPackages] = useState<TourPackage[]>([]);
    const [selectedPackageId, setSelectedPackageId] = useState<string>('');

    useEffect(() => {
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        const { data, error } = await supabase.from('packages').select('*').order('created_at', { ascending: false });
        if (!error && data) {
            setPackages(data);
            if (data.length > 0) setSelectedPackageId(data[0].id);
        }
    };

    const refreshLayers = () => setLayerRefreshKey(k => k + 1);

    const handleHistoryChange = (undoable: boolean, redoable: boolean) => {
        setCanUndo(undoable);
        setCanRedo(redoable);
        refreshLayers(); // Ensure layers panel syncs up if an object was undone/redone
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if user is typing in an input or textarea
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

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
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // --- Toolbar Handlers ---
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
        } catch (error) {
            console.error('Export failed', error);
        } finally {
            setIsExporting(false);
        }
    };

    const handleSizeChange = (size: CanvasSize) => {
        setCanvasSize(size);
    };

    const handleLoadTemplate = (template: PosterTemplate) => {
        setCanvasSize(template.aspectRatio);
        // Small delay to let the canvas re-initialize with the new size
        setTimeout(() => {
            canvasRef.current?.loadTemplate(template.json);
        }, 200);
    };

    const handleLoadDraft = (json: any) => {
        if (json.width === 1080 && json.height === 1440) {
            setCanvasSize('post');
        } else if (json.width === 1080 && json.height === 1920) {
            setCanvasSize('story');
        }
        setTimeout(() => {
            canvasRef.current?.loadTemplate(json);
        }, 200);
    };

    const handleSelectionChange = (obj: FabricObject | null) => {
        setSelectedObject(obj);
        refreshLayers();
        if (obj) setRightTab('properties');
    };

    // --- AI Generation ---
    const handleGeneratePromo = async () => {
        if (!selectedPackageId) return;
        const pkg = packages.find(p => p.id === selectedPackageId);
        if (!pkg) return;

        setIsGenerating(true);
        try {
            const data = await generatePromoCopy(pkg);
            if (data) {
                const cr = canvasRef.current;
                if (cr) {
                    if (data.title) cr.addText(data.title);
                    if (data.hook) {
                        setTimeout(() => cr.addText(data.hook), 100);
                    }
                    if (data.details) {
                        setTimeout(() => cr.addText(data.details), 200);
                    }
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateContent = async () => {
        if (!topic) return;
        setIsGenerating(true);
        try {
            const data = await generateEducationalCopy(topic);
            if (data) {
                const cr = canvasRef.current;
                if (cr) {
                    if (data.title) cr.addText(data.title);
                    if (data.points) {
                        data.points.forEach((p: string, i: number) => {
                            setTimeout(() => cr.addText(`${i + 1}. ${p}`), (i + 1) * 100);
                        });
                    }
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateDoc = async () => {
        if (!location) return;
        setIsGenerating(true);
        try {
            const data = await generateDocCopy(location);
            if (data) {
                const cr = canvasRef.current;
                if (cr) {
                    if (data.title) cr.addText(data.title);
                    if (data.sub) {
                        setTimeout(() => cr.addText(data.sub), 100);
                    }
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAutofillTemplate = async () => {
        if (!selectedPackageId) return;
        const pkg = packages.find(p => p.id === selectedPackageId);
        if (!pkg) return;

        const cr = canvasRef.current?.getCanvas();
        if (!cr) return;

        // Find all text objects
        const textObjects = cr.getObjects().filter(o => o.type === 'textbox' || o.type === 'text' || o.type === 'i-text');

        const nodes: { id: string; text: string; obj: any }[] = [];
        textObjects.forEach((obj: any, i) => {
            const id = `txt-${i}`;
            nodes.push({ id, text: obj.text || '', obj });
        });

        setIsGenerating(true);
        try {
            // 1. Text Autofill
            if (nodes.length > 0) {
                const sendNodes = nodes.map(n => ({ id: n.id, text: n.text }));
                const replacements = await generateTemplateAutofill(pkg, sendNodes);

                replacements.forEach(rep => {
                    const node = nodes.find(n => n.id === rep.id);
                    if (node) {
                        node.obj.set({ text: rep.text });
                    }
                });
            }

            // 2. Image Autofill (swapping placeholders)
            const imageObjects = cr.getObjects().filter(o => o.type === 'image');
            if (pkg.image_url && imageObjects.length > 0) {
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

                        // Uniform scale to cover original bounding box
                        const scaleX = originalWidth / newImg.width!;
                        const scaleY = originalHeight / newImg.height!;
                        const coverScale = Math.max(scaleX, scaleY);

                        newImg.scale(coverScale);

                        cr.remove(imgObj);
                        cr.add(newImg);
                        cr.moveObjectTo(newImg, originalIndex);
                        cr.requestRenderAll();
                        refreshLayers();
                    };
                    imgElement.src = pkg.image_url!;
                });
            }

            cr.requestRenderAll();
            refreshLayers();
        } catch (e) {
            console.error(e);
            alert("Failed to auto-fill placeholders.");
        } finally {
            setIsGenerating(false);
        }
    };

    const selectedPackage = packages.find(p => p.id === selectedPackageId);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Poster Maker</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Design marketing posters with a full canvas editor, AI-powered copy, and your package assets.
                </p>
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
                onExport={handleExport}
                onSetCanvasSize={handleSizeChange}
                onUndo={() => canvasRef.current?.undo()}
                onRedo={() => canvasRef.current?.redo()}
                canUndo={canUndo}
                canRedo={canRedo}
            />

            {/* Main Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4" style={{ minHeight: 600 }}>

                {/* Left Sidebar: Assets & AI */}
                <div className="lg:col-span-3 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>

                    {/* AI Generation Panel */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-800 mb-3">AI Copy Generator</h3>

                        {/* Category tabs */}
                        <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
                            {(['promo', 'content', 'doc', 'autofill'] as const).map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setAiCategory(cat)}
                                    className={`flex-1 text-[10px] font-medium py-1.5 rounded-md transition ${aiCategory === cat
                                        ? 'bg-white shadow-sm text-gray-900'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {cat === 'promo' ? 'Promo' : cat === 'content' ? 'Content' : cat === 'doc' ? 'Caption' : 'Magic Fill'}
                                </button>
                            ))}
                        </div>

                        {aiCategory === 'promo' && (
                            <div className="space-y-3">
                                <select
                                    value={selectedPackageId}
                                    onChange={(e) => setSelectedPackageId(e.target.value)}
                                    className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-primary"
                                >
                                    {packages.map(pkg => (
                                        <option key={pkg.id} value={pkg.id}>{pkg.title}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleGeneratePromo}
                                    disabled={isGenerating || packages.length === 0}
                                    className="w-full flex items-center justify-center gap-2 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50"
                                >
                                    {isGenerating && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Generate Promo Copy
                                </button>
                            </div>
                        )}

                        {aiCategory === 'content' && (
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="e.g. 5 Barang Wajib Umrah"
                                    className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-primary"
                                />
                                <button
                                    onClick={handleGenerateContent}
                                    disabled={isGenerating || !topic}
                                    className="w-full flex items-center justify-center gap-2 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50"
                                >
                                    {isGenerating && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Generate Content Points
                                </button>
                            </div>
                        )}

                        {aiCategory === 'doc' && (
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="e.g. Cappadocia, Turki"
                                    className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-primary"
                                />
                                <button
                                    onClick={handleGenerateDoc}
                                    disabled={isGenerating || !location}
                                    className="w-full flex items-center justify-center gap-2 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50"
                                >
                                    {isGenerating && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Generate Caption
                                </button>
                            </div>
                        )}

                        {aiCategory === 'autofill' && (
                            <div className="space-y-3">
                                <select
                                    value={selectedPackageId}
                                    onChange={(e) => setSelectedPackageId(e.target.value)}
                                    className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-primary"
                                >
                                    {packages.map(pkg => (
                                        <option key={pkg.id} value={pkg.id}>{pkg.title}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleAutofillTemplate}
                                    disabled={isGenerating || packages.length === 0}
                                    className="w-full flex items-center justify-center gap-2 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-50"
                                >
                                    {isGenerating && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Magic Auto-Fill
                                </button>
                                <p className="text-[11px] text-gray-500 leading-tight">
                                    Intelligently replaces template text and photo placeholders on the canvas with the selected package details.
                                </p>
                            </div>
                        )}

                    </div>
                </div>

                {/* Center: Canvas */}
                <div className="lg:col-span-6">
                    <FabricCanvas
                        ref={canvasRef}
                        canvasSize={canvasSize}
                        onSelectionChange={handleSelectionChange}
                        onCanvasModified={() => refreshLayers()}
                        onHistoryChange={handleHistoryChange}
                    />
                </div>

                {/* Right Sidebar: Tabbed Panel */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {/* Tabs */}
                        <div className="flex border-b border-gray-200">
                            {(['layers', 'properties', 'templates', 'drafts'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setRightTab(tab)}
                                    className={`flex-1 py-2.5 text-xs font-semibold capitalize transition ${rightTab === tab
                                        ? 'text-primary border-b-2 border-primary bg-emerald-50/50'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                        <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
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
                                    refreshKey={layerRefreshKey}
                                />
                            )}
                            {rightTab === 'templates' && (
                                <TemplatePanel
                                    onLoadTemplate={handleLoadTemplate}
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
        </div>
    );
};

export default PosterMaker;
