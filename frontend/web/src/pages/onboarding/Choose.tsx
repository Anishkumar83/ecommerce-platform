import { Link } from 'react-router-dom';
import { Building2, Camera, Megaphone, ArrowRight, Sparkles } from 'lucide-react';
import ZhaLogo from '../../components/shared/ZhaLogo';

const ROLES = [
  {
    to: '/onboarding/partner',
    icon: Building2,
    accent: 'bg-blue-50 text-blue-600',
    title: 'Partner',
    body: (
      <>
        List products, run campaigns, and recruit creators and influencers to sell for you. You keep the revenue from
        every order and pay Content Fee and Sales Commission only on what your campaigns generate.
      </>
    ),
    earns: 'Earns: revenue from every order placed',
  },
  {
    to: '/onboarding/creator',
    icon: Camera,
    accent: 'bg-purple-50 text-purple-600',
    title: 'Creator',
    body: (
      <>
        Receive or buy a product, use it, then publish photos, video and written reviews directly on{' '}
        <span className="font-tamil">ழ</span>. Your reviews live where shoppers are already deciding.
      </>
    ),
    earns: 'Earns: Content Fee + Sales Commission',
  },
  {
    to: '/onboarding/influencer',
    icon: Megaphone,
    accent: 'bg-amber-50 text-amber-600',
    title: 'Influencer',
    body: (
      <>
        Promote campaign products to your audience on Instagram, YouTube or Facebook through a tracked short link, and
        get credit for every order it drives.
      </>
    ),
    earns: 'Earns: Sales Commission on attributed orders',
  },
];

export default function OnboardingChoose() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 flex flex-col items-center px-4 py-10 sm:py-14">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <ZhaLogo size={44} fill="translucent" wordmarkClass="text-white" />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white">How do you want to join?</h1>
          <p className="text-white/60 text-sm mt-2 max-w-md mx-auto">
            Pick the path that fits you best — you can add the others later without starting over.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {ROLES.map(role => (
            <Link
              key={role.to}
              to={role.to}
              className="group bg-white rounded-2xl p-6 shadow-2xl hover:-translate-y-1 transition-transform flex flex-col"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${role.accent}`}>
                <role.icon size={22} />
              </div>
              <h2 className="text-lg font-bold font-display text-gray-900 mb-2">{role.title}</h2>
              <p className="text-sm text-gray-600 grow mb-4">{role.body}</p>
              <p className="text-xs font-semibold text-gray-500 mb-4">{role.earns}</p>
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-600 group-hover:gap-2.5 transition-all">
                Get started <ArrowRight size={15} />
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-8 max-w-xl mx-auto bg-white/10 border border-white/15 rounded-2xl p-5 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <Sparkles size={16} className="text-white" />
          </div>
          <p className="text-sm text-white/80">
            <strong className="text-white">Not sure? You can do both.</strong> Creator and Influencer are capabilities
            on one profile, not separate account types — apply as either one first, and the last step of that
            application offers to add the other. Partner is a separate business account.
          </p>
        </div>

        <p className="text-center text-xs text-white/40 mt-8">
          Already have an account?{' '}
          <Link to="/login" className="text-white/70 font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
