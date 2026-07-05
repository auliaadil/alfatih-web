import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, PlaneTakeoff } from 'lucide-react';
import {
  PageHeader, TableCard, THead, Th, Td, SkeletonRows, EmptyState, SlideOver,
  ConfirmDialog, FormField, inputClass, btnPrimary, btnSecondary, btnGhost, useToast,
  SearchInput, Pagination, SortState, compareRows,
} from '../../components/admin/ui';
import { Airport } from '../../../types';
import CountrySelect from '../../components/admin/CountrySelect';

const EMPTY_FORM = { iata_code: '', name: '', city: '', country_id: '' };
const PAGE_SIZE = 10;

const Airports: React.FC = () => {
  const toast = useToast();
  const [airports, setAirports] = useState<Airport[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<SortState>({ key: 'iata_code', dir: 'asc' });
  const handleSort = (key: string) =>
    setSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));

  useEffect(() => { fetchAirports(); }, []);
  useEffect(() => { setPage(0); }, [searchQuery]);
  useEffect(() => { setPage(0); }, [sort]);

  const fetchAirports = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('airports').select('*, countries(name)').order('iata_code');
    if (error) toast('error', 'Failed to load airports.');
    else if (data) setAirports(data);
    setLoading(false);
  };

  const openCreate = () => { setEditingId(null); setForm(EMPTY_FORM); setIsFormOpen(true); };
  const openEdit = (a: Airport) => {
    setEditingId(a.id);
    setForm({ iata_code: a.iata_code, name: a.name, city: a.city, country_id: a.country_id });
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, iata_code: form.iata_code.toUpperCase() };
    const { error } = editingId
      ? await supabase.from('airports').update(payload).eq('id', editingId)
      : await supabase.from('airports').insert([payload]);
    setSaving(false);
    if (error) {
      const msg = error.code === '23505' ? 'That IATA code already exists.' : 'Failed to save airport.';
      toast('error', msg);
    }
    else { toast('success', editingId ? 'Airport updated.' : 'Airport added.'); setIsFormOpen(false); setPage(0); fetchAirports(); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await supabase.from('airports').delete().eq('id', deleteId);
    setDeleting(false);
    setDeleteId(null);
    if (error) { toast('error', 'Failed to delete airport.'); }
    else { toast('success', 'Airport deleted.'); setPage(0); fetchAirports(); }
  };

  const filtered = airports.filter((a) =>
    [a.iata_code, a.name, a.city, a.countries?.name].some((f) =>
      (f ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    )
  );
  const sorted = [...filtered].sort((a, b) => compareRows(a, b, sort.key, sort.dir));
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div>
      <PageHeader
        title="Airports"
        badge={airports.length}
        subtitle="Manage airports used in flight route legs"
        action={<button onClick={openCreate} className={btnPrimary}><Plus className="w-4 h-4" /> Add Airport</button>}
      />
      <div className="mb-4 flex items-center justify-between gap-3">
        <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Cari IATA, nama, kota..." />
      </div>
      <TableCard>
        <table className="min-w-full">
          <THead>
            <Th sortKey="iata_code" currentSort={sort} onSort={handleSort}>IATA</Th>
            <Th sortKey="name" currentSort={sort} onSort={handleSort}>Airport Name</Th>
            <Th sortKey="city" currentSort={sort} onSort={handleSort}>City</Th>
            <Th sortKey="country" currentSort={sort} onSort={handleSort}>Country</Th>
            <Th align="right">Actions</Th>
          </THead>
          <tbody className="divide-y divide-gray-100">
            {loading ? <SkeletonRows cols={5} rows={5} /> : filtered.length === 0 ? (
              <tr><td colSpan={5}>
                {airports.length === 0 ? (
                  <EmptyState
                    icon={<PlaneTakeoff className="w-7 h-7" />}
                    title="No airports yet"
                    description="Add airports to define flight route legs."
                    action={<button onClick={openCreate} className={btnPrimary}><Plus className="w-4 h-4" /> Add Airport</button>}
                  />
                ) : (
                  <EmptyState
                    icon={<PlaneTakeoff className="w-7 h-7" />}
                    title="Tidak ada hasil"
                    description={`Tidak ada bandara yang cocok dengan "${searchQuery}".`}
                  />
                )}
              </td></tr>
            ) : paginated.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50/60 transition-colors group">
                <Td><span className="font-mono font-bold text-primary">{a.iata_code}</span></Td>
                <Td><span className="font-medium text-gray-900">{a.name}</span></Td>
                <Td><span className="text-gray-600">{a.city}</span></Td>
                <Td><span className="text-gray-600">{a.countries?.name ?? ''}</span></Td>
                <Td className="text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openEdit(a)} className={`${btnGhost} text-xs px-2 py-1`}>Edit</button>
                    <button onClick={() => setDeleteId(a.id)} className={`${btnGhost} text-red-500 hover:bg-red-50 text-xs px-2 py-1`}>Delete</button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>
      {!loading && (
        <Pagination page={page} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
      )}

      <SlideOver isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingId ? 'Edit Airport' : 'Add Airport'} subtitle="IATA code must be 3 uppercase letters."
        footer={<div className="flex gap-3"><button type="button" onClick={() => setIsFormOpen(false)} className={btnSecondary}>Cancel</button><button form="airport-form" type="submit" disabled={saving} className={btnPrimary}>{saving ? 'Saving...' : editingId ? 'Update' : 'Add Airport'}</button></div>}>
        <form id="airport-form" onSubmit={handleSave} className="space-y-5">
          <FormField label="IATA Code" required><input type="text" required maxLength={3} pattern="[A-Za-z]{3}" className={inputClass} placeholder="e.g., CGK" value={form.iata_code} onChange={(e) => setForm({ ...form, iata_code: e.target.value })} /></FormField>
          <FormField label="Airport Name" required><input type="text" required className={inputClass} placeholder="e.g., Soekarno-Hatta International" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormField>
          <FormField label="City" required><input type="text" required className={inputClass} placeholder="e.g., Jakarta" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></FormField>
          <FormField label="Country" required>
            <CountrySelect
              value={form.country_id}
              onChange={(id) => setForm({ ...form, country_id: id })}
              required
            />
          </FormField>
        </form>
      </SlideOver>

      <ConfirmDialog isOpen={!!deleteId} title="Delete Airport" message="This airport will be permanently removed. Flight routes referencing it may be affected." confirmLabel="Delete" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={deleting} />
    </div>
  );
};

export default Airports;
