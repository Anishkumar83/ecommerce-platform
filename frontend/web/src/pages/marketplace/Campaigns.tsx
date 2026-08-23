import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Megaphone, Users, Package, ArrowRight, Calendar, TrendingUp } from 'lucide-react';
import MarketplaceHeader from '../../components/shared/MarketplaceHeader';
import { SkeletonCard } from '../../components/shared/LoadingSkeleton';
import { campaignService } from '../../core/services/campaign.service';
import { influencerService } from '../../core/services/influencer.service';
import type { Campaign, Influencer } from '../../core/models';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      campaignService.getActiveCampaigns(),
      influencerService.getInfluencers(1, 20),
    ]).then(([camps, infs]) => {
      setCampaigns(camps);
      setInfluencers(infs.data);
      setLoading(false);
    });
  }, []);

  const getCampaignInfluencers = (camp: Campaign) =>
    influencers.filter(inf => camp.influencerIds.includes(inf.referenceId)).slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50">
      <MarketplaceHeader />

      {/* Hero */}
      <div className="bg-gradient-to-br from-brand-900 to-brand-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-3">
            <Megaphone size={24} className="text-amber-400" />
            <span className="text-sm font-semibold text-brand-200">Creator Campaigns</span>
          </div>
          <h1 className="text-3xl font-extrabold font-display mb-2">Shop Creator Collections</h1>
          <p className="text-brand-200 max-w-lg">Discover curated product collections promoted by India's top creators. Authentic reviews, verified products.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map(camp => {
              const campInfluencers = getCampaignInfluencers(camp);
              return (
                <div key={camp.referenceId} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                  {camp.bannerUrl && (
                    <div className="relative aspect-video overflow-hidden">
                      <img src={camp.bannerUrl} alt={camp.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-3 left-3 flex items-center gap-1">
                        <span className="text-xs font-bold bg-green-500 text-white px-2 py-0.5 rounded-full">Active</span>
                      </div>
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="text-base font-bold text-gray-900 mb-1">{camp.name}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-4">{camp.description}</p>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="text-center p-2 bg-gray-50 rounded-xl">
                        <Package size={14} className="mx-auto text-brand-600 mb-1" />
                        <p className="text-xs font-bold text-gray-800">{camp.productIds.length}</p>
                        <p className="text-xs text-gray-500">Products</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded-xl">
                        <Users size={14} className="mx-auto text-purple-600 mb-1" />
                        <p className="text-xs font-bold text-gray-800">{camp.influencerIds.length}</p>
                        <p className="text-xs text-gray-500">Creators</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded-xl">
                        <TrendingUp size={14} className="mx-auto text-green-600 mb-1" />
                        <p className="text-xs font-bold text-gray-800">{(camp.reach / 1000).toFixed(0)}K</p>
                        <p className="text-xs text-gray-500">Reach</p>
                      </div>
                    </div>

                    {/* Featured creators */}
                    {campInfluencers.length > 0 && (
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex -space-x-2">
                          {campInfluencers.map(inf => (
                            <img key={inf.referenceId} src={inf.avatarUrl} alt={inf.name}
                              className="w-7 h-7 rounded-full object-cover border-2 border-white" />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">{campInfluencers.map(i => i.name.split(' ')[0]).join(', ')}</span>
                      </div>
                    )}

                    {/* Date */}
                    <div className="flex items-center gap-1 text-xs text-gray-400 mb-4">
                      <Calendar size={12} />
                      Ends {new Date(camp.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>

                    <Link to={`/campaigns/${camp.referenceId}`}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700">
                      Explore Campaign <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
