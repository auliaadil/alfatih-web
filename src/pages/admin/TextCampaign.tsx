import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Clock, X, Search, Trash2, Upload, Loader2,
    Megaphone, Copy, RefreshCw, Save, ChevronDown, Image as ImageIcon,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
    PageHeader, SlideOver, useToast,
    selectClass, inputClass, textareaClass,
} from '../../components/admin/ui';
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


const TYPE_LABELS: Record<CampaignType, string> = {
    'paket-wisata': 'Paket Wisata',
    'instagram':    'Instagram',
};

const TYPE_BADGE: Record<CampaignType, string> = {
    'paket-wisata': 'bg-yellow-100 text-yellow-700',
    'instagram':    'bg-purple-100 text-purple-700',
};

const CHANNEL_BADGE: Record<CampaignChannel, string> = {
    whatsapp:  'bg-green-100 text-green-700',
    instagram: 'bg-pink-100 text-pink-700',
};

const TextCampaign: React.FC = () => {
    const toast = useToast();
    const navigate = useNavigate();

    const [packages, setPackages] = useState<TourPackage[]>([]);
    const [packagesLoading, setPackagesLoading] = useState(true);

    const [messageType, setMessageType] = useState<CampaignType>('paket-wisata');
    const [channel, setChannel] = useState<CampaignChannel>('whatsapp');
    const [selectedPackageId, setSelectedPackageId] = useState('');

    const [theme, setTheme] = useState('');
    const [notes, setNotes] = useState('');

    const [output, setOutput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

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


    const filteredHistory = useMemo(() => history.filter(item => {
        const matchesSearch = !historySearch ||
            item.title.toLowerCase().includes(historySearch.toLowerCase()) ||
            item.content.toLowerCase().includes(historySearch.toLowerCase());
        const matchesType    = historyTypeFilter    === 'all' || item.type    === historyTypeFilter;
        const matchesChannel = historyChannelFilter === 'all' || item.channel === historyChannelFilter;
        return matchesSearch && matchesType && matchesChannel;
    }), [history, historySearch, historyTypeFilter, historyChannelFilter]);

    const handleGenerate = async () => {
        if (messageType === 'paket-wisata' && !selectedPackage) {
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
                theme: theme || undefined,
                notes: notes || undefined,
            });
            setOutput(text);
        } catch (err) {
            toast('error', err instanceof Error ? err.message : 'Terjadi kesalahan saat generate pesan.');
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
        const title = selectedPackage?.title ?? 'Caption Instagram';
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

    const handleDelete = (id: string) => setHistory(prev => prev.filter(item => item.id !== id));

    const PackageSelect: React.FC<{ value: string; onChange: (v: string) => void; placeholder?: string }> = ({
        value, onChange, placeholder = '— Pilih paket —',
    }) => (
        <div className="relative">
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className={selectClass}
                disabled={packagesLoading}
            >
                <option value="">{packagesLoading ? 'Memuat paket...' : placeholder}</option>
                {packages.map(p => (
                    <option key={p.id} value={p.id}>
                        {p.title}{p.departure_date ? ` — ${p.departure_date}` : ''}
                    </option>
                ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
    );

    return (
        <div>
            <PageHeader
                title="Text Campaign"
                subtitle="Buat pesan broadcast berbasis AI untuk berbagai channel"
                action={
                    <button
                        onClick={() => setIsHistoryOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors"
                    >
                        <Clock className="w-4 h-4" />
                        Riwayat
                        {history.length > 0 && (
                            <span className="bg-gray-100 text-gray-600 text-xs font-bold px-1.5 py-0.5 rounded-full tabular-nums">
                                {history.length}
                            </span>
                        )}
                    </button>
                }
            />

            <div className="flex gap-6 items-start">

                {/* LEFT: Form panel */}
                <div className="w-[320px] min-w-[320px] bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col">
                    <div className="p-5 space-y-5">

                        {/* Tipe Pesan */}
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5">Tipe Pesan</p>
                            <div className="space-y-2">
                                {([
                                    { value: 'paket-wisata', icon: '📦', label: 'Broadcast Paket Wisata', desc: 'Promosi paket wisata dari database' },
                                    { value: 'instagram',    icon: '📸', label: 'Caption Instagram',      desc: 'Caption + hashtag siap posting' },
                                ] as const).map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setMessageType(opt.value)}
                                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-left transition-all ${
                                            messageType === opt.value
                                                ? 'bg-yellow-50 border-yellow-200'
                                                : 'bg-gray-50 border-gray-100 hover:bg-gray-100 hover:border-gray-200'
                                        }`}
                                    >
                                        <span className="text-lg shrink-0">{opt.icon}</span>
                                        <div className="min-w-0 flex-1">
                                            <p className={`text-sm font-semibold leading-tight ${messageType === opt.value ? 'text-yellow-700' : 'text-gray-700'}`}>
                                                {opt.label}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                                        </div>
                                        {messageType === opt.value && (
                                            <div className="w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center shrink-0">
                                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Channel */}
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5">Channel</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setChannel('whatsapp')}
                                    className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                                        channel === 'whatsapp'
                                            ? 'bg-green-50 border-green-200 text-green-700'
                                            : 'bg-gray-50 border-gray-100 text-gray-400 hover:bg-gray-100'
                                    }`}
                                >
                                    <span className="text-base">💬</span>
                                    WhatsApp
                                </button>
                                <button
                                    onClick={() => setChannel('instagram')}
                                    className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                                        channel === 'instagram'
                                            ? 'bg-purple-50 border-purple-200 text-purple-700'
                                            : 'bg-gray-50 border-gray-100 text-gray-400 hover:bg-gray-100'
                                    }`}
                                >
                                    <span className="text-base">📸</span>
                                    Instagram
                                </button>
                            </div>
                        </div>

                        {/* Dynamic fields */}
                        <div className="space-y-3">
                            {(messageType === 'paket-wisata' || messageType === 'instagram') && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Pilih Paket Wisata</label>
                                    <PackageSelect value={selectedPackageId} onChange={setSelectedPackageId} />
                                </div>
                            )}



                            {messageType === 'instagram' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Tema / Angle</label>
                                    <input
                                        type="text"
                                        value={theme}
                                        onChange={e => setTheme(e.target.value)}
                                        placeholder="misal: fokus ke keluarga muda, gaya luxury, dll"
                                        className={inputClass}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Catatan Tambahan */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Catatan Tambahan <span className="text-gray-400 font-normal">(opsional)</span>
                            </label>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="Tambahkan instruksi khusus untuk AI..."
                                rows={3}
                                className={textareaClass}
                            />
                        </div>
                    </div>

                    <div className="px-5 pb-5">
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || packagesLoading}
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-gray-900 text-sm font-bold rounded-xl transition-all disabled:cursor-not-allowed"
                        >
                            {isGenerating
                                ? <><Loader2 className="w-4 h-4 animate-spin" />Generating...</>
                                : <><span>✨</span>Tulis Draft</>
                            }
                        </button>
                    </div>
                </div>

                {/* RIGHT: Output panel */}
                <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col p-5 gap-4 min-h-[520px]">

                    {output ? (
                        <textarea
                            value={output}
                            onChange={e => setOutput(e.target.value)}
                            className="flex-1 min-h-72 w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-800 text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors font-mono"
                        />
                    ) : (
                        <div className="flex-1 min-h-72 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl text-center gap-3">
                            {isGenerating ? (
                                <>
                                    <div className="w-10 h-10 rounded-2xl bg-yellow-50 flex items-center justify-center">
                                        <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">AI sedang menulis pesan...</p>
                                        <p className="text-xs text-gray-400 mt-1">Mohon tunggu sebentar</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center">
                                        <Megaphone className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Hasil AI akan muncul di sini</p>
                                        <p className="text-xs text-gray-400 mt-1">Isi form di kiri, lalu klik Generate</p>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    <div className="flex gap-3 shrink-0">
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                            Regenerate
                        </button>
                        <button
                            onClick={handleCopy}
                            disabled={!output}
                            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <Copy className="w-4 h-4" />
                            Salin Pesan
                        </button>
                    </div>

                    {output && (
                        <>
                            <button
                                onClick={handleSave}
                                className="w-full flex items-center justify-center gap-2 py-2.5 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 text-yellow-700 text-sm font-semibold rounded-xl transition-colors shrink-0"
                            >
                                <Save className="w-4 h-4" />
                                Simpan ke Riwayat
                            </button>

                        </>
                    )}
                </div>
            </div>

            {/* History — uses existing SlideOver from ui.tsx */}
            <SlideOver
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                title="Riwayat Campaign"
                subtitle={`${filteredHistory.length} pesan tersimpan`}
                width="md"
            >
                <div className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari pesan..."
                            value={historySearch}
                            onChange={e => setHistorySearch(e.target.value)}
                            className="w-full pl-9 pr-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors placeholder:text-gray-300"
                        />
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <select
                                value={historyTypeFilter}
                                onChange={e => setHistoryTypeFilter(e.target.value)}
                                className="w-full appearance-none text-sm border border-gray-200 rounded-xl bg-white px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-gray-700"
                            >
                                <option value="all">Semua Tipe</option>
                                <option value="paket-wisata">Paket Wisata</option>

                                <option value="instagram">Instagram</option>
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                        </div>
                        <div className="relative flex-1">
                            <select
                                value={historyChannelFilter}
                                onChange={e => setHistoryChannelFilter(e.target.value)}
                                className="w-full appearance-none text-sm border border-gray-200 rounded-xl bg-white px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-gray-700"
                            >
                                <option value="all">Semua Channel</option>
                                <option value="whatsapp">WhatsApp</option>
                                <option value="instagram">Instagram</option>
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* History list */}
                    {filteredHistory.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                                <Clock className="w-5 h-5 text-gray-400" />
                            </div>
                            <p className="text-sm text-gray-600 font-medium">Tidak ada riwayat</p>
                            <p className="text-xs text-gray-400 mt-1">
                                {historySearch || historyTypeFilter !== 'all' || historyChannelFilter !== 'all'
                                    ? 'Coba ubah filter pencarian'
                                    : 'Belum ada campaign yang disimpan'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredHistory.map(item => (
                                <div key={item.id} className="bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl p-4 transition-colors">
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TYPE_BADGE[item.type]}`}>
                                            {TYPE_LABELS[item.type]}
                                        </span>
                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CHANNEL_BADGE[item.channel]}`}>
                                            {item.channel === 'whatsapp' ? 'WhatsApp' : 'Instagram'}
                                        </span>
                                        <span className="text-[10px] text-gray-400 ml-auto">{item.createdAt}</span>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-800 mb-1">{item.title}</p>
                                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{item.content}</p>
                                    <div className="flex gap-2 mt-3">
                                        <button
                                            onClick={() => handleLoad(item)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-yellow-50 border border-gray-200 hover:border-yellow-300 text-gray-600 hover:text-yellow-700 text-xs font-semibold rounded-lg transition-colors"
                                        >
                                            <Upload className="w-3 h-3" />
                                            Muat
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 hover:border-red-200 border border-transparent text-xs font-medium rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                            Hapus
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </SlideOver>
        </div>
    );
};

export default TextCampaign;
