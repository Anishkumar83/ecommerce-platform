import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
// lucide-react v1 removed brand icons (Instagram / Youtube / Twitter).
// Generic equivalents, aliased so PLATFORM_ICONS below stays unchanged.
import { FileVideo, Plus, Camera as Instagram, Play as Youtube, Bird as Twitter } from 'lucide-react';
import PortalShell from '../../components/shared/PortalShell';
import PageHeader from '../../components/shared/PageHeader';
import StatusBadge from '../../components/shared/StatusBadge';
import EmptyState from '../../components/shared/EmptyState';
import { campaignService } from '../../core/services/campaign.service';
import type { Content } from '../../core/models';

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  Instagram, YouTube: Youtube, Twitter,
};

export default function InfluencerContent() {
  const [content, setContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    campaignService.getInfluencerContent('INF260822A01').then(c => { setContent(c); setLoading(false); });
  }, []);

  return (
    <PortalShell type="influencer">
      <PageHeader
        title="My Content"
        subtitle="All content submissions across campaigns"
        actions={
          <Link to="/influencer/content/new" className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700">
            <Plus size={15} /> Upload Content
          </Link>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-48 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : content.length === 0 ? (
        <EmptyState icon={FileVideo} title="No Content Yet" message="Upload your first content piece for a campaign to get started." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {content.map(c => {
            const Icon = PLATFORM_ICONS[c.socialPlatform] ?? FileVideo;
            return (
              <div key={c.referenceId} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {c.thumbnailUrl ? (
                  <div className="aspect-video overflow-hidden bg-gray-100">
                    <img src={c.thumbnailUrl} alt={c.title} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="aspect-video bg-purple-50 flex items-center justify-center">
                    <Icon size={32} className="text-purple-300" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="text-sm font-bold text-gray-900 line-clamp-1 flex-1">{c.title}</h3>
                    <StatusBadge status={c.contentStatus} size="sm" />
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{c.socialPlatform} · {c.contentType}</p>
                  <p className="text-xs text-gray-500 line-clamp-2">{c.description}</p>
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50 text-xs text-gray-400">
                    {c.views && <span>{c.views.toLocaleString()} views</span>}
                    {c.likes && <span>{c.likes.toLocaleString()} likes</span>}
                    <span className="ml-auto font-mono">{c.referenceId}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PortalShell>
  );
}
