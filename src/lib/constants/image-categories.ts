import type { ImageCategory } from '@/lib/types/image-selection';

interface SeasonalWindow {
  startMonth: number; // 1-12
  startDay: number;
  endMonth: number;
  endDay: number;
}

interface SeasonalCategory extends ImageCategory {
  seasonal?: SeasonalWindow;
}

const ALL_IMAGE_CATEGORIES: SeasonalCategory[] = [
  { id: 'outdoors', query: 'nature outdoor adventure hiking' },
  { id: 'nature', query: 'forest trees wildlife animals' },
  { id: 'birthday', query: 'birthday party celebration cake' },
  { id: 'wedding', query: 'wedding marriage celebration flowers' },
  {
    id: 'halloween',
    query: 'halloween pumpkin autumn spooky orange black',
    seasonal: { startMonth: 9, startDay: 1, endMonth: 11, endDay: 2 },
  },
  {
    id: 'thanksgiving',
    query: 'thanksgiving gratitude family harvest autumn',
    seasonal: { startMonth: 10, startDay: 1, endMonth: 11, endDay: 30 },
  },
  {
    id: 'christmas',
    query: 'christmas holiday winter snow tree gifts red green',
    seasonal: { startMonth: 10, startDay: 15, endMonth: 12, endDay: 31 },
  },
  {
    id: 'new-year',
    query: 'new year celebration fireworks party champagne',
    seasonal: { startMonth: 11, startDay: 15, endMonth: 1, endDay: 7 },
  },
  {
    id: 'valentines',
    query: 'valentine love heart pink red romance',
    seasonal: { startMonth: 12, startDay: 15, endMonth: 2, endDay: 15 },
  },
  {
    id: 'easter',
    query: 'easter spring flowers bunny eggs pastel',
    seasonal: { startMonth: 2, startDay: 1, endMonth: 4, endDay: 15 },
  },
  {
    id: 'summer',
    query: 'summer beach sun vacation travel bright',
    seasonal: { startMonth: 4, startDay: 15, endMonth: 8, endDay: 31 },
  },
  {
    id: 'back-to-school',
    query: 'school education books learning students',
    seasonal: { startMonth: 7, startDay: 1, endMonth: 9, endDay: 15 },
  },
  {
    id: 'diwali',
    query: 'diwali lights festival celebration colorful',
    seasonal: { startMonth: 9, startDay: 1, endMonth: 11, endDay: 15 },
  },
  {
    id: 'mothers-day',
    query: 'mother day flowers family love appreciation',
    seasonal: { startMonth: 3, startDay: 15, endMonth: 5, endDay: 15 },
  },
  {
    id: 'fathers-day',
    query: 'father day family appreciation dad',
    seasonal: { startMonth: 4, startDay: 15, endMonth: 6, endDay: 25 },
  },
  {
    id: 'oktoberfest',
    query: 'oktoberfest beer festival germany celebration',
    seasonal: { startMonth: 9, startDay: 15, endMonth: 10, endDay: 15 },
  },
  {
    id: 'chinese-new-year',
    query: 'chinese new year lunar festival red gold dragon',
    seasonal: { startMonth: 12, startDay: 1, endMonth: 2, endDay: 10 },
  },
  {
    id: 'holi',
    query: 'holi colors festival spring celebration india',
    seasonal: { startMonth: 1, startDay: 15, endMonth: 3, endDay: 20 },
  },
  {
    id: 'ramadan',
    query: 'ramadan eid islamic crescent moon lantern',
    seasonal: { startMonth: 1, startDay: 15, endMonth: 4, endDay: 20 },
  },
];

function isInSeason(window: SeasonalWindow, date: Date): boolean {
  const currentMonth = date.getMonth() + 1;
  const currentDay = date.getDate();

  const { startMonth, startDay, endMonth, endDay } = window;

  // Handle year-crossing windows (e.g. start in Nov, end in Jan)
  if (startMonth > endMonth) {
    return (
      currentMonth > startMonth ||
      (currentMonth === startMonth && currentDay >= startDay) ||
      currentMonth < endMonth ||
      (currentMonth === endMonth && currentDay <= endDay)
    );
  }

  return (
    (currentMonth > startMonth ||
      (currentMonth === startMonth && currentDay >= startDay)) &&
    (currentMonth < endMonth ||
      (currentMonth === endMonth && currentDay <= endDay))
  );
}

function stripSeasonal(category: SeasonalCategory): ImageCategory {
  const { seasonal: _seasonal, ...rest } = category;
  return rest;
}

export function getStaticImageCategories(): ImageCategory[] {
  return ALL_IMAGE_CATEGORIES.map(stripSeasonal);
}

export function getVisibleImageCategories(
  date: Date = new Date()
): ImageCategory[] {
  return ALL_IMAGE_CATEGORIES.filter(category => {
    if (!category.seasonal) {
      return true;
    }
    return isInSeason(category.seasonal, date);
  }).map(stripSeasonal);
}
