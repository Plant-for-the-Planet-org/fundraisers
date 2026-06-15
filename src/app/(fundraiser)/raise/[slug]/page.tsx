import type { Metadata } from 'next';

import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { getCachedFundraiser } from '@/lib/api/fundraiser-service';
import { getPaymentOptions } from '@/lib/api/payment-options-service';
import { PlatformAPIError } from '@/lib/api/platform-fetch';
import {
  buildShareText,
  getShareDescription,
  SHARE_TEXT_SOURCE,
} from '@/lib/share/share-text';
import { formatCurrencyFromDecimal } from '@/lib/utils/currency';
import { getFundraiserUrl } from '@/lib/utils/fundraiser';
import { getImageUrl } from '@/lib/utils/images';
import { FundraiserAuthRetry } from '@/components/fundraisers/fundraiser-auth-retry';
import { FundraiserView } from '@/components/fundraisers/fundraiser-view';

const META_IMAGE_URL = '/FUNDRAISER-Meta-Cover.jpg';

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
  const tShare = await getTranslations({
    locale,
    namespace: 'Fundraisers.share',
  });

  try {
    const fundraiser = await getCachedFundraiser(slug, locale);

    if (fundraiser.visibility !== 'public') {
      return {
        title: fundraiser.title,
        robots: 'noindex, nofollow',
      };
    }

    // SEO meta description stays the fundraiser's own description; the
    // share/link-preview text is driven by SHARE_TEXT_SOURCE so the OG card and
    // the native share sheet always say the same thing.
    const description = getShareDescription(fundraiser.description);
    const goalText =
      fundraiser.goalAmount > 0
        ? tShare('goalText', {
            goal: formatCurrencyFromDecimal(
              fundraiser.goalAmount,
              fundraiser.currency,
              locale
            ),
          })
        : undefined;
    const shareText =
      buildShareText({
        source: SHARE_TEXT_SOURCE,
        description: fundraiser.description,
        goalText,
      }) ?? fundraiser.title;
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
        description: shareText,
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
        description: shareText,
        images: [imageUrl],
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
