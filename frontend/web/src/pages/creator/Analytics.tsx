import { useState, useEffect, useCallback, useMemo } from 'react';
import { Eye, MousePointerClick, ShoppingBag, IndianRupee, Percent, BarChart3 } from 'lucide-react';
import PortalShell from '../../components/shared/PortalShell';
import PageHeader from '../../components/shared/PageHeader';
import StatTile, { compact, inr } from '../../components/shared/StatTile';
import DataTable, { type Column } from '../../components/shared/DataTable';
import EmptyState from '../../components/shared/EmptyState';
import ErrorState from '../../components/shared/ErrorState';
import { SkeletonLine } from '../../components/shared/LoadingSkeleton';
import { useAuth } from '../../core/auth/AuthContext';
import { creatorService } from '../../core/services/creator.service';
import { trackingService } from '../../core/services/tracking.service';
import type { CreatorContent, AttributionRecord } from '../../core/models';

export default function CreatorAnalytics() {
  const { currentUser } = useAuth();
  const creatorId = currentUser?.creatorId ?? 'CRT260822A01';

  const [content, setContent] = useState<CreatorContent[]>([]);
  const [attribution, setAttribution] = useState<AttributionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    Promise.all([
      creatorService.getCreatorContent(creatorId, 'PUBLISHED'),
      trackingService.getAttribution({ participantId: creatorId }),
    ])
      .then(([c, a]) => { setContent(c); setAttribution(a); })
      .catch(() => setError('Could not load your analytics right now.'))
      .finally(() => setLoading(false));
  }, [creatorId]);

  useEffect(() => { load(); }, [load]);

  const totals = useMemo(() => attribution.reduce((t, a) => ({
    views: t.views + a.views,
    clicks: t.clicks + a.clicks,
    orders: t.orders + a.orders,
    revenue: t.revenue + a.revenue,
    commission: t.commission + a.commission,
  }), { views: 0, clicks: 0, orders: 0, revenue: 0, commission: 0 }), [attribution]);

  const topByViews = useMemo(() => [...content].sort((a, b) => b.views - a.views).slice(0, 8), [content]);
  const maxViews = Math.max(1, ...topByViews.map(c => c.views));

  const attrColumns: Column<AttributionRecord>[] = [
    { key: 'source', header: 'Source', render: r => (
      <span className={`inline-flex items-center text-[11px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5 ${r.source === 'ZHA_CONTENT' ? 'bg-brand-50 text-brand-700' : 'bg-purple-50 text-purple-700'}`}>
        {r.source === 'ZHA_CONTENT' ? <span className="font-tamil normal-case mr-1">ழ</span> : null}
        {r.source === 'ZHA_CONTENT' ? 'Content' : 'Tracking link'}
      </span>
    ) },
    { key: 'campaignName', header: 'Campaign' },
    { key: 'views', header: 'Views', render: r => <span className="tabular-nums">{compact(r.views)}</span> },
    { key: 'clicks', header: 'Clicks', render: r => <span className="tabular-nums">{compact(r.clicks)}</span> },
    { key: 'orders', header: 'Orders', render: r => <span className="tabular-nums">{compact(r.orders)}</span> },
    { key: 'revenue', header: 'Revenue', render: r => <span className="tabular-nums font-semibold text-gray-900">{inr(r.revenue)}</span> },
    { key: 'commission', header: 'Commission', render: r => <span className="tabular-nums text-brand-700 font-semibold">{inr(r.commission)}</span> },
  ];

  const contentColumns: Column<CreatorContent>[] = [
    { key: 'title', header: 'Content', render: c => (
      <div className="flex items-center gap-2.5 min-w-0">
        <img src={c.thumbnailUrl} alt="" className="w-8 h-8 rounded-lg object-cover bg-gray-100 shrink-0" />
        <span className="truncate font-medium text-gray-800">{c.title}</span>
      </div>
    ) },
    { key: 'views', header: 'Views', render: c => <span className="tabular-nums">{compact(c.views)}</span> },
    { key: 'likes', header: 'Likes', render: c => <span className="tabular-nums">{compact(c.likes)}</span> },
    { key: 'clicks', header: 'Clicks', render: c => <span className="tabular-nums">{compact(c.clicks)}</span> },
    { key: 'attributedOrders', header: 'Orders', render: c => <span className="tabular-nums">{compact(c.attributedOrders)}</span> },
  ];

  return (
    <PortalShell type="creator">
      <PageHeader title="Analytics" subtitle="How your content and links are performing." />

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonLine key={i} height="h-24" />)}
          </div>
          <SkeletonLine height="h-64" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <StatTile label="Views" value={compact(totals.views)} icon={<Eye size={15} />} />
            <StatTile label="Clicks" value={compact(totals.clicks)} icon={<MousePointerClick size={15} />} />
            <StatTile label="Orders" value={compact(totals.orders)} icon={<ShoppingBag size={15} />} />
            <StatTile label="Revenue" value={inr(totals.revenue)} icon={<IndianRupee size={15} />} tone="brand" />
            <StatTile label="Commission" value={inr(totals.commission)} icon={<Percent size={15} />} tone="positive" />
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
            <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <BarChart3 size={14} className="text-gray-400" /> Content by views
            </h2>
            {topByViews.length === 0 ? (
              <EmptyState icon={BarChart3} title="No published content yet" message="Views will chart here once content is live." />
            ) : (
              <svg viewBox={`0 0 400 ${topByViews.length * 32}`} className="w-full" role="img" aria-label="Content ranked by views">
                {topByViews.map((c, i) => {
                  const w = Math.max(4, (c.views / maxViews) * 260);
                  const y = i * 32;
                  return (
                    <g key={c.referenceId}>
                      <text x="0" y={y + 14} className="fill-gray-600" style={{ fontSize: 10 }}>
                        {c.title.length > 26 ? `${c.title.slice(0, 26)}…` : c.title}
                      </text>
                      <rect x="0" y={y + 18} width="260" height="8" rx="4" className="fill-gray-100" />
                      <rect x="0" y={y + 18} width={w} height="8" rx="4" className="fill-brand-500" />
                      <text x="268" y={y + 26} className="fill-gray-500 tabular-nums" style={{ fontSize: 10 }}>{compact(c.views)}</text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>

          <div className="mb-6">
            <h2 className="text-sm font-bold text-gray-800 mb-3">Attribution by source</h2>
            <DataTable
              columns={attrColumns}
              data={attribution}
              rowKey={r => r.referenceId}
              emptyMessage="No attribution recorded yet."
            />
          </div>

          <div>
            <h2 className="text-sm font-bold text-gray-800 mb-3">Content performance</h2>
            <DataTable
              columns={contentColumns}
              data={content}
              rowKey={c => c.referenceId}
              emptyMessage="No published content yet."
            />
          </div>
        </>
      )}
    </PortalShell>
  );
}
