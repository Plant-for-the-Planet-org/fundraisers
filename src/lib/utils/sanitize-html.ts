import type { IOptions } from 'sanitize-html';
import type { SafeHtml } from '@/lib/types/safe-html';

import sanitizeHtml from 'sanitize-html';

// Inert marker element for embedded videos. It carries only the provider and a
// validated id as data attributes — never an iframe, src, or script. The actual
// player is built by React at render time (see RichTextContent / VideoEmbed)
// from the re-validated id, so no stored attribute value ever reaches an embed
// URL verbatim.
const VIDEO_EMBED_TAG = 'video-embed';
const VIDEO_EMBED_ATTR = [
  'data-video-provider',
  'data-video-id',
  'data-video-aspect',
];

const DESCRIPTION_ALLOWED_TAGS = [
  'p',
  'ul',
  'ol',
  'li',
  'strong',
  'b',
  'em',
  'u',
  's',
  'sub',
  'sup',
  'blockquote',
  'hr',
  'br',
  'span',
  'a',
  'h2',
  'h3',
  VIDEO_EMBED_TAG,
];

// The rich-text editor (shared by descriptions and thank-you notes) emits two
// inline styles: `text-align` on paragraphs (TextAlign extension) and
// `font-size` on spans (FontSize extension). Only those two properties are
// allowed, and only with the exact values the toolbar can produce — so a stored
// `style` attribute can never carry arbitrary CSS. Keep the `font-size` values
// in sync with FONT_SIZE_STEPS in `rich-text-editor.tsx`.
const RICH_TEXT_ALLOWED_STYLES: IOptions['allowedStyles'] = {
  '*': {
    'text-align': [/^(left|right|center)$/],
    'font-size': [/^(12|14|16|18|20|24|30)px$/],
  },
};

const DESCRIPTION_ALLOWED_ATTR: IOptions['allowedAttributes'] = {
  a: ['href', 'title', 'rel'],
  p: ['style'],
  span: ['style'],
  [VIDEO_EMBED_TAG]: VIDEO_EMBED_ATTR,
};

function toSafeHtml(html: string): SafeHtml {
  return html as SafeHtml;
}

const THANK_YOU_ALLOWED_TAGS = [
  'p',
  'strong',
  'b',
  'em',
  'u',
  's',
  'sub',
  'sup',
  'ul',
  'ol',
  'li',
  'hr',
  'br',
  'span',
  'blockquote',
  VIDEO_EMBED_TAG,
];

export function sanitizeThankYouHtml(dirty: string): SafeHtml {
  const clean = sanitizeHtml(dirty, {
    allowedTags: THANK_YOU_ALLOWED_TAGS,
    allowedAttributes: {
      p: ['style'],
      span: ['style'],
      [VIDEO_EMBED_TAG]: VIDEO_EMBED_ATTR,
    },
    allowedStyles: RICH_TEXT_ALLOWED_STYLES,
    allowedSchemes: [],
    allowProtocolRelative: false,
  });
  return toSafeHtml(clean);
}

export function sanitizeDescriptionHtml(dirty: string): SafeHtml {
  const clean = sanitizeHtml(dirty, {
    allowedTags: DESCRIPTION_ALLOWED_TAGS,
    allowedAttributes: DESCRIPTION_ALLOWED_ATTR,
    allowedStyles: RICH_TEXT_ALLOWED_STYLES,
    allowedSchemes: ['http', 'https', 'mailto'],
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          target: '_blank',
          rel: 'nofollow ugc noopener noreferrer',
        },
      }),
    },
  });

  return toSafeHtml(clean);
}
