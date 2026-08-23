import { useState, useEffect } from 'react';
import { ShieldCheck, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import PortalShell from '../../components/shared/PortalShell';
import PageHeader from '../../components/shared/PageHeader';
import WorkflowTimeline from '../../components/shared/WorkflowTimeline';
import { kycService } from '../../core/services/kyc.service';
import type { KycRecord } from '../../core/models';

export default function InfluencerKYC() {
  const [kyc, setKyc] = useState<KycRecord | null>(null);
  const [initiating, setInitiating] = useState(false);

  const load = () => { kycService.getKycRecord('INF260822A01').then(setKyc); };
  useEffect(() => { load(); }, []);

  const handleInitiate = async () => {
    setInitiating(true);
    const record = await kycService.initiateKyc('INF260822A01', 'INFLUENCER', 'Influencer');
    setKyc(record);
    setInitiating(false);
    const interval = setInterval(() => {
      kycService.getKycRecord('INF260822A01').then(k => {
        setKyc(k);
        if (k?.kycStatus === 'VERIFIED' || k?.kycStatus === 'REJECTED') clearInterval(interval);
      });
    }, 3000);
  };

  const kycStages = [
    { label: 'Initiate', sublabel: 'Start verification', completed: !!kyc, current: !kyc },
    { label: 'Processing', sublabel: 'ID check', completed: kyc?.kycStatus === 'PENDING' || kyc?.kycStatus === 'VERIFIED', current: kyc?.kycStatus === 'IN_PROGRESS' },
    { label: 'Review', sublabel: 'Manual check', completed: kyc?.kycStatus === 'VERIFIED', current: kyc?.kycStatus === 'PENDING' },
    { label: 'Approved', sublabel: 'Complete', completed: kyc?.kycStatus === 'VERIFIED', current: false },
  ];

  return (
    <PortalShell type="influencer">
      <PageHeader title="KYC Verification" subtitle="Verify your identity to receive payouts" />

      <div className="max-w-lg">
        <div className={`bg-white rounded-2xl border p-6 mb-6 ${kyc?.kycStatus === 'VERIFIED' ? 'border-green-200' : 'border-gray-100'}`}>
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${kyc?.kycStatus === 'VERIFIED' ? 'bg-green-50' : 'bg-purple-50'}`}>
              <ShieldCheck size={28} className={kyc?.kycStatus === 'VERIFIED' ? 'text-green-500' : 'text-purple-400'} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">{!kyc ? 'Verification Required' : `KYC ${kyc.kycStatus.replace('_', ' ')}`}</h2>
              {kyc && <p className="text-xs text-gray-400 font-mono mt-0.5">{kyc.referenceId}</p>}
            </div>
          </div>

          <WorkflowTimeline steps={kycStages} orientation="horizontal" />

          {!kyc && (
            <div className="mt-6">
              <p className="text-xs text-gray-500 mb-4">Complete KYC to unlock payouts and monetization features. You'll need your PAN card and Aadhaar card ready.</p>
              <button onClick={handleInitiate} disabled={initiating}
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700 disabled:opacity-50">
                {initiating && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Start Verification
              </button>
            </div>
          )}

          {kyc?.kycStatus === 'IN_PROGRESS' && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-800">
              <Clock size={14} /> Running automated checks...
            </div>
          )}
          {kyc?.kycStatus === 'PENDING' && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-800">
              <Clock size={14} /> Awaiting compliance team review (24-48 hours)
            </div>
          )}
          {kyc?.kycStatus === 'VERIFIED' && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-xs text-green-800">
              <CheckCircle size={14} /> KYC verified! Payouts are now enabled.
            </div>
          )}
        </div>
      </div>
    </PortalShell>
  );
}
