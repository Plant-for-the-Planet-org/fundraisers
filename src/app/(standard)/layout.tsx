import type { ReactNode } from 'react';

import { Toaster } from 'sonner';
import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { ThemeShell } from '@/components/theme/theme-shell';
import { MainContent } from '@/components/ui/main-content';

export default function StandardLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeShell>
      <Header />
      <MainContent>{children}</MainContent>
      <Footer />
      <Toaster richColors />
    </ThemeShell>
  );
}
