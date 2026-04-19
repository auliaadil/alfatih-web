import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'id' | 'en';

interface Translations {
    [key: string]: {
        id: string;
        en: string;
    };
}

export const translations: Translations = {
    nav_home: { id: 'Beranda', en: 'Home' },
    nav_tours: { id: 'Paket Tur', en: 'Tours' },
    nav_private: { id: 'Private Trip', en: 'Private Trip' },
    nav_about: { id: 'Tentang', en: 'About' },
    nav_contact: { id: 'Kontak', en: 'Contact' },
    hero_title: { id: 'Perjalanan Spiritual yang Mengubah Hidup', en: 'A Spiritual Journey that Changes Lives' },
    hero_subtitle: { id: 'Temukan kedamaian dan kekhusyuan dalam ibadah Umrah dan perjalanan wisata halal bersama pembimbing berpengalaman kami.', en: 'Find peace and devotion in Umrah and halal tours with our experienced guides.' },
    hero_cta: { id: 'Lihat Paket Tur', en: 'View Packages' },
    hero_secondary: { id: 'Rencanakan Private Trip', en: 'Plan Private Trip' },
    search_placeholder: { id: 'Cari paket (cth: Umrah Plus Turkey)...', en: 'Search packages...' },
    all_months: { id: 'Semua Jadwal', en: 'All Dates' },
    section_tours_title: { id: 'Paket Tour & Umrah', en: 'Tour & Umrah Packages' },
    section_tours_subtitle: { id: 'Harga mulai dari keberangkatan Jakarta. Paket kami dirancang untuk kenyamanan dan ketenangan ibadah Anda.', en: 'Prices based on Jakarta departure. Our packages are designed for your comfort and spiritual peace.' },

    // Private Trip
    private_trip_title: { id: 'Private Trip Planner', en: 'Private Trip Planner' },

    // About
    about_badge: { id: 'Tentang Alfatih Dunia Wisata', en: 'About Alfatih Dunia Wisata' },
    about_title: { id: 'Profil Perusahaan', en: 'Company Profile' },
    about_desc: { id: 'Menghadirkan layanan yang amanah, profesional, dan sesuai nilai-nilai Islam sejak tahun 2012.', en: 'Providing trustworthy, professional services in accordance with Islamic values since 2012.' },
    pihk_badge: { id: 'Target Izin PIHK', en: 'PIHK License Target' },
    pihk_title_1: { id: 'Izin PIHK pada ', en: 'PIHK License in ' },
    pihk_title_2: { id: 'tahun 2026', en: '2026' },
    pihk_desc_1: { id: 'Alfatih Dunia Wisata memiliki target besar untuk bisa memiliki izin <strong>Penyelenggara Ibadah Haji Khusus (PIHK)</strong> pada tahun 2026.', en: 'Alfatih Dunia Wisata aims to obtain the <strong>Special Hajj Organizer (PIHK)</strong> license by 2026.' },
    pihk_desc_2: { id: 'Target ini dicanangkan agar jamaah yang ingin beribadah haji dapat dilayani sepenuhnya secara eksklusif oleh manajemen Alfatih, memberikan kepastian dan kenyamanan ibadah yang lebih personal.', en: 'This target is set so that pilgrims wishing to perform Hajj can be fully and exclusively served by Alfatih management, providing certainty and a more personalized worship comfort.' },
    pihk_current: { id: 'Izin Saat Ini', en: 'Current License' },
    pihk_target: { id: 'Target 2026', en: '2026 Target' },
    vision_mission_title: { id: 'VISI & MISI', en: 'VISION & MISSION' },
    vision_title: { id: 'Visi', en: 'Vision' },
    vision_desc: { id: '"Menjadi perusahaan perjalanan Umroh dan wisata halal terdepan yang menginspirasi umat Muslim untuk meraih pengalaman spiritual, edukatif, dan berkelas dunia, dengan layanan yang amanah, profesional, dan sesuai nilai-nilai Islam."', en: '"To be the leading Umrah and halal tourism company that inspires Muslims to achieve spiritual, educational, and world-class experiences, with trustworthy, professional services in accordance with Islamic values."' },
    mission_title: { id: 'Misi', en: 'Mission' },
    mission_desc: { id: '"Memberikan layanan profesional, amanah, dan sesuai syariah, serta menghadirkan solusi perjalanan halal yang mudah dan berkualitas untuk semua kalangan."', en: '"To provide professional, trustworthy, and sharia-compliant services, and to present easy and quality halal travel solutions for all."' },
    advantages_title: { id: 'KEUNGGULAN ALFATIH', en: 'ALFATIH ADVANTAGES' },
    advantages_subtitle: { id: 'Nilai yang kami bawa dalam setiap perjalanan Anda.', en: 'The values we bring to every journey of yours.' },

    // Why Choose Us
    why_choose_title: { id: 'Why Choose Alfatih Dunia Wisata?', en: 'Why Choose Alfatih Dunia Wisata?' },
    why_choose_1_title: { id: 'Halal Friendly', en: 'Halal Friendly' },
    why_choose_1_desc: { id: 'We ensure Halal meals and prayer times are prioritized in all our itineraries, regardless of destination.', en: 'We ensure Halal meals and prayer times are prioritized in all our itineraries, regardless of destination.' },
    why_choose_2_title: { id: 'Expert Guides', en: 'Expert Guides' },
    why_choose_2_desc: { id: 'Our Mutawwif and tour guides are experienced, knowledgeable, and fluent in local languages.', en: 'Our Mutawwif and tour guides are experienced, knowledgeable, and fluent in local languages.' },
    why_choose_3_title: { id: 'Trusted Service', en: 'Trusted Service' },
    why_choose_3_desc: { id: 'Official registered travel agency with years of experience in handling Umrah and International groups.', en: 'Official registered travel agency with years of experience in handling Umrah and International groups.' },

    // Testimonials
    testimonials_title: { id: 'What Our Pilgrims Say', en: 'What Our Pilgrims Say' },

    // CTA
    ready_title: { id: 'Siap untuk Perjalanan Spiritual Anda Berikutnya?', en: 'Ready for Your Next Spiritual Journey?' },
    ready_subtitle: { id: 'Hubungi kami hari ini untuk memesan kursi Anda atau dapatkan konsultasi gratis untuk perjalanan grup atau keluarga Anda.', en: 'Contact us today to book your seat or get a free consultation for your group or family trip.' },
    ready_wa: { id: 'Hubungi via WhatsApp', en: 'Contact via WhatsApp' },
    ready_brochure: { id: 'Unduh Brosur', en: 'Download Brochure' },

    // Footer
    footer_desc: { id: 'Mitra terpercaya Anda untuk perjalanan Umrah dan wisata internasional ramah Muslim. Kami membuat perjalanan spiritual dan santai Anda tak terlupakan.', en: 'Your trusted partner for Umrah and Muslim-friendly international tours. We make your spiritual and leisure journeys unforgettable.' },
    footer_quick_links: { id: 'Quick Links', en: 'Quick Links' },
    footer_popular: { id: 'Popular Packages', en: 'Popular Packages' },
    footer_contact: { id: 'Contact Us', en: 'Contact Us' },

    // Private Trip Planner – Form
    planner_subtitle: { id: 'Buat draft rencana perjalanan impian Anda dalam hitungan detik dengan kecerdasan buatan.', en: 'Create a draft travel plan for your dream trip in seconds with artificial intelligence.' },
    planner_destination_label: { id: 'Destinasi', en: 'Destination' },
    planner_destination_placeholder: { id: 'Ketik destinasi, misal: Turki, Jepang, Swiss...', en: 'Type a destination, e.g. Turkey, Japan, Switzerland...' },
    planner_duration_label: { id: 'Durasi (Hari)', en: 'Duration (Days)' },
    planner_traveler_label: { id: 'Tipe Traveler', en: 'Traveler Type' },
    planner_interests_label: { id: 'Minat Perjalanan', en: 'Travel Interests' },
    planner_interests_hint: { id: 'Pilih minimal 1 minat untuk melanjutkan', en: 'Select at least 1 interest to continue' },
    planner_submit: { id: 'Buat Draft Rencana', en: 'Generate Draft Plan' },
    planner_powered_by: { id: 'Powered by Google Gemini AI • Hasil berupa draft referensi, bukan paket resmi.', en: 'Powered by Google Gemini AI • Results are draft references, not official packages.' },

    // Private Trip Planner – Contact
    planner_contact_toggle: { id: 'Ingin kami hubungi? (Opsional)', en: 'Want us to contact you? (Optional)' },
    planner_contact_name: { id: 'Nama Lengkap', en: 'Full Name' },
    planner_contact_wa: { id: 'No. WhatsApp', en: 'WhatsApp Number' },
    planner_contact_email: { id: 'Email', en: 'Email' },
    planner_contact_optional: { id: 'Opsional', en: 'Optional' },

    // Private Trip Planner – Loading
    planner_loading_title: { id: 'Sedang Membuat Itinerary', en: 'Creating Your Itinerary' },
    planner_loading_desc_1: { id: 'AI kami sedang merancang rencana perjalanan terbaik ke', en: 'Our AI is crafting the best travel plan to' },
    planner_loading_desc_2: { id: 'selama', en: 'for' },
    planner_loading_desc_3: { id: 'hari...', en: 'days...' },

    // Private Trip Planner – Result
    planner_result_badge: { id: 'Draft Itinerary', en: 'Draft Itinerary' },
    planner_result_heading: { id: 'Private Trip ke', en: 'Private Trip to' },
    planner_result_interests: { id: 'Minat', en: 'Interests' },
    planner_result_days: { id: 'Hari', en: 'Days' },
    planner_cta_consult: { id: 'Cek Harga & Konsultasi', en: 'Get Price & Consult' },
    planner_cta_reset: { id: 'Buat Ulang', en: 'Start Over' },
    planner_contact_title: { id: 'Tinggalkan Kontak Anda', en: 'Leave Your Contact' },
    planner_contact_subtitle: { id: 'Tim kami akan segera menghubungi Anda dengan penawaran harga terbaik.', en: 'Our team will reach out to you with the best price offer.' },
    planner_contact_budget: { id: 'Estimasi Budget', en: 'Budget Estimate' },
    planner_contact_cancel: { id: 'Batal', en: 'Cancel' },
    planner_contact_send: { id: 'Kirim & Chat WA', en: 'Send & Chat WA' },
};

interface LanguageContextProps {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>('id');

    const t = (key: string) => {
        return translations[key]?.[language] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) throw new Error('useLanguage must be used within LanguageProvider');
    return context;
};
