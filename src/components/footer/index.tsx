import { LanguageSelector } from './language-selector';
import { LinksBar } from './links-bar';
import { Logos } from './logos';

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  return (
    <footer
      className={`footer mt-8 pt-6 pb-4 border-t border-border/50 ${className}`}
    >
      <div className='max-w-[var(--page-max,60rem)] mx-auto px-4'>
        <div className='flex flex-col md:flex-row md:items-center justify-between gap-6'>
          <div className='logos-wrapper'>
            <Logos />
          </div>
          <div className='links-wrapper flex flex-col gap-4 items-center md:items-end'>
            <LinksBar />
            <LanguageSelector />
          </div>
        </div>
      </div>
    </footer>
  );
}
