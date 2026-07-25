import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Link as RouterLink } from 'react-router-dom';
import { Plus, Plane } from 'lucide-react';
import {
    PageHeader, TableCard, THead, Th, Td, SkeletonRows, EmptyState, SlideOver,
    ConfirmDialog, btnPrimary, btnGhost,
    useToast, SearchInput, Pagination, SortState, compareRows,
} from '../../components/admin/ui';
import AirlineForm from '../../components/admin/AirlineForm';

interface Airline {
  id: string;
  name: string;
  logo_url: string | null;
  country_id: string | null;
  countries: { name: string } | null;
}

const PAGE_SIZE = 10;

const Airlines: React.FC = () => {
    const toast = useToast();
    const [airlines, setAirlines] = useState<Airline[]>([]);
    const [loading, setLoading] = useState(true);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(0);
    const [sort, setSort] = useState<SortState>({ key: 'name', dir: 'asc' });
    const handleSort = (key: string) =>
        setSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));

    useEffect(() => { fetchAirlines(); }, []);
    useEffect(() => { setPage(0); }, [searchQuery]);
    useEffect(() => { setPage(0); }, [sort]);

    const fetchAirlines = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('airlines').select('*, countries(name)').order('name');
        if (!error && data) setAirlines(data);
        setLoading(false);
    };

    const openCreate = () => {
        setEditingId(null);
        setIsFormOpen(true);
    };

    const openEdit = (airline: Airline) => {
        setEditingId(airline.id);
        setIsFormOpen(true);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);

        // Best-effort cleanup of uploaded logo
        const target = airlines.find((a) => a.id === deleteId);
        const storagePrefix = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/airline-logos/`;
        if (target?.logo_url?.startsWith(storagePrefix)) {
            const storagePath = target.logo_url.slice(storagePrefix.length);
            await supabase.storage.from('airline-logos').remove([storagePath]);
        }

        const { error } = await supabase.from('airlines').delete().eq('id', deleteId);
        setDeleting(false);
        setDeleteId(null);
        if (error) {
            toast('error', 'Failed to delete airline.');
        } else {
            toast('success', 'Airline deleted.');
            fetchAirlines();
        }
    };

    const filtered = airlines.filter((a) =>
        [a.name, a.countries?.name].some((f) =>
            (f ?? '').toLowerCase().includes(searchQuery.toLowerCase())
        )
    );
    const sorted = [...filtered].sort((a, b) => compareRows(a, b, sort.key, sort.dir));
    const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    return (
        <div>
            <PageHeader
                title="Airlines"
                badge={airlines.length}
                subtitle="Manage airline partners used in packages"
                action={
                    <button onClick={openCreate} className={btnPrimary}>
                        <Plus className="w-4 h-4" /> Add Airline
                    </button>
                }
            />

            <div className="mb-4">
                <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Cari nama maskapai..." />
            </div>

            <TableCard>
                <table className="min-w-full">
                    <THead>
                        <Th>Logo</Th>
                        <Th sortKey="name" currentSort={sort} onSort={handleSort}>Airline Name</Th>
                        <Th>Country</Th>
                        <Th align="right">Actions</Th>
                    </THead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <SkeletonRows cols={3} rows={4} />
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={4}>
                                    {airlines.length === 0 ? (
                                        <EmptyState
                                            icon={<Plane className="w-7 h-7" />}
                                            title="No airlines yet"
                                            description="Add your first airline partner to get started."
                                            action={
                                                <button onClick={openCreate} className={btnPrimary}>
                                                    <Plus className="w-4 h-4" /> Add Airline
                                                </button>
                                            }
                                        />
                                    ) : (
                                        <EmptyState
                                            icon={<Plane className="w-7 h-7" />}
                                            title="Tidak ada hasil"
                                            description={`Tidak ada maskapai yang cocok dengan "${searchQuery}".`}
                                        />
                                    )}
                                </td>
                            </tr>
                        ) : (
                            paginated.map((airline) => (
                                <tr key={airline.id} className="hover:bg-gray-50/60 transition-colors group">
                                    <Td className="w-32">
                                        {airline.logo_url ? (
                                            <img src={airline.logo_url} alt={airline.name} className="h-8 max-w-[100px] object-contain" />
                                        ) : (
                                            <div className="w-10 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                                <Plane className="w-4 h-4 text-gray-400" />
                                            </div>
                                        )}
                                    </Td>
                                    <Td>
                                        <span className="font-medium text-gray-900">{airline.name}</span>
                                    </Td>
                                    <Td>
                                        <span className="text-gray-600">{airline.countries?.name ?? '—'}</span>
                                    </Td>
                                    <Td className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <RouterLink 
                                                to={`/admin/flight-bookings?airline_id=${airline.id}`}
                                                className={`${btnGhost} text-blue-600 hover:bg-blue-50 text-xs px-2 py-1`}
                                            >
                                                Bookings
                                            </RouterLink>
                                            <button onClick={() => openEdit(airline)} className={`${btnGhost} text-xs px-2 py-1`}>
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => setDeleteId(airline.id)}
                                                className={`${btnGhost} text-red-500 hover:bg-red-50 text-xs px-2 py-1`}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </Td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </TableCard>

            {!loading && (
                <Pagination page={page} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
            )}

            {/* Form Slide-Over */}
            <SlideOver
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                title={editingId ? 'Edit Airline' : 'Add Airline'}
                subtitle={editingId ? 'Update the airline details below.' : 'Fill in the details to add a new airline.'}
            >
                <AirlineForm
                    editingId={editingId}
                    initialData={editingId ? (() => {
                        const a = airlines.find(x => x.id === editingId);
                        return a ? { name: a.name, logo_url: a.logo_url || '', country_id: a.country_id || '' } : undefined;
                    })() : undefined}
                    onSaved={() => { fetchAirlines(); setIsFormOpen(false); }}
                    onCancel={() => setIsFormOpen(false)}
                />
            </SlideOver>

            {/* Delete Confirm */}
            <ConfirmDialog
                isOpen={!!deleteId}
                title="Delete Airline"
                message="This airline will be permanently removed. Packages referencing it may be affected."
                confirmLabel="Delete"
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
                loading={deleting}
            />
        </div>
    );
};

export default Airlines;
