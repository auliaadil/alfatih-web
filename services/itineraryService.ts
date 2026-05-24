import { AIPlannerInput } from '../types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY

async function getRecaptchaToken(): Promise<string | null> {
  if (!SITE_KEY) return null
  const g = (window as any).grecaptcha
  if (!g) return null
  return new Promise<string>((resolve) => {
    g.ready(() => g.execute(SITE_KEY, { action: 'generate_itinerary' }).then(resolve))
  })
}

export const generateItinerary = async (input: AIPlannerInput): Promise<string> => {
  try {
    const recaptchaToken = await getRecaptchaToken()
    const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-itinerary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...input, recaptchaToken }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return data.itinerary ?? 'Mohon maaf, saya tidak dapat membuat itinerary saat ini. Silakan coba lagi.'
  } catch (error) {
    console.error('itineraryService error:', error)
    return 'Maaf, sistem AI kami sedang mengalami kendala. Silakan coba lagi beberapa saat lagi.'
  }
}
