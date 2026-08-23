import { useState, useEffect } from 'react';
import { ShoppingBag, Package } from 'lucide-react';
import PortalShell from '../../components/shared/PortalShell';
import PageHeader from '../../components/shared/PageHeader';
import StatusBadge from '../../components/shared/StatusBadge';
import EmptyState from '../../components/shared/EmptyState';
import { orderService } from '../../core/services/order.service';
import type { Order } from '../../core/models';

export default function PartnerOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderService.getAllOrders(1, 20).then(r => { setOrders(r.data); setLoading(false); });
  }, []);

  return (
    <PortalShell type="partner">
      <PageHeader title="Orders" subtitle={`${orders.length} orders placed for your products`} />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="No Orders Yet" message="Orders for your products will appear here." />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Order ID</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Items</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Payment</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map(o => (
                <tr key={o.referenceId} className="hover:bg-gray-50/50">
                  <td className="px-5 py-4">
                    <p className="font-mono text-xs font-semibold text-gray-800">{o.referenceId}</p>
                    <p className="text-xs text-gray-400">{o.customerId}</p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex -space-x-2">
                      {o.items.slice(0, 3).map(item => (
                        <div key={item.productId} className="w-8 h-8 rounded-lg overflow-hidden border-2 border-white bg-gray-100">
                          <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{o.items.length} item{o.items.length > 1 ? 's' : ''}</p>
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-600">{new Date(o.createdOn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td className="px-5 py-4 font-bold text-gray-900">₹{o.total.toLocaleString()}</td>
                  <td className="px-5 py-4">
                    <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">{o.paymentMethod}</span>
                  </td>
                  <td className="px-5 py-4"><StatusBadge status={o.orderStatus} size="sm" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PortalShell>
  );
}
