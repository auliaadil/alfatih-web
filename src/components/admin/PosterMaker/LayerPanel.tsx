import React, { useState, useEffect } from 'react';
import { Canvas, FabricObject } from 'fabric';
import { Eye, EyeOff, Lock, Unlock, Trash2, Type, Square, Image, Circle as CircleIcon, Minus, ChevronUp, ChevronDown } from 'lucide-react';

interface LayerPanelProps {
    canvas: Canvas | null;
    refreshKey: number; // bump this key to force re-read of canvas objects
}

const getObjectIcon = (obj: FabricObject) => {
    const type = obj.type;
    if (type === 'textbox' || type === 'text' || type === 'i-text') return <Type className="w-3.5 h-3.5" />;
    if (type === 'rect') return <Square className="w-3.5 h-3.5" />;
    if (type === 'circle') return <CircleIcon className="w-3.5 h-3.5" />;
    if (type === 'line') return <Minus className="w-3.5 h-3.5" />;
    if (type === 'image') return <Image className="w-3.5 h-3.5" />;
    return <Square className="w-3.5 h-3.5" />;
};

const getObjectLabel = (obj: FabricObject, idx: number) => {
    const type = obj.type;
    if (type === 'textbox' || type === 'text' || type === 'i-text') {
        const text = (obj as any).text || '';
        return text.substring(0, 20) || `Text ${idx + 1}`;
    }
    if (type === 'rect') return `Rectangle ${idx + 1}`;
    if (type === 'circle') return `Circle ${idx + 1}`;
    if (type === 'line') return `Line ${idx + 1}`;
    if (type === 'image') return `Image ${idx + 1}`;
    return `Object ${idx + 1}`;
};

const LayerPanel: React.FC<LayerPanelProps> = ({ canvas, refreshKey }) => {
    const [objects, setObjects] = useState<FabricObject[]>([]);
    const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
    const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

    useEffect(() => {
        if (!canvas) return;
        // Get objects in reverse so top layer shows first
        const objs = canvas.getObjects().slice().reverse();
        setObjects(objs);
    }, [canvas, refreshKey]);

    if (!canvas || objects.length === 0) {
        return (
            <div className="text-center py-8 text-gray-400 text-sm">
                No layers yet. Add elements to the canvas.
            </div>
        );
    }

    const handleSelect = (obj: FabricObject) => {
        canvas.setActiveObject(obj);
        canvas.requestRenderAll();
    };

    const handleToggleVisible = (obj: FabricObject) => {
        obj.set({ visible: !obj.visible });
        canvas.requestRenderAll();
        setObjects([...canvas.getObjects().slice().reverse()]);
    };

    const handleToggleLock = (obj: FabricObject) => {
        const isLocked = obj.lockMovementX;
        obj.set({
            lockMovementX: !isLocked,
            lockMovementY: !isLocked,
            lockRotation: !isLocked,
            lockScalingX: !isLocked,
            lockScalingY: !isLocked,
            hasControls: isLocked,
            selectable: isLocked,
        });
        canvas.requestRenderAll();
        setObjects([...canvas.getObjects().slice().reverse()]);
    };

    const handleDelete = (obj: FabricObject) => {
        canvas.remove(obj);
        canvas.requestRenderAll();
        setObjects([...canvas.getObjects().slice().reverse()]);
    };

    const handleMoveUp = (obj: FabricObject) => {
        canvas.bringObjectForward(obj);
        canvas.requestRenderAll();
        setObjects([...canvas.getObjects().slice().reverse()]);
    };

    const handleMoveDown = (obj: FabricObject) => {
        canvas.sendObjectBackwards(obj);
        canvas.requestRenderAll();
        setObjects([...canvas.getObjects().slice().reverse()]);
    };

    const handleDragStart = (e: React.DragEvent, idx: number) => {
        setDraggedIdx(idx);
        e.dataTransfer.effectAllowed = 'move';
        // Minimal data payload to make Firefox happy
        e.dataTransfer.setData('text/plain', idx.toString());
    };

    const handleDragOver = (e: React.DragEvent, idx: number) => {
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = 'move';
        if (dragOverIdx !== idx) {
            setDragOverIdx(idx);
        }
    };

    const handleDrop = (e: React.DragEvent, dropIdx: number) => {
        e.preventDefault();
        setDragOverIdx(null);

        if (draggedIdx === null || draggedIdx === dropIdx) {
            setDraggedIdx(null);
            return;
        }

        const obj = objects[draggedIdx];

        // The visual list is reversed. 
        // Visual index 0 is Top layer (Fabric index: objects.length - 1)
        const objectsCount = objects.length;
        const newFabricIndex = objectsCount - 1 - dropIdx;

        canvas.moveObjectTo(obj, newFabricIndex);
        canvas.requestRenderAll();
        setObjects([...canvas.getObjects().slice().reverse()]);

        setDraggedIdx(null);
    };

    const handleDragEnd = () => {
        setDraggedIdx(null);
        setDragOverIdx(null);
    };

    const activeObj = canvas.getActiveObject();

    return (
        <div className="space-y-1">
            {objects.map((obj, idx) => {
                const isActive = activeObj === obj;
                const isLocked = obj.lockMovementX;
                const isVisible = obj.visible !== false;

                return (
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
                        <span className="truncate flex-1 text-xs font-medium">
                            {getObjectLabel(obj, objects.length - 1 - idx)}
                        </span>

                        <button
                            onClick={(e) => { e.stopPropagation(); handleMoveUp(obj); }}
                            className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600"
                            title="Bring Forward"
                        >
                            <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleMoveDown(obj); }}
                            className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600"
                            title="Send Backward"
                        >
                            <ChevronDown className="w-3 h-3" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleToggleVisible(obj); }}
                            className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600"
                            title={isVisible ? 'Hide' : 'Show'}
                        >
                            {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleToggleLock(obj); }}
                            className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600"
                            title={isLocked ? 'Unlock' : 'Lock'}
                        >
                            {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(obj); }}
                            className="p-1 hover:bg-red-100 rounded text-gray-400 hover:text-red-500"
                            title="Delete"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
};

export default LayerPanel;
