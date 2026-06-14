import { useCallback, useEffect, useMemo, useState } from "react";
import type { Episode, Series } from "../../domain/types";
import { db } from "../../firebase/firebase";
import { fetchEpisodesBySeriesId, fetchForYouSeries } from "../../repositories/catalogRepository";

type ShortsFeedState = {
  episodes: Episode[];
  error: Error | null;
  loading: boolean;
  reload: () => Promise<void>;
  seriesById: Map<string, Series>;
};

export function useShortsFeed(): ShortsFeedState {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

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

  return { episodes, error, loading, reload, seriesById };
}
