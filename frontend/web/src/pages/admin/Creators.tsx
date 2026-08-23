import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, BadgeCheck, Camera, Megaphone, ExternalLink, Check, X, UserSearch } from 'lucide-react';
import AdminShell from '../../components/shared/AdminShell';
import PageHeader from '../../components/shared/PageHeader';
import StatusBadge from '../../components/shared/StatusBadge';
import EmptyState from '../../components/shared/EmptyState';
import Tabs from '../../components/shared/Tabs';
import StatTile, { compact, inr } from '../../components/shared/StatTile';
import { SkeletonTable } from '../../components/shared/LoadingSkeleton';
import { useToast } from '../../components/shared/Toast';
import { useAuth } from '../../core/auth/AuthContext';
import { creatorService } from '../../core/services/creator.service';
import type { Creator, ParticipantCapability } from '../../core/models';

/**
 * Platform oversight of everyone creating or promoting on ழ. The capability
 * column is the point: it shows at a glance who publishes here, who brings an
 * outside audience, and who does both — without three separate registers.
 */
export default function AdminCreators() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [capability, setCapability] = useState<'all' | ParticipantCapability>('all');
  const [busy, setBusy] = useState<string | null>(null);
  const { hasPermission } = useAuth();
  const { toast } = useToast();

  const canApprove = hasPermission('CREATOR_APPROVE');

  const load = () => {
    setLoading(true);
    creatorService
      .getCreators(1, 50, {
        search: search || undefined,
        capability: capability === 'all' ? undefined : capability,
      })
      .then(r => setCreators(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(load, search ? 260 : 0);
    return () => clearTimeout(t);
  }, [search, capability]);

  const decide = async (c: Creator, approve: boolean) => {
    setBusy(c.referenceId);
    try {
      await creatorService.updateCreator(c.referenceId, {
        creatorStatus: approve ? 'ACTIVE' : 'REJECTED',
        isVerified: approve ? true : c.isVerified,
      });
      toast(approve ? `${c.name} approved` : `${c.name} rejected`);
      load();
    } catch {
      toast('Could not update that creator', 'error');
    } finally {
      setBusy(null);
    }
  };

  const pending = creators.filter(c => c.creatorStatus === 'PENDING_APPROVAL');
  const totals = creators.reduce(
    (t, c) => ({
      revenue: t.revenue + c.revenueGenerated,
      orders: t.orders + c.attributedOrders,
      content: t.content + c.contentPublished,
    }),
    { revenue: 0, orders: 0, content: 0 },
  );

  return (
    <AdminShell>
      <PageHeader
        title="Creators"
        subtitle={pending.length ? `${pending.length} awaiting approval` : 'All applications reviewed'}
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Creators' }]}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatTile label="Active" value={creators.filter(c => c.creatorStatus === 'ACTIVE').length} tone="positive" />
        <StatTile label="Awaiting approval" value={pending.length} tone={pending.length ? 'warning' : 'neutral'} />
        <StatTile label="Content published" value={totals.content} />
        <StatTile label="Revenue attributed" value={inr(totals.revenue)} sublabel={`${totals.orders} orders`} tone="brand" />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <Tabs
          variant="pill"
          active={capability}
          onChange={id => setCapability(id as 'all' | ParticipantCapability)}
          tabs={[
            { id: 'all', label: 'Everyone', count: creators.length },
            { id: 'CREATOR', label: 'Creators', icon: <Camera size={11} /> },
            { id: 'INFLUENCER', label: 'Influencers', icon: <Megaphone size={11} /> },
          ]}
        />
        <div className="relative ml-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, handle or category"
            className="pl-9 pr-3 py-2 w-64 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-brand-400"
          />
        </div>
      </div>

      {loading ? (
        <SkeletonTable rows={5} cols={6} />
      ) : creators.length === 0 ? (
        <EmptyState icon={UserSearch} title="No creators found" message="Try a different search or capability filter." />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {['Creator', 'Capabilities', 'Reach', 'Published', 'Attributed', 'Status', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {creators.map(c => (
                  <tr key={c.referenceId} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <img src={c.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                        <div className="min-w-0">
                          <p className="flex items-center gap-1 font-semibold text-gray-900 text-sm">
                            {c.name}
                            {c.isVerified && <BadgeCheck size={12} className="text-brand-600" />}
                          </p>
                          <p className="text-xs text-gray-500">@{c.handle}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {c.capabilities.includes('CREATOR') && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase bg-brand-50 text-brand-700 rounded px-1.5 py-0.5">
                            <Camera size={8} /> Creator
                          </span>
                        )}
                        {c.capabilities.includes('INFLUENCER') && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase bg-purple-50 text-purple-700 rounded px-1.5 py-0.5">
                            <Megaphone size={8} /> Influencer
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 tabular-nums">
                      <p>{compact(c.zhaFollowers)} on ழ</p>
                      {c.followerCount > 0 && <p className="text-gray-400">{compact(c.followerCount)} social</p>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 tabular-nums">{c.contentPublished}</td>
                    <td className="px-4 py-3 text-xs tabular-nums">
                      <p className="font-semibold text-gray-900">{inr(c.revenueGenerated)}</p>
                      <p className="text-gray-400">{c.attributedOrders} orders</p>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={c.creatorStatus} size="sm" /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 justify-end">
                        {c.creatorStatus === 'PENDING_APPROVAL' && canApprove && (
                          <>
                            <button
                              onClick={() => decide(c, true)}
                              disabled={busy === c.referenceId}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 disabled:opacity-50"
                            >
                              <Check size={11} /> Approve
                            </button>
                            <button
                              onClick={() => decide(c, false)}
                              disabled={busy === c.referenceId}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 text-red-700 text-[11px] font-bold hover:bg-red-50 disabled:opacity-50"
                            >
                              <X size={11} /> Reject
                            </button>
                          </>
                        )}
                        <Link
                          to={`/creators/${c.handle}`}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-brand-700 hover:bg-brand-50"
                          aria-label={`View ${c.name}'s public profile`}
                        >
                          <ExternalLink size={14} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
