import { useState, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building2, UserCheck, Package, Megaphone,
  ShoppingBag, FileText, Image, Shield, CheckSquare, GitBranch,
  BookOpen, UserCog, ClipboardList, Bell, Link2,
  Settings, ChevronDown, ChevronRight, Menu, X, LogOut, Sparkles, Video
} from 'lucide-react';
import { useAuth } from '../../core/auth/AuthContext';
import NotificationCenter from './NotificationCenter';
import { ZhaTile } from './ZhaLogo';

interface NavItem {
  label: string;
  icon: typeof LayoutDashboard;
  href?: string;
  children?: NavItem[];
  permission?: string;
  badge?: number;
}

const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
  { label: 'Partners', icon: Building2, href: '/admin/partners' },
  { label: 'Creators', icon: Sparkles, href: '/admin/creators' },
  { label: 'Influencers', icon: UserCheck, href: '/admin/influencers' },
  { label: 'Products', icon: Package, href: '/admin/products' },
  { label: 'Campaigns', icon: Megaphone, href: '/admin/campaigns' },
  { label: 'Creator Content', icon: Video, href: '/admin/creator-content' },
  { label: 'Orders', icon: ShoppingBag, href: '/admin/orders' },
  { label: 'KYC', icon: Shield, href: '/admin/kyc' },
  { label: 'Documents', icon: FileText, href: '/admin/documents' },
  { label: 'Media', icon: Image, href: '/admin/media' },
  { label: 'Approvals', icon: CheckSquare, href: '/admin/approvals', badge: 3 },
  { label: 'Workflows', icon: GitBranch, href: '/admin/workflows' },
  { label: 'Policies', icon: BookOpen, href: '/admin/policies' },
  { label: 'Users', icon: Users, href: '/admin/users' },
  { label: 'Roles', icon: UserCog, href: '/admin/roles' },
  { label: 'Audit', icon: ClipboardList, href: '/admin/audit' },
  { label: 'Short Links', icon: Link2, href: '/admin/short-links' },
  { label: 'Notifications', icon: Bell, href: '/admin/notifications' },
];

const MAKER_NAV: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
  { label: 'Partners', icon: Building2, href: '/admin/partners' },
  { label: 'Influencers', icon: UserCheck, href: '/admin/influencers' },
  { label: 'Products', icon: Package, href: '/admin/products' },
  { label: 'Campaigns', icon: Megaphone, href: '/admin/campaigns' },
  { label: 'Creator Content', icon: Video, href: '/admin/creator-content' },
  { label: 'Documents', icon: FileText, href: '/admin/documents' },
  { label: 'My Tasks', icon: CheckSquare, href: '/admin/tasks' },
];

const CHECKER_NAV: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
  { label: 'Approvals', icon: CheckSquare, href: '/admin/approvals', badge: 3 },
  { label: 'KYC', icon: Shield, href: '/admin/kyc' },
  { label: 'Media', icon: Image, href: '/admin/media' },
  { label: 'Orders', icon: ShoppingBag, href: '/admin/orders' },
  { label: 'Audit', icon: ClipboardList, href: '/admin/audit' },
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const { currentUser, currentRole, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const nav = currentRole === 'CHECKER' ? CHECKER_NAV : currentRole === 'MAKER' ? MAKER_NAV : ADMIN_NAV;

  const handleLogout = () => { logout(); navigate('/login'); };

  const roleLabel = currentRole === 'ADMIN' ? 'Platform Admin' : currentRole === 'MAKER' ? 'Maker' : 'Checker';
  const roleBg = currentRole === 'ADMIN' ? 'bg-brand-600' : currentRole === 'MAKER' ? 'bg-amber-500' : 'bg-emerald-600';

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-4 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <ZhaTile size={32} fill="translucent" />
          <div>
            <p className="text-lg font-bold text-white font-tamil leading-none">ழ</p>
            <p className="text-xs text-white/60">Platform Admin</p>
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
            <span className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded ${roleBg} text-white`}>{roleLabel}</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-0.5">
        {nav.map(item => (
          <NavLink
            key={item.href}
            to={item.href!}
            end={item.href === '/admin'}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`
            }
            onClick={() => setSidebarOpen(false)}
          >
            <item.icon size={16} />
            <span className="flex-1">{item.label}</span>
            {item.badge && <span className="w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white">{item.badge}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="px-2 py-3 border-t border-white/10 space-y-0.5">
        <NavLink to="/" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white">
          <Settings size={16} />
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
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-brand-950 shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-56 bg-brand-950 flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-gray-100 flex items-center px-4 gap-3 shrink-0">
          <button className="md:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} className="text-gray-600" />
          </button>
          <div className="flex-1" />
          <NotificationCenter />
          <div className="w-8 h-8 rounded-full bg-brand-100 overflow-hidden">
            {currentUser?.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="w-full h-full flex items-center justify-center text-xs font-bold text-brand-700">{currentUser?.name[0]}</span>
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
