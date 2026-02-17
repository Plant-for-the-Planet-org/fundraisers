export function Logos() {
  return (
    <div className='logos flex items-center justify-center md:justify-start gap-4 h-[34px]'>
      <a
        href='https://www.plant-for-the-planet.org'
        target='_blank'
        rel='noopener noreferrer'
        className='hover:opacity-80'
      >
        <img
          src='https://cdn.plant-for-the-planet.org/logo/svg/planet.svg'
          alt='Plant-for-the-Planet'
          className='h-[34px] w-[33px]'
        />
      </a>
      <a
        href='https://www.unep.org'
        target='_blank'
        rel='noopener noreferrer'
        className='hover:opacity-80'
      >
        <img
          src='https://cdn.plant-for-the-planet.org/logo/svg/unep.svg?12'
          alt='UN Environment Program'
          className='h-full w-auto'
        />
      </a>
    </div>
  );
}
