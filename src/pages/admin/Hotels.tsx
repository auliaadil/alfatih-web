import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import { Plus, Building2, Star } from 'lucide-react';
import {
    PageHeader, TableCard, THead, Th, Td, SkeletonRows, EmptyState, SlideOver,
    ConfirmDialog, btnPrimary, btnGhost,
    useToast, SearchInput, Pagination, SortState, compareRows,
} from '../../components/admin/ui';
import HotelForm from '../../components/admin/HotelForm';

// Catalogue-level room type (no price — pricing is set per-package in the wizard)
interface RoomTypeRow { name: string; capacity: number; }

interface Hotel {
  id: string;
  name: string;
  location: string;
  stars: number;
  room_types: RoomTypeRow[];
  maps_url: string | null;
  country_id: string | null;
  countries: { name: string } | null;
}

const PAGE_SIZE = 10;

const StarRating: React.FC<{ count: number }> = ({ count }) => (
    <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`w-3.5 h-3.5 ${i < count ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
        ))}
    </div>
);

const Hotels: React.FC = () => {
    const toast = useToast();
    const [hotels, setHotels] = useState<Hotel[]>([]);
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

    useEffect(() => { fetchHotels(); }, []);
    useEffect(() => { setPage(0); }, [searchQuery]);
    useEffect(() => { setPage(0); }, [sort]);

    const fetchHotels = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('hotels').select('*, countries(name)').order('name');
        if (!error && data) setHotels(data);
        setLoading(false);
    };

    const openCreate = () => {
        setEditingId(null);
        setIsFormOpen(true);
    };

    const openEdit = (hotel: Hotel) => {
        setEditingId(hotel.id);
        setIsFormOpen(true);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        const { error } = await supabase.from('hotels').delete().eq('id', deleteId);
        setDeleting(false);
        setDeleteId(null);
        if (error) {
            toast('error', 'Failed to delete hotel.');
        } else {
            toast('success', 'Hotel deleted.');
            setPage(0);
            fetchHotels();
        }
    };

    const filtered = hotels.filter((h) =>
        [h.name, h.location, h.countries?.name].some((f) =>
            (f ?? '').toLowerCase().includes(searchQuery.toLowerCase())
        )
    );
    const sorted = [...filtered].sort((a, b) => compareRows(a, b, sort.key, sort.dir));
    const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    return (
        <div>
            <PageHeader
                title="Hotels"
                badge={hotels.length}
                subtitle="Manage hotel accommodations used in packages"
                action={
                    <button onClick={openCreate} className={btnPrimary}>
                        <Plus className="w-4 h-4" /> Add Hotel
                    </button>
                }
            />

            <div className="mb-4">
                <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Cari nama hotel atau lokasi..." />
            </div>

            <TableCard>
                <table className="min-w-full">
                    <THead>
                        <Th sortKey="name" currentSort={sort} onSort={handleSort}>Hotel Name</Th>
                        <Th sortKey="location" currentSort={sort} onSort={handleSort}>Location</Th>
                        <Th>Country</Th>
                        <Th sortKey="stars" currentSort={sort} onSort={handleSort}>Rating</Th>
                        <Th align="right">Actions</Th>
                    </THead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <SkeletonRows cols={4} rows={5} />
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={5}>
                                    {hotels.length === 0 ? (
                                        <EmptyState
                                            icon={<Building2 className="w-7 h-7" />}
                                            title="No hotels yet"
                                            description="Add your first hotel to start building packages."
                                            action={
                                                <button onClick={openCreate} className={btnPrimary}>
                                                    <Plus className="w-4 h-4" /> Add Hotel
                                                </button>
                                            }
                                        />
                                    ) : (
                                        <EmptyState
                                            icon={<Building2 className="w-7 h-7" />}
                                            title="Tidak ada hasil"
                                            description={`Tidak ada hotel yang cocok dengan "${searchQuery}".`}
                                        />
                                    )}
                                </td>
                            </tr>
                        ) : (
                            paginated.map((hotel) => (
                                <tr key={hotel.id} className="hover:bg-gray-50/60 transition-colors group">
                                    <Td>
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                                                <Building2 className="w-4 h-4 text-amber-600" />
                                            </div>
                                            <span className="font-medium text-gray-900">{hotel.name}</span>
                                        </div>
                                    </Td>
                                    <Td>
                                        <span className="text-gray-600">{hotel.location}</span>
                                    </Td>
                                    <Td>
                                        <span className="text-gray-600">{hotel.countries?.name ?? '—'}</span>
                                    </Td>
                                    <Td>
                                        <StarRating count={hotel.stars} />
                                    </Td>
                                    <Td className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Link 
                                                to={`/admin/hotel-bookings?hotel_id=${hotel.id}`}
                                                className={`${btnGhost} text-blue-600 hover:bg-blue-50 text-xs px-2 py-1`}
                                            >
                                                Bookings
                                            </Link>
                                            <button onClick={() => openEdit(hotel)} className={`${btnGhost} text-xs px-2 py-1`}>
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => setDeleteId(hotel.id)}
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
                title={editingId ? 'Edit Hotel' : 'Add Hotel'}
                subtitle={editingId ? 'Update hotel details below.' : 'Fill in the details to add a new hotel.'}
            >
                <HotelForm
                    editingId={editingId}
                    initialData={editingId ? (() => {
                        const h = hotels.find(x => x.id === editingId);
                        return h ? { name: h.name, location: h.location, stars: h.stars, room_types: h.room_types ?? [], maps_url: h.maps_url || '', country_id: h.country_id || '' } : undefined;
                    })() : undefined}
                    onSaved={() => { fetchHotels(); setIsFormOpen(false); }}
                    onCancel={() => setIsFormOpen(false)}
                />
            </SlideOver>

            {/* Delete Confirm */}
            <ConfirmDialog
                isOpen={!!deleteId}
                title="Delete Hotel"
                message="This hotel will be permanently removed. Packages referencing it may be affected."
                confirmLabel="Delete"
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
                loading={deleting}
            />
        </div>
    );
};

export default Hotels;
