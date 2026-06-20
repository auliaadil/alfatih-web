import React from 'react';
import { Plus, Copy, Trash2 } from 'lucide-react';
import { PosterSlide } from '../../../types/poster';
import { CanvasSize } from './FabricCanvas';

interface SlideStripProps {
    slides: PosterSlide[];
    activeIndex: number;
    canvasSize: CanvasSize;
    onSwitch: (index: number) => void;
    onAdd: () => void;
    onDuplicate: (index: number) => void;
    onDelete: (index: number) => void;
}

const SlideStrip: React.FC<SlideStripProps> = ({
    slides, activeIndex, canvasSize, onSwitch, onAdd, onDuplicate, onDelete,
}) => {
    const chipWidth = canvasSize === 'post' ? 56 : 40;
    const aspectRatio = canvasSize === 'post' ? '4/5' : '9/16';

    return (
        <div className="flex items-end gap-2 py-2 px-1 overflow-x-auto flex-shrink-0 border-t border-gray-100">
            {slides.map((slide, index) => (
                <div
                    key={slide.id}
                    className="relative flex-shrink-0 group"
                    style={{ width: chipWidth }}
                >
                    <button
                        onClick={() => onSwitch(index)}
                        className={`w-full rounded overflow-hidden border-2 transition-all ${
                            index === activeIndex
                                ? 'border-primary ring-2 ring-primary/20'
                                : 'border-gray-200 hover:border-gray-400'
                        }`}
                        style={{ aspectRatio, display: 'block' }}
                        title={`Slide ${index + 1}`}
                    >
                        {slide.thumbnail
                            ? <img src={slide.thumbnail} alt={`Slide ${index + 1}`} className="w-full h-full object-cover" />
                            : <div className="w-full h-full bg-gray-100" style={{ aspectRatio }} />
                        }
                    </button>

                    {/* Slide number badge */}
                    <span className="absolute bottom-1 left-1 text-[8px] font-bold text-white bg-black/50 px-1 rounded leading-none pointer-events-none">
                        {index + 1}
                    </span>

                    {/* Hover actions */}
                    <div className="absolute -top-1 -right-1 hidden group-hover:flex flex-col gap-0.5 z-10">
                        <button
                            onClick={e => { e.stopPropagation(); onDuplicate(index); }}
                            className="w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center shadow"
                            title="Duplikat slide"
                        >
                            <Copy className="w-2.5 h-2.5" />
                        </button>
                        {slides.length > 1 && (
                            <button
                                onClick={e => { e.stopPropagation(); onDelete(index); }}
                                className="w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center shadow"
                                title="Hapus slide"
                            >
                                <Trash2 className="w-2.5 h-2.5" />
                            </button>
                        )}
                    </div>
                </div>
            ))}

            {/* Add slide button */}
            <button
                onClick={onAdd}
                className="flex-shrink-0 border-2 border-dashed border-gray-300 rounded hover:border-primary hover:bg-emerald-50 transition-all flex items-center justify-center"
                style={{ width: chipWidth, aspectRatio }}
                title="Tambah slide"
            >
                <Plus className="w-4 h-4 text-gray-400" />
            </button>
        </div>
    );
};

export default SlideStrip;
