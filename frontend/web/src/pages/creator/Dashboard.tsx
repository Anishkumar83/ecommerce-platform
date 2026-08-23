import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FileVideo, Package, Eye, MousePointerClick, ShoppingBag, IndianRupee, Wallet,
  ArrowRight, Check, X, Clock3, Truck, Send, Sparkles, Star, Heart,
} from 'lucide-react';
import PortalShell from '../../components/shared/PortalShell';
import PageHeader from '../../components/shared/PageHeader';
import StatTile, { compact, inr } from '../../components/shared/StatTile';
import { ModerationBadge } from '../../components/shared/ModerationTrail';
import EmptyState from '../../components/shared/EmptyState';
import ErrorState from '../../components/shared/ErrorState';
import { SkeletonLine } from '../../components/shared/LoadingSkeleton';
import { useToast } from '../../components/shared/Toast';
import { useAuth } from '../../core/auth/AuthContext';
import { creatorService } from '../../core/services/creator.service';
import type { Creator, CreatorContent, CampaignParticipation } from '../../core/models';

export default function CreatorDashboard() {
  const { currentUser } = useAuth();
  const creatorId = currentUser?.creatorId ?? 'CRT260822A01';
  const { toast } = useToast();

  const [creator, setCreator] = useState<Creator | null>(null);
  const [content, setContent] = useState<CreatorContent[]>([]);
  const [participations, setParticipations] = useState<CampaignParticipation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    Promise.all([
      creatorService.getCreator(creatorId),
      creatorService.getCreatorContent(creatorId),
      creatorService.getParticipations({ participantId: creatorId, role: 'CREATOR' }),
    ])
      .then(([c, cont, parts]) => {
        setCreator(c);
        setContent(cont);
        setParticipations(parts);
      })
      .catch(() => setError('Could not load your dashboard right now.'))
      .finally(() => setLoading(false));
  }, [creatorId]);

  useEffect(() => { load(); }, [load]);

  const invitations = participations.filter(p => p.state === 'INVITED');
  const awaitingProduct = participations.filter(p => p.state === 'PRODUCT_SHIPPED');
  const awaitingContent = participations.filter(p => p.state === 'PRODUCT_RECEIVED' || p.state === 'CONTENT_PENDING');
  const underReview = content.filter(c => c.state === 'UPLOADING' || c.state === 'SCANNING' || c.state === 'UNDER_REVIEW');

  const attentionCount = invitations.length + awaitingProduct.length + awaitingContent.length + underReview.length;

  const respond = async (id: string, accept: boolean) => {
    setBusyId(id);
    try {
      await creatorService.advanceParticipation(
        id,
        accept ? 'ACCEPTED' : 'DECLINED',
        accept ? 'Creator accepted the invitation' : 'Declined by creator'
      );
      toast(accept ? 'Invitation accepted' : 'Invitation declined');
      load();
    } catch {
      toast('Could not update the invitation', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const confirmReceipt = async (id: string) => {
    setBusyId(id);
    try {
      await creatorService.advanceParticipation(id, 'PRODUCT_RECEIVED', 'Creator confirmed delivery');
      toast('Marked as received');
      load();
    } catch {
      toast('Could not update', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const recent = [...content].slice(0, 8);
  const topContent = [...content]
    .filter(c => c.state === 'PUBLISHED')
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  return (
    <PortalShell type="creator">
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back${creator ? `, ${creator.name.split(' ')[0]}` : ''}`}
        actions={
          <Link
            to="/creator/content/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700"
          >
            <FileVideo size={15} /> Upload content
          </Link>
        }
      />

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
                <SkeletonLine width="w-2/3" height="h-3" />
                <SkeletonLine width="w-1/2" height="h-6" />
              </div>
            ))}
          </div>
          <SkeletonLine height="h-40" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <>
          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
            <StatTile label="Content Published" value={creator?.contentPublished ?? 0} icon={<FileVideo size={15} />} />
            <StatTile label="Products Reviewed" value={creator?.productsReviewed ?? 0} icon={<Package size={15} />} />
            <StatTile label="Views" value={compact(creator?.totalViews ?? 0)} icon={<Eye size={15} />} />
            <StatTile label="Clicks" value={compact(creator?.totalClicks ?? 0)} icon={<MousePointerClick size={15} />} />
            <StatTile label="Orders" value={compact(creator?.attributedOrders ?? 0)} icon={<ShoppingBag size={15} />} />
            <StatTile label="Revenue Generated" value={inr(creator?.revenueGenerated ?? 0)} icon={<IndianRupee size={15} />} tone="brand" />
            <StatTile label="Pending Earnings" value={inr(creator?.pendingEarnings ?? 0)} icon={<Wallet size={15} />} tone="warning" />
          </div>

          {/* Needs your attention */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                Needs your attention
                {attentionCount > 0 && (
                  <span className="text-[11px] font-bold bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 tabular-nums">{attentionCount}</span>
                )}
              </h2>
              <Link to="/creator/campaigns" className="text-xs text-brand-600 font-semibold hover:underline flex items-center gap-1">
                All campaigns <ArrowRight size={12} />
              </Link>
            </div>

            {attentionCount === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">You're all caught up — nothing needs action right now.</p>
            ) : (
              <div className="space-y-5">
                {invitations.length > 0 && (
                  <AttentionGroup title="Invitations awaiting your response" icon={Send}>
                    {invitations.map(p => (
                      <div key={p.referenceId} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50">
                        <div className="min-w-0 grow">
                          <p className="text-sm font-semibold text-gray-800 line-clamp-1">{p.campaignName}</p>
                          <p className="text-xs text-gray-500">{p.partnerName} · {p.productNames.join(', ')}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            disabled={busyId === p.referenceId}
                            onClick={() => respond(p.referenceId, true)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 disabled:opacity-50"
                          >
                            <Check size={12} /> Accept
                          </button>
                          <button
                            disabled={busyId === p.referenceId}
                            onClick={() => respond(p.referenceId, false)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-bold hover:border-red-300 hover:text-red-600 disabled:opacity-50"
                          >
                            <X size={12} /> Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </AttentionGroup>
                )}

                {awaitingProduct.length > 0 && (
                  <AttentionGroup title="Product on the way" icon={Truck}>
                    {awaitingProduct.map(p => (
                      <div key={p.referenceId} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50">
                        <div className="min-w-0 grow">
                          <p className="text-sm font-semibold text-gray-800 line-clamp-1">{p.campaignName}</p>
                          <p className="text-xs text-gray-500">{p.partnerName} · {p.productNames.join(', ')}</p>
                        </div>
                        <button
                          disabled={busyId === p.referenceId}
                          onClick={() => confirmReceipt(p.referenceId)}
                          className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-700 text-xs font-bold hover:border-brand-300 hover:text-brand-700 disabled:opacity-50"
                        >
                          Confirm product received
                        </button>
                      </div>
                    ))}
                  </AttentionGroup>
                )}

                {awaitingContent.length > 0 && (
                  <AttentionGroup title="Products waiting on your content" icon={Clock3}>
                    {awaitingContent.map(p => (
                      <div key={p.referenceId} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50">
                        <div className="min-w-0 grow">
                          <p className="text-sm font-semibold text-gray-800 line-clamp-1">{p.campaignName}</p>
                          <p className="text-xs text-gray-500">{p.partnerName} · {p.productNames.join(', ')} · due {new Date(p.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                        </div>
                        <Link
                          to={`/creator/content/new?product=${p.productIds[0] ?? ''}`}
                          className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-bold hover:bg-brand-700"
                        >
                          Submit content
                        </Link>
                      </div>
                    ))}
                  </AttentionGroup>
                )}

                {underReview.length > 0 && (
                  <AttentionGroup title="Content in moderation" icon={Sparkles}>
                    {underReview.map(c => (
                      <div key={c.referenceId} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50">
                        <img src={c.thumbnailUrl} alt="" className="w-9 h-9 rounded-lg object-cover bg-gray-100 shrink-0" />
                        <div className="min-w-0 grow">
                          <p className="text-sm font-semibold text-gray-800 line-clamp-1">{c.title}</p>
                          <p className="text-xs text-gray-500 line-clamp-1">{c.productName}</p>
                        </div>
                        <ModerationBadge state={c.state} size="sm" />
                      </div>
                    ))}
                  </AttentionGroup>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent content */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-gray-800">Recent content</h2>
                <Link to="/creator/content" className="text-xs text-brand-600 font-semibold hover:underline flex items-center gap-1">
                  View all <ArrowRight size={12} />
                </Link>
              </div>
              {recent.length === 0 ? (
                <EmptyState icon={FileVideo} title="Nothing uploaded yet" message="Your first piece of content will show up here." />
              ) : (
                <div className="flex gap-3 overflow-x-auto rail-scroll pb-1">
                  {recent.map(c => (
                    <Link
                      key={c.referenceId}
                      to="/creator/content"
                      className="w-28 shrink-0 group"
                    >
                      <div className="relative w-28 h-28 rounded-xl overflow-hidden bg-gray-100 mb-1.5">
                        <img src={c.thumbnailUrl} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute bottom-1 left-1">
                          <ModerationBadge state={c.state} size="sm" />
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-gray-700 line-clamp-2 leading-snug">{c.title}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Top performing content */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-gray-800">Top performing content</h2>
                <Link to="/creator/analytics" className="text-xs text-brand-600 font-semibold hover:underline flex items-center gap-1">
                  Analytics <ArrowRight size={12} />
                </Link>
              </div>
              {topContent.length === 0 ? (
                <EmptyState icon={Star} title="No published content yet" message="Once content is published, its performance shows up here." />
              ) : (
                <div className="space-y-3">
                  {topContent.map((c, i) => (
                    <div key={c.referenceId} className="flex items-center gap-3">
                      <span className="w-5 text-xs font-bold text-gray-300 tabular-nums shrink-0">{i + 1}</span>
                      <img src={c.thumbnailUrl} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-100 shrink-0" />
                      <div className="min-w-0 grow">
                        <p className="text-sm font-semibold text-gray-800 line-clamp-1">{c.title}</p>
                        <p className="text-xs text-gray-500 line-clamp-1">{c.productName}</p>
                      </div>
                      <div className="shrink-0 flex items-center gap-3 text-xs text-gray-500 tabular-nums">
                        <span className="flex items-center gap-1"><Eye size={11} /> {compact(c.views)}</span>
                        <span className="flex items-center gap-1"><Heart size={11} /> {compact(c.likes)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </PortalShell>
  );
}

function AttentionGroup({ title, icon: Icon, children }: { title: string; icon: typeof Send; children: React.ReactNode }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        <Icon size={12} /> {title}
      </p>
      <div className="divide-y divide-gray-50">{children}</div>
    </div>
  );
}
