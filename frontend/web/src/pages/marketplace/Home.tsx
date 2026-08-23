import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Star, ShoppingCart, Heart, Cpu, Shirt, Sparkles, Home as HomeIcon, Dumbbell, Plane, Coffee, Tag, ChevronRight, Users, Megaphone, TrendingUp, Camera } from 'lucide-react';
import MarketplaceHeader from '../../components/shared/MarketplaceHeader';
import StatusBadge from '../../components/shared/StatusBadge';
import ZhaLogo from '../../components/shared/ZhaLogo';
import CreatorTopPicks from '../../components/shared/CreatorTopPicks';
import { productService } from '../../core/services/product.service';
import { campaignService } from '../../core/services/campaign.service';
import { cartService } from '../../core/services/cart.service';
import type { Product, Campaign } from '../../core/models';

const CATEGORIES = [
  { name: 'Electronics', icon: Cpu, color: 'bg-blue-50 text-blue-600', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&h=200&fit=crop' },
  { name: 'Fashion', icon: Shirt, color: 'bg-pink-50 text-pink-600', image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=200&fit=crop' },
  { name: 'Beauty', icon: Sparkles, color: 'bg-purple-50 text-purple-600', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&h=200&fit=crop' },
  { name: 'Home & Living', icon: HomeIcon, color: 'bg-amber-50 text-amber-600', image: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=200&h=200&fit=crop' },
  { name: 'Fitness', icon: Dumbbell, color: 'bg-green-50 text-green-600', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop' },
  { name: 'Travel', icon: Plane, color: 'bg-cyan-50 text-cyan-600', image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=200&h=200&fit=crop' },
  { name: 'Food & Beverage', icon: Coffee, color: 'bg-orange-50 text-orange-600', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&h=200&fit=crop' },
  { name: 'Lifestyle', icon: Tag, color: 'bg-rose-50 text-rose-600', image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop' },
];


function ProductCard({ product, onAddToCart }: { product: Product; onAddToCart: (p: Product) => void }) {
  const [wishlisted, setWishlisted] = useState(false);
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    setAdding(true);
    try { await onAddToCart(product); } finally { setAdding(false); }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
      <Link to={`/products/${product.referenceId}`} className="block relative">
        <div className="aspect-square bg-gray-50 overflow-hidden">
          <img
            src={product.media.find(m => m.isPrimary)?.url}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <button
          onClick={e => { e.preventDefault(); setWishlisted(!wishlisted); }}
          className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full shadow-sm flex items-center justify-center hover:bg-red-50"
        >
          <Heart size={15} className={wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
        </button>
        {product.isBestSeller && (
          <span className="absolute top-3 left-3 text-xs font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">Best Seller</span>
        )}
        {product.isNewArrival && (
          <span className="absolute top-3 left-3 text-xs font-bold bg-brand-600 text-white px-2 py-0.5 rounded-full">New</span>
        )}
      </Link>
      <div className="p-3">
        <Link to={`/products/${product.referenceId}`}>
          <p className="text-xs text-gray-400 mb-0.5">{product.brand}</p>
          <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug mb-1.5">{product.name}</h3>
          <div className="flex items-center gap-1 mb-2">
            <Star size={12} className="fill-amber-400 text-amber-400" />
            <span className="text-xs font-semibold text-gray-700">{product.rating}</span>
            <span className="text-xs text-gray-400">({product.reviewCount.toLocaleString()})</span>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
            <span className="text-xs text-gray-400 line-through">₹{product.mrp.toLocaleString()}</span>
            <span className="text-xs font-bold text-green-600">{product.discount}% off</span>
          </div>
        </Link>
        <button
          onClick={handleAdd}
          disabled={adding}
          className="w-full flex items-center justify-center gap-2 py-2 bg-brand-50 text-brand-700 text-xs font-semibold rounded-xl hover:bg-brand-600 hover:text-white transition-colors disabled:opacity-50"
        >
          <ShoppingCart size={14} />
          {adding ? 'Adding...' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}

/**
 * The three ways to join ழ. Creator and Influencer are separate entries because
 * they are different jobs — but the same person can hold both, which the
 * onboarding copy says explicitly.
 */
const GROW_PATHS = [
  {
    title: 'Become a Partner',
    body: 'List your products, run your own campaigns, and reach customers through creators who actually use what you make.',
    cta: 'Get Started',
    href: '/onboarding/partner',
    icon: Users,
    bg: 'bg-gradient-to-br from-brand-600 to-brand-800',
    iconClass: 'text-brand-200',
    textClass: 'text-brand-100',
  },
  {
    title: 'Become a Creator',
    body: 'Receive products, use them properly, and publish photos, video and reviews on ழ. Earn a content fee plus commission on what your reviews sell.',
    cta: 'Start Creating',
    href: '/onboarding/creator',
    icon: Camera,
    bg: 'bg-gradient-to-br from-purple-600 to-purple-900',
    iconClass: 'text-purple-200',
    textClass: 'text-purple-100',
  },
  {
    title: 'Become an Influencer',
    body: 'Bring your Instagram, YouTube or Facebook audience. Get a tracked link per campaign and earn commission on every attributed sale.',
    cta: 'Apply Now',
    href: '/onboarding/influencer',
    icon: Megaphone,
    bg: 'bg-gradient-to-br from-teal-600 to-emerald-800',
    iconClass: 'text-emerald-200',
    textClass: 'text-emerald-100',
  },
];

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [addedMsg, setAddedMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    productService.getFeaturedProducts().then(p => setFeaturedProducts(p.slice(0, 8)));
    productService.getNewArrivals().then(setNewArrivals);
    productService.getBestSellers().then(setBestSellers);
    campaignService.getActiveCampaigns().then(setCampaigns);
  }, []);

  const handleAddToCart = async (product: Product) => {
    await cartService.addItem(product);
    setAddedMsg(`${product.name} added to cart!`);
    setTimeout(() => setAddedMsg(''), 3000);
  };

  return (
    <div className="min-h-screen bg-white">
      <MarketplaceHeader />

      {/* Toast */}
      {addedMsg && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-xl z-50 text-sm font-medium flex items-center gap-2">
          <ShoppingCart size={16} className="text-green-400" /> {addedMsg}
        </div>
      )}

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1400&h=600&fit=crop" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-950/90 via-brand-900/70 to-transparent" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-24">
          <div className="max-w-lg">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1.5 mb-6">
              <TrendingUp size={14} className="text-amber-400" />
              <span className="text-xs font-semibold text-white">1,200+ verified products</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold font-display text-white leading-tight mb-4">
              Discover products<br />you'll love
            </h1>
            <p className="text-base text-white/80 mb-8 leading-relaxed">
              Shop products from verified partners and discover trending items promoted by your favorite creators.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/products')}
                className="flex items-center gap-2 px-6 py-3 bg-brand-500 text-white font-bold rounded-xl hover:bg-brand-400 text-sm shadow-lg shadow-brand-900/30"
              >
                Shop Now <ArrowRight size={16} />
              </button>
              <button
                onClick={() => navigate('/campaigns')}
                className="flex items-center gap-2 px-6 py-3 bg-white/15 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-white/25 text-sm border border-white/20"
              >
                Explore Campaigns
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4">
        {/* Categories */}
        <section className="py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold font-display text-gray-900">Shop by Category</h2>
            <Link to="/products" className="text-sm text-brand-600 font-semibold flex items-center gap-1 hover:underline">
              View all <ChevronRight size={15} />
            </Link>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {CATEGORIES.map(cat => (
              <Link
                key={cat.name}
                to={`/products?category=${encodeURIComponent(cat.name)}`}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <div className="w-14 h-14 rounded-2xl overflow-hidden">
                  <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-xs font-medium text-gray-600 text-center leading-tight">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold font-display text-gray-900">Featured Products</h2>
              <p className="text-sm text-gray-500 mt-0.5">Curated picks from our verified partners</p>
            </div>
            <Link to="/products" className="text-sm text-brand-600 font-semibold flex items-center gap-1 hover:underline">
              View all <ChevronRight size={15} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featuredProducts.map(p => (
              <ProductCard key={p.referenceId} product={p} onAddToCart={handleAddToCart} />
            ))}
          </div>
        </section>

        {/* Promo banner */}
        <section className="py-8">
          <div className="relative rounded-3xl overflow-hidden">
            <img src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&h=300&fit=crop" alt="" className="w-full h-48 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/90 to-transparent flex items-center">
              <div className="px-10">
                <p className="text-emerald-300 text-sm font-semibold mb-1">FitLife Challenge 2026</p>
                <h3 className="text-2xl font-extrabold font-display text-white mb-3">Get fit this season</h3>
                <Link to="/campaigns/CMP260822A05" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-emerald-800 text-sm font-bold rounded-xl hover:bg-gray-50">
                  Join the Challenge <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Creator's Top Picks — live creator content, shoppable in place */}
        <CreatorTopPicks />

        {/* New Arrivals + Best Sellers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold font-display text-gray-900">New Arrivals</h2>
              <Link to="/products?sortBy=newest" className="text-sm text-brand-600 hover:underline">View all</Link>
            </div>
            <div className="space-y-3">
              {newArrivals.slice(0, 4).map(p => (
                <Link key={p.referenceId} to={`/products/${p.referenceId}`} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:shadow-sm transition-shadow">
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-50 shrink-0">
                    <img src={p.media.find(m => m.isPrimary)?.url} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 line-clamp-1">{p.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star size={11} className="fill-amber-400 text-amber-400" />
                      <span className="text-xs text-gray-500">{p.rating}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-gray-900">₹{p.price.toLocaleString()}</p>
                    <p className="text-xs text-green-600">{p.discount}% off</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold font-display text-gray-900">Best Sellers</h2>
              <Link to="/products?sortBy=popular" className="text-sm text-brand-600 hover:underline">View all</Link>
            </div>
            <div className="space-y-3">
              {bestSellers.slice(0, 4).map((p, i) => (
                <Link key={p.referenceId} to={`/products/${p.referenceId}`} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:shadow-sm transition-shadow">
                  <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-amber-700">#{i + 1}</span>
                  </div>
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-50 shrink-0">
                    <img src={p.media.find(m => m.isPrimary)?.url} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 line-clamp-1">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.reviewCount.toLocaleString()} reviews</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-gray-900">₹{p.price.toLocaleString()}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* Featured Campaigns */}
        <section className="py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold font-display text-gray-900">Featured Campaigns</h2>
              <p className="text-sm text-gray-500 mt-0.5">Shop curated collections from top campaigns</p>
            </div>
            <Link to="/campaigns" className="text-sm text-brand-600 font-semibold flex items-center gap-1 hover:underline">
              All campaigns <ChevronRight size={15} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {campaigns.slice(0, 3).map(c => (
              <Link key={c.referenceId} to={`/campaigns/${c.referenceId}`} className="group relative rounded-2xl overflow-hidden aspect-video">
                <img src={c.bannerUrl} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Megaphone size={12} className="text-amber-400" />
                    <span className="text-xs text-amber-400 font-semibold">Active Campaign</span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{c.name}</h3>
                  <p className="text-xs text-white/70 mt-0.5">{c.influencerIds.length} creators · {c.productIds.length} products</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Grow With ழ */}
        <section className="py-12 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold font-display text-gray-900 mb-2">
              Grow With <span className="font-tamil">ழ</span>
            </h2>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Sell your products, review what you love, or bring your audience. Pick the one that fits — you can add another later.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {GROW_PATHS.map(path => (
              <Link
                key={path.title}
                to={path.href}
                className={`group relative overflow-hidden rounded-3xl p-7 text-white ${path.bg} transition-transform hover:-translate-y-1`}
              >
                <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full transition-transform group-hover:scale-125" />
                <path.icon size={30} className={`mb-4 ${path.iconClass}`} />
                <h3 className="text-lg font-bold font-display mb-2">{path.title}</h3>
                <p className={`text-sm leading-relaxed mb-6 ${path.textClass}`}>{path.body}</p>
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/95 text-gray-900 text-xs font-bold rounded-xl group-hover:bg-white">
                  {path.cta} <ArrowRight size={14} />
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="col-span-2">
              <ZhaLogo size={34} wordmarkClass="text-white" className="mb-3" />
              <p className="text-sm text-gray-400 leading-relaxed mb-4">A multi-sided marketplace connecting partners, influencers, and customers in one platform.</p>
              <div className="flex gap-3">
                {['IN', 'YT', 'TW'].map(s => (
                  <div key={s} className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-xs font-bold text-gray-400 hover:bg-white/20 cursor-pointer">{s}</div>
                ))}
              </div>
            </div>
            {/* Grow With ழ — the three ways to join, as real links */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Grow With <span className="font-tamil">ழ</span>
              </h4>
              <ul className="space-y-2">
                {GROW_PATHS.map(p => (
                  <li key={p.title}>
                    <Link
                      to={p.href}
                      className="inline-flex items-center gap-1.5 text-sm text-gray-300 hover:text-white font-medium group"
                    >
                      {p.title}
                      <ArrowRight size={12} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            {[
              { title: 'Platform', links: [{ label: 'About Us' }, { label: 'Careers' }, { label: 'Press' }, { label: 'Blog' }] },
              { title: 'Discover', links: [{ label: 'Shop All', href: '/products' }, { label: 'Campaigns', href: '/campaigns' }, { label: 'Creators', href: '/creators' }, { label: 'Deals' }] },
              { title: 'Help', links: [{ label: 'Customer Service' }, { label: 'Returns' }, { label: 'Shipping Info' }, { label: 'Privacy Policy' }] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map(l => (
                    <li key={l.label}>
                      {l.href
                        ? <Link to={l.href} className="text-sm text-gray-500 hover:text-white">{l.label}</Link>
                        : <a href="#" className="text-sm text-gray-500 hover:text-white">{l.label}</a>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-600">© 2026 <span className="font-tamil">ழ</span> Platform. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="text-xs text-gray-600 hover:text-gray-400">Terms</a>
              <a href="#" className="text-xs text-gray-600 hover:text-gray-400">Privacy</a>
              <a href="#" className="text-xs text-gray-600 hover:text-gray-400">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
