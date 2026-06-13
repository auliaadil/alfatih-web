import React from 'react';
import { Check } from 'lucide-react';

export interface WizardStep {
  number: number;
  label: string;
  description: string;
}

interface Props {
  steps: WizardStep[];
  currentStep: number;
}

const WizardSidebar: React.FC<Props> = ({ steps, currentStep }) => (
  <aside className="w-64 shrink-0 bg-gray-950 text-gray-300 rounded-2xl p-6 self-start sticky top-6">
    <h2 className="text-white font-bold text-base mb-6">Create Package</h2>
    <div className="space-y-1">
      {steps.map((step) => {
        const done = step.number < currentStep;
        const active = step.number === currentStep;
        return (
          <div
            key={step.number}
            className={`flex items-start gap-3 rounded-xl px-3 py-3 transition-colors ${active ? 'bg-white/10' : ''}`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold mt-0.5 transition-colors
                ${done ? 'bg-green-500 text-white' : active ? 'bg-white text-gray-950' : 'bg-gray-700 text-gray-400'}`}
            >
              {done ? <Check className="w-3.5 h-3.5" /> : step.number}
            </div>
            <div>
              <p className={`text-sm font-medium ${active ? 'text-white' : done ? 'text-gray-300' : 'text-gray-500'}`}>
                {step.label}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  </aside>
);

export default WizardSidebar;
