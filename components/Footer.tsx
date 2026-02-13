import React from 'react';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';
import { CONTACT_INFO } from '../constants';

interface FooterProps { }


const Footer: React.FC<FooterProps> = () => {
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
              Mitra terpercaya Anda untuk perjalanan Umrah dan wisata internasional ramah Muslim. Kami membuat perjalanan spiritual dan santai Anda tak terlupakan.
            </p>
            <div className="flex space-x-4 pt-2">
              <a href={CONTACT_INFO.socials.tiktok} target="_blank" rel="noopener noreferrer" className="bg-white/5 p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-white/10 transition-all">
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
              <a href={CONTACT_INFO.socials.instagram} target="_blank" rel="noopener noreferrer" className="bg-white/5 p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-white/10 transition-all"><Instagram className="w-5 h-5" /></a>
              {/* <a href="#" className="bg-white/5 p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-white/10 transition-all"><Twitter className="w-5 h-5" /></a> */}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-6 text-white flex items-center gap-2">
              <span className="w-1.5 h-6 bg-primary rounded-full"></span>
              Quick Links
            </h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><button onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-primary transition-colors font-medium">Home</button></li>
              <li><a href="#tours" className="hover:text-primary transition-colors font-medium">Tour Packages</a></li>
              <li><a href="#private-trip" className="hover:text-primary transition-colors font-medium">Private Trip</a></li>
              <li><a href="#about" className="hover:text-primary transition-colors font-medium">About Us</a></li>
              <li><a href="#" className="hover:text-primary transition-colors font-medium">Blog</a></li>
            </ul>
          </div>

          {/* Packages */}
          <div>
            <h3 className="text-lg font-bold mb-6 text-white flex items-center gap-2">
              <span className="w-1.5 h-6 bg-secondary rounded-full"></span>
              Popular Packages
            </h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><a href="#" className="hover:text-primary transition-colors font-medium">Umrah Premium (9 Days)</a></li>
              <li><a href="#" className="hover:text-primary transition-colors font-medium">Turkey Historical Tour</a></li>
              <li><a href="#" className="hover:text-primary transition-colors font-medium">Japan Halal Trip</a></li>
              <li><a href="#" className="hover:text-primary transition-colors font-medium">West Europe Tour</a></li>
              <li><a href="#" className="hover:text-primary transition-colors font-medium">Badal Umrah</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-6 text-white flex items-center gap-2">
              <span className="w-1.5 h-6 bg-primary rounded-full"></span>
              Contact Us
            </h3>
            <ul className="space-y-4 text-sm text-gray-400">
              <li className="flex items-start gap-3 group">
                <div className="bg-white/5 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                </div>
                <span>{CONTACT_INFO.address}</span>
              </li>
              <li className="flex items-center gap-3 group">
                <div className="bg-white/5 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                </div>
                <span>{CONTACT_INFO.phone}</span>
              </li>
              <li className="flex items-center gap-3 group">
                <div className="bg-white/5 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                </div>
                <span>{CONTACT_INFO.email}</span>
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