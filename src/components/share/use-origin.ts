'use client';

import { useEffect, useState } from 'react';

/** The site origin, known only in the browser. Until then links are relative. */
export function useOrigin(): string {
  const [origin, setOrigin] = useState('');
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin);
  }, []);
  return origin;
}
