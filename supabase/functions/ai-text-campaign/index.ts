import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const formatPrice = (price?: number) =>
  price
    ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price)
    : 'Hubungi Kami'

interface RoomOption { name: string; price?: number }

interface PackageData {
  title: string
  slug?: string
  category: string
  duration: string
  departure_date: string
  room_options?: RoomOption[]
  features?: string[]
  description?: string
}

interface RequestBody {
  type: 'paket-wisata' | 'konten-edukasi' | 'instagram'
  channel: 'whatsapp' | 'instagram'
  package?: PackageData
  occasion?: string
  occasionPackage?: PackageData | null
  theme?: string
  notes?: string
  topic?: string
  audience?: string
  slideCount?: number
}

const buildPackageBlock = (pkg: PackageData): string => {
  const startingPrice = formatPrice(pkg.room_options?.[0]?.price)
  const tiers = (pkg.room_options ?? [])
    .slice(0, 3)
    .map(r => `${r.name}: ${formatPrice(r.price)}`)
    .join(' | ')
  const features = (pkg.features ?? []).slice(0, 6).join(', ')
  const publicUrl = pkg.slug ? `adwisata.com/package/${pkg.slug}` : 'adwisata.com'
  return `Nama Paket  : ${pkg.title}
Kategori    : ${pkg.category}
Durasi      : ${pkg.duration}
Keberangkatan: ${pkg.departure_date}
Harga Mulai : ${startingPrice} per pax
Tipe Kamar  : ${tiers}
Keunggulan  : ${features}
Deskripsi   : ${(pkg.description ?? '').substring(0, 200)}
Link Publik : ${publicUrl}`
}

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
    const { type, channel, occasion, theme, notes, topic, audience, slideCount } = body
    const pkg = body.package
    const occasionPkg = body.occasionPackage ?? null

    const channelLabel = channel === 'whatsapp' ? 'WhatsApp Broadcast' : 'Instagram Caption'
    let contextBlock = ''
    let instructionBlock = ''

    if (type === 'paket-wisata') {
      if (!pkg) {
        return new Response(JSON.stringify({ error: 'Package data required for paket-wisata type' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      contextBlock = buildPackageBlock(pkg)
      if (channel === 'whatsapp') {
        instructionBlock = `Tulis pesan WhatsApp broadcast promosi paket wisata dengan ketentuan:
- Buka dengan salam Islami yang hangat (Assalamualaikum) + 1-2 emoji relevan
- Sebutkan nama paket, harga mulai, dan 4-5 keunggulan utama (format daftar dengan ✅)
- Sertakan ajakan bertindak yang mendesak (kuota terbatas, InshaAllah)
- Tutup dengan link publik paket dan nomor kontak placeholder (format: +62 812-XXXX-XXXX)
- Gunakan *teks tebal* untuk nama paket dan harga (format bold WhatsApp)
- Panjang: 150-250 kata
- Nada: hangat, profesional, Islami`
      } else {
        instructionBlock = `Tulis caption Instagram promosi paket wisata dengan ketentuan:
- Baris pertama: hook yang menarik perhatian (bisa pertanyaan atau pernyataan impactful) + emoji
- Paragraf utama: deskripsi paket yang menginspirasi, 3-4 keunggulan key
- Call-to-action: arahkan ke link di bio atau link paket
- Tutup dengan 8-12 hashtag relevan (#WisataHalal #UmrohMurah #AlfatihDuniaWisata dll)
- Sertakan link publik paket sebelum hashtag
- Panjang: 100-180 kata (belum termasuk hashtag)
- Nada: inspiratif, aspirasional, Islami`
      }
    } else if (type === 'konten-edukasi') {
      if (!topic) {
        return new Response(JSON.stringify({ error: 'Topic required for konten-edukasi type' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      contextBlock = `Topik: ${topic}\nTarget Audiens: ${audience || 'Umum'}\nJumlah Slide: ${slideCount || 1}`
      
      instructionBlock = `Tulis konten edukasi/interaksi (carousel/poster slides) dengan ketentuan:
- Format jawaban WAJIB menggunakan marker slide seperti ini:
[SLIDE 1]
Judul: ...
Teks: ...
[SLIDE 2]
Judul: ...
Teks: ...
- Buat tepat ${slideCount || 1} slide.
- Slide 1 biasanya sebagai Hook/Judul Utama.
- Slide terakhir biasanya Call to Action.
- Jangan tambahkan teks apa pun di luar blok [SLIDE N].`
    } else if (type === 'instagram') {
      if (!pkg) {
        return new Response(JSON.stringify({ error: 'Package data required for instagram type' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      contextBlock = buildPackageBlock(pkg)
      if (theme) contextBlock += `\nTema / Angle: ${theme}`
      if (channel === 'whatsapp') {
        instructionBlock = `Tulis pesan WhatsApp caption-style untuk paket wisata ini dengan ketentuan:
- Pendekatan: gaya caption yang engaging, bukan broadcast formal
- Hook menarik di awal, ceritakan pengalaman yang bisa dirasakan
- Sebutkan paket, harga, dan link dengan cara yang natural
- Tutup dengan ajakan bertindak yang ringan
- Panjang: 100-180 kata
- Nada: santai, personal, inspiratif`
      } else {
        instructionBlock = `Tulis caption Instagram untuk paket wisata ini dengan ketentuan:
- Hook kuat di baris pertama (pertanyaan retoris, pernyataan bold, atau kutipan pendek)
${theme ? `- Fokus angle: ${theme}` : ''}
- Ceritakan pengalaman/nilai paket, bukan hanya spesifikasi teknis
- Call-to-action yang soft: "link di bio", "DM kami", atau link langsung
- Sertakan link publik paket
- Tutup dengan 10-15 hashtag relevan (campur antara niche dan populer)
- Panjang: 120-200 kata (belum termasuk hashtag)
- Nada: autentik, inspiratif, aspirasional`
      }
    }

    const notesBlock = notes?.trim() ? `\nCatatan tambahan dari admin: ${notes.trim()}` : ''

    const prompt = `Kamu adalah copywriter profesional Alfatih Dunia Wisata — travel agent premium Indonesia untuk Umroh dan wisata Halal.

Channel Target: ${channelLabel}
Tipe Pesan: ${type}

--- DATA KONTEN ---
${contextBlock}${notesBlock}

--- INSTRUKSI ---
${instructionBlock}

ATURAN WAJIB:
1. Bahasa Indonesia yang hangat dan profesional.
2. Pertahankan nuansa Islami di tempat yang tepat.
3. Jangan tambahkan judul, heading, atau penjelasan apapun di luar teks pesan.
4. Jangan gunakan placeholder seperti [nama penerima] atau [isi sendiri].
5. Nama brand: "Alfatih Dunia Wisata" — jangan diubah.
6. Tulis HANYA teks pesan yang siap digunakan langsung.`

    const model = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash-preview-05-20'
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Server misconfiguration' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
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
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('ai-text-campaign error:', message)
    return new Response(JSON.stringify({ error: 'Internal server error', detail: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
