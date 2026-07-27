import React, { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { SlideOver, FormField, inputClass, selectClass, btnPrimary, btnSecondary, useToast } from './ui';
import { Documentation, DocumentationPhoto } from '../../../types';
import { DocumentationPhotoUploader } from './DocumentationPhotoUploader';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  doc: Documentation | null;
  onSaved: () => void;
}

interface FormState {
  title: string;
  category_id: string;
  package_id: string;
  departure_date: string;
  arrival_date: string;
  description: string;
  published: boolean;
}

const EMPTY: FormState = {
  title: '', category_id: '', package_id: '',
  departure_date: '', arrival_date: '', description: '', published: false,
};

export const DocumentationForm: React.FC<Props> = ({ isOpen, onClose, doc, onSaved }) => {
  const toast = useToast();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [packages, setPackages] = useState<{ id: string; title: string; category: string; departure_date: string | null; arrival_date: string | null; description: string | null }[]>([]);
  const [linkPackage, setLinkPackage] = useState(false);
  const [photos, setPhotos] = useState<DocumentationPhoto[]>([]);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  // stable ID used as the documentation's PK so photos can be uploaded before first save
  const [docId] = useState(() => doc?.id ?? crypto.randomUUID());

  useEffect(() => {
    if (!isOpen) return;
    supabase.from('categories').select('id, name').order('name').then(({ data }) => {
      if (data) setCategories(data);
    });
    supabase.from('packages').select('id, title, category, departure_date, arrival_date, description').order('title').then(({ data }) => {
      if (data) setPackages(data as { id: string; title: string; category: string; departure_date: string | null; arrival_date: string | null; description: string | null }[]);
    });
    if (doc) {
      setForm({
        title: doc.title,
        category_id: doc.category_id,
        package_id: doc.package_id ?? '',
        departure_date: doc.departure_date ?? '',
        arrival_date: doc.arrival_date ?? '',
        description: doc.description ?? '',
        published: doc.published,
      });
      setLinkPackage(!!doc.package_id);
      setCoverUrl(doc.cover_photo_url ?? null);
      // load existing photos
      supabase
        .from('documentation_photos')
        .select('*')
        .eq('documentation_id', doc.id)
        .order('sort_order')
        .then(({ data }) => { if (data) setPhotos(data as DocumentationPhoto[]); });
    } else {
      setForm(EMPTY);
      setLinkPackage(false);
      setPhotos([]);
      setCoverUrl(null);
    }
  }, [isOpen, doc]);

  const applyPackage = (pkgId: string) => {
    const pkg = packages.find(p => p.id === pkgId);
    if (!pkg) return;
    const cat = categories.find(c => c.name === pkg.category);
    setForm(prev => ({
      ...prev,
      package_id: pkgId,
      title: pkg.title,
      category_id: cat?.id ?? prev.category_id,
      departure_date: pkg.departure_date ?? '',
      arrival_date: pkg.arrival_date ?? '',
      description: pkg.description ?? '',
    }));
  };

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category_id) { toast('error', 'Pilih kategori terlebih dahulu.'); return; }
    setSaving(true);
    const payload = {
      id: docId,
      title: form.title,
      category_id: form.category_id,
      package_id: form.package_id || null,
      departure_date: form.departure_date || null,
      arrival_date: form.arrival_date || null,
      description: form.description || null,
      cover_photo_url: coverUrl,
      published: form.published,
    };
    const { error } = doc
      ? await supabase.from('documentations').update(payload).eq('id', doc.id)
      : await supabase.from('documentations').upsert(payload);
      
    if (error) { 
      toast('error', 'Gagal menyimpan: ' + error.message); 
    } else { 
      const tempPhotos = photos.filter(p => p.id.startsWith('temp-'));
      if (tempPhotos.length > 0) {
         const photosToInsert = tempPhotos.map(p => ({
           documentation_id: docId,
           storage_url: p.storage_url,
           sort_order: p.sort_order
         }));
         const { error: photoErr } = await supabase.from('documentation_photos').insert(photosToInsert);
         if (photoErr) {
           console.error('Error saving photos:', photoErr);
           toast('warning', 'Album disimpan, tetapi beberapa foto gagal disimpan ke database.');
         }
         
         await Promise.all(
            photos.filter(p => !p.id.startsWith('temp-')).map(p =>
              supabase.from('documentation_photos').update({ sort_order: p.sort_order }).eq('id', p.id)
            )
         );
      }
      toast('success', doc ? 'Dokumentasi diperbarui.' : 'Dokumentasi dibuat.'); 
      onSaved(); 
      onClose(); 
    }
    setSaving(false);
  };

  const footer = (
    <div className="flex items-center justify-between">
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 gap-4">
        <div>
          <p className="text-sm font-medium text-gray-700">Published</p>
          <p className="text-xs text-gray-400 mt-0.5">Tampilkan album ini di halaman publik</p>
        </div>
        <button
          type="button"
          onClick={() => setForm(prev => ({ ...prev, published: !prev.published }))}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none flex-shrink-0 ${form.published ? 'bg-primary' : 'bg-gray-200'}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.published ? 'translate-x-6' : 'translate-x-1'}`}
          />
        </button>
      </div>
      <div className="flex gap-2">
        <button type="button" className={btnSecondary} onClick={onClose}>Batal</button>
        <button type="submit" form="doc-form" className={btnPrimary} disabled={saving}>
          {saving ? 'Menyimpan…' : 'Simpan Album'}
        </button>
      </div>
    </div>
  );

  return (
    <SlideOver
      isOpen={isOpen}
      onClose={onClose}
      title={doc ? 'Edit Album' : 'New Album'}
      subtitle="Isi detail atau hubungkan ke paket"
      width="lg"
      footer={footer}
    >
      <form id="doc-form" onSubmit={handleSave} className="space-y-4">
        {/* Package link toggle */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 space-y-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={linkPackage}
              onClick={() => {
                setLinkPackage(!linkPackage);
                if (linkPackage) setForm(prev => ({ ...prev, package_id: '' }));
              }}
              className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 flex-shrink-0 ${linkPackage ? 'bg-primary justify-end' : 'bg-gray-300 justify-start'}`}
            >
              <span className="w-4 h-4 bg-white rounded-full shadow" />
            </button>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-blue-800">Hubungkan ke paket</p>
              <p className="text-xs text-blue-500">Auto-isi judul, kategori, tanggal & deskripsi</p>
            </div>
          </div>
          {linkPackage && (
            <select
              className={selectClass + ' w-full'}
              value={form.package_id}
              onChange={e => applyPackage(e.target.value)}
            >
              <option value="">Pilih paket…</option>
              {packages.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          )}
        </div>

        {/* Metadata grid */}
        <FormField label="Judul" required>
          <input className={inputClass} value={form.title} onChange={set('title')} required />
        </FormField>

        <FormField label="Kategori" required>
          <select className={selectClass} value={form.category_id} onChange={set('category_id')} required>
            <option value="">Pilih kategori…</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Tanggal Keberangkatan">
            <input type="date" className={inputClass} value={form.departure_date} onChange={set('departure_date')} />
          </FormField>
          <FormField label="Tanggal Kepulangan">
            <input type="date" className={inputClass} value={form.arrival_date} onChange={set('arrival_date')} />
          </FormField>
        </div>

        <FormField label="Deskripsi">
          <textarea
            className={inputClass + ' resize-none'}
            rows={3}
            value={form.description}
            onChange={set('description') as React.ChangeEventHandler<HTMLTextAreaElement>}
          />
        </FormField>

        {/* Divider */}
        <div className="border-t border-gray-100 pt-4">
          <DocumentationPhotoUploader
            docId={docId}
            photos={photos}
            onPhotosChange={setPhotos}
            coverUrl={coverUrl}
            onCoverChange={setCoverUrl}
          />
        </div>
      </form>
    </SlideOver>
  );
};
