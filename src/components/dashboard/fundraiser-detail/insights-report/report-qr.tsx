'use client';

import type { CSSProperties } from 'react';

import { useMemo } from 'react';
import QRCode from 'qrcode';

// The blank border the QR standard (ISO/IEC 18004) asks for, in cells. Drawn here so it stays 4 cells whatever the link length.
// Denso Wave, the QR code's inventor: "QR Code requires a four-module wide margin at all sides of a symbol."
// https://www.qrcode.com/en/howto/code.html
const QUIET_ZONE = 4;

/** A QR code drawn as one SVG path, so it stays sharp at any print size. */
export function ReportQr({
  value,
  label,
  className = 'size-[74px]',
  style,
  errorCorrectionLevel = 'M',
}: {
  value: string;
  label: string;
  className?: string;
  style?: CSSProperties;
  /** Lower levels make fewer, bigger cells, which a camera reads more easily off a screen. */
  errorCorrectionLevel?: 'L' | 'M';
}) {
  const { size, path } = useMemo(() => {
    const { modules } = QRCode.create(value, { errorCorrectionLevel });
    const cells: string[] = [];
    for (let row = 0; row < modules.size; row++) {
      for (let column = 0; column < modules.size; column++) {
        if (modules.get(row, column)) cells.push(`M${column} ${row}h1v1h-1z`);
      }
    }
    return { size: modules.size, path: cells.join('') };
  }, [value, errorCorrectionLevel]);
  const box = size + 2 * QUIET_ZONE;

  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox={`${-QUIET_ZONE} ${-QUIET_ZONE} ${box} ${box}`}
      shapeRendering='crispEdges'
      role='img'
      aria-label={label}
      className={className}
      style={style}
    >
      <rect
        x={-QUIET_ZONE}
        y={-QUIET_ZONE}
        width={box}
        height={box}
        fill='#ffffff'
      />
      <path d={path} fill='#000000' />
    </svg>
  );
}
