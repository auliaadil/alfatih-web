import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, CheckCircle, Star, Calendar } from 'lucide-react';
import { TourPackage } from '../types';
import { useLanguage } from '../src/contexts/LanguageContext';
import { formatDate } from '../src/lib/formatDate';
import { stripMarkdown } from '../src/lib/markdown';


interface TourCardProps {
  tour: TourPackage;
}

const TourCard: React.FC<TourCardProps> = ({ tour }) => {
  const { language, t } = useLanguage();
  const cheapestRoom = tour.room_options?.length > 0
    ? tour.room_options.reduce((min, curr) => curr.price < min.price ? curr : min)
    : null;

  return (
    <Link
      to={`/package/${tour.slug || tour.id}`}
      className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-100 flex flex-col h-full group cursor-pointer block"
    >
      <div className="relative h-48 overflow-hidden bg-gray-100">
        {tour.image_url ? (
          <img
            src={tour.image_url}
            alt={tour.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
        )}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-800 shadow-sm">
          {tour.category}
        </div>
        {tour.is_popular && (
          <div className="absolute top-4 left-4 bg-secondary text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1">
            <Star className="w-3 h-3 fill-white" />
            {t('card_popular')}
          </div>
        )}
      </div>

      <div className="p-4 md:p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-1.5">
          <h3 className="text-base font-bold text-gray-900 leading-tight group-hover:text-primary transition-colors">
            {tour.title}
          </h3>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3 flex-wrap">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(tour.departure_date, language === 'en' ? 'en-GB' : 'id-ID')}</span>
          </div>
          <span className="text-gray-300">·</span>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{tour.duration}</span>
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {stripMarkdown(tour.description)}
        </p>

        <div className="space-y-1.5 mb-4">
          {tour.features.slice(0, 3).map((feature, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span>{feature}</span>
            </div>
          ))}
        </div>

        <div className="mt-auto pt-4 border-t border-gray-100">
          <div>
            <span className="text-xs text-gray-500 uppercase font-semibold">{t('card_start_from')} {cheapestRoom ? `(${cheapestRoom.name})` : ''}</span>
            <div className="flex items-end gap-2">
              <div className="text-xl font-bold text-primary">
                {cheapestRoom ? `Rp ${(cheapestRoom.price / 1000000).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} JT` : 'TBA'}
              </div>
              {cheapestRoom?.original_price && cheapestRoom.original_price > cheapestRoom.price && (
                <div className="text-sm text-gray-400 line-through mb-1">
                  Rp {(cheapestRoom.original_price / 1000000).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} JT
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default TourCard;