import type {
  TrackingLink, TrackingChannel, ParticipantCapability,
  AttributionRecord, EarningRecord, RewardConfig, PaginatedResponse,
} from '../models';
import { MOCK_TRACKING_LINKS, MOCK_ATTRIBUTION, MOCK_EARNINGS } from '../mock/creator-data';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

let links = [...MOCK_TRACKING_LINKS];
let attribution = [...MOCK_ATTRIBUTION];
let earnings = [...MOCK_EARNINGS];

/**
 * Six characters of mixed-case alphanumerics, generated client-side for the
 * mock. Deliberately opaque: the code identifies the campaign, product and
 * attributed participant through a lookup, never by embedding their ids.
 */
const ALPHABET = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function makeCode(length = 6): string {
  let out = '';
  for (let i = 0; i < length; i++) out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return out;
}

export const trackingService = {
  async getLinks(opts?: { campaignId?: string; participantId?: string; channel?: TrackingChannel }): Promise<TrackingLink[]> {
    await delay(300);
    let r = [...links];
    if (opts?.campaignId) r = r.filter(l => l.campaignId === opts.campaignId);
    if (opts?.participantId) r = r.filter(l => l.attributedToId === opts.participantId);
    if (opts?.channel) r = r.filter(l => l.channel === opts.channel);
    return r.sort((a, b) => b.createdOn.localeCompare(a.createdOn));
  },

  async getLinksPaged(page = 1, pageSize = 20): Promise<PaginatedResponse<TrackingLink>> {
    await delay(300);
    const total = links.length;
    return {
      data: links.slice((page - 1) * pageSize, page * pageSize),
      total, page, pageSize, totalPages: Math.ceil(total / pageSize),
    };
  },

  async getLink(referenceId: string): Promise<TrackingLink> {
    await delay(200);
    const l = links.find(x => x.referenceId === referenceId);
    if (!l) throw { code: 404, message: 'Tracking link not found' };
    return l;
  },

  /** Resolve a short code the way the /c/:code route will. */
  async resolve(code: string): Promise<TrackingLink | null> {
    await delay(150);
    return links.find(l => l.shortCode === code) ?? null;
  },

  async createLink(input: {
    campaignId: string; campaignName: string;
    productId?: string; productName?: string;
    attributedToId: string; attributedToName: string; attributedToRole: ParticipantCapability;
    channel: TrackingChannel; createdByName: string; expiryDays?: number;
  }): Promise<TrackingLink> {
    await delay(600);
    const code = makeCode();
    const stamp = new Date().toISOString();
    const link: TrackingLink = {
      referenceId: `TRK${Date.now()}`,
      shortCode: code,
      shortUrl: `zha.example/c/${code}`,
      longUrl: input.productId
        ? `https://zha.example/products/${input.productId}?campaign=${input.campaignId}&ref=${code}`
        : `https://zha.example/campaigns/${input.campaignId}?ref=${code}`,
      campaignId: input.campaignId,
      campaignName: input.campaignName,
      productId: input.productId,
      productName: input.productName,
      attributedToId: input.attributedToId,
      attributedToName: input.attributedToName,
      attributedToRole: input.attributedToRole,
      channel: input.channel,
      linkStatus: 'ACTIVE',
      createdByName: input.createdByName,
      expiryDate: input.expiryDays ? new Date(Date.now() + input.expiryDays * 86400000).toISOString() : undefined,
      stats: { clicks: 0, uniqueVisitors: 0, productViews: 0, addToCart: 0, orders: 0, revenue: 0, conversionRate: 0, commission: 0 },
      versionNo: 1, statusCode: 'ACTIVE', activeCode: 'Y', rowVersion: 1,
      createdOn: stamp, createdBy: input.attributedToId,
      lastUpdatedOn: stamp, lastUpdatedBy: input.attributedToId,
    };
    links.unshift(link);
    return link;
  },

  async revokeLink(referenceId: string): Promise<TrackingLink> {
    await delay(350);
    const l = links.find(x => x.referenceId === referenceId);
    if (!l) throw { code: 404, message: 'Tracking link not found' };
    l.linkStatus = 'REVOKED';
    return l;
  },

  // ── Attribution ────────────────────────────────────────────────────────────

  async getAttribution(opts?: { campaignId?: string; participantId?: string; role?: ParticipantCapability }): Promise<AttributionRecord[]> {
    await delay(400);
    let r = [...attribution];
    if (opts?.campaignId) r = r.filter(a => a.campaignId === opts.campaignId);
    if (opts?.participantId) r = r.filter(a => a.participantId === opts.participantId);
    if (opts?.role) r = r.filter(a => a.participantRole === opts.role);
    return r.sort((a, b) => b.revenue - a.revenue);
  },

  // ── Earnings ───────────────────────────────────────────────────────────────

  async getEarnings(participantId: string): Promise<EarningRecord[]> {
    await delay(350);
    return earnings
      .filter(e => e.participantId === participantId)
      .sort((a, b) => b.earnedOn.localeCompare(a.earnedOn));
  },

  async getEarningsSummary(participantId: string): Promise<{ pending: number; approved: number; paid: number; lifetime: number }> {
    await delay(250);
    const mine = earnings.filter(e => e.participantId === participantId);
    const sum = (state: EarningRecord['state']) =>
      mine.filter(e => e.state === state).reduce((t, e) => t + e.amount, 0);
    const pending = sum('PENDING');
    const approved = sum('APPROVED');
    const paid = sum('PAID');
    return { pending, approved, paid, lifetime: pending + approved + paid };
  },
};

// ─── Reward maths ────────────────────────────────────────────────────────────
//
// Pure helpers, exported separately so the commission preview in the campaign
// builder and the earnings screens agree on the numbers.

/** The percentage that applies to a given order count under a reward config. */
export function rateForSales(reward: RewardConfig, salesCount: number): number {
  if (reward.model === 'PERCENTAGE') return reward.percentage ?? 0;
  if (reward.model === 'TIERED') {
    const tier = (reward.tiers ?? []).find(t =>
      salesCount >= t.minSales && (t.maxSales === null || salesCount <= t.maxSales));
    return tier?.percentage ?? 0;
  }
  return 0;
}

/** Commission on one eligible sale, given how many sales the participant has made. */
export function commissionFor(reward: RewardConfig, eligibleSale: number, salesCount = 0): number {
  if (reward.model === 'FIXED') return reward.fixedAmount ?? 0;
  return Math.round((eligibleSale * rateForSales(reward, salesCount)) / 100);
}

/** Human label for a reward config, e.g. "8% per sale" or "5–10% tiered". */
export function rewardLabel(reward: RewardConfig): string {
  if (reward.model === 'PERCENTAGE') return `${reward.percentage ?? 0}% per sale`;
  if (reward.model === 'FIXED') return `₹${(reward.fixedAmount ?? 0).toLocaleString('en-IN')} per order`;
  const tiers = reward.tiers ?? [];
  if (!tiers.length) return 'Tiered';
  const lo = Math.min(...tiers.map(t => t.percentage));
  const hi = Math.max(...tiers.map(t => t.percentage));
  return `${lo}–${hi}% tiered`;
}
