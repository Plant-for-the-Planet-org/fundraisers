import type { Metadata } from 'next';
import { getCachedFundraiser } from '@/lib/api/fundraiser-service';
import { getPaymentOptions } from '@/lib/api/payment-options-service';
import { PlatformAPIError } from '@/lib/api/external-client';
import { FundraiserAuthRetry } from '@/components/fundraisers/fundraiser-auth-retry';
import { FundraiserView } from '@/components/fundraisers/fundraiser-view';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const fundraiser = await getCachedFundraiser(slug);
    return {
      title: fundraiser.title,
      description: fundraiser.description ?? undefined,
      openGraph: {
        title: fundraiser.title,
        images: fundraiser.image ? [fundraiser.image] : undefined,
      },
    };
  } catch {
    return { title: 'Fundraiser' };
  }
}

export default async function FundraiserPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let fundraiser;
  try {
    fundraiser = await getCachedFundraiser(slug);
  } catch (e) {
    if (e instanceof PlatformAPIError && e.status === 404) {
      return <FundraiserAuthRetry slug={slug} />;
    }
    throw e;
  }

  const paymentOptions = fundraiser.canDonate
    ? await getPaymentOptions(fundraiser.id)
    : undefined;

  return (
    <FundraiserView fundraiser={fundraiser} paymentOptions={paymentOptions} />
  );
}
