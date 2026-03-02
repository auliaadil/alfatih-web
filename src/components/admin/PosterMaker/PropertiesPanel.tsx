import React, { useState, useEffect } from 'react';
import { Canvas, FabricObject } from 'fabric';
import { Bold, Italic, Underline, Plus, Minus } from 'lucide-react';

const GOOGLE_FONTS = [
    'Inter',
    'Roboto',
    'Open Sans',
    'Montserrat',
    'Poppins',
    'Lato',
    'Oswald',
    'Raleway',
    'Playfair Display',
    'Merriweather',
    'Nunito',
    'Ubuntu',
    'Rubik',
    'Work Sans',
    'Outfit',
    'DM Sans',
    'Bebas Neue',
    'Anton',
    'Pacifico',
    'Dancing Script',
    'Amiri',
    'Noto Sans Arabic',
    'Cairo',
    'Tajawal',
];

// Load Google Fonts dynamically
const loadedFonts = new Set<string>();
const loadGoogleFont = (fontName: string) => {
    if (loadedFonts.has(fontName)) return;
    loadedFonts.add(fontName);
    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@400;600;700;800;900&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
};

// Preload a few popular fonts on mount
GOOGLE_FONTS.slice(0, 10).forEach(loadGoogleFont);

interface PropertiesPanelProps {
    canvas: Canvas | null;
    selectedObject: FabricObject | null;
    refreshKey: number;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ canvas, selectedObject, refreshKey }) => {
    const [fillColor, setFillColor] = useState('#1a1a1a');
    const [strokeColor, setStrokeColor] = useState('#000000');
    const [strokeWidth, setStrokeWidth] = useState(0);
    const [opacity, setOpacity] = useState(100);

    // Text-specific
    const [fontFamily, setFontFamily] = useState('Inter');
    const [fontSize, setFontSize] = useState(48);
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [isUnderline, setIsUnderline] = useState(false);

    const isText = selectedObject?.type === 'textbox' || selectedObject?.type === 'text' || selectedObject?.type === 'i-text';

    // Sync state from selected object
    useEffect(() => {
        if (!selectedObject) return;

        setFillColor((selectedObject.fill as string) || '#1a1a1a');
        setStrokeColor((selectedObject.stroke as string) || '#000000');
        setStrokeWidth(selectedObject.strokeWidth || 0);
        setOpacity(Math.round((selectedObject.opacity || 1) * 100));

        if (isText) {
            const textObj = selectedObject as any;
            setFontFamily(textObj.fontFamily || 'Inter');
            setFontSize(textObj.fontSize || 48);
            setIsBold(textObj.fontWeight === 'bold' || textObj.fontWeight === '700' || textObj.fontWeight >= 700);
            setIsItalic(textObj.fontStyle === 'italic');
            setIsUnderline(textObj.underline || false);
        }
    }, [selectedObject, refreshKey]);

    const applyProp = (props: Record<string, any>) => {
        if (!canvas || !selectedObject) return;
        selectedObject.set(props);
        canvas.requestRenderAll();
    };

    const handleFillChange = (color: string) => {
        setFillColor(color);
        applyProp({ fill: color });
    };

    const handleStrokeChange = (color: string) => {
        setStrokeColor(color);
        applyProp({ stroke: color });
    };

    const handleStrokeWidthChange = (w: number) => {
        setStrokeWidth(w);
        applyProp({ strokeWidth: w });
    };

    const handleOpacityChange = (val: number) => {
        setOpacity(val);
        applyProp({ opacity: val / 100 });
    };

    const handleFontChange = (font: string) => {
        loadGoogleFont(font);
        setFontFamily(font);
        // Small delay to let the font load before applying
        setTimeout(() => {
            applyProp({ fontFamily: font });
        }, 300);
    };

    const handleFontSizeChange = (size: number) => {
        const clamped = Math.max(8, Math.min(200, size));
        setFontSize(clamped);
        applyProp({ fontSize: clamped });
    };

    const toggleBold = () => {
        const next = !isBold;
        setIsBold(next);
        applyProp({ fontWeight: next ? '700' : '400' });
    };

    const toggleItalic = () => {
        const next = !isItalic;
        setIsItalic(next);
        applyProp({ fontStyle: next ? 'italic' : 'normal' });
    };

    const toggleUnderline = () => {
        const next = !isUnderline;
        setIsUnderline(next);
        applyProp({ underline: next });
    };

    if (!selectedObject) {
        return (
            <div className="text-center py-6 text-gray-400 text-xs">
                Select an object to edit its properties.
            </div>
        );
    }

    const PRESET_COLORS = [
        '#000000', '#ffffff', '#1a1a1a', '#6b7280',
        '#10b981', '#059669', '#14b8a6', '#06b6d4',
        '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
        '#ec4899', '#ef4444', '#f97316', '#f59e0b',
        '#eab308', '#84cc16', '#22c55e', '#d4af37',
    ];

    return (
        <div className="space-y-5">
            {/* Text Controls */}
            {isText && (
                <>
                    <div>
                        <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Font</label>
                        <select
                            value={fontFamily}
                            onChange={(e) => handleFontChange(e.target.value)}
                            className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-primary"
                            style={{ fontFamily }}
                        >
                            {GOOGLE_FONTS.map(f => (
                                <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Size & Style</label>
                        <div className="flex items-center gap-2">
                            <button onClick={() => handleFontSizeChange(fontSize - 2)} className="p-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600"><Minus className="w-3 h-3" /></button>
                            <input
                                type="number"
                                value={fontSize}
                                onChange={(e) => handleFontSizeChange(parseInt(e.target.value) || 48)}
                                className="w-16 text-center text-sm border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-primary"
                            />
                            <button onClick={() => handleFontSizeChange(fontSize + 2)} className="p-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600"><Plus className="w-3 h-3" /></button>

                            <div className="flex gap-1 ml-auto">
                                <button
                                    onClick={toggleBold}
                                    className={`p-2 rounded-lg transition ${isBold ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                    title="Bold"
                                >
                                    <Bold className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={toggleItalic}
                                    className={`p-2 rounded-lg transition ${isItalic ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                    title="Italic"
                                >
                                    <Italic className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={toggleUnderline}
                                    className={`p-2 rounded-lg transition ${isUnderline ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                    title="Underline"
                                >
                                    <Underline className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Fill Color */}
            <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Fill Color</label>
                <div className="flex items-center gap-2 mb-2">
                    <input
                        type="color"
                        value={fillColor}
                        onChange={(e) => handleFillChange(e.target.value)}
                        className="w-8 h-8 rounded-md border border-gray-300 cursor-pointer p-0"
                    />
                    <input
                        type="text"
                        value={fillColor}
                        onChange={(e) => handleFillChange(e.target.value)}
                        className="flex-1 text-xs font-mono border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-primary"
                    />
                </div>
                <div className="grid grid-cols-10 gap-1">
                    {PRESET_COLORS.map(c => (
                        <button
                            key={c}
                            onClick={() => handleFillChange(c)}
                            className={`w-6 h-6 rounded-md border-2 transition hover:scale-110 ${fillColor === c ? 'border-primary' : 'border-gray-200'}`}
                            style={{ backgroundColor: c }}
                        />
                    ))}
                </div>
            </div>

            {/* Stroke */}
            <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Stroke</label>
                <div className="flex items-center gap-2">
                    <input
                        type="color"
                        value={strokeColor}
                        onChange={(e) => handleStrokeChange(e.target.value)}
                        className="w-8 h-8 rounded-md border border-gray-300 cursor-pointer p-0"
                    />
                    <input
                        type="number"
                        value={strokeWidth}
                        onChange={(e) => handleStrokeWidthChange(parseInt(e.target.value) || 0)}
                        min={0}
                        max={20}
                        className="w-16 text-center text-xs border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-primary"
                        placeholder="Width"
                    />
                    <span className="text-xs text-gray-400">px</span>
                </div>
            </div>

            {/* Opacity */}
            <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                    Opacity — {opacity}%
                </label>
                <input
                    type="range"
                    min={0}
                    max={100}
                    value={opacity}
                    onChange={(e) => handleOpacityChange(parseInt(e.target.value))}
                    className="w-full accent-primary"
                />
            </div>
        </div>
    );
};

export default PropertiesPanel;
