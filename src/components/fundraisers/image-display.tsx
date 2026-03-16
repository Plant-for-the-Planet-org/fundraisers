import { Target } from 'lucide-react';

import { cn } from '@/lib/utils/cn';
import { getImageUrl } from '@/lib/utils/images';

interface ImageDisplayProps {
  image: string | null | undefined;
  alt: string;
  className?: string;
  imageClassName?: string;
}

function getFundraiserImageSource(image?: string | null): string | null {
  if (!image) return null;
  if (/^https?:\/\//i.test(image)) return image;
  return getImageUrl('fundraiser', 'large', image);
}

export default function ImageDisplay({
  image,
  alt,
  className,
  imageClassName,
}: ImageDisplayProps) {
  const imageUrl = getFundraiserImageSource(image);

  return (
    <div
      className={cn(
        'self-stretch h-80 relative bg-white/50 dark:bg-gray-800 rounded-2xl overflow-hidden',
        className
      )}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={alt}
          className={cn('w-full h-full object-cover', imageClassName)}
        />
      ) : (
        <div className='w-full h-full flex items-center justify-center'>
          <Target className='w-16 h-16 text-gray-400' />
        </div>
      )}
    </div>
  );
}
