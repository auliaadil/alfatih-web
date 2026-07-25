import React, { useState, useEffect } from 'react';
import { Paperclip, Loader2, X, FileText, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { useToast, btnSecondary } from './ui';
import type { OrderAttachment } from '@/types';
import { orderAttachmentService } from '../../services/orderAttachmentService';

interface Props {
  orderId: string | null; // null when creating new order (pre-save)
}

const OrderAttachmentUploader: React.FC<Props> = ({ orderId }) => {
  const toast = useToast();
  const [attachments, setAttachments] = useState<OrderAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    orderAttachmentService.getAttachments(orderId)
      .then(setAttachments)
      .catch(() => toast('error', 'Gagal memuat lampiran.'))
      .finally(() => setLoading(false));
  }, [orderId]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !orderId) return;
    try {
      setUploading(true);
      const att = await orderAttachmentService.uploadAttachment(file, orderId);
      setAttachments(prev => [att, ...prev]);
      toast('success', 'Bukti pembayaran diunggah.');
    } catch (err: any) {
      toast('error', err.message || 'Upload gagal.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (att: OrderAttachment) => {
    try {
      await orderAttachmentService.deleteAttachment(att);
      setAttachments(prev => prev.filter(a => a.id !== att.id));
      toast('success', 'Lampiran dihapus.');
    } catch {
      toast('error', 'Gagal menghapus lampiran.');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-gray-400">Bukti Pembayaran</p>
        <label className={`${btnSecondary} cursor-pointer text-xs py-1.5 ${!orderId ? 'opacity-50 pointer-events-none' : ''}`}>
          {uploading ? <><Loader2 className="w-3 h-3 animate-spin mr-1" />Uploading…</> : 'Upload File'}
          <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} disabled={uploading || !orderId} />
        </label>
      </div>
      {!orderId && (
        <p className="text-xs text-gray-400 italic">Simpan order terlebih dahulu sebelum mengunggah bukti pembayaran.</p>
      )}
      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
      ) : attachments.length === 0 ? (
        <div className="text-center py-5 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          <Paperclip className="w-5 h-5 text-gray-300 mx-auto mb-1" />
          <p className="text-xs text-gray-400">Belum ada lampiran.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {attachments.map(att => (
            <li key={att.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 group">
              <div className="flex items-center gap-2 min-w-0">
                {att.file_type?.startsWith('image/') ? <ImageIcon className="w-4 h-4 text-blue-400 flex-shrink-0" /> : <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                <span className="text-sm text-gray-700 truncate">{att.file_name}</span>
              </div>
              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <a href={att.file_url} target="_blank" rel="noreferrer" className="p-1.5 text-gray-400 hover:text-primary bg-white rounded-md shadow-sm" title="Buka">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button type="button" onClick={() => handleDelete(att)} className="p-1.5 text-gray-400 hover:text-red-500 bg-white rounded-md shadow-sm" title="Hapus">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default OrderAttachmentUploader;
