import type { Nullable } from './utility';

interface CategoryMetadata {
  icon?: string;
  featured?: boolean;
}

interface CategoryStats {
  fundraiserCount: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: Nullable<string>;
  color: Nullable<string>;
  metadata?: CategoryMetadata;
  stats?: CategoryStats;
}
