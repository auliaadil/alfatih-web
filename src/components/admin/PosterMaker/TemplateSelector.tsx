import React, { useEffect, useState } from 'react';
import { LayoutTemplate, Plus } from 'lucide-react';
import { PosterTemplate, FieldValues, SavedTemplate, BlockConfig } from './types';
import { CODE_TEMPLATES } from './templates';
import { fetchTemplates } from '../../../services/posterTemplates';
import {
  HeaderBlock, HeroImageBlock, TextBlock, DetailsGrid,
  TestimonialBlock, PromoBlock, FooterBlock,
} from './blocks';

const BlockMap: Record<string, React.FC<{ fields: FieldValues; config: BlockConfig['config'] }>> = {
  HeaderBlock, HeroImageBlock, TextBlock, DetailsGrid,
  TestimonialBlock, PromoBlock, FooterBlock,
};

const BLOCK_FIELDS: Record<string, string[]> = {
  HeaderBlock:      ['brand_name', 'tagline'],
  HeroImageBlock:   ['hero_image'],
  TextBlock:        ['headline', 'body_text'],
  DetailsGrid:      ['detail_1','detail_2','detail_3','detail_4','detail_5','detail_6'],
  TestimonialBlock: ['quote', 'author_name', 'batch'],
  PromoBlock:       ['promo_price', 'cta_text'],
  FooterBlock:      ['social_handle', 'contact', 'ppiu_number'],
};

const buildComponent = (blocks: BlockConfig[]): React.FC<FieldValues> => {
  const BlocksComponent: React.FC<FieldValues> = (fields) => (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      {blocks.map((block, i) => {
        const Block = BlockMap[block.type];
        return Block ? <Block key={i} fields={fields} config={block.config} /> : null;
      })}
    </div>
  );
  return BlocksComponent;
};

const savedToTemplate = (t: SavedTemplate): PosterTemplate => ({
  id: t.id,
  name: t.name,
  description: t.description,
  category: 'blank',
  aspectRatio: t.aspect_ratio,
  previewColors: ['#94A3B8', '#F8FAFC', '#0F172A'],
  fields: t.field_schema ?? (t.blocks ?? []).flatMap(b =>
    (BLOCK_FIELDS[b.type] ?? []).map(fid => ({ id: fid, label: fid, type: 'text' as const }))
  ),
  Component: buildComponent(t.blocks ?? []),
});

interface Props {
  onSelect: (template: PosterTemplate) => void;
  onNewTemplate: () => void;
}

export const TemplateSelector: React.FC<Props> = ({ onSelect, onNewTemplate }) => {
  const [savedTemplates, setSavedTemplates] = useState<PosterTemplate[]>([]);

  useEffect(() => {
    fetchTemplates().then(rows => setSavedTemplates(rows.map(savedToTemplate)));
  }, []);

  const all = [...savedTemplates, ...CODE_TEMPLATES];
  const post = all.filter(t => t.aspectRatio === 'post');
  const story = all.filter(t => t.aspectRatio === 'story');

  const renderGroup = (title: string, subtitle: string, templates: PosterTemplate[]) => (
    <div className="mb-6">
      <div className="mb-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{title}</p>
        <p className="text-[9px] text-gray-300 mt-0.5">{subtitle}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {templates.map(t => (
          <button
            key={t.id}
            onClick={() => onSelect(t)}
            className="text-left rounded-lg border border-gray-200 hover:border-primary hover:shadow-md transition-all overflow-hidden bg-white"
          >
            <div className="p-2">
              <div
                className={`w-full rounded overflow-hidden ${t.aspectRatio === 'story' ? 'aspect-[9/16]' : 'aspect-[4/5]'}`}
                style={{ background: `linear-gradient(135deg, ${t.previewColors[0]}, ${t.previewColors[1]})` }}
              />
            </div>
            <div className="px-2 pb-2">
              <div className="text-[10px] font-bold text-gray-700 group-hover:text-primary leading-tight">{t.name}</div>
              <div className="text-[9px] text-gray-400 mt-0.5 line-clamp-1">{t.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-800">Pilih Template</h3>
        </div>
        <button
          onClick={onNewTemplate}
          className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
        >
          <Plus className="w-3 h-3" /> Buat Baru
        </button>
      </div>
      {renderGroup('Post (4:5)', '1080 × 1350 px', post)}
      {renderGroup('Story (9:16)', '1080 × 1920 px', story)}
    </div>
  );
};

export default TemplateSelector;
