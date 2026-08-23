import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Megaphone, FileVideo, TrendingUp, Users, DollarSign, ArrowRight, Star, MousePointerClick, Package, IndianRupee, Inbox, Link2 } from 'lucide-react';
import PortalShell from '../../components/shared/PortalShell';
import PageHeader from '../../components/shared/PageHeader';
import StatusBadge from '../../components/shared/StatusBadge';
import StatTile, { compact, inr } from '../../components/shared/StatTile';
import { campaignService } from '../../core/services/campaign.service';
import { influencerService } from '../../core/services/influencer.service';
import { useAuth } from '../../core/auth/AuthContext';
import { trackingService } from '../../core/services/tracking.service';
import { creatorService } from '../../core/services/creator.service';
import type { Campaign, Content, Influencer, AttributionRecord, TrackingLink, CampaignParticipation } from '../../core/models';

export default function InfluencerDashboard() {
  const { currentUser } = useAuth();
  const participantId = currentUser?.creatorId ?? 'CRT260822A01';

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [content, setContent] = useState<Content[]>([]);
  const [influencer, setInfluencer] = useState<Influencer | null>(null);

  useEffect(() => {
    Promise.all([
      influencerService.getCurrentInfluencer(),
      campaignService.getInfluencerCampaigns('INF260822A01'),
      campaignService.getInfluencerContent('INF260822A01'),
    ]).then(([inf, camps, cont]) => {
      setInfluencer(inf);
      setCampaigns(camps);
      setContent(cont);
    });
  }, []);

  // ── Tracking / attribution ──────────────────────────────────────────────────
  const [attribution, setAttribution] = useState<AttributionRecord[]>([]);
  const [earningsSummary, setEarningsSummary] = useState<{ pending: number; approved: number; paid: number; lifetime: number } | null>(null);
  const [topLinks, setTopLinks] = useState<TrackingLink[]>([]);
  const [pendingInvites, setPendingInvites] = useState<CampaignParticipation[]>([]);
  const [trackingLoading, setTrackingLoading] = useState(true);

  useEffect(() => {
    setTrackingLoading(true);
    Promise.all([
      trackingService.getAttribution({ participantId, role: 'INFLUENCER' }),
      trackingService.getEarningsSummary(participantId),
      trackingService.getLinks({ participantId }),
      creatorService.getParticipations({ participantId, role: 'INFLUENCER', state: 'INVITED' }),
    ])
      .then(([attr, summary, links, invites]) => {
        setAttribution(attr);
        setEarningsSummary(summary);
        setTopLinks([...links].sort((a, b) => b.stats.clicks - a.stats.clicks).slice(0, 3));
        setPendingInvites(invites);
      })
      .finally(() => setTrackingLoading(false));
  }, [participantId]);

  const totalClicks = attribution.reduce((t, a) => t + a.clicks, 0);
  const totalOrders = attribution.reduce((t, a) => t + a.orders, 0);
  const totalRevenue = attribution.reduce((t, a) => t + a.revenue, 0);
  const totalCommission = attribution.reduce((t, a) => t + a.commission, 0);

  const kpis = [
    { label: 'Active Campaigns', value: campaigns.filter(c => c.status === 'ACTIVE').length, icon: Megaphone, color: 'bg-purple-50 text-purple-600' },
    { label: 'Content Pieces', value: content.length, icon: FileVideo, color: 'bg-blue-50 text-blue-600' },
    { label: 'Total Reach', value: influencer ? `${(influencer.followerCount / 1000).toFixed(0)}K` : '—', icon: Users, color: 'bg-green-50 text-green-600' },
    { label: 'Earnings', value: '₹42K', icon: DollarSign, color: 'bg-rose-50 text-rose-600' },
    { label: 'Avg. Rating', value: '4.8', icon: Star, color: 'bg-brand-50 text-brand-600' },
  ];

  return (
    <PortalShell type="influencer">
      <PageHeader
        title="Creator Dashboard"
        subtitle={`Welcome back, ${influencer?.name ?? 'Creator'}`}
        actions={
          <Link to="/influencer/content/new" className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700">
            <FileVideo size={15} /> Upload Content
          </Link>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {kpis.map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className={`w-9 h-9 rounded-xl ${kpi.color} flex items-center justify-center mb-3`}>
              <kpi.icon size={16} />
            </div>
            <p className="text-xl font-extrabold text-gray-900">{kpi.value}</p>
            <p className="text-xs font-semibold text-gray-700 mt-0.5">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Campaigns */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-800">My Campaigns</h2>
            <Link to="/influencer/campaigns" className="text-xs text-purple-600 font-semibold hover:underline flex items-center gap-1">View all <ArrowRight size={12} /></Link>
          </div>
          <div className="space-y-3">
            {campaigns.slice(0, 4).map(c => (
              <div key={c.referenceId} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                {c.bannerUrl && <img src={c.bannerUrl} alt={c.name} className="w-10 h-10 rounded-xl object-cover shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 line-clamp-1">{c.name}</p>
                  <p className="text-xs text-gray-500">{c.partnerName}</p>
                </div>
                <StatusBadge status={c.status} size="sm" />
              </div>
            ))}
            {campaigns.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">No campaigns yet</p>}
          </div>
        </div>

        {/* Recent Content */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-800">Recent Content</h2>
            <Link to="/influencer/content" className="text-xs text-purple-600 font-semibold hover:underline flex items-center gap-1">View all <ArrowRight size={12} /></Link>
          </div>
          <div className="space-y-3">
            {content.slice(0, 4).map(c => (
              <div key={c.referenceId} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                {c.thumbnailUrl ? (
                  <img src={c.thumbnailUrl} alt={c.title} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                    <FileVideo size={14} className="text-purple-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 line-clamp-1">{c.title}</p>
                  <p className="text-xs text-gray-500">{c.socialPlatform} · {c.contentType}</p>
                </div>
                <StatusBadge status={c.contentStatus} size="sm" />
              </div>
            ))}
            {content.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">No content uploaded yet</p>}
          </div>
        </div>

        {/* Profile stats */}
        {influencer && (
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-bold text-gray-800 mb-4">Platform Breakdown</h2>
            <div className="space-y-3">
              {influencer.socialPlatforms.map(p => (
                <div key={p.platform} className="flex items-center gap-3">
                  <span className="w-20 text-xs font-semibold text-gray-600">{p.platform}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(100, (p.followers / influencer.followerCount) * 100)}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 w-14 text-right">{(p.followers / 1000).toFixed(0)}K</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tracking & attribution */}
      <div className="mt-6">
        <h2 className="text-sm font-bold text-gray-800 mb-3">Tracking &amp; Attribution</h2>

        {pendingInvites.length > 0 && (
          <Link
            to="/influencer/campaigns?tab=invitations"
            className="mb-4 flex items-center gap-3 bg-brand-50 border border-brand-100 rounded-xl px-4 py-3 hover:bg-brand-100/70 transition-colors"
          >
            <Inbox size={16} className="text-brand-600 shrink-0" />
            <span className="text-sm font-semibold text-brand-800 flex-1">
              You have {pendingInvites.length} pending campaign invitation{pendingInvites.length === 1 ? '' : 's'}
            </span>
            <ArrowRight size={14} className="text-brand-600" />
          </Link>
        )}

        {trackingLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatTile label="Clicks" value={compact(totalClicks)} icon={<MousePointerClick size={16} />} />
              <StatTile label="Conversions" value={compact(totalOrders)} icon={<Package size={16} />} />
              <StatTile label="Attributed Sales" value={inr(totalRevenue)} icon={<TrendingUp size={16} />} />
              <StatTile label="Commission" value={inr(totalCommission)} icon={<IndianRupee size={16} />} tone="brand" sublabel={earningsSummary ? `${inr(earningsSummary.pending)} pending` : undefined} />
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-800">Your Top Links</h3>
                <Link to="/influencer/links" className="text-xs text-purple-600 font-semibold hover:underline flex items-center gap-1">View all <ArrowRight size={12} /></Link>
              </div>
              {topLinks.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">No tracking links yet — create one from the Tracking Links page.</p>
              ) : (
                <div className="space-y-3">
                  {topLinks.map(l => (
                    <div key={l.referenceId} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                      <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                        <Link2 size={14} className="text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 line-clamp-1">{l.campaignName}</p>
                        <p className="text-xs text-gray-500 font-mono truncate">{l.shortUrl}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-gray-900 tabular-nums">{compact(l.stats.clicks)}</p>
                        <p className="text-[11px] text-gray-400">clicks</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-brand-700 tabular-nums">{inr(l.stats.commission)}</p>
                        <p className="text-[11px] text-gray-400">commission</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </PortalShell>
  );
}
