import { useState, useEffect } from 'react';
import { Check, X, BadgeCheck, Info, Camera, Search } from 'lucide-react';
import AdminShell from '../../components/shared/AdminShell';
import PageHeader from '../../components/shared/PageHeader';
import EmptyState from '../../components/shared/EmptyState';
import Tabs from '../../components/shared/Tabs';
import Modal, { Drawer } from '../../components/shared/Modal';
import ModerationTrail, { ModerationBadge } from '../../components/shared/ModerationTrail';
import StatTile, { compact } from '../../components/shared/StatTile';
import { SkeletonLine } from '../../components/shared/LoadingSkeleton';
import { useToast } from '../../components/shared/Toast';
import { creatorService } from '../../core/services/creator.service';
import type { Creator, CreatorContent, CreatorContentState } from '../../core/models';

const QUEUES: { id: string; label: string; states: CreatorContentState[] }[] = [
  { id: 'review', label: 'Awaiting review', states: ['UNDER_REVIEW'] },
  { id: 'processing', label: 'Processing', states: ['UPLOADING', 'SCANNING'] },
  { id: 'live', label: 'Published', states: ['PUBLISHED', 'APPROVED'] },
  { id: 'blocked', label: 'Rejected & suspended', states: ['REJECTED', 'SUSPENDED'] },
];

/**
 * Moderation queue for creator-generated content.
 *
 * No moderation service exists behind this yet — approving here just advances
 * the mock state machine. The screen exists so the review surface, the audit
 * trail and the decision vocabulary are settled before a backend arrives.
 */
