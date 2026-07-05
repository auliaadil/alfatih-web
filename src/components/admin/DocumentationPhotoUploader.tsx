import React, { useRef, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Upload, X, Loader2 } from 'lucide-react';
import { DocumentationPhoto } from '../../../types';
import { useToast } from './ui';

interface Props {
  docId: string;
  photos: DocumentationPhoto[];
  onPhotosChange: (photos: DocumentationPhoto[]) => void;
  coverUrl: string | null;
  onCoverChange: (url: string | null) => void;
}

export const DocumentationPhotoUploader: React.FC<Props> = ({
  docId, photos, onPhotosChange, coverUrl, onCoverChange,
}) => {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const dragOverRef = useRef<string | null>(null);

  const uploadFiles = async (files: FileList) => {
    setUploading(true);
    const newPhotos: DocumentationPhoto[] = [];
    for (const file of Array.from(files)) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${docId}/${Date.now()}-${safeName}`;
      const { data, error } = await supabase.storage
        .from('documentation-photos')
        .upload(path, file, { upsert: false });
      if (error) { toast('error', `Gagal upload: ${file.name}`); continue; }
      const { data: urlData } = supabase.storage
        .from('documentation-photos')
        .getPublicUrl(data.path);
      const nextOrder = photos.length + newPhotos.length;
      const tempPhoto: DocumentationPhoto = {
        id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        documentation_id: docId,
        storage_url: urlData.publicUrl,
        sort_order: nextOrder,
        created_at: new Date().toISOString()
      };
      newPhotos.push(tempPhoto);
    }
    const updated = [...photos, ...newPhotos];
    onPhotosChange(updated);
    if (!coverUrl && updated.length > 0) onCoverChange(updated[0].storage_url);
    setUploading(false);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) uploadFiles(e.target.files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  };

  const handleDelete = async (photo: DocumentationPhoto) => {
    const url = new URL(photo.storage_url);
    const storagePath = url.pathname.split('/object/public/documentation-photos/')[1];
    await supabase.storage.from('documentation-photos').remove([storagePath]);
    if (!photo.id.startsWith('temp-')) {
      await supabase.from('documentation_photos').delete().eq('id', photo.id);
    }
    const updated = photos.filter(p => p.id !== photo.id);
    onPhotosChange(updated);
    if (coverUrl === photo.storage_url) onCoverChange(updated[0]?.storage_url ?? null);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    dragOverRef.current = id;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverPhoto = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!dragOverRef.current || dragOverRef.current === targetId) return;
    const fromIdx = photos.findIndex(p => p.id === dragOverRef.current);
    const toIdx = photos.findIndex(p => p.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    const reordered = [...photos];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    const withOrder = reordered.map((p, i) => ({ ...p, sort_order: i }));
    onPhotosChange(withOrder);
    dragOverRef.current = moved.id;
  };

  const handleDragEnd = async () => {
    // persist new sort_order to DB for non-temp photos
    await Promise.all(
      photos.map(p =>
        p.id.startsWith('temp-') ? Promise.resolve() : supabase.from('documentation_photos').update({ sort_order: p.sort_order }).eq('id', p.id)
      )
    );
    dragOverRef.current = null;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Photos</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
        >
          <Upload className="w-3.5 h-3.5" /> Upload
        </button>
      </div>

      {/* Drop zone */}
      <div
        className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center text-xs text-gray-400 hover:border-primary/40 transition cursor-pointer"
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
      >
        {uploading ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Uploading…</span>
          </div>
        ) : (
          <>Drag & drop atau klik <strong className="text-primary">Browse</strong></>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleInput}
      />

      {/* Photo grid */}
      {photos.length > 0 && (
        <>
          <div className="grid grid-cols-4 gap-2">
            {photos.map(photo => (
              <div
                key={photo.id}
                draggable
                onDragStart={e => handleDragStart(e, photo.id)}
                onDragOver={e => handleDragOverPhoto(e, photo.id)}
                onDragEnd={handleDragEnd}
                onClick={() => onCoverChange(photo.storage_url === coverUrl ? null : photo.storage_url)}
                className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition ${
                  coverUrl === photo.storage_url ? 'border-primary' : 'border-transparent hover:border-gray-300'
                }`}
              >
                <img src={photo.storage_url} alt="" className="w-full h-full object-cover" />
                {coverUrl === photo.storage_url && (
                  <span className="absolute top-1 left-1 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    COVER
                  </span>
                )}
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); handleDelete(photo); }}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/50 hover:bg-black/70 text-white rounded flex items-center justify-center transition"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-400">Klik foto untuk set cover · Drag untuk urutkan</p>
        </>
      )}
    </div>
  );
};
