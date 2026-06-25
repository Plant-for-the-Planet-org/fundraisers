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
  'blockquote',
  'hr',
  'br',
  'span',
  'a',
  'h2',
  'h3',
  VIDEO_EMBED_TAG,
];

const DESCRIPTION_ALLOWED_ATTR: IOptions['allowedAttributes'] = {
  a: ['href', 'title', 'rel'],
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
      [VIDEO_EMBED_TAG]: VIDEO_EMBED_ATTR,
    },
    allowedSchemes: [],
    allowProtocolRelative: false,
  });
  return toSafeHtml(clean);
}

export function sanitizeDescriptionHtml(dirty: string): SafeHtml {
  const clean = sanitizeHtml(dirty, {
    allowedTags: DESCRIPTION_ALLOWED_TAGS,
    allowedAttributes: DESCRIPTION_ALLOWED_ATTR,
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
