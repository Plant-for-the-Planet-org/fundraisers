import type { SVGProps } from 'react';
import type { PlantIconPaths } from '@/lib/icons/plant-icon-paths';

// Duotone plant icons from Font Awesome Pro 7.1.0 (Commercial License); the path data and licence note live in src/lib/icons/plant-icon-paths.ts.
// Both paths use currentColor; the back layer is at opacity 0.4 for the duotone effect.

type IconProps = SVGProps<SVGSVGElement>;

export function PlantIcon({
  paths,
  ...props
}: IconProps & { paths: PlantIconPaths }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden
      viewBox={`0 0 ${paths.width} ${paths.height}`}
      {...props}
    >
      <path opacity='.4' fill='currentColor' d={paths.back} />
      <path fill='currentColor' d={paths.front} />
    </svg>
  );
}
