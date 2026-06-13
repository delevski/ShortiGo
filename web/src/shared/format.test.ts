import { describe, expect, it } from "vitest";
import { compactCount, durationLabel } from "./format";

describe("format helpers", () => {
  it("formats compact counts", () => {
    expect(compactCount(0)).toBe("0");
    expect(compactCount(999)).toBe("999");
    expect(compactCount(1_200)).toBe("1.2K");
    expect(compactCount(242_600)).toBe("242.6K");
    expect(compactCount(1_500_000)).toBe("1.5M");
  });

  it("formats durations", () => {
    expect(durationLabel(45)).toBe("0:45");
    expect(durationLabel(125)).toBe("2:05");
    expect(durationLabel(3_725)).toBe("1:02:05");
  });
});
