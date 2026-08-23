import { Check } from 'lucide-react';

interface TimelineStep {
  label: string;
  sublabel?: string;
  completed: boolean;
  current?: boolean;
  error?: boolean;
}

interface WorkflowTimelineProps {
  steps: TimelineStep[];
  orientation?: 'vertical' | 'horizontal';
}

export default function WorkflowTimeline({ steps, orientation = 'vertical' }: WorkflowTimelineProps) {
  if (orientation === 'horizontal') {
    return (
      <div className="flex items-center">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                step.error ? 'bg-red-100 text-red-600 ring-2 ring-red-400' :
                step.completed ? 'bg-brand-600 text-white' :
                step.current ? 'bg-brand-100 text-brand-700 ring-2 ring-brand-400' :
                'bg-gray-100 text-gray-400'
              }`}>
                {step.completed && !step.error ? <Check size={14} /> : i + 1}
              </div>
              <span className={`text-xs font-medium text-center ${step.current ? 'text-brand-700' : step.completed ? 'text-gray-700' : 'text-gray-400'}`}>{step.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-5 ${step.completed ? 'bg-brand-600' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {steps.map((step, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              step.error ? 'bg-red-100 text-red-600' :
              step.completed ? 'bg-brand-600 text-white' :
              step.current ? 'bg-brand-100 text-brand-700 ring-2 ring-brand-400' :
              'bg-gray-100 text-gray-400'
            }`}>
              {step.completed && !step.error ? <Check size={13} /> : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className={`w-0.5 flex-1 mt-1 mb-1 ${step.completed ? 'bg-brand-200' : 'bg-gray-100'}`} style={{ minHeight: 24 }} />
            )}
          </div>
          <div className="pb-4">
            <p className={`text-sm font-semibold ${step.current ? 'text-brand-700' : step.completed ? 'text-gray-800' : 'text-gray-400'}`}>{step.label}</p>
            {step.sublabel && <p className="text-xs text-gray-500 mt-0.5">{step.sublabel}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
