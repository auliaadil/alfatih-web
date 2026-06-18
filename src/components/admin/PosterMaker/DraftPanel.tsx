import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';

export interface PosterDraft {
    id: string;
    name: string;
    thumbnail: string;
    json: any;
    created_at: number;
}

interface DraftPanelProps {
    onLoadDraft: (json: any) => void;
    refreshKey?: number;
}

const DraftPanel: React.FC<DraftPanelProps> = ({ onLoadDraft, refreshKey }) => {
    const [drafts, setDrafts] = useState<PosterDraft[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem('alfatih_poster_drafts');
        if (saved) {
            try {
                setDrafts(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse drafts', e);
            }
        } else {
            setDrafts([]);
        }
    }, [refreshKey]);

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Delete this draft?')) {
            const updated = drafts.filter(d => d.id !== id);
            setDrafts(updated);
            localStorage.setItem('alfatih_poster_drafts', JSON.stringify(updated));
        }
    };

    if (drafts.length === 0) {
        return (
            <div className="text-center py-8 text-sm text-gray-500 bg-gray-50 rounded border border-dashed border-gray-200">
                No saved drafts yet.
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-3">
            {drafts.map(draft => (
                <div
                    key={draft.id}
                    onClick={() => onLoadDraft(draft.json)}
                    className="group relative bg-gray-50 rounded-lg border border-gray-200 overflow-hidden cursor-pointer hover:border-primary transition"
                >
                    <img src={draft.thumbnail} alt={draft.name} className="w-full h-auto aspect-post object-contain bg-gray-100" />
                    <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2">
                        <p className="text-[10px] text-white font-medium truncate">{draft.name}</p>
                        <p className="text-[8px] text-gray-300">{new Date(draft.created_at).toLocaleDateString('id-ID')}</p>
                    </div>
                    <button
                        onClick={(e) => handleDelete(draft.id, e)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-red-600 shadow"
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>
                </div>
            ))}
        </div>
    );
};

export default DraftPanel;
