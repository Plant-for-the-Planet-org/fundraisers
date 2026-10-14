import type { Category } from '@/lib/types/category';

import {
  Circle,
  Droplets,
  Gamepad2,
  Gift,
  Globe,
  Heart,
  Leaf,
  Medal,
  Thermometer,
  TreePine,
  Users,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface CategoryIconProps {
  category: Category;
  size?: 'compact' | 'regular';
  /** Sits the icon in a soft, rounded tile of the category's colour, like the dashboard menu's active item. */
  tile?: boolean;
}

export function CategoryIcon({
  category,
  size = 'regular',
  tile = false,
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
    zap: Zap,
    gamepad2: Gamepad2,
    medal: Medal,
    gift: Gift,
  };

  const IconComponent = iconMap[iconName.toLowerCase()] || Circle;
  // A tile in a row of categories uses the page's accent for every one, so the row reads as one set. A category's own colour, when it has one, shows elsewhere (its page header).
  const accent = 'var(--accent-color, #6b7280)';
  const color = tile ? accent : category.color || accent;
  const iconClass = cn(
    'category-icon',
    tile ? 'size-6' : size === 'compact' ? 'w-8 h-8' : 'w-10 h-10'
  );

  // Two tones, like the dashboard menu's icons: a soft fill behind a solid line, both in the category's colour.
  const icon = (
    <IconComponent
      className={iconClass}
      style={{ color }}
      fill='currentColor'
      fillOpacity={0.28}
      strokeWidth={1.75}
      aria-hidden='true'
    />
  );
  if (!tile) return icon;

  return (
    <span
      className='inline-flex size-11 items-center justify-center rounded-xl'
      style={{
        backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
      }}
    >
      {icon}
    </span>
  );
}
