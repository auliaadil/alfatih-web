import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SERPAPI_BASE = 'https://serpapi.com/search.json'
const RESEND_BASE = 'https://api.resend.com'
const MAX_WATCHLISTS = parseInt(Deno.env.get('MAX_WATCHLISTS_PER_RUN') ?? '15')

interface WatchlistRow {
  id: string
  origin: string
  destination: string
  date_range_start: string
  date_range_end: string
  target_price_max: number
  adults: number
}

interface NewAlert {
  watchlist_id: string
  price: number
  departure_date: string
  airline: string
  flight_details: unknown
  is_notified: boolean
}

interface PendingAlert extends NewAlert {
  id: string
  created_at: string
  watchlist: WatchlistRow
}

async function pickDate(
  supabase: ReturnType<typeof createClient>,
  watchlist: WatchlistRow
): Promise<string | null> {
  const today = new Date().toISOString().split('T')[0]
  const rangeStart = watchlist.date_range_start > today ? watchlist.date_range_start : today
  if (rangeStart > watchlist.date_range_end) return null

  const { data: existing } = await supabase
    .from('deal_alerts')
    .select('departure_date')
    .eq('watchlist_id', watchlist.id)

  const found = new Set<string>(
    (existing ?? []).map((r: { departure_date: string }) => r.departure_date)
  )

  const cursor = new Date(rangeStart)
  const end = new Date(watchlist.date_range_end)
  while (cursor <= end) {
    const d = cursor.toISOString().split('T')[0]
    if (!found.has(d)) return d
    cursor.setDate(cursor.getDate() + 1)
  }
  return null
}

async function searchFlight(
  origin: string,
  destination: string,
  date: string,
  adults: number
): Promise<{ price: number; airline: string; details: unknown } | null> {
  const params = new URLSearchParams({
    engine: 'google_flights',
    departure_id: origin,
    arrival_id: destination,
    outbound_date: date,
    adults: String(adults),
    currency: 'IDR',
    hl: 'id',
    type: '2', // one-way
    api_key: Deno.env.get('SERPAPI_KEY')!,
  })

  const res = await fetch(`${SERPAPI_BASE}?${params}`)

  if (res.status === 429) throw new Error('RATE_LIMIT')
  if (res.status === 401 || res.status === 403) throw new Error('INVALID_KEY')
  if (!res.ok) return null

  const data = await res.json()

  // SerpApi returns {"error": "..."} with 200 when key is invalid or quota exceeded
  if (data.error) {
    if ((data.error as string).toLowerCase().includes('quota')) throw new Error('RATE_LIMIT')
    throw new Error(`SERPAPI_ERROR: ${data.error}`)
  }

  const flights = [
    ...((data.best_flights as unknown[]) ?? []),
    ...((data.other_flights as unknown[]) ?? []),
  ] as Record<string, unknown>[]

  if (flights.length === 0) return null

  const cheapest = flights.reduce((a, b) =>
    (a.price as number) <= (b.price as number) ? a : b
  )

  const price = cheapest.price as number
  const segments = cheapest.flights as Record<string, unknown>[] | undefined
  const airline = (segments?.[0]?.airline as string) ?? 'Unknown'

  return { price, airline, details: cheapest }
}

async function sendAlertEmail(alert: PendingAlert, watchlist: WatchlistRow): Promise<void> {
  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!resendKey) return

  const recipients = (Deno.env.get('DEAL_ALERT_EMAIL') ?? '')
    .split(',').map(e => e.trim()).filter(Boolean)
  if (recipients.length === 0) return

  const fmt = (n: number) => 'Rp ' + new Intl.NumberFormat('id-ID').format(n)
  const savings = watchlist.target_price_max - alert.price

  const html = `<div style="font-family:sans-serif;max-width:480px;margin:0 auto">
    <h2 style="color:#0084ff">🎯 Deal Ditemukan!</h2>
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:6px 0;color:#666">Rute</td><td style="padding:6px 0;font-weight:bold">${watchlist.origin} → ${watchlist.destination}</td></tr>
      <tr><td style="padding:6px 0;color:#666">Keberangkatan</td><td style="padding:6px 0">${alert.departure_date}</td></tr>
      <tr><td style="padding:6px 0;color:#666">Maskapai</td><td style="padding:6px 0">${alert.airline}</td></tr>
      <tr><td style="padding:6px 0;color:#666">Harga</td><td style="padding:6px 0;font-size:1.2em;color:#16a34a;font-weight:bold">${fmt(alert.price)}</td></tr>
      <tr><td style="padding:6px 0;color:#666">Target Maks</td><td style="padding:6px 0">${fmt(watchlist.target_price_max)}</td></tr>
      <tr><td style="padding:6px 0;color:#666">Hemat</td><td style="padding:6px 0;color:#16a34a">${fmt(savings)} di bawah target</td></tr>
      <tr><td style="padding:6px 0;color:#666">Dewasa</td><td style="padding:6px 0">${watchlist.adults}</td></tr>
    </table>
  </div>`

  await fetch(`${RESEND_BASE}/emails`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: Deno.env.get('DEAL_ALERT_FROM_EMAIL') ?? 'Deal Hunter <onboarding@resend.dev>',
      to: recipients,
      subject: `Deal: ${watchlist.origin}→${watchlist.destination} ${fmt(alert.price)} (${alert.departure_date})`,
      html,
    }),
  })
}

