import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';

export interface AirportRow {
  id: string;
  iata_code: string;
  name: string;
  city: string;
  countries?: { name: string } | null;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  exclude?: string;
  /** Which field the value/onChange represent. Default: 'iata_code' */
  valueKey?: 'id' | 'iata_code';
  /** Pre-fetched airport list. If omitted, the component fetches its own. */
  airports?: AirportRow[];
}

const AirportSelect: React.FC<Props> = ({
  value,
  onChange,
  placeholder = 'Cari bandara...',
  exclude,
  valueKey = 'iata_code',
  airports: airportsProp,
}) => {
  const [internalAirports, setInternalAirports] = useState<AirportRow[]>([]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const airports = airportsProp ?? internalAirports;

  useEffect(() => {
    if (airportsProp) return; // parent manages the list
    supabase
      .from('airports')
      .select('id, iata_code, name, city, countries(name)')
      .order('iata_code')
      .then(({ data }) => { if (data) setInternalAirports(data as AirportRow[]); });
  }, [airportsProp]);

  // Sync display label when value or airports list changes (e.g. editing mode)
  useEffect(() => {
    if (!open) {
      const match = airports.find(a => a[valueKey] === value);
      setQuery(match ? formatLabel(match) : value);
    }
  }, [value, airports]); // intentionally omit `open` — only sync when closed

  function formatLabel(a: AirportRow) {
    const country = a.countries?.name;
    return `${a.iata_code} — ${a.name}, ${a.city}${country ? `, ${country}` : ''}`;
  }

  const filtered = airports.filter(a => {
    if (exclude && a[valueKey] === exclude) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      a.iata_code.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      a.city.toLowerCase().includes(q) ||
      (a.countries?.name ?? '').toLowerCase().includes(q)
    );
  });

  function handleFocus() {
    setQuery('');
    setOpen(true);
  }

  // Only fires when the user genuinely clicks outside — the <ul> uses
  // onMouseDown preventDefault to keep focus in the input during item clicks.
  function handleBlur() {
    setOpen(false);
    const match = airports.find(a => a[valueKey] === value);
    setQuery(match ? formatLabel(match) : value);
  }

  function handleSelect(a: AirportRow) {
    onChange(a[valueKey] as string);
    setQuery(formatLabel(a));
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        className="block w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition"
        placeholder={placeholder}
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />
      {open && (
        <ul
          className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg text-sm"
          onMouseDown={e => e.preventDefault()}
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-3 text-gray-400">Tidak ada bandara yang cocok.</li>
          ) : filtered.map(a => (
            <li
              key={a.id}
              onClick={() => handleSelect(a)}
              className={`flex items-baseline gap-2 px-3 py-2.5 cursor-pointer hover:bg-primary/5 ${a[valueKey] === value ? 'bg-primary/5' : ''}`}
            >
              <span className="font-mono font-bold text-primary shrink-0">{a.iata_code}</span>
              <span className="text-gray-700 truncate">{a.name},</span>
              <span className="text-gray-500 shrink-0">{a.city}</span>
              {a.countries?.name && (
                <span className="text-gray-400 text-xs shrink-0">{a.countries.name}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AirportSelect;
