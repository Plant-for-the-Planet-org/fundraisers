import { getTranslations } from 'next-intl/server';
import { AuthGuard } from '@/components/auth/auth-guard';
import { CreateFundraiserButton } from '@/components/fundraisers/create-fundraiser-button';
import { CreateFundraiserFormProvider } from '@/components/fundraisers/create-fundraiser-form-context';
import { FundraiserFormBody } from '@/components/fundraisers/fundraiser-form-body';

export default async function CreateFundraiserPage() {
  const t = await getTranslations('Fundraisers.createPage');

  return (
    <AuthGuard>
      <div className='flex flex-col gap-2 mb-8'>
        <h1 className='text-4xl font-bold'>{t('title')}</h1>
        <p className='text-base text-muted-foreground'>{t('subtitle')}</p>
      </div>
      <CreateFundraiserFormProvider>
        <FundraiserFormBody
          mode='create'
          submitButton={<CreateFundraiserButton />}
        />
      </CreateFundraiserFormProvider>
    </AuthGuard>
  );
}
