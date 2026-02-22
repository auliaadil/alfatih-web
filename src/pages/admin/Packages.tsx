import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Trash2, Edit, Users } from 'lucide-react';
import PackageForm from './PackageForm';
import PackageDetailModal from './PackageDetailModal';

const Packages: React.FC = () => {
    const [packages, setPackages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState<any | null>(null);

    // Detail Modal State
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedPackageForDetail, setSelectedPackageForDetail] = useState<any | null>(null);

    // Config Data
    const [airlinesData, setAirlinesData] = useState<any[]>([]);
    const [hotelsData, setHotelsData] = useState<any[]>([]);

    useEffect(() => {
        fetchPackages();
        fetchConfigData();
    }, []);

    const fetchConfigData = async () => {
        const [airlinesRes, hotelsRes] = await Promise.all([
            supabase.from('airlines').select('*'),
            supabase.from('hotels').select('*')
        ]);
        if (airlinesRes.data) setAirlinesData(airlinesRes.data);
        if (hotelsRes.data) setHotelsData(hotelsRes.data);
    };

    const fetchPackages = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('packages').select('*').order('created_at', { ascending: false });
        if (!error && data) {
            setPackages(data);
        }
        setLoading(false);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Packages Management</h1>
                <button
                    onClick={() => {
                        setEditingPackage(null);
                        setIsFormOpen(true);
                    }}
                    className="bg-primary hover:bg-emerald-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    New Package
                </button>
            </div>

            {loading ? (
                <div className="text-gray-500">Loading packages...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {packages.map((pkg) => (
                        <div key={pkg.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            {pkg.image_url ? (
                                <img src={pkg.image_url} alt={pkg.title} className="w-full h-48 object-cover" />
                            ) : (
                                <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500">No Image</div>
                            )}
                            <div className="p-4">
                                <h3 className="font-bold text-lg text-gray-900 line-clamp-2">{pkg.title}</h3>
                                <p className="text-sm text-gray-500 mt-1">{pkg.duration} • {pkg.category}</p>

                                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                                    <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded">
                                        Quotas: {pkg.quotas} / {pkg.initial_quotas || pkg.quotas} pax
                                    </span>
                                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                        Rooms: {pkg.available_rooms} / {pkg.initial_rooms || pkg.available_rooms}
                                    </span>
                                </div>

                                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                                    <button
                                        onClick={() => {
                                            setSelectedPackageForDetail(pkg);
                                            setIsDetailModalOpen(true);
                                        }}
                                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1"
                                    >
                                        <Users className="w-4 h-4" />
                                        Participants
                                    </button>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => {
                                                setEditingPackage(pkg);
                                                setIsFormOpen(true);
                                            }}
                                            className="text-gray-500 hover:text-indigo-600 transition-colors"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button className="text-gray-500 hover:text-red-600 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {packages.length === 0 && (
                        <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-xl border border-gray-100">
                            No packages created yet.
                        </div>
                    )}
                </div>
            )}

            {isFormOpen && (
                <PackageForm
                    airlinesData={airlinesData}
                    hotelsData={hotelsData}
                    initialData={editingPackage}
                    onClose={() => {
                        setIsFormOpen(false);
                        setEditingPackage(null);
                    }}
                    onSuccess={() => {
                        setIsFormOpen(false);
                        setEditingPackage(null);
                        fetchPackages();
                    }}
                />
            )}
            {isDetailModalOpen && selectedPackageForDetail && (
                <PackageDetailModal
                    pkg={selectedPackageForDetail}
                    onClose={() => {
                        setIsDetailModalOpen(false);
                        setSelectedPackageForDetail(null);
                    }}
                />
            )}
        </div>
    );
};

export default Packages;
