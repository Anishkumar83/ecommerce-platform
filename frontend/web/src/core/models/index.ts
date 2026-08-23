// ─── Common entity fields ────────────────────────────────────────────────────

export interface BaseEntity {
  referenceId: string;
  typeCode?: string;
  subTypeCode?: string;
  versionNo: number;
  createdOn: string;
  createdBy: string;
  lastUpdatedOn: string;
  lastUpdatedBy: string;
  stageCode?: string;
  statusCode: string;
  activeCode: string;
  rowVersion: number;
}

// ─── Auth / Users ────────────────────────────────────────────────────────────

export type UserRole = 'CUSTOMER' | 'PARTNER' | 'CREATOR' | 'INFLUENCER' | 'ADMIN' | 'MAKER' | 'CHECKER';

/**
 * Creating on ழ and promoting off-platform are two capabilities, not two account
 * types. One person can hold either or both; `role` only decides which portal
 * they land in.
 */
export type ParticipantCapability = 'CREATOR' | 'INFLUENCER';

export interface User extends BaseEntity {
  name: string;
  email: string;
  mobile?: string;
  role: UserRole;
  avatarUrl?: string;
  lastLogin?: string;
  teamIds?: string[];
  /** Both may be present — see ParticipantCapability. */
  capabilities?: ParticipantCapability[];
  /** Links to the Creator profile that backs those capabilities. */
  creatorId?: string;
  partnerId?: string;
}

export interface AuthSession {
  user: User;
  token: string; // opaque, never displayed
}

// ─── Permissions ─────────────────────────────────────────────────────────────

export type Permission =
  | 'PARTNER_VIEW' | 'PARTNER_CREATE' | 'PARTNER_EDIT' | 'PARTNER_SUBMIT' | 'PARTNER_APPROVE' | 'PARTNER_REJECT'
  | 'INFLUENCER_VIEW' | 'INFLUENCER_CREATE' | 'INFLUENCER_EDIT' | 'INFLUENCER_APPROVE'
  | 'PRODUCT_VIEW' | 'PRODUCT_CREATE' | 'PRODUCT_EDIT' | 'PRODUCT_APPROVE' | 'PRODUCT_REJECT'
  | 'CAMPAIGN_VIEW' | 'CAMPAIGN_CREATE' | 'CAMPAIGN_EDIT' | 'CAMPAIGN_APPROVE'
  | 'ORDER_VIEW' | 'ORDER_MANAGE'
  | 'DOCUMENT_VIEW' | 'DOCUMENT_CREATE' | 'DOCUMENT_EDIT'
  | 'DOCUMENT_POLICY_VIEW' | 'DOCUMENT_POLICY_CREATE' | 'DOCUMENT_POLICY_EDIT' | 'DOCUMENT_POLICY_APPROVE'
  | 'WORKFLOW_VIEW' | 'WORKFLOW_CREATE' | 'WORKFLOW_EDIT' | 'WORKFLOW_APPROVE'
  | 'USER_VIEW' | 'USER_CREATE' | 'USER_EDIT'
  | 'ROLE_VIEW' | 'ROLE_CREATE' | 'ROLE_EDIT'
  | 'AUDIT_VIEW'
  | 'MEDIA_VIEW' | 'MEDIA_MODERATE'
  | 'KYC_VIEW' | 'KYC_MANAGE'
  | 'NOTIFICATION_VIEW'
  | 'SHORT_LINK_VIEW' | 'SHORT_LINK_CREATE'
  | 'CREATOR_VIEW' | 'CREATOR_CREATE' | 'CREATOR_EDIT' | 'CREATOR_APPROVE'
  | 'CREATOR_CONTENT_VIEW' | 'CREATOR_CONTENT_CREATE' | 'CREATOR_CONTENT_MODERATE'
  | 'CAMPAIGN_INVITE' | 'TRACKING_LINK_VIEW' | 'TRACKING_LINK_CREATE'
  | 'ATTRIBUTION_VIEW' | 'EARNINGS_VIEW';

export interface Role extends BaseEntity {
  name: string;
  description: string;
  permissions: Permission[];
  userCount: number;
}

// ─── Customer ────────────────────────────────────────────────────────────────

export interface Customer extends BaseEntity {
  name: string;
  email: string;
  mobile: string;
  avatarUrl?: string;
  addresses: Address[];
  wishlist: string[]; // product referenceIds
}

