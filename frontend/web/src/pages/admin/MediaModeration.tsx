import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Image, Film } from 'lucide-react';
import AdminShell from '../../components/shared/AdminShell';
import PageHeader from '../../components/shared/PageHeader';
import StatusBadge from '../../components/shared/StatusBadge';
import EmptyState from '../../components/shared/EmptyState';
import { mediaService } from '../../core/services/media.service';
import type { Media } from '../../core/models';

export default function MediaModeration() {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'MODERATION' | 'APPROVED' | 'REJECTED' | 'ALL'>('MODERATION');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    mediaService.getMedia(1, 20, filter === 'ALL' ? undefined : filter).then(r => {
      setMedia(r.data);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [filter]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    await mediaService.approveMedia(id);
    setActionLoading(null);
    load();
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    await mediaService.rejectMedia(id, ['Does not meet content guidelines']);
    setActionLoading(null);
    load();
  };

  return (
    <AdminShell>
      <PageHeader title="Media Moderation" subtitle={`${mediaService.getPendingCount()} items pending review`} />

      <div className="flex gap-2 mb-5">
        {(['MODERATION', 'APPROVED', 'REJECTED', 'ALL'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl ${filter === f ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-square bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : media.length === 0 ? (
        <EmptyState icon={Image} title="No Media Found" message="No media items match this filter." />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {media.map(m => (
            <div key={m.referenceId} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="aspect-video bg-gray-50 relative overflow-hidden">
                {m.mediaType === 'IMAGE' ? (
                  <img src={m.url} alt={m.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Film size={28} className="text-gray-300" />
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <StatusBadge status={m.mediaStatus} size="sm" />
                </div>
              </div>
              <div className="p-3">
                <p className="text-xs font-semibold text-gray-700 truncate mb-0.5">{m.name}</p>
                <p className="text-xs text-gray-400 mb-2">{m.mediaType} · {m.entityType}</p>
                {m.mediaStatus === 'MODERATION' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(m.referenceId)}
                      disabled={actionLoading === m.referenceId}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-green-50 text-green-700 text-xs font-bold rounded-lg hover:bg-green-100 disabled:opacity-50"
                    >
                      <CheckCircle size={11} /> Approve
                    </button>
                    <button
                      onClick={() => handleReject(m.referenceId)}
                      disabled={actionLoading === m.referenceId}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-50 text-red-700 text-xs font-bold rounded-lg hover:bg-red-100 disabled:opacity-50"
                    >
                      <XCircle size={11} /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
