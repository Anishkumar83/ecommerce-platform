import type {
  Creator, CreatorContent, CreatorContentKind, CreatorContentState,
  CampaignParticipation, ParticipationState, TrackingLink, TrackingChannel,
  AttributionRecord, EarningRecord, RewardConfig, ModerationEvent,
  ParticipantCapability, ParticipationEvent,
} from '../models';
import { MOCK_PRODUCTS } from './data';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const d = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000).toISOString();
const future = (days: number) => new Date(Date.now() + days * 86400000).toISOString();

/** Shared BaseEntity boilerplate so the seeds below stay readable. */
function base(id: string, createdDaysAgo: number, by = 'system', status = 'ACTIVE', active = 'Y') {
  return {
    referenceId: id,
    versionNo: 1,
    statusCode: status,
    activeCode: active,
    rowVersion: 1,
    createdOn: d(createdDaysAgo),
    createdBy: by,
    lastUpdatedOn: d(Math.max(0, createdDaysAgo - 2)),
    lastUpdatedBy: by,
  };
}

/** Pulls the real product record so denormalised fields never drift from it. */
function product(id: string) {
  const p = MOCK_PRODUCTS.find(x => x.referenceId === id);
  const media = p?.media?.find(m => m.isPrimary) ?? p?.media?.[0];
  return {
    productId: id,
    productName: p?.name ?? 'Unknown product',
    productImageUrl: media?.url ?? '',
    productPrice: p?.price ?? 0,
    partnerId: p?.partnerId,
    partnerName: p?.partnerName,
  };
}