export interface Address {
  referenceId: string;
  fullName: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

// ─── Partner ─────────────────────────────────────────────────────────────────

export type PartnerStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED' | 'INACTIVE';

export interface Partner extends BaseEntity {
  name: string;
  businessName: string;
  category: string;
  email: string;
  phone: string;
  website?: string;
  logoUrl?: string;
  description: string;
  kycStatus: KycStatus;
  kycReferenceId?: string;
  partnerStatus: PartnerStatus;
  totalProducts: number;
  activeProducts: number;
  activeCampaigns: number;
  totalRevenue: number;
  totalOrders: number;
  rating: number;
}

// ─── Influencer ──────────────────────────────────────────────────────────────

export type InfluencerStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';

export interface Influencer extends BaseEntity {
  name: string;
  email: string;
  mobile: string;
  bio: string;
  avatarUrl: string;
  category: string; // Lifestyle, Tech, Fashion, etc.
  socialPlatforms: SocialPlatform[];
  followerCount: number;
  kycStatus: KycStatus;
  influencerStatus: InfluencerStatus;
  campaignIds: string[];
  totalContent: number;
  approvedContent: number;
  earnings: number;
}

export interface SocialPlatform {
  platform: 'INSTAGRAM' | 'YOUTUBE' | 'TIKTOK' | 'TWITTER' | 'FACEBOOK';
  handle: string;
  followers: number;
  url?: string;
}

// ─── Product ─────────────────────────────────────────────────────────────────

export type ProductPublishStatus = 'DRAFT' | 'MEDIA_PROCESSING' | 'SECURITY_SCAN' | 'MODERATION' | 'PENDING_APPROVAL' | 'PUBLISHED' | 'UNPUBLISHED' | 'REJECTED';
export type ModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'IN_PROGRESS';

export interface ProductVariant {
  referenceId: string;
  color?: string;
  size?: string;
  material?: string;
  sku: string;
  price: number;
  stock: number;
}

export interface ProductMedia {
  referenceId: string;
  type: 'IMAGE' | 'VIDEO';
  url: string;
  thumbnailUrl?: string;
  isPrimary: boolean;
  moderationStatus: ModerationStatus;
}

export interface Product extends BaseEntity {
  name: string;
  description: string;
  category: string;
  brand: string;
  partnerId: string;
  partnerName: string;
  price: number;
  mrp: number;
  discount: number;
  tax: number;
  sku: string;
  stock: number;
  weight?: number;
  dimensions?: string;
  rating: number;
  reviewCount: number;
  media: ProductMedia[];
  variants: ProductVariant[];
  publishStatus: ProductPublishStatus;
  moderationStatus: ModerationStatus;
  campaignIds: string[];
  tags: string[];
  isVerifiedPartner: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  specifications?: Record<string, string>;
  features?: string[];
  shippingInfo?: string;
  returnPolicy?: string;
}

// ─── Campaign ────────────────────────────────────────────────────────────────

export type CampaignStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'PAUSED' | 'ENDED' | 'REJECTED';

export interface Campaign extends BaseEntity {
  name: string;
  description: string;
  partnerId: string;
  partnerName: string;
  startDate: string;
  endDate: string;
  budget: number;
  targetAudience: string;
  productIds: string[];
  influencerIds: string[];
  status: CampaignStatus;
  bannerUrl?: string;
  contentRequirements?: string;
  totalContent: number;
  approvedContent: number;
  reach: number;
  clicks: number;

