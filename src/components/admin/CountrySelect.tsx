import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { selectClass, inputClass, btnPrimary, btnSecondary, useToast } from './ui';

interface Country { id: string; name: string; }

interface CountrySelectProps {
  value: string;
  onChange: (id: string) => void;
  required?: boolean;
}

const CountrySelect: React.FC<CountrySelectProps> = ({ value, onChange, required }) => {
  const toast = useToast();
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchCountries(); }, []);

  const fetchCountries = async () => {
    setLoading(true);
    const { data } = await supabase.from('countries').select('id, name').order('name');
    if (data) setCountries(data);
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === '__add__') {
      setModalOpen(true);
      return;
    }
    onChange(e.target.value);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
    onChange(data.id);
    setNewName('');
    setModalOpen(false);
  };

  return (
    <>
      <select
        className={selectClass}
        value={value}
        onChange={handleChange}
        required={required}
        disabled={loading}
      >
        <option value="">Select country…</option>
        {countries.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
        <option value="__add__">＋ Add new country…</option>
      </select>

      {modalOpen && (
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
                  onClick={() => { setModalOpen(false); setNewName(''); }}
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
    </>
  );
};

export default CountrySelect;
