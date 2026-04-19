import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Plane, Users, Calendar, Sparkles, MapPin, Send, RotateCcw, Loader2, ChevronDown, ChevronUp, User } from 'lucide-react';
import { generateItinerary } from '../services/geminiService';
import { AIPlannerInput } from '../types';
import { INTERESTS_LIST, DESTINATION_OPTIONS, CONTACT_INFO } from '../constants';
import { supabase } from '../src/lib/supabase';
import { useLanguage } from '../src/contexts/LanguageContext';
import { useRecaptcha } from '../src/hooks/useRecaptcha';

interface TravelerOption {
    value: string;
    label: string;
    icon: string;
}

const DEFAULT_TRAVELER_OPTIONS: TravelerOption[] = [
    { value: 'Solo', label: 'Solo', icon: '🧑' },
    { value: 'Pasangan', label: 'Pasangan', icon: '💑' },
    { value: 'Keluarga', label: 'Keluarga', icon: '👨‍👩‍👧‍👦' },
    { value: 'Rombongan', label: 'Rombongan', icon: '👥' },
];

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';

const AIPlanner: React.FC = () => {
    const { t } = useLanguage();
    const { executeRecaptcha } = useRecaptcha(RECAPTCHA_SITE_KEY);

    const [destination, setDestination] = useState('');
    const [days, setDays] = useState(5);
    const [travelers, setTravelers] = useState('Keluarga');
    const [interests, setInterests] = useState<string[]>([]);
    const [itinerary, setItinerary] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Pre-generation contact (optional)
    const [showPreContact, setShowPreContact] = useState(false);
    const [preContact, setPreContact] = useState({ name: '', phone: '', email: '' });

    // Post-generation contact form
    const [showContactForm, setShowContactForm] = useState(false);
    const [contactForm, setContactForm] = useState({ name: '', phone: '', email: '', budget: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Dynamic options from Supabase
    const [destinationOptions, setDestinationOptions] = useState<string[]>(DESTINATION_OPTIONS);
    const [interestOptions, setInterestOptions] = useState<string[]>(INTERESTS_LIST);
    const [travelerOptions, setTravelerOptions] = useState<TravelerOption[]>(DEFAULT_TRAVELER_OPTIONS);

    useEffect(() => {
        fetchPlannerConfig();
    }, []);

    const fetchPlannerConfig = async () => {
        const { data, error } = await supabase.from('site_settings').select('planner_destinations, planner_interests, planner_traveler_types').eq('id', 1).single();
        if (!error && data) {
            if (data.planner_destinations && (data.planner_destinations as string[]).length > 0) {
                setDestinationOptions(data.planner_destinations as string[]);
            }
            if (data.planner_interests && (data.planner_interests as string[]).length > 0) {
                setInterestOptions(data.planner_interests as string[]);
            }
            if (data.planner_traveler_types && (data.planner_traveler_types as TravelerOption[]).length > 0) {
                setTravelerOptions(data.planner_traveler_types as TravelerOption[]);
            }
        }
    };

    const filteredSuggestions = destinationOptions.filter((opt) =>
        opt.toLowerCase().includes(destination.toLowerCase()) && destination.length > 0
    );

    const toggleInterest = (interest: string) => {
        setInterests((prev) =>
            prev.includes(interest)
                ? prev.filter((i) => i !== interest)
                : [...prev, interest]
        );
    };

    const handleGenerate = async () => {
        if (!destination.trim() || interests.length === 0) return;

        // reCAPTCHA check
        if (RECAPTCHA_SITE_KEY) {
            const token = await executeRecaptcha('generate_itinerary');
            if (!token) {
                alert('CAPTCHA verification failed. Please try again.');
                return;
            }
        }

        // Save pre-contact if filled
        if (preContact.name || preContact.phone || preContact.email) {
            await supabase.from('private_trip_requests').insert([{
                name: preContact.name || null,
                phone: preContact.phone || null,
                email: preContact.email || null,
                destination: destination.trim(),
                days: days,
                travelers: travelers,
                interests: interests,
                status: 'pending',
                special_requirements: 'Pre-generation contact form lead.',
            }]);
        }

        setIsLoading(true);
        setItinerary(null);

        const input: AIPlannerInput = {
            destination: destination.trim(),
            days,
            travelers,
            interests,
        };

        const result = await generateItinerary(input);
        setItinerary(result);
        setIsLoading(false);
    };

    const handleReset = () => {
        setItinerary(null);
        setDestination('');
        setDays(5);
        setTravelers('Keluarga');
        setInterests([]);
        setPreContact({ name: '', phone: '', email: '' });
        setShowPreContact(false);
    };

    const handleSubmitLead = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        await supabase.from('private_trip_requests').insert([{
            name: contactForm.name,
            phone: contactForm.phone,
            email: contactForm.email,
            destination: destination,
            dates: `${days} ${t('planner_result_days')}`,
            pax_count: travelers === 'Solo' ? 1 : travelers === 'Pasangan' ? 2 : travelers === 'Keluarga' ? 4 : 10,
            budget: contactForm.budget || '-',
            special_requirements: `${t('planner_interests_label')}: ${interests.join(', ')}. Draft Itinerary generated by AI.`,
            status: 'pending'
        }]);

        setIsSubmitting(false);
        setShowContactForm(false);

        const message = encodeURIComponent(
            `Assalamualaikum Alfatih Dunia Wisata! 👋\n\nNama: ${contactForm.name}\nSaya baru saja membuat draft itinerary *Private Trip* ke *${destination}* selama *${days} hari* untuk *${travelers}*.\n\nSaya ingin konsultasi lebih lanjut dan cek harga resmi. Terima kasih! 🙏`
        );
        window.open(`https://wa.me/${CONTACT_INFO.whatsapp}?text=${message}`, '_blank');
    };

    const isFormValid = destination.trim().length > 0 && interests.length > 0;

    // ─── Result View ───
    if (itinerary) {
        return (
            <div className="bg-gray-50">
                <div className="relative py-16 bg-gradient-to-br from-primary via-accent to-primary overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-[120px]"></div>
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-full text-xs font-black uppercase tracking-widest mb-4 shadow-xl">
                            <Sparkles className="w-3.5 h-3.5" /> {t('planner_result_badge')}
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-white mb-2">
                            {t('planner_result_heading')} {destination}
                        </h2>
                        <p className="text-white/80">
                            {days} {t('planner_result_days')} • {travelers} • {interests.length} {t('planner_result_interests')}
                        </p>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 pb-20">
                    <div className="bg-white rounded-3xl shadow-2xl shadow-primary/10 border border-gray-100 p-8 md:p-12">
                        <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-headings:font-black prose-p:text-gray-600 prose-strong:text-gray-800 prose-ul:text-gray-600 prose-li:marker:text-primary">
                            <ReactMarkdown>{itinerary}</ReactMarkdown>
                        </div>
                    </div>

                    {showContactForm ? (
                        <div className="mt-8 bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">{t('planner_contact_title')}</h3>
                            <p className="text-sm text-gray-500 mb-6 text-center">{t('planner_contact_subtitle')}</p>
                            <form onSubmit={handleSubmitLead} className="space-y-4 max-w-md mx-auto">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('planner_contact_name')} *</label>
                                    <input required type="text" value={contactForm.name} onChange={e => setContactForm({ ...contactForm, name: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('planner_contact_wa')} *</label>
                                    <input required type="tel" value={contactForm.phone} onChange={e => setContactForm({ ...contactForm, phone: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" placeholder="08123456789" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('planner_contact_email')} <span className="font-normal text-gray-400">({t('planner_contact_optional')})</span></label>
                                        <input type="email" value={contactForm.email} onChange={e => setContactForm({ ...contactForm, email: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('planner_contact_budget')} <span className="font-normal text-gray-400">({t('planner_contact_optional')})</span></label>
                                        <input type="text" value={contactForm.budget} onChange={e => setContactForm({ ...contactForm, budget: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" placeholder="25 Jt/Pax" />
                                    </div>
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button type="button" onClick={() => setShowContactForm(false)} className="px-6 py-3 font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors flex-1">
                                        {t('planner_contact_cancel')}
                                    </button>
                                    <button type="submit" disabled={isSubmitting} className="px-6 py-3 font-bold text-white bg-green-500 hover:bg-green-600 rounded-xl transition-colors shadow-lg shadow-green-500/20 flex-2 w-full flex items-center justify-center gap-2">
                                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                        {t('planner_contact_send')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => setShowContactForm(true)}
                                className="flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-full shadow-lg shadow-green-500/30 transition-all hover:-translate-y-1 hover:shadow-xl"
                            >
                                <Send className="w-5 h-5" />
                                {t('planner_cta_consult')}
                            </button>
                            <button
                                onClick={handleReset}
                                className="flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-700 font-bold py-4 px-8 rounded-full shadow-lg border border-gray-200 transition-all hover:-translate-y-1"
                            >
                                <RotateCcw className="w-5 h-5" />
                                {t('planner_cta_reset')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ─── Loading View ───
    if (isLoading) {
        return (
            <div className="bg-gray-50 py-20">
                <div className="max-w-3xl mx-auto px-4 text-center">
                    <div className="bg-white rounded-3xl shadow-2xl p-12 md:p-16 border border-gray-100">
                        <div className="relative mx-auto mb-8 w-24 h-24">
                            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
                            <div className="relative w-24 h-24 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
                                <Loader2 className="w-10 h-10 text-white animate-spin" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-3">{t('planner_loading_title')}</h3>
                        <p className="text-gray-500 mb-10 max-w-md mx-auto">
                            {t('planner_loading_desc_1')} <strong className="text-primary">{destination}</strong> {t('planner_loading_desc_2')} <strong>{days}</strong> {t('planner_loading_desc_3')}
                        </p>
                        <div className="space-y-4 max-w-lg mx-auto">
                            <div className="h-5 bg-gray-200 rounded-full animate-pulse w-3/4"></div>
                            <div className="h-4 bg-gray-100 rounded-full animate-pulse w-full"></div>
                            <div className="h-4 bg-gray-100 rounded-full animate-pulse w-5/6"></div>
                            <div className="h-4 bg-gray-100 rounded-full animate-pulse w-2/3"></div>
                            <div className="h-5 bg-gray-200 rounded-full animate-pulse w-1/2 mt-6"></div>
                            <div className="h-4 bg-gray-100 rounded-full animate-pulse w-full"></div>
                            <div className="h-4 bg-gray-100 rounded-full animate-pulse w-4/5"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ─── Form View ───
    return (
        <div className="bg-gray-50">
            {/* Section Header */}
            <div className="relative py-20 md:py-28 bg-gradient-to-br from-primary via-accent to-primary overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-secondary/20 rounded-full blur-[120px]"></div>
                <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-[100px]"></div>
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-full text-xs font-black uppercase tracking-widest mb-6 shadow-xl">
                        <Sparkles className="w-3.5 h-3.5" /> AI-Powered
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                        {t('private_trip_title')}
                    </h2>
                    <p className="text-xl text-white/90 max-w-2xl mx-auto font-medium leading-relaxed">
                        {t('planner_subtitle')}
                    </p>
                </div>
            </div>

            {/* Form Card */}
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20 pb-20">
                <div className="bg-white rounded-[2rem] shadow-2xl shadow-primary/10 border border-gray-100 p-8 md:p-12">

                    {/* Destination */}
                    <div className="mb-8">
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
                            <MapPin className="w-4 h-4 text-primary" /> {t('planner_destination_label')}
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={destination}
                                onChange={(e) => {
                                    setDestination(e.target.value);
                                    setShowSuggestions(true);
                                }}
                                onFocus={() => setShowSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                placeholder={t('planner_destination_placeholder')}
                                className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-lg"
                            />
                            {showSuggestions && filteredSuggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                                    {filteredSuggestions.map((opt) => (
                                        <button
                                            key={opt}
                                            onMouseDown={() => {
                                                setDestination(opt);
                                                setShowSuggestions(false);
                                            }}
                                            className="w-full text-left px-6 py-3 hover:bg-primary/5 text-gray-700 transition-colors flex items-center gap-3"
                                        >
                                            <MapPin className="w-4 h-4 text-primary/50" /> {opt}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        {/* Quick chips */}
                        <div className="flex flex-wrap gap-2 mt-3">
                            {destinationOptions.slice(0, 5).map((opt) => (
                                <button
                                    key={opt}
                                    onClick={() => setDestination(opt)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${destination === opt
                                        ? 'bg-primary text-white shadow-md'
                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                        }`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Duration & Travelers Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                        {/* Duration */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
                                <Calendar className="w-4 h-4 text-primary" /> {t('planner_duration_label')}
                            </label>
                            <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-2xl px-6 py-3">
                                <button
                                    onClick={() => setDays(Math.max(1, days - 1))}
                                    className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-lg font-bold text-gray-600 hover:bg-primary hover:text-white hover:border-primary transition-all"
                                >
                                    −
                                </button>
                                <span className="text-2xl font-black text-gray-900 flex-grow text-center">{days}</span>
                                <button
                                    onClick={() => setDays(Math.min(30, days + 1))}
                                    className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-lg font-bold text-gray-600 hover:bg-primary hover:text-white hover:border-primary transition-all"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Travelers */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
                                <Users className="w-4 h-4 text-primary" /> {t('planner_traveler_label')}
                            </label>
                            <div className="relative">
                                <select
                                    value={travelers}
                                    onChange={(e) => setTravelers(e.target.value)}
                                    className="w-full appearance-none px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-lg cursor-pointer"
                                >
                                    {travelerOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.icon} {opt.label}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Interests */}
                    <div className="mb-8">
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
                            <Sparkles className="w-4 h-4 text-primary" /> {t('planner_interests_label')}
                        </label>
                        <div className="flex flex-wrap gap-3">
                            {interestOptions.map((interest) => (
                                <button
                                    key={interest}
                                    onClick={() => toggleInterest(interest)}
                                    className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 ${interests.includes(interest)
                                        ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105'
                                        }`}
                                >
                                    {interest}
                                </button>
                            ))}
                        </div>
                        {interests.length === 0 && (
                            <p className="text-xs text-gray-400 mt-2">{t('planner_interests_hint')}</p>
                        )}
                    </div>

                    {/* Optional Contact (Pre-generation) */}
                    <div className="mb-8 border border-gray-200 rounded-2xl overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setShowPreContact(!showPreContact)}
                            className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                            <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                <User className="w-4 h-4 text-primary" /> {t('planner_contact_toggle')}
                            </span>
                            {showPreContact ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </button>
                        {showPreContact && (
                            <div className="p-6 space-y-4 bg-white">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('planner_contact_name')}</label>
                                    <input
                                        type="text"
                                        value={preContact.name}
                                        onChange={e => setPreContact({ ...preContact, name: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('planner_contact_wa')}</label>
                                        <input
                                            type="tel"
                                            value={preContact.phone}
                                            onChange={e => setPreContact({ ...preContact, phone: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                                            placeholder="08123456789"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('planner_contact_email')} <span className="text-gray-400 font-normal">({t('planner_contact_optional')})</span></label>
                                        <input
                                            type="email"
                                            value={preContact.email}
                                            onChange={e => setPreContact({ ...preContact, email: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Submit */}
                    <button
                        onClick={handleGenerate}
                        disabled={!isFormValid}
                        className={`w-full flex items-center justify-center gap-3 py-5 rounded-2xl text-lg font-black uppercase tracking-wider transition-all duration-300 ${isFormValid
                            ? 'bg-primary text-white shadow-xl shadow-primary/30 hover:-translate-y-1 hover:shadow-2xl cursor-pointer'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        <Plane className="w-5 h-5" />
                        {t('planner_submit')}
                    </button>

                    <p className="text-center text-xs text-gray-400 mt-4">
                        {t('planner_powered_by')}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AIPlanner;
