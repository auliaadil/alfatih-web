import React from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface CanvasZoomProps {
    zoom: number;
    fitScale: number;
    onZoomChange: (level: number) => void;
    onFit: () => void;
}

const CanvasZoom: React.FC<CanvasZoomProps> = ({ zoom, fitScale, onZoomChange, onFit }) => {
    const pct = Math.round(zoom * 100);

    const step = (delta: number) => {
        const next = Math.min(2, Math.max(0.1, parseFloat((zoom + delta).toFixed(2))));
        onZoomChange(next);
    };

    return (
        <div className="flex items-center justify-center gap-2 mt-2 flex-shrink-0">
            <button onClick={() => step(-0.1)} className="p-1.5 rounded-md bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 shadow-sm" title="Zoom out">
                <ZoomOut className="w-4 h-4" />
            </button>

            <input
                type="range"
                min={10}
                max={200}
                value={pct}
                onChange={e => onZoomChange(parseInt(e.target.value) / 100)}
                className="w-32 accent-primary"
            />

            <span className="text-xs font-mono text-gray-600 w-10 text-center">{pct}%</span>

            <button onClick={() => step(0.1)} className="p-1.5 rounded-md bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 shadow-sm" title="Zoom in">
                <ZoomIn className="w-4 h-4" />
            </button>

            <button onClick={onFit} className="p-1.5 rounded-md bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 shadow-sm" title="Fit to window">
                <Maximize2 className="w-4 h-4" />
            </button>
        </div>
    );
};

export default CanvasZoom;
