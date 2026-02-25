import type { Category } from '@/lib/types/category';

import {
  Circle,
  Droplets,
  Globe,
  Heart,
  Leaf,
  Thermometer,
  TreePine,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface CategoryIconProps {
  category: Category;
  size?: 'compact' | 'regular';
}

export function CategoryIcon({
  category,
  size = 'regular',
}: CategoryIconProps) {
  const iconName = category.metadata?.icon || 'circle';

  // Map common category icons to specific imports (tree-shakeable)
  const iconMap: Record<string, typeof Circle> = {
    thermometer: Thermometer,
    heart: Heart,
    leaf: Leaf,
    users: Users,
    globe: Globe,
    treepine: TreePine,
    droplets: Droplets,
    circle: Circle,
  };

  const IconComponent = iconMap[iconName.toLowerCase()] || Circle;
  const iconClass = cn(
    'category-icon',
    size === 'compact' ? 'w-8 h-8' : 'w-10 h-10'
  );

  return (
    <IconComponent
      className={iconClass}
      style={{ color: category.color || '#6b7280' }}
      aria-hidden='true'
    />
  );
}