export default function AdminCreatorContent() {
  const [all, setAll] = useState<CreatorContent[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState('review');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState<CreatorContent | null>(null);
  const [rejecting, setRejecting] = useState<CreatorContent | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const page = await creatorService.getCreators(1, 50);
    setCreators(page.data);
    const perCreator = await Promise.all(page.data.map(c => creatorService.getCreatorContent(c.referenceId)));
    setAll(perCreator.flat().sort((a, b) => b.createdOn.localeCompare(a.createdOn)));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const decide = async (item: CreatorContent, decision: 'APPROVED' | 'REJECTED', why?: string) => {
    setBusy(item.referenceId);
    try {
      await creatorService.moderateContent(item.referenceId, decision, why);
      toast(decision === 'APPROVED' ? 'Approved — publishing now' : 'Content rejected');
      setOpen(null);
      setRejecting(null);
      setReason('');
      await load();
    } catch {
      toast('Could not record that decision', 'error');
    } finally {
      setBusy(null);
    }
  };

  const activeQueue = QUEUES.find(q => q.id === queue)!;
  const inQueue = all.filter(c => activeQueue.states.includes(c.state));
  const shown = search
    ? inQueue.filter(c =>
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.creatorName.toLowerCase().includes(search.toLowerCase()) ||
        c.productName.toLowerCase().includes(search.toLowerCase()))
    : inQueue;

  const pending = all.filter(c => c.state === 'UNDER_REVIEW').length;
  const sampled = all.filter(c => c.providedForReview).length;

  return (
    <AdminShell>
      <PageHeader
        title="Creator Content"
        subtitle={pending ? `${pending} ${pending === 1 ? 'item' : 'items'} awaiting review` : 'Nothing waiting on you'}
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Creator Content' }]}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatTile label="Awaiting review" value={pending} tone={pending ? 'warning' : 'neutral'} />
        <StatTile label="Published" value={all.filter(c => c.state === 'PUBLISHED').length} tone="positive" />
        <StatTile label="Provided for review" value={sampled} sublabel="carry a disclosure" />
        <StatTile label="Active creators" value={creators.filter(c => c.creatorStatus === 'ACTIVE').length} />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <Tabs
          variant="pill"
          active={queue}
          onChange={setQueue}
          tabs={QUEUES.map(q => ({
            id: q.id,
            label: q.label,
            count: all.filter(c => q.states.includes(c.state)).length,
          }))}
        />
        <div className="relative ml-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search creator, product or title"
            className="pl-9 pr-3 py-2 w-64 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-brand-400"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 flex gap-4">
              <div className="skeleton w-20 h-20 rounded-lg shrink-0" />
              <div className="grow space-y-2 pt-1">
                <SkeletonLine width="w-1/3" height="h-3.5" />
                <SkeletonLine width="w-2/3" height="h-3" />
                <SkeletonLine width="w-1/4" height="h-3" />
              </div>
            </div>
          ))}
        </div>
      ) : shown.length === 0 ? (
        <EmptyState
          icon={Camera}
          title="Queue is clear"
          message={search ? 'Nothing matches that search.' : `No content is currently ${activeQueue.label.toLowerCase()}.`}
        />
      ) : (
        <div className="space-y-2">
          {shown.map(item => (
            <div key={item.referenceId} className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-4 hover:border-gray-200 transition-colors">
              <button onClick={() => setOpen(item)} className="shrink-0">
                <img src={item.thumbnailUrl} alt="" className="w-full sm:w-20 h-32 sm:h-20 rounded-lg object-cover bg-gray-100" />
              </button>

              <div className="grow min-w-0">
                <div className="flex items-start gap-2 mb-1">
                  <button onClick={() => setOpen(item)} className="text-left">
                    <p className="text-sm font-semibold text-gray-900 hover:text-brand-700">{item.title}</p>
                  </button>
                  <ModerationBadge state={item.state} size="sm" />
                </div>
                <p className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                  {item.creatorName}
                  {item.creatorVerified && <BadgeCheck size={11} className="text-brand-600" />}
                  <span className="text-gray-300">·</span>
                  {item.productName}
                </p>
                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{item.body}</p>
                {item.providedForReview && (
                  <p className="inline-flex items-center gap-1 text-[10px] text-gray-500 bg-gray-50 rounded px-1.5 py-0.5 mt-1.5">
                    <Info size={9} /> Product provided for review
                  </p>
                )}
              </div>

              {item.state === 'UNDER_REVIEW' && (
                <div className="flex sm:flex-col gap-2 shrink-0 sm:justify-center">
                  <button
                    onClick={() => decide(item, 'APPROVED')}
                    disabled={busy === item.referenceId}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 grow sm:grow-0"
                  >
                    <Check size={13} /> Approve
                  </button>
                  <button
                    onClick={() => { setRejecting(item); setReason(''); }}
                    disabled={busy === item.referenceId}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-red-700 text-xs font-bold hover:bg-red-50 disabled:opacity-50 grow sm:grow-0"
                  >
                    <X size={13} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Full review */}
      <Drawer
        open={!!open}
        onClose={() => setOpen(null)}
        title={open?.title}
        subtitle={open ? `${open.creatorName} · ${open.productName}` : undefined}
        footer={open?.state === 'UNDER_REVIEW' ? (
          <>
            <button
              onClick={() => decide(open, 'APPROVED')}
              className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700"
            >
              Approve &amp; publish
            </button>
            <button
              onClick={() => { setRejecting(open); setReason(''); }}
              className="px-4 py-2.5 rounded-xl border border-red-200 text-red-700 text-sm font-bold hover:bg-red-50"
            >
              Reject
            </button>
          </>
        ) : undefined}
      >
        {open && (
          <div className="space-y-5">
            <img src={open.mediaUrl} alt="" className="w-full rounded-xl object-cover" />

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Review</p>
              <p className="text-sm text-gray-700 leading-relaxed">{open.body}</p>
            </div>

            {open.providedForReview && (
              <p className="flex items-start gap-1.5 text-xs text-gray-600 bg-amber-50 rounded-lg px-3 py-2.5">
                <Info size={12} className="shrink-0 mt-0.5 text-amber-600" />
                Product provided for review{open.campaignName ? ` under ${open.campaignName}` : ''}. The disclosure
                must stay visible wherever this content is shown.
              </p>
            )}

            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Views', value: compact(open.views) },
                { label: 'Likes', value: compact(open.likes) },
                { label: 'Orders', value: compact(open.attributedOrders) },
              ].map(m => (
                <div key={m.label} className="bg-gray-50 rounded-lg py-2.5">
                  <p className="text-sm font-bold text-gray-900 tabular-nums">{m.value}</p>
                  <p className="text-[10px] text-gray-500">{m.label}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Moderation trail</p>
              <ModerationTrail
                state={open.state}
                events={open.moderationEvents}
                rejectionReason={open.rejectionReason}
                orientation="vertical"
              />
            </div>
          </div>
        )}
      </Drawer>

      {/* Rejection reason */}
      <Modal
        open={!!rejecting}
        onClose={() => setRejecting(null)}
        title="Reject this content"
        subtitle="The creator sees this reason and can resubmit."
        size="sm"
        footer={
          <>
            <button onClick={() => setRejecting(null)} className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100">
              Cancel
            </button>
            <button
              onClick={() => rejecting && decide(rejecting, 'REJECTED', reason.trim() || undefined)}
              disabled={!reason.trim() || busy !== null}
              className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-40"
            >
              Reject content
            </button>
          </>
        }
      >
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Reason</label>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={3}
          placeholder="Product packaging not clearly visible in the opening frame"
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-brand-400 resize-none"
        />
        <p className="text-[11px] text-gray-400 mt-1.5">Be specific — a vague reason means a resubmission that fails again.</p>
      </Modal>
    </AdminShell>
  );
}
