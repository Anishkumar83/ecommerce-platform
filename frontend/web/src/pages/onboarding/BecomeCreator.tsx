import { useState, useEffect, useRef, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle, Sparkles, Camera, Video, Package, Newspaper,
  Plus, Trash2, Loader2, Check, X, ArrowRight,
} from 'lucide-react';
import OnboardingShell from '../../components/shared/OnboardingShell';
import PlatformIcon, { PLATFORM_OPTIONS, platformLabel } from '../../components/shared/PlatformIcon';
import { useToast } from '../../components/shared/Toast';
import { creatorService } from '../../core/services/creator.service';
import type { SocialPlatform, OnboardingApplication } from '../../core/models';

const CATEGORIES = ['Electronics', 'Fashion', 'Beauty', 'Home & Living', 'Fitness', 'Travel', 'Food & Beverage', 'Accessories', 'Lifestyle'];

const CONTENT_PREFS = [
  { key: 'PHOTO_REVIEWS', label: 'Photo reviews', icon: Camera },
  { key: 'VIDEO_REVIEWS', label: 'Video reviews', icon: Video },
  { key: 'STYLING', label: 'Styling & try-on', icon: Sparkles },
  { key: 'UNBOXING', label: 'Unboxing', icon: Package },
  { key: 'LONG_FORM', label: 'Long-form write-ups', icon: Newspaper },
];

const CADENCE_OPTIONS = ['Weekly', 'A few times a month', 'Monthly', 'As campaigns come in'];
const IDENTITY_TYPES = ['Aadhaar', 'PAN', 'Passport', 'Driving License'];

// Mock: a handle is "taken" if it collides with a seeded demo creator's name.
const TAKEN_HANDLES = ['ananya', 'meera', 'vikram', 'rohan', 'divya', 'admin', 'test', 'zha'];

const STEPS = ['Personal Information', 'Creator Profile', 'Categories', 'Social Links', 'Content Preferences', 'Verification', 'Submit'];

interface PlatformRow {
  id: number;
  platform: SocialPlatform['platform'];
  handle: string;
  followers: string;
  url: string;
}

const inputCls = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20';
const labelCls = 'block text-xs font-semibold text-gray-600 mb-1.5';

