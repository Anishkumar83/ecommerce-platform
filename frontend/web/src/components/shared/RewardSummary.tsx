import type { RewardConfig } from '../../core/models';
import { rateForSales, commissionFor, rewardLabel } from '../../core/services/tracking.service';
import { inr } from './StatTile';

interface RewardSummaryProps {
  reward: RewardConfig;
  /** When given, shows a worked example against this sale value. */
  exampleSale?: number;
  /** Sales made so far, used to pick the active tier. */
  salesCount?: number;
  compactView?: boolean;
  className?: string;
}

/**
 * Shows what a participant earns. Deliberately never uses the word "margin" —
 * creators see a Content Fee and a Sales Commission, which is what they are.
 */
export default function RewardSummary({ reward, exampleSale, salesCount = 0, compactView = false, className = '' }: RewardSummaryProps) {
  const activeRate = rateForSales(reward, salesCount);
  const commission = exampleSale !== undefined ? commissionFor(reward, exampleSale, salesCount) : null;

  if (compactView) {
    return (
      <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs ${className}`}>
        <span className="text-gray-500">Content Fee <b className="text-gray-900 tabular-nums">{inr(reward.contentFee)}</b></span>
        <span className="text-gray-500">Sales Commission <b className="text-gray-900">{rewardLabel(reward)}</b></span>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-gray-100 bg-white overflow-hidden ${className}`}>
      <div className="grid grid-cols-2 divide-x divide-gray-100">
        <div className="p-4">
          <p className="text-xs text-gray-500 mb-1">Content Fee</p>
          <p className="text-lg font-bold font-display text-gray-900 tabular-nums">{inr(reward.contentFee)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Paid on approval, regardless of sales</p>
        </div>
        <div className="p-4">
          <p className="text-xs text-gray-500 mb-1">Sales Commission</p>
          <p className="text-lg font-bold font-display text-brand-700 tabular-nums">{rewardLabel(reward)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{reward.cookieWindowDays}-day attribution window</p>
        </div>
      </div>

      {reward.model === 'TIERED' && (reward.tiers?.length ?? 0) > 0 && (
        <div className="border-t border-gray-100 px-4 py-3">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Commission tiers</p>
          <div className="space-y-1">
            {reward.tiers!.map((t, i) => {
              const active = salesCount >= t.minSales && (t.maxSales === null || salesCount <= t.maxSales);
              return (
                <div
                  key={i}
                  className={`flex items-center justify-between text-xs rounded-lg px-2.5 py-1.5 ${active ? 'bg-brand-50 text-brand-800 font-semibold' : 'text-gray-600'}`}
                >
                  <span className="tabular-nums">
                    {t.minSales}–{t.maxSales === null ? '∞' : t.maxSales} sales
                  </span>
                  <span className="tabular-nums">{t.percentage}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {commission !== null && (
        <div className="border-t border-gray-100 bg-gray-50/70 px-4 py-3">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Worked example</p>
          <dl className="space-y-1 text-xs">
            <div className="flex justify-between"><dt className="text-gray-500">Eligible Sale</dt><dd className="tabular-nums text-gray-800">{inr(exampleSale!)}</dd></div>
            {reward.model !== 'FIXED' && (
              <div className="flex justify-between"><dt className="text-gray-500">Rate applied</dt><dd className="tabular-nums text-gray-800">{activeRate}%</dd></div>
            )}
            <div className="flex justify-between pt-1 border-t border-gray-200">
              <dt className="font-semibold text-gray-700">Commission</dt>
              <dd className="tabular-nums font-bold text-brand-700">{inr(commission)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-semibold text-gray-700">Total for this piece</dt>
              <dd className="tabular-nums font-bold text-gray-900">{inr(commission + reward.contentFee)}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
