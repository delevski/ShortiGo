import test from "node:test";
import assert from "node:assert/strict";

import { checkUnlock, dailyCheckInReward } from "../src/economy.js";

test("VIP episodes cannot be bought with bonus", () => {
  assert.deepEqual(
    checkUnlock({ isVipLocked: true, bonusUnlockCost: 60 }, 100),
    { ok: false, reason: "vip_required" },
  );
});

test("unlock requires enough bonus", () => {
  assert.deepEqual(
    checkUnlock({ isVipLocked: false, bonusUnlockCost: 60 }, 59),
    { ok: false, reason: "insufficient_bonus" },
  );
  assert.deepEqual(
    checkUnlock({ isVipLocked: false, bonusUnlockCost: 60 }, 60),
    { ok: true, cost: 60 },
  );
});

test("daily check-in reward grows through day seven", () => {
  assert.equal(dailyCheckInReward(1), 5);
  assert.equal(dailyCheckInReward(7), 20);
  assert.equal(dailyCheckInReward(20), 20);
});
