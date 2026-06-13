import { describe, expect, it } from "vitest";
import { nextCount, toggleArray } from "./socialRepository";

describe("socialRepository helpers", () => {
  it("toggles arrays", () => {
    expect(toggleArray(["a"], "b", true)).toEqual(["a", "b"]);
    expect(toggleArray(["a"], "a", true)).toEqual(["a"]);
    expect(toggleArray(["a", "b"], "a", false)).toEqual(["b"]);
  });

  it("does not decrement counts below zero", () => {
    expect(nextCount(0, -1)).toBe(0);
    expect(nextCount(4, -1)).toBe(3);
    expect(nextCount(4, 1)).toBe(5);
  });
});
