import { normalizeImageSrc } from '@/lib/image/parse-image-url';
import { cn } from '@/lib/utils/cn';

interface ImageEmbedProps {
  /** Stored, untrusted `data-image-src`. Re-validated here before it is used. */
  src: string;
  alt?: string;
  className?: string;
}

/**
 * Renders an embedded image from a stored marker.
 *
 * `src` is the only embed value that reaches the output verbatim (unlike video,
 * where the URL is rebuilt from a template), so it is re-validated at render
 * time: a corrupt or hostile stored marker renders nothing rather than loading.
 *
 * A plain `<img>` rather than `next/image` because the project configures no
 * remote image patterns, and every other remote image in the app does the same.
 * `loading='lazy'` keeps long descriptions cheap.
 */
export function ImageEmbed({ src, alt, className }: ImageEmbedProps) {
  // Render the validated URL, never the stored string — see normalizeImageSrc.
  const safeSrc = normalizeImageSrc(src);
  if (!safeSrc) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={safeSrc}
      alt={alt ?? ''}
      loading='lazy'
      decoding='async'
      className={cn('my-4 h-auto w-full rounded-xl', className)}
    />
  );
}