  // ── Added for creator + influencer collaboration ──
  /** Creator profile ids invited to this campaign. */
  creatorIds?: string[];
  /** Who this campaign recruits. Defaults to INFLUENCER for legacy campaigns. */
  campaignKind?: 'CREATOR' | 'INFLUENCER' | 'BOTH';
  /** Partners now create campaigns directly; ADMIN-created ones still exist. */
  createdByRole?: 'PARTNER' | 'ADMIN';
  reward?: RewardConfig;
  /** Is a physical sample sent to the creator? Drives the disclosure on reviews. */
  productSampleProvided?: boolean;
  deliverables?: string[];
  trackingLinkIds?: string[];
  orders?: number;
  revenue?: number;
}

// ─── Content ─────────────────────────────────────────────────────────────────

export type ContentType = 'IMAGE' | 'VIDEO' | 'SHORT_VIDEO' | 'STORY' | 'POST';
export type ContentStatus = 'UPLOADED' | 'PROCESSING' | 'SECURITY_SCAN' | 'MODERATION' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

export interface Content extends BaseEntity {
  title: string;
  description: string;
  caption: string;
  campaignId: string;
  campaignName: string;
  influencerId: string;
  influencerName: string;
  productId: string;
  productName: string;
  contentType: ContentType;
  mediaUrl: string;
  thumbnailUrl?: string;
  socialPlatform: string;
  contentStatus: ContentStatus;
  rejectionReason?: string;
  views: number;
  likes: number;
  shares: number;
}

// ─── Cart ────────────────────────────────────────────────────────────────────

export interface CartItem {
  referenceId: string;
  productId: string;
  productName: string;
  imageUrl: string;
  partnerId: string;
  partnerName: string;
  variantId?: string;
  variantLabel?: string;
  price: number;
  mrp: number;
  quantity: number;
  maxStock: number;
  savedForLater: boolean;
}

export interface Cart {
  customerId: string;
  items: CartItem[];
  couponCode?: string;
  discount: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
}

// ─── Order ───────────────────────────────────────────────────────────────────

export type OrderStatus = 'PLACED' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'RETURN_REQUESTED' | 'RETURNED';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
export type PaymentMethod = 'UPI' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'NET_BANKING' | 'CASH_ON_DELIVERY';

export interface OrderItem {
  referenceId: string;
  productId: string;
  productName: string;
  imageUrl: string;
  partnerId: string;
  partnerName: string;
  variantLabel?: string;
  price: number;
  quantity: number;
  total: number;
}

export interface OrderTimeline {
  status: OrderStatus;
  timestamp: string;
  description: string;
  completed: boolean;
}

export interface Order extends BaseEntity {
  customerId: string;
  customerName: string;
  items: OrderItem[];
  shippingAddress: Address;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentReferenceId?: string;
  orderStatus: OrderStatus;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  estimatedDelivery: string;
  timeline: OrderTimeline[];
  notes?: string;
}

// ─── Document ────────────────────────────────────────────────────────────────

export type DocumentStatus = 'PENDING' | 'UPLOADED' | 'PROCESSING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';

export interface Document extends BaseEntity {
  name: string;
  documentType: string;
  entityType: 'PARTNER' | 'INFLUENCER' | 'PRODUCT' | 'CAMPAIGN';
  entityId: string;
  entityName: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  documentStatus: DocumentStatus;
  rejectionReason?: string;
  expiryDate?: string;
  isPasswordProtected: boolean;
  ocrStatus?: string;
  uploadedBy: string;
}

export interface DocumentPolicy extends BaseEntity {
  name: string;
  entityType: string;
  stage: string;
  version: number;
  policyStatus: 'DRAFT' | 'ACTIVE' | 'DEPRECATED';
  rules: DocumentPolicyRule[];
  submittedBy?: string;
  approvedBy?: string;
}

export interface DocumentPolicyRule {
  documentType: string;
  required: boolean;
  allowedFormats: string[];
  maxSizeMb: number;
  maxCount: number;
  passwordProtectionRequired: boolean;
  ocrRequired: boolean;
  expiryValidation: boolean;
}

// ─── Media ───────────────────────────────────────────────────────────────────

export type MediaStatus = 'UPLOADED' | 'PROCESSING' | 'SECURITY_SCAN' | 'MODERATION' | 'APPROVED' | 'REJECTED' | 'FAILED';

export interface Media extends BaseEntity {
  name: string;
  entityType: string;
  entityId: string;
  entityName: string;
  mediaType: 'IMAGE' | 'VIDEO';
  url: string;
  thumbnailUrl?: string;
  fileSize: number;
  mimeType: string;
  mediaStatus: MediaStatus;
  securityScanResult?: string;
  moderationResult?: string;
  policyViolations?: string[];
  uploadedBy: string;
}

// ─── KYC ─────────────────────────────────────────────────────────────────────

export type KycStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface KycRecord extends BaseEntity {
  entityType: 'PARTNER' | 'INFLUENCER';
  entityId: string;
  entityName: string;
  kycStatus: KycStatus;
  providerReferenceId?: string;
  submittedOn?: string;
  verifiedOn?: string;
  rejectionReason?: string;
  identityType?: string;
  identityNumber?: string;
  timeline: KycTimelineEvent[];
}

export interface KycTimelineEvent {
  status: KycStatus;
  timestamp: string;
  description: string;
}

// ─── Workflow ────────────────────────────────────────────────────────────────

export type WorkflowStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'DEPRECATED';

export interface WorkflowStage {
  referenceId: string;
  name: string;
  actorRole: UserRole;
  requiredPermission: Permission;
  entrConditions?: string;
  exitConditions?: string;
  slaDays: number;
  actions: string[];
  order: number;
}

export interface Workflow extends BaseEntity {
  name: string;
  description: string;
  entityType: string;
  version: number;
  workflowStatus: WorkflowStatus;
  stages: WorkflowStage[];
  submittedBy?: string;
  approvedBy?: string;
}

// ─── Approval ────────────────────────────────────────────────────────────────

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REQUEST_CHANGES';
export type ApprovalEntityType = 'PARTNER' | 'INFLUENCER' | 'PRODUCT' | 'CAMPAIGN' | 'DOCUMENT_POLICY' | 'WORKFLOW' | 'MEDIA' | 'CONTENT';

export interface ApprovalRequest extends BaseEntity {
  entityType: ApprovalEntityType;
  entityId: string;
  entityName: string;
  submittedBy: string;
  submittedByRole: UserRole;
  approvalStatus: ApprovalStatus;
  checkerNotes?: string;
  approvedBy?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  slaDueDate: string;
  isSlaBreached: boolean;
}

// ─── Notification ────────────────────────────────────────────────────────────

export type NotificationCategory = 'ORDER' | 'CAMPAIGN' | 'PRODUCT' | 'APPROVAL' | 'DOCUMENT' | 'KYC' | 'MEDIA' | 'SYSTEM';

export interface Notification extends BaseEntity {
  userId: string;
  category: NotificationCategory;
  title: string;
  message: string;
  isRead: boolean;
  ctaUrl?: string;
  ctaLabel?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

// ─── Audit ───────────────────────────────────────────────────────────────────

export type AuditResult = 'SUCCESS' | 'FAILURE' | 'PARTIAL';

export interface AuditRecord {
  referenceId: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  entityType: string;
  entityReferenceId: string;
  correlationId: string;
  result: AuditResult;
  details?: string;
  ipAddress?: string;
}

// ─── Short Links ─────────────────────────────────────────────────────────────

export type ShortLinkType = 'INVITATION' | 'CAMPAIGN' | 'PRODUCT' | 'NOTIFICATION';
export type ShortLinkStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED';

export interface ShortLink extends BaseEntity {
  shortCode: string;
  destinationType: ShortLinkType;
  destinationReference: string;
  longUrl: string;
  shortUrl: string;
  createdByName: string;
  expiryDate?: string;
  linkStatus: ShortLinkStatus;
  clicks: number;
}

// ─── Invitation ──────────────────────────────────────────────────────────────

export type InvitationStatus = 'SENT' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';

export interface Invitation extends BaseEntity {
  token: string;
  partnerId: string;
  partnerName: string;
  campaignId: string;
  campaignName: string;
  influencerEmail?: string;
  invitationStatus: InvitationStatus;
  shortUrl: string;
  productCount: number;
  expiryDate: string;
  acceptedBy?: string;
}

// ─── Paginated Response ──────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  code: number;
  message: string;
  details?: string;
}

// ─── Filter / Sort types ─────────────────────────────────────────────────────

export interface ProductFilters {
  search?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  availability?: boolean;
  partnerId?: string;
  campaignId?: string;
  publishStatus?: ProductPublishStatus;
  sortBy?: 'recommended' | 'price_asc' | 'price_desc' | 'newest' | 'rating' | 'popular';
  page?: number;
  pageSize?: number;
}

export interface Task {
  referenceId: string;
  title: string;
  description: string;
  entityType: ApprovalEntityType;
  entityId: string;
  entityName: string;
  assignedTo: string;
  dueDate: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  taskStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  createdOn: string;
}

// ─── Creator ─────────────────────────────────────────────────────────────────
//
// A Creator is a first-class participant, distinct from a customer. They receive
// or buy a product, use it, and publish photos, video and reviews *on ழ itself*.
// An Influencer promotes to an audience that lives *outside* ழ and is paid on
// tracked sales. The same person can do both — see ParticipantCapability — so
// both live on one profile rather than two account types.

export type CreatorStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';

export interface Creator extends BaseEntity {
  name: string;
  handle: string;
  email: string;
  mobile?: string;
  bio: string;
  avatarUrl: string;
  coverUrl?: string;
  categories: string[];
  /** CREATOR, INFLUENCER, or both. Never empty. */
  capabilities: ParticipantCapability[];
  /** Only meaningful when capabilities includes INFLUENCER. */
  socialPlatforms: SocialPlatform[];
  /** Audience off-platform. */
  followerCount: number;
  /** Audience on ழ. */
  zhaFollowers: number;
  isVerified: boolean;
  creatorStatus: CreatorStatus;
  kycStatus: KycStatus;
  /** Set when this profile also exists as a legacy Influencer record. */
  influencerId?: string;

