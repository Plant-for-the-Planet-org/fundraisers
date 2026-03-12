import type { SelectedImage } from '@/lib/types/image-selection';

export async function imageToBase64(
  image: SelectedImage
): Promise<string | undefined> {
  if (image.source === 'upload' && image.file instanceof File) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(image.file as File);
    });
  }

  if (image.source === 'unsplash' && image.originalUrl) {
    try {
      const response = await fetch(image.originalUrl);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch {
      return undefined;
    }
  }

  return undefined;
}
