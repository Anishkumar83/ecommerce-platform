import { useState, useEffect } from 'react';
import { User, MapPin, ShoppingBag, Bell, Shield, LogOut } from 'lucide-react';
import MarketplaceHeader from '../../components/shared/MarketplaceHeader';
import StatusBadge from '../../components/shared/StatusBadge';
import { useAuth } from '../../core/auth/AuthContext';
import { orderService } from '../../core/services/order.service';
import { notificationService } from '../../core/services/notification.service';
import type { Order, Notification } from '../../core/models';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'addresses', label: 'Addresses', icon: MapPin },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
];

const DEMO_ADDRESSES = [
  { id: '1', label: 'Home', line1: '42-B, Rajouri Garden', line2: 'West Delhi', city: 'New Delhi', state: 'Delhi', pincode: '110027', default: true },
  { id: '2', label: 'Office', line1: '9th Floor, DLF Cyber City', line2: 'Phase II', city: 'Gurugram', state: 'Haryana', pincode: '122002', default: false },
];

export default function ProfilePage() {
  const { session, logout } = useAuth();
  const [tab, setTab] = useState('profile');
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [form, setForm] = useState({ name: session?.user.name ?? '', email: session?.user.email ?? '', mobile: '+91 98765 43210' });

  useEffect(() => {
    if (session) {
      orderService.getOrders(session.user.referenceId, 1, 10).then(r => setOrders(r.data));
      notificationService.getNotifications(session.user.referenceId).then(setNotifications);
    }
  }, [session]);

  return (
    <div className="min-h-screen bg-gray-50">
      <MarketplaceHeader />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="w-full md:w-48 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
              <div className="text-center mb-3">
                <div className="w-14 h-14 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <span className="text-xl font-bold text-brand-700">{session?.user.name.charAt(0)}</span>
                </div>
                <p className="text-sm font-bold text-gray-900">{session?.user.name}</p>
                <p className="text-xs text-gray-400">{session?.user.email}</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm font-semibold text-left border-b border-gray-50 last:border-0 ${tab === t.id ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <t.icon size={15} /> {t.label}
                </button>
              ))}
              <button onClick={logout} className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50">
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {tab === 'profile' && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-base font-bold text-gray-900 mb-5">Personal Information</h2>
                <div className="space-y-4">
                  {[
                    { key: 'name', label: 'Full Name', type: 'text' },
                    { key: 'email', label: 'Email', type: 'email' },
                    { key: 'mobile', label: 'Mobile', type: 'tel' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{f.label}</label>
                      <input type={f.type} value={(form as Record<string, string>)[f.key]}
                        onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
                    </div>
                  ))}
                  <button className="px-5 py-2.5 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700">
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {tab === 'addresses' && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-bold text-gray-900">Saved Addresses</h2>
                  <button className="text-xs font-bold text-brand-600 hover:underline">+ Add New</button>
                </div>
                <div className="space-y-3">
                  {DEMO_ADDRESSES.map(addr => (
                    <div key={addr.id} className={`p-4 rounded-xl border ${addr.default ? 'border-brand-200 bg-brand-50' : 'border-gray-100'}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-lg">{addr.label}</span>
                            {addr.default && <span className="text-xs font-bold text-brand-600">Default</span>}
                          </div>
                          <p className="text-sm font-semibold text-gray-800">{addr.line1}</p>
                          <p className="text-xs text-gray-500">{addr.line2}, {addr.city}, {addr.state} — {addr.pincode}</p>
                        </div>
                        <button className="text-xs text-gray-400 hover:text-gray-600">Edit</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'orders' && (
              <div className="space-y-3">
                {orders.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-400">No orders yet</div>
                ) : orders.map(o => (
                  <div key={o.referenceId} className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-mono text-xs font-semibold text-gray-700">{o.referenceId}</p>
                      <StatusBadge status={o.orderStatus} size="sm" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      {o.items.slice(0, 3).map(item => (
                        <img key={item.productId} src={item.imageUrl} alt={item.productName} className="w-9 h-9 rounded-lg object-cover border border-gray-100" />
                      ))}
                      <span className="text-xs text-gray-500">{o.items.length} item{o.items.length > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-gray-900">₹{o.total.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">{new Date(o.createdOn).toLocaleDateString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'notifications' && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h2 className="text-base font-bold text-gray-900 mb-4">Notifications</h2>
                <div className="space-y-3">
                  {notifications.map(n => (
                    <div key={n.referenceId} className={`p-3 rounded-xl border ${n.isRead ? 'border-gray-50 bg-white' : 'border-brand-100 bg-brand-50'}`}>
                      <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(n.createdOn).toLocaleDateString('en-IN')}</p>
                    </div>
                  ))}
                  {notifications.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">No notifications</p>}
                </div>
              </div>
            )}

            {tab === 'security' && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-base font-bold text-gray-900 mb-5">Security Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Current Password</label>
                    <input type="password" placeholder="Enter current password" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">New Password</label>
                    <input type="password" placeholder="Enter new password" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Confirm New Password</label>
                    <input type="password" placeholder="Confirm new password" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none" />
                  </div>
                  <button className="px-5 py-2.5 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700">
                    Update Password
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
