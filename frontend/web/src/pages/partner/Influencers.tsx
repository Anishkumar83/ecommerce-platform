import { useState, useEffect } from 'react';
import { Users, Send, CheckCircle, X } from 'lucide-react';
import PortalShell from '../../components/shared/PortalShell';
import PageHeader from '../../components/shared/PageHeader';
import StatusBadge from '../../components/shared/StatusBadge';
import EmptyState from '../../components/shared/EmptyState';
import { influencerService } from '../../core/services/influencer.service';
import type { Influencer, Invitation } from '../../core/models';

export default function PartnerInfluencers() {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', message: '' });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState('');

  const load = () => {
    Promise.all([
      influencerService.getPartnerInfluencers('PTN260822A01'),
      influencerService.getInfluencers(1, 20),
    ]).then(([partnerInfs, allInfs]) => {
      setInfluencers(partnerInfs);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    const inv = await influencerService.sendInvitation({
      partnerId: 'PTN260822A01',
      partnerName: 'Urban Lifestyle Pvt Ltd',
      campaignId: 'CMP260822A03',
      campaignName: 'Adventure Creator Series',
      email: inviteForm.email,
      productCount: 2,
    });
    setInvitations(p => [...p, inv]);
    setInviteSuccess(`Invitation sent! Token: ${inv.token.slice(0, 8)}...`);
    setInviteLoading(false);
    setInviteForm({ name: '', email: '', message: '' });
  };

  return (
    <PortalShell type="partner">
      <PageHeader
        title="Influencer Collaborators"
        subtitle="Manage your creator network"
        actions={
          <button onClick={() => setShowInviteModal(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700">
            <Send size={15} /> Invite Creator
          </button>
        }
      />

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">Invite a Creator</h2>
              <button onClick={() => { setShowInviteModal(false); setInviteSuccess(''); }} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            {inviteSuccess ? (
              <div className="text-center py-6">
                <CheckCircle size={40} className="mx-auto text-green-500 mb-3" />
                <p className="text-sm font-semibold text-gray-800 mb-1">Invitation Sent!</p>
                <p className="text-xs text-gray-500">{inviteSuccess}</p>
                <button onClick={() => setShowInviteModal(false)} className="mt-4 px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700">Done</button>
              </div>
            ) : (
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Creator Name</label>
                  <input value={inviteForm.name} onChange={e => setInviteForm(p => ({ ...p, name: e.target.value }))} required
                    placeholder="Ananya Sharma" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email Address</label>
                  <input type="email" value={inviteForm.email} onChange={e => setInviteForm(p => ({ ...p, email: e.target.value }))} required
                    placeholder="creator@example.com" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Personal Message (optional)</label>
                  <textarea value={inviteForm.message} onChange={e => setInviteForm(p => ({ ...p, message: e.target.value }))} rows={3}
                    placeholder="Hi! We'd love to collaborate with you..." className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                </div>
                <button type="submit" disabled={inviteLoading} className="w-full py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {inviteLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  Send Invitation
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : influencers.length === 0 ? (
        <EmptyState icon={Users} title="No Active Collaborators" message="Invite creators to collaborate on your campaigns and products." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {influencers.map(inf => (
            <div key={inf.referenceId} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-3 mb-3">
                <img src={inf.avatarUrl} alt={inf.name} className="w-12 h-12 rounded-xl object-cover" />
                <div>
                  <p className="font-bold text-gray-900 text-sm">{inf.name}</p>
                  <p className="text-xs text-gray-500">{inf.category}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center mb-3">
                <div>
                  <p className="text-sm font-bold text-gray-900">{(inf.followerCount / 1000).toFixed(0)}K</p>
                  <p className="text-xs text-gray-400">Followers</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{inf.campaignIds?.length ?? 0}</p>
                  <p className="text-xs text-gray-400">Campaigns</p>
                </div>
              </div>
              <div className="flex gap-1 flex-wrap mb-3">
                {inf.socialPlatforms.slice(0, 3).map(p => (
                  <span key={p.platform} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">{p.platform}</span>
                ))}
              </div>
              <StatusBadge status={inf.kycStatus} size="sm" />
            </div>
          ))}
        </div>
      )}

      {invitations.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-bold text-gray-700 mb-3">Sent Invitations</h2>
          <div className="space-y-2">
            {invitations.map(inv => (
              <div key={inv.referenceId} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{inv.influencerEmail}</p>
                  <p className="text-xs text-gray-500">{inv.campaignName}</p>
                </div>
                <StatusBadge status={inv.invitationStatus} size="sm" />
              </div>
            ))}
          </div>
        </div>
      )}
    </PortalShell>
  );
}
