import React, { useState, useEffect } from 'react';
import { Paperclip, Loader2, X, FileText, Image as ImageIcon, Download } from 'lucide-react';
import { useToast, btnSecondary } from './ui';
import type { BookingAttachment } from '@/types';
import { bookingAttachmentService } from '@/src/services/bookingAttachmentService';

interface BookingAttachmentListProps {
    bookingId: string;
    type: 'hotel' | 'flight';
}

export const BookingAttachmentList: React.FC<BookingAttachmentListProps> = ({ bookingId, type }) => {
    const toast = useToast();
    const [attachments, setAttachments] = useState<BookingAttachment[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        loadAttachments();
    }, [bookingId]);

    const loadAttachments = async () => {
        try {
            setLoading(true);
            const data = await bookingAttachmentService.getAttachments(bookingId, type);
            setAttachments(data);
        } catch (err: any) {
            console.error('Failed to load attachments:', err);
            toast('error', 'Failed to load attachments');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast('error', 'File size must be less than 5MB');
            return;
        }

        try {
            setUploading(true);
            const newAttachment = await bookingAttachmentService.uploadAttachment(file, bookingId, type);
            setAttachments(prev => [newAttachment, ...prev]);
            toast('success', 'Attachment uploaded');
        } catch (err: any) {
            console.error('Failed to upload attachment:', err);
            toast('error', err.message || 'Failed to upload attachment');
        } finally {
            setUploading(false);
            e.target.value = ''; // Reset input
        }
    };

    const handleDelete = async (attachment: BookingAttachment) => {
        if (!confirm('Are you sure you want to delete this attachment?')) return;
        
        try {
            await bookingAttachmentService.deleteAttachment(attachment);
            setAttachments(prev => prev.filter(a => a.id !== attachment.id));
            toast('success', 'Attachment deleted');
        } catch (err: any) {
            console.error('Failed to delete attachment:', err);
            toast('error', 'Failed to delete attachment');
        }
    };

    const getFileIcon = (fileType?: string) => {
        if (fileType?.startsWith('image/')) return <ImageIcon className="w-4 h-4 text-blue-500" />;
        return <FileText className="w-4 h-4 text-gray-500" />;
    };

    if (loading) {
        return <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    Receipts & Attachments
                </h4>
                
                <label className={`${btnSecondary} cursor-pointer text-xs py-1.5`}>
                    {uploading ? (
                        <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Uploading...</>
                    ) : (
                        'Upload File'
                    )}
                    <input 
                        type="file" 
                        className="hidden" 
                        accept=".pdf,.jpg,.jpeg,.png" 
                        onChange={handleFileChange}
                        disabled={uploading}
                    />
                </label>
            </div>

            {attachments.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <Paperclip className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No attachments yet</p>
                    <p className="text-xs text-gray-400 mt-1">Upload receipts or invoices (Max 5MB)</p>
                </div>
            ) : (
                <ul className="space-y-2">
                    {attachments.map(att => (
                        <li key={att.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 group">
                            <div className="flex items-center gap-3 min-w-0">
                                {getFileIcon(att.file_type)}
                                <span className="text-sm text-gray-700 truncate" title={att.file_name}>
                                    {att.file_name}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <a 
                                    href={att.file_url} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="p-1.5 text-gray-400 hover:text-primary bg-white rounded-md shadow-sm"
                                    title="Download"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                </a>
                                <button
                                    type="button"
                                    onClick={() => handleDelete(att)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 bg-white rounded-md shadow-sm"
                                    title="Delete"
                                >
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
