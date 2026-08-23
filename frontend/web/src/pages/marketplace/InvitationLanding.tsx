import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Users, Star, TrendingUp, AlertTriangle } from 'lucide-react';
import ZhaLogo from '../../components/shared/ZhaLogo';
import { influencerService } from '../../core/services/influencer.service';
import type { Invitation } from '../../core/models';

export default function InvitationLanding() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    influencerService.getInvitationByToken(token).then(inv => {
      setInvitation(inv);
      setLoading(false);
    }).catch(() => {
      setError('This invitation link is invalid or has expired.');
      setLoading(false);
    });
  }, [token]);

  const handleAccept = async () => {
    if (!invitation) return;
    setAccepting(true);
    await influencerService.acceptInvitation(invitation.token);
    setAccepting(false);
    setAccepted(true);
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 to-brand-800 flex items-center justify-center">
      <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 to-brand-800 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={28} className="text-red-400" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Invalid Invitation</h2>
        <p className="text-sm text-gray-500 mb-5">{error}</p>
        <button onClick={() => navigate('/')} className="px-5 py-2.5 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700">
          Go to Homepage
        </button>
      </div>
    </div>
  );

  if (accepted) return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 to-brand-800 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
        <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={28} className="text-green-500" />
        </div>
        <h2 className="text-xl font-extrabold font-display text-gray-900 mb-2">You're In!</h2>
        <p className="text-sm text-gray-500 mb-6">Your collaboration with {invitation?.partnerName} has started. Log in to your creator portal to get started.</p>
        <button onClick={() => navigate('/login')} className="w-full py-3 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700">
          Log In as Creator
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-purple-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center mb-2">
            <ZhaLogo size={44} fill="translucent" wordmarkClass="text-white" />
          </div>
          <p className="text-white/60 text-sm">Creator Partnership Platform</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users size={28} className="text-purple-500" />
            </div>
            <h1 className="text-xl font-extrabold font-display text-gray-900 mb-1">You've Been Invited!</h1>
            <p className="text-sm text-gray-600">
              <strong>{invitation?.partnerName}</strong> wants to collaborate with you as a brand creator on <span className="font-tamil font-semibold">ழ</span>.
            </p>
          </div>

          {invitation?.influencerEmail && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl text-sm text-gray-700 italic mb-6">
              Invited as "{invitation.influencerEmail}"
            </div>
          )}

          {/* Benefits */}
          <div className="space-y-3 mb-6">
            {[
              { icon: TrendingUp, text: 'Earn commissions on every sale through your links' },
              { icon: Star, text: 'Get exclusive products to review and promote' },
              { icon: Users, text: 'Join a growing community of 500+ creators' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                  <item.icon size={14} className="text-purple-600" />
                </div>
                <p className="text-sm text-gray-700">{item.text}</p>
              </div>
            ))}
          </div>

          <button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full py-3 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {accepting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {accepting ? 'Accepting...' : 'Accept Invitation & Join'}
          </button>

          <p className="text-xs text-center text-gray-400 mt-3">By accepting, you agree to the <span className="font-tamil">ழ</span> creator terms of service.</p>
        </div>
      </div>
    </div>
  );
}
