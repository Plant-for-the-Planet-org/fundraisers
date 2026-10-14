import QRCode from 'qrcode';
import { describe, expect, it } from 'vitest';
import { MIN_CELL_PX, SCREEN_QR_ERROR_CORRECTION, SCREEN_QR_PX } from './qr';

// The blank border the code is drawn with, in cells, on each side.
const QUIET_ZONE = 4;

const cellPx = (link: string) => {
  const { modules } = QRCode.create(link, {
    errorCorrectionLevel: SCREEN_QR_ERROR_CORRECTION,
  });
  return SCREEN_QR_PX / (modules.size + 2 * QUIET_ZONE);
};

describe('the share studio QR code', () => {
  it('has cells big enough for a camera, for a link on a short domain', () => {
    const link =
      'https://startplanting.org/raise/test-fundraiser-6doe?share=instagram';
    expect(cellPx(link)).toBeGreaterThanOrEqual(MIN_CELL_PX);
  });

  it('has cells big enough for a camera, for a long preview-site link', () => {
    const link =
      'https://fundraisers-git-feature-share-studio-ux-feedback-plant-for-the-planet.vercel.app/raise/test-fundraiser-6doe?share=instagram';
    expect(cellPx(link)).toBeGreaterThanOrEqual(MIN_CELL_PX);
  });
});
