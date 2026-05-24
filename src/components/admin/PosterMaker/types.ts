// src/components/admin/PosterMaker/types.ts

import React from 'react';

export type AspectRatio = 'post' | 'story';
export type TemplateCategory = 'conversion' | 'edu-reminder' | 'aspiration' | 'social-proof' | 'blank';
export type FieldType = 'text' | 'textarea' | 'image' | 'color';

export interface FieldSchema {
  id: string;
  label: string;
  type: FieldType;
  maxLength?: number;
  placeholder?: string;
}

export type FieldValues = Record<string, string>;

export interface PosterTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  aspectRatio: AspectRatio;
  previewColors: [string, string, string];
  fields: FieldSchema[];
  Component: React.FC<FieldValues>;
}

export type BlockType =
  | 'HeaderBlock'
  | 'HeroImageBlock'
  | 'TextBlock'
  | 'DetailsGrid'
  | 'TestimonialBlock'
  | 'PromoBlock'
  | 'FooterBlock';

export interface BlockConfig {
  type: BlockType;
  config: {
    padding?: 'sm' | 'md' | 'lg';
    background?: string;
    fontSize?: 'sm' | 'md' | 'lg';
    imageFit?: 'cover' | 'contain';
    textAlign?: 'left' | 'center' | 'right';
  };
}

export interface SavedTemplate {
  id: string;
  name: string;
  description: string;
  aspect_ratio: AspectRatio;
  template_type: string;
  blocks: BlockConfig[] | null;
  field_schema: FieldSchema[] | null;
  canvas_json: object | null;
  thumbnail_data_url?: string;
  thumbnail_url?: string;
  starter_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PosterDraft {
  id: string;
  name: string;
  templateId: string;
  aspectRatio: AspectRatio;
  fieldValues: FieldValues;
  thumbnail: string;
  createdAt: number;
}
