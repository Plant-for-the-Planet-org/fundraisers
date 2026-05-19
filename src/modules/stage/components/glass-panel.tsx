import type { CSSProperties, ReactNode } from 'react';

const GLASS_STYLE: CSSProperties = {
  background: 'rgba(255,255,255,0.78)',
  borderColor: 'rgba(255,255,255,0.55)',
  backdropFilter: 'blur(22px) saturate(140%)',
  boxShadow:
    '0 30px 60px -20px rgba(8,15,35,.45), 0 10px 24px -10px rgba(8,15,35,.35), inset 0 1px 0 rgba(255,255,255,.7)',
  color: '#0B1220',
};

interface GlassPanelProps {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

export function GlassPanel({ className, style, children }: GlassPanelProps) {
  return (
    <div
      className={`rounded-3xl border ${className ?? ''}`}
      style={{ ...GLASS_STYLE, ...style }}
    >
      {children}
    </div>
  );
}
