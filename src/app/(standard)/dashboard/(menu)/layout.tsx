import type { ReactNode } from 'react';

import { isUmamiStatsConfigured } from '@/lib/analytics/umami-stats';
import { DashboardShell } from '@/components/dashboard';

// The edit page sits outside this group on purpose: the editor and its live preview need the full width.
export default function DashboardMenuLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    // The Umami key is server-only, so whether Insights exists is decided here.
    <DashboardShell insightsEnabled={isUmamiStatsConfigured()}>
      {children}
    </DashboardShell>
  );
}
