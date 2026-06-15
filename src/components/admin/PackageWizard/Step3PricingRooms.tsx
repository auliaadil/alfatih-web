import React, { useEffect, useState } from 'react';
import { SectionCard, FormField, inputClass, btnPrimary, btnSecondary } from '../ui';
import { supabase } from '../../../lib/supabase';
import { WizardDraft } from '../../../pages/admin/PackageWizard';

interface UniqueRoomType {
  name: string;
  capacity: number;
}

interface Props {
  draft: WizardDraft;
  updateDraft: (p: Partial<WizardDraft>) => void;
  onNext: () => void;
  onBack: () => void;
}

const Step3PricingRooms: React.FC<Props> = ({ draft, updateDraft, onNext, onBack }) => {
  const [roomTypes, setRoomTypes] = useState<UniqueRoomType[]>([]);

  useEffect(() => {
    if (draft.hotel_ids.length === 0) {
      setRoomTypes([]);
      return;
    }
    supabase
      .from('hotels')
      .select('room_types')
      .in('id', draft.hotel_ids)
      .then(({ data, error }) => {
        if (error) {
          console.error('Failed to load hotels:', error.message);
          return;
        }
        // Collect unique room types by name across all hotels
        const seen = new Map<string, UniqueRoomType>();
        (data ?? []).forEach((hotel: { room_types: { name: string; capacity: number }[] }) => {
          (hotel.room_types ?? []).forEach((rt) => {
            if (!seen.has(rt.name)) seen.set(rt.name, { name: rt.name, capacity: rt.capacity });
          });
        });
        setRoomTypes([...seen.values()]);
      });
  }, [draft.hotel_ids]);

  const isChecked = (name: string) =>
    draft.room_options.some((r) => r.name === name);

  const getOption = (name: string) =>
    draft.room_options.find((r) => r.name === name);

  const toggleRoom = (rt: UniqueRoomType, checked: boolean) => {
    if (checked) {
      updateDraft({
        room_options: [...draft.room_options, { name: rt.name, capacity: rt.capacity, price: 0 }],
      });
    } else {
      updateDraft({ room_options: draft.room_options.filter((r) => r.name !== rt.name) });
    }
  };

  const updatePrice = (name: string, field: 'price' | 'original_price', value: number) => {
    updateDraft({
      room_options: draft.room_options.map((r) =>
        r.name === name ? { ...r, [field]: value } : r
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
              <FormField label="Quota" hint="Remaining slots auto-decrement as orders come in.">
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={draft.quotas || ''}
                  placeholder="e.g., 100"
                  onChange={(e) => updateDraft({ quotas: parseInt(e.target.value) || 0 })}
                />
              </FormField>
            </div>
          </div>

          {/* Room Options */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-1">Paket Harga per Tipe Kamar</h3>
            <p className="text-xs text-gray-400 mb-3">
              Pilih tipe kamar dan tentukan harga paket all-in per orang (termasuk hotel, penerbangan, dan fasilitas lainnya).
            </p>

            {draft.hotel_ids.length === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                ⚠️ Belum ada hotel dipilih. Kembali ke Step 2 untuk menambahkan hotel.
              </div>
            )}

            {draft.hotel_ids.length > 0 && roomTypes.length === 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-500">
                Hotel yang dipilih belum memiliki tipe kamar. Tambahkan tipe kamar di halaman Hotels terlebih dahulu.
              </div>
            )}

            {roomTypes.length > 0 && (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                {roomTypes.map((rt) => {
                  const checked = isChecked(rt.name);
                  const opt = getOption(rt.name);
                  return (
                    <div
                      key={rt.name}
                      className={`grid grid-cols-[20px_1fr_80px_150px_150px] gap-3 items-center px-4 py-3 border-b border-gray-100 last:border-b-0 transition-colors ${
                        checked ? 'bg-green-50' : 'bg-white opacity-70'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => toggleRoom(rt, e.target.checked)}
                        className="w-4 h-4 accent-green-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-800">{rt.name}</p>
                        <p className="text-xs text-gray-400">{rt.capacity} pax / kamar</p>
                      </div>
                      <span className="text-xs text-gray-500 text-center">{rt.capacity} pax</span>
                      <div>
                        <p className="text-[10px] text-gray-500 mb-1">Harga All-In (Rp)</p>
                        <input
                          type="number"
                          min={0}
                          disabled={!checked}
                          className={inputClass + ' text-sm'}
                          placeholder="0"
                          value={opt?.price || ''}
                          onChange={(e) =>
                            updatePrice(rt.name, 'price', parseInt(e.target.value) || 0)
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
                            updatePrice(rt.name, 'original_price', parseInt(e.target.value) || 0)
                          }
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
