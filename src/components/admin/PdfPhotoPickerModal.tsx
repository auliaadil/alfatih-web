import React, { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { X, FileDown } from 'lucide-react';
import { btnPrimary, btnSecondary } from './ui';
import type { DayItinerary } from '../../../types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    itinerary: DayItinerary[];
    onGenerate: (dayPhotos: { day: number; photoUrls: string[] }[]) => void;
}

interface PhotoRow {
    id: string;
    storage_url: string;
}

const PdfPhotoPickerModal: React.FC<Props> = ({ isOpen, onClose, itinerary, onGenerate }) => {
    const [selectedDay, setSelectedDay] = useState<number>(itinerary[0]?.day ?? 1);
    // Map: day number → photo URL (single selection per day)
    const [daySelections, setDaySelections] = useState<Record<number, string>>({});
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
    const [albums, setAlbums] = useState<{ id: string; title: string }[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedAlbum, setSelectedAlbum] = useState('');
    const [photos, setPhotos] = useState<PhotoRow[]>([]);
    const [loadingPhotos, setLoadingPhotos] = useState(false);

    // Reset state when modal opens
    useEffect(() => {
        if (!isOpen) return;
        setSelectedDay(itinerary[0]?.day ?? 1);
        setDaySelections({});
        setSelectedCategory('');
        setSelectedAlbum('');
    }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

    // Load categories once
    useEffect(() => {
        supabase
            .from('categories')
            .select('id, name')
            .order('name')
            .then(({ data }) => {
                if (data) setCategories(data as { id: string; name: string }[]);
            });
    }, []);

    // Reload albums when category filter changes
    useEffect(() => {
        if (!isOpen) return;
        const query = selectedCategory
            ? supabase
                  .from('documentations')
                  .select('id, title')
                  .eq('published', true)
                  .eq('category_id', selectedCategory)
                  .order('title')
            : supabase
                  .from('documentations')
                  .select('id, title')
                  .eq('published', true)
                  .order('title');

        query.then(({ data }) => {
            setAlbums((data ?? []) as { id: string; title: string }[]);
            setSelectedAlbum('');
        });
    }, [selectedCategory, isOpen]);

    // Reload photos when either filter changes
    useEffect(() => {
        if (!isOpen) return;
        void loadPhotos();
    }, [selectedCategory, selectedAlbum, isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

    const loadPhotos = async () => {
        setLoadingPhotos(true);
        try {
            // When filtering category only, resolve doc IDs first (joined filter
            // is not reliably supported in supabase-js)
            let docIdsFilter: string[] | null = null;
            if (!selectedAlbum && selectedCategory) {
                const { data: catDocs } = await supabase
                    .from('documentations')
                    .select('id')
                    .eq('category_id', selectedCategory)
                    .eq('published', true);
                const ids = ((catDocs ?? []) as { id: string }[]).map(d => d.id);
                if (ids.length === 0) {
                    setPhotos([]);
                    return;
                }
                docIdsFilter = ids;
            }

            const base = supabase
                .from('documentation_photos')
                .select('id, storage_url')
                .order('sort_order')
                .limit(30);

            const { data } = await (
                selectedAlbum
                    ? base.eq('documentation_id', selectedAlbum)
                    : docIdsFilter !== null
                    ? base.in('documentation_id', docIdsFilter)
                    : base
            );

            setPhotos((data ?? []) as PhotoRow[]);
        } finally {
            setLoadingPhotos(false);
        }
    };

    const handlePhotoClick = (url: string) => {
        setDaySelections(prev => {
            const current = prev[selectedDay];
            if (current === url) {
                const next = { ...prev };
                delete next[selectedDay];
                return next;
            }
            return { ...prev, [selectedDay]: url };
        });
    };

    const buildDayPhotos = () =>
        Object.entries(daySelections).map(([day, url]) => ({
            day: parseInt(day, 10),
            photoUrls: [url],
        }));

    const assignedCount = Object.keys(daySelections).length;
    const assignedDays = Object.keys(daySelections).join(', ');
    const currentDayUrl = daySelections[selectedDay];
    const currentDay = itinerary.find(d => d.day === selectedDay);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div className="flex-1 bg-black/40" onClick={onClose} />

            {/* Slide-over panel */}
            <div className="w-full max-w-4xl bg-white flex flex-col h-full shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
                <div>
                    <h2 className="font-semibold text-gray-900">
                        Download Itinerary PDF — Pilih Foto per Hari
                    </h2>
                    <p className="text-sm text-gray-500">
                        Foto opsional — hari tanpa foto tetap tampil sebagai teks
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Body */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left panel: day list (~280px) */}
                <div className="w-[280px] flex-shrink-0 border-r border-gray-100 flex flex-col overflow-y-auto">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex-shrink-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Hari
                        </p>
                    </div>
                    {itinerary.map(d => {
                        const isActive = selectedDay === d.day;
                        const photoUrl = daySelections[d.day];
                        return (
                            <button
                                key={d.day}
                                onClick={() => setSelectedDay(d.day)}
                                className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 text-left transition ${
                                    isActive
                                        ? 'bg-blue-50 border-l-[3px] border-l-blue-600'
                                        : 'hover:bg-gray-50'
                                }`}
                            >
                                <div className="flex-1 min-w-0">
                                    <p
                                        className={`text-xs font-bold ${
                                            isActive ? 'text-blue-600' : 'text-gray-700'
                                        }`}
                                    >
                                        Hari {d.day}
                                    </p>
                                    <p className="text-[10px] text-gray-400 truncate">{d.title}</p>
                                </div>
                                {photoUrl ? (
                                    <img
                                        src={photoUrl}
                                        alt=""
                                        className="w-7 h-7 rounded object-cover flex-shrink-0 border-2 border-blue-600"
                                    />
                                ) : (
                                    <span className="text-gray-300 text-xs flex-shrink-0">–</span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Right panel: photo browser */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Day header bar */}
                    <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 bg-gray-50 flex-shrink-0">
                        <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                            Hari {selectedDay}
                        </span>
                        <span className="text-sm font-medium text-gray-700 truncate">
                            {currentDay?.title}
                        </span>
                        {currentDayUrl && (
                            <span className="ml-auto text-xs text-blue-600 font-medium flex-shrink-0">
                                1 foto dipilih
                            </span>
                        )}
                    </div>

                    {/* Filter row */}
                    <div className="flex gap-3 px-5 py-3 border-b border-gray-100 flex-shrink-0">
                        <select
                            value={selectedCategory}
                            onChange={e => setSelectedCategory(e.target.value)}
                            className="flex-1 text-xs border border-gray-300 rounded-lg px-3 py-2 focus:border-primary outline-none bg-white"
                        >
                            <option value="">Semua Kategori</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                        <select
                            value={selectedAlbum}
                            onChange={e => setSelectedAlbum(e.target.value)}
                            className="text-xs border border-gray-300 rounded-lg px-3 py-2 focus:border-primary outline-none bg-white"
                            style={{ flex: 2 }}
                        >
                            <option value="">Semua Album</option>
                            {albums.map(a => (
                                <option key={a.id} value={a.id}>
                                    {a.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Photo grid */}
                    <div className="flex-1 overflow-y-auto p-4">
                        <p className="text-[10px] text-gray-400 mb-3">
                            Klik foto untuk memilih · Klik lagi untuk batal
                        </p>
                        {loadingPhotos ? (
                            <div className="flex justify-center py-8 text-gray-300 text-sm">
                                Memuat foto...
                            </div>
                        ) : photos.length === 0 ? (
                            <div className="flex justify-center py-8 text-gray-300 text-sm">
                                Belum ada foto
                            </div>
                        ) : (
                            <div className="grid grid-cols-5 gap-2">
                                {photos.map(p => {
                                    const isSelected = currentDayUrl === p.storage_url;
                                    return (
                                        <button
                                            key={p.id}
                                            onClick={() => handlePhotoClick(p.storage_url)}
                                            className={`relative aspect-square rounded-lg overflow-hidden border-[2.5px] transition ${
                                                isSelected
                                                    ? 'border-blue-600'
                                                    : 'border-transparent hover:border-gray-300'
                                            }`}
                                        >
                                            <img
                                                src={p.storage_url}
                                                alt=""
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                            />
                                            {isSelected && (
                                                <>
                                                    <div className="absolute inset-0 bg-blue-600/20" />
                                                    <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                                        ✓
                                                    </div>
                                                </>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
                <div>
                    {assignedCount > 0 ? (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold text-xs">
                            {assignedCount} hari memiliki foto (Hari {assignedDays})
                        </span>
                    ) : (
                        <span className="text-gray-400 text-xs">Belum ada foto dipilih</span>
                    )}
                </div>
                <div className="flex gap-3">
                    <button className={btnSecondary} onClick={() => onGenerate([])}>
                        Lewati (tanpa foto)
                    </button>
                    <button
                        className={btnPrimary}
                        onClick={() => onGenerate(buildDayPhotos())}
                    >
                        <FileDown className="w-4 h-4" />
                        Generate PDF
                    </button>
                </div>
            </div>
            </div>
        </div>
    );
};

export default PdfPhotoPickerModal;
