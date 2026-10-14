import type { ShareFormatId } from '@/lib/share/formats';

import { SHARE_FORMATS } from '@/lib/share/formats';

const pct = (value: number, total: number) => `${(value / total) * 100}%`;

const BAR = 'rounded-full bg-white/80';
const DOT = 'rounded-full bg-white/80';

/** The few shapes an app draws over a tall video, kept generic so they do not go stale when an app changes its look. */
function Chrome({ format }: { format: ShareFormatId }) {
  if (format === 'story') {
    return (
      <>
        <div className='absolute inset-x-[6%] top-[2.5%] grid gap-1.5'>
          <div className='flex gap-1'>
            <span className={`${BAR} h-0.5 flex-1`} />
            <span className='h-0.5 flex-1 rounded-full bg-white/40' />
            <span className='h-0.5 flex-1 rounded-full bg-white/40' />
          </div>
          <div className='flex items-center gap-1.5'>
            <span className={`${DOT} size-4`} />
            <span className={`${BAR} h-1.5 w-12`} />
          </div>
        </div>
        <div className='absolute inset-x-[6%] bottom-[3%] flex items-center gap-2'>
          <span className='h-6 flex-1 rounded-full border border-white/80' />
          <span className={`${DOT} size-5`} />
          <span className={`${DOT} size-5`} />
        </div>
      </>
    );
  }
  // TikTok and Shorts share the same layout: buttons down the right, the caption at the bottom left.
  return (
    <>
      {format === 'shorts' && (
        <span
          className={`${BAR} absolute inset-x-[6%] top-[3%] h-5 !bg-white/50`}
        />
      )}
      <div className='absolute right-[2%] bottom-[14%] grid gap-2.5'>
        {[0, 1, 2, 3].map(i => (
          <span key={i} className={`${DOT} size-5`} />
        ))}
      </div>
      <div className='absolute bottom-[3%] left-[5%] grid w-[55%] gap-1.5'>
        <div className='flex items-center gap-1.5'>
          <span className={`${DOT} size-4`} />
          <span className={`${BAR} h-1.5 w-10`} />
        </div>
        <span className={`${BAR} h-1.5 w-full`} />
        <span className={`${BAR} h-1.5 w-2/3`} />
      </div>
    </>
  );
}

/**
 * Shades the parts of a tall video that the app's own buttons cover, and sketches those buttons.
 * It follows the format's safe zone, so what stays clear is exactly where the content sits.
 * It is drawn over the preview only; exported files never include it.
 */
export function AppOverlay({ format }: { format: ShareFormatId }) {
  if (format !== 'story' && format !== 'tiktok' && format !== 'shorts')
    return null;
  const { w, h, zone } = SHARE_FORMATS[format];
  const shade = 'absolute bg-black/35';
  return (
    <div
      aria-hidden='true'
      className='pointer-events-none absolute inset-0 overflow-hidden rounded-[1.25rem]'
    >
      <div
        className={`${shade} inset-x-0 top-0`}
        style={{ height: pct(zone.y, h) }}
      />
      <div
        className={`${shade} inset-x-0 bottom-0`}
        style={{ height: pct(h - zone.y - zone.h, h) }}
      />
      <div
        className={`${shade} left-0`}
        style={{
          top: pct(zone.y, h),
          height: pct(zone.h, h),
          width: pct(zone.x, w),
        }}
      />
      <div
        className={`${shade} right-0`}
        style={{
          top: pct(zone.y, h),
          height: pct(zone.h, h),
          width: pct(w - zone.x - zone.w, w),
        }}
      />
      <Chrome format={format} />
    </div>
  );
}
