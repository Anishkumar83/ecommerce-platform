import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, FileText, Upload, Check, ShieldCheck, Clock } from 'lucide-react';
import OnboardingShell from '../../components/shared/OnboardingShell';
import { useToast } from '../../components/shared/Toast';
import { creatorService } from '../../core/services/creator.service';
import type { OnboardingApplication } from '../../core/models';

const CATEGORIES = ['Electronics', 'Fashion', 'Beauty', 'Home & Living', 'Fitness', 'Travel', 'Food & Beverage', 'Accessories', 'Lifestyle'];

// Mirrors the vocabulary used in the existing partner KYC / Documents screens.
const REQUIRED_DOCS = ['PAN Card (Business)', 'GST Registration Certificate', 'Bank Account Proof (Cancelled Cheque)', 'Business Registration / Incorporation Certificate', 'Authorized Signatory ID Proof'];

const STEPS = ['Business Information', 'Contact', 'Product Categories', 'Documents & KYC', 'Submit'];

const inputCls = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20';
const labelCls = 'block text-xs font-semibold text-gray-600 mb-1.5';

export default function BecomePartner() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<OnboardingApplication | null>(null);

  // Step 0
  const [businessName, setBusinessName] = useState('');
  const [businessCategory, setBusinessCategory] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');

  // Step 1
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Step 2
  const [categories, setCategories] = useState<string[]>([]);

  // Step 3 — mock document upload
  const [uploaded, setUploaded] = useState<string[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);

  const toggleCategory = (c: string) => {
    setCategories(prev => (prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]));
  };

  const mockUpload = (doc: string) => {
    setUploading(doc);
    setTimeout(() => {
      setUploaded(prev => [...prev, doc]);
      setUploading(null);
    }, 700);
  };

  const emailValid = /^\S+@\S+\.\S+$/.test(email);
  const phoneValid = phone.replace(/\D/g, '').length >= 10;

  let disabledReason = '';
  if (step === 0) {
    if (!businessName.trim()) disabledReason = 'Enter your business name';
    else if (!businessCategory) disabledReason = 'Select a business category';
    else if (!description.trim()) disabledReason = 'Add a short business description';
  } else if (step === 1) {
    if (!contactName.trim()) disabledReason = 'Enter a contact name';
    else if (!emailValid) disabledReason = 'Enter a valid email address';
    else if (!phoneValid) disabledReason = 'Enter a valid phone number';
  } else if (step === 2) {
    if (categories.length === 0) disabledReason = 'Add at least one product category';
  } else if (step === 3) {
    if (uploaded.length < REQUIRED_DOCS.length) disabledReason = 'Upload all required documents to continue';
  }
  const nextDisabled = disabledReason !== '';

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const app = await creatorService.submitApplication('PARTNER', {
        name: businessName.trim(),
        email: email.trim(),
        mobile: phone.trim(),
        categories,
        contentPreferences: [
          `Contact: ${contactName.trim()}`,
          website.trim() ? `Website: ${website.trim()}` : '',
          `Documents submitted: ${uploaded.length}/${REQUIRED_DOCS.length}`,
        ].filter(Boolean),
      });
      setResult(app);
      toast('Partner application submitted');
    } catch {
      toast('Something went wrong. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (step === STEPS.length - 1) { handleSubmit(); return; }
    setStep(s => s + 1);
  };
  const handleBack = () => setStep(s => Math.max(0, s - 1));

  if (result) {
    return (
      <OnboardingShell title="" steps={[]} current={0} hideFooter maxWidthClass="max-w-lg">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-green-500" />
          </div>
          <h1 className="text-xl font-extrabold font-display text-gray-900 mb-2">Application Submitted</h1>
          <p className="text-sm text-gray-500 mb-1">
            Reference ID <span className="font-mono font-semibold text-gray-700">{result.referenceId}</span>
          </p>
          <p className="text-sm text-gray-500 mb-6">
            We will email you at <strong>{result.email}</strong> once your Partner application has been reviewed.
          </p>
        </div>

        <div className="bg-gray-50 rounded-xl p-5 mb-6 text-left">
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">The approval path</h2>
          <ol className="space-y-2.5">
            {[
              'Compliance reviews your documents and KYC — usually within 24-48 hours.',
              'Once verified, your business account activates on the partner portal.',
              'List products and launch campaigns recruiting creators and influencers.',
            ].map((text, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                <span>{text}</span>
              </li>
            ))}
          </ol>
        </div>

        <Link
          to="/login"
          className="block w-full text-center py-3 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700"
        >
          Go to Login
        </Link>
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell
      title={STEPS[step]}
      subtitle={STEP_SUBTITLES[step]}
      steps={STEPS}
      current={step}
      onBack={step > 0 ? handleBack : undefined}
      onNext={handleNext}
      nextLabel={step === STEPS.length - 1 ? 'Submit Application' : 'Continue'}
      nextDisabled={nextDisabled}
      nextDisabledReason={disabledReason}
      submitting={submitting}
    >
      {step === 0 && (
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Business Name</label>
            <input className={inputCls} value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="NatureGlow Cosmetics" />
          </div>
          <div>
            <label className={labelCls}>Business Category</label>
            <select className={inputCls} value={businessCategory} onChange={e => setBusinessCategory(e.target.value)}>
              <option value="">Select…</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Website (optional)</label>
            <input className={inputCls} value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://…" />
          </div>
          <div>
            <label className={labelCls}>Business Description</label>
            <textarea
              className={`${inputCls} min-h-[90px] resize-none`}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What do you sell, and who is it for?"
            />
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Contact Name</label>
            <input className={inputCls} value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Owner or authorized signatory" />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input className={inputCls} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="partnerships@business.com" />
          </div>
          <div>
            <label className={labelCls}>Phone</label>
            <input className={inputCls} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" />
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <p className="text-sm text-gray-500 mb-4">Which categories will your products fall under?</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => {
              const active = categories.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCategory(c)}
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                    active ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-gray-200 text-gray-700 hover:border-brand-300'
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 mb-4 flex items-start gap-2.5">
            <ShieldCheck size={15} className="shrink-0 mt-0.5" />
            <span>KYC verification is required to publish products and receive payments. Review typically takes 24-48 hours once documents are submitted.</span>
          </div>
          <div className="space-y-2.5">
            {REQUIRED_DOCS.map(doc => {
              const done = uploaded.includes(doc);
              const busy = uploading === doc;
              return (
                <div key={doc} className={`flex items-center gap-3 p-3.5 rounded-xl border ${done ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${done ? 'bg-white' : 'bg-gray-50'}`}>
                    {done ? <CheckCircle size={16} className="text-green-500" /> : <FileText size={16} className="text-gray-400" />}
                  </div>
                  <span className="text-sm text-gray-800 grow">{doc}</span>
                  {done ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-green-600"><Check size={12} /> Uploaded</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => mockUpload(doc)}
                      disabled={busy}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-100 disabled:opacity-50 shrink-0"
                    >
                      {busy ? <Clock size={12} className="animate-spin" /> : <Upload size={12} />}
                      {busy ? 'Uploading…' : 'Upload'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Review your application before you submit it.</p>
          <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm">
            <SummaryRow label="Business" value={businessName} />
            <SummaryRow label="Category" value={businessCategory} />
            <SummaryRow label="Website" value={website} />
            <SummaryRow label="Contact" value={contactName} />
            <SummaryRow label="Email" value={email} />
            <SummaryRow label="Phone" value={phone} />
            <SummaryRow label="Product categories" value={categories.join(', ')} />
            <SummaryRow label="Documents" value={`${uploaded.length}/${REQUIRED_DOCS.length} uploaded`} />
          </div>
          <p className="text-xs text-gray-400">
            By submitting, you are applying to sell as a Partner on <span className="font-tamil">ழ</span>. You will be able to
            run campaigns that recruit both creators and influencers once approved.
          </p>
        </div>
      )}
    </OnboardingShell>
  );
}

const STEP_SUBTITLES: Record<number, string> = {
  0: 'Tell us about your business.',
  1: 'Who should we reach for approvals and support?',
  2: 'What will you sell?',
  3: 'Standard KYC documentation for every seller.',
  4: 'Last look before you submit.',
};

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs font-semibold text-gray-500 shrink-0">{label}</span>
      <span className="text-gray-800 text-right">{value || '—'}</span>
    </div>
  );
}
