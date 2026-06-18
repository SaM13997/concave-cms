import featureList from "../../featureList.json";
import { describe, expect, it } from "vitest";
import { getGapCounts } from "./checklist-utils";

describe("launch checklist data", () => {
  it("uses only allowed statuses", () => {
    const allowed = new Set(featureList.statusValues);
    const unknown = featureList.features.filter(
      (feature) => !allowed.has(feature.status),
    );

    expect(unknown).toEqual([]);
  });

  it("contains all seeded requirement entries", () => {
    expect(featureList.features).toHaveLength(49);
  });

  it("does not mark seeded items verified without evidence", () => {
    const invalid = featureList.features.filter(
      (feature) => feature.status === "verified" && feature.evidence.length === 0,
    );

    expect(invalid).toEqual([]);
  });

  it("keeps route gap counts aligned with the allowed taxonomy", () => {
    const counts = getGapCounts(featureList.features, featureList.gapCategories);

    expect(Object.keys(counts)).toEqual(featureList.gapCategories);
  });
});
