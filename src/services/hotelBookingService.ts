import { supabase } from '@/src/lib/supabase';
import type { HotelBooking } from '@/types';
import { bookingAttachmentService } from './bookingAttachmentService';

export const hotelBookingService = {
  async getHotelBookings() {
    const { data, error } = await supabase
      .from('hotel_bookings')
      .select(`
        *,
        hotels(name, location),
        agents(name, company)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as HotelBooking[];
  },

  async createHotelBooking(booking: Omit<HotelBooking, 'id' | 'created_at' | 'hotels' | 'agents'>) {
    const { data, error } = await supabase
      .from('hotel_bookings')
      .insert([booking])
      .select(`
        *,
        hotels(name, location),
        agents(name, company)
      `)
      .single();

    if (error) throw error;
    return data as HotelBooking;
  },

  async updateHotelBooking(id: string, booking: Partial<Omit<HotelBooking, 'id' | 'created_at' | 'hotels' | 'agents'>>) {
    const { data, error } = await supabase
      .from('hotel_bookings')
      .update(booking)
      .eq('id', id)
      .select(`
        *,
        hotels(name, location),
        agents(name, company)
      `)
      .single();

    if (error) throw error;
    return data as HotelBooking;
  },

  async deleteHotelBooking(id: string) {
    // Fetch and delete attachments from storage before deleting the row
    await bookingAttachmentService.deleteAllForBooking(id, 'hotel');
    
    const { error } = await supabase
      .from('hotel_bookings')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
