import { supabase } from '../lib/supabase';
import { SavedTemplate, BlockConfig, FieldSchema, AspectRatio } from '../components/admin/PosterMaker/types';

export type { SavedTemplate };

export type SavedTemplateInsert = {
  name: string;
  description: string;
  aspect_ratio: AspectRatio;
  template_type: string;
  blocks: BlockConfig[];
  field_schema: FieldSchema[];
  thumbnail_data_url?: string;
  canvas_json?: null;
};

export const fetchTemplates = async (): Promise<SavedTemplate[]> => {
  const { data, error } = await supabase
    .from('poster_templates')
    .select('*')
    .not('blocks', 'is', null)
    .order('created_at', { ascending: false });
  if (error) { console.error('fetchTemplates:', error); return []; }
  return data ?? [];
};

export const fetchTemplate = async (id: string): Promise<SavedTemplate | null> => {
  const { data, error } = await supabase
    .from('poster_templates')
    .select('*')
    .eq('id', id)
    .single();
  if (error) { console.error('fetchTemplate:', error); return null; }
  return data;
};

export const saveTemplate = async (payload: SavedTemplateInsert): Promise<SavedTemplate | null> => {
  const { data, error } = await supabase
    .from('poster_templates')
    .insert({ ...payload, canvas_json: null })
    .select()
    .single();
  if (error) { console.error('saveTemplate:', error); return null; }
  return data;
};

export const updateTemplate = async (id: string, payload: Partial<SavedTemplateInsert>): Promise<boolean> => {
  const { error } = await supabase
    .from('poster_templates')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) { console.error('updateTemplate:', error); return false; }
  return true;
};

export const deleteTemplate = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from('poster_templates').delete().eq('id', id);
  if (error) { console.error('deleteTemplate:', error); return false; }
  return true;
};
