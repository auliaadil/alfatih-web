import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/src/lib/supabase';
import { BookImage, Edit2, Package, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { SlideOver, btnPrimary } from './ui';
import { Documentation, DocumentationPhoto } from '../../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  doc: Documentation | null;
  onEdit: () => void;
}

interface LightboxState {
  index: number;
}

export const DocumentationView: React.FC<Props> = ({ isOpen, onClose, doc, onEdit }) => {
  const [photos, setPhotos] = useState<DocumentationPhoto[]>([]);
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);

  useEffect(() => {
    if (!isOpen || !doc) {
      setPhotos([]);
      return;
    }
    supabase
      .from('documentation_photos')
      .select('*')
      .eq('documentation_id', doc.id)
      .order('sort_order')
      .then(({ data }) => {
        if (data) setPhotos(data as DocumentationPhoto[]);
      });
  }, [isOpen, doc]);

  const closeLightbox = useCallback(() => setLightbox(null), []);

  const goNext = useCallback(() => {
    setLightbox(prev => {
      if (!prev || photos.length === 0) return prev;
      return { index: (prev.index + 1) % photos.length };
    });
  }, [photos.length]);

  const goPrev = useCallback(() => {
    setLightbox(prev => {
      if (!prev || photos.length === 0) return prev;
      return { index: (prev.index - 1 + photos.length) % photos.length };
    });
  }, [photos.length]);

  useEffect(() => {
    if (!lightbox) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightbox, closeLightbox, goNext, goPrev]);

  if (!doc) return null;

  const dateRange = [doc.departure_date, doc.arrival_date].filter(Boolean).join(' – ');

  return (
    <>
      <SlideOver
        isOpen={isOpen}
        onClose={onClose}
        title={doc.title}
        subtitle={dateRange || undefined}
        width="lg"
        footer={
          <div className="flex justify-end">
            <button className={btnPrimary} onClick={onEdit}>
              <Edit2 className="w-4 h-4" /> Edit Album
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {doc.categories?.name && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-100 text-violet-700">
                {doc.categories.name}
              </span>
            )}
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
              doc.published ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {doc.published ? 'Published' : 'Draft'}
            </span>
          </div>

          {/* Cover photo */}
          {doc.cover_photo_url && (
            <img
              src={doc.cover_photo_url}
              alt={doc.title}
              className="w-full h-40 object-cover rounded-lg"
            />
          )}

          {/* Date range */}
          {dateRange && (
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-700">Tanggal:</span> {dateRange}
            </p>
          )}

          {/* Package link */}
          {doc.packages?.title && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm">
              <Package className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <span className="text-blue-700">
                Package: <strong>{doc.packages.title}</strong>
              </span>
            </div>
          )}

          {/* Description */}
          {doc.description && (
            <p className="text-sm text-gray-600 leading-relaxed">{doc.description}</p>
          )}

          <hr className="border-gray-100" />

          {/* Photo grid */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              All Photos ({photos.length})
            </p>
            {photos.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-gray-300">
                <BookImage className="w-10 h-10 mb-2" />
                <span className="text-sm">No photos yet</span>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {photos.map((p, idx) => (
                  <div
                    key={p.id}
                    className="aspect-square rounded-md overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setLightbox({ index: idx })}
                  >
                    <img
                      src={p.storage_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SlideOver>

      {/* Lightbox */}
      {lightbox !== null && photos.length > 0 && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            className="absolute top-4 right-4 p-2 text-white hover:text-gray-300 transition-colors bg-black/40 rounded-full"
            onClick={closeLightbox}
            aria-label="Close lightbox"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Prev arrow */}
          {photos.length > 1 && (
            <button
              className="absolute left-4 p-2 text-white hover:text-gray-300 transition-colors bg-black/40 rounded-full"
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Image */}
          <img
            src={photos[lightbox.index].storage_url}
            alt=""
            className="max-h-[80vh] max-w-[80vw] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next arrow */}
          {photos.length > 1 && (
            <button
              className="absolute right-4 p-2 text-white hover:text-gray-300 transition-colors bg-black/40 rounded-full"
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              aria-label="Next photo"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Counter */}
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
            {lightbox.index + 1} / {photos.length}
          </p>
        </div>
      )}
    </>
  );
};
