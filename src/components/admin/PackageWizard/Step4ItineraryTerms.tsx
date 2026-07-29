import React, { useState } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import { SectionCard, btnPrimary, btnSecondary } from '../ui';
import RichTextInput from '../RichTextInput';
import { supabase } from '../../../lib/supabase';
import { DayItinerary } from '../../../../types';
import { WizardDraft } from '../../../pages/admin/PackageWizard';
import {
  generateItinerary,
  generateIncluded,
  generateNotIncluded,
  PackageContentContext,
} from '../../../../services/packageContentService';

interface Props {
  draft: WizardDraft;
  updateDraft: (p: Partial<WizardDraft>) => void;
  onBack: () => void;
  onSave: () => void;
  saving: boolean;
}

const Step4ItineraryTerms: React.FC<Props> = ({ draft, updateDraft, onBack, onSave, saving }) => {
  const [genItinerary, setGenItinerary] = useState(false);
  const [genIncluded, setGenIncluded] = useState(false);
  const [genNotIncluded, setGenNotIncluded] = useState(false);

  const buildContext = async (): Promise<PackageContentContext> => {
    const [airlinesRes, hotelsRes, airportsRes] = await Promise.all([
      supabase.from('airlines').select('id, name').in('id', draft.airline_ids),
      supabase.from('hotels').select('id, name').in('id', draft.hotel_ids),
      supabase.from('airports').select('id, iata_code'),
    ]);
    const airlineMap = Object.fromEntries(
      (airlinesRes.data ?? []).map((a: { id: string; name: string }) => [a.id, a.name])
    );
    const hotelMap = Object.fromEntries(
      (hotelsRes.data ?? []).map((h: { id: string; name: string }) => [h.id, h.name])
    );
    const airportMap = Object.fromEntries(
      (airportsRes.data ?? []).map((a: { id: string; iata_code: string }) => [a.id, a.iata_code])
    );
    const routes = draft.flight_routes
      .map((r) => {
        const name = airlineMap[r.airline_id] ?? '';
        const legs = r.legs
          .map(
            (l) =>
              `${airportMap[l.from_airport_id] ?? '?'} → ${airportMap[l.to_airport_id] ?? '?'}`
          )
          .join(', ');
        return legs ? `${name}: ${legs}` : name;
      })
      .join(' | ');
    const daysCount =
      draft.departure_date && draft.arrival_date
        ? Math.round(
            (new Date(draft.arrival_date).getTime() - new Date(draft.departure_date).getTime()) /
              86400000
          ) + 1
        : 0;
    return {
      title: draft.title,
      category: draft.category,
      duration: daysCount > 0 ? `${daysCount} Hari` : '',
      airline_names: draft.airline_ids.map((id) => airlineMap[id]).filter(Boolean) as string[],
      hotel_names: draft.hotel_ids.map((id) => hotelMap[id]).filter(Boolean) as string[],
      routes,
      description: draft.description,
    };
  };

  const handleGenItinerary = async () => {
    if (draft.itinerary.length > 0 && !window.confirm('Replace current itinerary with AI output?')) return;
    setGenItinerary(true);
    try {
      updateDraft({ itinerary: await generateItinerary(await buildContext()) });
    } catch (err) {
      console.error('Itinerary generation failed:', err);
    } finally {
      setGenItinerary(false);
    }
  };

  const handleGenIncluded = async () => {
    if (draft.included.length > 0 && !window.confirm('Replace current list with AI output?')) return;
    setGenIncluded(true);
    try {
      updateDraft({ included: await generateIncluded(await buildContext()) });
    } catch (err) {
      console.error('Included generation failed:', err);
    } finally {
      setGenIncluded(false);
    }
  };

  const handleGenNotIncluded = async () => {
    if (draft.not_included.length > 0 && !window.confirm('Replace current list with AI output?')) return;
    setGenNotIncluded(true);
    try {
      updateDraft({ not_included: await generateNotIncluded(await buildContext()) });
    } catch (err) {
      console.error('Not-included generation failed:', err);
    } finally {
      setGenNotIncluded(false);
    }
  };

  const updateDay = (i: number, partial: Partial<DayItinerary>) =>
    updateDraft({
      itinerary: draft.itinerary.map((d, idx) => (idx === i ? { ...d, ...partial } : d)),
    });

  const addActivity = (dayIdx: number) =>
    updateDay(dayIdx, { activities: [...(draft.itinerary[dayIdx].activities ?? []), ''] });

  const updateActivity = (dayIdx: number, actIdx: number, value: string) => {
    const activities = [...(draft.itinerary[dayIdx].activities ?? [])];
    activities[actIdx] = value;
    updateDay(dayIdx, { activities });
  };

  const removeActivity = (dayIdx: number, actIdx: number) =>
    updateDay(dayIdx, {
      activities: (draft.itinerary[dayIdx].activities ?? []).filter((_, i) => i !== actIdx),
    });

  const addDay = () =>
    updateDraft({
      itinerary: [
        ...draft.itinerary,
        { day: draft.itinerary.length + 1, title: '', activities: [''] },
      ],
    });

  const removeDay = (i: number) =>
    updateDraft({
      itinerary: draft.itinerary
        .filter((_, idx) => idx !== i)
        .map((d, idx) => ({ ...d, day: idx + 1 })),
    });

  const updateListItem = (list: 'included' | 'not_included', i: number, value: string) => {
    const arr = [...draft[list]];
    arr[i] = value;
    updateDraft({ [list]: arr });
  };

  const addListItem = (list: 'included' | 'not_included') =>
    updateDraft({ [list]: [...draft[list], ''] });

  const removeListItem = (list: 'included' | 'not_included', i: number) =>
    updateDraft({ [list]: draft[list].filter((_, idx) => idx !== i) });

  const GenBtn: React.FC<{ loading: boolean; onClick: () => void }> = ({ loading, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-green-100 disabled:opacity-50 whitespace-nowrap"
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : null} Generate
    </button>
  );

  return (
    <div className="space-y-6">
      <SectionCard title="Step 4 of 4 — Itinerary & Terms">
        <div className="space-y-8 p-6">

          {/* Itinerary */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Itinerary</h3>
                <p className="text-xs text-gray-400 mt-0.5">Day-by-day program.</p>
              </div>
              <GenBtn loading={genItinerary} onClick={handleGenItinerary} />
            </div>
            <div className="space-y-3">
              {draft.itinerary.map((day, di) => (
                <div key={day.day} className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                    <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                      Hari {day.day}
                    </span>
                    <RichTextInput
                      className="flex-1 text-sm font-medium"
                      placeholder="Day title..."
                      value={day.title}
                      onChange={(v) => updateDay(di, { title: v })}
                    />
                    <button
                      type="button"
                      onClick={() => removeDay(di)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-3 space-y-2">
                    {(day.activities ?? []).map((act, ai) => (
                      <div key={ai} className="flex items-center gap-2">
                        <span className="text-gray-300 text-xs">•</span>
                        <RichTextInput
                          className="flex-1 text-sm"
                          placeholder="Activity..."
                          value={act}
                          onChange={(v) => updateActivity(di, ai, v)}
                        />
                        <button
                          type="button"
                          onClick={() => removeActivity(di, ai)}
                          className="text-gray-300 hover:text-red-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addActivity(di)}
                      className="text-xs text-green-600 hover:underline flex items-center gap-1 ml-4"
                    >
                      <Plus className="w-3 h-3" /> Tambah aktivitas
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addDay}
                className="flex items-center gap-2 text-sm text-gray-500 border border-dashed border-gray-200 rounded-xl px-4 py-2.5 hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <Plus className="w-4 h-4" /> Tambah hari manual
              </button>
            </div>
          </div>

          {/* Included */}
          <div className="border-t border-gray-100 pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Termasuk (Included)</h3>
                <p className="text-xs text-gray-400 mt-0.5">Apa saja yang sudah termasuk dalam paket.</p>
              </div>
              <GenBtn loading={genIncluded} onClick={handleGenIncluded} />
            </div>
            <div className="space-y-2">
              {draft.included.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-green-500 text-sm font-bold shrink-0">✓</span>
                  <RichTextInput
                    className="flex-1 text-sm"
                    value={item}
                    placeholder="e.g., Tiket pesawat PP"
                    onChange={(v) => updateListItem('included', i, v)}
                  />
                  <button
                    type="button"
                    onClick={() => removeListItem('included', i)}
                    className="text-gray-300 hover:text-red-400"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addListItem('included')}
                className="text-xs text-green-600 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Tambah item
              </button>
            </div>
          </div>

          {/* Not Included */}
          <div className="border-t border-gray-100 pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Tidak Termasuk (Not Included)</h3>
                <p className="text-xs text-gray-400 mt-0.5">Biaya dan hal yang tidak tercakup.</p>
              </div>
              <GenBtn loading={genNotIncluded} onClick={handleGenNotIncluded} />
            </div>
            <div className="space-y-2">
              {draft.not_included.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-red-400 text-sm font-bold shrink-0">✗</span>
                  <RichTextInput
                    className="flex-1 text-sm"
                    value={item}
                    placeholder="e.g., Biaya pribadi"
                    onChange={(v) => updateListItem('not_included', i, v)}
                  />
                  <button
                    type="button"
                    onClick={() => removeListItem('not_included', i)}
                    className="text-gray-300 hover:text-red-400"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addListItem('not_included')}
                className="text-xs text-gray-500 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Tambah item
              </button>
            </div>
          </div>

        </div>
      </SectionCard>

      <div className="flex justify-between">
        <button type="button" onClick={onBack} className={btnSecondary}>← Back</button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className={`${btnPrimary} disabled:opacity-50`}
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Saving...</>
          ) : (
            'Save Package'
          )}
        </button>
      </div>
    </div>
  );
};

export default Step4ItineraryTerms;
