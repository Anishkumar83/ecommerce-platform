import { useState, useEffect } from 'react';
import { FileText, Plus, CheckCircle } from 'lucide-react';
import AdminShell from '../../components/shared/AdminShell';
import PageHeader from '../../components/shared/PageHeader';
import StatusBadge from '../../components/shared/StatusBadge';
import { documentService } from '../../core/services/document.service';
import type { DocumentPolicy } from '../../core/models';

export default function AdminPolicies() {
  const [policies, setPolicies] = useState<DocumentPolicy[]>([]);
  const [selected, setSelected] = useState<DocumentPolicy | null>(null);
  const [activating, setActivating] = useState<string | null>(null);

  const load = () => {
    documentService.getPolicies().then(p => { setPolicies(p); if (p.length && !selected) setSelected(p[0]); });
  };
  useEffect(() => { load(); }, []);

  const handleActivate = async (id: string) => {
    setActivating(id);
    await documentService.activatePolicy(id);
    setActivating(null);
    load();
  };

  return (
    <AdminShell>
      <PageHeader
        title="Document Policies"
        subtitle="Configure required documents per entity type"
        actions={
          <button className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700">
            <Plus size={15} /> New Policy
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h2 className="text-xs font-bold text-gray-500 uppercase mb-3">Policies</h2>
          <div className="space-y-2">
            {policies.map(p => (
              <button
                key={p.referenceId}
                onClick={() => setSelected(p)}
                className={`w-full text-left p-3 rounded-xl ${selected?.referenceId === p.referenceId ? 'bg-brand-50 border border-brand-200' : 'hover:bg-gray-50 border border-transparent'}`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-sm font-bold text-gray-900">{p.name}</p>
                  <StatusBadge status={p.policyStatus} size="sm" />
                </div>
                <p className="text-xs text-gray-500">v{p.version} · {p.entityType} · {p.rules.length} rules</p>
              </button>
            ))}
          </div>
        </div>

        {selected && (
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-gray-900">{selected.name}</h2>
                <p className="text-xs text-gray-500">Version {selected.version} · {selected.entityType}</p>
                <p className="font-mono text-xs text-gray-400 mt-0.5">{selected.referenceId}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={selected.policyStatus} />
                {selected.policyStatus !== 'ACTIVE' && (
                  <button onClick={() => handleActivate(selected.referenceId)} disabled={activating === selected.referenceId}
                    className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-xl hover:bg-green-700 disabled:opacity-50">
                    Activate
                  </button>
                )}
              </div>
            </div>

            <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Document Rules</h3>
            <div className="space-y-2">
              {selected.rules.map((rule, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <FileText size={15} className="text-gray-400 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">{rule.documentType}</p>
                    <p className="text-xs text-gray-500">{rule.allowedFormats.join(', ')} · max {rule.maxSizeMb}MB</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {rule.required && <span className="text-xs bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">Required</span>}
                    {rule.expiryValidation && <span className="text-xs text-gray-400">Expiry validated</span>}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
              <strong>Note:</strong> Activating this policy will immediately apply its document requirements to all new {selected.entityType.toLowerCase()} onboarding.
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
