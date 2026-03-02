import React from 'react';

export type TemplateCategory = 'Content' | 'Tour Promotion' | 'Documentation';
export type AspectRatio = 'post' | 'story'; // 'post' is 1:1, 'story' is 9:16

export interface PosterTemplate {
    id: string;
    name: string;
    category: TemplateCategory;
    aspectRatio: AspectRatio;
    thumbnailUrl?: string; // We'll just use a colored box for now if null
}

export const AVAILABLE_TEMPLATES: PosterTemplate[] = [
    { id: 'promo-1-post', name: 'Flash Sale (Post)', category: 'Tour Promotion', aspectRatio: 'post' },
    { id: 'promo-1-story', name: 'Flash Sale (Story)', category: 'Tour Promotion', aspectRatio: 'story' },
    { id: 'content-1-post', name: 'Checklist (Post)', category: 'Content', aspectRatio: 'post' },
    { id: 'doc-1-story', name: 'Tour Highlights (Story)', category: 'Documentation', aspectRatio: 'story' },
];

interface TemplateSelectorProps {
    selectedTemplateId: string | null;
    onSelectTemplate: (template: PosterTemplate) => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ selectedTemplateId, onSelectTemplate }) => {
    return (
        <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">Select Template</h3>
            <div className="grid grid-cols-2 gap-3">
                {AVAILABLE_TEMPLATES.map((tmpl) => (
                    <button
                        key={tmpl.id}
                        onClick={() => onSelectTemplate(tmpl)}
                        className={`
                            relative flex flex-col items-center justify-center p-3 border-2 rounded-lg transition-all
                            ${selectedTemplateId === tmpl.id ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'}
                        `}
                    >
                        {/* Mock Thumbnail based on aspect ratio */}
                        <div className={`
                            bg-gray-100 rounded border border-gray-200 mb-2 flex items-center justify-center
                            ${tmpl.aspectRatio === 'post' ? 'w-16 h-16' : 'w-12 h-20'}
                        `}>
                            <span className="text-[10px] text-gray-400 font-medium uppercase">{tmpl.aspectRatio}</span>
                        </div>
                        <span className="text-xs font-medium text-gray-900 text-center">{tmpl.name}</span>
                        <span className="text-[10px] text-gray-500 mt-0.5">{tmpl.category}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default TemplateSelector;
