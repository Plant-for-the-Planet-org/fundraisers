import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { ProjectLoader } from '@/components/projects/project-loader';
import { ProjectSkeleton } from '@/components/projects/project-skeleton';

interface ProjectPageProps {
  searchParams: Promise<{ projectSlug?: string }>;
}

/**
 * Project page: `/donate?projectSlug=<slug>`.
 *
 * Only `projectSlug` is read here. Other query parameters (`country`,
 * `tenant`, `token`, `callback_url`, `utm_campaign`, `s`) are out of scope.
 */
export default async function ProjectPage({ searchParams }: ProjectPageProps) {
  const { projectSlug } = await searchParams;
  const slug = projectSlug?.trim();

  // Without a slug there is no project to load and no default to fall back to.
  if (!slug) {
    notFound();
  }

  return (
    <Suspense fallback={<ProjectSkeleton />}>
      <ProjectLoader projectSlug={slug} />
    </Suspense>
  );
}
