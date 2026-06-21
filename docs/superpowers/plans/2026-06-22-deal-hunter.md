# Deal Hunter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a scheduled flight-price monitoring system with an admin dashboard to manage watchlists and view deal alerts.

**Architecture:** A Supabase Edge Function (`deal-hunter-cron`) runs daily via pg_cron, queries Amadeus Self-Service for the cheapest flight on each active watchlist, inserts a `deal_alert` row when a price beats the target, and sends a Resend email for each unnotified alert. The admin UI is a React page at `/admin/deal-hunter` using the existing `PageHeader + SectionCard` pattern.

**Tech Stack:** React 18 + TypeScript, Supabase (PostgreSQL + RLS + Edge Functions + pg_cron + pg_net), Amadeus Self-Service REST API, Resend email API, Deno (Edge Function runtime), Tailwind CSS via CDN, lucide-react icons.

## Global Constraints

- All UI copy in Bahasa Indonesia.
- Tailwind via CDN only — do not touch PostCSS or vite config.
- TypeScript strict mode — no untyped `any`; use explicit casts only where Supabase returns untyped JSON.
- Import all admin UI primitives from `../../components/admin/ui` (e.g. `SlideOver`, `SectionCard`, `TableCard`, `btnPrimary`) — do not create new primitives.
- Edge Functions run on Deno — use `https://esm.sh/` imports only.
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically in Edge Functions.
- Do not create documentation or README files.
- Gemini / AI features are out of scope for this feature.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `supabase/migrations/20260622000001_add_deal_hunter_tables.sql` | Create | DB schema: `watchlists`, `deal_alerts`, `system_tokens`, RLS |
| `supabase/functions/deal-hunter-cron/index.ts` | Create | Daily cron: Amadeus search → deal detection → Resend email |
| `src/components/admin/DealHunter/types.ts` | Create | Shared TS types: `Watchlist`, `DealAlert`, `WatchlistFormData`, `EMPTY_WATCHLIST_FORM` |
| `src/components/admin/DealHunter/WatchlistForm.tsx` | Create | SlideOver form for add/edit watchlist |
| `src/components/admin/DealHunter/WatchlistTable.tsx` | Create | Table + CRUD actions + toggle; embeds `WatchlistForm` |
| `src/components/admin/DealHunter/DealAlertTable.tsx` | Create | Read-only alert table with filter chips + row expansion |
| `src/pages/admin/DealHunter.tsx` | Create | Page shell: `PageHeader` + two `SectionCard` wrappers |
| `App.tsx` | Modify | Add `deal-hunter` route inside `RoleGuard` |
| `src/pages/admin/AdminLayout.tsx` | Modify | Add `Target` icon + nav item in Marketing group |

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260622000001_add_deal_hunter_tables.sql`

**Interfaces:**
- Produces: `watchlists`, `deal_alerts`, `system_tokens` tables consumed by Tasks 2, 4, 5, 6

- [ ] **Step 1: Write the migration file**

```sql
-- supabase/migrations/20260622000001_add_deal_hunter_tables.sql

-- Admin-defined routes to monitor
create table watchlists (
  id                uuid primary key default gen_random_uuid(),
  origin            text not null,
  destination       text not null,
  date_range_start  date not null,
  date_range_end    date not null,
  target_price_max  numeric not null,
  adults            int not null default 1,
  is_active         boolean not null default true,
  created_by        uuid references auth.users(id),
  last_checked_at   timestamptz,
  created_at        timestamptz not null default now()
);

-- Prices found below threshold
create table deal_alerts (
  id              uuid primary key default gen_random_uuid(),
  watchlist_id    uuid references watchlists(id) on delete cascade,
  price           numeric not null,
  departure_date  date not null,
  airline         text not null,
  flight_details  jsonb not null,
  is_notified     boolean not null default false,
  created_at      timestamptz not null default now(),
  unique (watchlist_id, departure_date, price)
);

-- OAuth token cache (Amadeus)
create table system_tokens (
  service       text primary key,
  access_token  text not null,
  expires_at    timestamptz not null
);

