import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { TourPackage } from '../../types';
import TourDetail from '../../components/TourDetail';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const PackageDetailPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [tour, setTour] = useState<TourPackage | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (slug) {
            fetchPackage(slug);
        }
    }, [slug]);

    const fetchPackage = async (packageSlug: string) => {
        setLoading(true);

        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(packageSlug);

        const { data: pkg, error } = await supabase
            .from('packages')
            .select('*')
            .eq(isUUID ? 'id' : 'slug', packageSlug)
            .single();

        if (error || !pkg) {
            console.error('Error fetching package', error);
            setLoading(false);
            return;
        }

        const { data: airlines } = await supabase.from('airlines').select('*');
        const { data: hotels } = await supabase.from('hotels').select('*');

        const pAirlines = airlines ? airlines.filter(a => (pkg.airline_ids || []).includes(a.id)) : [];
        const pHotels = hotels ? hotels.filter(h => (pkg.hotel_ids || []).includes(h.id)) : [];

        const fullPackage = {
            ...pkg,
            airlines: pAirlines,
            hotels: pHotels
        } as TourPackage;

        setTour(fullPackage);
        setLoading(false);
    };

    const handleNavigate = (sectionId: string) => {
        navigate(`/#${sectionId}`);
    };

    const withLayout = (content: React.ReactNode) => (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <Navbar
                onNavigate={handleNavigate}
                onHomeClick={() => navigate('/')}
            />
            {content}
            <Footer />
        </div>
    );

    if (loading) {
        return withLayout(
            <div className="flex-grow flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <p className="text-gray-400 text-sm font-medium">Memuat detail paket...</p>
            </div>
        );
    }

    if (!tour) {
        return withLayout(
            <div className="flex-grow flex flex-col items-center justify-center py-20 gap-3 text-center px-4">
                <p className="text-gray-900 font-bold text-lg">Paket tidak ditemukan</p>
                <p className="text-gray-400 text-sm max-w-xs">Paket tour yang Anda cari tidak tersedia atau telah dihapus.</p>
                <button onClick={() => window.history.back()} className="mt-2 text-primary font-bold text-sm hover:underline">
                    ← Kembali
                </button>
            </div>
        );
    }

    return withLayout(
        <TourDetail
            tour={tour}
            onBack={() => navigate(-1)}
        />
    );
};

export default PackageDetailPage;
