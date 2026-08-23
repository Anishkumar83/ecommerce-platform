import type {
  Creator, CreatorContent, CreatorContentState, CampaignParticipation,
  ParticipationState, ParticipantCapability, PaginatedResponse, OnboardingApplication,
  ApplicationKind, SocialPlatform,
} from '../models';
import {
  MOCK_CREATORS, MOCK_CREATOR_CONTENT, MOCK_PARTICIPATIONS,
} from '../mock/creator-data';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

let creators = [...MOCK_CREATORS];
let content = [...MOCK_CREATOR_CONTENT];
let participations = [...MOCK_PARTICIPATIONS];

/** Only PUBLISHED content is ever shown to shoppers. */
const isLive = (c: CreatorContent) => c.state === 'PUBLISHED';

export const creatorService = {
  // ── Profiles ───────────────────────────────────────────────────────────────

  async getCreators(page = 1, pageSize = 20, opts?: { search?: string; category?: string; capability?: ParticipantCapability; status?: string }): Promise<PaginatedResponse<Creator>> {
    await delay(350);
    let result = [...creators];
    if (opts?.search) {
      const q = opts.search.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.handle.toLowerCase().includes(q) ||
        c.categories.some(cat => cat.toLowerCase().includes(q)));
    }
    if (opts?.category) result = result.filter(c => c.categories.includes(opts.category!));
    if (opts?.capability) result = result.filter(c => c.capabilities.includes(opts.capability!));
    if (opts?.status) result = result.filter(c => c.creatorStatus === opts.status);
    const total = result.length;
    return {
      data: result.slice((page - 1) * pageSize, page * pageSize),
      total, page, pageSize, totalPages: Math.ceil(total / pageSize),
    };
  },

  async getCreator(referenceId: string): Promise<Creator> {
    await delay(250);
    const c = creators.find(x => x.referenceId === referenceId || x.handle === referenceId);
    if (!c) throw { code: 404, message: 'Creator not found' };
    return c;
  },

  /** Creators available to invite: active, and holding the capability the campaign needs. */
  async getInvitableCreators(capability: ParticipantCapability): Promise<Creator[]> {
    await delay(300);
    return creators.filter(c => c.creatorStatus === 'ACTIVE' && c.capabilities.includes(capability));
  },

  async updateCreator(referenceId: string, patch: Partial<Creator>): Promise<Creator> {
    await delay(500);
    const i = creators.findIndex(c => c.referenceId === referenceId);
    if (i < 0) throw { code: 404, message: 'Creator not found' };
    creators[i] = { ...creators[i], ...patch, lastUpdatedOn: new Date().toISOString() };
    return creators[i];
  },

  /** Adds a capability to an existing profile rather than creating a second account. */
  async addCapability(referenceId: string, capability: ParticipantCapability): Promise<Creator> {
    await delay(400);
    const c = creators.find(x => x.referenceId === referenceId);
    if (!c) throw { code: 404, message: 'Creator not found' };
    if (!c.capabilities.includes(capability)) c.capabilities = [...c.capabilities, capability];
    return c;
  },

  // ── Content ────────────────────────────────────────────────────────────────

  async getCreatorContent(creatorId: string, state?: CreatorContentState): Promise<CreatorContent[]> {
    await delay(300);
    let r = content.filter(c => c.creatorId === creatorId);
    if (state) r = r.filter(c => c.state === state);
    return r.sort((a, b) => b.createdOn.localeCompare(a.createdOn));
  },

  /** Published creator content for one product — the Creator Reviews block. */
  async getProductCreatorContent(productId: string): Promise<CreatorContent[]> {
    await delay(300);
    return content
      .filter(c => c.productId === productId && isLive(c))
      .sort((a, b) => b.views - a.views);
  },

  /** The homepage rail. Ranked by engagement, capped so the rail stays scannable. */
  async getTopPicks(limit = 8): Promise<CreatorContent[]> {
    await delay(400);
    return content
      .filter(c => c.isTopPick && isLive(c))
      .sort((a, b) => (b.likes + b.saves) - (a.likes + a.saves))
      .slice(0, limit);
  },

  /** Everything a creator has live, for their public profile. */
  async getPublishedByCreator(creatorId: string): Promise<CreatorContent[]> {
    await delay(300);
    return content
      .filter(c => c.creatorId === creatorId && isLive(c))
      .sort((a, b) => (b.publishedOn ?? '').localeCompare(a.publishedOn ?? ''));
  },

  async getContent(referenceId: string): Promise<CreatorContent> {
    await delay(200);
    const c = content.find(x => x.referenceId === referenceId);
    if (!c) throw { code: 404, message: 'Content not found' };
    return c;
  },

  /**
   * Submits new content and walks it through the moderation pipeline.
   * No moderation service exists yet — the timers below stand in for one so the
   * UI can already render every state it will eventually receive.
   */
  async submitContent(data: Partial<CreatorContent>): Promise<CreatorContent> {
    await delay(700);
    const stamp = new Date().toISOString();
    const item: CreatorContent = {
      views: 0, likes: 0, saves: 0, shares: 0, clicks: 0, attributedOrders: 0,
      isTopPick: false, providedForReview: false, aspect: 'SQUARE',
      ...data,
      referenceId: `CRC${Date.now()}`,
      state: 'UPLOADING',
      moderationEvents: [{ state: 'UPLOADING', timestamp: stamp, description: 'Media uploaded by creator' }],
      versionNo: 1, statusCode: 'PENDING', activeCode: 'N', rowVersion: 1,
      createdOn: stamp, createdBy: data.creatorId ?? 'creator',
      lastUpdatedOn: stamp, lastUpdatedBy: data.creatorId ?? 'creator',
    } as CreatorContent;
    content.unshift(item);

    const advance = (state: CreatorContentState, description: string, ms: number) =>
      setTimeout(() => {
        item.state = state;
        item.moderationEvents = [...item.moderationEvents, { state, timestamp: new Date().toISOString(), description }];
      }, ms);

    advance('SCANNING', 'Automated safety scan running', 2500);
    advance('UNDER_REVIEW', 'Queued for human review', 5500);

    return item;
  },

  /** Moderator action. Used by the admin media screen. */
  async moderateContent(referenceId: string, decision: 'APPROVED' | 'REJECTED', reason?: string): Promise<CreatorContent> {
    await delay(500);
    const item = content.find(c => c.referenceId === referenceId);
    if (!item) throw { code: 404, message: 'Content not found' };
    const stamp = new Date().toISOString();
    item.state = decision;
    item.rejectionReason = decision === 'REJECTED' ? reason : undefined;
    item.moderationEvents = [...item.moderationEvents, {
      state: decision, timestamp: stamp,
      description: decision === 'APPROVED' ? 'Approved by moderation' : `Rejected — ${reason ?? 'does not meet content guidelines'}`,
      actor: 'Moderation',
    }];
    if (decision === 'APPROVED') {
      setTimeout(() => {
        item.state = 'PUBLISHED';
        item.publishedOn = new Date().toISOString();
        item.moderationEvents = [...item.moderationEvents, { state: 'PUBLISHED', timestamp: new Date().toISOString(), description: 'Published on ழ' }];
      }, 1500);
    }
    return item;
  },

  async toggleTopPick(referenceId: string): Promise<CreatorContent> {
    await delay(250);
    const item = content.find(c => c.referenceId === referenceId);
    if (!item) throw { code: 404, message: 'Content not found' };
    item.isTopPick = !item.isTopPick;
    return item;
  },

  /** Optimistic like/save from the shopper surfaces. */
  async react(referenceId: string, kind: 'like' | 'save' | 'share'): Promise<CreatorContent> {
    await delay(150);
    const item = content.find(c => c.referenceId === referenceId);
    if (!item) throw { code: 404, message: 'Content not found' };
    if (kind === 'like') item.likes += 1;
    if (kind === 'save') item.saves += 1;
    if (kind === 'share') item.shares += 1;
    return item;
  },

  // ── Campaign participation ─────────────────────────────────────────────────

  async getParticipations(opts: { participantId?: string; campaignId?: string; partnerId?: string; role?: ParticipantCapability; state?: ParticipationState }): Promise<CampaignParticipation[]> {
    await delay(350);
    let r = [...participations];
    if (opts.participantId) r = r.filter(p => p.participantId === opts.participantId);
    if (opts.campaignId) r = r.filter(p => p.campaignId === opts.campaignId);
    if (opts.partnerId) r = r.filter(p => p.partnerId === opts.partnerId);
    if (opts.role) r = r.filter(p => p.participantRole === opts.role);
    if (opts.state) r = r.filter(p => p.state === opts.state);
    return r.sort((a, b) => b.invitedOn.localeCompare(a.invitedOn));
  },

  async getParticipation(referenceId: string): Promise<CampaignParticipation> {
    await delay(200);
    const p = participations.find(x => x.referenceId === referenceId);
    if (!p) throw { code: 404, message: 'Participation not found' };
    return p;
  },

  /** Moves a participation to the next state and appends to its timeline. */
  async advanceParticipation(referenceId: string, state: ParticipationState, description: string): Promise<CampaignParticipation> {
    await delay(450);
    const p = participations.find(x => x.referenceId === referenceId);
    if (!p) throw { code: 404, message: 'Participation not found' };
    p.state = state;
    p.timeline = [...p.timeline, { state, timestamp: new Date().toISOString(), description }];
    if (state === 'ACCEPTED' || state === 'DECLINED') p.respondedOn = new Date().toISOString();
    return p;
  },

  async invite(data: Omit<Partial<CampaignParticipation>, 'referenceId'>): Promise<CampaignParticipation> {
    await delay(500);
    const stamp = new Date().toISOString();
    const p: CampaignParticipation = {
      productIds: [], productNames: [], contentIds: [], productSampleProvided: false,
      ...data,
      referenceId: `CPT${Date.now()}${Math.floor(Math.random() * 100)}`,
      state: 'INVITED',
      invitedOn: stamp,
      contentFeeState: 'PENDING',
      timeline: [{ state: 'INVITED', timestamp: stamp, description: 'Invitation sent by the partner' }],
      versionNo: 1, statusCode: 'INVITED', activeCode: 'N', rowVersion: 1,
      createdOn: stamp, createdBy: data.partnerId ?? 'partner',
      lastUpdatedOn: stamp, lastUpdatedBy: data.partnerId ?? 'partner',
    } as CampaignParticipation;
    participations.unshift(p);
    return p;
  },

  // ── Onboarding ─────────────────────────────────────────────────────────────

  /**
   * Mock submission. A real flow would create a KYC record and an approval
   * request; here it just returns a reference the confirmation screen can show.
   */
  async submitApplication(kind: ApplicationKind, form: {
    name: string; email: string; mobile?: string;
    categories: string[]; socialPlatforms?: SocialPlatform[];
    contentPreferences?: string[]; audienceSize?: number;
  }): Promise<OnboardingApplication> {
    await delay(1100);
    const stamp = new Date().toISOString();
    return {
      referenceId: `APP${Date.now()}`,
      kind,
      applicantName: form.name,
      email: form.email,
      mobile: form.mobile,
      categories: form.categories,
      socialPlatforms: form.socialPlatforms,
      contentPreferences: form.contentPreferences,
      audienceSize: form.audienceSize,
      applicationState: 'SUBMITTED',
      submittedOn: stamp,
      versionNo: 1, statusCode: 'SUBMITTED', activeCode: 'N', rowVersion: 1,
      createdOn: stamp, createdBy: form.email,
      lastUpdatedOn: stamp, lastUpdatedBy: form.email,
    };
  },
};
