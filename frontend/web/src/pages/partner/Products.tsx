import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, RefreshCw } from 'lucide-react';
import PortalShell from '../../components/shared/PortalShell';
import PageHeader from '../../components/shared/PageHeader';
import StatusBadge from '../../components/shared/StatusBadge';
import { productService } from '../../core/services/product.service';
import type { Product } from '../../core/models';

export default function PartnerProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const load = () => {
    setLoading(true);
    productService.getPartnerProducts('PTN260822A01').then(p => { setProducts(p); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || p.publishStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusOptions = ['ALL', 'DRAFT', 'MEDIA_PROCESSING', 'SECURITY_SCAN', 'MODERATION', 'PENDING_APPROVAL', 'PUBLISHED', 'REJECTED'];

  return (
    <PortalShell type="partner">
      <PageHeader
        title="My Products"
        subtitle={`${products.length} products across all stages`}
        actions={
          <Link to="/partner/products/new" className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700">
            <Plus size={15} /> New Product
          </Link>
        }
      />

      {/* Filters */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 mb-5 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none"
        >
          {statusOptions.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s.replace(/_/g, ' ')}</option>)}
        </select>
        <button onClick={load} className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500">
          <RefreshCw size={15} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ref ID</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Price</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stock</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(p => (
                <tr key={p.referenceId} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                        <img src={p.media.find(m => m.isPrimary)?.url} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 line-clamp-1">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.category} · {p.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-gray-500">{p.referenceId}</td>
                  <td className="px-5 py-3 font-semibold text-gray-900">₹{p.price.toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold ${p.stock < 10 ? 'text-red-600' : 'text-gray-700'}`}>{p.stock}</span>
                  </td>
                  <td className="px-5 py-3"><StatusBadge status={p.publishStatus} size="sm" /></td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      {p.publishStatus === 'DRAFT' && (
                        <button
                          onClick={() => productService.submitProduct(p.referenceId).then(load)}
                          className="text-xs font-semibold text-emerald-700 hover:underline"
                        >
                          Submit
                        </button>
                      )}
                      <Link to={`/partner/products/${p.referenceId}`} className="text-xs font-semibold text-brand-600 hover:underline">Edit</Link>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-400">No products found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </PortalShell>
  );
}
