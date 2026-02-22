import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Eye, CheckCircle, Clock } from 'lucide-react';

const PrivateTrips: React.FC = () => {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Private Trip Inquiries</h1>
                <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
                    Total Requests: <span className="font-bold text-primary">{requests.length}</span>
                </div>
            </div>

            {loading ? (
                <div className="text-gray-500">Loading requests...</div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
                                <tr key={req.id} className={req.status === 'handled' ? 'bg-gray-50 opacity-80' : ''}>
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
                                        <button
                                            onClick={() => markAsHandled(req.id, req.status)}
                                            className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded"
                                        >
                                            {req.status === 'pending' ? 'Mark Handled' : 'Unmark'}
                                        </button>
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
        </div>
    );
};

export default PrivateTrips;
