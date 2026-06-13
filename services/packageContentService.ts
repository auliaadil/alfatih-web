import { supabase } from '../src/lib/supabase';
import { DayItinerary } from '../types';

export interface PackageContentContext {
  title: string;
  category: string;
  duration: string;
  airline_names: string[];
  hotel_names: string[];
  routes: string;
  description?: string;
}

async function callAI(type: string, context: PackageContentContext) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-package-content`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
    body: JSON.stringify({ type, context }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'AI request failed');
  return json;
}

export async function generateDescription(ctx: PackageContentContext): Promise<string> {
  const json = await callAI('description', ctx);
  return json.description;
}

export async function generateFeatures(ctx: PackageContentContext): Promise<string[]> {
  const json = await callAI('features', ctx);
  return json.features ?? [];
}

export async function generateItinerary(ctx: PackageContentContext): Promise<DayItinerary[]> {
  const json = await callAI('itinerary', ctx);
  return json.itinerary ?? [];
}

export async function generateIncluded(ctx: PackageContentContext): Promise<string[]> {
  const json = await callAI('included', ctx);
  return json.included ?? [];
}

export async function generateNotIncluded(ctx: PackageContentContext): Promise<string[]> {
  const json = await callAI('not_included', ctx);
  return json.not_included ?? [];
}
