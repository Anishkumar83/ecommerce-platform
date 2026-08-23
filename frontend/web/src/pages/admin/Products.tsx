import { useState, useEffect } from 'react';
import { Package, Search } from 'lucide-react';
import AdminShell from '../../components/shared/AdminShell';
import PageHeader from '../../components/shared/PageHeader';
import StatusBadge from '../../components/shared/StatusBadge';
import { productService } from '../../core/services/product.service';
import type { Product } from '../../core/models';

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const load = () => {
    productService.getProducts({ page: 1, pageSize: 50 }).then(r => { setProducts(r.data); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.partnerName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || p.publishStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <AdminShell>
      <PageHeader title="Products" subtitle={`${products.length} products on platform`} />

      <div className="flex gap-3 mb-5">
        <div className="flex-1 relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm">
          {['ALL', 'DRAFT', 'MEDIA_PROCESSING', 'MODERATION', 'PENDING_APPROVAL', 'PUBLISHED', 'REJECTED'].map(s =>
            <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s.replace(/_/g, ' ')}</option>
          )}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Product</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Partner</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Price</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Category</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(p => (
              <tr key={p.referenceId} className="hover:bg-gray-50/50">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                      <img src={p.media.find(m => m.isPrimary)?.url} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 line-clamp-1">{p.name}</p>
                      <p className="font-mono text-xs text-gray-400">{p.referenceId}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-xs text-gray-600">{p.partnerName}</td>
                <td className="px-5 py-3 font-semibold text-gray-900 text-xs">₹{p.price.toLocaleString()}</td>
                <td className="px-5 py-3 text-xs text-gray-500">{p.category}</td>
                <td className="px-5 py-3"><StatusBadge status={p.publishStatus} size="sm" /></td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-400">No products found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
