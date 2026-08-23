import { useState, useEffect } from 'react';
import { FileText, Upload, CheckCircle, Clock } from 'lucide-react';
import PortalShell from '../../components/shared/PortalShell';
import PageHeader from '../../components/shared/PageHeader';
import StatusBadge from '../../components/shared/StatusBadge';
import { documentService } from '../../core/services/document.service';
import type { Document, DocumentPolicy } from '../../core/models';

export default function PartnerDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [policy, setPolicy] = useState<DocumentPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  const load = () => {
    documentService.getDocuments('PTN260822A01').then(setDocuments);
    documentService.getActivePolicy('PARTNER', 'KYC').then(p => { setPolicy(p); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async (docType: string) => {
    setUploading(docType);
    const fileName = `${docType.toLowerCase().replace(/ /g, '_')}_PTN260822A01.pdf`;
    const file = new File([new Blob()], fileName, { type: 'application/pdf' });
    await documentService.uploadDocument('PTN260822A01', 'PARTNER', 'Partner', docType, file);
    setUploading(null);
    load();
  };

  const REQUIRED_DOCS = ['GST Certificate', 'PAN Card', 'Bank Statement', 'Business Registration', 'FSSAI License'];

  return (
    <PortalShell type="partner">
      <PageHeader
        title="Documents & Compliance"
        subtitle="Upload and manage your business documents"
      />

      {policy && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex items-start gap-3">
          <FileText size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800">{policy.name}</p>
            <p className="text-xs text-amber-700 mt-0.5">Policy version {policy.version} — {policy.rules.length} document requirements</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {REQUIRED_DOCS.map(docType => {
          const uploaded = documents.find(d => d.documentType === docType);
          return (
            <div key={docType} className={`bg-white rounded-xl border p-5 ${uploaded ? 'border-green-200' : 'border-gray-100'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${uploaded ? 'bg-green-50' : 'bg-gray-50'}`}>
                  {uploaded ? <CheckCircle size={16} className="text-green-500" /> : <FileText size={16} className="text-gray-400" />}
                </div>
                {uploaded && <StatusBadge status={uploaded.documentStatus} size="sm" />}
              </div>
              <p className="text-sm font-bold text-gray-900 mb-1">{docType}</p>
              {uploaded ? (
                <div>
                  <p className="text-xs text-gray-500 font-mono">{uploaded.referenceId}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(uploaded.createdOn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {uploaded.documentStatus === 'PROCESSING' && (
                      <span className="ml-2 text-amber-600 flex items-center gap-1 inline-flex"><Clock size={10} /> Processing...</span>
                    )}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-gray-400 mb-3">Not uploaded</p>
                  <button
                    onClick={() => handleUpload(docType)}
                    disabled={uploading === docType}
                    className="w-full flex items-center justify-center gap-1.5 py-2 bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-100 disabled:opacity-50"
                  >
                    {uploading === docType ? <div className="w-3.5 h-3.5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" /> : <Upload size={13} />}
                    Upload
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {documents.length > 0 && (
        <div className="mt-6 bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50">
            <h2 className="text-sm font-bold text-gray-800">All Uploaded Documents</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500">Document</th>
                <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500">Ref ID</th>
                <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500">Uploaded</th>
                <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {documents.map(d => (
                <tr key={d.referenceId} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3">
                    <p className="font-semibold text-gray-800">{d.documentType}</p>
                    <p className="text-xs text-gray-400">{d.fileName}</p>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-gray-500">{d.referenceId}</td>
                  <td className="px-5 py-3 text-xs text-gray-500">{new Date(d.createdOn).toLocaleDateString('en-IN')}</td>
                  <td className="px-5 py-3"><StatusBadge status={d.documentStatus} size="sm" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PortalShell>
  );
}
