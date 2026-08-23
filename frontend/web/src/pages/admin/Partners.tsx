import { useState, useEffect } from 'react';
import { Users, Search, ToggleLeft, ToggleRight } from 'lucide-react';
import AdminShell from '../../components/shared/AdminShell';
import PageHeader from '../../components/shared/PageHeader';
import StatusBadge from '../../components/shared/StatusBadge';
import EmptyState from '../../components/shared/EmptyState';
import { partnerService } from '../../core/services/partner.service';
import type { Partner } from '../../core/models';

export default function AdminPartners() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = () => { partnerService.getPartners().then(r => { setPartners(r.data); setLoading(false); }); };
  useEffect(() => { load(); }, []);

  const filtered = partners.filter(p =>
    p.businessName.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggle = async (partner: Partner) => {
    setActionLoading(partner.referenceId);
    if (partner.partnerStatus === 'ACTIVE') await partnerService.suspendPartner(partner.referenceId);
    else await partnerService.activatePartner(partner.referenceId);
    setActionLoading(null);
    load();
  };

  return (
    <AdminShell>
      <PageHeader title="Partners" subtitle={`${partners.length} registered business partners`} />

      <div className="bg-white border border-gray-100 rounded-xl p-4 mb-5">
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search partners..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No Partners" message="No partners match your search." />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Business</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Ref ID</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Category</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">KYC</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(p => (
                <tr key={p.referenceId} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3">
                    <p className="font-semibold text-gray-900">{p.businessName}</p>
                    <p className="text-xs text-gray-400">{p.email}</p>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-gray-500">{p.referenceId}</td>
                  <td className="px-5 py-3 text-xs text-gray-600">{p.category}</td>
                  <td className="px-5 py-3"><StatusBadge status={p.kycStatus} size="sm" /></td>
                  <td className="px-5 py-3"><StatusBadge status={p.partnerStatus} size="sm" /></td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => handleToggle(p)}
                      disabled={actionLoading === p.referenceId}
                      className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl ${p.partnerStatus === 'ACTIVE' ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100'} disabled:opacity-50`}
                    >
                      {p.partnerStatus === 'ACTIVE' ? <><ToggleRight size={13} /> Suspend</> : <><ToggleLeft size={13} /> Activate</>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
