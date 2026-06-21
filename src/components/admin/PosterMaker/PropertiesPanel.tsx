import React, { useState, useEffect, useRef } from 'react';
import { Canvas, FabricObject, Rect, FabricImage, filters as fabricFilters } from 'fabric';
import { Bold, Italic, Underline, Plus, Minus, AlignLeft, AlignCenter, AlignRight, AlignJustify, Link, Unlink, ChevronDown, ChevronRight } from 'lucide-react';
import { ShadowState, DEFAULT_SHADOW, readShadowState, applyShadow } from './fabricShadow';
import { getCornerRadius, setCornerRadius } from './fabricCornerRadius';
import { BulletListConfig, changeBulletStyle, changeBulletColor } from './fabricBulletList';
import { GOOGLE_FONTS, loadGoogleFont, ensureFontReady } from './fontLoader';

interface PropertiesPanelProps {
    canvas: Canvas | null;
    selectedObject: FabricObject | null;
    refreshKey: number;
}

const SectionHeader: React.FC<{ label: string; open: boolean; onToggle: () => void }> = ({ label, open, onToggle }) => (
    <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5"
    >
        {label}
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
    </button>
);

const FontPicker: React.FC<{ value: string; onChange: (font: string) => void }> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

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
        aria-expanded={open}
        aria-haspopup="listbox"
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

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ canvas, selectedObject, refreshKey }) => {
    // Basic
    const [fillColor, setFillColor] = useState('#1a1a1a');
    const [strokeColor, setStrokeColor] = useState('#000000');
    const [strokeWidth, setStrokeWidth] = useState(0);
    const [opacity, setOpacity] = useState(100);

    // Position & size
    const [posX, setPosX] = useState('0');
    const [posY, setPosY] = useState('0');
    const [sizeW, setSizeW] = useState('0');
    const [sizeH, setSizeH] = useState('0');
    const [lockAspect, setLockAspect] = useState(false);
    const aspectRatio = useRef(1);
    const pendingFontRef = useRef<string | null>(null);

    // Text
    const [fontFamily, setFontFamily] = useState('Plus Jakarta Sans');
    const [fontSize, setFontSize] = useState(48);
    const [fontSizeInput, setFontSizeInput] = useState('48');
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [isUnderline, setIsUnderline] = useState(false);
    const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right' | 'justify'>('left');

    // Shadow
    const [shadowOpen, setShadowOpen] = useState(false);
    const [shadow, setShadow] = useState<ShadowState>(DEFAULT_SHADOW);

    // Corner radius (Rect / Image)
    const [cornerRadius, setCornerRadiusState] = useState(0);

    // Blur (Image)
    const [blur, setBlur] = useState(0);

    // Bullet List
    const [bulletListConfig, setBulletListConfig] = useState<BulletListConfig | null>(null);

    const isText = selectedObject?.type === 'textbox' || selectedObject?.type === 'text' || selectedObject?.type === 'i-text';
    const isRect = selectedObject instanceof Rect;
    const isImage = selectedObject instanceof FabricImage;
    const showCornerRadius = isRect || isImage;

    useEffect(() => {
        if (!selectedObject) return;

        setFillColor((selectedObject.fill as string) || '#1a1a1a');
        setStrokeColor((selectedObject.stroke as string) || '#000000');
        setStrokeWidth(selectedObject.strokeWidth || 0);
        setOpacity(Math.round((selectedObject.opacity || 1) * 100));

        const left = Math.round(selectedObject.left ?? 0);
        const top = Math.round(selectedObject.top ?? 0);
        const w = Math.round(selectedObject.getScaledWidth());
        const h = Math.round(selectedObject.getScaledHeight());
        setPosX(String(left));
        setPosY(String(top));
        setSizeW(String(w));
        setSizeH(String(h));
        aspectRatio.current = h !== 0 ? w / h : 1;

        if (isText) {
            const textObj = selectedObject as any;
            setFontFamily(textObj.fontFamily || 'Inter');
            const fs = textObj.fontSize || 48;
            setFontSize(fs);
            setFontSizeInput(String(fs));
            setIsBold(textObj.fontWeight === 'bold' || textObj.fontWeight === '700' || Number(textObj.fontWeight) >= 700);
            setIsItalic(textObj.fontStyle === 'italic');
            setIsUnderline(textObj.underline || false);
            setTextAlign(textObj.textAlign || 'left');
        }

        setShadow(readShadowState(selectedObject));

        if (showCornerRadius) {
            setCornerRadiusState(getCornerRadius(selectedObject));
        }

        if (isImage) {
            const filters = (selectedObject as any).filters || [];
            const blurFilter = filters.find((f: any) => f.type === 'Blur' || f.constructor?.name === 'Blur');
            setBlur(blurFilter ? Math.round((blurFilter.blur ?? 0) * 100) : 0);
        }

        const bl = (selectedObject as any).bulletList as BulletListConfig | undefined;
        setBulletListConfig(bl ?? null);
    }, [selectedObject, refreshKey]);

    const applyProp = (props: Record<string, any>) => {
        if (!canvas || !selectedObject) return;
        selectedObject.set(props);
        canvas.requestRenderAll();
        canvas.fire('object:modified', { target: selectedObject });
    };

    const handleFillChange = (color: string) => { setFillColor(color); applyProp({ fill: color }); };
    const handleStrokeChange = (color: string) => { setStrokeColor(color); applyProp({ stroke: color }); };
    const handleStrokeWidthChange = (w: number) => { setStrokeWidth(w); applyProp({ strokeWidth: w }); };
    const handleOpacityChange = (val: number) => { setOpacity(val); applyProp({ opacity: val / 100 }); };

    const commitPos = (axis: 'x' | 'y', val: string) => {
        const n = parseInt(val);
        if (isNaN(n)) return;
        applyProp(axis === 'x' ? { left: n } : { top: n });
    };

    const commitSize = (dim: 'w' | 'h', val: string) => {
        if (!selectedObject) return;
        const n = parseInt(val);
        if (isNaN(n) || n <= 0) return;
        const origW = selectedObject.getScaledWidth();
        const origH = selectedObject.getScaledHeight();
        if (dim === 'w') {
            const scaleX = n / (selectedObject.width || 1);
            const scaleY = lockAspect ? (n / aspectRatio.current) / (selectedObject.height || 1) : selectedObject.scaleY;
            applyProp({ scaleX, scaleY });
            if (lockAspect) setSizeH(String(Math.round(n / aspectRatio.current)));
        } else {
            const scaleY = n / (selectedObject.height || 1);
            const scaleX = lockAspect ? (n * aspectRatio.current) / (selectedObject.width || 1) : selectedObject.scaleX;
            applyProp({ scaleX, scaleY });
            if (lockAspect) setSizeW(String(Math.round(n * aspectRatio.current)));
        }
    };

    const handleFontChange = (font: string) => {
        setFontFamily(font);
        pendingFontRef.current = font;
        ensureFontReady(font).then(() => {
            if (pendingFontRef.current === font) {
                applyProp({ fontFamily: font });
            }
        });
    };

    const handleFontSizeChange = (size: number) => {
        const clamped = Math.max(8, Math.min(200, size));
        setFontSize(clamped);
        setFontSizeInput(String(clamped));
        applyProp({ fontSize: clamped });
    };

    const commitFontSizeInput = () => {
        const parsed = parseInt(fontSizeInput);
        if (!isNaN(parsed)) handleFontSizeChange(parsed);
        else setFontSizeInput(String(fontSize));
    };

    const toggleBold = () => { const n = !isBold; setIsBold(n); applyProp({ fontWeight: n ? '700' : '400' }); };
    const toggleItalic = () => { const n = !isItalic; setIsItalic(n); applyProp({ fontStyle: n ? 'italic' : 'normal' }); };
    const toggleUnderline = () => { const n = !isUnderline; setIsUnderline(n); applyProp({ underline: n }); };
    const handleTextAlign = (align: 'left' | 'center' | 'right' | 'justify') => { setTextAlign(align); applyProp({ textAlign: align }); };

    const updateShadow = (partial: Partial<ShadowState>) => {
        const next = { ...shadow, ...partial };
        setShadow(next);
        if (!canvas || !selectedObject) return;
        applyShadow(selectedObject, next, canvas);
    };

    const handleCornerRadius = (val: number) => {
        setCornerRadiusState(val);
        if (!canvas || !selectedObject) return;
        setCornerRadius(selectedObject, val, canvas);
    };

    const handleBlur = (val: number) => {
        setBlur(val);
        if (!canvas || !selectedObject || !isImage) return;
        const img = selectedObject as FabricImage;
        const blurVal = val / 100;
        const existing = ((img as any).filters || []).filter((f: any) => f.type !== 'Blur' && f.constructor?.name !== 'Blur');
        if (blurVal === 0) {
            (img as any).filters = existing;
        } else {
            const blurFilter = new (fabricFilters as any).Blur({ blur: blurVal });
            (img as any).filters = [...existing, blurFilter];
        }
        img.applyFilters();
        canvas.requestRenderAll();
    };

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

    if (!selectedObject) {
        return (
            <div className="text-center py-6 text-gray-400 text-xs">
                Select an object to edit its properties.
            </div>
        );
    }

    const PRESET_COLORS = [
        // Neutrals
        '#ffffff', '#f9fafb', '#f3f4f6', '#e5e7eb', '#d1d5db', '#9ca3af', '#6b7280', '#374151', '#1f2937', '#000000',
        // Primary (Blue) — light → dark
        '#eff6ff', '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#0084ff', '#0066cc', '#1d4ed8', '#1e40af', '#0f172a',
        // Secondary (Amber) — light → dark
        '#fffbeb', '#fef3c7', '#fde68a', '#fcd34d', '#fbbf24', '#f59e0b', '#d97706', '#b45309', '#78350f', '#92400e',
    ];

    const inputCls = 'w-full text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none';
    const smallInputCls = 'w-full text-xs border border-gray-300 rounded-lg px-2 py-1.5 text-center focus:border-primary focus:ring-1 focus:ring-primary outline-none';

    return (
        <div className="space-y-5 text-sm">

            {/* Position & Size */}
            <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Position & Size</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                        <span className="text-[10px] text-gray-400 block mb-0.5">X</span>
                        <input type="number" className={smallInputCls} value={posX}
                            onChange={e => setPosX(e.target.value)}
                            onBlur={() => commitPos('x', posX)}
                            onKeyDown={e => { if (e.key === 'Enter') commitPos('x', posX); }} />
                    </div>
                    <div>
                        <span className="text-[10px] text-gray-400 block mb-0.5">Y</span>
                        <input type="number" className={smallInputCls} value={posY}
                            onChange={e => setPosY(e.target.value)}
                            onBlur={() => commitPos('y', posY)}
                            onKeyDown={e => { if (e.key === 'Enter') commitPos('y', posY); }} />
                    </div>
                </div>
                <div className="flex items-end gap-2">
                    <div className="flex-1">
                        <span className="text-[10px] text-gray-400 block mb-0.5">W</span>
                        <input type="number" className={smallInputCls} value={sizeW}
                            onChange={e => setSizeW(e.target.value)}
                            onBlur={() => commitSize('w', sizeW)}
                            onKeyDown={e => { if (e.key === 'Enter') commitSize('w', sizeW); }} />
                    </div>
                    <button
                        onClick={() => setLockAspect(v => !v)}
                        title={lockAspect ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
                        className={`p-1.5 rounded-md border transition ${lockAspect ? 'bg-primary border-primary text-white' : 'border-gray-300 text-gray-400 hover:border-gray-400'}`}
                    >
                        {lockAspect ? <Link className="w-3 h-3" /> : <Unlink className="w-3 h-3" />}
                    </button>
                    <div className="flex-1">
                        <span className="text-[10px] text-gray-400 block mb-0.5">H</span>
                        <input type="number" className={smallInputCls} value={sizeH}
                            onChange={e => setSizeH(e.target.value)}
                            onBlur={() => commitSize('h', sizeH)}
                            onKeyDown={e => { if (e.key === 'Enter') commitSize('h', sizeH); }} />
                    </div>
                </div>
            </div>

            {/* Text Controls */}
            {isText && (
                <>
                    <div>
                        <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Font</label>
                        <FontPicker value={fontFamily} onChange={handleFontChange} />
                    </div>

                    <div>
                        <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Size & Style</label>
                        <div className="flex items-center gap-2">
                            <button onClick={() => handleFontSizeChange(fontSize - 2)} className="p-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600"><Minus className="w-3 h-3" /></button>
                            <input
                                type="number"
                                value={fontSizeInput}
                                onChange={(e) => setFontSizeInput(e.target.value)}
                                onBlur={commitFontSizeInput}
                                onKeyDown={(e) => { if (e.key === 'Enter') commitFontSizeInput(); }}
                                className="w-16 text-center text-sm border border-gray-300 rounded-lg px-2 py-1 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                            />
                            <button onClick={() => handleFontSizeChange(fontSize + 2)} className="p-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600"><Plus className="w-3 h-3" /></button>

                            <div className="flex gap-1 ml-auto">
                                <button onClick={toggleBold} className={`p-2 rounded-lg transition ${isBold ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`} title="Bold">
                                    <Bold className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={toggleItalic} className={`p-2 rounded-lg transition ${isItalic ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`} title="Italic">
                                    <Italic className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={toggleUnderline} className={`p-2 rounded-lg transition ${isUnderline ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`} title="Underline">
                                    <Underline className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Alignment</label>
                        <div className="flex gap-1">
                            {(['left', 'center', 'right', 'justify'] as const).map(align => {
                                const Icon = { left: AlignLeft, center: AlignCenter, right: AlignRight, justify: AlignJustify }[align];
                                return (
                                    <button key={align} onClick={() => handleTextAlign(align)}
                                        className={`flex-1 p-2 rounded-lg transition ${textAlign === align ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                        title={`Align ${align}`}>
                                        <Icon className="w-3.5 h-3.5 mx-auto" />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}

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

            {/* Fill Color */}
            <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                    {bulletListConfig ? 'Text Color' : 'Fill Color'}
                </label>
                <div className="flex items-center gap-2 mb-2">
                    <input type="color" value={fillColor} onChange={(e) => handleFillChange(e.target.value)}
                        className="w-8 h-8 rounded-md border border-gray-300 cursor-pointer p-0" />
                    <input type="text" value={fillColor} onChange={(e) => handleFillChange(e.target.value)}
                        className="flex-1 text-xs font-mono border border-gray-300 rounded-lg px-2 py-1.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                </div>
                <div className="grid grid-cols-10 gap-1">
                    {PRESET_COLORS.map(c => (
                        <button key={c} onClick={() => handleFillChange(c)}
                            className={`w-6 h-6 rounded-md border-2 transition hover:scale-110 ${fillColor === c ? 'border-primary' : 'border-gray-200'}`}
                            style={{ backgroundColor: c }} />
                    ))}
                </div>
            </div>

            {/* Stroke */}
            <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Stroke</label>
                <div className="flex items-center gap-2">
                    <input type="color" value={strokeColor} onChange={(e) => handleStrokeChange(e.target.value)}
                        className="w-8 h-8 rounded-md border border-gray-300 cursor-pointer p-0" />
                    <input type="number" value={strokeWidth} onChange={(e) => handleStrokeWidthChange(parseInt(e.target.value) || 0)}
                        min={0} max={20}
                        className="w-16 text-center text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                    <span className="text-xs text-gray-400">px</span>
                </div>
            </div>

            {/* Opacity */}
            <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                    Opacity — {opacity}%
                </label>
                <input type="range" min={0} max={100} value={opacity}
                    onChange={(e) => handleOpacityChange(parseInt(e.target.value))}
                    className="w-full accent-primary" />
            </div>

            {/* Corner Radius */}
            {showCornerRadius && (
                <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                        Corner Radius — {cornerRadius}px
                    </label>
                    <input type="range" min={0} max={200} value={cornerRadius}
                        onChange={(e) => handleCornerRadius(parseInt(e.target.value))}
                        className="w-full accent-primary" />
                </div>
            )}

            {/* Blur (images only) */}
            {isImage && (
                <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                        Blur — {blur}%
                    </label>
                    <input type="range" min={0} max={100} value={blur}
                        onChange={(e) => handleBlur(parseInt(e.target.value))}
                        className="w-full accent-primary" />
                </div>
            )}

            {/* Shadow */}
            <div>
                <SectionHeader label="Shadow" open={shadowOpen} onToggle={() => setShadowOpen(v => !v)} />
                {shadowOpen && (
                    <div className="space-y-3 pl-1">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">Enable</span>
                            <button
                                onClick={() => updateShadow({ enabled: !shadow.enabled })}
                                className={`relative inline-flex h-5 w-9 rounded-full transition ${shadow.enabled ? 'bg-primary' : 'bg-gray-300'}`}
                            >
                                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow mt-0.5 transition-transform ${shadow.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                            </button>
                        </div>
                        {shadow.enabled && (
                            <>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-600 w-12">Color</span>
                                    <input type="color" value={shadow.color}
                                        onChange={e => updateShadow({ color: e.target.value })}
                                        className="w-8 h-7 rounded border border-gray-300 cursor-pointer p-0" />
                                </div>
                                <div>
                                    <span className="text-xs text-gray-600 block mb-1">Blur — {shadow.blur}px</span>
                                    <input type="range" min={0} max={80} value={shadow.blur}
                                        onChange={e => updateShadow({ blur: parseInt(e.target.value) })}
                                        className="w-full accent-primary" />
                                </div>
                                <div>
                                    <span className="text-xs text-gray-600 block mb-1">Offset X — {shadow.offsetX}px</span>
                                    <input type="range" min={-60} max={60} value={shadow.offsetX}
                                        onChange={e => updateShadow({ offsetX: parseInt(e.target.value) })}
                                        className="w-full accent-primary" />
                                </div>
                                <div>
                                    <span className="text-xs text-gray-600 block mb-1">Offset Y — {shadow.offsetY}px</span>
                                    <input type="range" min={-60} max={60} value={shadow.offsetY}
                                        onChange={e => updateShadow({ offsetY: parseInt(e.target.value) })}
                                        className="w-full accent-primary" />
                                </div>
                                <div>
                                    <span className="text-xs text-gray-600 block mb-1">Opacity — {shadow.opacity}%</span>
                                    <input type="range" min={0} max={100} value={shadow.opacity}
                                        onChange={e => updateShadow({ opacity: parseInt(e.target.value) })}
                                        className="w-full accent-primary" />
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PropertiesPanel;
