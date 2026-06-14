import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type { Episode, Series } from "../../domain/types";
import { ShortsActionRail } from "./ShortsActionRail";

const series: Series = {
  id: "series-1",
  title: "Lost Signal",
  description: "A mysterious feed from a city that vanished.",
  coverUrl: "/cover.jpg",
  category: "forYou",
  isVip: false,
  episodeCount: 12,
  totalDurationSec: 1440,
  createdAt: new Date("2026-01-01"),
  popularity: 98,
  watchCount: 920_000,
  saveCount: 31_900,
  followerCount: 18_200,
  isPublished: true,
};

const episode: Episode = {
  id: "episode-1",
  seriesId: "series-1",
  order: 3,
  videoUrl: "/episode.mp4",
  thumbnailUrl: "/episode.jpg",
  durationSec: 82,
  isVipLocked: false,
  watchCount: 780_000,
  likeCount: 242_600,
  shareCount: 8_400,
};

describe("ShortsActionRail", () => {
  it("renders compact social counts", () => {
    render(
      <MemoryRouter>
        <ShortsActionRail
          episode={episode}
          series={series}
          liked={false}
          saved={false}
          followed={false}
          onFollow={vi.fn()}
          onLike={vi.fn()}
          onSave={vi.fn()}
          onShare={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("242.6K")).toBeTruthy();
    expect(screen.getByText("31.9K")).toBeTruthy();
    expect(screen.getByRole("link", { name: /series info/i }).getAttribute("href")).toBe(
      "/shorts?series=series-1&episode=episode-1",
    );
  });
});
