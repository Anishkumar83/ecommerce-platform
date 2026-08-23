import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Megaphone, Calendar, Users, Package, Plus, UserCheck } from 'lucide-react';
import PortalShell from '../../components/shared/PortalShell';
import PageHeader from '../../components/shared/PageHeader';
import StatusBadge from '../../components/shared/StatusBadge';
import EmptyState from '../../components/shared/EmptyState';
import { campaignService } from '../../core/services/campaign.service';
import { creatorService } from '../../core/services/creator.service';
import type { Campaign } from '../../core/models';

export default function PartnerCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [participantCounts, setParticipantCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    campaignService.getPartnerCampaigns('PTN260822A01').then(c => {
      setCampaigns(c);
      setLoading(false);
      Promise.all(c.map(campaign => creatorService.getParticipations({ campaignId: campaign.referenceId }))).then(lists => {
        const counts: Record<string, number> = {};
        c.forEach((campaign, i) => { counts[campaign.referenceId] = lists[i].length; });
        setParticipantCounts(counts);
      });
    });
  }, []);

  return (
    <PortalShell type="partner">
      <PageHeader
        title="Campaigns"
        subtitle="Manage your influencer marketing campaigns"
        actions={
          <Link to="/partner/campaigns/new" className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700">
            <Plus size={15} /> Create Campaign
          </Link>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : campaigns.length === 0 ? (
        <EmptyState icon={Megaphone} title="No Campaigns Yet" message="Create your first campaign to collaborate with influencers and boost your products." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.map(c => (
            <Link key={c.referenceId} to={`/partner/campaigns/${c.referenceId}`} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow block">
              {c.bannerUrl && (
                <div className="h-32 overflow-hidden">
                  <img src={c.bannerUrl} alt={c.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-gray-900">{c.name}</h3>
                  <StatusBadge status={c.status} size="sm" />
                </div>
                <p className="text-xs text-gray-500 line-clamp-2 mb-4">{c.description}</p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-2 bg-gray-50 rounded-xl">
                    <Package size={12} className="mx-auto text-brand-600 mb-0.5" />
                    <p className="text-xs font-bold">{c.productIds.length}</p>
                    <p className="text-xs text-gray-400">Products</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-xl">
                    <Users size={12} className="mx-auto text-purple-600 mb-0.5" />
                    <p className="text-xs font-bold">{c.influencerIds.length}</p>
                    <p className="text-xs text-gray-400">Creators</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-xl">
                    <UserCheck size={12} className="mx-auto text-amber-600 mb-0.5" />
                    <p className="text-xs font-bold">{participantCounts[c.referenceId] ?? 0}</p>
                    <p className="text-xs text-gray-400">Participants</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-xl">
                    <Calendar size={12} className="mx-auto text-green-600 mb-0.5" />
                    <p className="text-xs font-bold">{new Date(c.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                    <p className="text-xs text-gray-400">Ends</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PortalShell>
  );
}
