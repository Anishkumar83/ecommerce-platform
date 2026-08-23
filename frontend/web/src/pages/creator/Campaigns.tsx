import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Megaphone, Check, X, Truck, Send, Clock } from 'lucide-react';
import PortalShell from '../../components/shared/PortalShell';
import PageHeader from '../../components/shared/PageHeader';
import Tabs from '../../components/shared/Tabs';
import StatusBadge from '../../components/shared/StatusBadge';
import RewardSummary from '../../components/shared/RewardSummary';
import { Drawer } from '../../components/shared/Modal';
import WorkflowTimeline from '../../components/shared/WorkflowTimeline';
import EmptyState from '../../components/shared/EmptyState';
import ErrorState from '../../components/shared/ErrorState';
import { SkeletonTable } from '../../components/shared/LoadingSkeleton';
import { useToast } from '../../components/shared/Toast';
import { useAuth } from '../../core/auth/AuthContext';
import { creatorService } from '../../core/services/creator.service';
import type { CampaignParticipation, ParticipationState } from '../../core/models';

/** The state path a creator's participation walks, used to render the drawer timeline. */
const CREATOR_PATH: ParticipationState[] = [
  'INVITED', 'ACCEPTED', 'PRODUCT_SHIPPED', 'PRODUCT_RECEIVED',
  'CONTENT_PENDING', 'CONTENT_SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED',
];

const STATE_LABELS: Record<ParticipationState, string> = {
  INVITED: 'Invited', ACCEPTED: 'Accepted the invite', DECLINED: 'Declined',
  PRODUCT_SHIPPED: 'Product shipped', PRODUCT_RECEIVED: 'Product received',
  CONTENT_PENDING: 'Content awaited', CONTENT_SUBMITTED: 'Content submitted',
  UNDER_REVIEW: 'Under review', APPROVED: 'Approved', REJECTED: 'Rejected',
  PUBLISHED: 'Published', PROMOTING: 'Promoting', COMPLETED: 'Completed',
};

const GROUPS: { id: string; label: string; match: (s: ParticipationState) => boolean }[] = [
  { id: 'invitations', label: 'Invitations', match: s => s === 'INVITED' },
  { id: 'active', label: 'Active', match: s => ['ACCEPTED', 'PRODUCT_SHIPPED', 'PRODUCT_RECEIVED', 'CONTENT_PENDING', 'CONTENT_SUBMITTED', 'UNDER_REVIEW', 'PROMOTING'].includes(s) },
  { id: 'completed', label: 'Completed', match: s => ['APPROVED', 'PUBLISHED', 'COMPLETED', 'DECLINED', 'REJECTED'].includes(s) },
];

