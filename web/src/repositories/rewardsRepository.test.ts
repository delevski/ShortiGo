import { describe, expect, it } from "vitest";
import {
  adRewardLedgerPayload,
  canClaimDailyCheckIn,
  dailyCheckInLedgerPayload,
  shouldUseRewardApi,
} from "./rewardsRepository";

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
    expect(canClaimDailyCheckIn("2026-06-12T01:00:00.000Z", now)).toBe(false);
  });

  it("builds rules-compatible daily check-in ledger payloads", () => {
    expect(dailyCheckInLedgerPayload("u1", "stamp")).toEqual({
      userId: "u1",
      type: "dailyCheckIn",
      coinsDelta: 0,
      bonusDelta: 5,
      reference: "dailyCheckIn",
      at: "stamp",
    });
  });

  it("builds rules-compatible ad reward ledger payloads", () => {
    expect(adRewardLedgerPayload("u1", "stamp")).toEqual({
      userId: "u1",
      type: "adReward",
      coinsDelta: 0,
      bonusDelta: 12,
      reference: "webReward",
      at: "stamp",
    });
  });
});
