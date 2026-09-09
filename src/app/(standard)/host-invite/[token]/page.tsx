import { notFound, redirect } from 'next/navigation';
import { getCachedHostInvite } from '@/lib/api/host-invite-service';

/**
 * The address invitation emails used before the page moved under the fundraiser. Emails already sent still carry it, so it resolves the token and forwards to the current route, keeping `intent=decline` on the way.
 */
export default async function LegacyHostInvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ intent?: string }>;
}) {
  const [{ token }, { intent }] = await Promise.all([params, searchParams]);
  const lookup = await getCachedHostInvite(token);

  const slug = lookup.kind === 'found' ? lookup.invite.fundraiser.slug : null;
  if (!slug) {
    notFound();
  }

  const suffix = intent === 'decline' ? '?intent=decline' : '';
  redirect(`/raise/${slug}/invite/${encodeURIComponent(token)}${suffix}`);
}
