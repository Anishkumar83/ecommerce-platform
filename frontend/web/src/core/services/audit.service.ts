import type { AuditRecord } from '../models';
import { MOCK_AUDIT } from '../mock/data';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
let records = [...MOCK_AUDIT];

export const auditService = {
  async getAudit(page = 1, pageSize = 20, search?: string): Promise<{ data: AuditRecord[]; total: number; page: number; pageSize: number }> {
    await delay(400);
    let result = [...records];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(r =>
        r.entityReferenceId.toLowerCase().includes(q) ||
        r.actorName.toLowerCase().includes(q) ||
        r.action.toLowerCase().includes(q) ||
        r.correlationId.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const total = result.length;
    const data = result.slice((page - 1) * pageSize, page * pageSize);
    return { data, total, page, pageSize };
  },

  async log(record: Omit<AuditRecord, 'referenceId'>): Promise<void> {
    records.unshift({ ...record, referenceId: `AUD${Date.now()}` });
  },
};
