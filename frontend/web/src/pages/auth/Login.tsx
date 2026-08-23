import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import ZhaLogo from '../../components/shared/ZhaLogo';
import { useAuth } from '../../core/auth/AuthContext';

const DEMO_ACCOUNTS = [
  { email: 'customer@example.com', role: 'Customer', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { email: 'partner@example.com', role: 'Partner', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { email: 'creator@example.com', role: 'Creator', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { email: 'influencer@example.com', role: 'Influencer', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { email: 'admin@example.com', role: 'Admin', color: 'bg-brand-50 text-brand-700 border-brand-200' },
  { email: 'maker@example.com', role: 'Maker', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { email: 'checker@example.com', role: 'Checker', color: 'bg-rose-50 text-rose-700 border-rose-200' },
];

const ROLE_REDIRECT: Record<string, string> = {
  CUSTOMER: '/',
  PARTNER: '/partner',
  INFLUENCER: '/influencer',
  ADMIN: '/admin',
  MAKER: '/admin',
  CHECKER: '/admin',
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('demo123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent, overrideEmail?: string) => {
    e?.preventDefault();
    const loginEmail = overrideEmail ?? email;
    if (!loginEmail) return;

    setLoading(true);
    setError('');
    try {
      const user = await login(loginEmail, password);
      navigate(ROLE_REDIRECT[user.role] ?? '/');
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    handleLogin(null as unknown as React.FormEvent, demoEmail);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex transition-transform hover:scale-[1.03]" aria-label="ழ home">
            <ZhaLogo size={44} fill="translucent" wordmarkClass="text-white" />
          </Link>
          <p className="text-white/60 text-sm mt-2">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <h1 className="text-lg font-bold font-display text-gray-900 mb-6">Welcome back</h1>

          {/* Demo accounts */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Quick Demo Login</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.email}
                  onClick={() => handleDemoLogin(acc.email)}
                  disabled={loading}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg border ${acc.color} hover:opacity-80 text-left disabled:opacity-40`}
                >
                  {acc.role}
                </button>
              ))}
            </div>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center"><span className="bg-white px-2 text-xs text-gray-400">or sign in with email</span></div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-4">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-600 font-semibold hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
