import { useState, useEffect } from 'react';
import { Users, Search } from 'lucide-react';
import AdminShell from '../../components/shared/AdminShell';
import PageHeader from '../../components/shared/PageHeader';
import StatusBadge from '../../components/shared/StatusBadge';
import EmptyState from '../../components/shared/EmptyState';
import { influencerService } from '../../core/services/influencer.service';
import type { Influencer } from '../../core/models';

export default function AdminInfluencers() {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    influencerService.getInfluencers(1, 20).then(r => { setInfluencers(r.data); setLoading(false); });
  }, []);

  const filtered = influencers.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminShell>
      <PageHeader title="Influencers" subtitle={`${influencers.length} registered creators`} />

      <div className="bg-white border border-gray-100 rounded-xl p-4 mb-5">
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or category..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No Influencers" message="No creators match your search." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(inf => (
            <div key={inf.referenceId} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-3 mb-3">
                <img src={inf.avatarUrl} alt={inf.name} className="w-11 h-11 rounded-xl object-cover" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{inf.name}</p>
                  <p className="text-xs text-gray-500">{inf.category}</p>
                  <p className="text-xs font-mono text-gray-400">{inf.referenceId}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1 text-center mb-3">
                <div>
                  <p className="text-xs font-bold text-gray-900">{(inf.followerCount / 1000).toFixed(0)}K</p>
                  <p className="text-xs text-gray-400">Followers</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">{inf.campaignIds?.length ?? 0}</p>
                  <p className="text-xs text-gray-400">Campaigns</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <StatusBadge status={inf.kycStatus} size="sm" />
                <div className="flex gap-1">
                  {inf.socialPlatforms.slice(0, 2).map(p => (
                    <span key={p.platform} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{p.platform}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
