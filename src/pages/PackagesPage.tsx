import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import TourCard from '../../components/TourCard';
import Footer from '../../components/Footer';
import { TourPackage } from '../../types';
import { supabase } from '../lib/supabase';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { formatMonthYear } from '../lib/formatDate';


const PAGE_SIZE = 15;

const PackagesPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { language, t } = useLanguage();
    const dateLocale = language === 'en' ? 'en-GB' : 'id-ID';

    const [packages, setPackages] = useState<TourPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState<string[]>([]);
    const [countries, setCountries] = useState<string[]>([]);

    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [page, setPage] = useState(0);

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        setLoading(true);
        const [pkgsResult, catsResult] = await Promise.all([
            supabase.from('packages').select('*').eq('is_published', true).order('departure_date', { ascending: true }),
            supabase.from('categories').select('name').order('name'),
        ]);

        if (pkgsResult.data) {
            setPackages(pkgsResult.data as TourPackage[]);
            const uniqueCountries = Array.from(
                new Set(pkgsResult.data.map(p => p.destination_country).filter(Boolean))
            ).sort() as string[];
            setCountries(uniqueCountries);
        }
        if (catsResult.data) setCategories(catsResult.data.map(c => c.name));

        setLoading(false);
    };

    const availableMonths = useMemo(() =>
        Array.from(new Set(packages.map(p => formatMonthYear(p.departure_date, dateLocale)))).filter(Boolean).sort(),
        [packages, dateLocale]
    );

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return packages.filter(p => {
            if (selectedCategory && p.category !== selectedCategory) return false;
            if (selectedCountry && p.destination_country !== selectedCountry) return false;
            if (selectedMonth && formatMonthYear(p.departure_date, dateLocale) !== selectedMonth) return false;
            if (q && !p.title.toLowerCase().includes(q) && !p.category.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [packages, search, selectedCategory, selectedCountry, selectedMonth, dateLocale]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    const resetPage = () => setPage(0);

    const clearFilters = () => {
        setSearch('');
        setSelectedCategory('');
        setSelectedCountry('');
        setSelectedMonth('');
        setPage(0);
    };

    const hasActiveFilter = search || selectedCategory || selectedCountry || selectedMonth;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <Navbar
                onNavigate={(id) => navigate(`/#${id}`)}
                onHomeClick={() => navigate('/')}
            />
            <main className="flex-grow">
                {/* Page Header */}
                <div className="bg-white border-b border-gray-100 py-8">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-display mb-1">
                            {t('packages_page_title')}
                        </h1>
                        <p className="text-gray-500 text-sm">
                            {loading ? t('packages_loading') : `${filtered.length} ${t('packages_count_suffix')}`}
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white border-b border-gray-100 sticky top-14 z-30 shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                            {/* Search */}
                            <div className="relative flex-1 min-w-0">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder={t('packages_search_placeholder')}
                                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); resetPage(); }}
                                />
                            </div>

                            {/* Category */}
                            <select
                                className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 min-w-[140px]"
                                value={selectedCategory}
                                onChange={(e) => { setSelectedCategory(e.target.value); resetPage(); }}
                            >
                                <option value="">{t('packages_all_categories')}</option>
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>

                            {/* Country */}
                            {countries.length > 0 && (
                                <select
                                    className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 min-w-[140px]"
                                    value={selectedCountry}
                                    onChange={(e) => { setSelectedCountry(e.target.value); resetPage(); }}
                                >
                                    <option value="">{t('packages_all_countries')}</option>
                                    {countries.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            )}

                            {/* Month */}
                            <select
                                className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 min-w-[150px]"
                                value={selectedMonth}
                                onChange={(e) => { setSelectedMonth(e.target.value); resetPage(); }}
                            >
                                <option value="">{t('packages_all_months')}</option>
                                {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>

                            {/* Clear filters */}
                            {hasActiveFilter && (
                                <button
                                    onClick={clearFilters}
                                    className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-red-500 border border-gray-200 rounded-xl hover:border-red-200 transition-colors whitespace-nowrap"
                                >
                                    <X className="w-3.5 h-3.5" />
                                    {t('packages_reset')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Grid */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {Array.from({ length: 10 }).map((_, i) => (
                                <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                                    <div className="h-44 bg-gray-200" />
                                    <div className="p-4 space-y-2">
                                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                                        <div className="h-3 bg-gray-100 rounded w-full" />
                                        <div className="h-5 bg-gray-200 rounded w-1/3 mt-3" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : paginated.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {paginated.map(tour => (
                                <TourCard key={tour.id} tour={tour} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <SlidersHorizontal className="w-12 h-12 text-gray-200 mb-4" />
                            <p className="text-gray-500 font-medium mb-1">{t('packages_no_results')}</p>
                            <p className="text-gray-400 text-sm mb-4">{t('packages_no_results_desc')}</p>
                            <button onClick={clearFilters} className="text-primary font-semibold text-sm hover:underline">
                                {t('packages_reset_link')}
                            </button>
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-10">
                            <button
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                {t('packages_prev')}
                            </button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: totalPages }).map((_, i) => {
                                    if (totalPages > 7 && Math.abs(i - page) > 2 && i !== 0 && i !== totalPages - 1) {
                                        if (i === 1 && page > 3) return <span key={i} className="px-1 text-gray-400">…</span>;
                                        if (i === totalPages - 2 && page < totalPages - 4) return <span key={i} className="px-1 text-gray-400">…</span>;
                                        if (Math.abs(i - page) > 2) return null;
                                    }
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => setPage(i)}
                                            className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${page === i ? 'bg-primary text-white shadow-sm' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                                        >
                                            {i + 1}
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                {t('packages_next')}
                            </button>
                        </div>
                    )}

                    {/* Page info */}
                    {!loading && filtered.length > 0 && (
                        <p className="text-center text-xs text-gray-400 mt-4">
                            {t('packages_showing')} {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} {t('packages_showing_of')} {filtered.length} {t('packages_showing_suffix')}
                        </p>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default PackagesPage;
