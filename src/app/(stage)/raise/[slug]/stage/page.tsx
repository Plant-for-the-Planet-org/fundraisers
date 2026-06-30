import type { Locale } from '@/i18n/routing';

import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import { getCachedFundraiser } from '@/lib/api/fundraiser-service';
import { PlatformAPIError } from '@/lib/api/platform-fetch';
import { buildTheme } from '@/lib/theme/build-theme';
import { routing } from '@/i18n/routing';
import { StageView } from '@/modules/stage';

async function loadStageMessages(locale: Locale) {
  const mod = await import(`../../../../../../locales/${locale}/stage.json`);
  return mod.default;
}

export default async function StagePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const appLocale = await getLocale();

  let fundraiser;
  let theme;

  try {
    fundraiser = await getCachedFundraiser(slug, appLocale);
    theme = buildTheme(fundraiser.settings?.theme ?? null);
  } catch (e) {
    if (e instanceof PlatformAPIError && e.status && [404].includes(e.status)) {
      const t = await getTranslations('Stage');
      return (
        <div className='flex h-full items-center justify-center text-white/60'>
          {t('fundraiserNotFound')}
        </div>
      );
    }
    throw e;
  }

  const stageSettings = fundraiser.settings?.modules?.stage ?? undefined;

  if (!stageSettings?.enabled) {
    const t = await getTranslations({ locale: appLocale, namespace: 'Stage' });
    return (
      <div className='flex h-dvh w-screen flex-col items-center justify-center gap-3 bg-[#0b1220] text-center'>
        <p className='text-lg font-semibold text-white'>{t('notEnabled')}</p>
        <p className='text-sm text-white/50'>{t('notEnabledHint')}</p>
      </div>
    );
  }

  const stageLocale: Locale = hasLocale(routing.locales, stageSettings.locale)
    ? stageSettings.locale
    : routing.defaultLocale;

  const stageMessages = await loadStageMessages(stageLocale);

  return (
    <NextIntlClientProvider locale={stageLocale} messages={stageMessages}>
      <StageView
        fundraiser={fundraiser}
        theme={theme}
        stageSettings={stageSettings}
        locale={stageLocale}
      />
    </NextIntlClientProvider>
  );
}
