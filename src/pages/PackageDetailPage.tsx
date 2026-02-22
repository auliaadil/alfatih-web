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
            <div className="flex-grow flex items-center justify-center py-20 text-gray-500">
                Memuat detail paket...
            </div>
        );
    }

    if (!tour) {
        return withLayout(
            <div className="flex-grow flex items-center justify-center py-20 text-gray-500">
                Paket tour tidak ditemukan.
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
