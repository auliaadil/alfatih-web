import { supabase } from '@/src/lib/supabase'
import { TourPackage } from '../types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

export type TemplateType = 'conversion' | 'aspiration' | 'edu-reminder' | 'social-proof' | 'blank'

export interface TemplateInputs {
  templateType: TemplateType
  package?: TourPackage
  topic?: string
  tagline?: string
  testimonial?: { quote: string; name: string; batch: string }
}

export const applyTemplateContent = async (
  inputs: TemplateInputs,
  textNodes: { id: string; text: string }[]
): Promise<{ id: string; text: string }[]> => {
  if (textNodes.length === 0 || inputs.templateType === 'blank') return textNodes

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return textNodes

    const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-poster-autofill`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ ...inputs, textNodes }),
    })

    if (!res.ok) return textNodes
    const result = await res.json()
    return Array.isArray(result) ? result : textNodes
  } catch (err) {
    console.error('posterAutofillService error:', err)
    return textNodes
  }
}

export const generateTemplateAutofill = async (
  tour: TourPackage,
  textNodes: { id: string; text: string }[]
): Promise<{ id: string; text: string }[]> =>
  applyTemplateContent({ templateType: 'conversion', package: tour }, textNodes)
