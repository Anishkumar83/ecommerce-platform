import type { ShortLink, PaginatedResponse } from '../models';
import { MOCK_SHORT_LINKS } from '../mock/data';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
let links = [...MOCK_SHORT_LINKS];

export const shortLinkService = {
  async getShortLinks(page = 1, pageSize = 20): Promise<PaginatedResponse<ShortLink>> {
    await delay(300);
    const total = links.length;
    const data = links.slice((page - 1) * pageSize, page * pageSize);
    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  },

  async createShortLink(type: ShortLink['destinationType'], reference: string, longUrl: string, createdBy: string, expiryDays?: number): Promise<ShortLink> {
    await delay(500);
    const code = Math.random().toString(36).slice(2, 7);
    const link: ShortLink = {
      referenceId: `SLK${Date.now()}`,
      shortCode: code,
      destinationType: type,
      destinationReference: reference,
      longUrl,
      shortUrl: `/${type === 'INVITATION' ? 'i' : 'c'}/${code}`,
      createdByName: createdBy,
      expiryDate: expiryDays ? new Date(Date.now() + expiryDays * 86400000).toISOString() : undefined,
      linkStatus: 'ACTIVE',
      clicks: 0,
      versionNo: 1, statusCode: 'ACTIVE', activeCode: 'Y', rowVersion: 1,
      createdOn: new Date().toISOString(), createdBy: createdBy,
      lastUpdatedOn: new Date().toISOString(), lastUpdatedBy: createdBy,
    };
    links.unshift(link);
    return link;
  },

  async resolve(code: string): Promise<ShortLink | null> {
    await delay(100);
    return links.find(l => l.shortCode === code) ?? null;
  },
};
