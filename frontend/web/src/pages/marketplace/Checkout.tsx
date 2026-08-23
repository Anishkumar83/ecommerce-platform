import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronRight, CreditCard, Smartphone, Building, Wallet, Truck, Plus } from 'lucide-react';
import MarketplaceHeader from '../../components/shared/MarketplaceHeader';
import WorkflowTimeline from '../../components/shared/WorkflowTimeline';
import { cartService } from '../../core/services/cart.service';
import { orderService } from '../../core/services/order.service';
import { useAuth } from '../../core/auth/AuthContext';
import type { Cart, Address, PaymentMethod } from '../../core/models';
import { MOCK_CUSTOMERS } from '../../core/mock/data';

const STEPS = ['Address', 'Delivery', 'Payment', 'Review', 'Confirmation'];

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: typeof CreditCard; description: string }[] = [
  { value: 'UPI', label: 'UPI', icon: Smartphone, description: 'Google Pay, PhonePe, BHIM' },
  { value: 'CREDIT_CARD', label: 'Credit Card', icon: CreditCard, description: 'All major cards accepted' },
  { value: 'DEBIT_CARD', label: 'Debit Card', icon: CreditCard, description: 'Visa, Mastercard, RuPay' },
  { value: 'NET_BANKING', label: 'Net Banking', icon: Building, description: 'All major banks' },
  { value: 'CASH_ON_DELIVERY', label: 'Cash on Delivery', icon: Truck, description: 'Pay when you receive' },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [step, setStep] = useState(0);
  const [cart, setCart] = useState<Cart | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  const customer = MOCK_CUSTOMERS.find(c => c.email === currentUser?.email) ?? MOCK_CUSTOMERS[0];

  useEffect(() => {
    cartService.getCart().then(c => {
      setCart(c);
      if (c.items.filter(i => !i.savedForLater).length === 0) navigate('/cart');
    });
    if (customer.addresses.length > 0) {
      setSelectedAddress(customer.addresses.find(a => a.isDefault) ?? customer.addresses[0]);
    }
  }, []);

  const handlePlaceOrder = async () => {
    if (!selectedAddress || !currentUser) return;
    setPlacing(true);
    setError('');
    try {
      const { order } = await orderService.placeOrder({
        customerId: customer.referenceId,
        customerName: currentUser.name,
        shippingAddress: selectedAddress,
        paymentMethod,
      });
      navigate(`/orders/${order.referenceId}/success`);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? 'Payment failed. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  const stepComponents = [
    // Step 0: Address
    <div key="address" className="space-y-3">
      <h2 className="text-base font-bold text-gray-800 mb-4">Select Delivery Address</h2>
      {customer.addresses.map(addr => (
        <div
          key={addr.referenceId}
          onClick={() => setSelectedAddress(addr)}
          className={`p-4 rounded-xl border-2 cursor-pointer ${selectedAddress?.referenceId === addr.referenceId ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}
        >
          <div className="flex items-start gap-3">
            <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center ${selectedAddress?.referenceId === addr.referenceId ? 'border-brand-600 bg-brand-600' : 'border-gray-300'}`}>
              {selectedAddress?.referenceId === addr.referenceId && <Check size={11} className="text-white" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{addr.fullName}</p>
              <p className="text-sm text-gray-600 mt-0.5">{addr.addressLine}</p>
              <p className="text-sm text-gray-600">{addr.city}, {addr.state} - {addr.postalCode}</p>
              <p className="text-sm text-gray-500">{addr.phone}</p>
              {addr.isDefault && <span className="inline-block mt-1 text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium">Default</span>}
            </div>
          </div>
        </div>
      ))}
      <button className="flex items-center gap-2 text-sm text-brand-600 font-semibold hover:underline mt-2">
        <Plus size={15} /> Add new address
      </button>
    </div>,

    // Step 1: Delivery
    <div key="delivery" className="space-y-3">
      <h2 className="text-base font-bold text-gray-800 mb-4">Select Delivery Option</h2>
      {[
        { label: 'Standard Delivery', desc: 'Delivered in 4-6 business days', price: 'FREE', icon: '📦' },
        { label: 'Express Delivery', desc: 'Delivered in 1-2 business days', price: '₹99', icon: '⚡' },
      ].map((opt, i) => (
        <div key={i} className={`p-4 rounded-xl border-2 cursor-pointer ${i === 0 ? 'border-brand-500 bg-brand-50' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <span className="text-xl">{opt.icon}</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">{opt.label}</p>
              <p className="text-xs text-gray-500">{opt.desc}</p>
            </div>
            <span className={`text-sm font-bold ${opt.price === 'FREE' ? 'text-green-600' : 'text-gray-800'}`}>{opt.price}</span>
          </div>
        </div>
      ))}
    </div>,

    // Step 2: Payment
    <div key="payment">
      <h2 className="text-base font-bold text-gray-800 mb-4">Select Payment Method</h2>
      <div className="space-y-2">
        {PAYMENT_METHODS.map(m => (
          <div
            key={m.value}
            onClick={() => setPaymentMethod(m.value)}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer ${paymentMethod === m.value ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === m.value ? 'border-brand-600 bg-brand-600' : 'border-gray-300'}`}>
              {paymentMethod === m.value && <Check size={11} className="text-white" />}
            </div>
            <m.icon size={18} className="text-gray-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-800">{m.label}</p>
              <p className="text-xs text-gray-500">{m.description}</p>
            </div>
          </div>
        ))}
      </div>

      {paymentMethod === 'UPI' && (
        <div className="mt-4 p-4 bg-gray-50 rounded-xl">
          <p className="text-xs font-semibold text-gray-600 mb-2">Enter UPI ID</p>
          <input type="text" placeholder="yourname@upi" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
        </div>
      )}

      {(paymentMethod === 'CREDIT_CARD' || paymentMethod === 'DEBIT_CARD') && (
        <div className="mt-4 p-4 bg-gray-50 rounded-xl space-y-3">
          <input type="text" placeholder="Card Number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="MM/YY" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <input type="text" placeholder="CVV" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
        </div>
      )}
    </div>,

    // Step 3: Review
    <div key="review">
      <h2 className="text-base font-bold text-gray-800 mb-4">Review Order</h2>
      <div className="space-y-3">
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Delivery Address</p>
          {selectedAddress && (
            <div>
              <p className="text-sm font-semibold text-gray-800">{selectedAddress.fullName}</p>
              <p className="text-sm text-gray-600">{selectedAddress.addressLine}, {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.postalCode}</p>
            </div>
          )}
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Payment</p>
          <p className="text-sm font-semibold text-gray-800">{PAYMENT_METHODS.find(m => m.value === paymentMethod)?.label}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Items ({cart?.items.filter(i => !i.savedForLater).length})</p>
          {cart?.items.filter(i => !i.savedForLater).map(item => (
            <div key={item.referenceId} className="flex items-center gap-3 py-2">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-white border border-gray-200">
                <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-700 line-clamp-1">{item.productName}</p>
                <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
              </div>
              <span className="text-xs font-bold text-gray-800">₹{(item.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div className="bg-brand-50 rounded-xl p-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Subtotal</span>
            <span>₹{cart?.subtotal.toLocaleString()}</span>
          </div>
          {(cart?.discount ?? 0) > 0 && (
            <div className="flex justify-between text-sm mb-1 text-green-600">
              <span>Discount</span>
              <span>-₹{cart?.discount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Delivery</span>
            <span className="text-green-600">{cart?.deliveryFee === 0 ? 'FREE' : `₹${cart?.deliveryFee}`}</span>
          </div>
          <div className="flex justify-between font-bold pt-2 border-t border-brand-100">
            <span>Total</span>
            <span className="text-base">₹{cart?.total.toLocaleString()}</span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}
      </div>
    </div>,
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <MarketplaceHeader />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold font-display text-gray-900 mb-6">Checkout</h1>

        {/* Progress */}
        <div className="mb-8">
          <WorkflowTimeline
            orientation="horizontal"
            steps={STEPS.map((s, i) => ({
              label: s,
              completed: i < step,
              current: i === step,
            }))}
          />
        </div>

        {/* Step content */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          {stepComponents[step]}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => step === 0 ? navigate('/cart') : setStep(s => s - 1)}
            className="px-5 py-2.5 border border-gray-200 text-sm font-medium text-gray-700 rounded-xl hover:bg-gray-50"
          >
            {step === 0 ? 'Back to Cart' : 'Previous'}
          </button>

          {step < STEPS.length - 2 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={step === 0 && !selectedAddress}
              className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700 disabled:opacity-50"
            >
              Continue <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handlePlaceOrder}
              disabled={placing}
              className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 disabled:opacity-50"
            >
              {placing ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</>
              ) : (
                <><Check size={16} /> Place Order — ₹{cart?.total.toLocaleString()}</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
