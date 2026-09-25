'use client';

import type { ShareKind } from '@/lib/share/channels';
import type { ShareFormatId } from '@/lib/share/formats';
import type { ShareRenderOptions } from '@/lib/share/render/types';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { SHARE_FORMATS, SHARE_VIDEO_SECONDS } from '@/lib/share/formats';
import { drawShareFrame } from '@/lib/share/render/draw-share-frame';
import { encodeShareVideo } from '@/lib/share/video';

export type ShareDrawOptions = Omit<ShareRenderOptions, 'format'>;

export async function makeShareImage(
  format: ShareFormatId,
  options: ShareDrawOptions,
  name: string
): Promise<File> {
  const { w, h } = SHARE_FORMATS[format];
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  drawShareFrame(canvas.getContext('2d')!, SHARE_VIDEO_SECONDS, {
    ...options,
    format,
  });
  const blob = await new Promise<Blob | null>(resolve =>
    canvas.toBlob(resolve, 'image/png')
  );
  if (!blob) throw new Error('Could not export the share image');
  return new File([blob], `${name}.png`, {
    type: 'image/png',
    lastModified: Date.now(),
  });
}

export async function makeShareVideo(
  format: ShareFormatId,
  options: ShareDrawOptions,
  name: string,
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
    ? new File([blob], `${name}.mp4`, {
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
}

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
  name,
}: {
  format: ShareFormatId;
  kind: ShareKind;
  options: ShareDrawOptions;
  ready: boolean;
  name: string;
}): ShareFiles & { key: string } {
  const [files, setFiles] = useState<ShareFiles & { key: string }>({
    key: '',
    image: null,
    video: null,
    progress: null,
    videoUnsupported: false,
  });
  const optionsRef = useRef(options);
  // The latest options, for the animation loop and the file job, without restarting them.
  useLayoutEffect(() => {
    optionsRef.current = options;
  });

  // Anything that changes the picture changes the key.
  const key = JSON.stringify([
    format,
    kind,
    name,
    options.theme,
    options.data.cta,
    options.data.joinedLine,
    options.data.url,
    !!options.photo,
  ]);

  useEffect(() => {
    if (!ready) return;
    const controller = new AbortController();
    // Typing a custom button text changes the key on every key; wait for a pause.
    const timer = setTimeout(async () => {
      try {
        const image = await makeShareImage(format, optionsRef.current, name);
        if (controller.signal.aborted) return;
        const wantsVideo = kind === 'video' && SHARE_FORMATS[format].video;
        setFiles({
          key,
          image,
          video: null,
          progress: wantsVideo ? 0 : null,
          videoUnsupported: false,
        });
        if (!wantsVideo) return;
        const video = await makeShareVideo(
          format,
          optionsRef.current,
          name,
          progress => {
            if (!controller.signal.aborted)
              setFiles(current => ({ ...current, progress }));
          },
          controller.signal
        );
        if (controller.signal.aborted) return;
        setFiles({
          key,
          image,
          video,
          progress: null,
          videoUnsupported: !video,
        });
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('[share] Could not make the share file:', error);
          setFiles({
            key,
            image: null,
            video: null,
            progress: null,
            videoUnsupported: false,
          });
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

  return files.key === key
    ? files
    : {
        key,
        image: null,
        video: null,
        progress: null,
        videoUnsupported: false,
      };
}
