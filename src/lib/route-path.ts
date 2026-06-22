export function routePathFromLocation(location: { pathname: string; search: unknown }): string {
  if (!location.search || typeof location.search !== "object") {
    return location.pathname;
  }

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(location.search as Record<string, unknown>)) {
    if (value === undefined || value === null) {
      continue;
    }
    params.set(key, String(value));
  }

  const query = params.toString();
  return query ? `${location.pathname}?${query}` : location.pathname;
}
