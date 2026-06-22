export function rankSearchMatch(
  query: string,
  fields: { primary: string; secondary?: string },
): number {
  const q = query.toLowerCase().trim();
  if (!q) {
    return 0;
  }

  const primary = fields.primary.toLowerCase();
  const secondary = fields.secondary?.toLowerCase() ?? "";

  if (primary === q) {
    return 100;
  }
  if (primary.startsWith(q)) {
    return 80;
  }
  if (primary.includes(q)) {
    return 60;
  }
  if (secondary.startsWith(q)) {
    return 50;
  }
  if (secondary.includes(q)) {
    return 40;
  }
  return 0;
}

export function sortByScore<T extends { score: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.score - a.score);
}
