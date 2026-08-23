import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Megaphone, Users, ShoppingBag, DollarSign, AlertCircle, TrendingUp, ArrowRight, Clock } from 'lucide-react';
import PortalShell from '../../components/shared/PortalShell';
import PageHeader from '../../components/shared/PageHeader';
import StatusBadge from '../../components/shared/StatusBadge';
import { productService } from '../../core/services/product.service';
import { campaignService } from '../../core/services/campaign.service';
import { orderService } from '../../core/services/order.service';
import { approvalService } from '../../core/services/approval.service';
import type { Product, Campaign, Order, ApprovalRequest } from '../../core/models';

export default function PartnerDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);

  useEffect(() => {
    productService.getPartnerProducts('PTN260822A01').then(setProducts);
    campaignService.getPartnerCampaigns('PTN260822A01').then(setCampaigns);
    orderService.getAllOrders(1, 5).then(r => setOrders(r.data));
    approvalService.getApprovals(1, 10, 'PENDING').then(r => setApprovals(r.data.slice(0, 3)));
  }, []);

  const publishedCount = products.filter(p => p.publishStatus === 'PUBLISHED').length;
  const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE').length;
  const pendingApprovals = approvalService.getPendingCount();

  const kpis = [
    { label: 'Total Products', value: products.length, icon: Package, color: 'bg-blue-50 text-blue-600', sub: `${publishedCount} published` },
    { label: 'Active Campaigns', value: activeCampaigns, icon: Megaphone, color: 'bg-purple-50 text-purple-600', sub: `${campaigns.length} total` },
    { label: 'Total Orders', value: orders.length, icon: ShoppingBag, color: 'bg-green-50 text-green-600', sub: 'Last 30 days' },
    { label: 'Revenue', value: '₹28.4L', icon: DollarSign, color: 'bg-amber-50 text-amber-600', sub: 'This month' },
    { label: 'Influencers', value: 4, icon: Users, color: 'bg-rose-50 text-rose-600', sub: 'Active collaborators' },
    { label: 'Pending Approvals', value: pendingApprovals, icon: AlertCircle, color: 'bg-orange-50 text-orange-600', sub: 'Requires action', highlight: pendingApprovals > 0 },
  ];

  return (
    <PortalShell type="partner">
      <PageHeader
        title="Partner Dashboard"
        subtitle="Welcome back, Urban Lifestyle Pvt Ltd"
        actions={
          <Link to="/partner/products/new" className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700">
            <Package size={15} /> Add Product
          </Link>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {kpis.map(kpi => (
          <div key={kpi.label} className={`bg-white rounded-xl border ${kpi.highlight ? 'border-orange-200' : 'border-gray-100'} p-4`}>
            <div className={`w-9 h-9 rounded-xl ${kpi.color} flex items-center justify-center mb-3`}>
              <kpi.icon size={16} />
            </div>
            <p className="text-xl font-extrabold font-display text-gray-900">{kpi.value}</p>
            <p className="text-xs font-semibold text-gray-700 mt-0.5">{kpi.label}</p>
            <p className="text-xs text-gray-400">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Products */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-800">Recent Products</h2>
            <Link to="/partner/products" className="text-xs text-emerald-600 font-semibold hover:underline flex items-center gap-1">View all <ArrowRight size={12} /></Link>
          </div>
          <div className="space-y-3">
            {products.slice(0, 4).map(p => (
              <div key={p.referenceId} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                  <img src={p.media.find(m => m.isPrimary)?.url} alt={p.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 line-clamp-1">{p.name}</p>
                  <p className="text-xs text-gray-500">₹{p.price.toLocaleString()} · {p.stock} in stock</p>
                </div>
                <StatusBadge status={p.publishStatus} size="sm" />
              </div>
            ))}
          </div>
        </div>

        {/* Active Campaigns */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-800">Active Campaigns</h2>
            <Link to="/partner/campaigns" className="text-xs text-emerald-600 font-semibold hover:underline flex items-center gap-1">View all <ArrowRight size={12} /></Link>
          </div>
          <div className="space-y-3">
            {campaigns.filter(c => c.status === 'ACTIVE').map(c => (
              <Link key={c.referenceId} to={`/partner/campaigns/${c.referenceId}`} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                  {c.bannerUrl && <img src={c.bannerUrl} alt={c.name} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 line-clamp-1">{c.name}</p>
                  <p className="text-xs text-gray-500">{c.influencerIds.length} influencers · {c.productIds.length} products</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock size={11} />
                  {new Date(c.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </div>
              </Link>
            ))}
            {campaigns.filter(c => c.status === 'ACTIVE').length === 0 && (
              <p className="text-sm text-gray-400 py-4 text-center">No active campaigns</p>
            )}
          </div>
        </div>

        {/* Pending Approvals */}
        {approvals.length > 0 && (
          <div className="bg-white rounded-xl border border-orange-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <AlertCircle size={15} className="text-orange-500" />
                Pending Approvals
              </h2>
            </div>
            <div className="space-y-2">
              {approvals.map(a => (
                <div key={a.referenceId} className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{a.entityName}</p>
                    <p className="text-xs text-gray-500">{a.entityType} · Submitted by {a.submittedBy}</p>
                  </div>
                  <StatusBadge status={a.approvalStatus} size="sm" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Publishing Workflow */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-800 mb-4">Publishing Pipeline</h2>
          {[
            { stage: 'DRAFT', count: products.filter(p => p.publishStatus === 'DRAFT').length, color: 'bg-gray-100' },
            { stage: 'MEDIA_PROCESSING', count: products.filter(p => p.publishStatus === 'MEDIA_PROCESSING').length, color: 'bg-blue-100' },
            { stage: 'MODERATION', count: products.filter(p => p.publishStatus === 'MODERATION').length, color: 'bg-purple-100' },
            { stage: 'PENDING_APPROVAL', count: products.filter(p => p.publishStatus === 'PENDING_APPROVAL').length, color: 'bg-amber-100' },
            { stage: 'PUBLISHED', count: products.filter(p => p.publishStatus === 'PUBLISHED').length, color: 'bg-green-100' },
          ].map(s => (
            <div key={s.stage} className="flex items-center gap-3 mb-2">
              <div className={`w-2 h-2 rounded-full ${s.color.replace('100', '500')}`} />
              <div className={`flex-1 h-6 ${s.color} rounded-full overflow-hidden`}>
                <div className="h-full bg-current opacity-30" style={{ width: `${s.count * 15}%` }} />
              </div>
              <span className="text-xs text-gray-500 w-20 text-right">{s.stage.replace('_', ' ')}: {s.count}</span>
            </div>
          ))}
        </div>
      </div>
    </PortalShell>
  );
}
