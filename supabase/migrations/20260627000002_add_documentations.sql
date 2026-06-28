-- documentations: trip album metadata
create table documentations (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  category_id      uuid not null references categories(id),
  package_id       uuid references packages(id) on delete set null,
  departure_date   date,
  arrival_date     date,
  description      text,
  cover_photo_url  text,
  published        boolean not null default false,
  created_at       timestamptz not null default now()
);

-- documentation_photos: individual photos in an album
create table documentation_photos (
  id                  uuid primary key default gen_random_uuid(),
  documentation_id    uuid not null references documentations(id) on delete cascade,
  storage_url         text not null,
  sort_order          int not null default 0,
  created_at          timestamptz not null default now()
);

-- indexes for common queries
create index on documentation_photos (documentation_id, sort_order);

-- RLS
alter table documentations       enable row level security;
alter table documentation_photos enable row level security;

-- public: read published albums only
create policy "documentations_public_read"
  on documentations for select
  using (published = true);

-- authenticated: full access
create policy "documentations_auth_all"
  on documentations for all to authenticated
  using (true) with check (true);

create policy "documentation_photos_public_read"
  on documentation_photos for select
  using (true);

create policy "documentation_photos_auth_all"
  on documentation_photos for all to authenticated
  using (true) with check (true);

-- Storage policies for documentation-photos bucket
create policy "docs_storage_public_read"
  on storage.objects for select
  using (bucket_id = 'documentation-photos');

create policy "docs_storage_auth_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'documentation-photos');

create policy "docs_storage_auth_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'documentation-photos');

create policy "docs_storage_auth_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'documentation-photos');