-- RLS
alter table watchlists   enable row level security;
alter table deal_alerts  enable row level security;
alter table system_tokens enable row level security;

create policy "authenticated_watchlists_all"
  on watchlists for all to authenticated
  using (true) with check (true);

create policy "authenticated_deal_alerts_read"
  on deal_alerts for select to authenticated
  using (true);

-- system_tokens: service role only (bypasses RLS by default — no policy needed)
```

- [ ] **Step 2: Apply the migration**

```bash
supabase db push
```

Expected: `Applying migration 20260622000001_add_deal_hunter_tables.sql` with no errors.

- [ ] **Step 3: Verify in Supabase dashboard**

Open Supabase → Table Editor. Confirm `watchlists`, `deal_alerts`, and `system_tokens` all exist with the correct columns.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260622000001_add_deal_hunter_tables.sql
git commit -m "feat: add deal hunter database tables"
```

---

## Task 2: Edge Function `deal-hunter-cron`

**Files:**
- Create: `supabase/functions/deal-hunter-cron/index.ts`

**Interfaces:**
- Consumes: `watchlists` (read), `deal_alerts` (read/write), `system_tokens` (read/write) from Task 1
- Produces: New rows in `deal_alerts`; email notifications via Resend

- [ ] **Step 1: Write the edge function**

