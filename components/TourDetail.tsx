import React, { useState } from 'react';
import { useSiteSettings } from '../src/contexts/SiteSettingsContext';
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
  FileText
} from 'lucide-react';
import { TourPackage } from '../types';

interface TourDetailProps {
  tour: TourPackage;
  onBack: () => void;
}

const TourDetail: React.FC<TourDetailProps> = ({ tour, onBack }) => {
  const settings = useSiteSettings();
  const [activeTab, setActiveTab] = useState<'itinerary' | 'logistics' | 'inclusions'>('itinerary');
  const [selectedRoomIndex, setSelectedRoomIndex] = useState(0);

  const getPrice = () => {
    const room = tour.room_options?.[selectedRoomIndex];
    if (!room) return 'TBA';
    return `Rp ${(room.price / 1000000).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} JT`;
  };

  const handleWhatsAppBooking = () => {
    const message = encodeURIComponent(
      `Assalamualaikum Alfatih Dunia Wisata, saya tertarik dengan paket "${tour.title}" untuk keberangkatan ${tour.departure_date}. Tipe kamar: ${tour.room_options?.[selectedRoomIndex]?.name || 'TBA'}. Mohon info detailnya.`
    );
    window.open(`https://wa.me/${settings.whatsapp}?text=${message}`, '_blank');
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Premium Hero Section */}
      <div className="relative h-[50vh] min-h-[400px] md:h-[60vh] overflow-hidden bg-gray-900 w-full">
        {tour.image_url && (
          <img
            src={tour.image_url}
            alt={tour.title}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent"></div>

        {/* Navigation Overlays */}
        <div className="absolute top-6 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center z-10">
          <button
            onClick={onBack}
            className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white p-2.5 rounded-full transition-all flex items-center gap-2 pr-5 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-semibold text-sm">Kembali</span>
          </button>
          <button className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white p-2.5 rounded-full transition-all">
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        <div className="absolute bottom-6 md:bottom-12 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-8">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="bg-secondary text-gray-900 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg">
                  {tour.category}
                </span>
              </div>
              <h1 className="text-2xl md:text-5xl font-extrabold text-white mb-4 leading-tight drop-shadow-lg">
                {tour.title}
              </h1>
              <div className="flex flex-wrap items-center gap-3 md:gap-6 text-gray-200 text-sm md:text-base">
                <div className="flex items-center gap-2.5">
                  <div className="bg-primary p-1.5 rounded-lg shadow-inner">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-medium">{tour.departure_date}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="bg-primary p-1.5 rounded-lg shadow-inner">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-medium">{tour.duration}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="bg-primary p-1.5 rounded-lg shadow-inner">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-medium">Sisa Kuota: {tour.quotas} / {tour.initial_quotas || tour.quotas} Pax</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="grid lg:grid-cols-12 gap-10">

          {/* Left Column: Details */}
          <div className="lg:col-span-8 bg-white rounded-3xl shadow-2xl shadow-gray-200/50 p-4 sm:p-6 md:p-10 mb-10 overflow-hidden">
            {/* Custom Tab Navigation */}
            <div className="flex border-b border-gray-100 mb-8 md:mb-10 overflow-x-auto no-scrollbar scroll-smooth">
              <button
                onClick={() => setActiveTab('itinerary')}
                className={`flex items-center gap-2 px-6 py-4 font-bold text-sm uppercase tracking-widest border-b-4 transition-all whitespace-nowrap ${activeTab === 'itinerary' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
              >
                <Calendar className="w-4 h-4" /> Itinerary
              </button>
              <button
                onClick={() => setActiveTab('logistics')}
                className={`flex items-center gap-2 px-6 py-4 font-bold text-sm uppercase tracking-widest border-b-4 transition-all whitespace-nowrap ${activeTab === 'logistics' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
              >
                <Plane className="w-4 h-4" /> Fasilitas
              </button>
              <button
                onClick={() => setActiveTab('inclusions')}
                className={`flex items-center gap-2 px-6 py-4 font-bold text-sm uppercase tracking-widest border-b-4 transition-all whitespace-nowrap ${activeTab === 'inclusions' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
              >
                <Info className="w-4 h-4" /> Syarat & Ketentuan
              </button>
            </div>

            {/* Tab Panels */}
            <div className="min-h-[400px]">
              {activeTab === 'itinerary' && (
                <div className="space-y-10">
                  {tour.itinerary?.map((day, idx) => (
                    <div key={day.day} className="relative pl-12 group">
                      {/* Timeline Line */}
                      {idx !== tour.itinerary.length - 1 && (
                        <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-gray-100 group-hover:bg-primary/20 transition-colors"></div>
                      )}
                      {/* Timeline Node */}
                      <div className="absolute left-0 top-0 w-10 h-10 bg-emerald-50 text-primary rounded-2xl flex items-center justify-center font-bold text-sm border-2 border-primary group-hover:bg-primary group-hover:text-white transition-all shadow-md">
                        {day.day}
                      </div>
                      <div>
                        <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4 group-hover:text-primary transition-colors">
                          {day.title}
                        </h3>
                        <div className="bg-gray-50/50 rounded-2xl p-4 md:p-6 border border-gray-100 space-y-4">
                          {day.description && (
                            <p className="text-gray-600 text-sm leading-relaxed">{day.description}</p>
                          )}
                          {day.activities && day.activities.length > 0 && (
                            <ul className="grid gap-3">
                              {day.activities.map((activity: string, i: number) => (
                                <li key={i} className="flex items-start gap-3 text-gray-600 text-sm leading-relaxed">
                                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></div>
                                  <span>{activity}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                          {day.meals && day.meals.length > 0 && (
                            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                              {day.meals.map((meal: string, idx: number) => (
                                <span key={idx} className="bg-white px-3 py-1 rounded-full text-xs font-bold text-primary shadow-sm border border-primary/10">
                                  {meal}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'logistics' && (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <section>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-primary/10 p-2 rounded-xl">
                        <Plane className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold text-gray-900">Maskapai Penerbangan</h3>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-5 md:p-8 border border-gray-100 flex flex-col md:flex-row items-center gap-6 md:gap-8 shadow-sm">
                      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-50 w-24 h-24 flex items-center justify-center">
                        {tour.airlines?.[0]?.logo_url ? (
                          <img src={tour.airlines[0].logo_url} alt={tour.airlines[0].name} className="max-w-[70px] max-h-[70px] object-contain" />
                        ) : (
                          <>
                            <Plane className="w-12 h-12 text-primary opacity-20 absolute" />
                            <span className="text-xl font-black text-primary text-center leading-none">
                              {tour.airlines?.[0]?.name.split(' ')[0] || 'TBA'}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="text-center md:text-left">
                        <p className="text-2xl font-bold text-gray-900 mb-2">{tour.airlines?.[0]?.name || 'Airline TBA'}</p>
                        <p className="text-gray-500 flex items-center justify-center md:justify-start gap-2">
                          <MapPin className="w-4 h-4" />
                          {tour.flight_details || 'Flight Details TBA'}
                        </p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-primary/10 p-2 rounded-xl">
                        <Hotel className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">Akomodasi Hotel</h3>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      {tour.hotels?.map((hotel, i) => (
                        <div key={i} className="group relative bg-white rounded-3xl p-6 border-2 border-gray-100 hover:border-primary/30 transition-all hover:shadow-xl overflow-hidden">
                          <div className="flex justify-between items-start mb-6">
                            <div className="bg-emerald-50 p-3 rounded-2xl group-hover:bg-primary group-hover:text-white transition-colors">
                              <Hotel className="w-6 h-6" />
                            </div>
                            <div className="flex gap-1">
                              {Array.from({ length: hotel.stars }).map((_, j) => (
                                <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              ))}
                            </div>
                          </div>
                          <h4 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">{hotel.name}</h4>
                          <div className="flex items-center gap-2 text-gray-500 font-medium text-sm">
                            <MapPin className="w-4 h-4 text-primary" />
                            <span>{hotel.location}</span>
                          </div>
                          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'inclusions' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <section className="bg-emerald-50/30 rounded-3xl p-6 md:p-8 border border-emerald-100">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/20">
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Harga Termasuk</h3>
                    </div>
                    <ul className="space-y-4">
                      {tour.included?.map((item, i) => (
                        <li key={i} className="flex items-start gap-4 group">
                          <div className="mt-1 w-5 h-5 rounded-full bg-white border border-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary transition-colors">
                            <CheckCircle2 className="w-3 h-3 text-primary group-hover:text-white" />
                          </div>
                          <span className="text-gray-700 font-medium leading-snug">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                  <section className="bg-red-50/30 rounded-3xl p-6 md:p-8 border border-red-100">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="bg-red-500 p-2 rounded-xl shadow-lg shadow-red-500/20">
                        <XCircle className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Tidak Termasuk</h3>
                    </div>
                    <ul className="space-y-4">
                      {tour.not_included?.map((item, i) => (
                        <li key={i} className="flex items-start gap-4 group">
                          <div className="mt-1 w-5 h-5 rounded-full bg-white border border-red-200 flex items-center justify-center flex-shrink-0 group-hover:bg-red-500 transition-colors">
                            <XCircle className="w-3 h-3 text-red-400 group-hover:text-white" />
                          </div>
                          <span className="text-gray-700 font-medium leading-snug">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Dynamic Pricing Card */}
          <div className="lg:col-span-4 lg:relative">
            <div className="sticky top-24 space-y-6">
              <div className="bg-gray-900 rounded-[2.5rem] shadow-2xl p-6 md:p-8 text-white overflow-hidden relative border border-gray-800">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[80px] rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/10 blur-[80px] rounded-full"></div>

                <h3 className="text-xl md:text-2xl font-black mb-6 md:mb-8 relative z-10 flex items-center gap-3">
                  <span className="text-primary">|</span> Pilih Tipe Kamar
                </h3>

                {/* Room Selector Grid */}
                <div className="space-y-4 mb-10 relative z-10">
                  {tour.room_options?.map((room, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedRoomIndex(idx)}
                      className={`w-full flex items-center justify-between p-4 md:p-5 rounded-3xl border-2 transition-all duration-300 ${selectedRoomIndex === idx
                        ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(4,120,87,0.3)]'
                        : 'border-white/5 bg-white/5 hover:bg-white/10'
                        }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${selectedRoomIndex === idx ? 'bg-primary text-white' : 'bg-white/10 text-gray-400'}`}>
                          <div className="flex gap-0.5">
                            {Array.from({ length: Math.min(room.capacity, 4) }).map((_, i) => (
                              <User key={i} className="w-3.5 h-3.5" />
                            ))}
                          </div>
                        </div>
                        <div className="text-left">
                          <p className={`font-bold capitalize ${selectedRoomIndex === idx ? 'text-white' : 'text-gray-300'}`}>
                            Kamar {room.name}
                          </p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                            Untuk {room.capacity} Orang
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-black ${selectedRoomIndex === idx ? 'text-primary' : 'text-white'}`}>
                          {(room.price / 1000000).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                        </p>
                        <p className="text-[10px] text-gray-500 font-bold">JT / PAX</p>
                      </div>
                    </button>
                  ))}
                  {(!tour.room_options || tour.room_options.length === 0) && (
                    <div className="p-4 bg-white/5 rounded-2xl text-sm text-gray-400 text-center italic border border-white/5">
                      Tipe kamar belum dikonfigurasi.
                    </div>
                  )}
                </div>

                {/* Final Price Summary */}
                <div className="p-5 md:p-6 rounded-[2rem] bg-white/5 border border-white/10 mb-8 relative z-10">
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Total Harga per Orang</p>
                  <div className="flex flex-col gap-1">
                    <span className="text-storage text-3xl md:text-4xl font-black text-white">{getPrice()}</span>
                    {tour.room_options?.[selectedRoomIndex]?.original_price && tour.room_options[selectedRoomIndex].original_price > tour.room_options[selectedRoomIndex].price && (
                      <span className="text-sm font-bold text-gray-500 line-through">
                        Rp {(tour.room_options[selectedRoomIndex].original_price / 1000000).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} JT
                      </span>
                    )}
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase">
                    <Info className="w-3 h-3" />
                    <span>Termasuk tiket Pesawat & Hotel</span>
                  </div>
                </div>

                <div className="space-y-4 relative z-10">
                  <button
                    onClick={handleWhatsAppBooking}
                    className="w-full bg-primary hover:bg-emerald-600 text-white font-bold py-5 rounded-[1.5rem] shadow-xl shadow-emerald-900/40 transition-all flex items-center justify-center gap-3 transform hover:-translate-y-1 active:scale-95"
                  >
                    <MessageCircle className="w-6 h-6" />
                    Booking via WhatsApp
                  </button>
                  {tour.brochure_url && (
                    <button
                      onClick={() => window.open(tour.brochure_url, '_blank')}
                      className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-5 rounded-[1.5rem] transition-all flex items-center justify-center gap-2"
                    >
                      <FileText className="w-5 h-5 text-secondary" />
                      Brosur Lengkap (PDF)
                    </button>
                  )}
                </div>

                <p className="text-center text-[10px] text-gray-600 mt-8 font-medium">
                  *Harga sewaktu-waktu dapat berubah mengikuti kebijakan maskapai & hotel.
                </p>
              </div>

              {/* Assistance Card */}
              <div className="bg-emerald-50 rounded-3xl p-6 border border-emerald-100 flex items-start gap-4">
                <div className="bg-primary/10 p-2.5 rounded-2xl">
                  <Info className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Butuh Bantuan?</h4>
                  <p className="text-sm text-gray-600 mb-3 leading-relaxed">Tim konsultan kami siap membantu Anda 24/7 untuk perencanaan ibadah Anda.</p>
                  <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noopener noreferrer" className="text-primary font-bold text-sm hover:underline">Hubungi Konsultan Kami →</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div >
  );
};

export default TourDetail;