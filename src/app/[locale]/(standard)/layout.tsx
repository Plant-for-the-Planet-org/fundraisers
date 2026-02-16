import type { ReactNode } from 'react';

import { PageContainer } from '@/components/ui/page-container';
import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { MainContent } from '@/components/ui/main-content';

export default function StandardLayout({ children }: { children: ReactNode }) {
  return (
    <PageContainer>
      <Header />
      <MainContent>{children}</MainContent>
      <Footer />
    </PageContainer>
  );
}
