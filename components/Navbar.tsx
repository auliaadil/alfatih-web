import React, { useState } from 'react';
import { Menu, X, Phone, Globe } from 'lucide-react';
import { useLanguage } from '../src/contexts/LanguageContext';

interface NavbarProps {
  onNavigate: (id: string) => void;
  onHomeClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate, onHomeClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleNav = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    onNavigate(id);
    setIsOpen(false);
  };



  const handleHome = (e: React.MouseEvent) => {
    e.preventDefault();
    onHomeClick();
    setIsOpen(false);
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center gap-3 cursor-pointer group" onClick={handleHome}>
              <img
                src="/assets/alfatih.webp"
                alt="Alfatih Dunia Wisata"
                className="h-12 w-auto object-contain transform group-hover:scale-105 transition-transform"
              />
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <button onClick={handleHome} className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-bold transition-colors">{t('nav_home')}</button>
            <button onClick={(e) => handleNav(e, 'tours')} className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-bold transition-colors">{t('nav_tours')}</button>
            <button onClick={(e) => handleNav(e, 'private-trip')} className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-bold transition-colors">{t('nav_private')}</button>
            <button onClick={(e) => handleNav(e, 'about')} className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-bold transition-colors">{t('nav_about')}</button>
            <button onClick={(e) => handleNav(e, 'contact')} className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-bold transition-colors">{t('nav_contact')}</button>
            <button
              onClick={(e) => handleNav(e, 'contact')}
              className="bg-primary hover:bg-accent text-white px-6 py-2.5 rounded-full font-black transition-all flex items-center gap-2 shadow-lg shadow-primary/20 transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Phone className="w-4 h-4" />
              Book Now
            </button>
            <div className="flex items-center gap-1 border-l pl-6 border-gray-200">
              <Globe className="w-4 h-4 text-gray-400 mr-1" />
              <button
                onClick={() => setLanguage('id')}
                className={`text-xs font-bold px-2 py-1 rounded transition-colors ${language === 'id' ? 'bg-primary text-white' : 'text-gray-500 hover:text-primary'}`}
              >
                ID
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`text-xs font-bold px-2 py-1 rounded transition-colors ${language === 'en' ? 'bg-primary text-white' : 'text-gray-500 hover:text-primary'}`}
              >
                EN
              </button>
            </div>
          </div>

          <div className="flex items-center md:hidden gap-4">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 p-4 shadow-xl">
          <div className="space-y-1">
            <button onClick={handleHome} className="block w-full text-left px-4 py-3 rounded-xl text-base font-bold text-gray-700 hover:text-primary hover:bg-primary/5">{t('nav_home')}</button>
            <button onClick={(e) => handleNav(e, 'tours')} className="block w-full text-left px-4 py-3 rounded-xl text-base font-bold text-gray-700 hover:text-primary hover:bg-primary/5">{t('nav_tours')}</button>
            <button onClick={(e) => handleNav(e, 'about')} className="block w-full text-left px-4 py-3 rounded-xl text-base font-bold text-gray-700 hover:text-primary hover:bg-primary/5">{t('nav_about')}</button>
            <button onClick={(e) => handleNav(e, 'private-trip')} className="block w-full text-left px-4 py-3 rounded-xl text-base font-bold text-gray-700 hover:text-primary hover:bg-primary/5">{t('nav_private')}</button>
            <button onClick={(e) => handleNav(e, 'contact')} className="block w-full text-left px-4 py-3 rounded-xl text-base font-bold text-gray-700 hover:text-primary hover:bg-primary/5">{t('nav_contact')}</button>
            <button
              onClick={(e) => handleNav(e, 'contact')}
              className="w-full mt-4 bg-primary text-white px-5 py-4 rounded-xl font-black flex items-center justify-center gap-2 shadow-lg shadow-primary/20 mb-4"
            >
              <Phone className="w-4 h-4" />
              Book via WhatsApp
            </button>
            <div className="flex items-center justify-center gap-2 pt-4 border-t border-gray-100">
              <Globe className="w-4 h-4 text-gray-400 mr-1" />
              <button
                onClick={() => setLanguage('id')}
                className={`text-xs font-bold px-4 py-2 rounded transition-colors ${language === 'id' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500 hover:text-primary'}`}
              >
                ID
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`text-xs font-bold px-4 py-2 rounded transition-colors ${language === 'en' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500 hover:text-primary'}`}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;