import React from 'react';
import {
    Type, Square, Circle, Minus, ImagePlus, Trash2,
    AlignLeft, AlignCenter, AlignRight,
    ChevronUp, ChevronDown, Download, Loader2, RectangleHorizontal, RectangleVertical,
    Undo, Redo
} from 'lucide-react';
import { CanvasSize } from './FabricCanvas';

interface EditorToolbarProps {
    canvasSize: CanvasSize;
    isExporting: boolean;
    onAddText: () => void;
    onAddRect: () => void;
    onAddCircle: () => void;
    onAddLine: () => void;
    onAddImage: () => void;
    onDelete: () => void;
    onAlignLeft: () => void;
    onAlignCenter: () => void;
    onAlignRight: () => void;
    onBringForward: () => void;
    onSendBackward: () => void;
    onExport: () => void;
    onSetCanvasSize: (size: CanvasSize) => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
}

const ToolBtn: React.FC<{
    onClick: () => void;
    title: string;
    active?: boolean;
    danger?: boolean;
    children: React.ReactNode;
}> = ({ onClick, title, active, danger, children }) => (
    <button
        onClick={onClick}
        title={title}
        disabled={active === false}
        className={`p-2 rounded-lg transition-all text-sm ${danger
            ? 'text-red-500 hover:bg-red-50 hover:text-red-600'
            : active === false // Used for disabled state of Undo/Redo explicitly via active prop abuse or rather standard disabled
                ? 'text-gray-300 cursor-not-allowed'
                : active
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
    >
        {children}
    </button>
);

const Divider = () => <div className="w-px h-8 bg-gray-200 mx-1" />;

const EditorToolbar: React.FC<EditorToolbarProps> = ({
    canvasSize, isExporting,
    onAddText, onAddRect, onAddCircle, onAddLine, onAddImage,
    onDelete, onAlignLeft, onAlignCenter, onAlignRight,
    onBringForward, onSendBackward, onExport, onSetCanvasSize,
    onUndo, onRedo, canUndo, canRedo
}) => {
    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm px-3 py-2 flex items-center gap-1 flex-wrap">

            {/* Canvas Size */}
            <ToolBtn onClick={() => onSetCanvasSize('post')} title="Post (3:4)" active={canvasSize === 'post'}>
                <RectangleVertical className="w-4 h-4" />
            </ToolBtn>
            <ToolBtn onClick={() => onSetCanvasSize('story')} title="Story (9:16)" active={canvasSize === 'story'}>
                <RectangleHorizontal className="w-4 h-4 rotate-90" />
            </ToolBtn>

            <Divider />

            {/* History */}
            <ToolBtn onClick={onUndo} title="Undo (Ctrl+Z)" active={canUndo ? undefined : false}><Undo className="w-4 h-4" /></ToolBtn>
            <ToolBtn onClick={onRedo} title="Redo (Ctrl+Shift+Z)" active={canRedo ? undefined : false}><Redo className="w-4 h-4" /></ToolBtn>

            <Divider />

            {/* Insert Tools */}
            <ToolBtn onClick={onAddText} title="Add Text"><Type className="w-4 h-4" /></ToolBtn>
            <ToolBtn onClick={onAddRect} title="Add Rectangle"><Square className="w-4 h-4" /></ToolBtn>
            <ToolBtn onClick={onAddCircle} title="Add Circle"><Circle className="w-4 h-4" /></ToolBtn>
            <ToolBtn onClick={onAddLine} title="Add Line"><Minus className="w-4 h-4" /></ToolBtn>
            <ToolBtn onClick={onAddImage} title="Add Image"><ImagePlus className="w-4 h-4" /></ToolBtn>

            <Divider />

            {/* Alignment */}
            <ToolBtn onClick={onAlignLeft} title="Align Left"><AlignLeft className="w-4 h-4" /></ToolBtn>
            <ToolBtn onClick={onAlignCenter} title="Align Center"><AlignCenter className="w-4 h-4" /></ToolBtn>
            <ToolBtn onClick={onAlignRight} title="Align Right"><AlignRight className="w-4 h-4" /></ToolBtn>

            <Divider />

            {/* Layers */}
            <ToolBtn onClick={onBringForward} title="Bring Forward"><ChevronUp className="w-4 h-4" /></ToolBtn>
            <ToolBtn onClick={onSendBackward} title="Send Backward"><ChevronDown className="w-4 h-4" /></ToolBtn>

            <Divider />

            {/* Delete */}
            <ToolBtn onClick={onDelete} title="Delete Selected" danger><Trash2 className="w-4 h-4" /></ToolBtn>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Export */}
            <button
                onClick={onExport}
                disabled={isExporting}
                className="flex items-center gap-2 px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 shadow-sm"
            >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Export PNG
            </button>
        </div>
    );
};

export default EditorToolbar;
