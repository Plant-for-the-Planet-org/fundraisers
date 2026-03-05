import type { ReactNode } from 'react';
import { ThemeShell } from '@/components/theme/theme-shell';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { MainContent } from '@/components/ui/main-content';

export default function StandardLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeShell>
      <Header />
      <MainContent>{children}</MainContent>
      <Footer />
    </ThemeShell>
  );
}
