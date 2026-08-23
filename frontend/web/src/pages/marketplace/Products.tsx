import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Star, ShoppingCart, Heart, Filter, X, ChevronDown, SlidersHorizontal } from 'lucide-react';
import MarketplaceHeader from '../../components/shared/MarketplaceHeader';
import { SkeletonCard } from '../../components/shared/LoadingSkeleton';
import { productService } from '../../core/services/product.service';
import { cartService } from '../../core/services/cart.service';
import type { Product, ProductFilters } from '../../core/models';

const CATEGORIES = ['Electronics', 'Fashion', 'Beauty', 'Home & Living', 'Fitness', 'Travel', 'Food & Beverage', 'Accessories', 'Lifestyle'];
const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'newest', label: 'Newest' },
  { value: 'rating', label: 'Rating' },
  { value: 'popular', label: 'Most Popular' },
];

function ProductCard({ product, onAddToCart }: { product: Product; onAddToCart: (p: Product) => void }) {
  const [wishlisted, setWishlisted] = useState(false);
  const [adding, setAdding] = useState(false);

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    setAdding(true);
    try { await onAddToCart(product); } finally { setAdding(false); }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
      <Link to={`/products/${product.referenceId}`} className="block relative">
        <div className="aspect-square bg-gray-50 overflow-hidden">
          <img
            src={product.media.find(m => m.isPrimary)?.url}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <button onClick={e => { e.preventDefault(); setWishlisted(!wishlisted); }}
          className="absolute top-2.5 right-2.5 w-7 h-7 bg-white rounded-full shadow-sm flex items-center justify-center hover:bg-red-50">
          <Heart size={13} className={wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
        </button>
        {product.isBestSeller && <span className="absolute top-2.5 left-2.5 text-[10px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded-full">Best Seller</span>}
        {product.isNewArrival && !product.isBestSeller && <span className="absolute top-2.5 left-2.5 text-[10px] font-bold bg-brand-600 text-white px-1.5 py-0.5 rounded-full">New</span>}
      </Link>
      <div className="p-3">
        <Link to={`/products/${product.referenceId}`}>
          <p className="text-xs text-gray-400">{product.brand}</p>
          <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug my-1">{product.name}</h3>
          <div className="flex items-center gap-1 mb-2">
            <Star size={11} className="fill-amber-400 text-amber-400" />
            <span className="text-xs font-semibold text-gray-700">{product.rating}</span>
            <span className="text-xs text-gray-400">({product.reviewCount.toLocaleString()})</span>
          </div>
          <div className="flex items-center flex-wrap gap-1.5 mb-3">
            <span className="text-sm font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
            <span className="text-xs text-gray-400 line-through">₹{product.mrp.toLocaleString()}</span>
            <span className="text-xs font-bold text-green-600">{product.discount}% off</span>
          </div>
        </Link>
        <button onClick={handleAdd} disabled={adding}
          className="w-full flex items-center justify-center gap-1.5 py-2 bg-brand-50 text-brand-700 text-xs font-semibold rounded-lg hover:bg-brand-600 hover:text-white transition-colors disabled:opacity-50">
          <ShoppingCart size={13} />{adding ? 'Adding...' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [toast, setToast] = useState('');

  const [filters, setFilters] = useState<ProductFilters>({
    search: searchParams.get('search') ?? '',
    category: searchParams.get('category') ?? '',
    sortBy: (searchParams.get('sortBy') as ProductFilters['sortBy']) ?? 'recommended',
    pageSize: 12,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productService.getPublishedProducts({ ...filters, page });
      setProducts(res.data);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { load(); }, [load]);

  const updateFilter = (key: keyof ProductFilters, value: ProductFilters[keyof ProductFilters]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleAddToCart = async (product: Product) => {
    await cartService.addItem(product);
    setToast(`${product.name.slice(0, 30)}... added!`);
    setTimeout(() => setToast(''), 3000);
  };

  const totalPages = Math.ceil(total / (filters.pageSize ?? 12));

  return (
    <div className="min-h-screen bg-gray-50">
      <MarketplaceHeader />

      {toast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-xl z-50 text-sm font-medium flex items-center gap-2">
          <ShoppingCart size={16} className="text-green-400" /> {toast}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search bar + sort */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 relative">
            <input
              type="text"
              value={filters.search}
              onChange={e => updateFilter('search', e.target.value)}
              placeholder="Search products..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 bg-white"
            />
            {filters.search && (
              <button onClick={() => updateFilter('search', '')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X size={14} className="text-gray-400" />
              </button>
            )}
          </div>
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 bg-white rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 md:hidden"
          >
            <SlidersHorizontal size={15} /> Filters
          </button>
          <div className="relative hidden md:flex items-center gap-1">
            <select
              value={filters.sortBy}
              onChange={e => updateFilter('sortBy', e.target.value as ProductFilters['sortBy'])}
              className="appearance-none px-4 py-2.5 pr-8 border border-gray-200 bg-white rounded-xl text-sm font-medium text-gray-700 focus:outline-none"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 pointer-events-none text-gray-400" />
          </div>
        </div>

        <div className="flex gap-6">
          {/* Filters sidebar */}
          <aside className={`shrink-0 w-56 ${filtersOpen ? 'block' : 'hidden'} md:block`}>
            <div className="bg-white rounded-xl border border-gray-100 p-4 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-800">Filters</h3>
                <button onClick={() => setFilters({ sortBy: 'recommended', pageSize: 12 })} className="text-xs text-brand-600 hover:underline">Clear all</button>
              </div>

              {/* Category */}
              <div className="mb-5">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Category</h4>
                <div className="space-y-1.5">
                  {CATEGORIES.map(cat => (
                    <label key={cat} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        name="category"
                        checked={filters.category === cat}
                        onChange={() => updateFilter('category', filters.category === cat ? '' : cat)}
                        className="accent-brand-600"
                      />
                      <span className={`text-sm ${filters.category === cat ? 'text-brand-700 font-semibold' : 'text-gray-600'}`}>{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div className="mb-5">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Price Range</h4>
                <div className="space-y-2">
                  {[{ label: 'Under ₹500', max: 500 }, { label: '₹500 - ₹2,000', min: 500, max: 2000 }, { label: '₹2,000 - ₹5,000', min: 2000, max: 5000 }, { label: 'Above ₹5,000', min: 5000 }].map(r => (
                    <label key={r.label} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="price"
                        checked={filters.minPrice === r.min && filters.maxPrice === r.max}
                        onChange={() => { updateFilter('minPrice', r.min); updateFilter('maxPrice', r.max); }}
                        className="accent-brand-600"
                      />
                      <span className="text-sm text-gray-600">{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div className="mb-5">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Rating</h4>
                {[4, 3, 2].map(r => (
                  <label key={r} className="flex items-center gap-2 cursor-pointer mb-1.5">
                    <input type="radio" name="rating" checked={filters.rating === r} onChange={() => updateFilter('rating', r)} className="accent-brand-600" />
                    <div className="flex items-center gap-1">
                      {Array.from({ length: r }).map((_, i) => <Star key={i} size={12} className="fill-amber-400 text-amber-400" />)}
                      <span className="text-sm text-gray-500">& up</span>
                    </div>
                  </label>
                ))}
              </div>

              {/* Availability */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!!filters.availability} onChange={e => updateFilter('availability', e.target.checked)} className="accent-brand-600" />
                  <span className="text-sm text-gray-600">In Stock Only</span>
                </label>
              </div>
            </div>
          </aside>

          {/* Products grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                {loading ? 'Loading...' : `${total} products`}
                {filters.category && <span className="ml-1">in <strong>{filters.category}</strong></span>}
              </p>
              <select
                value={filters.sortBy}
                onChange={e => updateFilter('sortBy', e.target.value as ProductFilters['sortBy'])}
                className="md:hidden px-3 py-2 border border-gray-200 bg-white rounded-xl text-sm text-gray-700"
              >
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-4xl mb-4">🔍</p>
                <h3 className="text-lg font-bold text-gray-700">No products found</h3>
                <p className="text-sm text-gray-500 mt-1 mb-4">Try adjusting your filters or search term</p>
                <button onClick={() => setFilters({ sortBy: 'recommended', pageSize: 12 })} className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700">
                  Clear filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {products.map(p => (
                    <ProductCard key={p.referenceId} product={p} onAddToCart={handleAddToCart} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Prev</button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button key={p} onClick={() => setPage(p)} className={`w-9 h-9 text-sm rounded-lg ${p === page ? 'bg-brand-600 text-white' : 'border border-gray-200 hover:bg-gray-50 text-gray-600'}`}>{p}</button>
                    ))}
                    <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
