'use client';

import type { ShareSharer } from '@/lib/share/caption';
import type {
  ShareChannel,
  ShareChannelId,
  ShareKind,
  SharePlatformId,
} from '@/lib/share/channels';
import type { CtaKey } from '@/lib/share/cta';
import type { SeasonId } from '@/lib/share/render/seasons';
import type { ShareGift } from '@/lib/share/share-data';
import type { Fundraiser } from '@/lib/types/fundraiser';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { captionKey } from '@/lib/share/caption';
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
import { shareKitFileName } from '@/lib/share/file-name';
import { SHARE_FORMATS, SHARE_VIDEO_SECONDS } from '@/lib/share/formats';
import { buildShareUrl } from '@/lib/share/links';
import { getReferralCode } from '@/lib/share/referral';
import { isSeasonId, SEASON_IDS } from '@/lib/share/render/seasons';
import { formatShareGiftAmount } from '@/lib/share/share-data';
import { downloadBlob, shareFile, shareText } from '@/lib/share/web-share';
import { createZipParts } from '@/lib/share/zip';
import { cn } from '@/lib/utils';
import { hasFundraiserConcluded } from '@/lib/utils/fundraiser';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import { previewFitProps } from './preview-fit';
import { SharePreview } from './share-preview';
import { useCanShareFiles } from './use-can-share-files';
import { useOrigin } from './use-origin';
import {
  makeShareImage,
  makeShareVideo,
  SHARE_IMAGE_SCALE,
  useShareFiles,
} from './use-share-files';
import { useProjectPurposes, useShareRender } from './use-share-render';

const CUSTOM = '__custom';
const SUGGESTED = '__suggested';

// For aria-disabled buttons: they look and act disabled but keep keyboard focus, which a disabled button drops when it turns busy under the cursor, for example right after Try again.
const UNAVAILABLE =
  'aria-disabled:pointer-events-none aria-disabled:opacity-50';

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
    // A tile: the shape on top, the name and size below, so long names still fit a narrow column.
    'flex flex-col items-start justify-start gap-2 rounded-lg border px-3 py-3 text-left text-sm transition-colors',
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
 * Hosts get every option, in cards. Donors, right after giving, get the platforms and the preview, flat, to sit inside the thank-you card. The fundraiser page's "Share images" dialog uses the same flat layout.
 * The donor layout follows its own width: choices beside the preview from about 670px, one column below that.
 */
