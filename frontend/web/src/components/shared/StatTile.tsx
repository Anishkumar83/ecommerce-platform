import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatTileProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: ReactNode;
  /** Percentage change against the previous period. */
  delta?: number;
  tone?: 'neutral' | 'brand' | 'positive' | 'warning';
  className?: string;
}

const TONE: Record<NonNullable<StatTileProps['tone']>, string> = {
  neutral: 'text-gray-900',
  brand: 'text-brand-700',
  positive: 'text-emerald-700',
  warning: 'text-amber-700',
};

export default function StatTile({ label, value, sublabel, icon, delta, tone = 'neutral', className = '' }: StatTileProps) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 p-4 ${className}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-gray-500">{label}</span>
        {icon && <span className="text-gray-300 shrink-0">{icon}</span>}
      </div>
      <p className={`text-xl font-bold font-display tabular-nums leading-none ${TONE[tone]}`}>{value}</p>
      <div className="flex items-center gap-2 mt-1.5 min-h-[16px]">
        {delta !== undefined && (
          <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums ${delta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {delta >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {delta >= 0 ? '+' : ''}{delta}%
          </span>
        )}
        {sublabel && <span className="text-[11px] text-gray-400">{sublabel}</span>}
      </div>
    </div>
  );
}

/** Formats a count as 1.2K / 3.4M so metric rows stay narrow. */
export function compact(n: number): string {
  if (n >= 10000000) return `${(n / 10000000).toFixed(1).replace(/\.0$/, '')}Cr`;
  if (n >= 100000) return `${(n / 100000).toFixed(1).replace(/\.0$/, '')}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}

/** Indian-format rupees, no decimals. */
export function inr(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}
