import { Logo } from './logo';
import { Navigation } from './navigation';

export function Header() {
  return (
    <header className='header w-full'>
      <div className='max-w-[960px] mx-auto px-4 py-4'>
        <div className='flex items-center justify-between'>
          <Logo />
          {/* Navigation and Actions */}
          <div className='flex items-center gap-6'>
            <Navigation />
            {/* <UserMenu /> */}
          </div>
        </div>
      </div>
    </header>
  );
}
