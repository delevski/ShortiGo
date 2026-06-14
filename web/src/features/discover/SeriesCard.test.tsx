import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { Series } from "../../domain/types";
import { SeriesCard } from "./SeriesCard";

const vipSeries: Series = {
  id: "s1",
  title: "VIP Nights",
  description: "A premium short series.",
  coverUrl: "/vip.jpg",
  category: "vip",
  isVip: true,
  episodeCount: 8,
  totalDurationSec: 960,
  createdAt: new Date("2026-02-01"),
  popularity: 99,
  watchCount: 1200,
  saveCount: 20,
  followerCount: 4500,
  isPublished: true,
};

describe("SeriesCard", () => {
  it("links VIP series to the series detail route and shows the VIP chip", () => {
    render(
      <MemoryRouter>
        <SeriesCard series={vipSeries} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /VIP Nights/i }).getAttribute("href")).toBe("/series/s1");
    expect(screen.getByText("VIP")).toBeTruthy();
  });
});
