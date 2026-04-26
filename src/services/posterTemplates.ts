import { supabase } from '../lib/supabase';

export interface SavedTemplate {
    id: string;
    name: string;
    description: string;
    aspect_ratio: 'post' | 'story';
    template_type: string;
    canvas_json: object;
    thumbnail_data_url?: string;
    starter_id: string | null;
    created_at: string;
    updated_at: string;
}

export type SavedTemplateInsert = Omit<SavedTemplate, 'id' | 'created_at' | 'updated_at'>;

export const fetchTemplateByStarterId = async (starterId: string): Promise<SavedTemplate | null> => {
    const { data, error } = await supabase
        .from('poster_templates')
        .select('*')
        .eq('starter_id', starterId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    if (error) { console.error('fetchTemplateByStarterId:', error); return null; }
    return data;
};

export const fetchTemplates = async (): Promise<SavedTemplate[]> => {
    const { data, error } = await supabase
        .from('poster_templates')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) { console.error('fetchTemplates:', error); return []; }
    return data || [];
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
        .insert(payload)
        .select()
        .single();
    if (error) { console.error('saveTemplate:', error); return null; }
    return data;
};

export const updateTemplate = async (
    id: string,
    payload: Partial<SavedTemplateInsert>
): Promise<boolean> => {
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
