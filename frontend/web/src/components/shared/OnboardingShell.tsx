import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import ZhaLogo from './ZhaLogo';

interface OnboardingShellProps {
  /** Card heading for the current step. */
  title: string;
  subtitle?: ReactNode;
  /** Short labels for every step, in order. */
  steps: string[];
  /** 0-indexed position of the active step. */
  current: number;
  children: ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  /** Shown next to the Continue button when it is disabled, e.g. "Add at least one category". */
  nextDisabledReason?: string;
  submitting?: boolean;
  /** Hide the Back/Continue footer entirely — used for the success screen. */
  hideFooter?: boolean;
  /** Narrower card for a chooser or success screen. */
  maxWidthClass?: string;
}

export default function OnboardingShell({
  title,
  subtitle,
  steps,
  current,
  children,
  onBack,
  onNext,
  nextLabel = 'Continue',
  nextDisabled = false,
  nextDisabledReason,
  submitting = false,
  hideFooter = false,
  maxWidthClass = 'max-w-2xl',
}: OnboardingShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 flex flex-col items-center px-4 py-8">
      <div className={`w-full ${maxWidthClass}`}>
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2">
            <ZhaLogo size={40} fill="translucent" wordmarkClass="text-white" />
          </Link>
        </div>

        {steps.length > 0 && (
          <div className="mb-6">
            {/* Mobile: collapsed step counter */}
            <div className="sm:hidden text-center">
              <p className="text-white/60 text-xs font-semibold tracking-wide">
                Step {current + 1} of {steps.length}
              </p>
              <p className="text-white text-sm font-bold mt-0.5">{steps[current]}</p>
              <div className="h-1 bg-white/15 rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${((current + 1) / steps.length) * 100}%` }}
                />
              </div>
            </div>

            {/* sm+: full step rail */}
            <div className="hidden sm:flex items-start">
              {steps.map((label, i) => {
                const state = i < current ? 'done' : i === current ? 'current' : 'upcoming';
                return (
                  <div key={label} className={`flex items-center ${i < steps.length - 1 ? 'flex-1' : ''}`}>
                    <div className="flex flex-col items-center gap-1.5 shrink-0 w-20">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          state === 'done'
                            ? 'bg-white text-brand-700'
                            : state === 'current'
                              ? 'bg-white/20 text-white border-2 border-white'
                              : 'bg-white/10 text-white/50'
                        }`}
                      >
                        {state === 'done' ? <Check size={13} /> : i + 1}
                      </div>
                      <span
                        className={`text-[10px] font-semibold text-center leading-tight ${
                          state === 'upcoming' ? 'text-white/40' : 'text-white/85'
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                    {i < steps.length - 1 && (
                      <div className={`h-px flex-1 mx-1 -mt-4 ${i < current ? 'bg-white/60' : 'bg-white/15'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="mb-6">
            <h1 className="text-lg sm:text-xl font-bold font-display text-gray-900">{title}</h1>
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          </div>

          {children}

          {!hideFooter && (
            <div className="mt-8 pt-6 border-t border-gray-100">
              {nextDisabled && nextDisabledReason && (
                <p className="text-xs text-amber-600 font-semibold mb-3 text-right">{nextDisabledReason}</p>
              )}
              <div className="flex items-center justify-between gap-3">
                {onBack ? (
                  <button
                    type="button"
                    onClick={onBack}
                    className="px-4 py-2.5 border border-gray-200 bg-white text-gray-700 text-sm font-bold rounded-xl hover:border-brand-300 hover:text-brand-700"
                  >
                    Back
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={onNext}
                  disabled={nextDisabled || submitting}
                  className="px-5 py-2.5 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {submitting ? 'Submitting…' : nextLabel}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
