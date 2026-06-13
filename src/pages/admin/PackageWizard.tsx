import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/admin/ui';
import WizardSidebar, { WizardStep } from '../../components/admin/PackageWizard/WizardSidebar';
import Step1BasicInfo from '../../components/admin/PackageWizard/Step1BasicInfo';
import Step2FlightHotels from '../../components/admin/PackageWizard/Step2FlightHotels';
import Step3PricingRooms from '../../components/admin/PackageWizard/Step3PricingRooms';
import Step4ItineraryTerms from '../../components/admin/PackageWizard/Step4ItineraryTerms';
import { FlightRoute, RoomOption, DayItinerary } from '../../../types';

export interface WizardDraft {
  // Step 1
  title: string;
  category: string;
  departure_date: string;
  arrival_date: string;
  image_url: string;
  image_credit: string;
  gallery_urls: string[];
  is_popular: boolean;

  // Step 2
  airline_ids: string[];
  hotel_ids: string[];
  flight_routes: FlightRoute[];
  description: string;
  features: string[];

  // Step 3
  quotas: number;
  available_quotas: number;
  room_options: RoomOption[];

  // Step 4
  itinerary: DayItinerary[];
  included: string[];
  not_included: string[];
}

const EMPTY_DRAFT: WizardDraft = {
  title: '', category: '', departure_date: '', arrival_date: '',
  image_url: '', image_credit: '', gallery_urls: [], is_popular: false,
  airline_ids: [], hotel_ids: [], flight_routes: [],
  description: '', features: [],
  quotas: 0, available_quotas: 0, room_options: [],
  itinerary: [], included: [], not_included: [],
};

const STEPS: WizardStep[] = [
  { number: 1, label: 'Basic Info', description: 'Title, dates, cover image' },
  { number: 2, label: 'Flight & Hotels', description: 'Routes, hotels, description' },
  { number: 3, label: 'Pricing & Rooms', description: 'Quota, room options' },
  { number: 4, label: 'Itinerary & Terms', description: 'Days, included, excluded' },
];

const PackageWizard: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<WizardDraft>(EMPTY_DRAFT);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    supabase.from('categories').select('name').order('name').then(({ data }) => {
      if (data) setCategories(data.map((c: any) => c.name));
    });
  }, []);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase.from('packages').select('*').eq('id', id).single();
      if (data) {
        setDraft({
          title: data.title ?? '',
          category: data.category ?? '',
          departure_date: data.departure_date ?? '',
          arrival_date: data.arrival_date ?? '',
          image_url: data.image_url ?? '',
          image_credit: data.image_credit ?? '',
          gallery_urls: data.gallery_urls ?? [],
          is_popular: data.is_popular ?? false,
          airline_ids: data.airline_ids ?? [],
          hotel_ids: data.hotel_ids ?? [],
          flight_routes: data.flight_routes ?? [],
          description: data.description ?? '',
          features: data.features ?? [],
          quotas: data.quotas ?? 0,
          available_quotas: data.available_quotas ?? data.quotas ?? 0,
          room_options: data.room_options ?? [],
          itinerary: data.itinerary ?? [],
          included: data.included ?? [],
          not_included: data.not_included ?? [],
        });
      }
      setLoading(false);
    })();
  }, [id]);

  const updateDraft = (partial: Partial<WizardDraft>) => setDraft((d) => ({ ...d, ...partial }));

  const computedDuration = () => {
    if (!draft.departure_date || !draft.arrival_date) return '';
    const days = Math.round(
      (new Date(draft.arrival_date).getTime() - new Date(draft.departure_date).getTime()) / 86400000
    ) + 1;
    return days > 0 ? `${days} Hari` : '';
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      title: draft.title,
      category: draft.category,
      departure_date: draft.departure_date,
      arrival_date: draft.arrival_date,
      duration: computedDuration(),
      image_url: draft.image_url,
      image_credit: draft.image_credit || null,
      gallery_urls: draft.gallery_urls,
      is_popular: draft.is_popular,
      airline_ids: draft.airline_ids,
      hotel_ids: draft.hotel_ids,
      flight_routes: draft.flight_routes,
      description: draft.description,
      features: draft.features,
      quotas: draft.quotas,
      available_quotas: id ? draft.available_quotas : draft.quotas,
      room_options: draft.room_options,
      itinerary: draft.itinerary,
      included: draft.included,
      not_included: draft.not_included,
    };

    const { error } = id
      ? await supabase.from('packages').update(payload).eq('id', id)
      : await supabase.from('packages').insert([payload]);

    setSaving(false);
    if (error) {
      toast('error', 'Failed to save package.');
    } else {
      toast('success', id ? 'Package updated.' : 'Package created.');
      navigate('/admin/packages');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Loading package...
      </div>
    );
  }

  return (
    <div className="flex gap-6 items-start">
      <WizardSidebar steps={STEPS} currentStep={step} />
      <div className="flex-1 min-w-0">
        {step === 1 && (
          <Step1BasicInfo
            draft={draft}
            updateDraft={updateDraft}
            onNext={() => setStep(2)}
            categories={categories}
          />
        )}
        {step === 2 && (
          <Step2FlightHotels
            draft={draft}
            updateDraft={updateDraft}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <Step3PricingRooms
            draft={draft}
            updateDraft={updateDraft}
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
          />
        )}
        {step === 4 && (
          <Step4ItineraryTerms
            draft={draft}
            updateDraft={updateDraft}
            onBack={() => setStep(3)}
            onSave={handleSave}
            saving={saving}
          />
        )}
      </div>
    </div>
  );
};

export default PackageWizard;
