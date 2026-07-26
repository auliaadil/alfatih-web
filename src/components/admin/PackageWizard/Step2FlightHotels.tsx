import React, { useEffect, useState } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import { FormField, SectionCard, inputClass, textareaClass, btnPrimary, btnSecondary, SlideOver, useToast } from '../ui';
import { supabase } from '../../../lib/supabase';
import { Airport } from '../../../../types';
import { WizardDraft } from '../../../pages/admin/PackageWizard';
import AirportSelect, { AirportRow } from '../AirportSelect';
import CountrySelect from '../CountrySelect';
import AirlineForm from '../AirlineForm';
import HotelForm from '../HotelForm';
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
  onSave?: () => void;
  saving?: boolean;
}

const Step2FlightHotels: React.FC<Props> = ({ draft, updateDraft, onNext, onBack, onSave, saving }) => {
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [airports, setAirports] = useState<Airport[]>([]);
  const [airlineSearch, setAirlineSearch] = useState('');
  const [hotelSearch, setHotelSearch] = useState('');
  const [genDesc, setGenDesc] = useState(false);
  const [genFeat, setGenFeat] = useState(false);

  const toast = useToast();
  const [airlineSlideOpen, setAirlineSlideOpen] = useState(false);
  const [hotelSlideOpen, setHotelSlideOpen] = useState(false);

  const [airportSlideOpen, setAirportSlideOpen] = useState(false);
  const [newAirportForm, setNewAirportForm] = useState({ iata_code: '', name: '', city: '', country_id: '' });
  const [savingAirport, setSavingAirport] = useState(false);

  const handleCreateAirport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAirport(true);
    const { error } = await supabase
      .from('airports')
      .insert([{
        iata_code: newAirportForm.iata_code.trim().toUpperCase(),
        name: newAirportForm.name.trim(),
        city: newAirportForm.city.trim(),
        country_id: newAirportForm.country_id,
      }]);
    setSavingAirport(false);
    if (error) {
      toast('error', error.code === '23505' ? 'Airport code already exists.' : 'Failed to create airport.');
      return;
    }
    const { data: fresh, error: refreshError } = await supabase
      .from('airports').select('*, countries(name)').order('iata_code');
    if (refreshError) { toast('error', 'Airport created but failed to refresh list. Please reload.'); return; }
    if (fresh) setAirports(fresh as Airport[]);
    toast('success', 'Airport created. Select it in a route leg below.');
    setAirportSlideOpen(false);
    setNewAirportForm({ iata_code: '', name: '', city: '', country_id: '' });
  };

  useEffect(() => {
    Promise.all([
      supabase.from('airlines').select('*').order('name'),
      supabase.from('hotels').select('*').order('name'),
      supabase.from('airports').select('*, countries(name)').order('iata_code'),
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
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-gray-500">Route legs</p>
                          <button
                            type="button"
                            onClick={() => setAirportSlideOpen(true)}
                            className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
                          >
                            <Plus className="w-3 h-3" /> New Airport
                          </button>
                        </div>
                        {route.legs.map((leg, i) => (
                          <div key={leg.id ?? i} className="flex items-center gap-2 mb-2">
                            <div className="flex-1">
                              <AirportSelect
                                valueKey="id"
                                airports={airports as AirportRow[]}
                                value={leg.from_airport_id}
                                onChange={v => updateLeg(airline.id, i, 'from_airport_id', v)}
                                placeholder="Dari..."
                              />
                            </div>
                            <span className="text-gray-400 shrink-0">→</span>
                            <div className="flex-1">
                              <AirportSelect
                                valueKey="id"
                                airports={airports as AirportRow[]}
                                value={leg.to_airport_id}
                                onChange={v => updateLeg(airline.id, i, 'to_airport_id', v)}
                                placeholder="Ke..."
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeLeg(airline.id, i)}
                              className="text-red-400 hover:text-red-600 shrink-0"
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
        <div className="flex gap-2">
          {onSave && (
            <button type="button" onClick={onSave} disabled={saving} className={`${btnSecondary} disabled:opacity-50`}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          )}
          <button type="button" onClick={onNext} className={btnPrimary}>Next: Pricing & Rooms →</button>
        </div>
      </div>

      <SlideOver
        isOpen={airlineSlideOpen}
        onClose={() => setAirlineSlideOpen(false)}
        title="New Airline"
        width="sm"
      >
        <AirlineForm
          onSaved={(airline) => {
            setAirlines(prev => [...prev, { id: airline.id, name: airline.name, logo_url: airline.logo_url ?? undefined, iata_code: undefined }]);
            toggleAirline(airline.id);
            setAirlineSlideOpen(false);
          }}
          onCancel={() => setAirlineSlideOpen(false)}
        />
      </SlideOver>

      <SlideOver
        isOpen={hotelSlideOpen}
        onClose={() => setHotelSlideOpen(false)}
        title="New Hotel"
        width="sm"
      >
        <HotelForm
          onSaved={(hotel) => {
            setHotels(prev => [...prev, { id: hotel.id, name: hotel.name, location: hotel.location, stars: hotel.stars }]);
            toggleHotel(hotel.id);
            setHotelSlideOpen(false);
          }}
          onCancel={() => setHotelSlideOpen(false)}
        />
      </SlideOver>

      <SlideOver
        isOpen={airportSlideOpen}
        onClose={() => setAirportSlideOpen(false)}
        title="New Airport"
        subtitle="After saving, the airport appears in all leg dropdowns."
        width="sm"
        footer={
          <div className="flex gap-3">
            <button type="button" onClick={() => setAirportSlideOpen(false)} className={btnSecondary}>
              Cancel
            </button>
            <button form="airport-create-form" type="submit" disabled={savingAirport} className={btnPrimary}>
              {savingAirport ? 'Saving...' : 'Add Airport'}
            </button>
          </div>
        }
      >
        <form id="airport-create-form" onSubmit={handleCreateAirport} className="space-y-5">
          <FormField label="IATA Code" required hint="3-letter code, e.g. CGK">
            <input
              type="text"
              required
              maxLength={3}
              className={inputClass}
              placeholder="e.g., CGK"
              value={newAirportForm.iata_code}
              onChange={(e) => setNewAirportForm({ ...newAirportForm, iata_code: e.target.value.toUpperCase() })}
            />
          </FormField>
          <FormField label="Airport Name" required>
            <input
              type="text"
              required
              className={inputClass}
              placeholder="e.g., Soekarno-Hatta International Airport"
              value={newAirportForm.name}
              onChange={(e) => setNewAirportForm({ ...newAirportForm, name: e.target.value })}
            />
          </FormField>
          <FormField label="City" required>
            <input
              type="text"
              required
              className={inputClass}
              placeholder="e.g., Tangerang"
              value={newAirportForm.city}
              onChange={(e) => setNewAirportForm({ ...newAirportForm, city: e.target.value })}
            />
          </FormField>
          <FormField label="Country" required>
            <CountrySelect
              value={newAirportForm.country_id}
              onChange={(id) => setNewAirportForm(f => ({ ...f, country_id: id }))}
              required
            />
          </FormField>
        </form>
      </SlideOver>
    </div>
  );
};

export default Step2FlightHotels;
