export const MIN_DEFAULT_CAUSE_PERCENT = 20;

// Per-workspace default cause ids now live in the workspace registry
// (`src/lib/workspaces/registry.ts`); read them via `getDefaultCauseId`.

export const DEFAULT_NON_EARMARKED_CAUSE_FALLBACK = {
  name: 'Education for Climate Justice',
  description:
    "Support Plant-for-the-Planet's mission to empower young people worldwide to take climate action. We restore forests, educate communities, and advocate for climate justice to create a sustainable future for all.",
  image: '6852bd2495cde981886580.png',
} as const;
