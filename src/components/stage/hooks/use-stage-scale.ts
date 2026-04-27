'use client';

import { useLayoutEffect, useRef, useState } from 'react';

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

function measure() {
  const scale = Math.min(window.innerWidth / CANVAS_WIDTH, 1);
  return { scale };
}

export function useStageScale() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [{ scale }, setState] = useState({ scale: 1 });

  useLayoutEffect(() => {
    function fit() { setState(measure()); }
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  return {
    containerRef,
    scale,
    canvas: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
  };
}
