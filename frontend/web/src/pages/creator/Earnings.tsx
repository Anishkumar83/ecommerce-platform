import { useState, useEffect, useCallback, useMemo } from 'react';
import { Wallet, Clock, CheckCircle2, Coins, Info } from 'lucide-react';
import PortalShell from '../../components/shared/PortalShell';
import PageHeader from '../../components/shared/PageHeader';
import StatTile, { inr } from '../../components/shared/StatTile';
import RewardSummary from '../../components/shared/RewardSummary';
import EmptyState from '../../components/shared/EmptyState';
import ErrorState from '../../components/shared/ErrorState';
import { SkeletonLine } from '../../components/shared/LoadingSkeleton';
import { useAuth } from '../../core/auth/AuthContext';
import { trackingService } from '../../core/services/tracking.service';
import { creatorService } from '../../core/services/creator.service';
import type { EarningRecord, EarningState, CampaignParticipation } from '../../core/models';

const KIND_LABELS: Record<EarningRecord['kind'], string> = {
  CONTENT_FEE: 'Content Fee',
  SALES_COMMISSION: 'Sales Commission',
  BONUS: 'Bonus',
};

const STATE_GROUPS: { id: EarningState; label: string; hint: string }[] = [
  { id: 'PENDING', label: 'Pending', hint: 'Earned, awaiting approval' },
  { id: 'APPROVED', label: 'Approved', hint: 'Approved, queued for payout' },
  { id: 'PAID', label: 'Paid', hint: 'Already paid out to you' },
];

export default function CreatorEarnings() {
  const { currentUser } = useAuth();
  const creatorId = currentUser?.creatorId ?? 'CRT260822A01';

  const [summary, setSummary] = useState({ pending: 0, approved: 0, paid: 0, lifetime: 0 });
  const [earnings, setEarnings] = useState<EarningRecord[]>([]);
  const [participations, setParticipations] = useState<CampaignParticipation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    Promise.all([
      trackingService.getEarningsSummary(creatorId),
      trackingService.getEarnings(creatorId),
      creatorService.getParticipations({ participantId: creatorId, role: 'CREATOR' }),
    ])
      .then(([s, e, p]) => { setSummary(s); setEarnings(e); setParticipations(p); })
      .catch(() => setError('Could not load your earnings right now.'))
      .finally(() => setLoading(false));
  }, [creatorId]);

  useEffect(() => { load(); }, [load]);

  const exampleParticipation = useMemo(
    () => participations.find(p => p.reward.model === 'TIERED') ?? participations[0],
    [participations]
  );

  return (
    <PortalShell type="creator">
      <PageHeader title="Earnings" subtitle="What you've made from Content Fees, Sales Commission, and bonuses." />

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonLine key={i} height="h-24" />)}
          </div>
          <SkeletonLine height="h-64" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatTile label="Pending" value={inr(summary.pending)} icon={<Clock size={15} />} tone="warning" />
            <StatTile label="Approved" value={inr(summary.approved)} icon={<CheckCircle2 size={15} />} tone="brand" />
            <StatTile label="Paid" value={inr(summary.paid)} icon={<Coins size={15} />} tone="positive" />
            <StatTile label="Lifetime" value={inr(summary.lifetime)} icon={<Wallet size={15} />} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {STATE_GROUPS.map(g => {
                const rows = earnings.filter(e => e.state === g.id);
                if (rows.length === 0) return null;
                return (
                  <div key={g.id}>
                    <h2 className="text-sm font-bold text-gray-800 mb-1">{g.label}</h2>
                    <p className="text-xs text-gray-400 mb-3">{g.hint}</p>
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100 bg-gray-50/50 text-left">
                            <th className="py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Kind</th>
                            <th className="py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Campaign</th>
                            <th className="py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Eligible Sale</th>
                            <th className="py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Rate</th>
                            <th className="py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {rows.map(e => (
                            <tr key={e.referenceId}>
                              <td className="py-3 px-4">
                                <span className="text-xs font-bold bg-gray-100 text-gray-700 rounded-full px-2 py-0.5">{KIND_LABELS[e.kind]}</span>
                              </td>
                              <td className="py-3 px-4 text-gray-600">
                                <p className="line-clamp-1">{e.campaignName ?? '—'}</p>
                                {e.productName && <p className="text-xs text-gray-400 line-clamp-1">{e.productName}</p>}
                              </td>
                              <td className="py-3 px-4 text-right tabular-nums text-gray-600">{e.eligibleSale !== undefined ? inr(e.eligibleSale) : '—'}</td>
                              <td className="py-3 px-4 text-right tabular-nums text-gray-600">{e.rate !== undefined ? `${e.rate}%` : '—'}</td>
                              <td className="py-3 px-4 text-right tabular-nums font-bold text-gray-900">{inr(e.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}

              {earnings.length === 0 && (
                <EmptyState icon={Wallet} title="No earnings yet" message="Your Content Fees and Sales Commission will show up here as you publish content." />
              )}
            </div>

            <div>
              <h2 className="text-sm font-bold text-gray-800 mb-3">How this is calculated</h2>
              {exampleParticipation ? (
                <RewardSummary reward={exampleParticipation.reward} exampleSale={exampleParticipation.reward.model === 'FIXED' ? undefined : 25000} salesCount={40} />
              ) : (
                <p className="text-sm text-gray-400 bg-white rounded-xl border border-gray-100 py-8 text-center px-4">
                  Join a campaign to see a worked example of how you're paid.
                </p>
              )}
              <p className="flex items-start gap-2 text-xs text-gray-400 mt-3 px-1">
                <Info size={13} className="shrink-0 mt-0.5" />
                A Content Fee is paid once your content is approved, regardless of sales. Sales Commission is paid on orders attributed to you within the reward's attribution window.
              </p>
            </div>
          </div>
        </>
      )}
    </PortalShell>
  );
}
