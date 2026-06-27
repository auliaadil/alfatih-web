import React, { useState, useEffect } from 'react';
import { useSiteSettings } from '../src/contexts/SiteSettingsContext';
import { useLanguage } from '../src/contexts/LanguageContext';
import {
  ArrowLeft,
  Calendar,
  Plane,
  Hotel,
  CheckCircle2,
  XCircle,
  MapPin,
  Clock,
  MessageCircle,
  Star,
  User,
  Users,
  Share2,
  Info,
  FileText,
  Check,
} from 'lucide-react';
import { TourPackage, Airport } from '../types';
import { supabase } from '../src/lib/supabase';
import { formatFlightRoutes } from '../src/lib/formatFlightRoutes';
import { formatDate } from '../src/lib/formatDate';

interface TourDetailProps {
  tour: TourPackage;
  onBack: () => void;
}

const TourDetail: React.FC<TourDetailProps> = ({ tour, onBack }) => {
  const settings = useSiteSettings();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'itinerary' | 'logistics' | 'inclusions'>('itinerary');
  const [selectedRoomIndex, setSelectedRoomIndex] = useState(0);
  const [airports, setAirports] = useState<Airport[]>([]);
  const [airlineNames, setAirlineNames] = useState<Record<string, string>>({});
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    const airlineIds = (tour.flight_routes ?? []).map((r) => r.airline_id).filter(Boolean);

    const fetchData = async () => {
      const [airportsResult, airlinesResult] = await Promise.all([
        supabase.from('airports').select('id, iata_code, name, city'),
        airlineIds.length > 0
          ? supabase.from('airlines').select('id, name').in('id', airlineIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (airportsResult.data) setAirports(airportsResult.data as Airport[]);

      if (airlinesResult.data) {
        const nameMap: Record<string, string> = {};
        (airlinesResult.data as { id: string; name: string }[]).forEach((a) => {
          nameMap[a.id] = a.name;
        });
        setAirlineNames(nameMap);
      }
    };

    fetchData();
  }, [tour.id]);

  const flightDisplay = formatFlightRoutes(tour.flight_routes, airlineNames, airports);
  const selectedRoom = tour.room_options?.[selectedRoomIndex];
  const dateLocale = language === 'en' ? 'en-GB' : 'id-ID';

  const getPrice = () => {
    if (!selectedRoom) return 'TBA';
    return `Rp ${(selectedRoom.price / 1_000_000).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} JT`;
  };

  const quotaFilled = tour.initial_quotas && tour.quotas !== undefined
    ? Math.min(100, Math.round(((tour.initial_quotas - tour.quotas) / tour.initial_quotas) * 100))
    : null;

  const quotaLow = (tour.quotas ?? 0) <= 10;
  const quotaWarn = (tour.quotas ?? 0) <= 20;

  const handleWhatsAppBooking = () => {
    const message = encodeURIComponent(
      `${t('detail_book_wa_message')} "${tour.title}" ${t('detail_book_wa_departure')} ${formatDate(tour.departure_date, dateLocale)}. ${t('detail_book_wa_room')}: ${selectedRoom?.name || 'TBA'}. ${t('detail_book_wa_suffix')}`
    );
    window.open(`https://wa.me/${settings.whatsapp}?text=${message}`, '_blank');
  };

  const handleHelpWhatsApp = () => {
    const message = encodeURIComponent(t('detail_help_wa_message'));
    window.open(`https://wa.me/${settings.whatsapp}?text=${message}`, '_blank');
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: tour.title, url });
      } catch (_) {}
    } else {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

  const tabs = [
    { id: 'itinerary' as const, label: t('detail_tab_itinerary'), icon: Calendar },
    { id: 'logistics' as const, label: t('detail_tab_facilities'), icon: Plane },
    { id: 'inclusions' as const, label: t('detail_tab_terms'), icon: Info },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero */}
      <div className="relative h-[44vh] min-h-[340px] md:h-[52vh] overflow-hidden bg-dark">
        {tour.image_url && (
          <img
            src={tour.image_url}
            alt={tour.title}
            className="w-full h-full object-cover opacity-80"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/50 to-dark/10" />

        {/* Top nav */}
        <div className="absolute top-4 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center z-10">
          <button
            onClick={onBack}
            className="bg-black/30 backdrop-blur-md hover:bg-black/50 text-white px-4 py-2 rounded-full transition-all flex items-center gap-2 group text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            {t('detail_back')}
          </button>
          <div className="relative">
            <button
              onClick={handleShare}
              className="bg-black/30 backdrop-blur-md hover:bg-black/50 text-white p-2 rounded-full transition-all"
              title={t('detail_share_copied')}
            >
              {shareCopied ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
            </button>
            {shareCopied && (
              <span className="absolute right-0 top-10 bg-gray-900 text-white text-xs px-2.5 py-1 rounded-lg whitespace-nowrap shadow-lg">
                {t('detail_share_copied')}
              </span>
            )}
          </div>
        </div>

        {/* Bottom metadata */}
        <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-7">
          <div className="mb-3 flex gap-2 flex-wrap">
            <span className="bg-secondary text-dark px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
              {tour.category}
            </span>
            {tour.is_popular && (
              <span className="bg-primary text-white px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1">
                <Star className="w-3 h-3 fill-white" /> Popular
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-4xl font-black text-white mb-4 leading-tight font-display">
            {tour.title}
          </h1>
          <div className="flex flex-wrap gap-2">
            {[
              { icon: Calendar, label: formatDate(tour.departure_date, dateLocale) },
              { icon: Clock, label: tour.duration },
              { icon: Users, label: `${t('detail_quota_remaining')} ${tour.quotas ?? 0} ${t('detail_quota_unit')}` },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-xs font-semibold border border-white/10">
                <Icon className="w-3.5 h-3.5" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
      {tour.image_credit && (
        <p className="text-xs text-gray-400 mt-1 text-center">{tour.image_credit}</p>
      )}

      {/* Features strip */}
      {(tour.features?.length ?? 0) > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 relative z-20 mb-6">
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 px-4 py-3 flex flex-wrap gap-2">
            {tour.features.slice(0, 7).map((feature, i) => (
              <span key={i} className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 whitespace-nowrap">
                <CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0" />
                {feature}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid lg:grid-cols-12 gap-7">

          {/* Left: Tab content */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-8">

              {/* Pill tabs */}
              <div className="flex bg-gray-100 rounded-xl p-1 mb-7 gap-1">
                {tabs.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg font-bold text-xs md:text-sm transition-all whitespace-nowrap ${
                      activeTab === id
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>

              {/* Itinerary tab */}
              {activeTab === 'itinerary' && (
                <div className="space-y-7">
                  {(tour.itinerary?.length ?? 0) > 0 ? tour.itinerary!.map((day, idx) => (
                    <div key={day.day} className="relative pl-11 group">
                      {idx !== tour.itinerary!.length - 1 && (
                        <div className="absolute left-[17px] top-9 bottom-0 w-px bg-gray-100" />
                      )}
                      <div className="absolute left-0 top-0 w-9 h-9 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-black text-sm border border-primary/20 group-hover:bg-primary group-hover:text-white transition-all">
                        {day.day}
                      </div>
                      <div>
                        <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors font-jakarta">
                          {day.title}
                        </h3>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
                          {day.description && (
                            <p className="text-gray-600 text-sm leading-relaxed">{day.description}</p>
                          )}
                          {(day.activities?.length ?? 0) > 0 && (
                            <ul className="space-y-2">
                              {day.activities!.map((activity, i) => (
                                <li key={i} className="flex items-start gap-2.5 text-gray-600 text-sm">
                                  <div className="mt-1.5 w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                                  {activity}
                                </li>
                              ))}
                            </ul>
                          )}
                          {(day.meals?.length ?? 0) > 0 && (
                            <div className="flex gap-2 pt-3 border-t border-gray-100 flex-wrap">
                              {day.meals!.map((meal, i) => (
                                <span key={i} className="bg-white px-2.5 py-1 rounded-full text-xs font-bold text-primary border border-primary/10">
                                  {meal}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )) : (
                    <p className="text-gray-400 text-sm italic text-center py-10">{t('detail_itinerary_empty')}</p>
                  )}
                </div>
              )}

              {/* Logistics tab */}
              {activeTab === 'logistics' && (
                <div className="space-y-8">
                  <section>
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="bg-primary/10 p-1.5 rounded-lg">
                        <Plane className="w-5 h-5 text-primary" />
                      </div>
                      <h3 className="text-base font-bold text-gray-900">{t('detail_flights_title')}</h3>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 flex items-center gap-5">
                      <div className="bg-white p-3.5 rounded-xl shadow-sm border border-gray-100 w-16 h-16 flex items-center justify-center flex-shrink-0">
                        {tour.airlines?.[0]?.logo_url ? (
                          <img src={tour.airlines[0].logo_url} alt={tour.airlines[0].name} className="max-w-[52px] max-h-[52px] object-contain" />
                        ) : (
                          <Plane className="w-7 h-7 text-primary/30" />
                        )}
                      </div>
                      <div>
                        <p className="text-base font-bold text-gray-900">{tour.airlines?.[0]?.name || t('detail_airline_tba')}</p>
                        <p className="text-gray-500 text-sm flex items-center gap-1.5 mt-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {flightDisplay}
                        </p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="bg-primary/10 p-1.5 rounded-lg">
                        <Hotel className="w-5 h-5 text-primary" />
                      </div>
                      <h3 className="text-base font-bold text-gray-900">{t('detail_hotels_title')}</h3>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      {(tour.hotels?.length ?? 0) > 0 ? tour.hotels!.map((hotel, i) => (
                        <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-primary/20 hover:shadow-md transition-all group">
                          <div className="flex justify-between items-start mb-3">
                            <div className="bg-white p-2 rounded-lg border border-gray-100 group-hover:bg-primary group-hover:border-primary transition-colors">
                              <Hotel className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                            </div>
                            <div className="flex gap-0.5">
                              {Array.from({ length: hotel.stars }).map((_, j) => (
                                <Star key={j} className="w-3 h-3 fill-secondary text-secondary" />
                              ))}
                            </div>
                          </div>
                          <h4 className="text-sm font-bold text-gray-900 mb-1.5 group-hover:text-primary transition-colors">{hotel.name}</h4>
                          {hotel.maps_url ? (
                            <a
                              href={hotel.maps_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-gray-500 text-xs hover:text-primary transition-colors"
                            >
                              <MapPin className="w-3 h-3 text-primary" />
                              {hotel.location}
                            </a>
                          ) : (
                            <p className="flex items-center gap-1.5 text-gray-500 text-xs">
                              <MapPin className="w-3 h-3 text-primary" />
                              {hotel.location}
                            </p>
                          )}
                        </div>
                      )) : (
                        <p className="col-span-2 text-gray-400 text-sm italic text-center py-8">{t('detail_hotel_empty')}</p>
                      )}
                    </div>
                  </section>
                </div>
              )}

              {/* Inclusions tab */}
              {activeTab === 'inclusions' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <section className="bg-primary/5 rounded-xl p-5 border border-primary/10">
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="bg-primary p-1.5 rounded-lg shadow-sm shadow-primary/20">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="text-sm font-bold text-gray-900">{t('detail_included')}</h3>
                    </div>
                    <ul className="space-y-2.5">
                      {(tour.included?.length ?? 0) > 0 ? tour.included!.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 text-sm leading-snug">{item}</span>
                        </li>
                      )) : (
                        <p className="text-gray-400 text-xs italic">{t('detail_no_data')}</p>
                      )}
                    </ul>
                  </section>
                  <section className="bg-red-50 rounded-xl p-5 border border-red-100">
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="bg-red-500 p-1.5 rounded-lg shadow-sm shadow-red-500/20">
                        <XCircle className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="text-sm font-bold text-gray-900">{t('detail_not_included')}</h3>
                    </div>
                    <ul className="space-y-2.5">
                      {(tour.not_included?.length ?? 0) > 0 ? tour.not_included!.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 text-sm leading-snug">{item}</span>
                        </li>
                      )) : (
                        <p className="text-gray-400 text-xs italic">{t('detail_no_data')}</p>
                      )}
                    </ul>
                  </section>
                </div>
              )}
            </div>
          </div>

          {/* Right: Sticky pricing */}
          <div className="lg:col-span-4">
            <div className="sticky top-16 space-y-4">

              {/* Dark pricing card */}
              <div className="bg-dark rounded-2xl shadow-2xl shadow-dark/30 p-5 md:p-7 text-white overflow-hidden relative border border-white/5">
                <div className="absolute top-0 right-0 w-40 h-40 bg-primary/15 blur-[80px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/10 blur-[60px] rounded-full" />

                <h3 className="text-base font-black mb-5 relative z-10 flex items-center gap-2">
                  <span className="w-1 h-5 bg-primary rounded-full inline-block" />
                  {t('detail_room_title')}
                </h3>

                {/* Room options */}
                <div className="space-y-2.5 mb-5 relative z-10">
                  {(tour.room_options?.length ?? 0) > 0 ? tour.room_options.map((room, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedRoomIndex(idx)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 ${
                        selectedRoomIndex === idx
                          ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                          : 'border-white/5 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg transition-colors ${selectedRoomIndex === idx ? 'bg-primary text-white' : 'bg-white/10 text-gray-400'}`}>
                          <div className="flex gap-0.5">
                            {Array.from({ length: Math.min(room.capacity, 4) }).map((_, i) => (
                              <User key={i} className="w-3 h-3" />
                            ))}
                          </div>
                        </div>
                        <div className="text-left">
                          <p className={`font-bold text-sm capitalize ${selectedRoomIndex === idx ? 'text-white' : 'text-gray-300'}`}>
                            {t('detail_room_prefix')} {room.name}
                          </p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                            {room.capacity} {t('detail_room_people')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-black ${selectedRoomIndex === idx ? 'text-primary' : 'text-white'}`}>
                          {(room.price / 1_000_000).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                        </p>
                        <p className="text-[9px] text-gray-500 font-bold">JT / PAX</p>
                      </div>
                    </button>
                  )) : (
                    <div className="p-4 bg-white/5 rounded-xl text-xs text-gray-400 text-center italic border border-white/5">
                      {t('detail_room_empty')}
                    </div>
                  )}
                </div>

                {/* Price summary + quota */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-5 relative z-10">
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1.5">{t('detail_price_label')}</p>
                  <span className="text-3xl font-black text-white block">{getPrice()}</span>
                  {selectedRoom?.original_price && selectedRoom.original_price > selectedRoom.price && (
                    <span className="text-sm font-bold text-gray-500 line-through block mt-0.5">
                      Rp {(selectedRoom.original_price / 1_000_000).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} JT
                    </span>
                  )}

                  {/* Quota progress bar */}
                  {quotaFilled !== null && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <div className="flex justify-between text-[10px] font-bold mb-1.5 uppercase tracking-wide">
                        <span className="text-gray-500">{t('detail_seats_filled')}</span>
                        <span className={quotaLow ? 'text-red-400' : quotaWarn ? 'text-secondary' : 'text-gray-500'}>
                          {t('detail_quota_remaining')} {tour.quotas} {t('detail_quota_unit')}
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${quotaLow ? 'bg-red-500' : quotaWarn ? 'bg-secondary' : 'bg-primary'}`}
                          style={{ width: `${quotaFilled}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-1.5 text-[10px] text-gray-500 font-bold uppercase">
                    <Info className="w-3 h-3" />
                    {t('detail_includes_note')}
                  </div>
                </div>

                {/* CTAs */}
                <div className="space-y-2.5 relative z-10">
                  <button
                    onClick={handleWhatsAppBooking}
                    className="w-full bg-primary hover:bg-accent text-white font-bold py-4 rounded-xl shadow-xl shadow-primary/30 transition-all flex items-center justify-center gap-2.5 transform hover:-translate-y-0.5 active:scale-95"
                  >
                    <MessageCircle className="w-5 h-5" />
                    {t('detail_book_wa')}
                  </button>
                  {tour.brochure_url && (
                    <button
                      onClick={() => window.open(tour.brochure_url, '_blank')}
                      className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <FileText className="w-4 h-4 text-secondary" />
                      {t('detail_brochure')}
                    </button>
                  )}
                </div>

                <p className="text-center text-[10px] text-gray-600 mt-5 font-medium relative z-10">
                  {t('detail_price_note')}
                </p>
              </div>

              {/* Help card */}
              <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-lg flex-shrink-0">
                  <Info className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm mb-1">{t('detail_help_title')}</h4>
                  <p className="text-xs text-gray-500 mb-2.5 leading-relaxed">{t('detail_help_desc')}</p>
                  <button
                    onClick={handleHelpWhatsApp}
                    className="text-primary font-bold text-xs hover:underline"
                  >
                    {t('detail_help_cta')} →
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TourDetail;
