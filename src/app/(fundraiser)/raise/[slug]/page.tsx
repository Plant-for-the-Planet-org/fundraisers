import type { Metadata } from 'next';

import { notFound, redirect } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { getCachedFundraiser } from '@/lib/api/fundraiser-service';
import { getPaymentOptions } from '@/lib/api/payment-options-service';
import { PlatformAPIError } from '@/lib/api/platform-fetch';
import { getFundraiserUrl } from '@/lib/utils/fundraiser';
import { getImageUrl } from '@/lib/utils/images';
import { getRichTextTextContent } from '@/lib/utils/rich-text';
import { FundraiserAuthRetry } from '@/components/fundraisers/fundraiser-auth-retry';
import { FundraiserView } from '@/components/fundraisers/fundraiser-view';

const MAX_METADATA_DESCRIPTION_LENGTH = 200;
const META_IMAGE_URL = '/FUNDRAISER-Meta-Cover.jpg';

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

function getFundraiserMetadataImage(image: string | null | undefined): string {
  if (!image) {
    return META_IMAGE_URL;
  }

  if (/^https?:\/\//i.test(image)) {
    return image;
  }

  return getImageUrl('fundraiser', 'large', image) ?? META_IMAGE_URL;
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
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: fundraiser.title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: fundraiser.title,
        description,
        images: [imageUrl],
      },
    };
  } catch {
    return { title: tMetadata('fallbackTitle') };
  }
}

/** Rebuilds the incoming query string so a canonical redirect keeps its campaign params. */
function buildQueryString(
  searchParams: Record<string, string | string[] | undefined>
): string {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      value.forEach(entry => query.append(key, entry));
    } else if (value !== undefined) {
      query.append(key, value);
    }
  }

  return query.toString();
}

export default async function FundraiserPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
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

  // A fundraiser resolves by GUID as well as by its exact slug, so one fundraiser is
  // reachable at two URLs. Umami keys pageviews by URL, which splits its visit count.
  // Send the GUID form to the slug, keeping the query so campaign params survive.
  // Verified live: the HID does not resolve here, and the slug is case-sensitive, so
  // neither reaches this check.
  //
  // Temporary on purpose: hosts can rename a slug, and a cached permanent redirect
  // would strand visitors on the old one. Must stay outside the try above, since
  // `redirect` signals by throwing.
  if (fundraiser.slug && fundraiser.slug !== slug) {
    const query = buildQueryString(await searchParams);
    const canonicalPath = getFundraiserUrl({
      id: fundraiser.id,
      slug: fundraiser.slug,
    });

    redirect(query ? `${canonicalPath}?${query}` : canonicalPath);
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
