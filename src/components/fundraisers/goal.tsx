import { PreviewSectionHeader1, PreviewSectionHeader2 } from './typography';

export function FundraiserGoalPreview() {
  return (
    <div>
      <PreviewSectionHeader1 content='$2,000 Raised' />
    </div>
  );
}

export function FundraiserGoalInput() {
  return (
    <div>
      <PreviewSectionHeader2 content='Fundraiser Goal' />
    </div>
  );
}
