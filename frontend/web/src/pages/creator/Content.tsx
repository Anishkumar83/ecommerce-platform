import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FileVideo, Eye, Heart, Bookmark, MousePointerClick, Star, Sparkles, Info } from 'lucide-react';
import PortalShell from '../../components/shared/PortalShell';
import PageHeader from '../../components/shared/PageHeader';
import Tabs from '../../components/shared/Tabs';
import { Drawer } from '../../components/shared/Modal';
import ModerationTrail, { ModerationBadge } from '../../components/shared/ModerationTrail';
import EmptyState from '../../components/shared/EmptyState';
import ErrorState from '../../components/shared/ErrorState';
import { SkeletonCard } from '../../components/shared/LoadingSkeleton';
import { useToast } from '../../components/shared/Toast';
import { compact } from '../../components/shared/StatTile';
import { useAuth } from '../../core/auth/AuthContext';
import { creatorService } from '../../core/services/creator.service';
import type { CreatorContent, CreatorContentState } from '../../core/models';

const FILTERS: { id: string; label: string; match: (s: CreatorContentState) => boolean }[] = [
  { id: 'all', label: 'All', match: () => true },
  { id: 'published', label: 'Published', match: s => s === 'PUBLISHED' },
  { id: 'review', label: 'Under Review', match: s => s === 'UPLOADING' || s === 'SCANNING' || s === 'UNDER_REVIEW' || s === 'APPROVED' },
  { id: 'other', label: 'Draft & Rejected', match: s => s === 'DRAFT' || s === 'REJECTED' || s === 'SUSPENDED' },
];

export default function CreatorContentPage() {
  const { currentUser } = useAuth();
  const creatorId = currentUser?.creatorId ?? 'CRT260822A01';
  const { toast } = useToast();

  const [content, setContent] = useState<CreatorContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('all');
  const [selected, setSelected] = useState<CreatorContent | null>(null);
  const [toggling, setToggling] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    creatorService.getCreatorContent(creatorId)
      .then(setContent)
      .catch(() => setError('Could not load your content right now.'))
      .finally(() => setLoading(false));
  }, [creatorId]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const f = FILTERS.find(x => x.id === tab) ?? FILTERS[0];
    return content.filter(c => f.match(c.state));
  }, [content, tab]);

  const tabs = FILTERS.map(f => ({ id: f.id, label: f.label, count: content.filter(c => f.match(c.state)).length }));

  const toggleTopPick = async () => {
    if (!selected) return;
    setToggling(true);
    try {
      const updated = await creatorService.toggleTopPick(selected.referenceId);
      setSelected(updated);
      setContent(prev => prev.map(c => (c.referenceId === updated.referenceId ? updated : c)));
      toast(updated.isTopPick ? 'Marked as a Top Pick' : 'Removed from Top Picks');
    } catch {
      toast('Could not update Top Pick status', 'error');
    } finally {
      setToggling(false);
    }
  };

  return (
    <PortalShell type="creator">
      <PageHeader
        title="My Content"
        subtitle="Every piece you've uploaded, and where it stands in review."
        actions={
          <Link
            to="/creator/content/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700"
          >
            <FileVideo size={15} /> Upload content
          </Link>
        }
      />

      <Tabs tabs={tabs} active={tab} onChange={setTab} className="mb-6" />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileVideo}
          title="Nothing here yet"
          message={content.length === 0 ? 'Upload your first piece of content to get started.' : 'Nothing matches this filter yet.'}
          action={content.length === 0 ? { label: 'Upload content', onClick: () => { window.location.href = '/creator/content/new'; } } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map(c => (
            <button
              key={c.referenceId}
              onClick={() => setSelected(c)}
              className="text-left bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-gray-200 transition-all"
            >
              <div className="relative aspect-square bg-gray-100">
                <img src={c.thumbnailUrl} alt={c.title} className="w-full h-full object-cover" />
                <div className="absolute top-2 left-2"><ModerationBadge state={c.state} size="sm" /></div>
                {c.isTopPick && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/95 flex items-center justify-center shadow">
                    <Sparkles size={12} className="text-brand-600" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="text-sm font-semibold text-gray-900 line-clamp-1 mb-0.5">{c.title}</h3>
                <p className="text-xs text-gray-500 line-clamp-1 mb-2">{c.productName}</p>
                <div className="flex items-center gap-3 text-[11px] text-gray-400 tabular-nums">
                  <span className="flex items-center gap-1"><Eye size={11} /> {compact(c.views)}</span>
                  <span className="flex items-center gap-1"><Heart size={11} /> {compact(c.likes)}</span>
                  <span className="flex items-center gap-1"><MousePointerClick size={11} /> {compact(c.clicks)}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title}
        subtitle={selected?.productName}
        footer={
          selected ? (
            <button
              onClick={toggleTopPick}
              disabled={toggling || selected.state !== 'PUBLISHED'}
              className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                selected.isTopPick
                  ? 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                  : 'bg-brand-600 text-white hover:bg-brand-700'
              }`}
              title={selected.state !== 'PUBLISHED' ? 'Only published content can be a Top Pick' : undefined}
            >
              <Sparkles size={14} />
              {selected.isTopPick ? 'Remove from Top Picks' : 'Mark as Top Pick'}
            </button>
          ) : undefined
        }
      >
        {selected && (
          <div className="space-y-6">
            <img src={selected.thumbnailUrl} alt="" className="w-full aspect-video object-cover rounded-xl bg-gray-100" />

            {selected.rating !== undefined && (
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} className={i < selected.rating! ? 'text-amber-400' : 'text-gray-200'} fill="currentColor" />
                ))}
              </div>
            )}

            <div>
              <p className="text-sm text-gray-700 leading-relaxed">{selected.body}</p>
            </div>

            {selected.providedForReview && (
              <p className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2.5">
                <Info size={13} className="shrink-0 mt-0.5" />
                Product provided for review by {selected.partnerName ?? 'the partner'}.
              </p>
            )}

            <div className="grid grid-cols-4 gap-2 text-center">
              <MetricBox icon={Eye} label="Views" value={compact(selected.views)} />
              <MetricBox icon={Heart} label="Likes" value={compact(selected.likes)} />
              <MetricBox icon={Bookmark} label="Saves" value={compact(selected.saves)} />
              <MetricBox icon={MousePointerClick} label="Clicks" value={compact(selected.clicks)} />
            </div>

            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Moderation trail</h3>
              <ModerationTrail
                state={selected.state}
                events={selected.moderationEvents}
                rejectionReason={selected.rejectionReason}
                orientation="vertical"
              />
            </div>
          </div>
        )}
      </Drawer>
    </PortalShell>
  );
}

function MetricBox({ icon: Icon, label, value }: { icon: typeof Eye; label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg py-2.5">
      <Icon size={13} className="text-gray-400 mx-auto mb-1" />
      <p className="text-sm font-bold text-gray-800 tabular-nums leading-none">{value}</p>
      <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}
