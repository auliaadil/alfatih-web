-- Run this in Supabase SQL Editor (Dashboard → SQL Editor) after deploying deal-hunter-cron.
-- Replace the two placeholders before running.

-- Enable pg_net extension if not already enabled
create extension if not exists pg_net;

-- Schedule: daily at 02:00 UTC (09:00 WIB)
-- To verify: select * from cron.job;
-- To unschedule: select cron.unschedule('deal-hunter-daily');
select cron.schedule(
  'deal-hunter-daily',
  '0 2 * * *',
  $$
  select net.http_post(
    url        := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/deal-hunter-cron',
    headers    := '{"Content-Type":"application/json","Authorization":"Bearer YOUR_CRON_SECRET"}'::jsonb,
    body       := '{}'::jsonb
  )
  $$
);
