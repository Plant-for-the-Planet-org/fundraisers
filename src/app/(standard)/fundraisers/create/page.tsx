import { FundraiserCauses } from '@/components/fundraisers/causes';
import { FundraiserContributionSettings } from '@/components/fundraisers/contribution-settings';
import { CreateFundraiserButton } from '@/components/fundraisers/create/create-fundraiser-button';
import { CountryGoalInfo } from '@/components/fundraisers/create/info';
import { FundraiserTheme } from '@/components/fundraisers/create/theme';
import { FundraiserDescription } from '@/components/fundraisers/description';
import { FundraiserDonorsPreview } from '@/components/fundraisers/donors';
import {
  FundraiserGoalInput,
  FundraiserGoalPreview,
} from '@/components/fundraisers/goal';
import { FundraiserHostPreview } from '@/components/fundraisers/host';
import { FundraiserImage } from '@/components/fundraisers/image';
import { FundraiserOptions } from '@/components/fundraisers/options';
import { FundraiserTitle } from '@/components/fundraisers/title';
import { FundraiserWorkspaceInput } from '@/components/fundraisers/workspace';
import {
  FundraiserContent,
  FundraiserContentMainContentColumn,
  FundraiserContentPreviewColumn,
} from '@/components/ui/fundraiser-content';

export default function CreateFundraiserPage() {
  return (
    <>
      <FundraiserContent>
        <FundraiserContentPreviewColumn>
          {/* <div>Preview</div> */}
          <FundraiserImage />
          <FundraiserGoalPreview />
          <FundraiserDonorsPreview />
          <FundraiserHostPreview />
          <FundraiserTheme />
        </FundraiserContentPreviewColumn>
        <FundraiserContentMainContentColumn>
          <FundraiserTitle />
          <FundraiserContributionSettings />
          <FundraiserDescription />
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <FundraiserWorkspaceInput />
            <FundraiserGoalInput />
          </div>
          <CountryGoalInfo />
          <FundraiserCauses />
          <FundraiserOptions />
          <CreateFundraiserButton />
        </FundraiserContentMainContentColumn>
      </FundraiserContent>
    </>
  );
}
