import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, Plane, Upload, Link } from 'lucide-react';
import {
    PageHeader, TableCard, THead, Th, Td, SkeletonRows, EmptyState, SlideOver,
    ConfirmDialog, FormField, inputClass, btnPrimary, btnSecondary, btnGhost,
    useToast, SearchInput, Pagination, SortState, compareRows,
} from '../../components/admin/ui';

interface Airline { id: string; name: string; logo_url: string | null; }

const EMPTY_FORM = { name: '', logo_url: '' };

const PAGE_SIZE = 10;

const Airlines: React.FC = () => {
    const toast = useToast();
    const [airlines, setAirlines] = useState<Airline[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(0);
    const [logoTab, setLogoTab] = useState<'upload' | 'url'>('upload');
    const [uploading, setUploading] = useState(false);
    const [sort, setSort] = useState<SortState>({ key: 'name', dir: 'asc' });
    const handleSort = (key: string) =>
        setSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));

    useEffect(() => { fetchAirlines(); }, []);
    useEffect(() => { setPage(0); }, [searchQuery]);
    useEffect(() => { setPage(0); }, [sort]);

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const MAX_MB = 2;
        if (file.size > MAX_MB * 1024 * 1024) {
            toast('error', `File terlalu besar. Maksimum ${MAX_MB} MB.`);
            e.target.value = '';
            return;
        }
        setUploading(true);
        const raw = file.name.split('.').pop() ?? 'png';
        const ext = raw.toLowerCase().slice(0, 5);
        const path = `${crypto.randomUUID()}.${ext}`;
        const { data, error } = await supabase.storage
            .from('airline-logos')
            .upload(path, file, { upsert: true, contentType: file.type || 'image/png' });
        if (error) {
            toast('error', 'Logo upload failed.');
            setUploading(false);
            return;
        }
        const { data: urlData } = supabase.storage.from('airline-logos').getPublicUrl(data.path);
        setForm((f) => ({ ...f, logo_url: urlData.publicUrl }));
        setUploading(false);
        toast('success', 'Logo uploaded.');
        e.target.value = '';
    };

    const fetchAirlines = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('airlines').select('*').order('name');
        if (!error && data) setAirlines(data);
        setLoading(false);
    };

    const openCreate = () => {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setLogoTab('upload');
        setIsFormOpen(true);
    };

    const openEdit = (airline: Airline) => {
        setEditingId(airline.id);
        setForm({ name: airline.name, logo_url: airline.logo_url || '' });
        setLogoTab(airline.logo_url ? 'url' : 'upload');
        setIsFormOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const payload = { name: form.name, logo_url: form.logo_url || null };
        const { error } = editingId
            ? await supabase.from('airlines').update(payload).eq('id', editingId)
            : await supabase.from('airlines').insert([payload]);

        setSaving(false);
        if (error) {
            toast('error', 'Failed to save airline.');
        } else {
            toast('success', editingId ? 'Airline updated.' : 'Airline added.');
            setIsFormOpen(false);
            setPage(0);
            fetchAirlines();
        }
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
        (a.name ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    const sorted = [...filtered].sort((a, b) => compareRows(a, b, sort.key, sort.dir));
    const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    return (
        <div>
            <PageHeader
                title="Airlines"
                badge={airlines.length}
                subtitle="Manage airline partners used in packages"
                breadcrumbs={[{ label: 'Resources' }, { label: 'Airlines' }]}
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
                        <Th align="right">Actions</Th>
                    </THead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <SkeletonRows cols={3} rows={4} />
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={3}>
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
                                    <Td className="text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openEdit(airline)} className={btnGhost} title="Edit">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteId(airline.id)}
                                                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
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
                footer={
                    <div className="flex gap-3">
                        <button type="button" onClick={() => setIsFormOpen(false)} className={btnSecondary}>
                            Cancel
                        </button>
                        <button
                            form="airline-form"
                            type="submit"
                            disabled={saving || uploading}
                            className={btnPrimary}
                        >
                            {saving ? 'Saving...' : (editingId ? 'Update Airline' : 'Add Airline')}
                        </button>
                    </div>
                }
            >
                <form id="airline-form" onSubmit={handleSave} className="space-y-5">
                    <FormField label="Airline Name" required>
                        <input
                            type="text"
                            required
                            className={inputClass}
                            placeholder="e.g., Garuda Indonesia"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                    </FormField>
                    <FormField label="Logo">
                        {/* Tab switcher */}
                        <div className="flex rounded-lg border border-gray-200 overflow-hidden mb-3 w-fit">
                            {(['upload', 'url'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    type="button"
                                    onClick={() => setLogoTab(tab)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                                        logoTab === tab
                                            ? 'bg-primary text-white'
                                            : 'bg-white text-gray-500 hover:bg-gray-50'
                                    }`}
                                >
                                    {tab === 'upload' ? <Upload className="w-3 h-3" /> : <Link className="w-3 h-3" />}
                                    {tab === 'upload' ? 'Upload' : 'URL'}
                                </button>
                            ))}
                        </div>

                        {logoTab === 'upload' ? (
                            <label className={`flex items-center justify-center gap-2 cursor-pointer rounded-lg border-2 border-dashed border-gray-200 p-4 hover:border-primary/40 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                <Upload className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-500">
                                    {uploading ? 'Uploading...' : 'Click to upload JPG / PNG / WebP / SVG'}
                                </span>
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/svg+xml"
                                    className="sr-only"
                                    onChange={handleLogoUpload}
                                    disabled={uploading}
                                />
                            </label>
                        ) : (
                            <input
                                type="url"
                                className={inputClass}
                                placeholder="https://..."
                                value={form.logo_url}
                                onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                            />
                        )}

                        {/* Shared preview */}
                        {form.logo_url && (
                            <div className="rounded-xl border border-gray-200 p-4 bg-gray-50 mt-3">
                                <p className="text-xs text-gray-500 mb-2">Preview</p>
                                <img src={form.logo_url} alt="Logo preview" className="h-10 max-w-[180px] object-contain" />
                            </div>
                        )}
                    </FormField>
                </form>
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
