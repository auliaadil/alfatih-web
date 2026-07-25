import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Plus, Users, Package, CalendarDays, Eye, EyeOff } from 'lucide-react';
import {
    PageHeader, SkeletonCard, EmptyState, ConfirmDialog,
    btnPrimary, btnGhost, useToast, StatusBadge,
    SearchInput, Pagination, TableCard, THead, Th, Td, SkeletonRows
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
    const [updatingId, setUpdatingId] = useState<string | null>(null);

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

    const handleTogglePublish = async (pkg: any) => {
        setUpdatingId(pkg.id);
        const { error } = await supabase
            .from('packages')
            .update({ is_published: !pkg.is_published })
            .eq('id', pkg.id);
        setUpdatingId(null);
        if (error) {
            toast('error', 'Failed to update publish status.');
        } else {
            setPackages(prev =>
                prev.map(p => p.id === pkg.id ? { ...p, is_published: !p.is_published } : p)
            );
        }
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
                action={
                    <button
                        onClick={() => navigate('/admin/packages/new')}
                        className={btnPrimary}
                    >
                        <Plus className="w-4 h-4" /> New Package
                    </button>
                }
            />

            <div className="flex gap-3 mb-4">
                <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Cari judul, kategori, tanggal..." />
            </div>

            <TableCard>
                <table className="min-w-full">
                    <THead>
                        <Th width="40%">Package</Th>
                        <Th width="15%">Category</Th>
                        <Th width="15%">Departure</Th>
                        <Th width="20%">Quota</Th>
                        <Th width="10%">Status</Th>
                        <Th align="right" width="10%">Actions</Th>
                    </THead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <SkeletonRows cols={6} rows={5} />
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={6}>
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
                                </td>
                            </tr>
                        ) : (
                            paginated.map((pkg) => {
                                const filledPct = quotaPercent(pkg);
                                const isAlmostFull = filledPct >= 80;
                                return (
                                    <tr key={pkg.id} className="hover:bg-gray-50/60 transition-colors group">
                                        <Td>
                                            <div className="flex items-center gap-3">
                                                {pkg.image_url ? (
                                                    <img src={pkg.image_url} alt={pkg.title} className="w-16 h-12 object-cover rounded-md flex-shrink-0" />
                                                ) : (
                                                    <div className="w-16 h-12 bg-gray-100 rounded-md flex-shrink-0 flex items-center justify-center">
                                                        <Package className="w-5 h-5 text-gray-400" />
                                                    </div>
                                                )}
                                                <div>
                                                    <span className="font-medium text-gray-900 line-clamp-1">{pkg.title}</span>
                                                    {pkg.is_popular && (
                                                        <span className="px-2 py-0.5 mt-1 inline-block rounded text-[10px] font-semibold bg-secondary/10 text-secondary">
                                                            Popular
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </Td>
                                        <Td>
                                            <StatusBadge status={pkg.category || 'Umrah'} />
                                        </Td>
                                        <Td>
                                            <div className="flex flex-col text-sm text-gray-600">
                                                <span>{pkg.departure_date || '—'}</span>
                                                <span className="text-xs text-gray-400">{pkg.duration}</span>
                                            </div>
                                        </Td>
                                        <Td>
                                            <div className="w-full max-w-[150px] space-y-1">
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className={`font-medium ${isAlmostFull ? 'text-red-600' : 'text-gray-700'}`}>
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
                                        </Td>
                                        <Td>
                                            <button
                                                onClick={() => handleTogglePublish(pkg)}
                                                disabled={updatingId === pkg.id}
                                                title={pkg.is_published !== false ? 'Published — klik untuk hide' : 'Unpublished — klik untuk publish'}
                                                className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                {updatingId === pkg.id ? (
                                                    <span className="text-gray-400">…</span>
                                                ) : pkg.is_published !== false ? (
                                                    <><Eye className="w-3.5 h-3.5 text-emerald-500" /><span className="text-emerald-600">Published</span></>
                                                ) : (
                                                    <><EyeOff className="w-3.5 h-3.5 text-gray-400" /><span className="text-gray-500">Hidden</span></>
                                                )}
                                            </button>
                                        </Td>
                                        <Td className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => { setPanelPackage(pkg); setIsPanelOpen(true); }}
                                                    className={`${btnGhost} text-blue-600 hover:bg-blue-50 text-xs px-2 py-1`}
                                                >
                                                    View
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/admin/packages/${pkg.id}/edit`)}
                                                    className={`${btnGhost} text-xs px-2 py-1`}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => setDeleteId(pkg.id)}
                                                    className={`${btnGhost} text-red-500 hover:bg-red-50 text-xs px-2 py-1`}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </Td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </TableCard>

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
