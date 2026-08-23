import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Sparkles, BadgeCheck, Star, ShoppingCart, Info, X } from 'lucide-react';
import type { CreatorContent } from '../../core/models';
import { creatorService } from '../../core/services/creator.service';
import { productService } from '../../core/services/product.service';
import { cartService } from '../../core/services/cart.service';
import CreatorCard from './CreatorCard';
import Modal from './Modal';
import { useToast } from './Toast';
import { SkeletonLine } from './LoadingSkeleton';
import { compact, inr } from './StatTile';

/**
 * Creator's Top Picks — a horizontally scrolling rail of shoppable creator
 * content. Deliberately not another grid of product cards: the creator, their
 * words and the product sit in one unit, and the whole card is a route into the
 * existing product → cart → checkout flow.
 */
export default function CreatorTopPicks({ limit = 8 }: { limit?: number }) {
  const [picks, setPicks] = useState<CreatorContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickView, setQuickView] = useState<CreatorContent | null>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    creatorService.getTopPicks(limit)
      .then(setPicks)
      .finally(() => setLoading(false));
  }, [limit]);

  const syncArrows = () => {
    const el = railRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  };

  useEffect(() => {
    syncArrows();
    const el = railRef.current;
    if (!el) return;
    el.addEventListener('scroll', syncArrows, { passive: true });
    window.addEventListener('resize', syncArrows);
    return () => {
      el.removeEventListener('scroll', syncArrows);
      window.removeEventListener('resize', syncArrows);
    };
  }, [picks]);

  const scrollBy = (dir: -1 | 1) => {
    railRef.current?.scrollBy({ left: dir * 560, behavior: 'smooth' });
  };

  const addToCart = async (productId: string) => {
    try {
      const product = await productService.getProduct(productId);
      await cartService.addItem(product);
      toast(`${product.name} added to cart`);
    } catch {
      toast('Could not add to cart', 'error');
    }
  };

  if (!loading && picks.length === 0) return null;

  return (
    <section className="py-8">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-brand-50 text-brand-700 rounded-full px-2.5 py-1 mb-2">
            <Sparkles size={12} />
            <span className="text-[11px] font-bold uppercase tracking-wide">Creator's Top Picks</span>
          </div>
          <h2 className="text-xl font-bold font-display text-gray-900">Tried, tested, then recommended</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Real reviews from verified creators who used the product first
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <button
            onClick={() => scrollBy(-1)}
            disabled={!canLeft}
            aria-label="Scroll left"
            className="w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:border-brand-300 hover:text-brand-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ChevronLeft size={17} />
          </button>
          <button
            onClick={() => scrollBy(1)}
            disabled={!canRight}
            aria-label="Scroll right"
            className="w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:border-brand-300 hover:text-brand-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-[260px] shrink-0 bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="skeleton w-full aspect-square" />
              <div className="p-3.5 space-y-2">
                <SkeletonLine width="w-3/4" height="h-3.5" />
                <SkeletonLine width="w-full" height="h-3" />
                <SkeletonLine width="w-1/2" height="h-3" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div ref={railRef} className="rail-scroll flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
          {picks.map((p, i) => (
            <CreatorCard
              key={p.referenceId}
              content={p}
              layout="rail"
              onQuickView={setQuickView}
              onAddToCart={addToCart}
              className="animate-rail-in"
              // Staggered entrance so the rail assembles rather than snapping in.
              style={{ animationDelay: `${i * 55}ms` }}
            />
          ))}
        </div>
      )}

      <QuickView content={quickView} onClose={() => setQuickView(null)} onAddToCart={addToCart} />
    </section>
  );
}

/** Full review in a modal, without leaving the page. */
function QuickView({
  content,
  onClose,
  onAddToCart,
}: {
  content: CreatorContent | null;
  onClose: () => void;
  onAddToCart: (productId: string) => void;
}) {
  if (!content) return null;

  return (
    <Modal open={!!content} onClose={onClose} size="lg">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 -mt-1">
        <div className="relative rounded-xl overflow-hidden bg-gray-100">
          <img src={content.mediaUrl} alt={content.title} className="w-full h-full object-cover" />
          <button
            onClick={onClose}
            aria-label="Close"
            className="sm:hidden absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center"
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex flex-col">
          <Link to={`/creators/${content.creatorHandle}`} className="flex items-center gap-2.5 mb-4 group">
            <img src={content.creatorAvatarUrl} alt="" className="w-11 h-11 rounded-full object-cover" />
            <span>
              <span className="flex items-center gap-1 text-sm font-bold text-gray-900 group-hover:text-brand-700">
                {content.creatorName}
                {content.creatorVerified && <BadgeCheck size={13} className="text-brand-600" />}
              </span>
              <span className="block text-xs text-gray-500">@{content.creatorHandle} · Verified Creator</span>
            </span>
          </Link>

          {content.rating !== undefined && (
            <div className="flex items-center gap-0.5 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={13} className={i < content.rating! ? 'text-amber-400' : 'text-gray-200'} fill="currentColor" />
              ))}
            </div>
          )}

          <h3 className="text-base font-bold font-display text-gray-900 mb-2">{content.title}</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">{content.body}</p>

          {content.providedForReview && (
            <p className="flex items-start gap-1.5 text-[11px] text-gray-500 bg-gray-50 rounded-lg px-2.5 py-2 mb-4">
              <Info size={12} className="shrink-0 mt-0.5" />
              Product provided for review{content.campaignName ? ` as part of ${content.campaignName}` : ''}.
              The creator's opinion is their own.
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-gray-500 mb-5">
            <span className="tabular-nums">{compact(content.views)} views</span>
            <span className="tabular-nums">{compact(content.likes)} likes</span>
            <span className="tabular-nums">{compact(content.saves)} saves</span>
          </div>

          <div className="mt-auto flex items-center gap-3 pt-4 border-t border-gray-100">
            <img src={content.productImageUrl} alt="" className="w-14 h-14 rounded-xl object-cover bg-gray-100 shrink-0" />
            <div className="min-w-0 grow">
              <p className="text-xs text-gray-500 truncate">{content.partnerName}</p>
              <p className="text-sm font-semibold text-gray-800 line-clamp-1">{content.productName}</p>
              <p className="text-base font-bold text-gray-900 tabular-nums">{inr(content.productPrice)}</p>
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={() => { onAddToCart(content.productId); onClose(); }}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 active:scale-[.98] transition-all"
            >
              <ShoppingCart size={15} /> Add to Cart
            </button>
            <Link
              to={`/products/${content.productId}`}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:border-brand-300 hover:text-brand-700 flex items-center"
            >
              View Product
            </Link>
          </div>
        </div>
      </div>
    </Modal>
  );
}
