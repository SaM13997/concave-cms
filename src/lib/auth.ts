export function isSafeRedirect(value?: string | null) {
  if (!value) {
    return false;
  }

  if (!value.startsWith("/")) {
    return false;
  }

  if (value.startsWith("//")) {
    return false;
  }

  if (value.includes("://")) {
    return false;
  }

  return true;
}

export function getSafeRedirect(value?: string | null) {
  return isSafeRedirect(value) ? value : undefined;
}
