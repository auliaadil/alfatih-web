import React from 'react';
import { Plane, Calendar, MapPin, Building2, CheckCircle2 } from 'lucide-react';
import { LayoutOptions } from '../../../../types/poster';

// Simple inline date formatter for the poster details
const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

interface PosterDetailsProps {
    packageData?: any; // any for now to avoid tight coupling
    options: LayoutOptions;
}

const PosterDetails: React.FC<PosterDetailsProps> = ({ packageData, options }) => {
    if (!packageData) return null;

    const textColorClass = options.theme === 'dark' ? 'text-white' : 'text-gray-900';
    const iconColorClass = options.theme === 'dark' ? 'text-white/70' : 'text-primary';
    const subtleTextColorClass = options.theme === 'dark' ? 'text-white/80' : 'text-gray-600';

    return (
        <div className={`space-y-4 w-full relative z-10 ${textColorClass}`}>

            {/* Price section - extremely prominent in "Tour Promotion" */}
            {options.showPrice && packageData.room_options && packageData.room_options.length > 0 && (
                <div className="mb-6">
                    <p className={`text-xs uppercase tracking-wider font-bold mb-1 ${subtleTextColorClass}`}>Mulai Dari</p>
                    <div className="flex items-end gap-2">
                        <span className="text-4xl font-bold leading-none tracking-tight">Rp {packageData.room_options[0].price.toLocaleString('id-ID')}</span>
                        <span className={`text-sm font-medium pb-1 ${subtleTextColorClass}`}>/{packageData.room_options[0].name}</span>
                    </div>
                </div>
            )}

            {/* Grid for details */}
            <div className="grid grid-cols-2 gap-y-3 gap-x-6">

                {options.showDates && packageData.departure_date && (
                    <div className="flex items-center gap-2">
                        <Calendar className={`w-4 h-4 ${iconColorClass}`} />
                        <span className="text-sm font-medium">{formatDate(packageData.departure_date)}</span>
                    </div>
                )}

                {options.showDates && packageData.duration && (
                    <div className="flex items-center gap-2">
                        <MapPin className={`w-4 h-4 ${iconColorClass}`} />
                        <span className="text-sm font-medium">{packageData.duration}</span>
                    </div>
                )}

                {options.showHotelAndFlight && packageData.flight_details && (
                    <div className="flex items-center gap-2">
                        <Plane className={`w-4 h-4 ${iconColorClass}`} />
                        <span className="text-sm font-medium line-clamp-1">{packageData.flight_details}</span>
                    </div>
                )}

                {/* Example placeholder for hotels if we don't have full hotel resolution yet */}
                {options.showHotelAndFlight && packageData.hotel_ids && packageData.hotel_ids.length > 0 && (
                    <div className="flex items-center gap-2">
                        <Building2 className={`w-4 h-4 ${iconColorClass}`} />
                        <span className="text-sm font-medium">Top Hotels</span>
                    </div>
                )}
            </div>

            {/* Key Features */}
            {options.showFeatures && packageData.features && packageData.features.length > 0 && (
                <div className="mt-6">
                    <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${subtleTextColorClass}`}>Keunggulan Paket</p>
                    <ul className="space-y-2">
                        {packageData.features.slice(0, 4).map((feature: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 text-sm leading-tight font-medium">
                                <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${iconColorClass}`} />
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default PosterDetails;
