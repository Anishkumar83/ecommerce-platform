import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowRight, Users, Package, TrendingUp, Calendar, Star, ShoppingCart } from 'lucide-react';
import MarketplaceHeader from '../../components/shared/MarketplaceHeader';
import LoadingSkeleton from '../../components/shared/LoadingSkeleton';
import { campaignService } from '../../core/services/campaign.service';
import { influencerService } from '../../core/services/influencer.service';
import { productService } from '../../core/services/product.service';
import { cartService } from '../../core/services/cart.service';
import type { Campaign, Influencer, Product } from '../../core/models';

export default function CampaignDetailPage() {
  const { referenceId } = useParams<{ referenceId: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!referenceId) return;
    campaignService.getCampaign(referenceId).then(async c => {
      setCampaign(c);
      const [infs, prods] = await Promise.all([
        Promise.all(c.influencerIds.map(id => influencerService.getInfluencer(id).catch(() => null))),
        Promise.all(c.productIds.map(id => productService.getProduct(id).catch(() => null))),
      ]);
      setInfluencers(infs.filter(Boolean) as Influencer[]);
      setProducts(prods.filter(Boolean) as Product[]);
      setLoading(false);
    });
  }, [referenceId]);

  const handleAddToCart = async (product: Product) => {
    await cartService.addItem(product);
    setToast(`${product.name.slice(0, 25)}... added!`);
    setTimeout(() => setToast(''), 3000);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50"><MarketplaceHeader /><div className="max-w-7xl mx-auto px-4 py-8"><LoadingSkeleton /></div></div>
  );

  if (!campaign) return (
    <div className="min-h-screen bg-gray-50"><MarketplaceHeader /><div className="py-16 text-center text-gray-500">Campaign not found</div></div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <MarketplaceHeader />

      {toast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-xl z-50 text-sm font-medium flex items-center gap-2">
          <ShoppingCart size={16} className="text-green-400" /> {toast}
        </div>
      )}

      {/* Banner */}
      {campaign.bannerUrl && (
        <div className="relative h-64 overflow-hidden">
          <img src={campaign.bannerUrl} alt={campaign.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="max-w-7xl mx-auto">
              <span className="text-xs font-bold bg-green-500 text-white px-2 py-1 rounded-full">Active Campaign</span>
              <h1 className="text-3xl font-extrabold font-display text-white mt-2">{campaign.name}</h1>
              <p className="text-white/70 text-sm mt-1">by {campaign.partnerName}</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Description */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
              <p className="text-sm text-gray-600 leading-relaxed">{campaign.description}</p>

              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="text-center p-3 bg-brand-50 rounded-xl">
                  <Package size={18} className="mx-auto text-brand-600 mb-1" />
                  <p className="text-lg font-bold text-gray-900">{campaign.productIds.length}</p>
                  <p className="text-xs text-gray-500">Products</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-xl">
                  <Users size={18} className="mx-auto text-purple-600 mb-1" />
                  <p className="text-lg font-bold text-gray-900">{campaign.influencerIds.length}</p>
                  <p className="text-xs text-gray-500">Creators</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-xl">
                  <TrendingUp size={18} className="mx-auto text-green-600 mb-1" />
                  <p className="text-lg font-bold text-gray-900">{(campaign.reach / 1000).toFixed(0)}K</p>
                  <p className="text-xs text-gray-500">Total Reach</p>
                </div>
              </div>
            </div>

            {/* Products */}
            <div className="mb-6">
              <h2 className="text-lg font-bold font-display text-gray-900 mb-4">Featured Products</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {products.map(p => (
                  <div key={p.referenceId} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-sm">
                    <Link to={`/products/${p.referenceId}`}>
                      <div className="aspect-square bg-gray-50 overflow-hidden">
                        <img src={p.media.find(m => m.isPrimary)?.url} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                    </Link>
                    <div className="p-3">
                      <p className="text-xs text-gray-400">{p.brand}</p>
                      <Link to={`/products/${p.referenceId}`} className="text-sm font-semibold text-gray-800 line-clamp-2 hover:text-brand-600">{p.name}</Link>
                      <div className="flex items-center gap-1 my-1">
                        <Star size={11} className="fill-amber-400 text-amber-400" />
                        <span className="text-xs text-gray-600">{p.rating}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-900">₹{p.price.toLocaleString()}</span>
                        <button onClick={() => handleAddToCart(p)} className="w-7 h-7 bg-brand-600 text-white rounded-lg flex items-center justify-center hover:bg-brand-700">
                          <ShoppingCart size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            {/* Creator picks */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
              <h2 className="text-sm font-bold text-gray-800 mb-4">Featured Creators</h2>
              <div className="space-y-4">
                {influencers.map(inf => (
                  <div key={inf.referenceId} className="flex items-center gap-3">
                    <img src={inf.avatarUrl} alt={inf.name} className="w-12 h-12 rounded-xl object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800">{inf.name}</p>
                      <p className="text-xs text-gray-500">{inf.category}</p>
                      <p className="text-xs text-brand-600 font-semibold">{(inf.followerCount / 1000).toFixed(0)}K followers</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-sm font-bold text-gray-800 mb-3">Campaign Details</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Partner</p>
                  <p className="text-sm font-semibold text-gray-800">{campaign.partnerName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Duration</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Calendar size={12} className="text-gray-400" />
                    <p className="text-sm font-semibold text-gray-800">
                      {new Date(campaign.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} —{' '}
                      {new Date(campaign.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
              <Link to="/products" className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700">
                Shop All Products <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
