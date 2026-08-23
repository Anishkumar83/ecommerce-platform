import type { Partner, PaginatedResponse } from '../models';
import { MOCK_PARTNERS } from '../mock/data';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
let partners = [...MOCK_PARTNERS];

export const partnerService = {
  async getPartners(page = 1, pageSize = 20, search?: string, status?: string): Promise<PaginatedResponse<Partner>> {
    await delay(400);
    let result = [...partners];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p => p.businessName.toLowerCase().includes(q) || p.referenceId.toLowerCase().includes(q) || p.email.toLowerCase().includes(q));
    }
    if (status) result = result.filter(p => p.partnerStatus === status);
    const total = result.length;
    const data = result.slice((page - 1) * pageSize, page * pageSize);
    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  },

  async getPartner(referenceId: string): Promise<Partner> {
    await delay(300);
    const p = partners.find(p => p.referenceId === referenceId);
    if (!p) throw { code: 404, message: 'Partner not found' };
    return p;
  },

  async createPartner(data: Partial<Partner>): Promise<Partner> {
    await delay(700);
    const partner: Partner = {
      ...data,
      referenceId: `PTN${Date.now()}`,
      partnerStatus: 'DRAFT',
      kycStatus: 'NOT_STARTED',
      totalProducts: 0, activeProducts: 0, activeCampaigns: 0,
      totalRevenue: 0, totalOrders: 0, rating: 0,
      versionNo: 1, statusCode: 'DRAFT', activeCode: 'N', rowVersion: 1,
      createdOn: new Date().toISOString(), createdBy: 'system',
      lastUpdatedOn: new Date().toISOString(), lastUpdatedBy: 'system',
    } as Partner;
    partners.push(partner);
    return partner;
  },

  async updatePartner(referenceId: string, data: Partial<Partner>): Promise<Partner> {
    await delay(500);
    const idx = partners.findIndex(p => p.referenceId === referenceId);
    if (idx === -1) throw { code: 404, message: 'Partner not found' };
    partners[idx] = { ...partners[idx], ...data, lastUpdatedOn: new Date().toISOString(), rowVersion: partners[idx].rowVersion + 1 };
    return partners[idx];
  },

  async suspendPartner(referenceId: string): Promise<Partner> {
    return partnerService.updatePartner(referenceId, { partnerStatus: 'SUSPENDED', statusCode: 'SUSPENDED', activeCode: 'N' });
  },

  async activatePartner(referenceId: string): Promise<Partner> {
    return partnerService.updatePartner(referenceId, { partnerStatus: 'ACTIVE', statusCode: 'ACTIVE', activeCode: 'Y' });
  },

  async getCurrentPartner(userId: string): Promise<Partner | null> {
    await delay(200);
    return partners.find(p => p.email === 'partner@example.com') ?? null;
  },
};
