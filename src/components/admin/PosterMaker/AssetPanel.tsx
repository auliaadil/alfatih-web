import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Image as ImageIcon, QrCode, Loader2, ChevronDown } from 'lucide-react';

interface AssetPanelProps {
    onAddImage: (url: string) => void;
}

// ── Image search (Unsplash + Pixabay) ──────────────────────────────────────

type ImageSource = 'unsplash' | 'pixabay';

interface ImageResult {
    id: string;
    thumbUrl: string;
    fullUrl: string;
    author?: string;
}

async function searchUnsplash(query: string, page: number): Promise<ImageResult[]> {
    const key = (import.meta as any).env?.VITE_UNSPLASH_ACCESS_KEY;
    if (!key) return [];
    const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=20&page=${page}`,
        { headers: { Authorization: `Client-ID ${key}` } },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((r: any) => ({
        id: r.id,
        thumbUrl: r.urls.small,
        fullUrl: r.urls.regular,
        author: r.user?.name,
    }));
}

async function searchPixabay(query: string, page: number): Promise<ImageResult[]> {
    const key = (import.meta as any).env?.VITE_PIXABAY_API_KEY;
    if (!key) return [];
    const res = await fetch(
        `https://pixabay.com/api/?key=${key}&q=${encodeURIComponent(query)}&per_page=20&page=${page}&image_type=photo`,
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.hits || []).map((r: any) => ({
        id: String(r.id),
        thumbUrl: r.previewURL,
        fullUrl: r.largeImageURL,
        author: r.user,
    }));
}

const ImagesTab: React.FC<{ onAddImage: (url: string) => void }> = ({ onAddImage }) => {
    const [source, setSource] = useState<ImageSource>('unsplash');
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<ImageResult[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const doSearch = useCallback(async (q: string, p: number, src: ImageSource, append = false) => {
        if (!q.trim()) { setResults([]); setHasMore(false); return; }
        setLoading(true);
        try {
            const items = src === 'unsplash' ? await searchUnsplash(q, p) : await searchPixabay(q, p);
            setResults(prev => append ? [...prev, ...items] : items);
            setHasMore(items.length === 20);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setPage(1);
            doSearch(query, 1, source, false);
        }, 380);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [query, source]);

    const loadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        doSearch(query, nextPage, source, true);
    };

    const hasKey = source === 'unsplash'
        ? !!(import.meta as any).env?.VITE_UNSPLASH_ACCESS_KEY
        : !!(import.meta as any).env?.VITE_PIXABAY_API_KEY;

    return (
        <div className="space-y-3">
            {/* Source Toggle */}
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                {(['unsplash', 'pixabay'] as const).map(src => (
                    <button
                        key={src}
                        onClick={() => { setSource(src); setPage(1); setResults([]); }}
                        className={`flex-1 py-1.5 text-xs font-medium transition ${source === src ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                        {src.charAt(0).toUpperCase() + src.slice(1)}
                    </button>
                ))}
            </div>

            {/* Search Input */}
            <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                    type="text"
                    placeholder={`Search ${source}…`}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
            </div>

            {!hasKey && (
                <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                    Add <code className="font-mono">VITE_{source.toUpperCase()}_ACCESS_KEY{source === 'unsplash' ? '' : ' / VITE_PIXABAY_API_KEY'}</code> to <code>.env.local</code> to enable image search.
                </p>
            )}

            {/* Results Grid */}
            {results.length > 0 && (
                <div className="grid grid-cols-2 gap-1.5">
                    {results.map(img => (
                        <button
                            key={img.id}
                            onClick={() => onAddImage(img.fullUrl)}
                            className="relative group rounded-lg overflow-hidden border border-gray-200 hover:border-primary transition aspect-square"
                            title={img.author ? `By ${img.author}` : undefined}
                        >
                            <img src={img.thumbUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                <ImageIcon className="w-5 h-5 text-white" />
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {loading && (
                <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
            )}

            {hasMore && !loading && (
                <button onClick={loadMore} className="w-full flex items-center justify-center gap-1 py-2 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                    <ChevronDown className="w-3.5 h-3.5" />
                    Load more
                </button>
            )}

            {results.length > 0 && (
                <p className="text-[10px] text-gray-400 text-center">
                    {source === 'unsplash' ? 'Photos from ' : 'Images from '}
                    <a href={source === 'unsplash' ? 'https://unsplash.com' : 'https://pixabay.com'} target="_blank" rel="noopener noreferrer" className="underline">
                        {source.charAt(0).toUpperCase() + source.slice(1)}
                    </a>
                </p>
            )}
        </div>
    );
};

// ── QR Code Generator ─────────────────────────────────────────────────────

const QrTab: React.FC<{ onAddImage: (url: string) => void }> = ({ onAddImage }) => {
    const [text, setText] = useState('');
    const [fgColor, setFgColor] = useState('#000000');
    const [bgColor, setBgColor] = useState('#ffffff');
    const [dataUrl, setDataUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const generate = useCallback(async (t: string, fg: string, bg: string) => {
        if (!t.trim()) { setDataUrl(null); return; }
        setLoading(true);
        try {
            const QRCode = await import('qrcode');
            const url = await QRCode.default.toDataURL(t, {
                width: 512,
                margin: 1,
                color: { dark: fg, light: bg },
            });
            setDataUrl(url);
        } catch {
            setDataUrl(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => generate(text, fgColor, bgColor), 200);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [text, fgColor, bgColor, generate]);

    return (
        <div className="space-y-3">
            <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1 block">URL / Text</label>
                <textarea
                    rows={3}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
                />
            </div>

            <div className="flex gap-3">
                <div className="flex-1">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Foreground</label>
                    <input type="color" value={fgColor} onChange={e => setFgColor(e.target.value)}
                        className="w-full h-9 rounded-lg border border-gray-300 cursor-pointer p-0.5" />
                </div>
                <div className="flex-1">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Background</label>
                    <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)}
                        className="w-full h-9 rounded-lg border border-gray-300 cursor-pointer p-0.5" />
                </div>
            </div>

            {loading && (
                <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
            )}

            {dataUrl && !loading && (
                <div className="flex flex-col items-center gap-2">
                    <img src={dataUrl} alt="QR Code preview" className="w-32 h-32 border border-gray-200 rounded-lg" />
                    <button
                        onClick={() => onAddImage(dataUrl)}
                        className="w-full py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition"
                    >
                        Add to Canvas
                    </button>
                </div>
            )}
        </div>
    );
};

// ── Main AssetPanel ───────────────────────────────────────────────────────

type AssetTab = 'images' | 'apps';

const AssetPanel: React.FC<AssetPanelProps> = ({ onAddImage }) => {
    const [tab, setTab] = useState<AssetTab>('images');

    return (
        <div className="space-y-3">
            {/* Tab Row */}
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                <button
                    onClick={() => setTab('images')}
                    className={`flex-1 py-1.5 text-xs font-medium flex items-center justify-center gap-1 transition ${tab === 'images' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                    <ImageIcon className="w-3.5 h-3.5" />
                    Images
                </button>
                <button
                    onClick={() => setTab('apps')}
                    className={`flex-1 py-1.5 text-xs font-medium flex items-center justify-center gap-1 transition ${tab === 'apps' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                    <QrCode className="w-3.5 h-3.5" />
                    Apps
                </button>
            </div>

            {tab === 'images' && <ImagesTab onAddImage={onAddImage} />}
            {tab === 'apps' && <QrTab onAddImage={onAddImage} />}
        </div>
    );
};

export default AssetPanel;
