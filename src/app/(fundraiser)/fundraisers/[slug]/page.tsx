import type { Metadata } from 'next';

import { getLocale, getTranslations } from 'next-intl/server';
import { PlatformAPIError } from '@/lib/api/external-client';
import { getCachedFundraiser } from '@/lib/api/fundraiser-service';
import { getPaymentOptions } from '@/lib/api/payment-options-service';
import { FundraiserAuthRetry } from '@/components/fundraisers/fundraiser-auth-retry';
import { FundraiserView } from '@/components/fundraisers/fundraiser-view';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const tMetadata = await getTranslations({
    locale,
    namespace: 'Fundraisers.metadata',
  });

  try {
    const fundraiser = await getCachedFundraiser(slug, locale);

    if (fundraiser.visibility !== 'public') {
      return {
        title: fundraiser.title,
        robots: 'noindex, nofollow',
      };
    }

    return {
      title: fundraiser.title,
      description: fundraiser.description ?? undefined,
      openGraph: {
        title: fundraiser.title,
        description: fundraiser.description ?? undefined,
        type: 'website',
        images: fundraiser.image ? [fundraiser.image] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title: fundraiser.title,
        description: fundraiser.description ?? undefined,
        images: fundraiser.image ? [fundraiser.image] : undefined,
      },
    };
  } catch {
    return { title: tMetadata('fallbackTitle') };
  }
}

export default async function FundraiserPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getLocale();

  let fundraiser;
  try {
    fundraiser = await getCachedFundraiser(slug, locale);
  } catch (e) {
    if (
      e instanceof PlatformAPIError &&
      e.status &&
      [401, 403, 404].includes(e.status)
    ) {
      return <FundraiserAuthRetry slug={slug} />;
    }
    throw e;
  }

  let paymentOptions;
  if (fundraiser.canDonate) {
    try {
      paymentOptions = await getPaymentOptions(fundraiser.id);
    } catch (e) {
      if (!(e instanceof PlatformAPIError)) throw e;
    }
  }

  return (
    <FundraiserView fundraiser={fundraiser} paymentOptions={paymentOptions} />
  );
}
