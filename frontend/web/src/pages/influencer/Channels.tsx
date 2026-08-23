import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Users, Sparkles, ExternalLink } from 'lucide-react';
import PortalShell from '../../components/shared/PortalShell';
import PageHeader from '../../components/shared/PageHeader';
import Modal from '../../components/shared/Modal';
import EmptyState from '../../components/shared/EmptyState';
import ErrorState from '../../components/shared/ErrorState';
import { SkeletonLine } from '../../components/shared/LoadingSkeleton';
import { useToast } from '../../components/shared/Toast';
import PlatformIcon, { platformLabel, PLATFORM_OPTIONS } from '../../components/shared/PlatformIcon';
import { compact } from '../../components/shared/StatTile';
import { useAuth } from '../../core/auth/AuthContext';
import { creatorService } from '../../core/services/creator.service';
import type { Creator, SocialPlatform } from '../../core/models';

export default function InfluencerChannels() {
  const { currentUser } = useAuth();
  const participantId = currentUser?.creatorId ?? 'CRT260822A01';
  const { toast } = useToast();

  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [platform, setPlatform] = useState<SocialPlatform['platform']>(PLATFORM_OPTIONS[0]);
  const [handle, setHandle] = useState('');
  const [followers, setFollowers] = useState('');
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [addingCapability, setAddingCapability] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    creatorService.getCreator(participantId)
      .then(setCreator)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(load, [participantId]);

  const totalReach = (creator?.socialPlatforms ?? []).reduce((t, p) => t + p.followers, 0);

  const openAdd = () => {
    setEditingIndex(null);
    setPlatform(PLATFORM_OPTIONS[0]);
    setHandle('');
    setFollowers('');
    setUrl('');
    setModalOpen(true);
  };

  const openEdit = (idx: number) => {
    const p = creator!.socialPlatforms[idx];
    setEditingIndex(idx);
    setPlatform(p.platform);
    setHandle(p.handle);
    setFollowers(String(p.followers));
    setUrl(p.url ?? '');
    setModalOpen(true);
  };

  const save = async () => {
    if (!creator || !handle.trim()) return;
    const entry: SocialPlatform = {
      platform,
      handle: handle.trim(),
      followers: Math.max(0, Number(followers) || 0),
      url: url.trim() || undefined,
    };
    const next = [...creator.socialPlatforms];
    if (editingIndex !== null) next[editingIndex] = entry;
    else next.push(entry);

    setSaving(true);
    try {
      const updated = await creatorService.updateCreator(creator.referenceId, { socialPlatforms: next });
      setCreator(updated);
      setModalOpen(false);
      toast(editingIndex !== null ? 'Channel updated' : 'Channel added');
    } catch {
      toast('Could not save the channel', 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (idx: number) => {
    if (!creator) return;
    const next = creator.socialPlatforms.filter((_, i) => i !== idx);
    try {
      const updated = await creatorService.updateCreator(creator.referenceId, { socialPlatforms: next });
      setCreator(updated);
      toast('Channel removed');
    } catch {
      toast('Could not remove the channel', 'error');
    }
  };

  const addCreatorCapability = async () => {
    if (!creator) return;
    setAddingCapability(true);
    try {
      const updated = await creatorService.addCapability(creator.referenceId, 'CREATOR');
      setCreator(updated);
      toast('Creator capability added');
    } catch {
      toast('Could not add the Creator capability', 'error');
    } finally {
      setAddingCapability(false);
    }
  };

  return (
    <PortalShell type="influencer">
      <PageHeader
        title="Channels"
        subtitle="The social accounts your tracked links promote to"
        actions={
          !loading && !error ? (
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700"
            >
              <Plus size={15} /> Add channel
            </button>
          ) : undefined
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
              <SkeletonLine width="w-1/2" height="h-4" />
              <SkeletonLine width="w-2/3" height="h-3" />
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState onRetry={load} message="Could not load your channels." />
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
              <Users size={20} />
            </div>
            <div>
              <p className="text-xl font-bold font-display text-gray-900 tabular-nums">{compact(totalReach)}</p>
              <p className="text-xs text-gray-500">Total reach across {creator?.socialPlatforms.length ?? 0} channel{creator?.socialPlatforms.length === 1 ? '' : 's'}</p>
            </div>
          </div>

          {(!creator?.socialPlatforms || creator.socialPlatforms.length === 0) ? (
            <EmptyState
              icon={Users}
              title="No channels yet"
              message="Add the social accounts you promote campaigns on so partners know where your audience lives."
              action={{ label: 'Add channel', onClick: openAdd }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {creator.socialPlatforms.map((p, idx) => (
                <div key={`${p.platform}-${idx}`} className="bg-white rounded-xl border border-gray-100 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                        <PlatformIcon platform={p.platform} size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{platformLabel(p.platform)}</p>
                        <p className="text-xs text-gray-500">@{p.handle}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEdit(idx)}
                        aria-label="Edit channel"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-brand-700 hover:bg-brand-50"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => remove(idx)}
                        aria-label="Remove channel"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <p className="text-lg font-bold font-display text-gray-900 tabular-nums">{compact(p.followers)}</p>
                  <p className="text-xs text-gray-400 mb-2">followers</p>
                  {p.url && (
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline truncate"
                    >
                      <ExternalLink size={12} /> View channel
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {creator && !creator.capabilities.includes('CREATOR') && (
            <div className="bg-brand-50/60 border border-brand-100 rounded-xl p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white text-brand-600 flex items-center justify-center shrink-0 border border-brand-100">
                <Sparkles size={18} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900 mb-1">Also become a Creator</h3>
                <p className="text-xs text-gray-600 max-w-xl">
                  Creators publish photos, video and reviews directly on <span className="font-tamil">ழ</span> itself and
                  earn a Content Fee on top of Sales Commission — in addition to the tracked-link promotion you already do here.
                </p>
              </div>
              <button
                onClick={addCreatorCapability}
                disabled={addingCapability}
                className="shrink-0 px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl hover:bg-brand-700 disabled:opacity-50"
              >
                {addingCapability ? 'Adding…' : 'Add Creator capability'}
              </button>
            </div>
          )}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title={editingIndex !== null ? 'Edit channel' : 'Add channel'}
        footer={
          <>
            <button
              onClick={() => setModalOpen(false)}
              disabled={saving}
              className="px-4 py-2.5 border border-gray-200 bg-white text-gray-700 text-sm font-bold rounded-xl hover:border-brand-300 hover:text-brand-700 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving || !handle.trim()}
              className="px-4 py-2.5 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save channel'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Platform</label>
            <div className="flex flex-wrap gap-1.5">
              {PLATFORM_OPTIONS.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setPlatform(opt)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    platform === opt
                      ? 'bg-brand-600 border-brand-600 text-white'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-brand-300 hover:text-brand-700'
                  }`}
                >
                  <PlatformIcon platform={opt} size={13} className={platform === opt ? 'text-white' : undefined} />
                  {platformLabel(opt)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Handle</label>
            <input
              type="text"
              value={handle}
              onChange={e => setHandle(e.target.value)}
              placeholder="yourhandle"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Followers</label>
            <input
              type="number"
              min={0}
              value={followers}
              onChange={e => setFollowers(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 tabular-nums"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Profile URL (optional)</label>
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
            />
          </div>
        </div>
      </Modal>
    </PortalShell>
  );
}
