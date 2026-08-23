import type { Campaign, Content, PaginatedResponse, RewardConfig } from '../models';
import { MOCK_CAMPAIGNS, MOCK_CONTENT } from '../mock/data';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
let campaigns = [...MOCK_CAMPAIGNS];
let contents = [...MOCK_CONTENT];

export const campaignService = {
  async getCampaigns(page = 1, pageSize = 20, search?: string, status?: string): Promise<PaginatedResponse<Campaign>> {
    await delay(400);
    let result = [...campaigns];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(q) || c.referenceId.toLowerCase().includes(q));
    }
    if (status) result = result.filter(c => c.status === status);
    const total = result.length;
    const data = result.slice((page - 1) * pageSize, page * pageSize);
    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  },

  async getCampaign(referenceId: string): Promise<Campaign> {
    await delay(300);
    const c = campaigns.find(c => c.referenceId === referenceId);
    if (!c) throw { code: 404, message: 'Campaign not found' };
    return c;
  },

  async getActiveCampaigns(): Promise<Campaign[]> {
    await delay(200);
    return campaigns.filter(c => c.status === 'ACTIVE');
  },

  async getPartnerCampaigns(partnerId: string): Promise<Campaign[]> {
    await delay(300);
    return campaigns.filter(c => c.partnerId === partnerId);
  },

  async getInfluencerCampaigns(influencerId: string): Promise<Campaign[]> {
    await delay(300);
    return campaigns.filter(c => c.influencerIds.includes(influencerId));
  },

  /** Campaigns that recruit creators (publishing on ழ) rather than influencers. */
  async getCreatorCampaigns(creatorId: string): Promise<Campaign[]> {
    await delay(300);
    return campaigns.filter(c => (c.creatorIds ?? []).includes(creatorId));
  },

  /**
   * Campaigns a participant could still join: active, recruiting their
   * capability, and not one they are already on.
   */
  async getOpenCampaigns(participantId: string, capability: 'CREATOR' | 'INFLUENCER'): Promise<Campaign[]> {
    await delay(350);
    return campaigns.filter(c => {
      if (c.status !== 'ACTIVE') return false;
      const kind = c.campaignKind ?? 'INFLUENCER';
      if (kind !== 'BOTH' && kind !== capability) return false;
      const already = capability === 'CREATOR'
        ? (c.creatorIds ?? []).includes(participantId)
        : c.influencerIds.includes(participantId);
      return !already;
    });
  },

  /**
   * Partners create campaigns directly — no administrator has to author one.
   * `publish` decides whether it goes live immediately or stays a draft.
   */
  async createCampaign(data: Partial<Campaign> & { reward?: RewardConfig }, publish = false): Promise<Campaign> {
    await delay(700);
    const stamp = new Date().toISOString();
    const campaign: Campaign = {
      campaignKind: 'BOTH',
      createdByRole: 'PARTNER',
      productSampleProvided: true,
      ...data,
      referenceId: `CMP${Date.now()}`,
      status: publish ? 'ACTIVE' : 'DRAFT',
      productIds: data.productIds ?? [],
      influencerIds: data.influencerIds ?? [],
      creatorIds: data.creatorIds ?? [],
      trackingLinkIds: data.trackingLinkIds ?? [],
      deliverables: data.deliverables ?? [],
      totalContent: 0, approvedContent: 0, reach: 0, clicks: 0, orders: 0, revenue: 0,
      versionNo: 1, statusCode: publish ? 'ACTIVE' : 'DRAFT', activeCode: publish ? 'Y' : 'N', rowVersion: 1,
      createdOn: stamp, createdBy: data.partnerId ?? 'current_user',
      lastUpdatedOn: stamp, lastUpdatedBy: data.partnerId ?? 'current_user',
    } as Campaign;
    campaigns.unshift(campaign);
    return campaign;
  },

  async updateCampaign(referenceId: string, patch: Partial<Campaign>): Promise<Campaign> {
    await delay(500);
    const i = campaigns.findIndex(c => c.referenceId === referenceId);
    if (i < 0) throw { code: 404, message: 'Campaign not found' };
    campaigns[i] = { ...campaigns[i], ...patch, lastUpdatedOn: new Date().toISOString() };
    return campaigns[i];
  },

  async publishCampaign(referenceId: string): Promise<Campaign> {
    await delay(600);
    const c = campaigns.find(x => x.referenceId === referenceId);
    if (!c) throw { code: 404, message: 'Campaign not found' };
    c.status = 'ACTIVE';
    c.statusCode = 'ACTIVE';
    c.activeCode = 'Y';
    return c;
  },

  async getCampaignContent(campaignId: string): Promise<Content[]> {
    await delay(300);
    return contents.filter(c => c.campaignId === campaignId);
  },

  async getInfluencerContent(influencerId: string): Promise<Content[]> {
    await delay(300);
    return contents.filter(c => c.influencerId === influencerId);
  },

  async submitContent(data: Partial<Content>): Promise<Content> {
    await delay(800);
    const content: Content = {
      ...data,
      referenceId: `CNT${Date.now()}`,
      contentStatus: 'UPLOADED',
      views: 0, likes: 0, shares: 0,
      versionNo: 1, statusCode: 'PENDING', activeCode: 'N', rowVersion: 1,
      createdOn: new Date().toISOString(), createdBy: data.influencerId ?? 'user',
      lastUpdatedOn: new Date().toISOString(), lastUpdatedBy: data.influencerId ?? 'user',
    } as Content;
    contents.push(content);

    // Simulate processing
    setTimeout(() => { content.contentStatus = 'PROCESSING'; }, 2000);
    setTimeout(() => { content.contentStatus = 'SECURITY_SCAN'; }, 4000);
    setTimeout(() => { content.contentStatus = 'MODERATION'; }, 6000);
    setTimeout(() => { content.contentStatus = 'PENDING_REVIEW'; }, 8000);

    return content;
  },
};
