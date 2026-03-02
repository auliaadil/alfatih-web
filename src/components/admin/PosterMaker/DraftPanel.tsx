import React, { useState, useEffect } from 'react';
import { Canvas } from 'fabric';
import { Trash2, Save } from 'lucide-react';

export interface PosterDraft {
    id: string;
    name: string;
    thumbnail: string;
    json: any;
    created_at: number;
}

interface DraftPanelProps {
    canvas: Canvas | null;
    onLoadDraft: (json: any) => void;
}

const DraftPanel: React.FC<DraftPanelProps> = ({ canvas, onLoadDraft }) => {
    const [drafts, setDrafts] = useState<PosterDraft[]>([]);
    const [draftName, setDraftName] = useState('');

    useEffect(() => {
        const saved = localStorage.getItem('alfatih_poster_drafts');
        if (saved) {
            try {
                setDrafts(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse drafts', e);
            }
        }
    }, []);

    const saveDrafts = (d: PosterDraft[]) => {
        setDrafts(d);
        localStorage.setItem('alfatih_poster_drafts', JSON.stringify(d));
    };

    const handleSave = () => {
        if (!canvas) return;
        const name = draftName.trim() || `Draft ${new Date().toLocaleString('id-ID')}`;
        const json = canvas.toJSON();

        // Generate a quick thumbnail using toDataURL
        // Scale it down heavily to save localstorage space and avoid quota limits
        const thumbnail = canvas.toDataURL({ format: 'jpeg', quality: 0.5, multiplier: 0.2 });

        const newDraft: PosterDraft = {
            id: Date.now().toString(),
            name,
            thumbnail,
            json,
            created_at: Date.now()
        };

        const updated = [newDraft, ...drafts];
        saveDrafts(updated);
        setDraftName('');
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Delete this draft?')) {
            const updated = drafts.filter(d => d.id !== id);
            saveDrafts(updated);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <input
                    type="text"
                    value={draftName}
                    onChange={e => setDraftName(e.target.value)}
                    placeholder="Draft Name"
                    className="flex-1 text-xs border-gray-300 rounded focus:ring-primary focus:border-primary"
                />
                <button
                    onClick={handleSave}
                    disabled={!canvas}
                    className="flex items-center gap-1 bg-primary text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-emerald-700 transition disabled:opacity-50"
                >
                    <Save className="w-3 h-3" /> Save
                </button>
            </div>

            {drafts.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-500 bg-gray-50 rounded border border-dashed border-gray-200">
                    No saved drafts yet.
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3 mt-4">
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
            )}
        </div>
    );
};

export default DraftPanel;
