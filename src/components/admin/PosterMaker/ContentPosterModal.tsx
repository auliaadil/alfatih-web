import React, { useState } from 'react';
import { X, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { ContentSlide, CoverSlide, TipSlide, generateContentPoster } from '../../../../services/contentPosterService';
import { useToast } from '../ui';

interface ContentPosterModalProps {
    initialAspectRatio: 'post' | 'story'
    onClose: () => void
    onApply: (slides: ContentSlide[], aspectRatio: 'post' | 'story', category: string) => void
}

const ContentPosterModal: React.FC<ContentPosterModalProps> = ({
    initialAspectRatio, onClose, onApply,
}) => {
    const toast = useToast();
    const [step, setStep] = useState<'input' | 'review'>('input');
    const [topic, setTopic] = useState('');
    const [category, setCategory] = useState('TIPS UMRAH');
    const [notes, setNotes] = useState('');
    const [aspectRatio, setAspectRatio] = useState<'post' | 'story'>(initialAspectRatio);
    const [slides, setSlides] = useState<ContentSlide[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);

    const handleGenerate = async () => {
        if (!topic.trim()) {
            toast('warning', 'Masukkan topik terlebih dahulu.');
            return;
        }
        setIsGenerating(true);
        try {
            const result = await generateContentPoster(
                topic.trim(),
                category.trim() || 'TIPS UMRAH',
                notes.trim() || undefined
            );
            setSlides(result);
            setStep('review');
        } catch (err) {
            toast('error', err instanceof Error ? err.message : 'Gagal membuat konten AI.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRegenerateSlide = async (slideIndex: number) => {
        setRegeneratingIndex(slideIndex);
        try {
            const result = await generateContentPoster(
                topic.trim(),
                category.trim() || 'TIPS UMRAH',
                notes.trim() || undefined,
                slideIndex
            );
            setSlides(prev => prev.map((s, i) => i === slideIndex ? result[0] : s));
        } catch (err) {
            toast('error', err instanceof Error ? err.message : 'Gagal meregenerasi slide.');
        } finally {
            setRegeneratingIndex(null);
        }
    };

    const updateSlideField = (index: number, field: string, value: string) => {
        setSlides(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <h2 className="text-base font-bold text-gray-900">
                            {step === 'input' ? 'Buat Konten AI' : 'Review Copywriting'}
                        </h2>
                        {step === 'review' && (
                            <span className="text-xs text-gray-400 ml-1">{slides.length} slide</span>
                        )}
                    </div>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 transition">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {step === 'input' ? (
                        <div className="space-y-4">

                            {/* Topic */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                    Topik <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={e => setTopic(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleGenerate(); }}
                                    placeholder="misal: 5 Tips membawa anak saat Umrah"
                                    className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors placeholder:text-gray-300"
                                    autoFocus
                                />
                                <p className="text-[11px] text-gray-400 mt-1">
                                    AI membaca jumlah slide dari topik — misal "5 Tips" → 6 slide (1 cover + 5 tips)
                                </p>
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                    Label Kategori
                                </label>
                                <input
                                    type="text"
                                    value={category}
                                    onChange={e => setCategory(e.target.value.toUpperCase())}
                                    placeholder="TIPS UMRAH"
                                    className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors placeholder:text-gray-300 tracking-widest font-semibold"
                                />
                                <p className="text-[11px] text-gray-400 mt-1">
                                    Muncul di bagian atas setiap slide — misal: PENGINGAT ISLAMI, TIPS HAJI
                                </p>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                    Catatan Tambahan{' '}
                                    <span className="text-gray-400 font-normal normal-case">(opsional)</span>
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="misal: target ibu muda dengan anak balita, gaya bahasa ringan dan tidak formal"
                                    rows={3}
                                    className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors placeholder:text-gray-300 resize-none"
                                />
                            </div>

                            {/* Aspect ratio */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                    Ukuran Slide
                                </label>
                                <div className="flex gap-2">
                                    {(['post', 'story'] as const).map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setAspectRatio(s)}
                                            className={`flex-1 border-2 rounded-xl p-3 text-center transition-all ${
                                                aspectRatio === s
                                                    ? 'border-primary bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className={`text-xl font-black leading-none ${aspectRatio === s ? 'text-primary' : 'text-gray-400'}`}>
                                                {s === 'post' ? '4:5' : '9:16'}
                                            </div>
                                            <div className={`text-[10px] font-semibold mt-1 ${aspectRatio === s ? 'text-primary' : 'text-gray-400'}`}>
                                                {s === 'post' ? 'Post · 1080×1350' : 'Story · 1080×1920'}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {slides.map((slide, index) => {
                                const isCover = slide.slideType === 'cover';
                                const isRegenerating = regeneratingIndex === index;
                                return (
                                    <div key={index} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                                                {isCover ? '✦ Cover' : `Tip ${(slide as TipSlide).number}`}
                                            </span>
                                            <button
                                                onClick={() => handleRegenerateSlide(index)}
                                                disabled={isRegenerating || regeneratingIndex !== null || isGenerating}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-gray-500 hover:text-primary border border-gray-200 hover:border-primary rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                <RefreshCw className={`w-3 h-3 ${isRegenerating ? 'animate-spin' : ''}`} />
                                                Regenerate
                                            </button>
                                        </div>

                                        {isRegenerating ? (
                                            <div className="flex items-center gap-2 py-4 text-gray-400">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span className="text-sm">Menulis ulang slide...</span>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <input
                                                    type="text"
                                                    value={isCover ? (slide as CoverSlide).title : (slide as TipSlide).title}
                                                    onChange={e => updateSlideField(index, 'title', e.target.value)}
                                                    placeholder="Judul"
                                                    className="w-full text-sm font-semibold border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                                                />
                                                <textarea
                                                    value={isCover ? (slide as CoverSlide).subtitle : (slide as TipSlide).body}
                                                    onChange={e => updateSlideField(index, isCover ? 'subtitle' : 'body', e.target.value)}
                                                    placeholder={isCover ? 'Subjudul' : 'Isi / penjelasan'}
                                                    rows={3}
                                                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors resize-none"
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 px-6 py-4 border-t border-gray-200 flex-shrink-0">
                    {step === 'input' ? (
                        <>
                            <button
                                onClick={onClose}
                                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating || !topic.trim()}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGenerating
                                    ? <><Loader2 className="w-4 h-4 animate-spin" />Generating...</>
                                    : <><Sparkles className="w-4 h-4" />Generate</>
                                }
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => setStep('input')}
                                disabled={isGenerating}
                                className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-40"
                            >
                                ← Ubah Input
                            </button>
                            <button
                                onClick={() => onApply(slides, aspectRatio, category.trim() || 'TIPS UMRAH')}
                                disabled={regeneratingIndex !== null}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-blue-600 transition disabled:opacity-50"
                            >
                                <Sparkles className="w-4 h-4" />
                                Terapkan ke Kanvas
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContentPosterModal;
