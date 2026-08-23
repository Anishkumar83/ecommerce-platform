import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Check, ChevronRight, X, Plus, Package, Megaphone, BadgeCheck,
  Link2, Sparkles, AlertCircle, Loader2, ArrowRight, Rocket,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import PortalShell from '../../components/shared/PortalShell';
import PageHeader from '../../components/shared/PageHeader';
import WorkflowTimeline from '../../components/shared/WorkflowTimeline';
import RewardSummary from '../../components/shared/RewardSummary';
import TrackingLinkPanel from '../../components/shared/TrackingLinkPanel';
import EmptyState from '../../components/shared/EmptyState';
import { useToast } from '../../components/shared/Toast';
import { compact, inr } from '../../components/shared/StatTile';
import { productService } from '../../core/services/product.service';
import { useAuth } from '../../core/auth/AuthContext';
import { creatorService } from '../../core/services/creator.service';
import { trackingService } from '../../core/services/tracking.service';
import { campaignService } from '../../core/services/campaign.service';
import type {
  Product, Creator, Campaign, TrackingLink, RewardConfig, RewardModel, CommissionTier,
} from '../../core/models';

/**
 * The partner behind the demo login. A real deployment reads this from the
 * session; `currentUser.partnerId` is set for the seeded partner account.
 */
const FALLBACK_PARTNER_ID = 'PTN260822A01';
const FALLBACK_PARTNER_NAME = 'Urban Lifestyle Pvt Ltd';

const STEPS = ['Products', 'Details', 'Invite', 'Content & Rewards', 'Review & Publish'];

type CampaignKind = 'CREATOR' | 'INFLUENCER' | 'BOTH';

const DEFAULT_TIERS: CommissionTier[] = [
  { minSales: 0, maxSales: 50, percentage: 5 },
  { minSales: 51, maxSales: 100, percentage: 7 },
  { minSales: 101, maxSales: null, percentage: 10 },
];

const inputCls = "w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400";
const labelCls = "block text-xs font-semibold text-gray-600 mb-1.5";

