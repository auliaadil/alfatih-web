import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const formatPrice = (price?: number) =>
  price
    ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price)
    : 'Hubungi Kami'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

  try {
    const { templateType, fieldValues, package: pkg, topic, tagline, testimonial } = await req.json()

    if (!fieldValues || templateType === 'blank') {
      return new Response(JSON.stringify({ fieldValues: fieldValues ?? {} }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let contextBlock = ''
    let instructionBlock = ''

    switch (templateType) {
      case 'conversion': {
        if (!pkg) return new Response(JSON.stringify({ fieldValues }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        const startingPrice = formatPrice(pkg.room_options?.[0]?.price)
        const tiers = (pkg.room_options || []).slice(0, 3).map((r: { name: string; price?: number }) => `${r.name}: ${formatPrice(r.price)}`).join(' | ')
        const features = (pkg.features || []).slice(0, 6).join(', ')
        contextBlock = `Nama Paket: ${pkg.title}\nTanggal: ${pkg.departure_date}\nDurasi: ${pkg.duration}\nKategori: ${pkg.category}\nHarga Mulai: ${startingPrice}\nTipe Kamar: ${tiers}\nKeunggulan: ${features}\nDeskripsi: ${(pkg.description || '').substring(0, 200)}`
        instructionBlock = `- Isi "headline" dengan nama paket yang menarik.\n- Isi "badge_text" dengan kategori paket (maks 3 kata).\n- Isi "departure" dengan tanggal keberangkatan.\n- Isi "duration" dengan durasi perjalanan.\n- Isi "price" dengan harga mulai aktual.\n- Isi "feature_1" s/d "feature_4" dengan keunggulan utama paket (maks 5 kata per item).\n- Jangan ubah field yang tidak terdaftar.`
        break
      }
      case 'edu-reminder': {
        contextBlock = `Topik: ${topic || 'Tips Umroh'}`
        instructionBlock = `- Isi "headline" dengan judul daftar yang menarik (contoh: "5 Barang Wajib Dibawa Saat Umroh").\n- Isi "intro" dengan kalimat pengantar singkat.\n- Isi "item_1_title" s/d "item_5_title" dengan tips/langkah yang relevan (maks 6 kata).\n- Isi "item_1_desc" s/d "item_5_desc" dengan penjelasan singkat (maks 12 kata).`
        break
      }
      case 'aspiration': {
        contextBlock = `Tagline kustom: ${tagline?.trim() || '(generate tagline spiritual menginspirasi)'}`
        instructionBlock = `- Isi "tagline" dengan tagline spiritual yang menginspirasi.\n- Isi "sub_tagline" dengan kalimat undangan hangat dan profesional.`
        break
      }
      case 'social-proof': {
        const hasData = testimonial && (testimonial.quote || testimonial.name || testimonial.batch)
        contextBlock = hasData
          ? `Kutipan: "${testimonial.quote}"\nNama: ${testimonial.name}\nRombongan: ${testimonial.batch}`
          : '(AI buat testimoni jamaah Umroh yang realistis dan positif)'
        instructionBlock = `- Isi "quote" dengan kutipan testimoni (atau generate jika tidak ada data).\n- Isi "author_name" dengan nama jamaah.\n- Isi "batch" dengan info rombongan.\n- Pertahankan "stat_1", "stat_2", "rating" jika sudah ada nilainya.`
        break
      }
      default:
        return new Response(JSON.stringify({ fieldValues }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const currentValues = Object.entries(fieldValues as Record<string, string>)
      .map(([k, v]) => `  "${k}": "${v}"`)
      .join('\n')

    const prompt = `
Kamu adalah copywriter profesional Alfatih Dunia Wisata — travel agent premium Indonesia untuk Umroh dan wisata Halal.

Tipe Template: ${templateType}

Data Konten:
${contextBlock}

Nilai field poster saat ini:
{
${currentValues}
}

Instruksi:
${instructionBlock}

ATURAN WAJIB:
1. Kembalikan HANYA objek JSON dengan field yang diubah — key sama persis seperti di atas.
2. Panjang teks baru harus mirip dengan aslinya agar tata letak poster tidak rusak.
3. JANGAN ubah: "Alfatih Dunia Wisata", "@alfatih.umroh", "adwisata.com", nomor PPIU.
4. Gunakan Bahasa Indonesia untuk semua konten kecuali teks yang memang aslinya berbahasa Inggris.
5. Kembalikan format: { "fieldValues": { "key": "value", ... } } — tanpa markdown, tanpa penjelasan.`

    const model = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash-preview-05-20'
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) return new Response(JSON.stringify({ error: 'Server misconfiguration' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) }
    )

    if (!geminiRes.ok) throw new Error(`Gemini API error ${geminiRes.status}`)

    const geminiData = await geminiRes.json()
    const raw = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'
    const cleaned = raw.replace(/```json/gi, '').replace(/```/gi, '').trim()

    let parsed: { fieldValues?: Record<string, string> }
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      throw new Error('Gemini returned invalid JSON')
    }

    const merged = { ...fieldValues, ...(parsed.fieldValues ?? {}) }

    return new Response(JSON.stringify({ fieldValues: merged }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('ai-poster-autofill error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
