// TODO: Replace this temporary success banner with the final designed UI component.
// Currently used only for testing and basic user feedback after donation success.

export const DonationSuccessBanner = ({
  donationId,
}: {
  donationId: string;
}) => {
  return (
    <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
      <div className='flex items-start gap-3'>
        <div className='flex-shrink-0'>
          <svg
            className='w-5 h-5 text-green-400'
            viewBox='0 0 20 20'
            fill='currentColor'
          >
            <path
              fillRule='evenodd'
              d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
              clipRule='evenodd'
            />
          </svg>
        </div>
        <div className='flex-1'>
          <h3 className='text-sm font-medium text-green-800'>
            Donation successful!
          </h3>
          <p className='text-sm text-green-700 mt-1'>
            Donation ID: {donationId}
          </p>
        </div>
      </div>
    </div>
  );
};
