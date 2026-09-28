import { describe, expect, it } from 'vitest';
import { getReversedPageWindow } from './reverse-pages';

// A newest-first list of `total` items, numbered 1 (newest) to total (oldest), served `size` at a time.
function apiPage(total: number, size: number, page: number): number[] {
  const all = Array.from({ length: total }, (_, i) => i + 1);
  return all.slice((page - 1) * size, page * size);
}

function oldestFirstPage(total: number, size: number, page: number) {
  const window = getReversedPageWindow(total, page, size);
  if (!window) return null;
  const joined = window.apiPages.flatMap(p => apiPage(total, size, p));
  return joined.slice(window.start, window.end).reverse();
}

describe('getReversedPageWindow', () => {
  it('starts with the oldest item and keeps every page full', () => {
    // 1,215 donations: the API's last page holds only 15, so page 1 needs two API pages.
    expect(oldestFirstPage(1215, 20, 1)).toEqual(
      Array.from({ length: 20 }, (_, i) => 1215 - i)
    );
    expect(getReversedPageWindow(1215, 1, 20)?.apiPages).toEqual([60, 61]);
  });

  it('ends with the newest items on the last page', () => {
    // 61 pages; the last one holds what is left.
    expect(oldestFirstPage(1215, 20, 61)).toEqual([
      15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1,
    ]);
  });

  it('needs a single API page when the total divides evenly', () => {
    expect(getReversedPageWindow(40, 1, 20)?.apiPages).toEqual([2]);
    expect(oldestFirstPage(40, 20, 2)).toEqual(
      Array.from({ length: 20 }, (_, i) => 20 - i)
    );
  });

  it('returns null past the end', () => {
    expect(getReversedPageWindow(10, 2, 20)).toBeNull();
  });
});
