'use client';

import type { ReactNode } from 'react';

import { Component } from 'react';
import * as Sentry from '@sentry/nextjs';

interface StudioErrorBoundaryProps {
  children: ReactNode;
  /** Shown in place of the studio once it failed. */
  fallback: ReactNode;
}

/**
 * Keeps a studio that fails to load or render from reaching the route's error page, which would replace the whole fundraiser page, thank-you screen and bank details included.
 * Wrap the `next/dynamic` component itself, so its chunk errors land here. React.lazy keeps a failed load, so only a page reload tries again.
 */
export class StudioErrorBoundary extends Component<
  StudioErrorBoundaryProps,
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    Sentry.captureException(error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
