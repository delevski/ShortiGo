import type { PublishedEpisodeRow } from "./firestoreEpisodes";

type SeriesEpisodeCacheEntry = {
  rows: PublishedEpisodeRow[];
  fetchedAt: number;
};

const seriesEpisodesCache = new Map<string, SeriesEpisodeCacheEntry>();

export function getCachedSeriesEpisodes(
  seriesId: string,
): PublishedEpisodeRow[] | null {
  const entry = seriesEpisodesCache.get(seriesId.trim());
  return entry?.rows ?? null;
}

export function setCachedSeriesEpisodes(
  seriesId: string,
  rows: PublishedEpisodeRow[],
): void {
  seriesEpisodesCache.set(seriesId.trim(), {
    rows,
    fetchedAt: Date.now(),
  });
}

export function invalidateSeriesEpisodeCache(seriesId: string): void {
  seriesEpisodesCache.delete(seriesId.trim());
}

export function clearEpisodeSeriesCache(): void {
  seriesEpisodesCache.clear();
}
