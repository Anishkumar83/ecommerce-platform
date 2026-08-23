import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronRight } from 'lucide-react';
import PortalShell from '../../components/shared/PortalShell';
import PageHeader from '../../components/shared/PageHeader';
import WorkflowTimeline from '../../components/shared/WorkflowTimeline';
import { productService } from '../../core/services/product.service';

const STEPS = ['Basic Info', 'Pricing & Stock', 'Media', 'Variants', 'Review & Submit'];

const CATEGORIES = ['Electronics', 'Fashion', 'Beauty', 'Sports', 'Home & Kitchen', 'Books', 'Food & Beverage', 'Travel'];

const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop&auto=format',
];

export default function PartnerProductForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    brand: '',
    category: '',
    sku: '',
    price: '',
    mrp: '',
    stock: '',
    maxStock: '',
    tags: '',
  });

  const set = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }));

  const handleSubmit = async () => {
    setSubmitting(true);
    const product = await productService.createProduct({
      name: form.name,
      description: form.description,
      brand: form.brand,
      category: form.category,
      price: Number(form.price),
      mrp: Number(form.mrp),
      stock: Number(form.maxStock) || Number(form.stock),
      tags: form.tags.split(',').map(t => t.trim()),
      partnerId: 'PTN260822A01',
      partnerName: 'Urban Lifestyle Pvt Ltd',
    });
    await productService.submitProduct(product.referenceId);
    navigate('/partner/products');
  };

  const steps = STEPS.map((label, i) => ({
    label,
    sublabel: i < step ? 'Complete' : i === step ? 'In progress' : 'Pending',
    completed: i < step,
    current: i === step,
  }));

  const inputCls = "w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20";

  return (
    <PortalShell type="partner">
      <PageHeader
        title="Add New Product"
        subtitle="Complete all steps to submit for review"
        breadcrumbs={[
          { label: 'Products', href: '/partner/products' },
          { label: 'New Product' },
        ]}
      />

      <div className="mb-6 overflow-x-auto">
        <WorkflowTimeline steps={steps} orientation="horizontal" />
      </div>

      <div className="max-w-2xl">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-gray-900">Basic Information</h2>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Product Name *</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. SoundWave Pro Headphones" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Brand *</label>
                <input value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="e.g. UrbanSound" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Category *</label>
                <select value={form.category} onChange={e => set('category', e.target.value)} className={inputCls}>
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description *</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4}
                  placeholder="Describe your product features, benefits..." className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tags (comma-separated)</label>
                <input value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="wireless, audio, premium" className={inputCls} />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-gray-900">Pricing & Inventory</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Selling Price (₹) *</label>
                  <input type="number" value={form.price} onChange={e => set('price', e.target.value)} placeholder="2999" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">MRP (₹) *</label>
                  <input type="number" value={form.mrp} onChange={e => set('mrp', e.target.value)} placeholder="3999" className={inputCls} />
                </div>
              </div>
              {form.price && form.mrp && Number(form.mrp) > Number(form.price) && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700 font-semibold">
                  {Math.round((1 - Number(form.price) / Number(form.mrp)) * 100)}% discount applied
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Stock Quantity *</label>
                  <input type="number" value={form.stock} onChange={e => set('stock', e.target.value)} placeholder="100" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Max per Order</label>
                  <input type="number" value={form.maxStock} onChange={e => set('maxStock', e.target.value)} placeholder="5" className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">SKU Code</label>
                <input value={form.sku} onChange={e => set('sku', e.target.value)} placeholder="URB-HS-001" className={inputCls} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-gray-900">Product Media</h2>
              <p className="text-xs text-gray-500">Demo: sample images will be auto-assigned. In production, upload via the media uploader.</p>
              <div className="grid grid-cols-3 gap-3">
                {SAMPLE_IMAGES.map((url, i) => (
                  <div key={i} className={`relative aspect-square rounded-xl overflow-hidden border-2 ${i === 0 ? 'border-emerald-500' : 'border-gray-200'}`}>
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    {i === 0 && (
                      <div className="absolute top-1 left-1 bg-emerald-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-lg">Primary</div>
                    )}
                  </div>
                ))}
              </div>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center text-sm text-gray-400">
                <p className="font-semibold mb-1">Upload additional images</p>
                <p className="text-xs">JPG, PNG up to 10MB each · Max 8 images</p>
                <button className="mt-3 px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-200">
                  Choose Files
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-gray-900">Product Variants</h2>
              <p className="text-xs text-gray-500">Add color and size variants for your product.</p>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs font-semibold text-gray-600 mb-2">Colors</p>
                <div className="flex gap-2 flex-wrap">
                  {['Black', 'White', 'Navy Blue', 'Rose Gold', 'Silver'].map(c => (
                    <label key={c} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-emerald-400 text-xs font-semibold">
                      <input type="checkbox" className="accent-emerald-600" /> {c}
                    </label>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs font-semibold text-gray-600 mb-2">Sizes</p>
                <div className="flex gap-2 flex-wrap">
                  {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size', 'N/A'].map(s => (
                    <label key={s} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-emerald-400 text-xs font-semibold">
                      <input type="checkbox" className="accent-emerald-600" defaultChecked={s === 'N/A'} /> {s}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-gray-900">Review & Submit</h2>
              <div className="space-y-3">
                {[
                  { label: 'Product Name', value: form.name || '—' },
                  { label: 'Brand', value: form.brand || '—' },
                  { label: 'Category', value: form.category || '—' },
                  { label: 'Selling Price', value: form.price ? `₹${Number(form.price).toLocaleString()}` : '—' },
                  { label: 'MRP', value: form.mrp ? `₹${Number(form.mrp).toLocaleString()}` : '—' },
                  { label: 'Stock', value: form.stock || '—' },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between py-2 border-b border-gray-50">
                    <span className="text-xs text-gray-500">{row.label}</span>
                    <span className="text-sm font-semibold text-gray-800">{row.value}</span>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                <strong>What happens next:</strong> Your product will go through Media Processing → Security Scan → Moderation → Platform Approval before going live.
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={() => step > 0 && setStep(s => s - 1)}
              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 disabled:opacity-30"
              disabled={step === 0}
            >
              Back
            </button>
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700"
              >
                Continue <ChevronRight size={14} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50"
              >
                {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check size={14} />}
                {submitting ? 'Submitting...' : 'Submit for Review'}
              </button>
            )}
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
