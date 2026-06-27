import React from 'react';
import { ArrowRight, Star } from 'lucide-react';
import { useLanguage } from '../src/contexts/LanguageContext';

const Hero: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="relative bg-dark overflow-hidden">
      <div className="absolute inset-0">
        <img
          className="w-full h-full object-cover opacity-20"
          src="/assets/kaaba-hero.jpg"
          alt="Al Fatih Dunia Wisata - Premium Travel"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-dark via-dark/90 to-dark/50"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10 items-center">
          {/* Left: Content */}
          <div>
            <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-secondary/10 border border-secondary/30 backdrop-blur-md mb-5">
              <Star className="w-3.5 h-3.5 text-secondary mr-2 fill-secondary" />
              <span className="text-secondary font-black text-xs uppercase tracking-widest">Amanah & Profesional Sejak 2012</span>
            </div>

            <p className="font-sans font-semibold text-[0.65rem] text-primary tracking-[0.25em] uppercase mb-3">
              Alfatih Dunia Wisata
            </p>
            <h1 className="font-sans font-black text-4xl md:text-5xl lg:text-[3.25rem] text-white leading-[1.05] mb-5 -ml-[0.05em]">
              {t('hero_title')}
            </h1>

            <p className="text-base text-gray-400 max-w-lg mb-8 leading-relaxed">
              {t('hero_subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="#tours"
                className="px-8 py-3.5 bg-primary hover:bg-accent text-white font-black rounded-xl transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2.5 transform hover:-translate-y-0.5"
              >
                {t('hero_cta')}
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#private-trip"
                className="px-8 py-3.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-black rounded-xl transition-all flex items-center justify-center transform hover:-translate-y-0.5"
              >
                {t('hero_secondary')}
              </a>
            </div>
          </div>

          {/* Right: Image card with stats (desktop only) */}
          <div className="hidden lg:block">
            <div className="relative h-[360px] rounded-2xl overflow-hidden border border-white/10">
              <img
                src="/assets/kaaba-hero.jpg"
                alt="AlFatih Travel"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-dark/20 to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4 grid grid-cols-3 gap-2">
                {[
                  { value: '10K+', label: 'Jamaah' },
                  { value: '12+', label: 'Tahun' },
                  { value: '99%', label: 'Kepuasan' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white/10 backdrop-blur-md rounded-xl px-3 py-2.5 border border-white/10 text-center">
                    <div className="text-xl font-black text-white">{stat.value}</div>
                    <div className="text-xs text-gray-300">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
