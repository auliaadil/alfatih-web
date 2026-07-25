import { supabase } from '@/src/lib/supabase';
import type { OrderAttachment } from '@/types';

export const orderAttachmentService = {
  async getAttachments(orderId: string): Promise<OrderAttachment[]> {
    const { data, error } = await supabase
      .from('order_attachments')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as OrderAttachment[];
  },

  async uploadAttachment(file: File, orderId: string): Promise<OrderAttachment> {
    if (file.size > 5 * 1024 * 1024) throw new Error('File terlalu besar. Maksimum 5 MB.');
    const ext = file.name.split('.').pop() ?? 'bin';
    const path = `${orderId}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('order-attachments')
      .upload(path, file);
    if (uploadError) throw uploadError;
    const { data: { publicUrl } } = supabase.storage.from('order-attachments').getPublicUrl(path);
    const { data, error: dbError } = await supabase
      .from('order_attachments')
      .insert([{ order_id: orderId, file_url: publicUrl, file_name: file.name, file_type: file.type }])
      .select()
      .single();
    if (dbError) throw dbError;
    return data as OrderAttachment;
  },

  async deleteAttachment(attachment: OrderAttachment): Promise<void> {
    const urlParts = attachment.file_url.split('/order-attachments/');
    if (urlParts.length > 1) {
      await supabase.storage.from('order-attachments').remove([urlParts[1]]);
    }
    const { error } = await supabase.from('order_attachments').delete().eq('id', attachment.id);
    if (error) throw error;
  },
};
