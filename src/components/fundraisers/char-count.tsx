export function CharCount({ current, max }: { current: number; max: number }) {
  const color =
    current > max
      ? 'text-destructive'
      : current > max * 0.85
        ? 'text-orange-500'
        : 'text-muted-foreground';
  return (
    <span className={`text-[10px] tabular-nums ${color}`}>
      {current}/{max}
    </span>
  );
}
