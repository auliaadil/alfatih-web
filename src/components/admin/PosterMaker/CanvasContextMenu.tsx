import React, { useEffect, useRef } from 'react';
import { Copy, Clipboard, CopyPlus, ChevronsUp, ChevronUp, ChevronDown, ChevronsDown, Lock, Unlock, Trash2 } from 'lucide-react';
import { FabricObject } from 'fabric';

interface ContextMenuProps {
    x: number;
    y: number;
    selectedObject: FabricObject | null;
    onClose: () => void;
    onCopy: () => void;
    onPaste: () => void;
    onDuplicate: () => void;
    onSendToFront: () => void;
    onBringForward: () => void;
    onSendBackward: () => void;
    onSendToBack: () => void;
    onToggleLock: () => void;
    onDelete: () => void;
}

const CanvasContextMenu: React.FC<ContextMenuProps> = ({
    x, y, selectedObject, onClose,
    onCopy, onPaste, onDuplicate,
    onSendToFront, onBringForward, onSendBackward, onSendToBack,
    onToggleLock, onDelete,
}) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const isLocked = selectedObject?.lockMovementX ?? false;
    const hasSelection = !!selectedObject;

    useEffect(() => {
        const handleDown = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
        };
        const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('mousedown', handleDown);
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('mousedown', handleDown);
            document.removeEventListener('keydown', handleKey);
        };
    }, [onClose]);

    const Item: React.FC<{
        icon: React.ReactNode;
        label: string;
        onClick: () => void;
        disabled?: boolean;
        danger?: boolean;
    }> = ({ icon, label, onClick, disabled, danger }) => (
        <button
            disabled={disabled}
            onClick={() => { onClick(); onClose(); }}
            className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-md transition
                ${disabled ? 'text-gray-300 cursor-not-allowed'
                : danger ? 'text-red-500 hover:bg-red-50'
                : 'text-gray-700 hover:bg-gray-100'}`}
        >
            <span className="w-3.5 h-3.5 shrink-0">{icon}</span>
            {label}
        </button>
    );

    const Sep = () => <div className="my-1 h-px bg-gray-100" />;

    return (
        <div
            ref={menuRef}
            style={{ position: 'fixed', left: x, top: y, zIndex: 9999 }}
            className="bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 w-44"
        >
            <Item icon={<CopyPlus />} label="Duplicate" onClick={onDuplicate} disabled={!hasSelection} />
            <Item icon={<Copy />} label="Copy" onClick={onCopy} disabled={!hasSelection} />
            <Item icon={<Clipboard />} label="Paste" onClick={onPaste} />
            <Sep />
            <Item icon={<ChevronsUp />} label="Send to Front" onClick={onSendToFront} disabled={!hasSelection} />
            <Item icon={<ChevronUp />} label="Bring Forward" onClick={onBringForward} disabled={!hasSelection} />
            <Item icon={<ChevronDown />} label="Send Backward" onClick={onSendBackward} disabled={!hasSelection} />
            <Item icon={<ChevronsDown />} label="Send to Back" onClick={onSendToBack} disabled={!hasSelection} />
            <Sep />
            <Item
                icon={isLocked ? <Unlock /> : <Lock />}
                label={isLocked ? 'Unlock' : 'Lock'}
                onClick={onToggleLock}
                disabled={!hasSelection}
            />
            <Item icon={<Trash2 />} label="Delete" onClick={onDelete} disabled={!hasSelection} danger />
        </div>
    );
};

export default CanvasContextMenu;
