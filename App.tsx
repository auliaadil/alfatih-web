import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import TourCard from './components/TourCard';
import TourDetail from './components/TourDetail';

import CompanyProfile from './components/CompanyProfile';
import Footer from './components/Footer';
import { FEATURED_TOURS, TESTIMONIALS, CONTACT_INFO } from './constants';
import { TourCategory } from './types';
import { Quote } from 'lucide-react';

const App: React.FC = () => {
    const [activeCategory, setActiveCategory] = useState<TourCategory | 'All'>('All');
    const [selectedTourId, setSelectedTourId] = useState<string | null>(null);

    // Scroll to top when selectedTourId changes
    useEffect(() => {
        if (selectedTourId) {
            window.scrollTo(0, 0);
        }
    }, [selectedTourId]);

    const navigateToSection = (id: string) => {
        // If we're on a tour detail view, clear it first
        if (selectedTourId) {
            setSelectedTourId(null);
            // Wait for re-render before scrolling
            setTimeout(() => {
                const element = document.getElementById(id);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            }, 100);
        } else {
            // Already on home view, just scroll
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };

    const resetToHome = () => {
        setSelectedTourId(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const filteredTours = activeCategory === 'All'
        ? FEATURED_TOURS
        : FEATURED_TOURS.filter(tour => tour.category === activeCategory);

    const selectedTour = FEATURED_TOURS.find(t => t.id === selectedTourId);

    // Common Layout Wrappers
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

    // View: Tour Detail
    if (selectedTour) {
        return withLayout(
            <TourDetail
                tour={selectedTour}
                onBack={() => setSelectedTourId(null)}
            />
        );
    }

    // View: Home
    return withLayout(
        <main className="flex-grow">
            <Hero />

            {/* Featured Tours Section */}
            <section id="tours" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Tour & Umrah Packages</h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Prices are starting from Jakarta. Our packages are designed for comfort and spiritual peace.
                    </p>
                </div>

                {/* Filter Tabs */}
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

                {/* Tour Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredTours.map((tour) => (
                        <TourCard
                            key={tour.id}
                            tour={tour}
                            onViewDetails={(id) => setSelectedTourId(id)}
                        />
                    ))}
                </div>
            </section>


            {/* About Us / Company Profile Section */}
            <section id="about" className="scroll-mt-20">
                <CompanyProfile />
            </section>

            {/* Why Choose Us / Features */}
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
                                Why Choose Alfatih Dunia Wisata?
                            </h2>
                            <div className="space-y-8">
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                        <span className="text-2xl">🕌</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">Halal Friendly</h3>
                                        <p className="text-gray-600">We ensure Halal meals and prayer times are prioritized in all our itineraries, regardless of destination.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                        <span className="text-2xl">🤝</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">Expert Guides</h3>
                                        <p className="text-gray-600">Our Mutawwif and tour guides are experienced, knowledgeable, and fluent in local languages.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                        <span className="text-2xl">🛡️</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">Trusted Service</h3>
                                        <p className="text-gray-600">Official registered travel agency with years of experience in handling Umrah and International groups.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900">What Our Pilgrims Say</h2>
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

            {/* Call to Action */}
            <section id="contact" className="py-20 bg-primary scroll-mt-20">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                        Ready for Your Next Spiritual Journey?
                    </h2>
                    <p className="text-emerald-100 text-lg mb-8 max-w-2xl mx-auto">
                        Contact us today to book your seat or get a free consultation for your group or family trip.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => window.open(`https://wa.me/${CONTACT_INFO.whatsapp}`, '_blank')}
                            className="bg-white text-primary hover:bg-gray-100 font-bold py-4 px-8 rounded-full shadow-lg transition-transform hover:-translate-y-1"
                        >
                            Contact via WhatsApp
                        </button>
                        <button className="bg-transparent border-2 border-white text-white hover:bg-white/10 font-bold py-4 px-8 rounded-full transition-all">
                            Download Brochure
                        </button>
                    </div>
                </div>
            </section>
        </main>
    );
};

export default App;