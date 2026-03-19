'use client';

import { useTranslations } from 'next-intl';
import { AuthGuard } from '@/components/auth/auth-guard';
import { useAuthStore } from '@/stores/authStore';
import {
  DonationsCard,
  MyFundraisersCard,
  TotalRaisedCard,
} from '@/components/dashboard';
import { BreadcrumbTrail } from '@/components/ui/breadcrumb';

export default function Dashboard() {
  const t = useTranslations('Dashboard');
  const user = useAuthStore(state => state.user);
  const profile = user?.profile;
  const displayName =
    profile?.displayName || user?.name || user?.email || t('fallbackName');

  return (
    <AuthGuard>
      <section className='space-y-6'>
        <BreadcrumbTrail
          items={[
            { label: t('breadcrumb.home'), href: '/' },
            { label: t('dashboard') },
          ]}
        />
        <div>
          <h1 className='text-3xl font-bold text-foreground'>
            {t('dashboard')}
          </h1>
          <p className='text-muted-foreground'>
            {t('welcome', { displayName })}
          </p>
        </div>

        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          <MyFundraisersCard />
          <TotalRaisedCard />
          <DonationsCard />
        </div>
      </section>
    </AuthGuard>
  );
}
