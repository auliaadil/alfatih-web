ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS izin_ppiu        text,
  ADD COLUMN IF NOT EXISTS izin_bpw         text,
  ADD COLUMN IF NOT EXISTS siskopatuh_logo_url  text,
  ADD COLUMN IF NOT EXISTS pasti_umrah_logo_url text;

UPDATE site_settings SET
  izin_ppiu            = '16032300890440001',
  izin_bpw             = '16032300890440002',
  siskopatuh_logo_url  = 'https://lceckzzycqfjbhpugxuh.supabase.co/storage/v1/object/public/site-assets/logos/siskopatuh.webp',
  pasti_umrah_logo_url = 'https://lceckzzycqfjbhpugxuh.supabase.co/storage/v1/object/public/site-assets/logos/5pasti-umrah.png'
WHERE id = 1;
