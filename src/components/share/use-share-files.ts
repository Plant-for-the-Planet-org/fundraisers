'use client';

import type { ShareKind } from '@/lib/share/channels';
import type { ShareFormatId } from '@/lib/share/formats';
import type { ShareRenderOptions } from '@/lib/share/render/types';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { shareFileName } from '@/lib/share/file-name';
import { SHARE_FORMATS, SHARE_VIDEO_SECONDS } from '@/lib/share/formats';
import { drawShareFrame } from '@/lib/share/render/draw-share-frame';
import { encodeShareVideo } from '@/lib/share/video';

export type ShareDrawOptions = Omit<ShareRenderOptions, 'format'>;

const ids = new WeakMap<object, number>();
let nextId = 1;
/** A stable number per object, so a cache key can tell two loaded images apart. */
function idOf(value: object | null | undefined): number {
  if (!value) return 0;
  let id = ids.get(value);
  if (!id) {
    id = nextId++;
    ids.set(value, id);
  }
  return id;
}

/** Still images export at twice the format's size, so text and icons stay sharp after the app scales them. */
export const SHARE_IMAGE_SCALE = 2;

export async function makeShareImage(
  format: ShareFormatId,
  options: ShareDrawOptions,
  slug: string
): Promise<File> {
  const { w, h } = SHARE_FORMATS[format];
  const canvas = document.createElement('canvas');
  canvas.width = w * SHARE_IMAGE_SCALE;
  canvas.height = h * SHARE_IMAGE_SCALE;
  let blob: Blob | null;
  try {
    // iOS Safari caps the memory all canvases may hold, and then gives no context.
    const g = canvas.getContext('2d');
    if (!g) throw new Error('No canvas for the share image');
    drawShareFrame(g, SHARE_VIDEO_SECONDS, {
      ...options,
      format,
      scale: SHARE_IMAGE_SCALE,
    });
    blob = await new Promise<Blob | null>(resolve =>
      canvas.toBlob(resolve, 'image/png')
    );
  } finally {
    // Frees the canvas memory now rather than at the next garbage collection.
    canvas.width = 0;
    canvas.height = 0;
  }
  if (!blob) throw new Error('Could not export the share image');
  const name = shareFileName({
    slug,
    format,
    kind: 'image',
    scale: SHARE_IMAGE_SCALE,
  });
  return new File([blob], name, {
    type: 'image/png',
    lastModified: Date.now(),
  });
}

export async function makeShareVideo(
  format: ShareFormatId,
  options: ShareDrawOptions,
  slug: string,
  onProgress?: (share: number) => void,
  signal?: AbortSignal
): Promise<File | null> {
  const blob = await encodeShareVideo(
    format,
    (g, t) => drawShareFrame(g, t, { ...options, format }),
    onProgress,
    signal
  );
  return blob
    ? new File([blob], shareFileName({ slug, format, kind: 'video' }), {
        type: 'video/mp4',
        lastModified: Date.now(),
      })
    : null;
}

interface ShareFiles {
  image: File | null;
  video: File | null;
  /** Share of the video made so far, while it is being made. */
  progress: number | null;
  /** The browser cannot encode video; only the image is offered. */
  videoUnsupported: boolean;
  /** The image could not be made. `retry` tries again. */
  failed: boolean;
}

const PENDING: ShareFiles = {
  image: null,
  video: null,
  progress: null,
  videoUnsupported: false,
  failed: false,
};

/**
 * Makes the file for the current choice as soon as it changes, so a tap on Share can open the share sheet straight away.
 * Safari only opens it right after a tap, so the file cannot be made after the tap.
 * A change while a video is being made cancels that video.
 */
export function useShareFiles({
  format,
  kind,
  options,
  ready,
  slug,
}: {
  format: ShareFormatId;
  kind: ShareKind;
  options: ShareDrawOptions;
  ready: boolean;
  slug: string;
}): ShareFiles & { retry: () => void } {
  const [files, setFiles] = useState<ShareFiles & { key: string }>({
    key: '',
    ...PENDING,
  });
  const [attempt, setAttempt] = useState(0);
  const optionsRef = useRef(options);
  // The latest options, for the file job. The job restarts when the key changes, not on every new options object.
  useLayoutEffect(() => {
    optionsRef.current = options;
  });

  // Everything that changes the picture changes the key. Loaded images count by identity, so a new photo, background or avatar set makes a new file.
  // A retry counts too, so its attempt shows as preparing again.
  const key = JSON.stringify([
    format,
    kind,
    slug,
    options.theme,
    { ...options.data, formatMoney: undefined, raisedLine: undefined },
    idOf(options.photo),
    idOf(options.background),
    idOf(options.avatars),
    attempt,
  ]);

  useEffect(() => {
    if (!ready) return;
    const controller = new AbortController();
    // Typing a custom button text changes the key on every key; wait for a pause.
    const timer = setTimeout(async () => {
      try {
        const image = await makeShareImage(format, optionsRef.current, slug);
        if (controller.signal.aborted) return;
        const wantsVideo = kind === 'video';
        setFiles({
          ...PENDING,
          key,
          image,
          progress: wantsVideo ? 0 : null,
        });
        if (!wantsVideo) return;
        // A failed encode keeps the image and falls back to it, like a browser that cannot encode.
        const video = await makeShareVideo(
          format,
          optionsRef.current,
          slug,
          progress => {
            if (!controller.signal.aborted)
              setFiles(current => ({ ...current, progress }));
          },
          controller.signal
        ).catch(error => {
          console.error('[share] Could not make the video:', error);
          return null;
        });
        if (controller.signal.aborted) return;
        setFiles({
          ...PENDING,
          key,
          image,
          video,
          videoUnsupported: !video,
        });
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('[share] Could not make the share file:', error);
          setFiles({ ...PENDING, key, failed: true });
        }
      }
    }, 350);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
    // `key` stands for the options that change the picture.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ready]);

  const retry = () => setAttempt(value => value + 1);
  return files.key === key ? { ...files, retry } : { ...PENDING, retry };
}
