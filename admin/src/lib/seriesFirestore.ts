import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import {
  getCachedSeriesEpisodes,
  invalidateSeriesEpisodeCache,
  setCachedSeriesEpisodes,
} from "./episodeSeriesCache";
import type { PublishedEpisodeRow } from "./firestoreEpisodes";

export type SeriesMeta = {
  title: string;
  coverUrl: string;
  category: string;
  isVip: boolean;
};

/** New series: first episode frame. Existing series: keep cover unless user overrides. */
export function resolveSeriesCoverUrl(input: {
  manualCover: string;
  episodeThumbnailUrl: string;
  isNewSeries: boolean;
  episodeOrder: number;
  existingCoverUrl?: string | null;
}): string {
  if (input.manualCover.trim()) {
    return input.manualCover.trim();
  }
  if (input.isNewSeries && input.episodeOrder === 1) {
    return input.episodeThumbnailUrl;
  }
  if (input.existingCoverUrl?.trim()) {
    return input.existingCoverUrl.trim();
  }
  return input.episodeThumbnailUrl;
}

export type ContentOwnership = {
  providerId: string | null;
  createdByUid: string;
};

export type SeriesOption = {
  id: string;
  title: string;
  coverUrl: string;
  category: string;
  isVip: boolean;
  providerId?: string | null;
};

export type SeriesRecord = SeriesMeta & {
  id: string;
  episodeCount: number;
  totalDurationSec: number;
  isPublished: boolean;
};

async function loadSeriesEpisodesForOrder(
  seriesId: string,
): Promise<PublishedEpisodeRow[]> {
  if (!db) {
    return [];
  }
  const key = seriesId.trim();
  const cached = getCachedSeriesEpisodes(key);
  if (cached) {
    return cached;
  }
  const snap = await getDocs(
    query(collection(db, "episodes"), where("seriesId", "==", key)),
  );
  const rows: PublishedEpisodeRow[] = snap.docs.map((item) => {
    const data = item.data();
    return {
      id: item.id,
      order: typeof data.order === "number" ? data.order : 0,
      durationSec:
        typeof data.durationSec === "number" ? data.durationSec : 0,
      videoUrl: typeof data.videoUrl === "string" ? data.videoUrl : "",
      thumbnailUrl:
        typeof data.thumbnailUrl === "string" ? data.thumbnailUrl : "",
    };
  });
  rows.sort((a, b) => a.order - b.order);
  setCachedSeriesEpisodes(key, rows);
  return rows;
}

export async function fetchNextEpisodeOrder(seriesId: string): Promise<number> {
  if (!db || !seriesId.trim()) {
    return 1;
  }
  const rows = await loadSeriesEpisodesForOrder(seriesId);
  let maxOrder = 0;
  for (const row of rows) {
    if (row.order > maxOrder) {
      maxOrder = row.order;
    }
  }
  return maxOrder + 1;
}

/** Full re-scan of episodes — use for repair / health checks, not every publish. */
export async function syncSeriesStats(
  seriesId: string,
  meta: SeriesMeta,
): Promise<{ episodeCount: number; totalDurationSec: number }> {
  if (!db) {
    return { episodeCount: 0, totalDurationSec: 0 };
  }

  invalidateSeriesEpisodeCache(seriesId);
  const snap = await getDocs(
    query(collection(db, "episodes"), where("seriesId", "==", seriesId)),
  );

  let totalDurationSec = 0;
  for (const item of snap.docs) {
    const duration = item.data().durationSec;
    if (typeof duration === "number") {
      totalDurationSec += duration;
    }
  }
  const episodeCount = snap.size;
  const seriesRef = doc(db, "series", seriesId);
  const existing = await getDoc(seriesRef);

  const fields = {
    id: seriesId,
    title: meta.title,
    coverUrl: meta.coverUrl,
    category: meta.category,
    isVip: meta.isVip,
    episodeCount,
    totalDurationSec,
    isPublished: episodeCount > 0,
  };

  if (!existing.exists()) {
    await setDoc(seriesRef, {
      ...fields,
      description: "",
      createdAt: serverTimestamp(),
      popularity: 0,
    });
  } else {
    await setDoc(seriesRef, fields, { merge: true });
  }

  return { episodeCount, totalDurationSec };
}

export async function ensureSeriesDoc(
  seriesId: string,
  meta: SeriesMeta,
  ownership?: ContentOwnership,
): Promise<{ created: boolean }> {
  if (!db) {
    return { created: false };
  }
  const seriesRef = doc(db, "series", seriesId);
  const existing = await getDoc(seriesRef);
  const baseFields: Record<string, unknown> = {
    id: seriesId,
    title: meta.title,
    coverUrl: meta.coverUrl,
    category: meta.category,
    isVip: meta.isVip,
    isPublished: true,
  };
  if (existing.exists()) {
    await setDoc(seriesRef, baseFields, { merge: true });
    return { created: false };
  }

  const createPayload: Record<string, unknown> = {
    ...baseFields,
    description: "",
    createdAt: serverTimestamp(),
    popularity: 0,
    episodeCount: 0,
    totalDurationSec: 0,
  };
  if (ownership?.providerId && ownership.createdByUid) {
    createPayload.providerId = ownership.providerId;
    createPayload.createdByUid = ownership.createdByUid;
  }
  await setDoc(seriesRef, createPayload);
  return { created: true };
}

export async function fetchSeriesOptions(
  scopeProviderId?: string | null,
): Promise<SeriesOption[]> {
  if (!db) {
    return [];
  }
  const snap = scopeProviderId
    ? await getDocs(
        query(
          collection(db, "series"),
          where("providerId", "==", scopeProviderId),
        ),
      )
    : await getDocs(collection(db, "series"));

  const rows: SeriesOption[] = snap.docs.map((item) => {
    const data = item.data();
    return {
      id: item.id,
      title: typeof data.title === "string" ? data.title : item.id,
      coverUrl: typeof data.coverUrl === "string" ? data.coverUrl : "",
      category: typeof data.category === "string" ? data.category : "new",
      isVip: data.isVip === true,
      providerId:
        typeof data.providerId === "string" ? data.providerId : null,
    };
  });
  rows.sort((a, b) => a.title.localeCompare(b.title));
  return rows;
}

export async function getSeriesOwnership(
  seriesId: string,
): Promise<ContentOwnership | null> {
  if (!db || !seriesId.trim()) {
    return null;
  }
  const snap = await getDoc(doc(db, "series", seriesId.trim()));
  if (!snap.exists()) {
    return null;
  }
  const data = snap.data();
  const providerId =
    typeof data.providerId === "string" ? data.providerId : null;
  const createdByUid =
    typeof data.createdByUid === "string" ? data.createdByUid : "";
  if (!providerId || !createdByUid) {
    return null;
  }
  return { providerId, createdByUid };
}

export async function getSeriesMeta(seriesId: string): Promise<SeriesMeta> {
  if (!db) {
    return {
      title: seriesId,
      coverUrl: "",
      category: "new",
      isVip: false,
    };
  }
  const snap = await getDoc(doc(db, "series", seriesId));
  if (!snap.exists()) {
    return {
      title: seriesId,
      coverUrl: "",
      category: "new",
      isVip: false,
    };
  }
  const data = snap.data();
  return {
    title: typeof data.title === "string" ? data.title : seriesId,
    coverUrl: typeof data.coverUrl === "string" ? data.coverUrl : "",
    category: typeof data.category === "string" ? data.category : "new",
    isVip: data.isVip === true,
  };
}
