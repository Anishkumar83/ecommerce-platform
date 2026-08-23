import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, Star, Info, Play, Heart, Bookmark, Camera, Video, FileText, Shirt, ThumbsUp } from 'lucide-react';
import type { CreatorContent, CreatorContentKind } from '../../core/models';
import { creatorService } from '../../core/services/creator.service';
import Modal from './Modal';
import Tabs from './Tabs';
import EmptyState from './EmptyState';
import { SkeletonLine } from './LoadingSkeleton';
import { compact } from './StatTile';

const KIND_META: Record<CreatorContentKind, { label: string; icon: typeof Camera }> = {
  PHOTO: { label: 'Photo', icon: Camera },
  VIDEO: { label: 'Video', icon: Video },
  REVIEW: { label: 'Review', icon: FileText },
  STYLING: { label: 'Styling', icon: Shirt },
  RECOMMENDATION: { label: 'Recommendation', icon: ThumbsUp },
};

/**
 * Creator-generated content for one product, shown alongside — never instead of
 * — the existing customer reviews. The distinction matters commercially and
 * legally, so every card is explicitly labelled "Creator Review" and any piece
 * made from a campaign sample carries the provided-for-review disclosure.
 */
export default function CreatorReviews({ productId }: { productId: string }) {
  const [items, setItems] = useState<CreatorContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | CreatorContentKind>('all');
  const [open, setOpen] = useState<CreatorContent | null>(null);

  useEffect(() => {
    setLoading(true);
    creatorService.getProductCreatorContent(productId)
      .then(setItems)
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-100 p-4 space-y-3">
            <div className="flex gap-3">
              <div className="skeleton w-10 h-10 rounded-full" />
              <div className="space-y-2 grow"><SkeletonLine width="w-1/3" height="h-3" /><SkeletonLine width="w-1/4" height="h-2.5" /></div>
            </div>
            <div className="skeleton w-full h-40 rounded-lg" />
            <SkeletonLine width="w-full" height="h-3" />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Camera}
        title="No creator reviews yet"
        message="Creators who receive or buy this product will publish their photos, video and reviews here."
      />
    );
  }

  const kinds = Array.from(new Set(items.map(i => i.kind)));
  const shown = filter === 'all' ? items : items.filter(i => i.kind === filter);

  return (
    <div>
      {kinds.length > 1 && (
        <Tabs
          variant="pill"
          className="mb-5"
          active={filter}
          onChange={id => setFilter(id as 'all' | CreatorContentKind)}
          tabs={[
            { id: 'all', label: 'All', count: items.length },
            ...kinds.map(k => ({
              id: k,
              label: KIND_META[k].label,
              count: items.filter(i => i.kind === k).length,
            })),
          ]}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {shown.map(item => {
          const Kind = KIND_META[item.kind].icon;
          return (
            <article key={item.referenceId} className="rounded-xl border border-gray-100 overflow-hidden bg-white hover:border-gray-200 hover:shadow-sm transition-all">
              <div className="flex items-center gap-2.5 p-4 pb-3">
                <Link to={`/creators/${item.creatorHandle}`}>
                  <img src={item.creatorAvatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                </Link>
                <div className="min-w-0 grow">
                  <Link
                    to={`/creators/${item.creatorHandle}`}
                    className="flex items-center gap-1 text-sm font-bold text-gray-900 hover:text-brand-700"
                  >
                    {item.creatorName}
                    {item.creatorVerified && <BadgeCheck size={12} className="text-brand-600" />}
                  </Link>
                  {/* The label that separates this from a customer review. */}
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-brand-700 bg-brand-50 rounded px-1.5 py-0.5 mt-0.5">
                    <Kind size={9} /> Creator Review
                  </span>
                </div>
                {item.rating !== undefined && (
                  <div className="flex gap-0.5 shrink-0">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={11} className={i < item.rating! ? 'text-amber-400' : 'text-gray-200'} fill="currentColor" />
                    ))}
                  </div>
                )}
              </div>

              <button onClick={() => setOpen(item)} className="block w-full text-left group">
                <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {item.videoPreviewUrl && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="w-11 h-11 rounded-full bg-white/90 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                        <Play size={16} className="text-gray-900 ml-0.5" fill="currentColor" />
                      </span>
                    </span>
                  )}
                </div>
                <div className="px-4 pt-3">
                  <h4 className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-brand-700 transition-colors">{item.title}</h4>
                  <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{item.body}</p>
                </div>
              </button>

              <div className="px-4 pt-2.5 pb-4">
                {item.providedForReview && (
                  <p className="flex items-start gap-1.5 text-[11px] text-gray-500 bg-gray-50 rounded-lg px-2.5 py-1.5 mb-2.5">
                    <Info size={11} className="shrink-0 mt-0.5" />
                    Product provided for review
                    {item.campaignName ? <span className="text-gray-400"> · {item.campaignName}</span> : null}
                  </p>
                )}
                <div className="flex items-center gap-4 text-[11px] text-gray-400 tabular-nums">
                  <span className="flex items-center gap-1"><Heart size={11} /> {compact(item.likes)}</span>
                  <span className="flex items-center gap-1"><Bookmark size={11} /> {compact(item.saves)}</span>
                  <span>{compact(item.views)} views</span>
                  {item.publishedOn && (
                    <span className="ml-auto">
                      {new Date(item.publishedOn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.title} size="lg">
        {open && (
          <div className="space-y-4">
            <img src={open.mediaUrl} alt={open.title} className="w-full rounded-xl object-cover max-h-[420px]" />
            <div className="flex items-center gap-2.5">
              <img src={open.creatorAvatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
              <div>
                <p className="flex items-center gap-1 text-sm font-bold text-gray-900">
                  {open.creatorName}
                  {open.creatorVerified && <BadgeCheck size={12} className="text-brand-600" />}
                </p>
                <p className="text-xs text-gray-500">@{open.creatorHandle} · Creator Review</p>
              </div>
              {open.rating !== undefined && (
                <div className="flex gap-0.5 ml-auto">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={13} className={i < open.rating! ? 'text-amber-400' : 'text-gray-200'} fill="currentColor" />
                  ))}
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{open.body}</p>
            {open.providedForReview && (
              <p className="flex items-start gap-1.5 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2.5">
                <Info size={12} className="shrink-0 mt-0.5" />
                Product provided for review{open.campaignName ? ` as part of ${open.campaignName}` : ''}. The creator's opinion is their own.
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
