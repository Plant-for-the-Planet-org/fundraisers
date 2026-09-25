import type { IconDefinition } from '@fortawesome/free-brands-svg-icons';
import type { SharePlatformId } from '@/lib/share/channels';

import { Share2 } from 'lucide-react';
import {
  faFacebookF,
  faInstagram,
  faLinkedinIn,
  faTiktok,
  faWhatsapp,
  faXTwitter,
  faYoutube,
} from '@fortawesome/free-brands-svg-icons';

// Brand icons by Font Awesome Free (https://fontawesome.com), CC BY 4.0. Drawn from their path data, so no icon font or runtime loads.
const BRANDS: Record<Exclude<SharePlatformId, 'other'>, IconDefinition> = {
  instagram: faInstagram,
  whatsapp: faWhatsapp,
  tiktok: faTiktok,
  youtube: faYoutube,
  linkedin: faLinkedinIn,
  facebook: faFacebookF,
  x: faXTwitter,
};

export function PlatformIcon({
  platform,
  className,
}: {
  platform: SharePlatformId;
  className?: string;
}) {
  if (platform === 'other')
    return <Share2 className={className} aria-hidden='true' />;
  const [width, height, , , path] = BRANDS[platform].icon;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      fill='currentColor'
      aria-hidden='true'
    >
      {(Array.isArray(path) ? path : [path]).map(d => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
