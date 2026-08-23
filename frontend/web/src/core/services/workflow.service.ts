import type { Workflow } from '../models';
import { MOCK_WORKFLOWS } from '../mock/data';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
let workflows = [...MOCK_WORKFLOWS];

export const workflowService = {
  async getWorkflows(): Promise<Workflow[]> {
    await delay(300);
    return [...workflows];
  },

  async getWorkflow(referenceId: string): Promise<Workflow> {
    await delay(200);
    const w = workflows.find(w => w.referenceId === referenceId);
    if (!w) throw { code: 404, message: 'Workflow not found' };
    return w;
  },

  async createWorkflow(data: Partial<Workflow>): Promise<Workflow> {
    await delay(700);
    const workflow: Workflow = {
      ...data,
      referenceId: `WF${Date.now()}`,
      workflowStatus: 'DRAFT',
      stages: data.stages ?? [],
      version: 1,
      versionNo: 1, statusCode: 'DRAFT', activeCode: 'N', rowVersion: 1,
      createdOn: new Date().toISOString(), createdBy: 'current_user',
      lastUpdatedOn: new Date().toISOString(), lastUpdatedBy: 'current_user',
    } as Workflow;
    workflows.push(workflow);
    return workflow;
  },

  async activateWorkflow(referenceId: string): Promise<Workflow> {
    await delay(500);
    const w = workflows.find(w => w.referenceId === referenceId);
    if (!w) throw { code: 404, message: 'Workflow not found' };
    w.workflowStatus = 'ACTIVE';
    w.statusCode = 'ACTIVE';
    w.activeCode = 'Y';
    return w;
  },
};
