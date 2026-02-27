export function FundraiserImage() {
  return (
    <div className='self-stretch h-80 relative bg-white/50 dark:bg-gray-800 rounded-2xl overflow-hidden'>
      {/* {currentImage ? (
        <img
          className='w-full h-full object-cover'
          src={currentImage.url}
          alt='Fundraiser preview'
        />
      ) : defaultImageError ? (
        <div className='w-full h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400'>
          <ImageIcon className='w-16 h-16 mb-4' />
          <p className='text-sm font-medium mb-2'>
            Failed to load default image
          </p>
          <p className='text-xs text-center mb-4 px-4'>{defaultImageError}</p>
          <Button
            variant='outline'
            size='sm'
            onClick={handleRetryDefaultImage}
            className='flex items-center gap-2'
          >
            <RefreshCw className='w-4 h-4' />
            Retry
          </Button>
        </div>
      ) : (
        <div className='w-full h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400'>
          <RefreshCw className='w-8 h-8 mb-4 animate-spin' />
          <p className='text-sm font-medium'>Loading default image...</p>
        </div>
        )} */}
      <div className='w-full h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400'>
        {/* <RefreshCw className='w-8 h-8 mb-4 animate-spin' /> */}
        <p className='text-sm font-medium'>Loading default image...</p>
      </div>

      {/* Unified Change Image Button - always present, positioned at bottom right */}
      {/* <button
        onClick={handleImageClick}
        className='absolute bottom-3 right-3 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 transition-all duration-200 hover:scale-110 flex items-center justify-center'
        aria-label='Change image'
      >
        <ImageIcon className='h-4 w-4 text-white' />
      </button> */}
    </div>
  );
}
