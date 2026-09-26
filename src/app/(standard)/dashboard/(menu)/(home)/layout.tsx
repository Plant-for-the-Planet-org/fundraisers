import type { ReactNode } from 'react';

import { DashboardFundraisersProvider } from '@/components/dashboard';

export default function DashboardHomeLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <DashboardFundraisersProvider>{children}</DashboardFundraisersProvider>
  );
}
