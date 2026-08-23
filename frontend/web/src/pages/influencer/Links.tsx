import { useEffect, useState } from 'react';
import {
  Link2, Plus, MousePointerClick, Users, Package, TrendingUp, IndianRupee,
} from 'lucide-react';
import PortalShell from '../../components/shared/PortalShell';
import PageHeader from '../../components/shared/PageHeader';
import Modal from '../../components/shared/Modal';
import Tabs from '../../components/shared/Tabs';
import StatTile, { compact, inr } from '../../components/shared/StatTile';
import TrackingLinkPanel from '../../components/shared/TrackingLinkPanel';
import EmptyState from '../../components/shared/EmptyState';
import ErrorState from '../../components/shared/ErrorState';
import { SkeletonCard, SkeletonLine } from '../../components/shared/LoadingSkeleton';
import { useToast } from '../../components/shared/Toast';
import { useAuth } from '../../core/auth/AuthContext';
import { trackingService } from '../../core/services/tracking.service';
import { creatorService } from '../../core/services/creator.service';
import type { TrackingLink, TrackingChannel, CampaignParticipation } from '../../core/models';

const CHANNELS: TrackingChannel[] = ['SOCIAL', 'EMAIL', 'SMS', 'QR', 'DIRECT'];
const CHANNEL_LABEL: Record<TrackingChannel, string> = {
  SOCIAL: 'Social media', EMAIL: 'Email', SMS: 'SMS', QR: 'QR code', DIRECT: 'Direct', ZHA_CONTENT: 'ழ content',
};

const JOINABLE_STATES = new Set(['ACCEPTED', 'PROMOTING', 'COMPLETED']);

