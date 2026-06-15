export enum TourCategory {
  UMRAH = 'Umrah',
  ASIA = 'Asia',
  EUROPE = 'Europe',
  MIDDLE_EAST = 'Middle East'
}

export interface Airport {
  id: string;
  iata_code: string;
  name: string;
  city: string;
  country_id: string;
  countries?: { name: string };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface FlightLeg {
  id?: string;
  from_airport_id: string;
  to_airport_id: string;
}

export interface FlightRoute {
  airline_id: string;
  legs: FlightLeg[];
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
  hotel_id?: string;
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
  image_credit?: string;
  features: string[];
  description: string;
  is_popular?: boolean;
  quotas?: number;
  initial_quotas?: number;

  // Dates
  departure_date: string;
  arrival_date?: string;

  // Flight routes (structured)
  flight_routes?: FlightRoute[];

  // Resolved relations (from joins)
  airlines?: {
    name: string;
    logo_url?: string;
  }[];
  hotels?: {
    name: string;
    location: string;
    stars: number;
    maps_url?: string | null;
  }[];
  itinerary?: DayItinerary[];
  included?: string[];
  not_included?: string[];
  brochure_url?: string;
  gallery?: string[];
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
