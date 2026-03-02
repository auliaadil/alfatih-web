import React, { useState } from 'react';
import TemplateSelector, { PosterTemplate } from '../../components/admin/PosterMaker/TemplateSelector';
import PosterCanvas from '../../components/admin/PosterMaker/PosterCanvas';

const PosterMaker: React.FC = () => {
    const [selectedTemplate, setSelectedTemplate] = useState<PosterTemplate | null>(null);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Poster Maker</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Create marketing assets using dynamic templates and AI.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Side: Controls & Editor */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Configuration</h2>
                        <TemplateSelector
                            selectedTemplateId={selectedTemplate?.id || null}
                            onSelectTemplate={(tmpl) => setSelectedTemplate(tmpl)}
                        />

                        {/* Mock Data Loading Controls */}
                        {selectedTemplate && (
                            <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">
                                <h3 className="text-sm font-medium text-gray-700">Content & Data</h3>

                                {selectedTemplate.category === 'Tour Promotion' && (
                                    <div className="space-y-3">
                                        <label className="block text-xs text-gray-500">Select Package (Mock)</label>
                                        <select className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-primary">
                                            <option>Umrah Plus Turki (12 Hari)</option>
                                            <option>Halal Tour Jepang (7 Hari)</option>
                                        </select>
                                        <button className="w-full py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition">
                                            Generate Promo Copy with AI
                                        </button>
                                    </div>
                                )}

                                {selectedTemplate.category === 'Content' && (
                                    <div className="space-y-3">
                                        <label className="block text-xs text-gray-500">Topic Idea</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. 5 Barang Wajib Umrah"
                                            className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-primary"
                                        />
                                        <button className="w-full py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition">
                                            Generate Content Points
                                        </button>
                                    </div>
                                )}

                                {selectedTemplate.category === 'Documentation' && (
                                    <div className="space-y-3">
                                        <label className="block text-xs text-gray-500">Location/Trip</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Cappadocia, Turki"
                                            className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-primary"
                                        />
                                        <button className="w-full py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition">
                                            Generate Caption
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Canvas Preview */}
                <div className="lg:col-span-8">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 min-h-[600px] flex flex-col items-center justify-center bg-gray-50 relative overflow-hidden">
                        <PosterCanvas template={selectedTemplate} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PosterMaker;
