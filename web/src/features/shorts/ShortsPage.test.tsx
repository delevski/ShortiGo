import { act, render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter, MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Episode, Series } from "../../domain/types";
import { ShortsPage } from "./ShortsPage";

const seriesOne: Series = {
  id: "series-1",
  title: "First Story",
  description: "The first featured story.",
  coverUrl: "/first.jpg",
  category: "forYou",
  isVip: false,
  episodeCount: 1,
  totalDurationSec: 90,
  createdAt: new Date("2026-01-01"),
  popularity: 10,
  watchCount: 100,
  saveCount: 5,
  followerCount: 8,
  isPublished: true,
};

const seriesTwo: Series = {
  ...seriesOne,
  id: "series-2",
  title: "Second Story",
  description: "The requested story.",
  coverUrl: "/second.jpg",
};

const episodeOne: Episode = {
  id: "episode-1",
  seriesId: "series-1",
  order: 1,
  videoUrl: "/first.mp4",
  thumbnailUrl: "/first.jpg",
  durationSec: 30,
  isVipLocked: false,
  watchCount: 50,
  likeCount: 20,
  shareCount: 3,
};

const episodeTwo: Episode = {
  ...episodeOne,
  id: "episode-2",
  seriesId: "series-2",
  order: 7,
  videoUrl: "/second.mp4",
  thumbnailUrl: "/second.jpg",
};

const shortsFeedMock = vi.hoisted(() => ({
  useShortsFeed: vi.fn(() => ({
    episodes: [episodeOne, episodeTwo],
    error: null,
    loading: false,
    reload: vi.fn(),
    seriesById: new Map([
      [seriesOne.id, seriesOne],
      [seriesTwo.id, seriesTwo],
    ]),
  })),
}));

vi.mock("./useShortsFeed", () => shortsFeedMock);

vi.mock("../../app/AuthContext", () => ({
  useAuth: () => ({
    appUser: null,
    authUser: null,
    configReady: false,
    loginWithGoogle: vi.fn(),
  }),
}));

vi.mock("../../components/Toast", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

describe("ShortsPage", () => {
  beforeEach(() => {
    Object.defineProperty(HTMLMediaElement.prototype, "play", {
      configurable: true,
      value: vi.fn().mockResolvedValue(undefined),
    });
    Object.defineProperty(HTMLMediaElement.prototype, "pause", {
      configurable: true,
      value: vi.fn(),
    });
  });

  it("selects the episode requested by shorts query params", async () => {
    render(
      <MemoryRouter initialEntries={["/shorts?series=series-2&episode=episode-2"]}>
        <ShortsPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByRole("heading", { name: "Second Story" })).toBeTruthy());
    expect(screen.getByText("EP.7")).toBeTruthy();
  });

  it("updates the active episode when shorts query params change in the mounted route", async () => {
    window.history.pushState(null, "", "/shorts?series=series-1&episode=episode-1");

    render(
      <BrowserRouter>
        <ShortsPage />
      </BrowserRouter>,
    );

    await waitFor(() => expect(screen.getByRole("heading", { name: "First Story" })).toBeTruthy());

    act(() => {
      window.history.pushState(null, "", "/shorts?series=series-2&episode=episode-2");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    await waitFor(() => expect(screen.getByRole("heading", { name: "Second Story" })).toBeTruthy());
    expect(screen.getByText("EP.7")).toBeTruthy();
  });
});
