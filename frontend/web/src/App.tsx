import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './core/auth/AuthContext';
import { ToastProvider } from './components/shared/Toast';

// Marketplace
import HomePage from './pages/marketplace/Home';
import ProductsPage from './pages/marketplace/Products';
import ProductDetailPage from './pages/marketplace/ProductDetail';
import CartPage from './pages/marketplace/Cart';
import CheckoutPage from './pages/marketplace/Checkout';
import OrderSuccessPage from './pages/marketplace/OrderSuccess';
import OrdersPage from './pages/marketplace/Orders';
import OrderDetailPage from './pages/marketplace/OrderDetail';
import CampaignsPage from './pages/marketplace/Campaigns';
import CampaignDetailPage from './pages/marketplace/CampaignDetail';
import ProfilePage from './pages/marketplace/Profile';
import InvitationLanding from './pages/marketplace/InvitationLanding';
import CreatorProfilePage from './pages/marketplace/CreatorProfile';
import CreatorsDirectory from './pages/marketplace/Creators';
import CampaignLinkLanding from './pages/marketplace/CampaignLinkLanding';

// Onboarding — reachable while logged out
import OnboardingChoose from './pages/onboarding/Choose';
import BecomePartner from './pages/onboarding/BecomePartner';
import BecomeCreator from './pages/onboarding/BecomeCreator';
import BecomeInfluencer from './pages/onboarding/BecomeInfluencer';

// Auth
import LoginPage from './pages/auth/Login';
import RegisterPage from './pages/auth/Register';

// Partner Portal
import PartnerDashboard from './pages/partner/Dashboard';
import PartnerProducts from './pages/partner/Products';
import PartnerProductForm from './pages/partner/ProductForm';
import PartnerCampaigns from './pages/partner/Campaigns';
import PartnerInfluencers from './pages/partner/Influencers';
import PartnerDocuments from './pages/partner/Documents';
import PartnerKYC from './pages/partner/KYC';
import PartnerAnalytics from './pages/partner/Analytics';
import PartnerOrders from './pages/partner/Orders';
import PartnerCampaignBuilder from './pages/partner/CampaignBuilder';
import PartnerCampaignDetail from './pages/partner/CampaignDetail';
import PartnerCreators from './pages/partner/Creators';

// Influencer Portal
import InfluencerDashboard from './pages/influencer/Dashboard';
import InfluencerCampaigns from './pages/influencer/Campaigns';
import InfluencerContent from './pages/influencer/Content';
import ContentUpload from './pages/influencer/ContentUpload';
import InfluencerDocuments from './pages/influencer/Documents';
import InfluencerKYC from './pages/influencer/KYC';
import InfluencerLinks from './pages/influencer/Links';
import InfluencerEarnings from './pages/influencer/Earnings';
import InfluencerChannels from './pages/influencer/Channels';

// Creator Portal
import CreatorDashboard from './pages/creator/Dashboard';
import CreatorProfileEdit from './pages/creator/Profile';
import CreatorCampaigns from './pages/creator/Campaigns';
import CreatorContent from './pages/creator/Content';
import CreatorContentUpload from './pages/creator/ContentUpload';
import CreatorPicks from './pages/creator/Picks';
import CreatorProducts from './pages/creator/Products';
import CreatorAnalytics from './pages/creator/Analytics';
import CreatorEarnings from './pages/creator/Earnings';

// Admin Portal
import AdminDashboard from './pages/admin/Dashboard';
import AdminApprovals from './pages/admin/Approvals';
import AuditLog from './pages/admin/AuditLog';
import MediaModeration from './pages/admin/MediaModeration';
import KYCManagement from './pages/admin/KYCManagement';
import AdminPartners from './pages/admin/Partners';
import AdminInfluencers from './pages/admin/Influencers';
import AdminProducts from './pages/admin/Products';
import AdminOrders from './pages/admin/Orders';
import UserManagement from './pages/admin/UserManagement';
import AdminWorkflows from './pages/admin/Workflows';
import AdminPolicies from './pages/admin/Policies';
import AdminShortLinks from './pages/admin/ShortLinks';
import AdminCreatorContent from './pages/admin/CreatorContent';
import AdminCreators from './pages/admin/Creators';

