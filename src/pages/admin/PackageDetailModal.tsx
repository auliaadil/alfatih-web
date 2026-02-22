import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { X, UserCheck, Users } from 'lucide-react';

interface PackageDetailModalProps {
    pkg: any;
    onClose: () => void;
}

const PackageDetailModal: React.FC<PackageDetailModalProps> = ({ pkg, onClose }) => {
    const [participants, setParticipants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchParticipants = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('participants')
                .select(`
                    *,
                    orders!inner(package_id, customer_name, participant_count)
                `)
                .eq('orders.package_id', pkg.id)
                .order('created_at', { ascending: false });

            if (!error && data) {
                setParticipants(data);
            } else if (error) {
                console.error("Error fetching participants for package:", error);
            }
            setLoading(false);
        };

        if (pkg?.id) {
            fetchParticipants();
        }
    }, [pkg]);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col relative overflow-hidden">

                {/* Header */}
                <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{pkg.title}</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Departure: {pkg.departure_date} • {pkg.duration}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-white rounded-full p-1 border shadow-sm">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Stats Bar */}
                <div className="bg-emerald-50 px-6 py-3 border-b border-emerald-100 flex gap-6 text-sm">
                    <div className="flex items-center gap-2 text-emerald-800">
                        <UserCheck className="w-5 h-5 text-emerald-600" />
                        <span className="font-semibold">Current Manifest:</span>
                        {participants.length} registered participants
                    </div>
                    <div className="text-emerald-700 opacity-80 border-l border-emerald-200 pl-6">
                        Quota Available: <span className="font-bold">{pkg.quotas} / {pkg.initial_quotas || pkg.quotas} pax</span>
                    </div>
                </div>

                {/* Content Body */}
                <div className="p-6 overflow-y-auto flex-1">
                    {loading ? (
                        <div className="text-center text-gray-500 py-10">Loading manifest data...</div>
                    ) : participants.length > 0 ? (
                        <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Participant Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact / ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room Allocation</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booked By (Order)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {participants.map((p) => (
                                        <tr key={p.id} className="hover:bg-gray-50/50">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900">{p.name || 'Unnamed Participant'}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                <div>{p.phone || '-'}</div>
                                                <div className="text-xs text-gray-400">NIK: {p.identity_number || '-'}</div>
                                                <div className="text-xs text-gray-400">Pass: {p.passport_number || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold border border-amber-200">
                                                    {p.room_type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-indigo-700">{p.orders.customer_name}</div>
                                                <div className="text-xs text-gray-500">{p.orders.participant_count} pax in order</div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <h3 className="text-gray-900 font-medium text-lg">Empty Manifest</h3>
                            <p className="text-gray-500 mt-1">No participants have booked this package yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PackageDetailModal;
