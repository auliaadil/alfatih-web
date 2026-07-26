import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, MessageSquare, User, Upload, Loader2, GripVertical, X, ChevronDown } from 'lucide-react';
import {
  PageHeader, TableCard, THead, Th, Td, SkeletonRows, EmptyState, SlideOver,
  ConfirmDialog, FormField, inputClass, textareaClass, btnPrimary, btnSecondary, btnGhost, useToast,
  SearchInput, Pagination, SortState, compareRows,
} from '../../components/admin/ui';
import { Testimonial } from '../../../types';

interface PackageOption {
  id: string;
  title: string;
}

const EMPTY_FORM = {
  name: '',
  role: '',
  comment: '',
  avatar_url: '',
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

  // Avatar upload
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Package combobox
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [packageSearch, setPackageSearch] = useState('');
  const [packageDropdownOpen, setPackageDropdownOpen] = useState(false);
  const packageDropdownRef = useRef<HTMLDivElement>(null);

  // Drag-to-reorder
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [reordering, setReordering] = useState(false);

  const handleSort = (key: string) =>
    setSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));

  useEffect(() => { fetchItems(); fetchPackages(); }, []);
  useEffect(() => { setPage(0); }, [searchQuery, sort]);

  // Close package dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (packageDropdownRef.current && !packageDropdownRef.current.contains(e.target as Node)) {
        setPackageDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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

  const fetchPackages = async () => {
    const { data } = await supabase.from('packages').select('id, title').order('title');
    if (data) setPackages(data);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setPackageSearch('');
    setIsFormOpen(true);
  };

  const openEdit = (item: Testimonial) => {
    setEditingId(item.id as string);
    setForm({
      name: item.name,
      role: item.role,
      comment: item.comment,
      avatar_url: item.avatar_url || '',
      is_active: item.is_active ?? true,
    });
    setPackageSearch('');
    setIsFormOpen(true);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast('error', 'File terlalu besar. Maksimum 2 MB.'); e.target.value = ''; return; }
    setUploadingAvatar(true);
    const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase().slice(0, 5);
    const name = `avatar-${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage
      .from('site-assets')
      .upload(`testimonials/${name}`, file, { upsert: true, contentType: file.type || 'image/jpeg' });
    setUploadingAvatar(false);
    if (error) { toast('error', 'Upload foto gagal.'); e.target.value = ''; return; }
    const { data: urlData } = supabase.storage.from('site-assets').getPublicUrl(data.path);
    setForm(f => ({ ...f, avatar_url: urlData.publicUrl }));
    toast('success', 'Foto berhasil diunggah.');
    e.target.value = '';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Assign sort_order = max + 1 for new items
    const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.sort_order ?? 0)) : -1;

    const payload = {
      name: form.name.trim(),
      role: form.role.trim(),
      comment: form.comment.trim(),
      avatar_url: form.avatar_url.trim() || null,
      sort_order: editingId
        ? (items.find(i => i.id === editingId)?.sort_order ?? 0)
        : maxOrder + 1,
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

  // Drag-to-reorder handlers (operate on the full sorted list)
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }

    const reordered = [...sorted];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, moved);

    setDragIndex(null);
    setDragOverIndex(null);
    setReordering(true);

    // Update sort_order for all items to reflect new positions
    const updates = reordered.map((item, idx) => ({ id: item.id, sort_order: idx }));
    // Use individual updates (Supabase doesn't support bulk upsert with different values easily)
    const errors = await Promise.all(
      updates.map(({ id, sort_order }) =>
        supabase.from('testimonials').update({ sort_order }).eq('id', id as string)
      )
    );
    setReordering(false);
    if (errors.some(r => r.error)) {
      toast('error', 'Gagal menyimpan urutan.');
    } else {
      toast('success', 'Urutan berhasil disimpan.');
      fetchItems();
    }
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const filtered = items.filter(item =>
    [item.name, item.role, item.comment].some(f =>
      (f ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    )
  );
  const sorted = [...filtered].sort((a, b) => compareRows(a, b, sort.key, sort.dir));
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const filteredPackages = packages.filter(p =>
    p.title.toLowerCase().includes(packageSearch.toLowerCase())
  );

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
            <Th width="w-8"> </Th>
            <Th sortKey="name" currentSort={sort} onSort={handleSort}>Nama</Th>
            <Th sortKey="role" currentSort={sort} onSort={handleSort}>Peran / Paket</Th>
            <Th>Komentar</Th>
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
              paginated.map((item, pageIdx) => {
                const sortedIdx = page * PAGE_SIZE + pageIdx;
                const isDragging = dragIndex === sortedIdx;
                const isDragOver = dragOverIndex === sortedIdx;
                return (
                  <tr
                    key={item.id as string}
                    draggable
                    onDragStart={e => handleDragStart(e, sortedIdx)}
                    onDragOver={e => handleDragOver(e, sortedIdx)}
                    onDrop={e => handleDrop(e, sortedIdx)}
                    onDragEnd={handleDragEnd}
                    className={`transition-colors ${isDragging ? 'opacity-40 bg-blue-50/50' : isDragOver ? 'bg-blue-50 border-t-2 border-primary' : 'hover:bg-gray-50/60'}`}
                  >
                    <Td>
                      <div className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors flex items-center justify-center w-5">
                        <GripVertical className="w-4 h-4" />
                      </div>
                    </Td>
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
                );
              })
            )}
          </tbody>
        </table>
      </TableCard>
      {reordering && (
        <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan urutan...
        </div>
      )}
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

          {/* Package combobox */}
          <FormField label="Peran / Asal Paket" hint="Pilih paket atau ketik bebas. Opsional.">
            <div className="relative" ref={packageDropdownRef}>
              <div className="relative">
                <input
                  type="text"
                  className={inputClass}
                  placeholder="Ketik atau pilih paket…"
                  value={form.role}
                  onChange={(e) => {
                    setForm({ ...form, role: e.target.value });
                    setPackageSearch(e.target.value);
                    setPackageDropdownOpen(true);
                  }}
                  onFocus={() => { setPackageSearch(form.role); setPackageDropdownOpen(true); }}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {form.role && (
                    <button
                      type="button"
                      onClick={() => { setForm({ ...form, role: '' }); setPackageSearch(''); }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <ChevronDown className="w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              {packageDropdownOpen && filteredPackages.length > 0 && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {filteredPackages.map(pkg => (
                    <button
                      key={pkg.id}
                      type="button"
                      onMouseDown={() => {
                        setForm({ ...form, role: pkg.title });
                        setPackageSearch(pkg.title);
                        setPackageDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-primary transition-colors"
                    >
                      {pkg.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
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

          {/* Avatar upload */}
          <FormField label="Foto Profil" hint="Kosongkan untuk menggunakan ikon default. Maks. 2 MB.">
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
            {form.avatar_url ? (
              <div className="flex items-center gap-3">
                <img
                  src={form.avatar_url}
                  alt="preview"
                  className="w-14 h-14 rounded-full object-cover border border-gray-200 flex-shrink-0"
                />
                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className={`${btnSecondary} text-xs px-3 py-1.5`}
                  >
                    {uploadingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    Ganti Foto
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, avatar_url: '' }))}
                    className="text-xs text-red-500 hover:text-red-700 text-left"
                  >
                    Hapus foto
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="flex items-center gap-3 w-full border-2 border-dashed border-gray-200 rounded-xl px-4 py-4 hover:border-primary/40 hover:bg-blue-50/30 transition-colors"
              >
                {uploadingAvatar ? (
                  <Loader2 className="w-5 h-5 animate-spin text-primary flex-shrink-0" />
                ) : (
                  <Upload className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )}
                <span className="text-sm text-gray-500">
                  {uploadingAvatar ? 'Mengupload...' : 'Klik untuk upload foto profil'}
                </span>
              </button>
            )}
          </FormField>

          <FormField label="Status">
            <div className="flex items-center gap-3 pt-1">
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
