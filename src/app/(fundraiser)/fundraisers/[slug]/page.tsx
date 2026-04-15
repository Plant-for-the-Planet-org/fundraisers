import type { Metadata } from 'next';

import { getLocale, getTranslations } from 'next-intl/server';
import { PlatformAPIError } from '@/lib/api/external-client';
import { getCachedFundraiser } from '@/lib/api/fundraiser-service';
import { getPaymentOptions } from '@/lib/api/payment-options-service';
import { getRichTextTextContent } from '@/lib/utils/rich-text';
import { FundraiserAuthRetry } from '@/components/fundraisers/fundraiser-auth-retry';
import { FundraiserView } from '@/components/fundraisers/fundraiser-view';

const MAX_METADATA_DESCRIPTION_LENGTH = 160;

function getMetadataDescription(
  description: string | null | undefined
): string | undefined {
  if (!description) {
    return undefined;
  }

  const plainTextDescription = getRichTextTextContent(description);
  if (!plainTextDescription) {
    return undefined;
  }

  if (plainTextDescription.length <= MAX_METADATA_DESCRIPTION_LENGTH) {
    return plainTextDescription;
  }

  const truncatedDescription = plainTextDescription
    .slice(0, MAX_METADATA_DESCRIPTION_LENGTH - 3)
    .trimEnd();
  const lastWordBoundary = truncatedDescription.lastIndexOf(' ');
  const readableDescription =
    lastWordBoundary > 0
      ? truncatedDescription.slice(0, lastWordBoundary)
      : truncatedDescription;

  return `${readableDescription}...`;
}

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
    const description = getMetadataDescription(fundraiser.description);

    if (fundraiser.visibility !== 'public') {
      return {
        title: fundraiser.title,
        robots: 'noindex, nofollow',
      };
    }

    return {
      title: fundraiser.title,
      description,
      openGraph: {
        title: fundraiser.title,
        description,
        type: 'website',
        images: fundraiser.image ? [fundraiser.image] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title: fundraiser.title,
        description,
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
