import type { Metadata } from 'next';

import { getLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { PlatformAPIError } from '@/lib/api/external-client';
import { getCachedFundraiser } from '@/lib/api/fundraiser-service';
import { getPaymentOptions } from '@/lib/api/payment-options-service';
import { getFundraiserUrl } from '@/lib/utils/fundraiser';
import { getImageUrl } from '@/lib/utils/images';
import { getRichTextTextContent } from '@/lib/utils/rich-text';
import { FundraiserAuthRetry } from '@/components/fundraisers/fundraiser-auth-retry';
import { FundraiserView } from '@/components/fundraisers/fundraiser-view';

const MAX_METADATA_DESCRIPTION_LENGTH = 200;

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

function getFundraiserMetadataImage(
  image: string | null | undefined
): string | undefined {
  if (!image) {
    return undefined;
  }

  if (/^https?:\/\//i.test(image)) {
    return image;
  }

  return getImageUrl('fundraiser', 'large', image) ?? undefined;
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

    if (fundraiser.visibility !== 'public') {
      return {
        title: fundraiser.title,
        robots: 'noindex, nofollow',
      };
    }

    const description = getMetadataDescription(fundraiser.description);
    const canonicalUrl = getFundraiserUrl({
      id: fundraiser.id,
      slug: fundraiser.slug || fundraiser.hid,
    });
    const imageUrl = getFundraiserMetadataImage(fundraiser.image);

    return {
      title: fundraiser.title,
      description,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title: fundraiser.title,
        description,
        type: 'website',
        url: canonicalUrl,
        images: imageUrl
          ? [
              {
                url: imageUrl,
                width: 1200,
                height: 630,
                alt: fundraiser.title,
              },
            ]
          : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title: fundraiser.title,
        description,
        images: imageUrl ? [imageUrl] : undefined,
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
    if (e instanceof PlatformAPIError && e.status) {
      if ([401, 403, 404].includes(e.status)) {
        return <FundraiserAuthRetry slug={slug} />;
      }
      if (e.status === 405) {
        notFound();
      }
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
