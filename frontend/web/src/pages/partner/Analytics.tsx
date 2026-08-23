import { useState } from 'react';
import { TrendingUp, Eye, ShoppingCart, DollarSign, Users, Star } from 'lucide-react';
import PortalShell from '../../components/shared/PortalShell';
import PageHeader from '../../components/shared/PageHeader';

const CHART_DATA = [
  { month: 'Mar', revenue: 180000, orders: 42, views: 12400 },
  { month: 'Apr', revenue: 220000, orders: 56, views: 15200 },
  { month: 'May', revenue: 195000, orders: 48, views: 13800 },
  { month: 'Jun', revenue: 310000, orders: 72, views: 22100 },
  { month: 'Jul', revenue: 285000, orders: 68, views: 19800 },
  { month: 'Aug', revenue: 340000, orders: 84, views: 26400 },
];

const TOP_PRODUCTS = [
  { name: 'SoundWave Pro Headphones', revenue: 86500, orders: 25, rating: 4.7 },
  { name: 'TravelPro Backpack', revenue: 64200, orders: 38, rating: 4.5 },
  { name: 'NovaSport Watch', revenue: 52800, orders: 18, rating: 4.6 },
  { name: 'GlowRadiance Skincare', revenue: 31500, orders: 45, rating: 4.8 },
];

export default function PartnerAnalytics() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const maxRevenue = Math.max(...CHART_DATA.map(d => d.revenue));

  return (
    <PortalShell type="partner">
      <PageHeader
        title="Analytics"
        subtitle="Performance insights for your store"
        actions={
          <div className="flex gap-2">
            {(['7d', '30d', '90d'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 text-xs font-bold rounded-xl ${period === p ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {p}
              </button>
            ))}
          </div>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Revenue', value: '₹28.4L', change: '+18%', icon: DollarSign, color: 'text-green-600 bg-green-50' },
          { label: 'Total Orders', value: '370', change: '+12%', icon: ShoppingCart, color: 'text-blue-600 bg-blue-50' },
          { label: 'Product Views', value: '1.09L', change: '+24%', icon: Eye, color: 'text-purple-600 bg-purple-50' },
          { label: 'Avg. Rating', value: '4.6', change: '+0.2', icon: Star, color: 'text-amber-600 bg-amber-50' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className={`w-8 h-8 rounded-xl ${kpi.color} flex items-center justify-center mb-2`}>
              <kpi.icon size={15} />
            </div>
            <p className="text-xl font-extrabold text-gray-900">{kpi.value}</p>
            <p className="text-xs text-gray-500">{kpi.label}</p>
            <p className="text-xs text-green-600 font-semibold mt-1">{kpi.change} vs prev period</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <h2 className="text-sm font-bold text-gray-800 mb-5">Revenue Trend</h2>
        <div className="flex items-end gap-3 h-40">
          {CHART_DATA.map(d => (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-gray-500">₹{(d.revenue / 1000).toFixed(0)}K</span>
              <div className="w-full bg-emerald-100 rounded-t-lg relative group" style={{ height: `${(d.revenue / maxRevenue) * 100}%` }}>
                <div className="w-full h-full bg-emerald-500 rounded-t-lg opacity-80 hover:opacity-100 transition-opacity" />
              </div>
              <span className="text-xs font-semibold text-gray-600">{d.month}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-800 mb-4">Top Products by Revenue</h2>
          <div className="space-y-4">
            {TOP_PRODUCTS.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-xl bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 line-clamp-1">{p.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(p.revenue / TOP_PRODUCTS[0].revenue) * 100}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap">₹{(p.revenue / 1000).toFixed(0)}K</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-amber-600">
                  <Star size={11} className="fill-amber-400 text-amber-400" /> {p.rating}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Channel Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-800 mb-4">Sales Channels</h2>
          {[
            { channel: 'Direct (Marketplace)', pct: 55, color: 'bg-brand-500' },
            { channel: 'Campaign (Creator-driven)', pct: 32, color: 'bg-purple-500' },
            { channel: 'Referral Links', pct: 9, color: 'bg-amber-500' },
            { channel: 'Other', pct: 4, color: 'bg-gray-400' },
          ].map(ch => (
            <div key={ch.channel} className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-700">{ch.channel}</span>
                <span className="text-xs font-bold text-gray-900">{ch.pct}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full ${ch.color} rounded-full`} style={{ width: `${ch.pct}%` }} />
              </div>
            </div>
          ))}
          <div className="mt-4 p-3 bg-purple-50 rounded-xl">
            <p className="text-xs font-semibold text-purple-800 flex items-center gap-1.5">
              <TrendingUp size={13} /> Creator-driven sales up 8% this month
            </p>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
