import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

  const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))
  if (authError || !user) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

  const { query, source = 'unsplash', page = 1 } = await req.json()

  if (source === 'unsplash') {
    const key = Deno.env.get('UNSPLASH_ACCESS_KEY')!
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=12&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${key}` } }
    )
    const data = await res.json()
    const images = (data.results ?? []).map((p: any) => ({
      url: p.urls.full,
      thumb_url: p.urls.small,
      credit: `Photo by ${p.user.name} on Unsplash`,
    }))
    return new Response(JSON.stringify({ images }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  if (source === 'pixabay') {
    const key = Deno.env.get('PIXABAY_API_KEY')!
    const res = await fetch(
      `https://pixabay.com/api/?key=${key}&q=${encodeURIComponent(query)}&page=${page}&per_page=12&image_type=photo&orientation=horizontal`
    )
    const data = await res.json()
    const images = (data.hits ?? []).map((p: any) => ({
      url: p.largeImageURL,
      thumb_url: p.previewURL,
      credit: `Image by ${p.user} on Pixabay`,
    }))
    return new Response(JSON.stringify({ images }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  return new Response(JSON.stringify({ error: 'Invalid source' }), { status: 400, headers: corsHeaders })
})
