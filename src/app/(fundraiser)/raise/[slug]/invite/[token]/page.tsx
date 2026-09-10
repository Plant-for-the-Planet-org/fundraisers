import type { Metadata } from 'next';

import { notFound, redirect } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { getCachedHostInvite } from '@/lib/api/host-invite-service';
import {
  getHostInviteRedirectSlug,
  resolveHostInviteBarLookup,
} from '@/lib/utils/host-invite';
import { FundraiserAuthRetry } from '@/components/fundraisers/fundraiser-auth-retry';
import { FundraiserView } from '@/components/fundraisers/fundraiser-view';
import { HostInviteBar } from '@/components/host-invite/host-invite-bar';
import { loadFundraiserForRoute } from '../../load-fundraiser';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('HostInvite.metadata');

  return {
    title: t('title'),
    // The URL carries an invitation token, so this page must never be indexed or archived.
    robots: 'noindex, nofollow, noarchive',
  };
}

/**
 * Where an invitation email lands, nested under the fundraiser it invites to so the visitor sees
 * the fundraiser itself, not a bare form.
 *
 * The invitation is read here and the bar only answers it. That split is the point of the whole
 * flow: mail clients and corporate gateways fetch every link in an incoming message before a human
 * sees it, so accepting has to be a click on this page rather than the act of opening it. Reading
 * is safe for anything that pre-fetches; nothing changes until a button is pressed.
 *
 * `intent=decline` comes from the smaller "decline" link in the email. It only moves focus to the
 * decline button — it does not decline anything on its own, for the same reason.
 */
export default async function HostInvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; token: string }>;
  searchParams: Promise<{ intent?: string }>;
}) {
  const [{ slug, token }, { intent }] = await Promise.all([
    params,
    searchParams,
  ]);
  const locale = await getLocale();

  const lookup = await getCachedHostInvite(token);
  const declineSuffix =
    intent === 'decline' || intent === 'accept' ? `?intent=${intent}` : '';

  // Hosts can rename a slug after an invitation is sent. The token names the fundraiser, so an
  // invitation that disagrees with the URL wins and the visitor is sent to the current slug.
  const redirectSlug = getHostInviteRedirectSlug(lookup, slug);
  if (redirectSlug) {
    redirect(`/raise/${redirectSlug}/invite/${token}${declineSuffix}`);
  }

  const result = await loadFundraiserForRoute(slug, locale);

  if (result.kind === 'not-found') {
    notFound();
  }

  if (result.kind === 'canonical-slug') {
    redirect(
      `/raise/${result.fundraiser.slug}/invite/${token}${declineSuffix}`
    );
  }

  if (result.kind === 'auth-retry') {
    return (
      <div className='flex flex-col gap-6'>
        <HostInviteBar token={token} lookup={lookup} intent={intent} />
        <FundraiserAuthRetry slug={slug} />
      </div>
    );
  }

  const { fundraiser, paymentOptions } = result;
  const barLookup = resolveHostInviteBarLookup(lookup, fundraiser);

  return (
    <div className='flex flex-col gap-6'>
      <HostInviteBar token={token} lookup={barLookup} intent={intent} />
      <FundraiserView fundraiser={fundraiser} paymentOptions={paymentOptions} />
    </div>
  );
}
