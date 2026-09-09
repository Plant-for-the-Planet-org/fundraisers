import type { Metadata } from 'next';

import { getTranslations } from 'next-intl/server';
import { getHostInvite } from '@/lib/api/host-invite-service';
import { HostInviteCard } from '@/components/host-invite/host-invite-card';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('HostInvite.metadata');

  return {
    title: t('title'),
    // The URL carries an invitation token, so this page must never be indexed or archived.
    robots: 'noindex, nofollow, noarchive',
  };
}

/**
 * Where an invitation email lands.
 *
 * The invitation is read here and the card only answers it. That split is the point of the whole flow: mail clients and corporate gateways fetch every link in an incoming message before a human sees it, so accepting has to be a click on this page rather than the act of opening it. Reading is safe for anything that pre-fetches; nothing changes until a button is pressed.
 *
 * Reading on the server also puts the invitation in the first HTML, so there is no spinner between opening the email and seeing what you were invited to.
 *
 * `intent=decline` comes from the smaller "decline" link in the email. It only moves focus to the decline button — it does not decline anything on its own, for the same reason.
 */
export default async function HostInvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ intent?: string }>;
}) {
  const [{ token }, { intent }] = await Promise.all([params, searchParams]);
  const lookup = await getHostInvite(token);

  return (
    <div className='flex items-center justify-center px-6 py-12'>
      <HostInviteCard token={token} lookup={lookup} intent={intent} />
    </div>
  );
}
