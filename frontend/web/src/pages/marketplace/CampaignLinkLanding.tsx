import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, BadgeCheck, ArrowRight, Link2Off, ShoppingCart } from 'lucide-react';
import type { TrackingLink, Product, Creator } from '../../core/models';
import { trackingService } from '../../core/services/tracking.service';
import { creatorService } from '../../core/services/creator.service';
import { productService } from '../../core/services/product.service';
import MarketplaceHeader from '../../components/shared/MarketplaceHeader';
import { inr } from '../../components/shared/StatTile';

/**
 * Resolves a campaign short URL — zha.example/c/A7xK92.
 *
 * This is the entry point for every off-platform click: an influencer's
 * Instagram bio, an email, an SMS, a QR code on packaging. It records the click
 * against the attributed participant, then hands the shopper straight into the
 * ordinary product → cart → checkout flow. Nothing about that flow changes;
 * attribution just rides along.
 *
 * The interstitial is deliberately brief. It exists so the shopper can see who
 * recommended the product before they land on it — attribution the person can
 * see, not just attribution the platform records.
 */
export default function CampaignLinkLanding() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [link, setLink] = useState<TrackingLink | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [creator, setCreator] = useState<Creator | null>(null);
  const [state, setState] = useState<'resolving' | 'found' | 'missing'>('resolving');

  useEffect(() => {
    if (!code) return;
    let cancelled = false;

    (async () => {
      const resolved = await trackingService.resolve(code);
      if (cancelled) return;

      if (!resolved || resolved.linkStatus !== 'ACTIVE') {
        setState('missing');
        return;
      }

      setLink(resolved);
      setState('found');

      // Record the click. Mock: the counter lives in the service's array.
      resolved.stats.clicks += 1;
      resolved.stats.uniqueVisitors += 1;

      const [p, c] = await Promise.all([
        resolved.productId ? productService.getProduct(resolved.productId).catch(() => null) : Promise.resolve(null),
        creatorService.getCreator(resolved.attributedToId).catch(() => null),
      ]);
      if (cancelled) return;
      setProduct(p);
      setCreator(c);
    })();

    return () => { cancelled = true; };
  }, [code]);

  // Once we know where to send them, go — after a beat so the attribution
  // card is actually readable.
  useEffect(() => {
    if (state !== 'found' || !link) return;
    const destination = link.productId
      ? `/products/${link.productId}?ref=${link.shortCode}&campaign=${link.campaignId}`
      : `/campaigns/${link.campaignId}?ref=${link.shortCode}`;
    const t = setTimeout(() => navigate(destination, { replace: true }), 2200);
    return () => clearTimeout(t);
  }, [state, link, navigate]);

  if (state === 'missing') {
    return (
      <div className="min-h-screen bg-surface">
        <MarketplaceHeader />
        <div className="max-w-md mx-auto px-4 py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Link2Off size={26} className="text-gray-400" />
          </div>
          <h1 className="text-lg font-bold font-display text-gray-900 mb-2">This link has expired</h1>
          <p className="text-sm text-gray-500 mb-6">
            The campaign it pointed to has ended or the link was revoked. Everything on{' '}
            <span className="font-tamil">ழ</span> is still a click away.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700"
          >
            Browse products <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 to-brand-800 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-7 text-center">
        {state === 'resolving' || !link ? (
          <>
            <Loader2 size={26} className="text-brand-600 animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-500">Opening your link…</p>
          </>
        ) : (
          <>
            {creator && (
              <>
                <img
                  src={creator.avatarUrl}
                  alt=""
                  className="w-16 h-16 rounded-full object-cover mx-auto mb-3 ring-4 ring-brand-50"
                />
                <p className="flex items-center justify-center gap-1 text-sm font-bold text-gray-900">
                  {creator.name}
                  {creator.isVerified && <BadgeCheck size={13} className="text-brand-600" />}
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  recommended this on <span className="font-tamil">ழ</span>
                </p>
              </>
            )}

            {product ? (
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 mb-4 text-left">
                <img
                  src={product.media.find(m => m.isPrimary)?.url ?? product.media[0]?.url}
                  alt=""
                  className="w-12 h-12 rounded-lg object-cover bg-gray-100 shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-tight">{product.name}</p>
                  <p className="text-sm font-bold text-gray-900 tabular-nums">{inr(product.price)}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600 mb-4">{link.campaignName}</p>
            )}

            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
              <ShoppingCart size={12} />
              Taking you to the product…
            </div>

            <div className="h-1 bg-gray-100 rounded-full overflow-hidden mt-3">
              <div className="h-full bg-brand-600 rounded-full animate-[railIn_2.2s_linear]" style={{ width: '100%' }} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
