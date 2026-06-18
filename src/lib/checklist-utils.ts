export function getStatusCounts(
  items: { status: string }[],
  statusValues: string[],
) {
  return Object.fromEntries(
    statusValues.map((status) => [
      status,
      items.filter((item) => item.status === status).length,
    ]),
  );
}

export function getGapCounts(
  items: { gaps: string[] }[],
  gapCategories: string[],
) {
  return Object.fromEntries(
    gapCategories.map((gap) => [
      gap,
      items.filter((item) => item.gaps.includes(gap)).length,
    ]),
  );
}
