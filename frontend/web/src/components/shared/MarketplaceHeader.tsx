import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, ChevronDown, LogOut, Package, Heart, LayoutDashboard, Sparkles, Megaphone } from 'lucide-react';
import { useAuth } from '../../core/auth/AuthContext';
import { cartService } from '../../core/services/cart.service';
import NotificationCenter from './NotificationCenter';
import ZhaLogo from './ZhaLogo';

const CATEGORIES = ['Electronics', 'Fashion', 'Beauty', 'Home & Living', 'Fitness', 'Travel', 'Food & Beverage', 'Accessories', 'Lifestyle'];

export default function MarketplaceHeader() {
  const { isAuthenticated, currentUser, currentRole, logout } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);
  const catRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCartCount(cartService.getItemCount());
    const interval = setInterval(() => setCartCount(cartService.getItemCount()), 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false);
      if (catRef.current && !catRef.current.contains(e.target as Node)) setCategoryOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) navigate(`/products?search=${encodeURIComponent(search.trim())}`);
  };

  const getPortalLink = () => {
    switch (currentRole) {
      case 'ADMIN': case 'MAKER': case 'CHECKER': return '/admin';
      case 'PARTNER': return '/partner';
      case 'CREATOR': return '/creator';
      case 'INFLUENCER': return '/influencer';
      default: return '/profile';
    }
  };

  return (
    <header className="bg-white sticky top-0 z-40 shadow-sm">
      {/* Top bar */}
      <div className="border-b border-gray-100 bg-brand-950 text-white">
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between gap-4 text-xs">
          <span className="hidden sm:block text-white/60 shrink-0">Free delivery on orders above ₹500</span>
          <div className="flex items-center gap-4 text-white/70 overflow-x-auto rail-scroll whitespace-nowrap">
            <Link to="/onboarding/partner" className="hover:text-white">Become a Partner</Link>
            <Link to="/onboarding/creator" className="hover:text-white">Become a Creator</Link>
            <Link to="/onboarding/influencer" className="hover:text-white">Become an Influencer</Link>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <Link to="/" className="shrink-0 transition-transform hover:scale-[1.03]" aria-label="ழ home">
            <ZhaLogo size={36} />
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search for products, brands, categories..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 bg-gray-50"
              />
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {isAuthenticated && <NotificationCenter />}

            {/* Cart */}
            <Link to="/cart" className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-gray-100">
              <ShoppingCart size={20} className="text-gray-600" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
              <span className="hidden sm:inline text-sm font-medium text-gray-700">Cart</span>
            </Link>

            {/* Account */}
            {isAuthenticated ? (
              <div ref={userRef} className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100"
                >
                  <div className="w-7 h-7 rounded-full bg-brand-100 overflow-hidden">
                    {currentUser?.avatarUrl ? (
                      <img src={currentUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="w-full h-full flex items-center justify-center text-xs font-bold text-brand-700">{currentUser?.name[0]}</span>
                    )}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium text-gray-700">{currentUser?.name.split(' ')[0]}</span>
                  <ChevronDown size={14} className="text-gray-400" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-12 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50">
                    <div className="px-4 py-2 border-b border-gray-100 mb-1">
                      <p className="text-xs font-semibold text-gray-800">{currentUser?.name}</p>
                      <p className="text-xs text-gray-500">{currentUser?.email}</p>
                    </div>
                    <Link to="/profile" className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                      <User size={15} /> My Profile
                    </Link>
                    <Link to="/orders" className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                      <Package size={15} /> My Orders
                    </Link>
                    <Link to="/wishlist" className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                      <Heart size={15} /> Wishlist
                    </Link>
                    {currentRole !== 'CUSTOMER' && (
                      <Link to={getPortalLink()} className="flex items-center gap-2.5 px-4 py-2 text-sm text-brand-700 hover:bg-brand-50" onClick={() => setUserMenuOpen(false)}>
                        <LayoutDashboard size={15} /> Portal Dashboard
                      </Link>
                    )}
                    {/* Creator and Influencer are capabilities, so an account holding
                        both needs a route to the portal its role did not pick. */}
                    {currentUser?.capabilities?.includes('CREATOR') && currentRole !== 'CREATOR' && (
                      <Link to="/creator" className="flex items-center gap-2.5 px-4 py-2 text-sm text-brand-700 hover:bg-brand-50" onClick={() => setUserMenuOpen(false)}>
                        <Sparkles size={15} /> Creator Portal
                      </Link>
                    )}
                    {currentUser?.capabilities?.includes('INFLUENCER') && currentRole !== 'INFLUENCER' && (
                      <Link to="/influencer" className="flex items-center gap-2.5 px-4 py-2 text-sm text-purple-700 hover:bg-purple-50" onClick={() => setUserMenuOpen(false)}>
                        <Megaphone size={15} /> Influencer Portal
                      </Link>
                    )}
                    <button onClick={() => { logout(); setUserMenuOpen(false); navigate('/login'); }} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                      <LogOut size={15} /> Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-brand-600">Login</Link>
                <Link to="/register" className="px-4 py-2 text-sm font-semibold bg-brand-600 text-white rounded-xl hover:bg-brand-700">Sign up</Link>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-1 mt-3 -mb-0.5 overflow-x-auto rail-scroll">
          <Link to="/" className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-brand-600 hover:bg-gray-50 rounded-lg">Home</Link>
          <Link to="/products" className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-brand-600 hover:bg-gray-50 rounded-lg">Shop</Link>

          {/* Categories dropdown */}
          <div ref={catRef} className="relative">
            <button
              onClick={() => setCategoryOpen(!categoryOpen)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-brand-600 hover:bg-gray-50 rounded-lg"
            >
              Categories <ChevronDown size={14} />
            </button>
            {categoryOpen && (
              <div className="absolute top-9 left-0 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50">
                {CATEGORIES.map(cat => (
                  <Link
                    key={cat}
                    to={`/products?category=${encodeURIComponent(cat)}`}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-600"
                    onClick={() => setCategoryOpen(false)}
                  >
                    {cat}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link to="/creators" className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-brand-600 hover:bg-gray-50 rounded-lg">Creators</Link>
          <Link to="/campaigns" className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-brand-600 hover:bg-gray-50 rounded-lg">Campaigns</Link>
          <Link to="/products?featured=true" className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-brand-600 hover:bg-gray-50 rounded-lg">Featured</Link>
          <Link to="/products?sortBy=price_asc" className="px-3 py-1.5 text-sm font-medium text-amber-600 hover:bg-amber-50 rounded-lg flex items-center gap-1">
            <span className="text-xs">🔥</span> Deals
          </Link>
        </nav>
      </div>
    </header>
  );
}
