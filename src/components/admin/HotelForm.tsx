import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { FormField, inputClass, selectClass, btnPrimary, btnSecondary, useToast } from './ui';
import CountrySelect from './CountrySelect';

interface RoomTypeRow { name: string; capacity: number; }
interface HotelRow { id: string; name: string; location: string; stars: number; }
interface HotelFormData {
  name: string; location: string; stars: number;
  room_types: RoomTypeRow[]; maps_url: string; country_id: string;
}

interface Props {
  editingId?: string | null;
  initialData?: HotelFormData;
  onSaved: (row: HotelRow) => void;
  onCancel: () => void;
  formId?: string;
}

const DEFAULT_ROOM_TYPES: RoomTypeRow[] = [
  { name: 'Quad', capacity: 4 },
  { name: 'Triple', capacity: 3 },
  { name: 'Double', capacity: 2 },
];

const EMPTY: HotelFormData = { name: '', location: '', stars: 3, room_types: DEFAULT_ROOM_TYPES, maps_url: '', country_id: '' };

const HotelForm: React.FC<Props> = ({ editingId, initialData, onSaved, onCancel, formId = 'hotel-form' }) => {
  const toast = useToast();
  const [form, setForm] = useState<HotelFormData>(initialData ?? EMPTY);
  const [saving, setSaving] = useState(false);

  const addRoomType = () => setForm(f => ({ ...f, room_types: [...f.room_types, { name: '', capacity: 2 }] }));
  const updateRoomType = (i: number, field: keyof RoomTypeRow, value: string | number) =>
    setForm(f => { const rt = [...f.room_types]; rt[i] = { ...rt[i], [field]: value }; return { ...f, room_types: rt }; });
  const removeRoomType = (i: number) => setForm(f => ({ ...f, room_types: f.room_types.filter((_, idx) => idx !== i) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name.trim(), location: form.location.trim(), stars: form.stars,
      room_types: form.room_types, maps_url: form.maps_url || null, country_id: form.country_id || null,
    };
    if (editingId) {
      const { error } = await supabase.from('hotels').update(payload).eq('id', editingId);
      setSaving(false);
      if (error) { toast('error', 'Failed to save hotel.'); return; }
      toast('success', 'Hotel updated.');
      onSaved({ id: editingId, name: payload.name, location: payload.location, stars: payload.stars });
    } else {
      const { data, error } = await supabase.from('hotels').insert([payload]).select().single();
      setSaving(false);
      if (error) { toast('error', 'Failed to save hotel.'); return; }
      toast('success', 'Hotel added.');
      onSaved(data as HotelRow);
    }
  };

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-5">
      <FormField label="Hotel Name" required>
        <input type="text" required className={inputClass} placeholder="e.g., Hilton Makkah"
          value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
      </FormField>
      <FormField label="Location" required>
        <input type="text" required className={inputClass} placeholder="e.g., Makkah, Saudi Arabia"
          value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
      </FormField>
      <FormField label="Star Rating">
        <select className={selectClass} value={form.stars} onChange={e => setForm(f => ({ ...f, stars: +e.target.value }))}>
          {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Bintang</option>)}
        </select>
      </FormField>
      <FormField label="Country">
        <CountrySelect value={form.country_id} onChange={v => setForm(f => ({ ...f, country_id: v }))} />
      </FormField>
      <FormField label="Google Maps URL" hint="Optional — link to the hotel on Google Maps">
        <input type="url" className={inputClass} placeholder="https://maps.google.com/..."
          value={form.maps_url} onChange={e => setForm(f => ({ ...f, maps_url: e.target.value }))} />
      </FormField>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Room Types</label>
        <div className="space-y-2 mb-2">
          {form.room_types.map((rt, i) => (
            <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
              <input type="text" className={`flex-1 ${inputClass}`} placeholder="Room type name" value={rt.name}
                onChange={e => updateRoomType(i, 'name', e.target.value)} />
              <input type="number" className="w-20 px-3 py-2 border border-gray-200 rounded-xl text-sm" min={1} max={10} value={rt.capacity}
                onChange={e => updateRoomType(i, 'capacity', +e.target.value)} title="Capacity (pax)" />
              <button type="button" onClick={() => removeRoomType(i)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addRoomType} className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-blue-700 transition-colors">
          <Plus className="w-4 h-4" /> Add Room Type
        </button>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className={btnSecondary}>Cancel</button>
        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving ? 'Saving...' : editingId ? 'Update Hotel' : 'Add Hotel'}
        </button>
      </div>
    </form>
  );
};

export default HotelForm;
