import { supabase } from '@/src/lib/supabase';
import type { FlightBooking } from '@/types';
import { bookingAttachmentService } from './bookingAttachmentService';

export const flightBookingService = {
  async getFlightBookings() {
    const { data, error } = await supabase
      .from('flight_bookings')
      .select(`
        *,
        airlines(name, logo_url),
        agents(name, company)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as FlightBooking[];
  },

  async createFlightBooking(booking: Omit<FlightBooking, 'id' | 'created_at' | 'airlines' | 'agents'>) {
    const { data, error } = await supabase
      .from('flight_bookings')
      .insert([booking])
      .select(`
        *,
        airlines(name, logo_url),
        agents(name, company)
      `)
      .single();

    if (error) throw error;
    return data as FlightBooking;
  },

  async updateFlightBooking(id: string, booking: Partial<Omit<FlightBooking, 'id' | 'created_at' | 'airlines' | 'agents'>>) {
    const { data, error } = await supabase
      .from('flight_bookings')
      .update(booking)
      .eq('id', id)
      .select(`
        *,
        airlines(name, logo_url),
        agents(name, company)
      `)
      .single();

    if (error) throw error;
    return data as FlightBooking;
  },

  async deleteFlightBooking(id: string) {
    // Fetch and delete attachments from storage before deleting the row
    await bookingAttachmentService.deleteAllForBooking(id, 'flight');
    
    const { error } = await supabase
      .from('flight_bookings')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
