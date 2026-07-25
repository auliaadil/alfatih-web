import { supabase } from '@/src/lib/supabase';
import type { BookingAttachment } from '@/types';

export const bookingAttachmentService = {
  async getAttachments(
    bookingId: string, 
    type: 'hotel' | 'flight'
  ): Promise<BookingAttachment[]> {
    const column = type === 'hotel' ? 'hotel_booking_id' : 'flight_booking_id';
    const { data, error } = await supabase
      .from('booking_attachments')
      .select('*')
      .eq(column, bookingId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as BookingAttachment[];
  },

  async uploadAttachment(
    file: File, 
    bookingId: string, 
    type: 'hotel' | 'flight'
  ): Promise<BookingAttachment> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    // Store in folder based on type and bookingId
    const filePath = `${type}/${bookingId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('booking-receipts')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('booking-receipts')
      .getPublicUrl(filePath);

    const attachment = {
      hotel_booking_id: type === 'hotel' ? bookingId : undefined,
      flight_booking_id: type === 'flight' ? bookingId : undefined,
      file_name: file.name,
      file_url: publicUrl,
      file_type: file.type,
    };

    const { data, error: dbError } = await supabase
      .from('booking_attachments')
      .insert([attachment])
      .select()
      .single();

    if (dbError) throw dbError;
    return data as BookingAttachment;
  },

  async deleteAttachment(attachment: BookingAttachment) {
    // 1. Delete from storage
    // file_url looks like: https://[project].supabase.co/storage/v1/object/public/booking-receipts/[type]/[bookingId]/[fileName]
    // We need the path after 'booking-receipts/'
    const urlParts = attachment.file_url.split('/booking-receipts/');
    if (urlParts.length > 1) {
      const filePath = urlParts[1];
      const { error: storageError } = await supabase.storage
        .from('booking-receipts')
        .remove([filePath]);
      
      if (storageError) {
        console.error('Failed to delete from storage:', storageError);
        // Continue to delete from DB even if storage fails (it might have been deleted already)
      }
    }

    // 2. Delete from database
    const { error: dbError } = await supabase
      .from('booking_attachments')
      .delete()
      .eq('id', attachment.id);

    if (dbError) throw dbError;
  },
  
  async deleteAllForBooking(bookingId: string, type: 'hotel' | 'flight') {
    const attachments = await this.getAttachments(bookingId, type);
    
    // Delete files from storage
    const filePaths = attachments.map(a => {
       const parts = a.file_url.split('/booking-receipts/');
       return parts.length > 1 ? parts[1] : null;
    }).filter(Boolean) as string[];

    if (filePaths.length > 0) {
      await supabase.storage.from('booking-receipts').remove(filePaths);
    }
    
    // Deleting the booking handles DB row deletion due to CASCADE
  }
};
