import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { invalidateSeriesEpisodeCache } from "./episodeSeriesCache";
import type { SeriesMeta } from "./seriesFirestore";

export type SeriesStats = {
  episodeCount: number;
  totalDurationSec: number;
};

async function readSeriesStats(seriesId: string): Promise<SeriesStats> {
  if (!db) {
    return { episodeCount: 0, totalDurationSec: 0 };
  }
  const snap = await getDoc(doc(db, "series", seriesId));
  if (!snap.exists()) {
    return { episodeCount: 0, totalDurationSec: 0 };
  }
  const data = snap.data();
  return {
    episodeCount:
      typeof data.episodeCount === "number" ? data.episodeCount : 0,
    totalDurationSec:
      typeof data.totalDurationSec === "number" ? data.totalDurationSec : 0,
  };
}

async function writeSeriesStatsFields(
  seriesId: string,
  meta: SeriesMeta,
  stats: SeriesStats,
): Promise<void> {
  if (!db) {
    return;
  }
  const seriesRef = doc(db, "series", seriesId);
  const existing = await getDoc(seriesRef);
  const fields = {
    id: seriesId,
    title: meta.title,
    description: meta.description,
    coverUrl: meta.coverUrl,
    category: meta.category,
    isVip: meta.isVip,
    episodeCount: stats.episodeCount,
    totalDurationSec: stats.totalDurationSec,
    isPublished: stats.episodeCount > 0,
  };
  if (!existing.exists()) {
    await setDoc(seriesRef, {
      ...fields,
      createdAt: serverTimestamp(),
      popularity: 0,
    });
  } else {
    await setDoc(seriesRef, fields, { merge: true });
  }
}

/** Adjust series counters after publish or replace (no full episode scan). */
export async function applyEpisodePublishStats(
  seriesId: string,
  meta: SeriesMeta,
  input: {
    durationSec: number;
    isNewEpisode: boolean;
    previousDurationSec?: number;
  },
): Promise<SeriesStats> {
  invalidateSeriesEpisodeCache(seriesId);
  const current = await readSeriesStats(seriesId);
  let episodeCount = current.episodeCount;
  let totalDurationSec = current.totalDurationSec;

  if (input.isNewEpisode) {
    episodeCount += 1;
    totalDurationSec += input.durationSec;
  } else {
    const prev = input.previousDurationSec ?? 0;
    totalDurationSec = Math.max(0, totalDurationSec - prev + input.durationSec);
  }

  const stats = { episodeCount, totalDurationSec };
  await writeSeriesStatsFields(seriesId, meta, stats);
  return stats;
}

/** Adjust series counters after deleting one or more episodes. */
export async function applyEpisodeDeleteStats(
  seriesId: string,
  meta: SeriesMeta,
  removed: { count: number; totalDurationSec: number },
): Promise<SeriesStats> {
  invalidateSeriesEpisodeCache(seriesId);
  const current = await readSeriesStats(seriesId);
  const episodeCount = Math.max(0, current.episodeCount - removed.count);
  const totalDurationSec = Math.max(
    0,
    current.totalDurationSec - removed.totalDurationSec,
  );
  const stats = { episodeCount, totalDurationSec };
  await writeSeriesStatsFields(seriesId, meta, stats);
  return stats;
}
