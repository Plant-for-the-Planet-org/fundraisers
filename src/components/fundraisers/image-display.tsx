import { getImageUrl } from '@/lib/utils/images';
import { ImageComponentBase } from './image-component-base';

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
    <ImageComponentBase
      imageUrl={imageUrl}
      alt={alt}
      className={className}
      imageClassName={imageClassName}
    />
  );
}
