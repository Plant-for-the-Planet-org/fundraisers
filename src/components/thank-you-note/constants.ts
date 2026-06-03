export const THANK_YOU_NOTE_LIMITS = {
  message: 400,
} as const;

export interface ThankYouPresetMessage {
  id: string;
  /** Rich HTML content. Supported tags: p, strong, em, u, s, blockquote, ul/ol/li, hr. */
  html: string;
}

export const DEFAULT_THANK_YOU_OCCASION_ID = 'general';

export const THANK_YOU_PRESET_MESSAGES: Record<
  string,
  Record<'en' | 'de', ThankYouPresetMessage[]>
> = {
  general: {
    en: [
      {
        id: 'ge-1',
        html: '<p>💚 <strong>Thank you so much.</strong></p><p>Your gift helps restore forests and empower young people to protect our planet. You made a real difference today. 🌍</p>',
      },
      {
        id: 'ge-2',
        html: '<p>We are genuinely grateful for you.</p><p>Because of you, <em>forests grow and the next generation learns to care for them</em>. Thank you! 🌱</p>',
      },
      {
        id: 'ge-3',
        html: '<p><strong>Small act, lasting impact.</strong></p><p>Thank you for backing a cause close to my heart: restoring forests and giving young people a future. 🙌</p>',
      },
      {
        id: 'ge-4',
        html: '<p>You are the reason this is possible.</p><p>Thank you for caring <em>enough to give</em> to something I truly believe in. 💚🌳</p>',
      },
    ],
    de: [
      {
        id: 'ge-1',
        html: '<p>💚 <strong>Ganz herzlichen Dank.</strong></p><p>Deine Spende hilft, Wälder zu renaturieren und junge Menschen zu stärken, die unseren Planeten schützen. Du hast heute etwas bewegt. 🌍</p>',
      },
      {
        id: 'ge-2',
        html: '<p>Wir sind dir wirklich dankbar.</p><p>Dank dir <em>wachsen Wälder und die nächste Generation lernt, sie zu schützen</em>. Danke! 🌱</p>',
      },
      {
        id: 'ge-3',
        html: '<p><strong>Kleine Geste, bleibende Wirkung.</strong></p><p>Danke, dass du eine Sache unterstützt, die mir am Herzen liegt: Wälder renaturieren und jungen Menschen eine Zukunft geben. 🙌</p>',
      },
      {
        id: 'ge-4',
        html: '<p>Du bist der Grund, warum das möglich ist.</p><p>Danke, dass dir <em>genug daran liegt</em> zu geben, für etwas, woran ich wirklich glaube. 💚🌳</p>',
      },
    ],
  },
  events: {
    en: [
      {
        id: 'ev-1',
        html: '<p>🎉 <strong>Thank you for being part of this.</strong></p><p>Your gift turned a great moment into a <em>lasting</em> one. We could not have done it without you. 🌳</p>',
      },
      {
        id: 'ev-2',
        html: '<p>You showed up and gave generously, and it means <strong>the world</strong>.</p><p>Thank you for making today count. 💚</p>',
      },
      {
        id: 'ev-3',
        html: '<p>What a way to celebrate together!</p><p>Thank you for helping us restore forests and empower the next generation. 🙌🌱</p>',
      },
    ],
    de: [
      {
        id: 'ev-1',
        html: '<p>🎉 <strong>Danke, dass du dabei bist.</strong></p><p>Deine Spende macht aus einem schönen Moment einen <em>bleibenden</em>. Ohne dich ginge das nicht. 🌳</p>',
      },
      {
        id: 'ev-2',
        html: '<p>Du warst da und hast großzügig gegeben, das bedeutet uns <strong>alles</strong>.</p><p>Danke, dass du den heutigen Tag besonders machst. 💚</p>',
      },
      {
        id: 'ev-3',
        html: '<p>Was für eine Art, gemeinsam zu feiern!</p><p>Danke, dass du hilfst, Wälder zu renaturieren und die nächste Generation zu stärken. 🙌🌱</p>',
      },
    ],
  },
  music: {
    en: [
      {
        id: 'mu-1',
        html: '<p>🎵 Thank you for turning the music into something <strong>that grows</strong>.</p><p>Every note tonight is now a tree in the ground. 🌳💚</p>',
      },
      {
        id: 'mu-2',
        html: '<p>The encore? <em>A forest.</em></p><p>Thank you for making the show matter long after the last song. 🎶🌱</p>',
      },
      {
        id: 'mu-3',
        html: '<p>You came for the music and gave the planet a gift.</p><p>Thank you for helping restore forests and support young changemakers. 🙌🌍</p>',
      },
    ],
    de: [
      {
        id: 'mu-1',
        html: '<p>🎵 Danke, dass du die Musik in etwas verwandelst, <strong>das wächst</strong>.</p><p>Jeder Ton heute Abend ist jetzt ein Baum in der Erde. 🌳💚</p>',
      },
      {
        id: 'mu-2',
        html: '<p>Die Zugabe? <em>Ein Wald.</em></p><p>Danke, dass du den Abend über den letzten Song hinaus bedeutsam machst. 🎶🌱</p>',
      },
      {
        id: 'mu-3',
        html: '<p>Du kamst für die Musik und hast dem Planeten ein Geschenk gemacht.</p><p>Danke, dass du hilfst, Wälder zu renaturieren und junge Changemaker zu unterstützen. 🙌🌍</p>',
      },
    ],
  },
  sports: {
    en: [
      {
        id: 'sp-1',
        html: '<p>🏅 <strong>You scored big today.</strong></p><p>Thank you for being on the team and turning effort into <em>real trees</em>. 🌳</p>',
      },
      {
        id: 'sp-2',
        html: '<p>⚽ The whole squad showed up for the planet.</p><p>Thank you for proving the best teams <em>plant trees together</em>. 🌳🙌</p>',
      },
      {
        id: 'sp-3',
        html: '<p>Champions lift others up, and that is <em>exactly</em> what you just did.</p><p>Thank you for backing forest restoration and climate education. 🌱</p>',
      },
    ],
    de: [
      {
        id: 'sp-1',
        html: '<p>🏅 <strong>Heute ein echter Volltreffer.</strong></p><p>Danke, dass du im Team bist und Einsatz in <em>echte Bäume</em> verwandelst. 🌳</p>',
      },
      {
        id: 'sp-2',
        html: '<p>⚽ Die ganze Mannschaft war für den Planeten am Start.</p><p>Danke, dass du zeigst: Die besten Teams <em>pflanzen gemeinsam Bäume</em>. 🌳🙌</p>',
      },
      {
        id: 'sp-3',
        html: '<p>Champions ziehen andere mit, und <em>genau</em> das hast du gerade getan.</p><p>Danke, dass du Renaturierung und Klimabildung unterstützt. 🌱</p>',
      },
    ],
  },
  birthday: {
    en: [
      {
        id: 'bd-1',
        html: "<p>🎂 The best birthday gift isn't for me, it's <strong>for the planet</strong>.</p><p>Thank you for giving <em>trees instead of presents</em>. It means so much. 🌳💚</p>",
      },
      {
        id: 'bd-2',
        html: '<p>Thank you for celebrating my birthday in the most <em>meaningful</em> way.</p><p>Your gift keeps growing <strong>long after the candles are out</strong>. 🌱🎉</p>',
      },
      {
        id: 'bd-3',
        html: '<p>You turned my birthday into a <strong>forest</strong>. What a gift!</p><p>Thank you for making this day truly special. 🙌🌍</p>',
      },
    ],
    de: [
      {
        id: 'bd-1',
        html: '<p>🎂 Das schönste Geburtstagsgeschenk ist nicht für mich, sondern <strong>für den Planeten</strong>.</p><p>Danke, dass du <em>Bäume statt Geschenke</em> schenkst. Das bedeutet mir viel. 🌳💚</p>',
      },
      {
        id: 'bd-2',
        html: '<p>Danke, dass du meinen Geburtstag auf die <em>schönste</em> Art feierst.</p><p>Dein Geschenk wächst weiter, <strong>lange nachdem die Kerzen aus sind</strong>. 🌱🎉</p>',
      },
      {
        id: 'bd-3',
        html: '<p>Du hast meinen Geburtstag in einen <strong>Wald</strong> verwandelt. Was für ein Geschenk!</p><p>Danke, dass du diesen Tag besonders machst. 🙌🌍</p>',
      },
    ],
  },
  newborn: {
    en: [
      {
        id: 'nb-1',
        html: '<p>👶 A new life arrived, and so did a <strong>new forest</strong>.</p><p>Thank you for welcoming our little one with <em>trees that grow right alongside them</em>. 🌱💚</p>',
      },
      {
        id: 'nb-2',
        html: '<p>Tiny hands, big impact.</p><p>Thank you for celebrating our newborn with a gift that will <strong>grow for a lifetime</strong>. 🌳🤍</p>',
      },
      {
        id: 'nb-3',
        html: '<p>What a beautiful way to say <em>welcome to the world</em>.</p><p>Thank you for restoring nature and helping young people protect it for the next generation. 🌍🌱</p>',
      },
    ],
    de: [
      {
        id: 'nb-1',
        html: '<p>👶 Ein neues Leben ist da, und mit ihm ein <strong>neuer Wald</strong>.</p><p>Danke, dass du unseren kleinen Schatz mit <em>Bäumen begrüßt, die mit ihm wachsen</em>. 🌱💚</p>',
      },
      {
        id: 'nb-2',
        html: '<p>Kleine Hände, große Wirkung.</p><p>Danke, dass du unser Neugeborenes mit einem Geschenk feierst, das <strong>ein Leben lang wächst</strong>. 🌳🤍</p>',
      },
      {
        id: 'nb-3',
        html: '<p>Was für eine schöne Art, <em>willkommen auf der Welt</em> zu sagen.</p><p>Danke, dass du hilfst, Natur zu renaturieren und sie für die nächste Generation zu schützen. 🌍🌱</p>',
      },
    ],
  },
  tech: {
    en: [
      {
        id: 'te-1',
        html: '<p>🚀 <strong>Thank you!</strong></p><p>You just deployed kindness <em>straight to the real world</em>, and the planet is better for it. 🌳</p>',
      },
      {
        id: 'te-2',
        html: '<p>Smart move: you turned a few clicks into <em>living forests</em>.</p><p>Thank you for building a greener future with us. 💚🌱</p>',
      },
      {
        id: 'te-3',
        html: '<p>Innovation meets impact, thanks to <strong>you</strong>.</p><p>Grateful you chose to back forest restoration and climate education. 🙌🌍</p>',
      },
    ],
    de: [
      {
        id: 'te-1',
        html: '<p>🚀 <strong>Danke!</strong></p><p>Du hast gerade Freundlichkeit <em>direkt in die echte Welt</em> deployed, und der Planet profitiert davon. 🌳</p>',
      },
      {
        id: 'te-2',
        html: '<p>Clever: Du hast aus ein paar Klicks <em>lebendige Wälder</em> gemacht.</p><p>Danke, dass du mit uns die Zukunft grüner baust. 💚🌱</p>',
      },
      {
        id: 'te-3',
        html: '<p>Innovation trifft Wirkung, dank <strong>dir</strong>.</p><p>Danke, dass du Renaturierung und Klimabildung unterstützt. 🙌🌍</p>',
      },
    ],
  },
  wedding: {
    en: [
      {
        id: 'we-1',
        html: '<p>💍 <strong>Thank you for being part of our story.</strong></p><blockquote>"On the day we said <em>I do</em>, you helped us plant a forest that will grow for as long as our love."</blockquote><p>It means the world to us. 🌳💚</p>',
      },
      {
        id: 'we-2',
        html: '<p>You marked our special day by giving <em>life to forests</em>.</p><blockquote>"Every tree is a little piece of our happiness, rooted in the earth. Thank you for celebrating with us."</blockquote><p>🌱🙌</p>',
      },
      {
        id: 'we-3',
        html: '<p>Two hearts, one planet, and a gift that <strong>lasts</strong>.</p><p>Thank you for choosing <em>nature</em> on our big day. 🌍💚</p>',
      },
    ],
    de: [
      {
        id: 'we-1',
        html: '<p>💍 <strong>Danke, dass du Teil unserer Geschichte bist.</strong></p><blockquote>"An dem Tag, an dem wir <em>Ja</em> sagten, habt ihr uns geholfen, einen Wald zu pflanzen, der so lange wächst wie unsere Liebe."</blockquote><p>Das bedeutet uns alles. 🌳💚</p>',
      },
      {
        id: 'we-2',
        html: '<p>Ihr habt unseren besonderen Tag gefeiert, indem ihr Wäldern <em>Leben schenkt</em>.</p><blockquote>"Jeder Baum ist ein kleines Stück unseres Glücks, fest verwurzelt in der Erde. Danke, dass ihr mit uns feiert."</blockquote><p>🌱🙌</p>',
      },
      {
        id: 'we-3',
        html: '<p>Zwei Herzen, ein Planet und ein Geschenk, das <strong>bleibt</strong>.</p><p>Danke, dass ihr an unserem großen Tag die <em>Natur</em> wählt. 🌍💚</p>',
      },
    ],
  },
  memorial: {
    en: [
      {
        id: 'me-1',
        html: '<p>🤍 <strong>Thank you.</strong></p><blockquote>"A tree planted in their memory is a living tribute that will grow for generations."</blockquote><p>We are honoured by your gift.</p>',
      },
      {
        id: 'me-2',
        html: '<p>Your gift turns remembrance into something that <em>breathes and grows</em>.</p><p>Thank you for this <strong>meaningful tribute</strong>. 🌳</p>',
      },
      {
        id: 'me-3',
        html: '<p>Love does not fade, it <em>takes root</em>.</p><p>Thank you for honouring a special life with us. 🌱🤍</p>',
      },
    ],
    de: [
      {
        id: 'me-1',
        html: '<p>🤍 <strong>Danke.</strong></p><blockquote>"Ein Baum im Andenken ist ein lebendiges Vermächtnis, das über Generationen wächst."</blockquote><p>Wir sind geehrt durch deine Spende.</p>',
      },
      {
        id: 'me-2',
        html: '<p>Deine Spende macht aus Erinnerung etwas, das <em>atmet und wächst</em>.</p><p>Danke für diese <strong>bedeutungsvolle Würdigung</strong>. 🌳</p>',
      },
      {
        id: 'me-3',
        html: '<p>Liebe vergeht nicht, sie <em>schlägt Wurzeln</em>.</p><p>Danke, dass du ein besonderes Leben mit uns ehrst. 🌱🤍</p>',
      },
    ],
  },
  health: {
    en: [
      {
        id: 'he-1',
        html: '<p>💚 Thank you for planting <strong>hope</strong> with us.</p><p>Every tree is a wish for healing, strength, and brighter days ahead. 🌱</p>',
      },
      {
        id: 'he-2',
        html: '<p>Your kindness means more than you know.</p><p>Thank you for turning care into <em>living, growing</em> trees, a symbol of life that carries on. 🌳🤍</p>',
      },
      {
        id: 'he-3',
        html: '<p>Strength grows like a forest, <em>one root at a time</em>.</p><p>Thank you for standing with us and giving the gift of life. 🙌🌿</p>',
      },
    ],
    de: [
      {
        id: 'he-1',
        html: '<p>💚 Danke, dass du mit uns <strong>Hoffnung</strong> pflanzt.</p><p>Jeder Baum ist ein Wunsch für Heilung, Kraft und bessere Tage. 🌱</p>',
      },
      {
        id: 'he-2',
        html: '<p>Deine Güte bedeutet mehr, als du ahnst.</p><p>Danke, dass du Fürsorge in <em>lebendige, wachsende</em> Bäume verwandelst, ein Symbol für ein Leben, das weitergeht. 🌳🤍</p>',
      },
      {
        id: 'he-3',
        html: '<p>Kraft wächst wie ein Wald, <em>Wurzel für Wurzel</em>.</p><p>Danke, dass du an unserer Seite stehst und das Geschenk des Lebens machst. 🙌🌿</p>',
      },
    ],
  },
  school: {
    en: [
      {
        id: 'sc-1',
        html: '<p>📚 <strong>Young minds, big hearts.</strong></p><p>Thank you for planting <em>real change</em>. So proud of what this class made happen. 🌳</p>',
      },
      {
        id: 'sc-2',
        html: '<p>You learned, you cared, and you <em>acted</em>.</p><p>Thank you for helping the next generation grow a greener world. 🌱💚</p>',
      },
      {
        id: 'sc-3',
        html: '<p>Lessons that turn into <strong>living forests</strong>, that is something special.</p><p>Thank you for making it count! 🙌🌍</p>',
      },
    ],
    de: [
      {
        id: 'sc-1',
        html: '<p>📚 <strong>Junge Köpfe, große Herzen.</strong></p><p>Danke, dass ihr <em>echte Veränderung</em> pflanzt. So stolz auf diese Klasse. 🌳</p>',
      },
      {
        id: 'sc-2',
        html: '<p>Ihr habt gelernt, euch gekümmert und <em>gehandelt</em>.</p><p>Danke, dass ihr der nächsten Generation eine grünere Welt schenkt. 🌱💚</p>',
      },
      {
        id: 'sc-3',
        html: '<p>Unterricht, der zu <strong>lebendigen Wäldern</strong> wird, das ist etwas Besonderes.</p><p>Danke, dass ihr es zählen lasst! 🙌🌍</p>',
      },
    ],
  },
  corporate: {
    en: [
      {
        id: 'co-1',
        html: '<p>🤝 <strong>The dream team plants trees together.</strong></p><p>Thank you for turning teamwork into <em>real forests</em>. This is what good business looks like. 🌳💚</p>',
      },
      {
        id: 'co-2',
        html: '<p><strong>Business with heart</strong>, that is you.</p><p>Thank you for investing in restoration and education that we believe in. 🌱</p>',
      },
      {
        id: 'co-3',
        html: '<p>Real leadership <em>plants seeds</em> for the future, and that is exactly what you just did.</p><p>Thank you! 🙌🌍</p>',
      },
    ],
    de: [
      {
        id: 'co-1',
        html: '<p>🤝 <strong>Das Dreamteam pflanzt gemeinsam Bäume.</strong></p><p>Danke, dass ihr Teamgeist in <em>echte Wälder</em> verwandelt. So sieht gutes Unternehmertum aus. 🌳💚</p>',
      },
      {
        id: 'co-2',
        html: '<p><strong>Wirtschaft mit Herz</strong>, das seid ihr.</p><p>Danke, dass ihr in Renaturierung und Bildung investiert, die uns am Herzen liegen. 🌱</p>',
      },
      {
        id: 'co-3',
        html: '<p>Echte Führung <em>sät</em> für die Zukunft, und genau das habt ihr getan.</p><p>Danke! 🙌🌍</p>',
      },
    ],
  },
};

