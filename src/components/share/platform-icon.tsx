import type { ComponentType, SVGProps } from 'react';
import type { SharePlatformId } from '@/lib/share/channels';

import { Share2 } from 'lucide-react';
import {
  FacebookBrandIcon,
  InstagramIcon,
  LinkedinIcon,
  TiktokIcon,
  WhatsappIcon,
  XBrandIcon,
  YoutubeIcon,
} from '@/components/ui/ui-icons';

const ICONS: Record<SharePlatformId, ComponentType<SVGProps<SVGSVGElement>>> = {
  instagram: InstagramIcon,
  whatsapp: WhatsappIcon,
  tiktok: TiktokIcon,
  youtube: YoutubeIcon,
  linkedin: LinkedinIcon,
  facebook: FacebookBrandIcon,
  x: XBrandIcon,
  other: Share2,
};

export function PlatformIcon({
  platform,
  className,
}: {
  platform: SharePlatformId;
  className?: string;
}) {
  const Icon = ICONS[platform];
  return <Icon className={className} aria-hidden='true' />;
}
