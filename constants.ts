import { TourPackage, TourCategory, Testimonial } from './types';

export const FEATURED_TOURS: TourPackage[] = [
  {
    id: '1',
    title: 'Premium Umrah Package (Syawal)',
    category: TourCategory.UMRAH,
    duration: '9 Days',
    priceTiers: {
      quad: 'Rp 32.500.000',
      triple: 'Rp 34.000.000',
      double: 'Rp 36.500.000'
    },
    image: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&q=80&w=1200',
    rating: 5.0,
    features: ['5 Star Hotels', 'Visa Included', 'Direct Flight', 'Mutawwif Guide'],
    description: 'Experience a spiritual journey with our all-inclusive premium Umrah package. Close proximity to Haram.',
    isPopular: true,
    departureDate: '15 Mei 2024',
    airplane: {
      airline: 'Saudi Arabian Airlines',
      details: 'Direct Flight Jakarta (CGK) - Jeddah (JED)'
    },
    hotels: [
      { name: 'Anjum Hotel', location: 'Makkah', stars: 5 },
      { name: 'Pullman Zamzam', location: 'Madinah', stars: 5 }
    ],
    itinerary: [
      { day: 1, title: 'Keberangkatan Jakarta', activities: ['Berkumpul di Bandara Soekarno-Hatta (CGK)', 'Check-in Tiket & Bagasi', 'Penerbangan menuju Jeddah', 'Perjalanan Bus menuju Makkah', 'Check-in Hotel Makkah'] },
      { day: 2, title: 'Ibadah Umrah Pertama', activities: ['Shalat Subuh di Masjidil Haram', 'Briefing Tata Cara Umrah', 'Melaksanakan Tawaf & Sa\'i', 'Tahallul (Gunting Rambut)', 'Ibadah Mandiri'] },
      { day: 3, title: 'Ziarah Kota Makkah', activities: ['Mengunjungi Jabal Nur (Gua Hira)', 'Ziarah ke Jabal Thawr', 'Melewati Arafah, Muzdalifah & Mina', 'Memperbanyak Ibadah di Masjidil Haram'] },
      { day: 4, title: 'Ibadah Mandiri / Umrah Kedua', activities: ['Memperbanyak Tawaf Sunnah', 'Persiapan Miqat untuk Umrah Kedua (Opsional)', 'Wisata Belanja di sekitar Haram', 'Istirahat'] },
      { day: 5, title: 'Perjalanan ke Madinah', activities: ['Tawaf Wada (Perpisahan)', 'Check-out Hotel Makkah', 'Menuju Madinah dengan Kereta Cepat Haramain', 'Check-in Hotel Madinah', 'Ziarah Raudhah'] }
    ],
    included: [
      'Visa Umrah & Asuransi Saudi',
      'Tiket Pesawat PP (Ekonomi)',
      'Akomodasi Hotel Bintang 5',
      'Makan 3x Sehari (Menu Indonesia)',
      'Transportasi Bus Full AC Executive',
      'Mutawwif/Pembimbing Berpengalaman',
      'Air Zamzam (Sesuai Kebijakan)'
    ],
    notIncluded: [
      'Pembuatan Paspor',
      'Vaksin Meningitis (Opsional)',
      'Kebutuhan Pribadi (Laundry/Pulsa)',
      'Kelebihan Bagasi',
      'Tips Guide & Driver'
    ]
  },
  {
    id: '2',
    title: 'Turkey Historical Wonders',
    category: TourCategory.MIDDLE_EAST,
    duration: '10 Days',
    priceTiers: {
      quad: 'Rp 18.900.000',
      triple: 'Rp 19.800.000',
      double: 'Rp 21.500.000'
    },
    image: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&q=80&w=1200',
    rating: 4.8,
    features: ['Cappadocia Balloon', 'Istanbul City Tour', 'Halal Meals', 'English Guide'],
    description: 'Explore the rich history of the Ottoman Empire, from the Blue Mosque to the fairy chimneys of Cappadocia.',
    departureDate: '10 Juni 2024',
    airplane: {
      airline: 'Turkish Airlines',
      details: 'Jakarta (CGK) - Istanbul (IST) Non-Stop'
    },
    hotels: [
      { name: 'Crowne Plaza Old City', location: 'Istanbul', stars: 5 },
      { name: 'Cave Hotel Premium', location: 'Cappadocia', stars: 4 }
    ],
    itinerary: [
      { day: 1, title: 'Arrive in Istanbul', activities: ['Arrival at IST Airport', 'Meet & Greet with Local Guide', 'Transfer to Hotel', 'Welcome Dinner with Bosphorus View'] },
      { day: 2, title: 'Istanbul Old City', activities: ['Hippodrome Square', 'Blue Mosque Tour', 'Hagia Sophia Museum', 'Topkapi Palace', 'Shopping at Grand Bazaar'] },
      { day: 3, title: 'Ankara & Cappadocia', activities: ['Travel to Ankara', 'Visit Ataturk Mausoleum', 'Drive to Cappadocia', 'Check-in Cave Hotel'] }
    ],
    included: [
      'International Flight (Return)',
      'Domestic Flight Istanbul-Ankara',
      'Halal Board (Breakfast, Lunch, Dinner)',
      'Hotel Bintang 4/5 (Twin Share)',
      'Entrance Fees to All Sites',
      'Professional Tour Guide'
    ],
    notIncluded: [
      'Tipping Guide & Driver ($5/day)',
      'Hot Air Balloon Ride ($250 approx)',
      'Personal Travel Insurance',
      'Laundry & Minibar'
    ]
  },
  {
    id: '3',
    title: 'Japan Sakura Halal Experience',
    category: TourCategory.ASIA,
    duration: '7 Days',
    priceTiers: {
      quad: 'Rp 27.800.000',
      triple: 'Rp 29.500.000',
      double: 'Rp 32.000.000'
    },
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=1200',
    rating: 4.9,
    features: ['Tokyo & Kyoto', 'Halal Friendly', 'Bullet Train', 'Cultural Experience'],
    description: 'Witness the beauty of Cherry Blossoms while enjoying a worry-free Halal tour across Japan.',
    isPopular: true,
    departureDate: '28 Maret 2024',
    airplane: {
      airline: 'Garuda Indonesia',
      details: 'Jakarta (CGK) - Tokyo (HND) Direct'
    },
    hotels: [
      { name: 'Shiba Park Hotel', location: 'Tokyo', stars: 4 },
      { name: 'Kyoto Century Hotel', location: 'Kyoto', stars: 4 }
    ],
    itinerary: [
      { day: 1, title: 'Tokyo Arrival', activities: ['Arrival HND Airport', 'Visit Asakusa Kannon Temple', 'Explore Nakamise Street', 'Tokyo Skytree (Photo Stop)'] },
      { day: 2, title: 'Hakone & Fuji', activities: ['Owakudani Boiling Valley', 'Lake Ashi Cruise', 'Mt. Fuji 5th Station', 'Gotemba Premium Outlets'] }
    ],
    included: [
      'Flight Ticket Economy (Return)',
      'Transportation (Bus/Shinkansen)',
      'Daily Halal Food',
      'Tour Guide Indonesian Speaking',
      'Entrance Tickets to Main Attractions'
    ],
    notIncluded: [
      'Visa Japan Fee',
      'Optional Tour (Disney/Universal)',
      'Tipping Guide & Driver',
      'Personal Expenses'
    ]
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: "Haji Ahmad",
    role: "Umrah Pilgrim",
    comment: "Alfatih Dunia Wisata provided excellent service during our Umrah. The Mutawwif was very knowledgeable.",
    avatar: "https://picsum.photos/100/100?random=10"
  },
  {
    id: 2,
    name: "Sarah Fitri",
    role: "Japan Tour",
    comment: "I was worried about Halal food in Japan, but this agency took care of everything. Highly recommended!",
    avatar: "https://picsum.photos/100/100?random=11"
  },
  {
    id: 3,
    name: "Budi Santoso",
    role: "Turkey Trip",
    comment: "The hot air balloon experience in Cappadocia was magical. Everything was on time and professional.",
    avatar: "https://picsum.photos/100/100?random=12"
  }
];

export const INTERESTS_LIST = [
  "Sejarah & Budaya",
  "Alam & Pemandangan",
  "Wisata Belanja",
  "Kuliner Halal",
  "Situs Religi",
  "Petualangan",
  "Santai & Rileks"
];

export const DESTINATION_OPTIONS = [
  "Turki",
  "Thailand",
  "Australia",
  "Korea",
  "Jepang",
  "Malaysia",
  "Singapore",
  "Swiss"
];

export const CONTACT_INFO = {
  whatsapp: '6285711903031', // Clean number for WA links
  phone: '+62 815-164-222-5', // Display number
  email: 'info@adwisata.com',
  address: 'Jl. Boulevard Grand Depok City Jl. Ruko Anggrek 1 No.5 blok C1, Tirtajaya, Sukmajaya, Depok City, West Java 16412',
  socials: {
    instagram: 'https://www.instagram.com/alfatih.umroh/',
    tiktok: 'https://www.tiktok.com/@alfatih.umroh'
  },
  maps: '#' // Placeholder
};