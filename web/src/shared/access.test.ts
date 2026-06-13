import { describe, expect, it } from "vitest";
import { episodeAccess } from "./access";
import type { AppUser, Episode } from "../domain/types";

const openEpisode: Episode = {
  id: "e1",
  seriesId: "s1",
  order: 1,
  videoUrl: "https://example.com/v.mp4",
  thumbnailUrl: "https://example.com/t.jpg",
  durationSec: 30,
  isVipLocked: false,
  watchCount: 0,
  likeCount: 0,
  shareCount: 0,
};

const user: AppUser = {
  id: "u1",
  email: "u@example.com",
  isVip: false,
  coins: 0,
  bonus: 20,
  favoriteSeriesIds: [],
  unlockedEpisodeIds: [],
  likedEpisodeIds: [],
  followedSeriesIds: [],
  createdAt: new Date("2026-01-01T00:00:00Z"),
};

describe("episodeAccess", () => {
  it("opens public episodes", () => {
    expect(episodeAccess(openEpisode, null).state).toBe("open");
  });

  it("requires vip for locked episodes when user is not vip", () => {
    expect(episodeAccess({ ...openEpisode, isVipLocked: true }, user)).toEqual({
      state: "vip",
      bonusCost: undefined,
    });
  });

  it("requires vip even when locked episode id is in unlocked episodes", () => {
    expect(
      episodeAccess(
        { ...openEpisode, isVipLocked: true, bonusUnlockCost: 12 },
        { ...user, unlockedEpisodeIds: ["e1"] },
      ),
    ).toEqual({ state: "vip", bonusCost: 12 });
  });

  it("opens vip episodes for vip users", () => {
    expect(
      episodeAccess({ ...openEpisode, isVipLocked: true }, { ...user, isVip: true }),
    ).toEqual({ state: "open" });
  });

  it("offers bonus unlock when configured", () => {
    expect(
      episodeAccess({ ...openEpisode, bonusUnlockCost: 12 }, user),
    ).toEqual({ state: "bonus", bonusCost: 12 });
  });

  it("opens episodes already unlocked by bonus", () => {
    expect(
      episodeAccess(
        { ...openEpisode, bonusUnlockCost: 12 },
        { ...user, unlockedEpisodeIds: ["e1"] },
      ),
    ).toEqual({ state: "open" });
  });
});
