export interface Watchlist {
  id: string;
  origin: string;
  destination: string;
  date_range_start: string;
  date_range_end: string;
  target_price_max: number;
  adults: number;
  is_active: boolean;
  created_by: string | null;
  last_checked_at: string | null;
  created_at: string;
}

export interface DealAlert {
  id: string;
  watchlist_id: string;
  price: number;
  departure_date: string;
  airline: string;
  flight_details: Record<string, unknown>;
  is_notified: boolean;
  created_at: string;
  watchlist?: Pick<Watchlist, 'origin' | 'destination' | 'target_price_max'>;
}

export interface WatchlistFormData {
  origin: string;
  destination: string;
  date_range_start: string;
  date_range_end: string;
  target_price_max: string;
  adults: string;
}

export const EMPTY_WATCHLIST_FORM: WatchlistFormData = {
  origin: '',
  destination: '',
  date_range_start: '',
  date_range_end: '',
  target_price_max: '',
  adults: '1',
};
