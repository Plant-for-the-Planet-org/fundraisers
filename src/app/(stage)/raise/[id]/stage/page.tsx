import { getLocale } from 'next-intl/server';
import { PlatformAPIError } from '@/lib/api/external-client';
import { getCachedFundraiser } from '@/lib/api/fundraiser-service';
import { buildTheme } from '@/lib/theme/build-theme';
import { StageView } from '@/components/stage/stage-view';

export default async function StagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const locale = await getLocale();

  let fundraiser;
  let theme;

  try {
    fundraiser = await getCachedFundraiser(id, locale);
    theme = buildTheme(fundraiser.settings?.theme ?? null);
  } catch (e) {
    if (e instanceof PlatformAPIError && e.status && [404].includes(e.status)) {
      return (
        <div className="flex h-full items-center justify-center text-white/60">
          Fundraiser not found.
        </div>
      );
    }
    throw e;
  }

  const stageSettings = (
    fundraiser.settings?.modules as Record<string, unknown> | undefined
  )?.stage as Record<string, unknown> | undefined;

  if (!stageSettings?.enabled) {
    return (
      <div className="flex h-dvh w-screen flex-col items-center justify-center gap-3 bg-[#0b1220] text-center">
        <p className="text-lg font-semibold text-white">Stage Mode is not enabled for this fundraiser.</p>
        <p className="text-sm text-white/50">Update it on fundraiser settings or ask the Host.</p>
      </div>
    );
  }

  return (
    <StageView
      fundraiser={fundraiser}
      theme={theme}
      stageSettings={stageSettings}
    />
  );
}
