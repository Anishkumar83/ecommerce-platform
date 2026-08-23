import type { ApprovalRequest, PaginatedResponse } from '../models';
import { MOCK_APPROVALS } from '../mock/data';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
let approvals = [...MOCK_APPROVALS];

export const approvalService = {
  async getApprovals(page = 1, pageSize = 20, status?: string): Promise<PaginatedResponse<ApprovalRequest>> {
    await delay(400);
    let result = status ? approvals.filter(a => a.approvalStatus === status) : [...approvals];
    result.sort((a, b) => (b.isSlaBreached ? 1 : 0) - (a.isSlaBreached ? 1 : 0));
    const total = result.length;
    const data = result.slice((page - 1) * pageSize, page * pageSize);
    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  },

  async getApproval(referenceId: string): Promise<ApprovalRequest> {
    await delay(300);
    const a = approvals.find(a => a.referenceId === referenceId);
    if (!a) throw { code: 404, message: 'Approval not found' };
    return a;
  },

  async approve(referenceId: string, notes?: string): Promise<ApprovalRequest> {
    await delay(600);
    const approval = approvals.find(a => a.referenceId === referenceId);
    if (!approval) throw { code: 404, message: 'Approval not found' };
    approval.approvalStatus = 'APPROVED';
    approval.checkerNotes = notes;
    approval.approvedBy = 'Current Checker';
    approval.lastUpdatedOn = new Date().toISOString();
    return approval;
  },

  async reject(referenceId: string, notes: string): Promise<ApprovalRequest> {
    await delay(600);
    const approval = approvals.find(a => a.referenceId === referenceId);
    if (!approval) throw { code: 404, message: 'Approval not found' };
    approval.approvalStatus = 'REJECTED';
    approval.checkerNotes = notes;
    approval.lastUpdatedOn = new Date().toISOString();
    return approval;
  },

  async requestChanges(referenceId: string, notes: string): Promise<ApprovalRequest> {
    await delay(600);
    const approval = approvals.find(a => a.referenceId === referenceId);
    if (!approval) throw { code: 404, message: 'Approval not found' };
    approval.approvalStatus = 'REQUEST_CHANGES';
    approval.checkerNotes = notes;
    approval.lastUpdatedOn = new Date().toISOString();
    return approval;
  },

  getPendingCount(): number {
    return approvals.filter(a => a.approvalStatus === 'PENDING').length;
  },

  getSlaBreaches(): ApprovalRequest[] {
    return approvals.filter(a => a.isSlaBreached && a.approvalStatus === 'PENDING');
  },
};
