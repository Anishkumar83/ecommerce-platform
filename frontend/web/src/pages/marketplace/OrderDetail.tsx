import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, Check, Clock } from 'lucide-react';
import MarketplaceHeader from '../../components/shared/MarketplaceHeader';
import StatusBadge from '../../components/shared/StatusBadge';
import LoadingSkeleton from '../../components/shared/LoadingSkeleton';
import { orderService } from '../../core/services/order.service';
import type { Order, OrderTimeline } from '../../core/models';

const ORDER_STEPS = ['PLACED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

export default function OrderDetailPage() {
  const { referenceId } = useParams<{ referenceId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!referenceId) return;
    orderService.getOrder(referenceId).then(o => { setOrder(o); setLoading(false); }).catch(() => setLoading(false));
  }, [referenceId]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50"><MarketplaceHeader /><div className="max-w-4xl mx-auto px-4 py-8"><LoadingSkeleton /></div></div>
  );

  if (!order) return (
    <div className="min-h-screen bg-gray-50"><MarketplaceHeader /><div className="max-w-4xl mx-auto px-4 py-16 text-center"><h2 className="text-gray-600">Order not found</h2></div></div>
  );

  const currentStepIndex = ORDER_STEPS.indexOf(order.orderStatus);

  return (
    <div className="min-h-screen bg-gray-50">
      <MarketplaceHeader />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-xs text-gray-500 mb-6">
          <Link to="/orders" className="hover:text-brand-600">My Orders</Link>
          <ChevronRight size={12} />
          <span className="text-gray-400">{order.referenceId}</span>
        </nav>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold font-display text-gray-900">{order.referenceId}</h1>
            <p className="text-sm text-gray-500 mt-0.5">Placed on {new Date(order.createdOn).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <StatusBadge status={order.orderStatus} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* Timeline */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="text-sm font-bold text-gray-800 mb-4">Order Timeline</h2>
              <div className="space-y-0">
                {ORDER_STEPS.map((status, i) => {
                  const timelineEvent = order.timeline.find(t => t.status === status);
                  const isCompleted = timelineEvent?.completed ?? false;
                  const isCurrent = i === currentStepIndex;
                  const isPast = i < currentStepIndex;

                  return (
                    <div key={status} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                          isCompleted ? 'bg-brand-600' : isCurrent ? 'bg-brand-100 ring-2 ring-brand-400' : 'bg-gray-100'
                        }`}>
                          {isCompleted ? <Check size={13} className="text-white" /> :
                           isCurrent ? <Clock size={13} className="text-brand-600" /> :
                           <span className="text-xs text-gray-400">{i + 1}</span>}
                        </div>
                        {i < ORDER_STEPS.length - 1 && (
                          <div className={`w-0.5 my-1 flex-1 ${isPast || isCompleted ? 'bg-brand-300' : 'bg-gray-100'}`} style={{ minHeight: 20 }} />
                        )}
                      </div>
                      <div className="pb-4">
                        <p className={`text-sm font-semibold ${isCompleted || isCurrent ? 'text-gray-800' : 'text-gray-400'}`}>
                          {status.replace(/_/g, ' ')}
                        </p>
                        {timelineEvent && (
                          <p className="text-xs text-gray-500">{timelineEvent.description}</p>
                        )}
                        {timelineEvent?.timestamp && (
                          <p className="text-xs text-gray-400 mt-0.5">{new Date(timelineEvent.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Items */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="text-sm font-bold text-gray-800 mb-4">Items Ordered</h2>
              <div className="space-y-3">
                {order.items.map(item => (
                  <div key={item.referenceId} className="flex gap-3">
                    <Link to={`/products/${item.productId}`} className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                      <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to={`/products/${item.productId}`} className="text-sm font-semibold text-gray-800 hover:text-brand-600 line-clamp-2">{item.productName}</Link>
                      <p className="text-xs text-gray-500">{item.partnerName}</p>
                      {item.variantLabel && <p className="text-xs text-gray-400">{item.variantLabel}</p>}
                      <p className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-bold text-gray-900 shrink-0">₹{item.total.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Summary sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h2 className="text-sm font-bold text-gray-800 mb-3">Order Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>₹{order.subtotal.toLocaleString()}</span></div>
                {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{order.discount.toLocaleString()}</span></div>}
                <div className="flex justify-between"><span className="text-gray-500">Delivery</span><span className="text-green-600">{order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`}</span></div>
                <div className="flex justify-between font-bold pt-2 border-t border-gray-100">
                  <span>Total</span><span>₹{order.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h2 className="text-sm font-bold text-gray-800 mb-2">Shipping Address</h2>
              <p className="text-sm font-semibold text-gray-700">{order.shippingAddress.fullName}</p>
              <p className="text-xs text-gray-500">{order.shippingAddress.addressLine}</p>
              <p className="text-xs text-gray-500">{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}</p>
              <p className="text-xs text-gray-500">{order.shippingAddress.phone}</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h2 className="text-sm font-bold text-gray-800 mb-2">Payment</h2>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{order.paymentMethod.replace('_', ' ')}</span>
                <StatusBadge status={order.paymentStatus} size="sm" />
              </div>
              {order.paymentReferenceId && <p className="text-xs text-gray-400 mt-1 font-mono">{order.paymentReferenceId}</p>}
            </div>

            {order.estimatedDelivery && (
              <div className="bg-brand-50 rounded-xl border border-brand-100 p-4">
                <p className="text-xs font-semibold text-brand-700 mb-1">Estimated Delivery</p>
                <p className="text-sm font-bold text-brand-800">{new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
