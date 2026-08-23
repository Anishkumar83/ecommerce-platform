import { type ReactNode } from 'react';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
  /** 'underline' for page-level sections, 'pill' for filters inside a card. */
  variant?: 'underline' | 'pill';
  className?: string;
}

export default function Tabs({ tabs, active, onChange, variant = 'underline', className = '' }: TabsProps) {
  if (variant === 'pill') {
    return (
      <div className={`flex items-center gap-1.5 flex-wrap ${className}`} role="tablist">
        {tabs.map(t => {
          const on = t.id === active;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={on}
              onClick={() => onChange(t.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                on
                  ? 'bg-brand-600 border-brand-600 text-white'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-brand-300 hover:text-brand-700'
              }`}
            >
              {t.icon}
              {t.label}
              {t.count !== undefined && (
                <span className={`text-[10px] tabular-nums ${on ? 'text-white/70' : 'text-gray-400'}`}>{t.count}</span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`border-b border-gray-200 ${className}`}>
      <div className="flex items-center gap-1 overflow-x-auto" role="tablist">
        {tabs.map(t => {
          const on = t.id === active;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={on}
              onClick={() => onChange(t.id)}
              className={`relative inline-flex items-center gap-2 px-3.5 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors ${
                on ? 'text-brand-700' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {t.icon}
              {t.label}
              {t.count !== undefined && (
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full tabular-nums ${on ? 'bg-brand-50 text-brand-700' : 'bg-gray-100 text-gray-500'}`}>
                  {t.count}
                </span>
              )}
              {on && <span className="absolute left-2 right-2 -bottom-px h-0.5 bg-brand-600 rounded-full" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
