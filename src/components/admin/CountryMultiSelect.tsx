import React, { useEffect, useRef, useState } from 'react';
import { X, ChevronDown, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { inputClass, btnPrimary, btnSecondary, useToast } from './ui';

interface Country { id: string; name: string; }

interface Props {
  value: string[];
  onChange: (ids: string[]) => void;
}

const CountryMultiSelect: React.FC<Props> = ({ value, onChange }) => {
  const toast = useToast();
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [dropOpen, setDropOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchCountries(); }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchCountries = async () => {
    setLoading(true);
    const { data } = await supabase.from('countries').select('id, name').order('name');
    if (data) setCountries(data);
    setLoading(false);
  };

  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id]);
  };

  const remove = (id: string) => onChange(value.filter(v => v !== id));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data, error } = await supabase
      .from('countries')
      .insert([{ name: newName.trim() }])
      .select('id, name')
      .single();
    setSaving(false);
    if (error) {
      toast('error', error.code === '23505' ? 'Country already exists.' : 'Failed to add country.');
      return;
    }
    await fetchCountries();
    onChange([...value, data.id]);
    setNewName('');
    setAddOpen(false);
  };

  const selectedCountries = countries.filter(c => value.includes(c.id));

  return (
    <div className="space-y-2">
      {/* Selected chips */}
      {selectedCountries.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedCountries.map(c => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full"
            >
              {c.name}
              <button type="button" onClick={() => remove(c.id)} className="hover:text-red-500 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown trigger */}
      <div className="relative" ref={dropRef}>
        <button
          type="button"
          disabled={loading}
          onClick={() => setDropOpen(o => !o)}
          className="w-full flex items-center justify-between px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
        >
          <span className="text-gray-400">
            {loading ? 'Loading…' : selectedCountries.length === 0 ? 'Select countries…' : `${selectedCountries.length} selected`}
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${dropOpen ? 'rotate-180' : ''}`} />
        </button>

        {dropOpen && (
          <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
            {countries.length === 0 ? (
              <p className="text-sm text-gray-400 px-3 py-3">No countries yet.</p>
            ) : (
              countries.map(c => (
                <label
                  key={c.id}
                  className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={value.includes(c.id)}
                    onChange={() => toggle(c.id)}
                    className="w-4 h-4 accent-primary rounded"
                  />
                  <span className="text-sm text-gray-700">{c.name}</span>
                </label>
              ))
            )}
            <button
              type="button"
              onClick={() => { setDropOpen(false); setAddOpen(true); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-primary font-medium border-t border-gray-100 hover:bg-primary/5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add new country…
            </button>
          </div>
        )}
      </div>

      {/* Add country modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Add Country</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <input
                type="text"
                required
                autoFocus
                className={inputClass}
                placeholder="e.g., Kuwait"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => { setAddOpen(false); setNewName(''); }}
                  className={btnSecondary}
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} className={btnPrimary}>
                  {saving ? 'Adding…' : 'Add Country'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CountryMultiSelect;
