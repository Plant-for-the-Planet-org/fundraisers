import type { Metadata } from 'next';
import type { AlltimeStats } from '@/lib/api/alltime-stats';

import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { getAlltimeStats } from '@/lib/api/alltime-stats';
import { getCachedFundraiser } from '@/lib/api/fundraiser-service';
import { PlatformAPIError } from '@/lib/api/platform-fetch';
import { getFundraiserUrl } from '@/lib/utils/fundraiser';
import { getImageUrl } from '@/lib/utils/images';
import { getRichTextTextContent } from '@/lib/utils/rich-text';
import { FundraiserAuthRetry } from '@/components/fundraisers/fundraiser-auth-retry';
import { FundraiserView } from '@/components/fundraisers/fundraiser-view';
import { HostInviteNotice } from '@/components/host-invite/host-invite-notice';
import { loadFundraiserForRoute } from './load-fundraiser';

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

  const result = await loadFundraiserForRoute(slug, locale);

  if (result.kind === 'auth-retry') {
    return <FundraiserAuthRetry slug={slug} />;
  }

  if (result.kind === 'not-found') {
    notFound();
  }

  // A fundraiser resolves by GUID as well as by its exact slug, so one fundraiser is
  // reachable at two URLs. Umami keys pageviews by URL, which splits its visit count.
  // Send the GUID form to the slug, keeping the query so campaign params survive.
  // Verified live: the HID does not resolve here, and the slug is case-sensitive, so
  // neither reaches this check.
  //
  // Temporary on purpose: hosts can rename a slug, and a cached permanent redirect
  // would strand visitors on the old one.
  if (result.kind === 'canonical-slug') {
    const query = buildQueryString(await searchParams);
    const canonicalPath = getFundraiserUrl({
      id: result.fundraiser.id,
      slug: result.fundraiser.slug,
    });

    redirect(query ? `${canonicalPath}?${query}` : canonicalPath);
  }

  const { fundraiser, paymentOptions } = result;

  // Closed fundraisers show their impact instead of the donation form. Stats are optional: a failed call only drops the impact line.
  let impact: AlltimeStats['stats']['impact'] | undefined;
  if (!fundraiser.canDonate) {
    try {
      const { stats, settings } = await getAlltimeStats(
        fundraiser.slug || fundraiser.id
      );
      if (settings.show_impact) {
        impact = stats?.impact;
      }
    } catch (e) {
      if (!(e instanceof PlatformAPIError)) throw e;
    }
  }

  return (
    <>
      {/* Reads ?hostInvite to confirm a co-host invitation that was just answered. In Suspense because it uses useSearchParams, which would otherwise pull this page's whole client tree out of prerendering. */}
      <Suspense fallback={null}>
        <HostInviteNotice />
      </Suspense>
      <FundraiserView
        fundraiser={fundraiser}
        paymentOptions={paymentOptions}
        impact={impact}
      />
    </>
  );
}
