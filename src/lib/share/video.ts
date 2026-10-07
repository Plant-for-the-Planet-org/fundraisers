import type { ShareFormatId } from './formats';

import { SHARE_FORMATS, SHARE_VIDEO_FPS, SHARE_VIDEO_SECONDS } from './formats';

/** 8 Mbps for a 1080x1920 story, scaled by pixel count, so gradients and particles stay crisp after the app re-encodes it. */
function bitrateFor(width: number, height: number) {
  return Math.max(
    3_000_000,
    Math.round((8_000_000 * (width * height)) / (1080 * 1920))
  );
}

/**
 * Encodes the share animation to an H.264 MP4 in the browser, with WebCodecs.
 * Frames are drawn as fast as the device can encode them, not in real time, so an 8 second video usually takes a second or two.
 * Returns null where the browser cannot encode H.264; callers then offer the still image only.
 */
export async function encodeShareVideo(
  format: ShareFormatId,
  draw: (g: CanvasRenderingContext2D, t: number) => void,
  onProgress?: (share: number) => void,
  signal?: AbortSignal
): Promise<Blob | null> {
  const {
    Output,
    Mp4OutputFormat,
    BufferTarget,
    CanvasSource,
    canEncodeVideo,
  } = await import('mediabunny');
  const { w, h } = SHARE_FORMATS[format];
  if (!(await canEncodeVideo('avc', { width: w, height: h }))) return null;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  try {
    const g = canvas.getContext('2d');
    if (!g) return null;

    const output = new Output({
      format: new Mp4OutputFormat({ fastStart: 'in-memory' }),
      target: new BufferTarget(),
    });
    const source = new CanvasSource(canvas, {
      codec: 'avc',
      bitrate: bitrateFor(w, h),
    });
    output.addVideoTrack(source, { frameRate: SHARE_VIDEO_FPS });
    await output.start();

    const frames = SHARE_VIDEO_FPS * SHARE_VIDEO_SECONDS;
    for (let i = 0; i < frames; i++) {
      if (signal?.aborted) {
        await output.cancel();
        return null;
      }
      draw(g, i / SHARE_VIDEO_FPS);
      await source.add(i / SHARE_VIDEO_FPS, 1 / SHARE_VIDEO_FPS);
      if (i % 10 === 0) onProgress?.(i / frames);
    }
    await output.finalize();
    onProgress?.(1);
    const buffer = output.target.buffer;
    return buffer ? new Blob([buffer], { type: 'video/mp4' }) : null;
  } finally {
    // Frees the canvas memory now rather than at the next garbage collection, which a phone may not reach before the next file.
    canvas.width = 0;
    canvas.height = 0;
  }
}
