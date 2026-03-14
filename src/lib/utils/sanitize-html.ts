import sanitizeHtml from 'sanitize-html';

import { toSafeHtml } from '@/lib/types/safe-html';
import type { SafeHtml } from '@/lib/types/safe-html';

const DESCRIPTION_ALLOWED_TAGS = [
  'p',
  'ul',
  'ol',
  'li',
  'strong',
  'em',
  'u',
  's',
  'blockquote',
  'br',
  'span',
  'a',
  'h2',
  'h3',
];

const DESCRIPTION_ALLOWED_ATTR: sanitizeHtml.IOptions['allowedAttributes'] = {
  a: ['href', 'title', 'target', 'rel'],
  '*': ['class'],
};

export function sanitizeDescriptionHtml(dirty: string): SafeHtml {
  const clean = sanitizeHtml(dirty, {
    allowedTags: DESCRIPTION_ALLOWED_TAGS,
    allowedAttributes: DESCRIPTION_ALLOWED_ATTR,
    allowedSchemes: ['http', 'https', 'mailto'],
    allowProtocolRelative: false,
  });

  return toSafeHtml(clean);
}