export default function CreatorCampaigns() {
  const { currentUser } = useAuth();
  const creatorId = currentUser?.creatorId ?? 'CRT260822A01';
  const { toast } = useToast();

  const [participations, setParticipations] = useState<CampaignParticipation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('invitations');
  const [selected, setSelected] = useState<CampaignParticipation | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    creatorService.getParticipations({ participantId: creatorId, role: 'CREATOR' })
      .then(setParticipations)
      .catch(() => setError('Could not load your campaigns right now.'))
      .finally(() => setLoading(false));
  }, [creatorId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!selected) return;
    const fresh = participations.find(p => p.referenceId === selected.referenceId);
    if (fresh) setSelected(fresh);
  }, [participations, selected]);

  const filtered = useMemo(() => {
    const g = GROUPS.find(x => x.id === tab) ?? GROUPS[0];
    return participations.filter(p => g.match(p.state));
  }, [participations, tab]);

  const tabs = GROUPS.map(g => ({ id: g.id, label: g.label, count: participations.filter(p => g.match(p.state)).length }));

  const advance = async (state: ParticipationState, description: string) => {
    if (!selected) return;
    setBusy(true);
    try {
      const updated = await creatorService.advanceParticipation(selected.referenceId, state, description);
      setParticipations(prev => prev.map(p => (p.referenceId === updated.referenceId ? updated : p)));
      toast('Updated');
    } catch {
      toast('Could not update this campaign', 'error');
    } finally {
      setBusy(false);
    }
  };

  const timelineSteps = (p: CampaignParticipation) => {
    if (p.state === 'DECLINED' || p.state === 'REJECTED') {
      return CREATOR_PATH.slice(0, 2).map((s, i) => ({
        label: STATE_LABELS[s],
        sublabel: p.timeline.find(t => t.state === s)?.description,
        completed: i === 0,
        current: false,
      })).concat([{
        label: STATE_LABELS[p.state],
        sublabel: p.timeline.find(t => t.state === p.state)?.description,
        completed: true,
        current: true,
      }]);
    }
    const pathIndex = CREATOR_PATH.indexOf(p.state);
    return CREATOR_PATH.map((s, i) => {
      const event = p.timeline.find(t => t.state === s);
      return {
        label: STATE_LABELS[s],
        sublabel: event ? new Date(event.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + (event.description ? ` · ${event.description}` : '') : undefined,
        completed: i < pathIndex || (i === pathIndex && s === 'PUBLISHED'),
        current: i === pathIndex && s !== 'PUBLISHED',
      };
    });
  };

  return (
    <PortalShell type="creator">
      <PageHeader title="Campaigns" subtitle="Invitations, work in progress, and everything you've wrapped up." />

      <Tabs tabs={tabs} active={tab} onChange={setTab} className="mb-6" />

      {loading ? (
        <SkeletonTable rows={5} cols={5} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Megaphone} title="Nothing here" message="No campaigns in this view yet." />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
          {filtered.map(p => (
            <button
              key={p.referenceId}
              onClick={() => setSelected(p)}
              className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50/70 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-900 line-clamp-1">{p.campaignName}</p>
                <p className="text-xs text-gray-500 line-clamp-1">{p.partnerName} · {p.productNames.join(', ')}</p>
              </div>
              <div className="hidden md:block shrink-0 w-52">
                <RewardSummary reward={p.reward} compactView />
              </div>
              <div className="hidden sm:block shrink-0 text-xs text-gray-400 tabular-nums w-24 text-right">
                Due {new Date(p.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </div>
              <div className="shrink-0"><StatusBadge status={p.state} size="sm" /></div>
            </button>
          ))}
        </div>
      )}

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.campaignName}
        subtitle={selected?.partnerName}
        footer={
          selected ? (
            selected.state === 'INVITED' ? (
              <div className="flex items-center gap-2 w-full">
                <button
                  onClick={() => advance('ACCEPTED', 'Creator accepted the invitation')}
                  disabled={busy}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700 disabled:opacity-50"
                >
                  <Check size={14} /> Accept
                </button>
                <button
                  onClick={() => advance('DECLINED', 'Declined by creator')}
                  disabled={busy}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:border-red-300 hover:text-red-600 disabled:opacity-50"
                >
                  <X size={14} /> Decline
                </button>
              </div>
            ) : selected.state === 'PRODUCT_SHIPPED' ? (
              <button
                onClick={() => advance('PRODUCT_RECEIVED', 'Creator confirmed delivery')}
                disabled={busy}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700 disabled:opacity-50"
              >
                <Truck size={14} /> Confirm product received
              </button>
            ) : selected.state === 'PRODUCT_RECEIVED' || selected.state === 'CONTENT_PENDING' ? (
              <Link
                to={`/creator/content/new?product=${selected.productIds[0] ?? ''}`}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700"
              >
                <Send size={14} /> Submit content
              </Link>
            ) : undefined
          ) : undefined
        }
      >
        {selected && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={selected.state} />
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock size={11} /> Due {new Date(selected.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Products</h3>
              <p className="text-sm text-gray-700">{selected.productNames.join(', ')}</p>
              {selected.productSampleProvided && (
                <p className="text-xs text-gray-400 mt-1">Product sample provided by the partner.</p>
              )}
            </div>

            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Reward</h3>
              <RewardSummary reward={selected.reward} />
            </div>

            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Timeline</h3>
              <WorkflowTimeline steps={timelineSteps(selected)} orientation="vertical" />
            </div>
          </div>
        )}
      </Drawer>
    </PortalShell>
  );
}
