import type { BundleSlug } from '@/lib/types/bundle';

import {
  AmazonRouteIcon,
  AncestralLandsIcon,
  CoffeeOriginsIcon,
  FixWhatWeBrokeIcon,
  ForMyKidsIcon,
  RoofOfTheWorldIcon,
  SupplyChainGuiltTripIcon,
  UnderdogBundleIcon,
  UndoAmazonOrderIcon,
  WorstOfTheWorstIcon,
} from './icons/bundle-icon';

type BundleIconProps = {
  slug: BundleSlug;
  className?: string;
};

export const bundleIcons = {
  'ancestral-lands': AncestralLandsIcon,
  'fix-what-we-broke': FixWhatWeBrokeIcon,
  'for-your-children': ForMyKidsIcon,
  'roof-of-the-world': RoofOfTheWorldIcon,
  'supply-chain-guilt-trip': SupplyChainGuiltTripIcon,
  'amazon-route': AmazonRouteIcon,
  'underdog-bundle': UnderdogBundleIcon,
  'undo-your-amazon-order': UndoAmazonOrderIcon,
  'where-your-coffee-grows': CoffeeOriginsIcon,
  'worst-of-the-worst': WorstOfTheWorstIcon,
} as const;

export function BundleIcon({ slug, className }: BundleIconProps) {
  const Icon = bundleIcons[slug];

  return <Icon className={className} />;
}