/** A person may create on ழ and promote off it from the same account. */
const CREATOR_ROLES = ['CREATOR', 'INFLUENCER'];

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { session } = useAuth();
  if (!session) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(session.user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Marketplace */}
      <Route path="/" element={<HomePage />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/products/:referenceId" element={<ProductDetailPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/campaigns" element={<CampaignsPage />} />
      <Route path="/campaigns/:referenceId" element={<CampaignDetailPage />} />
      <Route path="/i/:token" element={<InvitationLanding />} />
      <Route path="/c/:code" element={<CampaignLinkLanding />} />
      <Route path="/creators" element={<CreatorsDirectory />} />
      <Route path="/creators/:handle" element={<CreatorProfilePage />} />

      {/* Onboarding */}
      <Route path="/onboarding" element={<OnboardingChoose />} />
      <Route path="/onboarding/partner" element={<BecomePartner />} />
      <Route path="/onboarding/creator" element={<BecomeCreator />} />
      <Route path="/onboarding/influencer" element={<BecomeInfluencer />} />

      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected Marketplace */}
      <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
      <Route path="/order-success" element={<ProtectedRoute><OrderSuccessPage /></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
      <Route path="/orders/:referenceId" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

      {/* Partner Portal */}
      <Route path="/partner" element={<ProtectedRoute roles={['PARTNER']}><PartnerDashboard /></ProtectedRoute>} />
      <Route path="/partner/products" element={<ProtectedRoute roles={['PARTNER']}><PartnerProducts /></ProtectedRoute>} />
      <Route path="/partner/products/new" element={<ProtectedRoute roles={['PARTNER']}><PartnerProductForm /></ProtectedRoute>} />
      <Route path="/partner/campaigns" element={<ProtectedRoute roles={['PARTNER']}><PartnerCampaigns /></ProtectedRoute>} />
      <Route path="/partner/influencers" element={<ProtectedRoute roles={['PARTNER']}><PartnerInfluencers /></ProtectedRoute>} />
      <Route path="/partner/documents" element={<ProtectedRoute roles={['PARTNER']}><PartnerDocuments /></ProtectedRoute>} />
      <Route path="/partner/kyc" element={<ProtectedRoute roles={['PARTNER']}><PartnerKYC /></ProtectedRoute>} />
      <Route path="/partner/analytics" element={<ProtectedRoute roles={['PARTNER']}><PartnerAnalytics /></ProtectedRoute>} />
      <Route path="/partner/orders" element={<ProtectedRoute roles={['PARTNER']}><PartnerOrders /></ProtectedRoute>} />
      <Route path="/partner/campaigns/new" element={<ProtectedRoute roles={['PARTNER']}><PartnerCampaignBuilder /></ProtectedRoute>} />
      <Route path="/partner/campaigns/:referenceId" element={<ProtectedRoute roles={['PARTNER']}><PartnerCampaignDetail /></ProtectedRoute>} />
      <Route path="/partner/creators" element={<ProtectedRoute roles={['PARTNER']}><PartnerCreators /></ProtectedRoute>} />

      {/* Influencer Portal */}
      <Route path="/influencer" element={<ProtectedRoute roles={['INFLUENCER']}><InfluencerDashboard /></ProtectedRoute>} />
      <Route path="/influencer/campaigns" element={<ProtectedRoute roles={['INFLUENCER']}><InfluencerCampaigns /></ProtectedRoute>} />
      <Route path="/influencer/content" element={<ProtectedRoute roles={['INFLUENCER']}><InfluencerContent /></ProtectedRoute>} />
      <Route path="/influencer/content/new" element={<ProtectedRoute roles={['INFLUENCER']}><ContentUpload /></ProtectedRoute>} />
      <Route path="/influencer/documents" element={<ProtectedRoute roles={['INFLUENCER']}><InfluencerDocuments /></ProtectedRoute>} />
      <Route path="/influencer/kyc" element={<ProtectedRoute roles={['INFLUENCER']}><InfluencerKYC /></ProtectedRoute>} />
      <Route path="/influencer/links" element={<ProtectedRoute roles={['INFLUENCER', 'CREATOR']}><InfluencerLinks /></ProtectedRoute>} />
      <Route path="/influencer/earnings" element={<ProtectedRoute roles={['INFLUENCER', 'CREATOR']}><InfluencerEarnings /></ProtectedRoute>} />
      <Route path="/influencer/channels" element={<ProtectedRoute roles={['INFLUENCER', 'CREATOR']}><InfluencerChannels /></ProtectedRoute>} />

      {/* Creator Portal — INFLUENCER is allowed through because an account can
          hold both capabilities; `role` only decides the default landing page. */}
      <Route path="/creator" element={<ProtectedRoute roles={CREATOR_ROLES}><CreatorDashboard /></ProtectedRoute>} />
      <Route path="/creator/profile" element={<ProtectedRoute roles={CREATOR_ROLES}><CreatorProfileEdit /></ProtectedRoute>} />
      <Route path="/creator/campaigns" element={<ProtectedRoute roles={CREATOR_ROLES}><CreatorCampaigns /></ProtectedRoute>} />
      <Route path="/creator/content" element={<ProtectedRoute roles={CREATOR_ROLES}><CreatorContent /></ProtectedRoute>} />
      <Route path="/creator/content/new" element={<ProtectedRoute roles={CREATOR_ROLES}><CreatorContentUpload /></ProtectedRoute>} />
      <Route path="/creator/picks" element={<ProtectedRoute roles={CREATOR_ROLES}><CreatorPicks /></ProtectedRoute>} />
      <Route path="/creator/products" element={<ProtectedRoute roles={CREATOR_ROLES}><CreatorProducts /></ProtectedRoute>} />
      <Route path="/creator/analytics" element={<ProtectedRoute roles={CREATOR_ROLES}><CreatorAnalytics /></ProtectedRoute>} />
      <Route path="/creator/earnings" element={<ProtectedRoute roles={CREATOR_ROLES}><CreatorEarnings /></ProtectedRoute>} />

      {/* Admin Portal */}
      <Route path="/admin" element={<ProtectedRoute roles={['ADMIN', 'MAKER', 'CHECKER']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/approvals" element={<ProtectedRoute roles={['ADMIN', 'MAKER', 'CHECKER']}><AdminApprovals /></ProtectedRoute>} />
      <Route path="/admin/audit" element={<ProtectedRoute roles={['ADMIN', 'MAKER', 'CHECKER']}><AuditLog /></ProtectedRoute>} />
      <Route path="/admin/media" element={<ProtectedRoute roles={['ADMIN', 'MAKER', 'CHECKER']}><MediaModeration /></ProtectedRoute>} />
      <Route path="/admin/kyc" element={<ProtectedRoute roles={['ADMIN']}><KYCManagement /></ProtectedRoute>} />
      <Route path="/admin/partners" element={<ProtectedRoute roles={['ADMIN']}><AdminPartners /></ProtectedRoute>} />
      <Route path="/admin/influencers" element={<ProtectedRoute roles={['ADMIN']}><AdminInfluencers /></ProtectedRoute>} />
      <Route path="/admin/products" element={<ProtectedRoute roles={['ADMIN', 'MAKER', 'CHECKER']}><AdminProducts /></ProtectedRoute>} />
      <Route path="/admin/orders" element={<ProtectedRoute roles={['ADMIN']}><AdminOrders /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute roles={['ADMIN']}><UserManagement /></ProtectedRoute>} />
      <Route path="/admin/workflows" element={<ProtectedRoute roles={['ADMIN']}><AdminWorkflows /></ProtectedRoute>} />
      <Route path="/admin/policies" element={<ProtectedRoute roles={['ADMIN']}><AdminPolicies /></ProtectedRoute>} />
      <Route path="/admin/short-links" element={<ProtectedRoute roles={['ADMIN']}><AdminShortLinks /></ProtectedRoute>} />
      <Route path="/admin/creator-content" element={<ProtectedRoute roles={['ADMIN', 'MAKER', 'CHECKER']}><AdminCreatorContent /></ProtectedRoute>} />
      <Route path="/admin/creators" element={<ProtectedRoute roles={['ADMIN', 'MAKER', 'CHECKER']}><AdminCreators /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
