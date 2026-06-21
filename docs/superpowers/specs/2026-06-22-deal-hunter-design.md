# Deal Hunter — Design Spec

**Date:** 2026-06-22
**Status:** Approved
**Scope:** Internal admin tool. Flights only. No hotel monitoring in this phase.

---

## Overview

Deal Hunter is a scheduled background system that monitors flight prices for a set of admin-defined routes and alerts the team by email when a price drops below a target threshold. The goal is to help the procurement team identify cheap flight windows and construct profitable Umrah/tour packages.

---

## Target Users

Internal admin and procurement team. Accessible to `superadmin` and `admin` roles only.

---

## Architecture

### Stack
- **Frontend:** React/TypeScript admin page following existing `PageHeader` + `SectionCard` patterns
- **Backend:** Supabase Edge Function (`deal-hunter-cron`) triggered by pg_cron
- **Flight API:** Amadeus Self-Service — `/v2/shopping/flight-offers` (1,000 free transactions/month)
- **Email:** Resend API (100 free emails/day, 3,000/month)
- **OAuth cache:** `system_tokens` Supabase table

---

## Database Schema

### `watchlists`
```sql
id                uuid PRIMARY KEY DEFAULT gen_random_uuid()
origin            text NOT NULL          -- IATA code, e.g. "CGK"
destination       text NOT NULL          -- IATA code, e.g. "JED"
date_range_start  date NOT NULL
date_range_end    date NOT NULL
target_price_max  numeric NOT NULL       -- in IDR
adults            int NOT NULL DEFAULT 1
is_active         boolean NOT NULL DEFAULT true
created_by        uuid REFERENCES auth.users(id)
last_checked_at   timestamptz            -- updated by cron after each run
created_at        timestamptz NOT NULL DEFAULT now()
```

### `deal_alerts`
```sql
id                uuid PRIMARY KEY DEFAULT gen_random_uuid()
watchlist_id      uuid REFERENCES watchlists(id)
price             numeric NOT NULL       -- extracted for sorting/filtering
departure_date    date NOT NULL
airline           text NOT NULL          -- carrier name/code
flight_details    jsonb NOT NULL         -- full Amadeus offer payload
is_notified       boolean NOT NULL DEFAULT false
created_at        timestamptz NOT NULL DEFAULT now()

UNIQUE (watchlist_id, departure_date, price)  -- dedup guard
```

### `system_tokens`
```sql
service           text PRIMARY KEY       -- e.g. "amadeus"
access_token      text NOT NULL
expires_at        timestamptz NOT NULL
```

---

## Edge Function: `deal-hunter-cron`

### Trigger
pg_cron schedule: `0 2 * * *` (02:00 UTC = 09:00 WIB daily)

### Execution Flow

```
1. LOAD active watchlists
   SELECT * FROM watchlists WHERE is_active = true

2. GET AMADEUS TOKEN
   - Read system_tokens WHERE service = 'amadeus'
   - If missing OR expires_at < now() + 5 minutes:
       POST /v1/security/oauth2/token (client_credentials grant)
       UPSERT new token + expires_at into system_tokens
   - Use token for all subsequent calls in this run

3. FOR EACH watchlist (sequential):
   a. Pick the single most urgent departure date:
      - Earliest date in [date_range_start..date_range_end] that is >= today
        AND does not already have a deal_alert for this watchlist
      - If all future dates have deals, or date_range_end < today → skip this watchlist

   b. Call Amadeus:
      GET /v2/shopping/flight-offers
        originLocationCode      = watchlist.origin
        destinationLocationCode = watchlist.destination
        departureDate           = picked date (YYYY-MM-DD)
        adults                  = watchlist.adults
        max                     = 1   (cheapest offer only)
        currencyCode            = IDR

   c. Error handling:
      - HTTP 429 (rate limit) → abort remaining watchlists, log error, exit
      - HTTP 401 → force token refresh, retry once, then skip
      - Other HTTP error → log, skip this watchlist, continue loop

   d. Extract best price from response
      price = response.data[0].price.grandTotal

   e. If price ≤ watchlist.target_price_max:
      - Check: does deal_alerts already have (watchlist_id, departure_date, price)?
      - If not → INSERT into deal_alerts (is_notified = false)

   f. UPDATE watchlists SET last_checked_at = now() WHERE id = watchlist.id

4. SEND EMAILS
   - SELECT * FROM deal_alerts WHERE is_notified = false
   - For each new deal:
       POST to Resend API with formatted HTML email (see Email Format below)
       UPDATE deal_alerts SET is_notified = true WHERE id = alert.id
```

