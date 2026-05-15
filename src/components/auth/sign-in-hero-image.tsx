import Image from 'next/image';

export function SignInHeroImage() {
  return (
    <section className='hidden lg:flex flex-1 relative'>
      <Image
        src='/your-fundraiser-plants-trees-academy-2025.jpg'
        alt='A child proudly shows muddy hands after planting trees at a Plant-for-the-Planet Academy, a reminder of what every fundraiser makes possible.'
        fill
        className='object-cover object-center rounded-none lg:rounded-3xl'
        priority
      />
      {/* Dark Overlay */}
      <div className='absolute inset-0 bg-black/30 rounded-none lg:rounded-3xl' />

      {/* Content Overlay */}
      <div className='relative z-10 flex flex-col justify-center items-center h-full px-6 py-12 text-center'>
        <div className='max-w-lg'>
          {/* TODO: Maybe in future some text can go here */}
        </div>
      </div>
    </section>
  );
}
