import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, Users, Package, CalendarDays } from 'lucide-react';
import {
    PageHeader, SkeletonCard, EmptyState, ConfirmDialog,
    btnPrimary, btnGhost, useToast, StatusBadge,
    SearchInput, Pagination,
} from '../../components/admin/ui';
import PackageDetailPanel from './PackageDetailPanel';

const PAGE_SIZE = 12;

const Packages: React.FC = () => {
    const toast = useToast();
    const navigate = useNavigate();
    const [packages, setPackages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [panelPackage, setPanelPackage] = useState<any | null>(null);

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(0);

    useEffect(() => {
        fetchPackages();
    }, []);

    useEffect(() => { setPage(0); }, [searchQuery]);

    const fetchPackages = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('packages')
            .select('*')
            .order('created_at', { ascending: false });
        if (!error && data) setPackages(data);
        setLoading(false);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        const { error } = await supabase.from('packages').delete().eq('id', deleteId);
        setDeleting(false);
        setDeleteId(null);
        if (error) {
            toast('error', 'Failed to delete package.');
        } else {
            toast('success', 'Package deleted.');
            setPage(0);
            fetchPackages();
        }
    };

    const quotaPercent = (pkg: any) => {
        const total = pkg.initial_quotas || pkg.quotas || 1;
        const used = total - (pkg.quotas || 0);
        return Math.round((used / total) * 100);
    };

    const filtered = packages.filter((p) =>
        [p.title, p.category, p.departure_date].some((f) =>
            (f ?? '').toLowerCase().includes(searchQuery.toLowerCase())
        )
    );
    const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    return (
        <div>
            <PageHeader
                title="Packages"
                badge={packages.length}
                subtitle="Manage Umrah and Hajj tour packages"
                breadcrumbs={[{ label: 'Operations' }, { label: 'Packages' }]}
                action={
                    <button
                        onClick={() => navigate('/admin/packages/new')}
                        className={btnPrimary}
                    >
                        <Plus className="w-4 h-4" /> New Package
                    </button>
                }
            />

            <div className="mb-4">
                <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Cari judul, kategori, tanggal..." />
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                    {packages.length === 0 ? (
                        <EmptyState
                            icon={<Package className="w-7 h-7" />}
                            title="No packages yet"
                            description="Create your first tour package to start accepting bookings."
                            action={
                                <button onClick={() => navigate('/admin/packages/new')} className={btnPrimary}>
                                    <Plus className="w-4 h-4" /> New Package
                                </button>
                            }
                        />
                    ) : (
                        <EmptyState
                            icon={<Package className="w-7 h-7" />}
                            title="Tidak ada hasil"
                            description={`Tidak ada paket yang cocok dengan "${searchQuery}".`}
                        />
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {paginated.map((pkg) => {
                        const filledPct = quotaPercent(pkg);
                        const isAlmostFull = filledPct >= 80;
                        return (
                            <div
                                key={pkg.id}
                                className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md hover:border-gray-300 transition-all group flex flex-col"
                            >
                                {/* Image */}
                                <div className="relative">
                                    {pkg.image_url ? (
                                        <img src={pkg.image_url} alt={pkg.title} className="w-full h-44 object-cover" />
                                    ) : (
                                        <div className="w-full h-44 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                            <Package className="w-10 h-10 text-gray-400" />
                                        </div>
                                    )}
                                    <div className="absolute top-3 left-3 flex gap-2">
                                        <StatusBadge status={pkg.category || 'Umrah'} />
                                        {pkg.is_popular && (
                                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-secondary text-white">
                                                Popular
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="p-4 flex-1 flex flex-col">
                                    <h3 className="font-bold text-gray-900 line-clamp-2 leading-snug flex-1">{pkg.title}</h3>
                                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                        <CalendarDays className="w-3.5 h-3.5" />
                                        <span>{pkg.duration}</span>
                                        {pkg.departure_date && <span>• {pkg.departure_date}</span>}
                                    </div>

                                    {/* Quota bar */}
                                    <div className="mt-4 space-y-1.5">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-gray-500">Quota</span>
                                            <span className={`font-semibold ${isAlmostFull ? 'text-red-600' : 'text-gray-700'}`}>
                                                {pkg.quotas}/{pkg.initial_quotas || pkg.quotas} remaining
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                                            <div
                                                className={`h-1.5 rounded-full transition-all ${isAlmostFull ? 'bg-red-400' : 'bg-primary'}`}
                                                style={{ width: `${Math.min(filledPct, 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                                        <button
                                            onClick={() => { setPanelPackage(pkg); setIsPanelOpen(true); }}
                                            className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-blue-700 transition-colors"
                                        >
                                            <Users className="w-3.5 h-3.5" />
                                            Detail
                                        </button>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => navigate(`/admin/packages/${pkg.id}/edit`)}
                                                className={btnGhost}
                                                title="Edit"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteId(pkg.id)}
                                                className="inline-flex items-center px-3 py-2 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {!loading && (
                <Pagination page={page} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
            )}

            {isPanelOpen && panelPackage && (
                <PackageDetailPanel
                    pkg={panelPackage}
                    onClose={() => { setIsPanelOpen(false); setPanelPackage(null); }}
                />
            )}

            <ConfirmDialog
                isOpen={!!deleteId}
                title="Delete Package"
                message="This package and all associated data will be permanently deleted. Existing orders may be affected."
                confirmLabel="Delete Package"
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
                loading={deleting}
            />
        </div>
    );
};

export default Packages;
