import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Episode, Series } from "../../domain/types";
import { EpisodeRoutePage } from "./EpisodeRoutePage";
import { SeriesDetailPage } from "./SeriesDetailPage";

const publishedSeries: Series = {
  id: "series-1",
  title: "Published Story",
  description: "A public story.",
  coverUrl: "/cover.jpg",
  category: "forYou",
  isVip: false,
  episodeCount: 1,
  totalDurationSec: 60,
  createdAt: new Date("2026-01-01"),
  popularity: 10,
  watchCount: 100,
  saveCount: 5,
  followerCount: 8,
  isPublished: true,
};

const unpublishedSeries: Series = {
  ...publishedSeries,
  id: "draft-series",
  title: "Draft Story",
  isPublished: false,
};

const vipEpisode: Episode = {
  id: "episode-1",
  seriesId: "series-1",
  order: 1,
  videoUrl: "/episode.mp4",
  thumbnailUrl: "/episode.jpg",
  durationSec: 30,
  isVipLocked: true,
  watchCount: 50,
  likeCount: 20,
  shareCount: 3,
};

const routeMocks = vi.hoisted(() => ({
  appUser: null as null,
  authUser: null as { uid: string } | null,
  fetchEpisodeById: vi.fn(),
  fetchEpisodesBySeriesId: vi.fn(),
  fetchSeriesById: vi.fn(),
  loginWithGoogle: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../firebase/firebase", () => ({
  db: { app: "test-db" },
  firebaseConfigError: undefined,
}));

vi.mock("../../repositories/catalogRepository", () => ({
  fetchEpisodeById: routeMocks.fetchEpisodeById,
  fetchEpisodesBySeriesId: routeMocks.fetchEpisodesBySeriesId,
  fetchSeriesById: routeMocks.fetchSeriesById,
}));

vi.mock("../../app/AuthContext", () => ({
  useAuth: () => ({
    appUser: routeMocks.appUser,
    authUser: routeMocks.authUser,
    configReady: true,
    loginWithGoogle: routeMocks.loginWithGoogle,
  }),
}));

vi.mock("../../components/Toast", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

describe("series routes", () => {
  beforeEach(() => {
    routeMocks.appUser = null;
    routeMocks.authUser = null;
    routeMocks.fetchEpisodeById.mockReset();
    routeMocks.fetchEpisodesBySeriesId.mockReset();
    routeMocks.fetchSeriesById.mockReset();
    routeMocks.loginWithGoogle.mockClear();
    Object.defineProperty(HTMLMediaElement.prototype, "play", {
      configurable: true,
      value: vi.fn().mockResolvedValue(undefined),
    });
    Object.defineProperty(HTMLMediaElement.prototype, "pause", {
      configurable: true,
      value: vi.fn(),
    });
  });

  it("does not render unpublished series details from direct URLs", async () => {
    routeMocks.fetchSeriesById.mockResolvedValue(unpublishedSeries);
    routeMocks.fetchEpisodesBySeriesId.mockResolvedValue([vipEpisode]);

    render(
      <MemoryRouter initialEntries={["/series/draft-series"]}>
        <Routes>
          <Route path="/series/:seriesId" element={<SeriesDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText("Series not found")).toBeTruthy());
    expect(screen.queryByText("Draft Story")).toBeNull();
  });

  it("shows the locked overlay instead of playing direct VIP episode links", async () => {
    routeMocks.fetchSeriesById.mockResolvedValue({ ...publishedSeries, isVip: true });
    routeMocks.fetchEpisodeById.mockResolvedValue(vipEpisode);

    render(
      <MemoryRouter initialEntries={["/series/series-1/episodes/episode-1"]}>
        <Routes>
          <Route path="/series/:seriesId/episodes/:episodeId" element={<EpisodeRoutePage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText("VIP episode")).toBeTruthy());
  });
});
