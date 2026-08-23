import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Package, ShoppingBag, DollarSign, AlertCircle, Shield, ArrowRight, Activity, FileCheck } from 'lucide-react';
import AdminShell from '../../components/shared/AdminShell';
import PageHeader from '../../components/shared/PageHeader';
import StatusBadge from '../../components/shared/StatusBadge';
import { approvalService } from '../../core/services/approval.service';
import { auditService } from '../../core/services/audit.service';
import { mediaService } from '../../core/services/media.service';
import type { ApprovalRequest, AuditRecord, Media } from '../../core/models';

export default function AdminDashboard() {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [audit, setAudit] = useState<AuditRecord[]>([]);
  const [mediaPending, setMediaPending] = useState(0);

  useEffect(() => {
    approvalService.getApprovals(1, 5, 'PENDING').then(r => setApprovals(r.data.slice(0, 5)));
    auditService.getAudit(1, 8).then(r => setAudit(r.data));
    setMediaPending(mediaService.getPendingCount());
  }, []);

  const kpis = [
    { label: 'Pending Approvals', value: approvalService.getPendingCount(), icon: FileCheck, color: 'bg-amber-50 text-amber-600', to: '/admin/approvals', urgent: true },
    { label: 'Media Queue', value: mediaPending, icon: Shield, color: 'bg-orange-50 text-orange-600', to: '/admin/media', urgent: mediaPending > 0 },
    { label: 'SLA Breaches', value: approvalService.getSlaBreaches().length, icon: AlertCircle, color: 'bg-red-50 text-red-600', to: '/admin/approvals' },
    { label: 'Total Partners', value: 8, icon: Users, color: 'bg-blue-50 text-blue-600', to: '/admin/partners' },
    { label: 'Total Products', value: 12, icon: Package, color: 'bg-green-50 text-green-600', to: '/admin/products' },
    { label: 'Platform Revenue', value: '₹2.8Cr', icon: DollarSign, color: 'bg-emerald-50 text-emerald-600', to: '/admin/orders' },
  ];

  return (
    <AdminShell>
      <PageHeader title="Platform Overview" subtitle="Real-time platform monitoring and control" />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {kpis.map(kpi => (
          <Link key={kpi.label} to={kpi.to} className={`bg-white rounded-xl border ${kpi.urgent ? 'border-amber-200' : 'border-gray-100'} p-4 hover:shadow-sm transition-shadow block`}>
            <div className={`w-9 h-9 rounded-xl ${kpi.color} flex items-center justify-center mb-3`}>
              <kpi.icon size={16} />
            </div>
            <p className={`text-xl font-extrabold font-display ${kpi.urgent && (kpi.value as number) > 0 ? 'text-amber-600' : 'text-gray-900'}`}>{kpi.value}</p>
            <p className="text-xs font-semibold text-gray-700 mt-0.5">{kpi.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-800">Pending Approvals</h2>
            <Link to="/admin/approvals" className="text-xs text-brand-600 font-semibold hover:underline flex items-center gap-1">View all <ArrowRight size={12} /></Link>
          </div>
          <div className="space-y-2">
            {approvals.map(a => (
              <div key={a.referenceId} className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 line-clamp-1">{a.entityName}</p>
                  <p className="text-xs text-gray-500">{a.entityType} · {a.submittedBy}</p>
                </div>
                <StatusBadge status={a.approvalStatus} size="sm" />
              </div>
            ))}
            {approvals.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">No pending approvals</p>}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-800">Recent Audit Activity</h2>
            <Link to="/admin/audit" className="text-xs text-brand-600 font-semibold hover:underline flex items-center gap-1">View all <ArrowRight size={12} /></Link>
          </div>
          <div className="space-y-2">
            {audit.slice(0, 6).map(a => (
              <div key={a.referenceId} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                  <Activity size={12} className="text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 line-clamp-1">{a.action.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-gray-400">{a.actorName} · {new Date(a.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Platform health */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-800 mb-4">Platform Health</h2>
          {[
            { label: 'API Response Time', value: '142ms', status: 'good' },
            { label: 'Media Processing Queue', value: '3 items', status: 'ok' },
            { label: 'KYC Pending Reviews', value: '1 record', status: 'ok' },
            { label: 'Payment Success Rate', value: '92.4%', status: 'good' },
            { label: 'Moderation Queue', value: `${mediaPending} items`, status: mediaPending > 3 ? 'warn' : 'good' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-xs text-gray-600">{item.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-800">{item.value}</span>
                <div className={`w-2 h-2 rounded-full ${item.status === 'good' ? 'bg-green-400' : item.status === 'warn' ? 'bg-amber-400' : 'bg-blue-400'}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
