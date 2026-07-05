import React, { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { BookImage } from 'lucide-react';
import {
  PageHeader, TableCard, THead, Th, Td, SkeletonRows, EmptyState,
  SearchInput, Pagination, SortState, compareRows, useToast,
  btnPrimary, btnGhost,
} from '../../components/admin/ui';
import { Documentation } from '../../../types';
import { DocumentationForm } from '../../components/admin/DocumentationForm';
import { DocumentationView } from '../../components/admin/DocumentationView';

const PAGE_SIZE = 10;

const Documentations: React.FC = () => {
  const toast = useToast();
  const [docs, setDocs] = useState<Documentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<SortState>({ key: 'created_at', dir: 'desc' });
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  // SlideOver state — wired in Tasks 3 & 4
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Documentation | null>(null);
  const [viewingDoc, setViewingDoc] = useState<Documentation | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadCategories();
    loadDocs();
  }, []);

  const loadCategories = async () => {
    const { data } = await supabase.from('categories').select('id, name').order('name');
    if (data) setCategories(data);
  };

  const loadDocs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('documentations')
      .select('*, categories(id, name), packages(id, title), documentation_photos(count)')
      .order('created_at', { ascending: false });
    if (!error && data) setDocs(data as Documentation[]);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    // delete storage files first
    const photos = await supabase
      .from('documentation_photos')
      .select('storage_url')
      .eq('documentation_id', deleteId);
    if (photos.data?.length) {
      const paths = photos.data.map(p => {
        const url = new URL(p.storage_url);
        return url.pathname.split('/object/public/documentation-photos/')[1];
      }).filter(Boolean);
      if (paths.length) await supabase.storage.from('documentation-photos').remove(paths);
    }
    const { error } = await supabase.from('documentations').delete().eq('id', deleteId);
    if (error) toast('error', 'Gagal menghapus dokumentasi.');
    else { toast('success', 'Dokumentasi dihapus.'); loadDocs(); }
    setDeleteId(null);
    setDeleting(false);
  };

  const filtered = docs
    .filter(d =>
      (!searchQuery || d.title.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (!categoryFilter || d.category_id === categoryFilter)
    )
    .sort((a, b) => compareRows(a, b, sort.key, sort.dir));

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSort = (key: string) =>
    setSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));

  const photoCount = (doc: Documentation) =>
    doc.documentation_photos?.[0]?.count ?? 0;

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Documentations"
          subtitle="Manage trip albums and photo collections"
          action={
            <button
              className={btnPrimary}
              onClick={() => { setEditingDoc(null); setFormOpen(true); }}
            >
              + New Album
            </button>
          }
        />

      <div className="flex gap-3">
        <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search by title…" />
        <select
          value={categoryFilter}
          onChange={e => { setCategoryFilter(e.target.value); setPage(0); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white"
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <TableCard>
        <THead>
          <Th sortKey="title" currentSort={sort} onSort={handleSort} width="30%">Album</Th>
          <Th width="15%">Category</Th>
          <Th width="20%">Package</Th>
          <Th sortKey="departure_date" currentSort={sort} onSort={handleSort} width="10%">Departure</Th>
          <Th align="center" width="5%">Photos</Th>
          <Th align="center" width="10%">Status</Th>
          <Th align="right" width="10%">Actions</Th>
        </THead>
        <tbody>
          {loading ? (
            <SkeletonRows cols={7} rows={5} />
          ) : paginated.length === 0 ? (
            <tr>
              <td colSpan={7}>
                <EmptyState icon={<BookImage className="w-7 h-7" />} title="No albums yet" description="Create your first trip album" />
              </td>
            </tr>
          ) : paginated.map(doc => (
            <tr key={doc.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
              <Td>
                <div className="flex items-center gap-3">
                  {doc.cover_photo_url ? (
                    <img src={doc.cover_photo_url} alt="" className="w-12 h-9 object-cover rounded-md flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-9 bg-gray-100 rounded-md flex-shrink-0 flex items-center justify-center">
                      <BookImage className="w-4 h-4 text-gray-300" />
                    </div>
                  )}
                  <span className="font-medium text-gray-900">{doc.title}</span>
                </div>
              </Td>
              <Td>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-700">
                  {doc.categories?.name ?? '—'}
                </span>
              </Td>
              <Td className="text-blue-600 text-sm">{doc.packages?.title ?? '—'}</Td>
              <Td className="text-sm text-gray-600">{doc.departure_date ?? '—'}</Td>
              <Td className="text-center text-sm text-gray-700">{photoCount(doc)}</Td>
              <Td className="text-center">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                  doc.published ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {doc.published ? 'Published' : 'Draft'}
                </span>
              </Td>
              <Td className="text-right">
                <div className="flex justify-end gap-2">
                  <button
                    className={`${btnGhost} text-blue-600 hover:bg-blue-50 text-xs px-2 py-1`}
                    onClick={() => { setViewingDoc(doc); setViewOpen(true); }}
                  >
                    View
                  </button>
                  <button
                    className={`${btnGhost} text-xs px-2 py-1`}
                    onClick={() => { setEditingDoc(doc); setFormOpen(true); }}
                  >
                    Edit
                  </button>
                  <button
                    className={`${btnGhost} text-red-500 hover:bg-red-50 text-xs px-2 py-1`}
                    onClick={() => setDeleteId(doc.id)}
                  >
                    Delete
                  </button>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </TableCard>

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        totalItems={filtered.length}
        onPageChange={setPage}
      />
      </div>

      {/* Delete confirm — inline for now */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <p className="font-semibold text-gray-900 mb-2">Hapus Dokumentasi?</p>
            <p className="text-sm text-gray-500 mb-5">Semua foto akan dihapus permanen.</p>
            <div className="flex gap-3 justify-end">
              <button className={btnGhost} onClick={() => setDeleteId(null)}>Batal</button>
              <button
                className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition disabled:opacity-50"
                disabled={deleting}
                onClick={handleDelete}
              >
                {deleting ? 'Menghapus…' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {formOpen && (
        <DocumentationForm
          isOpen={formOpen}
          onClose={() => setFormOpen(false)}
          doc={editingDoc}
          onSaved={loadDocs}
        />
      )}
      {viewOpen && (
        <DocumentationView
          isOpen={viewOpen}
          onClose={() => setViewOpen(false)}
          doc={viewingDoc}
          onEdit={() => { setViewOpen(false); setEditingDoc(viewingDoc); setFormOpen(true); }}
        />
      )}
    </>
  );
};

export default Documentations;
