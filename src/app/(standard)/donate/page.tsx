import { notFound } from 'next/navigation';
import { SingleProjectView } from '@/components/projects/single-project-view';

interface SingleProjectPageProps {
  searchParams: Promise<{ projectSlug?: string }>;
}

/**
 * Single project page: `/donate?projectSlug=<slug>`.
 *
 * Only `projectSlug` is read here. Other query parameters (`country`,
 * `tenant`, `token`, `callback_url`, `utm_campaign`, `s`) are out of scope.
 */
export default async function SingleProjectPage({
  searchParams,
}: SingleProjectPageProps) {
  const { projectSlug } = await searchParams;
  const slug = projectSlug?.trim();

  // Without a slug there is no project to load and no default to fall back to.
  if (!slug) {
    notFound();
  }

  return <SingleProjectView projectSlug={slug} />;
}
