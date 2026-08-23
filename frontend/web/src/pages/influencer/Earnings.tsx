import { useEffect, useMemo, useState } from 'react';
import { Wallet, Clock, CheckCircle2, IndianRupee, MousePointerClick, Package, TrendingUp } from 'lucide-react';
import PortalShell from '../../components/shared/PortalShell';
import PageHeader from '../../components/shared/PageHeader';
import StatTile, { compact, inr } from '../../components/shared/StatTile';
import RewardSummary from '../../components/shared/RewardSummary';
import StatusBadge from '../../components/shared/StatusBadge';
import DataTable, { type Column } from '../../components/shared/DataTable';
import ErrorState from '../../components/shared/ErrorState';
import { SkeletonLine } from '../../components/shared/LoadingSkeleton';
import { useAuth } from '../../core/auth/AuthContext';
import { trackingService } from '../../core/services/tracking.service';
import { creatorService } from '../../core/services/creator.service';
import type { EarningRecord, AttributionRecord, CampaignParticipation, RewardConfig } from '../../core/models';

const KIND_LABEL: Record<EarningRecord['kind'], string> = {
  CONTENT_FEE: 'Content Fee',
  SALES_COMMISSION: 'Sales Commission',
  BONUS: 'Bonus',
};

interface CampaignAttribution {
  campaignId: string;
  campaignName: string;
  clicks: number;
  orders: number;
  revenue: number;
  commission: number;
}

export default function InfluencerEarnings() {
  const { currentUser } = useAuth();
  const participantId = currentUser?.creatorId ?? 'CRT260822A01';

  const [summary, setSummary] = useState<{ pending: number; approved: number; paid: number; lifetime: number } | null>(null);
  const [earnings, setEarnings] = useState<EarningRecord[]>([]);
  const [attribution, setAttribution] = useState<AttributionRecord[]>([]);
  const [participations, setParticipations] = useState<CampaignParticipation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    Promise.all([
      trackingService.getEarningsSummary(participantId),
      trackingService.getEarnings(participantId),
      trackingService.getAttribution({ participantId }),
      creatorService.getParticipations({ participantId, role: 'INFLUENCER' }),
    ])
      .then(([s, e, a, p]) => {
        setSummary(s);
        setEarnings(e);
        setAttribution(a);
        setParticipations(p);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(load, [participantId]);

  const campaignBreakdown: CampaignAttribution[] = useMemo(() => {
    const linkDriven = attribution.filter(a => a.source === 'TRACKING_LINK');
    const byCampaign = new Map<string, CampaignAttribution>();
    for (const a of linkDriven) {
      const existing = byCampaign.get(a.campaignId);
      if (existing) {
        existing.clicks += a.clicks;
        existing.orders += a.orders;
        existing.revenue += a.revenue;
        existing.commission += a.commission;
      } else {
        byCampaign.set(a.campaignId, {
          campaignId: a.campaignId, campaignName: a.campaignName,
          clicks: a.clicks, orders: a.orders, revenue: a.revenue, commission: a.commission,
        });
      }
    }
    return [...byCampaign.values()].sort((x, y) => y.revenue - x.revenue);
  }, [attribution]);

  const exampleReward: RewardConfig | null = participations.find(p => p.reward)?.reward ?? null;
  const exampleSalesCount = campaignBreakdown.reduce((t, c) => t + c.orders, 0);

  const columns: Column<EarningRecord>[] = [
    { key: 'kind', header: 'Type', render: r => <span className="font-semibold text-gray-800">{KIND_LABEL[r.kind]}</span> },
    { key: 'campaignName', header: 'Campaign', render: r => r.campaignName ?? '—' },
    { key: 'eligibleSale', header: 'Eligible Sale', render: r => <span className="tabular-nums">{r.eligibleSale !== undefined ? inr(r.eligibleSale) : '—'}</span> },
    { key: 'rate', header: 'Rate', render: r => <span className="tabular-nums">{r.rate !== undefined ? `${r.rate}%` : '—'}</span> },
    { key: 'amount', header: 'Amount', render: r => <span className="tabular-nums font-bold text-gray-900">{inr(r.amount)}</span> },
    { key: 'state', header: 'Status', render: r => <StatusBadge status={r.state} size="sm" /> },
    { key: 'earnedOn', header: 'Date', render: r => <span className="text-gray-500">{new Date(r.earnedOn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span> },
  ];

  return (
    <PortalShell type="influencer">
      <PageHeader title="Earnings" subtitle="Sales Commission earned across your campaigns" />

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
                <SkeletonLine width="w-2/3" height="h-3" />
                <SkeletonLine width="w-1/2" height="h-5" />
              </div>
            ))}
          </div>
          <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      ) : error ? (
        <ErrorState onRetry={load} message="Could not load your earnings." />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatTile label="Pending" value={inr(summary?.pending ?? 0)} icon={<Clock size={16} />} tone="warning" />
            <StatTile label="Approved" value={inr(summary?.approved ?? 0)} icon={<CheckCircle2 size={16} />} tone="brand" />
            <StatTile label="Paid" value={inr(summary?.paid ?? 0)} icon={<Wallet size={16} />} tone="positive" />
            <StatTile label="Lifetime" value={inr(summary?.lifetime ?? 0)} icon={<IndianRupee size={16} />} />
          </div>

          {exampleReward && (
            <div>
              <h2 className="text-sm font-bold text-gray-800 mb-2">How your Sales Commission works</h2>
              <RewardSummary reward={exampleReward} exampleSale={4999} salesCount={exampleSalesCount} />
            </div>
          )}

          <div>
            <h2 className="text-sm font-bold text-gray-800 mb-2">Earnings history</h2>
            <DataTable
              columns={columns}
              data={earnings}
              rowKey={r => r.referenceId}
              emptyMessage="No earnings recorded yet."
            />
          </div>

          <div>
            <h2 className="text-sm font-bold text-gray-800 mb-2">Attribution by campaign</h2>
            {campaignBreakdown.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 py-10 text-center text-sm text-gray-500">
                No link-driven attribution yet — create a tracking link to start earning Sales Commission.
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Campaign</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide"><span className="inline-flex items-center gap-1 justify-end"><MousePointerClick size={12} /> Clicks</span></th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide"><span className="inline-flex items-center gap-1 justify-end"><Package size={12} /> Orders</span></th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide"><span className="inline-flex items-center gap-1 justify-end"><TrendingUp size={12} /> Revenue</span></th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide"><span className="inline-flex items-center gap-1 justify-end"><IndianRupee size={12} /> Commission</span></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {campaignBreakdown.map(c => (
                        <tr key={c.campaignId} className="hover:bg-gray-50/50">
                          <td className="py-3 px-4 font-semibold text-gray-800">{c.campaignName}</td>
                          <td className="py-3 px-4 text-right tabular-nums text-gray-700">{compact(c.clicks)}</td>
                          <td className="py-3 px-4 text-right tabular-nums text-gray-700">{compact(c.orders)}</td>
                          <td className="py-3 px-4 text-right tabular-nums text-gray-700">{inr(c.revenue)}</td>
                          <td className="py-3 px-4 text-right tabular-nums font-bold text-brand-700">{inr(c.commission)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </PortalShell>
  );
}
