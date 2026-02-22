export enum TourCategory {
  UMRAH = 'Umrah',
  ASIA = 'Asia',
  EUROPE = 'Europe',
  MIDDLE_EAST = 'Middle East'
}

export interface DayItinerary {
  day: number;
  title: string;
  activities?: string[];
  description?: string;
  location?: string;
  meals?: string[];
}

export interface RoomOption {
  name: string;
  capacity: number;
  price: number;
  original_price?: number;
}

export interface TourPackage {
  id: string;
  slug?: string;
  title: string;
  category: TourCategory | string;
  duration: string;
  room_options: RoomOption[];
  image_url: string;
  brochure_url?: string;
  features: string[];
  description: string;
  is_popular?: boolean;
  quotas?: number;
  initial_quotas?: number;
  available_rooms?: number;
  initial_rooms?: number;

  // Detailed fields
  departure_date: string;
  flight_details?: string;
  airlines?: {
    name: string;
    logo_url?: string;
  }[];
  hotels?: {
    name: string;
    location: string;
    stars: number;
  }[];
  itinerary?: DayItinerary[];
  included?: string[];
  not_included?: string[];
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