  // Aggregate metrics (mock)
  contentPublished: number;
  productsReviewed: number;
  totalViews: number;
  totalClicks: number;
  attributedOrders: number;
  revenueGenerated: number;
  pendingEarnings: number;
  lifetimeEarnings: number;
  campaignIds: string[];
  joinedOn: string;
}

// ─── Creator content ─────────────────────────────────────────────────────────

export type CreatorContentKind = 'PHOTO' | 'VIDEO' | 'REVIEW' | 'STYLING' | 'RECOMMENDATION';

/**
 * The moderation pipeline the frontend reflects:
 *   UPLOADING → SCANNING → UNDER_REVIEW → APPROVED → PUBLISHED
 * with REJECTED / SUSPENDED as terminal branches. No real moderation service
 * runs behind this yet; the states exist so the UI already matches the
 * architecture the backend will grow into.
 */
export type CreatorContentState =
  | 'DRAFT' | 'UPLOADING' | 'SCANNING' | 'UNDER_REVIEW'
  | 'APPROVED' | 'PUBLISHED' | 'REJECTED' | 'SUSPENDED';

export interface ModerationEvent {
  state: CreatorContentState;
  timestamp: string;
  description: string;
  actor?: string;
}

export interface CreatorContent extends BaseEntity {
  creatorId: string;
  creatorName: string;
  creatorHandle: string;
  creatorAvatarUrl: string;
  creatorVerified: boolean;

