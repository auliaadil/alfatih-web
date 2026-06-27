import React, { useEffect, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { supabase } from '../src/lib/supabase';
import { Documentation, DocumentationPhoto } from '../types';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const PerjalananKami: React.FC = () => {
  const [albums, setAlbums] = useState<Documentation[]>([]);
  const [lightboxAlbum, setLightboxAlbum] = useState<Documentation | null>(null);
  const [lightboxPhotos, setLightboxPhotos] = useState<DocumentationPhoto[]>([]);
  const [lightboxIdx, setLightboxIdx] = useState(0);

  useEffect(() => {
    supabase
      .from('documentations')
      .select('*, categories(id, name), documentation_photos(count)')
      .eq('published', true)
      .order('departure_date', { ascending: false })
      .limit(6)
      .then(({ data }) => {
        if (data) setAlbums(data as Documentation[]);
      });
  }, []);

  const openAlbum = async (doc: Documentation) => {
    setLightboxAlbum(doc);
    setLightboxIdx(0);
    const { data } = await supabase
      .from('documentation_photos')
      .select('*')
      .eq('documentation_id', doc.id)
      .order('sort_order');
    setLightboxPhotos((data ?? []) as DocumentationPhoto[]);
  };

  const closeLightbox = useCallback(() => {
    setLightboxAlbum(null);
    setLightboxPhotos([]);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!lightboxAlbum) return;
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowRight') {
        setLightboxIdx(i => Math.min(i + 1, lightboxPhotos.length - 1));
      } else if (e.key === 'ArrowLeft') {
        setLightboxIdx(i => Math.max(i - 1, 0));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxAlbum, lightboxPhotos.length, closeLightbox]);

  if (albums.length === 0) return null;

  const photoCount = (doc: Documentation): number =>
    doc.documentation_photos?.[0]?.count ?? 0;

  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-display">
            Perjalanan Kami
          </h2>
          <p className="text-gray-500 mt-2 text-sm md:text-base">
            Potret perjalanan nyata jamaah kami
          </p>
        </div>

        {/* CSS columns masonry grid */}
        <div className="columns-1 sm:columns-2 lg:columns-3" style={{ columnGap: '12px' }}>
          {albums.map((doc, idx) => (
            <div
              key={doc.id}
              className="break-inside-avoid mb-3 cursor-pointer group relative rounded-xl overflow-hidden"
              style={{ height: idx % 3 === 0 ? '280px' : '200px' }}
              onClick={() => openAlbum(doc)}
            >
              {doc.cover_photo_url ? (
                <img
                  src={doc.cover_photo_url}
                  alt={doc.title}
                  className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-400 text-4xl">📸</span>
                </div>
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

              {/* Photo count badge */}
              {photoCount(doc) > 0 && (
                <div className="absolute top-3 right-3 bg-black/50 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                  {photoCount(doc)} foto
                </div>
              )}

              {/* Album info at bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <p className="font-semibold text-sm leading-tight">{doc.title}</p>
                {doc.categories?.name && (
                  <p className="text-xs opacity-75 mt-0.5">{doc.categories.name}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox portal */}
      {lightboxAlbum &&
        ReactDOM.createPortal(
          <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
            {/* Backdrop click to close */}
            <div
              className="absolute inset-0"
              onClick={closeLightbox}
              aria-label="Close lightbox"
            />

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="flex-1 min-w-0 mr-4">
                <h3 className="text-white font-semibold truncate">{lightboxAlbum.title}</h3>
                {lightboxAlbum.description && (
                  <p className="text-white/60 text-sm truncate">{lightboxAlbum.description}</p>
                )}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-white/50 text-sm">
                  {lightboxPhotos.length > 0 ? `${lightboxIdx + 1} / ${lightboxPhotos.length}` : ''}
                </span>
                <button
                  onClick={closeLightbox}
                  className="text-white/70 hover:text-white p-1 transition"
                  aria-label="Close"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Photo area */}
            <div className="relative z-10 flex-1 flex items-center justify-center px-16 py-4">
              {lightboxPhotos.length === 0 ? (
                <p className="text-white/50 text-sm">Memuat foto...</p>
              ) : (
                <img
                  src={lightboxPhotos[lightboxIdx]?.storage_url}
                  alt={`Foto ${lightboxIdx + 1}`}
                  className="max-h-[75vh] max-w-[90vw] object-contain rounded-lg"
                  onClick={e => e.stopPropagation()}
                />
              )}

              {/* Left arrow */}
              {lightboxIdx > 0 && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setLightboxIdx(i => i - 1);
                  }}
                  className="absolute left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              {/* Right arrow */}
              {lightboxIdx < lightboxPhotos.length - 1 && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setLightboxIdx(i => i + 1);
                  }}
                  className="absolute right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>,
          document.body,
        )}
    </section>
  );
};

export default PerjalananKami;
