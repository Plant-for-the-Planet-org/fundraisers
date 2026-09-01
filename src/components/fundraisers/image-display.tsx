import { resolveFundraiserImageSource } from '@/lib/utils/images';
import { ImageComponentBase } from './image-component-base';

interface ImageDisplayProps {
  image: string | null | undefined;
  alt: string;
  className?: string;
  imageClassName?: string;
}

export default function ImageDisplay({
  image,
  alt,
  className,
  imageClassName,
}: ImageDisplayProps) {
  const imageUrl = resolveFundraiserImageSource(image);

  return (
    <ImageComponentBase
      imageUrl={imageUrl}
      alt={alt}
      className={className}
      imageClassName={imageClassName}
    />
  );
}
