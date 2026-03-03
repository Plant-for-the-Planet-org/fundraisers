function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function getRichTextTextContent(html: string): string {
  if (!html) {
    return '';
  }

  const normalizedHtml = html.replace(/&nbsp;/gi, ' ').replace(/\u00a0/g, ' ');

  if (typeof DOMParser !== 'undefined') {
    const parser = new DOMParser();
    const document = parser.parseFromString(normalizedHtml, 'text/html');
    const textContent = document.body.textContent ?? '';
    return normalizeWhitespace(textContent);
  }

  const textOnly = normalizedHtml.replace(/<[^>]*>/g, ' ');
  return normalizeWhitespace(textOnly);
}
