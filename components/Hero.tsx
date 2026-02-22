import React from 'react';
import { ArrowRight, Star } from 'lucide-react';
import { useLanguage } from '../src/contexts/LanguageContext';

const Hero: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="relative bg-dark overflow-hidden">
      {/* Background Image with Pattern */}
      <div className="absolute inset-0">
        <img
          className="w-full h-full object-cover opacity-30"
          src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1920"
          alt="Al Fatih Dunia Wisata - Premium Travel"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/60 to-transparent"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 lg:py-48">
        <div className="lg:w-2/3">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-secondary/10 border border-secondary/30 backdrop-blur-md mb-8">
            <Star className="w-4 h-4 text-secondary mr-2 fill-secondary" />
            <span className="text-secondary font-black text-xs uppercase tracking-widest">Amanah & Profesional Sejak 2012</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tight leading-[1] mb-8">
            <span className="text-primary">AlFatih</span><br />
            {t('hero_title')}
          </h1>

          <p className="mt-4 text-xl text-gray-400 max-w-2xl mb-12 leading-relaxed font-medium">
            {t('hero_subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-6">
            <a
              href="#tours"
              className="px-12 py-5 bg-primary hover:bg-accent text-white font-black rounded-2xl transition-all shadow-2xl shadow-primary/20 flex items-center justify-center gap-3 transform hover:-translate-y-1"
            >
              {t('hero_cta')}
              <ArrowRight className="w-5 h-5" />
            </a>
            <a
              href="#private-trip"
              className="px-12 py-5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-black rounded-2xl transition-all flex items-center justify-center transform hover:-translate-y-1"
            >
              {t('hero_secondary')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;