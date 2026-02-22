import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Hero from '../../components/Hero';
import TourCard from '../../components/TourCard';
import TourDetail from '../../components/TourDetail';
import AIPlanner from '../../components/AIPlanner';
import CompanyProfile from '../../components/CompanyProfile';
import Footer from '../../components/Footer';
import { TESTIMONIALS } from '../../constants';
import { TourCategory, TourPackage } from '../../types';
import { Quote } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { useLanguage } from '../contexts/LanguageContext';

const Home: React.FC = () => {
    const settings = useSiteSettings();
    const { t } = useLanguage();
    const [packages, setPackages] = useState<TourPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState<TourCategory | 'All'>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('All');

    useEffect(() => {
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        setLoading(true);
        const { data: pkgs, error } = await supabase.from('packages').select('*').order('created_at', { ascending: false });
        if (error || !pkgs) {
            console.error('Error fetching packages', error);
            setLoading(false);
            return;
        }

        const { data: airlines } = await supabase.from('airlines').select('*');
        const { data: hotels } = await supabase.from('hotels').select('*');

        const fullPackages = pkgs.map((p) => {
            const pAirlines = airlines ? airlines.filter(a => (p.airline_ids || []).includes(a.id)) : [];
            const pHotels = hotels ? hotels.filter(h => (p.hotel_ids || []).includes(h.id)) : [];
            return {
                ...p,
                airlines: pAirlines,
                hotels: pHotels
            } as TourPackage;
        });

        setPackages(fullPackages);
        setLoading(false);
    };

    const navigateToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const resetToHome = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Extract unique months from packages for the dropdown (e.g., "Maret 2024")
    const availableMonths = Array.from(new Set(packages.map(p => {
        // Simple extraction assuming format "DD MMMM YYYY" or similar, just grouping for Demo.
        // If they just type string dates, we'll just show the raw string unless parsed.
        // For now, let's just group by the exact departure_date string or month part
        const parts = p.departure_date.split(' ');
        if (parts.length >= 2) return `${parts[1]} ${parts[2] || ''}`.trim();
        return p.departure_date;
    }))).filter(Boolean).sort();

    const filteredTours = packages.filter(tour => {
        const matchesCategory = activeCategory === 'All' || tour.category === activeCategory;
        const matchesSearch = tour.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tour.category.toLowerCase().includes(searchQuery.toLowerCase());

        let matchesMonth = true;
        if (selectedMonth !== 'All') {
            const parts = tour.departure_date.split(' ');
            const tourMonthCode = parts.length >= 2 ? `${parts[1]} ${parts[2] || ''}`.trim() : tour.departure_date;
            matchesMonth = tourMonthCode === selectedMonth;
        }

        return matchesCategory && matchesSearch && matchesMonth;
    });

    const withLayout = (content: React.ReactNode) => (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <Navbar
                onNavigate={navigateToSection}
                onHomeClick={resetToHome}
            />
            {content}
            <Footer />
        </div>
    );

    return withLayout(
        <main className="flex-grow">
            <Hero />
            <section id="tours" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t('section_tours_title')}</h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        {t('section_tours_subtitle')}
                    </p>
                </div>

                {/* Search and Filters */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-10 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="w-full md:w-1/3">
                        <input
                            type="text"
                            placeholder={t('search_placeholder')}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-wrap gap-2 justify-center w-full md:w-auto">
                        <select
                            className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                        >
                            <option value="All">{t('all_months')}</option>
                            {availableMonths.map(month => (
                                <option key={month} value={month}>{month}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex flex-wrap justify-center gap-2 mb-10">
                    {['All', ...Object.values(TourCategory)].map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat as TourCategory | 'All')}
                            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${activeCategory === cat
                                ? 'bg-primary text-white shadow-md'
                                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {loading ? (
                        <div className="col-span-full text-center text-gray-500 py-10 font-medium">Memuat paket tour...</div>
                    ) : filteredTours.length > 0 ? (
                        filteredTours.map((tour) => (
                            <TourCard
                                key={tour.id}
                                tour={tour}
                            />
                        ))
                    ) : (
                        <div className="col-span-full text-center text-gray-500 py-10 bg-white rounded-2xl border border-gray-100">
                            Belum ada paket tersedia di kategori ini.
                        </div>
                    )}
                </div>
            </section>
            <section id="private-trip" className="scroll-mt-20">
                <AIPlanner />
            </section>
            <section id="about" className="scroll-mt-20">
                <CompanyProfile />
            </section>
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <img
                                src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=800"
                                alt="Happy travelers"
                                className="rounded-2xl shadow-2xl"
                            />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-6">
                                {t('why_choose_title')}
                            </h2>
                            <div className="space-y-8">
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                        <span className="text-2xl">🕌</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">{t('why_choose_1_title')}</h3>
                                        <p className="text-gray-600">{t('why_choose_1_desc')}</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                        <span className="text-2xl">🤝</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">{t('why_choose_2_title')}</h3>
                                        <p className="text-gray-600">{t('why_choose_2_desc')}</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                        <span className="text-2xl">🛡️</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">{t('why_choose_3_title')}</h3>
                                        <p className="text-gray-600">{t('why_choose_3_desc')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <section className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900">{t('testimonials_title')}</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {TESTIMONIALS.map((t) => (
                            <div key={t.id} className="bg-white p-8 rounded-xl shadow-md relative">
                                <Quote className="absolute top-6 right-6 w-8 h-8 text-gray-100 fill-gray-100" />
                                <p className="text-gray-600 mb-6 relative z-10 italic">"{t.comment}"</p>
                                <div className="flex items-center gap-4">
                                    <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full object-cover" />
                                    <div>
                                        <h4 className="font-bold text-gray-900">{t.name}</h4>
                                        <span className="text-xs text-primary font-medium">{t.role}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            <section id="contact" className="py-20 bg-primary scroll-mt-20">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                        {t('ready_title')}
                    </h2>
                    <p className="text-emerald-100 text-lg mb-8 max-w-2xl mx-auto">
                        {t('ready_subtitle')}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => window.open(`https://wa.me/${settings.whatsapp}`, '_blank')}
                            className="bg-white text-primary hover:bg-gray-100 font-bold py-4 px-8 rounded-full shadow-lg transition-transform hover:-translate-y-1"
                        >
                            {t('ready_wa')}
                        </button>
                        <button className="bg-transparent border-2 border-white text-white hover:bg-white/10 font-bold py-4 px-8 rounded-full transition-all">
                            {t('ready_brochure')}
                        </button>
                    </div>
                </div>
            </section>
        </main>
    );
};

export default Home;
