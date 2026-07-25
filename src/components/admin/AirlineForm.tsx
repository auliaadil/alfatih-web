import React, { useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { FormField, inputClass, btnPrimary, btnSecondary, useToast } from './ui';
import CountrySelect from './CountrySelect';

interface AirlineRow { id: string; name: string; logo_url: string | null; country_id: string | null; }
interface AirlineFormData { name: string; logo_url: string; country_id: string; }

interface Props {
  editingId?: string | null;
  initialData?: AirlineFormData;
  onSaved: (row: AirlineRow) => void;
  onCancel: () => void;
  formId?: string;
}

const EMPTY: AirlineFormData = { name: '', logo_url: '', country_id: '' };

const AirlineForm: React.FC<Props> = ({ editingId, initialData, onSaved, onCancel, formId = 'airline-form' }) => {
  const toast = useToast();
  const [form, setForm] = useState<AirlineFormData>(initialData ?? EMPTY);
  const [logoTab, setLogoTab] = useState<'upload' | 'url'>(initialData?.logo_url ? 'url' : 'upload');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast('error', 'File terlalu besar. Maksimum 2 MB.'); e.target.value = ''; return; }
    setUploading(true);
    const ext = (file.name.split('.').pop() ?? 'png').toLowerCase().slice(0, 5);
    const path = `${crypto.randomUUID()}.${ext}`;
    const { data, error } = await supabase.storage.from('airline-logos').upload(path, file, { upsert: true, contentType: file.type || 'image/png' });
    if (error) { toast('error', 'Logo upload failed.'); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('airline-logos').getPublicUrl(data.path);
    setForm(f => ({ ...f, logo_url: urlData.publicUrl }));
    setUploading(false);
    toast('success', 'Logo uploaded.');
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { name: form.name.trim(), logo_url: form.logo_url || null, country_id: form.country_id || null };
    if (editingId) {
      const { error } = await supabase.from('airlines').update(payload).eq('id', editingId);
      setSaving(false);
      if (error) { toast('error', 'Failed to save airline.'); return; }
      toast('success', 'Airline updated.');
      onSaved({ id: editingId, ...payload });
    } else {
      const { data, error } = await supabase.from('airlines').insert([payload]).select().single();
      setSaving(false);
      if (error) { toast('error', 'Failed to save airline.'); return; }
      toast('success', 'Airline added.');
      onSaved(data as AirlineRow);
    }
  };

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-5">
      <FormField label="Airline Name" required>
        <input type="text" required className={inputClass} placeholder="e.g., Garuda Indonesia"
          value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
      </FormField>

      <FormField label="Logo">
        <div className="flex gap-2 mb-3">
          {(['upload', 'url'] as const).map(tab => (
            <button key={tab} type="button" onClick={() => setLogoTab(tab)}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${logoTab === tab ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {tab === 'upload' ? 'Upload' : 'URL'}
            </button>
          ))}
        </div>
        {logoTab === 'upload' ? (
          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-gray-300 cursor-pointer hover:border-primary hover:bg-blue-50/30 transition-colors">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Upload className="w-4 h-4 text-gray-400" />}
            <span className="text-sm text-gray-500">{uploading ? 'Uploading...' : 'Click to upload logo'}</span>
            <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={uploading} />
          </label>
        ) : (
          <input type="url" className={inputClass} placeholder="https://..." value={form.logo_url}
            onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))} />
        )}
        {form.logo_url && (
          <img src={form.logo_url} alt="Preview" className="mt-2 h-10 object-contain rounded border border-gray-100 bg-gray-50 p-1" />
        )}
      </FormField>

      <FormField label="Country">
        <CountrySelect value={form.country_id} onChange={v => setForm(f => ({ ...f, country_id: v }))} />
      </FormField>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className={btnSecondary}>Cancel</button>
        <button type="submit" disabled={saving || uploading} className={btnPrimary}>
          {saving ? 'Saving...' : editingId ? 'Update Airline' : 'Add Airline'}
        </button>
      </div>
    </form>
  );
};

export default AirlineForm;
