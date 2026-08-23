import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, ShoppingCart, Heart, ChevronRight, Minus, Plus, Play, Shield, Truck, RotateCcw, Check, ChevronLeft } from 'lucide-react';
import MarketplaceHeader from '../../components/shared/MarketplaceHeader';
import LoadingSkeleton from '../../components/shared/LoadingSkeleton';
import ErrorState from '../../components/shared/ErrorState';
import StatusBadge from '../../components/shared/StatusBadge';
import CreatorReviews from '../../components/shared/CreatorReviews';
import { creatorService } from '../../core/services/creator.service';
import { productService } from '../../core/services/product.service';
import { campaignService } from '../../core/services/campaign.service';
import { influencerService } from '../../core/services/influencer.service';
import { cartService } from '../../core/services/cart.service';
import type { Product, Campaign, Influencer } from '../../core/models';

const MOCK_REVIEWS = [
  { name: 'Amit K.', rating: 5, date: '12 Aug 2026', text: 'Excellent quality! Exactly as described. Very happy with this purchase.' },
  { name: 'Priya S.', rating: 4, date: '8 Aug 2026', text: 'Good product. Packaging was great and delivery was fast.' },
  { name: 'Vikram R.', rating: 5, date: '5 Aug 2026', text: 'Exceeded my expectations. Would definitely recommend to friends and family.' },
];

