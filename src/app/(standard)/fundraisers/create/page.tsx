import { AuthGuard } from '@/components/auth/auth-guard';
import { CreateFundraiserButton } from '@/components/fundraisers/create-fundraiser-button';
import { CreateFundraiserFormProvider } from '@/components/fundraisers/create-fundraiser-form-context';
import { FundraiserFormBody } from '@/components/fundraisers/fundraiser-form-body';

export default function CreateFundraiserPage() {
  return (
    <AuthGuard>
      <CreateFundraiserFormProvider>
        <FundraiserFormBody
          mode='create'
          submitButton={<CreateFundraiserButton />}
        />
      </CreateFundraiserFormProvider>
    </AuthGuard>
  );
}
