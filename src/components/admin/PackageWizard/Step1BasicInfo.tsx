import React, { useRef, useState } from 'react';
import { Upload, Search as SearchIcon } from 'lucide-react';
import { FormField, inputClass, selectClass, SectionCard, btnPrimary } from '../ui';
import ImagePickerModal from './ImagePickerModal';
import { WizardDraft } from '../../../pages/admin/PackageWizard';
import { supabase } from '../../../lib/supabase';

interface Props {
  draft: WizardDraft;
  updateDraft: (p: Partial<WizardDraft>) => void;
  onNext: () => void;
  categories: string[];
}

const Step1BasicInfo: React.FC<Props> = ({ draft, updateDraft, onNext, categories }) => {
  const [imageTab, setImageTab] = useState<'upload' | 'search'>('upload');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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

          <FormField label="Category" required>
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
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Departure Date" required>
              <input
                type="date"
                required
                className={inputClass}
                value={draft.departure_date}
                onChange={(e) => updateDraft({ departure_date: e.target.value })}
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
        </div>
      </SectionCard>

      <div className="flex justify-end">
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
    </div>
  );
};

export default Step1BasicInfo;
