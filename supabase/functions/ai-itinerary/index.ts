const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { recaptchaToken, destination, days, travelers, interests } = await req.json()

    const recaptchaSecret = Deno.env.get('RECAPTCHA_SECRET_KEY')
    if (!recaptchaSecret) {
      console.error('RECAPTCHA_SECRET_KEY is not set')
      return new Response(
        JSON.stringify({ error: 'Server misconfiguration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const recaptchaRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: recaptchaSecret,
        response: recaptchaToken ?? '',
      }),
    })
    const recaptchaData = await recaptchaRes.json()
    if (!recaptchaData.success || recaptchaData.score < 0.5) {
      return new Response(
        JSON.stringify({ error: 'reCAPTCHA verification failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const prompt = `
You are the "Alfatih Private Trip Assistant", a world-class travel expert for Alfatih Dunia Wisata.
Alfatih Dunia Wisata is a premium Indonesian travel agency specializing in Umrah and Halal-friendly international travel.

Task: Generate a detailed, inspiring, and practical PRIVATE TRIP draft itinerary based on user preferences.

User Preferences:
- Destination: ${destination}
- Duration: ${days} Days
- Travelers: ${travelers}
- Key Interests: ${(interests as string[]).join(', ')}

Strict Requirements:
1. Language: The itinerary MUST be generated in Indonesian (Bahasa Indonesia).
2. Tone: Warm, professional, and Islamic-friendly (use "Assalamualaikum", "InshaAllah" where appropriate).
3. Halal Focus: For non-Muslim countries, always suggest specific areas or tips for finding Halal food and mentioning prayer facilities (Masjids or Musallas).
4. Structure:
   - Start with an exciting "Draft Overview" for this Private Trip.
   - Day-by-day breakdown with titles (e.g., Hari 1: Kedatangan & Wisata Kota).
   - Include 3-4 specific activities per day.
   - End with "Pro Travel Tips" for this specific destination.
5. Formatting: Use clean Markdown (Bold headers, bullet points).
6. Signature: Explicitly remind the user that this is a draft and they must contact Alfatih Dunia Wisata to get the official itinerary and pricing (Cek harga dan itinerary resmi ke tim Alfatih).

Make it feel personalized and luxurious, but clearly state it's a draft reference.
`

    const model = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash-preview-05-20'
    const apiKey = Deno.env.get('GEMINI_API_KEY') ?? ''
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    )

    if (!geminiRes.ok) {
      const errText = await geminiRes.text()
      throw new Error(`Gemini API error ${geminiRes.status}: ${errText}`)
    }
    const geminiData = await geminiRes.json()
    const itinerary = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    return new Response(
      JSON.stringify({ itinerary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('ai-itinerary error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
