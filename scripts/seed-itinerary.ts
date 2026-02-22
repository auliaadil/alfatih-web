import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_API_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase Config');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedItineraries() {
    console.log('Fetching all packages...');
    const { data: packages, error: fetchError } = await supabase
        .from('packages')
        .select('id, title, duration, itinerary');

    if (fetchError) {
        console.error('Error fetching packages:', fetchError);
        return;
    }

    if (!packages || packages.length === 0) {
        console.log('No packages found.');
        return;
    }

    console.log(`Found ${packages.length} packages to process.`);

    for (const pkg of packages) {
        // Force rewrite itinerary to complete dummy data for all packages
        console.log(`Rewriting itinerary for package: ${pkg.title} (${pkg.duration})`);

        const newItinerary = [];
        let duration = 5;
        if (typeof pkg.duration === 'string') {
            const parsed = parseInt(pkg.duration.replace(/[^0-9]/g, ''), 10);
            if (!isNaN(parsed) && parsed > 0) duration = parsed;
        } else if (typeof pkg.duration === 'number') {
            duration = pkg.duration;
        }

        for (let i = 1; i <= duration; i++) {
            let title = `Eksplorasi Hari ${i}`;
            let location = 'City Tour';
            let description = `Kegiatan hari ke-${i} untuk paket ${pkg.title}. Jamaah akan diajak untuk mengelilingi tempat bersejarah dan memperbanyak ibadah.`;

            if (i === 1) {
                title = 'Keberangkatan & Check-in';
                location = 'Bandara / Hotel';
                description = `Jamaah berkumpul di Bandara keberangkatan. Penerbangan menuju destinasi dan dilanjutkan perjalanan darat menuju hotel untuk persiapan ibadah.`;
            } else if (i === duration) {
                title = 'Kepulangan ke Tanah Air';
                location = 'Bandara';
                description = `Persiapan kepulangan, check-out hotel, dan perjalanan menuju bandara untuk kembali terbang ke tanah air. Semoga ibadah mabrur.`;
            }

            newItinerary.push({
                day: i,
                title,
                location,
                description,
                meals: ['Sarapan', 'Makan Siang', 'Makan Malam']
            });
        }

        const { error: updateError } = await supabase
            .from('packages')
            .update({ itinerary: newItinerary })
            .eq('id', pkg.id);

        if (updateError) {
            console.error(`Failed to update itinerary for package ${pkg.id}:`, updateError);
        } else {
            console.log(`Successfully updated ${pkg.id}`);
        }
    }

    console.log('Seeding complete!');
}

seedItineraries();
