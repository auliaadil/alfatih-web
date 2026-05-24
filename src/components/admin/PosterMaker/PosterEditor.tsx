import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, Download, Printer, LayoutTemplate } from 'lucide-react';
import { PosterTemplate, FieldValues } from './types';
import { CODE_TEMPLATES } from './templates';
import { FieldForm } from './FieldForm';
import { LivePreview } from './LivePreview';
import { DraftPanel } from './DraftPanel';
import AssetPanel from './AssetPanel';
import { TemplateSelector } from './TemplateSelector';
import { BlockBuilder } from './BlockBuilder';
import { exportPosterPng } from './exportPoster';
import { applyAutofill, AutofillInputs } from '@/services/posterAutofillService';
import { supabase } from '@/src/lib/supabase';
import { TourPackage } from '@/types';

type View = 'pick-template' | 'editing';
type RightTab = 'assets' | 'drafts';

interface AiState {
  isGenerating: boolean;
  selectedPackageId: string;
  packages: TourPackage[];
  topic: string;
  tagline: string;
  testimonialQuote: string;
  testimonialName: string;
  testimonialBatch: string;
}

export const PosterEditor: React.FC = () => {
  const [view, setView] = useState<View>('pick-template');
  const [template, setTemplate] = useState<PosterTemplate | null>(null);
  const [fieldValues, setFieldValues] = useState<FieldValues>({});
  const [activeImageField, setActiveImageField] = useState<string | null>(null);
  const [rightTab, setRightTab] = useState<RightTab>('drafts');
  const [isExporting, setIsExporting] = useState(false);
  const [showBlockBuilder, setShowBlockBuilder] = useState(false);
  const [refreshTemplates, setRefreshTemplates] = useState(0);
  const [ai, setAi] = useState<AiState>({
    isGenerating: false,
    selectedPackageId: '',
    packages: [],
    topic: '',
    tagline: '',
    testimonialQuote: '',
    testimonialName: '',
    testimonialBatch: '',
  });

  useEffect(() => {
    supabase.from('packages').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data && data.length > 0) {
        setAi(prev => ({ ...prev, packages: data, selectedPackageId: data[0].id }));
      }
    });
  }, []);

  const handleSelectTemplate = (t: PosterTemplate) => {
    setTemplate(t);
    setFieldValues({});
    setView('editing');
  };

  const handleFieldChange = useCallback((id: string, value: string) => {
    setFieldValues(prev => ({ ...prev, [id]: value }));
  }, []);

  const handlePickImage = (fieldId: string) => {
    setActiveImageField(fieldId);
    setRightTab('assets');
  };

  const handleImageSelected = (url: string) => {
    if (activeImageField) {
      setFieldValues(prev => ({ ...prev, [activeImageField]: url }));
      setActiveImageField(null);
    }
  };

  const handleLoadDraft = (templateId: string, values: FieldValues) => {
    const found = CODE_TEMPLATES.find(t => t.id === templateId);
    if (found) {
      setTemplate(found);
      setFieldValues(values);
      setView('editing');
    }
  };

  const handleExport = async (pixelRatio: 2 | 4) => {
    if (!template) return;
    setIsExporting(true);
    try {
      await exportPosterPng(template, fieldValues, pixelRatio);
    } finally {
      setIsExporting(false);
    }
  };

  const handleAiAutofill = async () => {
    if (!template) return;
    const inputs: AutofillInputs = {
      templateType: template.category,
      fieldValues,
    };
    if (template.category === 'conversion') {
      inputs.package = ai.packages.find(p => p.id === ai.selectedPackageId);
    } else if (template.category === 'edu-reminder') {
      inputs.topic = ai.topic;
    } else if (template.category === 'aspiration') {
      inputs.tagline = ai.tagline;
    } else if (template.category === 'social-proof') {
      inputs.testimonial = { quote: ai.testimonialQuote, name: ai.testimonialName, batch: ai.testimonialBatch };
    }

    setAi(prev => ({ ...prev, isGenerating: true }));
    try {
      const updated = await applyAutofill(inputs);
      setFieldValues(updated);
    } finally {
      setAi(prev => ({ ...prev, isGenerating: false }));
    }
  };

  const renderAiInputs = () => {
    if (!template || template.category === 'blank') return null;
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 mt-3">
        <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" /> AI Magic Fill
        </h3>
        <div className="space-y-3">
          {template.category === 'conversion' && (
            <select
              value={ai.selectedPackageId}
              onChange={e => setAi(prev => ({ ...prev, selectedPackageId: e.target.value }))}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:border-primary outline-none"
            >
              {ai.packages.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          )}
          {template.category === 'edu-reminder' && (
            <input type="text" value={ai.topic} onChange={e => setAi(prev => ({ ...prev, topic: e.target.value }))}
              placeholder="Topik (contoh: Tips Umroh)" className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:border-primary outline-none" />
          )}
          {template.category === 'aspiration' && (
            <textarea value={ai.tagline} onChange={e => setAi(prev => ({ ...prev, tagline: e.target.value }))}
              placeholder="Tagline kustom (opsional, AI generate jika kosong)" rows={2}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:border-primary outline-none resize-none" />
          )}
          {template.category === 'social-proof' && (
            <div className="space-y-2">
              <textarea value={ai.testimonialQuote} onChange={e => setAi(prev => ({ ...prev, testimonialQuote: e.target.value }))}
                placeholder="Kutipan testimoni (opsional)" rows={2}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:border-primary outline-none resize-none" />
              <input type="text" value={ai.testimonialName} onChange={e => setAi(prev => ({ ...prev, testimonialName: e.target.value }))}
                placeholder="Nama jamaah" className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:border-primary outline-none" />
              <input type="text" value={ai.testimonialBatch} onChange={e => setAi(prev => ({ ...prev, testimonialBatch: e.target.value }))}
                placeholder="Rombongan (Umroh Syawal, Maret 2026)" className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:border-primary outline-none" />
            </div>
          )}
          <button onClick={handleAiAutofill} disabled={ai.isGenerating}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition disabled:opacity-50">
            {ai.isGenerating ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate & Terapkan
          </button>
        </div>
      </div>
    );
  };

  if (view === 'pick-template') {
    return (
      <div className="flex flex-col gap-4" style={{ height: 'calc(100vh - 64px)' }}>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Poster Maker</h1>
          <p className="mt-1 text-sm text-gray-500">Pilih template untuk mulai membuat poster marketing.</p>
        </div>
        <div className="flex-1 min-h-0">
          <TemplateSelector
            key={refreshTemplates}
            onSelect={handleSelectTemplate}
            onNewTemplate={() => setShowBlockBuilder(true)}
          />
        </div>
        {showBlockBuilder && (
          <BlockBuilder
            onClose={() => setShowBlockBuilder(false)}
            onSaved={() => { setRefreshTemplates(k => k + 1); setShowBlockBuilder(false); }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0 overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 px-0 py-3 flex-shrink-0 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('pick-template')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition">
            <LayoutTemplate className="w-4 h-4" /> Ganti Template
          </button>
          {template && (
            <span className="text-sm font-semibold text-gray-800">{template.name}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => handleExport(2)} disabled={isExporting || !template}
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:border-primary hover:text-primary transition disabled:opacity-40">
            <Download className="w-4 h-4" /> Ekspor
          </button>
          <button onClick={() => handleExport(4)} disabled={isExporting || !template}
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:border-primary hover:text-primary transition disabled:opacity-40">
            <Printer className="w-4 h-4" /> Cetak (4×)
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 min-h-0 gap-0">
        {/* Left sidebar — field form */}
        <div className="w-80 flex-shrink-0 border-r border-gray-200 overflow-y-auto p-4 bg-white">
          {template && (
            <>
              <FieldForm
                template={template}
                values={fieldValues}
                onChange={handleFieldChange}
                onPickImage={handlePickImage}
              />
              {renderAiInputs()}
            </>
          )}
        </div>

        {/* Center — live preview */}
        <div className="flex-1 min-w-0 bg-gray-100 flex items-center justify-center p-8 overflow-hidden">
          {template && (
            <div className="w-full max-w-sm">
              <LivePreview template={template} fieldValues={fieldValues} />
            </div>
          )}
        </div>

        {/* Right sidebar — assets + drafts */}
        <div className="w-72 flex-shrink-0 border-l border-gray-200 flex flex-col bg-white">
          <div className="flex border-b border-gray-200 flex-shrink-0">
            {(['drafts', 'assets'] as RightTab[]).map(tab => (
              <button key={tab} onClick={() => setRightTab(tab)}
                className={`flex-1 py-2.5 text-xs font-semibold capitalize transition ${rightTab === tab ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}>
                {tab === 'drafts' ? 'Draft' : 'Foto'}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {rightTab === 'assets' && (
              <AssetPanel onAddImage={handleImageSelected} />
            )}
            {rightTab === 'drafts' && template && (
              <DraftPanel template={template} fieldValues={fieldValues} onLoadDraft={handleLoadDraft} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PosterEditor;
