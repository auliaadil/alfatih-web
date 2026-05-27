import React, { useState, useEffect, useMemo } from 'react';
import {
    Clock, X, Search, Trash2, Upload, Loader2,
    Megaphone, Copy, RefreshCw, Save, ChevronDown,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/admin/ui';
import { generateCampaignText, CampaignType, CampaignChannel } from '../../../services/textCampaignService';
import { TourPackage } from '../../../types';

interface HistoryItem {
    id: string;
    type: CampaignType;
    channel: CampaignChannel;
    title: string;
    content: string;
    createdAt: string;
}

const OCCASIONS = [
    'Idul Fitri 1447H',
    'Idul Adha 1447H',
    'Maulid Nabi 1447H',
    'Isra Miraj 1447H',
    'Tahun Baru Islam 1447H',
];

const TYPE_LABELS: Record<CampaignType, string> = {
    'paket-wisata': 'Paket Wisata',
    'hari-raya': 'Hari Raya',
    'instagram': 'Instagram',
};

const TYPE_BADGE: Record<CampaignType, string> = {
    'paket-wisata': 'bg-yellow-500/20 text-yellow-400',
    'hari-raya': 'bg-blue-500/20 text-blue-400',
    'instagram': 'bg-purple-500/20 text-purple-400',
};

const CHANNEL_BADGE: Record<CampaignChannel, string> = {
    whatsapp: 'bg-green-500/20 text-green-400',
    instagram: 'bg-pink-500/20 text-pink-400',
};

const selectCls = 'w-full appearance-none bg-white/5 border border-white/10 text-gray-300 text-sm rounded-xl px-3.5 py-2.5 pr-9 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20 transition-all';

const TextCampaign: React.FC = () => {
    const toast = useToast();

    // Packages from DB
    const [packages, setPackages] = useState<TourPackage[]>([]);
    const [packagesLoading, setPackagesLoading] = useState(true);

    // Form
    const [messageType, setMessageType] = useState<CampaignType>('paket-wisata');
    const [channel, setChannel] = useState<CampaignChannel>('whatsapp');
    const [selectedPackageId, setSelectedPackageId] = useState('');
    const [selectedOccasion, setSelectedOccasion] = useState('');
    const [occasionPackageId, setOccasionPackageId] = useState('');
    const [theme, setTheme] = useState('');
    const [notes, setNotes] = useState('');

    // Output
    const [output, setOutput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // History drawer
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [historySearch, setHistorySearch] = useState('');
    const [historyTypeFilter, setHistoryTypeFilter] = useState('all');
    const [historyChannelFilter, setHistoryChannelFilter] = useState('all');
    const [history, setHistory] = useState<HistoryItem[]>([]);

    useEffect(() => {
        const fetchPackages = async () => {
            setPackagesLoading(true);
            const { data, error } = await supabase
                .from('packages')
                .select('id, title, slug, category, duration, departure_date, room_options, features, description')
                .order('departure_date', { ascending: true });
            if (!error && data) setPackages(data as TourPackage[]);
            setPackagesLoading(false);
        };
        fetchPackages();
    }, []);

    const selectedPackage = useMemo(
        () => packages.find(p => p.id === selectedPackageId) ?? null,
        [packages, selectedPackageId]
    );

    const selectedOccasionPackage = useMemo(
        () => packages.find(p => p.id === occasionPackageId) ?? null,
        [packages, occasionPackageId]
    );

    const filteredHistory = useMemo(() => history.filter(item => {
        const matchesSearch = !historySearch ||
            item.title.toLowerCase().includes(historySearch.toLowerCase()) ||
            item.content.toLowerCase().includes(historySearch.toLowerCase());
        const matchesType = historyTypeFilter === 'all' || item.type === historyTypeFilter;
        const matchesChannel = historyChannelFilter === 'all' || item.channel === historyChannelFilter;
        return matchesSearch && matchesType && matchesChannel;
    }), [history, historySearch, historyTypeFilter, historyChannelFilter]);

    const handleGenerate = async () => {
        if (messageType === 'paket-wisata' && !selectedPackage) {
            toast('warning', 'Pilih paket wisata terlebih dahulu.');
            return;
        }
        if (messageType === 'hari-raya' && !selectedOccasion) {
            toast('warning', 'Pilih hari raya terlebih dahulu.');
            return;
        }
        if (messageType === 'instagram' && !selectedPackage) {
            toast('warning', 'Pilih paket wisata terlebih dahulu.');
            return;
        }

        setIsGenerating(true);
        setOutput('');
        try {
            const text = await generateCampaignText({
                type: messageType,
                channel,
                package: selectedPackage ?? undefined,
                occasion: selectedOccasion || undefined,
                occasionPackage: selectedOccasionPackage,
                theme: theme || undefined,
                notes: notes || undefined,
            });
            setOutput(text);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat generate pesan.';
            toast('error', msg);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = () => {
        if (!output) return;
        navigator.clipboard.writeText(output);
        toast('success', 'Pesan berhasil disalin!');
    };

    const handleSave = () => {
        if (!output) return;
        const title =
            messageType === 'paket-wisata' ? (selectedPackage?.title ?? 'Paket Tidak Dipilih') :
            messageType === 'hari-raya'    ? (selectedOccasion || 'Hari Raya') :
                                             (selectedPackage?.title ?? 'Caption Instagram');
        setHistory(prev => [{
            id: Date.now().toString(),
            type: messageType,
            channel,
            title,
            content: output,
            createdAt: 'Baru saja',
        }, ...prev]);
        toast('success', 'Campaign berhasil disimpan!');
    };

    const handleLoad = (item: HistoryItem) => {
        setOutput(item.content);
        setMessageType(item.type);
        setChannel(item.channel);
        setIsHistoryOpen(false);
        toast('info', 'Pesan dimuat ke editor.');
    };

    const handleDelete = (id: string) => {
        setHistory(prev => prev.filter(item => item.id !== id));
    };

    const PackageSelect: React.FC<{ value: string; onChange: (v: string) => void; placeholder?: string }> = ({
        value, onChange, placeholder = '— Pilih paket —',
    }) => (
        <div className="relative">
            <select value={value} onChange={e => onChange(e.target.value)} className={selectCls} disabled={packagesLoading}>
                <option value="" className="bg-gray-900">{packagesLoading ? 'Memuat paket...' : placeholder}</option>
                {packages.map(p => (
                    <option key={p.id} value={p.id} className="bg-gray-900">
                        {p.title}{p.departure_date ? ` — ${p.departure_date}` : ''}
                    </option>
                ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" />
        </div>
    );

    return (
        <div className="h-full flex flex-col -m-5 sm:-m-6 lg:-m-8">

            {/* Page header */}
            <div className="px-6 lg:px-8 py-5 bg-gray-900 border-b border-white/5 shrink-0 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 mb-0.5">Marketing</p>
                    <h1 className="text-xl font-bold text-white font-jakarta leading-tight">Text Campaign</h1>
                    <p className="text-xs text-gray-500 mt-0.5">Buat pesan broadcast berbasis AI untuk berbagai channel</p>
                </div>
                <button
                    onClick={() => setIsHistoryOpen(true)}
                    className="flex items-center gap-2 px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-gray-200 text-sm font-medium rounded-xl transition-all"
                >
                    <Clock className="w-4 h-4" />
                    Riwayat
                    {history.length > 0 && (
                        <span className="bg-yellow-500/20 text-yellow-400 text-xs font-bold px-1.5 py-0.5 rounded-full tabular-nums">
                            {history.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Two-panel body */}
            <div className="flex flex-1 overflow-hidden">

                {/* LEFT: Form panel */}
                <div className="w-[340px] min-w-[340px] bg-gray-950 border-r border-white/5 flex flex-col overflow-y-auto">
                    <div className="p-5 space-y-5 flex-1">

                        {/* Tipe Pesan */}
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-2.5">Tipe Pesan</p>
                            <div className="space-y-2">
                                {([
                                    { value: 'paket-wisata', icon: '📦', label: 'Broadcast Paket Wisata', desc: 'Promosi paket wisata dari database' },
                                    { value: 'hari-raya',    icon: '🌙', label: 'Ucapan Hari Raya',       desc: 'Idul Fitri, Idul Adha, dll' },
                                    { value: 'instagram',    icon: '📸', label: 'Caption Instagram',      desc: 'Caption + hashtag siap posting' },
                                ] as const).map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setMessageType(opt.value)}
                                        className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border text-left transition-all ${
                                            messageType === opt.value
                                                ? 'bg-yellow-500/10 border-yellow-500/25'
                                                : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                                        }`}
                                    >
                                        <span className="text-xl shrink-0">{opt.icon}</span>
                                        <div className="min-w-0 flex-1">
                                            <p className={`text-sm font-semibold leading-tight ${messageType === opt.value ? 'text-yellow-400' : 'text-gray-200'}`}>
                                                {opt.label}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5 leading-snug">{opt.desc}</p>
                                        </div>
                                        {messageType === opt.value && (
                                            <div className="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center shrink-0">
                                                <div className="w-1.5 h-1.5 rounded-full bg-gray-950" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Channel */}
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-2.5">Channel</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setChannel('whatsapp')}
                                    className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border text-sm font-semibold transition-all ${
                                        channel === 'whatsapp'
                                            ? 'bg-green-500/10 border-green-500/25 text-green-400'
                                            : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10'
                                    }`}
                                >
                                    <span className="text-lg">💬</span>
                                    WhatsApp
                                </button>
                                <button
                                    onClick={() => setChannel('instagram')}
                                    className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border text-sm font-semibold transition-all ${
                                        channel === 'instagram'
                                            ? 'bg-purple-500/10 border-purple-500/25 text-purple-400'
                                            : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10'
                                    }`}
                                >
                                    <span className="text-lg">📸</span>
                                    Instagram
                                </button>
                            </div>
                        </div>

                        {/* Dynamic fields */}
                        <div className="space-y-3">
                            {(messageType === 'paket-wisata' || messageType === 'instagram') && (
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-2">Pilih Paket Wisata</p>
                                    <PackageSelect value={selectedPackageId} onChange={setSelectedPackageId} />
                                </div>
                            )}

                            {messageType === 'hari-raya' && (<>
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-2">Pilih Hari Raya</p>
                                    <div className="relative">
                                        <select value={selectedOccasion} onChange={e => setSelectedOccasion(e.target.value)} className={selectCls}>
                                            <option value="" className="bg-gray-900">— Pilih hari raya —</option>
                                            {OCCASIONS.map(o => <option key={o} value={o} className="bg-gray-900">{o}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-2">
                                        Sertakan Paket Wisata
                                        <span className="normal-case font-normal text-gray-600 ml-1">(opsional)</span>
                                    </p>
                                    <PackageSelect
                                        value={occasionPackageId}
                                        onChange={setOccasionPackageId}
                                        placeholder="— Tidak ada —"
                                    />
                                </div>
                            </>)}

                            {messageType === 'instagram' && (
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-2">Tema / Angle</p>
                                    <input
                                        type="text"
                                        value={theme}
                                        onChange={e => setTheme(e.target.value)}
                                        placeholder="misal: fokus ke keluarga muda, gaya luxury, dll"
                                        className="w-full bg-white/5 border border-white/10 text-gray-300 text-sm rounded-xl px-3.5 py-2.5 placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20 transition-all"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Catatan Tambahan */}
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-2">
                                Catatan Tambahan
                                <span className="normal-case font-normal text-gray-600 ml-1">(opsional)</span>
                            </p>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="Tambahkan instruksi khusus untuk AI..."
                                rows={3}
                                className="w-full bg-white/5 border border-white/10 text-gray-300 text-sm rounded-xl px-3.5 py-2.5 placeholder-gray-600 resize-none focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20 transition-all"
                            />
                        </div>
                    </div>

                    {/* Generate — sticky at bottom */}
                    <div className="p-5 pt-0 shrink-0">
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || packagesLoading}
                            className="w-full flex items-center justify-center gap-2.5 py-3 bg-yellow-500 hover:bg-yellow-400 disabled:bg-yellow-500/50 text-gray-950 text-sm font-bold rounded-xl transition-all disabled:cursor-not-allowed shadow-lg shadow-yellow-500/20"
                        >
                            {isGenerating ? (
                                <><Loader2 className="w-4 h-4 animate-spin" />Generating...</>
                            ) : (
                                <><span>✨</span>Generate dengan AI</>
                            )}
                        </button>
                    </div>
                </div>

                {/* RIGHT: Output panel */}
                <div className="flex-1 bg-gray-900 flex flex-col p-6 gap-4 overflow-y-auto">

                    {output ? (
                        <textarea
                            value={output}
                            onChange={e => setOutput(e.target.value)}
                            className="flex-1 min-h-72 w-full bg-gray-950/60 border border-white/5 rounded-2xl px-5 py-4 text-gray-200 text-sm leading-relaxed resize-none focus:outline-none focus:border-yellow-500/25 focus:ring-1 focus:ring-yellow-500/10 transition-all font-mono"
                        />
                    ) : (
                        <div className="flex-1 min-h-72 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl text-center gap-3">
                            {isGenerating ? (
                                <>
                                    <div className="w-10 h-10 rounded-2xl bg-yellow-500/10 flex items-center justify-center">
                                        <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-300">AI sedang menulis pesan...</p>
                                        <p className="text-xs text-gray-600 mt-1">Mohon tunggu sebentar</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center">
                                        <Megaphone className="w-5 h-5 text-gray-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Hasil AI akan muncul di sini</p>
                                        <p className="text-xs text-gray-600 mt-1">Isi form di kiri, lalu klik Generate</p>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Action row */}
                    <div className="flex gap-3 shrink-0">
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-gray-200 text-sm font-medium rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                            Regenerate
                        </button>
                        <button
                            onClick={handleCopy}
                            disabled={!output}
                            className="flex items-center gap-2 px-4 py-2.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 text-sm font-medium rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <Copy className="w-4 h-4" />
                            Salin Pesan
                        </button>
                    </div>

                    {output && (
                        <button
                            onClick={handleSave}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-yellow-400 text-sm font-semibold rounded-xl transition-all shrink-0"
                        >
                            <Save className="w-4 h-4" />
                            Simpan ke Riwayat
                        </button>
                    )}
                </div>
            </div>

            {/* History Drawer */}
            {isHistoryOpen && (
                <div className="fixed inset-0 z-[100] flex justify-end">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
                        onClick={() => setIsHistoryOpen(false)}
                    />
                    <div className="relative w-full max-w-md bg-gray-950 border-l border-white/10 flex flex-col shadow-2xl animate-slide-in-panel">

                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
                            <div>
                                <h2 className="text-base font-bold text-white font-jakarta">Riwayat Campaign</h2>
                                <p className="text-xs text-gray-500 mt-0.5">{filteredHistory.length} pesan tersimpan</p>
                            </div>
                            <button
                                onClick={() => setIsHistoryOpen(false)}
                                className="p-2 text-gray-500 hover:text-gray-200 hover:bg-white/10 rounded-lg transition-all"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="px-5 py-3.5 border-b border-white/5 space-y-2.5 shrink-0">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                <input
                                    type="text"
                                    placeholder="Cari pesan..."
                                    value={historySearch}
                                    onChange={e => setHistorySearch(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 text-gray-200 text-sm rounded-xl pl-9 pr-3.5 py-2.5 placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20 transition-all"
                                />
                            </div>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <select
                                        value={historyTypeFilter}
                                        onChange={e => setHistoryTypeFilter(e.target.value)}
                                        className="w-full appearance-none bg-white/5 border border-white/10 text-gray-400 text-xs rounded-lg px-3 py-2 pr-7 focus:outline-none focus:border-yellow-500/30 transition-all"
                                    >
                                        <option value="all" className="bg-gray-900">Semua Tipe</option>
                                        <option value="paket-wisata" className="bg-gray-900">Paket Wisata</option>
                                        <option value="hari-raya" className="bg-gray-900">Hari Raya</option>
                                        <option value="instagram" className="bg-gray-900">Instagram</option>
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-600 pointer-events-none" />
                                </div>
                                <div className="relative flex-1">
                                    <select
                                        value={historyChannelFilter}
                                        onChange={e => setHistoryChannelFilter(e.target.value)}
                                        className="w-full appearance-none bg-white/5 border border-white/10 text-gray-400 text-xs rounded-lg px-3 py-2 pr-7 focus:outline-none focus:border-yellow-500/30 transition-all"
                                    >
                                        <option value="all" className="bg-gray-900">Semua Channel</option>
                                        <option value="whatsapp" className="bg-gray-900">WhatsApp</option>
                                        <option value="instagram" className="bg-gray-900">Instagram</option>
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-600 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                            {filteredHistory.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-3">
                                        <Clock className="w-5 h-5 text-gray-600" />
                                    </div>
                                    <p className="text-sm text-gray-500 font-medium">Tidak ada riwayat</p>
                                    <p className="text-xs text-gray-600 mt-1">
                                        {historySearch || historyTypeFilter !== 'all' || historyChannelFilter !== 'all'
                                            ? 'Coba ubah filter pencarian'
                                            : 'Belum ada campaign yang disimpan'}
                                    </p>
                                </div>
                            ) : filteredHistory.map(item => (
                                <div key={item.id} className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl p-4 transition-all">
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TYPE_BADGE[item.type]}`}>
                                            {TYPE_LABELS[item.type]}
                                        </span>
                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CHANNEL_BADGE[item.channel]}`}>
                                            {item.channel === 'whatsapp' ? 'WhatsApp' : 'Instagram'}
                                        </span>
                                        <span className="text-[10px] text-gray-600 ml-auto">{item.createdAt}</span>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-200 mb-1 leading-tight">{item.title}</p>
                                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{item.content}</p>
                                    <div className="flex gap-2 mt-3">
                                        <button
                                            onClick={() => handleLoad(item)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-yellow-400 text-xs font-semibold rounded-lg transition-all"
                                        >
                                            <Upload className="w-3 h-3" />
                                            Muat
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-red-500/10 text-gray-600 hover:text-red-400 text-xs font-medium rounded-lg transition-all"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                            Hapus
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TextCampaign;
