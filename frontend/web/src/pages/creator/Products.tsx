import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, CheckCircle2, Package } from 'lucide-react';
import PortalShell from '../../components/shared/PortalShell';
import PageHeader from '../../components/shared/PageHeader';
import EmptyState from '../../components/shared/EmptyState';
import ErrorState from '../../components/shared/ErrorState';
import { SkeletonCard } from '../../components/shared/LoadingSkeleton';
import { inr } from '../../components/shared/StatTile';
import { useAuth } from '../../core/auth/AuthContext';
import { creatorService } from '../../core/services/creator.service';
import { productService } from '../../core/services/product.service';
import type { Product } from '../../core/models';

export default function CreatorProducts() {
  const { currentUser } = useAuth();
  const creatorId = currentUser?.creatorId ?? 'CRT260822A01';

  const [products, setProducts] = useState<Product[]>([]);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    Promise.all([
      productService.getPublishedProducts({ search: search || undefined, pageSize: 60 }),
      creatorService.getCreatorContent(creatorId),
    ])
      .then(([p, content]) => {
        setProducts(p.data);
        setReviewedIds(new Set(content.map(c => c.productId)));
      })
      .catch(() => setError('Could not load products right now.'))
      .finally(() => setLoading(false));
  }, [creatorId, search]);

  useEffect(() => { load(); }, [load]);

  const sorted = useMemo(
    () => [...products].sort((a, b) => Number(reviewedIds.has(a.referenceId)) - Number(reviewedIds.has(b.referenceId))),
    [products, reviewedIds]
  );

  return (
    <PortalShell type="creator">
      <PageHeader title="Products" subtitle="Products you can create content about." />

      <div className="relative mb-5 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search products…"
          className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : sorted.length === 0 ? (
        <EmptyState icon={Package} title="No products found" message="Try a different search." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sorted.map(p => {
            const img = p.media.find(m => m.isPrimary)?.url ?? p.media[0]?.url;
            const reviewed = reviewedIds.has(p.referenceId);
            return (
              <Link
                key={p.referenceId}
                to={`/creator/content/new?product=${p.referenceId}`}
                className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-gray-200 transition-all"
              >
                <div className="relative aspect-square bg-gray-100">
                  {img && <img src={img} alt={p.name} className="w-full h-full object-cover" />}
                  {reviewed && (
                    <span className="absolute top-2 left-2 inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-600 text-white rounded-full px-2 py-1">
                      <CheckCircle2 size={10} /> Reviewed
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs text-gray-400 mb-0.5">{p.category}</p>
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-1 mb-1">{p.name}</h3>
                  <p className="text-sm font-bold text-gray-900 tabular-nums">{inr(p.price)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </PortalShell>
  );
}
