export enum TourCategory {
  UMRAH = 'Umrah',
  ASIA = 'Asia',
  EUROPE = 'Europe',
  MIDDLE_EAST = 'Middle East'
}

export interface DayItinerary {
  day: number;
  title: string;
  activities: string[];
}

export interface PriceTiers {
  double: string;
  triple: string;
  quad: string;
}

export interface TourPackage {
  id: string;
  title: string;
  category: TourCategory;
  duration: string;
  priceTiers: PriceTiers; // Pricing for different room types
  image: string;
  rating: number;
  features: string[];
  description: string;
  isPopular?: boolean;

  // Detailed fields
  departureDate: string;
  airplane: {
    airline: string;
    details: string;
  };
  hotels: {
    name: string;
    location: string;
    stars: number;
  }[];
  itinerary: DayItinerary[];
  included: string[];
  notIncluded: string[];
}

export interface AIPlannerInput {
  destination: string;
  days: number;
  travelers: string;
  interests: string[];
}

export interface Testimonial {
  id: number;
  name: string;
  role: string;
  comment: string;
  avatar: string;
}