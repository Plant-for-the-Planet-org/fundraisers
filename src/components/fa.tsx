import { cn } from '@/lib/utils/index';
import { type FaIconName, faIcons } from './fa-icons';

// Font Awesome Pro duotone icon rendered as inline SVG (currentColor, crisp,
// tree-shakeable). Secondary layer is drawn at 40% opacity for the two-tone
// effect. Sizes with font (1em) by default; override with a size-* className.
export function Fa({
  icon,
  className,
  secondaryOpacity = 0.4,
  ...props
}: {
  icon: FaIconName;
  secondaryOpacity?: number;
} & React.SVGProps<SVGSVGElement>) {
  const def = faIcons[icon];
  return (
    <svg
      viewBox={def.vb}
      width='1em'
      height='1em'
      fill='currentColor'
      aria-hidden='true'
      className={cn('inline-block shrink-0', className)}
      {...props}
    >
      {def.s && <path d={def.s} opacity={secondaryOpacity} />}
      <path d={def.p} />
    </svg>
  );
}
