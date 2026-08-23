import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Megaphone, Plus, X, ExternalLink, Save, Info } from 'lucide-react';
import PortalShell from '../../components/shared/PortalShell';
import PageHeader from '../../components/shared/PageHeader';
import PlatformIcon, { platformLabel, PLATFORM_OPTIONS } from '../../components/shared/PlatformIcon';
import ErrorState from '../../components/shared/ErrorState';
import { SkeletonLine } from '../../components/shared/LoadingSkeleton';
import { useToast } from '../../components/shared/Toast';
import { useAuth } from '../../core/auth/AuthContext';
import { creatorService } from '../../core/services/creator.service';
import type { Creator, SocialPlatform } from '../../core/models';

const CATEGORY_OPTIONS = [
  'Lifestyle', 'Travel', 'Accessories', 'Home & Living', 'Wellness', 'Beauty',
  'Electronics', 'Photography', 'Fitness', 'Fashion', 'Food', 'Parenting',
];

export default function CreatorProfile() {
  const { currentUser } = useAuth();
  const creatorId = currentUser?.creatorId ?? 'CRT260822A01';
  const { toast } = useToast();

  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [addingCapability, setAddingCapability] = useState(false);

  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [bio, setBio] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [socialPlatforms, setSocialPlatforms] = useState<SocialPlatform[]>([]);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    creatorService.getCreator(creatorId)
      .then(c => {
        setCreator(c);
        setName(c.name);
        setHandle(c.handle);
        setBio(c.bio);
        setCoverUrl(c.coverUrl ?? '');
        setCategories(c.categories);
        setSocialPlatforms(c.socialPlatforms);
      })
      .catch(() => setError('Could not load your profile right now.'))
      .finally(() => setLoading(false));
  }, [creatorId]);

  useEffect(() => { load(); }, [load]);

  const toggleCategory = (cat: string) => {
    setCategories(prev => (prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]));
  };

  const addPlatform = () => {
    const used = new Set(socialPlatforms.map(p => p.platform));
    const next = PLATFORM_OPTIONS.find(p => !used.has(p)) ?? PLATFORM_OPTIONS[0];
    setSocialPlatforms(prev => [...prev, { platform: next, handle: '', followers: 0 }]);
  };

  const updatePlatform = (i: number, patch: Partial<SocialPlatform>) => {
    setSocialPlatforms(prev => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  };

  const removePlatform = (i: number) => {
    setSocialPlatforms(prev => prev.filter((_, idx) => idx !== i));
  };

  const addInfluencerCapability = async () => {
    if (!creator) return;
    setAddingCapability(true);
    try {
      const updated = await creatorService.addCapability(creator.referenceId, 'INFLUENCER');
      setCreator(updated);
      toast('Influencer capability added — add your channels below and save.');
    } catch {
      toast('Could not add the Influencer capability', 'error');
    } finally {
      setAddingCapability(false);
    }
  };

  const save = async () => {
    if (!creator) return;
    setSaving(true);
    try {
      const updated = await creatorService.updateCreator(creator.referenceId, {
        name: name.trim(),
        handle: handle.trim(),
        bio: bio.trim(),
        coverUrl: coverUrl.trim() || undefined,
        categories,
        socialPlatforms: creator.capabilities.includes('INFLUENCER') ? socialPlatforms : creator.socialPlatforms,
      });
      setCreator(updated);
      toast('Profile saved');
    } catch {
      toast('Could not save your profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PortalShell type="creator">
        <PageHeader title="My Profile" />
        <div className="space-y-4 max-w-2xl">
          <SkeletonLine height="h-40" />
          <SkeletonLine height="h-10" />
          <SkeletonLine height="h-10" />
        </div>
      </PortalShell>
    );
  }

  if (error || !creator) {
    return (
      <PortalShell type="creator">
        <PageHeader title="My Profile" />
        <ErrorState message={error} onRetry={load} />
      </PortalShell>
    );
  }

  const isCreatorCap = creator.capabilities.includes('CREATOR');
  const isInfluencer = creator.capabilities.includes('INFLUENCER');

  return (
    <PortalShell type="creator">
      <PageHeader
        title="My Profile"
        subtitle="This is what shoppers and partners see about you."
        actions={
          <Link
            to={`/creators/${creator.handle}`}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:border-brand-300 hover:text-brand-700"
          >
            <ExternalLink size={14} /> View public profile
          </Link>
        }
      />

      <div className="max-w-2xl space-y-6">
        {/* Identity */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-800">Identity</h2>

          <div className="flex items-center gap-4">
            <img src={creator.avatarUrl} alt="" className="w-16 h-16 rounded-2xl object-cover bg-gray-100 shrink-0" />
            <div className="grow min-w-0">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Name</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Handle</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">@</span>
              <input value={handle} onChange={e => setHandle(e.target.value.replace(/\s+/g, ''))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 resize-none" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Cover image URL</label>
            <input value={coverUrl} onChange={e => setCoverUrl(e.target.value)} placeholder="https://…" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400" />
            {coverUrl && <img src={coverUrl} alt="" className="mt-2 w-full h-24 object-cover rounded-lg bg-gray-100" />}
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-800 mb-1">Categories</h2>
          <p className="text-xs text-gray-500 mb-3">Helps shoppers and partners find you for the right products.</p>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_OPTIONS.map(cat => {
              const on = categories.includes(cat);
              return (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    on ? 'bg-brand-600 border-brand-600 text-white' : 'border-gray-200 text-gray-600 hover:border-brand-300 hover:text-brand-700'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Capabilities */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-800 mb-1">Capabilities</h2>
          <p className="text-xs text-gray-500 mb-4">
            Creator and Influencer are two capabilities on one profile, not two accounts — you can hold either or both.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className={`rounded-xl border p-4 ${isCreatorCap ? 'border-brand-200 bg-brand-50/40' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-1.5">
                <Camera size={15} className={isCreatorCap ? 'text-brand-600' : 'text-gray-400'} />
                <span className="text-sm font-bold text-gray-800">Creator</span>
                {isCreatorCap && <span className="text-[10px] font-bold uppercase bg-brand-100 text-brand-700 rounded-full px-2 py-0.5">Active</span>}
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                You receive or buy a product and publish photos, video and reviews on <span className="font-tamil">ழ</span> itself. Paid a Content Fee plus Sales Commission.
              </p>
            </div>

            <div className={`rounded-xl border p-4 ${isInfluencer ? 'border-purple-200 bg-purple-50/40' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-1.5">
                <Megaphone size={15} className={isInfluencer ? 'text-purple-600' : 'text-gray-400'} />
                <span className="text-sm font-bold text-gray-800">Influencer</span>
                {isInfluencer && <span className="text-[10px] font-bold uppercase bg-purple-100 text-purple-700 rounded-full px-2 py-0.5">Active</span>}
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-2">
                You promote to an audience outside <span className="font-tamil">ழ</span> — Instagram, YouTube, Facebook — via a tracked link. Paid Sales Commission on attributed orders.
              </p>
              {!isInfluencer && (
                <button
                  onClick={addInfluencerCapability}
                  disabled={addingCapability}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 disabled:opacity-50"
                >
                  <Plus size={12} /> {addingCapability ? 'Adding…' : 'Add Influencer capability'}
                </button>
              )}
            </div>
          </div>

          {isInfluencer && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Social platforms</h3>
                <button onClick={addPlatform} className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:underline">
                  <Plus size={12} /> Add channel
                </button>
              </div>

              {socialPlatforms.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">No channels added yet.</p>
              ) : (
                <div className="space-y-2">
                  {socialPlatforms.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2.5">
                      <PlatformIcon platform={p.platform} className="shrink-0" />
                      <select
                        value={p.platform}
                        onChange={e => updatePlatform(i, { platform: e.target.value as SocialPlatform['platform'] })}
                        className="text-xs font-semibold border border-gray-200 rounded-lg px-2 py-1.5 bg-white"
                      >
                        {PLATFORM_OPTIONS.map(opt => <option key={opt} value={opt}>{platformLabel(opt)}</option>)}
                      </select>
                      <input
                        value={p.handle}
                        onChange={e => updatePlatform(i, { handle: e.target.value })}
                        placeholder="@handle"
                        className="flex-1 min-w-0 text-xs border border-gray-200 rounded-lg px-2 py-1.5"
                      />
                      <input
                        type="number"
                        value={p.followers}
                        onChange={e => updatePlatform(i, { followers: Number(e.target.value) || 0 })}
                        placeholder="Followers"
                        className="w-24 text-xs border border-gray-200 rounded-lg px-2 py-1.5 tabular-nums"
                      />
                      <button onClick={() => removePlatform(i)} className="p-1.5 text-gray-400 hover:text-red-600 shrink-0">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <p className="flex items-start gap-2 text-xs text-gray-400 px-1">
          <Info size={13} className="shrink-0 mt-0.5" />
          Changes save to your profile only — nothing publishes without moderation for content itself.
        </p>

        <div className="flex justify-end">
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700 disabled:opacity-50"
          >
            <Save size={15} /> {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </PortalShell>
  );
}
