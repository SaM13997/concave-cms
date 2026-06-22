import { describe, expect, it } from "vitest";
import { rankSearchMatch, sortByScore } from "./searchRanking";

describe("rankSearchMatch", () => {
  it("ranks exact matches highest", () => {
    expect(rankSearchMatch("blog", { primary: "Blog" })).toBe(100);
  });

  it("ranks prefix matches above substring", () => {
    expect(rankSearchMatch("blo", { primary: "Blog post" })).toBe(80);
    expect(rankSearchMatch("post", { primary: "Blog post" })).toBe(60);
  });

  it("matches secondary field with lower score", () => {
    expect(rankSearchMatch("author", { primary: "Title", secondary: "author-profile" })).toBe(50);
  });

  it("returns zero when no match", () => {
    expect(rankSearchMatch("xyz", { primary: "Blog" })).toBe(0);
  });
});

describe("sortByScore", () => {
  it("sorts descending by score", () => {
    const sorted = sortByScore([
      { score: 40, id: "a" },
      { score: 100, id: "b" },
      { score: 60, id: "c" },
    ]);
    expect(sorted.map((item) => item.id)).toEqual(["b", "c", "a"]);
  });
});
