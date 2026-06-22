const MAX_SEARCH_LENGTH = 200;
const MAX_TITLE_LENGTH = 500;
const MAX_SLUG_LENGTH = 64;
const MAX_GENERIC_TEXT_LENGTH = 10_000;

const DANGEROUS_PATTERNS = [
  /<script\b/i,
  /javascript:/i,
  /on\w+\s*=/i,
  /data:text\/html/i,
] as const;

export class InputValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InputValidationError";
  }
}

export function sanitizeSearchQuery(query: string): string {
  return query.trim().slice(0, MAX_SEARCH_LENGTH);
}

export function assertSafeText(
  value: string,
  fieldName: string,
  maxLength: number = MAX_GENERIC_TEXT_LENGTH,
): void {
  if (value.length > maxLength) {
    throw new InputValidationError(`${fieldName} is too long`);
  }

  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(value)) {
      throw new InputValidationError(`Invalid characters in ${fieldName}`);
    }
  }
}

export function assertValidTitle(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) {
    throw new InputValidationError("Title is required");
  }
  assertSafeText(trimmed, "Title", MAX_TITLE_LENGTH);
  return trimmed;
}

export function assertValidSlug(slug: string): string {
  const trimmed = slug.trim();
  if (!trimmed) {
    throw new InputValidationError("Slug is required");
  }
  if (trimmed.length > MAX_SLUG_LENGTH) {
    throw new InputValidationError("Slug is too long");
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trimmed)) {
    throw new InputValidationError("Slug must use lowercase letters, numbers, and hyphens");
  }
  assertSafeText(trimmed, "Slug", MAX_SLUG_LENGTH);
  return trimmed;
}

export function rejectInjectionPayload(value: string): boolean {
  return DANGEROUS_PATTERNS.some((pattern) => pattern.test(value));
}
