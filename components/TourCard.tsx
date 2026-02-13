import React from 'react';
import { Clock, Star, CheckCircle } from 'lucide-react';
import { TourPackage } from '../types';

interface TourCardProps {
  tour: TourPackage;
  onViewDetails: (id: string) => void;
}

const TourCard: React.FC<TourCardProps> = ({ tour, onViewDetails }) => {
  return (
    <div
      onClick={() => onViewDetails(tour.id)}
      className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-100 flex flex-col h-full group cursor-pointer"
    >
      <div className="relative h-56 overflow-hidden">
        <img
          src={tour.image}
          alt={tour.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-800 shadow-sm">
          {tour.category}
        </div>
        {tour.isPopular && (
          <div className="absolute top-4 left-4 bg-secondary text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1">
            <Star className="w-3 h-3 fill-white" />
            Popular
          </div>
        )}
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-gray-900 leading-tight group-hover:text-primary transition-colors">
            {tour.title}
          </h3>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{tour.duration}</span>
          </div>
          <div className="flex items-center gap-1 text-yellow-500">
            <Star className="w-4 h-4 fill-yellow-500" />
            <span className="font-medium text-gray-700">{tour.rating}</span>
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {tour.description}
        </p>

        <div className="space-y-2 mb-6">
          {tour.features.slice(0, 3).map((feature, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
              <span>{feature}</span>
            </div>
          ))}
        </div>

        <div className="mt-auto pt-4 border-t border-gray-100">
          <div>
            <span className="text-xs text-gray-500 uppercase font-semibold">Start from (Quad)</span>
            <div className="text-xl font-bold text-primary">{tour.priceTiers.quad}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TourCard;