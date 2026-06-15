import type { ShareTarget } from '@/lib/share/targets';

import { WhatsappIcon } from '@/components/ui/brand-icons';

/**
 * WhatsApp share via the `wa.me` deep link — opens WhatsApp (app or web) with
 * the fundraiser text + URL prefilled.
 *
 * Reference implementation for future platform targets: define the entry, add
 * its label key to `Fundraisers.share.targets`, register it in `SHARE_TARGETS`.
 */
export const whatsappTarget: ShareTarget = {
  id: 'whatsapp',
  labelKey: 'whatsapp',
  icon: WhatsappIcon,
  isAvailable: () => true,
  run: data => {
    // Title + goal (data.text) on their own lines, URL on the next line.
    const message = `${data.text}\n${data.url}`.trim();
    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer'
    );
  },
};
