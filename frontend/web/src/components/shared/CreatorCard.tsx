import { useState, useRef, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Bookmark, Share2, Play, BadgeCheck, Star, ShoppingCart, Info } from 'lucide-react';
import type { CreatorContent } from '../../core/models';
import { creatorService } from '../../core/services/creator.service';
import { useToast } from './Toast';
import { compact, inr } from './StatTile';

interface CreatorCardProps {
  content: CreatorContent;
  /** 'rail' for the homepage carousel, 'grid' for profile and product pages. */
  layout?: 'rail' | 'grid';
  onQuickView?: (content: CreatorContent) => void;
  onAddToCart?: (productId: string) => void;
  className?: string;
  /** Used by the Top Picks rail to stagger each card's entrance. */
  style?: CSSProperties;
}

const ASPECT = {
  PORTRAIT: 'aspect-[4/5]',
  SQUARE: 'aspect-square',
  LANDSCAPE: 'aspect-[4/3]',
};

/**
 * A single piece of creator content, shown as a shoppable card. Hovering a video
 * piece scales the still and reveals the play affordance; the product strip at
 * the bottom is what turns discovery into a purchase.
 */
export default function CreatorCard({ content, layout = 'grid', onQuickView, onAddToCart, className = '', style }: CreatorCardProps) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hover, setHover] = useState(false);
  const busy = useRef(false);
  const { toast } = useToast();

  const react = async (kind: 'like' | 'save' | 'share') => {
    if (busy.current) return;
    busy.current = true;
    // Optimistic — the mock service always succeeds, but keeping the pattern
    // means swapping in a real endpoint later changes nothing here.
    if (kind === 'like') setLiked(v => !v);
    if (kind === 'save') setSaved(v => !v);
    try {
      await creatorService.react(content.referenceId, kind);
      if (kind === 'save') toast(saved ? 'Removed from saved' : 'Saved to your picks');
      if (kind === 'share') {
        const url = `${window.location.origin}/products/${content.productId}`;
        try {
          await navigator.clipboard.writeText(url);
          toast('Link copied to clipboard');
        } catch {
          toast('Could not copy the link', 'error');
        }
      }
    } finally {
      busy.current = false;
    }
  };

  return (
    <article
      className={`group relative bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-gray-200 transition-all duration-200 ${
        layout === 'rail' ? 'w-[260px] shrink-0' : ''
      } ${className}`}
      style={style}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Media */}
      <div className={`relative overflow-hidden bg-gray-100 ${ASPECT[content.aspect ?? 'SQUARE']}`}>
        <img
          src={content.thumbnailUrl}
          alt={content.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 via-transparent to-transparent opacity-80" />

        {content.videoPreviewUrl && (
          <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${hover ? 'opacity-100' : 'opacity-0'}`}>
            <span className="w-12 h-12 rounded-full bg-white/95 flex items-center justify-center shadow-lg">
              <Play size={18} className="text-gray-900 ml-0.5" fill="currentColor" />
            </span>
          </div>
        )}

        {/* Creator identity */}
        <Link
          to={`/creators/${content.creatorHandle}`}
          className="absolute top-3 left-3 flex items-center gap-2 group/creator"
          onClick={e => e.stopPropagation()}
        >
          <img
            src={content.creatorAvatarUrl}
            alt=""
            className="w-8 h-8 rounded-full ring-2 ring-white/80 object-cover"
          />
          <span className="flex flex-col leading-tight">
            <span className="text-[11px] font-bold text-white drop-shadow flex items-center gap-1">
              {content.creatorName}
              {content.creatorVerified && <BadgeCheck size={11} className="text-brand-300" />}
            </span>
            <span className="text-[10px] text-white/70 drop-shadow">Verified Creator</span>
          </span>
        </Link>

        {/* Save / like */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
          <button
            onClick={() => react('like')}
            aria-label={liked ? 'Unlike' : 'Like'}
            aria-pressed={liked}
            className="w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center hover:bg-white transition-all active:scale-90"
          >
            <Heart size={14} className={liked ? 'text-rose-500' : 'text-gray-600'} fill={liked ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={() => react('save')}
            aria-label={saved ? 'Remove from saved' : 'Save'}
            aria-pressed={saved}
            className={`w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center hover:bg-white transition-all active:scale-90 ${
              hover || saved ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Bookmark size={14} className={saved ? 'text-brand-600' : 'text-gray-600'} fill={saved ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={() => react('share')}
            aria-label="Share"
            className={`w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center hover:bg-white transition-all active:scale-90 ${
              hover ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Share2 size={13} className="text-gray-600" />
          </button>
        </div>

        {/* Engagement */}
        <div className="absolute bottom-3 left-3 flex items-center gap-3 text-[11px] font-semibold text-white drop-shadow">
          <span className="flex items-center gap-1"><Heart size={11} /> {compact(content.likes)}</span>
          <span className="flex items-center gap-1"><Bookmark size={11} /> {compact(content.saves)}</span>
        </div>
      </div>

      {/* Review */}
      <div className="p-3.5">
        {content.rating !== undefined && (
          <div className="flex items-center gap-0.5 mb-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={11}
                className={i < content.rating! ? 'text-amber-400' : 'text-gray-200'}
                fill="currentColor"
              />
            ))}
          </div>
        )}

        <button
          onClick={() => onQuickView?.(content)}
          className="text-left w-full"
          disabled={!onQuickView}
        >
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-1 mb-1 hover:text-brand-700 transition-colors">
            {content.title}
          </h3>
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-2.5">“{content.body}”</p>
        </button>

        {content.providedForReview && (
          <p className="flex items-center gap-1 text-[10px] text-gray-400 mb-2.5">
            <Info size={10} className="shrink-0" />
            Product provided for review
          </p>
        )}

        {/* Shoppable strip */}
        <div className="flex items-center gap-2.5 pt-2.5 border-t border-gray-100">
          <img src={content.productImageUrl} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-100 shrink-0" />
          <div className="min-w-0 grow">
            <p className="text-[11px] text-gray-600 truncate leading-tight">{content.productName}</p>
            <p className="text-sm font-bold text-gray-900 tabular-nums leading-tight">{inr(content.productPrice)}</p>
          </div>
          {onAddToCart ? (
            <button
              onClick={() => onAddToCart(content.productId)}
              className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-brand-600 text-white text-[11px] font-bold hover:bg-brand-700 active:scale-95 transition-all"
            >
              <ShoppingCart size={12} /> Shop
            </button>
          ) : (
            <Link
              to={`/products/${content.productId}`}
              className="shrink-0 px-2.5 py-1.5 rounded-lg bg-brand-600 text-white text-[11px] font-bold hover:bg-brand-700"
            >
              Shop Now
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
