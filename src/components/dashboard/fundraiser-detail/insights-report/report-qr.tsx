'use client';

import { useMemo } from 'react';
import QRCode from 'qrcode';

/** A QR code drawn as one SVG path, so it stays sharp at any print size. */
export function ReportQr({ value, label }: { value: string; label: string }) {
  const { size, path } = useMemo(() => {
    const { modules } = QRCode.create(value, { errorCorrectionLevel: 'M' });
    const cells: string[] = [];
    for (let row = 0; row < modules.size; row++) {
      for (let column = 0; column < modules.size; column++) {
        if (modules.get(row, column)) cells.push(`M${column} ${row}h1v1h-1z`);
      }
    }
    return { size: modules.size, path: cells.join('') };
  }, [value]);

  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox={`0 0 ${size} ${size}`}
      shapeRendering='crispEdges'
      role='img'
      aria-label={label}
      className='size-16'
    >
      <path d={path} fill='#000000' />
    </svg>
  );
}
