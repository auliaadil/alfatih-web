import React, { useRef, useState } from 'react';
import { Upload, Search as SearchIcon, Plus } from 'lucide-react';
import { FormField, inputClass, selectClass, SectionCard, btnPrimary, btnSecondary, SlideOver, useToast } from '../ui';
import ImagePickerModal from './ImagePickerModal';
import { WizardDraft } from '../../../pages/admin/PackageWizard';
import { supabase } from '../../../lib/supabase';
import { toHijriMonthYear } from '../../../lib/hijriUtils';

interface Props {
  draft: WizardDraft;
  updateDraft: (p: Partial<WizardDraft>) => void;
  onNext: () => void;
  onSave?: () => void;
  saving?: boolean;
  categories: string[];
  onCategoryCreated: (name: string) => void;
}

const Step1BasicInfo: React.FC<Props> = ({ draft, updateDraft, onNext, onSave, saving, categories, onCategoryCreated }) => {
  const [imageTab, setImageTab] = useState<'upload' | 'search'>('upload');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const toast = useToast();
  const [catSlideOpen, setCatSlideOpen] = useState(false);
  const [catForm, setCatForm] = useState({ name: '', slug: '' });
  const [savingCat, setSavingCat] = useState(false);

  const toSlug = (name: string) =>
    name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCat(true);
    const trimmedName = catForm.name.trim();
    const slug = catForm.slug.trim() || toSlug(trimmedName);
    const { error } = await supabase.from('categories').insert([{ name: trimmedName, slug }]);
    setSavingCat(false);
    if (error) {
      toast('error', error.code === '23505' ? 'Category already exists.' : 'Failed to save category.');
      return;
    }
    onCategoryCreated(trimmedName);
    toast('success', 'Category created.');
    updateDraft({ category: trimmedName });
    setCatSlideOpen(false);
    setCatForm({ name: '', slug: '' });
  };

  const duration = (() => {
    if (!draft.departure_date || !draft.arrival_date) return null;
    const days =
      Math.round(
        (new Date(draft.arrival_date).getTime() - new Date(draft.departure_date).getTime()) / 86400000
      ) + 1;
    return days > 0 ? `${days} Hari` : null;
  })();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `packages/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage.from('images').upload(path, file, { upsert: true });
    if (error) {
      console.error('Upload failed:', error.message);
      setUploading(false);
      return;
    }
    if (data) {
      const { data: urlData } = supabase.storage.from('images').getPublicUrl(data.path);
      updateDraft({ image_url: urlData.publicUrl, image_credit: '' });
    }
    setUploading(false);
    e.target.value = '';
  };

  const canNext = !!draft.title && !!draft.category && !!draft.departure_date && !!draft.arrival_date;

  return (
    <div className="space-y-6">
      <SectionCard title="Step 1 of 4 — Basic Info">
        <div className="space-y-5 p-6">
          <FormField label="Package Title" required>
            <input
              type="text"
              required
              className={inputClass}
              placeholder="e.g., Umrah Plus Istanbul 9 Hari"
              value={draft.title}
              onChange={(e) => updateDraft({ title: e.target.value })}
            />
          </FormField>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-700">
                Category <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setCatSlideOpen(true)}
                className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3 h-3" /> New
              </button>
            </div>
            <select
              required
              className={selectClass}
              value={draft.category}
              onChange={(e) => updateDraft({ category: e.target.value })}
            >
              <option value="">Select category...</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <FormField label="Destination Country" hint="e.g., Arab Saudi, Turki, Jepang. Digunakan untuk filter di halaman paket.">
            <input
              type="text"
              className={inputClass}
              placeholder="e.g., Arab Saudi"
              value={draft.destination_country}
              onChange={(e) => updateDraft({ destination_country: e.target.value })}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Departure Date" required>
              <input
                type="date"
                required
                className={inputClass}
                value={draft.departure_date}
                onChange={(e) => updateDraft({
                  departure_date: e.target.value,
                  departure_date_hijri: toHijriMonthYear(e.target.value),
                })}
              />
            </FormField>
            <FormField label="Arrival Date" required>
              <input
                type="date"
                required
                className={inputClass}
                min={draft.departure_date}
                value={draft.arrival_date}
                onChange={(e) => updateDraft({ arrival_date: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="Tanggal Hijriah (Keberangkatan)" hint="Dihitung otomatis, dapat diedit manual">
            <input
              type="text"
              className={`${inputClass} bg-amber-50`}
              placeholder="e.g. Syawal 1447 H"
              value={draft.departure_date_hijri}
              onChange={(e) => updateDraft({ departure_date_hijri: e.target.value })}
            />
          </FormField>

          {duration && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Duration:</span>
              <span className="bg-primary/10 text-primary text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {duration}
              </span>
            </div>
          )}

          {/* Cover Image */}
          <FormField label="Cover Image">
            <div className="flex gap-2 mb-3">
              {(['upload', 'search'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setImageTab(tab)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    imageTab === tab
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tab === 'upload' ? (
                    <><Upload className="w-3.5 h-3.5 inline mr-1" />Upload</>
                  ) : (
                    <><SearchIcon className="w-3.5 h-3.5 inline mr-1" />Search Online</>
                  )}
                </button>
              ))}
            </div>

            {imageTab === 'upload' ? (
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="w-full border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-primary/40 transition-colors text-gray-400 text-sm disabled:opacity-50"
                >
                  {uploading
                    ? 'Uploading...'
                    : draft.image_url
                    ? 'Click to replace image'
                    : 'Click to upload JPG/PNG/WebP'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsPickerOpen(true)}
                className="w-full border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-primary/40 transition-colors text-gray-400 text-sm"
              >
                {draft.image_url
                  ? 'Click to search for a different image'
                  : 'Click to search Unsplash / Pixabay'}
              </button>
            )}

            {draft.image_url && (
              <div className="mt-3 rounded-xl overflow-hidden border border-gray-100 aspect-video">
                <img src={draft.image_url} alt="Cover preview" className="w-full h-full object-cover" />
              </div>
            )}
            {draft.image_credit && (
              <p className="text-xs text-gray-400 mt-1">{draft.image_credit}</p>
            )}
          </FormField>

          <FormField label="Mark as Popular">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={draft.is_popular}
                onChange={(e) => updateDraft({ is_popular: e.target.checked })}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm text-gray-700">Show as popular package on homepage</span>
            </label>
          </FormField>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-700">Published</p>
              <p className="text-xs text-gray-400 mt-0.5">Tampilkan paket ini di halaman publik</p>
            </div>
            <button
              type="button"
              onClick={() => updateDraft({ is_published: !draft.is_published })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                draft.is_published ? 'bg-primary' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  draft.is_published ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </SectionCard>

      <div className="flex justify-between">
        {onSave ? (
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className={`${btnSecondary} disabled:opacity-50`}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        ) : <span />}
        <button
          type="button"
          disabled={!canNext}
          onClick={onNext}
          className={`${btnPrimary} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          Next: Flight & Hotels →
        </button>
      </div>

      <ImagePickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={(url, credit) => updateDraft({ image_url: url, image_credit: credit })}
      />

      <SlideOver
        isOpen={catSlideOpen}
        onClose={() => setCatSlideOpen(false)}
        title="New Category"
        subtitle="Slug is auto-generated from name."
        width="sm"
        footer={
          <div className="flex gap-3">
            <button type="button" onClick={() => setCatSlideOpen(false)} className={btnSecondary}>
              Cancel
            </button>
            <button form="cat-create-form" type="submit" disabled={savingCat} className={btnPrimary}>
              {savingCat ? 'Saving...' : 'Add Category'}
            </button>
          </div>
        }
      >
        <form id="cat-create-form" onSubmit={handleCreateCategory} className="space-y-5">
          <FormField label="Category Name" required>
            <input
              type="text"
              required
              className={inputClass}
              placeholder="e.g., Umrah Plus"
              value={catForm.name}
              onChange={(e) => setCatForm({ name: e.target.value, slug: toSlug(e.target.value) })}
            />
          </FormField>
          <FormField label="Slug" hint="Auto-generated. Edit if needed.">
            <input
              type="text"
              className={inputClass}
              placeholder="e.g., umrah-plus"
              value={catForm.slug}
              onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })}
            />
          </FormField>
        </form>
      </SlideOver>
    </div>
  );
};

export default Step1BasicInfo;
