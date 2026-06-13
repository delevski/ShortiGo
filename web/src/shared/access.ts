import type { AppUser, Episode } from "../domain/types";

export type EpisodeAccess =
  | { state: "open" }
  | { state: "login"; bonusCost?: number }
  | { state: "bonus"; bonusCost: number }
  | { state: "vip"; bonusCost?: number };

export function episodeAccess(episode: Episode, user: AppUser | null): EpisodeAccess {
  if (episode.isVipLocked) {
    return user?.isVip
      ? { state: "open" }
      : { state: "vip", bonusCost: episode.bonusUnlockCost };
  }
  if (user?.unlockedEpisodeIds.includes(episode.id)) {
    return { state: "open" };
  }
  if (episode.bonusUnlockCost && episode.bonusUnlockCost > 0) {
    if (!user) return { state: "login", bonusCost: episode.bonusUnlockCost };
    return { state: "bonus", bonusCost: episode.bonusUnlockCost };
  }
  return { state: "open" };
}
