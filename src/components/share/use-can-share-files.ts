'use client';

import { useSyncExternalStore } from 'react';
import { canShareFiles } from '@/lib/share/web-share';

let known: boolean | undefined;
const snapshot = () => (known ??= canShareFiles());
const subscribe = () => () => {};

/**
 * Whether the share sheet takes files. Null on the server and while hydrating, since only the browser knows.
 * A studio that mounts in the browser gets the answer on its first render, so it can pick its first format without a flash.
 */
export function useCanShareFiles(): boolean | null {
  return useSyncExternalStore(subscribe, snapshot, () => null);
}
