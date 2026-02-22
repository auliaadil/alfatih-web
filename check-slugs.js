const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const { resolve } = require('path');
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);
async function run() {
  const { data, error } = await supabase.from('packages').select('id, title, slug').limit(5);
  console.log(data, error);
}
run();
