/**
 * Reads the field-error map out of a platform validation body.
 *
 * The platform nests it two levels down, as `parameters.errors`, with each entry a list of message keys:
 * `{ error_code: 'field_validation_failed', parameters: { errors: { 'donor.city': ['form.city.invalid'] } } }`
 *
 * Returns `null` for any body that does not carry that shape, so a caller can fall back to the status-level error. Mapping these paths onto form fields is a domain concern and lives with the consumer, not here.
 */
export function readPlatformFieldErrors(
  body: unknown
): Record<string, string[]> | null {
  if (!body || typeof body !== 'object') return null;
  const parameters = (body as { parameters?: unknown }).parameters;
  if (!parameters || typeof parameters !== 'object') return null;
  const errors = (parameters as { errors?: unknown }).errors;
  if (!errors || typeof errors !== 'object' || Array.isArray(errors)) {
    return null;
  }

  const result: Record<string, string[]> = {};
  for (const [path, messages] of Object.entries(errors)) {
    const list = (Array.isArray(messages) ? messages : [messages]).filter(
      (message): message is string => typeof message === 'string'
    );
    if (list.length > 0) result[path] = list;
  }
  return Object.keys(result).length > 0 ? result : null;
}
