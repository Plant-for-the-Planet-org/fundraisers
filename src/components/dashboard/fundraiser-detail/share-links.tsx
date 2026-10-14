'use client';

import { useId, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { buildShareUrl } from '@/lib/share/links';
import { getReferralCode } from '@/lib/share/referral';
import { cn } from '@/lib/utils/cn';
import { useAuthStore } from '@/stores/auth-store';
import { useOrigin } from '@/components/share/use-origin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ChevronDownIcon } from '@/components/ui/ui-icons';

/** One tagged link per place a host shares. Same shape as the Stage Mode QR link: a source and a medium, no campaign. */
const CHANNELS = [
  { id: 'plain', medium: null },
  { id: 'whatsapp', medium: 'messaging' },
  { id: 'instagram', medium: 'social' },
  { id: 'linkedin', medium: 'social' },
  { id: 'facebook', medium: 'social' },
  { id: 'email', medium: 'email' },
  { id: 'newsletter', medium: 'email' },
] as const;

type ChannelId = (typeof CHANNELS)[number]['id'];

/** Pick where you are sharing, then copy one link. */
function ShareLinkPicker({ slug }: { slug: string }) {
  const t = useTranslations('Dashboard.fundraiser.insights.audience');
  const origin = useOrigin();
  const refCode = getReferralCode(useAuthStore(state => state.user?.profile));
  const [channelId, setChannelId] = useState<ChannelId>('plain');

  const channel = CHANNELS.find(option => option.id === channelId)!;
  const label = (id: ChannelId) =>
    id === 'plain' ? t('plainLink') : t(`sources.${id}`);
  // Every link carries the host's own code, so Insights can tell their shares from their co-hosts' and supporters'.
  const url = origin
    ? buildShareUrl({
        origin,
        slug,
        source: channel.medium ? channel.id : undefined,
        medium: channel.medium ?? undefined,
        ref: refCode,
      })
    : `/raise/${encodeURIComponent(slug)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t('linkCopied', { source: label(channel.id) }));
    } catch {
      toast.error(t('linkCopyError'));
    }
  };

  return (
    <div className='min-w-0 space-y-3'>
      <ToggleGroup
        type='single'
        value={channelId}
        onValueChange={(value: ChannelId) => {
          if (value) setChannelId(value);
        }}
        aria-label={t('channelLabel')}
        className='h-auto flex-wrap justify-start gap-1.5 bg-transparent p-0'
      >
        {CHANNELS.map(option => (
          <ToggleGroupItem
            key={option.id}
            value={option.id}
            className='h-7 flex-none rounded-full border-border px-3 text-xs data-[state=on]:border-accent-color data-[state=on]:bg-accent-color/10 data-[state=on]:text-accent-color data-[state=on]:shadow-none'
          >
            {label(option.id)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <div className='flex min-w-0 gap-2'>
        <Input
          readOnly
          value={url}
          aria-label={t('linkLabel')}
          onFocus={event => event.currentTarget.select()}
          className='min-w-0 flex-1 text-xs text-muted-foreground'
        />
        <Button onClick={() => void copy()}>{t('copy')}</Button>
      </div>
    </div>
  );
}

/**
 * Links for places the studio does not cover, such as email, tucked away until asked for.
 * The studio already gives the right tagged link for the platform picked above, so most hosts never need this.
 */
export function ShareLinksCard({ slug }: { slug: string }) {
  const t = useTranslations('Dashboard.fundraiser.insights.audience');
  const [open, setOpen] = useState(false);
  const panelId = useId();
  return (
    <div className='rounded-xl border border-dashed border-border px-5 py-3'>
      <button
        type='button'
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(value => !value)}
        className='flex w-full items-center justify-between gap-3 text-left text-sm font-medium text-muted-foreground transition-colors hover:text-foreground'
      >
        {t('otherPlaces')}
        <ChevronDownIcon
          className={cn(
            'size-4 shrink-0 transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>
      {open && (
        <div id={panelId} className='mt-3 space-y-3'>
          <p className='text-sm text-muted-foreground'>{t('builderHint')}</p>
          <ShareLinkPicker slug={slug} />
        </div>
      )}
    </div>
  );
}
