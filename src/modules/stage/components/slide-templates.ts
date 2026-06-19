// Ready-made single-slide templates for Stage Mode. A user picks one to seed a
// slide, then edits the copy and swaps the image. Content lives here (en/de
// inline) rather than in the i18n json, mirroring the thank-you note presets in
// `thank-you-note/constants.ts`.
//
// Images are hosted on the Planet CDN (www-cdn.plant-for-the-planet.org, which
// is whitelisted in `fundraiser-form-schema.ts`).
//
// Keep `title` <= STAGE_LIMITS.slideTitle (60) and `description` <=
// STAGE_LIMITS.slideDescription (160).

export interface StageSlideTemplate {
  id: string;
  title: string;
  description: string;
  /** CDN image URL — https, satisfies the slide image schema. */
  image: string;
  /** Display duration in seconds (1-60). */
  duration: number;
}

const EN_TEMPLATES: StageSlideTemplate[] = [
  {
    id: 'restore-forests',
    title: 'Restore forests for future generations.',
    description:
      'Donate now to support reforestation and protection of the Mayan forests in the Yucatán Peninsula.',
    image:
      'https://www-cdn.plant-for-the-planet.org/wp-content/uploads/2026/06/1-Help_create_healthier_landscapes_for_future_generations.jpg',
    duration: 8,
  },
  {
    id: 'young-people-greener-future',
    title: 'Young people are fighting for a greener future.',
    description:
      "Children and youth all over the world inspire their surroundings to restore and protect the world's forests and fight for climate justice",
    image:
      'https://www-cdn.plant-for-the-planet.org/wp-content/uploads/2026/06/2-Help_young_people_take_action_for_a_greener_future.jpg',
    duration: 8,
  },
  {
    id: 'seeds-of-forests',
    title: "Help secure the seeds of tomorrow's forests.",
    description:
      'We want to restore forests to capture carbon and to protect the local biodiversity of plant, animal, fungal and other species.',
    image:
      'https://www-cdn.plant-for-the-planet.org/wp-content/uploads/2026/06/3-Help_secure_the_seeds_of_tomorrows_forests.jpg',
    duration: 8,
  },
  {
    id: 'local-roots-global-impact',
    title: 'Local roots, global impact. Grow change with us.',
    description:
      'Since 2020, Plant-for-the-Planet Ghana and Czechia have been empowering restoration in the heart of Africa.',
    image:
      'https://www-cdn.plant-for-the-planet.org/wp-content/uploads/2026/06/4-Local_action_global_connection_help_us_22grow22_change.jpg',
    duration: 8,
  },
  {
    id: 'tools-for-planet',
    title: 'Give young people the tools to act for the planet.',
    description:
      'Your support sends young people to Academies where they learn and act for the climate.',
    image:
      'https://www-cdn.plant-for-the-planet.org/wp-content/uploads/2026/06/5-Help_young_people_take_action_for_a_greener_future.jpg',
    duration: 8,
  },
  {
    id: 'climate-leaders',
    title: 'A place where young people become climate leaders.',
    description:
      'At Plant-for-the-Planet Academies, young people learn about climate solutions and how to take action for a liveable, climate-just future.',
    image:
      'https://www-cdn.plant-for-the-planet.org/wp-content/uploads/2026/06/6-Create_spaces_where_learning_growth_and_community_thrive.jpg',
    duration: 8,
  },
];

export const STAGE_SLIDE_TEMPLATES: Record<'en' | 'de', StageSlideTemplate[]> =
  {
    en: EN_TEMPLATES,
    de: EN_TEMPLATES,
  };
