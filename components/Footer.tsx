import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';
import { supabase } from '../src/lib/supabase';
import { TourPackage } from '../types';
import { useSiteSettings } from '../src/contexts/SiteSettingsContext';
import { useLanguage } from '../src/contexts/LanguageContext';

interface FooterProps { }


const Footer: React.FC<FooterProps> = () => {
  const settings = useSiteSettings();
  const { t } = useLanguage();
  const [popularPackages, setPopularPackages] = useState<TourPackage[]>([]);

  useEffect(() => {
    const fetchPopular = async () => {
      const { data } = await supabase
        .from('packages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (data) {
        setPopularPackages(data as TourPackage[]);
      }
    };

    fetchPopular();
  }, []);

  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">

          {/* Brand */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <img
                src="/assets/alfatih.webp"
                alt="Alfatih Dunia Wisata"
                className="h-12 w-auto object-contain"
              />
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              {t('footer_desc')}
            </p>
            <div className="flex space-x-4 pt-2">
              <a href={settings.tiktok} target="_blank" rel="noopener noreferrer" className="bg-white/5 p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-white/10 transition-all">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5"
                >
                  <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                </svg>
              </a>
              <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="bg-white/5 p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-white/10 transition-all"><Instagram className="w-5 h-5" /></a>
              <a href={settings.facebook} target="_blank" rel="noopener noreferrer" className="bg-white/5 p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-white/10 transition-all"><Facebook className="w-5 h-5" /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-6 text-white flex items-center gap-2">
              <span className="w-1.5 h-6 bg-primary rounded-full"></span>
              {t('footer_quick_links')}
            </h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><button onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-primary transition-colors font-medium">Home</button></li>
              <li><a href="#tours" className="hover:text-primary transition-colors font-medium">Tour Packages</a></li>
              <li><a href="#private-trip" className="hover:text-primary transition-colors font-medium">Private Trip</a></li>
              <li><a href="#about" className="hover:text-primary transition-colors font-medium">About Us</a></li>
            </ul>
          </div>

          {/* Packages */}
          <div>
            <h3 className="text-lg font-bold mb-6 text-white flex items-center gap-2">
              <span className="w-1.5 h-6 bg-secondary rounded-full"></span>
              {t('footer_popular')}
            </h3>
            <ul className="space-y-3 text-sm text-gray-400">
              {popularPackages.length > 0 ? (
                popularPackages.map((pkg) => (
                  <li key={pkg.id}>
                    <Link to={`/package/${pkg.slug || pkg.id}`} onClick={() => window.scrollTo(0, 0)} className="hover:text-primary transition-colors font-medium">
                      {pkg.title}
                    </Link>
                  </li>
                ))
              ) : (
                <li className="text-gray-500 italic">No packages available.</li>
              )}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-6 text-white flex items-center gap-2">
              <span className="w-1.5 h-6 bg-primary rounded-full"></span>
              {t('footer_contact')}
            </h3>
            <ul className="space-y-4 text-sm text-gray-400">
              <li className="flex items-start gap-3 group">
                <div className="bg-white/5 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                </div>
                <span>{settings.address}</span>
              </li>
              <li className="flex items-center gap-3 group">
                <div className="bg-white/5 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                </div>
                <span>{settings.phone}</span>
              </li>
              <li className="flex items-center gap-3 group">
                <div className="bg-white/5 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                </div>
                <span>{settings.email}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <p className="font-medium">&copy; {new Date().getFullYear()} Alfatih Dunia Wisata. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;