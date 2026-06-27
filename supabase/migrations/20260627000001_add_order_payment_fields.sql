-- Migration: Add payment tracking columns to orders table
-- Adds: amount_paid (numeric, nullable), payment_proof_url (text, nullable)

alter table orders
  add column if not exists amount_paid   numeric       default null,
  add column if not exists payment_proof_url text      default null;

-- Create payment-proofs storage bucket
insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', true)
on conflict (id) do nothing;

-- RLS policy: authenticated users can upload
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Authenticated upload payment proofs'
  ) then
    execute 'create policy "Authenticated upload payment proofs"
      on storage.objects for insert
      to authenticated
      with check (bucket_id = ''payment-proofs'')';
  end if;
end $$;

-- RLS policy: public read for stored proof URLs
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public read payment proofs'
  ) then
    execute 'create policy "Public read payment proofs"
      on storage.objects for select
      to public
      using (bucket_id = ''payment-proofs'')';
  end if;
end $$;
