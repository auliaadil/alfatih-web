import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Hero from '../../components/Hero';
import TourCard from '../../components/TourCard';
import AIPlanner from '../../components/AIPlanner';
import CompanyProfile from '../../components/CompanyProfile';
import Footer from '../../components/Footer';
import PerjalananKami from '../../components/PerjalananKami';
import { TourPackage, Testimonial } from '../../types';
import { Quote, ShieldCheck, Users, Star, ArrowRight, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { useLanguage } from '../contexts/LanguageContext';

const MAX_HOME_PACKAGES = 3;

const Home: React.FC = () => {
    const settings = useSiteSettings();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [packages, setPackages] = useState<TourPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState<string[]>([]);
    const [activeCategory, setActiveCategory] = useState<string>('All');
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

    useEffect(() => {
        fetchPackages();
        fetchCategories();
        fetchTestimonials();
    }, []);

    const fetchPackages = async () => {
        setLoading(true);
        const { data: pkgs, error } = await supabase
            .from('packages')
            .select('*')
            .eq('is_published', true)
            .order('created_at', { ascending: false });
        if (error || !pkgs) {
            console.error('Error fetching packages', error);
            setLoading(false);
            return;
        }
        setPackages(pkgs as TourPackage[]);
        setLoading(false);
    };

    const fetchCategories = async () => {
        const { data } = await supabase.from('categories').select('name').order('name');
        if (data) setCategories(data.map(c => c.name));
    };

    const fetchTestimonials = async () => {
        const { data } = await supabase
            .from('testimonials')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });
        if (data) setTestimonials(data);
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

    const filteredTours = packages.filter(tour =>
        activeCategory === 'All' || tour.category === activeCategory
    ).slice(0, MAX_HOME_PACKAGES);

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
            <section id="tours" className="py-12 md:py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-14">
                <div className="text-center mb-7">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 font-display">{t('section_tours_title')}</h2>
                    <p className="text-gray-600 max-w-2xl mx-auto text-sm">
                        {t('section_tours_subtitle')}
                    </p>
                </div>

                {/* Category filter pills — from DB */}
                <div className="flex flex-wrap justify-center gap-2 mb-10">
                    {['All', ...categories].map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
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
                        <div className="col-span-full text-center text-gray-500 py-10 font-medium">{t('loading_packages')}</div>
                    ) : filteredTours.length > 0 ? (
                        filteredTours.map((tour) => (
                            <TourCard key={tour.id} tour={tour} />
                        ))
                    ) : (
                        <div className="col-span-full text-center text-gray-500 py-10 bg-white rounded-2xl border border-gray-100">
                            {t('no_packages_category')}
                        </div>
                    )}
                </div>

                {/* View All button */}
                <div className="text-center mt-10">
                    <Link
                        to={`/packages${activeCategory !== 'All' ? `?category=${encodeURIComponent(activeCategory)}` : ''}`}
                        className="inline-flex items-center gap-2 bg-white border-2 border-primary text-primary hover:bg-primary hover:text-white font-bold py-3 px-8 rounded-full transition-all duration-300 shadow-sm"
                    >
                        {t('view_all_packages')}
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </section>

            <section id="private-trip" className="scroll-mt-14">
                <AIPlanner />
            </section>
            <section id="about" className="scroll-mt-14">
                <CompanyProfile />
            </section>
            <section className="py-10 md:py-12 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                        <div>
                            <img
                                src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=800"
                                alt="Happy travelers"
                                className="rounded-2xl shadow-lg"
                            />
                        </div>
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-5 font-display">
                                {t('why_choose_title')}
                            </h2>
                            <div className="space-y-5">
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                        <Star className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-gray-900 mb-1">{t('why_choose_1_title')}</h3>
                                        <p className="text-gray-600 text-sm">{t('why_choose_1_desc')}</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                        <Users className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-gray-900 mb-1">{t('why_choose_2_title')}</h3>
                                        <p className="text-gray-600 text-sm">{t('why_choose_2_desc')}</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                        <ShieldCheck className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-gray-900 mb-1">{t('why_choose_3_title')}</h3>
                                        <p className="text-gray-600 text-sm">{t('why_choose_3_desc')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <PerjalananKami />

            {/* Testimonials — from DB */}
            <section className="py-10 md:py-12 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-7">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-display">{t('testimonials_title')}</h2>
                    </div>
                    {testimonials.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {testimonials.map((item) => (
                                <div key={item.id as string} className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-gray-100 relative">
                                    <Quote className="absolute top-5 right-5 w-6 h-6 text-gray-100 fill-gray-100" />
                                    <p className="text-gray-600 text-sm mb-4 relative z-10 italic">"{item.comment}"</p>
                                    <div className="flex items-center gap-3">
                                        {item.avatar_url ? (
                                            <img src={item.avatar_url} alt={item.name} className="w-10 h-10 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <User className="w-5 h-5 text-primary" />
                                            </div>
                                        )}
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-sm">{item.name}</h4>
                                            <span className="text-xs text-primary font-medium">{item.role}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-400 text-sm py-6">{t('no_testimonials')}</p>
                    )}
                </div>
            </section>

            <section id="contact" className="py-12 md:py-14 bg-primary scroll-mt-14">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 font-display">
                        {t('ready_title')}
                    </h2>
                    <p className="text-emerald-100 mb-6 max-w-2xl mx-auto text-sm">
                        {t('ready_subtitle')}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={() => window.open(`https://wa.me/${settings.whatsapp}`, '_blank')}
                            className="bg-white text-primary hover:bg-gray-100 font-bold py-3 px-7 rounded-full shadow-lg transition-transform hover:-translate-y-1 text-sm"
                        >
                            {t('ready_wa')}
                        </button>
                    </div>
                </div>
            </section>
        </main>
    );
};

export default Home;
