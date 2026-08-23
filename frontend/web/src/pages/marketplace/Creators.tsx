import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, BadgeCheck, Camera, Megaphone, Users, Sparkles, UserSearch } from 'lucide-react';
import type { Creator, ParticipantCapability } from '../../core/models';
import { creatorService } from '../../core/services/creator.service';
import MarketplaceHeader from '../../components/shared/MarketplaceHeader';
import Tabs from '../../components/shared/Tabs';
import EmptyState from '../../components/shared/EmptyState';
import { SkeletonLine } from '../../components/shared/LoadingSkeleton';
import { compact } from '../../components/shared/StatTile';

const CATEGORIES = ['Lifestyle', 'Travel', 'Electronics', 'Beauty', 'Fashion', 'Fitness', 'Home & Living', 'Wellness'];

/**
 * Directory of everyone publishing or promoting on ழ. The capability filter is
 * the important control: it separates people who review on-platform from people
 * who bring an outside audience, without pretending they are different species.
 */
export default function CreatorsDirectory() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [capability, setCapability] = useState<'all' | ParticipantCapability>('all');
  const [category, setCategory] = useState('');

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      creatorService
        .getCreators(1, 50, {
          search: search || undefined,
          category: category || undefined,
          capability: capability === 'all' ? undefined : capability,
          status: 'ACTIVE',
        })
        .then(r => setCreators(r.data))
        .finally(() => setLoading(false));
    }, search ? 260 : 0);
    return () => clearTimeout(t);
  }, [search, capability, category]);

  return (
    <div className="min-h-screen bg-surface">
      <MarketplaceHeader />

      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-extrabold font-display text-gray-900 mb-1">Creators on ழ</h1>
          <p className="text-sm text-gray-500 max-w-xl">
            People who use products properly and then tell you about it. Some publish their reviews here;
            some bring an audience from elsewhere. Many do both.
          </p>

          <div className="relative mt-5 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, handle or category"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-400 focus:bg-white"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Tabs
            variant="pill"
            active={capability}
            onChange={id => setCapability(id as 'all' | ParticipantCapability)}
            tabs={[
              { id: 'all', label: 'Everyone' },
              { id: 'CREATOR', label: 'Creators', icon: <Camera size={11} /> },
              { id: 'INFLUENCER', label: 'Influencers', icon: <Megaphone size={11} /> },
            ]}
          />
          <span className="hidden sm:block w-px h-5 bg-gray-200" />
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setCategory('')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                !category ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              All categories
            </button>
            {CATEGORIES.map(c => (
              <button
                key={c}
                onClick={() => setCategory(category === c ? '' : c)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  category === c ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
                <div className="flex gap-3">
                  <div className="skeleton w-14 h-14 rounded-2xl" />
                  <div className="grow space-y-2 pt-1">
                    <SkeletonLine width="w-1/2" height="h-3.5" />
                    <SkeletonLine width="w-1/3" height="h-3" />
                  </div>
                </div>
                <SkeletonLine width="w-full" height="h-3" />
                <SkeletonLine width="w-2/3" height="h-3" />
              </div>
            ))}
          </div>
        ) : creators.length === 0 ? (
          <EmptyState
            icon={UserSearch}
            title="No creators match that"
            message="Try a different category, or clear the filters to see everyone."
            action={{ label: 'Clear filters', onClick: () => { setSearch(''); setCategory(''); setCapability('all'); } }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {creators.map((c, i) => (
              <Link
                key={c.referenceId}
                to={`/creators/${c.handle}`}
                className="group bg-white rounded-2xl border border-gray-100 p-5 hover:border-brand-200 hover:shadow-md transition-all animate-rail-in"
                style={{ animationDelay: `${i * 45}ms` }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <img src={c.avatarUrl} alt="" className="w-14 h-14 rounded-2xl object-cover shrink-0" />
                  <div className="min-w-0 grow">
                    <p className="flex items-center gap-1 text-sm font-bold text-gray-900 group-hover:text-brand-700 transition-colors">
                      {c.name}
                      {c.isVerified && <BadgeCheck size={13} className="text-brand-600 shrink-0" />}
                    </p>
                    <p className="text-xs text-gray-500">@{c.handle}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {c.capabilities.includes('CREATOR') && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wide bg-brand-50 text-brand-700 rounded px-1.5 py-0.5">
                          <Camera size={8} /> Creator
                        </span>
                      )}
                      {c.capabilities.includes('INFLUENCER') && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wide bg-purple-50 text-purple-700 rounded px-1.5 py-0.5">
                          <Megaphone size={8} /> Influencer
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3">{c.bio}</p>

                <div className="flex flex-wrap gap-1 mb-3">
                  {c.categories.slice(0, 3).map(cat => (
                    <span key={cat} className="text-[10px] text-gray-500 bg-gray-50 rounded-full px-2 py-0.5">{cat}</span>
                  ))}
                </div>

                <div className="flex items-center gap-4 pt-3 border-t border-gray-50 text-[11px] text-gray-500">
                  <span className="flex items-center gap-1 tabular-nums">
                    <Users size={11} className="text-gray-300" /> {compact(c.zhaFollowers)}
                  </span>
                  <span className="flex items-center gap-1 tabular-nums">
                    <Sparkles size={11} className="text-gray-300" /> {c.contentPublished} published
                  </span>
                  {c.capabilities.includes('INFLUENCER') && c.followerCount > 0 && (
                    <span className="flex items-center gap-1 tabular-nums ml-auto">
                      <Megaphone size={11} className="text-gray-300" /> {compact(c.followerCount)}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
