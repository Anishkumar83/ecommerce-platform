import { useState, useEffect, useCallback } from 'react';
import { Sparkles, X, Plus, Eye, Heart } from 'lucide-react';
import PortalShell from '../../components/shared/PortalShell';
import PageHeader from '../../components/shared/PageHeader';
import CreatorCard from '../../components/shared/CreatorCard';
import EmptyState from '../../components/shared/EmptyState';
import ErrorState from '../../components/shared/ErrorState';
import { SkeletonLine } from '../../components/shared/LoadingSkeleton';
import { useToast } from '../../components/shared/Toast';
import { compact } from '../../components/shared/StatTile';
import { useAuth } from '../../core/auth/AuthContext';
import { creatorService } from '../../core/services/creator.service';
import type { CreatorContent } from '../../core/models';

export default function CreatorPicks() {
  const { currentUser } = useAuth();
  const creatorId = currentUser?.creatorId ?? 'CRT260822A01';
  const { toast } = useToast();

  const [content, setContent] = useState<CreatorContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    creatorService.getCreatorContent(creatorId, 'PUBLISHED')
      .then(setContent)
      .catch(() => setError('Could not load your published content.'))
      .finally(() => setLoading(false));
  }, [creatorId]);

  useEffect(() => { load(); }, [load]);

  const picks = content.filter(c => c.isTopPick);
  const eligible = content.filter(c => !c.isTopPick);
  const preview = content.find(c => c.referenceId === previewId) ?? picks[0] ?? eligible[0] ?? null;

  const toggle = async (id: string) => {
    setBusyId(id);
    try {
      const updated = await creatorService.toggleTopPick(id);
      setContent(prev => prev.map(c => (c.referenceId === id ? updated : c)));
      toast(updated.isTopPick ? 'Added to your Top Picks' : 'Removed from Top Picks');
    } catch {
      toast('Could not update Top Picks', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <PortalShell type="creator">
      <PageHeader
        title="Creator's Top Picks"
        subtitle="Choose the published content shoppers see first on your profile."
      />

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            <SkeletonLine height="h-24" /><SkeletonLine height="h-24" /><SkeletonLine height="h-24" />
          </div>
          <SkeletonLine height="h-96" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : content.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Nothing published yet"
          message="Once your content is published, you can feature it here as a Top Pick."
          action={{ label: 'Upload content', onClick: () => { window.location.href = '/creator/content/new'; } }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <section>
              <h2 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Sparkles size={14} className="text-brand-600" /> Current picks
                <span className="text-xs font-medium text-gray-400">({picks.length})</span>
              </h2>
              {picks.length === 0 ? (
                <p className="text-sm text-gray-400 bg-white rounded-xl border border-gray-100 py-8 text-center">
                  No Top Picks yet — add one from the list below.
                </p>
              ) : (
                <div className="space-y-2">
                  {picks.map(c => (
                    <div
                      key={c.referenceId}
                      onMouseEnter={() => setPreviewId(c.referenceId)}
                      className={`flex items-center gap-3 bg-white rounded-xl border p-2.5 transition-colors ${preview?.referenceId === c.referenceId ? 'border-brand-300' : 'border-gray-100'}`}
                    >
                      <img src={c.thumbnailUrl} alt="" className="w-12 h-12 rounded-lg object-cover bg-gray-100 shrink-0" />
                      <div className="min-w-0 grow">
                        <p className="text-sm font-semibold text-gray-800 line-clamp-1">{c.title}</p>
                        <p className="text-xs text-gray-500 line-clamp-1">{c.productName}</p>
                      </div>
                      <div className="shrink-0 flex items-center gap-3 text-xs text-gray-400 tabular-nums">
                        <span className="flex items-center gap-1"><Eye size={11} /> {compact(c.views)}</span>
                        <span className="flex items-center gap-1"><Heart size={11} /> {compact(c.likes)}</span>
                      </div>
                      <button
                        onClick={() => toggle(c.referenceId)}
                        disabled={busyId === c.referenceId}
                        aria-label="Remove from Top Picks"
                        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-sm font-bold text-gray-800 mb-3">Eligible published content</h2>
              {eligible.length === 0 ? (
                <p className="text-sm text-gray-400 bg-white rounded-xl border border-gray-100 py-8 text-center">
                  Everything published is already a Top Pick.
                </p>
              ) : (
                <div className="space-y-2">
                  {eligible.map(c => (
                    <div
                      key={c.referenceId}
                      onMouseEnter={() => setPreviewId(c.referenceId)}
                      className={`flex items-center gap-3 bg-white rounded-xl border p-2.5 transition-colors ${preview?.referenceId === c.referenceId ? 'border-brand-300' : 'border-gray-100'}`}
                    >
                      <img src={c.thumbnailUrl} alt="" className="w-12 h-12 rounded-lg object-cover bg-gray-100 shrink-0" />
                      <div className="min-w-0 grow">
                        <p className="text-sm font-semibold text-gray-800 line-clamp-1">{c.title}</p>
                        <p className="text-xs text-gray-500 line-clamp-1">{c.productName}</p>
                      </div>
                      <div className="shrink-0 flex items-center gap-3 text-xs text-gray-400 tabular-nums">
                        <span className="flex items-center gap-1"><Eye size={11} /> {compact(c.views)}</span>
                        <span className="flex items-center gap-1"><Heart size={11} /> {compact(c.likes)}</span>
                      </div>
                      <button
                        onClick={() => toggle(c.referenceId)}
                        disabled={busyId === c.referenceId}
                        className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-brand-50 text-brand-700 text-xs font-bold hover:bg-brand-100 disabled:opacity-50"
                      >
                        <Plus size={12} /> Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div>
            <div className="sticky top-0">
              <h2 className="text-sm font-bold text-gray-800 mb-3">How it looks to shoppers</h2>
              {preview ? (
                <CreatorCard content={preview} />
              ) : (
                <p className="text-sm text-gray-400 bg-white rounded-xl border border-gray-100 py-8 text-center">
                  Hover a piece of content to preview it here.
                </p>
              )}
              <p className="text-xs text-gray-400 mt-3 text-center">
                This is exactly how it appears in the <span className="font-tamil">ழ</span> marketplace.
              </p>
            </div>
          </div>
        </div>
      )}
    </PortalShell>
  );
}