export default function InfluencerLinks() {
  const { currentUser } = useAuth();
  const participantId = currentUser?.creatorId ?? 'CRT260822A01';
  const { toast } = useToast();

  const [links, setLinks] = useState<TrackingLink[]>([]);
  const [participations, setParticipations] = useState<CampaignParticipation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [channelFilter, setChannelFilter] = useState<'ALL' | TrackingChannel>('ALL');

  const [modalOpen, setModalOpen] = useState(false);
  const [campaignId, setCampaignId] = useState('');
  const [productId, setProductId] = useState('');
  const [channel, setChannel] = useState<TrackingChannel>('SOCIAL');
  const [creating, setCreating] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    Promise.all([
      trackingService.getLinks({ participantId }),
      creatorService.getParticipations({ participantId, role: 'INFLUENCER' }),
    ])
      .then(([l, p]) => {
        setLinks(l);
        setParticipations(p.filter(x => JOINABLE_STATES.has(x.state)));
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(load, [participantId]);

  const filtered = channelFilter === 'ALL' ? links : links.filter(l => l.channel === channelFilter);

  const totals = links.reduce(
    (acc, l) => ({
      clicks: acc.clicks + l.stats.clicks,
      uniqueVisitors: acc.uniqueVisitors + l.stats.uniqueVisitors,
      orders: acc.orders + l.stats.orders,
      revenue: acc.revenue + l.stats.revenue,
      commission: acc.commission + l.stats.commission,
    }),
    { clicks: 0, uniqueVisitors: 0, orders: 0, revenue: 0, commission: 0 },
  );
  const blendedRate = totals.clicks > 0 ? Math.round((totals.orders / totals.clicks) * 1000) / 10 : 0;

  const openCreate = () => {
    const first = participations[0];
    setCampaignId(first?.campaignId ?? '');
    setProductId('');
    setChannel('SOCIAL');
    setModalOpen(true);
  };

  const selectedParticipation = participations.find(p => p.campaignId === campaignId);

  const submitCreate = async () => {
    const p = selectedParticipation;
    if (!p) return;
    setCreating(true);
    try {
      const idx = productId ? p.productIds.indexOf(productId) : -1;
      const link = await trackingService.createLink({
        campaignId: p.campaignId,
        campaignName: p.campaignName,
        productId: productId || undefined,
        productName: idx >= 0 ? p.productNames[idx] : undefined,
        attributedToId: participantId,
        attributedToName: currentUser?.name ?? p.participantName,
        attributedToRole: 'INFLUENCER',
        channel,
        createdByName: currentUser?.name ?? p.participantName,
        expiryDays: 30,
      });
      setLinks(prev => [link, ...prev]);
      setModalOpen(false);
      toast('Tracking link created');
    } catch {
      toast('Could not create the tracking link', 'error');
    } finally {
      setCreating(false);
    }
  };

  const tabItems = [
    { id: 'ALL', label: 'All', count: links.length },
    ...CHANNELS.map(c => ({ id: c, label: CHANNEL_LABEL[c], count: links.filter(l => l.channel === c).length })),
  ];

  return (
    <PortalShell type="influencer">
      <PageHeader
        title="Tracking Links"
        subtitle="Short URLs that attribute clicks and sales back to you"
        actions={
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700"
          >
            <Plus size={15} /> Create tracking link
          </button>
        }
      />

      {loading ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
                <SkeletonLine width="w-2/3" height="h-3" />
                <SkeletonLine width="w-1/2" height="h-5" />
              </div>
            ))}
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </>
      ) : error ? (
        <ErrorState onRetry={load} message="Could not load your tracking links." />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <StatTile label="Total Clicks" value={compact(totals.clicks)} icon={<MousePointerClick size={16} />} />
            <StatTile label="Unique Visitors" value={compact(totals.uniqueVisitors)} icon={<Users size={16} />} />
            <StatTile label="Orders" value={compact(totals.orders)} icon={<Package size={16} />} />
            <StatTile label="Revenue" value={inr(totals.revenue)} icon={<IndianRupee size={16} />} />
            <StatTile label="Commission" value={inr(totals.commission)} icon={<IndianRupee size={16} />} tone="brand" />
            <StatTile label="Blended Conversion" value={`${blendedRate}%`} icon={<TrendingUp size={16} />} />
          </div>

          {links.length > 0 && (
            <Tabs
              tabs={tabItems}
              active={channelFilter}
              onChange={id => setChannelFilter(id as 'ALL' | TrackingChannel)}
              variant="pill"
              className="mb-5"
            />
          )}

          {links.length === 0 ? (
            <EmptyState
              icon={Link2}
              title="No tracking links yet"
              message="Create a tracking link for one of your campaigns to start attributing clicks and sales."
              action={{ label: 'Create tracking link', onClick: openCreate }}
            />
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 py-10 text-center text-sm text-gray-500">
              No links for this channel yet.
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map(l => <TrackingLinkPanel key={l.referenceId} link={l} />)}
            </div>
          )}
        </>
      )}

      <Modal
        open={modalOpen}
        onClose={() => !creating && setModalOpen(false)}
        title="Create tracking link"
        subtitle="Generates a trackable short URL for one of your campaigns"
        footer={
          <>
            <button
              onClick={() => setModalOpen(false)}
              disabled={creating}
              className="px-4 py-2.5 border border-gray-200 bg-white text-gray-700 text-sm font-bold rounded-xl hover:border-brand-300 hover:text-brand-700 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={submitCreate}
              disabled={creating || !selectedParticipation}
              className="px-4 py-2.5 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700 disabled:opacity-50"
            >
              {creating ? 'Creating…' : 'Create link'}
            </button>
          </>
        }
      >
        {participations.length === 0 ? (
          <p className="text-sm text-gray-500">
            You need an accepted campaign before you can create a tracking link. Check the Invitations and Available
            tabs on the Campaigns page.
          </p>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Campaign</label>
              <select
                value={campaignId}
                onChange={e => { setCampaignId(e.target.value); setProductId(''); }}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
              >
                {participations.map(p => (
                  <option key={p.campaignId} value={p.campaignId}>{p.campaignName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Product (optional)</label>
              <select
                value={productId}
                onChange={e => setProductId(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
              >
                <option value="">All campaign products</option>
                {selectedParticipation?.productIds.map((id, i) => (
                  <option key={id} value={id}>{selectedParticipation.productNames[i]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Channel</label>
              <div className="flex flex-wrap gap-1.5">
                {CHANNELS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setChannel(c)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                      channel === c
                        ? 'bg-brand-600 border-brand-600 text-white'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-brand-300 hover:text-brand-700'
                    }`}
                  >
                    {CHANNEL_LABEL[c]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </PortalShell>
  );
}
