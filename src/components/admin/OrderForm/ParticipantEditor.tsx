// src/components/admin/OrderForm/ParticipantEditor.tsx
import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import type { RoomOption } from '../../../../types';
import type { Gender, ParticipantDraft } from './types';
import { inputClass, selectClass } from '../ui';

interface Props {
  initial?: ParticipantDraft;
  roomOptions: RoomOption[];
  onSave: (draft: ParticipantDraft) => void;
  onCancel: () => void;
}

const EMPTY: ParticipantDraft = {
  name: '', gender: '', room_type: '',
  identity_number: '', passport_number: '', phone: '', address: '',
};

const ParticipantEditor: React.FC<Props> = ({ initial, roomOptions, onSave, onCancel }) => {
  const [draft, setDraft] = useState<ParticipantDraft>(initial ?? EMPTY);
  const [error, setError] = useState('');

  const set = (patch: Partial<ParticipantDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const handleSave = () => {
    if (!draft.name.trim()) return setError('Name is required.');
    if (draft.gender !== 'male' && draft.gender !== 'female') return setError('Gender is required.');
    if (!draft.room_type) return setError('Room type is required.');
    setError('');
    onSave({ ...draft, name: draft.name.trim() });
  };

  return (
    <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4">
      <p className="text-xs font-semibold text-primary mb-3">
        {initial ? 'Edit participant' : 'New participant'}
      </p>
      {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <input className={inputClass} placeholder="Full name" value={draft.name}
            onChange={(e) => set({ name: e.target.value })} />
        </div>

        <select className={selectClass} value={draft.gender}
          onChange={(e) => set({ gender: e.target.value as Gender | '' })}>
          <option value="" disabled>Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>

        <select className={selectClass} value={draft.room_type}
          onChange={(e) => set({ room_type: e.target.value })}>
          <option value="" disabled>Room type</option>
          {roomOptions.map((r) => (
            <option key={r.name} value={r.name}>
              {r.name} · {r.capacity} pax · Rp {r.price.toLocaleString('id-ID')}
            </option>
          ))}
        </select>

        <input className={inputClass} placeholder="NIK (optional)" value={draft.identity_number}
          onChange={(e) => set({ identity_number: e.target.value })} />
        <input className={inputClass} placeholder="Passport (optional)" value={draft.passport_number}
          onChange={(e) => set({ passport_number: e.target.value })} />
        <input className={inputClass} placeholder="Phone (optional)" value={draft.phone}
          onChange={(e) => set({ phone: e.target.value })} />
        <input className={inputClass} placeholder="Address (optional)" value={draft.address}
          onChange={(e) => set({ address: e.target.value })} />
      </div>

      <div className="flex justify-end gap-2 mt-3">
        <button type="button" onClick={onCancel}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">
          <X className="w-4 h-4" /> Cancel
        </button>
        <button type="button" onClick={handleSave}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-primary hover:bg-blue-700 rounded-lg">
          <Check className="w-4 h-4" /> Save participant
        </button>
      </div>
    </div>
  );
};

export default ParticipantEditor;
