import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Upload, Plus, Trash2 } from 'lucide-react';

interface RoomOption {
    name: string;
    capacity: number;
    price: number;
    original_price?: number;
}

interface ItineraryItem {
    day: number;
    title: string;
    activities: string[];
}

interface PackageFormProps {
    airlinesData: any[];
    hotelsData: any[];
    initialData?: any | null;
    onClose: () => void;
    onSuccess: () => void;
}

// Generates a mock UUID or random string for filenames
const uuidv4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

const generateSlug = (title: string): string => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
};

const PackageForm: React.FC<PackageFormProps> = ({ airlinesData, hotelsData, initialData, onClose, onSuccess }) => {
    const [title, setTitle] = useState(initialData?.title || '');
    const [category, setCategory] = useState(initialData?.category || 'Umrah');
    const [duration, setDuration] = useState(initialData?.duration || '9 Days');
    const [departureDate, setDepartureDate] = useState(initialData?.departure_date || '');
    const [flightDetails, setFlightDetails] = useState(initialData?.flight_details || '');
    const [isPopular, setIsPopular] = useState(initialData?.is_popular || false);
    const [description, setDescription] = useState(initialData?.description || '');
    const [features, setFeatures] = useState(initialData?.features ? initialData.features.join(', ') : '');

    // Brochure
    const [brochureFile, setBrochureFile] = useState<File | null>(null);
    const [uploadingBrochure, setUploadingBrochure] = useState(false);

    // Inventory
    const [availableRooms, setAvailableRooms] = useState(initialData?.available_rooms || 50);
    const [initialRooms, setInitialRooms] = useState(initialData?.initial_rooms || initialData?.available_rooms || 50);
    const [quotas, setQuotas] = useState(initialData?.quotas || 100);
    const [initialQuotas, setInitialQuotas] = useState(initialData?.initial_quotas || initialData?.quotas || 100);

    // Multi-Selects (Arrays of IDs)
    const [airlineIds, setAirlineIds] = useState<string[]>(initialData?.airline_ids || []);
    const [hotelIds, setHotelIds] = useState<string[]>(initialData?.hotel_ids || []);

    // Image
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    // Dynamic Room Options
    const [roomOptions, setRoomOptions] = useState<RoomOption[]>(initialData?.room_options || []);

    // Itinerary & Terms
    const [itinerary, setItinerary] = useState<ItineraryItem[]>(initialData?.itinerary || []);
    const [included, setIncluded] = useState<string[]>(initialData?.included || []);
    const [notIncluded, setNotIncluded] = useState<string[]>(initialData?.not_included || []);

    // State
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleRoomOptionsChange = (index: number, field: keyof RoomOption, value: any) => {
        const updated = [...roomOptions];
        updated[index] = { ...updated[index], [field]: value };
        setRoomOptions(updated);
    };

    const handleItineraryChange = (index: number, field: keyof ItineraryItem, value: any) => {
        const updated = [...itinerary];
        updated[index] = { ...updated[index], [field]: value };
        setItinerary(updated);
    };

    const handleItineraryActivityChange = (itineraryIndex: number, activityIndex: number, value: string) => {
        const updated = [...itinerary];
        updated[itineraryIndex].activities[activityIndex] = value;
        setItinerary(updated);
    };

    const addItineraryActivity = (index: number) => {
        const updated = [...itinerary];
        updated[index].activities.push('');
        setItinerary(updated);
    };

    const removeItineraryActivity = (itineraryIndex: number, activityIndex: number) => {
        const updated = [...itinerary];
        updated[itineraryIndex].activities = updated[itineraryIndex].activities.filter((_, i) => i !== activityIndex);
        setItinerary(updated);
    };

    const handleListChange = (setter: React.Dispatch<React.SetStateAction<string[]>>, list: string[], index: number, value: string) => {
        const updated = [...list];
        updated[index] = value;
        setter(updated);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setErrorMsg('');

        let imageUrl = initialData?.image_url || null;

        // 1. Upload Image to Supabase Storage if present
        if (imageFile) {
            setUploadingImage(true);
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${uuidv4()}.${fileExt}`;
            const filePath = `packages/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('package-images')
                .upload(filePath, imageFile);

            setUploadingImage(false);

            if (uploadError) {
                setErrorMsg('Image upload failed: ' + uploadError.message);
                setSaving(false);
                return;
            }

            // Get Public URL
            const { data } = supabase.storage.from('package-images').getPublicUrl(filePath);
            imageUrl = data.publicUrl;
        }

        // 1.5 Upload Brochure
        let brochureUrl = initialData?.brochure_url || null;
        if (brochureFile) {
            setUploadingBrochure(true);
            const fileExt = brochureFile.name.split('.').pop();
            const fileName = `brochures/${uuidv4()}.${fileExt}`;

            // Attempting to upload to `package-images` bucket since it's already configured as public.
            // A more scalable way would be a `package-documents` bucket.
            const { error: uploadError } = await supabase.storage
                .from('package-images')
                .upload(fileName, brochureFile);

            setUploadingBrochure(false);

            if (uploadError) {
                setErrorMsg('Brochure upload failed: ' + uploadError.message);
                setSaving(false);
                return;
            }

            const { data } = supabase.storage.from('package-images').getPublicUrl(fileName);
            brochureUrl = data.publicUrl;
        }

        // 2. Parse features
        const parsedFeatures = features.split(',').map(f => f.trim()).filter(f => f.length > 0);

        // 3. Insert into Database
        const payload = {
            title,
            slug: generateSlug(title),
            category,
            duration,
            departure_date: departureDate,
            flight_details: flightDetails,
            is_popular: isPopular,
            description,
            features: parsedFeatures,
            available_rooms: availableRooms,
            initial_rooms: initialRooms,
            quotas,
            initial_quotas: initialQuotas,
            airline_ids: airlineIds,
            hotel_ids: hotelIds,
            room_options: roomOptions,
            itinerary,
            included,
            not_included: notIncluded,
            ...(imageUrl && { image_url: imageUrl }),
            ...(brochureUrl && { brochure_url: brochureUrl })
        };

        let error;
        if (initialData) {
            const { error: updateError } = await supabase.from('packages').update(payload).eq('id', initialData.id);
            error = updateError;
        } else {
            const { error: insertError } = await supabase.from('packages').insert([payload]);
            error = insertError;
        }

        setSaving(false);

        if (error) {
            setErrorMsg(error.message);
        } else {
            onSuccess();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <X className="w-6 h-6" />
                </button>

                <div className="p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">{initialData ? 'Edit Package' : 'Create New Package'}</h2>

                    {errorMsg && (
                        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 text-sm">
                            {errorMsg}
                        </div>
                    )}

                    <form onSubmit={handleSave} className="space-y-8">
                        {/* Basic Overview */}
                        <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                            <h3 className="font-semibold text-gray-900 border-b pb-2">Basic Info</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Package Title</label>
                                    <input type="text" required className="w-full px-4 py-2 border rounded-md" value={title} onChange={e => setTitle(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <input
                                        type="text"
                                        required
                                        list="category-options"
                                        className="w-full px-4 py-2 border rounded-md"
                                        value={category}
                                        onChange={e => setCategory(e.target.value)}
                                        placeholder="e.g. Umrah Plus"
                                    />
                                    <datalist id="category-options">
                                        <option value="Umrah" />
                                        <option value="Asia" />
                                        <option value="Europe" />
                                        <option value="Middle East" />
                                    </datalist>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (e.g. 9 Days)</label>
                                    <input type="text" required className="w-full px-4 py-2 border rounded-md" value={duration} onChange={e => setDuration(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Departure Date</label>
                                    <input type="text" required placeholder="e.g. 15 Mei 2024" className="w-full px-4 py-2 border rounded-md" value={departureDate} onChange={e => setDepartureDate(e.target.value)} />
                                </div>
                                <div className="flex items-end mb-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" className="rounded text-primary focus:ring-primary h-5 w-5" checked={isPopular} onChange={e => setIsPopular(e.target.checked)} />
                                        <span className="text-sm font-medium text-gray-700">Mark as Popular</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea required rows={3} className="w-full px-4 py-2 border rounded-md" value={description} onChange={e => setDescription(e.target.value)} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Features (Comma separated)</label>
                                <input type="text" placeholder="e.g. 5 Star Hotels, Visa Included, Direct Flight" className="w-full px-4 py-2 border rounded-md" value={features} onChange={e => setFeatures(e.target.value)} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
                                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md bg-white">
                                        <div className="space-y-1 text-center">
                                            <Upload className="mx-auto h-8 w-8 text-gray-400" />
                                            <div className="flex text-sm text-gray-600 justify-center">
                                                <label className="relative cursor-pointer rounded-md font-medium text-primary hover:text-emerald-700 focus-within:outline-none">
                                                    <span>Upload image</span>
                                                    <input type="file" className="sr-only" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                                                </label>
                                            </div>
                                            {imageFile && <p className="text-xs text-gray-500 mt-2 truncate w-32 mx-auto">{imageFile.name}</p>}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Brochure PDF (Optional)</label>
                                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md bg-white">
                                        <div className="space-y-1 text-center">
                                            <Upload className="mx-auto h-8 w-8 text-gray-400" />
                                            <div className="flex text-sm text-gray-600 justify-center">
                                                <label className="relative cursor-pointer rounded-md font-medium text-primary hover:text-emerald-700 focus-within:outline-none">
                                                    <span>Upload PDF</span>
                                                    <input type="file" className="sr-only" accept="application/pdf" onChange={(e) => setBrochureFile(e.target.files?.[0] || null)} />
                                                </label>
                                            </div>
                                            {brochureFile && <p className="text-xs text-gray-500 mt-2 truncate w-32 mx-auto">{brochureFile.name}</p>}
                                            {!brochureFile && initialData?.brochure_url && <p className="text-xs text-emerald-600 mt-2">Has existing brochure</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Master Configurations */}
                        <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                            <h3 className="font-semibold text-gray-900 border-b pb-2">Master Configurations</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Included Airlines (Hold Ctrl/Cmd to select multiple)</label>
                                    <select multiple className="w-full px-4 py-2 border rounded-md h-32" value={airlineIds} onChange={e => setAirlineIds(Array.from(e.target.selectedOptions, option => option.value))}>
                                        {airlinesData.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                    </select>
                                    <div className="mt-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Flight Details Override</label>
                                        <input type="text" placeholder="e.g. Direct Flight Jakarta (CGK) - Jeddah (JED)" className="w-full px-4 py-2 border rounded-md text-sm" value={flightDetails} onChange={e => setFlightDetails(e.target.value)} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Included Hotels (Hold Ctrl/Cmd to select multiple)</label>
                                    <select multiple className="w-full px-4 py-2 border rounded-md h-32" value={hotelIds} onChange={e => setHotelIds(Array.from(e.target.selectedOptions, option => option.value))}>
                                        {hotelsData.map(h => <option key={h.id} value={h.id}>{h.name} ({h.location})</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Inventory & Pricing */}
                        <div className="bg-gray-50 p-6 rounded-lg space-y-6">
                            <h3 className="font-semibold text-gray-900 border-b pb-2 flex justify-between items-center">
                                Inventory & Dynamic Rooms
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Rooms (Initial count)</label>
                                    <input type="number" required className="w-full px-4 py-2 border rounded-md" value={initialRooms} onChange={e => {
                                        setInitialRooms(Number(e.target.value));
                                        if (!initialData) setAvailableRooms(Number(e.target.value));
                                    }} />
                                    <p className="text-xs text-gray-500 mt-1">Total physical rooms procured</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Available Rooms (Remaining)</label>
                                    <input type="number" required className="w-full px-4 py-2 border rounded-md" value={availableRooms} onChange={e => setAvailableRooms(Number(e.target.value))} />
                                    <p className="text-xs text-gray-500 mt-1">Auto-updated by orders</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Quotas (Initial spots)</label>
                                    <input type="number" required className="w-full px-4 py-2 border rounded-md" value={initialQuotas} onChange={e => {
                                        setInitialQuotas(Number(e.target.value));
                                        if (!initialData) setQuotas(Number(e.target.value));
                                    }} />
                                    <p className="text-xs text-gray-500 mt-1">Total passenger capacity</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Available Quotas (Remaining)</label>
                                    <input type="number" required className="w-full px-4 py-2 border rounded-md" value={quotas} onChange={e => setQuotas(Number(e.target.value))} />
                                    <p className="text-xs text-gray-500 mt-1">Auto-updated by orders</p>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Room Pricing Options</label>
                                    <button
                                        type="button"
                                        onClick={() => setRoomOptions([...roomOptions, { name: '', capacity: 2, price: 0 }])}
                                        className="text-primary hover:text-emerald-700 text-sm font-medium flex items-center gap-1"
                                    >
                                        <Plus className="w-4 h-4" /> Add Room Type
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {roomOptions.map((room, index) => (
                                        <div key={index} className="flex gap-4 items-center bg-white p-4 border rounded-md shadow-sm">
                                            <div className="flex-1">
                                                <input type="text" placeholder="Name (e.g. Quad)" required className="w-full px-3 py-2 border rounded border-gray-300 text-sm" value={room.name} onChange={e => handleRoomOptionsChange(index, 'name', e.target.value)} />
                                            </div>
                                            <div className="w-24">
                                                <input type="number" placeholder="Capacity" required min="1" className="w-full px-3 py-2 border rounded border-gray-300 text-sm" value={room.capacity} onChange={e => handleRoomOptionsChange(index, 'capacity', Number(e.target.value))} />
                                            </div>
                                            <div className="flex-1">
                                                <input type="number" placeholder="Price (Rp)" required className="w-full px-3 py-2 border rounded border-gray-300 text-sm" value={room.price} onChange={e => handleRoomOptionsChange(index, 'price', Number(e.target.value))} />
                                            </div>
                                            <div className="flex-1">
                                                <input type="number" placeholder="Orig. Price (Optional)" className="w-full px-3 py-2 border rounded border-gray-300 text-sm" value={room.original_price || ''} onChange={e => handleRoomOptionsChange(index, 'original_price', e.target.value ? Number(e.target.value) : undefined)} />
                                            </div>
                                            <button type="button" onClick={() => setRoomOptions(roomOptions.filter((_, i) => i !== index))} className="text-red-500 hover:text-red-700 p-2">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {roomOptions.length === 0 && (
                                        <div className="text-sm text-gray-500 italic">No room options defined. Users won't see pricing.</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Itinerary & Logistics */}
                        <div className="bg-gray-50 p-6 rounded-lg space-y-6">
                            <h3 className="font-semibold text-gray-900 border-b pb-2">Itinerary & Terms</h3>

                            {/* Itinerary */}
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Itinerary</label>
                                    <button
                                        type="button"
                                        onClick={() => setItinerary([...itinerary, { day: itinerary.length + 1, title: '', activities: [''] }])}
                                        className="text-primary hover:text-emerald-700 text-sm font-medium flex items-center gap-1"
                                    >
                                        <Plus className="w-4 h-4" /> Add Day
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {itinerary.map((item, index) => (
                                        <div key={index} className="bg-white p-4 border rounded-md shadow-sm space-y-3">
                                            <div className="flex gap-4 items-start">
                                                <div className="w-20">
                                                    <input type="number" placeholder="Day" className="w-full px-3 py-2 border rounded border-gray-300 text-sm" value={item.day} onChange={e => handleItineraryChange(index, 'day', Number(e.target.value))} />
                                                </div>
                                                <div className="flex-1">
                                                    <input type="text" placeholder="Title (e.g. Kedatangan di Madinah)" className="w-full px-3 py-2 border rounded border-gray-300 text-sm" value={item.title} onChange={e => handleItineraryChange(index, 'title', e.target.value)} />
                                                </div>
                                                <button type="button" onClick={() => setItinerary(itinerary.filter((_, i) => i !== index))} className="text-red-500 hover:text-red-700 mt-2">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="pl-24 space-y-2">
                                                <label className="block text-xs font-medium text-gray-500">Activities</label>
                                                {item.activities.map((activity, actIndex) => (
                                                    <div key={actIndex} className="flex gap-2">
                                                        <input type="text" placeholder={`Activity ${actIndex + 1}`} className="flex-1 px-3 py-1.5 border rounded border-gray-300 text-sm" value={activity} onChange={e => handleItineraryActivityChange(index, actIndex, e.target.value)} />
                                                        <button type="button" onClick={() => removeItineraryActivity(index, actIndex)} className="text-red-400 hover:text-red-600">
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                                <button type="button" onClick={() => addItineraryActivity(index)} className="text-xs text-primary hover:text-emerald-700 flex items-center gap-1 mt-1">
                                                    <Plus className="w-3 h-3" /> Add Activity
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {itinerary.length === 0 && <div className="text-sm text-gray-500 italic">No itinerary defined.</div>}
                                </div>
                            </div>

                            {/* Terms */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                                {/* Included */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-sm font-medium text-gray-700">Included (Termasuk)</label>
                                        <button
                                            type="button"
                                            onClick={() => setIncluded([...included, ''])}
                                            className="text-primary hover:text-emerald-700 text-xs font-medium flex items-center gap-1"
                                        >
                                            <Plus className="w-3 h-3" /> Add Item
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {included.map((inc, index) => (
                                            <div key={index} className="flex gap-2">
                                                <input type="text" className="flex-1 px-3 py-1.5 border rounded border-gray-300 text-sm" value={inc} onChange={e => handleListChange(setIncluded, included, index, e.target.value)} />
                                                <button type="button" onClick={() => setIncluded(included.filter((_, i) => i !== index))} className="text-red-400 hover:text-red-600">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        {included.length === 0 && <div className="text-sm text-gray-500 italic">None defined</div>}
                                    </div>
                                </div>

                                {/* Not Included */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-sm font-medium text-gray-700">Not Included (Tidak Termasuk)</label>
                                        <button
                                            type="button"
                                            onClick={() => setNotIncluded([...notIncluded, ''])}
                                            className="text-primary hover:text-emerald-700 text-xs font-medium flex items-center gap-1"
                                        >
                                            <Plus className="w-3 h-3" /> Add Item
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {notIncluded.map((ninc, index) => (
                                            <div key={index} className="flex gap-2">
                                                <input type="text" className="flex-1 px-3 py-1.5 border rounded border-gray-300 text-sm" value={ninc} onChange={e => handleListChange(setNotIncluded, notIncluded, index, e.target.value)} />
                                                <button type="button" onClick={() => setNotIncluded(notIncluded.filter((_, i) => i !== index))} className="text-red-400 hover:text-red-600">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        {notIncluded.length === 0 && <div className="text-sm text-gray-500 italic">None defined</div>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 gap-4">
                            <button type="button" onClick={onClose} className="px-6 py-2 border rounded-md text-gray-700 hover:bg-gray-50">
                                Cancel
                            </button>
                            <button type="submit" disabled={saving || uploadingImage || uploadingBrochure} className="bg-primary hover:bg-emerald-700 text-white px-8 py-2 rounded-md font-medium shadow-sm disabled:opacity-70">
                                {saving ? 'Saving...' : (uploadingImage || uploadingBrochure) ? 'Uploading Files...' : (initialData ? 'Update Package' : 'Create Package')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PackageForm;
