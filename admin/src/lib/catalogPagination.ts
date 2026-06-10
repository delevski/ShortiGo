import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import { episodeAppLabel } from "./episodeMeta";
import { logInfo } from "./logger";
import type { CatalogEpisode } from "./firestoreCatalog";

export const SERIES_PAGE_SIZE = 25;

export type CatalogSeriesSummary = {
  seriesId: string;
  seriesTitle: string;
  coverUrl: string;
  category: string;
  episodeCount: number;
  providerId: string | null;
};

export type SeriesPageResult = {
  series: CatalogSeriesSummary[];
  lastDoc: QueryDocumentSnapshot | null;
  hasMore: boolean;
};

function parseSeriesSummary(
  item: QueryDocumentSnapshot,
): CatalogSeriesSummary {
  const data = item.data();
  return {
    seriesId: item.id,
    seriesTitle: typeof data.title === "string" ? data.title : item.id,
    coverUrl: typeof data.coverUrl === "string" ? data.coverUrl : "",
    category: typeof data.category === "string" ? data.category : "new",
    episodeCount:
      typeof data.episodeCount === "number" ? data.episodeCount : 0,
    providerId:
      typeof data.providerId === "string" ? data.providerId : null,
  };
}

export async function fetchSeriesPage(options: {
  scopeProviderId?: string | null;
  pageSize?: number;
  startAfterDoc?: DocumentSnapshot | null;
}): Promise<SeriesPageResult> {
  if (!db) {
    return { series: [], lastDoc: null, hasMore: false };
  }
  const pageSize = options.pageSize ?? SERIES_PAGE_SIZE;

  try {
    return await querySeriesPage(options, pageSize, true);
  } catch (error) {
    logInfo("Series page query failed, retrying without orderBy", {
      error: String(error),
    });
    return querySeriesPage(options, pageSize, false);
  }
}

async function querySeriesPage(
  options: {
    scopeProviderId?: string | null;
    startAfterDoc?: DocumentSnapshot | null;
  },
  pageSize: number,
  useOrderByTitle: boolean,
): Promise<SeriesPageResult> {
  if (!db) {
    return { series: [], lastDoc: null, hasMore: false };
  }

  if (!useOrderByTitle) {
    const snap = options.scopeProviderId
      ? await getDocs(
          query(
            collection(db, "series"),
            where("providerId", "==", options.scopeProviderId),
          ),
        )
      : await getDocs(collection(db, "series"));
    const sorted = snap.docs
      .map(parseSeriesSummary)
      .sort((a, b) => a.seriesTitle.localeCompare(b.seriesTitle));

    let startIndex = 0;
    if (options.startAfterDoc) {
      const afterId = options.startAfterDoc.id;
      const idx = sorted.findIndex((s) => s.seriesId === afterId);
      startIndex = idx >= 0 ? idx + 1 : 0;
    }
    const slice = sorted.slice(startIndex, startIndex + pageSize);
    return {
      series: slice,
      lastDoc:
        slice.length > 0
          ? (snap.docs.find((d) => d.id === slice[slice.length - 1]!.seriesId) ??
            null)
          : null,
      hasMore: startIndex + pageSize < sorted.length,
    };
  }

  const constraints = options.scopeProviderId
    ? [
        where("providerId", "==", options.scopeProviderId),
        orderBy("title"),
        limit(pageSize),
      ]
    : [orderBy("title"), limit(pageSize)];

  let q = query(collection(db, "series"), ...constraints);
  if (options.startAfterDoc) {
    q = query(q, startAfter(options.startAfterDoc));
  }

  const snap = await getDocs(q);
  const series = snap.docs.map(parseSeriesSummary);
  const lastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
  return {
    series,
    lastDoc,
    hasMore: snap.docs.length >= pageSize,
  };
}

/** Series that have episodes but may lack a `series/{id}` document (legacy catalog). */
export async function fetchEpisodeDerivedSeriesSummaries(
  scopeProviderId?: string | null,
  excludeSeriesIds: Set<string> = new Set(),
): Promise<CatalogSeriesSummary[]> {
  if (!db) {
    return [];
  }
  const snap = scopeProviderId
    ? await getDocs(
        query(
          collection(db, "episodes"),
          where("providerId", "==", scopeProviderId),
        ),
      )
    : await getDocs(collection(db, "episodes"));

  const bySeries = new Map<string, { count: number; thumb: string }>();
  for (const item of snap.docs) {
    const data = item.data();
    const seriesId = typeof data.seriesId === "string" ? data.seriesId : "";
    if (!seriesId || excludeSeriesIds.has(seriesId)) {
      continue;
    }
    const bucket = bySeries.get(seriesId) ?? { count: 0, thumb: "" };
    bucket.count += 1;
    if (!bucket.thumb && typeof data.thumbnailUrl === "string") {
      bucket.thumb = data.thumbnailUrl;
    }
    bySeries.set(seriesId, bucket);
  }

  return [...bySeries.entries()]
    .map(([seriesId, info]) => ({
      seriesId,
      seriesTitle: seriesId,
      coverUrl: info.thumb,
      category: "new",
      episodeCount: info.count,
      providerId: scopeProviderId ?? null,
    }))
    .sort((a, b) => a.seriesTitle.localeCompare(b.seriesTitle));
}

export async function fetchEpisodesForSeries(
  seriesId: string,
  seriesTitle: string,
): Promise<CatalogEpisode[]> {
  if (!db || !seriesId.trim()) {
    return [];
  }
  const snap = await getDocs(
    query(
      collection(db, "episodes"),
      where("seriesId", "==", seriesId.trim()),
    ),
  );
  const episodes: CatalogEpisode[] = snap.docs.map((item) => {
    const data = item.data();
    const order = typeof data.order === "number" ? data.order : 0;
    return {
      id: item.id,
      seriesId: seriesId.trim(),
      seriesTitle,
      order,
      durationSec:
        typeof data.durationSec === "number" ? data.durationSec : 0,
      videoUrl: typeof data.videoUrl === "string" ? data.videoUrl : "",
      thumbnailUrl:
        typeof data.thumbnailUrl === "string" ? data.thumbnailUrl : "",
      displayName: `${seriesTitle} · ${episodeAppLabel(order)}`,
      isVipLocked: data.isVipLocked === true,
      bonusUnlockCost:
        typeof data.bonusUnlockCost === "number" ? data.bonusUnlockCost : null,
    };
  });
  episodes.sort((a, b) => a.order - b.order);
  return episodes;
}
