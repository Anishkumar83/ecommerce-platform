import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, Tag, ShoppingBag, ArrowRight, Bookmark, RefreshCw } from 'lucide-react';
import MarketplaceHeader from '../../components/shared/MarketplaceHeader';
import LoadingSkeleton from '../../components/shared/LoadingSkeleton';
import { cartService } from '../../core/services/cart.service';
import type { Cart, CartItem } from '../../core/models';

export default function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [coupon, setCoupon] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState(false);
  const [quantityError, setQuantityError] = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId] = useState<string>('');

  const refresh = async () => {
    const c = await cartService.getCart();
    setCart(c);
  };

  useEffect(() => {
    cartService.getCart().then(c => { setCart(c); setLoading(false); });
  }, []);

  const handleQuantityChange = async (item: CartItem, newQty: number) => {
    if (newQty < 1) return;
    setUpdatingId(item.referenceId);
    try {
      const updated = await cartService.updateQuantity(item.referenceId, newQty);
      setCart(updated);
      setQuantityError(prev => ({ ...prev, [item.referenceId]: '' }));
    } catch (err: unknown) {
      const e = err as { message?: string };
      setQuantityError(prev => ({ ...prev, [item.referenceId]: e?.message ?? 'Update failed' }));
    } finally {
      setUpdatingId('');
    }
  };

  const handleRemove = async (id: string) => {
    const updated = await cartService.removeItem(id);
    setCart(updated);
  };

  const handleSaveForLater = async (id: string) => {
    const updated = await cartService.saveForLater(id);
    setCart(updated);
  };

  const handleMoveToCart = async (id: string) => {
    const updated = await cartService.moveToCart(id);
    setCart(updated);
  };

  const handleApplyCoupon = async () => {
    setCouponError('');
    setCouponSuccess(false);
    try {
      const updated = await cartService.applyCoupon(coupon);
      setCart(updated);
      setCouponSuccess(true);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setCouponError(e?.message ?? 'Invalid coupon');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <MarketplaceHeader />
      <div className="max-w-7xl mx-auto px-4 py-8"><LoadingSkeleton /></div>
    </div>
  );

  const activeItems = cart?.items.filter(i => !i.savedForLater) ?? [];
  const savedItems = cart?.items.filter(i => i.savedForLater) ?? [];

  if (activeItems.length === 0 && savedItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MarketplaceHeader />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <ShoppingBag size={64} className="mx-auto text-gray-200 mb-4" />
          <h2 className="text-xl font-bold font-display text-gray-700 mb-2">Your cart is empty</h2>
          <p className="text-sm text-gray-500 mb-6">Looks like you haven't added anything yet.</p>
          <Link to="/products" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700">
            Start Shopping <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MarketplaceHeader />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold font-display text-gray-900 mb-6">
          Shopping Cart <span className="text-gray-400 font-normal text-base">({activeItems.length} items)</span>
        </h1>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Cart items */}
          <div className="flex-1 space-y-3">
            {activeItems.map(item => (
              <div key={item.referenceId} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex gap-4">
                  <Link to={`/products/${item.productId}`}>
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                      <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/products/${item.productId}`} className="text-sm font-semibold text-gray-800 hover:text-brand-600 line-clamp-2">{item.productName}</Link>
                    <p className="text-xs text-gray-500 mt-0.5">{item.partnerName}</p>
                    {item.variantLabel && <p className="text-xs text-gray-500">{item.variantLabel}</p>}

                    <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                      <div className="flex items-center gap-1 border border-gray-200 rounded-lg">
                        <button onClick={() => handleQuantityChange(item, item.quantity - 1)} disabled={updatingId === item.referenceId || item.quantity <= 1}
                          className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 rounded-l-lg disabled:opacity-40">
                          <Minus size={13} />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">
                          {updatingId === item.referenceId ? <span className="text-gray-300">·</span> : item.quantity}
                        </span>
                        <button onClick={() => handleQuantityChange(item, item.quantity + 1)} disabled={updatingId === item.referenceId || item.quantity >= item.maxStock}
                          className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 rounded-r-lg disabled:opacity-40">
                          <Plus size={13} />
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-900">₹{(item.price * item.quantity).toLocaleString()}</span>
                        {item.mrp > item.price && (
                          <span className="text-xs text-gray-400 line-through">₹{(item.mrp * item.quantity).toLocaleString()}</span>
                        )}
                      </div>
                    </div>

                    {/* Stock error */}
                    {quantityError[item.referenceId] && (
                      <div className="mt-2 flex items-start gap-2 p-2 bg-amber-50 border border-amber-100 rounded-lg">
                        <RefreshCw size={13} className="text-amber-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-amber-700 whitespace-pre-line">{quantityError[item.referenceId]}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-4 mt-2">
                      <button onClick={() => handleSaveForLater(item.referenceId)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-brand-600">
                        <Bookmark size={12} /> Save for later
                      </button>
                      <button onClick={() => handleRemove(item.referenceId)} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600">
                        <Trash2 size={12} /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Saved for later */}
            {savedItems.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-bold text-gray-700 mb-3">Saved for Later ({savedItems.length})</h3>
                {savedItems.map(item => (
                  <div key={item.referenceId} className="bg-white rounded-xl border border-gray-100 p-4 mb-2 opacity-70">
                    <div className="flex gap-3 items-center">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                        <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 line-clamp-1">{item.productName}</p>
                        <p className="text-sm font-bold text-gray-900 mt-1">₹{item.price.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => handleMoveToCart(item.referenceId)} className="text-xs text-brand-600 font-medium hover:underline">Move to Cart</button>
                        <button onClick={() => handleRemove(item.referenceId)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order summary */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-24">
              <h2 className="text-sm font-bold text-gray-800 mb-4">Order Summary</h2>

              {/* Coupon */}
              <div className="mb-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={coupon}
                      onChange={e => setCoupon(e.target.value.toUpperCase())}
                      placeholder="Coupon code"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                  <button onClick={handleApplyCoupon} className="px-3 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-800">Apply</button>
                </div>
                {couponError && <p className="text-xs text-red-500 mt-1">{couponError}</p>}
                {couponSuccess && <p className="text-xs text-green-600 mt-1">✓ Coupon applied!</p>}
                <p className="text-xs text-gray-400 mt-1">Try: SAVE200 or FIRST500</p>
              </div>

              <div className="space-y-2.5 py-3 border-y border-gray-100 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-semibold">₹{cart?.subtotal.toLocaleString()}</span>
                </div>
                {(cart?.discount ?? 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Discount</span>
                    <span className="font-semibold text-green-600">-₹{cart?.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Delivery</span>
                  <span className="font-semibold text-green-600">{cart?.deliveryFee === 0 ? 'FREE' : `₹${cart?.deliveryFee}`}</span>
                </div>
              </div>

              <div className="flex justify-between mb-5">
                <span className="font-bold text-gray-800">Total</span>
                <span className="text-lg font-extrabold text-gray-900">₹{cart?.total.toLocaleString()}</span>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                disabled={activeItems.length === 0}
                className="w-full flex items-center justify-center gap-2 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 disabled:opacity-50 text-sm"
              >
                Proceed to Checkout <ArrowRight size={16} />
              </button>

              <p className="text-xs text-center text-gray-400 mt-3">🔒 Secure checkout powered by <span className="font-tamil">ழ</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
