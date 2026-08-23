import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Rocket, Package, Users, Eye, MousePointerClick, ShoppingBag, IndianRupee,
  Sparkles, Megaphone, Plus, Link2, BadgeCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import PortalShell from '../../components/shared/PortalShell';
import PageHeader from '../../components/shared/PageHeader';
import StatusBadge from '../../components/shared/StatusBadge';
import Tabs from '../../components/shared/Tabs';
import StatTile, { compact, inr } from '../../components/shared/StatTile';
import RewardSummary from '../../components/shared/RewardSummary';
import TrackingLinkPanel from '../../components/shared/TrackingLinkPanel';
import ModerationTrail, { ModerationBadge } from '../../components/shared/ModerationTrail';
import Modal, { Drawer } from '../../components/shared/Modal';
import EmptyState from '../../components/shared/EmptyState';
import ErrorState from '../../components/shared/ErrorState';
import LoadingSkeleton, { SkeletonTable } from '../../components/shared/LoadingSkeleton';
import { useToast } from '../../components/shared/Toast';
import { campaignService } from '../../core/services/campaign.service';
import { creatorService } from '../../core/services/creator.service';
import { trackingService } from '../../core/services/tracking.service';
import { productService } from '../../core/services/product.service';
import type {
  Campaign, CampaignParticipation, CreatorContent, TrackingLink, AttributionRecord,
  Product, ParticipationState, TrackingChannel,
} from '../../core/models';

const inputCls = "w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400";
const labelCls = "block text-xs font-semibold text-gray-600 mb-1.5";

export default function CampaignDetail() {
  const { referenceId } = useParams<{ referenceId: string }>();
  const { toast } = useToast();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState('overview');
  const [publishing, setPublishing] = useState(false);

  const load = useCallback(() => {
    if (!referenceId) return;
    setLoading(true);
    setError(null);
    campaignService.getCampaign(referenceId)
      .then(c => { setCampaign(c); setLoading(false); })
      .catch(() => { setError('This campaign could not be found.'); setLoading(false); });
  }, [referenceId]);

  useEffect(() => { load(); }, [load]);

  const handlePublish = async () => {
    if (!campaign) return;
    setPublishing(true);
    try {
      const updated = await campaignService.publishCampaign(campaign.referenceId);
      setCampaign(updated);
      toast('Campaign published');
    } catch {
      toast('Could not publish — try again', 'error');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <PortalShell type="partner">
        <PageHeader title="Campaign" breadcrumbs={[{ label: 'Campaigns', href: '/partner/campaigns' }]} />
        <LoadingSkeleton />
      </PortalShell>
    );
  }

  if (error || !campaign) {
    return (
      <PortalShell type="partner">
        <PageHeader title="Campaign" breadcrumbs={[{ label: 'Campaigns', href: '/partner/campaigns' }]} />
        <ErrorState type="not_found" message={error ?? 'This campaign could not be found.'} onRetry={load} />
      </PortalShell>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'participants', label: 'Participants' },
    { id: 'content', label: 'Content' },
    { id: 'tracking', label: 'Tracking & Attribution' },
  ];

  return (
    <PortalShell type="partner">
      <PageHeader
        title={campaign.name}
        subtitle={campaign.description}
        breadcrumbs={[{ label: 'Campaigns', href: '/partner/campaigns' }, { label: campaign.name }]}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={campaign.status} />
            {campaign.status === 'DRAFT' && (
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700 disabled:opacity-50"
              >
                <Rocket size={14} /> {publishing ? 'Publishing…' : 'Publish campaign'}
              </button>
            )}
          </div>
        }
      />

      <Tabs tabs={tabs} active={tab} onChange={setTab} className="mb-6" />

      {tab === 'overview' && <OverviewTab campaign={campaign} />}
      {tab === 'participants' && <ParticipantsTab campaign={campaign} />}
      {tab === 'content' && <ContentTab campaign={campaign} />}
      {tab === 'tracking' && <TrackingTab campaign={campaign} />}
    </PortalShell>
  );
}

// ─── Overview ─────────────────────────────────────────────────────────────────

