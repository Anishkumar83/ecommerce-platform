import { useId } from 'react';

/**
 * ழ (Zha) brand identity.
 *
 * The mark is a monoline construction of the Tamil letter ழ, drawn on a
 * 105x100 grid derived from the real glyph's proportions:
 *   - baseline bar      (the horizontal spine)
 *   - stem              (rises at the left of the bar)
 *   - bowl              (closed arch sitting on the bar, right side)
 *   - spiral tail       (descends below the bar and curls left)
 *
 * All four strokes share one weight and round terminals, so the mark stays
 * legible from 96px down to 16px (favicon).
 */

const ZHA_PATHS = [
  'M12 58 L85 58', // baseline bar
  'M12 58 L12 8', // stem
  'M49 58 L49 24 C49 12.5 58.5 6 68 6 C80.5 6 85 16 85 28 L85 58', // bowl
  'M41 58 C41 78 34 93 20.5 93 C9 93 2.5 85 5 77 C7.5 69 17 67.5 21.5 74', // spiral tail
];

export type ZhaTone = 'brand' | 'white' | 'ink' | 'gradient';

const TONE_STROKE: Record<Exclude<ZhaTone, 'gradient'>, string> = {
  brand: '#4f54e8',
  white: '#ffffff',
  ink: '#111827',
};

interface ZhaMarkProps {
  /** Rendered height in px. Width is ~1.05x this. */
  size?: number;
  tone?: ZhaTone;
  /** Stroke weight on the 105x100 grid. 13 is the brand default. */
  weight?: number;
  className?: string;
}

/** The bare ழ glyph, no container. */
export function ZhaMark({ size = 32, tone = 'brand', weight = 13, className = '' }: ZhaMarkProps) {
  const uid = useId().replace(/:/g, '');
  const gradId = `zha-grad-${uid}`;
  const stroke = tone === 'gradient' ? `url(#${gradId})` : TONE_STROKE[tone];

  return (
    <svg
      viewBox="0 0 105 100"
      width={Math.round(size * 1.05)}
      height={size}
      fill="none"
      className={className}
      role="img"
      aria-label="ழ"
    >
      {tone === 'gradient' && (
        <defs>
          {/* userSpaceOnUse is required: the bar and stem have zero-area
              bounding boxes, which makes objectBoundingBox gradients vanish. */}
          <linearGradient id={gradId} gradientUnits="userSpaceOnUse" x1="2" y1="95" x2="88" y2="4">
            <stop offset="0" stopColor="#7c3aed" />
            <stop offset="0.5" stopColor="#4f54e8" />
            <stop offset="1" stopColor="#8194f8" />
          </linearGradient>
        </defs>
      )}
      <g stroke={stroke} strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round">
        {ZHA_PATHS.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </svg>
  );
}

interface ZhaTileProps {
  /** Tile edge length in px. */
  size?: number;
  /** 'gradient' (default) | 'solid' | 'white' | 'translucent' (for coloured sidebars) */
  fill?: 'gradient' | 'solid' | 'white' | 'translucent';
  className?: string;
}

/** The ழ mark reversed out of a rounded-square tile. App icon / favicon / navbar mark. */
export function ZhaTile({ size = 36, fill = 'gradient', className = '' }: ZhaTileProps) {
  const bg =
    fill === 'gradient'
      ? 'bg-[linear-gradient(135deg,#6271f3_0%,#3b3aba_100%)]'
      : fill === 'solid'
        ? 'bg-brand-600'
        : fill === 'white'
          ? 'bg-white'
          : 'bg-white/20';

  return (
    <div
      className={`shrink-0 flex items-center justify-center ${bg} ${className}`}
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.28) }}
    >
      <ZhaMark size={Math.round(size * 0.55)} tone={fill === 'white' ? 'brand' : 'white'} />
    </div>
  );
}

interface ZhaLogoProps {
  /** Height of the mark/tile in px. */
  size?: number;
  /** Show the mark inside a rounded tile (default) or bare. */
  tile?: boolean;
  fill?: ZhaTileProps['fill'];
  /** Colour of the bare mark when tile={false}. */
  tone?: ZhaTone;
  /**
   * Wordmark beside the mark.
   *  'tamil' – ழ set in Noto Sans Tamil (default)
   *  'latin' – ZHA, letterspaced
   *  false   – mark only
   */
  wordmark?: 'latin' | 'tamil' | false;
  /** Wordmark colour class, e.g. "text-white". */
  wordmarkClass?: string;
  className?: string;
}

/** Full horizontal lockup: mark + wordmark. */
export default function ZhaLogo({
  size = 36,
  tile = true,
  fill = 'gradient',
  tone = 'brand',
  wordmark = 'tamil',
  wordmarkClass = 'text-gray-900',
  className = '',
}: ZhaLogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {tile ? <ZhaTile size={size} fill={fill} /> : <ZhaMark size={size} tone={tone} />}
      {wordmark === 'latin' && (
        <span
          className={`font-display font-extrabold leading-none ${wordmarkClass}`}
          style={{ fontSize: Math.round(size * 0.55), letterSpacing: '0.16em' }}
        >
          ZHA
        </span>
      )}
      {wordmark === 'tamil' && (
        <span
          className={`font-tamil font-extrabold leading-none ${wordmarkClass}`}
          style={{ fontSize: Math.round(size * 0.82) }}
        >
          ழ
        </span>
      )}
    </span>
  );
}
