import { useState, useRef, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Plus, Trash2, ArrowRight, Link2, TrendingUp } from 'lucide-react';
import OnboardingShell from '../../components/shared/OnboardingShell';
import PlatformIcon, { PLATFORM_OPTIONS, platformLabel } from '../../components/shared/PlatformIcon';
import { useToast } from '../../components/shared/Toast';
import { creatorService } from '../../core/services/creator.service';
import type { SocialPlatform, OnboardingApplication } from '../../core/models';

const CATEGORIES = ['Electronics', 'Fashion', 'Beauty', 'Home & Living', 'Fitness', 'Travel', 'Food & Beverage', 'Accessories', 'Lifestyle'];
const AGE_BANDS = ['13-17', '18-24', '25-34', '35-44', '45-54', '55+'];
const GEOGRAPHIES = ['Metro India (Delhi, Mumbai, Bengaluru…)', 'Tier 2 & 3 India', 'Pan-India', 'India + International'];
const IDENTITY_TYPES = ['Aadhaar', 'PAN', 'Passport', 'Driving License'];

const STEPS = ['Personal Information', 'Social Platforms', 'Audience Information', 'Categories', 'Verification', 'Submit'];

interface PlatformRow {
  id: number;
  platform: SocialPlatform['platform'];
  handle: string;
  followers: string;
  url: string;
}

const inputCls = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20';
const labelCls = 'block text-xs font-semibold text-gray-600 mb-1.5';

