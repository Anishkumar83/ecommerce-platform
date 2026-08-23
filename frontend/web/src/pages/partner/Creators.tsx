import { useState, useEffect, useCallback } from 'react';
import { Search, Users, BadgeCheck } from 'lucide-react';
import PortalShell from '../../components/shared/PortalShell';
import PageHeader from '../../components/shared/PageHeader';
import EmptyState from '../../components/shared/EmptyState';
import ErrorState from '../../components/shared/ErrorState';
import Modal from '../../components/shared/Modal';
import { useToast } from '../../components/shared/Toast';
import { compact } from '../../components/shared/StatTile';
import { useAuth } from '../../core/auth/AuthContext';
import { creatorService } from '../../core/services/creator.service';
import { campaignService } from '../../core/services/campaign.service';
import { productService } from '../../core/services/product.service';
import type { Creator, Campaign, Product, ParticipantCapability } from '../../core/models';

/**
 * The partner behind the demo login. A real deployment reads this from the
 * session; `currentUser.partnerId` is set for the seeded partner account.
 */
const FALLBACK_PARTNER_ID = 'PTN260822A01';
const FALLBACK_PARTNER_NAME = 'Urban Lifestyle Pvt Ltd';

type CapabilityFilter = 'ALL' | 'CREATOR' | 'INFLUENCER' | 'BOTH';

