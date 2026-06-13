import { describe, expect, it } from "vitest";
import { canClaimDailyCheckIn, shouldUseRewardApi } from "./rewardsRepository";

describe("rewardsRepository helpers", () => {
  it("uses reward api only when configured", () => {
    expect(shouldUseRewardApi("")).toBe(false);
    expect(shouldUseRewardApi("https://api.example.com")).toBe(true);
  });

  it("allows daily check-in once per local day", () => {
    const now = new Date("2026-06-12T10:00:00Z");
    expect(canClaimDailyCheckIn(undefined, now)).toBe(true);
    expect(canClaimDailyCheckIn(new Date("2026-06-11T23:00:00Z"), now)).toBe(true);
    expect(canClaimDailyCheckIn(new Date("2026-06-12T01:00:00Z"), now)).toBe(false);
  });
});