  productId: string;
  productName: string;
  productImageUrl: string;
  productPrice: number;
  partnerId?: string;
  partnerName?: string;

  campaignId?: string;
  campaignName?: string;

  kind: CreatorContentKind;
  title: string;
  body: string;
  /** 1–5, present on REVIEW and RECOMMENDATION. */
  rating?: number;

  mediaUrl: string;
  thumbnailUrl: string;
  /** Short looping clip shown on hover in Top Picks. */
  videoPreviewUrl?: string;
  aspect?: 'PORTRAIT' | 'SQUARE' | 'LANDSCAPE';

  state: CreatorContentState;
  moderationEvents: ModerationEvent[];
  rejectionReason?: string;

  /**
   * True when the creator got the product through a partner campaign rather than
   * buying it. Surfaces as the "Product provided for review" disclosure.
   */
  providedForReview: boolean;
  isTopPick: boolean;
  publishedOn?: string;

  views: number;
  likes: number;
  saves: number;
  shares: number;
  clicks: number;
  attributedOrders: number;
}

// ─── Rewards ─────────────────────────────────────────────────────────────────
//
// Deliberately never called "margin" in the UI. Configuration only — no
// settlement logic runs behind any of this yet.

export type RewardModel = 'PERCENTAGE' | 'FIXED' | 'TIERED';

export interface CommissionTier {
  minSales: number;
  /** null means "and above". */
  maxSales: number | null;
  percentage: number;
}

export interface RewardConfig {
  /** Flat fee paid for producing the content, regardless of sales. */
  contentFee: number;
  model: RewardModel;
  /** Used when model is PERCENTAGE. */
  percentage?: number;
  /** Used when model is FIXED — a flat amount per attributed order. */
  fixedAmount?: number;
  /** Used when model is TIERED. */
  tiers?: CommissionTier[];
  /** How long after a click an order still attributes. */
  cookieWindowDays: number;
}

export type EarningKind = 'CONTENT_FEE' | 'SALES_COMMISSION' | 'BONUS';
export type EarningState = 'PENDING' | 'APPROVED' | 'PAID';

export interface EarningRecord extends BaseEntity {
  participantId: string;
  participantRole: ParticipantCapability;
  campaignId?: string;
  campaignName?: string;
  productName?: string;
  kind: EarningKind;
  state: EarningState;
  /** The sale the commission was computed from. */
  eligibleSale?: number;
  /** Percentage applied, when the kind is SALES_COMMISSION. */
  rate?: number;
  amount: number;
  earnedOn: string;
  paidOn?: string;
}

// ─── Campaign participation ──────────────────────────────────────────────────

export type ParticipationState =
  | 'INVITED' | 'ACCEPTED' | 'DECLINED'
  | 'PRODUCT_SHIPPED' | 'PRODUCT_RECEIVED'
  | 'CONTENT_PENDING' | 'CONTENT_SUBMITTED' | 'UNDER_REVIEW'
  | 'APPROVED' | 'REJECTED' | 'PUBLISHED'
  | 'PROMOTING' | 'COMPLETED';

export interface ParticipationEvent {
  state: ParticipationState;
  timestamp: string;
  description: string;
  actor?: string;
}

/**
 * One participant's involvement in one campaign. Creators run
 * INVITED → ACCEPTED → PRODUCT_RECEIVED → CONTENT_SUBMITTED → UNDER_REVIEW → PUBLISHED.
 * Influencers run INVITED → ACCEPTED → PROMOTING → COMPLETED against a tracking link.
 */
export interface CampaignParticipation extends BaseEntity {
  campaignId: string;
  campaignName: string;
  partnerId: string;
  partnerName: string;

