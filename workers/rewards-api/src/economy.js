export function checkUnlock(episode, bonus) {
  if (episode.isVipLocked === true) {
    return { ok: false, reason: "vip_required" };
  }
  const cost =
    Number.isInteger(episode.bonusUnlockCost) && episode.bonusUnlockCost > 0
      ? episode.bonusUnlockCost
      : null;
  if (cost === null) {
    return { ok: false, reason: "not_unlockable" };
  }
  if (bonus < cost) {
    return { ok: false, reason: "insufficient_bonus" };
  }
  return { ok: true, cost };
}

export function dailyCheckInReward(streakDay) {
  const rewards = [5, 5, 7, 7, 10, 12, 20];
  const index = Math.max(0, Math.min(streakDay, rewards.length) - 1);
  return rewards[index];
}
