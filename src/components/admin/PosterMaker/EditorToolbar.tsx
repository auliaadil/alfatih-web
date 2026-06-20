import React from 'react';
import {
    Type, Square, Circle, Minus, ImagePlus, Trash2,
    AlignLeft, AlignCenter, AlignRight, AlignJustify, Link, Unlink,
    ChevronDown, ChevronRight, ChevronUp, ChevronsUp, ChevronsDown,
    Download, Loader2, RectangleHorizontal, RectangleVertical,
    Undo, Redo, Copy, Clipboard, CopyPlus,
    MoveRight, Pencil, Waves, MousePointer2, Hand, List
} from 'lucide-react';
import { CanvasSize } from './FabricCanvas';

interface EditorToolbarProps {
    canvasSize: CanvasSize;
    isExporting: boolean;
    onAddText: () => void;
    onAddBulletList: () => void;
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
    onSendToFront: () => void;
    onSendToBack: () => void;
    onCopy: () => void;
    onPaste: () => void;
    onDuplicate: () => void;
    onExport: () => void;
    onSetCanvasSize: (size: CanvasSize) => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    onAddArrow: () => void;
    onToggleFreehand: () => void;
    onAddDivider: () => void;
    isFreehandActive: boolean;
    activeDrawTool: 'rect' | 'circle' | 'line' | 'arrow' | 'divider' | null;
    cursorMode: 'select' | 'pan';
    onSetCursorMode: (mode: 'select' | 'pan') => void;
}

const ToolBtn: React.FC<{
    onClick: () => void;
    title: string;
    active?: boolean;
    disabled?: boolean;
    danger?: boolean;
    children: React.ReactNode;
}> = ({ onClick, title, active, disabled, danger, children }) => (
    <button
        onClick={onClick}
        title={title}
        disabled={disabled}
        className={`p-2 rounded-lg transition-all text-sm ${danger
            ? 'text-red-500 hover:bg-red-50 hover:text-red-600'
            : disabled
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
    onAddText, onAddBulletList, onAddRect, onAddCircle, onAddLine, onAddImage,
    onDelete, onAlignLeft, onAlignCenter, onAlignRight,
    onBringForward, onSendBackward, onSendToFront, onSendToBack,
    onCopy, onPaste, onDuplicate,
    onExport, onSetCanvasSize,
    onUndo, onRedo, canUndo, canRedo,
    onAddArrow, onToggleFreehand, onAddDivider, isFreehandActive,
    activeDrawTool, cursorMode, onSetCursorMode
}) => {
    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm px-3 py-2 flex items-center gap-1 flex-wrap flex-shrink-0">

            {/* Cursor Modes */}
            <ToolBtn onClick={() => onSetCursorMode('select')} title="Select (V)" active={cursorMode === 'select' && !activeDrawTool && !isFreehandActive}><MousePointer2 className="w-4 h-4" /></ToolBtn>
            <ToolBtn onClick={() => onSetCursorMode('pan')} title="Hand Tool (H or Spacebar)" active={cursorMode === 'pan'}><Hand className="w-4 h-4" /></ToolBtn>

            <Divider />

            {/* Canvas Size */}
            <ToolBtn onClick={() => onSetCanvasSize('post')} title="Post (3:4)" active={canvasSize === 'post'}>
                <RectangleVertical className="w-4 h-4" />
            </ToolBtn>
            <ToolBtn onClick={() => onSetCanvasSize('story')} title="Story (9:16)" active={canvasSize === 'story'}>
                <RectangleHorizontal className="w-4 h-4 rotate-90" />
            </ToolBtn>

            <Divider />

            {/* History */}
            <ToolBtn onClick={onUndo} title="Undo (Ctrl+Z)" disabled={!canUndo}><Undo className="w-4 h-4" /></ToolBtn>
            <ToolBtn onClick={onRedo} title="Redo (Ctrl+Y)" disabled={!canRedo}><Redo className="w-4 h-4" /></ToolBtn>

            <Divider />

            {/* Insert Tools */}
            <ToolBtn onClick={onAddText} title="Add Text"><Type className="w-4 h-4" /></ToolBtn>
            <ToolBtn onClick={onAddBulletList} title="Add Bullet List"><List className="w-4 h-4" /></ToolBtn>
            <ToolBtn onClick={onAddRect}    title="Add Rectangle"            active={activeDrawTool === 'rect'}><Square className="w-4 h-4" /></ToolBtn>
            <ToolBtn onClick={onAddCircle}  title="Add Circle"               active={activeDrawTool === 'circle'}><Circle className="w-4 h-4" /></ToolBtn>
            <ToolBtn onClick={onAddLine}    title="Add Line"                 active={activeDrawTool === 'line'}><Minus className="w-4 h-4" /></ToolBtn>
            <ToolBtn onClick={onAddArrow}   title="Tambah Panah"             active={activeDrawTool === 'arrow'}><MoveRight className="w-4 h-4" /></ToolBtn>
            <ToolBtn
                onClick={onToggleFreehand}
                title="Freehand Draw"
                active={isFreehandActive}
            >
                <Pencil className="w-4 h-4" />
            </ToolBtn>
            <ToolBtn onClick={onAddDivider} title="Add Divider"              active={activeDrawTool === 'divider'}><Waves className="w-4 h-4" /></ToolBtn>
            <ToolBtn onClick={onAddImage} title="Add Image"><ImagePlus className="w-4 h-4" /></ToolBtn>

            <Divider />

            {/* Clipboard */}
            <ToolBtn onClick={onCopy} title="Copy (Ctrl+C)"><Copy className="w-4 h-4" /></ToolBtn>
            <ToolBtn onClick={onPaste} title="Paste (Ctrl+V)"><Clipboard className="w-4 h-4" /></ToolBtn>
            <ToolBtn onClick={onDuplicate} title="Duplicate (Ctrl+D)"><CopyPlus className="w-4 h-4" /></ToolBtn>

            <Divider />

            {/* Alignment */}
            <ToolBtn onClick={onAlignLeft} title="Align Left"><AlignLeft className="w-4 h-4" /></ToolBtn>
            <ToolBtn onClick={onAlignCenter} title="Align Center"><AlignCenter className="w-4 h-4" /></ToolBtn>
            <ToolBtn onClick={onAlignRight} title="Align Right"><AlignRight className="w-4 h-4" /></ToolBtn>

            <Divider />

            {/* Layer Order */}
            <ToolBtn onClick={onSendToFront} title="Send to Front"><ChevronsUp className="w-4 h-4" /></ToolBtn>
            <ToolBtn onClick={onBringForward} title="Bring Forward"><ChevronUp className="w-4 h-4" /></ToolBtn>
            <ToolBtn onClick={onSendBackward} title="Send Backward"><ChevronDown className="w-4 h-4" /></ToolBtn>
            <ToolBtn onClick={onSendToBack} title="Send to Back"><ChevronsDown className="w-4 h-4" /></ToolBtn>

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
