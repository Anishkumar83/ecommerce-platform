import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  BadgeCheck, UserPlus, UserCheck, Share2,
  Sparkles, Megaphone, Camera, Eye, Package, Users,
} from 'lucide-react';
import type { Creator, CreatorContent, Campaign } from '../../core/models';
import { creatorService } from '../../core/services/creator.service';
import { campaignService } from '../../core/services/campaign.service';
import { productService } from '../../core/services/product.service';
import { cartService } from '../../core/services/cart.service';
import MarketplaceHeader from '../../components/shared/MarketplaceHeader';
import PlatformIcon, { platformLabel } from '../../components/shared/PlatformIcon';
import CreatorCard from '../../components/shared/CreatorCard';
import Tabs from '../../components/shared/Tabs';
import EmptyState from '../../components/shared/EmptyState';
import ErrorState from '../../components/shared/ErrorState';
import { SkeletonCard } from '../../components/shared/LoadingSkeleton';
import { useToast } from '../../components/shared/Toast';
import { compact } from '../../components/shared/StatTile';

/**
 * Public creator profile — half portfolio, half shop. Everything on it is
 * shoppable, and the capability chips make clear whether this person creates on
 * ழ, promotes off it, or both.
 */
export default function CreatorProfilePage() {
  const { handle } = useParams<{ handle: string }>();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [content, setContent] = useState<CreatorContent[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [tab, setTab] = useState('picks');
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (!handle) return;
    setLoading(true);
    setError('');
    creatorService.getCreator(handle)
      .then(async c => {
        setCreator(c);
        const [items, all] = await Promise.all([
          creatorService.getPublishedByCreator(c.referenceId),
          campaignService.getCampaigns(1, 50),
        ]);
        setContent(items);
        setCampaigns(all.data.filter(x => (x.creatorIds ?? []).includes(c.referenceId) || x.influencerIds.includes(c.influencerId ?? '')));
      })
      .catch(() => setError('We could not find that creator.'))
      .finally(() => setLoading(false));
  }, [handle]);

  const addToCart = async (productId: string) => {
    try {
      const p = await productService.getProduct(productId);
      await cartService.addItem(p);
      toast(`${p.name} added to cart`);
    } catch {
      toast('Could not add to cart', 'error');
    }
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast('Profile link copied');
    } catch {
      toast('Could not copy the link', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface">
        <MarketplaceHeader />
        <div className="h-48 sm:h-60 bg-gray-200 skeleton" />
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (error || !creator) {
    return (
      <div className="min-h-screen bg-surface">
        <MarketplaceHeader />
        <ErrorState message={error || 'Creator not found'} />
      </div>
    );
  }

  const picks = content.filter(c => c.isTopPick);
  const isCreator = creator.capabilities.includes('CREATOR');
  const isInfluencer = creator.capabilities.includes('INFLUENCER');

  const tabs = [
    { id: 'picks', label: "Creator's Picks", count: picks.length },
    { id: 'content', label: 'All Content', count: content.length },
    ...(campaigns.length ? [{ id: 'campaigns', label: 'Campaigns', count: campaigns.length }] : []),
    { id: 'about', label: 'About' },
  ];

  return (
    <div className="min-h-screen bg-surface">
      <MarketplaceHeader />

      {/* Cover + identity */}
      <div className="relative">
        <div className="h-44 sm:h-60 bg-gradient-to-br from-brand-800 to-brand-950 overflow-hidden">
          {creator.coverUrl && (
            <img src={creator.coverUrl} alt="" className="w-full h-full object-cover opacity-55" />
          )}
        </div>

        <div className="max-w-7xl mx-auto px-4">
          <div className="relative -mt-14 sm:-mt-16 flex flex-col sm:flex-row sm:items-end gap-4 pb-6">
            <img
              src={creator.avatarUrl}
              alt={creator.name}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-4 ring-white shadow-lg shrink-0"
            />
            <div className="grow min-w-0 sm:pb-2">
              <h1 className="flex items-center gap-1.5 text-xl sm:text-2xl font-extrabold font-display text-gray-900">
                {creator.name}
                {creator.isVerified && <BadgeCheck size={20} className="text-brand-600" />}
              </h1>
              <p className="text-sm text-gray-500">@{creator.handle}</p>

              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {isCreator && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide bg-brand-50 text-brand-700 rounded-full px-2.5 py-1">
                    <Camera size={10} /> Verified Creator
                  </span>
                )}
                {isInfluencer && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide bg-purple-50 text-purple-700 rounded-full px-2.5 py-1">
                    <Megaphone size={10} /> Influencer
                  </span>
                )}
                {creator.categories.map(c => (
                  <span key={c} className="text-[11px] text-gray-500 bg-gray-100 rounded-full px-2.5 py-1">{c}</span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 sm:pb-2">
              <button
                onClick={() => { setFollowing(v => !v); toast(following ? `Unfollowed ${creator.name}` : `Following ${creator.name}`); }}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                  following
                    ? 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
                    : 'bg-brand-600 text-white hover:bg-brand-700'
                }`}
              >
                {following ? <UserCheck size={15} /> : <UserPlus size={15} />}
                {following ? 'Following' : 'Follow'}
              </button>
              <button
                onClick={share}
                aria-label="Share profile"
                className="p-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:border-brand-300 hover:text-brand-700"
              >
                <Share2 size={16} />
              </button>
            </div>
          </div>

          <p className="text-sm text-gray-600 leading-relaxed max-w-2xl -mt-2 mb-5">{creator.bio}</p>

          {/* Reach */}
          <div className="flex flex-wrap gap-x-8 gap-y-3 pb-6 border-b border-gray-200">
            <Metric icon={Users} value={compact(creator.zhaFollowers)} label="ழ followers" tamil />
            {isInfluencer && creator.followerCount > 0 && (
              <Metric icon={Megaphone} value={compact(creator.followerCount)} label="Social audience" />
            )}
            <Metric icon={Sparkles} value={String(creator.contentPublished)} label="Published" />
            <Metric icon={Package} value={String(creator.productsReviewed)} label="Products reviewed" />
            <Metric icon={Eye} value={compact(creator.totalViews)} label="Total views" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs tabs={tabs} active={tab} onChange={setTab} className="mb-6" />

        {tab === 'picks' && (
          picks.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {picks.map((c, i) => (
                <CreatorCard
                  key={c.referenceId}
                  content={c}
                  onAddToCart={addToCart}
                  className="animate-rail-in"
                  style={{ animationDelay: `${i * 45}ms` }}
                />
              ))}
            </div>
          ) : (
            <EmptyState icon={Sparkles} title="No picks yet" message={`${creator.name} has not marked any content as a top pick.`} />
          )
        )}

        {tab === 'content' && (
          content.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {content.map((c, i) => (
                <CreatorCard
                  key={c.referenceId}
                  content={c}
                  onAddToCart={addToCart}
                  className="animate-rail-in"
                  style={{ animationDelay: `${i * 45}ms` }}
                />
              ))}
            </div>
          ) : (
            <EmptyState icon={Camera} title="Nothing published yet" message="Content appears here once it clears moderation." />
          )
        )}

        {tab === 'campaigns' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map(c => (
              <Link
                key={c.referenceId}
                to={`/campaigns/${c.referenceId}`}
                className="bg-white rounded-xl border border-gray-100 p-4 hover:border-brand-200 hover:shadow-sm transition-all"
              >
                <p className="text-xs text-gray-500 mb-1">{c.partnerName}</p>
                <p className="text-sm font-bold text-gray-900 mb-2">{c.name}</p>
                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{c.description}</p>
              </Link>
            ))}
          </div>
        )}

        {tab === 'about' && (
          <div className="max-w-2xl space-y-6">
            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-2">About</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{creator.bio}</p>
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-2">What {creator.name.split(' ')[0]} does on ழ</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                {isCreator && (
                  <li className="flex gap-2">
                    <Camera size={15} className="text-brand-600 mt-0.5 shrink-0" />
                    Creates photos, video and written reviews published directly on ழ.
                  </li>
                )}
                {isInfluencer && (
                  <li className="flex gap-2">
                    <Megaphone size={15} className="text-purple-600 mt-0.5 shrink-0" />
                    Promotes campaign products to an audience on social platforms, through tracked ழ links.
                  </li>
                )}
              </ul>
            </div>

            {isInfluencer && creator.socialPlatforms.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-2">Channels</h3>
                <div className="space-y-2">
                  {creator.socialPlatforms.map(p => (
                    <div key={p.platform} className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3">
                      <PlatformIcon platform={p.platform} className="shrink-0" />
                      <div className="grow min-w-0">
                        <p className="text-sm font-semibold text-gray-800">{platformLabel(p.platform)}</p>
                        <p className="text-xs text-gray-500 truncate">{p.handle}</p>
                      </div>
                      <span className="text-sm font-bold text-gray-900 tabular-nums shrink-0">{compact(p.followers)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-2">Categories</h3>
              <div className="flex flex-wrap gap-1.5">
                {creator.categories.map(c => (
                  <Link
                    key={c}
                    to={`/products?category=${encodeURIComponent(c)}`}
                    className="text-xs text-gray-600 bg-white border border-gray-200 rounded-full px-3 py-1.5 hover:border-brand-300 hover:text-brand-700"
                  >
                    {c}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ icon: Icon, value, label, tamil }: { icon: typeof Users; value: string; label: string; tamil?: boolean }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-lg font-bold font-display text-gray-900 tabular-nums leading-none">
        <Icon size={14} className="text-gray-300" />
        {value}
      </p>
      <p className="text-xs text-gray-500 mt-1">
        {tamil ? <><span className="font-tamil">ழ</span> followers</> : label}
      </p>
    </div>
  );
}
