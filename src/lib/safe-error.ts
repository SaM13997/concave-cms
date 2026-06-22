const SAFE_ERROR_PATTERNS = [
  "Not authenticated",
  "Unauthorized",
  "Insufficient permissions",
  "Content entry not found",
  "No active schema found",
  "Title is required",
  "Preview token",
  "Too many requests",
  "Invalid characters",
  "Slug must use",
  "is too long",
] as const;

function isSafeClientMessage(message: string): boolean {
  if (message.length > 200) {
    return false;
  }

  if (/stack|convex|internal|mutation|query|\.ts:|\.js:/i.test(message)) {
    return false;
  }

  return SAFE_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
}

export function toSafeErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (!(error instanceof Error)) {
    return fallback;
  }

  if (error.name === "RateLimitError" || error.name === "InputValidationError") {
    return error.message;
  }

  if (isSafeClientMessage(error.message)) {
    return error.message;
  }

  return fallback;
}
