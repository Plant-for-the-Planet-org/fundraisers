'use client';

import { type ReactNode, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/index';
import { useAuthStore } from '@/stores/auth-store';
import { Fa } from '@/components/fa';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { FOREST_CLOUD_APPS, type ForestCloudApp } from './catalogue';
import { visibleApps } from './filter';
import { useFavorites } from './use-favorites';

/**
 * ForestCloud app launcher — the waffle in the top bar. Click to open a grid of
 * apps and switch between them; pin favourites to the top.
 *
 * Pass `currentAppId` so this app is shown as the active tile. The on/off flag
 * (FC_APP_SWITCHER) is checked by the server component that mounts this.
 */
export function AppLauncher({ currentAppId }: { currentAppId?: string }) {
  const t = useTranslations('Common.appSwitcher');

  // Identity comes from the app's auth store. When this folder moves to
  // @planet/sdk, replace this with an injected `user` prop so the SDK stays
  // auth-agnostic.
  const user = useAuthStore(s => s.user);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

  const { isFavorite, toggle } = useFavorites(user?.sub);

  // v0: the token carries no per-app grants, so every ungated app shows and
  // `requires` apps stay hidden. See filter.ts / readGrants().
  const apps = useMemo(() => visibleApps(FOREST_CLOUD_APPS), []);

  // The grid is open to everyone; pinning favourites needs a signed-in identity.
  const pinnable = isAuthenticated;

  const favorites = apps.filter(a => isFavorite(a.id));
  const rest = apps.filter(a => !isFavorite(a.id));
  const mainApps = rest.filter(a => a.group !== 'more');
  const moreApps = rest.filter(a => a.group === 'more');

  const renderTile = (app: ForestCloudApp) => (
    <AppTile
      key={app.id}
      app={app}
      current={app.id === currentAppId}
      favorite={isFavorite(app.id)}
      pinnable={pinnable}
      onToggleFavorite={() => toggle(app.id)}
    />
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          aria-label={t('triggerLabel')}
          title={t('triggerLabel')}
        >
          <Fa icon='grid-2' className='size-5 text-forestcloud' />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align='end'
        sideOffset={8}
        collisionPadding={12}
        className='w-[22rem] p-0'
      >
        <div className='mb-1 flex items-center gap-2.5 border-b px-3 pt-3 pb-2.5'>
          <span className='flex size-7 shrink-0 items-center justify-center rounded-lg bg-forestcloud/10'>
            <Fa icon='grid-2' className='size-4 text-forestcloud' />
          </span>
          <div className='leading-tight'>
            <p className='text-sm font-semibold'>{t('title')}</p>
            <p className='text-[0.7rem] text-muted-foreground'>
              {t('subtitle')}
            </p>
          </div>
        </div>

        <div className='max-h-[60vh] overflow-y-auto px-2 pb-2'>
          {favorites.length > 0 && (
            <Section label={t('favourites')}>
              {favorites.map(renderTile)}
            </Section>
          )}
          {mainApps.length > 0 && (
            <Section
              label={
                favorites.length > 0 || moreApps.length > 0
                  ? t('apps')
                  : undefined
              }
            >
              {mainApps.map(renderTile)}
            </Section>
          )}
          {moreApps.length > 0 && (
            <Section label={t('more')}>{moreApps.map(renderTile)}</Section>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Section({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className='pt-1'>
      {label && (
        <p className='px-1.5 pt-1 pb-1 text-[0.7rem] font-medium tracking-wide text-muted-foreground uppercase'>
          {label}
        </p>
      )}
      <div className='grid grid-cols-3 gap-0.5'>{children}</div>
    </div>
  );
}

function AppIcon({ app }: { app: ForestCloudApp }) {
  const [failed, setFailed] = useState(false);
  if (app.iconUrl && !failed) {
    return (
      // Plain <img>, not next/image: this stays portable for @planet/sdk and
      // needs no per-app remote-image config. Falls back to the FA icon on error.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={app.iconUrl}
        alt=''
        loading='lazy'
        onError={() => setFailed(true)}
        className={cn(
          // Full-bleed app icons carry their own background + corners, so fill
          // the tile edge-to-edge; small marks (favicons) stay 24px in the chip.
          app.iconBleed ? 'size-full object-cover' : 'size-6 object-contain'
        )}
      />
    );
  }
  return <Fa icon={app.icon} className='size-5 text-forestcloud' />;
}

function AppTile({
  app,
  current,
  favorite,
  pinnable,
  onToggleFavorite,
}: {
  app: ForestCloudApp;
  current: boolean;
  favorite: boolean;
  pinnable: boolean;
  onToggleFavorite: () => void;
}) {
  const t = useTranslations('Common.appSwitcher');

  const body = (
    <>
      <span
        className={cn(
          'flex size-11 items-center justify-center overflow-hidden rounded-xl',
          // Full-bleed icons paint their own tile; only chrome the chip (muted
          // bg, hover, active tint) for the small centred favicon marks.
          !app.iconBleed &&
            cn(
              'transition-colors',
              current
                ? 'bg-forestcloud/10'
                : 'bg-muted group-hover/tile:bg-accent'
            )
        )}
      >
        <AppIcon app={app} />
      </span>
      <span className='line-clamp-2 text-center text-xs leading-tight font-medium text-foreground'>
        {app.name}
      </span>
    </>
  );

  return (
    <div className='group/tile relative'>
      {current ? (
        <div
          aria-current='true'
          className='flex flex-col items-center gap-1.5 rounded-lg p-2.5 ring-1 ring-forestcloud/20 ring-inset'
        >
          {body}
        </div>
      ) : (
        <a
          href={app.url}
          target='_blank'
          rel='noopener noreferrer'
          className='flex flex-col items-center gap-1.5 rounded-lg p-2.5 outline-none transition-colors hover:bg-accent focus-visible:bg-accent'
        >
          {body}
        </a>
      )}

      {pinnable && (
        <button
          type='button'
          aria-label={
            favorite
              ? t('unpin', { name: app.name })
              : t('pin', { name: app.name })
          }
          aria-pressed={favorite}
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFavorite();
          }}
          className={cn(
            'absolute top-1 right-1 flex size-5 items-center justify-center rounded-md text-[0.7rem] transition-opacity hover:bg-background/60',
            favorite
              ? 'text-amber-500 opacity-100'
              : 'text-muted-foreground opacity-0 group-hover/tile:opacity-100 focus-visible:opacity-100'
          )}
        >
          <Fa icon='star' />
        </button>
      )}
    </div>
  );
}