/**
 * Keywords that hint at an occasion. Checked in priority order against the
 * fundraiser title (and description) so the more specific occasions win before
 * the generic "events". Matching is case-insensitive substring matching.
 */
const OCCASION_KEYWORDS: { id: string; keywords: string[] }[] = [
  {
    id: 'birthday',
    keywords: ['birthday', 'bday', 'geburtstag'],
  },
  {
    id: 'wedding',
    keywords: ['wedding', 'married', 'marriage', 'hochzeit', 'heirat'],
  },
  {
    id: 'newborn',
    keywords: [
      'newborn',
      'new baby',
      'baby shower',
      'baby',
      'christening',
      'baptism',
      'neugeboren',
      'taufe',
      'willkommen baby',
    ],
  },
  {
    id: 'memorial',
    keywords: [
      'memorial',
      'memoriam',
      'in memory',
      'remembrance',
      'funeral',
      'gedenk',
      'andenken',
      'trauer',
      'beerdigung',
      'beisetzung',
    ],
  },
  {
    id: 'health',
    keywords: [
      'health',
      'recovery',
      'recover',
      'get well',
      'long life',
      'longevity',
      'cancer',
      'chemo',
      'treatment',
      'hospital',
      'healing',
      'gesundheit',
      'genesung',
      'krebs',
      'heilung',
    ],
  },
  {
    id: 'sports',
    keywords: [
      'marathon',
      'running',
      'run for',
      'race',
      'match',
      'tournament',
      'cycling',
      'football',
      'soccer',
      'sport',
      'lauf',
      'turnier',
      'fußball',
      'radtour',
    ],
  },
  {
    id: 'school',
    keywords: [
      'school',
      'classroom',
      'student',
      'pupil',
      'university',
      'college',
      'schule',
      'klasse',
      'schüler',
      'studierende',
    ],
  },
  {
    id: 'corporate',
    keywords: [
      'company',
      'corporate',
      'colleagues',
      'workplace',
      'firma',
      'unternehmen',
      'gmbh',
      'kollegen',
    ],
  },
  {
    id: 'tech',
    keywords: [
      'hackathon',
      'startup',
      'developer',
      'coding',
      'software',
      'gaming',
      'twitch',
      'stream',
    ],
  },
  {
    id: 'music',
    keywords: [
      'concert',
      'music',
      'album',
      'choir',
      'orchestra',
      'live gig',
      'konzert',
      'musik',
      'orchester',
    ],
  },
  {
    id: 'events',
    keywords: [
      'festival',
      'gala',
      'party',
      'anniversary',
      'jubilee',
      'feier',
      'veranstaltung',
      'jubiläum',
    ],
  },
];

/**
 * Best-effort guess of the most fitting occasion from free text (typically the
 * fundraiser title). Falls back to the general set when nothing matches.
 */
export function inferThankYouOccasionId(
  ...texts: (string | null | undefined)[]
) {
  const haystack = texts.filter(Boolean).join(' ').toLowerCase();

  if (!haystack.trim()) {
    return DEFAULT_THANK_YOU_OCCASION_ID;
  }

  for (const { id, keywords } of OCCASION_KEYWORDS) {
    if (keywords.some(keyword => haystack.includes(keyword))) {
      return id;
    }
  }

  return DEFAULT_THANK_YOU_OCCASION_ID;
}