/** Builds the moderation trail for a piece of content in a given end state. */
function trail(state: CreatorContentState, daysAgo: number): ModerationEvent[] {
  const steps: { s: CreatorContentState; label: string }[] = [
    { s: 'UPLOADING', label: 'Media uploaded by creator' },
    { s: 'SCANNING', label: 'Automated safety scan completed' },
    { s: 'UNDER_REVIEW', label: 'Queued for human review' },
    { s: 'APPROVED', label: 'Approved by moderation' },
    { s: 'PUBLISHED', label: 'Published on ழ' },
  ];
  const order: CreatorContentState[] = ['UPLOADING', 'SCANNING', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED'];
  const idx = order.indexOf(state);

  if (state === 'REJECTED') {
    return [
      { state: 'UPLOADING', timestamp: d(daysAgo + 2), description: steps[0].label },
      { state: 'SCANNING', timestamp: d(daysAgo + 2), description: steps[1].label },
      { state: 'UNDER_REVIEW', timestamp: d(daysAgo + 1), description: steps[2].label },
      { state: 'REJECTED', timestamp: d(daysAgo), description: 'Rejected — product packaging not clearly visible', actor: 'Moderation' },
    ];
  }
  if (state === 'SUSPENDED') {
    return [
      ...trail('PUBLISHED', daysAgo + 6),
      { state: 'SUSPENDED', timestamp: d(daysAgo), description: 'Suspended pending a partner claim review', actor: 'Moderation' },
    ];
  }
  const upto = idx < 0 ? 0 : idx;
  return steps.slice(0, upto + 1).map((st, i) => ({
    state: st.s,
    timestamp: d(daysAgo + (upto - i)),
    description: st.label,
  }));
}

// ─── Reward presets ──────────────────────────────────────────────────────────

export const TIERED_REWARD: RewardConfig = {
  contentFee: 2500,
  model: 'TIERED',
  tiers: [
    { minSales: 0, maxSales: 50, percentage: 5 },
    { minSales: 51, maxSales: 100, percentage: 7 },
    { minSales: 101, maxSales: null, percentage: 10 },
  ],
  cookieWindowDays: 30,
};

export const PERCENTAGE_REWARD: RewardConfig = {
  contentFee: 500,
  model: 'PERCENTAGE',
  percentage: 8,
  cookieWindowDays: 30,
};

export const FIXED_REWARD: RewardConfig = {
  contentFee: 1500,
  model: 'FIXED',
  fixedAmount: 200,
  cookieWindowDays: 14,
};

// ─── Creators ────────────────────────────────────────────────────────────────
//
// Note the capabilities column: Ananya and Vikram do both, Meera creates only on
// ழ, Rohan promotes only off-platform. That mix is the point — the same account
// shape covers all three.

export const MOCK_CREATORS: Creator[] = [
  {
    ...base('CRT260822A01', 240, 'system'),
    name: 'Ananya Sharma',
    handle: 'ananya.creates',
    email: 'influencer@example.com',
    mobile: '9876543211',
    bio: 'Lifestyle and travel creator. I test everything on the road before I write about it — if it survives a Rajasthan summer, it earns a review.',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop',
    coverUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&h=400&fit=crop',
    categories: ['Lifestyle', 'Travel', 'Accessories'],
    capabilities: ['CREATOR', 'INFLUENCER'],
    socialPlatforms: [
      { platform: 'INSTAGRAM', handle: '@ananya_travels', followers: 487000, url: 'https://instagram.com/ananya_travels' },
      { platform: 'YOUTUBE', handle: 'Ananya Travels', followers: 215000, url: 'https://youtube.com/ananyatravels' },
    ],
    followerCount: 702000,
    zhaFollowers: 18400,
    isVerified: true,
    creatorStatus: 'ACTIVE',
    kycStatus: 'VERIFIED',
    influencerId: 'INF260822A01',
    contentPublished: 34,
    productsReviewed: 27,
    totalViews: 1284000,
    totalClicks: 41200,
    attributedOrders: 486,
    revenueGenerated: 1240000,
    pendingEarnings: 19200,
    lifetimeEarnings: 184500,
    campaignIds: ['CMP260822A01', 'CMP260822A03'],
    joinedOn: d(240),
  },
  {
    ...base('CRT260822A02', 180, 'system'),
    name: 'Meera Raghunathan',
    handle: 'meera.athome',
    email: 'meera.creator@example.com',
    mobile: '9876500122',
    bio: 'Home, wellness and slow living. I keep a product for thirty days before I say a word about it.',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop',
    coverUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&h=400&fit=crop',
    categories: ['Home & Living', 'Wellness', 'Beauty'],
    capabilities: ['CREATOR'],
    socialPlatforms: [],
    followerCount: 0,
    zhaFollowers: 26800,
    isVerified: true,
    creatorStatus: 'ACTIVE',
    kycStatus: 'VERIFIED',
    contentPublished: 52,
    productsReviewed: 44,
    totalViews: 892000,
    totalClicks: 33600,
    attributedOrders: 612,
    revenueGenerated: 918000,
    pendingEarnings: 12400,
    lifetimeEarnings: 142000,
    campaignIds: ['CMP260822A04'],
    joinedOn: d(180),
  },
  {
    ...base('CRT260822A03', 150, 'system'),
    name: 'Vikram Choudhary',
    handle: 'vikram.shoots',
    email: 'vikram.creator@example.com',
    mobile: '9876500133',
    bio: 'Photography gear, tested in the field. Camera bags, tripods, and the unglamorous accessories nobody else reviews.',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
    coverUrl: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=1200&h=400&fit=crop',
    categories: ['Electronics', 'Travel', 'Photography'],
    capabilities: ['CREATOR', 'INFLUENCER'],
    socialPlatforms: [
      { platform: 'YOUTUBE', handle: 'Vikram Shoots', followers: 328000, url: 'https://youtube.com/vikramshoots' },
      { platform: 'INSTAGRAM', handle: '@vikram.shoots', followers: 96000 },
    ],
    followerCount: 424000,
    zhaFollowers: 9200,
    isVerified: true,
    creatorStatus: 'ACTIVE',
    kycStatus: 'VERIFIED',
    influencerId: 'INF260822A06',
    contentPublished: 21,
    productsReviewed: 19,
    totalViews: 634000,
    totalClicks: 22800,
    attributedOrders: 214,
    revenueGenerated: 712000,
    pendingEarnings: 8600,
    lifetimeEarnings: 96400,
    campaignIds: ['CMP260822A01'],
    joinedOn: d(150),
  },
  {
    ...base('CRT260822A04', 95, 'system'),
    name: 'Rohan Iyer',
    handle: 'rohan.fits',
    email: 'rohan.creator@example.com',
    mobile: '9876500144',
    bio: 'Strength training and recovery. Coach by day, gear obsessive the rest of the time.',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    coverUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=400&fit=crop',
    categories: ['Fitness', 'Wellness'],
    capabilities: ['INFLUENCER'],
    socialPlatforms: [
      { platform: 'INSTAGRAM', handle: '@rohan.fits', followers: 212000 },
      { platform: 'FACEBOOK', handle: 'Rohan Iyer Fitness', followers: 64000 },
    ],
    followerCount: 276000,
    zhaFollowers: 3100,
    isVerified: false,
    creatorStatus: 'ACTIVE',
    kycStatus: 'PENDING',
    contentPublished: 8,
    productsReviewed: 6,
    totalViews: 214000,
    totalClicks: 15400,
    attributedOrders: 310,
    revenueGenerated: 620000,
    pendingEarnings: 49600,
    lifetimeEarnings: 71200,
    campaignIds: ['CMP260822A05'],
    joinedOn: d(95),
  },
  {
    ...base('CRT260822A05', 40, 'system', 'PENDING', 'N'),
    name: 'Divya Menon',
    handle: 'divya.styles',
    email: 'divya.creator@example.com',
    bio: 'Everyday styling for people who own eleven things. Capsule wardrobes, honestly reviewed.',
    avatarUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&h=200&fit=crop',
    categories: ['Fashion', 'Lifestyle'],
    capabilities: ['CREATOR'],
    socialPlatforms: [],
    followerCount: 0,
    zhaFollowers: 640,
    isVerified: false,
    creatorStatus: 'PENDING_APPROVAL',
    kycStatus: 'IN_PROGRESS',
    contentPublished: 0,
    productsReviewed: 0,
    totalViews: 0,
    totalClicks: 0,
    attributedOrders: 0,
    revenueGenerated: 0,
    pendingEarnings: 0,
    lifetimeEarnings: 0,
    campaignIds: [],
    joinedOn: d(40),
  },
];

// ─── Creator content ─────────────────────────────────────────────────────────

interface ContentSeed {
  id: string;
  creator: string;
  productId: string;
  kind: CreatorContentKind;
  title: string;
  body: string;
  rating?: number;
  thumb: string;
  aspect?: 'PORTRAIT' | 'SQUARE' | 'LANDSCAPE';
  state: CreatorContentState;
  provided: boolean;
  topPick: boolean;
  campaignId?: string;
  campaignName?: string;
  days: number;
  views: number;
  likes: number;
  saves: number;
  shares: number;
  clicks: number;
  orders: number;
  hasVideo?: boolean;
}

const CONTENT_SEEDS: ContentSeed[] = [
  {
    id: 'CRC260822A01', creator: 'CRT260822A01', productId: 'PRD260822A02', kind: 'REVIEW',
    title: 'Six weeks, four states, one backpack',
    body: "I've been using this on the road since March and it's the first bag whose laptop sleeve I actually trust. The hip belt does the work on long days — my shoulders stopped complaining around week two. Fits a 15\" laptop plus a week of clothes if you roll them. The water bottle pocket is tight for anything over a litre, which is my only real complaint.",
    rating: 5, thumb: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=1000&fit=crop',
    aspect: 'PORTRAIT', state: 'PUBLISHED', provided: true, topPick: true,
    campaignId: 'CMP260822A01', campaignName: 'Summer Travel Essentials 2026',
    days: 12, views: 124000, likes: 8900, saves: 3400, shares: 1240, clicks: 6200, orders: 148, hasVideo: true,
  },
  {
    id: 'CRC260822A02', creator: 'CRT260822A02', productId: 'PRD260822A09', kind: 'VIDEO',
    title: 'The two-minute evening reset',
    body: 'Thirty days in and this is the one thing that made my evenings feel different. I run it for twenty minutes before bed with the lavender blend. Quiet enough that I forget it is on.',
    rating: 5, thumb: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&h=1000&fit=crop',
    aspect: 'PORTRAIT', state: 'PUBLISHED', provided: false, topPick: true,
    days: 8, views: 268000, likes: 21400, saves: 9800, shares: 3100, clicks: 11200, orders: 264, hasVideo: true,
  },
  {
    id: 'CRC260822A03', creator: 'CRT260822A03', productId: 'PRD260822A08', kind: 'REVIEW',
    title: 'Finally, a tripod that survives a train journey',
    body: 'I have snapped three tripods in two years. This one has been thrown into overhead racks across four Rajasthan trips and the leg locks are still tight. Not the lightest — 1.4kg — but the trade is worth it if you shoot long exposures.',
    rating: 4, thumb: 'https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?w=800&h=800&fit=crop',
    aspect: 'SQUARE', state: 'PUBLISHED', provided: true, topPick: true,
    campaignId: 'CMP260822A01', campaignName: 'Summer Travel Essentials 2026',
    days: 20, views: 96000, likes: 6100, saves: 2700, shares: 890, clicks: 4400, orders: 96,
  },
  {
    id: 'CRC260822A04', creator: 'CRT260822A02', productId: 'PRD260822A11', kind: 'STYLING',
    title: 'What a 6mm mat actually changes',
    body: 'If your knees hurt in low lunges, thickness is the variable you are missing. I switched from 4mm and the difference was immediate. Grip holds up in a hot room, which is where most mats give up.',
    rating: 5, thumb: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&h=1000&fit=crop',
    aspect: 'PORTRAIT', state: 'PUBLISHED', provided: false, topPick: true,
    days: 5, views: 142000, likes: 11200, saves: 6400, shares: 1800, clicks: 7100, orders: 182, hasVideo: true,
  },
  {
    id: 'CRC260822A05', creator: 'CRT260822A01', productId: 'PRD260822A12', kind: 'PHOTO',
    title: 'The sunglasses that live in my jeans pocket',
    body: 'Folded they are the size of a car key. I have sat on these twice. Still straight.',
    rating: 4, thumb: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&h=800&fit=crop',
    aspect: 'SQUARE', state: 'PUBLISHED', provided: false, topPick: true,
    days: 3, views: 88000, likes: 7400, saves: 2900, shares: 1100, clicks: 3900, orders: 74,
  },
  {
    id: 'CRC260822A06', creator: 'CRT260822A03', productId: 'PRD260822A01', kind: 'REVIEW',
    title: 'Noise cancelling on the Mumbai local',
    body: 'The real test is not an office. It is a 6pm local with the windows open. These cut the roar to something you can think through. Battery gave me nine days of a two-hour commute before I reached for the cable.',
    rating: 5, thumb: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=1000&fit=crop',
    aspect: 'PORTRAIT', state: 'PUBLISHED', provided: true, topPick: false,
    campaignId: 'CMP260822A02', campaignName: 'Tech Fest Audio Collection',
    days: 26, views: 187000, likes: 12800, saves: 5100, shares: 2400, clicks: 9400, orders: 212, hasVideo: true,
  },
  {
    id: 'CRC260822A07', creator: 'CRT260822A02', productId: 'PRD260822A04', kind: 'RECOMMENDATION',
    title: 'Five minutes, four steps, no nonsense',
    body: 'I am suspicious of kits. This one earns its place because the serum and the moisturiser actually pair — most bundles are three good things and two fillers.',
    rating: 4, thumb: 'https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=800&h=1000&fit=crop',
    aspect: 'PORTRAIT', state: 'PUBLISHED', provided: true, topPick: false,
    campaignId: 'CMP260822A04', campaignName: 'Glow Up Beauty Campaign',
    days: 16, views: 214000, likes: 18600, saves: 8200, shares: 4100, clicks: 10800, orders: 246,
  },
  {
    id: 'CRC260822A08', creator: 'CRT260822A01', productId: 'PRD260822A07', kind: 'VIDEO',
    title: 'Smoothies on a hotel windowsill',
    body: 'Charged over USB-C, which means one cable for the whole trip. It will not crush ice — do not buy it expecting that.',
    rating: 3, thumb: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=800&h=800&fit=crop',
    aspect: 'SQUARE', state: 'UNDER_REVIEW', provided: false, topPick: false,
    days: 1, views: 0, likes: 0, saves: 0, shares: 0, clicks: 0, orders: 0, hasVideo: true,
  },
  {
    id: 'CRC260822A09', creator: 'CRT260822A03', productId: 'PRD260822A06', kind: 'PHOTO',
    title: '400km in the UrbanKicks',
    body: 'Outsole is holding. The upper creases badly at the toe box after month two, which is worth knowing before you buy.',
    thumb: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop',
    aspect: 'SQUARE', state: 'SCANNING', provided: false, topPick: false,
    days: 0, views: 0, likes: 0, saves: 0, shares: 0, clicks: 0, orders: 0,
  },
  {
    id: 'CRC260822A10', creator: 'CRT260822A01', productId: 'PRD260822A03', kind: 'REVIEW',
    title: 'Sleep tracking I stopped ignoring',
    body: 'Draft — waiting on a second week of data before I publish anything about the heart rate accuracy.',
    thumb: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=1000&fit=crop',
    aspect: 'PORTRAIT', state: 'REJECTED', provided: true, topPick: false,
    campaignId: 'CMP260822A05', campaignName: 'FitLife Challenge 2026',
    days: 4, views: 0, likes: 0, saves: 0, shares: 0, clicks: 0, orders: 0,
  },
  {
    id: 'CRC260822A11', creator: 'CRT260822A02', productId: 'PRD260822A10', kind: 'RECOMMENDATION',
    title: 'The green tea I actually finished',
    body: 'Most collections go stale in my cupboard. This one is four small tins instead of one big bag, which is the whole difference.',
    rating: 5, thumb: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&h=800&fit=crop',
    aspect: 'SQUARE', state: 'PUBLISHED', provided: false, topPick: false,
    days: 30, views: 74000, likes: 5200, saves: 2100, shares: 640, clicks: 3100, orders: 88,
  },
  {
    id: 'CRC260822A12', creator: 'CRT260822A04', productId: 'PRD260822A05', kind: 'VIDEO',
    title: 'Bands for people who travel with a carry-on',
    body: 'Five resistances, fits in a shoe. I program a full lower body session around these when I am away from a rack.',
    rating: 4, thumb: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=800&h=1000&fit=crop',
    aspect: 'PORTRAIT', state: 'PUBLISHED', provided: true, topPick: true,
    campaignId: 'CMP260822A05', campaignName: 'FitLife Challenge 2026',
    days: 9, views: 156000, likes: 9800, saves: 4200, shares: 2200, clicks: 8400, orders: 168, hasVideo: true,
  },
];

export const MOCK_CREATOR_CONTENT: CreatorContent[] = CONTENT_SEEDS.map(seed => {
  const creator = MOCK_CREATORS.find(c => c.referenceId === seed.creator)!;
  const p = product(seed.productId);
  return {
    ...base(seed.id, seed.days, seed.creator, seed.state === 'PUBLISHED' ? 'ACTIVE' : 'PENDING', seed.state === 'PUBLISHED' ? 'Y' : 'N'),
    creatorId: creator.referenceId,
    creatorName: creator.name,
    creatorHandle: creator.handle,
    creatorAvatarUrl: creator.avatarUrl,
    creatorVerified: creator.isVerified,
    ...p,
    campaignId: seed.campaignId,
    campaignName: seed.campaignName,
    kind: seed.kind,
    title: seed.title,
    body: seed.body,
    rating: seed.rating,
    mediaUrl: seed.thumb,
    thumbnailUrl: seed.thumb,
    videoPreviewUrl: seed.hasVideo ? seed.thumb : undefined,
    aspect: seed.aspect ?? 'SQUARE',
    state: seed.state,
    moderationEvents: trail(seed.state, seed.days),
    rejectionReason: seed.state === 'REJECTED' ? 'Product packaging not clearly visible in the opening frame' : undefined,
    providedForReview: seed.provided,
    isTopPick: seed.topPick,
    publishedOn: seed.state === 'PUBLISHED' ? d(seed.days) : undefined,
    views: seed.views,
    likes: seed.likes,
    saves: seed.saves,
    shares: seed.shares,
    clicks: seed.clicks,
    attributedOrders: seed.orders,
  };
});

// ─── Tracking links ──────────────────────────────────────────────────────────

interface LinkSeed {
  id: string; code: string; campaignId: string; campaignName: string;
  productId?: string; who: string; role: ParticipantCapability;
  channel: TrackingChannel; days: number;
  clicks: number; uniq: number; views: number; atc: number; orders: number; revenue: number; commission: number;
}

const LINK_SEEDS: LinkSeed[] = [
  { id: 'TRK260822A01', code: 'A7xK92', campaignId: 'CMP260822A01', campaignName: 'Summer Travel Essentials 2026', productId: 'PRD260822A02', who: 'CRT260822A01', role: 'INFLUENCER', channel: 'SOCIAL', days: 14, clicks: 5200, uniq: 4180, views: 3640, atc: 940, orders: 310, revenue: 620000, commission: 49600 },
  { id: 'TRK260822A02', code: 'Qm4Rt8', campaignId: 'CMP260822A01', campaignName: 'Summer Travel Essentials 2026', productId: 'PRD260822A08', who: 'CRT260822A03', role: 'INFLUENCER', channel: 'SOCIAL', days: 20, clicks: 2840, uniq: 2210, views: 1980, atc: 512, orders: 164, revenue: 328000, commission: 22960 },
  { id: 'TRK260822A03', code: 'Zp2Nw5', campaignId: 'CMP260822A04', campaignName: 'Glow Up Beauty Campaign', productId: 'PRD260822A04', who: 'CRT260822A02', role: 'CREATOR', channel: 'ZHA_CONTENT', days: 16, clicks: 10800, uniq: 8940, views: 8120, atc: 1840, orders: 246, revenue: 492000, commission: 39360 },
  { id: 'TRK260822A04', code: 'Hd9Lb3', campaignId: 'CMP260822A05', campaignName: 'FitLife Challenge 2026', productId: 'PRD260822A05', who: 'CRT260822A04', role: 'INFLUENCER', channel: 'SOCIAL', days: 9, clicks: 8400, uniq: 6720, views: 5940, atc: 1420, orders: 168, revenue: 134400, commission: 10752 },
  { id: 'TRK260822A05', code: 'Ky6Vs1', campaignId: 'CMP260822A02', campaignName: 'Tech Fest Audio Collection', productId: 'PRD260822A01', who: 'CRT260822A03', role: 'CREATOR', channel: 'ZHA_CONTENT', days: 26, clicks: 9400, uniq: 7810, views: 7040, atc: 1620, orders: 212, revenue: 635880, commission: 44512 },
  { id: 'TRK260822A06', code: 'Bn3Fq7', campaignId: 'CMP260822A05', campaignName: 'FitLife Challenge 2026', who: 'CRT260822A04', role: 'INFLUENCER', channel: 'EMAIL', days: 6, clicks: 1240, uniq: 1090, views: 880, atc: 210, orders: 42, revenue: 33600, commission: 2688 },
  { id: 'TRK260822A07', code: 'Wr8Jc4', campaignId: 'CMP260822A03', campaignName: 'Adventure Creator Series', productId: 'PRD260822A02', who: 'CRT260822A01', role: 'INFLUENCER', channel: 'QR', days: 3, clicks: 420, uniq: 388, views: 340, atc: 96, orders: 18, revenue: 62982, commission: 5038 },
];

export const MOCK_TRACKING_LINKS: TrackingLink[] = LINK_SEEDS.map(seed => {
  const creator = MOCK_CREATORS.find(c => c.referenceId === seed.who)!;
  const p = seed.productId ? product(seed.productId) : null;
  return {
    ...base(seed.id, seed.days, creator.referenceId),
    shortCode: seed.code,
    shortUrl: `zha.example/c/${seed.code}`,
    longUrl: p
      ? `https://zha.example/products/${seed.productId}?campaign=${seed.campaignId}&ref=${seed.code}`
      : `https://zha.example/campaigns/${seed.campaignId}?ref=${seed.code}`,
    campaignId: seed.campaignId,
    campaignName: seed.campaignName,
    productId: seed.productId,
    productName: p?.productName,
    attributedToId: creator.referenceId,
    attributedToName: creator.name,
    attributedToRole: seed.role,
    channel: seed.channel,
    linkStatus: 'ACTIVE' as const,
    createdByName: creator.name,
    expiryDate: future(45),
    stats: {
      clicks: seed.clicks,
      uniqueVisitors: seed.uniq,
      productViews: seed.views,
      addToCart: seed.atc,
      orders: seed.orders,
      revenue: seed.revenue,
      conversionRate: seed.clicks ? Math.round((seed.orders / seed.clicks) * 1000) / 10 : 0,
      commission: seed.commission,
    },
  };
});

// ─── Campaign participation ──────────────────────────────────────────────────

function timeline(state: ParticipationState, role: ParticipantCapability, days: number): ParticipationEvent[] {
  const creatorPath: { s: ParticipationState; label: string }[] = [
    { s: 'INVITED', label: 'Invitation sent by the partner' },
    { s: 'ACCEPTED', label: 'Creator accepted the invitation' },
    { s: 'PRODUCT_SHIPPED', label: 'Product dispatched to the creator' },
    { s: 'PRODUCT_RECEIVED', label: 'Creator confirmed delivery' },
    { s: 'CONTENT_SUBMITTED', label: 'Content submitted for review' },
    { s: 'UNDER_REVIEW', label: 'Moderation review in progress' },
    { s: 'APPROVED', label: 'Content approved' },
    { s: 'PUBLISHED', label: 'Published on ழ' },
  ];
  const influencerPath: { s: ParticipationState; label: string }[] = [
    { s: 'INVITED', label: 'Invitation sent by the partner' },
    { s: 'ACCEPTED', label: 'Influencer accepted the invitation' },
    { s: 'PROMOTING', label: 'Tracking URL generated — promotion live' },
    { s: 'COMPLETED', label: 'Campaign window closed' },
  ];
  const path = role === 'CREATOR' ? creatorPath : influencerPath;
  const idx = path.findIndex(p => p.s === state);
  if (state === 'DECLINED') {
    return [
      { state: 'INVITED', timestamp: d(days + 2), description: path[0].label },
      { state: 'DECLINED', timestamp: d(days), description: 'Declined — schedule conflict' },
    ];
  }
  if (state === 'REJECTED') {
    return [
      ...timeline('UNDER_REVIEW', 'CREATOR', days + 2),
      { state: 'REJECTED', timestamp: d(days), description: 'Content rejected — revisions requested', actor: 'Moderation' },
    ];
  }
  if (state === 'CONTENT_PENDING') {
    return [
      ...timeline('PRODUCT_RECEIVED', 'CREATOR', days + 1),
      { state: 'CONTENT_PENDING', timestamp: d(days), description: 'Awaiting content from the creator' },
    ];
  }
  const upto = idx < 0 ? 0 : idx;
  return path.slice(0, upto + 1).map((st, i) => ({
    state: st.s,
    timestamp: d(days + (upto - i) * 2),
    description: st.label,
  }));
}

interface PartSeed {
  id: string; campaignId: string; campaignName: string; partnerId: string; partnerName: string;
  who: string; role: ParticipantCapability; state: ParticipationState;
  products: string[]; sample: boolean; days: number; due: number;
  reward: RewardConfig; linkId?: string; contentIds: string[]; feeState: 'PENDING' | 'APPROVED' | 'PAID';
}

const PART_SEEDS: PartSeed[] = [
  { id: 'CPT260822A01', campaignId: 'CMP260822A01', campaignName: 'Summer Travel Essentials 2026', partnerId: 'PTN260822A05', partnerName: 'TravelPro Essentials', who: 'CRT260822A01', role: 'CREATOR', state: 'PUBLISHED', products: ['PRD260822A02'], sample: true, days: 12, due: 4, reward: TIERED_REWARD, contentIds: ['CRC260822A01'], feeState: 'PAID' },
  { id: 'CPT260822A02', campaignId: 'CMP260822A01', campaignName: 'Summer Travel Essentials 2026', partnerId: 'PTN260822A05', partnerName: 'TravelPro Essentials', who: 'CRT260822A03', role: 'CREATOR', state: 'PUBLISHED', products: ['PRD260822A08'], sample: true, days: 20, due: 0, reward: PERCENTAGE_REWARD, contentIds: ['CRC260822A03'], feeState: 'PAID' },
  { id: 'CPT260822A03', campaignId: 'CMP260822A01', campaignName: 'Summer Travel Essentials 2026', partnerId: 'PTN260822A05', partnerName: 'TravelPro Essentials', who: 'CRT260822A01', role: 'INFLUENCER', state: 'PROMOTING', products: ['PRD260822A02'], sample: false, days: 14, due: 16, reward: PERCENTAGE_REWARD, linkId: 'TRK260822A01', contentIds: [], feeState: 'APPROVED' },
  { id: 'CPT260822A04', campaignId: 'CMP260822A04', campaignName: 'Glow Up Beauty Campaign', partnerId: 'PTN260822A03', partnerName: 'NatureGlow Cosmetics', who: 'CRT260822A02', role: 'CREATOR', state: 'PUBLISHED', products: ['PRD260822A04'], sample: true, days: 16, due: 0, reward: TIERED_REWARD, linkId: 'TRK260822A03', contentIds: ['CRC260822A07'], feeState: 'PAID' },
  { id: 'CPT260822A05', campaignId: 'CMP260822A05', campaignName: 'FitLife Challenge 2026', partnerId: 'PTN260822A04', partnerName: 'FitLife Gear', who: 'CRT260822A04', role: 'INFLUENCER', state: 'PROMOTING', products: ['PRD260822A05'], sample: false, days: 9, due: 21, reward: PERCENTAGE_REWARD, linkId: 'TRK260822A04', contentIds: [], feeState: 'APPROVED' },
  { id: 'CPT260822A06', campaignId: 'CMP260822A05', campaignName: 'FitLife Challenge 2026', partnerId: 'PTN260822A04', partnerName: 'FitLife Gear', who: 'CRT260822A01', role: 'CREATOR', state: 'INVITED', products: ['PRD260822A03', 'PRD260822A11'], sample: true, days: 1, due: 21, reward: FIXED_REWARD, contentIds: [], feeState: 'PENDING' },
  { id: 'CPT260822A07', campaignId: 'CMP260822A03', campaignName: 'Adventure Creator Series', partnerId: 'PTN260822A05', partnerName: 'TravelPro Essentials', who: 'CRT260822A02', role: 'CREATOR', state: 'PRODUCT_RECEIVED', products: ['PRD260822A02'], sample: true, days: 3, due: 11, reward: TIERED_REWARD, contentIds: [], feeState: 'PENDING' },
  { id: 'CPT260822A08', campaignId: 'CMP260822A02', campaignName: 'Tech Fest Audio Collection', partnerId: 'PTN260822A02', partnerName: 'TechGadgets India', who: 'CRT260822A03', role: 'CREATOR', state: 'UNDER_REVIEW', products: ['PRD260822A01'], sample: true, days: 2, due: 6, reward: PERCENTAGE_REWARD, linkId: 'TRK260822A05', contentIds: ['CRC260822A06'], feeState: 'APPROVED' },
  { id: 'CPT260822A09', campaignId: 'CMP260822A02', campaignName: 'Tech Fest Audio Collection', partnerId: 'PTN260822A02', partnerName: 'TechGadgets India', who: 'CRT260822A04', role: 'INFLUENCER', state: 'DECLINED', products: ['PRD260822A01'], sample: false, days: 5, due: 14, reward: PERCENTAGE_REWARD, contentIds: [], feeState: 'PENDING' },
  { id: 'CPT260822A10', campaignId: 'CMP260822A03', campaignName: 'Adventure Creator Series', partnerId: 'PTN260822A05', partnerName: 'TravelPro Essentials', who: 'CRT260822A05', role: 'CREATOR', state: 'CONTENT_PENDING', products: ['PRD260822A12'], sample: true, days: 2, due: 9, reward: FIXED_REWARD, contentIds: [], feeState: 'PENDING' },
];

export const MOCK_PARTICIPATIONS: CampaignParticipation[] = PART_SEEDS.map(seed => {
  const c = MOCK_CREATORS.find(x => x.referenceId === seed.who)!;
  return {
    ...base(seed.id, seed.days, seed.partnerId, seed.state, seed.state === 'PUBLISHED' ? 'Y' : 'N'),
    campaignId: seed.campaignId,
    campaignName: seed.campaignName,
    partnerId: seed.partnerId,
    partnerName: seed.partnerName,
    participantId: c.referenceId,
    participantName: c.name,
    participantHandle: c.handle,
    participantAvatarUrl: c.avatarUrl,
    participantRole: seed.role,
    state: seed.state,
    invitedOn: d(seed.days + 2),
    respondedOn: seed.state === 'INVITED' ? undefined : d(seed.days + 1),
    dueDate: future(seed.due),
    productIds: seed.products,
    productNames: seed.products.map(id => product(id).productName),
    productSampleProvided: seed.sample,
    trackingLinkId: seed.linkId,
    contentIds: seed.contentIds,
    reward: seed.reward,
    contentFeeState: seed.feeState,
    timeline: timeline(seed.state, seed.role, seed.days),
  };
});

// ─── Attribution ─────────────────────────────────────────────────────────────

export const MOCK_ATTRIBUTION: AttributionRecord[] = [
  { referenceId: 'ATR260822A01', campaignId: 'CMP260822A01', campaignName: 'Summer Travel Essentials 2026', participantId: 'CRT260822A01', participantName: 'Ananya Sharma', participantHandle: 'ananya.creates', participantAvatarUrl: MOCK_CREATORS[0].avatarUrl, participantRole: 'CREATOR', source: 'ZHA_CONTENT', views: 124000, clicks: 6200, orders: 148, revenue: 296000, commission: 23680, contentFee: 2500, period: 'Last 30 days' },
  { referenceId: 'ATR260822A02', campaignId: 'CMP260822A01', campaignName: 'Summer Travel Essentials 2026', participantId: 'CRT260822A01', participantName: 'Ananya Sharma', participantHandle: 'ananya.creates', participantAvatarUrl: MOCK_CREATORS[0].avatarUrl, participantRole: 'INFLUENCER', trackingCode: 'A7xK92', source: 'TRACKING_LINK', views: 0, clicks: 5200, orders: 310, revenue: 620000, commission: 49600, contentFee: 0, period: 'Last 30 days' },
  { referenceId: 'ATR260822A03', campaignId: 'CMP260822A04', campaignName: 'Glow Up Beauty Campaign', participantId: 'CRT260822A02', participantName: 'Meera Raghunathan', participantHandle: 'meera.athome', participantAvatarUrl: MOCK_CREATORS[1].avatarUrl, participantRole: 'CREATOR', trackingCode: 'Zp2Nw5', source: 'ZHA_CONTENT', views: 214000, clicks: 10800, orders: 246, revenue: 492000, commission: 39360, contentFee: 2500, period: 'Last 30 days' },
  { referenceId: 'ATR260822A04', campaignId: 'CMP260822A01', campaignName: 'Summer Travel Essentials 2026', participantId: 'CRT260822A03', participantName: 'Vikram Choudhary', participantHandle: 'vikram.shoots', participantAvatarUrl: MOCK_CREATORS[2].avatarUrl, participantRole: 'CREATOR', trackingCode: 'Qm4Rt8', source: 'ZHA_CONTENT', views: 96000, clicks: 4400, orders: 96, revenue: 192000, commission: 15360, contentFee: 500, period: 'Last 30 days' },
  { referenceId: 'ATR260822A05', campaignId: 'CMP260822A05', campaignName: 'FitLife Challenge 2026', participantId: 'CRT260822A04', participantName: 'Rohan Iyer', participantHandle: 'rohan.fits', participantAvatarUrl: MOCK_CREATORS[3].avatarUrl, participantRole: 'INFLUENCER', trackingCode: 'Hd9Lb3', source: 'TRACKING_LINK', views: 0, clicks: 8400, orders: 168, revenue: 134400, commission: 10752, contentFee: 1500, period: 'Last 30 days' },
  { referenceId: 'ATR260822A06', campaignId: 'CMP260822A02', campaignName: 'Tech Fest Audio Collection', participantId: 'CRT260822A03', participantName: 'Vikram Choudhary', participantHandle: 'vikram.shoots', participantAvatarUrl: MOCK_CREATORS[2].avatarUrl, participantRole: 'CREATOR', trackingCode: 'Ky6Vs1', source: 'ZHA_CONTENT', views: 187000, clicks: 9400, orders: 212, revenue: 635880, commission: 44512, contentFee: 500, period: 'Last 30 days' },
];

// ─── Earnings ────────────────────────────────────────────────────────────────

interface EarnSeed {
  id: string; who: string; role: ParticipantCapability; campaignId?: string; campaignName?: string;
  productName?: string; kind: EarningRecord['kind']; state: EarningRecord['state'];
  sale?: number; rate?: number; amount: number; days: number; paidDays?: number;
}

const EARN_SEEDS: EarnSeed[] = [
  { id: 'ERN260822A01', who: 'CRT260822A01', role: 'CREATOR', campaignId: 'CMP260822A01', campaignName: 'Summer Travel Essentials 2026', productName: 'TravelPro Premium Backpack 40L', kind: 'CONTENT_FEE', state: 'PAID', amount: 2500, days: 12, paidDays: 5 },
  { id: 'ERN260822A02', who: 'CRT260822A01', role: 'CREATOR', campaignId: 'CMP260822A01', campaignName: 'Summer Travel Essentials 2026', productName: 'TravelPro Premium Backpack 40L', kind: 'SALES_COMMISSION', state: 'APPROVED', sale: 296000, rate: 8, amount: 23680, days: 8 },
  { id: 'ERN260822A03', who: 'CRT260822A01', role: 'INFLUENCER', campaignId: 'CMP260822A01', campaignName: 'Summer Travel Essentials 2026', kind: 'SALES_COMMISSION', state: 'PENDING', sale: 620000, rate: 8, amount: 49600, days: 3 },
  { id: 'ERN260822A04', who: 'CRT260822A02', role: 'CREATOR', campaignId: 'CMP260822A04', campaignName: 'Glow Up Beauty Campaign', productName: 'GlowRadiance Skincare Kit', kind: 'CONTENT_FEE', state: 'PAID', amount: 2500, days: 16, paidDays: 9 },
  { id: 'ERN260822A05', who: 'CRT260822A02', role: 'CREATOR', campaignId: 'CMP260822A04', campaignName: 'Glow Up Beauty Campaign', productName: 'GlowRadiance Skincare Kit', kind: 'SALES_COMMISSION', state: 'APPROVED', sale: 492000, rate: 8, amount: 39360, days: 6 },
  { id: 'ERN260822A06', who: 'CRT260822A02', role: 'CREATOR', kind: 'BONUS', state: 'PENDING', amount: 5000, days: 2 },
  { id: 'ERN260822A07', who: 'CRT260822A03', role: 'CREATOR', campaignId: 'CMP260822A02', campaignName: 'Tech Fest Audio Collection', productName: 'SoundWave Pro Wireless Headphones', kind: 'SALES_COMMISSION', state: 'PENDING', sale: 635880, rate: 7, amount: 44512, days: 4 },
  { id: 'ERN260822A08', who: 'CRT260822A04', role: 'INFLUENCER', campaignId: 'CMP260822A05', campaignName: 'FitLife Challenge 2026', kind: 'SALES_COMMISSION', state: 'PENDING', sale: 134400, rate: 8, amount: 10752, days: 5 },
  { id: 'ERN260822A09', who: 'CRT260822A04', role: 'INFLUENCER', campaignId: 'CMP260822A05', campaignName: 'FitLife Challenge 2026', kind: 'CONTENT_FEE', state: 'APPROVED', amount: 1500, days: 7 },
];

export const MOCK_EARNINGS: EarningRecord[] = EARN_SEEDS.map(seed => ({
  ...base(seed.id, seed.days, seed.who, seed.state, 'Y'),
  participantId: seed.who,
  participantRole: seed.role,
  campaignId: seed.campaignId,
  campaignName: seed.campaignName,
  productName: seed.productName,
  kind: seed.kind,
  state: seed.state,
  eligibleSale: seed.sale,
  rate: seed.rate,
  amount: seed.amount,
  earnedOn: d(seed.days),
  paidOn: seed.paidDays !== undefined ? d(seed.paidDays) : undefined,
}));

/** Demo logins added for the creator capability. */
export const CREATOR_DEMO_LOGINS: Record<string, string> = {
  'creator@example.com': 'USR260822A11',
};
