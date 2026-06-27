-- Migration: Add payment tracking columns to orders table
-- Adds: amount_paid (numeric, nullable), payment_proof_url (text, nullable)

alter table orders
  add column if not exists amount_paid   numeric       default null,
  add column if not exists payment_proof_url text      default null;

-- Manual steps: Create storage bucket in Supabase SQL Editor
-- Run the following SQL once in Supabase SQL Editor to set up the payment-proofs storage bucket:
--
-- insert into storage.buckets (id, name, public)
-- values ('payment-proofs', 'payment-proofs', true)
-- on conflict (id) do nothing;
--
-- create policy "Authenticated upload payment proofs"
-- on storage.objects for insert
-- to authenticated
-- with check (bucket_id = 'payment-proofs');
--
-- create policy "Public read payment proofs"
-- on storage.objects for select
-- to public
-- using (bucket_id = 'payment-proofs');
