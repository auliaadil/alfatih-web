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
      <section className="relative py-24 md:py-32 bg-primary overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-[120px]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-full text-xs font-black uppercase tracking-widest mb-6 shadow-xl">
            {t('about_badge')}
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6">{t('about_title')}</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto font-medium leading-relaxed">
            {t('about_desc')}
          </p>
        </div>
      </section>

      {/* Target PIHK 2026 Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-30 mb-24">
        <div className="bg-white rounded-[3rem] p-8 md:p-16 shadow-2xl shadow-primary/10 border border-gray-100">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="absolute -inset-4 bg-secondary/10 rounded-[3rem] -z-10 animate-pulse"></div>
              <div className="bg-secondary/20 p-10 rounded-[2.5rem] flex items-center justify-center">
                <div className="text-center">
                  <BadgeCheck className="w-24 h-24 text-secondary mx-auto mb-6" />
                  <div className="text-5xl font-black text-secondary">2026</div>
                  <div className="text-xs font-black text-secondary/60 uppercase tracking-widest mt-2">{t('pihk_badge')}</div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">{t('pihk_title_1')}<span className="text-secondary">{t('pihk_title_2')}</span></h2>
              <p className="text-gray-600 text-lg leading-relaxed" dangerouslySetInnerHTML={{ __html: t('pihk_desc_1') }} />
              <p className="text-gray-600 leading-relaxed">
                {t('pihk_desc_2')}
              </p>
              <div className="flex items-center gap-4 pt-4">
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
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">{t('vision_mission_title')}</h2>
            <div className="w-24 h-1.5 bg-secondary mx-auto rounded-full"></div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Visi */}
            <div className="bg-white p-12 rounded-[3rem] border border-gray-100 shadow-xl relative overflow-hidden group hover:-translate-y-2 transition-transform duration-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform"></div>
              <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-primary/20">
                <Lightbulb className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-black text-gray-900 mb-6 uppercase tracking-tight">{t('vision_title')}</h3>
              <p className="text-xl text-gray-600 leading-relaxed font-medium">
                {t('vision_desc')}
              </p>
            </div>

            {/* Misi */}
            <div className="bg-primary text-white p-12 rounded-[3rem] shadow-xl relative overflow-hidden group hover:-translate-y-2 transition-transform duration-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform"></div>
              <div className="w-16 h-16 bg-white text-primary rounded-2xl flex items-center justify-center mb-8 shadow-lg">
                <Compass className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-black text-white mb-6 uppercase tracking-tight">{t('mission_title')}</h3>
              <p className="text-xl text-white/90 leading-relaxed font-medium">
                {t('mission_desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Keunggulan Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 uppercase tracking-tight">{t('advantages_title')}</h2>
            <p className="text-gray-500 font-medium">{t('advantages_subtitle')}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            {values.map((val, i) => (
              <div key={i} className="bg-gray-50 p-10 rounded-[2.5rem] border border-gray-100 hover:bg-white hover:shadow-2xl transition-all group">
                <div className="w-20 h-20 bg-white shadow-md rounded-2xl flex items-center justify-center mb-8 group-hover:bg-primary transition-colors">
                  <div className="text-primary group-hover:text-white transition-colors">{val.icon}</div>
                </div>
                <h4 className="text-2xl font-black text-gray-900 mb-4">{val.title}</h4>
                <p className="text-gray-500 leading-relaxed">{val.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Legalitas Summary */}
      <section className="py-24 bg-gray-900 text-white rounded-t-[5rem]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 text-center">
            {stats.map((stat, i) => (
              <div key={i}>
                <div className="text-secondary mb-4 flex justify-center">{stat.icon}</div>
                <div className="text-4xl font-black mb-2">{stat.value}</div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-20 pt-20 border-t border-white/5 text-center">
            <h3 className="text-2xl font-black mb-10">Penyelenggara Perjalanan Ibadah Terpercaya</h3>
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