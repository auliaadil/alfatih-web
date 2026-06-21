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
