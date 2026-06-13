import { describe, expect, it } from "vitest";
import { episodeShareText, episodeShareUrl } from "./share";

describe("share helpers", () => {
  it("builds stable episode URLs", () => {
    expect(
      episodeShareUrl({
        origin: "https://shortigo.app",
        seriesId: "series_1",
        episodeId: "episode_3",
      }),
    ).toBe("https://shortigo.app/series/series_1/episodes/episode_3");
  });

  it("builds share text", () => {
    expect(
      episodeShareText({
        seriesTitle: "Velvet Lies",
        episodeOrder: 3,
        seriesId: "series_1",
        episodeId: "episode_3",
        origin: "https://shortigo.app",
      }),
    ).toContain("Watch Velvet Lies EP.3 on ShortiGo");
  });
});