  participantId: string;
  participantName: string;
  participantHandle: string;
  participantAvatarUrl: string;
  participantRole: ParticipantCapability;

  state: ParticipationState;
  invitedOn: string;
  respondedOn?: string;
  dueDate: string;

  productIds: string[];
  productNames: string[];
  productSampleProvided: boolean;
  trackingLinkId?: string;
  contentIds: string[];

  reward: RewardConfig;
  contentFeeState: EarningState;
  timeline: ParticipationEvent[];
  notes?: string;
}

// ─── Tracking links ──────────────────────────────────────────────────────────

export type TrackingChannel = 'SOCIAL' | 'EMAIL' | 'SMS' | 'QR' | 'DIRECT' | 'ZHA_CONTENT';

export interface TrackingStats {
  clicks: number;
  uniqueVisitors: number;
  productViews: number;
  addToCart: number;
  orders: number;
  revenue: number;
  /** Percentage, 0–100. */
  conversionRate: number;
  commission: number;
}

/**
 * A short, opaque campaign URL — zha.example/c/A7xK92. The code identifies the
 * campaign, the product and the attributed participant; no database id is ever
 * exposed in the URL.
 */
export interface TrackingLink extends BaseEntity {
  shortCode: string;
  shortUrl: string;
  longUrl: string;
  campaignId: string;
  campaignName: string;
  productId?: string;
  productName?: string;
  attributedToId: string;
  attributedToName: string;
  attributedToRole: ParticipantCapability;
  channel: TrackingChannel;
  linkStatus: ShortLinkStatus;
  createdByName: string;
  expiryDate?: string;
  stats: TrackingStats;
}

// ─── Attribution ─────────────────────────────────────────────────────────────

export interface AttributionRecord {
  referenceId: string;
  campaignId: string;
  campaignName: string;
  participantId: string;
  participantName: string;
  participantHandle: string;
  participantAvatarUrl: string;
  participantRole: ParticipantCapability;
  /** Present for link-driven attribution, absent for on-platform content. */
  trackingCode?: string;
  /** Where the activity came from: ழ content, or an external tracked link. */
  source: 'ZHA_CONTENT' | 'TRACKING_LINK';
  views: number;
  clicks: number;
  orders: number;
  revenue: number;
  commission: number;
  contentFee: number;
  period: string;
}

// ─── Onboarding ──────────────────────────────────────────────────────────────

export type ApplicationKind = 'PARTNER' | 'CREATOR' | 'INFLUENCER';
export type ApplicationState = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

export interface OnboardingApplication extends BaseEntity {
  kind: ApplicationKind;
  applicantName: string;
  email: string;
  mobile?: string;
  categories: string[];
  socialPlatforms?: SocialPlatform[];
  contentPreferences?: string[];
  audienceSize?: number;
  applicationState: ApplicationState;
  submittedOn?: string;
}