export default function BecomeCreator() {
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
  const [handle, setHandle] = useState('');
  const [handleStatus, setHandleStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Step 2
  const [categories, setCategories] = useState<string[]>([]);

  // Step 3
  const [platforms, setPlatforms] = useState<PlatformRow[]>([]);
  const nextRowId = useRef(1);

  // Step 4
  const [contentPrefs, setContentPrefs] = useState<string[]>([]);
  const [cadence, setCadence] = useState(CADENCE_OPTIONS[0]);

  // Step 5
  const [identityType, setIdentityType] = useState('');
  const [identityNumber, setIdentityNumber] = useState('');
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    if (!handle.trim()) { setHandleStatus('idle'); return; }
    setHandleStatus('checking');
    if (checkTimer.current) clearTimeout(checkTimer.current);
    checkTimer.current = setTimeout(() => {
      const taken = TAKEN_HANDLES.includes(handle.trim().toLowerCase());
      setHandleStatus(taken ? 'taken' : 'available');
    }, 600);
    return () => { if (checkTimer.current) clearTimeout(checkTimer.current); };
  }, [handle]);

  const cleanHandle = handle.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

  const toggleCategory = (c: string) => {
    setCategories(prev => (prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]));
  };

  const toggleContentPref = (key: string) => {
    setContentPrefs(prev => (prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key]));
  };

  const addPlatformRow = () => {
    const used = platforms.map(p => p.platform);
    const available = PLATFORM_OPTIONS.find(p => !used.includes(p)) ?? PLATFORM_OPTIONS[0];
    setPlatforms(prev => [...prev, { id: nextRowId.current++, platform: available, handle: '', followers: '', url: '' }]);
  };

  const updatePlatformRow = (id: number, patch: Partial<PlatformRow>) => {
    setPlatforms(prev => prev.map(p => (p.id === id ? { ...p, ...patch } : p)));
  };

  const removePlatformRow = (id: number) => {
    setPlatforms(prev => prev.filter(p => p.id !== id));
  };

  // ── Per-step validation ──────────────────────────────────────────────────
  const emailValid = /^\S+@\S+\.\S+$/.test(email);
  const mobileValid = mobile.replace(/\D/g, '').length >= 10;

  let disabledReason = '';
  if (step === 0) {
    if (!name.trim()) disabledReason = 'Enter your full name';
    else if (!emailValid) disabledReason = 'Enter a valid email address';
    else if (!mobileValid) disabledReason = 'Enter a valid mobile number';
  } else if (step === 1) {
    if (!cleanHandle) disabledReason = 'Choose a handle';
    else if (handleStatus === 'checking') disabledReason = 'Checking handle availability…';
    else if (handleStatus === 'taken') disabledReason = 'That handle is taken — try another';
    else if (!bio.trim()) disabledReason = 'Add a short bio';
  } else if (step === 2) {
    if (categories.length === 0) disabledReason = 'Add at least one category';
  } else if (step === 4) {
    if (contentPrefs.length === 0) disabledReason = 'Pick at least one content type';
  } else if (step === 5) {
    if (!identityType) disabledReason = 'Select an identity document type';
    else if (!identityNumber.trim()) disabledReason = 'Enter your identity document number';
    else if (!consent) disabledReason = 'You must agree to the content guidelines';
  }
  const nextDisabled = disabledReason !== '';

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const socialPlatforms: SocialPlatform[] = platforms
        .filter(p => p.handle.trim())
        .map(p => ({ platform: p.platform, handle: p.handle.trim(), followers: Number(p.followers) || 0, url: p.url.trim() || undefined }));
      const contentPreferences = [
        ...contentPrefs.map(key => CONTENT_PREFS.find(c => c.key === key)?.label ?? key),
        `Posting cadence: ${cadence}`,
      ];
      const app = await creatorService.submitApplication('CREATOR', {
        name: name.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        categories,
        socialPlatforms: socialPlatforms.length > 0 ? socialPlatforms : undefined,
        contentPreferences,
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
            We will email you at <strong>{result.email}</strong> once your Creator application has been reviewed.
          </p>
        </div>

        <div className="bg-gray-50 rounded-xl p-5 mb-6 text-left">
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">What happens next</h2>
          <ol className="space-y-2.5">
            {[
              'Our team reviews your profile and content preferences, usually within 24-48 hours.',
              'Once approved, your creator profile goes live and partners can start inviting you.',
              'You will receive your first campaign invitation with a product to review on ',
            ].map((text, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                <span>{text}{i === 2 && <span className="font-tamil font-semibold">ழ</span>}.</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="border border-brand-200 bg-brand-50 rounded-xl p-5 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0">
              <ArrowRight size={16} className="text-brand-600" />
            </div>
            <div className="grow">
              <p className="text-sm font-bold text-gray-900">Also become an Influencer</p>
              <p className="text-xs text-gray-600 mt-0.5 mb-3">
                Creator and Influencer are separate capabilities on the same profile. Add Influencer to also promote
                campaigns to your audience outside <span className="font-tamil">ழ</span> and earn Sales Commission on tracked links.
              </p>
              <button
                onClick={() => navigate('/onboarding/influencer')}
                className="px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl hover:bg-brand-700"
              >
                Start Influencer Application
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
            <input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="Rahul Kumar" />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input className={inputCls} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="rahul@example.com" />
          </div>
          <div>
            <label className={labelCls}>Mobile</label>
            <input className={inputCls} type="tel" value={mobile} onChange={e => setMobile(e.target.value)} placeholder="+91 98765 43210" />
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Handle</label>
            <div className="relative">
              <input
                className={`${inputCls} pr-9`}
                value={handle}
                onChange={e => setHandle(e.target.value)}
                placeholder="rahulreviews"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                {handleStatus === 'checking' && <Loader2 size={15} className="text-gray-400 animate-spin" />}
                {handleStatus === 'available' && <Check size={15} className="text-green-500" />}
                {handleStatus === 'taken' && <X size={15} className="text-red-500" />}
              </span>
            </div>
            <p className={`text-xs mt-1.5 font-mono ${handleStatus === 'taken' ? 'text-red-500' : 'text-gray-400'}`}>
              zha.example/creators/@{cleanHandle || 'your-handle'}
            </p>
            {handleStatus === 'taken' && <p className="text-xs text-red-500 mt-1">That handle is already in use.</p>}
            {handleStatus === 'available' && <p className="text-xs text-green-600 mt-1">This handle is available.</p>}
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className={labelCls}>Bio</label>
              <span className={`text-xs ${bio.length > 280 ? 'text-red-500' : 'text-gray-400'}`}>{bio.length}/280</span>
            </div>
            <textarea
              className={`${inputCls} min-h-[90px] resize-none`}
              value={bio}
              maxLength={280}
              onChange={e => setBio(e.target.value)}
              placeholder="Tell us what you love to review and who follows your recommendations."
            />
          </div>
          <div>
            <label className={labelCls}>Avatar URL (optional)</label>
            <input className={inputCls} value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://…" />
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <p className="text-sm text-gray-500 mb-4">Pick the categories you create content about most.</p>
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
          <div className="p-3.5 bg-brand-50 border border-brand-100 rounded-xl text-xs text-brand-800 mb-4">
            Optional. Add your social profiles here and we will also enable the <strong>Influencer</strong> capability on
            your account, so you can promote campaigns outside <span className="font-tamil font-semibold">ழ</span> too.
          </div>
          <div className="space-y-3">
            {platforms.map(row => (
              <div key={row.id} className="flex items-start gap-2 p-3 border border-gray-200 rounded-xl">
                <div className="flex items-center gap-1.5 shrink-0 mt-2.5">
                  <PlatformIcon platform={row.platform} size={16} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 grow">
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
                  <input
                    className={inputCls}
                    placeholder="Followers (optional)"
                    inputMode="numeric"
                    value={row.followers}
                    onChange={e => updatePlatformRow(row.id, { followers: e.target.value.replace(/\D/g, '') })}
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

      {step === 4 && (
        <div className="space-y-5">
          <div>
            <p className="text-sm text-gray-500 mb-3">What kind of content do you like to make?</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {CONTENT_PREFS.map(({ key, label, icon: Icon }) => {
                const active = contentPrefs.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleContentPref(key)}
                    className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold border text-left transition-colors ${
                      active ? 'bg-brand-50 border-brand-300 text-brand-700' : 'bg-white border-gray-200 text-gray-700 hover:border-brand-300'
                    }`}
                  >
                    <Icon size={15} className={active ? 'text-brand-600' : 'text-gray-400'} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className={labelCls}>Preferred posting cadence</label>
            <select className={inputCls} value={cadence} onChange={e => setCadence(e.target.value)}>
              {CADENCE_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      )}

      {step === 5 && (
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
              I agree to the <span className="font-tamil">ழ</span> content guidelines, including honest disclosure when a
              product was provided for review.
            </span>
          </label>
        </div>
      )}

      {step === 6 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Review your application before you submit it.</p>
          <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm">
            <SummaryRow label="Name" value={name} />
            <SummaryRow label="Email" value={email} />
            <SummaryRow label="Mobile" value={mobile} />
            <SummaryRow label="Handle" value={`@${cleanHandle}`} />
            <SummaryRow label="Categories" value={categories.join(', ')} />
            <SummaryRow label="Content types" value={contentPrefs.map(k => CONTENT_PREFS.find(c => c.key === k)?.label).join(', ')} />
            <SummaryRow label="Cadence" value={cadence} />
            <SummaryRow label="Social links" value={platforms.length > 0 ? `${platforms.length} added (Influencer capability too)` : 'None added'} />
          </div>
          <p className="text-xs text-gray-400">
            By submitting, you are applying for the Creator capability on <span className="font-tamil">ழ</span>.
            {platforms.length > 0 && ' Since you added social links, we will also apply for the Influencer capability.'}
          </p>
        </div>
      )}
    </OnboardingShell>
  );
}

const STEP_SUBTITLES: Record<number, ReactNode> = {
  0: 'Tell us who you are.',
  1: <>This is how buyers will find you on <span className="font-tamil">ழ</span>.</>,
  2: 'What do you create content about?',
  3: 'Link your social profiles.',
  4: 'Help partners understand your style.',
  5: 'A quick identity check before you go live.',
  6: 'Last look before you submit.',
};

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs font-semibold text-gray-500 shrink-0">{label}</span>
      <span className="text-gray-800 text-right">{value || '—'}</span>
    </div>
  );
}
