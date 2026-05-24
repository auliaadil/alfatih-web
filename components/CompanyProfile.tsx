import React from 'react';
import {
  Award,
  ShieldCheck,
  Users,
  Target,
  Heart,
  Star,
  MapPin,
  CheckCircle,

  FileText,
  BadgeCheck,
  TrendingUp,
  Lightbulb,
  Compass,
  ArrowRight
} from 'lucide-react';
import { useLanguage } from '../src/contexts/LanguageContext';

const CompanyProfile: React.FC = () => {
  const { t } = useLanguage();
  const stats = [
    { label: 'Jamaah Terlayani', value: '10.000+', icon: <Users className="w-6 h-6" /> },
    { label: 'Tahun Pengalaman', value: '12+', icon: <Award className="w-6 h-6" /> },
    { label: 'Tingkat Kepuasan', value: '99%', icon: <Star className="w-6 h-6" /> },
    { label: 'Mitra Hotel', value: '50+', icon: <MapPin className="w-6 h-6" /> },
  ];

  const values = [
    {
      title: 'Amanah',
      desc: 'Menjaga kepercayaan jamaah dengan pelayanan jujur dan transparan sesuai nilai-nilai Islam.',
      icon: <ShieldCheck className="w-8 h-8" />
    },
    {
      title: 'Profesional',
      desc: 'Memberikan layanan berkualitas tinggi melalui tim ahli yang berpengalaman di bidangnya.',
      icon: <Target className="w-8 h-8" />
    },
    {
      title: 'Halal Berkelas',
      desc: 'Menghadirkan pengalaman spiritual dan edukatif berkelas dunia untuk semua kalangan.',
      icon: <TrendingUp className="w-8 h-8" />
    }
  ];

  return (
    <div className="bg-white">

      {/* Hero Header */}
      <section className="relative py-10 md:py-14 bg-primary overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-[120px]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-full text-xs font-black uppercase tracking-widest mb-6 shadow-xl">
            {t('about_badge')}
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-4 font-display">{t('about_title')}</h1>
          <p className="text-base text-white/90 max-w-2xl mx-auto font-medium leading-relaxed">
            {t('about_desc')}
          </p>
        </div>
      </section>

      {/* Target PIHK 2026 Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-30 mb-10">
        <div className="bg-white rounded-3xl p-6 md:p-10 shadow-2xl shadow-primary/10 border border-gray-100">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="relative">
              <div className="absolute -inset-4 bg-secondary/10 rounded-3xl -z-10 animate-pulse"></div>
              <div className="bg-secondary/20 p-7 rounded-2xl flex items-center justify-center">
                <div className="text-center">
                  <BadgeCheck className="w-16 h-16 text-secondary mx-auto mb-3" />
                  <div className="text-4xl font-black text-secondary">2026</div>
                  <div className="text-xs font-black text-secondary/60 uppercase tracking-widest mt-1">{t('pihk_badge')}</div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight font-display">{t('pihk_title_1')}<span className="text-secondary">{t('pihk_title_2')}</span></h2>
              <p className="text-gray-600 leading-relaxed text-sm" dangerouslySetInnerHTML={{ __html: t('pihk_desc_1') }} />
              <p className="text-gray-600 leading-relaxed text-sm">
                {t('pihk_desc_2')}
              </p>
              <div className="flex items-center gap-4 pt-2">
                <div className="bg-gray-50 px-6 py-4 rounded-2xl border border-gray-100">
                  <div className="text-primary font-black text-2xl">PPIU</div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t('pihk_current')}</div>
                </div>
                <ArrowRight className="w-6 h-6 text-gray-300" />
                <div className="bg-primary px-6 py-4 rounded-2xl shadow-lg shadow-primary/20">
                  <div className="text-white font-black text-2xl">PIHK</div>
                  <div className="text-[10px] text-white/60 font-bold uppercase tracking-widest">{t('pihk_target')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Official Vision & Mission */}
      <section className="py-10 md:py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-3 font-display">{t('vision_mission_title')}</h2>
            <div className="w-16 h-1 bg-secondary mx-auto rounded-full"></div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Visi */}
            <div className="bg-white p-7 md:p-8 rounded-2xl border border-gray-100 shadow-lg relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform"></div>
              <div className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center mb-5 shadow-lg shadow-primary/20">
                <Lightbulb className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-3 uppercase tracking-tight font-display">{t('vision_title')}</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                {t('vision_desc')}
              </p>
            </div>

            {/* Misi */}
            <div className="bg-primary text-white p-7 md:p-8 rounded-2xl shadow-lg relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform"></div>
              <div className="w-12 h-12 bg-white text-primary rounded-xl flex items-center justify-center mb-5 shadow-lg">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-white mb-3 uppercase tracking-tight font-display">{t('mission_title')}</h3>
              <p className="text-white/90 leading-relaxed text-sm">
                {t('mission_desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Keunggulan Section */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-2 uppercase tracking-tight font-display">{t('advantages_title')}</h2>
            <p className="text-gray-500 text-sm">{t('advantages_subtitle')}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {values.map((val, i) => (
              <div key={i} className="bg-gray-50 p-6 md:p-7 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-xl transition-all group">
                <div className="w-14 h-14 bg-white shadow-md rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
                  <div className="text-primary group-hover:text-white transition-colors">{val.icon}</div>
                </div>
                <h4 className="text-lg font-black text-gray-900 mb-2 font-display">{val.title}</h4>
                <p className="text-gray-500 leading-relaxed text-sm">{val.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Legalitas Summary */}
      <section className="py-10 bg-gray-900 text-white rounded-t-3xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 text-center">
            {stats.map((stat, i) => (
              <div key={i}>
                <div className="text-secondary mb-3 flex justify-center">{stat.icon}</div>
                <div className="text-3xl font-black mb-1">{stat.value}</div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-10 pt-10 border-t border-white/5 text-center">
            <h3 className="text-lg font-black mb-7 font-display">Penyelenggara Perjalanan Ibadah Terpercaya</h3>
            <div className="flex flex-wrap justify-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
              {/* Placeholders for partner logos */}
              <div className="h-12 w-32 bg-white/10 rounded flex items-center justify-center font-bold">KEMENAG</div>
              <div className="h-12 w-32 bg-white/10 rounded flex items-center justify-center font-bold">HIMPUH</div>
              <div className="h-12 w-32 bg-white/10 rounded flex items-center justify-center font-bold">KAN</div>
              <div className="h-12 w-32 bg-white/10 rounded flex items-center justify-center font-bold">IATA</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CompanyProfile;