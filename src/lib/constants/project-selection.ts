import type { DefaultCauseIdByCountry } from '@/lib/types/project-selection';

export const MIN_DEFAULT_CAUSE_PERCENT = 20;

export const DEFAULT_NON_EARMARKED_CAUSE_ID = 'proj_bFH0BU0Qw02RuetpQlLOMVYX';

export const DEFAULT_NON_EARMARKED_CAUSE_BY_COUNTRY: Readonly<DefaultCauseIdByCountry> =
  {
    DE: DEFAULT_NON_EARMARKED_CAUSE_ID,
    ES: 'proj_zNQk6R8H1C2fCKwrHEUYRHnz',
    CH: 'proj_YeAk6Y7E3Es2LgHzgQ0aqw8l',
  };

export const DEFAULT_NON_EARMARKED_CAUSE_FALLBACK = {
  name: 'Empower Young People and Bring Back Forests',
  description:
    "Support Plant-for-the-Planet's mission to empower young people worldwide to take climate action. We restore forests, educate communities, and advocate for climate justice to create a sustainable future for all.",
  image: '6852bd2495cde981886580.png',
} as const;
