import { supabase } from '@/src/lib/supabase'
import { TourPackage } from '../types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

export type CampaignType = 'paket-wisata' | 'instagram'
export type CampaignChannel = 'whatsapp' | 'instagram'

export interface GenerateCampaignInput {
  type: CampaignType
  channel: CampaignChannel
  package?: TourPackage
  occasion?: string
  occasionPackage?: TourPackage | null
  theme?: string
  notes?: string
}

export const generateCampaignText = async (input: GenerateCampaignInput): Promise<string> => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Sesi tidak ditemukan. Silakan login ulang.')

  const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-text-campaign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(input),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `HTTP ${res.status}`)
  }

  const data = await res.json()
  if (!data.text) throw new Error('Respons AI tidak valid.')
  return data.text
}
