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
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders })
  }

  try {
    const { templateType, package: pkg, topic, tagline, testimonial, textNodes } = await req.json()

    if (!textNodes || textNodes.length === 0 || templateType === 'blank') {
      return new Response(JSON.stringify(textNodes ?? []), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let contextBlock = ''
    let instructionBlock = ''

    switch (templateType) {
      case 'conversion': {
        if (!pkg) {
          return new Response(JSON.stringify(textNodes), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        const startingPrice = formatPrice(pkg.room_options?.[0]?.price)
        const tiers = (pkg.room_options || [])
          .slice(0, 3)
          .map((r: { name: string; price?: number }) => `${r.name}: ${formatPrice(r.price)}`)
          .join(' | ')
        const features = (pkg.features || []).slice(0, 6).join(', ')
        contextBlock = `
Nama Paket: ${pkg.title}
Tanggal Keberangkatan (Masehi): ${pkg.departure_date}
Tanggal Keberangkatan (Hijriah): ${pkg.departure_date_hijri || ''}
Durasi: ${pkg.duration}
Kategori: ${pkg.category}
Harga Mulai: ${startingPrice} per pax
Tipe Kamar: ${tiers}
Keunggulan: ${features}
Deskripsi: ${(pkg.description || '').substring(0, 200)}`
        instructionBlock = `
- Ganti headline utama dengan nama paket dan kata kunci unggulan.
- Ganti tanggal, durasi, harga dengan data aktual dari paket.
- Jika ada teks bulan Hijriah (contoh: "Syawal 1447H"), ganti dengan nilai Tanggal Keberangkatan (Hijriah) dari data paket.
- Ganti baris benefit/keunggulan dengan fitur aktual dari paket (maks 10 kata per baris).
- Ganti teks kategori/label dengan nama kategori paket.
- Pertahankan teks singkat seperti label tombol (Daftar Sekarang, Hubungi Kami), social handle, nama brand, dan nomor lisensi PPIU.`
        break
      }
      case 'edu-reminder': {
        contextBlock = `Topik: ${topic || 'Tips Umroh'}`
        instructionBlock = `
- Ganti headline poster dengan judul daftar yang menarik dan sesuai topik (contoh: "5 Barang Wajib Dibawa Saat Umroh").
- Ganti sub-headline dengan kalimat pengantar singkat.
- Ganti setiap judul item daftar bernomor dengan tips/langkah yang relevan dengan topik (maks 6 kata).
- Ganti setiap deskripsi item dengan penjelasan singkat (maks 12 kata).
- Jangan ubah social handle, nama brand, dan tombol.`
        break
      }
      case 'aspiration': {
        contextBlock = `Tagline kustom: ${tagline?.trim() || '(generate tagline spiritual yang menginspirasi)'}`
        instructionBlock = `
- Ganti teks tagline/kutipan utama dengan tagline spiritual yang menginspirasi (boleh menggunakan kata dari konteks, atau generate sendiri jika kosong).
- Ganti sub-tagline dengan kalimat undangan yang hangat dan profesional.
- Pertahankan nama brand, social handle, badge, dan teks pillar seperti "Islami", "Amanah", "Premium".`
        break
      }
      case 'social-proof': {
        const hasData = testimonial && (testimonial.quote || testimonial.name || testimonial.batch)
        contextBlock = hasData
          ? `Kutipan: "${testimonial.quote}"\nNama: ${testimonial.name}\nRombongan: ${testimonial.batch}`
          : '(AI akan membuat testimoni jamaah Umroh yang realistis dan positif)'
        instructionBlock = `
- Ganti teks kutipan testimoni dengan kutipan yang diberikan (atau generate jika kosong). Pertahankan gaya italic dan panjang yang mirip.
- Ganti nama jamaah dan info rombongan dengan data yang diberikan (atau generate jika kosong).
- Pertahankan statistik (1000+ Jamaah, 12 Thn, ★5.0), nama brand, social handle, dan tombol.`
        break
      }
      default:
        return new Response(JSON.stringify(textNodes), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

    const prompt = `
Kamu adalah copywriter profesional Alfatih Dunia Wisata — travel agent premium Indonesia untuk Umroh dan wisata Halal.

Tipe Template: ${templateType}

Data Konten:
${contextBlock}

Text node yang ada di poster saat ini (field teks yang bisa diedit di kanvas):
${JSON.stringify(textNodes, null, 2)}

Instruksi penggantian:
${instructionBlock}

ATURAN WAJIB:
1. Hanya ubah nilai "text" setiap node — "id" TIDAK boleh diubah.
2. Panjang teks baru harus mirip dengan aslinya agar tata letak poster tidak rusak.
3. JANGAN ubah: "Alfatih Dunia Wisata", "@alfatih.umroh", "adwisata.com", nomor PPIU, label tombol singkat, dan teks brand statis.
4. Gunakan Bahasa Indonesia untuk semua konten kecuali teks yang memang aslinya berbahasa Inggris.
5. Kembalikan HANYA array JSON yang valid — tanpa markdown, tanpa penjelasan.

Format respons:
[{ "id": "...", "text": "..." }, ...]`

    const model = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash-preview-05-20'
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not set')
      return new Response(
        JSON.stringify({ error: 'Server misconfiguration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const geminiRes = await fetch(
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

    if (!geminiRes.ok) {
      const errText = await geminiRes.text()
      throw new Error(`Gemini API error ${geminiRes.status}: ${errText}`)
    }

    const geminiData = await geminiRes.json()
    const raw = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]'
    const cleaned = raw.replace(/```json/gi, '').replace(/```/gi, '').trim()

    let parsed: unknown
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      console.error('Gemini returned non-JSON:', cleaned.slice(0, 200))
      throw new Error('Gemini returned invalid JSON')
    }

    if (!Array.isArray(parsed)) {
      console.error('Gemini did not return an array, falling back to original nodes:', typeof parsed)
      return new Response(JSON.stringify(textNodes), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('ai-poster-autofill error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
