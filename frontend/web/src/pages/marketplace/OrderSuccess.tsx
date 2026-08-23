import { useParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight, Home } from 'lucide-react';
import MarketplaceHeader from '../../components/shared/MarketplaceHeader';

export default function OrderSuccessPage() {
  const { referenceId } = useParams<{ referenceId: string }>();

  const estimatedDelivery = new Date(Date.now() + 5 * 86400000).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50">
      <MarketplaceHeader />
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-3xl border border-gray-100 p-10 shadow-sm">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-600" />
          </div>

          <h1 className="text-2xl font-extrabold font-display text-gray-900 mb-2">Order Placed Successfully!</h1>
          <p className="text-sm text-gray-500 mb-6">Thank you for your purchase. We're getting your order ready.</p>

          <div className="bg-gray-50 rounded-2xl p-5 mb-6 space-y-3 text-left">
            <div className="flex justify-between">
              <span className="text-xs text-gray-500 font-medium">Order Reference</span>
              <span className="text-xs font-bold text-brand-700 font-mono">{referenceId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500 font-medium">Estimated Delivery</span>
              <span className="text-xs font-semibold text-gray-700">{estimatedDelivery}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500 font-medium">Order Status</span>
              <span className="text-xs font-bold text-green-600">Confirmed</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              to={`/orders/${referenceId}`}
              className="flex items-center justify-center gap-2 w-full py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 text-sm"
            >
              <Package size={16} /> Track Order
            </Link>
            <Link
              to="/"
              className="flex items-center justify-center gap-2 w-full py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 text-sm"
            >
              <Home size={16} /> Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
