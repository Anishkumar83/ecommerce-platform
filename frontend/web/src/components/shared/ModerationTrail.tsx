import { Check, Loader2, ShieldCheck, Eye, Upload, X, Pause } from 'lucide-react';
import type { CreatorContentState, ModerationEvent } from '../../core/models';

/**
 * The pipeline every uploaded photo or video walks:
 *   UPLOADING → SCANNING → UNDER_REVIEW → APPROVED → PUBLISHED
 * with REJECTED and SUSPENDED as terminal branches. No moderation service runs
 * behind this yet — the states exist so the frontend already reflects the
 * architecture the backend will grow into.
 */
const PIPELINE: { state: CreatorContentState; label: string; icon: typeof Check }[] = [
  { state: 'UPLOADING', label: 'Uploading', icon: Upload },
  { state: 'SCANNING', label: 'Scanning', icon: ShieldCheck },
  { state: 'UNDER_REVIEW', label: 'Under Review', icon: Eye },
  { state: 'APPROVED', label: 'Approved', icon: Check },
  { state: 'PUBLISHED', label: 'Published', icon: Check },
];

const TERMINAL: Partial<Record<CreatorContentState, { label: string; icon: typeof X; cls: string }>> = {
  REJECTED: { label: 'Rejected', icon: X, cls: 'bg-red-100 text-red-600 ring-2 ring-red-300' },
  SUSPENDED: { label: 'Suspended', icon: Pause, cls: 'bg-amber-100 text-amber-700 ring-2 ring-amber-300' },
};

export function moderationLabel(state: CreatorContentState): string {
  return (
    TERMINAL[state]?.label ??
    PIPELINE.find(p => p.state === state)?.label ??
    (state === 'DRAFT' ? 'Draft' : state)
  );
}

/** Small pill for lists and cards. */
export function ModerationBadge({ state, size = 'md' }: { state: CreatorContentState; size?: 'sm' | 'md' }) {
  const tone =
    state === 'PUBLISHED' || state === 'APPROVED' ? 'bg-emerald-50 text-emerald-700'
    : state === 'REJECTED' ? 'bg-red-50 text-red-700'
    : state === 'SUSPENDED' ? 'bg-amber-50 text-amber-700'
    : state === 'DRAFT' ? 'bg-gray-100 text-gray-500'
    : 'bg-blue-50 text-blue-700';
  const spinning = state === 'UPLOADING' || state === 'SCANNING';
  return (
    <span className={`inline-flex items-center gap-1 font-semibold rounded-full ${tone} ${size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'}`}>
      {spinning && <Loader2 size={size === 'sm' ? 9 : 11} className="animate-spin" />}
      {moderationLabel(state)}
    </span>
  );
}

interface ModerationTrailProps {
  state: CreatorContentState;
  events?: ModerationEvent[];
  rejectionReason?: string;
  orientation?: 'horizontal' | 'vertical';
}

export default function ModerationTrail({ state, events = [], rejectionReason, orientation = 'horizontal' }: ModerationTrailProps) {
  const terminal = TERMINAL[state];
  const currentIndex = PIPELINE.findIndex(p => p.state === state);

  if (orientation === 'vertical') {
    return (
      <div className="space-y-0">
        {events.map((e, i) => {
          const bad = e.state === 'REJECTED' || e.state === 'SUSPENDED';
          return (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  bad ? 'bg-red-100 text-red-600' : 'bg-brand-100 text-brand-700'
                }`}>
                  {bad ? <X size={11} /> : <Check size={11} />}
                </span>
                {i < events.length - 1 && <span className="w-px grow bg-gray-200 my-1" />}
              </div>
              <div className="pb-4 min-w-0">
                <p className="text-xs font-semibold text-gray-800">{moderationLabel(e.state)}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{e.description}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {new Date(e.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  {e.actor ? ` · ${e.actor}` : ''}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center">
        {PIPELINE.map((step, i) => {
          const done = currentIndex >= 0 && i < currentIndex;
          const current = i === currentIndex;
          const Icon = step.icon;
          const spinning = current && (step.state === 'UPLOADING' || step.state === 'SCANNING');
          return (
            <div key={step.state} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  terminal ? 'bg-gray-100 text-gray-300'
                  : done ? 'bg-brand-600 text-white'
                  : current ? 'bg-brand-100 text-brand-700 ring-2 ring-brand-400'
                  : 'bg-gray-100 text-gray-400'
                }`}>
                  {spinning ? <Loader2 size={13} className="animate-spin" /> : <Icon size={13} />}
                </span>
                <span className={`text-[10px] font-medium text-center whitespace-nowrap ${
                  current && !terminal ? 'text-brand-700' : done ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  {step.label}
                </span>
              </div>
              {i < PIPELINE.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1.5 mb-4 ${done && !terminal ? 'bg-brand-600' : 'bg-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>

      {terminal && (
        <div className={`mt-3 flex items-start gap-2 rounded-lg px-3 py-2.5 ${
          state === 'REJECTED' ? 'bg-red-50' : 'bg-amber-50'
        }`}>
          <terminal.icon size={14} className={state === 'REJECTED' ? 'text-red-600 mt-0.5' : 'text-amber-600 mt-0.5'} />
          <div>
            <p className={`text-xs font-semibold ${state === 'REJECTED' ? 'text-red-800' : 'text-amber-800'}`}>{terminal.label}</p>
            {rejectionReason && <p className="text-xs text-gray-600 mt-0.5">{rejectionReason}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
