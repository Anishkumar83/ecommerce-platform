import type { Influencer, Invitation, PaginatedResponse } from '../models';
import { MOCK_INFLUENCERS, MOCK_INVITATIONS } from '../mock/data';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
let influencers = [...MOCK_INFLUENCERS];
let invitations = [...MOCK_INVITATIONS];

export const influencerService = {
  async getInfluencers(page = 1, pageSize = 20, search?: string, status?: string): Promise<PaginatedResponse<Influencer>> {
    await delay(400);
    let result = [...influencers];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(i => i.name.toLowerCase().includes(q) || i.referenceId.toLowerCase().includes(q));
    }
    if (status) result = result.filter(i => i.influencerStatus === status);
    const total = result.length;
    const data = result.slice((page - 1) * pageSize, page * pageSize);
    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  },

  async getInfluencer(referenceId: string): Promise<Influencer> {
    await delay(300);
    const i = influencers.find(i => i.referenceId === referenceId);
    if (!i) throw { code: 404, message: 'Influencer not found' };
    return i;
  },

  async getPartnerInfluencers(partnerId: string): Promise<Influencer[]> {
    await delay(300);
    const partnerInvitations = invitations.filter(inv => inv.partnerId === partnerId && inv.invitationStatus === 'ACCEPTED');
    const influencerIds = partnerInvitations.map(inv => inv.acceptedBy).filter(Boolean) as string[];
    return influencers.filter(inf => influencerIds.includes(inf.referenceId) || inf.campaignIds.length > 0).slice(0, 5);
  },

  async sendInvitation(params: { partnerId: string; partnerName: string; campaignId: string; campaignName: string; email: string; productCount: number }): Promise<Invitation> {
    await delay(700);
    const token = Math.random().toString(36).slice(2, 7).toUpperCase();
    const invitation: Invitation = {
      referenceId: `INV${Date.now()}`,
      token,
      partnerId: params.partnerId,
      partnerName: params.partnerName,
      campaignId: params.campaignId,
      campaignName: params.campaignName,
      influencerEmail: params.email,
      invitationStatus: 'SENT',
      shortUrl: `/i/${token}`,
      productCount: params.productCount,
      expiryDate: new Date(Date.now() + 30 * 86400000).toISOString(),
      versionNo: 1, statusCode: 'ACTIVE', activeCode: 'Y', rowVersion: 1,
      createdOn: new Date().toISOString(), createdBy: params.partnerId,
      lastUpdatedOn: new Date().toISOString(), lastUpdatedBy: params.partnerId,
    };
    invitations.push(invitation);
    return invitation;
  },

  async getInvitationByToken(token: string): Promise<Invitation> {
    await delay(400);
    const inv = invitations.find(i => i.token === token);
    if (!inv) throw { code: 404, message: 'Invitation not found or expired' };
    if (inv.invitationStatus === 'EXPIRED') throw { code: 410, message: 'This invitation has expired' };
    return inv;
  },

  async acceptInvitation(token: string): Promise<void> {
    await delay(600);
    const inv = invitations.find(i => i.token === token);
    if (inv) { inv.invitationStatus = 'ACCEPTED'; inv.acceptedBy = 'INF260822A01'; }
  },

  async getCurrentInfluencer(): Promise<Influencer | null> {
    await delay(200);
    return influencers.find(i => i.email === 'influencer@example.com') ?? null;
  },
};
