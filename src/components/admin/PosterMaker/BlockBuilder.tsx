import React, { useState } from 'react';
import { X, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { BlockConfig, BlockType, FieldSchema, AspectRatio } from './types';
import { saveTemplate } from '../../../services/posterTemplates';

const BLOCK_DEFS: { type: BlockType; label: string; description: string }[] = [
  { type: 'HeaderBlock',      label: 'Header',       description: 'Logo + nama brand' },
  { type: 'HeroImageBlock',   label: 'Foto Utama',   description: 'Foto full-width' },
  { type: 'TextBlock',        label: 'Teks',         description: 'Judul + paragraf' },
  { type: 'DetailsGrid',      label: 'Grid Detail',  description: 'Ikon + label (max 6)' },
  { type: 'TestimonialBlock', label: 'Testimoni',    description: 'Kutipan + nama' },
  { type: 'PromoBlock',       label: 'Promo',        description: 'Harga + tombol CTA' },
  { type: 'FooterBlock',      label: 'Footer',       description: 'Sosial + kontak' },
];

const BLOCK_FIELDS_MAP: Record<BlockType, string[]> = {
  HeaderBlock:      ['brand_name', 'tagline'],
  HeroImageBlock:   ['hero_image'],
  TextBlock:        ['headline', 'body_text'],
  DetailsGrid:      ['detail_1','detail_2','detail_3','detail_4','detail_5','detail_6'],
  TestimonialBlock: ['quote', 'author_name', 'batch'],
  PromoBlock:       ['promo_price', 'cta_text'],
  FooterBlock:      ['social_handle', 'contact', 'ppiu_number'],
};

const FIELD_TYPE_MAP: Record<string, 'text' | 'image' | 'textarea'> = {
  hero_image: 'image',
  tagline:    'textarea',
  quote:      'textarea',
};

const deriveFieldSchema = (blocks: BlockConfig[]): FieldSchema[] => {
  const seen = new Set<string>();
  return blocks.flatMap(b =>
    (BLOCK_FIELDS_MAP[b.type] ?? [])
      .filter(id => !seen.has(id) && seen.add(id))
      .map(id => ({
        id,
        label: id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        type: (FIELD_TYPE_MAP[id] ?? 'text') as 'text' | 'image' | 'textarea',
      }))
  );
};

const defaultConfig = (): BlockConfig['config'] => ({ padding: 'md', fontSize: 'md', textAlign: 'left' });

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

export const BlockBuilder: React.FC<Props> = ({ onClose, onSaved }) => {
  const [name, setName] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('post');
  const [blocks, setBlocks] = useState<BlockConfig[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const addBlock = (type: BlockType) => {
    const already = blocks.some(b => b.type === type);
    if (already) { alert(`Block "${type}" sudah ditambahkan.`); return; }
    setBlocks(prev => [...prev, { type, config: defaultConfig() }]);
    setSelected(blocks.length);
  };

  const removeBlock = (i: number) => {
    setBlocks(prev => prev.filter((_, idx) => idx !== i));
    setSelected(null);
  };

  const moveUp = (i: number) => {
    if (i === 0) return;
    setBlocks(prev => { const a = [...prev]; [a[i-1], a[i]] = [a[i], a[i-1]]; return a; });
    setSelected(i - 1);
  };

  const moveDown = (i: number) => {
    if (i === blocks.length - 1) return;
    setBlocks(prev => { const a = [...prev]; [a[i], a[i+1]] = [a[i+1], a[i]]; return a; });
    setSelected(i + 1);
  };

  const updateConfig = (key: keyof BlockConfig['config'], value: string) => {
    if (selected === null) return;
    setBlocks(prev => prev.map((b, i) => i === selected ? { ...b, config: { ...b.config, [key]: value } } : b));
  };

  const handleSave = async () => {
    if (!name.trim() || blocks.length === 0) return;
    setIsSaving(true);
    try {
      const field_schema = deriveFieldSchema(blocks);
      const result = await saveTemplate({
        name: name.trim(),
        description: '',
        aspect_ratio: aspectRatio,
        template_type: 'custom',
        blocks,
        field_schema,
      });
      if (result) { onSaved(); onClose(); }
      else alert('Gagal menyimpan template.');
    } finally {
      setIsSaving(false);
    }
  };

  const selBlock = selected !== null ? blocks[selected] : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-stretch">
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-base font-bold text-gray-900">Buat Template Baru</h2>
            <p className="text-xs text-gray-500">Susun blok untuk membuat layout poster</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nama template..."
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none w-56"
            />
            <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm font-semibold">
              {(['post', 'story'] as AspectRatio[]).map(ar => (
                <button key={ar} onClick={() => setAspectRatio(ar)}
                  className={`px-4 py-2 transition ${aspectRatio === ar ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                  {ar === 'post' ? 'Post' : 'Story'}
                </button>
              ))}
            </div>
            <button onClick={handleSave} disabled={!name.trim() || blocks.length === 0 || isSaving}
              className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-blue-600 transition disabled:opacity-40">
              {isSaving ? 'Menyimpan...' : 'Simpan Template'}
            </button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Block palette */}
          <div className="w-56 border-r border-gray-200 p-4 overflow-y-auto flex-shrink-0">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Tambah Blok</p>
            <div className="space-y-2">
              {BLOCK_DEFS.map(b => (
                <button key={b.type} onClick={() => addBlock(b.type)}
                  disabled={blocks.some(x => x.type === b.type)}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-primary hover:bg-blue-50 transition disabled:opacity-40 disabled:cursor-not-allowed">
                  <div className="text-sm font-semibold text-gray-800">{b.label}</div>
                  <div className="text-xs text-gray-400">{b.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Block canvas */}
          <div className="flex-1 p-6 overflow-y-auto">
            {blocks.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
                Tambahkan blok dari panel kiri untuk mulai membangun template
              </div>
            ) : (
              <div className="max-w-xl mx-auto space-y-2">
                {blocks.map((b, i) => (
                  <div
                    key={i}
                    onClick={() => setSelected(i)}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${selected === i ? 'border-primary bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-800">
                        {BLOCK_DEFS.find(d => d.type === b.type)?.label ?? b.type}
                      </div>
                      <div className="text-xs text-gray-400">
                        Padding: {b.config.padding} · Font: {b.config.fontSize}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={e => { e.stopPropagation(); moveUp(i); }} disabled={i === 0} aria-label="Pindah ke atas" className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                      <button onClick={e => { e.stopPropagation(); moveDown(i); }} disabled={i === blocks.length-1} aria-label="Pindah ke bawah" className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                      <button onClick={e => { e.stopPropagation(); removeBlock(i); }} aria-label="Hapus blok" className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Config panel */}
          <div className="w-64 border-l border-gray-200 p-4 overflow-y-auto flex-shrink-0">
            {selBlock ? (
              <div className="space-y-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Konfigurasi: {BLOCK_DEFS.find(d => d.type === selBlock.type)?.label}
                </p>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Padding</label>
                  <select value={selBlock.config.padding ?? 'md'} onChange={e => updateConfig('padding', e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-primary">
                    <option value="sm">Kecil</option>
                    <option value="md">Sedang</option>
                    <option value="lg">Besar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Ukuran Font</label>
                  <select value={selBlock.config.fontSize ?? 'md'} onChange={e => updateConfig('fontSize', e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-primary">
                    <option value="sm">Kecil</option>
                    <option value="md">Sedang</option>
                    <option value="lg">Besar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Warna Latar</label>
                  <input type="color" value={selBlock.config.background ?? '#0F172A'}
                    onChange={e => updateConfig('background', e.target.value)}
                    className="w-full h-10 rounded border border-gray-200 cursor-pointer" />
                </div>
                {(selBlock.type === 'TextBlock' || selBlock.type === 'TestimonialBlock') && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Rata Teks</label>
                    <select value={selBlock.config.textAlign ?? 'left'} onChange={e => updateConfig('textAlign', e.target.value)}
                      className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-primary">
                      <option value="left">Kiri</option>
                      <option value="center">Tengah</option>
                      <option value="right">Kanan</option>
                    </select>
                  </div>
                )}
                {selBlock.type === 'HeroImageBlock' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Fit Gambar</label>
                    <select value={selBlock.config.imageFit ?? 'cover'} onChange={e => updateConfig('imageFit', e.target.value)}
                      className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-primary">
                      <option value="cover">Cover (penuh)</option>
                      <option value="contain">Contain (proporsional)</option>
                    </select>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center mt-8">Klik blok untuk mengkonfigurasinya</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockBuilder;