```typescript
// supabase/functions/deal-hunter-cron/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const AMADEUS_BASE = 'https://api.amadeus.com'
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

async function getAmadeusToken(supabase: ReturnType<typeof createClient>): Promise<string> {
  const { data: cached } = await supabase
    .from('system_tokens')
    .select('access_token, expires_at')
    .eq('service', 'amadeus')
    .single()

  const bufferMs = 5 * 60 * 1000
  if (cached && new Date(cached.expires_at).getTime() > Date.now() + bufferMs) {
    return cached.access_token as string
  }

  const res = await fetch(`${AMADEUS_BASE}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: Deno.env.get('AMADEUS_CLIENT_ID')!,
      client_secret: Deno.env.get('AMADEUS_CLIENT_SECRET')!,
    }),
  })

  if (!res.ok) throw new Error(`Amadeus auth failed: ${res.status}`)
  const json = await res.json()
  const expiresAt = new Date(Date.now() + (json.expires_in as number) * 1000).toISOString()

  await supabase.from('system_tokens').upsert({
    service: 'amadeus',
    access_token: json.access_token as string,
    expires_at: expiresAt,
  })

  return json.access_token as string
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
  token: string,
  origin: string,
  destination: string,
  date: string,
  adults: number
): Promise<{ price: number; airline: string; details: unknown } | null> {
  const params = new URLSearchParams({
    originLocationCode: origin,
    destinationLocationCode: destination,
    departureDate: date,
    adults: String(adults),
    max: '1',
    currencyCode: 'IDR',
  })

  const res = await fetch(`${AMADEUS_BASE}/v2/shopping/flight-offers?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (res.status === 429) throw new Error('RATE_LIMIT')
  if (res.status === 401) throw new Error('UNAUTHORIZED')
  if (!res.ok) return null

  const data = await res.json()
  if (!data.data || (data.data as unknown[]).length === 0) return null

  const offer = (data.data as Record<string, unknown>[])[0]
  const price = parseFloat((offer.price as Record<string, string>).grandTotal)
  const codes = offer.validatingAirlineCodes as string[] | undefined
  const carrierCode = codes?.[0] ??
    ((offer.itineraries as Record<string, unknown>[])?.[0]?.segments as Record<string, unknown>[])?.[0]?.carrierCode as string ??
    'Unknown'
  const carriers = (data.dictionaries as Record<string, Record<string, string>>)?.carriers
  const airline = carriers?.[carrierCode] ?? carrierCode

  return { price, airline, details: offer }
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
  if (cronSecret && req.headers.get('Authorization') !== `Bearer ${cronSecret}`) {
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

  // 2. Get Amadeus token
  let token: string
  try {
    token = await getAmadeusToken(supabase)
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Amadeus auth failed', detail: String(err) }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }

  const log: string[] = []

  // 3. Process each watchlist sequentially
  for (const watchlist of watchlists as WatchlistRow[]) {
    try {
      const date = await pickDate(supabase, watchlist)
      if (!date) {
        log.push(`${watchlist.id}: skipped — no unchecked future dates`)
        continue
      }

      let result: { price: number; airline: string; details: unknown } | null = null
      try {
        result = await searchFlight(token, watchlist.origin, watchlist.destination, date, watchlist.adults)
      } catch (err) {
        const msg = String(err)
        if (msg.includes('RATE_LIMIT')) {
          log.push('Rate limit hit — aborting')
          break
        }
        if (msg.includes('UNAUTHORIZED')) {
          token = await getAmadeusToken(supabase)
          result = await searchFlight(token, watchlist.origin, watchlist.destination, date, watchlist.adults)
        } else {
          log.push(`${watchlist.id}: search error — ${msg}`)
          await supabase.from('watchlists').update({ last_checked_at: new Date().toISOString() }).eq('id', watchlist.id)
          continue
        }
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

  // 4. Email unnotified alerts
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
```

- [ ] **Step 2: Set Supabase secrets**

```bash
supabase secrets set \
  AMADEUS_CLIENT_ID=your_amadeus_client_id \
  AMADEUS_CLIENT_SECRET=your_amadeus_client_secret \
  RESEND_API_KEY=your_resend_api_key \
  DEAL_ALERT_EMAIL=recipient@example.com \
  DEAL_ALERT_FROM_EMAIL="Deal Hunter <onboarding@resend.dev>" \
  CRON_SECRET=any_random_secret_string
```

**Getting credentials:**
- Amadeus: sign up at https://developers.amadeus.com → create app → copy Client ID + Client Secret
- Resend: sign up at https://resend.com → create API key. Use `onboarding@resend.dev` as `DEAL_ALERT_FROM_EMAIL` for testing; verify your domain in Resend settings for production.
- `CRON_SECRET`: any random string (e.g. `openssl rand -hex 32`). This protects the endpoint from unauthorized invocations.

- [ ] **Step 3: Deploy the edge function**

```bash
supabase functions deploy deal-hunter-cron --no-verify-jwt
```

`--no-verify-jwt` is required because pg_cron does not send a user JWT. The endpoint is protected by `CRON_SECRET` instead.

- [ ] **Step 4: Configure pg_cron (run once in Supabase SQL Editor)**

In Supabase dashboard → SQL Editor, replace the placeholders and run:

```sql
create extension if not exists pg_net;

select cron.schedule(
  'deal-hunter-daily',
  '0 2 * * *',
  $$
  select net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/deal-hunter-cron',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer YOUR_CRON_SECRET"}'::jsonb,
    body := '{}'::jsonb
  )
  $$
);
```

Replace `YOUR_PROJECT_REF` with your Supabase project ref (visible in the dashboard URL) and `YOUR_CRON_SECRET` with the value you set in Step 2.

- [ ] **Step 5: Smoke-test the edge function**

```bash
curl -s -X POST \
  "https://YOUR_PROJECT_REF.supabase.co/functions/v1/deal-hunter-cron" \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected response (no watchlists yet):
```json
{ "ok": true, "processed": 0, "log": [] }
```

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/deal-hunter-cron/index.ts
git commit -m "feat: add deal-hunter-cron edge function"
```

---

## Task 3: Shared TypeScript Types

**Files:**
- Create: `src/components/admin/DealHunter/types.ts`

**Interfaces:**
- Produces: `Watchlist`, `DealAlert`, `WatchlistFormData`, `EMPTY_WATCHLIST_FORM` — consumed by Tasks 4, 5, 6

- [ ] **Step 1: Create the types file**

```typescript
// src/components/admin/DealHunter/types.ts

export interface Watchlist {
  id: string;
  origin: string;
  destination: string;
  date_range_start: string;
  date_range_end: string;
  target_price_max: number;
  adults: number;
  is_active: boolean;
  created_by: string | null;
  last_checked_at: string | null;
  created_at: string;
}

export interface DealAlert {
  id: string;
  watchlist_id: string;
  price: number;
  departure_date: string;
  airline: string;
  flight_details: Record<string, unknown>;
  is_notified: boolean;
  created_at: string;
  watchlist?: Pick<Watchlist, 'origin' | 'destination' | 'target_price_max'>;
}

export interface WatchlistFormData {
  origin: string;
  destination: string;
  date_range_start: string;
  date_range_end: string;
  target_price_max: string;
  adults: string;
}

export const EMPTY_WATCHLIST_FORM: WatchlistFormData = {
  origin: '',
  destination: '',
  date_range_start: '',
  date_range_end: '',
  target_price_max: '',
  adults: '1',
};
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/DealHunter/types.ts
git commit -m "feat: add DealHunter shared types"
```

---

## Task 4: WatchlistForm Component

**Files:**
- Create: `src/components/admin/DealHunter/WatchlistForm.tsx`

**Interfaces:**
- Consumes: `Watchlist`, `WatchlistFormData`, `EMPTY_WATCHLIST_FORM` from `./types`; `SlideOver`, `FormField`, `inputClass`, `btnPrimary`, `btnSecondary`, `useToast` from `../ui`; `supabase` from `../../../lib/supabase`
- Produces: `WatchlistForm` default export with props `{ isOpen: boolean; editing: Watchlist | null; onClose: () => void; onSaved: () => void }`

- [ ] **Step 1: Create the component**

```typescript
// src/components/admin/DealHunter/WatchlistForm.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import {
  SlideOver, FormField, inputClass, btnPrimary, btnSecondary, useToast,
} from '../ui';
import { Watchlist, WatchlistFormData, EMPTY_WATCHLIST_FORM } from './types';

interface Props {
  isOpen: boolean;
  editing: Watchlist | null;
  onClose: () => void;
  onSaved: () => void;
}

const WatchlistForm: React.FC<Props> = ({ isOpen, editing, onClose, onSaved }) => {
  const toast = useToast();
  const [form, setForm] = useState<WatchlistFormData>(EMPTY_WATCHLIST_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(
      editing
        ? {
            origin: editing.origin,
            destination: editing.destination,
            date_range_start: editing.date_range_start,
            date_range_end: editing.date_range_end,
            target_price_max: String(editing.target_price_max),
            adults: String(editing.adults),
          }
        : EMPTY_WATCHLIST_FORM
    );
  }, [editing, isOpen]);

  const field =
    (key: keyof WatchlistFormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const origin = form.origin.toUpperCase().trim();
    const destination = form.destination.toUpperCase().trim();
    const price = parseFloat(form.target_price_max);
    const adults = parseInt(form.adults, 10);

    if (origin === destination) { toast('error', 'Origin dan destination tidak boleh sama.'); return; }
    if (!form.date_range_start || !form.date_range_end) { toast('error', 'Tanggal wajib diisi.'); return; }
    if (form.date_range_end < form.date_range_start) { toast('error', 'Tanggal akhir harus setelah tanggal awal.'); return; }
    if (!price || price <= 0) { toast('error', 'Harga maks harus lebih dari 0.'); return; }

    setSaving(true);
    const payload = {
      origin,
      destination,
      date_range_start: form.date_range_start,
      date_range_end: form.date_range_end,
      target_price_max: price,
      adults,
    };
    const { error } = editing
      ? await supabase.from('watchlists').update(payload).eq('id', editing.id)
      : await supabase.from('watchlists').insert([payload]);
    setSaving(false);

    if (error) {
      toast('error', 'Gagal menyimpan watchlist.');
    } else {
      toast('success', editing ? 'Watchlist diperbarui.' : 'Watchlist ditambahkan.');
      onClose();
      onSaved();
    }
  };

  return (
    <SlideOver
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? 'Edit Watchlist' : 'Tambah Watchlist'}
      footer={
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className={btnSecondary}>Batal</button>
          <button type="submit" form="watchlist-form" disabled={saving} className={btnPrimary}>
            {saving ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Tambah'}
          </button>
        </div>
      }
    >
      <form id="watchlist-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Origin (IATA)" required>
            <input
              type="text" maxLength={3} placeholder="CGK"
              value={form.origin}
              onChange={e => setForm(f => ({ ...f, origin: e.target.value.toUpperCase() }))}
              className={inputClass} required
            />
          </FormField>
          <FormField label="Destination (IATA)" required>
            <input
              type="text" maxLength={3} placeholder="JED"
              value={form.destination}
              onChange={e => setForm(f => ({ ...f, destination: e.target.value.toUpperCase() }))}
              className={inputClass} required
            />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Tanggal Mulai" required>
            <input type="date" value={form.date_range_start} onChange={field('date_range_start')}
              className={inputClass} required />
          </FormField>
          <FormField label="Tanggal Akhir" required>
            <input type="date" value={form.date_range_end} min={form.date_range_start}
              onChange={field('date_range_end')} className={inputClass} required />
          </FormField>
        </div>
        <FormField label="Harga Maks (IDR)" required hint="Contoh: 5000000">
          <input
            type="number" min={0} step={100000} placeholder="5000000"
            value={form.target_price_max} onChange={field('target_price_max')}
            className={inputClass} required
          />
        </FormField>
        <FormField label="Jumlah Dewasa" required>
          <input
            type="number" min={1} max={9}
            value={form.adults} onChange={field('adults')}
            className={inputClass} required
          />
        </FormField>
      </form>
    </SlideOver>
  );
};

export default WatchlistForm;
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/DealHunter/WatchlistForm.tsx
git commit -m "feat: add WatchlistForm slide-over component"
```

---

## Task 5: WatchlistTable Component

**Files:**
- Create: `src/components/admin/DealHunter/WatchlistTable.tsx`

**Interfaces:**
- Consumes: `Watchlist` from `./types`; `WatchlistForm` default export from `./WatchlistForm`; `TableCard`, `THead`, `Th`, `Td`, `SkeletonRows`, `EmptyState`, `ConfirmDialog`, `btnGhost`, `btnPrimary`, `useToast` from `../ui`
- Produces: `WatchlistTable` default export with no props (self-contained)

- [ ] **Step 1: Create the component**

```typescript
// src/components/admin/DealHunter/WatchlistTable.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Pencil, Pause, Play, Trash2, Target, Plus } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import {
  TableCard, THead, Th, Td, SkeletonRows, EmptyState,
  ConfirmDialog, btnGhost, btnPrimary, useToast,
} from '../ui';
import { Watchlist } from './types';
import WatchlistForm from './WatchlistForm';

const formatIDR = (n: number) => 'Rp ' + new Intl.NumberFormat('id-ID').format(n);

const formatRelative = (ts: string | null): string => {
  if (!ts) return '—';
  const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
  if (mins < 60) return `${mins}m lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}j lalu`;
  return `${Math.floor(hrs / 24)}h lalu`;
};

const WatchlistTable: React.FC = () => {
  const toast = useToast();
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Watchlist | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Watchlist | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchWatchlists = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('watchlists')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setWatchlists(data as Watchlist[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchWatchlists(); }, [fetchWatchlists]);

  const openCreate = () => { setEditing(null); setIsFormOpen(true); };
  const openEdit = (w: Watchlist) => { setEditing(w); setIsFormOpen(true); };

  const toggleActive = async (w: Watchlist) => {
    const { error } = await supabase
      .from('watchlists').update({ is_active: !w.is_active }).eq('id', w.id);
    if (error) toast('error', 'Gagal mengubah status.');
    else {
      toast('success', w.is_active ? 'Watchlist dijeda.' : 'Watchlist diaktifkan.');
      fetchWatchlists();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { count } = await supabase
      .from('deal_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('watchlist_id', deleteTarget.id);

    const { error } = count && count > 0
      ? await supabase.from('watchlists').update({ is_active: false }).eq('id', deleteTarget.id)
      : await supabase.from('watchlists').delete().eq('id', deleteTarget.id);

    setDeleting(false);
    setDeleteTarget(null);
    if (error) toast('error', 'Gagal menghapus watchlist.');
    else toast('success', count && count > 0 ? 'Watchlist dijeda (ada deal terkait).' : 'Watchlist dihapus.');
    fetchWatchlists();
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={openCreate} className={btnPrimary}>
          <Plus className="w-4 h-4" /> Tambah Watchlist
        </button>
      </div>

      <TableCard>
        <table className="w-full">
          <THead>
            <Th>Rute</Th>
            <Th>Rentang Tanggal</Th>
            <Th>Harga Maks</Th>
            <Th>Dewasa</Th>
            <Th>Terakhir Dicek</Th>
            <Th>Status</Th>
            <Th align="right">Aksi</Th>
          </THead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <SkeletonRows rows={3} cols={7} />
            ) : watchlists.length === 0 ? (
              <tr><td colSpan={7}>
                <EmptyState
                  icon={<Target className="w-8 h-8" />}
                  title="Belum ada watchlist"
                  description="Tambahkan watchlist untuk mulai memantau harga tiket."
                  action={
                    <button onClick={openCreate} className={btnPrimary}>
                      <Plus className="w-4 h-4" /> Tambah Watchlist
                    </button>
                  }
                />
              </td></tr>
            ) : watchlists.map(w => (
              <tr key={w.id} className="hover:bg-gray-50/60 transition-colors">
                <Td><span className="font-semibold text-gray-900">{w.origin} → {w.destination}</span></Td>
                <Td className="text-gray-500">{w.date_range_start} – {w.date_range_end}</Td>
                <Td>{formatIDR(w.target_price_max)}</Td>
                <Td>{w.adults}</Td>
                <Td className="text-gray-400 text-xs">{formatRelative(w.last_checked_at)}</Td>
                <Td>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    w.is_active
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-gray-100 text-gray-500 border-gray-200'
                  }`}>
                    {w.is_active ? 'Aktif' : 'Dijeda'}
                  </span>
                </Td>
                <Td className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(w)} className={btnGhost} title="Edit">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => toggleActive(w)} className={btnGhost}
                      title={w.is_active ? 'Jeda' : 'Aktifkan'}>
                      {w.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => setDeleteTarget(w)}
                      className={`${btnGhost} hover:text-red-500 hover:bg-red-50`}
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>

      <WatchlistForm
        isOpen={isFormOpen}
        editing={editing}
        onClose={() => setIsFormOpen(false)}
        onSaved={fetchWatchlists}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Hapus Watchlist?"
        message={`Watchlist ${deleteTarget?.origin} → ${deleteTarget?.destination} akan dihapus. Jika sudah ada deal alert, watchlist hanya akan dijeda.`}
        confirmLabel="Hapus"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </>
  );
};

