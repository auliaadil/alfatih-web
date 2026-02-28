import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Eye, CheckCircle, Clock, Trash2, X, Save } from 'lucide-react';

const PrivateTrips: React.FC = () => {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
    const [notes, setNotes] = useState('');
    const [savingNotes, setSavingNotes] = useState(false);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('private_trip_requests')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setRequests(data);
        }
        setLoading(false);
    };

    const markAsHandled = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'pending' ? 'handled' : 'pending';
        await supabase.from('private_trip_requests').update({ status: newStatus }).eq('id', id);
        fetchRequests();
        if (selectedRequest?.id === id) {
            setSelectedRequest(prev => prev ? { ...prev, status: newStatus } : null);
        }
    }

    const deleteRequest = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this specific request?')) return;

        await supabase.from('private_trip_requests').delete().eq('id', id);
        fetchRequests();
    }

    const saveNotes = async () => {
        if (!selectedRequest) return;
        setSavingNotes(true);
        await supabase.from('private_trip_requests').update({ admin_notes: notes }).eq('id', selectedRequest.id);
        setSavingNotes(false);
        fetchRequests();
        setSelectedRequest({ ...selectedRequest, admin_notes: notes });
    }

    const openModal = (req: any, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setSelectedRequest(req);
        setNotes(req.admin_notes || '');
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Private Trip Inquiries</h1>
                <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
                    Total Requests: <span className="font-bold text-primary">{requests.length}</span>
                </div>
            </div>

            {loading ? (
                <div className="text-gray-500">Loading requests...</div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitter</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trip Details</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Budget / Notes</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {requests.map((req) => (
                                <tr key={req.id} onClick={() => openModal(req)} className={`cursor-pointer hover:bg-gray-50 transition-colors ${req.status === 'handled' ? 'bg-gray-50 opacity-80' : ''}`}>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900">{req.name}</div>
                                        <div className="text-sm text-gray-500">{req.phone}</div>
                                        <div className="text-xs text-indigo-500">{req.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900 line-clamp-1">{req.destination}</div>
                                        <div className="text-sm text-gray-500">{req.dates}</div>
                                        <div className="text-xs text-gray-400 mt-1">{req.pax_count} Pax</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-green-700 font-medium mb-1">{req.budget}</div>
                                        <div className="text-xs text-gray-500 line-clamp-2 max-w-xs">{req.special_requirements || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {req.status === 'pending' ? (
                                            <span className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded bg-yellow-100 text-yellow-800 w-fit">
                                                <Clock className="w-3 h-3" /> Pending
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800 w-fit">
                                                <CheckCircle className="w-3 h-3" /> Handled
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm font-medium">
                                        <div className="flex justify-end items-center gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); markAsHandled(req.id, req.status); }}
                                                className={`p-2 rounded-lg transition-colors ${req.status === 'pending' ? 'text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100' : 'text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200'}`}
                                                title={req.status === 'pending' ? 'Mark Handled' : 'Unmark'}
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => deleteRequest(req.id, e)}
                                                className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors"
                                                title="Delete Request"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {requests.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        No private trip inquiries yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {selectedRequest && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Eye className="w-5 h-5 text-primary" /> Request Details
                            </h2>
                            <button onClick={() => setSelectedRequest(null)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 p-2 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Customer Info</p>
                                        <p className="font-bold text-gray-900 text-lg">{selectedRequest.name || 'Unknown'}</p>
                                        <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">📞 {selectedRequest.phone || '-'}</p>
                                        <p className="text-sm text-indigo-600 flex items-center gap-2">✉️ {selectedRequest.email || '-'}</p>
                                        <a href={`https://wa.me/${selectedRequest.phone?.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors">
                                            Chat WhatsApp →
                                        </a>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Status</p>
                                        {selectedRequest.status === 'pending' ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                                                <Clock className="w-3.5 h-3.5" /> Pending Follow-up
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800 border border-green-200">
                                                <CheckCircle className="w-3.5 h-3.5" /> Handled
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                                    <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Trip Specifications</p>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-0.5">Destination</p>
                                        <p className="font-bold text-gray-900">{selectedRequest.destination || 'Unspecified'}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-0.5">Duration</p>
                                            <p className="font-bold text-gray-900">{selectedRequest.dates || (selectedRequest.days ? `${selectedRequest.days} Hari` : '-')}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-0.5">Travelers</p>
                                            <p className="font-bold text-gray-900">{selectedRequest.pax_count ? `${selectedRequest.pax_count} Pax` : (selectedRequest.travelers || '-')}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-0.5">Budget</p>
                                        <p className="font-bold text-green-700">{selectedRequest.budget || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Requirements / AI Request Data</p>
                                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                    {selectedRequest.special_requirements || 'No special requirements provided.'}
                                    {selectedRequest.interests && Array.isArray(selectedRequest.interests) && (
                                        <div className="mt-3 pt-3 border-t border-blue-100 text-xs text-gray-500">
                                            <strong>Legacy AI Interests:</strong> {selectedRequest.interests.join(', ')}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex justify-between items-center">
                                    <span>Admin Notes (Internal Only)</span>
                                </p>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={4}
                                    className="w-full border border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-300"
                                    placeholder="Add internal follow-up notes, quotes offered, conversation history..."
                                ></textarea>
                                <div className="mt-3 flex justify-end">
                                    <button
                                        onClick={saveNotes}
                                        disabled={savingNotes}
                                        className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors shadow-md disabled:opacity-50"
                                    >
                                        <Save className="w-4 h-4" /> {savingNotes ? 'Saving...' : 'Save Notes'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PrivateTrips;
