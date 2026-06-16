import React, { useState, useEffect } from 'react';
import { LayoutTemplate } from 'lucide-react';
import { generateTemplateThumbnail } from './templateThumbnail';

export interface PosterTemplate {
    id: string;
    name: string;
    description: string;
    previewColors: [string, string, string];
    aspectRatio: 'post' | 'story';
    json: object;
}

export const STARTER_TEMPLATES: PosterTemplate[] = [];

// ── Visual thumbnail ──────────────────────────────────────────────────────────
export const TemplateThumbnail: React.FC<{ t: PosterTemplate }> = ({ t }) => {
    const [thumbUrl, setThumbUrl] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        generateTemplateThumbnail(t.id, t.json).then(url => {
            if (!cancelled) setThumbUrl(url);
        });
        return () => { cancelled = true; };
    }, [t.id, t.json]);

    const isStory = t.aspectRatio === 'story';
    return (
        <div style={{
            width: '100%', aspectRatio: isStory ? '9/16' : '4/5',
            borderRadius: 8, overflow: 'hidden', background: '#F1F5F9',
            border: '1px solid #E2E8F0', flexShrink: 0,
        }}>
            {thumbUrl ? (
                <img src={thumbUrl} alt={t.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            ) : (
                <div style={{
                    width: '100%', height: '100%',
                    background: 'linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)',
                    backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',
                }} />
            )}
        </div>
    );
};

// ── Panel component ───────────────────────────────────────────────────────────
interface TemplatePanelProps {
    onLoadTemplate: (template: PosterTemplate) => void;
}

const TemplatePanel: React.FC<TemplatePanelProps> = ({ onLoadTemplate }) => {
    const postTemplates  = STARTER_TEMPLATES.filter(t => t.aspectRatio === 'post');
    const storyTemplates = STARTER_TEMPLATES.filter(t => t.aspectRatio === 'story');

    const renderGroup = (title: string, subtitle: string, templates: PosterTemplate[]) => (
        <div className="mb-6">
            <div className="mb-3">
                <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{title}</h4>
                <p className="text-[10px] text-gray-400 mt-0.5">{subtitle}</p>
            </div>
            {templates.length === 0 ? (
                <p className="text-[10px] text-gray-400 italic">Belum ada template.</p>
            ) : (
                <div className="grid grid-cols-2 gap-2.5">
                    {templates.map(t => (
                        <button
                            key={t.id}
                            onClick={() => {
                                if (confirm(`Muat template "${t.name}"? Canvas saat ini akan diganti.`)) {
                                    onLoadTemplate(t);
                                }
                            }}
                            className="text-left rounded-xl border border-gray-200 hover:border-primary hover:shadow-md transition-all group overflow-hidden bg-white"
                        >
                            <div className="p-2">
                                <TemplateThumbnail t={t} />
                            </div>
                            <div className="px-2.5 pb-2.5">
                                <div className="text-[11px] font-bold text-gray-700 group-hover:text-primary leading-tight">{t.name}</div>
                                <div className="text-[9px] text-gray-400 mt-0.5 leading-tight line-clamp-2">{t.description}</div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div>
            <div className="flex items-center gap-2 mb-4">
                <LayoutTemplate className="w-4 h-4 text-gray-500" />
                <div>
                    <h3 className="text-sm font-semibold text-gray-800">Templates</h3>
                    <p className="text-[10px] text-gray-400">Design system Alfatih Dunia Wisata</p>
                </div>
            </div>
            {renderGroup('Instagram Post (4:5)', '1080 × 1350 px', postTemplates)}
            {renderGroup('Instagram Story (9:16)', '1080 × 1920 px', storyTemplates)}
        </div>
    );
};

export default TemplatePanel;
