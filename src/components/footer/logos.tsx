export function Logos() {
  return (
    <div className='logos flex items-center justify-center md:justify-start'>
      <a
        href='https://www.plant-for-the-planet.org'
        target='_blank'
        rel='noopener noreferrer'
        className='group flex items-center gap-3 rounded-lg p-1 -m-1 outline-none focus-visible:ring-2 focus-visible:ring-ring'
      >
        {/* The name is text next to the image, so the image itself is decorative. */}
        <img
          src='https://cdn.plant-for-the-planet.org/logo/svg/planet.svg'
          alt=''
          className='h-14 w-[54px] transition-transform duration-200 group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100'
        />
        <span className='text-base font-semibold text-foreground/80 transition-colors group-hover:text-foreground group-hover:underline underline-offset-4'>
          Plant-for-the-Planet
        </span>
      </a>
    </div>
  );
}
