import { useState, useEffect } from 'react';
import { FileText, Upload, CheckCircle } from 'lucide-react';
import PortalShell from '../../components/shared/PortalShell';
import PageHeader from '../../components/shared/PageHeader';
import StatusBadge from '../../components/shared/StatusBadge';
import { documentService } from '../../core/services/document.service';
import type { Document } from '../../core/models';

const REQUIRED_DOCS = ['PAN Card', 'Aadhaar Card', 'Bank Passbook / Cheque', 'Social Profile Screenshot'];

export default function InfluencerDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);

  const load = () => { documentService.getDocuments('INF260822A01').then(setDocuments); };
  useEffect(() => { load(); }, []);

  const handleUpload = async (docType: string) => {
    setUploading(docType);
    const fileName = `${docType.toLowerCase().replace(/ /g, '_')}_INF260822A01.pdf`;
    const file = new File([new Blob()], fileName, { type: 'application/pdf' });
    await documentService.uploadDocument('INF260822A01', 'INFLUENCER', 'Influencer', docType, file);
    setUploading(null);
    load();
  };

  return (
    <PortalShell type="influencer">
      <PageHeader title="Documents" subtitle="Upload your identity and payout documents" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {REQUIRED_DOCS.map(docType => {
          const uploaded = documents.find(d => d.documentType === docType);
          return (
            <div key={docType} className={`bg-white rounded-xl border p-5 ${uploaded ? 'border-green-200' : 'border-gray-100'}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${uploaded ? 'bg-green-50' : 'bg-gray-50'}`}>
                  {uploaded ? <CheckCircle size={16} className="text-green-500" /> : <FileText size={16} className="text-gray-400" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{docType}</p>
                  {uploaded && <p className="text-xs font-mono text-gray-400">{uploaded.referenceId}</p>}
                </div>
                {uploaded && <StatusBadge status={uploaded.documentStatus} size="sm" />}
              </div>
              {!uploaded && (
                <button
                  onClick={() => handleUpload(docType)}
                  disabled={uploading === docType}
                  className="w-full flex items-center justify-center gap-1.5 py-2 bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-100 disabled:opacity-50"
                >
                  {uploading === docType ? <div className="w-3.5 h-3.5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" /> : <Upload size={13} />}
                  Upload
                </button>
              )}
            </div>
          );
        })}
      </div>
    </PortalShell>
  );
}
