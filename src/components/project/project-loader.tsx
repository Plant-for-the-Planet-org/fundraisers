import type { ProjectPaymentOptions } from '@/lib/types/payment-options';

import { notFound } from 'next/navigation';
import { getProjectPaymentOptions } from '@/lib/api/payment-options-service';
import { PlatformAPIError } from '@/lib/api/platform-fetch';
import { ProjectView } from './project-view';

interface ProjectLoaderProps {
  projectSlug: string;
}

/**
 * Data boundary for the project page. Rendered inside a `Suspense` boundary so
 * the skeleton streams while this request is in flight.
 *
 * A slug that resolves to no visible project becomes a 404; every other
 * failure bubbles up to the route's error boundary.
 */
export async function ProjectLoader({ projectSlug }: ProjectLoaderProps) {
  let paymentOptions: ProjectPaymentOptions;

  try {
    paymentOptions = await getProjectPaymentOptions(projectSlug);
  } catch (error) {
    if (error instanceof PlatformAPIError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  return <ProjectView paymentOptions={paymentOptions} />;
}
