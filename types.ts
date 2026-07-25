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
  departure_date_hijri?: string;
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

export interface Documentation {
  id: string;
  title: string;
  category_id: string;
  package_id: string | null;
  departure_date: string | null;
  arrival_date: string | null;
  description: string | null;
  cover_photo_url: string | null;
  published: boolean;
  created_at: string;
  // joined
  categories?: { id: string; name: string };
  packages?: { id: string; title: string } | null;
  documentation_photos?: { count: number }[];
}

export interface DocumentationPhoto {
  id: string;
  documentation_id: string;
  storage_url: string;
  sort_order: number;
  created_at: string;
}

export type AgentType = 'Person' | 'OTA' | 'Direct';
export type BookingStatus = 'Planned' | 'Quoted' | 'Booked' | 'Paid' | 'Cancelled';
export type Currency = 'IDR' | 'USD';

export interface Agent {
  id: string;
  name: string;
  company?: string;
  contact_info?: string;
  agent_type: AgentType;
  created_at: string;
}

export interface HotelBooking {
  id: string;
  hotel_id: string;
  agent_id?: string;
  check_in_date?: string;
  check_out_date?: string;
  rooms: { room_type: string; paxes: number }[];
  price?: number;
  currency: Currency;
  status: BookingStatus;
  created_at: string;
  // joined
  hotels?: { name: string; location: string };
  agents?: { name: string; company?: string };
}

export interface FlightBooking {
  id: string;
  airline_id: string;
  agent_id?: string;
  departure_date?: string;
  return_date?: string;
  flight_route?: string;
  paxes?: number;
  price?: number;
  currency: Currency;
  status: BookingStatus;
  created_at: string;
  // joined
  airlines?: { name: string; logo_url?: string };
  agents?: { name: string; company?: string };
}

export interface BookingAttachment {
  id: string;
  hotel_booking_id?: string;
  flight_booking_id?: string;
  file_url: string;
  file_name: string;
  created_at: string;
}