function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function BecomeInfluencer() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<OnboardingApplication | null>(null);

  // Step 0
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');

  // Step 1
  const [platforms, setPlatforms] = useState<PlatformRow[]>([]);
  const nextRowId = useRef(1);

  // Step 2
  const [ageBand, setAgeBand] = useState('');
  const [geography, setGeography] = useState('');
  const [engagementRate, setEngagementRate] = useState('');

  // Step 3
  const [categories, setCategories] = useState<string[]>([]);

  // Step 4
  const [identityType, setIdentityType] = useState('');
  const [identityNumber, setIdentityNumber] = useState('');
  const [consent, setConsent] = useState(false);

  const totalReach = platforms.reduce((sum, p) => sum + (Number(p.followers) || 0), 0);

  const addPlatformRow = () => {
    const used = platforms.map(p => p.platform);
    const available = PLATFORM_OPTIONS.find(p => !used.includes(p)) ?? PLATFORM_OPTIONS[0];
    setPlatforms(prev => [...prev, { id: nextRowId.current++, platform: available, handle: '', followers: '', url: '' }]);
  };
  const updatePlatformRow = (id: number, patch: Partial<PlatformRow>) => {
    setPlatforms(prev => prev.map(p => (p.id === id ? { ...p, ...patch } : p)));
  };
  const removePlatformRow = (id: number) => setPlatforms(prev => prev.filter(p => p.id !== id));

  const toggleCategory = (c: string) => {
    setCategories(prev => (prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]));
  };

  const emailValid = /^\S+@\S+\.\S+$/.test(email);
  const mobileValid = mobile.replace(/\D/g, '').length >= 10;
  const validPlatformRows = platforms.filter(p => p.handle.trim() && Number(p.followers) > 0 && p.url.trim());

  let disabledReason = '';
  if (step === 0) {
    if (!name.trim()) disabledReason = 'Enter your full name';
    else if (!emailValid) disabledReason = 'Enter a valid email address';
    else if (!mobileValid) disabledReason = 'Enter a valid mobile number';
  } else if (step === 1) {
    if (platforms.length === 0) disabledReason = 'Add at least one social platform';
    else if (validPlatformRows.length === 0) disabledReason = 'Fill in handle, follower count and profile URL for each platform';
  } else if (step === 2) {
    if (!ageBand) disabledReason = 'Select your primary audience age band';
    else if (!geography) disabledReason = 'Select your primary audience geography';
    else if (!engagementRate.trim() || Number(engagementRate) <= 0) disabledReason = 'Enter a typical engagement rate';
  } else if (step === 3) {
    if (categories.length === 0) disabledReason = 'Add at least one category';
  } else if (step === 4) {
    if (!identityType) disabledReason = 'Select an identity document type';
    else if (!identityNumber.trim()) disabledReason = 'Enter your identity document number';
    else if (!consent) disabledReason = 'You must agree to the disclosure guidelines';
  }
  const nextDisabled = disabledReason !== '';

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const socialPlatforms: SocialPlatform[] = validPlatformRows.map(p => ({
        platform: p.platform, handle: p.handle.trim(), followers: Number(p.followers) || 0, url: p.url.trim() || undefined,
      }));
      const contentPreferences = [
        `Primary audience age: ${ageBand}`,
        `Primary geography: ${geography}`,
        `Typical engagement rate: ${engagementRate}%`,
      ];
      const app = await creatorService.submitApplication('INFLUENCER', {
        name: name.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        categories,
        socialPlatforms,
        contentPreferences,
        audienceSize: totalReach,
      });
      setResult(app);
      toast('Application submitted');
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
            We will email you at <strong>{result.email}</strong> once your Influencer application has been reviewed.
          </p>
        </div>

        <div className="bg-gray-50 rounded-xl p-5 mb-6 text-left">
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Link2 size={13} /> How tracking &amp; commission will work
          </h2>
          <p className="text-sm text-gray-600">
            Once approved, every campaign you join gives you a short tracked link (like <span className="font-mono">zha.example/c/A7xK92</span>) to
            post on your own channels. Orders placed through that link are attributed to you and pay out as Sales
            Commission — you can watch clicks, orders and Commission update from your influencer portal.
          </p>
        </div>

        <div className="border border-brand-200 bg-brand-50 rounded-xl p-5 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0">
              <ArrowRight size={16} className="text-brand-600" />
            </div>
            <div className="grow">
              <p className="text-sm font-bold text-gray-900">Also become a Creator</p>
              <p className="text-xs text-gray-600 mt-0.5 mb-3">
                Creator and Influencer are separate capabilities on the same profile. Add Creator to also receive
                products and publish photo, video and written reviews directly on <span className="font-tamil">ழ</span>, earning a Content
                Fee plus Sales Commission.
              </p>
              <button
                onClick={() => navigate('/onboarding/creator')}
                className="px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl hover:bg-brand-700"
              >
                Start Creator Application
              </button>
            </div>
          </div>
        </div>

        <Link to="/login" className="block text-center text-sm text-brand-600 font-semibold hover:underline">
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
            <label className={labelCls}>Full Name</label>
            <input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="Priya Nair" />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input className={inputCls} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="priya@example.com" />
          </div>
          <div>
            <label className={labelCls}>Mobile</label>
            <input className={inputCls} type="tel" value={mobile} onChange={e => setMobile(e.target.value)} placeholder="+91 98765 43210" />
          </div>
        </div>
      )}

      {step === 1 && (
        <div>
          <p className="text-sm text-gray-500 mb-4">
            Add every channel where you post — your audience lives outside <span className="font-tamil">ழ</span>, and this is
            where campaign links will point.
          </p>
          <div className="space-y-3">
            {platforms.map(row => (
              <div key={row.id} className="p-3 border border-gray-200 rounded-xl">
                <div className="flex items-start gap-2">
                  <div className="flex items-center gap-1.5 shrink-0 mt-2.5">
                    <PlatformIcon platform={row.platform} size={16} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 grow">
                    <select
                      className={inputCls}
                      value={row.platform}
                      onChange={e => updatePlatformRow(row.id, { platform: e.target.value as SocialPlatform['platform'] })}
                    >
                      {PLATFORM_OPTIONS.map(p => (
                        <option key={p} value={p}>{platformLabel(p)}</option>
                      ))}
                    </select>
                    <input
                      className={inputCls}
                      placeholder="@handle"
                      value={row.handle}
                      onChange={e => updatePlatformRow(row.id, { handle: e.target.value })}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removePlatformRow(row.id)}
                    className="p-2 mt-1 text-gray-400 hover:text-red-500 shrink-0"
                    aria-label="Remove"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 ml-0 sm:ml-8">
                  <input
                    className={inputCls}
                    placeholder="Follower count"
                    inputMode="numeric"
                    value={row.followers}
                    onChange={e => updatePlatformRow(row.id, { followers: e.target.value.replace(/\D/g, '') })}
                  />
                  <input
                    className={inputCls}
                    placeholder="Profile URL"
                    value={row.url}
                    onChange={e => updatePlatformRow(row.id, { url: e.target.value })}
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addPlatformRow}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-dashed border-gray-300 text-gray-600 text-xs font-bold rounded-xl hover:border-brand-300 hover:text-brand-700"
            >
              <Plus size={13} /> Add a platform
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-brand-50 border border-brand-100 rounded-xl">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0">
              <TrendingUp size={17} className="text-brand-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500">Total reach across platforms</p>
              <p className="text-lg font-extrabold font-display text-gray-900 tabular-nums">{compact(totalReach)} followers</p>
            </div>
          </div>
          <div>
            <label className={labelCls}>Primary Audience Age</label>
            <select className={inputCls} value={ageBand} onChange={e => setAgeBand(e.target.value)}>
              <option value="">Select…</option>
              {AGE_BANDS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Primary Audience Geography</label>
            <select className={inputCls} value={geography} onChange={e => setGeography(e.target.value)}>
              <option value="">Select…</option>
              {GEOGRAPHIES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Typical Engagement Rate (%)</label>
            <input
              className={inputCls}
              inputMode="decimal"
              value={engagementRate}
              onChange={e => setEngagementRate(e.target.value.replace(/[^0-9.]/g, ''))}
              placeholder="e.g. 3.5"
            />
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <p className="text-sm text-gray-500 mb-4">Pick the categories that best describe what you promote.</p>
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

      {step === 4 && (
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Identity Document Type</label>
            <select className={inputCls} value={identityType} onChange={e => setIdentityType(e.target.value)}>
              <option value="">Select…</option>
              {IDENTITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Document Number</label>
            <input className={inputCls} value={identityNumber} onChange={e => setIdentityNumber(e.target.value)} placeholder="e.g. 4321 1098 7654" />
          </div>
          <label className="flex items-start gap-2.5 p-3.5 bg-gray-50 rounded-xl cursor-pointer">
            <input type="checkbox" className="mt-0.5" checked={consent} onChange={e => setConsent(e.target.checked)} />
            <span className="text-xs text-gray-600">
              I agree to disclose sponsored content clearly on every post and to follow the <span className="font-tamil">ழ</span> influencer
              guidelines.
            </span>
          </label>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Review your application before you submit it.</p>
          <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm">
            <SummaryRow label="Name" value={name} />
            <SummaryRow label="Email" value={email} />
            <SummaryRow label="Mobile" value={mobile} />
            <SummaryRow label="Platforms" value={validPlatformRows.map(p => platformLabel(p.platform)).join(', ')} />
            <SummaryRow label="Total reach" value={compact(totalReach)} />
            <SummaryRow label="Audience age" value={ageBand} />
            <SummaryRow label="Geography" value={geography} />
            <SummaryRow label="Engagement rate" value={engagementRate ? `${engagementRate}%` : ''} />
            <SummaryRow label="Categories" value={categories.join(', ')} />
          </div>
          <p className="text-xs text-gray-400">
            By submitting, you are applying for the Influencer capability on <span className="font-tamil">ழ</span>.
          </p>
        </div>
      )}
    </OnboardingShell>
  );
}

const STEP_SUBTITLES: Record<number, ReactNode> = {
  0: 'Tell us who you are.',
  1: <>Where do people already follow you?</>,
  2: 'Tell partners who you reach.',
  3: 'What do you usually promote?',
  4: 'A quick identity check before you go live.',
  5: 'Last look before you submit.',
};

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs font-semibold text-gray-500 shrink-0">{label}</span>
      <span className="text-gray-800 text-right">{value || '—'}</span>
    </div>
  );
}
