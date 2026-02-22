import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or Service Role Key in .env.local');
    process.exit(1);
}

// We need the service role key to bypass RLS for an update of all rows
const supabase = createClient(supabaseUrl, supabaseServiceKey);

function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
}

async function migrateSlugs() {
    console.log('Fetching all packages...');
    const { data: packages, error: fetchError } = await supabase
        .from('packages')
        .select('id, title');

    if (fetchError) {
        console.error('Error fetching packages:', fetchError);
        return;
    }

    if (!packages || packages.length === 0) {
        console.log('No packages found to migrate.');
        return;
    }

    console.log(`Found ${packages.length} packages to process.`);

    for (const pkg of packages) {
        const slug = generateSlug(pkg.title);

        // In a real production environment with many users we might need to check for duplicates
        // But since this is a controlled admin environment, a direct slug is likely safe.
        // If we wanted to be perfectly safe we could do: `${slug}-${pkg.id.split('-')[0]}`

        console.log(`Updating package ${pkg.id} with slug: ${slug}`);

        const { error: updateError } = await supabase
            .from('packages')
            .update({ slug: slug })
            .eq('id', pkg.id);

        if (updateError) {
            console.error(`Failed to update package ${pkg.id}:`, updateError);
        } else {
            console.log(`Successfully updated ${pkg.id}`);
        }
    }

    console.log('Migration complete!');
}

migrateSlugs();
