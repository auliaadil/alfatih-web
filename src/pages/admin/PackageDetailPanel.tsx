import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Image, FileDown, Loader2, Users } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';
import { useSiteSettings } from '../../contexts/SiteSettingsContext';

// TODO: replace with real import after Task 4
const downloadItineraryPdf = async (..._args: any[]) => { alert('PDF coming soon'); };

interface PackageDetailPanelProps {
    pkg: any;
    onClose: () => void;
}

const PackageDetailPanel: React.FC<PackageDetailPanelProps> = ({ pkg, onClose }) => {
    const navigate = useNavigate();
    const settings = useSiteSettings();
    const [airlines, setAirlines] = useState<any[]>([]);
    const [hotels, setHotels] = useState<any[]>([]);
    const [participants, setParticipants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPdfLoading, setIsPdfLoading] = useState(false);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const fetches: Promise<void>[] = [];

            if (pkg.airline_ids?.length) {
                fetches.push(
                    supabase.from('airlines').select('id, name, logo_url').in('id', pkg.airline_ids)
                        .then(({ data }) => { if (data) setAirlines(data); })
                );
            }
            if (pkg.hotel_ids?.length) {
                fetches.push(
                    supabase.from('hotels').select('id, name, location, stars').in('id', pkg.hotel_ids)
                        .then(({ data }) => { if (data) setHotels(data); })
                );
            }
            fetches.push(
                supabase
                    .from('participants')
                    .select('id, orders!inner(package_id)')
                    .eq('orders.package_id', pkg.id)
                    .then(({ data }) => { if (data) setParticipants(data); })
            );

            await Promise.all(fetches);
            setLoading(false);
        };
        load();
    }, [pkg.id]);

    const formatPrice = (price?: number) =>
        price
            ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price)
            : 'Hubungi Kami';

    const makkahHotels = hotels.filter(h => /makkah|mekkah/i.test(h.location ?? ''));
    const madinahHotels = hotels.filter(h => /madinah|medina/i.test(h.location ?? ''));
    const otherHotels = hotels.filter(h => !makkahHotels.includes(h) && !madinahHotels.includes(h));

    const totalQuota = pkg.initial_quotas || pkg.quotas || 1;
    const usedQuota = totalQuota - (pkg.quotas || 0);
    const quotaPct = Math.min(Math.round((usedQuota / totalQuota) * 100), 100);

    const handleDownloadPdf = async () => {
        setIsPdfLoading(true);
        try {
            const fullPkg = {
                ...pkg,
                airlines,
                hotels,
            };
            await downloadItineraryPdf(fullPkg, {
                whatsapp: settings.whatsapp,
                phone: settings.phone,
            });
        } catch (err) {
            console.error('PDF generation failed:', err);
            alert('Gagal mengunduh itinerary. Silakan coba lagi.');
        } finally {
            setIsPdfLoading(false);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white z-50 shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="relative flex-shrink-0">
                    {pkg.image_url ? (
                        <img src={pkg.image_url} alt={pkg.title} className="w-full h-40 object-cover" />
                    ) : (
                        <div className="w-full h-40 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                            <Image className="w-12 h-12 text-blue-300" />
                        </div>
                    )}
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-md text-gray-600 hover:text-gray-900 transition"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 pt-8 pb-3">
                        <div className="flex items-start justify-between gap-2">
                            <h2 className="text-white font-bold text-lg leading-tight">{pkg.title}</h2>
                            {pkg.category && (
                                <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold bg-secondary text-white">
                                    {pkg.category}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-5">
                    {/* Key info */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Keberangkatan</p>
                            <p className="font-semibold text-gray-900">{pkg.departure_date || '—'}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Durasi</p>
                            <p className="font-semibold text-gray-900">{pkg.duration || '—'}</p>
                        </div>
                        {airlines.length > 0 && (
                            <div className="bg-gray-50 rounded-xl p-3 col-span-2">
                                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Maskapai</p>
                                <p className="font-semibold text-gray-900">{airlines.map(a => a.name).join(', ')}</p>
                            </div>
                        )}
                    </div>

                    {/* Pricing */}
                    {pkg.room_options?.length > 0 && (
                        <div>
                            <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Harga Paket</h3>
                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                {pkg.room_options.map((opt: any, i: number) => (
                                    <div key={i} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                                        <span className="text-sm text-gray-700 font-medium">Kamar {opt.name}</span>
                                        <span className="text-sm font-bold text-secondary">{formatPrice(opt.price)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Hotels */}
                    {hotels.length > 0 && (
                        <div>
                            <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Hotel</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { label: 'Mekkah', list: makkahHotels },
                                    { label: 'Madinah', list: madinahHotels },
                                    ...(otherHotels.length > 0 ? [{ label: 'Lainnya', list: otherHotels }] : []),
                                ].map(group => group.list.length > 0 && (
                                    <div key={group.label} className="bg-gray-50 rounded-xl p-3">
                                        <p className="text-xs text-gray-400 font-medium mb-1">{group.label}</p>
                                        {group.list.map((h: any) => (
                                            <div key={h.id}>
                                                <p className="text-sm font-semibold text-gray-800 leading-tight">{h.name}</p>
                                                <p className="text-xs text-secondary mt-0.5">{'★'.repeat(h.stars || 0)}</p>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quota / Participants */}
                    <div>
                        <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Kuota & Peserta</h3>
                        <div className="bg-gray-50 rounded-xl p-3">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-500 flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5" /> Terdaftar
                                </span>
                                <span className="font-bold text-gray-800">{loading ? '…' : participants.length} pax</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                                <span>Sisa kuota</span>
                                <span className="font-semibold">{pkg.quotas} / {totalQuota}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                    className={`h-1.5 rounded-full ${quotaPct >= 80 ? 'bg-red-400' : 'bg-primary'}`}
                                    style={{ width: `${quotaPct}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Included */}
                    {pkg.included?.length > 0 && (
                        <div>
                            <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Sudah Termasuk</h3>
                            <ul className="space-y-1">
                                {pkg.included.map((item: string, i: number) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                        <span className="text-green-500 font-bold mt-0.5">✓</span> {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Not Included */}
                    {pkg.not_included?.length > 0 && (
                        <div>
                            <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Tidak Termasuk</h3>
                            <ul className="space-y-1">
                                {pkg.not_included.map((item: string, i: number) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                        <span className="text-red-400 font-bold mt-0.5">✕</span> {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Sticky action bar */}
                <div className="flex-shrink-0 border-t border-gray-100 p-4 grid grid-cols-2 gap-3 bg-white">
                    <button
                        onClick={() => navigate(`/admin/poster-maker?packageId=${pkg.id}&mode=brochure`)}
                        className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-blue-600 transition"
                    >
                        <Image className="w-4 h-4" />
                        Buat Brosur
                    </button>
                    <button
                        onClick={handleDownloadPdf}
                        disabled={isPdfLoading}
                        className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-primary text-primary text-sm font-semibold hover:bg-blue-50 transition disabled:opacity-60"
                    >
                        {isPdfLoading
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <FileDown className="w-4 h-4" />}
                        {isPdfLoading ? 'Memuat…' : 'Itinerary PDF'}
                    </button>
                </div>
            </div>
        </>
    );
};

export default PackageDetailPanel;
