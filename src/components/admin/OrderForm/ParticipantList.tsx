// src/components/admin/OrderForm/ParticipantList.tsx
import React, { useState } from 'react';
import { Plus, Pencil, Trash2, User } from 'lucide-react';
import type { RoomOption } from '../../../../types';
import type { ParticipantDraft } from './types';
import ParticipantEditor from './ParticipantEditor';

interface Props {
  participants: ParticipantDraft[];
  roomOptions: RoomOption[];
  orphans: string[];
  disabled: boolean;               // no package selected / no room options
  onUpsert: (draft: ParticipantDraft, index: number | null) => void;
  onRemove: (index: number) => void;
}

const GenderAvatar: React.FC<{ gender: ParticipantDraft['gender'] }> = ({ gender }) => {
  const map = {
    male: 'bg-blue-100 text-blue-600',
    female: 'bg-pink-100 text-pink-600',
    '': 'bg-gray-100 text-gray-400',
  } as const;
  return (
    <span className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${map[gender]}`}>
      <User className="w-3.5 h-3.5" />
    </span>
  );
};

const ParticipantList: React.FC<Props> = ({
  participants, roomOptions, orphans, disabled, onUpsert, onRemove,
}) => {
  // null = closed, -1 = adding new, >=0 = editing that index
  const [editing, setEditing] = useState<number | null>(null);

  const handleSave = (draft: ParticipantDraft) => {
    onUpsert(draft, editing === -1 ? null : editing);
    setEditing(null);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">
          Participants <span className="text-gray-400 font-normal">({participants.length})</span>
        </h3>
        <button type="button" disabled={disabled || editing !== null}
          onClick={() => setEditing(-1)}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-primary hover:bg-blue-700 rounded-lg disabled:opacity-50">
          <Plus className="w-4 h-4" /> Add participant
        </button>
      </div>

      {participants.length === 0 && editing !== -1 && (
        <p className="text-sm text-gray-400 text-center py-6 border border-dashed border-gray-200 rounded-lg">
          {disabled ? 'Select a package first.' : 'No participants yet.'}
        </p>
      )}

      <div className="space-y-2">
        {participants.map((p, i) =>
          editing === i ? (
            <ParticipantEditor key={p.id ?? i} initial={p} roomOptions={roomOptions}
              onSave={handleSave} onCancel={() => setEditing(null)} />
          ) : (
            <div key={p.id ?? i}
              className="flex items-center gap-3 px-3 py-2.5 border border-gray-100 rounded-lg">
              <GenderAvatar gender={p.gender} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{p.name}</p>
                <p className="text-xs text-gray-400 truncate">
                  {p.identity_number || 'No NIK'} · {p.passport_number || 'No passport'}
                </p>
              </div>
              {!p.room_type || orphans.includes(p.room_type) ? (
                <span className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-md">
                  {p.room_type ? `${p.room_type} — unavailable` : 'No tier'}
                </span>
              ) : (
                <span className="text-xs bg-blue-50 text-primary px-2 py-1 rounded-md">{p.room_type}</span>
              )}
              <button type="button" onClick={() => setEditing(i)}
                className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-md">
                <Pencil className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => onRemove(i)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ),
        )}

        {editing === -1 && (
          <ParticipantEditor roomOptions={roomOptions}
            onSave={handleSave} onCancel={() => setEditing(null)} />
        )}
      </div>
    </div>
  );
};

export default ParticipantList;
