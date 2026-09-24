'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

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

function useOrigin() {
  // The origin is only known in the browser. Until then the link renders without it.
  const [origin, setOrigin] = useState('');
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin);
  }, []);
  return origin;
}

/** Pick where you are sharing, then copy one link. */
function ShareLinkPicker({ slug }: { slug: string }) {
  const t = useTranslations('Dashboard.fundraiser.insights.audience');
  const origin = useOrigin();
  const [channelId, setChannelId] = useState<ChannelId>('plain');

  const channel = CHANNELS.find(option => option.id === channelId)!;
  const label = (id: ChannelId) =>
    id === 'plain' ? t('plainLink') : t(`sources.${id}`);
  const base = `${origin}/raise/${encodeURIComponent(slug)}`;
  const url = channel.medium
    ? `${base}?${new URLSearchParams({
        utm_source: channel.id,
        utm_medium: channel.medium,
      })}`
    : base;

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

/** The link section of the Share tab. */
export function ShareLinksCard({ slug }: { slug: string }) {
  const t = useTranslations('Dashboard.fundraiser.insights.audience');
  return (
    <Card className='gap-4 border-border/60 px-6 py-5 shadow-xs'>
      <div>
        <h2 className='text-lg font-semibold text-foreground'>
          {t('builderTitle')}
        </h2>
        <p className='mt-1 text-sm text-muted-foreground'>{t('builderHint')}</p>
      </div>
      <ShareLinkPicker slug={slug} />
    </Card>
  );
}
