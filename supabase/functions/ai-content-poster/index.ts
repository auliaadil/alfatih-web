import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CoverSlide {
  slideType: 'cover'
  title: string
  subtitle: string
}

interface TipSlide {
  slideType: 'tip'
  number: number
  title: string
  body: string
}

type ContentSlide = CoverSlide | TipSlide

interface RequestBody {
  topic: string
  category: string
  notes?: string
  regenerateIndex?: number | null
}

const buildFullPrompt = (topic: string, category: string, notes?: string): string => {
  const notesBlock = notes?.trim() ? `\nCatatan tambahan: ${notes.trim()}` : ''
  return `Kamu adalah copywriter profesional Alfatih Dunia Wisata — travel agent premium Indonesia untuk Umroh dan wisata Halal.

Buat konten slide carousel Instagram berdasarkan topik berikut:
Topik: ${topic}
Label Kategori: ${category}${notesBlock}

Tulis dalam Bahasa Indonesia dengan nuansa Islami yang hangat.
Inferensikan jumlah tip slides dari topik (misal "5 Tips" → 5 tip slides). Selalu buat 1 cover slide di awal.

Kembalikan HANYA JSON valid tanpa markdown fence, komentar, atau teks lain di luar JSON. Format tepat:
{
  "slides": [
    { "slideType": "cover", "title": "...", "subtitle": "..." },
    { "slideType": "tip", "number": 1, "title": "...", "body": "..." }
  ]
}

Aturan:
- Cover slide: title adalah judul utama carousel (menarik, ~5-8 kata), subtitle adalah kalimat pendukung (1 kalimat)
- Tip slide: title adalah nama tip (singkat, ~4-7 kata), body adalah penjelasan 2-3 kalimat, maksimal 220 karakter
- Semua teks Bahasa Indonesia
- Nada: hangat, inspiratif, Islami`
}

const buildRegeneratePrompt = (topic: string, category: string, slideIndex: number, notes?: string): string => {
  const notesBlock = notes?.trim() ? `\nCatatan tambahan: ${notes.trim()}` : ''
  const isCover = slideIndex === 0
  const slideLabel = isCover
    ? 'cover slide (slide pertama, bukan tip)'
    : `tip slide nomor ${slideIndex}`
  return `Kamu adalah copywriter profesional Alfatih Dunia Wisata — travel agent premium Indonesia untuk Umroh dan wisata Halal.

Buat ulang SATU slide untuk carousel Instagram:
Topik Carousel: ${topic}
Label Kategori: ${category}
Slide yang dibuat ulang: ${slideLabel}${notesBlock}

Kembalikan HANYA JSON valid untuk satu slide object, tanpa markdown fence atau teks lain. Format tepat:
${isCover
  ? '{ "slideType": "cover", "title": "...", "subtitle": "..." }'
  : `{ "slideType": "tip", "number": ${slideIndex}, "title": "...", "body": "..." }`
}

Aturan: Bahasa Indonesia, nuansa Islami, body maksimal 220 karakter.`
}

const callGemini = async (prompt: string, apiKey: string, model: string): Promise<string> => {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-goog-api-key': apiKey,
      },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  )
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Gemini API error ${res.status}: ${errText}`)
  }
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

const stripFences = (text: string): string =>
  text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
    authHeader.replace('Bearer ', '')
  )
  if (authError || !user) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders })
  }

  try {
    const body: RequestBody = await req.json()
    const { topic, category, notes, regenerateIndex } = body

    if (!topic?.trim() || !category?.trim()) {
      return new Response(JSON.stringify({ error: 'topic and category are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const model = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash-preview-05-20'
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Server misconfiguration' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const isSingleSlide = regenerateIndex != null
    const prompt = isSingleSlide
      ? buildRegeneratePrompt(topic, category, regenerateIndex!, notes)
      : buildFullPrompt(topic, category, notes)

    let rawText = stripFences(await callGemini(prompt, apiKey, model))

    let parsed: any
    try {
      parsed = JSON.parse(rawText)
    } catch {
      const retryText = stripFences(
        await callGemini(`Return ONLY the raw JSON, no markdown:\n\n${prompt}`, apiKey, model)
      )
      parsed = JSON.parse(retryText)
    }

    if (isSingleSlide) {
      return new Response(JSON.stringify({ slides: [parsed as ContentSlide] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ slides: parsed.slides as ContentSlide[] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('ai-content-poster error:', message)
    return new Response(JSON.stringify({ error: 'Internal server error', detail: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
