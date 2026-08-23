import { useState, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Megaphone, Users, FileText, Shield,
  ShoppingBag, BarChart2, Bell, LogOut, Menu,
  Video, Home, Sparkles, Wallet, Link2, UserCircle
} from 'lucide-react';
import { useAuth } from '../../core/auth/AuthContext';
import NotificationCenter from './NotificationCenter';
import { ZhaTile } from './ZhaLogo';

interface PortalShellProps {
  children: ReactNode;
  type: 'partner' | 'influencer' | 'creator';
}

const PARTNER_NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/partner' },
  { label: 'Products', icon: Package, href: '/partner/products' },
  { label: 'Campaigns', icon: Megaphone, href: '/partner/campaigns' },
  { label: 'Creators', icon: Sparkles, href: '/partner/creators' },
  { label: 'Influencers', icon: Users, href: '/partner/influencers' },
  { label: 'Orders', icon: ShoppingBag, href: '/partner/orders' },
  { label: 'Documents', icon: FileText, href: '/partner/documents' },
  { label: 'KYC', icon: Shield, href: '/partner/kyc' },
  { label: 'Analytics', icon: BarChart2, href: '/partner/analytics' },
  { label: 'Notifications', icon: Bell, href: '/partner/notifications' },
];

const INFLUENCER_NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/influencer' },
  { label: 'Campaigns', icon: Megaphone, href: '/influencer/campaigns' },
  { label: 'Tracking Links', icon: Link2, href: '/influencer/links' },
  { label: 'Content', icon: Video, href: '/influencer/content' },
  { label: 'Earnings', icon: Wallet, href: '/influencer/earnings' },
  { label: 'Channels', icon: Users, href: '/influencer/channels' },
  { label: 'Documents', icon: FileText, href: '/influencer/documents' },
  { label: 'KYC', icon: Shield, href: '/influencer/kyc' },
  { label: 'Notifications', icon: Bell, href: '/influencer/notifications' },
];

const CREATOR_NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/creator' },
  { label: 'My Profile', icon: UserCircle, href: '/creator/profile' },
  { label: 'Campaigns', icon: Megaphone, href: '/creator/campaigns' },
  { label: 'My Content', icon: Video, href: '/creator/content' },
  { label: "Top Picks", icon: Sparkles, href: '/creator/picks' },
  { label: 'Products', icon: Package, href: '/creator/products' },
  { label: 'Analytics', icon: BarChart2, href: '/creator/analytics' },
  { label: 'Earnings', icon: Wallet, href: '/creator/earnings' },
  { label: 'Notifications', icon: Bell, href: '/creator/notifications' },
];

export default function PortalShell({ children, type }: PortalShellProps) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const nav = type === 'partner' ? PARTNER_NAV : type === 'creator' ? CREATOR_NAV : INFLUENCER_NAV;
  const accent = type === 'partner' ? 'bg-emerald-700' : type === 'creator' ? 'bg-brand-700' : 'bg-purple-700';
  const label = type === 'partner' ? 'Partner Portal' : type === 'creator' ? 'Creator Portal' : 'Influencer Portal';

  const handleLogout = () => { logout(); navigate('/login'); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-4 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <ZhaTile size={32} fill="translucent" />
          <div>
            <p className="text-lg font-bold text-white font-tamil leading-none">ழ</p>
            <p className="text-xs text-white/60">{label}</p>
          </div>
        </div>
      </div>

      <div className="px-3 py-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-white/20 overflow-hidden">
            {currentUser?.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                {currentUser?.name[0]}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">{currentUser?.name}</p>
            <p className="text-xs text-white/50 truncate">{currentUser?.email}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-0.5">
        {nav.map(item => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === `/${type}`}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium ${isActive ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`
            }
            onClick={() => setSidebarOpen(false)}
          >
            <item.icon size={16} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-2 py-3 border-t border-white/10 space-y-0.5">
        <NavLink to="/" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white">
          <Home size={16} />
          <span>Marketplace</span>
        </NavLink>
        <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white">
          <LogOut size={16} />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside className={`hidden md:flex flex-col w-56 ${accent} shrink-0`}>
        <SidebarContent />
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className={`absolute left-0 top-0 bottom-0 w-56 ${accent} flex flex-col`}>
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-gray-100 flex items-center px-4 gap-3 shrink-0">
          <button className="md:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} className="text-gray-600" />
          </button>
          <div className="flex-1" />
          <NotificationCenter />
          <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden">
            {currentUser?.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-600">{currentUser?.name[0]}</span>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
