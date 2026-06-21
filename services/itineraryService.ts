import { AIPlannerInput } from '../types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY

// Singleton promise — shared across all calls so the script loads exactly once.
let scriptPromise: Promise<void> | null = null

export function preloadRecaptcha(): void {
  if (!SITE_KEY || scriptPromise) return
  scriptPromise = new Promise<void>((resolve, reject) => {
    if ((window as any).grecaptcha) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`
    script.onload = () => resolve()
    script.onerror = () => {
      scriptPromise = null // allow retry on next call
      reject(new Error('reCAPTCHA script failed to load'))
    }
    document.head.appendChild(script)
  })
}

async function getRecaptchaToken(): Promise<string | null> {
  if (!SITE_KEY) return null
  if (!scriptPromise) preloadRecaptcha()
  try {
    await scriptPromise
  } catch {
    return null
  }
  const g = (window as any).grecaptcha
  if (!g?.execute) return null
  return new Promise<string | null>((resolve, reject) => {
    g.ready(() =>
      g
        .execute(SITE_KEY, { action: 'generate_itinerary' })
        .then((token: string) => resolve(token))
        .catch((err: any) => {
          console.error('reCAPTCHA execution error (domain not whitelisted or invalid key):', err)
          resolve(null)
        })
    )
  })
}

export const generateItinerary = async (input: AIPlannerInput): Promise<string> => {
  try {
    const recaptchaToken = await getRecaptchaToken()
    if (!recaptchaToken) {
      throw new Error('Gagal mendapatkan token reCAPTCHA. Pastikan domain aplikasi sudah diizinkan di Google reCAPTCHA Console.')
    }
    const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-itinerary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...input, recaptchaToken }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(`HTTP ${res.status}: ${JSON.stringify(body)}`)
    }
    const data = await res.json()
    return data.itinerary || 'Mohon maaf, saya tidak dapat membuat itinerary saat ini. Silakan coba lagi.'
  } catch (error) {
    console.error('itineraryService error:', error)
    return 'Maaf, sistem AI kami sedang mengalami kendala. Silakan coba lagi beberapa saat lagi.'
  }
}
