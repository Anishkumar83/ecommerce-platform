import { useState, useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';
import AdminShell from '../../components/shared/AdminShell';
import PageHeader from '../../components/shared/PageHeader';
import StatusBadge from '../../components/shared/StatusBadge';
import EmptyState from '../../components/shared/EmptyState';
import { orderService } from '../../core/services/order.service';
import type { Order } from '../../core/models';

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = () => {
    setLoading(true);
    orderService.getAllOrders(page, 10).then(r => { setOrders(r.data); setTotal(r.total); setLoading(false); });
  };
  useEffect(() => { load(); }, [page]);

  return (
    <AdminShell>
      <PageHeader title="All Orders" subtitle={`${total} orders on the platform`} />

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState icon={ShoppingBag} title="No Orders" message="No orders found." />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Order ID</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Customer</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Items</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Amount</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Payment</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map(o => (
                <tr key={o.referenceId} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3 font-mono text-xs font-semibold text-gray-700">{o.referenceId}</td>
                  <td className="px-5 py-3 text-xs text-gray-600">{o.customerId}</td>
                  <td className="px-5 py-3 text-xs text-gray-500">{new Date(o.createdOn).toLocaleDateString('en-IN')}</td>
                  <td className="px-5 py-3 text-xs text-gray-600">{o.items.length}</td>
                  <td className="px-5 py-3 text-xs font-bold text-gray-900">₹{o.total.toLocaleString()}</td>
                  <td className="px-5 py-3 text-xs text-gray-500">{o.paymentMethod}</td>
                  <td className="px-5 py-3"><StatusBadge status={o.orderStatus} size="sm" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminShell>
  );
}
