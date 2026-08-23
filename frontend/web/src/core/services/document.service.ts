import type { Document, DocumentPolicy } from '../models';
import { MOCK_DOCUMENTS, MOCK_DOCUMENT_POLICIES } from '../mock/data';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
let documents = [...MOCK_DOCUMENTS];
let policies = [...MOCK_DOCUMENT_POLICIES];

export const documentService = {
  async getDocuments(entityId: string): Promise<Document[]> {
    await delay(300);
    return documents.filter(d => d.entityId === entityId);
  },

  async getAllDocuments(page = 1, pageSize = 20): Promise<{ data: Document[]; total: number }> {
    await delay(400);
    const total = documents.length;
    const data = documents.slice((page - 1) * pageSize, page * pageSize);
    return { data, total };
  },

  async uploadDocument(entityId: string, entityType: Document['entityType'], entityName: string, documentType: string, file: File): Promise<Document> {
    await delay(1000);
    const doc: Document = {
      referenceId: `DOC${Date.now()}`,
      name: documentType.replace('_', ' '),
      documentType,
      entityType,
      entityId,
      entityName,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      documentStatus: 'UPLOADED',
      isPasswordProtected: false,
      uploadedBy: 'current_user',
      versionNo: 1, statusCode: 'ACTIVE', activeCode: 'Y', rowVersion: 1,
      createdOn: new Date().toISOString(), createdBy: 'current_user',
      lastUpdatedOn: new Date().toISOString(), lastUpdatedBy: 'current_user',
    };
    documents.push(doc);

    // Simulate processing
    setTimeout(() => { doc.documentStatus = 'PROCESSING'; }, 2000);
    setTimeout(() => { doc.documentStatus = 'VERIFIED'; }, 5000);

    return doc;
  },

  async getPolicies(): Promise<DocumentPolicy[]> {
    await delay(300);
    return policies;
  },

  async getActivePolicy(entityType: string, stage: string): Promise<DocumentPolicy | null> {
    await delay(200);
    return policies.find(p => p.entityType === entityType && p.stage === stage && p.policyStatus === 'ACTIVE') ?? null;
  },

  async createPolicy(data: Partial<DocumentPolicy>): Promise<DocumentPolicy> {
    await delay(700);
    const policy: DocumentPolicy = {
      ...data,
      referenceId: `DPL${Date.now()}`,
      policyStatus: 'DRAFT',
      rules: data.rules ?? [],
      versionNo: 1, statusCode: 'DRAFT', activeCode: 'N', rowVersion: 1,
      createdOn: new Date().toISOString(), createdBy: 'current_user',
      lastUpdatedOn: new Date().toISOString(), lastUpdatedBy: 'current_user',
    } as DocumentPolicy;
    policies.push(policy);
    return policy;
  },

  async activatePolicy(referenceId: string): Promise<DocumentPolicy> {
    await delay(500);
    const policy = policies.find(p => p.referenceId === referenceId);
    if (!policy) throw { code: 404, message: 'Policy not found' };
    policy.policyStatus = 'ACTIVE';
    policy.statusCode = 'ACTIVE';
    policy.activeCode = 'Y';
    return policy;
  },
};
