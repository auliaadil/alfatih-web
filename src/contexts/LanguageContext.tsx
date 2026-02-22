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
    nav_tours: { id: 'Paket Umrah', en: 'Tours' },
    nav_private: { id: 'Private Trip', en: 'Private Trip' },
    nav_about: { id: 'Tentang', en: 'About' },
    nav_contact: { id: 'Kontak', en: 'Contact' },
    hero_title: { id: 'Perjalanan Spiritual yang Mengubah Hidup', en: 'A Spiritual Journey that Changes Lives' },
    hero_subtitle: { id: 'Temukan kedamaian dan kekhusyuan dalam ibadah Umrah dan perjalanan wisata halal bersama pembimbing berpengalaman kami.', en: 'Find peace and devotion in Umrah and halal tours with our experienced guides.' },
    hero_cta: { id: 'Lihat Paket Umrah', en: 'View Packages' },
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
    footer_contact: { id: 'Contact Us', en: 'Contact Us' }
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
