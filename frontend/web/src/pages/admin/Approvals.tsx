import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, MessageSquare, Clock, AlertTriangle } from 'lucide-react';
import AdminShell from '../../components/shared/AdminShell';
import PageHeader from '../../components/shared/PageHeader';
import StatusBadge from '../../components/shared/StatusBadge';
import EmptyState from '../../components/shared/EmptyState';
import { approvalService } from '../../core/services/approval.service';
import { useAuth } from '../../core/auth/AuthContext';
import type { ApprovalRequest } from '../../core/models';

export default function AdminApprovals() {
  const { session } = useAuth();
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [comment, setComment] = useState<Record<string, string>>({});
  const [showComment, setShowComment] = useState<string | null>(null);

  const role = session?.user.role;
  const canApprove = role === 'ADMIN' || role === 'CHECKER';

  const load = () => {
    setLoading(true);
    approvalService.getApprovals(1, 20, filter === 'ALL' ? undefined : filter).then(r => {
      setApprovals(r.data);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [filter]);

  const handleAction = async (id: string, action: 'approve' | 'reject' | 'changes') => {
    setActionLoading(id);
    const note = comment[id] ?? '';
    if (action === 'approve') await approvalService.approve(id, note);
    else if (action === 'reject') await approvalService.reject(id, note);
    else await approvalService.requestChanges(id, note);
    setActionLoading(null);
    setShowComment(null);
    load();
  };

  const slaBreaches = approvalService.getSlaBreaches();

  return (
    <AdminShell>
      <PageHeader title="Approval Queue" subtitle="Maker/Checker approval workflow" />

      {slaBreaches.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 flex items-center gap-3">
          <AlertTriangle size={18} className="text-red-500 shrink-0" />
          <div>
            <p className="text-sm font-bold text-red-800">{slaBreaches.length} SLA Breach{slaBreaches.length > 1 ? 'es' : ''}</p>
            <p className="text-xs text-red-700">These approvals have exceeded the 24-hour SLA window</p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 mb-5">
        {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl ${filter === f ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : approvals.length === 0 ? (
        <EmptyState icon={CheckCircle} title="No Approvals Found" message="All items matching this filter have been processed." />
      ) : (
        <div className="space-y-3">
          {approvals.map(a => {
            const isSla = slaBreaches.some(s => s.referenceId === a.referenceId);
            return (
              <div key={a.referenceId} className={`bg-white rounded-xl border p-5 ${isSla ? 'border-red-200' : 'border-gray-100'}`}>
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-gray-900">{a.entityName}</h3>
                      {isSla && <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">SLA Breach</span>}
                    </div>
                    <p className="text-xs text-gray-500">{a.entityType} · {a.referenceId}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Submitted by {a.submittedBy} · {new Date(a.createdOn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    {a.checkerNotes && (
                      <div className="mt-2 p-2 bg-gray-50 rounded-lg text-xs text-gray-600">
                        <span className="font-semibold">Latest note: </span>{a.checkerNotes}
                      </div>
                    )}
                  </div>
                  <StatusBadge status={a.approvalStatus} />
                </div>

                {canApprove && a.approvalStatus === 'PENDING' && (
                  <div className="mt-4 pt-4 border-t border-gray-50">
                    {showComment === a.referenceId && (
                      <textarea
                        value={comment[a.referenceId] ?? ''}
                        onChange={e => setComment(p => ({ ...p, [a.referenceId]: e.target.value }))}
                        placeholder="Add a note (optional)..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs mb-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                      />
                    )}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAction(a.referenceId, 'approve')}
                        disabled={actionLoading === a.referenceId}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 text-xs font-bold rounded-xl hover:bg-green-100 disabled:opacity-50"
                      >
                        <CheckCircle size={13} /> Approve
                      </button>
                      <button
                        onClick={() => handleAction(a.referenceId, 'reject')}
                        disabled={actionLoading === a.referenceId}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 text-xs font-bold rounded-xl hover:bg-red-100 disabled:opacity-50"
                      >
                        <XCircle size={13} /> Reject
                      </button>
                      <button
                        onClick={() => handleAction(a.referenceId, 'changes')}
                        disabled={actionLoading === a.referenceId}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold rounded-xl hover:bg-amber-100 disabled:opacity-50"
                      >
                        <MessageSquare size={13} /> Request Changes
                      </button>
                      <button
                        onClick={() => setShowComment(showComment === a.referenceId ? null : a.referenceId)}
                        className="ml-auto text-xs text-gray-400 hover:text-gray-600"
                      >
                        {showComment === a.referenceId ? 'Hide note' : 'Add note'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}
