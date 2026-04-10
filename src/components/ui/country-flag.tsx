import { cn } from '@/lib/utils/cn';

type CountryFlagProps = {
  flag: string;
  className?: string;
};

export function CountryFlag({ flag, className }: CountryFlagProps) {
  return (
    <span
      className={cn("font-['Twemoji_Country_Flags',sans-serif]", className)}
      aria-hidden='true'
    >
      {flag}
    </span>
  );
}
