type SnapshotEntry = {
  contentType: string;
  title: string;
  status: "draft" | "published";
};

export function countRestorableEntries(
  snapshot: SnapshotEntry[],
  existing: SnapshotEntry[],
): { restored: number; skipped: number } {
  let restored = 0;
  let skipped = 0;

  for (const entry of snapshot) {
    const duplicate = existing.some(
      (candidate) => candidate.contentType === entry.contentType && candidate.title === entry.title,
    );
    if (duplicate) {
      skipped += 1;
    } else {
      restored += 1;
    }
  }

  return { restored, skipped };
}
