import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, Tag } from 'lucide-react';
import {
  PageHeader, TableCard, THead, Th, Td, SkeletonRows, EmptyState, SlideOver,
  ConfirmDialog, FormField, inputClass, btnPrimary, btnSecondary, btnGhost, useToast,
} from '../../components/admin/ui';
import { Category } from '../../../types';

const toSlug = (name: string) =>
  name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

const EMPTY_FORM = { name: '', slug: '' };

const Categories: React.FC = () => {
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('categories').select('*').order('name');
    if (!error && data) setCategories(data);
    setLoading(false);
  };

  const openCreate = () => { setEditingId(null); setForm(EMPTY_FORM); setIsFormOpen(true); };
  const openEdit = (c: Category) => { setEditingId(c.id); setForm({ name: c.name, slug: c.slug }); setIsFormOpen(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { name: form.name, slug: form.slug || toSlug(form.name) };
    const { error } = editingId
      ? await supabase.from('categories').update(payload).eq('id', editingId)
      : await supabase.from('categories').insert([payload]);
    setSaving(false);
    if (error) { toast('error', 'Failed to save category.'); }
    else { toast('success', editingId ? 'Category updated.' : 'Category added.'); setIsFormOpen(false); fetchCategories(); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await supabase.from('categories').delete().eq('id', deleteId);
    setDeleting(false);
    setDeleteId(null);
    if (error) { toast('error', 'Failed to delete category.'); }
    else { toast('success', 'Category deleted.'); fetchCategories(); }
  };

  return (
    <div>
      <PageHeader
        title="Categories"
        badge={categories.length}
        subtitle="Manage package categories shown in the wizard"
        breadcrumbs={[{ label: 'Resources' }, { label: 'Categories' }]}
        action={<button onClick={openCreate} className={btnPrimary}><Plus className="w-4 h-4" /> Add Category</button>}
      />
      <TableCard>
        <table className="min-w-full">
          <THead><Th>Name</Th><Th>Slug</Th><Th align="right">Actions</Th></THead>
          <tbody className="divide-y divide-gray-100">
            {loading ? <SkeletonRows cols={3} rows={5} /> : categories.length === 0 ? (
              <tr><td colSpan={3}><EmptyState icon={<Tag className="w-7 h-7" />} title="No categories yet" description="Add categories to classify packages." action={<button onClick={openCreate} className={btnPrimary}><Plus className="w-4 h-4" /> Add Category</button>} /></td></tr>
            ) : categories.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50/60 transition-colors group">
                <Td><span className="font-medium text-gray-900">{c.name}</span></Td>
                <Td><span className="font-mono text-sm text-gray-500">{c.slug}</span></Td>
                <Td className="text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(c)} className={btnGhost}><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteId(c.id)} className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>

      <SlideOver isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingId ? 'Edit Category' : 'Add Category'} subtitle="Slug is auto-generated from the name."
        footer={<div className="flex gap-3"><button type="button" onClick={() => setIsFormOpen(false)} className={btnSecondary}>Cancel</button><button form="category-form" type="submit" disabled={saving} className={btnPrimary}>{saving ? 'Saving...' : editingId ? 'Update' : 'Add Category'}</button></div>}>
        <form id="category-form" onSubmit={handleSave} className="space-y-5">
          <FormField label="Category Name" required>
            <input type="text" required className={inputClass} placeholder="e.g., Umrah Plus" value={form.name}
              onChange={(e) => setForm({ name: e.target.value, slug: toSlug(e.target.value) })} />
          </FormField>
          <FormField label="Slug" hint="Auto-generated. Edit if needed.">
            <input type="text" className={inputClass} placeholder="e.g., umrah-plus" value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          </FormField>
        </form>
      </SlideOver>

      <ConfirmDialog isOpen={!!deleteId} title="Delete Category" message="This category will be permanently removed." confirmLabel="Delete" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={deleting} />
    </div>
  );
};

export default Categories;
