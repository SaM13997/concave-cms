import type { DestructiveChange, SchemaField } from "./schemaTypes";

export function detectDestructiveChanges(
  activeFields: readonly SchemaField[],
  draftFields: readonly SchemaField[],
  contentType: string,
  entryCount: number,
  entriesWithFieldCounts: ReadonlyMap<string, number>,
): DestructiveChange[] {
  const changes: DestructiveChange[] = [];
  const activeBySlug = new Map(activeFields.map((f) => [f.slug, f]));
  const draftBySlug = new Map(draftFields.map((f) => [f.slug, f]));

  for (const [slug] of activeBySlug) {
    if (!draftBySlug.has(slug)) {
      const affected = entriesWithFieldCounts.get(slug) ?? 0;
      changes.push({
        type: "delete_field",
        target: `${contentType}.${slug}`,
        affectedEntryCount: affected,
        message: `Field "${slug}" will be removed (${affected} entries affected)`,
      });
    }
  }

  for (const [slug, draftField] of draftBySlug) {
    const activeField = activeBySlug.get(slug);
    if (!activeField) {
      continue;
    }
    if (activeField.type !== draftField.type) {
      const affected = entriesWithFieldCounts.get(slug) ?? entryCount;
      changes.push({
        type: "change_field_type",
        target: `${contentType}.${slug}`,
        affectedEntryCount: affected,
        message: `Field "${slug}" type changes from ${activeField.type} to ${draftField.type}`,
      });
    }
    if (activeField.required && !draftField.required) {
      changes.push({
        type: "remove_required",
        target: `${contentType}.${slug}`,
        affectedEntryCount: entryCount,
        message: `Field "${slug}" will no longer be required`,
      });
    }
  }

  return changes;
}

export function countEntriesWithField(
  entries: ReadonlyArray<{ data: unknown }>,
  fieldSlug: string,
): number {
  return entries.filter((entry) => {
    if (typeof entry.data !== "object" || entry.data === null) {
      return false;
    }
    return fieldSlug in entry.data;
  }).length;
}
