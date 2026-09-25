'use client';

import type {
  ShareChannel,
  ShareChannelId,
  ShareKind,
  SharePlatformId,
} from '@/lib/share/channels';
import type { CtaKey } from '@/lib/share/cta';
import type { SeasonId } from '@/lib/share/render/seasons';
import type { Fundraiser } from '@/lib/types/fundraiser';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import QRCode from 'qrcode';
import { toast } from 'sonner';
import {
  channelsFor,
  getChannel,
  SHARE_CHANNELS,
  SHARE_PLATFORMS,
} from '@/lib/share/channels';
import {
  CTA_PRESETS,
  CUSTOM_CTA_MAX_LENGTH,
  seasonalCta,
} from '@/lib/share/cta';
import { SHARE_FORMATS, SHARE_VIDEO_SECONDS } from '@/lib/share/formats';
import { buildShareUrl } from '@/lib/share/links';
import { getReferralCode } from '@/lib/share/referral';
import { SEASON_IDS } from '@/lib/share/render/seasons';
import {
  canShareFiles,
  downloadBlob,
  shareFile,
  shareText,
} from '@/lib/share/web-share';
import { createZip } from '@/lib/share/zip';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { PlatformIcon } from './platform-icon';
import { SharePreview } from './share-preview';
import {
  makeShareImage,
  makeShareVideo,
  useShareFiles,
} from './use-share-files';
import {
  useOrigin,
  useProjectPurposes,
  useShareRender,
} from './use-share-render';

const CUSTOM = '__custom';

/** Aspect shapes for the format cards, in px. */
const SHAPES = {
  story: [12, 20],
  tiktok: [12, 20],
  shorts: [12, 20],
  post: [16, 20],
  banner: [22, 12],
  wide: [22, 13],
} as const;

