import { describe, expect, it } from "vitest";
import { categoryQuerySpec, chunkIds, orderedFeaturedIds } from "./catalogRepository";

describe("catalogRepository helpers", () => {
  it("keeps featured IDs ordered and limited", () => {
    expect(orderedFeaturedIds(["b", "a", "c"], new Set(["a", "c"]), 2)).toEqual(["a", "c"]);
  });

  it("builds hot category query spec", () => {
    expect(categoryQuerySpec("hot")).toEqual({
      field: "category",
      op: "==",
      value: "hot",
      orderField: "popularity",
      direction: "desc",
    });
  });

  it("builds vip category query spec", () => {
    expect(categoryQuerySpec("vip")).toEqual({
      field: "isVip",
      op: "==",
      value: true,
      orderField: "createdAt",
      direction: "desc",
    });
  });

  it("chunks ids for Firestore in queries", () => {
    expect(chunkIds(["1", "2", "3"], 2)).toEqual([["1", "2"], ["3"]]);
  });
});
