import type { Media, PaginatedResponse } from '../models';
import { MOCK_MEDIA } from '../mock/data';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
let media = [...MOCK_MEDIA];

export const mediaService = {
  async getMedia(page = 1, pageSize = 20, status?: string): Promise<PaginatedResponse<Media>> {
    await delay(400);
    let result = status ? media.filter(m => m.mediaStatus === status) : [...media];
    const total = result.length;
    const data = result.slice((page - 1) * pageSize, page * pageSize);
    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  },

  async getEntityMedia(entityId: string): Promise<Media[]> {
    await delay(300);
    return media.filter(m => m.entityId === entityId);
  },

  async approveMedia(referenceId: string): Promise<Media> {
    await delay(500);
    const item = media.find(m => m.referenceId === referenceId);
    if (!item) throw { code: 404, message: 'Media not found' };
    item.mediaStatus = 'APPROVED';
    item.moderationResult = 'SAFE';
    return item;
  },

  async rejectMedia(referenceId: string, violations: string[]): Promise<Media> {
    await delay(500);
    const item = media.find(m => m.referenceId === referenceId);
    if (!item) throw { code: 404, message: 'Media not found' };
    item.mediaStatus = 'REJECTED';
    item.moderationResult = 'POLICY_VIOLATION';
    item.policyViolations = violations;
    return item;
  },

  getPendingCount(): number {
    return media.filter(m => ['UPLOADED', 'MODERATION', 'SECURITY_SCAN', 'PROCESSING'].includes(m.mediaStatus)).length;
  },
};
