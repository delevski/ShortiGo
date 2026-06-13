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

  it("maps canonical transaction ledger fields", () => {
    const at = new Date("2026-01-01T00:00:00Z");

    expect(
      mapTransaction("t1", {
        userId: "u1",
        type: "dailyCheckIn",
        coinsDelta: 0,
        bonusDelta: 5,
        reference: "dailyCheckIn",
        at: Timestamp.fromDate(at),
      }),
    ).toMatchObject({
      id: "t1",
      userId: "u1",
      type: "dailyCheckIn",
      coinsDelta: 0,
      bonusDelta: 5,
      reference: "dailyCheckIn",
      at,
    });
  });

  it("maps legacy transaction fields as a fallback", () => {
    expect(
      mapTransaction("t2", {
        userId: "u1",
        type: "spend",
        amount: -1,
        balanceType: "bonus",
        createdAt: Timestamp.fromDate(new Date("2026-01-01T00:00:00Z")),
      }),
    ).toMatchObject({
      id: "t2",
      coinsDelta: 0,
      bonusDelta: -1,
      at: new Date("2026-01-01T00:00:00Z"),
    });
  });

  it("maps duck-typed timestamp values to dates", () => {
    const at = new Date("2026-02-03T04:05:06Z");

    expect(
      mapTransaction("t1", {
        at: { toDate: () => at },
      }).at,
    ).toEqual(at);
  });
});
