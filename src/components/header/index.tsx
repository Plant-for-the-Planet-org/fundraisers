import { UserMenu } from '../auth/user-menu';
import { Logo } from './logo';
import { Navigation } from './navigation';

export function Header() {
  return (
    <header className='header w-full'>
      <div className='max-w-[var(--page-max,60rem)] mx-auto px-4 py-4'>
        <div className='flex items-center justify-between'>
          <Logo />
          {/* Navigation and Actions */}
          <div className='flex items-center gap-4'>
            <Navigation />
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
