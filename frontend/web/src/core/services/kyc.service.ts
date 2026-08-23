import type { KycRecord } from '../models';
import { MOCK_KYC_RECORDS } from '../mock/data';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
let kycRecords = [...MOCK_KYC_RECORDS];

export const kycService = {
  async getKycRecord(entityId: string): Promise<KycRecord | null> {
    await delay(300);
    return kycRecords.find(r => r.entityId === entityId) ?? null;
  },

  async getAllKycRecords(page = 1, pageSize = 20): Promise<{ data: KycRecord[]; total: number }> {
    await delay(400);
    const total = kycRecords.length;
    const data = kycRecords.slice((page - 1) * pageSize, page * pageSize);
    return { data, total };
  },

  async initiateKyc(entityId: string, entityType: 'PARTNER' | 'INFLUENCER', entityName: string): Promise<KycRecord> {
    await delay(800);
    const existing = kycRecords.find(r => r.entityId === entityId);
    if (existing) return existing;

    const record: KycRecord = {
      referenceId: `KYC${Date.now()}`,
      entityType,
      entityId,
      entityName,
      kycStatus: 'IN_PROGRESS',
      providerReferenceId: `KYC-EXT-${Math.floor(Math.random() * 9000 + 1000)}`,
      submittedOn: new Date().toISOString(),
      timeline: [
        { status: 'NOT_STARTED', timestamp: new Date(Date.now() - 1000).toISOString(), description: 'KYC process initiated' },
        { status: 'IN_PROGRESS', timestamp: new Date().toISOString(), description: 'Documents submitted for verification' },
      ],
      versionNo: 1, statusCode: 'IN_PROGRESS', activeCode: 'N', rowVersion: 1,
      createdOn: new Date().toISOString(), createdBy: entityId,
      lastUpdatedOn: new Date().toISOString(), lastUpdatedBy: entityId,
    };
    kycRecords.push(record);

    // Simulate async KYC completion
    setTimeout(() => {
      record.kycStatus = 'PENDING';
      record.timeline.push({ status: 'PENDING', timestamp: new Date().toISOString(), description: 'Under review by KYC provider' });
    }, 3000);
    setTimeout(() => {
      record.kycStatus = 'VERIFIED';
      record.verifiedOn = new Date().toISOString();
      record.timeline.push({ status: 'VERIFIED', timestamp: new Date().toISOString(), description: 'Identity verified successfully' });
    }, 8000);

    return record;
  },
};