export function ShareStudio({
  fundraiser,
  variant,
  gift = null,
  sharer = 'donor',
  fitHeight,
  pinActions = false,
}: {
  fundraiser: Fundraiser;
  variant: 'host' | 'donor';
  /** The donor's completed gift, which they may put on the image and in the caption. */
  gift?: ShareGift | null;
  /** Who shares from the donor layout, for its caption. The fundraiser page does not know if the viewer gave. */
  sharer?: ShareSharer;
  /** Donor layout, side by side: the most height it may take, as a CSS length. The preview shrinks so the Share button stays in view. */
  fitHeight?: string;
  /** Donor layout, one column: keeps the Share or Download button at the bottom of the scroll area. The bar spans the scroll area's 1.5rem side and bottom padding (`-mx-6`, `-bottom-6`), so both must change with it. */
  pinActions?: boolean;
}) {
  const t = useTranslations('Share');
  const locale = useLocale();
  const isHost = variant === 'host';
  const origin = useOrigin();
  const refCode = getReferralCode(useAuthStore(state => state.user?.profile));

  const shareFiles = useCanShareFiles();
  const [pickedChannel, setPickedChannel] = useState<ShareChannelId | null>(
    null
  );
  // Until one is picked, donors start on a story where the share sheet takes files, and on a post where the file is downloaded instead.
  const channelId: ShareChannelId =
    pickedChannel ?? (isHost || shareFiles !== false ? 'anyStory' : 'anyPost');
  const channel: ShareChannel = getChannel(channelId);
  const [kind, setKind] = useState<ShareKind>('video');
  const [season, setSeason] = useState<SeasonId>('none');
  // An ended fundraiser thanks people instead of asking.
  const concluded = hasFundraiserConcluded(fundraiser);
  // Until the host picks one, the button text follows the style's suggestion, which changes as the projects' purposes load.
  const [ctaChoice, setCtaChoice] = useState<
    CtaKey | typeof CUSTOM | typeof SUGGESTED
  >(SUGGESTED);
  const [customCta, setCustomCta] = useState('');
  const [showDonors, setShowDonors] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [tip, setTip] = useState<string | null>(null);
  const [kitBusy, setKitBusy] = useState(false);
  const [includeGift, setIncludeGift] = useState(true);
  // The completed gift always counts in the total on the image; the box only adds its line and changes the caption.
  const donorGift = isHost ? null : gift;
  // An ended fundraiser's caption thanks rather than asks, so the gift stays off both the image and the caption.
  const offeredGift = concluded ? null : donorGift;
  const shownGift = includeGift ? offeredGift : null;
  // The caption without a gift. Keep this above the memos: the React Compiler cannot tell that the call leaves `concluded` alone, and skips the whole component when it comes later.
  const plainCaption = captionKey({
    sharer: isHost ? 'host' : sharer,
    season,
    concluded,
  });

  const purposes = useProjectPurposes(fundraiser, season === 'christmas');
  const suggested = seasonalCta(season, purposes, concluded);
  const ctaOptions = useMemo(
    () => [...new Set<CtaKey>([suggested, ...CTA_PRESETS])],
    [suggested]
  );
  const ctaKey: CtaKey | typeof CUSTOM =
    ctaChoice === SUGGESTED ? suggested : ctaChoice;
  const cta =
    ctaKey === CUSTOM
      ? customCta.trim() || t('cta.joinMe')
      : t(`cta.${ctaKey}`);

  const link = origin
    ? buildShareUrl({
        origin,
        slug: fundraiser.slug,
        source: channel.utm.source,
        medium: channel.utm.medium,
        ref: refCode,
      })
    : '';
  const render = useShareRender({
    fundraiser,
    season,
    cta,
    showDonors,
    gift: donorGift,
    // A link-only share sends just the text, and the chat previews it with the server's image, which never has the gift line.
    showGift: shownGift !== null && !channel.linkOnly,
  });
  const options = useMemo(
    () => ({
      data: render.data,
      theme: render.theme,
      photo: render.photo,
      background: render.background,
      avatars: render.avatars,
    }),
    [render.data, render.theme, render.photo, render.background, render.avatars]
  );
  const format = channel.format;
  const effectiveKind: ShareKind = channel.kinds.includes(kind)
    ? kind
    : channel.kinds[0];
  const files = useShareFiles({
    format,
    kind: effectiveKind,
    options,
    // The first format waits on the share sheet check, so no file is made for a format that is about to change.
    ready: render.ready && render.settled && shareFiles !== null,
    slug: fundraiser.slug,
  });
  const file =
    effectiveKind === 'video' && files.video ? files.video : files.image;

  const defaultMessage = shownGift
    ? t(`captions.gift.${shownGift.frequency}`, {
        amount: formatShareGiftAmount(shownGift, locale),
        name: fundraiser.title,
      })
    : t(`captions.${plainCaption}`, { name: fundraiser.title });
  const caption = `${message ?? defaultMessage}\n${link}`;
  const platformLabel = t(`platforms.${channel.platform}`);
  const channelTip = t(`channels.${channelId}.tip`);
  // A story, TikTok or Short cannot carry a link in its text, so it gets the link alone, for a sticker or the bio. A post gets the caption with the link.
  const copiesLink =
    format === 'story' || format === 'tiktok' || format === 'shorts';

  const selectPlatform = (platform: SharePlatformId) => {
    const first = channelsFor(platform)[0];
    setPickedChannel(first.id as ShareChannelId);
    setKind(first.kinds[0]);
    setTip(null);
  };
  const selectChannel = (id: ShareChannelId) => {
    setPickedChannel(id);
    setKind(getChannel(id).kinds[0]);
    setTip(null);
  };
  const selectSeason = (value: SeasonId) => {
    setSeason(value);
    // A style suggests its own button text; a custom one stays.
    if (ctaChoice !== CUSTOM) setCtaChoice(SUGGESTED);
  };

  const busy = !file || files.progress !== null;
  // A link-only share needs no file, so its Share button keeps working and the download button offers the retry instead.
  const failed = files.failed && !channel.linkOnly;
  const retryDownload = files.failed && channel.linkOnly === true;
  const primaryDisabled = busy && !channel.linkOnly && !failed;
  const downloadDisabled = busy && !retryDownload;
  const primaryLabel = failed
    ? t('studio.renderFailed')
    : files.progress !== null
      ? t('studio.preparingVideo', {
          percent: String(Math.round(files.progress * 100)),
        })
      : channel.linkOnly
        ? t('studio.shareLink')
        : !file
          ? t('studio.preparing')
          : shareFiles
            ? channel.platform === 'other'
              ? t('studio.share')
              : t('studio.shareTo', { platform: platformLabel })
            : effectiveKind === 'video' && files.video
              ? t('studio.downloadVideo')
              : t('studio.downloadImage');

  /** Copies what the channel needs and returns its tip, which says what was copied only when it was. */
  const copyForChannel = async (): Promise<string> => {
    if (await copyText(copiesLink ? link : caption)) {
      const copied = t(
        copiesLink ? 'studio.linkCopiedTip' : 'studio.captionCopiedTip'
      );
      return channel.tipOnlyIfCopyFails ? copied : `${copied} ${channelTip}`;
    }
    toast.error(t('studio.copyFailed'));
    return channelTip;
  };

  const onPrimary = async () => {
    if (primaryDisabled) return;
    setTip(null);
    if (failed) {
      files.retry();
      return;
    }
    if (channel.linkOnly) {
      // Desktop browsers without a share sheet leave `share` undefined, whatever the types say.
      if ('share' in navigator) {
        await shareText(caption).catch(() =>
          toast.error(t('studio.shareFailed'))
        );
      } else if (await copyText(caption))
        toast.success(t('studio.messageCopied'));
      else toast.error(t('studio.copyFailed'));
      return;
    }
    if (!file) return;
    if (shareFiles) {
      // Copy before the sheet opens: the app gets only the file, so the link or caption is pasted by hand.
      const nextTip = await copyForChannel();
      try {
        if (await shareFile(file)) setTip(nextTip);
      } catch {
        toast.error(t('studio.shareFailed'));
      }
      return;
    }
    downloadBlob(file, file.name);
    const nextTip = await copyForChannel();
    setTip(t('studio.savedTip', { file: file.name, tip: nextTip }));
  };

  const onDownload = () => {
    if (retryDownload) {
      files.retry();
      return;
    }
    if (downloadDisabled) return;
    const target = channel.linkOnly ? files.image : file;
    if (target) downloadBlob(target, target.name);
  };

  const onKit = async () => {
    setKitBusy(true);
    try {
      // One file at a time, each turned into bytes before the next, so a phone never holds every large canvas at once.
      const entries: Array<{ name: string; data: Uint8Array }> = [];
      const add = async (file: File | null) => {
        if (file)
          entries.push({
            name: file.name,
            data: new Uint8Array(await file.arrayBuffer()),
          });
      };
      for (const f of ['story', 'post', 'banner'] as const) {
        await add(await makeShareImage(f, options, fundraiser.slug));
      }
      // The images still ship if the video cannot be made.
      await add(
        await makeShareVideo('story', options, fundraiser.slug).catch(
          () => null
        )
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
      entries.push({
        name: 'captions.txt',
        data: new TextEncoder().encode(captions),
      });
      downloadBlob(
        new Blob(createZipParts(entries) as BlobPart[], {
          type: 'application/zip',
        }),
        shareKitFileName(fundraiser.slug)
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

  const kindToggle = channel.kinds.length > 1 && (
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
  );

  const preview = (
    <SharePreview
      format={format}
      animate={effectiveKind === 'video'}
      options={options}
      label={t('studio.previewLabel')}
    />
  );

  const meta = (
    <p className='text-xs text-muted-foreground'>
      {effectiveKind === 'video'
        ? t('studio.videoMeta', {
            seconds: String(SHARE_VIDEO_SECONDS),
            width: String(w),
            height: String(h),
          })
        : t('studio.imageMeta', {
            width: String(w * SHARE_IMAGE_SCALE),
            height: String(h * SHARE_IMAGE_SCALE),
          })}
    </p>
  );

  const actions = (
    <>
      <Button
        onClick={() => void onPrimary()}
        aria-disabled={primaryDisabled}
        // Only the dashboard mirrors the accent into --primary. The thank-you card and the page's Share images dialog do not, so the donor's button asks for it.
        className={cn(
          'relative overflow-hidden',
          UNAVAILABLE,
          !isHost &&
            'bg-accent-color text-[var(--cta-foreground,#fff)] hover:bg-accent-color hover:opacity-90'
        )}
      >
        {/* The video's progress runs along the button's bottom edge, so nothing around it moves while it is made. */}
        {files.progress !== null && (
          <span
            className='absolute inset-x-0 bottom-0 h-1 bg-current/20'
            aria-hidden='true'
          >
            <span
              className='block h-full bg-current/70 transition-[width]'
              style={{ width: `${Math.round(files.progress * 100)}%` }}
            />
          </span>
        )}
        {primaryLabel}
      </Button>
      {(shareFiles || channel.linkOnly) && (
        <Button
          variant='outline'
          onClick={onDownload}
          aria-disabled={downloadDisabled}
          className={UNAVAILABLE}
        >
          {retryDownload
            ? t('studio.renderFailed')
            : channel.linkOnly
              ? t('studio.downloadPreview')
              : effectiveKind === 'video' && files.video
                ? t('studio.downloadVideo')
                : t('studio.downloadImage')}
        </Button>
      )}
      {files.videoUnsupported && effectiveKind === 'video' && (
        <p className='text-xs text-muted-foreground'>{t('studio.noVideo')}</p>
      )}
      {/* Always in the page, so screen readers announce the tip, or a failed image, when it appears. */}
      <p
        role='status'
        className={
          files.failed || tip
            ? 'rounded-lg bg-accent-color/10 px-3 py-2 text-sm'
            : 'sr-only'
        }
      >
        {files.failed ? t('studio.renderFailedTip') : tip}
      </p>
      {isHost && (
        <Button
          variant='link'
          size='sm'
          onClick={() => void onKit()}
          disabled={kitBusy || !render.ready || !render.settled}
        >
          {kitBusy ? t('studio.kitPreparing') : t('studio.kit')}
        </Button>
      )}
    </>
  );

  // Icon only, like the dashboard menu when collapsed. The name is the tooltip and the accessible label.
  // Donors get one row that shrinks to fit the narrow thank-you column, so no icon wraps onto a line of its own.
  const platformRow = (
    <div
      className={
        isHost ? 'flex flex-wrap gap-1' : 'grid justify-items-center gap-0.5'
      }
      style={
        isHost
          ? undefined
          : {
              gridTemplateColumns: `repeat(${SHARE_PLATFORMS.length}, minmax(0, 1fr))`,
            }
      }
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
              'flex items-center justify-center rounded-md transition-colors',
              isHost ? 'size-9' : 'aspect-square w-full max-w-9',
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
  );

  const formatTiles = (
    <div
      className={cn(
        'grid grid-cols-2 gap-2',
        // Donors: by the width of the choices column, which is a container.
        isHost ? 'sm:grid-cols-3' : '@sm:grid-cols-3'
      )}
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
            <span className='flex h-5 items-center' aria-hidden='true'>
              <span
                className='rounded-[3px] border-2 border-current opacity-50'
                style={{ width: sw, height: sh }}
              />
            </span>
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
  );

  if (!isHost) {
    // A container query, not the viewport: the page's dialog is wide enough for two columns, the thank-you card is not.
    return (
      <div className='@container'>
        <div className='flex flex-col gap-4 @2xl:grid @2xl:grid-cols-[minmax(0,1fr)_20rem] @2xl:grid-rows-[auto_1fr] @2xl:gap-x-8 @2xl:gap-y-3'>
          <div className='@container grid min-w-0 content-start gap-4 @2xl:row-span-2'>
            {platformRow}
            {formatTiles}
            {offeredGift && (
              <div className='flex items-center gap-3'>
                <Checkbox
                  id='share-include-gift'
                  checked={includeGift}
                  onCheckedChange={checked => setIncludeGift(checked === true)}
                />
                <label
                  htmlFor='share-include-gift'
                  className='cursor-pointer select-none text-sm font-medium text-foreground'
                >
                  {t('donor.includeGift')}
                </label>
              </div>
            )}
          </div>
          <div className='flex flex-col items-center gap-3 @2xl:col-start-2'>
            {kindToggle}
            <div {...previewFitProps(fitHeight, w / h)}>{preview}</div>
            {meta}
          </div>
          <div
            className={cn(
              'grid content-start gap-2 @2xl:col-start-2',
              pinActions &&
                'sticky -bottom-6 z-10 -mx-6 border-t bg-background px-6 py-3 @2xl:static @2xl:mx-0 @2xl:border-t-0 @2xl:bg-transparent @2xl:p-0'
            )}
          >
            {actions}
          </div>
        </div>
      </div>
    );
  }

  const previewCard = (
    <Card className='items-center gap-3 border-border/60 px-5 py-5 shadow-xs'>
      {kindToggle}
      {preview}
      {meta}
      <div className='grid w-full gap-2'>{actions}</div>
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
      {platformRow}
      {formatTiles}
    </Card>
  );

  const customizeCard = (
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
            onValueChange={value => {
              if (isSeasonId(value)) selectSeason(value);
            }}
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
            value={ctaKey}
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
        {ctaKey === CUSTOM && (
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
        <div className='grid gap-1'>
          <label className='flex h-9 items-center gap-2 text-sm'>
            <Switch
              checked={showDonors && render.donorsAvailable}
              disabled={!render.donorsAvailable}
              onCheckedChange={setShowDonors}
            />
            {t('studio.showDonors')}
          </label>
          {!render.donorsAvailable && (
            <p className='max-w-64 text-xs text-muted-foreground'>
              {t('studio.donorsUnavailable')}
            </p>
          )}
        </div>
      </div>
    </Card>
  );

  const captionCard = (
    <Card className='gap-4 border-border/60 px-6 py-5 shadow-xs'>
      <div>
        <h2
          id='share-caption-title'
          className='text-lg font-semibold text-foreground'
        >
          {t('studio.captionTitle')}
        </h2>
        <p className='mt-1 text-sm text-muted-foreground'>
          {t(copiesLink ? 'studio.captionHintLinkAlone' : 'studio.captionHint')}
        </p>
      </div>
      <Textarea
        aria-labelledby='share-caption-title'
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
            if (await copyText(caption))
              toast.success(t('studio.captionCopied'));
            else toast.error(t('studio.copyFailed'));
          }}
        >
          {t('studio.copy')}
        </Button>
      </div>
    </Card>
  );

  // On phones the preview and its Share button come right after the platforms, so a host who picks one sees the result without scrolling past the other cards. From md up the preview sits in its own column beside all three, and the order still matches the tab order.
  return (
    <div className='grid items-start gap-6 md:grid-cols-[minmax(0,1fr)_17rem] md:grid-rows-[auto_1fr] lg:grid-cols-[minmax(0,1fr)_22rem]'>
      <div className='min-w-0 md:col-start-1 md:row-start-1'>{picker}</div>
      <div className='md:sticky md:top-8 md:col-start-2 md:row-span-2 md:row-start-1'>
        {previewCard}
      </div>
      <div className='grid min-w-0 gap-6 md:col-start-1 md:row-start-2'>
        {customizeCard}
        {captionCard}
      </div>
    </div>
  );
}
