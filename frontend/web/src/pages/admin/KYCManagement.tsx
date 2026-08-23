import { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle } from 'lucide-react';
import AdminShell from '../../components/shared/AdminShell';
import PageHeader from '../../components/shared/PageHeader';
import StatusBadge from '../../components/shared/StatusBadge';
import { kycService } from '../../core/services/kyc.service';
import type { KycRecord } from '../../core/models';

export default function KYCManagement() {
  const [records, setRecords] = useState<KycRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => { kycService.getAllKycRecords().then(r => { setRecords(r.data); setLoading(false); }); };
  useEffect(() => { load(); }, []);

  return (
    <AdminShell>
      <PageHeader title="KYC Management" subtitle="Partner and influencer verification records" />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Ref ID</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Entity</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Type</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Initiated</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Verified</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {records.map(r => (
                <tr key={r.referenceId} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3 font-mono text-xs text-gray-500">{r.referenceId}</td>
                  <td className="px-5 py-3 text-xs font-semibold text-gray-800">{r.entityId}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${r.entityType === 'PARTNER' ? 'bg-emerald-50 text-emerald-700' : 'bg-purple-50 text-purple-700'}`}>
                      {r.entityType}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-500">{r.submittedOn ? new Date(r.submittedOn).toLocaleDateString('en-IN') : '—'}</td>
                  <td className="px-5 py-3 text-xs text-gray-500">{r.verifiedOn ? new Date(r.verifiedOn).toLocaleDateString('en-IN') : '—'}</td>
                  <td className="px-5 py-3"><StatusBadge status={r.kycStatus} size="sm" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
