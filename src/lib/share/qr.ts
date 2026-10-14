/**
 * The QR code beside the share preview is read off a screen by a phone camera, which needs cells of about 3 CSS px or more.
 * Low error correction keeps a long link (a preview site, say) to fewer, bigger cells.
 */
export const SCREEN_QR_PX = 160;
export const SCREEN_QR_ERROR_CORRECTION = 'L';
export const MIN_CELL_PX = 3;
