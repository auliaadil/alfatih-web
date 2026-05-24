import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, LayoutTemplate, Loader2 } from 'lucide-react';
import { SavedTemplate, fetchTemplates, deleteTemplate } from '../../services/posterTemplates';
import { PosterTemplate } from '../../components/admin/PosterMaker/types';
import { CODE_TEMPLATES } from '../../components/admin/PosterMaker/templates';

const TYPE_LABELS: Record<string, string> = {
    conversion: 'Conversion',
    aspiration: 'Aspiration',
    'edu-reminder': 'Edu Reminder',
    'social-proof': 'Social Proof',
    blank: 'Blank',
    custom: 'Custom',
};

const TYPE_COLORS: Record<string, string> = {
    conversion: 'bg-blue-100 text-blue-700',
    aspiration: 'bg-yellow-100 text-yellow-700',
    'edu-reminder': 'bg-green-100 text-green-700',
    'social-proof': 'bg-purple-100 text-purple-700',
    blank: 'bg-gray-100 text-gray-600',
    custom: 'bg-orange-100 text-orange-700',
};

type FilterTab = 'all' | 'post' | 'story';

const PosterTemplates: React.FC = () => {
    const navigate = useNavigate();
    const [customTemplates, setCustomTemplates] = useState<SavedTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [filter, setFilter] = useState<FilterTab>('all');

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        setIsLoading(true);
        setCustomTemplates(await fetchTemplates());
        setIsLoading(false);
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Hapus template "${name}"? Tindakan ini tidak bisa dibatalkan.`)) return;
        setDeletingId(id);
        const ok = await deleteTemplate(id);
        if (ok) setCustomTemplates(prev => prev.filter(t => t.id !== id));
        setDeletingId(null);
    };

    const filteredBuiltIn = filter === 'all'
        ? CODE_TEMPLATES
        : CODE_TEMPLATES.filter(t => t.aspectRatio === filter);

    const filteredCustom = filter === 'all'
        ? customTemplates
        : customTemplates.filter(t => t.aspect_ratio === filter);

    const totalCount = filteredBuiltIn.length + filteredCustom.length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Template Manager</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Kelola semua template poster — built-in dan custom yang tersimpan.
                    </p>
                </div>
                <button
                    onClick={() => navigate('/admin/poster-maker')}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition"
                >
                    <Plus className="w-4 h-4" />
                    Template Baru
                </button>
            </div>

            <div className="flex items-center gap-2">
                {(['all', 'post', 'story'] as FilterTab[]).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition border ${
                            filter === tab
                                ? 'bg-primary text-white border-primary'
                                : 'bg-white border-gray-200 text-gray-600 hover:border-primary hover:text-primary'
                        }`}
                    >
                        {tab === 'all' ? 'Semua' : tab === 'post' ? 'Post (4:5)' : 'Story (9:16)'}
                    </button>
                ))}
                {!isLoading && (
                    <span className="ml-auto text-sm text-gray-400">{totalCount} template</span>
                )}
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
            ) : (
                <div className="space-y-8">
                    {filteredBuiltIn.length > 0 && (
                        <section>
                            <div className="flex items-center gap-2 mb-3">
                                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Built-in</h2>
                                <span className="text-xs text-gray-300">{filteredBuiltIn.length} template</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {filteredBuiltIn.map(t => (
                                    <BuiltInCard key={t.id} template={t} onUse={() => navigate('/admin/poster-maker')} />
                                ))}
                            </div>
                        </section>
                    )}

                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Custom</h2>
                            <span className="text-xs text-gray-300">{filteredCustom.length} template</span>
                        </div>
                        {filteredCustom.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
                                <LayoutTemplate className="w-10 h-10 text-gray-200 mb-3" />
                                <p className="text-sm text-gray-500 font-medium">Belum ada template custom</p>
                                <p className="text-xs text-gray-400 mt-1 text-center max-w-xs">
                                    Buat template baru di Poster Maker dengan block builder.
                                </p>
                                <button
                                    onClick={() => navigate('/admin/poster-maker')}
                                    className="mt-4 px-4 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-blue-600 transition"
                                >
                                    Buka Poster Maker
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {filteredCustom.map(t => (
                                    <CustomCard
                                        key={t.id}
                                        template={t}
                                        isDeleting={deletingId === t.id}
                                        onDelete={() => handleDelete(t.id, t.name)}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            )}
        </div>
    );
};

interface BuiltInCardProps {
    template: PosterTemplate;
    onUse: () => void;
}

const BuiltInCard: React.FC<BuiltInCardProps> = ({ template: t, onUse }) => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        <div className="p-2">
            <div
                className={`w-full rounded overflow-hidden ${t.aspectRatio === 'story' ? 'aspect-[9/16]' : 'aspect-[4/5]'}`}
                style={{ background: `linear-gradient(135deg, ${t.previewColors[0]}, ${t.previewColors[1]})` }}
            />
        </div>
        <div className="px-3 pb-2">
            <p className="text-sm font-semibold text-gray-800 leading-tight line-clamp-1">{t.name}</p>
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{t.description}</p>
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[t.category] ?? TYPE_COLORS.custom}`}>
                    {TYPE_LABELS[t.category] ?? t.category}
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                    {t.aspectRatio === 'post' ? '4:5' : '9:16'}
                </span>
            </div>
        </div>
        <div className="border-t border-gray-100">
            <button onClick={onUse} className="w-full py-2 text-xs font-semibold text-primary hover:bg-blue-50 transition">
                Gunakan →
            </button>
        </div>
    </div>
);

interface CustomCardProps {
    template: SavedTemplate;
    isDeleting: boolean;
    onDelete: () => void;
}

const CustomCard: React.FC<CustomCardProps> = ({ template: t, isDeleting, onDelete }) => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        <div className={`w-full bg-gray-100 overflow-hidden ${t.aspect_ratio === 'story' ? 'aspect-[9/16]' : 'aspect-[4/5]'}`}>
            {t.thumbnail_data_url ? (
                <img src={t.thumbnail_data_url} alt={t.name} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex items-center justify-center">
                    <LayoutTemplate className="w-8 h-8 text-gray-300" />
                </div>
            )}
        </div>
        <div className="p-3">
            <p className="text-sm font-semibold text-gray-800 leading-tight line-clamp-1">{t.name}</p>
            {t.description && (
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{t.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[t.template_type] ?? TYPE_COLORS.custom}`}>
                    {TYPE_LABELS[t.template_type] ?? t.template_type}
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                    {t.aspect_ratio === 'post' ? '4:5' : '9:16'}
                </span>
            </div>
            <p className="text-[10px] text-gray-300 mt-2">
                {new Date(t.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
        </div>
        <div className="border-t border-gray-100 flex">
            <button
                onClick={() => {}}
                className="flex-1 py-2 text-xs font-semibold text-primary hover:bg-blue-50 transition flex items-center justify-center gap-1.5"
            >
                <Pencil className="w-3 h-3" />
                Gunakan
            </button>
            <div className="w-px bg-gray-100" />
            <button
                onClick={onDelete}
                disabled={isDeleting}
                className="flex-1 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
                {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                Hapus
            </button>
        </div>
    </div>
);

export default PosterTemplates;
