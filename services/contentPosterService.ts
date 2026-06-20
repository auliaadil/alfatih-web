import { supabase } from '@/src/lib/supabase'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

export interface CoverSlide {
  slideType: 'cover'
  title: string
  subtitle: string
}

export interface TipSlide {
  slideType: 'tip'
  number: number
  title: string
  body: string
}

export type ContentSlide = CoverSlide | TipSlide

export const generateContentPoster = async (
  topic: string,
  category: string,
  notes?: string,
  regenerateIndex?: number
): Promise<ContentSlide[]> => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Sesi tidak ditemukan. Silakan login ulang.')

  const body: Record<string, unknown> = { topic, category }
  if (notes?.trim()) body.notes = notes.trim()
  if (regenerateIndex !== undefined) body.regenerateIndex = regenerateIndex

  const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-content-poster`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error((data as any).error ?? `HTTP ${res.status}`)
  }

  const data = await res.json()
  if (!Array.isArray(data.slides)) throw new Error('Respons AI tidak valid.')
  return data.slides as ContentSlide[]
}