function cardClass(active: boolean) {
  return cn(
    'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors',
    active
      ? 'border-accent-color bg-accent-color/10 ring-1 ring-accent-color'
      : 'border-border hover:bg-accent/60'
  );
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Images and videos to share a fundraiser, sized for each platform and drawn in the fundraiser's theme.
 * Hosts get every option. Donors, right after giving, get the platforms and the preview only.
 */
export function ShareStudio({
  fundraiser,
  variant,
}: {
  fundraiser: Fundraiser;
  variant: 'host' | 'donor';
}) {
  const t = useTranslations('Share');
  const isHost = variant === 'host';
  const origin = useOrigin();
  const refCode = getReferralCode(useAuthStore(state => state.user?.profile));

  const [channelId, setChannelId] = useState<ShareChannelId>('instagramStory');
  const channel: ShareChannel = getChannel(channelId);
  const [kind, setKind] = useState<ShareKind>('video');
  const [season, setSeason] = useState<SeasonId>('none');
  const [ctaChoice, setCtaChoice] = useState<CtaKey | typeof CUSTOM>('joinMe');
  const [customCta, setCustomCta] = useState('');
  const [showDonors, setShowDonors] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [tip, setTip] = useState<string | null>(null);
  const [kitBusy, setKitBusy] = useState(false);
  const [shareFiles, setShareFiles] = useState(false);

  useEffect(() => {
    // Only known in the browser.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShareFiles(canShareFiles());
  }, []);

  const purposes = useProjectPurposes(fundraiser, season === 'christmas');
  const suggested = seasonalCta(season, purposes);
  const ctaOptions = useMemo(
    () => [...new Set<CtaKey>([suggested, ...CTA_PRESETS])],
    [suggested]
  );
  const cta =
    ctaChoice === CUSTOM
      ? customCta.trim() || t('cta.joinMe')
      : t(`cta.${ctaChoice}`);

  const render = useShareRender({ fundraiser, season, cta, showDonors });
  const options = useMemo(
    () => ({ data: render.data, theme: render.theme, photo: render.photo }),
    [render.data, render.theme, render.photo]
  );
  const format = channel.format;
  const effectiveKind: ShareKind = channel.kinds.includes(kind)
    ? kind
    : channel.kinds[0];
  const fileName = `${fundraiser.slug}-${format}`;
  const files = useShareFiles({
    format,
    kind: effectiveKind,
    options,
    ready: render.ready,
    name: fileName,
  });
  const file =
    effectiveKind === 'video' && files.video ? files.video : files.image;

  const link = origin
    ? buildShareUrl({
        origin,
        slug: fundraiser.slug,
        source: channel.utm.source,
        medium: channel.utm.medium,
        ref: refCode,
      })
    : '';
  const defaultMessage = t(isHost ? `captions.${season}` : 'captions.donor', {
    name: fundraiser.title,
  });
  const caption = `${message ?? defaultMessage}\n${link}`;
  const platformLabel = t(`platforms.${channel.platform}`);
  const channelTip = t(`channels.${channelId}.tip`);

  const selectPlatform = (platform: SharePlatformId) => {
    const first = channelsFor(platform)[0];
    setChannelId(first.id as ShareChannelId);
    setKind(first.kinds[0]);
    setTip(null);
  };
  const selectChannel = (id: ShareChannelId) => {
    setChannelId(id);
    setKind(getChannel(id).kinds[0]);
    setTip(null);
  };
  const selectSeason = (value: SeasonId) => {
    setSeason(value);
    // A style suggests its own button text; a custom one stays.
    if (ctaChoice !== CUSTOM) setCtaChoice(seasonalCta(value, purposes));
  };

  const busy = !file || files.progress !== null;
  const primaryLabel =
    files.progress !== null
      ? t('studio.preparingVideo', {
          percent: String(Math.round(files.progress * 100)),
        })
      : !file
        ? t('studio.preparing')
        : channel.linkOnly
          ? t('studio.shareLink')
          : shareFiles
            ? channel.platform === 'other'
              ? t('studio.share')
              : t('studio.shareTo', { platform: platformLabel })
            : effectiveKind === 'video' && files.video
              ? t('studio.downloadVideo')
              : t('studio.downloadImage');

  const onPrimary = async () => {
    setTip(null);
    if (channel.linkOnly) {
      // Desktop browsers without a share sheet leave `share` undefined, whatever the types say.
      if ('share' in navigator) {
        await shareText(caption).catch(() =>
          toast.error(t('studio.shareFailed'))
        );
      } else if (await copyText(caption))
        toast.success(t('studio.messageCopied'));
      return;
    }
    if (!file) return;
    if (shareFiles) {
      // Copy first: a story cannot carry the link, and a post's caption is pasted by hand.
      await copyText(
        format === 'story' || format === 'tiktok' || format === 'shorts'
          ? link
          : caption
      );
      try {
        if (await shareFile(file)) setTip(channelTip);
      } catch {
        toast.error(t('studio.shareFailed'));
      }
      return;
    }
    downloadBlob(file, file.name);
    await copyText(caption);
    setTip(t('studio.savedTip', { file: file.name, tip: channelTip }));
  };

  const onDownload = () => {
    const target = channel.linkOnly ? files.image : file;
    if (target) downloadBlob(target, target.name);
  };

  const onKit = async () => {
    setKitBusy(true);
    try {
      const images = await Promise.all(
        (['story', 'post', 'banner'] as const).map(f =>
          makeShareImage(f, options, `${fundraiser.slug}-${f}`)
        )
      );
      const video = await makeShareVideo(
        'story',
        options,
        `${fundraiser.slug}-story`
      );
      const captions = SHARE_CHANNELS.filter(c => !('linkOnly' in c))
        .map(c => {
          const url = buildShareUrl({
            origin,
            slug: fundraiser.slug,
            source: c.utm.source,
            medium: c.utm.medium,
            ref: refCode,
          });
          return `${t(`platforms.${c.platform}`)}: ${t(`channels.${c.id}.label`)}\n${message ?? defaultMessage}\n${url}\n`;
        })
        .join('\n');
      const entries = await Promise.all(
        [...images, ...(video ? [video] : [])].map(async f => ({
          name: f.name,
          data: new Uint8Array(await f.arrayBuffer()),
        }))
      );
      entries.push({
        name: 'captions.txt',
        data: new TextEncoder().encode(captions),
      });
      const zip = createZip(entries);
      downloadBlob(
        new Blob([zip.buffer as ArrayBuffer], { type: 'application/zip' }),
        `${fundraiser.slug}-share-kit.zip`
      );
      toast.success(t('studio.kitDone'));
    } catch (error) {
      console.error('[share] Could not make the share kit:', error);
      toast.error(t('studio.kitFailed'));
    } finally {
      setKitBusy(false);
    }
  };

  const { w, h } = SHARE_FORMATS[format];

  const preview = (
    <Card className='items-center gap-3 border-border/60 px-5 py-5 shadow-xs'>
      {channel.kinds.length > 1 && (
        <ToggleGroup
          type='single'
          value={effectiveKind}
          onValueChange={(value: ShareKind) => value && setKind(value)}
          aria-label={t('studio.kindLabel')}
        >
          {channel.kinds.map(k => (
            <ToggleGroupItem key={k} value={k} className='px-4'>
              {t(`studio.${k}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      )}
      <SharePreview
        format={format}
        animate={effectiveKind === 'video'}
        options={options}
        label={t('studio.previewLabel')}
      />
      <p className='text-xs text-muted-foreground'>
        {effectiveKind === 'video'
          ? t('studio.videoMeta', {
              seconds: String(SHARE_VIDEO_SECONDS),
              width: String(w),
              height: String(h),
            })
          : t('studio.imageMeta', { width: String(w), height: String(h) })}
      </p>
      <div className='grid w-full gap-2'>
        {files.progress !== null && (
          <div
            className='h-1 overflow-hidden rounded-full bg-muted'
            aria-hidden='true'
          >
            <div
              className='h-full bg-accent-color transition-[width]'
              style={{ width: `${Math.round(files.progress * 100)}%` }}
            />
          </div>
        )}
        <Button
          onClick={() => void onPrimary()}
          disabled={busy && !channel.linkOnly}
        >
          {primaryLabel}
        </Button>
        {(shareFiles || channel.linkOnly) && (
          <Button variant='outline' onClick={onDownload} disabled={busy}>
            {channel.linkOnly
              ? t('studio.downloadPreview')
              : effectiveKind === 'video' && files.video
                ? t('studio.downloadVideo')
                : t('studio.downloadImage')}
          </Button>
        )}
        {files.videoUnsupported && effectiveKind === 'video' && (
          <p className='text-xs text-muted-foreground'>{t('studio.noVideo')}</p>
        )}
        {tip && (
          <p className='rounded-lg bg-accent-color/10 px-3 py-2 text-sm'>
            {tip}
          </p>
        )}
        {isHost && !shareFiles && <Handoff />}
        {isHost && (
          <Button
            variant='link'
            size='sm'
            onClick={() => void onKit()}
            disabled={kitBusy || !render.ready}
          >
            {kitBusy ? t('studio.kitPreparing') : t('studio.kit')}
          </Button>
        )}
      </div>
    </Card>
  );

  const picker = (
    <Card className='gap-4 border-border/60 px-6 py-5 shadow-xs'>
      <div>
        <h2 className='text-lg font-semibold text-foreground'>
          {t('studio.whereTitle')}
        </h2>
        <p className='mt-1 text-sm text-muted-foreground'>
          {t('studio.whereHint')}
        </p>
      </div>
      {/* Icon only, like the dashboard menu when collapsed. The name is the tooltip and the accessible label. */}
      <div
        className='flex flex-wrap gap-1'
        role='group'
        aria-label={t('studio.platformLabel')}
      >
        {SHARE_PLATFORMS.map(platform => {
          const active = platform === channel.platform;
          const label = t(`platforms.${platform}`);
          return (
            <button
              key={platform}
              type='button'
              title={label}
              aria-pressed={active}
              onClick={() => selectPlatform(platform)}
              className={cn(
                'flex size-9 items-center justify-center rounded-md transition-colors',
                active
                  ? 'bg-accent-color/10 text-accent-color'
                  : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
              )}
            >
              <PlatformIcon platform={platform} className='size-4' />
              <span className='sr-only'>{label}</span>
            </button>
          );
        })}
      </div>
      <div
        className='grid gap-2 sm:grid-cols-2 lg:grid-cols-3'
        role='group'
        aria-label={t('studio.formatLabel')}
      >
        {channelsFor(channel.platform).map(option => {
          const [sw, sh] = SHAPES[option.format];
          const id = option.id as ShareChannelId;
          return (
            <button
              key={id}
              type='button'
              aria-pressed={id === channelId}
              onClick={() => selectChannel(id)}
              className={cardClass(id === channelId)}
            >
              <span
                className='shrink-0 rounded-[3px] border-2 border-current opacity-50'
                style={{ width: sw, height: sh }}
                aria-hidden='true'
              />
              <span className='min-w-0'>
                <span className='block text-foreground'>
                  {t(`channels.${id}.label`)}
                </span>
                <span className='block text-xs text-muted-foreground'>
                  {t(`channels.${id}.hint`)}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );

  if (!isHost) {
    return (
      <div className='grid gap-4'>
        {picker}
        {preview}
      </div>
    );
  }

  return (
    <div className='grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]'>
      <div className='grid min-w-0 gap-6'>
        {picker}
        <Card className='gap-4 border-border/60 px-6 py-5 shadow-xs'>
          <div>
            <h2 className='text-lg font-semibold text-foreground'>
              {t('studio.customizeTitle')}
            </h2>
            <p className='mt-1 text-sm text-muted-foreground'>
              {t('studio.customizeHint')}
            </p>
          </div>
          <div className='flex flex-wrap items-end gap-4'>
            <div className='grid gap-1.5'>
              <Label htmlFor='share-style'>{t('studio.style')}</Label>
              <Select
                value={season}
                onValueChange={value => selectSeason(value as SeasonId)}
              >
                <SelectTrigger id='share-style' className='w-40'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEASON_IDS.map(id => (
                    <SelectItem key={id} value={id}>
                      {t(`seasons.${id}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='grid gap-1.5'>
              <Label htmlFor='share-cta'>{t('studio.buttonText')}</Label>
              <Select
                value={ctaChoice}
                onValueChange={value =>
                  setCtaChoice(value as CtaKey | typeof CUSTOM)
                }
              >
                <SelectTrigger id='share-cta' className='w-56'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ctaOptions.map(key => (
                    <SelectItem key={key} value={key}>
                      {t(`cta.${key}`)}
                    </SelectItem>
                  ))}
                  <SelectItem value={CUSTOM}>{t('cta.custom')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {ctaChoice === CUSTOM && (
              <div className='grid gap-1.5'>
                <Label htmlFor='share-cta-custom'>{t('cta.customLabel')}</Label>
                <Input
                  id='share-cta-custom'
                  value={customCta}
                  maxLength={CUSTOM_CTA_MAX_LENGTH}
                  placeholder={t('cta.customPlaceholder')}
                  onChange={event => setCustomCta(event.target.value)}
                  className='w-56'
                  autoFocus
                />
              </div>
            )}
            <label className='flex h-9 items-center gap-2 text-sm'>
              <Switch checked={showDonors} onCheckedChange={setShowDonors} />
              {t('studio.showDonors')}
            </label>
          </div>
        </Card>
        <Card className='gap-4 border-border/60 px-6 py-5 shadow-xs'>
          <div>
            <h2 className='text-lg font-semibold text-foreground'>
              {t('studio.captionTitle')}
            </h2>
            <p className='mt-1 text-sm text-muted-foreground'>
              {t('studio.captionHint')}
            </p>
          </div>
          <Textarea
            value={message ?? defaultMessage}
            onChange={event => setMessage(event.target.value)}
            rows={3}
          />
          <div className='flex min-w-0 gap-2'>
            <Input
              readOnly
              value={link}
              aria-label={t('studio.linkLabel')}
              onFocus={event => event.currentTarget.select()}
              className='min-w-0 flex-1 text-xs text-muted-foreground'
            />
            <Button
              variant='outline'
              onClick={async () => {
                if (await copyText(link)) toast.success(t('studio.linkCopied'));
                else toast.error(t('studio.copyFailed'));
              }}
            >
              {t('studio.copyLink')}
            </Button>
          </div>
        </Card>
      </div>
      <div className='lg:sticky lg:top-8'>{preview}</div>
    </div>
  );
}

/** On a computer the share sheet cannot take files, so a QR code opens this page on the phone, where Instagram lives. */
function Handoff() {
  const t = useTranslations('Share.studio');
  const [qr, setQr] = useState<string | null>(null);
  useEffect(() => {
    let ignore = false;
    QRCode.toDataURL(window.location.href, { width: 240, margin: 1 })
      .then(url => {
        if (!ignore) setQr(url);
      })
      .catch(() => undefined);
    return () => {
      ignore = true;
    };
  }, []);
  if (!qr) return null;
  return (
    <div className='grid grid-cols-[5.5rem_1fr] items-center gap-3 pt-1'>
      <img
        src={qr}
        alt={t('handoffAlt')}
        className='size-22 rounded-md bg-white p-1'
      />
      <p className='text-sm text-muted-foreground'>
        <span className='block font-medium text-foreground'>
          {t('handoffTitle')}
        </span>
        {t('handoffBody')}
      </p>
    </div>
  );
}