export default function PartnerCreators() {
  const { currentUser } = useAuth();
  const partnerId = currentUser?.partnerId ?? FALLBACK_PARTNER_ID;
  const partnerName = currentUser?.partnerId ? currentUser.name : FALLBACK_PARTNER_NAME;
  const [creators, setCreators] = useState<Creator[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [search, setSearch] = useState('');
  const [capabilityFilter, setCapabilityFilter] = useState<CapabilityFilter>('ALL');
  const [category, setCategory] = useState('');

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [inviteTarget, setInviteTarget] = useState<Creator | null>(null);

  useEffect(() => {
    campaignService.getPartnerCampaigns(partnerId).then(setCampaigns);
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    creatorService.getCreators(1, 50, { search: search.trim() || undefined, category: category || undefined, status: 'ACTIVE' })
      .then(r => {
        setCreators(r.data);
        setCategoryOptions(prev => prev.length > 0 ? prev : Array.from(new Set(r.data.flatMap(c => c.categories))).sort());
        setLoading(false);
      })
      .catch(() => { setError(true); setLoading(false); });
  }, [search, category]);

  useEffect(() => { load(); }, [load]);

  const filtered = creators.filter(c => {
    if (capabilityFilter === 'ALL') return true;
    if (capabilityFilter === 'BOTH') return c.capabilities.includes('CREATOR') && c.capabilities.includes('INFLUENCER');
    return c.capabilities.includes(capabilityFilter);
  });

  return (
    <PortalShell type="partner">
      <PageHeader title="Creators" subtitle="Browse and invite creators and influencers to your campaigns" />

      <div className="bg-white border border-gray-100 rounded-xl p-4 mb-5 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or handle..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <select
          value={capabilityFilter}
          onChange={e => setCapabilityFilter(e.target.value as CapabilityFilter)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none"
        >
          <option value="ALL">All capabilities</option>
          <option value="CREATOR">Creator</option>
          <option value="INFLUENCER">Influencer</option>
          <option value="BOTH">Both</option>
        </select>
        <select value={category} onChange={e => setCategory(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none">
          <option value="">All categories</option>
          {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : error ? (
        <ErrorState onRetry={load} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No creators found" message="Try a different search or filter." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <CreatorCardTile key={c.referenceId} creator={c} onInvite={() => setInviteTarget(c)} />
          ))}
        </div>
      )}

      <InviteModal creator={inviteTarget} campaigns={campaigns} onClose={() => setInviteTarget(null)} />
    </PortalShell>
  );
}

function CreatorCardTile({ creator, onInvite }: { creator: Creator; onInvite: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <img src={creator.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover shrink-0" />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-bold text-gray-900 truncate">{creator.name}</p>
            {creator.isVerified && <BadgeCheck size={13} className="text-brand-500 shrink-0" />}
          </div>
          <p className="text-xs text-gray-500 truncate">@{creator.handle}</p>
        </div>
      </div>

      <p className="text-xs text-gray-500 line-clamp-2 mb-3">{creator.bio}</p>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {creator.categories.map(cat => (
          <span key={cat} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{cat}</span>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 text-center mb-4">
        <div className="p-2 bg-gray-50 rounded-xl">
          <p className="text-xs font-bold text-gray-900 tabular-nums">{compact(creator.zhaFollowers)}</p>
          <p className="text-[10px] text-gray-400"><span className="font-tamil">ழ</span> reach</p>
        </div>
        <div className="p-2 bg-gray-50 rounded-xl">
          <p className="text-xs font-bold text-gray-900 tabular-nums">{compact(creator.followerCount)}</p>
          <p className="text-[10px] text-gray-400">Social reach</p>
        </div>
        <div className="p-2 bg-gray-50 rounded-xl">
          <p className="text-xs font-bold text-gray-900 tabular-nums">{creator.contentPublished}</p>
          <p className="text-[10px] text-gray-400">Published</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 mb-4">
        {creator.capabilities.map(cap => (
          <span key={cap} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cap === 'CREATOR' ? 'bg-brand-50 text-brand-700' : 'bg-purple-50 text-purple-700'}`}>
            {cap === 'CREATOR' ? 'Creator' : 'Influencer'}
          </span>
        ))}
      </div>

      <button onClick={onInvite} className="mt-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700">
        Invite to campaign
      </button>
    </div>
  );
}

function InviteModal({ creator, campaigns, onClose }: { creator: Creator | null; campaigns: Campaign[]; onClose: () => void }) {
  const { toast } = useToast();
  const [campaignId, setCampaignId] = useState('');
  const [role, setRole] = useState<ParticipantCapability>('CREATOR');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (creator) {
      setCampaignId(campaigns[0]?.referenceId ?? '');
      setRole(creator.capabilities[0]);
    }
  }, [creator, campaigns]);

  if (!creator) return null;

  const campaign = campaigns.find(c => c.referenceId === campaignId);

  const invite = async () => {
    if (!campaign) return;
    setInviting(true);
    try {
      const productList = await Promise.all(campaign.productIds.map(id => productService.getProduct(id).catch(() => null)));
      const productNames = productList.filter((p): p is Product => !!p).map(p => p.name);
      await creatorService.invite({
        campaignId: campaign.referenceId,
        campaignName: campaign.name,
        partnerId: campaign.partnerId,
        partnerName: campaign.partnerName,
        participantId: creator.referenceId,
        participantName: creator.name,
        participantHandle: creator.handle,
        participantAvatarUrl: creator.avatarUrl,
        participantRole: role,
        dueDate: campaign.endDate,
        productIds: campaign.productIds,
        productNames,
        productSampleProvided: role === 'CREATOR' ? (campaign.productSampleProvided ?? false) : false,
        reward: campaign.reward ?? { contentFee: 0, model: 'PERCENTAGE', percentage: 0, cookieWindowDays: 30 },
      });
      toast(`${creator.name} invited to ${campaign.name}`);
      onClose();
    } catch {
      toast('Could not send the invitation — try again', 'error');
    } finally {
      setInviting(false);
    }
  };

  return (
    <Modal
      open={!!creator}
      onClose={onClose}
      title="Invite to campaign"
      subtitle={creator.name}
      size="sm"
      footer={
        campaigns.length === 0 ? undefined : (
          <>
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900">Cancel</button>
            <button onClick={invite} disabled={!campaign || inviting} className="px-4 py-2 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700 disabled:opacity-50">
              {inviting ? 'Sending…' : 'Send invitation'}
            </button>
          </>
        )
      }
    >
      {campaigns.length === 0 ? (
        <p className="text-sm text-gray-500">You have no campaigns yet. Create one first.</p>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Campaign *</label>
            <select
              value={campaignId}
              onChange={e => setCampaignId(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              {campaigns.map(c => <option key={c.referenceId} value={c.referenceId}>{c.name}</option>)}
            </select>
          </div>
          {creator.capabilities.length > 1 ? (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Invite as *</label>
              <div className="flex gap-2">
                {creator.capabilities.map(cap => (
                  <button
                    key={cap}
                    type="button"
                    onClick={() => setRole(cap)}
                    className={`flex-1 px-3 py-2 rounded-xl border-2 text-xs font-bold ${role === cap ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600'}`}
                  >
                    {cap === 'CREATOR' ? 'Creator' : 'Influencer'}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-500">
              Inviting as {role === 'CREATOR' ? 'Creator' : 'Influencer'} — the only capability {creator.name} holds.
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
