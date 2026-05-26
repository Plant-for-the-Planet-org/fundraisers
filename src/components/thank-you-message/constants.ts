export const THANK_YOU_MESSAGE_LIMITS = {
  message: 250,
} as const;

export interface ThankYouTopic {
  id: string;
  labelKey: string;
}

export interface ThankYouPresetMessage {
  id: string;
  text: string;
}

export const THANK_YOU_TOPICS: ThankYouTopic[] = [
  { id: 'climate-justice', labelKey: 'climateJustice' },
  { id: 'events', labelKey: 'events' },
  { id: 'sports', labelKey: 'sports' },
  { id: 'birthday', labelKey: 'birthday' },
  { id: 'tech', labelKey: 'tech' },
  { id: 'wedding', labelKey: 'wedding' },
  { id: 'memorial', labelKey: 'memorial' },
  { id: 'school', labelKey: 'school' },
  { id: 'corporate', labelKey: 'corporate' },
];

export const THANK_YOU_PRESET_MESSAGES: Record<
  string,
  Record<'en' | 'de', ThankYouPresetMessage[]>
> = {
  'climate-justice': {
    en: [
      {
        id: 'cj-1',
        text: 'Your gift plants real trees and fights climate change. Thank you for standing with us!',
      },
      {
        id: 'cj-2',
        text: 'Every tree counts. Thanks to you, the forest grows stronger today.',
      },
      {
        id: 'cj-3',
        text: 'You just turned generosity into oxygen. The planet thanks you!',
      },
    ],
    de: [
      {
        id: 'cj-1',
        text: 'Deine Spende pflanzt echte Bäume und bekämpft den Klimawandel. Danke, dass du bei uns stehst!',
      },
      {
        id: 'cj-2',
        text: 'Jeder Baum zählt. Dank dir wird der Wald heute stärker.',
      },
      {
        id: 'cj-3',
        text: 'Du hast Großzügigkeit in Sauerstoff verwandelt. Der Planet dankt dir!',
      },
    ],
  },
  events: {
    en: [
      {
        id: 'ev-1',
        text: 'Thank you for supporting our event! Your donation makes this possible.',
      },
      {
        id: 'ev-2',
        text: 'Your generosity helps bring people together for a great cause. Thank you!',
      },
      {
        id: 'ev-3',
        text: 'Thanks for being part of something bigger. Your support means the world!',
      },
    ],
    de: [
      {
        id: 'ev-1',
        text: 'Danke für deine Unterstützung unseres Events! Deine Spende macht es möglich.',
      },
      {
        id: 'ev-2',
        text: 'Deine Großzügigkeit bringt Menschen für eine gute Sache zusammen. Danke!',
      },
      {
        id: 'ev-3',
        text: 'Danke, dass du Teil von etwas Großem bist. Deine Unterstützung bedeutet uns viel!',
      },
    ],
  },
  sports: {
    en: [
      {
        id: 'sp-1',
        text: 'You scored big with this donation! Thank you for being a team player.',
      },
      {
        id: 'sp-2',
        text: 'Champions support champions. Thanks for helping us reach our goal!',
      },
      {
        id: 'sp-3',
        text: 'Your support keeps us in the game. Thank you for cheering us on!',
      },
    ],
    de: [
      {
        id: 'sp-1',
        text: 'Mit dieser Spende hast du einen Volltreffer gelandet! Danke für deinen Teamgeist.',
      },
      {
        id: 'sp-2',
        text: 'Champions unterstützen Champions. Danke, dass du uns hilfst, unser Ziel zu erreichen!',
      },
      {
        id: 'sp-3',
        text: 'Deine Unterstützung hält uns im Spiel. Danke fürs Anfeuern!',
      },
    ],
  },
  birthday: {
    en: [
      {
        id: 'bd-1',
        text: 'What a wonderful birthday gift! Thank you for celebrating with trees.',
      },
      {
        id: 'bd-2',
        text: 'Instead of candles, you lit up the planet. Thank you for this special gift!',
      },
      {
        id: 'bd-3',
        text: 'The best birthday present is one that keeps growing. Thank you!',
      },
    ],
    de: [
      {
        id: 'bd-1',
        text: 'Was für ein wundervolles Geburtstagsgeschenk! Danke, dass du mit Bäumen feierst.',
      },
      {
        id: 'bd-2',
        text: 'Statt Kerzen hast du den Planeten zum Leuchten gebracht. Danke für dieses besondere Geschenk!',
      },
      {
        id: 'bd-3',
        text: 'Das beste Geburtstagsgeschenk ist eines, das weiter wächst. Danke!',
      },
    ],
  },
  tech: {
    en: [
      {
        id: 'te-1',
        text: 'Your donation powers innovation for a greener future. Thank you!',
      },
      {
        id: 'te-2',
        text: 'Tech meets impact. Thanks for helping us build a better tomorrow!',
      },
      {
        id: 'te-3',
        text: 'You just deployed kindness to production. Thank you for your support!',
      },
    ],
    de: [
      {
        id: 'te-1',
        text: 'Deine Spende treibt Innovation für eine grünere Zukunft an. Danke!',
      },
      {
        id: 'te-2',
        text: 'Technologie trifft Wirkung. Danke, dass du uns hilfst, ein besseres Morgen zu bauen!',
      },
      {
        id: 'te-3',
        text: 'Du hast Freundlichkeit in Produktion gebracht. Danke für deine Unterstützung!',
      },
    ],
  },
  wedding: {
    en: [
      {
        id: 'we-1',
        text: 'Love grows like trees. Thank you for planting the future with us!',
      },
      {
        id: 'we-2',
        text: 'What a beautiful way to celebrate love. Thank you for this meaningful gift!',
      },
      {
        id: 'we-3',
        text: 'Your wedding gift will grow for generations. Thank you for choosing nature!',
      },
    ],
    de: [
      {
        id: 'we-1',
        text: 'Liebe wächst wie Bäume. Danke, dass du mit uns die Zukunft pflanzt!',
      },
      {
        id: 'we-2',
        text: 'Was für eine schöne Art, die Liebe zu feiern. Danke für dieses bedeutungsvolle Geschenk!',
      },
      {
        id: 'we-3',
        text: 'Dein Hochzeitsgeschenk wächst über Generationen. Danke, dass du die Natur wählst!',
      },
    ],
  },
  memorial: {
    en: [
      {
        id: 'me-1',
        text: 'A tree planted in memory is a legacy that lives on. Thank you for this tribute.',
      },
      {
        id: 'me-2',
        text: 'Your gift honors a special life with lasting impact. Thank you.',
      },
      {
        id: 'me-3',
        text: 'Memories grow stronger with every tree. Thank you for this meaningful tribute.',
      },
    ],
    de: [
      {
        id: 'me-1',
        text: 'Ein Baum im Andenken ist ein Vermächtnis, das weiterlebt. Danke für diese Würdigung.',
      },
      {
        id: 'me-2',
        text: 'Dein Geschenk ehrt ein besonderes Leben mit nachhaltiger Wirkung. Danke.',
      },
      {
        id: 'me-3',
        text: 'Erinnerungen wachsen stärker mit jedem Baum. Danke für diese bedeutungsvolle Würdigung.',
      },
    ],
  },
  school: {
    en: [
      {
        id: 'sc-1',
        text: 'Students planting change! Thank you for supporting our school project.',
      },
      {
        id: 'sc-2',
        text: 'Young minds, big impact. Thanks for helping our students make a difference!',
      },
      {
        id: 'sc-3',
        text: 'Education meets action. Thank you for empowering the next generation!',
      },
    ],
    de: [
      {
        id: 'sc-1',
        text: 'Schüler pflanzen Veränderung! Danke für die Unterstützung unseres Schulprojekts.',
      },
      {
        id: 'sc-2',
        text: 'Junge Köpfe, große Wirkung. Danke, dass du unseren Schülern hilfst, etwas zu bewegen!',
      },
      {
        id: 'sc-3',
        text: 'Bildung trifft Handeln. Danke, dass du die nächste Generation stärkst!',
      },
    ],
  },
  corporate: {
    en: [
      {
        id: 'co-1',
        text: 'Your company makes a real difference. Thank you for your corporate commitment!',
      },
      {
        id: 'co-2',
        text: 'Business with purpose. Thank you for investing in our planet!',
      },
      {
        id: 'co-3',
        text: 'Your contribution shows true corporate leadership. Thank you for the support!',
      },
    ],
    de: [
      {
        id: 'co-1',
        text: 'Ihr Unternehmen macht einen echten Unterschied. Danke für Ihr Engagement!',
      },
      {
        id: 'co-2',
        text: 'Wirtschaft mit Sinn. Danke, dass Sie in unseren Planeten investieren!',
      },
      {
        id: 'co-3',
        text: 'Ihr Beitrag zeigt echte unternehmerische Führung. Danke für die Unterstützung!',
      },
    ],
  },
};
