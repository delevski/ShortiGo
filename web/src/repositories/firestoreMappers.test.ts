import { Timestamp } from "firebase/firestore";
import { describe, expect, it } from "vitest";
import { mapEpisode, mapSeries, mapTransaction, mapUser } from "./firestoreMappers";

describe("firestore mappers", () => {
  it("maps series documents with defaults", () => {
    const createdAt = new Date("2026-01-01T00:00:00Z");
    const series = mapSeries("s1", {
      title: "Velvet Lies",
      coverUrl: "https://example.com/c.jpg",
      category: "hot",
      createdAt: Timestamp.fromDate(createdAt),
    });

    expect(series).toMatchObject({
      id: "s1",
      title: "Velvet Lies",
      description: "",
      category: "hot",
      isPublished: false,
      saveCount: 0,
    });
    expect(series.createdAt).toEqual(createdAt);
  });

  it("preserves explicit published series documents", () => {
    expect(
      mapSeries("s1", {
        title: "Velvet Lies",
        isPublished: true,
      }),
    ).toMatchObject({
      id: "s1",
      isPublished: true,
    });
  });

  it("maps episode documents with defaults", () => {
    expect(
      mapEpisode("e1", {
        seriesId: "s1",
        order: 2,
        videoUrl: "https://example.com/v.mp4",
        thumbnailUrl: "https://example.com/t.jpg",
        durationSec: 33,
      }),
    ).toMatchObject({
      id: "e1",
      seriesId: "s1",
      order: 2,
      isVipLocked: false,
      likeCount: 0,
    });
  });

  it("maps users with list defaults", () => {
    const createdAt = new Date("2026-01-01T00:00:00Z");
    const user = mapUser("u1", {
      email: "u@example.com",
      createdAt,
    });

    expect(user).toMatchObject({
      id: "u1",
      email: "u@example.com",
      coins: 0,
      bonus: 0,
      favoriteSeriesIds: [],
    });
    expect(user.createdAt).toEqual(createdAt);
  });

  it("maps transaction balance types without hiding invalid data", () => {
    expect(
      mapTransaction("t1", {
        userId: "u1",
        type: "daily_check_in",
        amount: 5,
        balanceType: "coins",
        createdAt: Timestamp.fromDate(new Date("2026-01-01T00:00:00Z")),
      }),
    ).toMatchObject({
      id: "t1",
      balanceType: "coins",
    });

    expect(
      mapTransaction("t2", {
        userId: "u1",
        type: "bonus_unlock",
        amount: -1,
        balanceType: "bonus",
      }),
    ).toMatchObject({
      id: "t2",
      balanceType: "bonus",
    });

    expect(mapTransaction("t3", {}).balanceType).toBe("unknown");
    expect(mapTransaction("t4", { balanceType: "credits" }).balanceType).toBe("unknown");
  });

  it("maps duck-typed timestamp values to dates", () => {
    const createdAt = new Date("2026-02-03T04:05:06Z");

    expect(
      mapTransaction("t1", {
        createdAt: { toDate: () => createdAt },
      }).createdAt,
    ).toEqual(createdAt);
  });
});
