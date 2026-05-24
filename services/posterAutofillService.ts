import { supabase } from '@/src/lib/supabase';
import { TemplateCategory, FieldValues } from '@/src/components/admin/PosterMaker/types';
import { TourPackage } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export type TemplateType = TemplateCategory;

export interface AutofillInputs {
  templateType: TemplateType;
  fieldValues: FieldValues;
  package?: TourPackage;
  topic?: string;
  tagline?: string;
  testimonial?: { quote: string; name: string; batch: string };
}

export const applyAutofill = async (inputs: AutofillInputs): Promise<FieldValues> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return inputs.fieldValues;

    const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-poster-autofill`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(inputs),
    });

    if (!res.ok) return inputs.fieldValues;
    const json = await res.json();
    return json.fieldValues ?? inputs.fieldValues;
  } catch (err) {
    console.error('posterAutofillService error:', err);
    return inputs.fieldValues;
  }
};