### Rate Limit Budget
- Strategy: 1 API call per watchlist per run (one departure date)
- 15 watchlists × 30 days = 450 calls/month → within 1,000 free tier
- Guard: process max 15 active watchlists per run (configurable via env var `MAX_WATCHLISTS_PER_RUN`, default 15)

### Email Format
```
Subject: Deal Found: CGK → JED on 15 Aug 2026

Route:          Jakarta (CGK) → Jeddah (JED)
Departure:      15 August 2026
Price:          Rp 4.200.000
Target was:     Rp 5.000.000
Savings:        Rp 800.000 below target
Airline:        Garuda Indonesia
Adults:         2

Found at: 22 Jun 2026, 09:03 WIB
View in dashboard: https://<domain>/admin/deal-hunter
```

### Required Supabase Secrets
```
AMADEUS_CLIENT_ID
AMADEUS_CLIENT_SECRET
RESEND_API_KEY
DEAL_ALERT_EMAIL       -- recipient(s), comma-separated
```

---

## Admin UI: `/admin/deal-hunter`

### Page Structure
```
<PageHeader title="Deal Hunter" />

<SectionCard title="Watchlists" action={<AddWatchlistButton />}>
  <WatchlistTable />
</SectionCard>

<SectionCard title="Deal Alerts">
  <DealAlertTable />
</SectionCard>
```

### WatchlistTable

Columns: **Route** | **Date Range** | **Max Price** | **Adults** | **Last Checked** | **Status** | **Actions**

- "Add Watchlist" button in SectionCard header → opens `WatchlistForm` slide-over panel
- **Actions per row:**
  - Edit → opens `WatchlistForm` pre-filled
  - Pause/Resume → toggles `is_active`
  - Delete → confirm dialog; hard-delete if no `deal_alerts` exist, soft-deactivate (`is_active = false`) otherwise

### WatchlistForm (slide-over panel)

Fields:
| Field | Input | Notes |
|---|---|---|
| Origin | Text input | IATA code, e.g. "CGK". Uppercase-enforced. |
| Destination | Text input | IATA code, e.g. "JED". Uppercase-enforced. |
| Date Range | Two date pickers | Start + End departure date |
| Max Price (IDR) | Number input | Target ceiling price |
| Adults | Number input (1–9) | Default 1 |

Validation: origin ≠ destination, date_range_end ≥ date_range_start, price > 0.

### DealAlertTable

Columns: **Route** | **Departure** | **Price** | **Airline** | **Savings** | **Found At**

- **Savings** = `target_price_max - price`, shown in green
- Row click → inline expansion showing full `flight_details` JSON (segments, stops, duration)
- Filter chips at top: Last 7 days / Last 30 days / All
- Read-only — no edit or delete (immutable audit log)
- Newest first (ORDER BY created_at DESC)

---

## New Files

```
src/pages/admin/DealHunter.tsx
src/components/admin/DealHunter/
  WatchlistTable.tsx
  WatchlistForm.tsx
  DealAlertTable.tsx
supabase/functions/deal-hunter-cron/
  index.ts
supabase/migrations/
  YYYYMMDD_add_deal_hunter_tables.sql
```

---

## Sidebar Nav

Add "Deal Hunter" entry (icon: `Target` from lucide-react) after "Text Campaign" in the admin sidebar.
Access restricted to `superadmin` and `admin` roles.

---

## Out of Scope (this phase)

- Hotel price monitoring
- Telegram / WhatsApp notifications
- Automatic package creation from a deal
- Multi-date-range search per cron run
- Public-facing deal pages
