import { useTranslations } from 'next-intl';
import { resolveProjectImageSource } from '@/lib/utils/images';
import { ImageComponentBase } from '@/components/fundraisers/image-component-base';

interface ProjectImageProps {
  /** CDN filename or absolute URL from the API. */
  image: string | null;
  /** Project name, used for the alt text. */
  name: string;
}

/**
 * Hero image of the project. Renders through `ImageComponentBase`, so the
 * frame, rounding, and the fallback icon match the fundraiser page.
 */
export function ProjectImage({ image, name }: ProjectImageProps) {
  const t = useTranslations('Project.hero');

  return (
    <ImageComponentBase
      imageUrl={resolveProjectImageSource(image, 'large')}
      alt={t('imageAlt', { name })}
    />
  );
}
