import { Timestamp } from "firebase/firestore";
import { describe, expect, it } from "vitest";
import { mapEpisode, mapSeries, mapUser } from "./firestoreMappers";

describe("firestore mappers", () => {
  it("maps series documents with defaults", () => {
    expect(
      mapSeries("s1", {
        title: "Velvet Lies",
        coverUrl: "https://example.com/c.jpg",
        category: "hot",
        createdAt: Timestamp.fromDate(new Date("2026-01-01T00:00:00Z")),
      }),
    ).toMatchObject({
      id: "s1",
      title: "Velvet Lies",
      description: "",
      category: "hot",
      isPublished: true,
      saveCount: 0,
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
    expect(
      mapUser("u1", {
        email: "u@example.com",
        createdAt: Timestamp.fromDate(new Date("2026-01-01T00:00:00Z")),
      }),
    ).toMatchObject({
      id: "u1",
      email: "u@example.com",
      coins: 0,
      bonus: 0,
      favoriteSeriesIds: [],
    });
  });
});
