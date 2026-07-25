import React, { useEffect, useState } from 'react';
import { SlideOver, StatusBadge } from './ui';
import { Loader2 } from 'lucide-react';
import type { OrderAttachment } from '@/types';
import { orderAttachmentService } from '../../services/orderAttachmentService';

interface Props {
  order: any;
  onClose: () => void;
}

const Field: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{label}</p>
    <p className="text-sm font-medium text-gray-900 mt-0.5">{value || '—'}</p>
  </div>
);

const OrderView: React.FC<Props> = ({ order, onClose }) => {
  const [attachments, setAttachments] = useState<OrderAttachment[]>([]);
  const [loadingAtts, setLoadingAtts] = useState(true);

  useEffect(() => {
    orderAttachmentService.getAttachments(order.id)
      .then(setAttachments)
      .catch(() => {})
      .finally(() => setLoadingAtts(false));
  }, [order.id]);

  return (
    <SlideOver isOpen onClose={onClose} title="Detail Order" subtitle={order.packages?.title || ''}>
      <div className="space-y-6">
        {/* Customer */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
          <Field label="Nama Customer" value={order.customer_name} />
          <Field label="WhatsApp / Telepon" value={order.customer_phone} />
          <Field label="Email" value={order.customer_email} />
          <Field label="Branch" value={order.branches?.name} />
        </div>

        {/* Payment */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Status Pembayaran</p>
            <div className="mt-1"><StatusBadge status={order.payment_status || 'Unknown'} /></div>
          </div>
          <Field label="Total Harga" value={order.total_price ? `Rp ${(order.total_price as number).toLocaleString('id-ID')}` : undefined} />
          {order.amount_paid > 0 && (
            <Field label="Sudah Dibayar" value={`Rp ${(order.amount_paid as number).toLocaleString('id-ID')}`} />
          )}
          <Field label="Pax" value={`${order.participant_count} orang`} />
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Catatan</p>
            <p className="text-sm text-gray-700 whitespace-pre-line">{order.notes}</p>
          </div>
        )}

        {/* Participants */}
        {order.participants?.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">Peserta</p>
            <ul className="space-y-2">
              {order.participants.map((p: any, i: number) => (
                <li key={p.id ?? i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm">
                  <span className="font-medium text-gray-900">{p.name}</span>
                  <span className="text-gray-500 text-xs">{p.room_type} · {p.gender === 'male' ? 'L' : p.gender === 'female' ? 'P' : '—'}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Attachments */}
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">Bukti Pembayaran</p>
          {loadingAtts ? (
            <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
          ) : attachments.length === 0 ? (
            <p className="text-sm text-gray-400 italic">Belum ada bukti pembayaran.</p>
          ) : (
            <ul className="space-y-2">
              {attachments.map(att => (
                <li key={att.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm text-gray-700 truncate">{att.file_name}</span>
                  </div>
                  {att.file_type?.startsWith('image/') ? (
                    <a href={att.file_url} target="_blank" rel="noreferrer">
                      <img src={att.file_url} alt={att.file_name} className="h-12 w-20 object-cover rounded-md border border-gray-200" />
                    </a>
                  ) : (
                    <a href={att.file_url} target="_blank" rel="noreferrer"
                      className="text-xs text-blue-600 hover:underline font-medium">Buka</a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </SlideOver>
  );
};

export default OrderView;
