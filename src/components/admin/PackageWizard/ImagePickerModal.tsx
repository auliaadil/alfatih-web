import React, { useState } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { searchImages, ImageResult } from '../../../../services/imageSearchService';
import { inputClass } from '../ui';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string, credit: string) => void;
}

const ImagePickerModal: React.FC<Props> = ({ isOpen, onClose, onSelect }) => {
  const [source, setSource] = useState<'unsplash' | 'pixabay'>('unsplash');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ImageResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    try {
      const imgs = await searchImages(query, source);
      setResults(imgs);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Search Cover Image</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Source toggle + search */}
        <div className="p-4 border-b border-gray-100 space-y-3">
          <div className="flex gap-2">
            {(['unsplash', 'pixabay'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSource(s)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  source === s ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              className={inputClass + ' flex-1'}
              placeholder="Search images..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search
            </button>
          </form>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {results.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-400 text-sm">Search for an image above</div>
          )}
          <div className="grid grid-cols-3 gap-3">
            {results.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { onSelect(img.url, img.credit); onClose(); }}
                className="relative group aspect-video rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-colors focus:outline-none focus:border-primary"
              >
                <img src={img.thumb_url} alt={img.credit} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-black/60 text-white text-[9px] opacity-0 group-hover:opacity-100 transition-opacity truncate">
                  {img.credit}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImagePickerModal;
