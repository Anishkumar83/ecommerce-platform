import { useState, useEffect } from 'react';
import { Search, Activity } from 'lucide-react';
import AdminShell from '../../components/shared/AdminShell';
import PageHeader from '../../components/shared/PageHeader';
import { auditService } from '../../core/services/audit.service';
import type { AuditRecord } from '../../core/models';

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
  APPROVE: 'bg-emerald-100 text-emerald-700',
  REJECT: 'bg-red-100 text-red-700',
  LOGIN: 'bg-gray-100 text-gray-700',
  SUBMIT: 'bg-purple-100 text-purple-700',
};

export default function AuditLog() {
  const [audit, setAudit] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 10;

  const load = (p = page, s = search) => {
    setLoading(true);
    auditService.getAudit(p, PAGE_SIZE, s).then(r => {
      setAudit(r.data);
      setTotal(r.total);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [page]);

  const handleSearch = (s: string) => {
    setSearch(s);
    setPage(1);
    load(1, s);
  };

  const getActionType = (action: string) => {
    for (const [key, cls] of Object.entries(ACTION_COLORS)) {
      if (action.startsWith(key)) return cls;
    }
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <AdminShell>
      <PageHeader title="Audit Log" subtitle="Complete platform activity trail" />

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-50">
          <div className="relative max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search actions, actors, entities..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Timestamp</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Action</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Entity</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Actor</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Ref ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {audit.map(a => (
                  <tr key={a.referenceId} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(a.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${getActionType(a.action)}`}>
                        {a.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-xs font-semibold text-gray-800">{a.entityType}</p>
                      <p className="text-xs text-gray-400 font-mono">{a.entityReferenceId}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-xs text-gray-700">{a.actorName}</p>
                      <p className="text-xs text-gray-400">{a.actorRole}</p>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-gray-400">{a.referenceId}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-500">{total} total records</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40">Prev</button>
                <span className="px-3 py-1.5 text-xs text-gray-600">Page {page}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={page * PAGE_SIZE >= total}
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40">Next</button>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminShell>
  );
}
