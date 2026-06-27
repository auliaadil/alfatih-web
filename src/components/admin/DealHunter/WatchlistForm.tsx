import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import {
  SlideOver, FormField, inputClass, btnPrimary, btnSecondary, useToast,
} from '../ui';
import { Watchlist, WatchlistFormData, EMPTY_WATCHLIST_FORM } from './types';
import AirportSelect from '../AirportSelect';

interface Props {
  isOpen: boolean;
  editing: Watchlist | null;
  onClose: () => void;
  onSaved: () => void;
}

const WatchlistForm: React.FC<Props> = ({ isOpen, editing, onClose, onSaved }) => {
  const toast = useToast();
  const [form, setForm] = useState<WatchlistFormData>(EMPTY_WATCHLIST_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(
      editing
        ? {
            origin: editing.origin,
            destination: editing.destination,
            date_range_start: editing.date_range_start,
            date_range_end: editing.date_range_end,
            target_price_max: String(editing.target_price_max),
            adults: String(editing.adults),
          }
        : EMPTY_WATCHLIST_FORM
    );
  }, [editing, isOpen]);

  const field =
    (key: keyof WatchlistFormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const origin = form.origin.toUpperCase().trim();
    const destination = form.destination.toUpperCase().trim();
    const price = parseFloat(form.target_price_max);
    const adults = parseInt(form.adults, 10);

    if (!origin) { toast('error', 'Bandara asal wajib dipilih.'); return; }
    if (!destination) { toast('error', 'Bandara tujuan wajib dipilih.'); return; }
    if (origin === destination) { toast('error', 'Origin dan destination tidak boleh sama.'); return; }
    if (!form.date_range_start || !form.date_range_end) { toast('error', 'Tanggal wajib diisi.'); return; }
    if (form.date_range_end < form.date_range_start) { toast('error', 'Tanggal akhir harus setelah tanggal awal.'); return; }
    if (!price || price <= 0) { toast('error', 'Harga maks harus lebih dari 0.'); return; }

    setSaving(true);
    const payload = {
      origin,
      destination,
      date_range_start: form.date_range_start,
      date_range_end: form.date_range_end,
      target_price_max: price,
      adults,
    };
    const { error } = editing
      ? await supabase.from('watchlists').update(payload).eq('id', editing.id)
      : await supabase.from('watchlists').insert([payload]);
    setSaving(false);

    if (error) {
      toast('error', 'Gagal menyimpan watchlist.');
    } else {
      toast('success', editing ? 'Watchlist diperbarui.' : 'Watchlist ditambahkan.');
      onClose();
      onSaved();
    }
  };

  return (
    <SlideOver
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? 'Edit Watchlist' : 'Tambah Watchlist'}
      footer={
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className={btnSecondary}>Batal</button>
          <button type="submit" form="watchlist-form" disabled={saving} className={btnPrimary}>
            {saving ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Tambah'}
          </button>
        </div>
      }
    >
      <form id="watchlist-form" onSubmit={handleSubmit} className="space-y-5">
        <FormField label="Asal (Origin)" required>
          <AirportSelect
            value={form.origin}
            onChange={iata => setForm(f => ({ ...f, origin: iata }))}
            placeholder="Cari bandara asal..."
            exclude={form.destination}
          />
        </FormField>
        <FormField label="Tujuan (Destination)" required>
          <AirportSelect
            value={form.destination}
            onChange={iata => setForm(f => ({ ...f, destination: iata }))}
            placeholder="Cari bandara tujuan..."
            exclude={form.origin}
          />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Tanggal Mulai" required>
            <input type="date" value={form.date_range_start} onChange={field('date_range_start')}
              className={inputClass} required />
          </FormField>
          <FormField label="Tanggal Akhir" required>
            <input type="date" value={form.date_range_end} min={form.date_range_start}
              onChange={field('date_range_end')} className={inputClass} required />
          </FormField>
        </div>
        <FormField
          label="Harga Maks Total (IDR)"
          required
          hint={`Harga total untuk semua penumpang${form.adults && parseInt(form.adults) > 1 ? ` (${form.adults} dewasa)` : ''}. Contoh: 10000000`}
        >
          <input
            type="number" min={1} step={100000} placeholder="10000000"
            value={form.target_price_max} onChange={field('target_price_max')}
            className={inputClass} required
          />
        </FormField>
        <FormField label="Jumlah Dewasa" required>
          <input
            type="number" min={1} max={9}
            value={form.adults} onChange={field('adults')}
            className={inputClass} required
          />
        </FormField>
      </form>
    </SlideOver>
  );
};

export default WatchlistForm;
