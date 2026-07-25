import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, MessageSquare, User } from 'lucide-react';
import {
  PageHeader, TableCard, THead, Th, Td, SkeletonRows, EmptyState, SlideOver,
  ConfirmDialog, FormField, inputClass, textareaClass, btnPrimary, btnSecondary, btnGhost, useToast,
  SearchInput, Pagination, SortState, compareRows,
} from '../../components/admin/ui';
import { Testimonial } from '../../../types';

const EMPTY_FORM = {
  name: '',
  role: '',
  comment: '',
  avatar_url: '',
  sort_order: 0,
  is_active: true,
};

const PAGE_SIZE = 10;

const Testimonials: React.FC = () => {
  const toast = useToast();
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<SortState>({ key: 'sort_order', dir: 'asc' });

  const handleSort = (key: string) =>
    setSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));

  useEffect(() => { fetchItems(); }, []);
  useEffect(() => { setPage(0); }, [searchQuery, sort]);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) toast('error', 'Failed to load testimonials.');
    else if (data) setItems(data);
    setLoading(false);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setIsFormOpen(true);
  };

  const openEdit = (item: Testimonial) => {
    setEditingId(item.id as string);
    setForm({
      name: item.name,
      role: item.role,
      comment: item.comment,
      avatar_url: item.avatar_url || '',
      sort_order: item.sort_order ?? 0,
      is_active: item.is_active ?? true,
    });
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      role: form.role.trim(),
      comment: form.comment.trim(),
      avatar_url: form.avatar_url.trim() || null,
      sort_order: form.sort_order,
      is_active: form.is_active,
    };
    const { error } = editingId
      ? await supabase.from('testimonials').update(payload).eq('id', editingId)
      : await supabase.from('testimonials').insert([payload]);
    setSaving(false);
    if (error) {
      toast('error', 'Failed to save testimonial.');
    } else {
      toast('success', editingId ? 'Testimonial updated.' : 'Testimonial added.');
      setIsFormOpen(false);
      fetchItems();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await supabase.from('testimonials').delete().eq('id', deleteId);
    setDeleting(false);
    setDeleteId(null);
    if (error) toast('error', 'Failed to delete testimonial.');
    else { toast('success', 'Testimonial deleted.'); fetchItems(); }
  };

  const filtered = items.filter(item =>
    [item.name, item.role, item.comment].some(f =>
      (f ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    )
  );
  const sorted = [...filtered].sort((a, b) => compareRows(a, b, sort.key, sort.dir));
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div>
      <PageHeader
        title="Testimonials"
        badge={items.length}
        subtitle="Kelola testimoni jemaah yang tampil di halaman publik"
        action={<button onClick={openCreate} className={btnPrimary}><Plus className="w-4 h-4" /> Add Testimonial</button>}
      />
      <div className="mb-4">
        <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Cari nama, peran, atau komentar..." />
      </div>
      <TableCard>
        <table className="min-w-full">
          <THead>
            <Th sortKey="name" currentSort={sort} onSort={handleSort}>Nama</Th>
            <Th sortKey="role" currentSort={sort} onSort={handleSort}>Peran</Th>
            <Th>Komentar</Th>
            <Th sortKey="sort_order" currentSort={sort} onSort={handleSort}>Urutan</Th>
            <Th>Status</Th>
            <Th align="right">Actions</Th>
          </THead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <SkeletonRows cols={6} rows={5} />
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6}>
                {items.length === 0 ? (
                  <EmptyState
                    icon={<MessageSquare className="w-7 h-7" />}
                    title="Belum ada testimoni"
                    description="Tambahkan testimoni jemaah untuk ditampilkan di halaman publik."
                    action={<button onClick={openCreate} className={btnPrimary}><Plus className="w-4 h-4" /> Add Testimonial</button>}
                  />
                ) : (
                  <EmptyState
                    icon={<MessageSquare className="w-7 h-7" />}
                    title="Tidak ada hasil"
                    description={`Tidak ada testimoni yang cocok dengan "${searchQuery}".`}
                  />
                )}
              </td></tr>
            ) : (
              paginated.map(item => (
                <tr key={item.id as string} className="hover:bg-gray-50/60 transition-colors">
                  <Td>
                    <div className="flex items-center gap-3">
                      {item.avatar_url ? (
                        <img src={item.avatar_url} alt={item.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                      )}
                      <span className="font-medium text-gray-900">{item.name}</span>
                    </div>
                  </Td>
                  <Td><span className="text-sm text-gray-500">{item.role}</span></Td>
                  <Td>
                    <p className="text-sm text-gray-600 max-w-xs truncate italic">"{item.comment}"</p>
                  </Td>
                  <Td><span className="text-sm text-gray-500">{item.sort_order}</span></Td>
                  <Td>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${item.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {item.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(item)} className={`${btnGhost} text-xs px-2 py-1`}>Edit</button>
                      <button onClick={() => setDeleteId(item.id as string)} className={`${btnGhost} text-red-500 hover:bg-red-50 text-xs px-2 py-1`}>Delete</button>
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

      <SlideOver
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingId ? 'Edit Testimonial' : 'Add Testimonial'}
        subtitle="Testimoni aktif akan ditampilkan di halaman publik sesuai urutan."
        footer={
          <div className="flex gap-3">
            <button type="button" onClick={() => setIsFormOpen(false)} className={btnSecondary}>Cancel</button>
            <button form="testimonial-form" type="submit" disabled={saving} className={btnPrimary}>
              {saving ? 'Saving...' : editingId ? 'Update' : 'Add Testimonial'}
            </button>
          </div>
        }
      >
        <form id="testimonial-form" onSubmit={handleSave} className="space-y-5">
          <FormField label="Nama" required>
            <input
              type="text"
              required
              className={inputClass}
              placeholder="e.g., Haji Ahmad"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </FormField>
          <FormField label="Peran / Asal Paket" required hint="e.g., Jemaah Umrah, Peserta Japan Tour">
            <input
              type="text"
              required
              className={inputClass}
              placeholder="e.g., Jemaah Umrah 2025"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            />
          </FormField>
          <FormField label="Komentar" required>
            <textarea
              required
              rows={4}
              className={textareaClass}
              placeholder="Tulis testimoni jemaah..."
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
            />
          </FormField>
          <FormField label="URL Foto Profil" hint="Kosongkan untuk menggunakan ikon default.">
            <input
              type="url"
              className={inputClass}
              placeholder="https://..."
              value={form.avatar_url}
              onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
            />
            {form.avatar_url && (
              <img src={form.avatar_url} alt="preview" className="mt-2 w-12 h-12 rounded-full object-cover border border-gray-200" />
            )}
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Urutan Tampil" hint="Angka lebih kecil tampil lebih dulu.">
              <input
                type="number"
                className={inputClass}
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
              />
            </FormField>
            <FormField label="Status">
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, is_active: !form.is_active })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${form.is_active ? 'bg-primary' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className="text-sm text-gray-600">{form.is_active ? 'Aktif' : 'Nonaktif'}</span>
              </div>
            </FormField>
          </div>
        </form>
      </SlideOver>

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete Testimonial"
        message="Testimoni ini akan dihapus permanen."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </div>
  );
};

export default Testimonials;
