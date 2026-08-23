import { useState, useEffect } from 'react';
import { GitBranch, Plus } from 'lucide-react';
import AdminShell from '../../components/shared/AdminShell';
import PageHeader from '../../components/shared/PageHeader';
import StatusBadge from '../../components/shared/StatusBadge';
import WorkflowTimeline from '../../components/shared/WorkflowTimeline';
import { workflowService } from '../../core/services/workflow.service';
import type { Workflow } from '../../core/models';

export default function AdminWorkflows() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selected, setSelected] = useState<Workflow | null>(null);

  useEffect(() => {
    workflowService.getWorkflows().then(w => { setWorkflows(w); if (w.length) setSelected(w[0]); });
  }, []);

  const handleActivate = async (id: string) => {
    await workflowService.activateWorkflow(id);
    workflowService.getWorkflows().then(setWorkflows);
  };

  return (
    <AdminShell>
      <PageHeader
        title="Workflow Builder"
        subtitle="Configure approval and publishing workflows"
        actions={
          <button className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700">
            <Plus size={15} /> New Workflow
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workflow List */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h2 className="text-xs font-bold text-gray-500 uppercase mb-3">Workflows</h2>
          <div className="space-y-2">
            {workflows.map(w => (
              <button
                key={w.referenceId}
                onClick={() => setSelected(w)}
                className={`w-full text-left p-3 rounded-xl ${selected?.referenceId === w.referenceId ? 'bg-brand-50 border border-brand-200' : 'hover:bg-gray-50 border border-transparent'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-bold text-gray-900">{w.name}</p>
                  <StatusBadge status={w.workflowStatus} size="sm" />
                </div>
                <p className="text-xs text-gray-500">{w.entityType} · {w.stages.length} stages</p>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Workflow Detail */}
        {selected && (
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-gray-900">{selected.name}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{selected.description}</p>
                <p className="font-mono text-xs text-gray-400 mt-1">{selected.referenceId}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={selected.workflowStatus} />
                {selected.workflowStatus !== 'ACTIVE' && (
                  <button onClick={() => handleActivate(selected.referenceId)}
                    className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-xl hover:bg-green-700">
                    Activate
                  </button>
                )}
              </div>
            </div>

            <WorkflowTimeline
              steps={selected.stages.map((stage, i) => ({
                label: stage.name,
                sublabel: `${stage.actorRole} · ${stage.slaDays}d SLA`,
                completed: false,
                current: i === 0,
              }))}
              orientation="vertical"
            />

            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="p-3 bg-gray-50 rounded-xl text-center">
                <p className="text-lg font-bold text-gray-900">{selected.stages.length}</p>
                <p className="text-xs text-gray-500">Stages</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl text-center">
                <p className="text-lg font-bold text-gray-900">{selected.stages.reduce((s, st) => s + st.slaDays, 0)}d</p>
                <p className="text-xs text-gray-500">Total SLA</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl text-center">
                <p className="text-lg font-bold text-gray-900">{selected.entityType}</p>
                <p className="text-xs text-gray-500">Entity</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
