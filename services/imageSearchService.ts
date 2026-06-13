import { supabase } from '../src/lib/supabase';

export interface ImageResult {
  url: string;
  thumb_url: string;
  credit: string;
}

export async function searchImages(
  query: string,
  source: 'unsplash' | 'pixabay',
  page = 1
): Promise<ImageResult[]> {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/image-search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
    body: JSON.stringify({ query, source, page }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Image search failed');
  return json.images ?? [];
}