export default function CampaignBuilder() {
  const { currentUser } = useAuth();
  const partnerId = currentUser?.partnerId ?? FALLBACK_PARTNER_ID;
  const partnerName = currentUser?.partnerId ? currentUser.name : FALLBACK_PARTNER_NAME;
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(0);

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [invitableCreators, setInvitableCreators] = useState<Creator[]>([]);
  const [invitableInfluencers, setInvitableInfluencers] = useState<Creator[]>([]);
  const [loadingInvitees, setLoadingInvitees] = useState(true);

  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [budget, setBudget] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [campaignKind, setCampaignKind] = useState<CampaignKind | ''>('');

  const [creatorIds, setCreatorIds] = useState<string[]>([]);
  const [influencerIds, setInfluencerIds] = useState<string[]>([]);

  const [deliverableDraft, setDeliverableDraft] = useState('');
  const [deliverables, setDeliverables] = useState<string[]>([]);
  const [productSampleProvided, setProductSampleProvided] = useState(true);
  const [contentFee, setContentFee] = useState('1500');
  const [model, setModel] = useState<RewardModel>('PERCENTAGE');
  const [percentage, setPercentage] = useState('8');
  const [fixedAmount, setFixedAmount] = useState('500');
  const [tiers, setTiers] = useState<CommissionTier[]>(DEFAULT_TIERS);
  const [cookieWindowDays, setCookieWindowDays] = useState('30');

  const [publishing, setPublishing] = useState<'draft' | 'publish' | null>(null);
  const [result, setResult] = useState<{ campaign: Campaign; links: TrackingLink[] } | null>(null);

  useEffect(() => {
    productService.getPartnerProducts(partnerId).then(p => { setProducts(p); setLoadingProducts(false); });
    Promise.all([
      creatorService.getInvitableCreators('CREATOR'),
      creatorService.getInvitableCreators('INFLUENCER'),
    ]).then(([c, i]) => { setInvitableCreators(c); setInvitableInfluencers(i); setLoadingInvitees(false); });
  }, []);

  const selectedProducts = useMemo(
    () => products.filter(p => selectedProductIds.includes(p.referenceId)),
    [products, selectedProductIds]
  );

  const toggleProduct = (id: string) => setSelectedProductIds(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);
  const toggleCreator = (id: string) => setCreatorIds(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);
  const toggleInfluencer = (id: string) => setInfluencerIds(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);

  const addDeliverable = () => {
    const v = deliverableDraft.trim();
    if (!v) return;
    setDeliverables(ds => [...ds, v]);
    setDeliverableDraft('');
  };
  const removeDeliverable = (i: number) => setDeliverables(ds => ds.filter((_, idx) => idx !== i));

  const updateTierMin = (i: number, value: number) => setTiers(ts => ts.map((t, idx) => idx === i ? { ...t, minSales: value } : t));
  const updateTierMax = (i: number, value: number | null) => setTiers(ts => ts.map((t, idx) => idx === i ? { ...t, maxSales: value } : t));
  const updateTierPct = (i: number, value: number) => setTiers(ts => ts.map((t, idx) => idx === i ? { ...t, percentage: value } : t));
  const addTier = () => setTiers(ts => [...ts, { minSales: 0, maxSales: null, percentage: 0 }]);
  const removeTier = (i: number) => setTiers(ts => ts.filter((_, idx) => idx !== i));

  const reward: RewardConfig = useMemo(() => ({
    contentFee: Number(contentFee) || 0,
    model,
    percentage: model === 'PERCENTAGE' ? (Number(percentage) || 0) : undefined,
    fixedAmount: model === 'FIXED' ? (Number(fixedAmount) || 0) : undefined,
    tiers: model === 'TIERED' ? tiers : undefined,
    cookieWindowDays: Number(cookieWindowDays) || 0,
  }), [contentFee, model, percentage, fixedAmount, tiers, cookieWindowDays]);

  const exampleSale = selectedProducts[0]?.price ?? 2999;

  function stepBlockedReason(): string | null {
    switch (step) {
      case 0:
        return selectedProductIds.length === 0 ? 'Select at least one product to continue.' : null;
      case 1:
        if (!name.trim()) return 'Give the campaign a name.';
        if (!description.trim()) return 'Add a short description.';
        if (!targetAudience.trim()) return 'Describe the target audience.';
        if (!budget || Number(budget) <= 0) return 'Enter a budget greater than zero.';
        if (!startDate || !endDate) return 'Set a start and end date.';
        if (new Date(endDate) <= new Date(startDate)) return 'End date must be after the start date.';
        if (!campaignKind) return 'Choose who this campaign recruits.';
        return null;
      case 2:
        if (campaignKind === 'CREATOR' && creatorIds.length === 0) return 'Invite at least one creator.';
        if (campaignKind === 'INFLUENCER' && influencerIds.length === 0) return 'Invite at least one influencer.';
        if (campaignKind === 'BOTH' && creatorIds.length === 0 && influencerIds.length === 0) return 'Invite at least one creator or influencer.';
        return null;
      case 3:
        if (deliverables.length === 0) return 'Add at least one deliverable.';
        if (!contentFee || Number(contentFee) < 0) return 'Enter a Content Fee.';
        if (model === 'PERCENTAGE' && (!percentage || Number(percentage) <= 0)) return 'Enter a commission percentage.';
        if (model === 'FIXED' && (!fixedAmount || Number(fixedAmount) <= 0)) return 'Enter a fixed commission amount.';
        if (model === 'TIERED' && tiers.some(t => !t.percentage || t.percentage <= 0)) return 'Every tier needs a commission percentage.';
        if (!cookieWindowDays || Number(cookieWindowDays) <= 0) return 'Enter an attribution window in days.';
        return null;
      default:
        return null;
    }
  }
  const blockedReason = stepBlockedReason();

  const timelineSteps = STEPS.map((label, i) => ({
    label,
    sublabel: i < step ? 'Complete' : i === step ? 'In progress' : 'Pending',
    completed: i < step,
    current: i === step,
  }));

  function buildCampaignData(): Partial<Campaign> {
    return {
      name: name.trim(),
      description: description.trim(),
      partnerId: partnerId,
      partnerName: partnerName,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      budget: Number(budget) || 0,
      targetAudience: targetAudience.trim(),
      productIds: selectedProductIds,
      influencerIds,
      creatorIds,
      bannerUrl: bannerUrl.trim() || undefined,
      campaignKind: campaignKind as CampaignKind,
      productSampleProvided,
      deliverables,
      reward,
    };
  }

  async function handleSaveDraft() {
    setPublishing('draft');
    try {
      const campaign = await campaignService.createCampaign(buildCampaignData(), false);
      toast('Campaign saved as a draft');
      navigate(`/partner/campaigns/${campaign.referenceId}`);
    } catch {
      toast('Could not save the campaign — try again', 'error');
    } finally {
      setPublishing(null);
    }
  }

  async function handlePublish() {
    setPublishing('publish');
    try {
      const campaign = await campaignService.createCampaign(buildCampaignData(), true);
      const singleProduct = selectedProducts.length === 1 ? selectedProducts[0] : undefined;

      const invitedCreatorObjs = invitableCreators.filter(c => creatorIds.includes(c.referenceId));
      const invitedInfluencerObjs = invitableInfluencers.filter(c => influencerIds.includes(c.referenceId));

      const links: TrackingLink[] = [];

      for (const c of invitedCreatorObjs) {
        await creatorService.invite({
          campaignId: campaign.referenceId,
          campaignName: campaign.name,
          partnerId: partnerId,
          partnerName: partnerName,
          participantId: c.referenceId,
          participantName: c.name,
          participantHandle: c.handle,
          participantAvatarUrl: c.avatarUrl,
          participantRole: 'CREATOR',
          dueDate: campaign.endDate,
          productIds: selectedProductIds,
          productNames: selectedProducts.map(p => p.name),
          productSampleProvided,
          reward,
        });
        const link = await trackingService.createLink({
          campaignId: campaign.referenceId,
          campaignName: campaign.name,
          productId: singleProduct?.referenceId,
          productName: singleProduct?.name,
          attributedToId: c.referenceId,
          attributedToName: c.name,
          attributedToRole: 'CREATOR',
          channel: 'ZHA_CONTENT',
          createdByName: partnerName,
          expiryDays: Number(cookieWindowDays) || undefined,
        });
        links.push(link);
      }

      for (const c of invitedInfluencerObjs) {
        await creatorService.invite({
          campaignId: campaign.referenceId,
          campaignName: campaign.name,
          partnerId: partnerId,
          partnerName: partnerName,
          participantId: c.referenceId,
          participantName: c.name,
          participantHandle: c.handle,
          participantAvatarUrl: c.avatarUrl,
          participantRole: 'INFLUENCER',
          dueDate: campaign.endDate,
          productIds: selectedProductIds,
          productNames: selectedProducts.map(p => p.name),
          productSampleProvided: false,
          reward,
        });
        const link = await trackingService.createLink({
          campaignId: campaign.referenceId,
          campaignName: campaign.name,
          productId: singleProduct?.referenceId,
          productName: singleProduct?.name,
          attributedToId: c.referenceId,
          attributedToName: c.name,
          attributedToRole: 'INFLUENCER',
          channel: 'SOCIAL',
          createdByName: partnerName,
          expiryDays: Number(cookieWindowDays) || undefined,
        });
        links.push(link);
      }

      setResult({ campaign, links });
      toast('Campaign published');
    } catch {
      toast('Could not publish the campaign — try again', 'error');
    } finally {
      setPublishing(null);
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (result) {
    return (
      <PortalShell type="partner">
        <PageHeader
          title="Campaign published"
          subtitle={result.campaign.name}
          breadcrumbs={[{ label: 'Campaigns', href: '/partner/campaigns' }, { label: 'New Campaign' }]}
        />
        <div className="max-w-2xl space-y-6">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
            <span className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <Check size={16} className="text-emerald-600" />
            </span>
            <div>
              <p className="text-sm font-semibold text-emerald-800">{result.campaign.name} is live</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                {result.links.length === 0
                  ? 'No participants were invited yet.'
                  : `${result.links.length} participant${result.links.length === 1 ? '' : 's'} invited. Each has their own tracking URL below.`}
              </p>
            </div>
          </div>

          {result.links.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-gray-800 mb-1">Tracking URLs</h2>
              <p className="text-xs text-gray-500 mb-3">
                One short, unique URL was generated per invited participant. Sharing theirs is how their clicks, orders and commission attribute back to them.
              </p>
              <div className="space-y-3">
                {result.links.map(link => (
                  <TrackingLinkPanel key={link.referenceId} link={link} showStats={false} />
                ))}
              </div>
            </div>
          )}

          <Link
            to={`/partner/campaigns/${result.campaign.referenceId}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700"
          >
            Go to campaign <ArrowRight size={14} />
          </Link>
        </div>
      </PortalShell>
    );
  }

  // ── Wizard ───────────────────────────────────────────────────────────────────
  return (
    <PortalShell type="partner">
      <PageHeader
        title="New Campaign"
        subtitle="Recruit creators and influencers to promote your products"
        breadcrumbs={[{ label: 'Campaigns', href: '/partner/campaigns' }, { label: 'New Campaign' }]}
      />

      <div className="mb-6 overflow-x-auto">
        <WorkflowTimeline steps={timelineSteps} orientation="horizontal" />
      </div>

      <div className="max-w-3xl">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">

          {step === 0 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">Select products</h2>
                <p className="text-xs text-gray-500 mt-0.5">Choose which of your products this campaign covers.</p>
              </div>

              {selectedProducts.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedProducts.map(p => (
                    <span key={p.referenceId} className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold">
                      {p.name}
                      <button type="button" onClick={() => toggleProduct(p.referenceId)} className="p-0.5 rounded-full hover:bg-brand-100">
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {loadingProducts ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
                </div>
              ) : products.length === 0 ? (
                <EmptyState icon={Package} title="No products yet" message="Add a product before creating a campaign." />
              ) : (
                <div className="grid sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
                  {products.map(p => {
                    const selected = selectedProductIds.includes(p.referenceId);
                    return (
                      <label
                        key={p.referenceId}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selected ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}
                      >
                        <input type="checkbox" checked={selected} onChange={() => toggleProduct(p.referenceId)} className="accent-brand-600 shrink-0" />
                        <div className="w-11 h-11 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                          <img src={p.media.find(m => m.isPrimary)?.url ?? p.media[0]?.url} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                          <p className="text-xs text-gray-500">{inr(p.price)} · {p.category}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-gray-900">Campaign details</h2>

              <div>
                <label className={labelCls}>Campaign Name *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Monsoon Travel Essentials" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Description *</label>
                <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="What is this campaign about?" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Target Audience *</label>
                <input value={targetAudience} onChange={e => setTargetAudience(e.target.value)} placeholder="e.g. Urban travelers, 22-40" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Budget (₹) *</label>
                  <input type="number" value={budget} onChange={e => setBudget(e.target.value)} placeholder="150000" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Banner URL</label>
                  <input value={bannerUrl} onChange={e => setBannerUrl(e.target.value)} placeholder="https://..." className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Start Date *</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>End Date *</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputCls} />
                </div>
              </div>
              {bannerUrl && (
                <div className="h-28 rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                  <img src={bannerUrl} alt="" className="w-full h-full object-cover" />
                </div>
              )}

              <div>
                <label className={labelCls}>Who does this campaign recruit? *</label>
                <div className="grid sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setCampaignKind('CREATOR')}
                    className={`text-left p-3.5 rounded-xl border-2 transition-colors ${campaignKind === 'CREATOR' ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <p className="text-sm font-bold text-gray-900 mb-1">Creators</p>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Creators publish reviews on <span className="font-tamil">ழ</span> itself, earning a Content Fee plus Sales Commission.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCampaignKind('INFLUENCER')}
                    className={`text-left p-3.5 rounded-xl border-2 transition-colors ${campaignKind === 'INFLUENCER' ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <p className="text-sm font-bold text-gray-900 mb-1">Influencers</p>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Influencers promote to their own audience off-platform via a tracked link, earning Sales Commission.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCampaignKind('BOTH')}
                    className={`text-left p-3.5 rounded-xl border-2 transition-colors ${campaignKind === 'BOTH' ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <p className="text-sm font-bold text-gray-900 mb-1">Both</p>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Recruit creators for on-platform reviews and influencers for off-platform reach in one campaign.
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-gray-900">Invite participants</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Someone holding both capabilities can be invited to either panel, or both.
                </p>
              </div>

              <div className={`grid gap-5 ${campaignKind === 'BOTH' ? 'md:grid-cols-2' : ''}`}>
                {(campaignKind === 'CREATOR' || campaignKind === 'BOTH') && (
                  <InvitePanel
                    title="Creators"
                    icon={Sparkles}
                    people={invitableCreators}
                    selectedIds={creatorIds}
                    otherSelectedIds={influencerIds}
                    otherRoleLabel="Influencer"
                    onToggle={toggleCreator}
                    loading={loadingInvitees}
                  />
                )}
                {(campaignKind === 'INFLUENCER' || campaignKind === 'BOTH') && (
                  <InvitePanel
                    title="Influencers"
                    icon={Megaphone}
                    people={invitableInfluencers}
                    selectedIds={influencerIds}
                    otherSelectedIds={creatorIds}
                    otherRoleLabel="Creator"
                    onToggle={toggleInfluencer}
                    loading={loadingInvitees}
                  />
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-gray-900">Content & rewards</h2>
                <p className="text-xs text-gray-500 mt-0.5">Set what participants deliver and how they are paid.</p>
              </div>

              <div>
                <label className={labelCls}>Deliverables *</label>
                <div className="flex gap-2 mb-2">
                  <input
                    value={deliverableDraft}
                    onChange={e => setDeliverableDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addDeliverable(); } }}
                    placeholder='e.g. "1 long-form review"'
                    className={inputCls}
                  />
                  <button type="button" onClick={addDeliverable} className="shrink-0 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-200">
                    <Plus size={15} />
                  </button>
                </div>
                {deliverables.length > 0 && (
                  <ul className="space-y-1.5">
                    {deliverables.map((item, i) => (
                      <li key={i} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700">
                        <span>{item}</span>
                        <button type="button" onClick={() => removeDeliverable(i)} className="text-gray-400 hover:text-red-600">
                          <X size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <label className="flex items-center gap-2.5 p-3 border border-gray-200 rounded-xl cursor-pointer">
                <input type="checkbox" checked={productSampleProvided} onChange={e => setProductSampleProvided(e.target.checked)} className="accent-brand-600" />
                <span className="text-sm font-semibold text-gray-700">A product sample is provided to participants</span>
              </label>

              <div className="border-t border-gray-100 pt-4 space-y-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Reward configuration</p>

                <div>
                  <label className={labelCls}>Content Fee (₹) *</label>
                  <input type="number" value={contentFee} onChange={e => setContentFee(e.target.value)} placeholder="1500" className={inputCls} />
                  <p className="text-[11px] text-gray-400 mt-1">Paid on approval, regardless of sales.</p>
                </div>

                <div>
                  <label className={labelCls}>Sales Commission model *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['PERCENTAGE', 'FIXED', 'TIERED'] as RewardModel[]).map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setModel(m)}
                        className={`px-3 py-2 rounded-xl border-2 text-xs font-bold transition-colors ${model === m ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                      >
                        {m === 'PERCENTAGE' ? 'Percentage' : m === 'FIXED' ? 'Fixed' : 'Tiered'}
                      </button>
                    ))}
                  </div>
                </div>

                {model === 'PERCENTAGE' && (
                  <div>
                    <label className={labelCls}>Commission (%)</label>
                    <input type="number" value={percentage} onChange={e => setPercentage(e.target.value)} placeholder="8" className={inputCls} />
                  </div>
                )}
                {model === 'FIXED' && (
                  <div>
                    <label className={labelCls}>Fixed Commission per order (₹)</label>
                    <input type="number" value={fixedAmount} onChange={e => setFixedAmount(e.target.value)} placeholder="500" className={inputCls} />
                  </div>
                )}
                {model === 'TIERED' && (
                  <div>
                    <label className={labelCls}>Commission tiers</label>
                    <div className="border border-gray-200 rounded-xl overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-gray-50 text-gray-500">
                            <th className="text-left px-3 py-2 font-semibold">Min sales</th>
                            <th className="text-left px-3 py-2 font-semibold">Max sales</th>
                            <th className="text-left px-3 py-2 font-semibold">%</th>
                            <th className="px-2 py-2" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {tiers.map((t, i) => (
                            <tr key={i}>
                              <td className="px-3 py-2">
                                <input type="number" value={t.minSales} onChange={e => updateTierMin(i, Number(e.target.value))} className="w-20 px-2 py-1 border border-gray-200 rounded-lg" />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  value={t.maxSales ?? ''}
                                  placeholder="∞"
                                  onChange={e => updateTierMax(i, e.target.value === '' ? null : Number(e.target.value))}
                                  className="w-20 px-2 py-1 border border-gray-200 rounded-lg"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input type="number" value={t.percentage} onChange={e => updateTierPct(i, Number(e.target.value))} className="w-16 px-2 py-1 border border-gray-200 rounded-lg" />
                              </td>
                              <td className="px-2 py-2 text-right">
                                {tiers.length > 1 && (
                                  <button type="button" onClick={() => removeTier(i)} className="text-gray-400 hover:text-red-600">
                                    <X size={13} />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <button type="button" onClick={addTier} className="mt-2 text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1">
                      <Plus size={12} /> Add tier
                    </button>
                  </div>
                )}

                <div>
                  <label className={labelCls}>Attribution window (days) *</label>
                  <input type="number" value={cookieWindowDays} onChange={e => setCookieWindowDays(e.target.value)} placeholder="30" className={inputCls} />
                  <p className="text-[11px] text-gray-400 mt-1">How long after a click an order still attributes to the participant.</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Live preview</p>
                <RewardSummary reward={reward} exampleSale={exampleSale} />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <h2 className="text-base font-bold text-gray-900">Review & publish</h2>

              <div className="space-y-1">
                {[
                  { label: 'Campaign Name', value: name || '—' },
                  { label: 'Recruits', value: campaignKind === 'CREATOR' ? 'Creators' : campaignKind === 'INFLUENCER' ? 'Influencers' : campaignKind === 'BOTH' ? 'Creators & Influencers' : '—' },
                  { label: 'Target Audience', value: targetAudience || '—' },
                  { label: 'Budget', value: budget ? inr(Number(budget)) : '—' },
                  { label: 'Duration', value: startDate && endDate ? `${new Date(startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} – ${new Date(endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : '—' },
                  { label: 'Products', value: `${selectedProducts.length} selected` },
                  { label: 'Creators invited', value: String(creatorIds.length) },
                  { label: 'Influencers invited', value: String(influencerIds.length) },
                  { label: 'Sample provided', value: productSampleProvided ? 'Yes' : 'No' },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between py-2 border-b border-gray-50">
                    <span className="text-xs text-gray-500">{row.label}</span>
                    <span className="text-sm font-semibold text-gray-800 text-right">{row.value}</span>
                  </div>
                ))}
              </div>

              {selectedProducts.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedProducts.map(p => (
                    <span key={p.referenceId} className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">{p.name}</span>
                  ))}
                </div>
              )}

              {deliverables.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Deliverables</p>
                  <ul className="list-disc pl-5 space-y-1">
                    {deliverables.map((item, i) => <li key={i} className="text-sm text-gray-700">{item}</li>)}
                  </ul>
                </div>
              )}

              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Reward</p>
                <RewardSummary reward={reward} exampleSale={exampleSale} />
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-start gap-2">
                <Link2 size={14} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-0.5">Tracking URLs</p>
                  <p>
                    When you publish, one short tracking URL is generated per invited participant — {creatorIds.length + influencerIds.length} in total.
                    Each participant&apos;s clicks, orders and commission attribute back through their own URL.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8">
            {blockedReason && step < STEPS.length - 1 && (
              <p className="text-xs text-amber-600 mb-2 flex items-center gap-1.5"><AlertCircle size={12} className="shrink-0" /> {blockedReason}</p>
            )}
            <div className="flex items-center justify-between">
              <button
                onClick={() => step > 0 && setStep(s => s - 1)}
                disabled={step === 0}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 disabled:opacity-30"
              >
                Back
              </button>
              {step < STEPS.length - 1 ? (
                <button
                  onClick={() => setStep(s => s + 1)}
                  disabled={!!blockedReason}
                  className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continue <ChevronRight size={14} />
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveDraft}
                    disabled={publishing !== null}
                    className="px-4 py-2.5 border border-gray-200 bg-white text-gray-700 text-sm font-bold rounded-xl hover:border-brand-300 hover:text-brand-700 disabled:opacity-50"
                  >
                    {publishing === 'draft' ? 'Saving…' : 'Save as draft'}
                  </button>
                  <button
                    onClick={handlePublish}
                    disabled={publishing !== null}
                    className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700 disabled:opacity-50"
                  >
                    {publishing === 'publish' ? <Loader2 size={14} className="animate-spin" /> : <Rocket size={14} />}
                    {publishing === 'publish' ? 'Publishing…' : 'Publish campaign'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}

// ─── Invite panel ─────────────────────────────────────────────────────────────

interface InvitePanelProps {
  title: string;
  icon: LucideIcon;
  people: Creator[];
  selectedIds: string[];
  otherSelectedIds: string[];
  otherRoleLabel: string;
  onToggle: (id: string) => void;
  loading: boolean;
}

function InvitePanel({ title, icon: Icon, people, selectedIds, otherSelectedIds, otherRoleLabel, onToggle, loading }: InvitePanelProps) {
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100 shrink-0">
        <span className="flex items-center gap-2 text-sm font-bold text-gray-800">
          <Icon size={15} className="text-brand-600" /> {title}
        </span>
        <span className="text-xs font-semibold text-gray-500">{selectedIds.length} selected</span>
      </div>
      <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-50">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : people.length === 0 ? (
          <div className="p-6 text-center text-xs text-gray-400">No eligible {title.toLowerCase()} right now.</div>
        ) : (
          people.map(c => {
            const selected = selectedIds.includes(c.referenceId);
            const alsoElsewhere = otherSelectedIds.includes(c.referenceId);
            return (
              <label
                key={c.referenceId}
                className={`flex items-start gap-3 p-3 cursor-pointer transition-colors ${selected ? 'bg-brand-50' : 'hover:bg-gray-50'}`}
              >
                <input type="checkbox" checked={selected} onChange={() => onToggle(c.referenceId)} className="accent-brand-600 mt-1 shrink-0" />
                <img src={c.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                    {c.isVerified && <BadgeCheck size={12} className="text-brand-500 shrink-0" />}
                  </div>
                  <p className="text-xs text-gray-500 truncate">@{c.handle} · {c.categories.join(', ')}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    <span className="font-tamil">ழ</span> {compact(c.zhaFollowers)} followers · {compact(c.followerCount)} social audience
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {c.capabilities.map(cap => (
                      <span key={cap} className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {cap === 'CREATOR' ? 'Creator' : 'Influencer'}
                      </span>
                    ))}
                    {alsoElsewhere && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700">
                        Also invited as {otherRoleLabel}
                      </span>
                    )}
                  </div>
                </div>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
