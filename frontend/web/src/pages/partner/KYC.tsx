import { useState, useEffect } from 'react';
import { ShieldCheck, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import PortalShell from '../../components/shared/PortalShell';
import PageHeader from '../../components/shared/PageHeader';
import WorkflowTimeline from '../../components/shared/WorkflowTimeline';
import { kycService } from '../../core/services/kyc.service';
import type { KycRecord } from '../../core/models';

export default function PartnerKYC() {
  const [kyc, setKyc] = useState<KycRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [initiating, setInitiating] = useState(false);

  const load = () => {
    kycService.getKycRecord('PTN260822A01').then(k => { setKyc(k); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const handleInitiate = async () => {
    setInitiating(true);
    const record = await kycService.initiateKyc('PTN260822A01', 'PARTNER', 'Urban Lifestyle Pvt Ltd');
    setKyc(record);
    setInitiating(false);
    // Poll for updates
    const interval = setInterval(() => {
      kycService.getKycRecord('PTN260822A01').then(k => {
        setKyc(k);
        if (k?.kycStatus === 'VERIFIED' || k?.kycStatus === 'REJECTED') clearInterval(interval);
      });
    }, 3000);
  };

  const kycStages = [
    { label: 'Document Upload', sublabel: 'ID proof & business docs', completed: !!kyc, current: !kyc },
    { label: 'Identity Verification', sublabel: 'Automated checks', completed: kyc?.kycStatus === 'VERIFIED' || kyc?.kycStatus === 'PENDING', current: kyc?.kycStatus === 'IN_PROGRESS' },
    { label: 'Manual Review', sublabel: 'Compliance team review', completed: kyc?.kycStatus === 'VERIFIED', current: kyc?.kycStatus === 'PENDING' },
    { label: 'Approved', sublabel: 'KYC complete', completed: kyc?.kycStatus === 'VERIFIED', current: false },
  ];

  const statusIcon = !kyc ? <AlertCircle className="text-gray-400" /> :
    kyc.kycStatus === 'VERIFIED' ? <CheckCircle className="text-green-500" /> :
    kyc.kycStatus === 'IN_PROGRESS' || kyc.kycStatus === 'PENDING' ? <Clock className="text-amber-500" /> :
    <AlertCircle className="text-red-500" />;

  return (
    <PortalShell type="partner">
      <PageHeader title="KYC Verification" subtitle="Complete identity and business verification" />

      <div className="max-w-2xl">
        {/* Status Card */}
        <div className={`bg-white rounded-2xl border p-6 mb-6 ${kyc?.kycStatus === 'VERIFIED' ? 'border-green-200' : kyc?.kycStatus === 'REJECTED' ? 'border-red-200' : 'border-gray-100'}`}>
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${kyc?.kycStatus === 'VERIFIED' ? 'bg-green-50' : 'bg-gray-50'}`}>
              <ShieldCheck size={28} className={kyc?.kycStatus === 'VERIFIED' ? 'text-green-500' : 'text-gray-400'} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {!kyc ? 'KYC Not Initiated' : `Status: ${kyc.kycStatus.replace('_', ' ')}`}
              </h2>
              {kyc && <p className="text-xs text-gray-500 font-mono mt-0.5">{kyc.referenceId}</p>}
              {kyc?.kycStatus === 'VERIFIED' && kyc.verifiedOn && (
                <p className="text-xs text-green-600 font-semibold mt-1">Verified on {new Date(kyc.verifiedOn).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              )}
            </div>
          </div>

          <WorkflowTimeline steps={kycStages} orientation="horizontal" />

          {!kyc && (
            <div className="mt-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl mb-4 text-xs text-blue-800">
                KYC verification is required to publish products and receive payments. The process takes 24-48 hours once documents are submitted.
              </div>
              <button
                onClick={handleInitiate}
                disabled={initiating}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50"
              >
                {initiating && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {initiating ? 'Initiating...' : 'Start KYC Verification'}
              </button>
            </div>
          )}

          {kyc?.kycStatus === 'IN_PROGRESS' && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
              <Clock size={18} className="text-amber-600 shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-800">Verification in Progress</p>
                <p className="text-xs text-amber-700 mt-0.5">Automated identity checks are running. This usually takes a few seconds in demo mode.</p>
              </div>
            </div>
          )}

          {kyc?.kycStatus === 'PENDING' && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
              <Clock size={18} className="text-amber-600 shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-800">Awaiting Manual Review</p>
                <p className="text-xs text-amber-700 mt-0.5">Your documents are with our compliance team. Expected completion in 24 hours.</p>
              </div>
            </div>
          )}
        </div>

        {/* Document Requirements */}
        {!kyc || kyc.kycStatus !== 'VERIFIED' ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-sm font-bold text-gray-800 mb-4">Required Documents</h3>
            <div className="space-y-2">
              {['PAN Card (Business)', 'GST Registration Certificate', 'Bank Account Proof (Cancelled Cheque)', 'Business Registration / Incorporation Certificate', 'Authorized Signatory ID Proof'].map(doc => (
                <div key={doc} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center shrink-0" />
                  <span className="text-sm text-gray-700">{doc}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-green-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle size={20} className="text-green-500" />
              <h3 className="text-sm font-bold text-gray-800">All Documents Verified</h3>
            </div>
            <p className="text-xs text-gray-500">Your KYC is complete. You can now publish products and receive payments through the platform.</p>
          </div>
        )}
      </div>
    </PortalShell>
  );
}
