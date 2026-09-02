import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { ProjectLoader } from '@/components/project/project-loader';
import { ProjectSkeleton } from '@/components/project/project-skeleton';

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Project page: `/projects/<slug>`.
 *
 * The slug identifies the project and loads its payment options. Query
 * parameters (`country`, `tenant`, `token`, `callback_url`, `utm_campaign`,
 * `s`) are out of scope.
 */
export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const projectSlug = slug.trim();

  // A blank slug resolves to no project, and there is no default to fall back
  // to. Next.js only matches this route with a segment present, so this guards
  // whitespace-only slugs.
  if (!projectSlug) {
    notFound();
  }

  return (
    <Suspense fallback={<ProjectSkeleton />}>
      <ProjectLoader projectSlug={projectSlug} />
    </Suspense>
  );
}
