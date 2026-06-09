/** Comfortable gap from the top of the scroll container, in px. Clears the
 * close button and gives the field breathing room without burying it. */
const TOP_MARGIN = 96;

/**
 * Selector for fields currently showing a validation error:
 * - `aria-invalid="true"` — React Hook Form inputs (donor / address fields)
 * - `data-field-error="true"` — `FormField` wrappers (Stripe card / SEPA fields)
 */
const ERROR_FIELD_SELECTOR = '[aria-invalid="true"], [data-field-error="true"]';

/**
 * Scrolls `el` into the upper portion of its nearest `[data-scroll-container]`
 * ancestor (leaving `TOP_MARGIN` above it). Falls back to native
 * `scrollIntoView` when no such container exists.
 */
export function scrollElementIntoView(el: HTMLElement): void {
  const scrollParent = el.closest<HTMLElement>('[data-scroll-container]');
  if (!scrollParent) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  const parentRect = scrollParent.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  const offset = elRect.top - parentRect.top - TOP_MARGIN;
  scrollParent.scrollBy({ top: offset, behavior: 'smooth' });
}

/**
 * Finds the first errored field in DOM order and scrolls to it. Returns the
 * field so the caller can also focus it. Returns `null` when nothing is in
 * error (e.g. the failure was not field-level).
 *
 * Searches inside the first `[data-scroll-container]` in the document so the
 * lookup is bounded to the active overlay and never picks up stray invalid
 * inputs elsewhere on the page.
 */
export function scrollToFirstError(): HTMLElement | null {
  const root =
    document.querySelector<HTMLElement>('[data-scroll-container]') ?? document;
  const field = root.querySelector<HTMLElement>(ERROR_FIELD_SELECTOR);
  if (!field) return null;
  scrollElementIntoView(field);
  return field;
}
