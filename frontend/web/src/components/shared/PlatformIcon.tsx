import { Camera, Play, Users, MessageCircle, Music2, Globe } from 'lucide-react';
import type { SocialPlatform } from '../../core/models';

/**
 * lucide-react v1 dropped every brand glyph, so social platforms get a generic
 * icon plus their own accent colour. Keeps one source of truth for the mapping.
 */
const MAP: Record<SocialPlatform['platform'], { icon: typeof Camera; label: string; cls: string }> = {
  INSTAGRAM: { icon: Camera, label: 'Instagram', cls: 'text-rose-500' },
  YOUTUBE: { icon: Play, label: 'YouTube', cls: 'text-red-600' },
  FACEBOOK: { icon: Users, label: 'Facebook', cls: 'text-blue-600' },
  TWITTER: { icon: MessageCircle, label: 'X', cls: 'text-gray-800' },
  TIKTOK: { icon: Music2, label: 'TikTok', cls: 'text-gray-900' },
};

export function platformLabel(platform: SocialPlatform['platform']): string {
  return MAP[platform]?.label ?? platform;
}

export const PLATFORM_OPTIONS = Object.keys(MAP) as SocialPlatform['platform'][];

export default function PlatformIcon({
  platform,
  size = 16,
  className = '',
}: {
  platform: SocialPlatform['platform'];
  size?: number;
  className?: string;
}) {
  const entry = MAP[platform];
  const Icon = entry?.icon ?? Globe;
  return <Icon size={size} className={`${entry?.cls ?? 'text-gray-400'} ${className}`} />;
}
