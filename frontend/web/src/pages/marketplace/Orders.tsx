import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight } from 'lucide-react';
import MarketplaceHeader from '../../components/shared/MarketplaceHeader';
import StatusBadge from '../../components/shared/StatusBadge';
import LoadingSkeleton from '../../components/shared/LoadingSkeleton';
import { orderService } from '../../core/services/order.service';
import { useAuth } from '../../core/auth/AuthContext';
import type { Order } from '../../core/models';
import { MOCK_CUSTOMERS } from '../../core/mock/data';

export default function OrdersPage() {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const customer = MOCK_CUSTOMERS.find(c => c.email === currentUser?.email) ?? MOCK_CUSTOMERS[0];

  useEffect(() => {
    orderService.getOrders(customer.referenceId).then(r => {
      setOrders(r.data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <MarketplaceHeader />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold font-display text-gray-900 mb-6">My Orders</h1>

        {loading ? <LoadingSkeleton /> : orders.length === 0 ? (
          <div className="text-center py-16">
            <Package size={48} className="mx-auto text-gray-200 mb-4" />
            <h2 className="text-lg font-bold text-gray-600">No orders yet</h2>
            <Link to="/products" className="mt-4 inline-block text-sm text-brand-600 font-semibold hover:underline">Start Shopping →</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => (
              <Link key={order.referenceId} to={`/orders/${order.referenceId}`}
                className="block bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs font-mono font-semibold text-brand-700">{order.referenceId}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(order.createdOn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={order.orderStatus} />
                    <ChevronRight size={16} className="text-gray-300" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {order.items.slice(0, 3).map(item => (
                      <div key={item.referenceId} className="w-10 h-10 rounded-xl overflow-hidden bg-gray-50 border-2 border-white">
                        <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 line-clamp-1">
                      {order.items.map(i => i.productName).join(', ')}
                    </p>
                    <p className="text-xs text-gray-500">{order.items.length} item{order.items.length > 1 ? 's' : ''}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-gray-900">₹{order.total.toLocaleString()}</p>
                    <StatusBadge status={order.paymentStatus} size="sm" />
                  </div>
                </div>
                {order.estimatedDelivery && order.orderStatus !== 'DELIVERED' && order.orderStatus !== 'CANCELLED' && (
                  <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-50">
                    {order.orderStatus === 'SHIPPED' ? '🚚 ' : '📦 '}
                    Estimated delivery: {new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
