import type { SVGProps } from 'react';
import type { PlantIconPaths } from '@/lib/icons/plant-icon-paths';

import {
  leafMaple,
  leafOak,
  leafyGreen,
  seedling,
  treeDeciduous,
  treeLarge,
  treePalm,
  trees,
} from '@/lib/icons/plant-icon-paths';

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

export function TreeDeciduousIcon(props: IconProps) {
  return <PlantIcon paths={treeDeciduous} {...props} />;
}

export function TreePalmIcon(props: IconProps) {
  return <PlantIcon paths={treePalm} {...props} />;
}

export function TreesIcon(props: IconProps) {
  return <PlantIcon paths={trees} {...props} />;
}

export function TreeLargeIcon(props: IconProps) {
  return <PlantIcon paths={treeLarge} {...props} />;
}

export function LeafMapleIcon(props: IconProps) {
  return <PlantIcon paths={leafMaple} {...props} />;
}

export function LeafOakIcon(props: IconProps) {
  return <PlantIcon paths={leafOak} {...props} />;
}

export function LeafyGreenIcon(props: IconProps) {
  return <PlantIcon paths={leafyGreen} {...props} />;
}

export function SeedlingIcon(props: IconProps) {
  return <PlantIcon paths={seedling} {...props} />;
}
