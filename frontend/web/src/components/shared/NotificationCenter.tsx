import { useState, useEffect, useRef } from 'react';
import { Bell, X, ShoppingBag, Megaphone, Package, CheckSquare, FileText, Shield, Image, Settings } from 'lucide-react';
import { notificationService } from '../../core/services/notification.service';
import type { Notification, NotificationCategory } from '../../core/models';
import { useAuth } from '../../core/auth/AuthContext';
import { Link } from 'react-router-dom';

const CATEGORY_ICONS: Record<NotificationCategory, typeof Bell> = {
  ORDER: ShoppingBag,
  CAMPAIGN: Megaphone,
  PRODUCT: Package,
  APPROVAL: CheckSquare,
  DOCUMENT: FileText,
  KYC: Shield,
  MEDIA: Image,
  SYSTEM: Settings,
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationCenter() {
  const { currentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentUser) return;
    notificationService.getNotifications(currentUser.referenceId).then(setNotifications);
  }, [currentUser]);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unread = notifications.filter(n => !n.isRead).length;

  const markRead = async (id: string) => {
    await notificationService.markAsRead(id);
    setNotifications(prev => prev.map(n => n.referenceId === id ? { ...n, isRead: true } : n));
  };

  const markAll = async () => {
    if (!currentUser) return;
    await notificationService.markAllAsRead(currentUser.referenceId);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100"
      >
        <Bell size={18} className="text-gray-600" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-96 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={markAll} className="text-xs text-brand-600 hover:underline">Mark all read</button>
              )}
              <button onClick={() => setOpen(false)}>
                <X size={14} className="text-gray-400" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex items-center justify-center h-24 text-sm text-gray-400">No notifications</div>
            ) : notifications.slice(0, 10).map(n => {
              const Icon = CATEGORY_ICONS[n.category] ?? Bell;
              return (
                <div
                  key={n.referenceId}
                  className={`flex gap-3 p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${!n.isRead ? 'bg-brand-50/30' : ''}`}
                  onClick={() => markRead(n.referenceId)}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${!n.isRead ? 'bg-brand-100' : 'bg-gray-100'}`}>
                    <Icon size={15} className={!n.isRead ? 'text-brand-600' : 'text-gray-500'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${!n.isRead ? 'text-gray-900' : 'text-gray-700'}`}>{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-400">{timeAgo(n.createdOn)}</span>
                      {n.ctaUrl && <Link to={n.ctaUrl} className="text-xs text-brand-600 hover:underline" onClick={() => setOpen(false)}>{n.ctaLabel}</Link>}
                    </div>
                  </div>
                  {!n.isRead && <div className="w-2 h-2 bg-brand-500 rounded-full shrink-0 mt-1.5" />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