function OverviewTab({ campaign }: { campaign: Campaign }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all(campaign.productIds.map(id => productService.getProduct(id).catch(() => null)))
      .then(list => { setProducts(list.filter((p): p is Product => !!p)); setLoading(false); });
  }, [campaign.productIds]);

  const recruits = campaign.campaignKind === 'CREATOR' ? 'Creators'
    : campaign.campaignKind === 'INFLUENCER' ? 'Influencers'
    : 'Creators & Influencers';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="Reach" value={compact(campaign.reach)} icon={<Eye size={16} />} />
        <StatTile label="Clicks" value={compact(campaign.clicks)} icon={<MousePointerClick size={16} />} />
        <StatTile label="Orders" value={compact(campaign.orders ?? 0)} icon={<ShoppingBag size={16} />} />
        <StatTile label="Revenue" value={inr(campaign.revenue ?? 0)} icon={<IndianRupee size={16} />} tone="brand" />
      </div>

      {campaign.bannerUrl && (
        <div className="h-40 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
          <img src={campaign.bannerUrl} alt={campaign.name} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-800 mb-2">Campaign info</h2>
          {[
            { label: 'Target Audience', value: campaign.targetAudience },
            { label: 'Budget', value: inr(campaign.budget) },
            { label: 'Start Date', value: new Date(campaign.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
            { label: 'End Date', value: new Date(campaign.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
            { label: 'Recruits', value: recruits },
            { label: 'Sample provided', value: campaign.productSampleProvided ? 'Yes' : 'No' },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
              <span className="text-xs text-gray-500">{row.label}</span>
              <span className="text-sm font-semibold text-gray-800 text-right">{row.value}</span>
            </div>
          ))}

          {campaign.deliverables && campaign.deliverables.length > 0 && (
            <div className="pt-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Deliverables</p>
              <ul className="list-disc pl-5 space-y-1">
                {campaign.deliverables.map((item, i) => <li key={i} className="text-sm text-gray-700">{item}</li>)}
              </ul>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-sm font-bold text-gray-800 mb-2">Reward configuration</h2>
          {campaign.reward ? (
            <RewardSummary reward={campaign.reward} exampleSale={products[0]?.price ?? 2999} />
          ) : (
            <EmptyState title="No reward configured" message="This campaign has no reward configuration." />
          )}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-bold text-gray-800 mb-3">Products ({campaign.productIds.length})</h2>
        {loading ? (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : products.length === 0 ? (
          <EmptyState icon={Package} title="No products" message="This campaign has no products attached." />
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {products.map(p => (
              <Link key={p.referenceId} to={`/partner/products/${p.referenceId}`} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-brand-300 transition-colors">
                <div className="w-11 h-11 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                  <img src={p.media.find(m => m.isPrimary)?.url ?? p.media[0]?.url} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                  <p className="text-xs text-gray-500">{inr(p.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Participants ─────────────────────────────────────────────────────────────

function ParticipantsTab({ campaign }: { campaign: Campaign }) {
  const { toast } = useToast();
  const [participations, setParticipations] = useState<CampaignParticipation[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    creatorService.getParticipations({ campaignId: campaign.referenceId }).then(p => { setParticipations(p); setLoading(false); });
  }, [campaign.referenceId]);

  useEffect(() => { load(); }, [load]);

  const advance = async (p: CampaignParticipation, next: ParticipationState, description: string) => {
    setBusyId(p.referenceId);
    try {
      await creatorService.advanceParticipation(p.referenceId, next, description);
      toast('Participation updated');
      load();
    } catch {
      toast('Could not update — try again', 'error');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <SkeletonTable rows={4} cols={5} />;
  if (participations.length === 0) {
    return <EmptyState icon={Users} title="No participants yet" message="Invite creators or influencers from the campaign builder to get started." />;
  }

  const creators = participations.filter(p => p.participantRole === 'CREATOR');
  const influencers = participations.filter(p => p.participantRole === 'INFLUENCER');

  return (
    <div className="space-y-6">
      {creators.length > 0 && <ParticipantGroup title="Creators" icon={Sparkles} rows={creators} onAdvance={advance} busyId={busyId} />}
      {influencers.length > 0 && <ParticipantGroup title="Influencers" icon={Megaphone} rows={influencers} onAdvance={advance} busyId={busyId} />}
    </div>
  );
}

function ParticipantGroup({ title, icon: Icon, rows, onAdvance, busyId }: {
  title: string;
  icon: LucideIcon;
  rows: CampaignParticipation[];
  onAdvance: (p: CampaignParticipation, next: ParticipationState, description: string) => void;
  busyId: string | null;
}) {
  return (
    <div>
      <h2 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><Icon size={15} className="text-brand-600" /> {title} ({rows.length})</h2>
      <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
        {rows.map(p => (
          <div key={p.referenceId} className="flex items-center gap-3 p-4 flex-wrap">
            <img src={p.participantAvatarUrl} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 truncate">{p.participantName}</p>
              <p className="text-xs text-gray-500">@{p.participantHandle}</p>
            </div>
            <div className="text-xs text-gray-500 shrink-0 w-36">
              {p.contentIds.length > 0 ? `${p.contentIds.length} content submitted` : 'No content yet'}
            </div>
            <StatusBadge status={p.state} size="sm" />
            <div className="flex items-center gap-3 shrink-0 ml-auto">
              {p.state === 'ACCEPTED' && p.participantRole === 'CREATOR' && (
                <button
                  disabled={busyId === p.referenceId}
                  onClick={() => onAdvance(p, 'PRODUCT_SHIPPED', 'Product shipped by the partner')}
                  className="text-xs font-semibold text-brand-600 hover:underline disabled:opacity-50"
                >
                  Mark product shipped
                </button>
              )}
              {p.state === 'UNDER_REVIEW' && (
                <>
                  <button
                    disabled={busyId === p.referenceId}
                    onClick={() => onAdvance(p, 'APPROVED', 'Content approved by the partner')}
                    className="text-xs font-semibold text-emerald-600 hover:underline disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    disabled={busyId === p.referenceId}
                    onClick={() => onAdvance(p, 'CONTENT_PENDING', 'Partner requested changes')}
                    className="text-xs font-semibold text-amber-600 hover:underline disabled:opacity-50"
                  >
                    Request changes
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Content ──────────────────────────────────────────────────────────────────

function ContentTab({ campaign }: { campaign: Campaign }) {
  const [items, setItems] = useState<CreatorContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<CreatorContent | null>(null);

  useEffect(() => {
    setLoading(true);
    creatorService.getParticipations({ campaignId: campaign.referenceId, role: 'CREATOR' })
      .then(participations => Promise.all(participations.map(p => creatorService.getCreatorContent(p.participantId))))
      .then(lists => {
        const flat = lists.flat().filter(c => c.campaignId === campaign.referenceId);
        setItems(flat.sort((a, b) => b.createdOn.localeCompare(a.createdOn)));
        setLoading(false);
      });
  }, [campaign.referenceId]);

  if (loading) return <SkeletonTable rows={3} cols={4} />;
  if (items.length === 0) {
    return <EmptyState icon={Sparkles} title="No content yet" message="Content submitted by creators for this campaign will show up here." />;
  }

  return (
    <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(c => (
          <button key={c.referenceId} onClick={() => setPreview(c)} className="text-left bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
              <img src={c.thumbnailUrl} alt={c.title} className="w-full h-full object-cover" />
            </div>
            <div className="p-3">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-sm font-semibold text-gray-900 truncate">{c.title}</p>
                <ModerationBadge state={c.state} size="sm" />
              </div>
              <p className="text-xs text-gray-500">{c.creatorName} · {c.kind}</p>
            </div>
          </button>
        ))}
      </div>

      <Drawer open={!!preview} onClose={() => setPreview(null)} title={preview?.title} subtitle={preview ? `${preview.creatorName} · ${preview.kind}` : undefined}>
        {preview && (
          <div className="space-y-4">
            <div className="rounded-xl overflow-hidden bg-gray-100">
              <img src={preview.thumbnailUrl} alt={preview.title} className="w-full object-cover" />
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{preview.body}</p>
            <ModerationTrail state={preview.state} events={preview.moderationEvents} rejectionReason={preview.rejectionReason} orientation="vertical" />
          </div>
        )}
      </Drawer>
    </>
  );
}

// ─── Tracking & attribution ─────────────────────────────────────────────────

function TrackingTab({ campaign }: { campaign: Campaign }) {
  const { toast } = useToast();
  const [links, setLinks] = useState<TrackingLink[]>([]);
  const [attribution, setAttribution] = useState<AttributionRecord[]>([]);
  const [participations, setParticipations] = useState<CampaignParticipation[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      trackingService.getLinks({ campaignId: campaign.referenceId }),
      trackingService.getAttribution({ campaignId: campaign.referenceId }),
      creatorService.getParticipations({ campaignId: campaign.referenceId }),
      Promise.all(campaign.productIds.map(id => productService.getProduct(id).catch(() => null))),
    ]).then(([l, a, p, prods]) => {
      setLinks(l);
      setAttribution(a);
      setParticipations(p);
      setProducts(prods.filter((x): x is Product => !!x));
      setLoading(false);
    });
  }, [campaign.referenceId, campaign.productIds]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <SkeletonTable rows={3} cols={4} />;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-800">Tracking URLs ({links.length})</h2>
          <button
            onClick={() => setModalOpen(true)}
            disabled={participations.length === 0}
            className="flex items-center gap-2 px-3 py-2 bg-brand-600 text-white text-xs font-bold rounded-lg hover:bg-brand-700 disabled:opacity-50"
          >
            <Plus size={13} /> Generate new tracking URL
          </button>
        </div>
        {links.length === 0 ? (
          <EmptyState icon={Link2} title="No tracking URLs yet" message="Generate one to start tracking a participant's clicks and orders." />
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {links.map(l => <TrackingLinkPanel key={l.referenceId} link={l} />)}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-sm font-bold text-gray-800 mb-1">Attribution</h2>
        <p className="text-xs text-gray-500 mb-3">Who is generating clicks, orders, revenue and commission for this campaign.</p>
        {attribution.length === 0 ? (
          <EmptyState icon={BadgeCheck} title="No attribution yet" message="Attribution appears once participants start driving clicks and orders." />
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Participant</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Source</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Clicks</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Orders</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Revenue</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {attribution.map(a => (
                  <tr key={a.referenceId} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <img src={a.participantAvatarUrl} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{a.participantName}</p>
                          <p className="text-xs text-gray-400 truncate">@{a.participantHandle}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-600">{a.participantRole === 'CREATOR' ? 'Creator' : 'Influencer'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {a.source === 'ZHA_CONTENT' ? <><span className="font-tamil">ழ</span> content</> : `Tracking link${a.trackingCode ? ` · ${a.trackingCode}` : ''}`}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{compact(a.clicks)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{compact(a.orders)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold">{inr(a.revenue)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-brand-700">{inr(a.commission)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <GenerateLinkModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        campaign={campaign}
        participations={participations}
        products={products}
        onCreated={link => { setLinks(ls => [link, ...ls]); toast('Tracking URL generated'); setModalOpen(false); }}
      />
    </div>
  );
}

const CHANNELS: TrackingChannel[] = ['SOCIAL', 'EMAIL', 'SMS', 'QR', 'DIRECT', 'ZHA_CONTENT'];

function GenerateLinkModal({ open, onClose, campaign, participations, products, onCreated }: {
  open: boolean;
  onClose: () => void;
  campaign: Campaign;
  participations: CampaignParticipation[];
  products: Product[];
  onCreated: (link: TrackingLink) => void;
}) {
  const { toast } = useToast();
  const [participationId, setParticipationId] = useState('');
  const [productId, setProductId] = useState('');
  const [channel, setChannel] = useState<TrackingChannel>('SOCIAL');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (open) {
      setParticipationId(participations[0]?.referenceId ?? '');
      setProductId('');
      setChannel('SOCIAL');
    }
  }, [open, participations]);

  const participant = participations.find(p => p.referenceId === participationId);
  const product = products.find(p => p.referenceId === productId);

  const create = async () => {
    if (!participant) return;
    setCreating(true);
    try {
      const link = await trackingService.createLink({
        campaignId: campaign.referenceId,
        campaignName: campaign.name,
        productId: product?.referenceId,
        productName: product?.name,
        attributedToId: participant.participantId,
        attributedToName: participant.participantName,
        attributedToRole: participant.participantRole,
        channel,
        createdByName: campaign.partnerName,
        expiryDays: campaign.reward?.cookieWindowDays,
      });
      onCreated(link);
    } catch {
      toast('Could not generate a tracking URL — try again', 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Generate new tracking URL"
      subtitle={campaign.name}
      size="md"
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900">Cancel</button>
          <button
            onClick={create}
            disabled={!participant || creating}
            className="px-4 py-2 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700 disabled:opacity-50"
          >
            {creating ? 'Generating…' : 'Generate URL'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className={labelCls}>Participant *</label>
          <select value={participationId} onChange={e => setParticipationId(e.target.value)} className={inputCls}>
            {participations.length === 0 && <option value="">No participants yet</option>}
            {participations.map(p => (
              <option key={p.referenceId} value={p.referenceId}>
                {p.participantName} · {p.participantRole === 'CREATOR' ? 'Creator' : 'Influencer'}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Product (optional)</label>
          <select value={productId} onChange={e => setProductId(e.target.value)} className={inputCls}>
            <option value="">All campaign products</option>
            {products.map(p => <option key={p.referenceId} value={p.referenceId}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Channel *</label>
          <select value={channel} onChange={e => setChannel(e.target.value as TrackingChannel)} className={inputCls}>
            {CHANNELS.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
          </select>
        </div>
      </div>
    </Modal>
  );
}