Deno.serve(async (req) => {
  const cronSecret = Deno.env.get('CRON_SECRET')
  if (!cronSecret) {
    return new Response('Server misconfiguration: CRON_SECRET not set', { status: 500 })
  }
  if (req.headers.get('Authorization') !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // 1. Load active watchlists
  const { data: watchlists, error: wErr } = await supabase
    .from('watchlists')
    .select('*')
    .eq('is_active', true)
    .limit(MAX_WATCHLISTS)

  if (wErr || !watchlists) {
    return new Response(JSON.stringify({ error: 'Failed to load watchlists' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }

  const log: string[] = []

  // 2. Process each watchlist sequentially
  for (const watchlist of watchlists as WatchlistRow[]) {
    try {
      const date = await pickDate(supabase, watchlist)
      if (!date) {
        log.push(`${watchlist.id}: skipped — no unchecked future dates`)
        continue
      }

      let result: { price: number; airline: string; details: unknown } | null = null
      try {
        result = await searchFlight(watchlist.origin, watchlist.destination, date, watchlist.adults)
      } catch (err) {
        const msg = String(err)
        if (msg.includes('RATE_LIMIT')) {
          log.push('Rate limit hit — aborting')
          break
        }
        if (msg.includes('INVALID_KEY')) {
          return new Response(JSON.stringify({ error: 'Invalid SerpApi key', log }), {
            status: 500, headers: { 'Content-Type': 'application/json' },
          })
        }
        log.push(`${watchlist.id}: search error — ${msg}`)
        await supabase.from('watchlists').update({ last_checked_at: new Date().toISOString() }).eq('id', watchlist.id)
        continue
      }

      if (result && result.price <= watchlist.target_price_max) {
        const { error: insertErr } = await supabase.from('deal_alerts').insert({
          watchlist_id: watchlist.id,
          price: result.price,
          departure_date: date,
          airline: result.airline,
          flight_details: result.details,
          is_notified: false,
        })
        if (!insertErr) {
          log.push(`${watchlist.id}: deal — ${result.airline} Rp ${result.price} on ${date}`)
        } else if (insertErr.code === '23505') {
          log.push(`${watchlist.id}: duplicate skipped`)
        } else {
          log.push(`${watchlist.id}: insert error — ${insertErr.message}`)
        }
      } else {
        log.push(`${watchlist.id}: no deal on ${date} (${result ? `Rp ${result.price}` : 'no results'})`)
      }

      await supabase.from('watchlists').update({ last_checked_at: new Date().toISOString() }).eq('id', watchlist.id)
    } catch (err) {
      log.push(`${watchlist.id}: unexpected error — ${err}`)
    }
  }

  // 3. Email unnotified alerts
  const { data: pending } = await supabase
    .from('deal_alerts')
    .select('*, watchlist:watchlists(*)')
    .eq('is_notified', false)

  for (const alert of (pending ?? []) as unknown as PendingAlert[]) {
    try {
      await sendAlertEmail(alert, alert.watchlist)
      await supabase.from('deal_alerts').update({ is_notified: true }).eq('id', alert.id)
      log.push(`email sent for alert ${alert.id}`)
    } catch (err) {
      log.push(`email error for ${alert.id}: ${err}`)
    }
  }

  return new Response(JSON.stringify({ ok: true, processed: (watchlists as WatchlistRow[]).length, log }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
