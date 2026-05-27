import type { IOptions } from 'sanitize-html';
import type { SafeHtml } from '@/lib/types/safe-html';

import sanitizeHtml from 'sanitize-html';

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
];

const DESCRIPTION_ALLOWED_ATTR: IOptions['allowedAttributes'] = {
  a: ['href', 'title', 'rel'],
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
  'br',
  'span',
  'blockquote',
];

export function sanitizeThankYouHtml(dirty: string): SafeHtml {
  const clean = sanitizeHtml(dirty, {
    allowedTags: THANK_YOU_ALLOWED_TAGS,
    allowedAttributes: {},
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
          rel: 'noopener noreferrer',
        },
      }),
    },
  });

  return toSafeHtml(clean);
}
