// src/components/admin/PosterMaker/FieldForm.tsx
import React from 'react';
import { FieldSchema, FieldValues, PosterTemplate } from './types';

interface Props {
  template: PosterTemplate;
  values: FieldValues;
  onChange: (id: string, value: string) => void;
  onPickImage: (fieldId: string) => void;
}

const BRAND_COLORS = ['#0084FF','#0066CC','#F59E0B','#0F172A','#FFFFFF','#22C55E','#EF4444','#8B5CF6'];

export const FieldForm: React.FC<Props> = ({ template, values, onChange, onPickImage }) => (
  <div className="space-y-4">
    {template.fields.map((field: FieldSchema) => (
      <div key={field.id}>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
          {field.label}
        </label>
        {field.type === 'text' && (
          <input
            type="text"
            value={values[field.id] ?? ''}
            onChange={e => onChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            maxLength={field.maxLength}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
        )}
        {field.type === 'textarea' && (
          <textarea
            value={values[field.id] ?? ''}
            onChange={e => onChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            rows={3}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
          />
        )}
        {field.type === 'image' && (
          <div className="space-y-2">
            {values[field.id] && (
              <img src={values[field.id]} alt="preview" className="w-full h-24 object-cover rounded-lg border border-gray-200" />
            )}
            <div className="flex gap-2">
              <button
                onClick={() => onPickImage(field.id)}
                className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 text-gray-600 hover:border-primary hover:text-primary transition text-center"
              >
                {values[field.id] ? 'Ganti Foto' : 'Pilih Foto'}
              </button>
              {values[field.id] && (
                <button
                  onClick={() => onChange(field.id, '')}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-2 text-red-400 hover:border-red-400 transition"
                >
                  Hapus
                </button>
              )}
            </div>
          </div>
        )}
        {field.type === 'color' && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {BRAND_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => onChange(field.id, c)}
                  style={{ background: c }}
                  className={`w-8 h-8 rounded-full border-2 transition ${values[field.id] === c ? 'border-primary scale-110' : 'border-gray-200'}`}
                  title={c}
                />
              ))}
            </div>
            <input
              type="color"
              value={values[field.id] || '#0084FF'}
              onChange={e => onChange(field.id, e.target.value)}
              className="w-full h-8 rounded cursor-pointer border border-gray-200"
            />
          </div>
        )}
      </div>
    ))}
  </div>
);
