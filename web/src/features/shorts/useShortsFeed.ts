import { useCallback, useEffect, useMemo, useState } from "react";
import type { Episode, Series } from "../../domain/types";
import { db } from "../../firebase/firebase";
import { fetchEpisodesBySeriesId, fetchForYouSeries } from "../../repositories/catalogRepository";

type ShortsFeedState = {
  episodes: Episode[];
  error: Error | null;
  loading: boolean;
  patchEpisode: (episodeId: string, patch: Partial<Episode>) => void;
  patchSeries: (seriesId: string, patch: Partial<Series>) => void;
  reload: () => Promise<void>;
  seriesById: Map<string, Series>;
};

export function useShortsFeed(): ShortsFeedState {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const patchEpisode = useCallback((episodeId: string, patch: Partial<Episode>) => {
    setEpisodes((current) =>
      current.map((episode) => (episode.id === episodeId ? { ...episode, ...patch } : episode)),
    );
  }, []);

  const patchSeries = useCallback((seriesId: string, patch: Partial<Series>) => {
    setSeries((current) =>
      current.map((item) => (item.id === seriesId ? { ...item, ...patch } : item)),
    );
  }, []);

  const reload = useCallback(async () => {
    const configuredDb = db;
    if (!configuredDb) {
      setEpisodes([]);
      setSeries([]);
      setError(new Error("Firebase is not configured."));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const nextSeries = await fetchForYouSeries(configuredDb);
      const episodeGroups = await Promise.all(
        nextSeries.map((item) => fetchEpisodesBySeriesId(configuredDb, item.id)),
      );
      setSeries(nextSeries);
      setEpisodes(episodeGroups.flat());
    } catch (feedError) {
      setEpisodes([]);
      setSeries([]);
      setError(feedError instanceof Error ? feedError : new Error("Unable to load shorts."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const seriesById = useMemo(
    () => new Map(series.map((item) => [item.id, item] as const)),
    [series],
  );

  return { episodes, error, loading, patchEpisode, patchSeries, reload, seriesById };
}
