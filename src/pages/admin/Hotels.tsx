import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, Building2, Star, X } from 'lucide-react';
import {
    PageHeader, TableCard, THead, Th, Td, SkeletonRows, EmptyState, SlideOver,
    ConfirmDialog, FormField, inputClass, selectClass, btnPrimary, btnSecondary, btnGhost,
    useToast, SearchInput, Pagination, SortState, compareRows,
} from '../../components/admin/ui';
import CountrySelect from '../../components/admin/CountrySelect';

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

// New hotels default to the standard room type config (mirrors the DB column default).
const DEFAULT_ROOM_TYPES: RoomTypeRow[] = [
    { name: 'Quad', capacity: 4 },
    { name: 'Triple', capacity: 3 },
    { name: 'Double', capacity: 2 },
];

const EMPTY_FORM = { name: '', location: '', stars: 3, room_types: DEFAULT_ROOM_TYPES, maps_url: '', country_id: '' };

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
    const [saving, setSaving] = useState(false);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);

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
        setForm(EMPTY_FORM);
        setIsFormOpen(true);
    };

    const openEdit = (hotel: Hotel) => {
        setEditingId(hotel.id);
        setForm({ name: hotel.name, location: hotel.location, stars: hotel.stars, room_types: hotel.room_types ?? [], maps_url: hotel.maps_url || '', country_id: hotel.country_id || '' });
        setIsFormOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const payload = { name: form.name, location: form.location, stars: form.stars, room_types: form.room_types, maps_url: form.maps_url || null, country_id: form.country_id || null };
        const { error } = editingId
            ? await supabase.from('hotels').update(payload).eq('id', editingId)
            : await supabase.from('hotels').insert([payload]);

        setSaving(false);
        if (error) {
            toast('error', 'Failed to save hotel.');
        } else {
            toast('success', editingId ? 'Hotel updated.' : 'Hotel added.');
            setIsFormOpen(false);
            setPage(0);
            fetchHotels();
        }
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

    const addRoomType = () =>
        setForm((f) => ({ ...f, room_types: [...f.room_types, { name: '', capacity: 2 }] }));

    const updateRoomType = (i: number, field: keyof RoomTypeRow, value: string | number) =>
        setForm((f) => {
            const rt = [...f.room_types];
            rt[i] = { ...rt[i], [field]: value };
            return { ...f, room_types: rt };
        });

    const removeRoomType = (i: number) =>
        setForm((f) => ({ ...f, room_types: f.room_types.filter((_, idx) => idx !== i) }));

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
                footer={
                    <div className="flex gap-3">
                        <button type="button" onClick={() => setIsFormOpen(false)} className={btnSecondary}>
                            Cancel
                        </button>
                        <button form="hotel-form" type="submit" disabled={saving} className={btnPrimary}>
                            {saving ? 'Saving...' : (editingId ? 'Update Hotel' : 'Add Hotel')}
                        </button>
                    </div>
                }
            >
                <form id="hotel-form" onSubmit={handleSave} className="space-y-5">
                    <FormField label="Hotel Name" required>
                        <input
                            type="text"
                            required
                            className={inputClass}
                            placeholder="e.g., Anjum Hotel Makkah"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                    </FormField>
                    <FormField label="Location" required>
                        <input
                            type="text"
                            required
                            className={inputClass}
                            placeholder="e.g., Makkah"
                            value={form.location}
                            onChange={(e) => setForm({ ...form, location: e.target.value })}
                        />
                    </FormField>
                    <FormField label="Country">
                        <CountrySelect
                            value={form.country_id}
                            onChange={(id) => setForm((f) => ({ ...f, country_id: id }))}
                        />
                    </FormField>
                    <FormField label="Google Maps Link" hint="Paste the share link from Google Maps. Shown as a clickable link on the public page.">
                        <input
                            type="url"
                            className={inputClass}
                            placeholder="https://maps.app.goo.gl/..."
                            value={form.maps_url}
                            onChange={(e) => setForm({ ...form, maps_url: e.target.value })}
                        />
                    </FormField>
                    <FormField label="Star Rating" required>
                        <select
                            className={selectClass}
                            value={form.stars}
                            onChange={(e) => setForm({ ...form, stars: parseInt(e.target.value) })}
                        >
                            {[1, 2, 3, 4, 5].map((n) => (
                                <option key={n} value={n}>{n} Star{n > 1 ? 's' : ''}</option>
                            ))}
                        </select>
                        <div className="mt-2">
                            <StarRating count={form.stars} />
                        </div>
                    </FormField>
                    {/* Room Types */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-medium text-gray-700">Room Types</label>
                            <button type="button" onClick={addRoomType} className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                                <Plus className="w-3 h-3" /> Add room type
                            </button>
                        </div>
                        {form.room_types.length === 0 && (
                            <p className="text-xs text-gray-400">No room types defined. Click "Add room type" to begin.</p>
                        )}
                        <div className="space-y-2">
                            {form.room_types.map((rt, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g., Quad"
                                        className={inputClass + ' flex-1'}
                                        value={rt.name}
                                        onChange={(e) => updateRoomType(i, 'name', e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        required
                                        min={1}
                                        max={10}
                                        placeholder="Pax"
                                        className={inputClass + ' w-20'}
                                        value={rt.capacity}
                                        onChange={(e) => updateRoomType(i, 'capacity', parseInt(e.target.value) || 1)}
                                    />
                                    <button type="button" onClick={() => removeRoomType(i)} className="text-red-400 hover:text-red-600 p-1">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">These room types will be available when creating packages.</p>
                    </div>
                </form>
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
