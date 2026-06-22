import React, { useEffect, useState, useCallback } from 'react';
import { Pencil, Pause, Play, Trash2, Target, Plus } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import {
  TableCard, THead, Th, Td, SkeletonRows, EmptyState,
  ConfirmDialog, btnGhost, btnPrimary, useToast,
} from '../ui';
import { Watchlist } from './types';
import WatchlistForm from './WatchlistForm';

const formatIDR = (n: number) => 'Rp ' + new Intl.NumberFormat('id-ID').format(n);

const formatRelative = (ts: string | null): string => {
  if (!ts) return '—';
  const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
  if (mins < 60) return `${mins}m lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}j lalu`;
  return `${Math.floor(hrs / 24)}h lalu`;
};

const WatchlistTable: React.FC = () => {
  const toast = useToast();
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Watchlist | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Watchlist | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchWatchlists = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('watchlists')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setWatchlists(data as Watchlist[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchWatchlists(); }, [fetchWatchlists]);

  const openCreate = () => { setEditing(null); setIsFormOpen(true); };
  const openEdit = (w: Watchlist) => { setEditing(w); setIsFormOpen(true); };

  const toggleActive = async (w: Watchlist) => {
    const { error } = await supabase
      .from('watchlists').update({ is_active: !w.is_active }).eq('id', w.id);
    if (error) toast('error', 'Gagal mengubah status.');
    else {
      toast('success', w.is_active ? 'Watchlist dijeda.' : 'Watchlist diaktifkan.');
      fetchWatchlists();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { count } = await supabase
      .from('deal_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('watchlist_id', deleteTarget.id);

    const { error } = count && count > 0
      ? await supabase.from('watchlists').update({ is_active: false }).eq('id', deleteTarget.id)
      : await supabase.from('watchlists').delete().eq('id', deleteTarget.id);

    setDeleting(false);
    setDeleteTarget(null);
    if (error) toast('error', 'Gagal menghapus watchlist.');
    else toast('success', count && count > 0 ? 'Watchlist dijeda (ada deal terkait).' : 'Watchlist dihapus.');
    fetchWatchlists();
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={openCreate} className={btnPrimary}>
          <Plus className="w-4 h-4" /> Tambah Watchlist
        </button>
      </div>

      <TableCard>
        <table className="w-full">
          <THead>
            <Th>Rute</Th>
            <Th>Rentang Tanggal</Th>
            <Th>Harga Maks</Th>
            <Th>Dewasa</Th>
            <Th>Terakhir Dicek</Th>
            <Th>Status</Th>
            <Th align="right">Aksi</Th>
          </THead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <SkeletonRows rows={3} cols={7} />
            ) : watchlists.length === 0 ? (
              <tr><td colSpan={7}>
                <EmptyState
                  icon={<Target className="w-8 h-8" />}
                  title="Belum ada watchlist"
                  description="Tambahkan watchlist untuk mulai memantau harga tiket."
                  action={
                    <button onClick={openCreate} className={btnPrimary}>
                      <Plus className="w-4 h-4" /> Tambah Watchlist
                    </button>
                  }
                />
              </td></tr>
            ) : watchlists.map(w => (
              <tr key={w.id} className="hover:bg-gray-50/60 transition-colors">
                <Td><span className="font-semibold text-gray-900">{w.origin} → {w.destination}</span></Td>
                <Td className="text-gray-500">{w.date_range_start} – {w.date_range_end}</Td>
                <Td>{formatIDR(w.target_price_max)}</Td>
                <Td>{w.adults}</Td>
                <Td className="text-gray-400 text-xs">{formatRelative(w.last_checked_at)}</Td>
                <Td>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    w.is_active
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-gray-100 text-gray-500 border-gray-200'
                  }`}>
                    {w.is_active ? 'Aktif' : 'Dijeda'}
                  </span>
                </Td>
                <Td className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(w)} className={btnGhost} title="Edit">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => toggleActive(w)} className={btnGhost}
                      title={w.is_active ? 'Jeda' : 'Aktifkan'}>
                      {w.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => setDeleteTarget(w)}
                      className={`${btnGhost} hover:text-red-500 hover:bg-red-50`}
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>

      <WatchlistForm
        isOpen={isFormOpen}
        editing={editing}
        onClose={() => setIsFormOpen(false)}
        onSaved={fetchWatchlists}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Hapus Watchlist?"
        message={`Watchlist ${deleteTarget?.origin} → ${deleteTarget?.destination} akan dihapus. Jika sudah ada deal alert, watchlist hanya akan dijeda.`}
        confirmLabel="Hapus"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </>
  );
};

export default WatchlistTable;