export default WatchlistTable;
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/DealHunter/WatchlistTable.tsx
git commit -m "feat: add WatchlistTable with CRUD and toggle"
```

---

## Task 6: DealAlertTable Component

**Files:**
- Create: `src/components/admin/DealHunter/DealAlertTable.tsx`

**Interfaces:**
- Consumes: `DealAlert` from `./types`; `TableCard`, `THead`, `Th`, `Td`, `SkeletonRows`, `EmptyState` from `../ui`
- Produces: `DealAlertTable` default export with no props (self-contained)

- [ ] **Step 1: Create the component**

```typescript
// src/components/admin/DealHunter/DealAlertTable.tsx
import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Zap } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { TableCard, THead, Th, Td, SkeletonRows, EmptyState } from '../ui';
import { DealAlert } from './types';

type Filter = '7d' | '30d' | 'all';

const formatIDR = (n: number) => 'Rp ' + new Intl.NumberFormat('id-ID').format(n);

const FILTERS: { key: Filter; label: string }[] = [
  { key: '7d',  label: '7 Hari' },
  { key: '30d', label: '30 Hari' },
  { key: 'all', label: 'Semua' },
];

const DealAlertTable: React.FC = () => {
  const [alerts, setAlerts] = useState<DealAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('30d');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      setLoading(true);
      let query = supabase
        .from('deal_alerts')
        .select('*, watchlist:watchlists(origin, destination, target_price_max)')
        .order('created_at', { ascending: false });

      if (filter === '7d') {
        query = query.gte('created_at', new Date(Date.now() - 7 * 86400 * 1000).toISOString());
      } else if (filter === '30d') {
        query = query.gte('created_at', new Date(Date.now() - 30 * 86400 * 1000).toISOString());
      }

      const { data, error } = await query;
      if (!error && data) setAlerts(data as DealAlert[]);
      setLoading(false);
    };
    fetchAlerts();
  }, [filter]);

  const toggleExpand = (id: string) => setExpanded(prev => (prev === id ? null : id));

  return (
    <>
      <div className="flex gap-2 mb-4">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              filter === f.key ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <TableCard>
        <table className="w-full">
          <THead>
            <Th>Rute</Th>
            <Th>Keberangkatan</Th>
            <Th>Harga</Th>
            <Th>Maskapai</Th>
            <Th>Hemat</Th>
            <Th>Ditemukan</Th>
            <Th></Th>
          </THead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <SkeletonRows rows={3} cols={7} />
            ) : alerts.length === 0 ? (
              <tr><td colSpan={7}>
                <EmptyState
                  icon={<Zap className="w-8 h-8" />}
                  title="Belum ada deal"
                  description="Deal akan muncul di sini saat harga tiket turun di bawah target."
                />
              </td></tr>
            ) : alerts.map(alert => (
              <React.Fragment key={alert.id}>
                <tr
                  className="hover:bg-gray-50/60 transition-colors cursor-pointer"
                  onClick={() => toggleExpand(alert.id)}
                >
                  <Td>
                    <span className="font-semibold text-gray-900">
                      {alert.watchlist?.origin} → {alert.watchlist?.destination}
                    </span>
                  </Td>
                  <Td>{alert.departure_date}</Td>
                  <Td><span className="font-semibold text-emerald-700">{formatIDR(alert.price)}</span></Td>
                  <Td>{alert.airline}</Td>
                  <Td>
                    {alert.watchlist && (
                      <span className="text-emerald-600 font-medium">
                        {formatIDR(alert.watchlist.target_price_max - alert.price)}
                      </span>
                    )}
                  </Td>
                  <Td className="text-gray-400 text-xs">
                    {new Date(alert.created_at).toLocaleString('id-ID', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </Td>
                  <Td>
                    {expanded === alert.id
                      ? <ChevronDown className="w-4 h-4 text-gray-400" />
                      : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  </Td>
                </tr>
                {expanded === alert.id && (
                  <tr className="bg-gray-50/40">
                    <td colSpan={7} className="px-6 py-4">
                      <pre className="text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap max-h-64 font-mono bg-gray-100 rounded-lg p-3">
                        {JSON.stringify(alert.flight_details, null, 2)}
                      </pre>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </TableCard>
    </>
  );
};

export default DealAlertTable;
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/DealHunter/DealAlertTable.tsx
git commit -m "feat: add DealAlertTable with filter chips and row expansion"
```

---

## Task 7: DealHunter Page, Route, and Nav

**Files:**
- Create: `src/pages/admin/DealHunter.tsx`
- Modify: `App.tsx` (add import + route)
- Modify: `src/pages/admin/AdminLayout.tsx` (add `Target` import + nav item)

**Interfaces:**
- Consumes: `WatchlistTable` from `../../components/admin/DealHunter/WatchlistTable`; `DealAlertTable` from `../../components/admin/DealHunter/DealAlertTable`; `PageHeader`, `SectionCard` from `../../components/admin/ui`

- [ ] **Step 1: Create the page**

```typescript
// src/pages/admin/DealHunter.tsx
import React from 'react';
import { PageHeader, SectionCard } from '../../components/admin/ui';
import WatchlistTable from '../../components/admin/DealHunter/WatchlistTable';
import DealAlertTable from '../../components/admin/DealHunter/DealAlertTable';

const DealHunter: React.FC = () => (
  <div className="space-y-8">
    <PageHeader
      title="Deal Hunter"
      subtitle="Monitor harga tiket secara otomatis dan temukan deal terbaik."
    />
    <SectionCard title="Watchlist">
      <WatchlistTable />
    </SectionCard>
    <SectionCard title="Deal Alerts">
      <DealAlertTable />
    </SectionCard>
  </div>
);

export default DealHunter;
```

- [ ] **Step 2: Add the route in App.tsx**

Add this import alongside the other admin page imports in `App.tsx`:

```typescript
import DealHunter from './src/pages/admin/DealHunter';
```

Inside the `<Route element={<AdminLayout />}>` block, add after `<Route path="text-campaign" .../>`:

```typescript
<Route element={<RoleGuard roles={['admin', 'superadmin']} />}>
  <Route path="deal-hunter" element={<DealHunter />} />
</Route>
```

- [ ] **Step 3: Add the nav item in AdminLayout.tsx**

Add `Target` to the lucide-react import in `src/pages/admin/AdminLayout.tsx`:

```typescript
import {
  LayoutDashboard, Package, Map, Plane, Building2, ShoppingCart,
  Settings, LogOut, Menu, X, Image as ImageIcon, Layers, ChevronRight,
  Megaphone, Users, PlaneTakeoff, Tag, Target,
} from 'lucide-react';
```

In the `Marketing` group `items` array, add after the `Text Campaign` entry:

```typescript
{ path: '/admin/deal-hunter', icon: Target, label: 'Deal Hunter', allowedRoles: ['admin', 'superadmin'] },
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Run dev server and manually verify the full flow**

```bash
npm run dev
```

Check each item:

1. Log in as `admin` or `superadmin` → "Deal Hunter" appears in sidebar under Marketing with a target icon.
2. Click "Deal Hunter" → page loads; two cards visible: "Watchlist" (empty state) and "Deal Alerts" (empty state).
3. Click "Tambah Watchlist" → SlideOver opens with 5 fields.
4. Submit with same origin/destination → error toast "Origin dan destination tidak boleh sama."
5. Submit with end date before start date → error toast "Tanggal akhir harus setelah tanggal awal."
6. Submit valid data (CGK/JED, 2026-08-01–2026-08-31, 5000000, 1) → success toast; row appears with status "Aktif".
7. Click Pause → status chip changes to "Dijeda". Click Play → back to "Aktif".
8. Click Edit → SlideOver pre-fills all fields. Change price to 4500000, save → row updates.
9. Click Delete → confirm dialog. Confirm → row disappears (hard delete — no deal alerts yet).
10. Log in as `branch_admin` → "Deal Hunter" does not appear in sidebar.

- [ ] **Step 6: End-to-end smoke test with edge function**

With at least one active watchlist in the table, run:

```bash
curl -s -X POST \
  "https://YOUR_PROJECT_REF.supabase.co/functions/v1/deal-hunter-cron" \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{}' | jq .
```

Expected:
```json
{
  "ok": true,
  "processed": 1,
  "log": ["<watchlist-id>: no deal on 2026-08-01 (Rp XXXXXX)"]
}
```

(Seeing "no deal" is correct — it means Amadeus was called successfully and the price was above the target. If you want to see a deal alert appear, temporarily set `target_price_max` to a very high number on a watchlist.)

- [ ] **Step 7: Commit**

```bash
git add src/pages/admin/DealHunter.tsx App.tsx src/pages/admin/AdminLayout.tsx
git commit -m "feat: add DealHunter page, route, and nav entry"
```
