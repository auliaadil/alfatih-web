import React, { useEffect, useState } from 'react';
import { SectionCard, FormField, inputClass, btnPrimary, btnSecondary } from '../ui';
import { supabase } from '../../../lib/supabase';
import { RoomOption } from '../../../../types';
import { WizardDraft } from '../../../pages/admin/PackageWizard';

interface HotelWithRooms {
  id: string;
  name: string;
  location: string;
  stars: number;
  room_types: { name: string; capacity: number }[];
}

interface Props {
  draft: WizardDraft;
  updateDraft: (p: Partial<WizardDraft>) => void;
  onNext: () => void;
  onBack: () => void;
}

const Step3PricingRooms: React.FC<Props> = ({ draft, updateDraft, onNext, onBack }) => {
  const [hotels, setHotels] = useState<HotelWithRooms[]>([]);

  useEffect(() => {
    if (draft.hotel_ids.length === 0) {
      setHotels([]);
      return;
    }
    supabase
      .from('hotels')
      .select('id, name, location, stars, room_types')
      .in('id', draft.hotel_ids)
      .then(({ data }) => {
        if (data) setHotels(data);
      });
  }, [draft.hotel_ids]);

  const isChecked = (hotelId: string, roomName: string) =>
    draft.room_options.some((r) => r.hotel_id === hotelId && r.name === roomName);

  const getOption = (hotelId: string, roomName: string): RoomOption | undefined =>
    draft.room_options.find((r) => r.hotel_id === hotelId && r.name === roomName);

  const toggleRoom = (
    hotel: HotelWithRooms,
    room: { name: string; capacity: number },
    checked: boolean
  ) => {
    if (checked) {
      updateDraft({
        room_options: [
          ...draft.room_options,
          { hotel_id: hotel.id, name: room.name, capacity: room.capacity, price: 0 },
        ],
      });
    } else {
      updateDraft({
        room_options: draft.room_options.filter(
          (r) => !(r.hotel_id === hotel.id && r.name === room.name)
        ),
      });
    }
  };

  const updatePrice = (
    hotelId: string,
    roomName: string,
    field: 'price' | 'original_price',
    value: number
  ) => {
    updateDraft({
      room_options: draft.room_options.map((r) =>
        r.hotel_id === hotelId && r.name === roomName ? { ...r, [field]: value } : r
      ),
    });
  };

  return (
    <div className="space-y-6">
      <SectionCard title="Step 3 of 4 — Pricing & Rooms">
        <div className="space-y-6 p-6">

          {/* Participant Quota */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Participant Quota</h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Total Quota">
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={draft.quotas || ''}
                  placeholder="e.g., 100"
                  onChange={(e) => updateDraft({ quotas: parseInt(e.target.value) || 0 })}
                />
              </FormField>
              <FormField label="Remaining Quota" hint="Auto-updated by orders. Edit only to correct.">
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={draft.available_quotas || ''}
                  placeholder="Same as total for new"
                  onChange={(e) => updateDraft({ available_quotas: parseInt(e.target.value) || 0 })}
                />
              </FormField>
            </div>
          </div>

          {/* Room Options */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-1">Room Options</h3>
            <p className="text-xs text-gray-400 mb-3">
              Check rooms to include in this package and set the price per person.
            </p>

            {draft.hotel_ids.length === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                ⚠️ No hotels selected. Go back to Step 2 to add hotels.
              </div>
            )}

            {hotels.map((hotel) => (
              <div key={hotel.id} className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-gray-700">{hotel.name}</span>
                  <span className="text-xs text-amber-400">{'★'.repeat(hotel.stars)}</span>
                  <span className="text-xs text-gray-400">· {hotel.location}</span>
                </div>
                {(hotel.room_types ?? []).length === 0 ? (
                  <p className="text-xs text-gray-400">No room types defined for this hotel yet.</p>
                ) : (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    {(hotel.room_types ?? []).map((room) => {
                      const checked = isChecked(hotel.id, room.name);
                      const opt = getOption(hotel.id, room.name);
                      return (
                        <div
                          key={room.name}
                          className={`grid grid-cols-[20px_1fr_80px_130px_130px] gap-3 items-center px-4 py-3 border-b border-gray-100 last:border-b-0 transition-colors ${
                            checked ? 'bg-green-50' : 'bg-white opacity-70'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => toggleRoom(hotel, room, e.target.checked)}
                            className="w-4 h-4 accent-green-500"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-800">{room.name}</p>
                            <p className="text-xs text-gray-400">{room.capacity} pax / kamar</p>
                          </div>
                          <span className="text-xs text-gray-500 text-center">{room.capacity} pax</span>
                          <div>
                            <p className="text-[10px] text-gray-500 mb-1">Harga (Rp)</p>
                            <input
                              type="number"
                              min={0}
                              disabled={!checked}
                              className={inputClass + ' text-sm'}
                              placeholder="0"
                              value={opt?.price || ''}
                              onChange={(e) =>
                                updatePrice(hotel.id, room.name, 'price', parseInt(e.target.value) || 0)
                              }
                            />
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-500 mb-1">Harga Coret (opsional)</p>
                            <input
                              type="number"
                              min={0}
                              disabled={!checked}
                              className={inputClass + ' text-sm'}
                              placeholder="—"
                              value={opt?.original_price || ''}
                              onChange={(e) =>
                                updatePrice(
                                  hotel.id,
                                  room.name,
                                  'original_price',
                                  parseInt(e.target.value) || 0
                                )
                              }
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </SectionCard>

      <div className="flex justify-between">
        <button type="button" onClick={onBack} className={btnSecondary}>← Back</button>
        <button type="button" onClick={onNext} className={btnPrimary}>Next: Itinerary & Terms →</button>
      </div>
    </div>
  );
};

export default Step3PricingRooms;