export default function ProductDetailPage() {
  const { referenceId } = useParams<{ referenceId: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [featuredInfluencer, setFeaturedInfluencer] = useState<Influencer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [toast, setToast] = useState('');
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'creator' | 'reviews'>('description');
  const [creatorCount, setCreatorCount] = useState(0);

  useEffect(() => {
    if (!referenceId) return;
    setLoading(true);
    productService.getProduct(referenceId)
      .then(async p => {
        setProduct(p);
        if (p.variants.length > 0) setSelectedVariantId(p.variants[0].referenceId);

        if (p.campaignIds.length > 0) {
          const camp = await campaignService.getCampaign(p.campaignIds[0]).catch(() => null);
          if (camp) {
            setCampaigns([camp]);
            if (camp.influencerIds.length > 0) {
              const inf = await influencerService.getInfluencer(camp.influencerIds[0]).catch(() => null);
              if (inf) setFeaturedInfluencer(inf);
            }
          }
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [referenceId]);

  useEffect(() => {
    if (!product) return;
    creatorService.getProductCreatorContent(product.referenceId).then(c => setCreatorCount(c.length));
  }, [product]);

  const handleAddToCart = async (buyNow = false) => {
    if (!product) return;
    setAddingToCart(true);
    try {
      await cartService.addItem(product, selectedVariantId || undefined, quantity);
      if (buyNow) {
        navigate('/cart');
      } else {
        setToast('Added to cart!');
        setTimeout(() => setToast(''), 3000);
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setToast(e?.message ?? 'Failed to add to cart');
      setTimeout(() => setToast(''), 4000);
    } finally {
      setAddingToCart(false);
    }
  };

  const currentPrice = selectedVariantId
    ? product?.variants.find(v => v.referenceId === selectedVariantId)?.price ?? product?.price ?? 0
    : product?.price ?? 0;

  const uniqueColors = product?.variants.filter((v, i, arr) => arr.findIndex(x => x.color === v.color) === i) ?? [];
  const uniqueSizes = product?.variants.filter((v, i, arr) => arr.findIndex(x => x.size === v.size) === i).filter(v => v.size) ?? [];

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <MarketplaceHeader />
      <div className="max-w-7xl mx-auto px-4 py-8"><LoadingSkeleton /></div>
    </div>
  );

  if (error || !product) return (
    <div className="min-h-screen bg-gray-50">
      <MarketplaceHeader />
      <div className="max-w-7xl mx-auto px-4 py-8"><ErrorState type="not_found" message="Product not found" onRetry={() => navigate('/products')} /></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <MarketplaceHeader />

      {toast && (
        <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl shadow-xl z-50 text-sm font-medium flex items-center gap-2 ${toast.includes('Failed') || toast.includes('Only') ? 'bg-red-600' : 'bg-gray-900'} text-white`}>
          {toast.includes('Added') && <Check size={16} className="text-green-400" />}
          {toast}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-xs text-gray-500 mb-6">
          <Link to="/" className="hover:text-brand-600">Home</Link>
          <ChevronRight size={12} />
          <Link to="/products" className="hover:text-brand-600">Products</Link>
          <ChevronRight size={12} />
          <Link to={`/products?category=${product.category}`} className="hover:text-brand-600">{product.category}</Link>
          <ChevronRight size={12} />
          <span className="text-gray-400 line-clamp-1">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Images */}
          <div>
            <div className="relative bg-white rounded-2xl overflow-hidden aspect-square mb-3">
              {product.media[selectedImage]?.type === 'VIDEO' ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-900">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/30">
                    <Play size={24} className="text-white ml-1" />
                  </div>
                </div>
              ) : (
                <img
                  src={product.media[selectedImage]?.url}
                  alt={product.name}
                  className="w-full h-full object-contain p-4"
                />
              )}
              {/* Nav arrows */}
              {product.media.length > 1 && (
                <>
                  <button onClick={() => setSelectedImage(i => Math.max(0, i - 1))} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white shadow-md rounded-full flex items-center justify-center hover:bg-gray-50">
                    <ChevronLeft size={16} />
                  </button>
                  <button onClick={() => setSelectedImage(i => Math.min(product.media.length - 1, i + 1))} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white shadow-md rounded-full flex items-center justify-center hover:bg-gray-50">
                    <ChevronRight size={16} />
                  </button>
                </>
              )}
            </div>
            {/* Thumbnails */}
            {product.media.length > 1 && (
              <div className="flex gap-2">
                {product.media.map((m, i) => (
                  <button
                    key={m.referenceId}
                    onClick={() => setSelectedImage(i)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 ${selectedImage === i ? 'border-brand-500' : 'border-gray-200'}`}
                  >
                    {m.type === 'VIDEO' ? (
                      <div className="w-full h-full bg-gray-900 flex items-center justify-center"><Play size={12} className="text-white" /></div>
                    ) : (
                      <img src={m.url} alt="" className="w-full h-full object-cover" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            {product.isVerifiedPartner && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 mb-2">
                <Shield size={13} className="fill-brand-100 text-brand-600" />
                Verified Partner
              </div>
            )}
            <h1 className="text-xl font-bold font-display text-gray-900 leading-snug mb-2">{product.name}</h1>
            <p className="text-xs text-gray-500 mb-3">by <span className="font-semibold text-gray-700">{product.partnerName}</span></p>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} className={i < Math.floor(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
                ))}
                <span className="text-sm font-bold text-gray-700 ml-1">{product.rating}</span>
              </div>
              <span className="text-sm text-gray-400">({product.reviewCount.toLocaleString()} reviews)</span>
              <StatusBadge status={product.publishStatus} size="sm" />
            </div>

            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-3xl font-extrabold text-gray-900">₹{currentPrice.toLocaleString()}</span>
              <span className="text-base text-gray-400 line-through">₹{product.mrp.toLocaleString()}</span>
              <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{product.discount}% OFF</span>
            </div>
            <p className="text-xs text-gray-500 mb-5">Inclusive of all taxes</p>

            {/* Color variants */}
            {uniqueColors.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Color</p>
                <div className="flex flex-wrap gap-2">
                  {uniqueColors.map(v => (
                    <button
                      key={v.referenceId}
                      onClick={() => setSelectedVariantId(v.referenceId)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border-2 ${selectedVariantId === v.referenceId ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                    >
                      {v.color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size variants */}
            {uniqueSizes.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Size</p>
                <div className="flex flex-wrap gap-2">
                  {uniqueSizes.map(v => (
                    <button key={v.referenceId} onClick={() => setSelectedVariantId(v.referenceId)}
                      className={`w-10 h-10 text-xs font-semibold rounded-lg border-2 ${selectedVariantId === v.referenceId ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      {v.size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-700 mb-2">Quantity</p>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-gray-200 rounded-xl">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 rounded-l-xl">
                    <Minus size={14} />
                  </button>
                  <span className="w-12 text-center text-sm font-semibold">{quantity}</span>
                  <button onClick={() => setQuantity(q => Math.min(product.stock, q + 1))} className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 rounded-r-xl">
                    <Plus size={14} />
                  </button>
                </div>
                <span className="text-xs text-gray-500">{product.stock} in stock</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mb-6">
              <button onClick={() => handleAddToCart(false)} disabled={addingToCart}
                className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-brand-600 text-brand-700 font-bold rounded-xl hover:bg-brand-50 text-sm disabled:opacity-50">
                <ShoppingCart size={16} />
                {addingToCart ? 'Adding...' : 'Add to Cart'}
              </button>
              <button onClick={() => handleAddToCart(true)} disabled={addingToCart}
                className="flex-1 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 text-sm disabled:opacity-50">
                Buy Now
              </button>
              <button onClick={() => setWishlisted(!wishlisted)}
                className={`w-12 h-12 flex items-center justify-center border-2 rounded-xl ${wishlisted ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                <Heart size={18} className={wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
              </button>
            </div>

            {/* Delivery info */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 rounded-xl">
              <div className="flex flex-col items-center gap-1 text-center">
                <Truck size={18} className="text-brand-600" />
                <span className="text-xs text-gray-600 font-medium">Free Delivery</span>
                <span className="text-xs text-gray-400">On orders ₹500+</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <RotateCcw size={18} className="text-green-600" />
                <span className="text-xs text-gray-600 font-medium">Easy Returns</span>
                <span className="text-xs text-gray-400">30-day policy</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <Shield size={18} className="text-amber-600" />
                <span className="text-xs text-gray-600 font-medium">Secure Pay</span>
                <span className="text-xs text-gray-400">256-bit SSL</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-gray-100 mb-6">
          <div className="flex border-b border-gray-100 overflow-x-auto">
            {(['description', 'specs', 'creator', 'reviews'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 sm:px-6 py-4 text-sm font-semibold capitalize whitespace-nowrap ${activeTab === tab ? 'border-b-2 border-brand-600 text-brand-700' : 'text-gray-500 hover:text-gray-700'}`}>
                {tab === 'specs' ? 'Specifications' : tab === 'creator' ? 'Creator Reviews' : tab === 'reviews' ? 'Customer Reviews' : tab}
                {tab === 'reviews' && <span className="ml-1 text-xs text-gray-400">({product.reviewCount.toLocaleString()})</span>}
                {tab === 'creator' && creatorCount > 0 && <span className="ml-1 text-xs text-gray-400">({creatorCount})</span>}
              </button>
            ))}
          </div>
          <div className="p-6">
            {activeTab === 'description' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
                {product.features && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-3">Key Features</h3>
                    <ul className="space-y-2">
                      {product.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <Check size={14} className="text-green-500 mt-0.5 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'specs' && product.specifications && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(product.specifications).map(([key, val]) => (
                  <div key={key} className="flex gap-3 py-2.5 border-b border-gray-50">
                    <span className="text-sm text-gray-500 w-36 shrink-0">{key}</span>
                    <span className="text-sm font-medium text-gray-800">{val}</span>
                  </div>
                ))}
              </div>
            )}
            {activeTab === 'creator' && (
              <div>
                <p className="text-sm text-gray-500 mb-5 max-w-2xl">
                  Photos, video and written reviews from verified creators who used this product. Creator
                  reviews are separate from customer reviews and never counted in the product rating.
                </p>
                <CreatorReviews productId={product.referenceId} />
              </div>
            )}
            {activeTab === 'reviews' && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl mb-4">
                  <div className="text-center">
                    <p className="text-4xl font-extrabold text-gray-900">{product.rating}</p>
                    <div className="flex gap-0.5 mt-1">
                      {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} className={i < Math.floor(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{product.reviewCount.toLocaleString()} reviews</p>
                  </div>
                </div>
                {MOCK_REVIEWS.map((r, i) => (
                  <div key={i} className="py-4 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center text-xs font-bold text-brand-700">{r.name[0]}</div>
                      <span className="text-sm font-semibold text-gray-800">{r.name}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500 bg-gray-100 rounded px-1.5 py-0.5">Customer Review</span>
                      <div className="flex gap-0.5 ml-1">
                        {Array.from({ length: r.rating }).map((_, j) => <Star key={j} size={11} className="fill-amber-400 text-amber-400" />)}
                      </div>
                      <span className="text-xs text-gray-400 ml-auto">{r.date}</span>
                    </div>
                    <p className="text-sm text-gray-600">{r.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Creator section */}
        {featuredInfluencer && campaigns.length > 0 && (
          <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl border border-purple-100 p-6 mb-6">
            <h3 className="text-sm font-bold text-gray-700 mb-4">Featured Creator</h3>
            <div className="flex items-start gap-4">
              <img src={featuredInfluencer.avatarUrl} alt={featuredInfluencer.name} className="w-16 h-16 rounded-2xl object-cover ring-2 ring-purple-200" />
              <div className="flex-1">
                <p className="text-base font-bold text-gray-800">{featuredInfluencer.name}</p>
                <p className="text-xs text-purple-600 font-medium">{featuredInfluencer.category}</p>
                <p className="text-sm text-gray-600 mt-2 italic">"Check out this amazing product — it's been a game-changer for me!"</p>
                <p className="text-xs text-gray-400 mt-2">Campaign: <span className="text-brand-600 font-semibold">{campaigns[0].name}</span></p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
