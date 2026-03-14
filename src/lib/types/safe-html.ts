export type SafeHtml = string & { __brand: 'SafeHtml' };

export function toSafeHtml(html: string): SafeHtml {
  return html as SafeHtml;
}
