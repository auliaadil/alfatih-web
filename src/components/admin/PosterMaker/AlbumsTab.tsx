import React, { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Loader2, ChevronDown, BookImage } from 'lucide-react';

interface AlbumsTabProps {
  onAddImage: (url: string) => void;
}

interface PhotoRow {
  id: string;
  storage_url: string;
  documentation_id: string;
}

const PAGE = 30;

const AlbumsTab: React.FC<AlbumsTabProps> = ({ onAddImage }) => {
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [albums, setAlbums] = useState<{ id: string; title: string }[]>([]);
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [catId, setCatId] = useState('');
  const [albumId, setAlbumId] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load all categories on mount
  useEffect(() => {
    supabase
      .from('categories')
      .select('id, name')
      .order('name')
      .then(({ data }) => {
        if (data) setCategories(data);
      });
  }, []);

  // Reload albums when category changes
  useEffect(() => {
    const query = catId
      ? supabase
          .from('documentations')
          .select('id, title')
          .eq('category_id', catId)
          .eq('published', true)
          .order('title')
      : supabase
          .from('documentations')
          .select('id, title')
          .eq('published', true)
          .order('title');

    query.then(({ data }) => {
      setAlbums(data ?? []);
      setAlbumId('');
    });
  }, [catId]);

  // Reload photos when filters change
  useEffect(() => {
    loadPhotos(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catId, albumId]);

  const loadPhotos = async (off: number) => {
    setLoading(true);
    try {
      // When filtering by category only, resolve doc IDs first (joined-table filter
      // is not reliably supported in the Supabase JS client)
      let docIdsFilter: string[] | null = null;
      if (!albumId && catId) {
        const { data: catDocs } = await supabase
          .from('documentations')
          .select('id')
          .eq('category_id', catId)
          .eq('published', true);
        const ids = (catDocs ?? []).map((d: { id: string }) => d.id);
        if (ids.length === 0) {
          setPhotos([]);
          setHasMore(false);
          setOffset(0);
          setLoading(false);
          return;
        }
        docIdsFilter = ids;
      }

      const baseQuery = supabase
        .from('documentation_photos')
        .select('id, storage_url, documentation_id')
        .order('sort_order')
        .range(off, off + PAGE - 1);

      const { data } = await (
        albumId
          ? baseQuery.eq('documentation_id', albumId)
          : docIdsFilter !== null
          ? baseQuery.in('documentation_id', docIdsFilter)
          : baseQuery
      );

      const rows = (data ?? []) as PhotoRow[];

      if (off === 0) {
        setPhotos(rows);
      } else {
        setPhotos(prev => [...prev, ...rows]);
      }
      setHasMore(rows.length === PAGE);
      setOffset(off + rows.length);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => loadPhotos(offset);

  return (
    <div className="space-y-2">
      {/* Category filter */}
      <select
        value={catId}
        onChange={e => {
          setCatId(e.target.value);
          setOffset(0);
        }}
        className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white"
      >
        <option value="">Semua Kategori</option>
        {categories.map(c => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      {/* Album filter */}
      <select
        value={albumId}
        onChange={e => {
          setAlbumId(e.target.value);
          setOffset(0);
        }}
        className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white"
      >
        <option value="">Semua Album</option>
        {albums.map(a => (
          <option key={a.id} value={a.id}>
            {a.title}
          </option>
        ))}
      </select>

      {/* Empty state */}
      {photos.length === 0 && !loading && (
        <div className="flex flex-col items-center py-8 text-gray-300">
          <BookImage className="w-8 h-8 mb-2" />
          <span className="text-xs">Belum ada foto album</span>
        </div>
      )}

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5 mt-2">
          {photos.map(p => (
            <img
              key={p.id}
              src={p.storage_url}
              alt=""
              loading="lazy"
              className="aspect-square w-full object-cover rounded cursor-pointer hover:ring-2 hover:ring-primary transition"
              onClick={() => onAddImage(p.storage_url)}
            />
          ))}
        </div>
      )}

      {/* Loading spinner */}
      {loading && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      )}

      {/* Load more */}
      {hasMore && !loading && (
        <button
          onClick={handleLoadMore}
          className="w-full flex items-center justify-center gap-1 py-2 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
        >
          <ChevronDown className="w-3.5 h-3.5" />
          Muat lebih
        </button>
      )}

      {/* Hint */}
      {photos.length > 0 && (
        <p className="text-[10px] text-gray-400 text-center">
          Klik foto untuk menambah ke kanvas
        </p>
      )}
    </div>
  );
};

export default AlbumsTab;
