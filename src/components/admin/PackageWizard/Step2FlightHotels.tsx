import React, { useEffect, useState } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import { FormField, SectionCard, inputClass, selectClass, textareaClass, btnPrimary, btnSecondary, SlideOver, useToast } from '../ui';
import { supabase } from '../../../lib/supabase';
import { Airport } from '../../../../types';
import { WizardDraft } from '../../../pages/admin/PackageWizard';
import {
  generateDescription,
  generateFeatures,
  PackageContentContext,
} from '../../../../services/packageContentService';

interface Airline { id: string; name: string; logo_url?: string; iata_code?: string; }
interface Hotel { id: string; name: string; location: string; stars: number; }

interface Props {
  draft: WizardDraft;
  updateDraft: (p: Partial<WizardDraft>) => void;
  onNext: () => void;
  onBack: () => void;
}

const Step2FlightHotels: React.FC<Props> = ({ draft, updateDraft, onNext, onBack }) => {
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [airports, setAirports] = useState<Airport[]>([]);
  const [airlineSearch, setAirlineSearch] = useState('');
  const [hotelSearch, setHotelSearch] = useState('');
  const [genDesc, setGenDesc] = useState(false);
  const [genFeat, setGenFeat] = useState(false);

  const toast = useToast();
  const [airlineSlideOpen, setAirlineSlideOpen] = useState(false);
  const [newAirlineForm, setNewAirlineForm] = useState({ name: '', iata_code: '', logo_url: '' });
  const [savingAirline, setSavingAirline] = useState(false);

  const handleCreateAirline = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAirline(true);
    const { data, error } = await supabase
      .from('airlines')
      .insert([{
        name: newAirlineForm.name.trim(),
        iata_code: newAirlineForm.iata_code.trim().toUpperCase() || null,
        logo_url: newAirlineForm.logo_url || null,
      }])
      .select()
      .single();
    setSavingAirline(false);
    if (error) { toast('error', 'Failed to create airline.'); return; }
    const { data: fresh, error: refreshError } = await supabase.from('airlines').select('*').order('name');
    if (refreshError) { toast('error', 'Airline created but failed to refresh list. Please reload.'); return; }
    if (fresh) setAirlines(fresh);
    toast('success', 'Airline created.');
    setAirlineSlideOpen(false);
    setNewAirlineForm({ name: '', iata_code: '', logo_url: '' });
    if (data) toggleAirline(data.id);
  };

  const [hotelSlideOpen, setHotelSlideOpen] = useState(false);
  const [newHotelForm, setNewHotelForm] = useState({ name: '', location: '', stars: 4 });
  const [savingHotel, setSavingHotel] = useState(false);

  const handleCreateHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingHotel(true);
    const { data, error } = await supabase
      .from('hotels')
      .insert([{ name: newHotelForm.name.trim(), location: newHotelForm.location.trim(), stars: newHotelForm.stars }])
      .select()
      .single();
    setSavingHotel(false);
    if (error) { toast('error', 'Failed to create hotel.'); return; }
    const { data: fresh, error: refreshError } = await supabase.from('hotels').select('*').order('name');
    if (refreshError) { toast('error', 'Hotel created but failed to refresh list. Please reload.'); return; }
    if (fresh) setHotels(fresh);
    toast('success', 'Hotel created.');
    setHotelSlideOpen(false);
    setNewHotelForm({ name: '', location: '', stars: 4 });
    if (data) toggleHotel(data.id);
  };

  useEffect(() => {
    Promise.all([
      supabase.from('airlines').select('*').order('name'),
      supabase.from('hotels').select('*').order('name'),
      supabase.from('airports').select('*').order('iata_code'),
    ]).then(([a, h, ap]) => {
      if (a.data) setAirlines(a.data);
      if (h.data) setHotels(h.data);
      if (ap.data) setAirports(ap.data);
    });
  }, []);

  const toggleAirline = (id: string) => {
    const ids = draft.airline_ids.includes(id)
      ? draft.airline_ids.filter((x) => x !== id)
      : [...draft.airline_ids, id];
    const routes = ids.map(
      (aid) => draft.flight_routes.find((r) => r.airline_id === aid) ?? { airline_id: aid, legs: [] }
    );
    updateDraft({ airline_ids: ids, flight_routes: routes });
  };

  const toggleHotel = (id: string) => {
    const ids = draft.hotel_ids.includes(id)
      ? draft.hotel_ids.filter((x) => x !== id)
      : [...draft.hotel_ids, id];
    updateDraft({ hotel_ids: ids });
  };

  const addLeg = (airlineId: string) => {
    const routes = draft.flight_routes.map((r) =>
      r.airline_id === airlineId
        ? { ...r, legs: [...r.legs, { id: Date.now().toString(), from_airport_id: '', to_airport_id: '' }] }
        : r
    );
    updateDraft({ flight_routes: routes });
  };

  const removeLeg = (airlineId: string, legIdx: number) => {
    const routes = draft.flight_routes.map((r) =>
      r.airline_id === airlineId ? { ...r, legs: r.legs.filter((_, i) => i !== legIdx) } : r
    );
    updateDraft({ flight_routes: routes });
  };

  const updateLeg = (
    airlineId: string,
    legIdx: number,
    field: 'from_airport_id' | 'to_airport_id',
    value: string
  ) => {
    const routes = draft.flight_routes.map((r) => {
      if (r.airline_id !== airlineId) return r;
      const legs = [...r.legs];
      legs[legIdx] = { ...legs[legIdx], [field]: value };
      return { ...r, legs };
    });
    updateDraft({ flight_routes: routes });
  };

  const buildContext = (): PackageContentContext => {
    const airlineMap = Object.fromEntries(airlines.map((a) => [a.id, a.name]));
    const hotelMap = Object.fromEntries(hotels.map((h) => [h.id, h.name]));
    const airportMap = Object.fromEntries(airports.map((a) => [a.id, a.iata_code]));
    const routes = draft.flight_routes
      .map((r) => {
        const name = airlineMap[r.airline_id] ?? '';
        const legs = r.legs
          .map((l) => `${airportMap[l.from_airport_id] ?? '?'} → ${airportMap[l.to_airport_id] ?? '?'}`)
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

  const handleGenDescription = async () => {
    setGenDesc(true);
    try {
      updateDraft({ description: await generateDescription(buildContext()) });
    } catch (err) {
      console.error('Description generation failed:', err);
    } finally {
      setGenDesc(false);
    }
  };

  const handleGenFeatures = async () => {
    setGenFeat(true);
    try {
      updateDraft({ features: await generateFeatures(buildContext()) });
    } catch (err) {
      console.error('Features generation failed:', err);
    } finally {
      setGenFeat(false);
    }
  };

  const filteredAirlines = airlines.filter((a) =>
    a.name.toLowerCase().includes(airlineSearch.toLowerCase())
  );
  const filteredHotels = hotels.filter((h) =>
    `${h.name} ${h.location}`.toLowerCase().includes(hotelSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <SectionCard title="Step 2 of 4 — Flight & Hotels">
        <div className="space-y-6 p-6">

          {/* Airlines */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800">Airlines</h3>
              <button
                type="button"
                onClick={() => setAirlineSlideOpen(true)}
                className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3 h-3" /> New Airline
              </button>
            </div>
            <input
              type="text"
              className={inputClass + ' mb-2'}
              placeholder="Search airlines..."
              value={airlineSearch}
              onChange={(e) => setAirlineSearch(e.target.value)}
            />
            <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
              {filteredAirlines.map((airline) => {
                const checked = draft.airline_ids.includes(airline.id);
                const route = draft.flight_routes.find((r) => r.airline_id === airline.id);
                return (
                  <div key={airline.id}>
                    <label
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                        checked ? 'bg-green-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAirline(airline.id)}
                        className="w-4 h-4 accent-green-500 shrink-0"
                      />
                      <span className="text-sm font-medium text-gray-800 flex-1">{airline.name}</span>
                      {airline.iata_code && (
                        <span className="text-xs text-gray-400">{airline.iata_code}</span>
                      )}
                    </label>
                    {checked && route && (
                      <div className="px-4 pb-3 pt-2 bg-gray-50 border-t border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 mb-2">Route legs</p>
                        {route.legs.map((leg, i) => (
                          <div key={leg.id ?? i} className="flex items-center gap-2 mb-2">
                            <select
                              className={selectClass + ' flex-1'}
                              value={leg.from_airport_id}
                              onChange={(e) =>
                                updateLeg(airline.id, i, 'from_airport_id', e.target.value)
                              }
                            >
                              <option value="">From...</option>
                              {airports.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.iata_code} — {a.name}
                                </option>
                              ))}
                            </select>
                            <span className="text-gray-400">→</span>
                            <select
                              className={selectClass + ' flex-1'}
                              value={leg.to_airport_id}
                              onChange={(e) =>
                                updateLeg(airline.id, i, 'to_airport_id', e.target.value)
                              }
                            >
                              <option value="">To...</option>
                              {airports.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.iata_code} — {a.name}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => removeLeg(airline.id, i)}
                              className="text-red-400 hover:text-red-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addLeg(airline.id)}
                          className="text-xs text-green-600 font-medium flex items-center gap-1 hover:underline"
                        >
                          <Plus className="w-3 h-3" /> Add leg
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hotels */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800">Hotels</h3>
              <button
                type="button"
                onClick={() => setHotelSlideOpen(true)}
                className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3 h-3" /> New Hotel
              </button>
            </div>
            <input
              type="text"
              className={inputClass + ' mb-2'}
              placeholder="Search hotels..."
              value={hotelSearch}
              onChange={(e) => setHotelSearch(e.target.value)}
            />
            <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
              {filteredHotels.map((hotel) => {
                const checked = draft.hotel_ids.includes(hotel.id);
                return (
                  <label
                    key={hotel.id}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                      checked ? 'bg-green-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleHotel(hotel.id)}
                      className="w-4 h-4 accent-green-500 shrink-0"
                    />
                    <span className="text-sm font-medium text-gray-800 flex-1">{hotel.name}</span>
                    <span className="text-xs text-amber-500">{'★'.repeat(hotel.stars)}</span>
                    <span className="text-xs text-gray-400">{hotel.location}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <FormField label="Description">
            <div className="flex justify-end mb-1.5">
              <button
                type="button"
                onClick={handleGenDescription}
                disabled={genDesc}
                className="text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-lg flex items-center gap-1 hover:bg-green-100 disabled:opacity-50"
              >
                {genDesc ? <Loader2 className="w-3 h-3 animate-spin" /> : null} Generate
              </button>
            </div>
            <textarea
              className={textareaClass}
              rows={4}
              placeholder="Package description..."
              value={draft.description}
              onChange={(e) => updateDraft({ description: e.target.value })}
            />
          </FormField>

          {/* Features */}
          <FormField label="Features">
            <div className="flex justify-end mb-1.5">
              <button
                type="button"
                onClick={handleGenFeatures}
                disabled={genFeat}
                className="text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-lg flex items-center gap-1 hover:bg-green-100 disabled:opacity-50"
              >
                {genFeat ? <Loader2 className="w-3 h-3 animate-spin" /> : null} Generate
              </button>
            </div>
            <textarea
              className={textareaClass}
              rows={3}
              placeholder="One feature per line..."
              value={draft.features.join('\n')}
              onChange={(e) => updateDraft({ features: e.target.value.split('\n').filter(Boolean) })}
            />
            <p className="text-xs text-gray-400 mt-1">One feature per line.</p>
          </FormField>

        </div>
      </SectionCard>

      <div className="flex justify-between">
        <button type="button" onClick={onBack} className={btnSecondary}>← Back</button>
        <button type="button" onClick={onNext} className={btnPrimary}>Next: Pricing & Rooms →</button>
      </div>

      <SlideOver
        isOpen={airlineSlideOpen}
        onClose={() => setAirlineSlideOpen(false)}
        title="New Airline"
        width="sm"
        footer={
          <div className="flex gap-3">
            <button type="button" onClick={() => setAirlineSlideOpen(false)} className={btnSecondary}>
              Cancel
            </button>
            <button form="airline-create-form" type="submit" disabled={savingAirline} className={btnPrimary}>
              {savingAirline ? 'Saving...' : 'Add Airline'}
            </button>
          </div>
        }
      >
        <form id="airline-create-form" onSubmit={handleCreateAirline} className="space-y-5">
          <FormField label="Airline Name" required>
            <input
              type="text"
              required
              className={inputClass}
              placeholder="e.g., Garuda Indonesia"
              value={newAirlineForm.name}
              onChange={(e) => setNewAirlineForm({ ...newAirlineForm, name: e.target.value })}
            />
          </FormField>
          <FormField label="IATA Code" hint="2–3 letter code, e.g. GA">
            <input
              type="text"
              maxLength={3}
              className={inputClass}
              placeholder="e.g., GA"
              value={newAirlineForm.iata_code}
              onChange={(e) => setNewAirlineForm({ ...newAirlineForm, iata_code: e.target.value })}
            />
          </FormField>
          <FormField label="Logo URL" hint="Optional. Paste a direct image URL.">
            <input
              type="url"
              className={inputClass}
              placeholder="https://..."
              value={newAirlineForm.logo_url}
              onChange={(e) => setNewAirlineForm({ ...newAirlineForm, logo_url: e.target.value })}
            />
          </FormField>
        </form>
      </SlideOver>

      <SlideOver
        isOpen={hotelSlideOpen}
        onClose={() => setHotelSlideOpen(false)}
        title="New Hotel"
        width="sm"
        footer={
          <div className="flex gap-3">
            <button type="button" onClick={() => setHotelSlideOpen(false)} className={btnSecondary}>
              Cancel
            </button>
            <button form="hotel-create-form" type="submit" disabled={savingHotel} className={btnPrimary}>
              {savingHotel ? 'Saving...' : 'Add Hotel'}
            </button>
          </div>
        }
      >
        <form id="hotel-create-form" onSubmit={handleCreateHotel} className="space-y-5">
          <FormField label="Hotel Name" required>
            <input
              type="text"
              required
              className={inputClass}
              placeholder="e.g., Hilton Makkah Convention"
              value={newHotelForm.name}
              onChange={(e) => setNewHotelForm({ ...newHotelForm, name: e.target.value })}
            />
          </FormField>
          <FormField label="Location" required>
            <input
              type="text"
              required
              className={inputClass}
              placeholder="e.g., Makkah"
              value={newHotelForm.location}
              onChange={(e) => setNewHotelForm({ ...newHotelForm, location: e.target.value })}
            />
          </FormField>
          <FormField label="Stars">
            <select
              className={selectClass}
              value={newHotelForm.stars}
              onChange={(e) => setNewHotelForm({ ...newHotelForm, stars: Number(e.target.value) })}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n} Star{n > 1 ? 's' : ''}</option>
              ))}
            </select>
          </FormField>
        </form>
      </SlideOver>
    </div>
  );
};

export default Step2FlightHotels;
