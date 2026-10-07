'use client';

import type { Fundraiser } from '@/lib/types/fundraiser';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useHostedFundraiserIds } from '@/components/fundraisers/use-hosted-fundraiser-ids';
import {
  Popover,
  PopoverAnchor,
  PopoverArrow,
  PopoverContent,
} from '@/components/ui/popover';
import { ChartSimpleIcon } from '@/components/ui/ui-icons';

/** Stands in for the avatar when the header has none, so the callout has nothing to point at and stays hidden. */
const MISSING_ANCHOR = { getBoundingClientRect: () => new DOMRect() };

/**
 * A small callout under the account avatar that tells a host they are one, with a link to the fundraiser's dashboard. Every active host may open it, view-only co-hosts included.
 * Auth lives in the client store, so this renders as a client island inside the server-rendered fundraiser view and renders nothing for everyone else.
 *
 * A host who set themselves private (`isPublic: false`) is stripped from the anonymous fundraiser payload, so `fundraiser.hosts` alone can't reveal them.
 * For that case we fall back to the user's own hosted-fundraiser list (fetched once per identity, cached across pages).
 *
 * Closing it lasts until the next page load; nothing is remembered.
 */
export function HostControls({ fundraiser }: { fundraiser: Fundraiser }) {
  const t = useTranslations('Fundraisers.hostControls');
  const userId = useAuthStore(state => state.user?.sub);
  const isAuthInitializing = useAuthStore(state => state.isAuthInitializing);
  const [open, setOpen] = useState(true);

  // Can the page data already tell? Anyone listed here is a host.
  const isVisibleHost =
    !!userId && fundraiser.hosts.some(host => host.user?.id === userId);

  // Logged in but not listed: only now look at the user's own hosted list, to catch a private host (private hosts are removed from the page data).
  const { hostIds } = useHostedFundraiserIds({
    enabled: !isAuthInitializing && !!userId && !isVisibleHost,
  });

  const isHost = isVisibleHost || (hostIds?.has(fundraiser.id) ?? false);

  // The avatar lives in the header, outside this component. Radix reads the anchor only when it measures, after the header has rendered, so it is looked up then. Without one the callout has nothing to point at, and hideWhenDetached keeps it hidden.
  const anchor = useMemo(
    () => ({
      get current() {
        return (
          document.querySelector<HTMLElement>('[data-user-menu-avatar]') ??
          MISSING_ANCHOR
        );
      },
    }),
    []
  );

  if (isAuthInitializing || !isHost) {
    return null;
  }

  // The fundraiser's dashboard overview, which shows its numbers. It always exists for a host, unlike the Insights tab, which needs the analytics key.
  const dashboardPath = `/dashboard/fundraisers/${fundraiser.slug || fundraiser.id}`;

  return (
    <Popover open={open} modal={false}>
      <PopoverAnchor virtualRef={anchor} />
      <PopoverContent
        side='bottom'
        align='end'
        sideOffset={8}
        collisionPadding={16}
        hideWhenDetached
        // A hint, not a dialog: it does not take focus and stays while the visitor uses the page.
        onOpenAutoFocus={event => event.preventDefault()}
        onInteractOutside={event => event.preventDefault()}
        onEscapeKeyDown={() => setOpen(false)}
        // Capped at the width Radix leaves inside the 16px collision padding, so a long translation wraps instead of running off a narrow screen.
        className='z-40 flex w-auto max-w-(--radix-popover-content-available-width) items-center gap-3 rounded-xl px-3 py-2 text-sm shadow-lg'
      >
        {/* A chart, for the fundraiser's progress. */}
        <ChartSimpleIcon
          className='size-4 shrink-0 text-muted-foreground'
          aria-hidden='true'
        />
        <span className='min-w-0 text-muted-foreground'>{t('hostLabel')}</span>
        <Link
          href={dashboardPath}
          aria-label={t('progressLabel')}
          className='shrink-0 font-medium text-foreground underline-offset-2 hover:underline'
        >
          {t('progressButton')}
        </Link>
        <button
          type='button'
          onClick={() => setOpen(false)}
          aria-label={t('closeLabel')}
          className='-mr-1 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
        >
          <X className='size-3.5' aria-hidden='true' />
        </button>
        {/* A notch in the card's edge: only the two slanted sides are outlined, and it overlaps the card's border by a pixel so the line runs into the point. */}
        <PopoverArrow width={16} height={8} asChild>
          <svg
            viewBox='0 0 16 8'
            className='-translate-y-px overflow-visible'
            aria-hidden='true'
          >
            <path d='M0 0 L8 8 L16 0 Z' className='fill-popover' />
            <path
              d='M0 0 L8 8 L16 0'
              className='fill-none stroke-border'
              strokeWidth={1}
            />
          </svg>
        </PopoverArrow>
      </PopoverContent>
    </Popover>
  );
}
