import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Megaphone, Package, Calendar, Mail, Check, X, Inbox, Sparkles } from 'lucide-react';
import PortalShell from '../../components/shared/PortalShell';
import PageHeader from '../../components/shared/PageHeader';
import StatusBadge from '../../components/shared/StatusBadge';
import EmptyState from '../../components/shared/EmptyState';
import ErrorState from '../../components/shared/ErrorState';
import Tabs from '../../components/shared/Tabs';
import RewardSummary from '../../components/shared/RewardSummary';
import TrackingLinkPanel from '../../components/shared/TrackingLinkPanel';
import { SkeletonCard } from '../../components/shared/LoadingSkeleton';
import { useToast } from '../../components/shared/Toast';
import { useAuth } from '../../core/auth/AuthContext';
import { campaignService } from '../../core/services/campaign.service';
import { creatorService } from '../../core/services/creator.service';
import { trackingService } from '../../core/services/tracking.service';
import type { Campaign, CampaignParticipation, TrackingLink } from '../../core/models';

type TabId = 'mine' | 'invitations' | 'available';
const JOINABLE_STATES = new Set(['ACCEPTED', 'PROMOTING', 'COMPLETED']);

export default function InfluencerCampaigns() {
  const { currentUser } = useAuth();
  const participantId = currentUser?.creatorId ?? 'CRT260822A01';
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = (searchParams.get('tab') as TabId) ?? 'mine';
  const [tab, setTab] = useState<TabId>(['mine', 'invitations', 'available'].includes(initialTab) ? initialTab : 'mine');

  const changeTab = (id: string) => {
    setTab(id as TabId);
    setSearchParams(id === 'mine' ? {} : { tab: id }, { replace: true });
  };

  // ── My Campaigns (existing behaviour) ──────────────────────────────────────
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    campaignService.getInfluencerCampaigns('INF260822A01').then(c => { setCampaigns(c); setLoading(false); });
  }, []);

  // Tracking links for the current participant, keyed by campaign, to surface inline.
  const [linksByCampaign, setLinksByCampaign] = useState<Record<string, TrackingLink>>({});
  useEffect(() => {
    trackingService.getLinks({ participantId }).then(links => {
      const map: Record<string, TrackingLink> = {};
      for (const l of links) {
        if (!map[l.campaignId] || l.linkStatus === 'ACTIVE') map[l.campaignId] = l;
      }
      setLinksByCampaign(map);
    });
  }, [participantId]);

  // ── Invitations ─────────────────────────────────────────────────────────────
  const [invitations, setInvitations] = useState<CampaignParticipation[]>([]);
  const [invLoading, setInvLoading] = useState(true);
  const [invError, setInvError] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [acceptedLinks, setAcceptedLinks] = useState<Record<string, TrackingLink>>({});

  const loadInvitations = () => {
    setInvLoading(true);
    setInvError(false);
    creatorService.getParticipations({ participantId, role: 'INFLUENCER', state: 'INVITED' })
      .then(setInvitations)
      .catch(() => setInvError(true))
      .finally(() => setInvLoading(false));
  };

  useEffect(() => {
    if (tab === 'invitations') loadInvitations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, participantId]);

  const accept = async (p: CampaignParticipation) => {
    setRespondingId(p.referenceId);
    try {
      const updated = await creatorService.advanceParticipation(p.referenceId, 'ACCEPTED', 'Influencer accepted the invitation');
      setInvitations(prev => prev.map(x => (x.referenceId === updated.referenceId ? updated : x)));
      const link = await trackingService.createLink({
        campaignId: p.campaignId,
        campaignName: p.campaignName,
        productId: p.productIds[0],
        productName: p.productNames[0],
        attributedToId: participantId,
        attributedToName: currentUser?.name ?? p.participantName,
        attributedToRole: 'INFLUENCER',
        channel: 'SOCIAL',
        createdByName: currentUser?.name ?? p.participantName,
        expiryDays: 30,
      });
      setAcceptedLinks(prev => ({ ...prev, [p.referenceId]: link }));
      setLinksByCampaign(prev => ({ ...prev, [p.campaignId]: link }));
      toast(`Invitation accepted — tracking link ready for ${p.campaignName}`);
    } catch {
      toast('Could not accept the invitation', 'error');
    } finally {
      setRespondingId(null);
    }
  };

  const decline = async (p: CampaignParticipation) => {
    setRespondingId(p.referenceId);
    try {
      await creatorService.advanceParticipation(p.referenceId, 'DECLINED', 'Influencer declined the invitation');
      setInvitations(prev => prev.filter(x => x.referenceId !== p.referenceId));
      toast('Invitation declined');
    } catch {
      toast('Could not decline the invitation', 'error');
    } finally {
      setRespondingId(null);
    }
  };

  // ── Available ────────────────────────────────────────────────────────────────
  const [availableCampaigns, setAvailableCampaigns] = useState<Campaign[]>([]);
  const [availLoading, setAvailLoading] = useState(true);
  const [availError, setAvailError] = useState(false);
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());

  const loadAvailable = () => {
    setAvailLoading(true);
    setAvailError(false);
    campaignService.getOpenCampaigns(participantId, 'INFLUENCER')
      .then(setAvailableCampaigns)
      .catch(() => setAvailError(true))
      .finally(() => setAvailLoading(false));
  };

  useEffect(() => {
    if (tab === 'available') loadAvailable();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, participantId]);

  const requestJoin = (c: Campaign) => {
    setRequestedIds(prev => new Set(prev).add(c.referenceId));
    toast(`Request to join "${c.name}" sent to ${c.partnerName}`);
  };

  const tabItems = useMemo(() => [
    { id: 'mine', label: 'My Campaigns', count: campaigns.length },
    { id: 'invitations', label: 'Invitations', count: invitations.length || undefined },
    { id: 'available', label: 'Available' },
  ], [campaigns.length, invitations.length]);

  return (
    <PortalShell type="influencer">
      <PageHeader title="Campaigns" subtitle="Campaigns you promote, invitations you've received, and open campaigns to join" />

      <Tabs tabs={tabItems} active={tab} onChange={changeTab} className="mb-5" />

      {tab === 'mine' && (
        loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-44 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : campaigns.length === 0 ? (
          <EmptyState icon={Megaphone} title="No Campaigns" message="You haven't joined any campaigns yet. Check the Invitations and Available tabs." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaigns.map(c => (
              <div key={c.referenceId} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {c.bannerUrl && (
                  <div className="h-28 overflow-hidden">
                    <img src={c.bannerUrl} alt={c.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{c.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">by {c.partnerName}</p>
                    </div>
                    <StatusBadge status={c.status} size="sm" />
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-4">{c.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Package size={11} /> {c.productIds.length} products</span>
                    <span className="flex items-center gap-1"><Calendar size={11} /> Ends {new Date(c.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  </div>
                  <Link to={`/influencer/content/new?campaign=${c.referenceId}`}
                    className="mt-3 w-full flex items-center justify-center py-2 bg-purple-50 text-purple-700 text-xs font-bold rounded-xl hover:bg-purple-100">
                    + Upload Content for This Campaign
                  </Link>

                  {linksByCampaign[c.referenceId] && (
                    <TrackingLinkPanel link={linksByCampaign[c.referenceId]} className="mt-4" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'invitations' && (
        invLoading ? (
          <div className="space-y-4">{Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)}</div>
        ) : invError ? (
          <ErrorState onRetry={loadInvitations} message="Could not load your invitations." />
        ) : invitations.length === 0 ? (
          <EmptyState icon={Inbox} title="No pending invitations" message="Partners will invite you here when they want you to promote a campaign." />
        ) : (
          <div className="space-y-4">
            {invitations.map(p => (
              <div key={p.referenceId} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">{p.campaignName}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">by {p.partnerName} · {p.productNames.join(', ')}</p>
                  </div>
                  <StatusBadge status={p.state} size="sm" />
                </div>

                {p.reward && <RewardSummary reward={p.reward} compactView className="mb-3" />}

                {p.state === 'ACCEPTED' ? (
                  acceptedLinks[p.referenceId] ? (
                    <TrackingLinkPanel link={acceptedLinks[p.referenceId]} showStats={false} />
                  ) : (
                    <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5"><Check size={13} /> Accepted — generating your tracking link…</p>
                  )
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => accept(p)}
                      disabled={respondingId === p.referenceId}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl hover:bg-brand-700 disabled:opacity-50"
                    >
                      <Check size={13} /> Accept
                    </button>
                    <button
                      onClick={() => decline(p)}
                      disabled={respondingId === p.referenceId}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-200 bg-white text-gray-700 text-xs font-bold rounded-xl hover:border-red-300 hover:text-red-600 disabled:opacity-50"
                    >
                      <X size={13} /> Decline
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'available' && (
        availLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}</div>
        ) : availError ? (
          <ErrorState onRetry={loadAvailable} message="Could not load open campaigns." />
        ) : availableCampaigns.length === 0 ? (
          <EmptyState icon={Sparkles} title="No open campaigns right now" message="Check back soon — new campaigns looking for influencers will show up here." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableCampaigns.map(c => (
              <div key={c.referenceId} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {c.bannerUrl && (
                  <div className="h-28 overflow-hidden">
                    <img src={c.bannerUrl} alt={c.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{c.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">by {c.partnerName}</p>
                    </div>
                    <StatusBadge status={c.status} size="sm" />
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">{c.description}</p>
                  {c.reward && <RewardSummary reward={c.reward} compactView className="mb-3" />}
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1"><Package size={11} /> {c.productIds.length} products</span>
                    <span className="flex items-center gap-1"><Calendar size={11} /> Ends {new Date(c.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  </div>
                  <button
                    onClick={() => requestJoin(c)}
                    disabled={requestedIds.has(c.referenceId)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl hover:bg-brand-700 disabled:opacity-50 disabled:bg-gray-300"
                  >
                    <Mail size={13} /> {requestedIds.has(c.referenceId) ? 'Request sent' : 'Request to join'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </PortalShell>
  );
}
