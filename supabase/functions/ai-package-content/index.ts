import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type ContentType = 'description' | 'features' | 'itinerary' | 'included' | 'not_included'

interface Context {
  title: string
  category: string
  duration: string
  airline_names: string[]
  hotel_names: string[]
  routes: string
  description?: string
}

function buildPrompt(type: ContentType, ctx: Context): string {
  const base = `Paket wisata: "${ctx.title}", kategori: ${ctx.category}, durasi: ${ctx.duration}, maskapai: ${ctx.airline_names.join(', ')}, rute: ${ctx.routes}, hotel: ${ctx.hotel_names.join(', ')}.`

  if (type === 'description') return `${base}\n\nTulis deskripsi singkat paket wisata ini dalam 3-4 kalimat. Gunakan bahasa Indonesia yang hangat, Islami, dan menarik. Hanya kembalikan teks deskripsi saja, tanpa label.`

  if (type === 'features') return `${base}\nDeskripsi: ${ctx.description ?? '-'}\n\nBuat daftar 6-8 fitur unggulan paket ini dalam bahasa Indonesia. Format JSON array string. Contoh: ["Tiket pesawat PP", "Visa Umrah"]. Hanya kembalikan JSON array.`

  if (type === 'itinerary') return `${base}\nDeskripsi: ${ctx.description ?? '-'}\n\nBuat itinerary perjalanan hari per hari dalam JSON array. Setiap elemen: {"day": number, "title": string, "activities": string[]}. Jumlah hari sesuai durasi. Bahasa Indonesia, nada Islami. Hanya kembalikan JSON array.`

  if (type === 'included') return `${base}\n\nBuat daftar hal yang TERMASUK dalam paket ini dalam bahasa Indonesia. Format JSON array string. Contoh: ["Tiket pesawat PP", "Visa Umrah"]. Hanya kembalikan JSON array.`

  if (type === 'not_included') return `${base}\n\nBuat daftar hal yang TIDAK TERMASUK dalam paket ini dalam bahasa Indonesia. Format JSON array string. Contoh: ["Biaya pribadi", "Paspor"]. Hanya kembalikan JSON array.`

  return base
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

  const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))
  if (authError || !user) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

  const { type, context }: { type: ContentType; context: Context } = await req.json()

  const apiKey = Deno.env.get('GEMINI_API_KEY')!
  const model = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash-preview-05-20'
  const prompt = buildPrompt(type, context)

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  )

  const geminiData = await geminiRes.json()
  const raw = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  if (type === 'description') {
    return new Response(JSON.stringify({ description: raw.trim() }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  try {
    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : []
    return new Response(JSON.stringify({ [type]: parsed }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to parse AI response', raw }), { status: 500, headers: corsHeaders })
  }
})
